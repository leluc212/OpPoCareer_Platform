import { getAuthHeaders } from './authHeaders.js';

const API_BASE_URL = (import.meta.env.VITE_CV_AI_API_URL || '/api-cv-ai').replace(/\/$/, '');
const DIRECT_MEDIA_API_BASE_URL = (import.meta.env.VITE_INTERVIEW_MEDIA_API_URL || '').replace(/\/$/, '');

const unavailableMedia = (message = 'Interview media is unavailable.') => ({
  mediaId: null,
  status: 'unavailable',
  provider: 'sadtalker',
  ttsProvider: 'gemini',
  videoUrl: null,
  audioUrl: null,
  durationMs: null,
  message,
});

const normalizeInterviewMedia = (payload = {}) => ({
  mediaId: payload.media_id || payload.mediaId || null,
  status: payload.status || (payload.video_url || payload.videoUrl ? 'ready' : 'unavailable'),
  provider: payload.provider || 'sadtalker',
  ttsProvider: payload.tts_provider || payload.ttsProvider || 'gemini',
  videoUrl: payload.video_url || payload.videoUrl || null,
  audioUrl: payload.audio_url || payload.audioUrl || null,
  durationMs: payload.duration_ms || payload.durationMs || null,
  message: payload.message || '',
});

export async function requestInterviewMedia({
  sessionId = '',
  questionText = '',
  turnIndex = 0,
  language = 'vi',
  voice = '',
} = {}) {
  const trimmedQuestion = String(questionText || '').trim();
  if (!trimmedQuestion) {
    return unavailableMedia('question_text is required.');
  }

  try {
    const headers = await getAuthHeaders();
    const endpoint = DIRECT_MEDIA_API_BASE_URL
      ? `${DIRECT_MEDIA_API_BASE_URL}/render`
      : `${API_BASE_URL}/api/v1/interview/media`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        session_id: sessionId || '',
        question_text: trimmedQuestion,
        turn_index: turnIndex,
        language,
        voice,
      }),
      mode: 'cors',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return unavailableMedia(errorBody?.error?.message || `Interview media request failed with HTTP ${response.status}.`);
    }

    const payload = await response.json();
    return normalizeInterviewMedia(payload);
  } catch (error) {
    console.warn('[interviewMediaService] media fallback:', error?.message || error);
    return unavailableMedia(error?.message || 'Interview media request failed.');
  }
}

export default {
  requestInterviewMedia,
};
