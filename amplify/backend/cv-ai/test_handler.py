import json
import os
import unittest
import urllib.error
from io import BytesIO
from unittest.mock import patch

import handler


def event(method="POST", path="/cv/analyze", body=None, groups=None):
    claims = {
        "sub": "candidate-123",
        "cognito:groups": ["Candidate"] if groups is None else groups,
    }
    return {
        "requestContext": {
            "http": {"method": method},
            "authorizer": {"jwt": {"claims": claims}},
        },
        "rawPath": path,
        "headers": {"origin": "http://localhost:3000"},
        "body": json.dumps(body or {}),
    }


def valid_payload():
    return {
        "cv": {
            "full_name": "Nguyen Van A",
            "title": "Frontend Developer",
            "email": "a@example.com",
            "phone": "0900000000",
            "address": "Ho Chi Minh City",
            "objective": "Build accessible and reliable web applications for users.",
            "skills": ["React", "JavaScript", "CSS"],
            "languages": ["Vietnamese", "English"],
            "experiences": [{
                "company": "Example",
                "role": "Developer",
                "duration": "2024-2026",
                "description": "Built web interfaces.",
            }],
            "educations": [{
                "school": "Example University",
                "degree": "Software Engineering",
                "duration": "2020-2024",
                "description": "",
            }],
        },
        "language": "vi",
    }


AI_RESULT = {
    "content_quality": 80,
    "job_relevance": 70,
    "summary": "CV co cau truc tot.",
    "strengths": ["Ky nang phu hop."],
    "improvements": ["Them ket qua dinh luong."],
    "missing_skills": [],
    "suggested_objective": "Phat trien san pham web chat luong cao.",
    "suggested_skills": ["Accessibility"],
    "experience_suggestions": ["Mo ta ket qua cong viec."],
    "education_suggestions": [],
}


class HandlerTests(unittest.TestCase):
    def setUp(self):
        os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"

    def test_completeness_is_deterministic(self):
        cleaned = handler.validate_payload(valid_payload())
        self.assertEqual(handler.calculate_completeness(cleaned["cv"]), 100)

    def test_gemini_requires_api_key(self):
        cleaned = handler.validate_payload(valid_payload())
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(handler.ProviderError) as error:
                handler.call_gemini(cleaned)
        self.assertEqual(error.exception.code, "AI_NOT_CONFIGURED")

    def test_gemini_maps_invalid_api_key(self):
        cleaned = handler.validate_payload(valid_payload())
        error_body = json.dumps({
            "error": {"message": "API key not valid. Please pass a valid API key."}
        }).encode("utf-8")
        http_error = urllib.error.HTTPError(
            url="https://example.test",
            code=400,
            msg="Bad Request",
            hdrs=None,
            fp=BytesIO(error_body),
        )
        with patch.dict(os.environ, {"GEMINI_API_KEY": "invalid"}, clear=True):
            with self.assertRaises(handler.ProviderError) as error:
                handler.call_gemini(cleaned, urlopen=lambda *_args, **_kwargs: (_ for _ in ()).throw(http_error))
        self.assertEqual(error.exception.code, "AI_CREDENTIAL_INVALID")

    def test_rejects_missing_authorizer(self):
        request = event(body=valid_payload())
        request["requestContext"]["authorizer"] = {}
        response = handler.lambda_handler(request, None)
        self.assertEqual(response["statusCode"], 401)

    def test_rejects_non_candidate(self):
        response = handler.lambda_handler(
            event(body=valid_payload(), groups=["Employer"]),
            None,
        )
        self.assertEqual(response["statusCode"], 403)

    def test_rejects_user_without_candidate_claim(self):
        response = handler.lambda_handler(
            event(body=valid_payload(), groups=[]),
            None,
        )
        self.assertEqual(response["statusCode"], 403)

    def test_rejects_empty_cv(self):
        response = handler.lambda_handler(
            event(body={"cv": {"full_name": "A"}}),
            None,
        )
        self.assertEqual(response["statusCode"], 422)

    @patch("handler.call_gemini", return_value=AI_RESULT)
    def test_returns_analysis_contract(self, _mock_gemini):
        response = handler.lambda_handler(event(body=valid_payload()), None)
        body = json.loads(response["body"])
        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(body["score"], 86)
        self.assertEqual(body["score_breakdown"]["completeness"], 100)
        self.assertEqual(body["metadata"]["provider"], "gemini")
        self.assertIn("section_suggestions", body)

    def test_options_does_not_require_auth(self):
        response = handler.lambda_handler(event(method="OPTIONS"), None)
        self.assertEqual(response["statusCode"], 200)

    def test_generate_cv_rejects_missing_job_title(self):
        response = handler.lambda_handler(
            event(path="/cv/generate", body={"profile": {}}),
            None,
        )
        self.assertEqual(response["statusCode"], 422)

    def test_generate_cv_rejects_non_candidate(self):
        response = handler.lambda_handler(
            event(path="/cv/generate", method="POST", groups=["Employer"], body={"profile": {"title": "Developer"}}),
            None,
        )
        self.assertEqual(response["statusCode"], 403)

    @patch("urllib.request.urlopen")
    def test_returns_generated_cv(self, mock_urlopen):
        mock_response = mock_urlopen.return_value.__enter__.return_value
        mock_response.read.return_value = json.dumps({
            "candidates": [{
                "content": {
                    "parts": [{"text": json.dumps({
                        "title": "Software Engineer",
                        "objective": "Build scalable systems.",
                        "skills": ["Python", "AWS"],
                        "languages": ["English"],
                        "experiences": [],
                        "educations": [],
                    })}]
                }
            }]
        }).encode("utf-8")
        
        with patch.dict(os.environ, {"GEMINI_API_KEY": "dummy_key"}, clear=False):
            response = handler.lambda_handler(
                event(path="/cv/generate", body={"profile": {"title": "Developer"}}),
                None
            )
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["title"], "Software Engineer")
        self.assertEqual(body["objective"], "Build scalable systems.")

    def test_recommend_rejects_candidate(self):
        response = handler.lambda_handler(
            event(path="/cv/recommend-candidates", method="POST", groups=["Candidate"], body={"job": {"title": "Cashier"}}),
            None
        )
        self.assertEqual(response["statusCode"], 403)

    @patch("handler._fetch_verified_candidates", return_value=[])
    def test_recommend_returns_empty_when_no_candidates(self, mock_fetch):
        response = handler.lambda_handler(
            event(path="/cv/recommend-candidates", method="POST", groups=["Employer"], body={"job": {"title": "Cashier"}}),
            None
        )
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["recommendations"], [])

    @patch("handler._fetch_verified_candidates", return_value=[{"userId": "123", "fullName": "Alice"}])
    @patch("handler.call_gemini_recommend", return_value={"recommendations": [{"candidateId": "123", "fullName": "Alice", "matchScore": 85, "matchReason": "Good fit."}]})
    def test_recommend_returns_matches(self, mock_gemini, mock_fetch):
        response = handler.lambda_handler(
            event(path="/cv/recommend-candidates", method="POST", groups=["Employer"], body={"job": {"title": "Cashier"}}),
            None
        )
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(len(body["recommendations"]), 1)
        self.assertEqual(body["recommendations"][0]["matchScore"], 85)


if __name__ == "__main__":
    unittest.main()
