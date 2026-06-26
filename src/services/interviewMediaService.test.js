import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./authHeaders.js', () => ({
  getAuthHeaders: vi.fn(async () => ({
    'Content-Type': 'application/json',
    Authorization: 'Bearer test-token',
  })),
}));

const { requestInterviewMedia } = await import('./interviewMediaService.js');

describe('requestInterviewMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('posts the question to the interview media endpoint and normalizes the response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        media_id: 'media_1',
        status: 'ready',
        provider: 'sadtalker',
        tts_provider: 'gemini',
        video_url: 'https://cdn.example.com/q1.mp4',
        audio_url: 'https://cdn.example.com/q1.wav',
        duration_ms: 3200,
      }),
    });

    const result = await requestInterviewMedia({
      sessionId: 'sess_123',
      questionText: 'Xin chao ban.',
      turnIndex: 1,
      language: 'vi',
      voice: 'vi-VN',
    });

    expect(result).toMatchObject({
      mediaId: 'media_1',
      status: 'ready',
      provider: 'sadtalker',
      ttsProvider: 'gemini',
      videoUrl: 'https://cdn.example.com/q1.mp4',
      audioUrl: 'https://cdn.example.com/q1.wav',
      durationMs: 3200,
    });

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/v1/interview/media');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer test-token');
    expect(JSON.parse(options.body)).toEqual({
      session_id: 'sess_123',
      question_text: 'Xin chao ban.',
      turn_index: 1,
      language: 'vi',
      voice: 'vi-VN',
    });
  });

  it('does not call the API when question text is empty', async () => {
    const result = await requestInterviewMedia({ sessionId: 'sess_123', questionText: '   ' });

    expect(result.status).toBe('unavailable');
    expect(result.videoUrl).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns unavailable media when the backend rejects the request', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: { message: 'media service unavailable' } }),
    });

    const result = await requestInterviewMedia({
      sessionId: 'sess_123',
      questionText: 'Cau hoi tiep theo.',
      turnIndex: 2,
    });

    expect(result.status).toBe('unavailable');
    expect(result.provider).toBe('sadtalker');
    expect(result.videoUrl).toBeNull();
    expect(result.message).toBe('media service unavailable');
  });

  it('uses the direct local media service endpoint when configured', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_INTERVIEW_MEDIA_API_URL', 'http://127.0.0.1:8787');
    const { requestInterviewMedia: requestDirectMedia } = await import('./interviewMediaService.js');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        media_id: 'media_2',
        status: 'ready',
        video_url: 'http://127.0.0.1:8787/media/sess_123_turn_1/talking.mp4',
      }),
    });

    await requestDirectMedia({
      sessionId: 'sess_123',
      questionText: 'Xin chao ban.',
      turnIndex: 1,
    });

    expect(global.fetch.mock.calls[0][0]).toBe('http://127.0.0.1:8787/render');
    vi.unstubAllEnvs();
  });
});
