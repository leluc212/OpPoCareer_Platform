/**
 * TopSpotlightBanner
 * ─────────────────────────────────────────────────────────────────────────────
 * Carousel động cho các job đang dùng gói "Top Spotlight" — gói cao cấp nhất.
 *
 * Tính năng:
 *  • Auto-rotate 4.5s, tạm dừng khi hover / touch
 *  • Dots indicator + nút mũi tên trái/phải
 *  • Background động CSS-only đồng bộ theme app (xanh dương/tím)
 *  • Illustrated fallback: icon nghề nghiệp float + particles khi chưa có ảnh thật
 *  • Shimmer glow viền
 *  • Badge "🔥 Top Spotlight" pulse animation
 *  • Responsive desktop (260px) / mobile (170px)
 *  • Ẩn hoàn toàn khi không có job nào
 *
 * Props:
 *  jobs       — Array<job>  (filtered top-spotlight jobs)
 *  onJobClick — (jobId) => void
 *  language   — 'vi' | 'en'
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { MapPin, DollarSign, ChevronLeft, ChevronRight, Sparkles, Building2 } from 'lucide-react';

// ─── Keyframe Animations ─────────────────────────────────────────────────────

const gradientShift = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const shimmerBorder = keyframes`
  0%   { opacity: 0.5; }
  50%  { opacity: 1; }
  100% { opacity: 0.5; }
`;

const badgePulse = keyframes`
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.06); }
`;

const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
`;

// Icon float — di chuyển lên xuống nhẹ nhàng
const iconFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50%       { transform: translateY(-10px) rotate(3deg); }
`;

// Particle drift — các hạt lơ lửng
const particleDrift = keyframes`
  0%   { transform: translateY(0px) translateX(0px); opacity: 0.18; }
  33%  { transform: translateY(-18px) translateX(8px); opacity: 0.32; }
  66%  { transform: translateY(-8px) translateX(-6px); opacity: 0.22; }
  100% { transform: translateY(0px) translateX(0px); opacity: 0.18; }
`;

// Ring pulse — vòng sáng mở rộng quanh icon
const ringPulse = keyframes`
  0%   { transform: scale(0.85); opacity: 0.35; }
  50%  { transform: scale(1.2);  opacity: 0.12; }
  100% { transform: scale(0.85); opacity: 0.35; }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Wrapper = styled.div`
  position: relative;
  margin-bottom: 24px;
  border-radius: 20px;
  overflow: hidden;
  outline: 3px solid transparent;
  background-clip: padding-box;

  &::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 23px;
    background: linear-gradient(
      135deg,
      #f59e0b 0%,
      #dc2626 30%,
      #f59e0b 60%,
      #fbbf24 80%,
      #dc2626 100%
    );
    background-size: 300% 300%;
    animation: ${gradientShift} 6s ease infinite, ${shimmerBorder} 2.5s ease-in-out infinite;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 17px;
    background: transparent;
    z-index: 1;
    pointer-events: none;
  }
`;

// Nền gradient mới: xanh dương/tím đồng bộ theme app, bỏ tông tím đen như thiên hà
const Inner = styled.div`
  position: relative;
  z-index: 2;
  border-radius: 17px;
  overflow: hidden;
  height: 260px;
  cursor: pointer;
  background: linear-gradient(
    135deg,
    #0d1b4b 0%,
    #162c7a 20%,
    #1a3a8f 40%,
    #0f2460 60%,
    #1b2d6b 80%,
    #0d1b4b 100%
  );
  background-size: 400% 400%;
  animation: ${gradientShift} 12s ease infinite;

  @media (max-width: 768px) {
    height: 170px;
    animation: none;
    background: linear-gradient(135deg, #0d1b4b 0%, #162c7a 50%, #1a3a8f 100%);
  }
`;

// ─── Illustrated Fallback Background ─────────────────────────────────────────
// Hiển thị khi công ty chưa upload ảnh thật

const IllustrationLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
`;

// Các chấm/hình tròn lơ lửng — dùng nth-child để set delay khác nhau
const Particle = styled.span`
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  animation: ${particleDrift} ease-in-out infinite;

  &:nth-child(1) { width: 56px; height: 56px; top: 12%;  left: 6%;   animation-duration: 7s;  animation-delay: 0s;    }
  &:nth-child(2) { width: 32px; height: 32px; top: 60%;  left: 14%;  animation-duration: 9s;  animation-delay: 1.2s;  }
  &:nth-child(3) { width: 20px; height: 20px; top: 25%;  left: 78%;  animation-duration: 6s;  animation-delay: 0.5s;  }
  &:nth-child(4) { width: 44px; height: 44px; top: 70%;  left: 72%;  animation-duration: 11s; animation-delay: 2.3s;  }
  &:nth-child(5) { width: 14px; height: 14px; top: 45%;  left: 90%;  animation-duration: 8s;  animation-delay: 3.1s;  }
  &:nth-child(6) { width: 26px; height: 26px; top: 80%;  left: 40%;  animation-duration: 10s; animation-delay: 1.7s;  }

  @media (max-width: 768px) {
    display: none; /* tắt trên mobile để tiết kiệm CPU */
  }
`;

// Vòng sáng phía sau icon
const IconRing = styled.div`
  position: absolute;
  right: 28px;
  top: 50%;
  transform: translateY(-50%);
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: rgba(99, 179, 237, 0.15);
  animation: ${ringPulse} 3.5s ease-in-out infinite;
  z-index: 2;

  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    right: 12px;
  }
`;

// Wrapper cho icon SVG, float nhẹ
const FloatingIcon = styled.div`
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  opacity: 0.22;
  animation: ${iconFloat} 4s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 88px;
    height: 88px;
    filter: drop-shadow(0 4px 16px rgba(99, 179, 237, 0.4));
  }

  @media (max-width: 768px) {
    right: 10px;
    svg { width: 54px; height: 54px; }
  }
`;

const SlideContent = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  padding: 0 32px;
  gap: 24px;
  z-index: 5;
  animation: ${fadeSlideIn} 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;

  @media (max-width: 768px) {
    padding: 0 16px;
    gap: 14px;
    animation: none;
  }
`;

const LogoBox = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  backdrop-filter: blur(8px);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 14px;
  }

  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
    border-radius: 12px;
  }
`;

const LogoFallback = styled.div`
  font-size: 28px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const TextBlock = styled.div`
  flex: 1;
  min-width: 0;
`;

const JobTitle = styled.h2`
  font-size: 26px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 8px;
  line-height: 1.2;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 4px;
  }
`;

const CompanyName = styled.p`
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 14px;

  @media (max-width: 768px) {
    font-size: 12px;
    margin-bottom: 6px;
  }
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;

  @media (max-width: 768px) {
    gap: 8px;
    margin-bottom: 10px;
  }
`;

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);

  svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
    color: #fbbf24;
  }

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 3px 8px;
    gap: 3px;
    svg { width: 11px; height: 11px; }
  }
`;

const SalaryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  font-weight: 800;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.15);
  padding: 5px 14px;
  border-radius: 20px;
  border: 1.5px solid rgba(251, 191, 36, 0.4);

  svg {
    width: 14px;
    height: 14px;
    color: #fbbf24;
  }

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 3px 10px;
  }
`;

const ApplyButton = styled.button`
  flex-shrink: 0;
  padding: 14px 28px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  border: none;
  cursor: pointer;
  letter-spacing: 0.3px;
  box-shadow: 0 6px 24px rgba(220, 38, 38, 0.45), 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 10px 32px rgba(220, 38, 38, 0.55);
  }

  &:active {
    transform: translateY(0) scale(0.99);
  }

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 8px 16px;
    border-radius: 10px;
  }
`;

const SpotlightBadge = styled.div`
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.45);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  animation: ${badgePulse} 2.4s ease-in-out infinite;

  svg { width: 12px; height: 12px; flex-shrink: 0; }

  @media (max-width: 768px) {
    font-size: 9px;
    padding: 4px 10px;
    top: 8px;
    left: 8px;
    svg { width: 10px; height: 10px; }
  }
`;

const BottomFade = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.35) 0%, transparent 100%);
  pointer-events: none;
  z-index: 3;
`;

const DotsBar = styled.div`
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 7px;
  z-index: 10;
`;

const Dot = styled.button`
  width: ${props => props.$active ? '20px' : '8px'};
  height: 8px;
  border-radius: 4px;
  background: ${props => props.$active ? '#fff' : 'rgba(255,255,255,0.4)'};
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  &:hover { background: rgba(255, 255, 255, 0.75); }
`;

const ArrowBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${props => props.$dir === 'left' ? 'left: 14px;' : 'right: 14px;'}
  z-index: 10;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(6px);
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease, transform 0.2s ease;
  &:hover {
    background: rgba(0, 0, 0, 0.65);
    transform: translateY(-50%) scale(1.1);
  }
  svg { width: 18px; height: 18px; }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    opacity: 1;
    svg { width: 14px; height: 14px; }
  }
`;

const HoverZone = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  &:hover ${ArrowBtn} { opacity: 1; }
`;

const SlideCounter = styled.div`
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 10;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.65);
  background: rgba(0, 0, 0, 0.3);
  padding: 3px 10px;
  border-radius: 12px;
  backdrop-filter: blur(4px);

  @media (max-width: 768px) {
    font-size: 10px;
    top: 8px;
    right: 8px;
  }
`;

// ─── Icon SVG theo ngành nghề (CSS-only, không cần file) ─────────────────────

/**
 * Xác định nhóm ngành từ title/category của job
 * Trả về: 'cashier' | 'barista' | 'waiter' | 'retail' | 'general'
 */
const detectJobCategory = (title = '', category = '') => {
  const t = (title + ' ' + category).toLowerCase();
  if (/thu ngân|cashier|tính tiền|quầy/.test(t)) return 'cashier';
  if (/pha chế|barista|bartender|cà phê|cafe|coffee|pha trà|trà sữa/.test(t)) return 'barista';
  if (/phục vụ|waiter|waitress|bồi bàn|bưng bê|bếp|nấu/.test(t)) return 'waiter';
  if (/bán hàng|nhân viên cửa hàng|sales|retail|tư vấn|kho|giao hàng/.test(t)) return 'retail';
  return 'general';
};

// Icon SVG inline theo nhóm ngành
const JOB_ICONS = {
  cashier: (
    // Icon máy tính tiền / quầy thu ngân
    <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="8" y="24" width="72" height="44" rx="8" fill="white" fillOpacity="0.9"/>
      <rect x="16" y="32" width="56" height="12" rx="4" fill="#1a62ff" fillOpacity="0.6"/>
      <circle cx="26" cy="54" r="5" fill="#1a62ff" fillOpacity="0.5"/>
      <circle cx="44" cy="54" r="5" fill="#1a62ff" fillOpacity="0.5"/>
      <circle cx="62" cy="54" r="5" fill="#1a62ff" fillOpacity="0.5"/>
      <circle cx="26" cy="66" r="5" fill="#1a62ff" fillOpacity="0.5"/>
      <circle cx="44" cy="66" r="5" fill="#f59e0b" fillOpacity="0.8"/>
      <circle cx="62" cy="66" r="5" fill="#1a62ff" fillOpacity="0.5"/>
      <rect x="28" y="8" width="32" height="18" rx="4" fill="white" fillOpacity="0.7"/>
      <rect x="42" y="16" width="4" height="8" rx="2" fill="#1a62ff" fillOpacity="0.5"/>
    </svg>
  ),
  barista: (
    // Icon ly cà phê
    <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22 32 L28 72 L60 72 L66 32 Z" fill="white" fillOpacity="0.9"/>
      <ellipse cx="44" cy="32" rx="22" ry="6" fill="white" fillOpacity="0.85"/>
      <ellipse cx="44" cy="32" rx="14" ry="4" fill="#7dd3fc" fillOpacity="0.5"/>
      <path d="M66 40 Q78 40 78 50 Q78 60 66 60" stroke="white" strokeWidth="4" strokeOpacity="0.7" fill="none" strokeLinecap="round"/>
      <path d="M34 20 Q34 12 42 12" stroke="white" strokeWidth="3" strokeOpacity="0.5" fill="none" strokeLinecap="round"/>
      <path d="M44 20 Q44 12 52 12" stroke="white" strokeWidth="3" strokeOpacity="0.5" fill="none" strokeLinecap="round"/>
      <path d="M28 72 L20 80 L68 80 L60 72 Z" fill="white" fillOpacity="0.6"/>
    </svg>
  ),
  waiter: (
    // Icon khay phục vụ
    <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="44" cy="62" rx="36" ry="8" fill="white" fillOpacity="0.85"/>
      <rect x="40" y="16" width="8" height="46" rx="4" fill="white" fillOpacity="0.75"/>
      <circle cx="44" cy="44" r="4" fill="white" fillOpacity="0.9"/>
      <rect x="20" y="28" width="16" height="20" rx="6" fill="white" fillOpacity="0.7"/>
      <rect x="52" y="28" width="16" height="20" rx="6" fill="white" fillOpacity="0.7"/>
      <circle cx="28" cy="28" r="5" fill="#fbbf24" fillOpacity="0.7"/>
      <circle cx="60" cy="28" r="5" fill="#fbbf24" fillOpacity="0.7"/>
    </svg>
  ),
  retail: (
    // Icon túi mua sắm
    <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="14" y="32" width="60" height="48" rx="8" fill="white" fillOpacity="0.9"/>
      <path d="M30 32 Q30 16 44 16 Q58 16 58 32" stroke="white" strokeWidth="5" strokeOpacity="0.8" fill="none" strokeLinecap="round"/>
      <path d="M30 46 H58" stroke="#1a62ff" strokeWidth="3" strokeOpacity="0.5" strokeLinecap="round"/>
      <path d="M36 54 H52" stroke="#1a62ff" strokeWidth="3" strokeOpacity="0.4" strokeLinecap="round"/>
      <circle cx="34" cy="32" r="4" fill="white" fillOpacity="0.7"/>
      <circle cx="54" cy="32" r="4" fill="white" fillOpacity="0.7"/>
    </svg>
  ),
  general: (
    // Icon briefcase chung
    <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="10" y="32" width="68" height="48" rx="8" fill="white" fillOpacity="0.9"/>
      <path d="M30 32 L30 24 Q30 16 44 16 Q58 16 58 24 L58 32" stroke="white" strokeWidth="5" strokeOpacity="0.8" fill="none" strokeLinecap="round"/>
      <rect x="36" y="24" width="16" height="8" rx="3" fill="white" fillOpacity="0.6"/>
      <rect x="10" y="48" width="68" height="6" rx="3" fill="#7dd3fc" fillOpacity="0.35"/>
      <circle cx="44" cy="51" r="5" fill="white" fillOpacity="0.85"/>
    </svg>
  ),
};

// ─── Component ────────────────────────────────────────────────────────────────

const AUTOPLAY_DELAY = 4500; // ms

const TopSpotlightBanner = ({ jobs = [], onJobClick, language = 'vi' }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const total = jobs.length;

  useEffect(() => { setCurrent(0); }, [total]);

  const next = useCallback(() => { setCurrent(prev => (prev + 1) % total); }, [total]);
  const prev = useCallback(() => { setCurrent(prev => (prev - 1 + total) % total); }, [total]);

  useEffect(() => {
    if (paused || total <= 1) return;
    timerRef.current = setInterval(next, AUTOPLAY_DELAY);
    return () => clearInterval(timerRef.current);
  }, [paused, total, next]);

  const handleTouchStart = () => setPaused(true);
  const handleTouchEnd   = () => setPaused(false);

  if (total === 0) return null;

  const job = jobs[current];
  if (!job) return null;

  const hasRealLogo = !!job.companyLogo;
  const jobCategory = detectJobCategory(job.title, job.category);

  const handleApply = (e) => {
    e.stopPropagation();
    onJobClick && onJobClick(job.id || job.idJob);
  };

  const handleCardClick = () => {
    onJobClick && onJobClick(job.id || job.idJob);
  };

  return (
    <Wrapper>
      <Inner
        onClick={handleCardClick}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={language === 'vi' ? 'Banner Top Spotlight' : 'Top Spotlight Banner'}
      >
        <HoverZone>
          {/* Illustrated fallback — chỉ hiện khi không có ảnh thật */}
          {!hasRealLogo && (
            <IllustrationLayer aria-hidden="true">
              <Particle /><Particle /><Particle />
              <Particle /><Particle /><Particle />
              <IconRing />
              <FloatingIcon>{JOB_ICONS[jobCategory]}</FloatingIcon>
            </IllustrationLayer>
          )}

          {/* Badge Top Spotlight */}
          <SpotlightBadge>
            <Sparkles />
            Top Spotlight
          </SpotlightBadge>

          {/* Slide counter */}
          {total > 1 && (
            <SlideCounter>{current + 1} / {total}</SlideCounter>
          )}

          {/* Main content */}
          <SlideContent key={`${job.id}-${current}`}>
            {/* Logo công ty */}
            <LogoBox>
              {hasRealLogo ? (
                <img src={job.companyLogo} alt={job.company} />
              ) : (
                <LogoFallback>
                  {job.company
                    ? job.company.charAt(0).toUpperCase()
                    : <Building2 size={28} color="rgba(255,255,255,0.7)" />
                  }
                </LogoFallback>
              )}
            </LogoBox>

            {/* Text thông tin job */}
            <TextBlock>
              <JobTitle title={job.title}>{job.title}</JobTitle>
              <CompanyName>{job.company}</CompanyName>
              <MetaRow>
                {job.location && (
                  <MetaItem>
                    <MapPin />
                    {job.location}
                  </MetaItem>
                )}
                {job.salary && (
                  <SalaryBadge>
                    <DollarSign />
                    {job.salary}
                  </SalaryBadge>
                )}
              </MetaRow>
            </TextBlock>

            {/* Nút ứng tuyển */}
            <ApplyButton onClick={handleApply}>
              {language === 'vi' ? 'Ứng tuyển ngay' : 'Apply Now'}
            </ApplyButton>
          </SlideContent>

          <BottomFade />

          {total > 1 && (
            <>
              <ArrowBtn
                $dir="left"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label={language === 'vi' ? 'Slide trước' : 'Previous slide'}
              >
                <ChevronLeft />
              </ArrowBtn>
              <ArrowBtn
                $dir="right"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label={language === 'vi' ? 'Slide tiếp' : 'Next slide'}
              >
                <ChevronRight />
              </ArrowBtn>
            </>
          )}

          {total > 1 && (
            <DotsBar>
              {jobs.map((_, idx) => (
                <Dot
                  key={idx}
                  $active={idx === current}
                  onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </DotsBar>
          )}
        </HoverZone>
      </Inner>
    </Wrapper>
  );
};

export default TopSpotlightBanner;
