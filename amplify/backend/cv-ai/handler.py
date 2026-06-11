import json
import os
import time
import urllib.error
import urllib.request
import uuid


GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_MODEL = "gemini-3.1-flash-lite"
MAX_BODY_BYTES = 100_000
MAX_TEXT_LENGTH = 8_000


ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "content_quality": {"type": "integer"},
        "job_relevance": {"type": "integer"},
        "summary": {"type": "string"},
        "strengths": {"type": "array", "items": {"type": "string"}},
        "improvements": {"type": "array", "items": {"type": "string"}},
        "missing_skills": {"type": "array", "items": {"type": "string"}},
        "suggested_objective": {"type": "string"},
        "suggested_skills": {"type": "array", "items": {"type": "string"}},
        "experience_suggestions": {"type": "array", "items": {"type": "string"}},
        "education_suggestions": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "content_quality",
        "job_relevance",
        "summary",
        "strengths",
        "improvements",
        "missing_skills",
        "suggested_objective",
        "suggested_skills",
        "experience_suggestions",
        "education_suggestions",
    ],
}


GENERATION_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "objective": {"type": "string"},
        "skills": {"type": "array", "items": {"type": "string"}},
        "languages": {"type": "array", "items": {"type": "string"}},
        "experiences": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "company": {"type": "string"},
                    "role": {"type": "string"},
                    "duration": {"type": "string"},
                    "description": {"type": "string"},
                },
                "required": ["company", "role", "duration", "description"],
            },
        },
        "educations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "school": {"type": "string"},
                    "degree": {"type": "string"},
                    "duration": {"type": "string"},
                    "description": {"type": "string"},
                },
                "required": ["school", "degree", "duration", "description"],
            },
        },
    },
    "required": [
        "title",
        "objective",
        "skills",
        "languages",
        "experiences",
        "educations",
    ],
}


RECOMMENDATION_SCHEMA = {
    "type": "object",
    "properties": {
        "recommendations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "candidateId": {"type": "string"},
                    "fullName": {"type": "string"},
                    "matchScore": {"type": "integer"},
                    "matchReason": {"type": "string"},
                },
                "required": ["candidateId", "fullName", "matchScore", "matchReason"],
            },
        }
    },
    "required": ["recommendations"],
}


class RequestError(Exception):
    def __init__(self, status_code, code, message):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


class ProviderError(Exception):
    def __init__(self, code, message, retryable=False):
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable


def _allowed_origin(event):
    configured = [
        item.strip()
        for item in os.environ.get(
            "ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if item.strip()
    ]
    headers = event.get("headers") or {}
    origin = headers.get("origin") or headers.get("Origin")
    if origin in configured:
        return origin
    return configured[0] if configured else "http://localhost:3000"


def _response(event, status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": _allowed_origin(event),
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Vary": "Origin",
            "Content-Type": "application/json; charset=utf-8",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }


def _method_and_path(event):
    request_context = event.get("requestContext") or {}
    method = event.get("httpMethod") or (request_context.get("http") or {}).get("method", "")
    path = event.get("rawPath") or event.get("path") or "/"
    segments = [segment for segment in path.split("/") if segment]
    if segments and segments[0] in {"prod", "test", "dev"}:
        path = "/" + "/".join(segments[1:])
    return method.upper(), path.rstrip("/") or "/"


def _claims(event):
    authorizer = ((event.get("requestContext") or {}).get("authorizer") or {})
    return authorizer.get("claims") or (authorizer.get("jwt") or {}).get("claims") or {}


def _candidate_claims(event):
    claims = _claims(event)
    if not claims.get("sub"):
        raise RequestError(401, "UNAUTHORIZED", "Missing or invalid authentication token.")

    groups = claims.get("cognito:groups") or claims.get("groups") or []
    if isinstance(groups, str):
        try:
            parsed = json.loads(groups)
            groups = parsed if isinstance(parsed, list) else [groups]
        except json.JSONDecodeError:
            groups = [
                group.strip().strip("[]'\"")
                for group in groups.split(",")
                if group.strip().strip("[]'\"")
            ]

    normalized = {str(group).lower() for group in groups}
    profile_role = str(claims.get("profile") or "").lower()
    if "candidate" not in normalized and profile_role != "candidate":
        raise RequestError(403, "FORBIDDEN", "Only candidates can analyze a CV.")
    return claims


def _employer_claims(event):
    claims = _claims(event)
    if not claims.get("sub"):
        raise RequestError(401, "UNAUTHORIZED", "Missing or invalid authentication token.")

    groups = claims.get("cognito:groups") or claims.get("groups") or []
    if isinstance(groups, str):
        try:
            parsed = json.loads(groups)
            groups = parsed if isinstance(parsed, list) else [groups]
        except json.JSONDecodeError:
            groups = [
                group.strip().strip("[]'\"")
                for group in groups.split(",")
                if group.strip().strip("[]'\"")
            ]

    normalized = {str(group).lower() for group in groups}
    profile_role = str(claims.get("profile") or "").lower()
    if "employer" not in normalized and profile_role != "employer" and "admin" not in normalized:
        raise RequestError(403, "FORBIDDEN", "Only employers can request candidate recommendations.")
    return claims


def _parse_body(event):
    raw_body = event.get("body") or ""
    if event.get("isBase64Encoded"):
        raise RequestError(400, "INVALID_BODY", "Base64 request bodies are not supported.")
    if len(raw_body.encode("utf-8")) > MAX_BODY_BYTES:
        raise RequestError(413, "PAYLOAD_TOO_LARGE", "The CV payload is too large.")
    try:
        body = json.loads(raw_body)
    except (TypeError, json.JSONDecodeError):
        raise RequestError(400, "INVALID_JSON", "Request body must be valid JSON.")
    if not isinstance(body, dict):
        raise RequestError(400, "INVALID_BODY", "Request body must be a JSON object.")
    return body


def _clean_text(value, max_length=MAX_TEXT_LENGTH):
    if value is None:
        return ""
    return str(value).strip()[:max_length]


def _clean_list(values, max_items=30, item_length=500):
    if not isinstance(values, list):
        return []
    result = []
    for value in values[:max_items]:
        text = _clean_text(value, item_length)
        if text:
            result.append(text)
    return result


def _clean_entries(values, allowed_fields, max_items=20):
    if not isinstance(values, list):
        return []
    result = []
    for value in values[:max_items]:
        if not isinstance(value, dict):
            continue
        result.append({
            field: _clean_text(value.get(field), 2_000)
            for field in allowed_fields
        })
    return result


def validate_payload(body):
    cv = body.get("cv")
    if not isinstance(cv, dict):
        raise RequestError(400, "INVALID_CV", "The cv field is required.")

    cleaned = {
        "full_name": _clean_text(cv.get("full_name"), 200),
        "title": _clean_text(cv.get("title"), 300),
        "email": _clean_text(cv.get("email"), 300),
        "phone": _clean_text(cv.get("phone"), 100),
        "address": _clean_text(cv.get("address"), 500),
        "objective": _clean_text(cv.get("objective"), 3_000),
        "skills": _clean_list(cv.get("skills"), item_length=200),
        "languages": _clean_list(cv.get("languages"), item_length=200),
        "experiences": _clean_entries(
            cv.get("experiences"),
            ("company", "role", "duration", "description"),
        ),
        "educations": _clean_entries(
            cv.get("educations"),
            ("school", "degree", "duration", "description"),
        ),
    }

    meaningful_fields = [
        cleaned["title"],
        cleaned["objective"],
        cleaned["skills"],
        cleaned["experiences"],
        cleaned["educations"],
    ]
    if sum(bool(value) for value in meaningful_fields) < 2:
        raise RequestError(
            422,
            "CV_TOO_EMPTY",
            "Add a career title and at least one CV section before analysis.",
        )

    language = body.get("language", "vi")
    if language not in {"vi", "en"}:
        language = "vi"

    return {
        "cv": cleaned,
        "target_job_title": _clean_text(body.get("target_job_title"), 300),
        "target_job_description": _clean_text(body.get("target_job_description"), 5_000),
        "language": language,
    }


def validate_generate_payload(body):
    profile = body.get("profile") or {}
    cleaned_profile = {
        "title": _clean_text(profile.get("title"), 300),
        "objective": _clean_text(profile.get("objective"), 2_000),
        "skills": _clean_list(profile.get("skills"), 20, 100),
        "languages": _clean_list(profile.get("languages"), 10, 100),
        "experiences": _clean_entries(
            profile.get("experiences"),
            ("company", "role", "duration", "description"),
        ),
        "educations": _clean_entries(
            profile.get("educations"),
            ("school", "degree", "duration", "description"),
        ),
    }

    if not cleaned_profile["title"]:
        raise RequestError(422, "PROFILE_TITLE_REQUIRED", "Add a career title to your profile before generating a CV.")

    language = body.get("language", "vi")
    if language not in {"vi", "en"}:
        language = "vi"

    return {
        "profile": cleaned_profile,
        "language": language,
    }


def _generation_system_prompt(language):
    output_language = "Vietnamese" if language == "vi" else "English"
    return f"""
You are an expert CV generator. Return all prose in {output_language}.
Given the candidate's partial profile, generate a professional, clean, and accurate CV.
Strict rules for data integrity:
1. Do not generate or fabricate any personal identification details (like full name, email, phone, or address).
2. Do not invent, fabricate, or assume any work experiences (experiences) or education entries (educations) that are not explicitly provided in the candidate's profile.
3. If the candidate's profile does not provide work experiences or education details (e.g. they are empty or null), you MUST return empty lists `[]` for the 'experiences' and 'educations' fields. Never make up fake companies, roles, durations, descriptions, schools, degrees, or courses.
4. Based on the provided profile, generate:
   - An engaging professional summary (objective) matching their career title.
   - An expanded list of highly relevant skills.
   - A list of languages.
Ensure all generated text is highly professional, realistic, and suitable for the candidate's target career title.
""".strip()


def _gemini_generate_payload(validated):
    return {
        "systemInstruction": {
            "parts": [{"text": _generation_system_prompt(validated["language"])}]
        },
        "contents": [{
            "role": "user",
            "parts": [{
                "text": "Generate a professional CV based on this candidate profile:\n"
                + json.dumps(validated["profile"], ensure_ascii=False)
            }],
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2_500,
            "responseMimeType": "application/json",
            "responseSchema": GENERATION_SCHEMA,
        },
    }


def calculate_completeness(cv):
    weighted_checks = [
        (8, bool(cv["full_name"])),
        (8, bool(cv["title"])),
        (5, bool(cv["email"])),
        (5, bool(cv["phone"])),
        (4, bool(cv["address"])),
        (15, len(cv["objective"]) >= 40),
        (15, len(cv["skills"]) >= 3),
        (20, bool(cv["experiences"])),
        (15, bool(cv["educations"])),
        (5, bool(cv["languages"])),
    ]
    return sum(weight for weight, present in weighted_checks if present)


def _system_prompt(language):
    output_language = "Vietnamese" if language == "vi" else "English"
    return f"""
You are a CV reviewer for a recruitment platform. Return all prose in {output_language}.
Analyze only the supplied CV and optional target job. Never invent employment, education,
certifications, achievements, metrics, or skills. Do not assess or infer protected traits.
Keep feedback concise, practical, and suitable for direct display to a candidate.
content_quality and job_relevance must be integers from 0 to 100.
If there is no target job, judge job_relevance against the candidate's stated title and
use an empty missing_skills list when missing skills cannot be justified.
Suggested skills must be grounded in existing CV evidence or clearly relevant to the target job.
""".strip()


def _gemini_payload(validated):
    user_payload = {
        "cv": validated["cv"],
        "target_job_title": validated["target_job_title"] or None,
        "target_job_description": validated["target_job_description"] or None,
    }
    return {
        "systemInstruction": {
            "parts": [{"text": _system_prompt(validated["language"])}]
        },
        "contents": [{
            "role": "user",
            "parts": [{
                "text": "Analyze this CV and return the requested structured result:\n"
                + json.dumps(user_payload, ensure_ascii=False)
            }],
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1_500,
            "responseMimeType": "application/json",
            "responseSchema": ANALYSIS_SCHEMA,
        },
    }


def _extract_gemini_text(response):
    candidates = response.get("candidates") or []
    if candidates:
        candidate = candidates[0]
        finish_reason = candidate.get("finishReason")
        if finish_reason not in {None, "STOP"}:
            raise ProviderError(
                "AI_INCOMPLETE",
                "The AI response was incomplete.",
                retryable=finish_reason in {"MAX_TOKENS", "OTHER"},
            )
        parts = (candidate.get("content") or {}).get("parts") or []
        for part in parts:
            if part.get("text"):
                return part["text"]

    block_reason = ((response.get("promptFeedback") or {}).get("blockReason"))
    if block_reason:
        raise ProviderError("AI_REFUSED", "The AI could not analyze this content.")
    raise ProviderError("AI_INVALID_RESPONSE", "The AI returned an invalid response.", retryable=True)


def call_gemini(validated, urlopen=urllib.request.urlopen):
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ProviderError("AI_NOT_CONFIGURED", "GEMINI_API_KEY is not configured.")

    model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
    request = urllib.request.Request(
        f"{GEMINI_API_BASE_URL}/{model}:generateContent",
        data=json.dumps(_gemini_payload(validated), ensure_ascii=False).encode("utf-8"),
        headers={
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    timeout = min(max(int(os.environ.get("GEMINI_TIMEOUT_SECONDS", "24")), 5), 28)

    try:
        with urlopen(request, timeout=timeout) as response:
            provider_response = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        status = error.code
        provider_message = ""
        try:
            error_body = json.loads(error.read().decode("utf-8"))
            provider_message = str((error_body.get("error") or {}).get("message") or "")
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass
        print(f"DEBUG_GEMINI_ERROR - status: {status}, message: {provider_message}")
        if status in {400, 401, 403} and "api key" in provider_message.lower():
            raise ProviderError(
                "AI_CREDENTIAL_INVALID",
                "The Gemini API key is invalid.",
            )
        retryable = status == 429 or status >= 500
        code = "AI_RATE_LIMITED" if status == 429 else "AI_PROVIDER_ERROR"
        raise ProviderError(code, "The AI provider is temporarily unavailable.", retryable)
    except (urllib.error.URLError, TimeoutError):
        raise ProviderError("AI_TIMEOUT", "The AI provider did not respond in time.", True)
    except json.JSONDecodeError:
        raise ProviderError("AI_INVALID_RESPONSE", "The AI returned an invalid response.", True)

    try:
        return json.loads(_extract_gemini_text(provider_response))
    except json.JSONDecodeError:
        raise ProviderError("AI_INVALID_RESPONSE", "The AI returned invalid JSON.", True)


def _bounded_score(value, default=0):
    try:
        return min(max(int(value), 0), 100)
    except (TypeError, ValueError):
        return default


def build_result(validated, ai_result, request_id, processing_ms):
    completeness = calculate_completeness(validated["cv"])
    content_quality = _bounded_score(ai_result.get("content_quality"), completeness)
    has_target = bool(
        validated["target_job_title"] or validated["target_job_description"]
    )
    job_relevance = _bounded_score(
        ai_result.get("job_relevance"),
        content_quality if has_target else completeness,
    )
    score = round(
        completeness * 0.4
        + content_quality * 0.4
        + job_relevance * 0.2
    )

    return {
        "score": score,
        "score_breakdown": {
            "completeness": completeness,
            "content_quality": content_quality,
            "job_relevance": job_relevance,
        },
        "summary": _clean_text(ai_result.get("summary"), 2_000),
        "strengths": _clean_list(ai_result.get("strengths"), 10, 500),
        "improvements": _clean_list(ai_result.get("improvements"), 10, 500),
        "missing_skills": _clean_list(ai_result.get("missing_skills"), 15, 200),
        "suggested_objective": _clean_text(
            ai_result.get("suggested_objective"),
            2_000,
        ),
        "suggested_skills": _clean_list(ai_result.get("suggested_skills"), 15, 200),
        "section_suggestions": {
            "experiences": _clean_list(
                ai_result.get("experience_suggestions"),
                10,
                500,
            ),
            "educations": _clean_list(
                ai_result.get("education_suggestions"),
                10,
                500,
            ),
        },
        "metadata": {
            "provider": "gemini",
            "model": os.environ.get("GEMINI_MODEL", DEFAULT_MODEL),
            "request_id": request_id,
            "processing_ms": processing_ms,
        },
    }


def analyze(validated, request_id):
    started = time.monotonic()
    attempts = 2
    last_error = None
    for attempt in range(attempts):
        try:
            ai_result = call_gemini(validated)
            processing_ms = round((time.monotonic() - started) * 1_000)
            return build_result(validated, ai_result, request_id, processing_ms)
        except ProviderError as error:
            last_error = error
            if not error.retryable or attempt == attempts - 1:
                break
            time.sleep(0.25 * (attempt + 1))
    raise last_error


def _fetch_verified_candidates():
    import boto3
    dynamodb = boto3.resource("dynamodb", region_name="ap-southeast-1")
    table = dynamodb.Table("CandidateProfiles")
    try:
        response = table.scan(
            FilterExpression="kycCompleted = :true OR kycStatus = :verified OR ekycStatus = :verified2",
            ExpressionAttributeValues={
                ":true": True,
                ":verified": "VERIFIED",
                ":verified2": "verified"
            }
        )
        items = response.get("Items", [])
        while "LastEvaluatedKey" in response:
            response = table.scan(
                FilterExpression="kycCompleted = :true OR kycStatus = :verified OR ekycStatus = :verified2",
                ExpressionAttributeValues={
                    ":true": True,
                    ":verified": "VERIFIED",
                    ":verified2": "verified"
                },
                ExclusiveStartKey=response["LastEvaluatedKey"]
            )
            items.extend(response.get("Items", []))
        return items
    except Exception as e:
        print(f"Error scanning candidates: {str(e)}")
        return []


def _summarize_candidate(cand):
    uid = cand.get("userId")
    name = cand.get("fullName") or cand.get("email") or "Anonymous"
    title = cand.get("title") or ""
    bio = cand.get("bio") or ""
    skills = cand.get("skills") or []
    experience = cand.get("experience") or ""
    education = cand.get("education") or ""
    return {
        "candidateId": uid,
        "fullName": name,
        "title": title,
        "bio": bio,
        "skills": skills,
        "experience": experience,
        "education": education
    }


def _validate_recommend_payload(body):
    job = body.get("job")
    if not isinstance(job, dict):
        raise RequestError(400, "INVALID_JOB", "The job field is required.")
    cleaned_job = {
        "title": _clean_text(job.get("title"), 300),
        "description": _clean_text(job.get("description"), 5000),
        "requirements": _clean_text(job.get("requirements"), 3000),
        "responsibilities": _clean_text(job.get("responsibilities"), 3000),
        "benefits": _clean_text(job.get("benefits"), 2000),
    }
    if not cleaned_job["title"]:
        raise RequestError(400, "JOB_TITLE_REQUIRED", "Job title is required.")
    language = body.get("language", "vi")
    if language not in {"vi", "en"}:
        language = "vi"
    return {
        "job": cleaned_job,
        "language": language
    }


def _recommendation_system_prompt(language):
    output_language = "Vietnamese" if language == "vi" else "English"
    return f"""
You are an expert recruitment assistant. Return all prose in {output_language}.
Given a standard job posting details and a list of candidate profiles, evaluate the suitability of each candidate for the job.
For each candidate:
1. Rate their match score as an integer from 0 to 100 based on their skills, experience, title, and bio compared to the job requirements and description.
2. Provide a brief, professional explanation (matchReason) in {output_language} summarizing why they are or are not a good fit, highlighting relevant skills or gaps. Keep it concise (1-2 sentences).
Return a JSON object containing a list of recommendations, sorted by matchScore in descending order.
Only include candidates that have a matchScore >= 50. If no candidates match, return an empty list.
Do not invent any information about the candidates or the job.
""".strip()


def _gemini_recommend_payload(validated, candidates):
    user_payload = {
        "job": validated["job"],
        "candidates": candidates
    }
    return {
        "systemInstruction": {
            "parts": [{"text": _recommendation_system_prompt(validated["language"])}]
        },
        "contents": [{
            "role": "user",
            "parts": [{
                "text": "Recommend candidates for this job:\n"
                + json.dumps(user_payload, ensure_ascii=False)
            }],
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2500,
            "responseMimeType": "application/json",
            "responseSchema": RECOMMENDATION_SCHEMA,
        },
    }


def call_gemini_recommend(validated, candidates, urlopen=urllib.request.urlopen):
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ProviderError("AI_NOT_CONFIGURED", "GEMINI_API_KEY is not configured.")
    model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
    request = urllib.request.Request(
        f"{GEMINI_API_BASE_URL}/{model}:generateContent",
        data=json.dumps(_gemini_recommend_payload(validated, candidates), ensure_ascii=False).encode("utf-8"),
        headers={
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    timeout = min(max(int(os.environ.get("GEMINI_TIMEOUT_SECONDS", "24")), 5), 28)
    try:
        with urlopen(request, timeout=timeout) as response:
            provider_response = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        status = error.code
        provider_message = ""
        try:
            error_body = json.loads(error.read().decode("utf-8"))
            provider_message = str((error_body.get("error") or {}).get("message") or "")
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass
        print(f"DEBUG_GEMINI_ERROR - status: {status}, message: {provider_message}")
        if status in {400, 401, 403} and "api key" in provider_message.lower():
            raise ProviderError(
                "AI_CREDENTIAL_INVALID",
                "The Gemini API key is invalid.",
            )
        retryable = status == 429 or status >= 500
        code = "AI_RATE_LIMITED" if status == 429 else "AI_PROVIDER_ERROR"
        raise ProviderError(code, "The AI provider is temporarily unavailable.", retryable)
    except (urllib.error.URLError, TimeoutError):
        raise ProviderError("AI_TIMEOUT", "The AI provider did not respond in time.", True)
    except json.JSONDecodeError:
        raise ProviderError("AI_INVALID_RESPONSE", "The AI returned an invalid response.", True)
    try:
        return json.loads(_extract_gemini_text(provider_response))
    except json.JSONDecodeError:
        raise ProviderError("AI_INVALID_RESPONSE", "The AI returned invalid JSON.", True)


def lambda_handler(event, context):
    request_id = getattr(context, "aws_request_id", None) or str(uuid.uuid4())
    method, path = _method_and_path(event)

    if method == "OPTIONS":
        return _response(event, 200, {"ok": True})
    if method == "GET" and path == "/health":
        return _response(event, 200, {"status": "ok", "provider": "gemini"})
    if method != "POST" or path not in {"/cv/analyze", "/cv/generate", "/cv/recommend-candidates"}:
        return _response(event, 404, {
            "error": {"code": "NOT_FOUND", "message": "Route not found."},
            "request_id": request_id,
        })

    try:
        if path == "/cv/recommend-candidates":
            claims = _employer_claims(event)
            validated = _validate_recommend_payload(_parse_body(event))
            candidates = [_summarize_candidate(c) for c in _fetch_verified_candidates()]
            if not candidates:
                return _response(event, 200, {"recommendations": []})
            started = time.monotonic()
            ai_result = call_gemini_recommend(validated, candidates)
            processing_ms = round((time.monotonic() - started) * 1_000)
            print(json.dumps({
                "event": "cv_recommendation_completed",
                "request_id": request_id,
                "user_id": claims.get("sub"),
                "candidates_count": len(candidates),
                "processing_ms": processing_ms,
            }))
            return _response(event, 200, ai_result)

        claims = _candidate_claims(event)
        if path == "/cv/analyze":
            validated = validate_payload(_parse_body(event))
            result = analyze(validated, request_id)
            print(json.dumps({
                "event": "cv_analysis_completed",
                "request_id": request_id,
                "user_id": claims.get("sub"),
                "score": result["score"],
                "processing_ms": result["metadata"]["processing_ms"],
            }))
            return _response(event, 200, result)
        else:
            validated = validate_generate_payload(_parse_body(event))
            started = time.monotonic()
            api_key = os.environ.get("GEMINI_API_KEY", "").strip()
            if not api_key:
                raise ProviderError("AI_NOT_CONFIGURED", "GEMINI_API_KEY is not configured.")

            model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
            request = urllib.request.Request(
                f"{GEMINI_API_BASE_URL}/{model}:generateContent",
                data=json.dumps(_gemini_generate_payload(validated), ensure_ascii=False).encode("utf-8"),
                headers={
                    "x-goog-api-key": api_key,
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            timeout = min(max(int(os.environ.get("GEMINI_TIMEOUT_SECONDS", "24")), 5), 28)

            try:
                with urllib.request.urlopen(request, timeout=timeout) as response:
                    provider_response = json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as error:
                status = error.code
                provider_message = ""
                try:
                    error_body = json.loads(error.read().decode("utf-8"))
                    provider_message = str((error_body.get("error") or {}).get("message") or "")
                except (json.JSONDecodeError, UnicodeDecodeError):
                    pass
                if status in {400, 401, 403} and "api key" in provider_message.lower():
                    raise ProviderError("AI_CREDENTIAL_INVALID", "The Gemini API key is invalid.")
                retryable = status == 429 or status >= 500
                code = "AI_RATE_LIMITED" if status == 429 else "AI_PROVIDER_ERROR"
                raise ProviderError(code, "The AI provider is temporarily unavailable.", retryable)
            except (urllib.error.URLError, TimeoutError):
                raise ProviderError("AI_TIMEOUT", "The AI provider did not respond in time.", True)
            except json.JSONDecodeError:
                raise ProviderError("AI_INVALID_RESPONSE", "The AI returned an invalid response.", True)

            try:
                ai_result = json.loads(_extract_gemini_text(provider_response))
            except json.JSONDecodeError:
                raise ProviderError("AI_INVALID_RESPONSE", "The AI returned invalid JSON.", True)

            processing_ms = round((time.monotonic() - started) * 1_000)
            print(json.dumps({
                "event": "cv_generation_completed",
                "request_id": request_id,
                "user_id": claims.get("sub"),
                "processing_ms": processing_ms,
            }))
            return _response(event, 200, ai_result)
    except RequestError as error:
        return _response(event, error.status_code, {
            "error": {"code": error.code, "message": error.message},
            "request_id": request_id,
        })
    except ProviderError as error:
        print(json.dumps({
            "event": "cv_analysis_provider_error",
            "request_id": request_id,
            "code": error.code,
        }))
        status = 429 if error.code == "AI_RATE_LIMITED" else 503
        return _response(event, status, {
            "error": {"code": error.code, "message": error.message},
            "request_id": request_id,
        })
    except Exception:
        print(json.dumps({
            "event": "cv_analysis_unexpected_error",
            "request_id": request_id,
        }))
        return _response(event, 500, {
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Unable to process CV request.",
            },
            "request_id": request_id,
        })
