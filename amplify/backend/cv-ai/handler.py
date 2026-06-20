import json
import os
import time
import urllib.error
import urllib.request
import uuid

# --- IMPORT DATASET MODULE ---
try:
    import fnb_interview_dataset as fnb_dataset
    _FNB_DATASET_AVAILABLE = True
except Exception as e:
    _FNB_DATASET_AVAILABLE = False
    print(f"Error importing fnb_interview_dataset: {e}")

# --- SCHEMAS FOR AI RECRUITMENT ---
CV_SCREENING_SCHEMA = {
    "type": "object",
    "properties": {
        "score": {"type": "integer"},
        "result": {"type": "string"},
        "strengths": {"type": "array", "items": {"type": "string"}},
        "weaknesses": {"type": "array", "items": {"type": "string"}},
        "reason": {"type": "string"}
    },
    "required": ["score", "result", "strengths", "weaknesses", "reason"]
}

INTERVIEW_REPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "total_score": {"type": "integer"},
        "past_experience_score": {"type": "integer"},
        "situation_handling_score": {"type": "integer"},
        "operations_score": {"type": "integer"},
        "custom_questions_score": {"type": "integer"},
        "strengths": {"type": "array", "items": {"type": "string"}},
        "weaknesses": {"type": "array", "items": {"type": "string"}},
        "recommend_to_employer": {"type": "boolean"},
        "reason": {"type": "string"}
    },
    "required": [
        "total_score", "past_experience_score", "situation_handling_score",
        "operations_score", "custom_questions_score", "strengths", "weaknesses",
        "recommend_to_employer", "reason"
    ]
}



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


SUGGEST_JD_SCHEMA = {
    "type": "object",
    "properties": {
        "description": {"type": "string"},
        "responsibilities": {"type": "string"},
        "requirements": {"type": "string"},
        "benefits": {"type": "string"},
    },
    "required": ["description", "responsibilities", "requirements", "benefits"],
}


RECOMMEND_JOBS_SCHEMA = {
    "type": "object",
    "properties": {
        "recommendations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "jobId": {"type": "string"},
                    "matchScore": {"type": "integer"},
                    "matchReason": {"type": "string"},
                },
                "required": ["jobId", "matchScore", "matchReason"],
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


def _validate_suggest_jd_payload(body):
    title = _clean_text(body.get("title"), 300)
    if not title:
        raise RequestError(400, "JOB_TITLE_REQUIRED", "Job title is required.")

    language = body.get("language", "vi")
    if language not in {"vi", "en"}:
        language = "vi"

    return {
        "title": title,
        "location": _clean_text(body.get("location"), 300),
        "jobType": _clean_text(body.get("jobType"), 100),
        "workDays": _clean_text(body.get("workDays"), 200),
        "workHours": _clean_text(body.get("workHours"), 200),
        "salary": _clean_text(body.get("salary"), 100),
        "tags": _clean_text(body.get("tags"), 500),
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


def _fetch_verified_candidates(is_quick_job=False):
    import boto3
    dynamodb = boto3.resource("dynamodb", region_name="ap-southeast-1")
    table = dynamodb.Table("CandidateProfiles")
    try:
        filter_expr = "kycCompleted = :true OR kycStatus = :verified OR ekycStatus = :verified2"
        expr_vals = {
            ":true": True,
            ":verified": "VERIFIED",
            ":verified2": "verified"
        }
        if is_quick_job:
            filter_expr = f"({filter_expr}) AND verificationStatus = :approved"
            expr_vals[":approved"] = "APPROVED"

        response = table.scan(
            FilterExpression=filter_expr,
            ExpressionAttributeValues=expr_vals
        )
        items = response.get("Items", [])
        while "LastEvaluatedKey" in response:
            response = table.scan(
                FilterExpression=filter_expr,
                ExpressionAttributeValues=expr_vals,
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
    is_quick_job = bool(body.get("isQuickJob", False))
    return {
        "job": cleaned_job,
        "language": language,
        "isQuickJob": is_quick_job
    }


def _recommendation_system_prompt(language, is_quick_job=False):
    output_language = "Vietnamese" if language == "vi" else "English"
    job_type_str = "quick (urgent)" if is_quick_job else "standard"
    return f"""
You are an expert recruitment assistant. Return all prose in {output_language}.
Given a {job_type_str} job posting details and a list of candidate profiles, evaluate the suitability of each candidate for the job.
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
    is_quick_job = validated.get("isQuickJob", False)
    return {
        "systemInstruction": {
            "parts": [{"text": _recommendation_system_prompt(validated["language"], is_quick_job=is_quick_job)}]
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


def _suggest_jd_system_prompt(language):
    output_language = "Vietnamese" if language == "vi" else "English"
    return f"""
You are an expert HR Specialist and Technical Writer. Return all prose in {output_language}.
Given the job title and other basic details, generate a comprehensive and highly professional Job Description (JD) tailored for the role.
Provide details for:
- Mô tả công việc (description): Clear overview of the role, daily work, context.
- Trách nhiệm (responsibilities): Bulleted list of key tasks and responsibilities. Use newline character '\\n' between bullets, but do not use markdown characters like '*' or '-' in the bullet text itself.
- Yêu cầu (requirements): Bulleted list of qualifications, experience level, skills required. Use newline character '\\n' between bullets.
- Quyền lợi (benefits): Bulleted list of benefits, perks, salary context, working environment. Use newline character '\\n' between bullets.
Ensure the tone is professional, attractive to candidates, and realistic for the given job title, location, type, and characteristics.
Return the result strictly conforming to the requested JSON schema.
""".strip()


def _gemini_suggest_jd_payload(validated):
    user_payload = {
        "title": validated["title"],
        "location": validated["location"] or None,
        "jobType": validated["jobType"] or None,
        "workDays": validated["workDays"] or None,
        "workHours": validated["workHours"] or None,
        "salary": validated["salary"] or None,
        "tags": validated["tags"] or None,
    }
    return {
        "systemInstruction": {
            "parts": [{"text": _suggest_jd_system_prompt(validated["language"])}]
        },
        "contents": [{
            "role": "user",
            "parts": [{
                "text": "Generate a professional job description (description, responsibilities, requirements, benefits) for this job detail:\n"
                + json.dumps(user_payload, ensure_ascii=False)
            }],
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2000,
            "responseMimeType": "application/json",
            "responseSchema": SUGGEST_JD_SCHEMA,
        },
    }


def call_gemini_suggest_jd(validated, urlopen=None):
    if urlopen is None:
        urlopen = urllib.request.urlopen
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ProviderError("AI_NOT_CONFIGURED", "GEMINI_API_KEY is not configured.")
    model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
    request = urllib.request.Request(
        f"{GEMINI_API_BASE_URL}/{model}:generateContent",
        data=json.dumps(_gemini_suggest_jd_payload(validated), ensure_ascii=False).encode("utf-8"),
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


def _recommend_jobs_system_prompt(language):
    output_language = "Vietnamese" if language == "vi" else "English"
    return f"""
You are an expert recruitment matching system. Return all prose in {output_language}.
Given a candidate's profile and a list of active job openings, determine the suitability of each job for the candidate.
For each matching job (where matchScore >= 50):
1. Rate the match score as an integer from 0 to 100 based on how well the candidate's title, bio, skills, location, and experience match the job requirements, description, location, and type.
2. Provide a brief, professional explanation (matchReason) in {output_language} summarizing why it's a good fit. Keep it concise (1-2 sentences).
Return a JSON object containing a list of recommendations, sorted by matchScore in descending order. Return maximum 5 recommendations.
If no jobs match, return an empty list. Do not invent any details.
""".strip()


def _gemini_recommend_jobs_payload(candidate_profile, jobs):
    user_payload = {
        "candidate": {
            "title": candidate_profile.get("title", ""),
            "bio": candidate_profile.get("bio", ""),
            "skills": candidate_profile.get("skills", []),
            "location": candidate_profile.get("location", ""),
            "experience": candidate_profile.get("experience", ""),
            "education": candidate_profile.get("education", ""),
        },
        "jobs": jobs
    }
    language = candidate_profile.get("language", "vi")
    return {
        "systemInstruction": {
            "parts": [{"text": _recommend_jobs_system_prompt(language)}]
        },
        "contents": [{
            "role": "user",
            "parts": [{
                "text": "Recommend jobs for this candidate profile:\n"
                + json.dumps(user_payload, ensure_ascii=False)
            }],
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2000,
            "responseMimeType": "application/json",
            "responseSchema": RECOMMEND_JOBS_SCHEMA,
        },
    }


def call_gemini_recommend_jobs(candidate_profile, jobs, urlopen=None):
    if urlopen is None:
        urlopen = urllib.request.urlopen
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ProviderError("AI_NOT_CONFIGURED", "GEMINI_API_KEY is not configured.")
    model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
    request = urllib.request.Request(
        f"{GEMINI_API_BASE_URL}/{model}:generateContent",
        data=json.dumps(_gemini_recommend_jobs_payload(candidate_profile, jobs), ensure_ascii=False).encode("utf-8"),
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


# --- DYNAMODB INTERVIEW SESSION STATE HELPERS ---
def _decimal_to_float_int(obj):
    from decimal import Decimal
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    if isinstance(obj, dict):
        return {k: _decimal_to_float_int(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_decimal_to_float_int(x) for x in obj]
    return obj


def _get_candidate_profile_table():
    import boto3
    dynamodb = boto3.resource("dynamodb", region_name="ap-southeast-1")
    return dynamodb.Table("CandidateProfiles")


def get_active_session(user_id):
    try:
        table = _get_candidate_profile_table()
        res = table.get_item(Key={"userId": user_id})
        profile = res.get("Item") or {}
        session = profile.get("activeInterviewSession")
        if session:
            session = _decimal_to_float_int(session)
        return session
    except Exception as e:
        print(f"Error loading active session for user {user_id}: {e}")
        return None


def save_active_session(user_id, session):
    try:
        from decimal import Decimal
        def float_to_decimal(obj):
            if isinstance(obj, float):
                return Decimal(str(obj))
            if isinstance(obj, dict):
                return {k: float_to_decimal(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [float_to_decimal(x) for x in obj]
            return obj

        session_decimal = float_to_decimal(session)
        table = _get_candidate_profile_table()
        table.update_item(
            Key={"userId": user_id},
            UpdateExpression="SET activeInterviewSession = :s",
            ExpressionAttributeValues={":s": session_decimal}
        )
    except Exception as e:
        print(f"Error saving active session for user {user_id}: {e}")


def delete_active_session(user_id):
    try:
        table = _get_candidate_profile_table()
        table.update_item(
            Key={"userId": user_id},
            UpdateExpression="REMOVE activeInterviewSession"
        )
    except Exception as e:
        print(f"Error removing active session for user {user_id}: {e}")


# --- AI INTERVIEWER HELPERS ---
_REFLECTIVE_LISTENING_PREAMBLE = """[Phong cách bắt buộc cho lượt này — Lắng nghe phản chiếu]:
1. CÔNG NHẬN/ĐỒNG CẢM: Mở đầu bằng một nhận xét ấm áp, chân thành để ghi nhận câu trả lời VỪA RỒI của ứng viên, cho thấy bạn thực sự lắng nghe.
2. DIỄN GIẢI LẠI Ý: Tóm lược/diễn giải ngắn gọn ý chính trong câu trả lời gần nhất của ứng viên bằng lời của bạn, để xác nhận đã hiểu đúng.
3. CHỈ ĐẶT MỘT CÂU HỎI: Sau đó mới chuyển sang phần hỏi bên dưới và chỉ đặt ĐÚNG MỘT (01) câu hỏi đào sâu trong lượt này (tuyệt đối không hỏi nhiều câu cùng lúc)."""


def _get_turn_instruction(current_idx: int, turns: list[str]) -> str:
    try:
        if current_idx >= len(turns):
            return ""
        question = turns[current_idx]
        preamble = _REFLECTIVE_LISTENING_PREAMBLE
        if question.startswith("Custom Question: "):
            q_text = question.replace("Custom Question: ", "")
            return f"""
{preamble}

[Nội dung câu hỏi bắt buộc cho lượt này]:
ĐÂY LÀ YÊU CẦU BẮT BUỘC: Câu hỏi đào sâu của bạn ở bước (3) phải chính là câu hỏi sau đây từ Nhà tuyển dụng: "{q_text}". Hãy dẫn dắt thật tự nhiên và lịch sự.
Lưu ý: Không được tự tiện thay đổi hoặc bỏ qua câu hỏi này.
"""
        elif question == "Technical Question based on CV/JD":
            return f"""
{preamble}

[Nội dung câu hỏi cho lượt này]:
Ở bước (3), dựa vào CV của ứng viên và bản mô tả công việc (JD), hãy đặt MỘT câu hỏi phỏng vấn kỹ thuật hoặc tình huống chuyên môn thực tế và sâu sắc để thử thách năng lực của ứng viên.
"""
        elif question == "Salary and Work Expectations":
            return f"""
{preamble}

[Nội dung câu hỏi cho lượt này]:
Ở bước (3), hãy đặt MỘT câu hỏi về mức lương mong muốn cùng kỳ vọng đối với môi trường làm việc mới và thời gian có thể bắt đầu nhận việc (gộp thành một câu hỏi tự nhiên, không tách thành nhiều câu rời rạc).
"""
        elif question == "Candidate Questions & Wrap up":
            return f"""
{preamble}

[Nội dung câu hỏi cho lượt này]:
ĐÂY LÀ LƯỢT HỎI CUỐI CÙNG của buổi phỏng vấn. Sau khi công nhận và diễn giải lại câu trả lời gần nhất của ứng viên, hãy cảm ơn ứng viên vì sự tham gia của họ, rồi lịch sự đặt MỘT câu hỏi xem họ có câu hỏi nào dành cho công ty chúng ta hoặc có chia sẻ gì thêm không.
"""
        else:
            return f"""
{preamble}

[Nội dung câu hỏi cho lượt này]:
Ở bước (3), hãy đặt MỘT câu hỏi đào sâu tiếp theo liên quan đến chủ đề: "{question}".
"""
    except Exception as e:
        print(f"Error building turn instruction: {e}")
        return ""


def _detect_conversational_request(answer: str) -> str | None:
    if not answer:
        return None
    ans_lower = answer.lower().strip()
    
    repeat_keywords = [
        "nói lại", "nhắc lại", "lặp lại", "hỏi lại", "chưa nghe", "chưa rõ", "nghe chưa",
        "nói lại đi", "hỏi lại đi", "nhắc lại đi", "lặp lại đi", "chưa nghe rõ",
        "nói lại câu hỏi", "hỏi lại câu hỏi", "nhắc lại câu hỏi", "lặp lại câu hỏi",
        "repeat", "say again", "pardon"
    ]
    if any(kw in ans_lower for kw in repeat_keywords) or (len(ans_lower) < 15 and "nghe" in ans_lower and "chưa" in ans_lower):
        return "repeat"
        
    clarify_keywords = [
        "giải thích", "làm rõ", "chưa hiểu", "không hiểu", "chưa rõ ý", "nghĩa là gì",
        "giải nghĩa", "giải thích thêm", "giải thích rõ", "chưa nắm được", "không rõ ý",
        "clarify", "explain", "what do you mean"
    ]
    if any(kw in ans_lower for kw in clarify_keywords):
        return "clarify"
        
    skip_keywords = [
        "bỏ qua", "hỏi câu khác", "đổi câu hỏi", "câu khác đi", "qua câu", "next câu",
        "skip", "next question"
    ]
    if any(kw in ans_lower for kw in skip_keywords):
        return "skip"
        
    return None


# --- GEMINI REST API DEPLOYED METHODS ---
def _cv_screening_system_prompt():
    return """
Bạn là một AI chuyên viên tuyển dụng cao cấp.

CHÚ Ý QUAN TRỌNG VỀ PHÂN LOẠI VÀ THẨM ĐỊNH TÀI LIỆU (BẮT BUỘC KIỂM TRA ĐẦU TIÊN):
Tài liệu của ứng viên gửi lên bắt buộc phải là một bản CV (Resume / Hồ sơ ứng tuyển) hợp lệ của một cá nhân cụ thể.
Một bản CV/Resume hợp lệ BẮT BUỘC phải thỏa mãn đồng thời các điều kiện sau:
1. Có thông tin định danh cá nhân tối thiểu (ví dụ: Họ tên và một trong các thông tin liên hệ như Email, Số điện thoại, Địa chỉ, Link LinkedIn/GitHub).
2. Có cấu trúc thể hiện quá trình làm việc, học tập hoặc bộ kỹ năng của một cá nhân (bao gồm các phần như Kinh nghiệm làm việc, Học vấn, Kỹ năng, Mục tiêu nghề nghiệp, Dự án cá nhân).

Các tài liệu sau đây được coi là KHÔNG HỢP LỆ (KHÔNG PHẢI CV):
- Đề bài tập, bài giải lab, slide bài giảng, giáo trình, bài báo cáo học thuật.
- Hướng dẫn kỹ thuật, tài liệu cấu hình (config), mã nguồn (source code), log file, thông báo lỗi.
- Hóa đơn, chứng từ, tài liệu sản phẩm, bài viết tin tức, tiểu thuyết, truyện, hoặc văn bản ngẫu nhiên.
- Bản mô tả công việc (JD) của chính công ty hoặc tài liệu không chứa thông tin của một người xin việc cụ thể.

NẾU TÀI LIỆU KHÔNG PHẢI LÀ CV/RESUME HỢP LỆ, BẠN BẮT BUỘC PHẢI TRẢ VỀ:
{
  "score": 0,
  "result": "fail",
  "strengths": [],
  "weaknesses": ["Tài liệu tải lên không phải là một CV/Resume hợp lệ (phát hiện tài liệu kỹ thuật, bài lab, bài tập, slide hoặc văn bản không liên quan)."],
  "reason": "Tài liệu được tải lên không chứa thông tin về CV/Hồ sơ ứng viên hợp lệ để đánh giá tuyển dụng."
}
TUYỆT ĐỐI không được đánh giá các từ khóa kỹ thuật hay kỹ năng trong các văn bản không phải CV này để chấm điểm hoặc cho kết quả "pass". An toàn và chính xác trong việc phân loại tài liệu là ưu tiên số một.

Nếu tài liệu đúng là một bản CV/Resume hợp lệ, hãy tiến hành đánh giá CV đó so với bản mô tả công việc (JD) bên dưới theo các tiêu chí:
1. Kỹ năng bắt buộc (Must-have skills)
2. Kinh nghiệm làm việc liên quan
3. Dự án thực tế đã thực hiện
4. Học vấn và chứng chỉ chuyên ngành
5. Mức độ phù hợp tổng thể

Return a JSON object matching the requested schema.
""".strip()


def _download_and_extract_cv(cv_url):
    """
    Downloads cv_url and attempts to parse it.
    Returns a dict with either:
      - {"type": "pdf", "bytes": pdf_bytes}
      - {"type": "text", "text": docx_text}
      - None (if download/parse fails or format is unsupported)
    """
    if not cv_url or not (cv_url.startswith("http://") or cv_url.startswith("https://")):
        return None
    try:
        import urllib.request
        import zipfile
        import xml.etree.ElementTree as ET
        import io
        
        req = urllib.request.Request(cv_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as conn:
            content_bytes = conn.read()
            
        if not content_bytes:
            return None
            
        url_lower = cv_url.lower()
        if content_bytes.startswith(b"%PDF") or ".pdf" in url_lower:
            return {"type": "pdf", "bytes": content_bytes}
            
        if content_bytes.startswith(b"PK\x03\x04") or ".docx" in url_lower:
            try:
                with zipfile.ZipFile(io.BytesIO(content_bytes)) as z:
                    xml_content = z.read("word/document.xml")
                root = ET.fromstring(xml_content)
                texts = []
                for elem in root.iter():
                    if elem.tag.endswith("}t") or elem.tag.endswith("t"):
                        if elem.text:
                            texts.append(elem.text)
                docx_text = " ".join(texts)
                return {"type": "text", "text": docx_text}
            except Exception as e:
                print(f"Error extracting DOCX text: {e}")
                return None
        return None
    except Exception as e:
        print(f"Error downloading or parsing CV file from {cv_url}: {e}")
        return None


def _gemini_cv_screen_payload(job_description, cv_text, extracted_file=None):
    if extracted_file and extracted_file["type"] == "pdf":
        import base64
        pdf_base64 = base64.b64encode(extracted_file["bytes"]).decode("utf-8")
        contents = [{
            "role": "user",
            "parts": [
                {
                    "inlineData": {
                        "mimeType": "application/pdf",
                        "data": pdf_base64
                    }
                },
                {
                    "text": f"Yêu cầu công việc (JD):\n{job_description}\n\nNội dung tài liệu của ứng viên nằm trong file PDF đính kèm ở trên. Hãy kiểm tra xem đây có phải là CV/Resume hợp lệ không, và nếu có thì đánh giá so với JD."
                }
            ],
        }]
    else:
        text_to_eval = cv_text
        if extracted_file and extracted_file["type"] == "text":
            text_to_eval = extracted_file["text"]
            
        contents = [{
            "role": "user",
            "parts": [{
                "text": f"Yêu cầu công việc (JD):\n{job_description}\n\nNội dung tài liệu của ứng viên:\n{text_to_eval}"
            }],
        }]

    return {
        "systemInstruction": {
            "parts": [{"text": _cv_screening_system_prompt()}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2000,
            "responseMimeType": "application/json",
            "responseSchema": CV_SCREENING_SCHEMA,
        },
    }


def call_gemini_cv_screen(job_description, cv_text, cv_url=None):
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ProviderError("AI_NOT_CONFIGURED", "GEMINI_API_KEY is not configured.")
    model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
    
    extracted_file = _download_and_extract_cv(cv_url) if cv_url else None
    payload = _gemini_cv_screen_payload(job_description, cv_text, extracted_file)
    
    request = urllib.request.Request(
        f"{GEMINI_API_BASE_URL}/{model}:generateContent",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    timeout = min(max(int(os.environ.get("GEMINI_TIMEOUT_SECONDS", "24")), 5), 28)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        provider_response = json.loads(response.read().decode("utf-8"))
    return json.loads(_extract_gemini_text(provider_response))


def _get_interview_system_instruction(job_title: str, job_description: str, cv_text: str, custom_questions: list) -> str:
    custom_questions_str = "\n".join([f"- {q}" for q in custom_questions]) if custom_questions else "Không có câu hỏi riêng."
    base_instruction = f"""
Bạn là một AI Interviewer chuyên nghiệp, lịch thiệp và dày dạn kinh nghiệm quản lý trong ngành F&B (Nhà hàng - Cà phê - Khách sạn). Bạn đang phỏng vấn ứng viên cho vị trí: {job_title}.

Thông tin công việc (JD):
{job_description}

Thông tin CV của ứng viên:
{cv_text}

Câu hỏi riêng bắt buộc từ Nhà tuyển dụng (Employer):
{custom_questions_str}

Nội dung và Mục tiêu Phỏng vấn:
1. **Tìm hiểu Kinh nghiệm đã làm:** Hỏi ứng viên về kinh nghiệm thực tế tại các vị trí F&B trước đây, vai trò và môi trường làm việc cũ.
2. **Xử lý Tình huống Thực tế:** Đặt câu hỏi tình huống thực tiễn ngành F&B (ví dụ: khách chê món ăn/đồ uống có vấn đề, đông khách giờ cao điểm và thiếu người, xung đột với đồng nghiệp trong ca).
3. **Đặt Câu hỏi từ Employer:** Phải đưa các câu hỏi riêng của Employer vào đúng lượt đi.

Quy tắc giao tiếp (BẮT BUỘC):
1. Nói tiếng Việt tự nhiên, ấm áp, lịch sự, đóng vai trò như một quản lý/chủ quán thực thụ đang trò chuyện trực tiếp.
2. Bạn phải lắng nghe và đọc kỹ câu trả lời của ứng viên ở mỗi lượt. Luôn nhận xét ngắn gọn, tự nhiên (thể hiện sự khích lệ hoặc công nhận câu trả lời cũ) trước khi đặt câu hỏi mới.
3. CHỈ ĐẶT 1 CÂU HỎI duy nhất ở mỗi lượt. Tuyệt đối không hỏi dồn dập nhiều câu cùng một lúc.
4. Ở mỗi lượt hội thoại, hệ thống sẽ gửi câu trả lời kèm theo "[Chỉ đạo dành riêng cho lượt này của Người phỏng vấn]". Bạn phải tuân thủ nghiêm ngặt chỉ đạo đó để đặt câu hỏi tương ứng (ví dụ: chào hỏi ở lượt đầu, hỏi câu hỏi chuyên môn/tình huống ở lượt kế tiếp, hỏi câu hỏi riêng từ Employer, hoặc cảm ơn kết thúc).
5. TƯƠNG TÁC CÓ CẢM XÚC & ĐỒNG CẢM SÂU SẮC: Thể hiện sự đồng cảm ấm áp khi ứng viên chia sẻ về những vất vả của ca làm F&B và tán thưởng chân thành đối với những thành tích tốt của họ.
6. THỰC HIỆN YÊU CẦU ĐƠN GIẢN: Nếu ứng viên có yêu cầu đơn giản như nhờ nói lại câu hỏi, giải thích thêm hay đổi câu hỏi, hãy thực hiện ngay lập tức một cách thân thiện.
7. PHÁT HIỆN ỨNG VIÊN DÙNG AI: Nếu nghi ngờ ứng viên dùng AI (ChatGPT/Gemini) để trả lời phỏng vấn (cấu trúc gạch đầu dòng tự động, dài dòng, sáo rỗng), hãy hỏi thêm câu hỏi phụ đào sâu rất cụ thể về trải nghiệm thực tế để kiểm chứng.
8. XỬ LÝ NGÔN TỪ KHÔNG CHUẨN MỰC: Nếu ứng viên dùng từ ngữ thô tục, vô lễ hoặc hành vi phi đạo đức, hãy giữ sự bình tĩnh, lịch sự của người phỏng vấn và hướng câu chuyện quay lại chủ đề chính.
"""
    if not _FNB_DATASET_AVAILABLE:
        return base_instruction
    try:
        role = fnb_dataset.get_role_for_title(job_title)
        dataset_block = fnb_dataset.build_dataset_prompt_block(role)
        if dataset_block:
            return f"{base_instruction}\n{dataset_block}"
        return base_instruction
    except Exception as e:
        print(f"Error enriching system instruction with dataset: {e}")
        return base_instruction


def call_gemini_interview_start(job_title, job_description, cv_text, custom_questions):
    system_instruction = _get_interview_system_instruction(
        job_title, job_description, cv_text, custom_questions
    )
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ProviderError("AI_NOT_CONFIGURED", "GEMINI_API_KEY is not configured.")
    model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
    
    prompt = f"""
[Ứng viên bắt đầu vào phòng phỏng vấn]
"Xin chào, tôi đã sẵn sàng. Hãy bắt đầu buổi phỏng vấn."

[Chỉ đạo dành riêng cho lượt này]:
Hãy gửi lời chào mừng ứng viên thân thiện, nêu rõ vị trí ứng tuyển "{job_title}", và yêu cầu ứng viên giới thiệu ngắn gọn bản thân cùng kinh nghiệm nổi bật nhất của họ.
"""
    
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": [{
            "role": "user",
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1000,
        }
    }
    
    request = urllib.request.Request(
        f"{GEMINI_API_BASE_URL}/{model}:generateContent",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    timeout = min(max(int(os.environ.get("GEMINI_TIMEOUT_SECONDS", "24")), 5), 28)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        provider_response = json.loads(response.read().decode("utf-8"))
    
    return _extract_gemini_text(provider_response)


def call_gemini_interview_respond(system_instruction, messages, steered_prompt):
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ProviderError("AI_NOT_CONFIGURED", "GEMINI_API_KEY is not configured.")
    model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
    
    contents = []
    for msg in messages:
        contents.append({
            "role": msg["role"],
            "parts": [{"text": msg["parts"][0]["text"]}]
        })
    
    contents.append({
        "role": "user",
        "parts": [{"text": steered_prompt}]
    })
    
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1000,
        }
    }
    
    request = urllib.request.Request(
        f"{GEMINI_API_BASE_URL}/{model}:generateContent",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    timeout = min(max(int(os.environ.get("GEMINI_TIMEOUT_SECONDS", "24")), 5), 28)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        provider_response = json.loads(response.read().decode("utf-8"))
    
    return _extract_gemini_text(provider_response)


def call_gemini_interview_report(job_title, job_description, cv_text, conversation_text, rubric_block):
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ProviderError("AI_NOT_CONFIGURED", "GEMINI_API_KEY is not configured.")
    model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
    
    prompt = f"""
Bạn là một AI Interviewer chuyên nghiệp kiêm chuyên gia đánh giá tuyển dụng ngành F&B (Nhà hàng, Quán ăn, Cửa hàng Cafe).
Dưới đây là lịch sử buổi phỏng vấn trực tiếp giữa bạn và ứng viên cho vị trí {job_title}.

Thông tin công việc (JD):
{job_description}

CV của ứng viên:
{cv_text}

Lịch sử phỏng vấn chi tiết:
{conversation_text}

Nhiệm vụ của bạn:
Hãy đánh giá kết quả phỏng vấn một cách khách quan, nghiêm túc và chính xác theo các tiêu chí và khung điểm quy định dưới đây.

HƯỚNG DẪN CHẤM ĐIỂM CHI TIẾT (0-100 điểm cho mỗi phần):
1. **past_experience_score (Điểm đánh giá về kinh nghiệm làm việc ngành F&B):** Đánh giá dựa trên việc ứng viên đã từng làm các công việc F&B tương tự trong quá khứ hay chưa, có hiểu tính chất công việc không.
2. **situation_handling_score (Điểm giải quyết và xử lý tình huống thực tế):** Đánh giá cách ứng viên ứng biến, xử lý các tình huống giả định hoặc sự cố (ví dụ: phục vụ chậm, khách phàn nàn, áp lực giờ cao điểm).
3. **operations_score (Điểm quy trình vận hành và tác phong làm việc):** Đánh giá tính kỷ luật, giờ giấc ca kíp, quy tắc vệ sinh an toàn thực phẩm, thái độ dịch vụ.
4. **custom_questions_score (Điểm trả lời các câu hỏi riêng từ Employer):** Đánh giá mức độ trả lời chính xác, đầy đủ các câu hỏi bắt buộc do Nhà tuyển dụng đề ra. (Nếu Employer không có câu hỏi riêng, cho điểm mặc định bằng điểm trung bình cộng của các phần khác).
5. **total_score (Tổng điểm trung bình):** Tổng điểm trung bình phản ánh chính xác năng lực tổng thể của ứng viên.

LƯU Ý QUAN TRỌNG VỀ ĐÁNH GIÁ ĐIỂM SỐ (BẮT BUỘC TUÂN THỦ):
- Điểm số phỏng vấn phải phản ánh chính xác chất lượng câu trả lời của ứng viên. Không được cho điểm cao mang tính động viên hoặc mặc định.
- **Khung điểm DƯỚI 40 (Chống chỉ định/Không đạt):** 
  Nếu ứng viên có thái độ thiếu nghiêm túc, cợt nhả, trả lời cộc lốc hoặc vô nghĩa (ví dụ: trả lời 'Không', 'Không biết', '...', hoặc câu trả lời chỉ có vài từ thiếu hợp tác), hoặc hoàn toàn không trả lời được các câu hỏi cơ bản và câu hỏi riêng của Nhà tuyển dụng. Hoặc nếu ứng viên sử dụng ngôn từ không chuẩn mực/thô tục/vô lễ, hay chia sẻ hành vi vi phạm đạo đức nghề nghiệp nghiêm trọng (như ăn cắp, lừa dối, phá hoại).
- **Khung điểm từ 40 đến 69 (Trung bình / Cần cân nhắc thêm):**
  Ứng viên trả lời nghiêm túc, có cố gắng trả lời đầy đủ nhưng câu trả lời còn ngắn gọn, thiếu chiều sâu thực tế, hoặc còn lúng túng trước câu hỏi tình huống hoặc câu hỏi riêng của Nhà tuyển dụng. Hoặc nếu phát hiện ứng viên có hành vi sử dụng AI/chatbot khác để trả lời câu hỏi (cần hạ điểm toàn bộ xuống dưới 50).
- **Khung điểm từ 70 đến 100 (Đạt yêu cầu / Khuyên dùng):**
  Ứng viên có thái độ chuyên nghiệp, trả lời đầy đủ, chi tiết, thể hiện rõ năng lực chuyên môn, kinh nghiệm thực tế phù hợp với JD và trả lời thuyết phục các câu hỏi riêng bắt buộc từ Nhà tuyển dụng. Tuyệt đối không có dấu hiệu sử dụng AI hoặc vi phạm đạo đức/tác phong.

Nhiệm vụ đánh giá chi tiết:
1. Phân tích thái độ, tính chuyên nghiệp, sự hợp tác của ứng viên.
2. Đánh giá kinh nghiệm, xử lý tình huống và vận hành F&B dựa trên câu hỏi chuyên môn/CV.
3. Kiểm tra xem ứng viên có trả lời và đáp ứng tốt các câu hỏi riêng bắt buộc từ Nhà tuyển dụng không.
4. PHÁT HIỆN NGÔN TỪ KHÔNG CHUẨN MỰC & VI PHẠM ĐẠO ĐỨC: Kiểm tra kỹ xem ứng viên có sử dụng từ ngữ thô tục, vô lễ hoặc kể các hành vi vi phạm đạo đức nghề nghiệp F&B (ăn cắp tiền, phá hoại, lừa dối, gây hại cho khách/đồng nghiệp). Nếu có, bắt buộc chấm toàn bộ các điểm số thành phần và tổng kết (`total_score`) xuống DƯỚI 40 điểm (từ 0 đến 35 điểm), đặt `recommend_to_employer` là False, ghi rõ hành vi vi phạm đạo đức này trong `weaknesses` và giải thích lý do cụ thể trong `reason`.
5. PHÁT HIỆN SỬ DỤNG AI ĐỂ TRẢ LỜI: Kiểm tra xem ứng viên có dấu hiệu sao chép câu trả lời từ AI/chatbot khác hay không (dấu hiệu: câu trả lời cực kỳ dài, cấu trúc gạch đầu dòng hoàn hảo, dùng từ ngữ chatbot học thuật, thiếu chi tiết cá nhân thực tế). Nếu phát hiện hoặc nghi ngờ mạnh mẽ hành vi này, bắt buộc hạ toàn bộ các điểm số xuống DƯỚI 50 điểm (từ 0 đến 45 điểm), đặt `recommend_to_employer` là False, ghi rõ nghi vấn sử dụng AI trong `weaknesses` và giải thích lý do cụ thể trong `reason`.
6. Cho điểm tổng kết (`total_score`) từ 0-100. Đề xuất `recommend_to_employer` là True nếu điểm từ 70 trở lên và không vi phạm quy tắc đạo đức hay dùng AI, ngược lại False.
7. Tổng hợp các điểm mạnh, điểm yếu lớn và nêu lý do chi tiết giải thích cho điểm số đó.
{rubric_block}
Hãy trả về kết quả chính xác theo định dạng JSON với cấu trúc quy định trong schema.
"""

    payload = {
        "contents": [{
            "role": "user",
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2000,
            "responseMimeType": "application/json",
            "responseSchema": INTERVIEW_REPORT_SCHEMA,
        }
    }
    
    request = urllib.request.Request(
        f"{GEMINI_API_BASE_URL}/{model}:generateContent",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    timeout = min(max(int(os.environ.get("GEMINI_TIMEOUT_SECONDS", "24")), 5), 28)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        provider_response = json.loads(response.read().decode("utf-8"))
    
    return json.loads(_extract_gemini_text(provider_response))


def _generate_interview_report_lambda(session):
    try:
        messages = session["messages"]
        last_answer = session["answers"][-1] if session["answers"] else ""
        
        conversation_text = ""
        for idx, msg in enumerate(messages):
            role_label = "Interviewer (AI)" if msg["role"] == "model" else "Candidate"
            parts_text = msg["parts"][0]["text"] if isinstance(msg["parts"][0], dict) else msg["parts"][0]
            conversation_text += f"{role_label}: {parts_text}\n"
        
        if last_answer and not conversation_text.endswith(f"Candidate: {last_answer}\n"):
            conversation_text += f"Candidate: {last_answer}\n"
        
        rubric_block = ""
        if _FNB_DATASET_AVAILABLE and hasattr(fnb_dataset, "SCORING_RUBRIC"):
            rubric_block = (
                "\n\nRUBRIC CHẤM ĐIỂM CHUẨN HÓA (tham chiếu bắt buộc, "
                "bổ sung cho hướng dẫn chấm điểm chi tiết ở trên):\n"
                f"{fnb_dataset.SCORING_RUBRIC}\n"
            )
            
        try:
            return call_gemini_interview_report(
                session["job_title"], session["job_description"], session["cv_text"], conversation_text, rubric_block
            )
        except Exception as e:
            print(f"Error calling interview report Gemini API: {e}")
            return {
                "total_score": 60,
                "past_experience_score": 60,
                "situation_handling_score": 60,
                "operations_score": 60,
                "custom_questions_score": 60,
                "strengths": ["Ứng viên đã hoàn thành buổi phỏng vấn"],
                "weaknesses": [
                    "Lỗi chấm điểm của AI: hệ thống không thể phân tích (parse) "
                    "kết quả JSON chấm điểm do mô hình trả về, nên điểm số tạm "
                    "thời mang tính trung lập và cần đánh giá lại thủ công."
                ],
                "recommend_to_employer": False,
                "reason": f"Buổi phỏng vấn đã hoàn tất nhưng hệ thống gặp lỗi khi chấm điểm JSON từ AI: {str(e)}."
            }
    except Exception as e:
        print(f"Error generating interview report lambda: {e}")
        return {
            "total_score": 60,
            "past_experience_score": 60,
            "situation_handling_score": 60,
            "operations_score": 60,
            "custom_questions_score": 60,
            "strengths": ["Nộp bài đầy đủ"],
            "weaknesses": ["Lỗi hệ thống trong quá trình chấm điểm AI"],
            "recommend_to_employer": True,
            "reason": f"Đã hoàn thành phỏng vấn nhưng gặp lỗi hệ thống: {str(e)}."
        }


def lambda_handler(event, context):
    request_id = getattr(context, "aws_request_id", None) or str(uuid.uuid4())
    method, path = _method_and_path(event)

    if method == "OPTIONS":
        return _response(event, 200, {"ok": True})
    if method == "GET" and path == "/health":
        return _response(event, 200, {"status": "ok", "provider": "gemini"})
    if method != "POST" or path not in {
        "/cv/analyze", "/cv/generate", "/cv/recommend-candidates", 
        "/job/suggest-jd", "/candidate/recommend-jobs",
        "/api/v1/cv/screen", "/api/v1/interview/start", "/api/v1/interview/respond"
    }:
        return _response(event, 404, {
            "error": {"code": "NOT_FOUND", "message": "Route not found."},
            "request_id": request_id,
        })

    try:
        if path == "/candidate/recommend-jobs":
            claims = _candidate_claims(event)
            user_id = claims.get("sub")
            
            import boto3
            dynamodb = boto3.resource("dynamodb", region_name="ap-southeast-1")
            
            # Fetch Candidate Profile
            cand_table = dynamodb.Table("CandidateProfiles")
            cand_resp = cand_table.get_item(Key={"userId": user_id})
            candidate_profile = cand_resp.get("Item")
            if not candidate_profile:
                raise RequestError(404, "PROFILE_NOT_FOUND", "Candidate profile not found.")
                
            # Verify KYC status
            kyc_completed = candidate_profile.get("kycCompleted")
            kyc_status = candidate_profile.get("kycStatus")
            ekyc_status = candidate_profile.get("ekycStatus")
            
            is_kyc_verified = (
                kyc_completed is True
                or kyc_status == "VERIFIED"
                or str(ekyc_status).lower() == "verified"
            )
            if not is_kyc_verified:
                raise RequestError(400, "KYC_REQUIRED", "Candidate must complete KYC verification to get AI recommendations.")
                
            # Scan active Standard jobs
            std_table = dynamodb.Table("PostStandardJob")
            response_std = std_table.scan(
                FilterExpression="#s = :status",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={":status": "active"}
            )
            std_jobs = response_std.get("Items", [])
            
            jobs_to_rank = []
            for j in std_jobs:
                jobs_to_rank.append({
                    "id": j.get("idJob") or j.get("id"),
                    "title": j.get("title", ""),
                    "description": j.get("description", ""),
                    "requirements": j.get("requirements", ""),
                    "responsibilities": j.get("responsibilities", ""),
                    "benefits": j.get("benefits", ""),
                    "location": j.get("location", ""),
                    "jobType": j.get("jobType", "part-time"),
                    "salary": j.get("salary", ""),
                    "createdAt": j.get("createdAt", ""),
                    "isQuick": False
                })
                
            # If quick/urgent jobs is approved, fetch active Quick jobs
            verification_status = candidate_profile.get("verificationStatus")
            if verification_status == "APPROVED":
                qk_table = dynamodb.Table("PostQuickJob")
                response_qk = qk_table.scan(
                    FilterExpression="#s = :status",
                    ExpressionAttributeNames={"#s": "status"},
                    ExpressionAttributeValues={":status": "active"}
                )
                qk_jobs = response_qk.get("Items", [])
                for j in qk_jobs:
                    total_salary = j.get("totalSalary")
                    total_hours = j.get("totalHours")
                    hourly_rate = j.get("hourlyRate")
                    salary_str = ""
                    try:
                        if total_salary:
                            income = int(float(total_salary) * 0.85)
                            salary_str = f"{income} VNĐ"
                        else:
                            income_rate = int(float(hourly_rate) * 0.85)
                            salary_str = f"{income_rate} VNĐ/h"
                    except Exception:
                        salary_str = "Thỏa thuận"

                    jobs_to_rank.append({
                        "id": j.get("jobID") or j.get("id"),
                        "title": j.get("title", ""),
                        "description": j.get("description", ""),
                        "requirements": j.get("requirements", ""),
                        "responsibilities": j.get("responsibilities", ""),
                        "benefits": j.get("benefits", ""),
                        "location": j.get("location", ""),
                        "jobType": "quick",
                        "salary": salary_str,
                        "createdAt": j.get("createdAt", ""),
                        "isQuick": True
                    })
                    
            if not jobs_to_rank:
                return _response(event, 200, {"recommendations": []})
                
            # Sort by createdAt descending and take latest 30
            jobs_to_rank.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
            jobs_to_rank = jobs_to_rank[:30]
            
            # Request language preference
            body_data = _parse_body(event) if event.get("body") else {}
            language = body_data.get("language", "vi")
            if language not in {"vi", "en"}:
                language = "vi"
            candidate_profile["language"] = language
            
            started = time.monotonic()
            ai_result = call_gemini_recommend_jobs(candidate_profile, jobs_to_rank)
            processing_ms = round((time.monotonic() - started) * 1_000)
            print(json.dumps({
                "event": "recommend_jobs_completed",
                "request_id": request_id,
                "user_id": user_id,
                "jobs_count": len(jobs_to_rank),
                "processing_ms": processing_ms,
            }))
            return _response(event, 200, ai_result)

        if path == "/job/suggest-jd":
            claims = _employer_claims(event)
            body_data = _parse_body(event)
            validated = _validate_suggest_jd_payload(body_data)
            started = time.monotonic()
            ai_result = call_gemini_suggest_jd(validated)
            processing_ms = round((time.monotonic() - started) * 1_000)
            print(json.dumps({
                "event": "suggest_jd_completed",
                "request_id": request_id,
                "user_id": claims.get("sub"),
                "processing_ms": processing_ms,
            }))
            return _response(event, 200, ai_result)

        if path == "/cv/recommend-candidates":
            claims = _employer_claims(event)
            body_data = _parse_body(event)
            validated = _validate_recommend_payload(body_data)
            is_quick_job = validated.get("isQuickJob", False)
            candidates = [_summarize_candidate(c) for c in _fetch_verified_candidates(is_quick_job=is_quick_job)]
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
        elif path == "/cv/generate":
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

        elif path == "/api/v1/cv/screen":
            body = _parse_body(event)
            job_description = body.get("job_description", "")
            cv_text = body.get("cv_text", "")
            cv_url = body.get("cv_url", "")
            ai_result = call_gemini_cv_screen(job_description, cv_text, cv_url)
            return _response(event, 200, ai_result)

        elif path == "/api/v1/interview/start":
            body = _parse_body(event)
            job_title = body.get("job_title", "")
            job_description = body.get("job_description", "")
            cv_text = body.get("cv_text", "")
            custom_questions = body.get("custom_questions", [])
            
            user_id = claims.get("sub")
            if not user_id:
                raise RequestError(401, "UNAUTHORIZED", "User not logged in.")
            
            session_id = f"sess_{uuid.uuid4().hex[:16]}"
            first_question = call_gemini_interview_start(
                job_title, job_description, cv_text, custom_questions
            )
            
            turns = ["Greeting and Self-Introduction", "Technical Question based on CV/JD"]
            if custom_questions:
                for q in custom_questions:
                    turns.append(f"Custom Question: {q}")
            else:
                turns.append("Salary and Work Expectations")
            turns.append("Candidate Questions & Wrap up")
            
            session = {
                "session_id": session_id,
                "job_title": job_title,
                "job_description": job_description,
                "cv_text": cv_text,
                "custom_questions": custom_questions,
                "current_question_index": 1,
                "max_questions": len(turns),
                "messages": [
                    {"role": "model", "parts": [{"text": first_question}]}
                ],
                "turns": turns,
                "answers": []
            }
            
            save_active_session(user_id, session)
            return _response(event, 200, {
                "session_id": session_id,
                "question": first_question
            })

        elif path == "/api/v1/interview/respond":
            body = _parse_body(event)
            session_id = body.get("session_id")
            answer = body.get("answer", "")
            
            user_id = claims.get("sub")
            if not user_id:
                raise RequestError(401, "UNAUTHORIZED", "User not logged in.")
            
            session = get_active_session(user_id)
            if not session or session.get("session_id") != session_id:
                return _response(event, 200, {
                    "question": "Không tìm thấy phiên phỏng vấn. Vui lòng bắt đầu lại.",
                    "finished": True,
                    "report": None
                })
            
            session["answers"].append(answer)
            current_idx = session["current_question_index"]
            max_questions = session["max_questions"]
            turns = session.get("turns", [])
            
            if current_idx >= max_questions:
                req_type = _detect_conversational_request(answer)
                if req_type in ["repeat", "clarify"] and current_idx > 0:
                    pass
                else:
                    report = _generate_interview_report_lambda(session)
                    delete_active_session(user_id)
                    return _response(event, 200, {
                        "question": None,
                        "finished": True,
                        "report": report
                    })
            
            req_type = _detect_conversational_request(answer)
            is_repeat_or_clarify = False
            steered_prompt = ""
            
            if req_type in ["repeat", "clarify"] and current_idx > 0:
                is_repeat_or_clarify = True
                prev_turn = turns[current_idx - 1]
                if req_type == "repeat":
                    steered_prompt = f"""
[Ứng viên yêu cầu]: "{answer}"
[YÊU CẦU BẮT BUỘC]: Ứng viên yêu cầu lặp lại câu hỏi vừa rồi. 
Bạn hãy bày tỏ sự lịch sự, vui vẻ (ví dụ: "Dạ vâng...", "Tất nhiên rồi bạn...") và lặp lại câu hỏi của lượt trước liên quan đến chủ đề: "{prev_turn}". 
TUYỆT ĐỐI KHÔNG chuyển sang câu hỏi tiếp theo và không hỏi chủ đề mới.
"""
                else:
                    steered_prompt = f"""
[Ứng viên yêu cầu]: "{answer}"
[YÊU CẦU BẮT BUỘC]: Ứng viên yêu cầu giải thích hoặc làm rõ câu hỏi vừa rồi. 
Bạn hãy bày tỏ sự sẵn lòng giúp đỡ và giải thích, làm rõ hoặc diễn đạt lại câu hỏi liên quan đến chủ đề: "{prev_turn}" bằng ngôn từ đơn giản, dễ hiểu hơn. 
TUYỆT ĐỐI KHÔNG chuyển sang câu hỏi tiếp theo và không hỏi chủ đề mới.
"""
            elif req_type == "skip":
                current_idx = session["current_question_index"]
                if current_idx < max_questions:
                    next_turn_instruction = _get_turn_instruction(current_idx, turns)
                    steered_prompt = f"""
[Ứng viên yêu cầu]: "{answer}"
[YÊU CẦU BẮT BUỘC]: Ứng viên yêu cầu bỏ qua câu hỏi vừa rồi. Bạn hãy lịch sự đồng ý (ví dụ: "Được chứ, mình qua câu hỏi tiếp theo nhé...") và chuyển ngay sang câu hỏi mới dưới đây:
{next_turn_instruction}
"""
                else:
                    report = _generate_interview_report_lambda(session)
                    delete_active_session(user_id)
                    return _response(event, 200, {
                        "question": None,
                        "finished": True,
                        "report": report
                    })
            
            if not steered_prompt:
                turn_instruction = _get_turn_instruction(current_idx, turns)
                steered_prompt = f"""
[Ứng viên trả lời]:
"{answer}"

{turn_instruction}
"""
            
            system_instruction = _get_interview_system_instruction(
                session["job_title"], session["job_description"], session["cv_text"], session["custom_questions"]
            )
            next_question = call_gemini_interview_respond(
                system_instruction, session["messages"], steered_prompt
            )
            
            session["messages"].append({"role": "user", "parts": [{"text": answer}]})
            session["messages"].append({"role": "model", "parts": [{"text": next_question}]})
            
            if not is_repeat_or_clarify:
                session["current_question_index"] += 1
            
            save_active_session(user_id, session)
            return _response(event, 200, {
                "question": next_question,
                "finished": False,
                "report": None
            })
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
