/**
 * VerticalJobBanner
 * ─────────────────────────────────────────────────────────────────────────────
 * Banner dọc cao cấp cho job Top Spotlight — bố cục giống banner "Phúc Lộc Thọ".
 * Dùng chung ở cả trang chủ (/candidate/dashboard) và trang danh sách job
 * (/candidate/jobs?tab=standard).
 *
 * Bố cục:
 *  ┌─────────────────────┐
 *  │  🏪 [Logo công ty]   │
 *  │  TUYỂN DỤNG          │  ← badge nổi bật
 *  │  NHÂN VIÊN           │  ← tên vị trí, font lớn, đậm, trắng
 *  │  THU NGÂN            │
 *  │  Chi nhánh / Cty     │  ← tên chi nhánh
 *  │  💰 Lương hấp dẫn    │  ← điểm nổi bật
 *  │  🕐 Ca làm linh hoạt │
 *  │  ❤️ Môi trường       │
 *  │  [ỨNG TUYỂN NGAY →] │  ← nút CTA nổi bật
 *  │  [Ảnh minh hoạ]     │  ← phía dưới cùng
 *  └─────────────────────┘
 *
 * Props:
 *   jobs        — Array<job>  top spotlight jobs
 *   onJobClick  — (jobId) => void
 *   language    — 'vi' | 'en'
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, DollarSign, Clock, Heart, Sparkles, Zap,
  ChevronUp, ChevronDown, Briefcase
} from 'lucide-react';

// ─── Animations ───────────────────────────────────────────────────────────────

const badgePulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
  50%       { transform: scale(1.04); box-shadow: 0 0 0 6px rgba(220,38,38,0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate default highlights for a job based on available data
 */
const getJobHighlights = (job, language = 'vi') => {
  if (job.highlights && job.highlights.length > 0) return job.highlights;

  const highlights = [];
  const isVi = language === 'vi';

  if (job.salary && job.salary !== 'Thỏa thuận' && job.salary !== 'Negotiable') {
    highlights.push({
      icon: 'salary',
      text: job.salary
    });
  } else {
    highlights.push({
      icon: 'salary',
      text: isVi ? 'Lương hấp dẫn' : 'Attractive salary'
    });
  }

  if (job.workHours || job.type) {
    highlights.push({
      icon: 'clock',
      text: job.workHours || (isVi ? 'Ca làm linh hoạt' : 'Flexible schedule')
    });
  } else {
    highlights.push({
      icon: 'clock',
      text: isVi ? 'Ca làm linh hoạt' : 'Flexible schedule'
    });
  }

  highlights.push({
    icon: 'heart',
    text: isVi ? 'Môi trường thân thiện' : 'Friendly environment'
  });

  return highlights;
};

const HIGHLIGHT_ICONS = {
  salary: DollarSign,
  clock: Clock,
  heart: Heart,
  location: MapPin,
  default: Sparkles
};

// ─── Styled Components ────────────────────────────────────────────────────────

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const CardOuter = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

/* Phần nội dung text — nền đậm solid, chiếm phần trên */
const ContentSection = styled.div`
  background: ${props => props.$themeColor || '#8B1E1E'};
  padding: 20px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 2;
`;

/* Logo công ty */
const LogoWrap = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  backdrop-filter: blur(4px);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }
`;

const LogoFallback = styled.div`
  font-size: 18px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.9);
`;

/* Badge "TUYỂN DỤNG" */
const RecruitBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 20px;
  box-shadow: 0 3px 12px rgba(220, 38, 38, 0.4);
  animation: ${badgePulse} 2.8s ease-in-out infinite;
  width: fit-content;

  svg { width: 11px; height: 11px; }
`;

/* Tên vị trí — lớn, đậm, trắng */
const JobTitleLarge = styled.h3`
  font-size: 17px;
  font-weight: 900;
  color: #fff;
  line-height: 1.3;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/* Tên chi nhánh / công ty */
const BranchName = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 12px;
    height: 12px;
    color: rgba(255, 255, 255, 0.6);
    flex-shrink: 0;
  }
`;

/* Danh sách điểm nổi bật */
const HighlightList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
`;

const HighlightItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.3;

  svg {
    width: 14px;
    height: 14px;
    color: #fbbf24;
    flex-shrink: 0;
  }
`;

/* Nút CTA "ỨNG TUYỂN NGAY" */
const ApplyButton = styled.button`
  width: 100%;
  padding: 10px 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #1a1a1a;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-top: 6px;

  svg { width: 14px; height: 14px; }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(251, 191, 36, 0.5);
  }
`;

/* Phần ảnh minh hoạ — cố định ở dưới cùng */
const ImageSection = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 140px;
  overflow: hidden;
  background: #111;
`;

const BannerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  position: absolute;
  inset: 0;
  transition: transform 0.5s ease;

  ${CardOuter}:hover & {
    transform: scale(1.04);
  }
`;

/* Gradient nối giữa content và ảnh — mượt hơn */
const ImageTopGradient = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to bottom, ${props => props.$themeColor || '#8B1E1E'} 0%, transparent 100%);
  z-index: 1;
  pointer-events: none;
`;

/* Fallback khi không có ảnh */
const ImageFallback = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, ${props => props.$themeColor || '#8B1E1E'} 0%, #0f172a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;

  svg {
    width: 48px;
    height: 48px;
    color: rgba(255, 255, 255, 0.15);
  }
`;

/* Slide counter / dots */
const DotsBar = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  z-index: 10;
`;

const Dot = styled.button`
  width: ${p => p.$active ? '16px' : '6px'};
  height: 6px;
  border-radius: 3px;
  background: ${p => p.$active ? '#fff' : 'rgba(255,255,255,0.4)'};
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  &:hover { background: rgba(255, 255, 255, 0.75); }
`;

/* Nav buttons */
const NavBtn = styled.button`
  width: 100%;
  height: 26px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
  color: #94a3b8;
  margin: 4px 0;

  svg { width: 14px; height: 14px; }

  &:hover { background: rgba(255, 255, 255, 0.12); }
`;

/* Badge "Top Spotlight" góc trên phải */
const SpotlightTag = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  color: #fbbf24;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid rgba(251, 191, 36, 0.3);

  svg { width: 9px; height: 9px; }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const AUTOPLAY = 5000;

const VerticalJobBanner = ({ jobs = [], onJobClick, language = 'vi' }) => {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  const total = jobs.length;

  const next = useCallback(() => setIdx(p => (p + 1) % total), [total]);
  const prev = useCallback(() => setIdx(p => (p - 1 + total) % total), [total]);

  useEffect(() => { setIdx(0); }, [total]);

  useEffect(() => {
    if (paused || total <= 1) return;
    timer.current = setInterval(next, AUTOPLAY);
    return () => clearInterval(timer.current);
  }, [paused, total, next]);

  if (total === 0) return null;

  const job = jobs[idx];
  if (!job) return null;

  const themeColor = job.brandColor || job.themeColor || '#8B1E1E';
  const highlights = getJobHighlights(job, language);
  const bannerImage = job.bannerUrl || job.companyBanner || null;
  const branchName = job.branchName || job.company || '';

  const handleApply = (e) => {
    e.stopPropagation();
    onJobClick?.(job.id || job.idJob);
  };

  return (
    <Wrapper
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {total > 1 && (
        <NavBtn onClick={prev} title="Job trước">
          <ChevronUp />
        </NavBtn>
      )}

      <CardOuter onClick={() => onJobClick?.(job.id || job.idJob)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={job.id || job.idJob || idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}
          >
            {/* ── Phần content: Logo → Badge → Title → Branch → Highlights → CTA ── */}
            <ContentSection $themeColor={themeColor}>
              {/* Top Spotlight tag */}
              <SpotlightTag>
                <Sparkles />
                Top Spotlight
              </SpotlightTag>

              {/* Logo công ty */}
              <LogoWrap>
                {job.companyLogo ? (
                  <img src={job.companyLogo} alt={job.company} />
                ) : (
                  <LogoFallback>
                    {job.company ? job.company.charAt(0).toUpperCase() : '?'}
                  </LogoFallback>
                )}
              </LogoWrap>

              {/* Badge TUYỂN DỤNG */}
              <RecruitBadge>
                <Sparkles />
                {language === 'vi' ? 'TUYỂN DỤNG' : 'HIRING'}
              </RecruitBadge>

              {/* Tên vị trí */}
              <JobTitleLarge>{job.title}</JobTitleLarge>

              {/* Tên chi nhánh / công ty */}
              <BranchName>
                <MapPin />
                {branchName}
              </BranchName>

              {/* Điểm nổi bật */}
              <HighlightList>
                {highlights.slice(0, 3).map((item, i) => {
                  const IconComp = HIGHLIGHT_ICONS[item.icon] || HIGHLIGHT_ICONS.default;
                  return (
                    <HighlightItem key={i}>
                      <IconComp />
                      {item.text}
                    </HighlightItem>
                  );
                })}
              </HighlightList>

              {/* Nút ỨNG TUYỂN NGAY */}
              <ApplyButton onClick={handleApply}>
                <Zap />
                {language === 'vi' ? 'ỨNG TUYỂN NGAY' : 'APPLY NOW'}
              </ApplyButton>
            </ContentSection>

            {/* ── Phần ảnh minh hoạ — phía dưới cùng ── */}
            <ImageSection>
              <ImageTopGradient $themeColor={themeColor} />
              {bannerImage ? (
                <BannerImage src={bannerImage} alt={job.company} />
              ) : (
                <ImageFallback $themeColor={themeColor}>
                  <Briefcase />
                </ImageFallback>
              )}

              {/* Dots */}
              {total > 1 && (
                <DotsBar>
                  {jobs.map((_, i) => (
                    <Dot
                      key={i}
                      $active={i === idx}
                      onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </DotsBar>
              )}
            </ImageSection>
          </motion.div>
        </AnimatePresence>
      </CardOuter>

      {total > 1 && (
        <NavBtn onClick={next} title="Job tiếp">
          <ChevronDown />
        </NavBtn>
      )}
    </Wrapper>
  );
};

export default VerticalJobBanner;
