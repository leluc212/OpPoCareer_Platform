import base64
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

import app


class InterviewMediaServiceTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app.create_app())

    def test_render_rejects_empty_question_text(self):
        response = self.client.post("/render", json={"session_id": "sess_1", "question_text": ""})

        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertEqual(body["detail"]["code"], "QUESTION_TEXT_REQUIRED")

    @patch("app.generate_gemini_tts_wav")
    @patch("app.render_with_sadtalker")
    def test_render_returns_ready_media_when_sadtalker_outputs_video(self, mock_render, mock_tts):
        with tempfile.TemporaryDirectory() as temp_dir:
            media_root = Path(temp_dir)
            fake_audio = media_root / "audio.wav"
            fake_video = media_root / "talking.mp4"
            fake_audio.write_bytes(b"RIFF....WAVEfmt ")
            fake_video.write_bytes(b"fake mp4")
            mock_tts.return_value = fake_audio
            mock_render.return_value = fake_video

            with patch.dict(os.environ, {"INTERVIEW_MEDIA_OUTPUT_DIR": str(media_root)}, clear=False):
                response = self.client.post("/render", json={
                    "session_id": "sess_1",
                    "question_text": "Xin chao ban.",
                    "turn_index": 2,
                    "language": "vi",
                    "voice": "Kore",
                })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "ready")
        self.assertEqual(body["provider"], "sadtalker")
        self.assertEqual(body["tts_provider"], "gemini")
        self.assertTrue(body["video_url"].endswith("/media/sess_1_turn_2/talking.mp4"))
        self.assertTrue(body["audio_url"].endswith("/media/sess_1_turn_2/audio.wav"))
        mock_tts.assert_called_once()
        mock_render.assert_called_once()

    def test_wrap_pcm_as_wav_creates_valid_wave_file(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            out_path = Path(temp_dir) / "out.wav"
            app.write_pcm_wav(out_path, b"\x00\x00\x01\x00")

            data = out_path.read_bytes()

        self.assertTrue(data.startswith(b"RIFF"))
        self.assertIn(b"WAVE", data[:16])

    @patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}, clear=False)
    @patch("app.requests.post")
    def test_gemini_tts_uses_natural_language_style_prompt(self, mock_post):
        class FakeResponse:
            status_code = 200

            def json(self):
                audio = base64.b64encode(b"\x00\x00\x01\x00").decode("ascii")
                return {"candidates": [{"content": {"parts": [{"inlineData": {"data": audio}}]}}]}

        mock_post.return_value = FakeResponse()

        with tempfile.TemporaryDirectory() as temp_dir:
            app.generate_gemini_tts_wav("Xin chao.", Path(temp_dir) / "audio.wav", "vi", "Kore")

        payload = json.loads(mock_post.call_args.kwargs["data"])
        prompt = payload["contents"][0]["parts"][0]["text"]
        self.assertFalse(prompt.startswith("["))
        self.assertIn("giọng phỏng vấn viên", prompt)
        self.assertIn("Xin chao.", prompt)

    @patch("app.shutil.which", return_value="ffmpeg")
    @patch("app.subprocess.run")
    def test_transcode_to_browser_mp4_uses_h264_aac(self, mock_run, _mock_which):
        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "sadtalker.mp4"
            final_path = Path(temp_dir) / "talking.mp4"
            source_path.write_bytes(b"raw mp4v")

            def fake_run(command, **_kwargs):
                temp_output = Path(command[-1])
                temp_output.write_bytes(b"browser mp4")
                return subprocess.CompletedProcess(command, 0, stdout="", stderr="")

            import subprocess

            mock_run.side_effect = fake_run

            self.assertTrue(hasattr(app, "transcode_to_browser_mp4"), "transcode_to_browser_mp4 should exist")
            result = app.transcode_to_browser_mp4(source_path, final_path)
            final_data = final_path.read_bytes()

        self.assertEqual(result, final_path)
        self.assertEqual(final_data, b"browser mp4")
        command = mock_run.call_args.args[0]
        self.assertIn("libx264", command)
        self.assertIn("aac", command)
        self.assertIn("+faststart", command)


if __name__ == "__main__":
    unittest.main()
