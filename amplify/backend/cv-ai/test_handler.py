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

    @patch("handler._fetch_verified_candidates", return_value=[])
    def test_recommend_passes_is_quick_job_to_fetch_candidates(self, mock_fetch):
        response = handler.lambda_handler(
            event(path="/cv/recommend-candidates", method="POST", groups=["Employer"], body={"job": {"title": "Cashier"}, "isQuickJob": True}),
            None
        )
        self.assertEqual(response["statusCode"], 200)
        mock_fetch.assert_called_once_with(is_quick_job=True)

    def test_suggest_jd_rejects_candidate(self):
        response = handler.lambda_handler(
            event(path="/job/suggest-jd", method="POST", groups=["Candidate"], body={"title": "Cashier"}),
            None
        )
        self.assertEqual(response["statusCode"], 403)

    def test_suggest_jd_rejects_missing_title(self):
        response = handler.lambda_handler(
            event(path="/job/suggest-jd", method="POST", groups=["Employer"], body={}),
            None
        )
        self.assertEqual(response["statusCode"], 400)

    @patch("urllib.request.urlopen")
    def test_returns_suggested_jd(self, mock_urlopen):
        mock_response = mock_urlopen.return_value.__enter__.return_value
        mock_response.read.return_value = json.dumps({
            "candidates": [{
                "content": {
                    "parts": [{"text": json.dumps({
                        "description": "Pha chế các loại đồ uống.",
                        "responsibilities": "Chuẩn bị nguyên liệu.\nPha chế nước uống.",
                        "requirements": "Chăm chỉ, trung thực.\nCó kinh nghiệm pha chế.",
                        "benefits": "Lương thưởng hấp dẫn.\nMôi trường năng động.",
                    })}]
                }
            }]
        }).encode("utf-8")
        
        with patch.dict(os.environ, {"GEMINI_API_KEY": "dummy_key"}, clear=False):
            response = handler.lambda_handler(
                event(path="/job/suggest-jd", method="POST", groups=["Employer"], body={"title": "Pha chế"}),
                None
            )
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["description"], "Pha chế các loại đồ uống.")
        self.assertEqual(body["responsibilities"], "Chuẩn bị nguyên liệu.\nPha chế nước uống.")

    def test_recommend_jobs_rejects_employer(self):
        response = handler.lambda_handler(
            event(path="/candidate/recommend-jobs", method="POST", groups=["Employer"], body={}),
            None
        )
        self.assertEqual(response["statusCode"], 403)

    @patch("boto3.resource")
    def test_recommend_jobs_requires_kyc(self, mock_boto3):
        mock_table = mock_boto3.return_value.Table.return_value
        mock_table.get_item.return_value = {"Item": {
            "userId": "candidate-123",
            "kycCompleted": False
        }}
        
        response = handler.lambda_handler(
            event(path="/candidate/recommend-jobs", method="POST", groups=["Candidate"], body={}),
            None
        )
        self.assertEqual(response["statusCode"], 400)
        body = json.loads(response["body"])
        self.assertEqual(body["error"]["code"], "KYC_REQUIRED")

    @patch("boto3.resource")
    @patch("urllib.request.urlopen")
    def test_returns_recommended_jobs(self, mock_urlopen, mock_boto3):
        class MockTable:
            def __init__(self, name):
                self.name = name
            def get_item(self, Key):
                return {"Item": {
                    "userId": "candidate-123",
                    "kycCompleted": True,
                    "verificationStatus": "APPROVED"
                }}
            def scan(self, *args, **kwargs):
                if self.name == "PostStandardJob":
                    return {"Items": [{
                        "idJob": "job-std-1",
                        "title": "Standard Job",
                        "status": "active",
                        "createdAt": "2026-06-11T00:00:00Z"
                    }]}
                elif self.name == "PostQuickJob":
                    return {"Items": [{
                        "jobID": "job-qk-1",
                        "title": "Quick Job",
                        "status": "active",
                        "createdAt": "2026-06-11T00:00:00Z"
                    }]}
                return {"Items": []}
                
        mock_boto3.return_value.Table.side_effect = lambda name: MockTable(name)

        mock_response = mock_urlopen.return_value.__enter__.return_value
        mock_response.read.return_value = json.dumps({
            "candidates": [{
                "content": {
                    "parts": [{"text": json.dumps({
                        "recommendations": [
                            {"jobId": "job-std-1", "matchScore": 90, "matchReason": "Good match"},
                            {"jobId": "job-qk-1", "matchScore": 85, "matchReason": "Urgent match"}
                        ]
                    })}]
                }
            }]
        }).encode("utf-8")

        with patch.dict(os.environ, {"GEMINI_API_KEY": "dummy_key"}, clear=False):
            response = handler.lambda_handler(
                event(path="/candidate/recommend-jobs", method="POST", groups=["Candidate"], body={}),
                None
            )
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(len(body["recommendations"]), 2)
        self.assertEqual(body["recommendations"][0]["jobId"], "job-std-1")

    @patch("handler.call_gemini_cv_screen", return_value={"score": 85, "result": "pass", "strengths": ["test"], "weaknesses": [], "reason": "fit"})
    def test_cv_screen_endpoint(self, mock_cv_screen):
        response = handler.lambda_handler(
            event(path="/api/v1/cv/screen", method="POST", body={"job_description": "JD", "cv_text": "CV"}),
            None
        )
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["score"], 85)
        mock_cv_screen.assert_called_once_with("JD", "CV", "")

    @patch("handler.call_gemini_cv_screen")
    def test_cv_screen_endpoint_with_cv_url(self, mock_cv_screen):
        mock_cv_screen.return_value = {"score": 85, "result": "pass", "strengths": ["test"], "weaknesses": [], "reason": "fit"}
        response = handler.lambda_handler(
            event(path="/api/v1/cv/screen", method="POST", body={
                "job_description": "JD",
                "cv_text": "CV",
                "cv_url": "https://example.com/test.pdf"
            }),
            None
        )
        self.assertEqual(response["statusCode"], 200)
        mock_cv_screen.assert_called_once_with("JD", "CV", "https://example.com/test.pdf")

    @patch("urllib.request.urlopen")
    def test_download_and_extract_cv_pdf(self, mock_urlopen):
        mock_response = mock_urlopen.return_value.__enter__.return_value
        mock_response.read.return_value = b"%PDF-1.4 dummy pdf content"
        
        res = handler._download_and_extract_cv("https://example.com/cv.pdf")
        self.assertIsNotNone(res)
        self.assertEqual(res["type"], "pdf")
        self.assertEqual(res["bytes"], b"%PDF-1.4 dummy pdf content")

    @patch("urllib.request.urlopen")
    def test_download_and_extract_cv_invalid_url(self, mock_urlopen):
        res = handler._download_and_extract_cv("not-a-url")
        self.assertIsNone(res)
        mock_urlopen.assert_not_called()

    @patch("handler.call_gemini_interview_start", return_value="Hello, welcome to the interview.")
    @patch("handler.save_active_session")
    def test_interview_start_endpoint(self, mock_save, mock_start):
        response = handler.lambda_handler(
            event(path="/api/v1/interview/start", method="POST", body={"job_title": "Title", "job_description": "JD", "cv_text": "CV"}),
            None
        )
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["question"], "Hello, welcome to the interview.")
        self.assertTrue(body["session_id"].startswith("sess_"))
        mock_save.assert_called_once()

    @patch("handler.get_active_session", return_value={
        "session_id": "sess_123",
        "job_title": "Title",
        "job_description": "JD",
        "cv_text": "CV",
        "custom_questions": [],
        "current_question_index": 1,
        "max_questions": 3,
        "messages": [],
        "turns": ["Turn1", "Turn2", "Turn3"],
        "answers": []
    })
    @patch("handler.call_gemini_interview_respond", return_value="Great. Next question.")
    @patch("handler.save_active_session")
    def test_interview_respond_endpoint(self, mock_save, mock_respond, mock_get):
        response = handler.lambda_handler(
            event(path="/api/v1/interview/respond", method="POST", body={"session_id": "sess_123", "answer": "Answer 1"}),
            None
        )
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["question"], "Great. Next question.")
        self.assertFalse(body["finished"])
        mock_save.assert_called_once()


if __name__ == "__main__":
    unittest.main()
