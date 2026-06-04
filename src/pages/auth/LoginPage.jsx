import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { s3Images } from '../../utils/s3Images';

/* ═══════════════════════════════════════════════════
   KEYFRAMES
═══════════════════════════════════════════════════ */
const gradShift = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const orbDrift = keyframes`
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(28px,-28px) scale(1.06); }
  66%      { transform: translate(-18px,16px) scale(0.95); }
`;
const scanY = keyframes`
  0%   { top: 0; opacity: 0.7; }
  100% { top: 100%; opacity: 0; }
`;
const twinkle = keyframes`
  0%,100% { opacity:0.2; transform:scale(0.85) rotate(0deg); }
  50%      { opacity:1;   transform:scale(1.2) rotate(15deg); }
`;
const roleSlide = keyframes`
  from { opacity:0; transform: translateY(8px); }
  to   { opacity:1; transform: translateY(0); }
`;
const btnPulse = keyframes`
  0%,100% { box-shadow: 0 0 0 0 rgba(14,57,149,0.4); }
  50%      { box-shadow: 0 0 0 10px rgba(14,57,149,0); }
`;

/* Icon paths inline */
const IcoMail = () => <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const IcoLock = () => <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const IcoEye = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const IcoEyeOff = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>;
const IcoArrow = () => <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>;

/* role config */
const ROLES = {
  candidate: {
    label: '',  // filled from translation
    color: '#2563eb',
    grad: 'linear-gradient(135deg, #0E3995, #2563eb, #3b82f6)',
    bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    hero: {
      eyebrow: { vi: 'Chào mừng ứng viên', en: 'Welcome Candidate' },
      h1: { vi: ['Tìm việc', 'part-time', 'lý tưởng'], en: ['Find your', 'ideal', 'part-time job'] },
      grad: ['#93c5fd', '#c4b5fd', '#fbcfe8'],
      sub: { vi: 'Đăng nhập để nhận gợi ý việc làm cá nhân hoá, theo dõi đơn ứng tuyển và kết nối với nhà tuyển dụng.', en: 'Sign in to get personalized job recommendations, track your applications and connect with employers.' },
      features: {
        vi: ['Hàng ngàn việc làm part-time đang chờ', 'Ứng tuyển 1-click — không cần CV rườm rà', 'Theo dõi tiến trình ứng tuyển dễ dàng'],
        en: ['Thousands of part-time jobs waiting', 'Apply with 1-click — no lengthy CV needed', 'Track your application progress easily'],
      },
      stats: [{ n: '50K+', l: { vi: 'Ứng viên', en: 'Candidates' } }, { n: '12K+', l: { vi: 'Việc làm', en: 'Jobs' } }, { n: '98%', l: { vi: 'Hài lòng', en: 'Satisfied' } }],
    },
  },
  employer: {
    label: '',
    color: '#2563eb',
    grad: 'linear-gradient(135deg, #0E3995, #2563eb, #3b82f6)',
    bg: 'linear-gradient(135deg, #f0f4ff, #dbeafe)',
    hero: {
      eyebrow: { vi: 'Chào mừng nhà tuyển dụng', en: 'Welcome Employer' },
      h1: { vi: ['Tuyển dụng', 'nhanh hơn', 'thông minh hơn'], en: ['Hire talent', 'faster and', 'smarter'] },
      grad: ['#60a5fa', '#a5f3fc', '#bfdbfe'],
      sub: { vi: 'Đăng nhập vào dashboard quản lý — xem hồ sơ ứng viên, đăng tin tuyển dụng và phân tích chiến dịch ngay.', en: 'Sign in to your management dashboard — view candidate profiles, post jobs and analyze campaigns.' },
      features: {
        vi: ['Quản lý tin tuyển dụng tập trung', 'AI gợi ý ứng viên phù hợp nhất', 'Báo cáo & phân tích chiến dịch chi tiết'],
        en: ['Centralized job management', 'AI suggests the best matching candidates', 'Detailed campaign reports & analytics'],
      },
      stats: [{ n: '8K+', l: { vi: 'Doanh nghiệp', en: 'Companies' } }, { n: '200K+', l: { vi: 'Hồ sơ', en: 'Profiles' } }, { n: '4.9⭐', l: { vi: 'Đánh giá', en: 'Rating' } }],
    },
  },
  admin: {
    label: '',
    color: '#2563eb',
    grad: 'linear-gradient(135deg, #0E3995, #2563eb, #3b82f6)',
    bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
    hero: {
      eyebrow: { vi: 'Khu vực quản trị', en: 'Admin Area' },
      h1: { vi: ['Quản trị', 'hệ thống', 'toàn diện'], en: ['Manage the', 'system', 'completely'] },
      grad: ['#c4b5fd', '#f9a8d4', '#fde68a'],
      sub: { vi: 'Truy cập bảng điều khiển quản trị với toàn quyền kiểm soát người dùng, phê duyệt và phân tích nền tảng.', en: 'Access the admin dashboard with full control over users, approvals and platform analytics.' },
      features: {
        vi: ['Quản lý toàn bộ người dùng & doanh nghiệp', 'Phê duyệt nhà tuyển dụng & nội dung', 'Analytics & báo cáo doanh thu nền tảng'],
        en: ['Manage all users & companies', 'Approve employers & content', 'Analytics & platform revenue reports'],
      },
      stats: [{ n: '58K+', l: { vi: 'Users', en: 'Users' } }, { n: '8K+', l: { vi: 'Companies', en: 'Companies' } }, { n: '99.9%', l: { vi: 'Uptime', en: 'Uptime' } }],
    },
  },
};

/* ═══════════════════════════════════════════════════
   STYLED COMPONENTS
═══════════════════════════════════════════════════ */
const Root = styled.div`
  min-height: 100vh;
  display: flex;
  background: #f0f4ff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  color-scheme: light;

  * {
    font-family: inherit !important;
  }
  position: relative;
`;

/* ── LEFT PANEL ── */
const Left = styled(motion.div)`
  width: 47%;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: ${p => p.$grad};
  background-size: 220% 220%;
  animation: ${gradShift} 10s ease infinite;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 56px 52px;
  overflow: hidden;
  transition: background 0.6s ease;

  @media (max-width: 960px) { display: none; }
`;

const DotGrid = styled.div`
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.11) 1px, transparent 1px);
  background-size: 26px 26px;
  pointer-events: none;
`;

const Orb = styled.div`
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, ${p => p.$c} 0%, transparent 70%);
  width: ${p => p.$s}px; height: ${p => p.$s}px;
  top: ${p => p.$t || 'auto'}; left: ${p => p.$l || 'auto'};
  right: ${p => p.$r || 'auto'}; bottom: ${p => p.$b || 'auto'};
  animation: ${orbDrift} ${p => p.$dur}s ease-in-out infinite;
  animation-delay: ${p => p.$d || 0}s;
  pointer-events: none;
  filter: blur(${p => p.$blur || 0}px);
`;

const Scan = styled.div`
  position: absolute; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: ${scanY} 8s linear infinite;
  pointer-events: none;
`;

const Star = styled.div`
  position: absolute;
  color: rgba(255,255,255,0.75);
  font-size: ${p => p.$s || 14}px;
  top: ${p => p.$t}; left: ${p => p.$l};
  animation: ${twinkle} ${p => p.$dur || 3}s ease-in-out infinite;
  animation-delay: ${p => p.$d || 0}s;
  pointer-events: none;
`;

const BrandRow = styled.div`
  display: inline-flex;
  align-self: flex-start;
  align-items: center; justify-content: center;
  background: #ffffff;
  padding: 10px 24px;
  border-radius: 16px;
  margin-bottom: 44px; position: relative; z-index: 2;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
`;
const BrandImg = styled.img`
  height: 48px;
  object-fit: contain;
`;
const BrandTxt = styled.span`
  display: none;
`;

const HeroWrap = styled.div`
  position: relative; z-index: 2;
`;

const Eyebrow = styled.div`
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 999px; padding: 6px 14px;
  font-size: 11.5px; font-weight: 700;
  color: rgba(255,255,255,0.88);
  text-transform: uppercase; letter-spacing: 0.8px;
  margin-bottom: 20px;
`;

const HeroH1 = styled.h1`
  font-size: clamp(30px, 3.2vw, 44px);
  font-weight: 900; letter-spacing: -1.5px; line-height: 1.35;
  padding: 8px 0;
  color: #fff; margin-top: 16px; margin-bottom: 16px;

  .g {
    display: inline-block;
    background: linear-gradient(90deg, ${p => p.$c1}, ${p => p.$c2}, ${p => p.$c3}, ${p => p.$c1});
    background-size: 300%;
    animation: ${gradShift} 5s ease infinite;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    padding-top: 12px;
    padding-bottom: 6px;
  }
`;

const HeroSub = styled.p`
  font-size: 14.5px; color: rgba(255,255,255,0.66);
  line-height: 1.75; max-width: 370px; margin-bottom: 32px;
`;

const FeatureList = styled.ul`
  list-style: none; padding: 0; margin: 0 0 36px;
  display: flex; flex-direction: column; gap: 13px;
`;
const FItem = styled.li`
  display: flex; align-items: center; gap: 11px;
  font-size: 14px; color: rgba(255,255,255,0.88); font-weight: 500;
  &::before {
    content: '✓';
    width: 22px; height: 22px; border-radius: 7px;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: #fff;
    flex-shrink: 0;
  }
`;

const StatsRow = styled.div`
  display: flex; gap: 0;
  border-top: 1px solid rgba(255,255,255,0.12);
  padding-top: 28px;
`;
const Stat = styled.div`
  flex: 1; text-align: center;
  border-right: 1px solid rgba(255,255,255,0.1);
  &:last-child { border-right: none; }
  .n { font-size: 24px; font-weight: 900; color: #fff; letter-spacing: -1px; }
  .l { font-size: 10.5px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
`;

/* ── RIGHT PANEL ── */
const Right = styled.div`
  flex: 1;
  margin-left: 47%;
  display: flex; align-items: center; justify-content: center;
  padding: 40px 28px; position: relative;
  height: 100vh;
  overflow: hidden;

  &::before {
    content: '';
    position: fixed; inset: 0;
    background:
      radial-gradient(ellipse at 18% 85%, rgba(14,57,149,0.07) 0%, transparent 50%),
      radial-gradient(ellipse at 82% 5%,  rgba(59,130,246,0.06) 0%, transparent 50%);
    pointer-events: none; z-index: 0;
  }
  @media (max-width: 960px) {
    margin-left: 0;
    background: ${p => p.$grad};
    background-size: 220% 220%;
    animation: ${gradShift} 10s ease infinite;
    &::before { display: none; }
  }
`;

const Card = styled(motion.div)`
  background: #fff; border-radius: 26px;
  padding: 42px 40px 36px; width: 100%; max-width: 480px;
  position: relative; z-index: 1;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(14,57,149,0.1), 0 28px 56px rgba(14,57,149,0.12);

  &::before {
    content: '';
    position: absolute; top: 0; left: 30px; right: 30px; height: 3px;
    background: ${p => p.$grad};
    border-radius: 0 0 4px 4px;
    transition: background 0.5s ease;
  }
`;

/* Card header */
const CardLogoRow = styled.div`
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
`;
const CLogoImg = styled.img` 
  height: 64px; 
  object-fit: contain; 
`;
const CLogoTxt = styled.span`
  display: none;
`;
const CardTitle = styled.h2`
  font-size: 24px; font-weight: 800; color: #0f172a;
  text-align: center; margin-bottom: 4px; letter-spacing: -0.4px;
`;
const CardSub = styled.p`
  font-size: 14px; color: #94a3b8; text-align: center; margin-bottom: 24px;
  a { color: #0E3995; font-weight: 700; text-decoration: none;
      &:hover { text-decoration: underline; } }
`;

/* Role tabs */
const RoleTabs = styled.div`
  display: grid;
  grid-template-columns: ${({ $count }) => `repeat(${$count}, 1fr)`};
  gap: 0;
  background: #f1f5f9;
  border-radius: 14px;
  padding: 5px;
  margin-bottom: 24px;
  min-width: 180px;
  max-width: 380px;
  margin-left: auto;
  margin-right: auto;
`;

const RoleTab = styled(motion.button)`
  padding: 12px 8px;
  border-radius: 11px;
  border: none;
  background: ${p => p.$on ? '#fff' : 'transparent'};
  color: ${p => p.$on ? p.$c : '#94a3b8'};
  font-weight: ${p => p.$on ? 700 : 600};
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  display: flex; flex-direction: column;
  align-items: center; gap: 5px;
  transition: all 0.25s ease;
  box-shadow: ${p => p.$on ? '0 2px 10px rgba(0,0,0,0.1)' : 'none'};

  .emoji { font-size: 20px; line-height: 1; transition: transform 0.25s; }
  &:hover .emoji { transform: scale(1.2) rotate(-5deg); }
`;

/* Social buttons */
const SocialRow = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 14px;
`;
const SocialBtn = styled(motion.button)`
  padding: 10px 12px;
  border-radius: 11px; border: 1.5px solid #e8edf2;
  background: #fafafa; font-size: 12.5px; font-weight: 600;
  color: #334155; cursor: pointer; display: flex;
  align-items: center; justify-content: center; gap: 7px;
  font-family: inherit;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  &:hover {
    border-color: ${p => p.$c};
    background: ${p => p.$c}0a;
    box-shadow: 0 3px 10px ${p => p.$c}20;
  }
`;

/* Divider */
const OrDiv = styled.div`
  display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
  span { font-size: 11px; font-weight: 700; color: #d1d9e0;
    text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
  &::before, &::after { content: ''; flex: 1; height: 1px; background: #f0f4f8; }
`;

/* Floating input */
const FieldWrap = styled.div` position: relative; margin-bottom: 12px; `;
const FLabel = styled.label`
  position: absolute;
  left: ${p => p.$ic ? '44px' : '15px'};
  top: 50%; transform: translateY(-50%);
  font-size: 14px; color: #b8c4ce; font-weight: 500;
  pointer-events: none;
  transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
  background: transparent; line-height: 1;

  ${p => p.$up && css`
    top: 7px; left: ${p.$ic ? '38px' : '12px'};
    font-size: 11px; font-weight: 600;
    color: ${p.$err ? '#ef4444' : p.$ac || '#0E3995'};
    background: transparent; padding: 0;
    transform: translateY(0);
    text-transform: uppercase; letter-spacing: 0.8px;
    opacity: 0.85;
  `}
`;
const FIconL = styled.div`
  position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
  pointer-events: none; display: flex;
  color: ${p => p.$on ? p.$c || '#0E3995' : '#c4cdd5'}; transition: color 0.22s;
`;
const FIconR = styled.button`
  position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; padding: 4px;
  display: flex; color: #b8c4ce; transition: color 0.2s;
  &:hover { color: ${p => p.$c || '#0E3995'}; }
`;
const FInput = styled.input`
  width: 100%; height: 54px;
  padding: ${p => p.$ic ? '23px 44px 7px 44px' : '23px 15px 7px 15px'};
  ${p => p.$ir && 'padding-right: 42px;'}
  font-size: 15px; font-weight: 600; font-family: inherit; color: #0f172a;
  border: 1.5px solid ${p => p.$err ? '#ef4444' : p.$on ? p.$ac || '#0E3995' : '#eaeff4'};
  border-radius: 12px;
  background: ${p => p.$on ? '#f8faff' : '#fafbfc'};
  outline: none;
  transition: border-color 0.22s, background 0.22s, box-shadow 0.22s;
  ${p => p.$on && !p.$err && css`box-shadow: 0 0 0 3px ${p.$ac || 'rgba(14,57,149,0.1)'};`}
  ${p => p.$err && css`box-shadow: 0 0 0 3px rgba(239,68,68,0.1);`}
  &::placeholder { color: transparent; }
`;
const FErr = styled.p`
  font-size: 11.5px; color: #ef4444; margin-top: 4px; font-weight: 500;
`;

/* Error Alert Box */
const ErrorAlert = styled(motion.div)`
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 1.5px solid #fca5a5;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
`;

const ErrorIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
`;

const ErrorContent = styled.div`
  flex: 1;
  .title {
    font-size: 13px;
    font-weight: 700;
    color: #dc2626;
    margin-bottom: 4px;
  }
  .message {
    font-size: 12px;
    color: #991b1b;
    line-height: 1.5;
  }
`;

/* Forgot */
const ForgotBtn = styled(Link)`
  display: block; text-align: right; font-size: 12px;
  font-weight: 700; color: ${p => p.$c || '#0E3995'}; text-decoration: none;
  margin-top: 5px; transition: color 0.2s;
  &:hover { text-decoration: underline; }
`;

/* Submit */
const SubmitBtn = styled(motion.button)`
  width: 100%; height: 54px; border: none; border-radius: 14px;
  background: ${p => p.$grad};
  background-size: 200%;
  animation: ${gradShift} 6s ease infinite;
  color: #fff; font-size: 16px; font-weight: 700; letter-spacing: -0.2px;
  cursor: pointer; font-family: inherit;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-top: 16px; margin-bottom: 16px;
  position: relative; overflow: hidden;
  transition: box-shadow 0.25s;

  &::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
    pointer-events: none;
  }
  &:hover { box-shadow: 0 8px 28px ${p => p.$shadow}; }
`;

const FootRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
`;
const FootNote = styled.div`
  font-size: 13px;
  text-align: center;
  a {
    color: #0E3995;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s ease;
    &:hover {
      color: #2563eb;
      text-decoration: underline;
    }
  }
`;

/* Floating label input component */
function FI({ id, name, type = 'text', label, value, onChange, error, iconL, iconR, onToggle, accent }) {
  const [focused, setFocused] = useState(false);
  const up = focused || !!value;
  return (
    <FieldWrap>
      {iconL && <FIconL $on={focused} $c={accent}>{iconL}</FIconL>}
      <FInput
        id={id} name={name} type={type}
        value={value} onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        $ic={!!iconL} $ir={!!iconR}
        $on={focused} $err={!!error} $ac={accent ? `${accent}22` : undefined}
        autoComplete="off"
      />
      <FLabel htmlFor={id} $up={up} $ic={!!iconL} $err={!!error} $ac={accent}>{label}</FLabel>
      {iconR && <FIconR type="button" onClick={onToggle} $c={accent}>{iconR}</FIconR>}
      {error && <FErr>{error}</FErr>}
    </FieldWrap>
  );
}

/* Google SVG */
const GoogleSVG = () => (
  <svg viewBox="0 0 24 24" width="17" height="17">
    <path fill="#EA4335" d="M5.266 9.765C6.199 6.939 8.854 4.91 12 4.91c1.69 0 3.218.6 4.418 1.582l3.491-3.491C17.782 1.146 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z" />
    <path fill="#34A853" d="M16.04 18.013C14.951 18.716 13.566 19.09 12 19.09c-3.134 0-5.78-2.014-6.723-4.823l-4.04 3.067C3.193 21.294 7.265 24 12 24c2.933 0 5.735-1.043 7.834-3.001l-3.794-2.986z" />
    <path fill="#4A90E2" d="M19.834 21C22.03 18.952 23.455 15.904 23.455 12c0-.71-.091-1.472-.273-2.182H12v4.636h6.436c-.319 1.56-1.17 2.767-2.396 3.559L19.834 21z" />
    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.91 12c0-.782.135-1.533.367-2.235L1.24 6.65A11.945 11.945 0 000 12c0 1.92.444 3.73 1.237 5.335l4.04-3.067z" />
  </svg>
);

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const { t, language } = useLanguage();
  const [role, setRole] = useState('candidate');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [googleErrorModal, setGoogleErrorModal] = useState(null);

  /* Sync i18n labels */
  ROLES.candidate.label = t.login.roleCandidate;
  ROLES.employer.label = t.login.roleEmployer;
  ROLES.admin.label = t.login.roleAdmin;

  useEffect(() => {
    const p = new URLSearchParams(location.search).get('role');
    if (p && ROLES[p]) setRole(p);
  }, [location.search]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !user?.role) {
      navigate('/auth/google-role-setup', { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Hiển thị lỗi nếu Google account bị khóa ở role khác
  useEffect(() => {
    const errorStr = localStorage.getItem('googleLoginError');
    if (errorStr) {
      try {
        const errorData = JSON.parse(errorStr);
        // Show as modal instead of banner
        setGoogleErrorModal(errorData);
      } catch (e) { /* ignore */ }
      localStorage.removeItem('googleLoginError');
    }
  }, []);

  const rc = ROLES[role];

  const onChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = t.login.requiredEmail;
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = language === 'vi' ? 'Email không hợp lệ' : 'Invalid email';
    if (!form.password) e.password = t.login.requiredPassword;
    else if (form.password.length < 6) e.password = language === 'vi' ? 'Mật khẩu phải có ít nhất 6 ký tự' : 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      // Import Auth functions from amplifyClient (v6 compatible)
      const { Auth } = await import('../../utils/amplifyClient');
      
      // First, try to sign out any existing session
      try {
        await Auth.signOut();
        console.log('Signed out existing session');
      } catch (signOutErr) {
        console.log('No existing session to sign out');
      }
      
      console.log('Calling signIn for:', form.email);
      
      // AWS Amplify v6 signIn syntax
      const result = await Auth.signIn({
        username: form.email,
        password: form.password
      });

      console.log('SignIn result:', result);

      // Check if sign in is complete or needs additional steps
      if (result.isSignedIn) {
        // Get user's Cognito groups from access token
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const session = await fetchAuthSession();
        const userGroups = session.tokens?.accessToken?.payload['cognito:groups'] || [];
        
        console.log('User groups:', userGroups);
        
        // Determine role based on groups
        let userRole = null;
        if (userGroups.includes('Admin')) {
          userRole = 'admin';
        } else if (userGroups.includes('Employer')) {
          userRole = 'employer';
        } else if (userGroups.includes('Candidate')) {
          userRole = 'candidate';
        }
        
        console.log('User role from groups:', userRole);
        console.log('Trying to login as:', role);
        
        // Special handling for Admin: Admin can login from any page
        if (userRole === 'admin') {
          console.log('Admin user detected - allowing login from any page');
          // Admin always goes to admin dashboard regardless of which login page they use
          login({ 
            name: language === 'vi' ? 'Quản Trị Viên' : 'Administrator', 
            email: form.email, 
            role: 'admin', 
            approved: true 
          });
          navigate('/admin/dashboard');
          return;
        }
        
        // Validate: Non-admin users can only login to their assigned role
        if (userRole && userRole !== role) {
          // User is trying to login to wrong role
          await Auth.signOut();
          
          let errorTitle = language === 'vi' ? 'Đăng nhập sai vai trò' : 'Wrong role login';
          let errorMessage = '';
          
          if (userRole === 'employer') {
            errorMessage = language === 'vi' ? 'Tài khoản này là Nhà tuyển dụng. Vui lòng đăng nhập tại trang Nhà tuyển dụng để tiếp tục.' : 'This account is an Employer account. Please login from the Employer page.';
          } else if (userRole === 'candidate') {
            errorMessage = language === 'vi' ? 'Tài khoản này là Ứng viên. Vui lòng đăng nhập tại trang Ứng viên để tiếp tục.' : 'This account is a Candidate account. Please login from the Candidate page.';
          }
          
          setErrors({ submit: errorMessage, submitTitle: errorTitle });
          setLoading(false);
          return;
        }
        
        // If user has a group, use it. Otherwise, deny login (no backward compatibility for security)
        if (!userRole) {
          await Auth.signOut();
          setErrors({ 
            submit: language === 'vi' ? 'Tài khoản chưa được phân quyền. Vui lòng liên hệ quản trị viên để được hỗ trợ.' : 'Account has no assigned role. Please contact the administrator for support.', 
            submitTitle: language === 'vi' ? 'Chưa có quyền truy cập' : 'No access permission' 
          });
          setLoading(false);
          return;
        }
        
        const roleToUse = userRole;
        
        // Sign in successful with correct role
        login({ 
          name: roleToUse === 'admin' ? (language === 'vi' ? 'Quản Trị Viên' : 'Administrator') : form.email.split('@')[0], 
          email: form.email, 
          role: roleToUse, 
          approved: true 
        });
        
        const sp = new URLSearchParams(location.search);
        const rd = sp.get('redirect');
        const BASE = import.meta.env.BASE_URL || '/';
        if (rd) {
          const target = rd.replace(/^\/+/, '');
          window.location.replace(`${BASE}${target}`);
          return;
        }
        const dashboardPath = roleToUse === 'admin' ? 'admin/dashboard' : roleToUse === 'employer' ? 'employer/dashboard' : 'candidate/dashboard';
        window.location.replace(`${BASE}${dashboardPath}`);
      } else if (result.nextStep) {
        // Additional steps required (OTP, MFA, new password, etc.)
        console.log('Additional step required:', result.nextStep.signInStep);
        
        // If user needs to confirm sign up, redirect to OTP page
        if (result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          alert(language === 'vi' ? 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email để lấy mã xác thực.' : 'Account not verified. Please check your email for the verification code.');
          navigate('/verify-otp', { state: { email: form.email, role, password: form.password } });
        } else {
          navigate('/verify-otp', { state: { email: form.email, role, password: form.password } });
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      
      let errorTitle = language === 'vi' ? 'Đăng nhập thất bại' : 'Login failed';
      let errorMessage = '';
      
      // Handle specific errors
      if (err.name === 'UserNotFoundException' || err.message?.includes('User does not exist')) {
        errorTitle = language === 'vi' ? 'Tài khoản không tồn tại' : 'Account not found';
        errorMessage = language === 'vi' ? 'Email này chưa được đăng ký. Vui lòng kiểm tra lại hoặc tạo tài khoản mới.' : 'This email is not registered. Please check again or create a new account.';
      } else if (err.name === 'NotAuthorizedException' || err.message?.includes('Incorrect username or password')) {
        errorTitle = language === 'vi' ? 'Sai mật khẩu' : 'Incorrect password';
        errorMessage = language === 'vi' ? 'Mật khẩu không đúng. Vui lòng thử lại hoặc nhấn "Quên mật khẩu" để đặt lại.' : 'Incorrect password. Please try again or click "Forgot password" to reset.';
      } else if (err.name === 'UserNotConfirmedException' || err.message?.includes('not confirmed')) {
        errorTitle = language === 'vi' ? 'Tài khoản chưa xác thực' : 'Account not verified';
        errorMessage = language === 'vi' ? 'Tài khoản chưa được xác thực. Vui lòng tắt email verification trong AWS Cognito hoặc xác thực email của bạn.' : 'Account not verified. Please disable email verification in AWS Cognito or verify your email.';
      } else if (err.name === 'PasswordResetRequiredException') {
        errorTitle = language === 'vi' ? 'Cần đặt lại mật khẩu' : 'Password reset required';
        errorMessage = language === 'vi' ? 'Bạn cần đặt lại mật khẩu. Vui lòng nhấn "Quên mật khẩu" để tiếp tục.' : 'You need to reset your password. Please click "Forgot password" to continue.';
      } else if (err.name === 'UserLambdaValidationException') {
        errorTitle = language === 'vi' ? 'Lỗi xác thực' : 'Validation error';
        errorMessage = language === 'vi' ? 'Có lỗi xảy ra khi xác thực tài khoản. Vui lòng liên hệ quản trị viên.' : 'An error occurred during account validation. Please contact the administrator.';
      } else if (err.name === 'TooManyRequestsException' || err.message?.includes('Too many requests')) {
        errorTitle = language === 'vi' ? 'Quá nhiều lần thử' : 'Too many attempts';
        errorMessage = language === 'vi' ? 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.' : 'Too many login attempts. Please wait a few minutes and try again.';
      } else {
        errorMessage = err.message || (language === 'vi' ? 'Có lỗi xảy ra. Vui lòng thử lại sau.' : 'An error occurred. Please try again later.');
      }
      
      setErrors({ submit: errorMessage, submitTitle: errorTitle });
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider) => {
    if (provider === 'Google') {
      try {
        setLoading(true);
        const { Auth } = await import('../../utils/amplifyClient');
        
        // Đảm bảo đăng xuất session cũ nếu có trước khi chuyển hướng Google
        try {
          await Auth.signOut();
          console.log('Signed out existing session before Google redirect');
        } catch (signOutErr) {
          console.log('No active session to sign out before Google redirect');
        }
        
        // Lưu vai trò đang chọn trước khi redirect sang Google
        localStorage.setItem('pendingGoogleRole', role);
        console.log('📝 Saved pending Google role:', role);
        // Generate PKCE verifier & challenge, store verifier in sessionStorage, then redirect to Hosted UI with prompt=select_account
        try {
          const { generateCodeVerifier, generateCodeChallenge } = await import('../../utils/pkce');
          const verifier = generateCodeVerifier();
          const challenge = await generateCodeChallenge(verifier);
          sessionStorage.setItem('pkce_code_verifier', verifier);

          // use values exported from amplifyClient
          const { OAUTH_DOMAIN: domain, OAUTH_CLIENT_ID: clientId, OAUTH_REDIRECT_URI: redirectUri } = await import('../../utils/amplifyClient');
          const scope = encodeURIComponent('openid email profile');
          const responseType = 'code';
          const providerParam = 'Google';
          const prompt = 'select_account';

          const hostedUrl = `https://${domain}/oauth2/authorize?response_type=${responseType}&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&identity_provider=${providerParam}&prompt=${prompt}&code_challenge=${challenge}&code_challenge_method=S256`;
          console.log('Redirecting to Hosted UI (PKCE + select_account):', hostedUrl);
          try {
            if (window.top && window.top !== window) {
              window.top.location.href = hostedUrl;
            } else {
              window.location.href = hostedUrl;
            }
          } catch (navError) {
            const popup = window.open(hostedUrl, '_blank', 'noopener,noreferrer');
            if (!popup) {
              window.location.href = hostedUrl;
            }
          }
          return;
        } catch (errRedirect) {
          console.error('PKCE Hosted UI redirect failed:', errRedirect);
          try { await Auth.signInWithRedirect({ provider: 'Google' }); return; } catch(e){ /* fallthrough */ }
          setErrors({ submit: 'Không thể chuyển hướng đến Google login. Vui lòng thử lại.', submitTitle: 'Lỗi đăng nhập Google' });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('❌ Google redirect login failed:', err);
        setErrors({ submit: err.message, submitTitle: 'Lỗi đăng nhập Google' });
        setLoading(false);
      }
    } else {
      setShowModal(true);
    }
  };

  const panelVariants = {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <Root>
      {/* ══ LEFT PANEL ══ */}
      <AnimatePresence mode="wait">
        <Left
          key={role}
          $grad={rc.grad}
          variants={panelVariants}
          initial="initial"
          animate="animate"
        >
          <DotGrid />
          <Scan />
          <Orb $s={520} $t="-20%" $r="-14%" $c="rgba(255,255,255,0.18)" $dur={20} $blur={40} />
          <Orb $s={340} $b="-12%" $l="-8%" $c="rgba(255,255,255,0.12)" $dur={16} $d={-4} $blur={24} />
          <Orb $s={160} $t="46%" $l="10%" $c="rgba(255,255,255,0.1)" $dur={12} $d={-6} $blur={12} />
          <Star $s={14} $t="9%" $l="8%" $dur={2.6} $d={0}>✦</Star>
          <Star $s={10} $t="20%" $l="91%" $dur={3.8} $d={1}>✦</Star>
          <Star $s={8} $t="68%" $l="5%" $dur={4} $d={0.5}>✦</Star>
          <Star $s={12} $t="86%" $l="86%" $dur={2.4} $d={1.5}>✦</Star>
          <BrandRow>
            <BrandImg src={s3Images.system.logo} alt="Ốp Pờ" onError={e => { e.target.style.display = 'none'; }} />
          </BrandRow>

          <HeroWrap>
            <Eyebrow>{rc.hero.eyebrow[language] || rc.hero.eyebrow.vi}</Eyebrow>
            <HeroH1 $c1={rc.hero.grad[0]} $c2={rc.hero.grad[1]} $c3={rc.hero.grad[2]}>
              {(rc.hero.h1[language] || rc.hero.h1.vi)[0]}<br />
              <span className="g">{(rc.hero.h1[language] || rc.hero.h1.vi)[1]}</span><br />
              {(rc.hero.h1[language] || rc.hero.h1.vi)[2]}
            </HeroH1>
            <HeroSub>{rc.hero.sub[language] || rc.hero.sub.vi}</HeroSub>
            <FeatureList>
              {(rc.hero.features[language] || rc.hero.features.vi).map((f, i) => <FItem key={i}>{f}</FItem>)}
            </FeatureList>
          </HeroWrap>
        </Left>
      </AnimatePresence>

      {/* ══ RIGHT PANEL ══ */}
      <Right $grad={rc.grad}>
        <Card
          key="card"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          $grad={rc.grad}
        >
          {/* Google role mismatch modal */}
          <AnimatePresence>
            {googleErrorModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
                <motion.div
                  initial={{ scale: 0.98, y: 8 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.98, y: 8 }}
                  transition={{ duration: 0.2 }}
                  style={{ background: '#fff', borderRadius: 12, padding: 20, width: 'min(720px,90%)', zIndex: 2001 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <ErrorIcon style={{ background: '#ef4444' }}>!</ErrorIcon>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#dc2626', marginBottom: 6 }}>{googleErrorModal.title}</div>
                        <div style={{ color: '#6b1a1a' }}>{googleErrorModal.message}</div>
                      </div>
                    </div>
                    <div>
                      <button onClick={() => setGoogleErrorModal(null)} style={{ background: 'transparent', border: 'none', fontWeight: 700, color: '#0E3995', cursor: 'pointer' }}>Đóng</button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Header */}
          <CardLogoRow>
            <CLogoImg src={s3Images.system.logo} alt="Ốp Pờ" onError={e=>{e.target.style.display='none';}} />
          </CardLogoRow>
          <CardTitle>{t.login.signIn}</CardTitle>
          <CardSub>
            {t.login.newUser}{' '}
            <Link to="/register">{t.login.createAccount}</Link>
          </CardSub>

          {/* Role tabs */}
          {(() => {
            const roleTabs = Object.entries(ROLES).filter(([key]) => key !== 'admin');
            if (roleTabs.length > 1) {
              return (
                <RoleTabs $count={roleTabs.length}>
                  {roleTabs.map(([key, r]) => (
                    <RoleTab
                      key={key}
                      type="button"
                      $on={role === key}
                      $c={r.color}
                      onClick={() => { setRole(key); setErrors({}); }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="emoji">{r.emoji}</span>
                      {r.label}
                    </RoleTab>
                  ))}
                </RoleTabs>
              );
            }
            return null;
          })()}

          {/* Social — only for candidate & employer */}
          {role !== 'admin' && (
            <>
              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={role}
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Error Alert */}
                  <AnimatePresence>
                    {errors.submit && (
                      <ErrorAlert
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ErrorIcon>!</ErrorIcon>
                        <ErrorContent>
                          <div className="title">{errors.submitTitle || (language === 'vi' ? 'Đăng nhập thất bại' : 'Login failed')}</div>
                          <div className="message">{errors.submit}</div>
                        </ErrorContent>
                      </ErrorAlert>
                    )}
                  </AnimatePresence>

                  <FI
                    id="email" name="email" type="email"
                    label={`${t.login.email} *`}
                    value={form.email} onChange={onChange}
                    error={errors.email}
                    iconL={<IcoMail />}
                    accent={rc.color}
                  />

                  <FI
                    id="password" name="password"
                    type={showPw ? 'text' : 'password'}
                    label={`${t.login.password} *`}
                    value={form.password} onChange={onChange}
                    error={errors.password}
                    iconL={<IcoLock />}
                    iconR={showPw ? <IcoEyeOff /> : <IcoEye />}
                    onToggle={() => setShowPw(p => !p)}
                    accent={rc.color}
                  />

                  <ForgotBtn to="/forgot-password" $c={rc.color}>
                    {t.login.forgotPassword}
                  </ForgotBtn>

                  <SubmitBtn
                    type="submit"
                    $grad={rc.grad}
                    $shadow={`${rc.color}55`}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                        style={{ animation: 'spin 0.8s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : (
                      <>{t.login.signIn}</>
                    )}
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </SubmitBtn>
                </motion.form>
              </AnimatePresence>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 18 }}>
                <OrDiv><span>{language === 'vi' ? 'hoặc' : 'or'}</span></OrDiv>
                <SocialBtn type="button" $c="#EA4335"
                  style={{
                    width: '100%',
                    fontSize: 16,
                    fontWeight: 700,
                    padding: '13px 0',
                    borderRadius: 12,
                    boxShadow: '0 2px 8px #0001',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                  onClick={() => handleSocial('Google')}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <GoogleSVG style={{ width: 22, height: 22 }} /> Google
                </SocialBtn>
              </div>
            </>
          )}

          {/* Admin notice */}
          {role === 'admin' && (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                border: '1px solid #c4b5fd',
                borderRadius: 12, padding: '12px 14px',
                marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>🛡️</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7c3aed' }}>{language === 'vi' ? 'Khu vực quản trị' : 'Admin Area'}</div>
                  <div style={{ fontSize: 11.5, color: '#8b5cf6', marginTop: 2 }}>{language === 'vi' ? 'Chỉ dành cho tài khoản được cấp quyền Admin' : 'Only for accounts with Admin privileges'}</div>
                </div>
              </div>

              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={role}
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Error Alert */}
                  <AnimatePresence>
                    {errors.submit && (
                      <ErrorAlert
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ErrorIcon>!</ErrorIcon>
                        <ErrorContent>
                          <div className="title">{errors.submitTitle || (language === 'vi' ? 'Đăng nhập thất bại' : 'Login failed')}</div>
                          <div className="message">{errors.submit}</div>
                        </ErrorContent>
                      </ErrorAlert>
                    )}
                  </AnimatePresence>

                  <FI
                    id="email" name="email" type="email"
                    label={`${t.login.email} *`}
                    value={form.email} onChange={onChange}
                    error={errors.email}
                    iconL={<IcoMail />}
                    accent={rc.color}
                  />

                  <FI
                    id="password" name="password"
                    type={showPw ? 'text' : 'password'}
                    label={`${t.login.password} *`}
                    value={form.password} onChange={onChange}
                    error={errors.password}
                    iconL={<IcoLock />}
                    iconR={showPw ? <IcoEyeOff /> : <IcoEye />}
                    onToggle={() => setShowPw(p => !p)}
                    accent={rc.color}
                  />

                  <ForgotBtn to="/forgot-password" $c={rc.color}>
                    {t.login.forgotPassword}
                  </ForgotBtn>

                  <SubmitBtn
                    type="submit"
                    $grad={rc.grad}
                    $shadow={`${rc.color}55`}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                        style={{ animation: 'spin 0.8s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : (
                      <>{t.login.signIn}</>
                    )}
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </SubmitBtn>
                </motion.form>
              </AnimatePresence>
            </>
          )}

          <FootRow>
            <FootNote>
              <Link to="/">{language === 'vi' ? 'Về trang chủ' : 'Back to Home'}</Link>
            </FootNote>
            <span style={{ color: '#d1d9e0', fontSize: 14, fontWeight: 'bold', userSelect: 'none' }}>·</span>
            <FootNote>
              <a href="#" onClick={(e) => { e.preventDefault(); setShowModal(true); }}>{language === 'vi' ? 'Gặp sự cố?' : 'Having trouble?'}</a>
            </FootNote>
          </FootRow>
        </Card>
      </Right>

      {/* Development Modal */}
    </Root>
  );
};

export default LoginPage;

