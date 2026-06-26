import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

describe('InterviewAvatarStage', () => {
  it('renders a local AI interviewer demo video when SadTalker media is unavailable', async () => {
    const { default: InterviewAvatarStage } = await import('./InterviewAvatarStage.jsx');

    const html = renderToStaticMarkup(
      <InterviewAvatarStage
        media={{ status: 'unavailable', videoUrl: null }}
        turnIndex={1}
        isSpeaking={false}
        isListening={false}
        isPreparing={false}
      />,
    );

    expect(html).toContain('<video');
    expect(html).toContain('data-visual="fallback-demo"');
    expect(html).toContain('muted=""');
    expect(html).toContain('loop=""');
  });

  it('renders the SadTalker video when the media response is ready', async () => {
    const { default: InterviewAvatarStage } = await import('./InterviewAvatarStage.jsx');

    const html = renderToStaticMarkup(
      <InterviewAvatarStage
        media={{
          mediaId: 'media_1',
          status: 'ready',
          videoUrl: 'https://cdn.example.com/interview/q1.mp4',
        }}
        turnIndex={1}
        isSpeaking={false}
        isListening={false}
        isPreparing={false}
      />,
    );

    expect(html).toContain('<video');
    expect(html).toContain('src="https://cdn.example.com/interview/q1.mp4"');
    expect(html).not.toContain('<img');
  });
});
