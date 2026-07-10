/**
 * VerticalAdBanner
 * ─────────────────────────────────────────────────────────────────────────────
 * Banner dọc cao cấp hiển thị ở cột trái trang Job Listing.
 * - Nếu có topSpotlightJobs → hiển thị card tuyển dụng dọc đẹp (carousel)
 * - Fallback → placeholder gradient với CTA "Đặt quảng cáo"
 *
 * Props:
 *   jobs        — Array<job>  top spotlight jobs
 *   onJobClick  — (jobId) => void
 *   language    — 'vi' | 'en'
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Zap, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

// ─── Animations ───────────────────────────────────────────────────────────────

const shimmerBorder = keyframes`
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
`;

const badgePulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
  50%       { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(220,38,38,0); }
`;

const floatUp = keyframes`
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
`;

const gradientMove = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

/* Wrapper: lấp đầy chiều cao SideVerticalBanner (stretch từ layout cha) */
const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  /* Không dùng sticky — banner giờ tự cao bằng cột job */
`;

/* Outer card — kéo giãn flex:1 để lấp đầy chiều cao Wrapper */
const CardOuter = styled.div`
  position: relative;
  flex: 1;                  /* chiếm hết chiều cao còn lại trong Wrapper */
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 4px 20px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  border: 1px solid rgba(251,191,36,0.18);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1);
  }
`;

/* Khung ảnh — flex:1 để lấp đầy chiều cao CardOuter còn lại sau InfoBar */
const ImageFrame = styled.div`
  position: relative;
  width: 100%;
  flex: 1;                  /* co giãn chiếm hết phần còn lại trong CardOuter */
  min-height: 200px;        /* tối thiểu để badge/dots không bị xung đột */
  overflow: hidden;
  background: #0f172a;

  @media (max-width: 1024px) {
    height: 280px;
    flex: none;
  }
`;

/* Ảnh banner — cover để fill đúng khung dọc */
const BgImg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
  transition: transform 0.5s ease;

  ${CardOuter}:hover & {
    transform: scale(1.04);
  }
`;

/* Gradient overlay đáy để badge/dots dễ đọc */
const BottomGradient = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 45%;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
  pointer-events: none;
  z-index: 2;
`;

/* Badge góc trên trái — nền tối mờ, không animation */
const Badge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0,0,0,0.52);
  backdrop-filter: blur(6px);
  color: rgba(255,255,255,0.92);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 20px;
  pointer-events: none;
  border: 1px solid rgba(255,255,255,0.15);

  svg { width: 10px; height: 10px; }
`;

/* Counter góc trên phải — ẩn đi, thay bằng dots ở dưới */
const Counter = styled.div`
  display: none;
`;

/* Phần info text bên dưới ảnh — nền solid tối, không đè lên ảnh */
const InfoBar = styled.div`
  background: #0f172a;
  border-radius: 0;
  padding: 12px 14px 14px;
`;

const JobTitleText = styled.div`
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  line-height: 1.35;
  margin-bottom: 5px;
  text-shadow: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CompanyText = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.65);
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
`;

const MetaBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.18);
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;

  svg { width: 10px; height: 10px; color: #fbbf24; flex-shrink: 0; }
`;

const SalaryText = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: #fbbf24;
  margin-bottom: 10px;
`;

const ApplyBtn = styled.button`
  width: 100%;
  padding: 9px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-shadow: 0 4px 14px rgba(239,68,68,0.4);
  transition: opacity 0.2s ease, transform 0.2s ease;
  letter-spacing: 0.3px;

  svg { width: 13px; height: 13px; }

  &:hover { opacity: 0.92; transform: translateY(-1px); }
`;

/* Dots overlay — đặt trực tiếp trên ảnh ở đáy */
const DotsOverlay = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  z-index: 10;
  pointer-events: auto;
`;

const Dot = styled.button`
  width: ${p => p.$active ? '18px' : '7px'};
  height: 7px;
  border-radius: 4px;
  background: ${p => p.$active ? '#fff' : 'rgba(255,255,255,0.4)'};
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  &:hover { background: rgba(255,255,255,0.75); }
`;

/* Mũi tên lên / xuống */
const NavBtn = styled.button`
  width: 100%;
  height: 26px;
  border-radius: 8px;
  background: ${p => p.theme?.colors?.bgLight || '#f1f5f9'};
  border: 1px solid ${p => p.theme?.colors?.border || '#e2e8f0'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
  color: #64748b;

  svg { width: 14px; height: 14px; }

  &:hover { background: #e2e8f0; }
`;

/* ─── Placeholder khi chưa có job ─── */
const PlaceholderCard = styled.div`
  border-radius: 14px;
  overflow: hidden;
  flex: 1;                  /* lấp đầy chiều cao Wrapper, không cố định */
  min-height: 300px;
  background: linear-gradient(160deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  background-size: 200% 200%;
  animation: ${gradientMove} 6s ease infinite;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 20px;
  text-align: center;
  cursor: default;
`;

const PlaceholderIcon = styled.div`
  font-size: 48px;
  animation: ${floatUp} 3s ease-in-out infinite;
`;

const PlaceholderTitle = styled.div`
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  line-height: 1.4;
`;

const PlaceholderSub = styled.div`
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  line-height: 1.5;
`;

const PlaceholderBtn = styled.button`
  margin-top: 6px;
  padding: 9px 18px;
  border-radius: 20px;
  background: rgba(255,255,255,0.2);
  border: 1.5px solid rgba(255,255,255,0.5);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
  backdrop-filter: blur(4px);

  &:hover { background: rgba(255,255,255,0.3); }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getJobBg = (job) => job?.bannerUrl || job?.companyBanner || null;

// ─── Component ────────────────────────────────────────────────────────────────

const AUTOPLAY = 5000;

const VerticalAdBanner = ({ jobs = [], banners = [], onJobClick, language = 'vi' }) => {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  // ── [DEBUG] Đo kích thước thực tế sau khi mount (stretch mode) ──
  useEffect(() => {
    const frame = document.querySelector('.banner-ad-image-frame');
    const wrapper = document.querySelector('.banner-ad-wrapper');
    if (frame && wrapper) {
      console.log('[VERIFY-STRETCH] Banner kích thước thực tế:',
        { wrapperH: wrapper.getBoundingClientRect().height,
          imageFrameH: frame.getBoundingClientRect().height });
    }
  }, []);

  // Nếu không có jobs → dùng banners ảnh
  const useImageMode = jobs.length === 0 && banners.length > 0;
  const total = useImageMode ? banners.length : jobs.length;

  const next = useCallback(() => setIdx(p => (p + 1) % total), [total]);
  const prev = useCallback(() => setIdx(p => (p - 1 + total) % total), [total]);

  useEffect(() => { setIdx(0); }, [total]);

  useEffect(() => {
    if (paused || total <= 1) return;
    timer.current = setInterval(next, AUTOPLAY);
    return () => clearInterval(timer.current);
  }, [paused, total, next]);

  // ── Mode: hiển thị ảnh banner thuần (không có jobs) ──
  if (useImageMode) {
    const banner = banners[idx];
    return (
      <Wrapper
        className="banner-ad-wrapper"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <CardOuter
          onClick={() => { if (banner?.linkUrl) window.open(banner.linkUrl, '_blank', 'noopener,noreferrer'); }}
          style={{ cursor: banner?.linkUrl ? 'pointer' : 'default' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}
            >
              {/* Khung dọc — lấp đầy chiều cao card (stretch từ SideVerticalBanner) */}
              <ImageFrame className="banner-ad-image-frame">
                <BgImg
                  src={banner.src}
                  alt={banner.alt || 'Banner quảng cáo'}
                />
                <BottomGradient />
                <Badge>Quảng cáo</Badge>

                {total > 1 && (
                  <DotsOverlay>
                    {banners.map((_, i) => (
                      <Dot
                        key={i}
                        $active={i === idx}
                        onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </DotsOverlay>
                )}
              </ImageFrame>
            </motion.div>
          </AnimatePresence>
        </CardOuter>
      </Wrapper>
    );
  }

  // ── Placeholder nếu không có gì ──
  if (total === 0) {
    return (
      <Wrapper className="banner-ad-wrapper">
        <PlaceholderCard>
          <PlaceholderIcon>📢</PlaceholderIcon>
          <PlaceholderTitle>Quảng cáo<br />tuyển dụng dọc</PlaceholderTitle>
          <PlaceholderSub>Vị trí banner cao cấp<br />tiếp cận ứng viên hiệu quả</PlaceholderSub>
          <PlaceholderBtn>Liên hệ đặt quảng cáo</PlaceholderBtn>
        </PlaceholderCard>
      </Wrapper>
    );
  }

  // ── Mode: job Top Spotlight ──
  const job = jobs[idx];
  if (!job) return null;

  const bg = getJobBg(job);

  return (
    <Wrapper
      className="banner-ad-wrapper"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Nút lên — chỉ hiện khi có nhiều job */}
      {total > 1 && (
        <NavBtn onClick={prev} title="Job trước">
          <ChevronUp />
        </NavBtn>
      )}

      <CardOuter onClick={() => onJobClick?.(job.id || job.idJob)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={job.id || idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}
          >
            {/* Khung ảnh dọc — stretch theo chiều cao CardOuter */}
            <ImageFrame className="banner-ad-image-frame">
              {bg ? (
                <BgImg src={bg} alt={job.company} />
              ) : (
                /* Gradient fallback + logo */
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(160deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {job.companyLogo && (
                    <img
                      src={job.companyLogo}
                      alt={job.company}
                      style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 12, opacity: 0.9 }}
                    />
                  )}
                </div>
              )}

              <BottomGradient />

              {/* Badge "Top Spotlight" góc trên trái */}
              <Badge>
                <Sparkles />
                Top Spotlight
              </Badge>

              {/* Dots overlay ở đáy ảnh */}
              {total > 1 && (
                <DotsOverlay>
                  {jobs.map((_, i) => (
                    <Dot
                      key={i}
                      $active={i === idx}
                      onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </DotsOverlay>
              )}
            </ImageFrame>

            {/* ── Info bar bên dưới ảnh ── */}
            <InfoBar>
              <JobTitleText title={job.title}>{job.title}</JobTitleText>
              <CompanyText>{job.company}</CompanyText>

              <MetaRow>
                {job.location && (
                  <MetaBadge>
                    <MapPin />
                    {job.location}
                  </MetaBadge>
                )}
              </MetaRow>

              {job.salary && <SalaryText>{job.salary}</SalaryText>}

              <ApplyBtn
                onClick={(e) => {
                  e.stopPropagation();
                  onJobClick?.(job.id || job.idJob);
                }}
              >
                <Zap />
                {language === 'vi' ? 'Ứng tuyển ngay' : 'Apply Now'}
              </ApplyBtn>
            </InfoBar>
          </motion.div>
        </AnimatePresence>
      </CardOuter>

      {/* Nút xuống */}
      {total > 1 && (
        <NavBtn onClick={next} title="Job tiếp">
          <ChevronDown />
        </NavBtn>
      )}
    </Wrapper>
  );
};

export default VerticalAdBanner;
