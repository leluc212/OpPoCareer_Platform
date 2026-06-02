import React, { useState, useEffect } from 'react';
// aws-amplify will be loaded dynamically where needed to avoid Vite prebundle
// export-shape issues (some builds don't expose default/named exports consistently).
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   KEYFRAMES
═══════════════════════════════════════════════════════════════ */
const floatUp = keyframes`
  0%,100% { transform: translateY(0) rotate(-1deg); }
  50%      { transform: translateY(-18px) rotate(2deg); }
`;
const floatDown = keyframes`
  0%,100% { transform: translateY(0) rotate(1deg); }
  50%      { transform: translateY(14px) rotate(-2deg); }
`;
const gradMove = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const twinkle = keyframes`
  0%,100% { opacity: 0.2; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.3); }
`;
const glowPulse = keyframes`
  0%,100% { box-shadow: 0 0 0 0 rgba(14,57,149,0.3); }
  50%      { box-shadow: 0 0 0 10px rgba(14,57,149,0); }
`;
const shimmerAnim = keyframes`
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
`;
const tickerMove = keyframes`
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

/* ═══════════════════════════════════════════════════════════════
   PAGE SHELL
═══════════════════════════════════════════════════════════════ */
const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  background: #f8faff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  color-scheme: light;
  position: relative;
`;

/* ═══════════════════════════════════════════════════════════════
   LEFT  ─ Candidate Hero Panel
═══════════════════════════════════════════════════════════════ */
const LeftPanel = styled.div`
  width: 48%;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: linear-gradient(150deg, #07195c 0%, #0E3995 40%, #1648c8 75%, #2563eb 100%);
  background-size: 220% 220%;
  animation: ${gradMove} 10s ease infinite;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 48px;
  overflow: hidden;

  @media (max-width: 960px) { display: none; }
`;

/* dot grid */
const DotGrid = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
`;

/* star dots */
const Star = styled.div`
  position: absolute;
  width: ${p => p.$s || 4}px;
  height: ${p => p.$s || 4}px;
  border-radius: 50%;
  background: #fff;
  top:  ${p => p.$top};
  left: ${p => p.$left};
  animation: ${twinkle} ${p => p.$dur || 3}s ease-in-out infinite;
  animation-delay: ${p => p.$d || 0}s;
`;

/* decorative orb */
const Orb = styled.div`
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, ${p => p.$c} 0%, transparent 70%);
  width: ${p => p.$s}px;
  height: ${p => p.$s}px;
  top: ${p => p.$top || p.$t || 'auto'};
  left: ${p => p.$left || p.$l || 'auto'};
  right: ${p => p.$right || p.$r || 'auto'};
  bottom: ${p => p.$bottom || p.$b || 'auto'};
  animation: ${floatUp} ${p => p.$dur || 12}s ease-in-out infinite;
  animation-delay: ${p => p.$d || 0}s;
  pointer-events: none;
  filter: blur(${p => p.$blur || 0}px);
  transform: ${p => p.$flip ? 'scaleX(-1)' : 'none'};
`;

/* brand */
const Brand = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 24px;
  position: relative;
  z-index: 2;
`;
const BrandLogoBox = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 10px 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 18px rgba(14,57,149,0.10);
  margin-bottom: 0;
`;
const BrandLogo = styled.img`
  height: 48px;
  width: 48px;
  object-fit: contain;
  display: block;
`;
const BrandText = styled.span`
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.4px;
`;

/* headline */
const Hero = styled.div`
  position: relative;
  z-index: 2;
`;

const HeroEyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  color: #bfdbfe;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 12px;
`;

const HeroH1 = styled.h1`
  font-size: clamp(30px, 3vw, 42px);
  font-weight: 900;
  line-height: 1.14;
  letter-spacing: -1.5px;
  color: #fff;
  margin-bottom: 16px;

  .grad {
    display: inline-block;
    background: linear-gradient(90deg, #fbbf24, #fb923c, #f472b6);
    background-size: 200%;
    animation: ${gradMove} 4s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    padding-top: 14px;
    padding-bottom: 8px;
  }
`;

const HeroSub = styled.p`
  font-size: 14.5px;
  color: rgba(255,255,255,0.65);
  line-height: 1.75;
  max-width: 360px;
  margin-bottom: 36px;
`;

/* job preview cards */
const JobCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
`;

const JobCard = styled(motion.div)`
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(255,255,255,0.14);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: default;
  transition: background 0.25s;

  &:hover { background: rgba(255,255,255,0.14); }
`;

const JobEmoji = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: ${p => p.$bg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
`;

const JobInfo = styled.div`
  flex: 1;
  .title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 3px; }
  .meta  { font-size: 12px; color: rgba(255,255,255,0.5); }
`;

const JobBadge = styled.div`
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${p => p.$bg || 'rgba(52,211,153,0.2)'};
  color:       ${p => p.$c || '#34d399'};
`;

/* ticker */
const TickerWrap = styled.div`
  overflow: hidden;
  position: relative;
  margin-top: 4px;

  &::before, &::after {
    content: '';
    position: absolute;
    top: 0; bottom: 0;
    width: 32px;
    z-index: 2;
  }
  &::before { left: 0;  background: linear-gradient(90deg, rgba(14,57,149,0.8), transparent); }
  &::after  { right: 0; background: linear-gradient(-90deg, rgba(14,57,149,0.8), transparent); }
`;

const TickerTrack = styled.div`
  display: flex;
  gap: 28px;
  white-space: nowrap;
  animation: ${tickerMove} 35s linear infinite;
`;

const TickerItem = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.55);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

/* ═══════════════════════════════════════════════════════════════
   RIGHT ─ Form Panel
═══════════════════════════════════════════════════════════════ */
const RightPanel = styled.div`
  flex: 1;
  margin-left: 48%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  position: relative;
  height: 100vh;
  overflow: hidden;

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse at 15% 85%, rgba(14,57,149,0.07) 0%, transparent 50%),
      radial-gradient(ellipse at 82% 5%,  rgba(59,130,246,0.06) 0%, transparent 45%);
    pointer-events: none;
    z-index: 0;
  }

  @media (max-width: 960px) {
    margin-left: 0;
    background: linear-gradient(145deg, #07195c 0%, #0E3995 100%);
    &::before { display: none; }
  }
`;

/* ═══════════════════════════════════════════════════════════════
   CARD
═══════════════════════════════════════════════════════════════ */
const Card = styled(motion.div)`
  background: #fff;
  border-radius: 28px;
  padding: 40px 38px 34px;
  width: 100%;
  max-width: 500px;
  position: relative;
  z-index: 1;
  box-shadow:
    0 1px 3px rgba(0,0,0,0.04),
    0 8px 24px rgba(14,57,149,0.09),
    0 28px 56px rgba(14,57,149,0.11);

  /* rainbow top bar */
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 30px; right: 30px;
    height: 3px;
    background: linear-gradient(90deg, #0E3995, #3b82f6, #60a5fa, #38bdf8);
    border-radius: 0 0 6px 6px;
  }
`;

/* card header */
const CardTop = styled.div`
  text-align: center;
  margin-top: 32px;
  margin-bottom: 24px;
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 18px;
`;
const LogoImg = styled.img`
  height: 38px;
  object-fit: contain;
`;
const LogoTxt = styled.span`
  font-size: 22px;
  font-weight: 800;
  color: #0E3995;
  letter-spacing: -0.4px;
`;

const CardTitle = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 5px;
  letter-spacing: -0.4px;
`;

const CardSub = styled.p`
  font-size: 13px;
  color: #94a3b8;

  a { color: #0E3995; font-weight: 700; text-decoration: none;
      &:hover { text-decoration: underline; } }
`;

/* ─ Tab toggle: Đăng ký / Đăng nhập ─ */
const Tabs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 22px;
`;

const Tab = styled.div`
  padding: 9px;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
  color: ${p => p.$active ? '#0E3995' : '#94a3b8'};
  background: ${p => p.$active ? '#fff' : 'transparent'};
  box-shadow: ${p => p.$active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'};
`;

/* ─ Social ─ */
const SocialRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  margin-bottom: 16px;
`;

const SocialBtn = styled(motion.button)`
  padding: 10px 14px;
  border-radius: 11px;
  border: 1.5px solid #e8edf2;
  background: #fafafa;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: ${p => p.$c};
    background: ${p => p.$c}0a;
    box-shadow: 0 3px 10px ${p => p.$c}20;
  }
`;

/* ─ Or divider ─ */
const OrDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;

  span { font-size: 11px; font-weight: 700; color: #d1d9e0;
    text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
  &::before, &::after { content: ''; flex: 1; height: 1px; background: #f0f4f8; }
`;

/* ─ Floating input ─ */
const FieldWrap = styled.div`
  position: relative;
  margin-bottom: 13px;
`;

const FLabel = styled.label`
  position: absolute;
  left: ${p => p.$ic ? '44px' : '15px'};
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #b8c4ce;
  font-weight: 500;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  background: transparent;
  line-height: 1;

  ${p => p.$up && css`
    top: 0px;
    left: ${p.$ic ? '38px' : '12px'};
    font-size: 10px;
    font-weight: 700;
    color: ${p.$err ? '#ef4444' : '#0E3995'};
    background: #fff;
    padding: 0 4px;
    transform: translateY(-50%);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `}
`;

const FIconL = styled.div`
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  display: flex;
  color: ${p => p.$on ? '#0E3995' : '#c4cdd5'};
  transition: color 0.22s;
  svg { width: 17px; height: 17px; }
`;

const FIconR = styled.button`
  position: absolute;
  right: 11px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  color: #b8c4ce;
  transition: color 0.2s;
  &:hover { color: #0E3995; }
  svg { width: 16px; height: 16px; }
`;

const FInput = styled.input`
  width: 100%;
  height: 50px;
  padding: ${p => p.$ic ? '14px 44px 0 44px' : '14px 15px 0 15px'};
  ${p => p.$ir && 'padding-right: 42px;'}
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  color: #0f172a;
  border: 1.5px solid ${p => p.$err ? '#ef4444' : p.$on ? '#0E3995' : '#eaeff4'};
  border-radius: 12px;
  background: ${p => p.$on ? '#f8faff' : '#fafbfc'};
  outline: none;
  transition: border-color 0.22s, background 0.22s, box-shadow 0.22s;

  ${p => p.$on && !p.$err && css`
    box-shadow: 0 0 0 3px rgba(14,57,149,0.09);
  `}
  ${p => p.$err && css`
    box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
  `}
  &::placeholder { color: transparent; }
`;

const FErr = styled.p`
  font-size: 11.5px;
  color: #ef4444;
  margin-top: 4px;
  font-weight: 500;
`;

/* ─ Password strength ─ */
const PwWrap = styled.div` margin: -5px 0 11px; `;
const PwBars = styled.div` display: flex; gap: 4px; margin-bottom: 3px; `;
const PwSeg = styled.div`
  flex: 1; height: 3px; border-radius: 999px;
  background: ${p => p.$on ? p.$c : '#eaeff4'};
  transition: background 0.35s;
`;
const PwLbl = styled.div`
  font-size: 11px; font-weight: 700;
  color: ${p => p.$c}; text-align: right;
`;

/* ─ Checkbox ─ */
const ChkRow = styled.label`
  display: flex; align-items: flex-start; gap: 10px;
  cursor: pointer; margin-bottom: 14px;
`;
const Chk = styled.div`
  width: 17px; height: 17px; border-radius: 5px; flex-shrink: 0; margin-top: 2px;
  border: 1.5px solid ${p => p.$on ? '#0E3995' : '#d1d9e0'};
  background: ${p => p.$on ? '#0E3995' : '#fff'};
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  svg { width: 10px; height: 10px; color: #fff; opacity: ${p => p.$on ? 1 : 0}; transition: opacity 0.2s; }
`;
const ChkTxt = styled.span`
  font-size: 12.5px; color: #64748b; line-height: 1.55;
  a { color: #0E3995; font-weight: 700; text-decoration: none; &:hover { text-decoration: underline; } }
`;

/* ─ Submit ─ */
const SubmitBtn = styled(motion.button)`
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 13px;
  background: linear-gradient(135deg, #07195c 0%, #0E3995 55%, #2563eb 100%);
  background-size: 200%;
  animation: ${gradMove} 6s ease infinite;
  color: #fff;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -0.2px;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.25s;

  &::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
    pointer-events: none;
  }

  &:hover:not(:disabled) { box-shadow: 0 8px 28px rgba(14,57,149,0.45); }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

const SecondaryBtn = styled.button`
  width: 100%;
  height: 44px;
  border: 1.5px solid #e2e8f0;
  border-radius: 11px;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.2s, color 0.2s;
  margin-bottom: 14px;

  &:hover { border-color: #0E3995; color: #0E3995; }
`;

const FootNote = styled.p`
  font-size: 11.5px; color: #c0cad4; text-align: center; line-height: 1.6;
  a { color: #0E3995; font-weight: 600; text-decoration: none; }
`;

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
function getPwStrength(pw) {
  if (!pw) return null;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  if (s <= 1) return { n: 1, label: 'Yếu', color: '#ef4444' };
  if (s <= 2) return { n: 2, label: 'Trung bình', color: '#f59e0b' };
  if (s <= 3) return { n: 3, label: 'Khá mạnh', color: '#3b82f6' };
  return { n: 4, label: 'Rất mạnh', color: '#10b981' };
}

/* inline icon SVGs */
const IcoMail = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const IcoLock = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const IcoUser = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IcoEye = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const IcoEyeOff = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>;
const IcoArrow = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>;
const IcoCheck = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;

/* floating input component */
function FloatInput({ id, name, type = 'text', label, value, onChange, error, iconL, iconR, onToggle, onBlur }) {
  const [focused, setFocused] = useState(false);
  const up = focused || !!value;
  
  const handleBlur = () => {
    setFocused(false);
    if (onBlur) onBlur();
  };
  
  return (
    <FieldWrap>
      {iconL && <FIconL $on={focused}>{iconL}</FIconL>}
      <FInput
        id={id} name={name} type={type}
        value={value} onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        $ic={!!iconL} $ir={!!iconR}
        $on={focused} $err={!!error}
        autoComplete="off"
      />
      <FLabel htmlFor={id} $up={up} $ic={!!iconL} $err={!!error}>{label}</FLabel>
      {iconR && <FIconR type="button" onClick={onToggle}>{iconR}</FIconR>}
      {error && <FErr>{error}</FErr>}
    </FieldWrap>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
const CandidateRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefill || {};

  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    fullName: prefill.fullName || '',
    email: prefill.email || '',
    password: prefill.password || '',
    confirmPassword: prefill.confirmPassword || ''
  });
  const [errors, setErrors] = useState({});
  const [googleError, setGoogleError] = useState(null);

  useEffect(() => {
    const err = localStorage.getItem('googleLoginError');
    if (err) {
      try { setGoogleError(JSON.parse(err)); } catch (_) {}
      localStorage.removeItem('googleLoginError');
    }
  }, []);

  const pw = getPwStrength(form.password);

  const validatePassword = (password) => {
    if (!password) return '';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!/[A-Z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ hoa';
    if (!/[a-z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ thường';
    if (!/[0-9]/.test(password)) return 'Mật khẩu phải có ít nhất 1 số';
    if (!/[^a-zA-Z0-9]/.test(password)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)';
    return '';
  };

  const onChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));

    // Real-time validation cho password
    if (name === 'password') {
      const pwError = validatePassword(value);
      setErrors(p => ({ ...p, password: pwError }));
    } else if (name === 'confirmPassword') {
      // Real-time validation cho confirm password
      if (value && value !== form.password) {
        setErrors(p => ({ ...p, confirmPassword: 'Mật khẩu không khớp' }));
      } else {
        setErrors(p => ({ ...p, confirmPassword: '' }));
      }
    } else if (name === 'email') {
      // Clear error khi user đang nhập
      if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    } else {
      if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    }
  };
  
  // Check if email exists when user leaves email field
  const handleEmailBlur = async () => {
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) return;
    // Don't block user while typing — only clear existing errors
    setErrors(p => ({ ...p, email: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName) e.fullName = 'Vui lòng nhập họ tên';
    if (!form.email) e.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email không đúng định dạng';

    const pwError = validatePassword(form.password);
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
    else if (pwError) e.password = pwError;

    if (!form.confirmPassword) e.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Mật khẩu không khớp';
    if (!agreed) e.agreed = 'Bạn cần đồng ý điều khoản';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      // Import Auth functions from amplifyClient (v6 compatible)
      const { Auth } = await import('../../utils/amplifyClient');

      console.log('Calling signUp for candidate:', form.email);

      // AWS Amplify v6 signUp syntax with role in user attributes
      const result = await Auth.signUp({
        username: form.email,
        password: form.password,
        options: {
          userAttributes: {
            email: form.email,
            name: form.fullName,
            // Store role in profile attribute (standard attribute)
            profile: 'Candidate'
          },
          // Also send role as client metadata for PreSignUp trigger
          clientMetadata: {
            role: 'Candidate'
          }
        }
      });

      console.log('SignUp successful:', result);

      // Check if user needs to confirm (email verification)
      if (result.isSignUpComplete === false || result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        console.log('User needs to confirm email with OTP');
        // Redirect to OTP verification page
        navigate('/verify-otp', {
          state: {
            email: form.email,
            password: form.password,
            role: 'candidate',
            fromRegistration: true,
            formData: { fullName: form.fullName, email: form.email, password: form.password, confirmPassword: form.confirmPassword }
          }
        });
      } else {
        // User is auto-confirmed (shouldn't happen with new Lambda)
        console.log('User auto-confirmed');
        alert('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
        navigate('/login?role=candidate');
      }
    } catch (err) {
      console.error('SignUp error:', err);

      let errorMessage = '';
      if (err.name === 'UsernameExistsException' || err.message?.includes('User already') || err.message?.includes('already exists')) {
        // Try to resend OTP — if user is unconfirmed, redirect to OTP page
        try {
          const { Auth } = await import('../../utils/amplifyClient');
          await Auth.resendSignUpCode({ username: form.email });
          // Resend succeeded → unconfirmed user → go to OTP
          navigate('/verify-otp', {
            state: {
              email: form.email,
              password: form.password,
              role: 'candidate',
              fromRegistration: true,
              formData: { fullName: form.fullName, email: form.email, password: form.password, confirmPassword: form.confirmPassword }
            }
          });
          return;
        } catch (resendErr) {
          if (resendErr.name === 'InvalidParameterException' || resendErr.message?.includes('confirmed')) {
            // User is already confirmed — truly duplicate account
            errorMessage = 'Email này đã được đăng ký và xác thực. Vui lòng đăng nhập hoặc dùng email khác.';
          } else {
            // Any other resend error (LimitExceeded, network...) — still send to OTP page
            // because the root cause is UsernameExists (unconfirmed)
            navigate('/verify-otp', {
              state: {
                email: form.email,
                password: form.password,
                role: 'candidate',
                fromRegistration: true,
                formData: { fullName: form.fullName, email: form.email, password: form.password, confirmPassword: form.confirmPassword }
              }
            });
            return;
          }
        }
      } else if (err.name === 'InvalidPasswordException') {
        errorMessage = 'Mật khẩu không đủ mạnh. Vui lòng thử mật khẩu khác.';
      } else if (err.name === 'InvalidParameterException') {
        errorMessage = 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.';
      } else if (err.name === 'LimitExceededException' || err.message?.includes('Exceeded daily email limit')) {
        errorMessage = 'Hệ thống gửi Email OTP đã đạt giới hạn trong ngày (giới hạn AWS Sandbox). Vui lòng thử lại vào ngày mai!';
      } else {
        errorMessage = err.message || 'Đăng ký thất bại';
      }

      setErrors({ submit: errorMessage });
    }
  };

  const handleSocial = async (p) => {
    if (p === 'Google') {
      try {
        const { Auth } = await import('../../utils/amplifyClient');
        localStorage.setItem('pendingGoogleRole', 'candidate');
        try { await Auth.signOut(); } catch (_) {}
        await Auth.signInWithRedirect({ provider: 'Google' });
      } catch (err) {
        console.error('Google login failed:', err);
      }
    }
  };

  /* job previews */
  const jobs = [
    { emoji: '☕', bg: 'rgba(251,191,36,0.25)', title: 'Barista bán thời gian', meta: 'TP.HCM · 35K/giờ', badge: 'Mới đăng', bc: 'rgba(96,165,250,0.2)', tc: '#93c5fd' },
    { emoji: '🛍️', bg: 'rgba(167,139,250,0.25)', title: 'Nhân viên bán hàng', meta: 'TP.HCM · 38K/giờ', badge: 'Hot 🔥', bc: 'rgba(249,115,22,0.2)', tc: '#fb923c' },
    { emoji: '🍽️', bg: 'rgba(52,211,153,0.25)', title: 'Nhân viên Phục Vụ Nhà Hàng', meta: 'TP.HCM · 32K/giờ', badge: 'Urgent', bc: 'rgba(239,68,68,0.2)', tc: '#f87171' },
  ];

  const tickerItems = ['🛒 Tư vấn sản phẩm', '🍳 Phụ bếp', '📦 Soạn hàng', '🌐 Phiên dịch', '🏨 Lễ tân', '📚 Gia sư', '🛒 Tư vấn sản phẩm', '🍳 Phụ bếp', '📦 Soạn hàng', '🌐 Phiên dịch', '🏨 Lễ tân', '📚 Gia sư'];

  return (
    <Shell>
      {/* Google error modal */}
      {googleError && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '28px 32px',
            maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>!</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#dc2626', marginBottom: 6 }}>{googleError.title}</div>
                <div style={{ color: '#6b1a1a', fontSize: 14 }}>{googleError.message}</div>
              </div>
            </div>
            <button onClick={() => setGoogleError(null)} style={{ background: 'transparent', border: 'none', fontWeight: 700, color: '#0E3995', cursor: 'pointer', float: 'right' }}>Đóng</button>
          </div>
        </div>
      )}
      {/* ══ LEFT ══ */}
      <LeftPanel>
        <DotGrid />
        <Orb $s={500} $top="-20%" $right="-15%" $c="rgba(37,99,235,0.4)" $dur={20} />
        <Orb $s={320} $bottom="-12%" $left="-8%" $c="rgba(14,57,149,0.5)" $dur={16} $flip $d={-3} />
        <Orb $s={160} $top="35%" $left="12%" $c="rgba(96,165,250,0.3)" $dur={11} $d={-5} />
        <Star $s={5} $top="15%" $left="22%" $dur={2.5} />
        <Star $s={3} $top="35%" $left="78%" $dur={4} $d={1} />
        <Star $s={4} $top="62%" $left="55%" $dur={3.2} $d={0.5} />
        <Star $s={6} $top="80%" $left="88%" $dur={2.8} $d={1.5} />

        <Brand>
          <BrandLogoBox>
            <BrandLogo src="/images/logo.png" alt="Ốp Pờ" onError={e => { e.target.style.display = 'none'; }} />
          </BrandLogoBox>
        </Brand>

        <Hero>
          <HeroEyebrow>
            ✦ Nền tảng việc làm part-time #1
          </HeroEyebrow>

          <HeroH1>
            Tìm việc<br />
            <span className="grad">phù hợp</span><br />
            trong 60 giây
          </HeroH1>

          <HeroSub>
            Hàng ngàn công việc part-time linh hoạt đang chờ bạn.
            Đăng ký miễn phí ngay để bắt đầu ứng tuyển.
          </HeroSub>

          {/* Job preview cards */}
          <JobCards>
            {jobs.map((j, i) => (
              <JobCard
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
              >
                <JobEmoji $bg={j.bg}>{j.emoji}</JobEmoji>
                <JobInfo>
                  <div className="title">{j.title}</div>
                  <div className="meta">{j.meta}</div>
                </JobInfo>
                <JobBadge $bg={j.bc} $c={j.tc}>{j.badge}</JobBadge>
              </JobCard>
            ))}
          </JobCards>

          {/* Scrolling ticker */}
          <TickerWrap>
            <TickerTrack>
              {tickerItems.map((t, i) => (
                <TickerItem key={i}>● {t}</TickerItem>
              ))}
            </TickerTrack>
          </TickerWrap>
        </Hero>
      </LeftPanel>

      {/* ══ RIGHT ══ */}
      <RightPanel>
        <Card
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <CardTop>
            <LogoRow>
              <LogoImg src="/images/logo.png" alt="Ốp Pờ" onError={e => { e.target.style.display = 'none'; }} />
              <LogoTxt>Ốp Pờ</LogoTxt>
            </LogoRow>
            <CardTitle>Tạo tài khoản ứng viên</CardTitle>
            <CardSub style={{ marginTop: 5 }}>
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </CardSub>
          </CardTop>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <FloatInput id="fullName" name="fullName" label="Họ và tên *"
              value={form.fullName} onChange={onChange} error={errors.fullName}
              iconL={<IcoUser />} />

            <FloatInput id="email" name="email" type="email" label="Email *"
              value={form.email} onChange={onChange} error={errors.email}
              iconL={<IcoMail />} />

            <FloatInput id="password" name="password"
              type={showPw ? 'text' : 'password'} label="Mật khẩu *"
              value={form.password} onChange={onChange} error={errors.password}
              iconL={<IcoLock />}
              iconR={showPw ? <IcoEyeOff /> : <IcoEye />}
              onToggle={() => setShowPw(p => !p)} />

            {form.password && pw && !errors.password && (
              <PwWrap>
                <PwBars>
                  {[1, 2, 3, 4].map(i => <PwSeg key={i} $on={pw.n >= i} $c={pw.color} />)}
                </PwBars>
                <PwLbl $c={pw.color}>{pw.label}</PwLbl>
              </PwWrap>
            )}

            <FloatInput id="confirmPassword" name="confirmPassword"
              type={showCpw ? 'text' : 'password'} label="Xác nhận mật khẩu *"
              value={form.confirmPassword} onChange={onChange} error={errors.confirmPassword}
              iconL={<IcoLock />}
              iconR={showCpw ? <IcoEyeOff /> : <IcoEye />}
              onToggle={() => setShowCpw(p => !p)} />

            <ChkRow onClick={() => setAgreed(p => !p)}>
              <Chk $on={agreed}><IcoCheck /></Chk>
              <ChkTxt>
                Tôi đồng ý với <a href="#" onClick={e => e.stopPropagation()}>Điều khoản</a>
                {' '}và <a href="#" onClick={e => e.stopPropagation()}>Chính sách bảo mật</a> của Ốp Pờ.
              </ChkTxt>
            </ChkRow>
            {errors.agreed && <FErr style={{ marginTop: -8, marginBottom: 10 }}>{errors.agreed}</FErr>}
            {errors.submit && (
              <div style={{ marginTop: -8, marginBottom: 10, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, textAlign: 'center' }}>
                <p style={{ color: '#dc2626', fontSize: 13, fontWeight: 600, marginBottom: errors.submit.includes('đăng nhập') ? 6 : 0 }}>
                  {errors.submit}
                </p>
                {errors.submit.includes('đăng nhập') && (
                  <a href="/login" style={{ color: '#0E3995', fontSize: 13, fontWeight: 700, textDecoration: 'underline' }}>
                    Đăng nhập ngay →
                  </a>
                )}
              </div>
            )}

            <SubmitBtn
              type="submit"
              disabled={!agreed}
              whileHover={agreed ? { scale: 1.02 } : {}}
              whileTap={agreed ? { scale: 0.98 } : {}}>
              Tạo tài khoản miễn phí
            </SubmitBtn>
          </form>

          <SecondaryBtn type="button" onClick={() => navigate('/register')}>
            Quay lại chọn vai trò
          </SecondaryBtn>

          <FootNote>
            Bằng cách đăng ký, bạn sẽ nhận thông báo việc làm mới từ Ốp Pờ.{' '}
            <a href="#">Huỷ bất cứ lúc nào.</a>
          </FootNote>
        </Card>
      </RightPanel>
    </Shell>
  );
};

export default CandidateRegister;

