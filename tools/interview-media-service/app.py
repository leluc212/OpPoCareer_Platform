import base64
import json
import os
import re
import shutil
import subprocess
import time
import wave
from pathlib import Path
from typing import Optional

import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


DEFAULT_TTS_MODEL = "gemini-3.1-flash-tts-preview"
DEFAULT_TTS_VOICE = "Kore"
DEFAULT_SAMPLE_RATE = 24000


class RenderRequest(BaseModel):
    session_id: str = ""
    question_text: str = ""
    turn_index: int = 0
    language: str = "vi"
    voice: str = ""
    user_id: str = ""
    provider: str = "sadtalker"


def _workspace_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _output_root() -> Path:
    configured = os.environ.get("INTERVIEW_MEDIA_OUTPUT_DIR", "").strip()
    if configured:
        return Path(configured).resolve()
    return Path(__file__).resolve().parent / "media"


def _base_url(request: Request) -> str:
    configured = os.environ.get("INTERVIEW_MEDIA_PUBLIC_BASE_URL", "").strip().rstrip("/")
    if configured:
        return configured
    return str(request.base_url).rstrip("/")


def _safe_slug(value: str, fallback: str = "interview") -> str:
    slug = re.sub(r"[^a-zA-Z0-9_-]+", "_", value or "").strip("_")
    return slug[:80] or fallback


def write_pcm_wav(path: Path, pcm: bytes, channels: int = 1, rate: int = DEFAULT_SAMPLE_RATE, sample_width: int = 2) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(rate)
        wf.writeframes(pcm)


def generate_gemini_tts_wav(question_text: str, output_wav: Path, language: str = "vi", voice: str = "") -> Path:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    model = os.environ.get("GEMINI_TTS_MODEL", DEFAULT_TTS_MODEL).strip() or DEFAULT_TTS_MODEL
    voice_name = (voice or os.environ.get("GEMINI_TTS_VOICE") or DEFAULT_TTS_VOICE).strip()
    timeout = int(os.environ.get("GEMINI_TTS_TIMEOUT_SECONDS", "60"))
    prompt = f"Nói bằng giọng phỏng vấn viên tiếng Việt, ấm áp, rõ ràng và chuyên nghiệp: {question_text.strip()}"
    if language != "vi":
        prompt = f"Say in a warm, clear, professional interviewer voice: {question_text.strip()}"

    response = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        headers={
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        },
        data=json.dumps({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {
                    "voiceConfig": {
                        "prebuiltVoiceConfig": {
                            "voiceName": voice_name,
                        }
                    }
                },
            },
            "model": model,
        }),
        timeout=timeout,
    )
    if response.status_code >= 400:
        raise RuntimeError(f"Gemini TTS returned HTTP {response.status_code}: {response.text[:300]}")

    payload = response.json()
    inline_data = (
        payload.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("inlineData", {})
        .get("data")
    )
    if not inline_data:
        raise RuntimeError("Gemini TTS response did not include inline audio data.")

    pcm = base64.b64decode(inline_data)
    write_pcm_wav(output_wav, pcm)
    return output_wav


def _find_latest_video(result_dir: Path) -> Optional[Path]:
    candidates = list(result_dir.rglob("*.mp4")) + list(result_dir.rglob("*.webm"))
    if not candidates:
        return None
    return max(candidates, key=lambda item: item.stat().st_mtime)


def transcode_to_browser_mp4(source_path: Path, final_path: Path) -> Path:
    final_path.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg_bin = shutil.which("ffmpeg")
    if ffmpeg_bin:
        temp_path = final_path.with_name(f"{final_path.stem}.browser{final_path.suffix}")
        if temp_path.exists():
            temp_path.unlink()
        command = [
            ffmpeg_bin,
            "-y",
            "-i",
            str(source_path),
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-c:a",
            "aac",
            "-b:a",
            "96k",
            str(temp_path),
        ]
        completed = subprocess.run(command, capture_output=True, text=True, check=False)
        if completed.returncode == 0 and temp_path.exists() and temp_path.stat().st_size > 0:
            if final_path.exists():
                final_path.unlink()
            shutil.move(str(temp_path), str(final_path))
            return final_path
        if temp_path.exists():
            temp_path.unlink()

    if source_path.resolve() != final_path.resolve():
        shutil.copy2(source_path, final_path)
    return final_path


def render_with_sadtalker(audio_wav: Path, output_dir: Path) -> Path:
    repo_dir = os.environ.get("SADTALKER_REPO_DIR", "").strip()
    if not repo_dir:
        raise RuntimeError("SADTALKER_REPO_DIR is not configured.")

    repo_path = Path(repo_dir).resolve()
    inference_py = repo_path / "inference.py"
    if not inference_py.exists():
        raise RuntimeError(f"SadTalker inference.py not found at {inference_py}.")

    avatar_image = Path(
        os.environ.get(
            "INTERVIEW_AVATAR_IMAGE",
            str(_workspace_root() / "src" / "assets" / "ai-interviewer-avatar.png"),
        )
    ).resolve()
    if not avatar_image.exists():
        raise RuntimeError(f"Avatar image not found at {avatar_image}.")

    python_bin = os.environ.get("SADTALKER_PYTHON", "python").strip() or "python"
    command = [
        python_bin,
        str(inference_py),
        "--driven_audio",
        str(audio_wav),
        "--source_image",
        str(avatar_image),
        "--result_dir",
        str(output_dir),
        "--still",
        "--preprocess",
        os.environ.get("SADTALKER_PREPROCESS", "full"),
    ]

    checkpoint_dir = os.environ.get("SADTALKER_CHECKPOINT_DIR", "").strip()
    if checkpoint_dir:
        command.extend(["--checkpoint_dir", checkpoint_dir])

    enhancer = os.environ.get("SADTALKER_ENHANCER", "gfpgan").strip()
    if enhancer:
        command.extend(["--enhancer", enhancer])

    if os.environ.get("SADTALKER_CPU", "").lower() in {"1", "true", "yes"}:
        command.extend(["--cpu"])

    timeout = int(os.environ.get("SADTALKER_TIMEOUT_SECONDS", "600"))
    completed = subprocess.run(
        command,
        cwd=str(repo_path),
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(
            "SadTalker failed with exit code "
            f"{completed.returncode}: {(completed.stderr or completed.stdout)[-1200:]}"
        )

    rendered = _find_latest_video(output_dir)
    if not rendered:
        raise RuntimeError("SadTalker completed but no mp4/webm output was found.")

    final_path = output_dir / "talking.mp4"
    return transcode_to_browser_mp4(rendered, final_path)


def create_app() -> FastAPI:
    app = FastAPI(title="OpPoReview Interview Media Service")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[origin.strip() for origin in os.environ.get("INTERVIEW_MEDIA_CORS_ORIGINS", "*").split(",")],
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    output_root = _output_root()
    output_root.mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=str(output_root)), name="media")

    @app.get("/health")
    def health():
        return {
            "status": "ok",
            "provider": "sadtalker",
            "tts_provider": "gemini",
            "sadtalker_configured": bool(os.environ.get("SADTALKER_REPO_DIR", "").strip()),
            "gemini_tts_configured": bool(os.environ.get("GEMINI_API_KEY", "").strip()),
        }

    @app.post("/render")
    def render(payload: RenderRequest, request: Request):
        question_text = payload.question_text.strip()
        if not question_text:
            raise HTTPException(
                status_code=400,
                detail={"code": "QUESTION_TEXT_REQUIRED", "message": "question_text is required."},
            )

        session_slug = _safe_slug(payload.session_id, "session")
        turn_index = max(int(payload.turn_index or 0), 0)
        media_id = f"{session_slug}_turn_{turn_index}"
        turn_dir = output_root / media_id
        turn_dir.mkdir(parents=True, exist_ok=True)
        audio_path = turn_dir / "audio.wav"
        started = time.monotonic()

        try:
            generate_gemini_tts_wav(question_text, audio_path, payload.language, payload.voice)
            video_path = render_with_sadtalker(audio_path, turn_dir)
        except Exception as error:
            return {
                "media_id": media_id,
                "status": "unavailable",
                "provider": "sadtalker",
                "tts_provider": "gemini",
                "video_url": None,
                "audio_url": f"{_base_url(request)}/media/{media_id}/audio.wav" if audio_path.exists() else None,
                "duration_ms": round((time.monotonic() - started) * 1000),
                "message": str(error),
            }

        return {
            "media_id": media_id,
            "status": "ready",
            "provider": "sadtalker",
            "tts_provider": "gemini",
            "video_url": f"{_base_url(request)}/media/{media_id}/{video_path.name}",
            "audio_url": f"{_base_url(request)}/media/{media_id}/audio.wav",
            "duration_ms": round((time.monotonic() - started) * 1000),
            "message": None,
        }

    return app


app = create_app()
