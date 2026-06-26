import React from 'react';
import styled from 'styled-components';
import fallbackPoster from '../assets/ai-interviewer-avatar.png';
import fallbackVideo from '../assets/ai-interviewer-demo.webm';

const StageFrame = styled.div`
  width: min(240px, 76vw);
  aspect-ratio: 3 / 4;
  border-radius: 22px;
  overflow: hidden;
  position: relative;
  background: #0f172a;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.24);
  outline: ${props => props.$isListening
    ? '3px solid rgba(239, 68, 68, 0.42)'
    : '1px solid rgba(148, 163, 184, 0.35)'};
  transition: outline-color 0.2s ease, box-shadow 0.2s ease;

  video {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    background: #0f172a;
  }

  @media (max-width: 480px) {
    width: min(210px, 72vw);
    border-radius: 18px;
  }
`;

export default function InterviewAvatarStage({
  media = null,
  turnIndex = 0,
  isListening = false,
  onPlay,
  onPause,
  onEnded,
  onError,
}) {
  const hasReadyVideo = media?.status === 'ready' && Boolean(media?.videoUrl);
  const videoUrl = hasReadyVideo ? media.videoUrl : fallbackVideo;
  const visualMode = hasReadyVideo ? 'sadtalker' : 'fallback-demo';

  return (
    <StageFrame $isListening={isListening}>
      <video
        key={`${media?.mediaId || videoUrl}-${turnIndex}`}
        src={videoUrl}
        poster={fallbackPoster}
        autoPlay
        playsInline
        controls={hasReadyVideo}
        controlsList="nodownload noplaybackrate"
        muted={!hasReadyVideo}
        loop={!hasReadyVideo}
        data-visual={visualMode}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onError={onError}
      />
    </StageFrame>
  );
}
