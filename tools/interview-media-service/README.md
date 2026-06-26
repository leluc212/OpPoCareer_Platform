# Interview Media Service

Local service for the AI interviewer talking-head demo.

Flow:

```text
question_text -> Gemini TTS audio.wav -> SadTalker talking.mp4 -> frontend video
```

The React app can call this service directly in local development with
`VITE_INTERVIEW_MEDIA_API_URL=http://127.0.0.1:8787`. Production can keep using
the existing Lambda broker by setting `INTERVIEW_MEDIA_SERVICE_URL` on the
`cv-ai` Lambda.

## Requirements

Install the lightweight API dependencies:

```powershell
cd tools/interview-media-service
pip install -r requirements.txt
```

Install SadTalker separately because it requires its own Python, torch, ffmpeg,
model checkpoints, and ideally GPU:

```powershell
git clone https://github.com/OpenTalker/SadTalker.git C:\SadTalker
cd C:\SadTalker
pip install -r requirements.txt
```

Download SadTalker checkpoints following the official SadTalker README and set:

```powershell
$env:SADTALKER_REPO_DIR="C:\SadTalker"
$env:SADTALKER_CHECKPOINT_DIR="C:\SadTalker\checkpoints"
$env:GEMINI_API_KEY="your-google-ai-studio-key"
```

Gemini TTS uses `gemini-3.1-flash-tts-preview` by default and writes 24kHz mono
WAV audio.

## Run

```powershell
cd tools/interview-media-service
.\start-interview-media-service.ps1
```

Then restart Vite with the direct media URL:

```powershell
$env:VITE_INTERVIEW_MEDIA_API_URL="http://127.0.0.1:8787"
npm run dev -- --host 127.0.0.1 --port 5173
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/health
```

Render test:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/render `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"session_id":"demo","question_text":"Chào bạn, bạn hãy tự giới thiệu ngắn gọn về bản thân nhé.","turn_index":1,"language":"vi","voice":"Kore"}'
```

If SadTalker or Gemini is not configured, the service returns
`status: "unavailable"` with a clear `message`. The frontend will keep using the
local fallback video/voice until a real `video_url` is returned.
