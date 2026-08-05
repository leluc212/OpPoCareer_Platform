import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import employerProfileService from '../../services/employerProfileService';
import { Check, Zap, Star, Rocket, Sparkles, X, HelpCircle, CreditCard, Shield, Clock, CheckCircle, AlertCircle, Banknote, Copy } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getDefaultPackageCatalog, getPackageCatalog, getWallet } from '../../services/packageCatalogService';
import { getAuthHeaders } from '../../services/authHeaders.js';

// ─── Animations ───────────────────────────────────────────────
const rotateBorder = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const floatY = keyframes`
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
`;
const shimmerSweep = keyframes`
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;
const checkBounce = keyframes`
  0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
  70%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
`;
const orbPulse = keyframes`
  0%,100% { transform: scale(1); opacity: 0.18; }
  50%      { transform: scale(1.12); opacity: 0.28; }
`;

// ─── Layout ───────────────────────────────────────────────────
const PageContainer = styled(motion.div)`
  position: relative;
  overflow: hidden;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px;
`;

/* decorative orbs behind everything */
const OrbBlue = styled.div`
  position: fixed; pointer-events: none; z-index: 0;
  width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, #1e40af33 0%, transparent 70%);
  top: -120px; right: -150px;
  animation: ${orbPulse} 6s ease-in-out infinite;
`;
const OrbGreen = styled.div`
  position: fixed; pointer-events: none; z-index: 0;
  width: 380px; height: 380px; border-radius: 50%;
  background: radial-gradient(circle, #10b98133 0%, transparent 70%);
  bottom: 80px; left: -100px;
  animation: ${orbPulse} 8s ease-in-out infinite reverse;
`;

const Inner = styled.div`position: relative; z-index: 1;`;

// ─── Header ───────────────────────────────────────────────────
const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
`;
const PageIconBox = styled(motion.div)`
  width: 52px; height: 52px; border-radius: 15px;
  background: #EFF6FF; border: 1.5px solid #BFDBFE;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  svg { width: 22px; height: 22px; color: #1e40af; }
`;
const PageTitleText = styled.div`
  h1 { font-size: 22px; font-weight: 800; color: ${p => p.theme.colors.text}; letter-spacing: -0.5px; margin-bottom: 2px; }
  p  { font-size: 13px; color: ${p => p.theme.colors.textLight}; font-weight: 500; }
`;

// ─── Pricing grid (equal-height cards) ───────────────────────
const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: stretch;
  margin-bottom: 12px;
  padding-top: 10px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    max-width: 440px;
  }
`;

const glowAnim = keyframes`
  0%,100% { box-shadow: 0 0 0 2.5px #1e40af, 0 16px 50px rgba(30,64,175,0.22); }
  33%      { box-shadow: 0 0 0 2.5px #60a5fa, 0 16px 50px rgba(96,165,250,0.28); }
  66%      { box-shadow: 0 0 0 2.5px #818cf8, 0 16px 50px rgba(129,140,248,0.25); }
`;

const PricingCard = styled(motion.div)`
  background: #ffffff;
  border-radius: 16px;
  border: 1.5px solid ${p => p.$featured ? 'transparent' : '#E8EFFF'};
  padding: 24px 20px 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  position: relative;
  overflow: visible;
  box-shadow: ${p => p.$featured
    ? '0 0 0 2.5px #1e40af, 0 16px 50px rgba(30,64,175,0.2)'
    : '0 2px 10px rgba(30,64,175,0.07)'};
  ${p => p.$featured && css`animation: ${glowAnim} 3s ease infinite;`}
  transition: transform 0.25s ease;

  /* colored top stripe for non-featured */
  ${p => !p.$featured && css`
    &::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; height: 4px;
      border-radius: 20px 20px 0 0;
      background: ${p.$color};
      opacity: 0.75;
    }
  `}
`;

const PopularBadge = styled(motion.div)`
  position: absolute; top: -15px; left: 50%; transform: translateX(-50%);
  background: linear-gradient(90deg, #1e3a8a, #1e40af);
  color: white; padding: 5px 20px; border-radius: 100px;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; gap: 5px; white-space: nowrap;
  box-shadow: 0 4px 18px rgba(30,64,175,0.45);
  svg { width: 12px; height: 12px; }
`;

const PlanIconWrap = styled(motion.div)`
  width: 48px; height: 48px;
  margin: 6px auto 14px;
  border-radius: 14px;
  background: ${p => p.$bg};
  border: 1.5px solid ${p => p.$border};
  display: flex; align-items: center; justify-content: center;
  animation: ${floatY} ${p => p.$dur || '4s'} ease-in-out infinite;
  svg { width: 22px; height: 22px; color: ${p => p.$c}; }
`;

const PlanName = styled.h3`
  font-size: 17px; font-weight: 800; text-align: center;
  color: ${p => p.theme.colors.text}; letter-spacing: -0.3px; margin-bottom: 8px;
`;

const PriceBox = styled.div`
  background: #F8FAFC;
  border: 1.5px solid #F1F5F9;
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%);
    animation: ${shimmerSweep} 3.2s infinite linear;
    pointer-events: none;
  }
`;

const PriceOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: white;
  border-radius: 10px;
  margin-bottom: 4px;
  position: relative;
  z-index: 1;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  
  &:hover {
    background: #F8FAFC;
    border-color: ${p => p.$color || '#1e40af'};
    transform: translateX(4px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PriceDuration = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
`;

const PriceAmount = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: ${p => p.$c};
  letter-spacing: -0.5px;
`;

const PriceNum = styled.div`
  font-size: 34px; font-weight: 900; color: ${p => p.$c};
  letter-spacing: -1.5px; line-height: 1;
  .unit { font-size: 18px; font-weight: 700; margin-left: 4px; vertical-align: bottom; }
`;
const PricePer = styled.div`
  font-size: 12.5px; color: ${p => p.theme.colors.textLight}; font-weight: 500; margin-top: 6px;
`;

/* push button to bottom */
const Features = styled.ul`
  flex: 1;
  display: flex; flex-direction: column; gap: 6px;
  margin: 0 0 16px; padding: 0; list-style: none;
`;

const FeatureItem = styled(motion.li)`
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 500; color: ${p => p.theme.colors.text};
  padding: 4px; border-radius: 6px;
  transition: background 0.15s ease, transform 0.15s ease;
  &:hover { background: #F8FAFC; transform: translateX(3px); }

  .chk {
    width: 18px; height: 18px; border-radius: 5px;
    background: #ECFDF5; border: 1px solid #6EE7B7;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    svg { width: 10px; height: 10px; color: #10B981; animation: ${checkBounce} 0.35s ease both; }
  }
`;

const Btn = styled(motion.button)`
  width: 100%; padding: 10px; border-radius: 10px;
  font-size: 13px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  border: none; position: relative; overflow: hidden; flex-shrink: 0;
  svg { width: 16px; height: 16px; }
  transition: filter 0.2s ease, box-shadow 0.2s ease;

  ${p => p.$primary ? css`
    background: #1e40af; color: white;
    box-shadow: 0 5px 18px rgba(30,64,175,0.38);
    &::after {
      content: ''; position: absolute; top: 0; left: -120%; width: 80%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
      transition: left 0.5s ease;
    }
    &:hover { filter: brightness(1.1); box-shadow: 0 8px 28px rgba(30,64,175,0.48); }
    &:hover::after { left: 130%; }
  ` : css`
    background: #F8FAFC; color: #475569;
    border: 1.5px solid #E2E8F0;
    &:hover { border-color: #93C5FD; color: #1e40af; background: #EFF6FF; }
  `}
`;

// ─── Bottom sections ──────────────────────────────────────────
const SectionCard = styled(motion.div)`
  background: #ffffff; border: 1.5px solid #E8EFFF;
  border-radius: 18px; overflow: hidden;
  box-shadow: 0 2px 10px rgba(30,64,175,0.07); margin-bottom: 18px;
`;
const SectionHead = styled.div`
  padding: 18px 24px; border-bottom: 1px solid #F1F5F9;
  h2 { font-size: 15.5px; font-weight: 700; color: ${p => p.theme.colors.text}; }
`;
const CompTable = styled.table`
  width: 100%; border-collapse: collapse;
  th {
    padding: 12px 18px; background: #F8FAFC; color: #64748B;
    font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 1px solid #F1F5F9; text-align: center;
    &:first-child { text-align: left; }
  }
  td {
    padding: 13px 18px; text-align: center;
    border-top: 1px solid #F8FAFC; font-size: 13.5px;
    color: ${p => p.theme.colors.text}; font-weight: 500;
    transition: background 0.15s;
    &:first-child { text-align: left; font-weight: 600; }
    svg { width: 18px; height: 18px; }
  }
  tr:hover td { background: #FAFBFF; }
`;
const FAQItem = styled(motion.div)`
  padding: 18px 24px; border-bottom: 1px solid #F1F5F9;
  &:last-child { border-bottom: none; }
  transition: background 0.14s;
  &:hover { background: #FAFBFF; }
  h3 {
    font-size: 14px; font-weight: 700; color: ${p => p.theme.colors.text};
    margin-bottom: 7px; display: flex; align-items: center; gap: 8px;
    svg { width: 15px; height: 15px; color: #1e40af; flex-shrink: 0; }
  }
  p { font-size: 13px; color: ${p => p.theme.colors.textLight}; line-height: 1.65; padding-left: 23px; }
`;

// ─── Modal Styles ─────────────────────────────────────────────
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h3 {
    font-size: 18px;
    font-weight: 700;
    color: ${p => p.theme.colors.text};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: ${p => p.theme.colors.textLight};
  transition: all 0.2s;
  
  &:hover {
    color: ${p => p.theme.colors.text};
    transform: rotate(90deg);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const PackageInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F8FAFC;
  border-radius: 12px;
  margin-bottom: 20px;
  
  h4 {
    font-size: 18px;
    font-weight: 700;
    color: ${p => p.theme.colors.text};
    margin-bottom: 4px;
  }
  
  p {
    font-size: 13px;
    color: ${p => p.theme.colors.textLight};
  }
`;

const PurchaseDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  
  span {
    font-size: 14px;
    color: ${p => p.theme.colors.textLight};
  }
  
  strong {
    font-size: 16px;
    font-weight: 700;
    color: ${p => p.theme.colors.text};
  }
`;

const InfoNote = styled.div`
  padding: 12px 16px;
  background: #FEF3C7;
  border: 1px solid #FDE68A;
  border-radius: 8px;
  font-size: 13px;
  color: #92400E;
  line-height: 1.6;
  text-wrap: balance;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #E2E8F0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  border: 1.5px solid #E2E8F0;
  background: white;
  color: ${p => p.theme.colors.text};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #CBD5E1;
    background: #F8FAFC;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ConfirmButton = styled.button`
  padding: 10px 24px;
  border: none;
  background: #1e40af;
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #1e3a8a;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const DurationOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 20px;
`;

const DurationOptionCard = styled.div`
  padding: 20px;
  background: white;
  border: 2px solid #E2E8F0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  
  &:hover {
    border-color: ${p => p.$color};
    background: ${p => p.$color}10;
    transform: translateY(-4px);
    box-shadow: 0 8px 20px ${p => p.$color}20;
  }
`;

const DurationLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #64748B;
  margin-bottom: 8px;
`;

const DurationPrice = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: ${p => p.$color};
`;

const SuccessModalContent = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 450px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const SuccessIcon = styled(motion.div)`
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
`;

const SuccessTitle = styled.h2`
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 12px;
`;

const SuccessMessage = styled.p`
  font-size: 15px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 28px;
`;

const SuccessButton = styled.button`
  padding: 12px 32px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }
`;

const InsufficientBalanceModalContent = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 450px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ErrorIcon = styled(motion.div)`
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
`;

const ErrorTitle = styled.h2`
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 12px;
`;

const ErrorMessage = styled.p`
  font-size: 15px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 28px;
`;

const InsufficientBalanceSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
  margin: -6px 0 24px;

  > div {
    min-width: 0;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    text-align: left;
  }

  span {
    display: block;
    margin-bottom: 5px;
    color: #64748b;
    font-size: 12px;
  }

  strong {
    display: block;
    color: #1e293b;
    font-size: 14px;
    white-space: nowrap;
  }

  > div:last-child strong {
    color: #d97706;
  }

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const DepositModalContent = styled.div`
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow: hidden;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const DepositStepHint = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 18px;
  color: #1e40af;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;

  svg { flex: 0 0 auto; margin-top: 1px; }
`;

const DepositSectionLabel = styled.div`
  margin: 0 0 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
`;

const DepositQuickOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 18px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const DepositQuickButton = styled.button`
  min-width: 0;
  padding: 10px 8px;
  color: ${p => p.$selected ? '#1e40af' : '#475569'};
  background: ${p => p.$selected ? '#eff6ff' : '#fff'};
  border: 1px solid ${p => p.$selected ? '#2563eb' : '#e2e8f0'};
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #2563eb;
    color: #1e40af;
    background: #eff6ff;
  }
`;

const DepositAmountField = styled.div`
  position: relative;
  margin-bottom: 6px;
`;

const DepositAmountInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 12px 58px 12px 14px;
  color: #1e293b;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  outline: none;
  font-size: 16px;
  font-weight: 700;

  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
`;

const DepositCurrency = styled.span`
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
`;

const DepositAmountHint = styled.div`
  min-height: 18px;
  margin-bottom: 16px;
  color: #64748b;
  font-size: 12px;
`;

const DepositQrLayout = styled.div`
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  gap: 18px;
  align-items: start;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    justify-items: center;
  }
`;

const DepositQrImage = styled.img`
  display: block;
  width: 170px;
  height: 170px;
  object-fit: contain;
  padding: 6px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
`;

const DepositPaymentDetails = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
`;

const DepositPaymentRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 9px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;

  &:last-child { border-bottom: none; padding-bottom: 0; }

  .label { color: #64748b; flex: 0 0 auto; }
  .value { color: #1e293b; font-weight: 700; text-align: right; word-break: break-word; }
`;

const DepositCopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 5px;
  padding: 3px 6px;
  color: #1e40af;
  background: #eff6ff;
  border: 0;
  border-radius: 5px;
  font-size: 11px;
  cursor: pointer;
`;

const DepositPollingStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 16px;
  padding: 10px 12px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.45;
`;

const PACKAGE_ICONS = {
  star: Star,
  zap: Zap,
  rocket: Rocket,
  sparkles: Sparkles
};

// ─── Component ────────────────────────────────────────────────
const Subscription = () => {
  const { language: lang } = useLanguage();
  const navigate = useNavigate();
  const vi = lang === 'vi';
  const [packageCatalog, setPackageCatalog] = React.useState(getDefaultPackageCatalog());
  const [selectedPackage, setSelectedPackage] = React.useState(null);
  const [selectedDuration, setSelectedDuration] = React.useState(null);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [showDurationModal, setShowDurationModal] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = React.useState(false);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [walletBalance, setWalletBalance] = React.useState(null);
  const [walletCode, setWalletCode] = React.useState('');
  const [isLoadingWalletBalance, setIsLoadingWalletBalance] = React.useState(false);
  const [purchaseIdempotencyKey, setPurchaseIdempotencyKey] = React.useState('');
  const [showDepositModal, setShowDepositModal] = React.useState(false);
  const [depositStep, setDepositStep] = React.useState(1);
  const [depositRawAmount, setDepositRawAmount] = React.useState('');
  const [depositEmployerId, setDepositEmployerId] = React.useState('');
  const [depositBaselineBalance, setDepositBaselineBalance] = React.useState(null);
  const [isDepositWalletLoading, setIsDepositWalletLoading] = React.useState(false);
  const [depositSuccess, setDepositSuccess] = React.useState(false);
  const [depositError, setDepositError] = React.useState('');
  const [copiedDepositField, setCopiedDepositField] = React.useState('');
  // 'loading' | 'verified' | 'pending' | 'not_submitted'
  const [verificationState, setVerificationState] = React.useState('loading');
  const [showNotVerifiedModal, setShowNotVerifiedModal] = React.useState(false);
  const [showPendingVerificationModal, setShowPendingVerificationModal] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const loadPackageCatalog = async () => {
      try {
        const catalog = await getPackageCatalog();
        if (isMounted) {
          setPackageCatalog(catalog);
        }
      } catch (error) {
        console.error('Error loading package catalog:', error);
        if (isMounted) {
          setPackageCatalog(getDefaultPackageCatalog());
        }
      }
    };

    const loadVerificationStatus = async () => {
      try {
        const profile = await employerProfileService.getMyProfile();
        if (isMounted) {
          if (profile?.isVerified === true) {
            setVerificationState('verified');
          } else if (profile?.verificationStatus === 'pending') {
            // Đã nộp hồ sơ, đang chờ admin xét duyệt
            setVerificationState('pending');
          } else {
            // Chưa từng nộp hồ sơ xác thực
            setVerificationState('not_submitted');
          }
        }
      } catch (error) {
        console.error('Error loading employer profile for verification check:', error);
        if (isMounted) {
          setVerificationState('not_submitted');
        }
      }
    };

    loadPackageCatalog();
    loadVerificationStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const plans = React.useMemo(() => (
    packageCatalog.map((item) => {
      const iconKey = item.iconKey || 'sparkles';
      const IconComponent = PACKAGE_ICONS[iconKey] || Sparkles;

      return {
        packageId: item.packageId,
        packageName: item.packageName,
        name: vi ? `${item.order}. ${item.packageName}` : `${item.order}. ${item.packageName}`,
        subtitle: vi ? item.subtitle.vi : item.subtitle.en,
        prices: item.prices.map((priceOption) => ({
          duration: priceOption.duration,
          amount: `${Number(priceOption.amount || 0).toLocaleString('vi-VN')} VND`
        })),
        Icon: IconComponent,
        color: item.color,
        bg: item.bg,
        bd: item.bd,
        dur: item.dur,
        featured: item.featured,
        feats: vi ? item.features.vi : item.features.en
      };
    })
  ), [packageCatalog, vi]);

  const handleSelectPackage = (plan, priceOption) => {
    if (verificationState !== 'verified') {
      if (verificationState === 'pending') {
        setShowPendingVerificationModal(true);
      } else {
        setShowNotVerifiedModal(true);
      }
      return;
    }
    setSelectedPackage(plan);
    setSelectedDuration(priceOption);
    setShowDurationModal(true);
  };

  const handleClickPackageButton = (plan) => {
    if (verificationState !== 'verified') {
      if (verificationState === 'pending') {
        setShowPendingVerificationModal(true);
      } else {
        setShowNotVerifiedModal(true);
      }
      return;
    }
    setSelectedPackage(plan);
    if (plan.prices && plan.prices.length > 0) {
      setSelectedDuration(plan.prices[0]);
    } else {
      setSelectedDuration(null);
    }
    setShowDurationModal(true);
  };

  const parseAmount = (value) => Number(String(value || '').replace(/[^0-9]/g, '')) || 0;
  const formatAmount = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;
  const selectedPackageAmount = parseAmount(selectedDuration?.amount);
  const knownWalletBalance = walletBalance == null ? 0 : Number(walletBalance);
  const amountToTopUp = Math.max(1000, selectedPackageAmount - knownWalletBalance);
  const parsedDepositAmount = parseAmount(depositRawAmount);
  const depositQuickAmounts = Array.from(new Set([
    amountToTopUp,
    100000,
    200000,
    500000
  ])).filter((amount) => amount > 0).slice(0, 4);

  const fetchDepositWallet = async () => {
    const { employerId } = await getEmployerInfo();
    const wallet = await getWallet(employerId);
    const currentBalance = Number(wallet?.walletBalance ?? 0);
    setDepositEmployerId(employerId);
    setWalletCode(wallet?.walletCode || '');
    setWalletBalance(currentBalance);
    return { employerId, wallet, currentBalance };
  };

  // ── Helper: lấy employerId và companyName ──────────────────────────────────
  const getEmployerInfo = async () => {
    let employerId = 'unknown';
    let companyName = 'Unknown Company';
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      if (session?.tokens) {
        employerId = session.tokens.idToken?.payload?.sub || 'unknown';
      }
    } catch (e) { console.error('Error getting Cognito session:', e); }
    try {
      const profile = await employerProfileService.getMyProfile();
      if (profile?.companyName || profile?.businessName) {
        companyName = profile.companyName || profile.businessName;
      }
    } catch (e) { console.error('Error getting employer profile:', e); }
    return { employerId, companyName };
  };

  // ── Helper: gọi API tạo subscription ──────────────────────────────────────
  const createSubscription = async (employerId, companyName, paymentMethod) => {
    const API_ENDPOINT = import.meta.env.VITE_PACKAGE_SUBSCRIPTIONS_API;
    const purchaseData = {
      employerId,
      companyName,
      packageId: selectedPackage.packageId,
      packageName: selectedPackage.packageName,
      duration: selectedDuration.duration,
      paymentMethod,
      idempotencyKey: purchaseIdempotencyKey
    };
    const response = await fetch(`${API_ENDPOINT}/subscriptions`, {
      method: 'POST',
      headers: {
        ...(await getAuthHeaders()),
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(purchaseData)
    });
    if (!response.ok) {
      const errorMsg = await response.json().catch(() => ({}));
      const error = new Error(errorMsg.message || 'Thất bại. Vui lòng thử lại.');
      error.status = response.status;
      error.code = errorMsg.code;
      throw error;
    }
    return response.json();
  };

  const createPurchaseIdempotencyKey = () => (
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `purchase-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  // Open a confirmation step before any money-changing request is made.
  const openPurchaseConfirmation = async () => {
    if (!selectedPackage || !selectedDuration) return;
    setPurchaseIdempotencyKey(createPurchaseIdempotencyKey());
    setWalletBalance(null);
    setIsLoadingWalletBalance(true);
    setShowDurationModal(false);
    setShowConfirmModal(true);

    try {
      const { employerId } = await getEmployerInfo();
      const wallet = await getWallet(employerId);
      setDepositEmployerId(employerId);
      setWalletCode(wallet?.walletCode || '');
      setWalletBalance(Number(wallet?.walletBalance ?? 0));
    } catch (error) {
      // The server performs the authoritative balance check at purchase time.
      console.warn('Unable to pre-load wallet balance for confirmation:', error);
    } finally {
      setIsLoadingWalletBalance(false);
    }
  };

  const openDepositModal = async () => {
    setShowInsufficientBalanceModal(false);
    setDepositStep(1);
    setDepositSuccess(false);
    setDepositError('');
    setCopiedDepositField('');
    setDepositRawAmount(String(amountToTopUp));
    setDepositBaselineBalance(null);
    setShowDepositModal(true);
    setIsDepositWalletLoading(true);

    try {
      const { currentBalance } = await fetchDepositWallet();
      setDepositBaselineBalance(currentBalance);
      setDepositRawAmount(String(Math.max(1000, selectedPackageAmount - currentBalance)));
    } catch (error) {
      console.error('Unable to load wallet for deposit:', error);
      setDepositError(vi ? 'Không thể tải thông tin ví. Vui lòng thử lại.' : 'Unable to load wallet details. Please try again.');
    } finally {
      setIsDepositWalletLoading(false);
    }
  };

  const closeDepositModal = () => {
    if (depositSuccess) return;
    setShowDepositModal(false);
    setDepositStep(1);
    setDepositError('');
    setShowInsufficientBalanceModal(false);
  };

  const handleDepositAmountInput = (event) => {
    setDepositRawAmount(event.target.value.replace(/\D/g, ''));
    setDepositError('');
  };

  const handleCreateDepositQr = async () => {
    if (parsedDepositAmount < 1000 || isDepositWalletLoading) {
      setDepositError(vi ? 'Vui lòng nhập số tiền từ 1.000 VND.' : 'Enter an amount of at least 1,000 VND.');
      return;
    }

    setDepositError('');
    setIsDepositWalletLoading(true);
    try {
      let loadedWalletCode = walletCode;
      if (!depositEmployerId || !walletCode) {
        const { wallet, currentBalance } = await fetchDepositWallet();
        setDepositBaselineBalance(currentBalance);
        loadedWalletCode = wallet?.walletCode || '';
      }
      if (!loadedWalletCode) {
        throw new Error('Wallet details are unavailable');
      }
      setDepositStep(2);
    } catch (error) {
      console.error('Unable to create deposit QR:', error);
      setDepositError(vi ? 'Chưa thể tạo mã nạp tiền. Vui lòng thử lại.' : 'Unable to create the deposit code. Please try again.');
    } finally {
      setIsDepositWalletLoading(false);
    }
  };

  const handleCopyDeposit = (text, field) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedDepositField(field);
    setTimeout(() => setCopiedDepositField(''), 1800);
  };

  // Check for the bank transfer and return the user to the package confirmation
  // as soon as the wallet balance is updated.
  React.useEffect(() => {
    if (!showDepositModal || depositStep !== 2 || !depositEmployerId) return undefined;

    let completed = false;
    const baseline = Number(depositBaselineBalance ?? walletBalance ?? 0);
    const checkDeposit = async () => {
      try {
        const wallet = await getWallet(depositEmployerId);
        const nextBalance = Number(wallet?.walletBalance ?? 0);
        if (!completed && nextBalance > baseline) {
          completed = true;
          setWalletBalance(nextBalance);
          setDepositSuccess(true);
          setTimeout(() => {
            setShowDepositModal(false);
            setDepositStep(1);
            setDepositSuccess(false);
            setShowConfirmModal(true);
            setPurchaseIdempotencyKey(createPurchaseIdempotencyKey());
          }, 1800);
        }
      } catch (error) {
        console.warn('Unable to check deposit status:', error);
      }
    };

    checkDeposit();
    const intervalId = setInterval(checkDeposit, 5000);
    return () => clearInterval(intervalId);
  }, [showDepositModal, depositStep, depositEmployerId, depositBaselineBalance]);

  // ── Nút xác nhận mua gói: wallet debit + admin credit happen on the server
  const handlePurchase = async () => {
    if (!selectedPackage || !selectedDuration || isPurchasing) return;
    setIsPurchasing(true);

    try {
      const { employerId, companyName } = await getEmployerInfo();
      const result = await createSubscription(employerId, companyName, 'wallet');
      console.log('✅ Wallet package purchase completed:', result);

      setShowConfirmModal(false);
      setShowSuccessModal(true);
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('❌ Error purchasing package:', error);
      const isInsufficientBalance = error.status === 402
        || error.code === 'INSUFFICIENT_BALANCE'
        || /insufficient|số dư.*không đủ|không đủ.*thanh toán/i.test(error.message || '');
      if (isInsufficientBalance) {
        setShowConfirmModal(false);
        setShowInsufficientBalanceModal(true);
      } else {
        alert(error.message || (vi ? 'Có lỗi xảy ra khi mua gói. Vui lòng thử lại.' : 'Unable to purchase package. Please try again.'));
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const faqs = [
    { Icon: CreditCard, q: vi ? 'Các phương thức thanh toán nào được chấp nhận?' : 'Which payment methods are accepted?', a: vi ? 'Chúng tôi chấp nhận thẻ tín dụng, thẻ ghi nợ, chuyển khoản ngân hàng và ví điện tử. Tất cả giao dịch đều được bảo mật SSL 256-bit.' : 'We accept credit cards, debit cards, bank transfers, and e-wallets. All transactions use 256-bit SSL security.' },
    { Icon: Shield, q: vi ? 'Gói dịch vụ có tự động gia hạn không?' : 'Do packages auto-renew?', a: vi ? 'Không. Gói boost/banner là dịch vụ một lần, không tự động gia hạn. Bạn có thể mua lại khi cần.' : 'No. Boost/banner packages are one-time services with no auto-renewal. You can purchase again when needed.' },
    { Icon: Clock, q: vi ? 'Khi nào tin tuyển dụng bắt đầu hiện thị sau khi mua?' : 'When does the post start showing after purchase?', a: vi ? 'Ngay lập tức. Tin tuyển dụng sẽ được đẩy lên và hiển thị nổi bật trong vòng 1-2 phút sau khi thanh toán thành công.' : 'Immediately. Your job post will be boosted and featured within 1-2 minutes after successful payment.' },
    { Icon: HelpCircle, q: vi ? 'Có thể mua nhiều gói cùng lúc không?' : 'Can I buy multiple packages at once?', a: vi ? 'Có. Bạn có thể mua nhiều gói khác nhau cho cùng một tin hoặc áp dụng cho nhiều tin khác nhau. Tất cả đều hoạt động đồng thời.' : 'Yes. You can purchase multiple packages for the same post or apply them to different posts. All will work simultaneously.' },
  ];

  const buildCard = (plan, i) => (
    <PricingCard
      key={i}
      $featured={plan.featured}
      $color={plan.color}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.38, delay: i * 0.12, ease: [0.4, 0, 0.2, 1] }}
      whileHover={plan.featured
        ? { y: -7, boxShadow: '0 24px 60px rgba(30,64,175,0.28)' }
        : { y: -6, boxShadow: `0 16px 44px ${plan.color}28` }}
    >
      {plan.featured && (
        <PopularBadge
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 16 }}
        >
          <Sparkles /> {vi ? 'Phổ Biến Nhất' : 'Most Popular'}
        </PopularBadge>
      )}

      <PlanIconWrap $bg={plan.bg} $bd={plan.bd} $c={plan.color} $dur={plan.dur}
        whileHover={{ scale: 1.1, rotate: -7, transition: { type: 'spring', stiffness: 300 } }}
      >
        <plan.Icon />
      </PlanIconWrap>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.12 + 0.15 }}
      >
        <PlanName>{plan.name}</PlanName>
        {plan.subtitle && <PricePer style={{ textAlign: 'center', marginBottom: '12px', marginTop: '-10px' }}>{plan.subtitle}</PricePer>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.12 + 0.22, type: 'spring', stiffness: 200 }}
      >
        <PriceBox>
          {plan.prices ? (
            plan.prices.map((priceOption, pi) => (
              <PriceOption
                key={pi}
                $color={plan.color}
                onClick={() => handleSelectPackage(plan, priceOption)}
              >
                <PriceDuration>{priceOption.duration}</PriceDuration>
                <PriceAmount $c={plan.color}>{priceOption.amount}</PriceAmount>
              </PriceOption>
            ))
          ) : (
            <>
              <PriceNum $c={plan.color}>
                {plan.price}<span className="unit">{plan.curr}</span>
              </PriceNum>
              <PricePer>{plan.per}</PricePer>
            </>
          )}
        </PriceBox>
      </motion.div>

      <Features>
        {plan.feats.map((f, fi) => (
          <FeatureItem
            key={fi}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 + fi * 0.07 + 0.28, duration: 0.22 }}
          >
            <span className="chk"><Check /></span>
            {f}
          </FeatureItem>
        ))}
      </Features>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 + 0.45 }}
      >
        <Btn
          whileTap={{ scale: 0.97 }}
          onClick={() => handleClickPackageButton(plan)}
        >
          {vi ? 'Chọn Gói' : 'Select Plan'}
        </Btn>
      </motion.div>
    </PricingCard>
  );

  return (
    <DashboardLayout role="employer" showSearch={false} key={lang}>
      <OrbBlue /><OrbGreen />
      <PageContainer
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      >
        <Inner>
          {/* Header */}
          <PageHeader>
            <PageIconBox whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}>
              <Star />
            </PageIconBox>
            <PageTitleText>
              <h1>{vi ? 'Dịch Vụ Đề Xuất ' : 'Pricing to Boost'}</h1>
              <p>{vi ? 'Chọn gói dịch vụ để đẩy tin tuyển dụng của bạn lên "TOP"' : 'Choose a boost package to push your job posts to the top'}</p>
            </PageTitleText>
          </PageHeader>

          {/* Verification Banner */}
          {verificationState === 'not_submitted' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#FFF7ED', border: '1.5px solid #FED7AA',
              borderRadius: '12px', padding: '12px 16px', marginBottom: '14px'
            }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span style={{ fontSize: '13.5px', color: '#92400E', fontWeight: 500, flex: 1 }}>
                Tài khoản của bạn chưa được xác thực.{' '}
                <button
                  onClick={() => navigate('/employer/profile')}
                  style={{
                    background: 'none', border: 'none', color: '#d97706',
                    fontWeight: 700, cursor: 'pointer', textDecoration: 'underline',
                    fontSize: '13.5px', padding: 0
                  }}
                >
                  Xác thực ngay
                </button>
                {' '}để sử dụng các gói dịch vụ đẩy tin.
              </span>
            </div>
          )}
          {verificationState === 'pending' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#FFFBEB', border: '1.5px solid #FDE68A',
              borderRadius: '12px', padding: '12px 16px', marginBottom: '14px'
            }}>
              <span style={{ fontSize: '18px' }}>⏳</span>
              <span style={{ fontSize: '13.5px', color: '#92400E', fontWeight: 500 }}>
                Hồ sơ của bạn đang chờ admin xác minh. Bạn sẽ có thể sử dụng gói dịch vụ ngay sau khi được duyệt.
              </span>
            </div>
          )}

          {/* Pricing grid */}
          <PricingGrid>
            {plans.map((plan, i) => buildCard(plan, i))}
          </PricingGrid>

        </Inner>

        {/* Package duration selection modal */}
        {showDurationModal && selectedPackage && (
          <ModalOverlay onClick={() => setShowDurationModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <ModalHeader>
                <h3>{vi ? 'Chọn gói dịch vụ' : 'Select Service Package'}</h3>
                <CloseButton onClick={() => setShowDurationModal(false)}>
                  <X />
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                <PackageInfo>
                  <selectedPackage.Icon size={40} color={selectedPackage.color} />
                  <div>
                    <h4>{selectedPackage.name}</h4>
                    <p>{selectedPackage.subtitle}</p>
                  </div>
                </PackageInfo>

                {/* Duration Options */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155', marginBottom: '10px', textAlign: 'left' }}>
                    {vi ? 'Chọn thời hạn sử dụng:' : 'Select duration:'}
                  </div>
                  <DurationOptions style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '8px' }}>
                    {selectedPackage.prices.map((priceOption, idx) => {
                      const isSelected = selectedDuration && selectedDuration.duration === priceOption.duration;
                      return (
                        <DurationOptionCard
                          key={idx}
                          $color={selectedPackage.color}
                          style={{
                            borderColor: isSelected ? selectedPackage.color : '#E2E8F0',
                            background: isSelected ? `${selectedPackage.color}12` : 'white',
                            padding: '12px 8px',
                            transform: isSelected ? 'scale(1.02)' : 'none',
                            boxShadow: isSelected ? `0 4px 12px ${selectedPackage.color}18` : 'none',
                            borderWidth: isSelected ? '2px' : '1px'
                          }}
                          onClick={() => setSelectedDuration(priceOption)}
                        >
                          <DurationLabel style={{ color: isSelected ? selectedPackage.color : '#64748B', fontSize: '12.5px', marginBottom: '4px' }}>
                            {priceOption.duration}
                          </DurationLabel>
                          <DurationPrice style={{ color: isSelected ? selectedPackage.color : '#1E293B', fontSize: '14.5px', fontWeight: '800' }}>
                            {priceOption.amount}
                          </DurationPrice>
                        </DurationOptionCard>
                      );
                    })}
                  </DurationOptions>
                </div>

                {/* Wallet payment information */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '16px',
                  background: '#EFF6FF',
                  border: '1.5px solid #BFDBFE',
                  borderRadius: '12px',
                  textAlign: 'left',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={16} /> {vi ? 'Thanh toán trực tiếp từ ví' : 'Pay directly from your wallet'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                    {vi
                      ? 'Bạn sẽ thanh toán bằng số dư trong ví. Gói sẽ được kích hoạt ngay sau khi thanh toán thành công.'
                      : 'You will pay with your wallet balance. Your package will be activated as soon as the payment is complete.'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid #DBEAFE', paddingTop: '10px', marginTop: '4px', fontSize: '12.5px', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
                      <CreditCard size={14} style={{ color: '#1e40af' }} />
                      <span>{vi ? 'Giao dịch được ghi nhận trong lịch sử ví.' : 'The transaction will appear in your wallet history.'}</span>
                    </div>
                  </div>
                </div>

                {/* Buttons inside ModalBody */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <CancelButton type="button" onClick={() => setShowDurationModal(false)} style={{ padding: '8px 16px', fontSize: '13.5px' }}>
                    {vi ? 'Hủy' : 'Cancel'}
                  </CancelButton>
                  <ConfirmButton
                    type="button"
                    onClick={openPurchaseConfirmation}
                    style={{ background: selectedPackage.color, padding: '8px 20px', fontSize: '13.5px' }}
                  >
                    {vi ? 'Tiếp tục' : 'Continue'}
                  </ConfirmButton>
                </div>
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Final confirmation modal: no charge is made until the employer confirms. */}
        {showConfirmModal && selectedPackage && selectedDuration && (
          <ModalOverlay onClick={() => !isPurchasing && setShowConfirmModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <ModalHeader>
                <h3>{vi ? 'Xác nhận mua gói' : 'Confirm package purchase'}</h3>
                <CloseButton onClick={() => !isPurchasing && setShowConfirmModal(false)}>
                  <X />
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                <PackageInfo>
                  <selectedPackage.Icon size={40} color={selectedPackage.color} />
                  <div>
                    <h4>{selectedPackage.name}</h4>
                    <p>{selectedPackage.subtitle}</p>
                  </div>
                </PackageInfo>

                <PurchaseDetails>
                  <DetailRow>
                    <span>{vi ? 'Thời hạn' : 'Duration'}</span>
                    <strong>{selectedDuration.duration}</strong>
                  </DetailRow>
                  <DetailRow>
                    <span>{vi ? 'Số tiền thanh toán' : 'Payment amount'}</span>
                    <strong style={{ color: selectedPackage.color }}>{selectedDuration.amount}</strong>
                  </DetailRow>
                  <DetailRow>
                    <span>{vi ? 'Số dư hiện tại' : 'Current balance'}</span>
                    <strong>
                      {isLoadingWalletBalance
                        ? (vi ? 'Đang kiểm tra…' : 'Checking…')
                        : walletBalance == null
                          ? (vi ? 'Sẽ kiểm tra lại khi xác nhận' : 'Checked again on confirmation')
                          : `${walletBalance.toLocaleString('vi-VN')} VND`}
                    </strong>
                  </DetailRow>
                </PurchaseDetails>

                <InfoNote>
                  {vi
                    ? 'Kiểm tra lại thông tin gói trước khi mua.'
                    : 'Review your package details before purchasing.'}
                </InfoNote>
              </ModalBody>
              <ModalFooter>
                <CancelButton type="button" disabled={isPurchasing} onClick={() => setShowConfirmModal(false)}>
                  {vi ? 'Hủy' : 'Cancel'}
                </CancelButton>
                <ConfirmButton type="button" disabled={isPurchasing} onClick={handlePurchase}>
                  {isPurchasing ? (vi ? 'Đang xử lý…' : 'Processing…') : (vi ? 'Đồng ý mua' : 'Confirm purchase')}
                </ConfirmButton>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <ModalOverlay>
            <SuccessModalContent
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <SuccessIcon
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle size={60} />
              </SuccessIcon>
              <SuccessTitle>
                {vi ? 'Mua gói thành công!' : 'Package purchased successfully!'}
              </SuccessTitle>
              <SuccessMessage>
                {vi
                  ? 'Gói đã được kích hoạt ngay. Số tiền đã trừ khỏi ví của bạn và chuyển vào ví admin.'
                  : 'Your package is active. The amount was deducted from your wallet and credited to the admin wallet.'}
              </SuccessMessage>
              <SuccessButton onClick={() => { setShowSuccessModal(false); setSelectedPackage(null); setSelectedDuration(null); }}>
                {vi ? 'Đóng' : 'Close'}
              </SuccessButton>
            </SuccessModalContent>
          </ModalOverlay>
        )}

        {/* Inline wallet top-up flow */}
        {showDepositModal && selectedPackage && selectedDuration && (
          <ModalOverlay onClick={(event) => {
            if (event.target === event.currentTarget && !depositSuccess) closeDepositModal();
          }}>
            <DepositModalContent onClick={(event) => event.stopPropagation()}>
              {depositSuccess ? (
                <div style={{ padding: '36px 24px', textAlign: 'center' }}>
                  <SuccessIcon
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ width: '76px', height: '76px', marginBottom: '18px' }}
                  >
                    <CheckCircle size={44} />
                  </SuccessIcon>
                  <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '21px' }}>
                    {vi ? 'Nạp tiền thành công!' : 'Deposit successful!'}
                  </h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
                    {vi ? 'Số dư đã được cập nhật. Bạn có thể tiếp tục mua gói.' : 'Your balance has been updated. You can continue purchasing the package.'}
                  </p>
                </div>
              ) : (
                <>
                  <ModalHeader>
                    <h3>{vi ? 'Nạp tiền vào ví' : 'Top up your wallet'}</h3>
                    <CloseButton onClick={closeDepositModal}>
                      <X />
                    </CloseButton>
                  </ModalHeader>
                  <ModalBody style={{ maxHeight: 'calc(90vh - 150px)', overflowY: 'auto' }}>
                    {depositStep === 1 ? (
                      <>
                        <DepositStepHint>
                          <Banknote size={17} />
                          <span>
                            {vi
                              ? `Bạn có thể nạp tối thiểu ${formatAmount(amountToTopUp)} để tiếp tục mua gói.`
                              : `Top up at least ${formatAmount(amountToTopUp)} to continue with this package.`}
                          </span>
                        </DepositStepHint>

                        <DepositSectionLabel>{vi ? 'Chọn nhanh' : 'Quick select'}</DepositSectionLabel>
                        <DepositQuickOptions>
                          {depositQuickAmounts.map((amount) => (
                            <DepositQuickButton
                              key={amount}
                              type="button"
                              $selected={parsedDepositAmount === amount}
                              onClick={() => {
                                setDepositRawAmount(String(amount));
                                setDepositError('');
                              }}
                            >
                              {Number(amount).toLocaleString('vi-VN')}
                            </DepositQuickButton>
                          ))}
                        </DepositQuickOptions>

                        <DepositSectionLabel>{vi ? 'Số tiền muốn nạp' : 'Amount to deposit'}</DepositSectionLabel>
                        <DepositAmountField>
                          <DepositAmountInput
                            type="text"
                            inputMode="numeric"
                            value={depositRawAmount ? Number(depositRawAmount).toLocaleString('vi-VN') : ''}
                            placeholder="0"
                            onChange={handleDepositAmountInput}
                            autoFocus
                          />
                          <DepositCurrency>VND</DepositCurrency>
                        </DepositAmountField>
                        <DepositAmountHint>
                          {depositError || (vi ? 'Tối thiểu 1.000 VND' : 'Minimum 1,000 VND')}
                        </DepositAmountHint>
                      </>
                    ) : (
                      <>
                        <DepositStepHint>
                          <Clock size={17} />
                          <span>
                            {vi ? 'Quét mã QR bằng ứng dụng ngân hàng và chuyển đúng số tiền bên dưới.' : 'Scan the QR code in your banking app and transfer the exact amount shown below.'}
                          </span>
                        </DepositStepHint>
                        <DepositQrLayout>
                          <DepositQrImage
                            src={`https://img.vietqr.io/image/MB-0777799991702-compact.png?amount=${parsedDepositAmount}&addInfo=${encodeURIComponent(`OPPOWALLET ${walletCode}`)}&accountName=${encodeURIComponent('NGUYEN THI THUY DUNG')}`}
                            alt="VietQR"
                          />
                          <DepositPaymentDetails>
                            <DepositPaymentRow>
                              <span className="label">{vi ? 'Ngân hàng' : 'Bank'}</span>
                              <span className="value">MBBank</span>
                            </DepositPaymentRow>
                            <DepositPaymentRow>
                              <span className="label">{vi ? 'Số tài khoản' : 'Account number'}</span>
                              <span className="value">
                                0777799991702
                                <DepositCopyButton type="button" onClick={() => handleCopyDeposit('0777799991702', 'account')}>
                                  <Copy size={11} /> {copiedDepositField === 'account' ? (vi ? 'Đã chép' : 'Copied') : (vi ? 'Chép' : 'Copy')}
                                </DepositCopyButton>
                              </span>
                            </DepositPaymentRow>
                            <DepositPaymentRow>
                              <span className="label">{vi ? 'Số tiền' : 'Amount'}</span>
                              <span className="value" style={{ color: '#059669' }}>{formatAmount(parsedDepositAmount)}</span>
                            </DepositPaymentRow>
                            <DepositPaymentRow>
                              <span className="label">{vi ? 'Nội dung' : 'Reference'}</span>
                              <span className="value">
                                {`OPPOWALLET ${walletCode}`}
                                <DepositCopyButton type="button" onClick={() => handleCopyDeposit(`OPPOWALLET ${walletCode}`, 'reference')}>
                                  <Copy size={11} /> {copiedDepositField === 'reference' ? (vi ? 'Đã chép' : 'Copied') : (vi ? 'Chép' : 'Copy')}
                                </DepositCopyButton>
                              </span>
                            </DepositPaymentRow>
                          </DepositPaymentDetails>
                        </DepositQrLayout>
                        <DepositPollingStatus>
                          <Clock size={15} />
                          <span>{vi ? 'Đang chờ xác nhận giao dịch. Số dư sẽ tự động cập nhật sau khi chuyển khoản thành công.' : 'Waiting for the transfer. Your balance will update automatically after the payment is received.'}</span>
                        </DepositPollingStatus>
                      </>
                    )}
                  </ModalBody>
                  <ModalFooter>
                    {depositStep === 1 ? (
                      <>
                        <CancelButton type="button" onClick={closeDepositModal}>
                          {vi ? 'Hủy' : 'Cancel'}
                        </CancelButton>
                        <ConfirmButton
                          type="button"
                          onClick={handleCreateDepositQr}
                          disabled={isDepositWalletLoading || parsedDepositAmount < 1000}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
                        >
                          <Banknote size={16} />
                          {isDepositWalletLoading ? (vi ? 'Đang tải…' : 'Loading…') : (vi ? 'Tạo mã QR' : 'Create QR code')}
                        </ConfirmButton>
                      </>
                    ) : (
                      <>
                        <CancelButton type="button" onClick={() => setDepositStep(1)}>
                          {vi ? 'Đổi số tiền' : 'Change amount'}
                        </CancelButton>
                        <ConfirmButton type="button" onClick={closeDepositModal}>
                          {vi ? 'Đóng' : 'Close'}
                        </ConfirmButton>
                      </>
                    )}
                  </ModalFooter>
                </>
              )}
            </DepositModalContent>
          </ModalOverlay>
        )}

        {/* Insufficient Balance Modal */}
        {showInsufficientBalanceModal && selectedPackage && selectedDuration && (
          <ModalOverlay onClick={() => setShowInsufficientBalanceModal(false)}>
            <InsufficientBalanceModalContent
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ErrorIcon
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 10px 30px rgba(245,158,11,0.3)' }}
              >
                <AlertCircle size={54} />
              </ErrorIcon>
              <ErrorTitle>
                {vi ? 'Số dư ví chưa đủ' : 'Wallet balance is too low'}
              </ErrorTitle>
              <ErrorMessage>
                {vi
                  ? `Số dư hiện tại chưa đủ để thanh toán gói ${selectedDuration?.amount}. Bạn có thể nạp thêm tiền ngay tại đây rồi tiếp tục mua gói.`
                  : `Your current balance is not enough for the ${selectedDuration?.amount} package. Top up here and continue your purchase.`}
              </ErrorMessage>
              <InsufficientBalanceSummary>
                <div>
                  <span>{vi ? 'Số dư hiện tại' : 'Current balance'}</span>
                  <strong>{walletBalance == null ? (vi ? 'Đang cập nhật' : 'Updating') : formatAmount(walletBalance)}</strong>
                </div>
                <div>
                  <span>{vi ? 'Cần nạp thêm' : 'Top up needed'}</span>
                  <strong>{formatAmount(amountToTopUp)}</strong>
                </div>
              </InsufficientBalanceSummary>
              <ModalFooter style={{ justifyContent: 'center', borderTop: 'none', padding: 0, flexWrap: 'wrap' }}>
                <CancelButton onClick={() => setShowInsufficientBalanceModal(false)}>
                  {vi ? 'Để sau' : 'Later'}
                </CancelButton>
                <ConfirmButton onClick={openDepositModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                  <Banknote size={16} />
                  {vi ? 'Nạp tiền ngay' : 'Top up now'}
                </ConfirmButton>
              </ModalFooter>
            </InsufficientBalanceModalContent>
          </ModalOverlay>
        )}
        {/* Not Verified Modal — Chưa nộp hồ sơ */}
        {showNotVerifiedModal && (
          <ModalOverlay onClick={() => setShowNotVerifiedModal(false)}>
            <InsufficientBalanceModalContent
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ErrorIcon
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 10px 30px rgba(245,158,11,0.3)' }}
              >
                <Shield size={50} />
              </ErrorIcon>
              <ErrorTitle>Tài khoản chưa được xác thực</ErrorTitle>
              <ErrorMessage>
                Bạn cần xác thực tài khoản nhà tuyển dụng trước khi có thể sử dụng các gói dịch vụ đẩy tin. Vui lòng hoàn tất xác thực để tiếp tục.
              </ErrorMessage>
              <ModalFooter style={{ justifyContent: 'center', borderTop: 'none', paddingTop: 0 }}>
                <CancelButton onClick={() => setShowNotVerifiedModal(false)}>
                  Để sau
                </CancelButton>
                <ConfirmButton
                  style={{ background: '#d97706' }}
                  onClick={() => {
                    setShowNotVerifiedModal(false);
                    navigate('/employer/profile');
                  }}
                >
                  Xác thực ngay
                </ConfirmButton>
              </ModalFooter>
            </InsufficientBalanceModalContent>
          </ModalOverlay>
        )}

        {/* Pending Verification Modal — Đã nộp hồ sơ, đang chờ duyệt */}
        {showPendingVerificationModal && (
          <ModalOverlay onClick={() => setShowPendingVerificationModal(false)}>
            <InsufficientBalanceModalContent
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ErrorIcon
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 10px 30px rgba(245,158,11,0.3)' }}
              >
                <Clock size={50} />
              </ErrorIcon>
              <ErrorTitle>Hồ sơ đang chờ xác minh</ErrorTitle>
              <ErrorMessage>
                Hồ sơ xác thực doanh nghiệp của bạn đã được gửi và đang trong quá trình xét duyệt. Đội ngũ quản trị viên sẽ xem xét và phản hồi trong thời gian sớm nhất. Bạn có thể sử dụng các gói dịch vụ ngay sau khi hồ sơ được duyệt.
              </ErrorMessage>
              <ModalFooter style={{ justifyContent: 'center', borderTop: 'none', paddingTop: 0 }}>
                <CancelButton
                  onClick={() => {
                    setShowPendingVerificationModal(false);
                    navigate('/employer/profile');
                  }}
                >
                  Xem lại hồ sơ đã gửi
                </CancelButton>
                <ConfirmButton
                  style={{ background: '#d97706' }}
                  onClick={() => setShowPendingVerificationModal(false)}
                >
                  Đã hiểu
                </ConfirmButton>
              </ModalFooter>
            </InsufficientBalanceModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </DashboardLayout>
  );
};

export default Subscription;
