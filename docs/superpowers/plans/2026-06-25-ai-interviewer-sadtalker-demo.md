# AI Interviewer SadTalker Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a SadTalker-compatible media layer to the existing Gemini AI interview flow so each AI question can show a talking-head interviewer video with a graceful voice-only fallback.

**Architecture:** Keep Gemini question generation, session state, scoring, audio recording, and employer review in the current `cv-ai` and application Lambdas. Add a lightweight `/api/v1/interview/media` broker endpoint that calls an external GPU media service when configured and otherwise returns an unavailable status. Add a frontend service and update `JobListing.jsx` to request media for AI interviewer turns and render video when available.

**Tech Stack:** React 18, Vite, Vitest, AWS Lambda Python, API Gateway, Gemini REST API, external SadTalker/Gemini TTS media service contract.

---

### Task 1: Backend Media Contract

**Files:**
- Modify: `amplify/backend/cv-ai/handler.py`
- Modify: `amplify/backend/cv-ai/test_handler.py`
- Modify: `amplify/backend/cv-ai/deploy-cv-ai-lambda.ps1`
- Modify: `amplify/backend/cv-ai/README.md`

- [ ] **Step 1: Write failing tests**

Add tests in `amplify/backend/cv-ai/test_handler.py` for:

```python
@patch.dict("os.environ", {}, clear=True)
def test_interview_media_returns_unavailable_when_service_not_configured(self):
    response = handler.lambda_handler(
        event(path="/api/v1/interview/media", method="POST", body={
            "session_id": "sess_123",
            "question_text": "Xin chào bạn.",
            "turn_index": 1,
            "language": "vi"
        }),
        None
    )
    self.assertEqual(response["statusCode"], 200)
    body = json.loads(response["body"])
    self.assertEqual(body["status"], "unavailable")
    self.assertEqual(body["provider"], "sadtalker")
    self.assertIsNone(body["video_url"])
```

```python
def test_interview_media_rejects_missing_question_text(self):
    response = handler.lambda_handler(
        event(path="/api/v1/interview/media", method="POST", body={
            "session_id": "sess_123"
        }),
        None
    )
    self.assertEqual(response["statusCode"], 400)
    body = json.loads(response["body"])
    self.assertEqual(body["error"]["code"], "QUESTION_TEXT_REQUIRED")
```

```python
@patch.dict("os.environ", {"INTERVIEW_MEDIA_SERVICE_URL": "https://media.example.com/render", "INTERVIEW_MEDIA_API_KEY": "secret"})
@patch("urllib.request.urlopen")
def test_interview_media_calls_configured_service(self, mock_urlopen):
    mock_response = mock_urlopen.return_value.__enter__.return_value
    mock_response.read.return_value = json.dumps({
        "media_id": "media_1",
        "status": "ready",
        "video_url": "https://cdn.example.com/q1.mp4",
        "audio_url": "https://cdn.example.com/q1.wav",
        "duration_ms": 3200
    }).encode("utf-8")

    response = handler.lambda_handler(
        event(path="/api/v1/interview/media", method="POST", body={
            "session_id": "sess_123",
            "question_text": "Xin chào bạn.",
            "turn_index": 1,
            "language": "vi"
        }),
        None
    )
    self.assertEqual(response["statusCode"], 200)
    body = json.loads(response["body"])
    self.assertEqual(body["status"], "ready")
    self.assertEqual(body["video_url"], "https://cdn.example.com/q1.mp4")
```

- [ ] **Step 2: Run tests and verify RED**

Run: `python -m unittest -v test_handler.HandlerTests.test_interview_media_returns_unavailable_when_service_not_configured test_handler.HandlerTests.test_interview_media_rejects_missing_question_text test_handler.HandlerTests.test_interview_media_calls_configured_service`

Expected: tests fail because `/api/v1/interview/media` does not exist yet.

- [ ] **Step 3: Implement media validation and broker**

Add helper functions in `handler.py`:

```python
def _validate_interview_media_payload(body):
    question_text = _clean_text(body.get("question_text"), 2_000)
    if not question_text:
        raise RequestError(400, "QUESTION_TEXT_REQUIRED", "question_text is required.")
    language = body.get("language", "vi")
    if language not in {"vi", "en"}:
        language = "vi"
    return {
        "session_id": _clean_text(body.get("session_id"), 120),
        "question_text": question_text,
        "turn_index": int(body.get("turn_index") or 0),
        "language": language,
        "voice": _clean_text(body.get("voice"), 120),
    }
```

```python
def request_interview_media(validated, user_id, urlopen=None):
    service_url = os.environ.get("INTERVIEW_MEDIA_SERVICE_URL", "").strip()
    if not service_url:
        return {
            "media_id": None,
            "status": "unavailable",
            "provider": "sadtalker",
            "video_url": None,
            "audio_url": None,
            "duration_ms": None,
            "message": "INTERVIEW_MEDIA_SERVICE_URL is not configured.",
        }
    ...
```

Add route handling for `POST /api/v1/interview/media`.

- [ ] **Step 4: Add deploy route and docs**

Add `POST /api/v1/interview/media` and `OPTIONS /api/v1/interview/media` to `deploy-cv-ai-lambda.ps1`. Document `INTERVIEW_MEDIA_SERVICE_URL` and `INTERVIEW_MEDIA_API_KEY` in `README.md`.

- [ ] **Step 5: Run backend tests**

Run: `python -m unittest -v`

Expected: all backend tests pass.

### Task 2: Frontend Media Service

**Files:**
- Create: `src/services/interviewMediaService.js`
- Create: `src/services/interviewMediaService.test.js`

- [ ] **Step 1: Write failing Vitest tests**

Create service tests for successful ready media, unavailable fallback, and API error fallback.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run src/services/interviewMediaService.test.js`

Expected: fails because the service file does not exist.

- [ ] **Step 3: Implement service**

Export `requestInterviewMedia({ sessionId, questionText, turnIndex, language, voice })`, using `getAuthHeaders()` and `VITE_CV_AI_API_URL || '/api-cv-ai'`.

- [ ] **Step 4: Run service tests**

Run: `npx vitest run src/services/interviewMediaService.test.js`

Expected: service tests pass.

### Task 3: Candidate Interview UI Integration

**Files:**
- Modify: `src/pages/candidate/JobListing.jsx`

- [ ] **Step 1: Add media state and renderer**

Add `interviewMediaByTurn` state and a helper that requests media for each AI question. Render a `<video>` for `status === "ready"` and `videoUrl`; otherwise keep the existing `VoiceAvatarCircle`.

- [ ] **Step 2: Wire initial and next AI questions**

Call the media helper after initial question, follow-up questions, and ending text. Keep `speakVietnamese()` as fallback only when media video is unavailable.

- [ ] **Step 3: Preserve current interview behavior**

Do not change existing Round 1 screening, anti-cheat, mic transcription, audio recording, report generation, application submission, or employer review behavior.

- [ ] **Step 4: Verify frontend build**

Run: `npx vitest run src/services/interviewMediaService.test.js`

Run: `npm run build`

Expected: tests and build pass.

### Task 4: Final Verification

**Files:**
- Review: `amplify/backend/cv-ai/handler.py`
- Review: `src/pages/candidate/JobListing.jsx`
- Review: `src/services/interviewMediaService.js`

- [ ] **Step 1: Backend verification**

Run: `python -m unittest -v` in `amplify/backend/cv-ai`.

- [ ] **Step 2: Frontend verification**

Run: `npx vitest run src/services/interviewMediaService.test.js`.

Run: `npm run build`.

- [ ] **Step 3: Report integration status**

Report the implemented media contract, fallback behavior, and remaining external SadTalker/Gemini TTS service deployment step.
