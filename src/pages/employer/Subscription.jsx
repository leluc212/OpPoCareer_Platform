import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import employerProfileService from '../../services/employerProfileService';
import { Check, Zap, Star, Rocket, Sparkles, X, HelpCircle, CreditCard, Shield, Clock, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { createPackagePurchaseRequestNotification } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';

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
`;

/* decorative orbs behind everything */
const OrbBlue  = styled.div`
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
  margin-bottom: 36px;
`;
const PageIconBox = styled(motion.div)`
  width: 52px; height: 52px; border-radius: 15px;
  background: #EFF6FF; border: 1.5px solid #BFDBFE;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  svg { width: 22px; height: 22px; color: #1e40af; }
`;
const PageTitleText = styled.div`
  h1 { font-size: 26px; font-weight: 800; color: ${p => p.theme.colors.text}; letter-spacing: -0.5px; margin-bottom: 4px; }
  p  { font-size: 13.5px; color: ${p => p.theme.colors.textLight}; font-weight: 500; }
`;

// ─── Pricing grid (equal-height cards) ───────────────────────
const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  align-items: stretch;
  margin-bottom: 28px;
  padding-top: 22px;

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
  border-radius: 20px;
  border: 1.5px solid ${p => p.$featured ? 'transparent' : '#E8EFFF'};
  padding: 32px 24px 26px;
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
  width: 72px; height: 72px;
  margin: 8px auto 18px;
  border-radius: 20px;
  background: ${p => p.$bg};
  border: 1.5px solid ${p => p.$border};
  display: flex; align-items: center; justify-content: center;
  animation: ${floatY} ${p => p.$dur || '4s'} ease-in-out infinite;
  svg { width: 32px; height: 32px; color: ${p => p.$c}; }
`;

const PlanName = styled.h3`
  font-size: 21px; font-weight: 800; text-align: center;
  color: ${p => p.theme.colors.text}; letter-spacing: -0.3px; margin-bottom: 18px;
`;

const PriceBox = styled.div`
  background: #F8FAFC;
  border: 1.5px solid #F1F5F9;
  border-radius: 16px;
  padding: 18px 14px 14px;
  text-align: center;
  margin-bottom: 22px;
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
  padding: 10px 12px;
  background: white;
  border-radius: 10px;
  margin-bottom: 8px;
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
  display: flex; flex-direction: column; gap: 7px;
  margin: 0 0 22px; padding: 0; list-style: none;
`;

const FeatureItem = styled(motion.li)`
  display: flex; align-items: center; gap: 10px;
  font-size: 13.5px; font-weight: 500; color: ${p => p.theme.colors.text};
  padding: 6px 8px 6px 6px; border-radius: 9px;
  transition: background 0.15s ease, transform 0.15s ease;
  &:hover { background: #F8FAFC; transform: translateX(3px); }

  .chk {
    width: 22px; height: 22px; border-radius: 7px;
    background: #ECFDF5; border: 1px solid #6EE7B7;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    svg { width: 12px; height: 12px; color: #10B981; animation: ${checkBounce} 0.35s ease both; }
  }
`;

const Btn = styled(motion.button)`
  width: 100%; padding: 14px; border-radius: 12px;
  font-size: 14.5px; font-weight: 700; cursor: pointer;
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

// ─── Component ────────────────────────────────────────────────
const Subscription = () => {
  const { language: lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const vi = lang === 'vi';
  const [selectedPackage, setSelectedPackage] = React.useState(null);
  const [selectedDuration, setSelectedDuration] = React.useState(null);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [showDurationModal, setShowDurationModal] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = React.useState(false);

  const handleSelectPackage = (plan, priceOption) => {
    setSelectedPackage(plan);
    setSelectedDuration(priceOption);
    setShowConfirmModal(true);
  };

  const handleClickPackageButton = (plan) => {
    setSelectedPackage(plan);
    setShowDurationModal(true);
  };

  const handleSelectDuration = (priceOption) => {
    setSelectedDuration(priceOption);
    setShowDurationModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = async () => {
    setShowConfirmModal(false);

    // Gửi notification cho admin
    try {
      let employerId = user?.username || 'unknown';
      let companyName = 'Unknown Company';
      try {
        const profile = await employerProfileService.getMyProfile();
        companyName = profile?.companyName || profile?.businessName || companyName;
      } catch (_) {}
      const amount = parseInt((selectedDuration?.amount || '0').replace(/[^0-9]/g, ''));
      await createPackagePurchaseRequestNotification({
        subscriptionId: `sub_${Date.now()}`,
        employerId,
        companyName,
        packageName: selectedPackage?.name || '',
        duration: selectedDuration?.duration || '',
        price: amount,
      });
    } catch (err) {
      console.warn('Notification error:', err.message);
    }

    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      setSelectedPackage(null);
      setSelectedDuration(null);
    }, 3000);
  };
  const plans = [
    {
      name:    vi ? 'Quick Boost' : 'Quick Boost',
      subtitle: vi ? 'Gói Boost' : 'Boost Package',
      prices: [
        { duration: vi ? '24h' : '24h', amount: '29,000 VND' },
        { duration: vi ? '7 ngày' : '7 days', amount: '145,000 VND' }
      ],
      Icon: Zap,
      color: '#10B981', bg: '#ECFDF5', bd: '#A7F3D0', dur: '4.2s',
      feats: [
        vi ? 'Đẩy tin lên đầu trang' : 'Push post to top',
        vi ? 'Hiển thị nổi bật' : 'Featured display',
        vi ? 'Tăng lượt xem 3x' : '3x more views',
        vi ? 'Báo cáo chi tiết' : 'Detailed reports',
      ]
    },
    {
      name:     vi ? 'Hot Search' : 'Hot Search',
      subtitle: vi ? 'Tìm kiếm hot' : 'Hot Search',
      prices: [
        { duration: vi ? '24h' : '24h', amount: '49,000 VND' },
        { duration: vi ? '7 ngày' : '7 days', amount: '245,000 VND' }
      ],
      Icon: Star,
      color: '#1e40af', bg: '#EFF6FF', bd: '#BFDBFE', dur: '3.6s',
      featured: true,
      feats: [
        vi ? 'Ưu tiên kết quả tìm kiếm' : 'Priority in search results',
        vi ? 'Hiển thị với badge đặc biệt' : 'Special badge display',
        vi ? 'Tăng lượt xem 5x' : '5x more views',
        vi ? 'Thông báo cho ứng viên phù hợp' : 'Notify matching candidates',
        vi ? 'Phân tích nâng cao' : 'Advanced analytics',
      ]
    },
    {
      name:    vi ? 'Spotlight Banner' : 'Spotlight Banner',
      subtitle: vi ? 'Banner Nổi bật 1' : 'Featured Banner 1',
      prices: [
        { duration: vi ? '24h' : '24h', amount: '99,000 VND' },
        { duration: vi ? '7 ngày' : '7 days', amount: '495,000 VND' }
      ],
      Icon: Rocket,
      color: '#F59E0B', bg: '#FFFBEB', bd: '#FDE68A', dur: '5s',
      feats: [
        vi ? 'Hiển thị banner trang chủ' : 'Homepage banner display',
        vi ? 'Vị trí nổi bật nhất' : 'Top spotlight position',
        vi ? 'Tăng lượt xem 10x' : '10x more views',
        vi ? 'Tiếp cận tối đa ứng viên' : 'Maximum candidate reach',
        vi ? 'Thống kê chi tiết theo giờ' : 'Hourly detailed stats',
      ]
    },
    {
      name:    vi ? 'Top Spotlight' : 'Top Spotlight',
      subtitle: vi ? 'Banner Nổi bật 2' : 'Featured Banner 2',
      prices: [
        { duration: vi ? '24h' : '24h', amount: '149,000 VND' },
        { duration: vi ? '7 ngày' : '7 days', amount: '745,000 VND' }
      ],
      Icon: Sparkles,
      color: '#DC2626', bg: '#FEE2E2', bd: '#FECACA', dur: '4.5s',
      feats: [
        vi ? 'Banner siêu nổi bật đa nền tảng' : 'Super spotlight multi-platform banner',
        vi ? 'Hiển thị tất cả các trang' : 'Display on all pages',
        vi ? 'Tăng lượt xem 15x' : '15x more views',
      ]
    },
  ];

  const compareRows = [
    [vi ? 'Giá 24h' : '24h Price', '29,000', '49,000', '99,000', '149,000'],
    [vi ? 'Giá 7 ngày' : '7 days Price', '145,000', '245,000', '495,000', '745,000'],
    [vi ? 'Tăng lượt xem' : 'Views boost', '3x', '5x', '10x', '15x'],
    [vi ? 'Đẩy tin lên đầu' : 'Push to top', true, false, false, false],
    [vi ? 'Ưu tiên tìm kiếm' : 'Priority search', false, true, false, false],
    [vi ? 'Badge đặc biệt' : 'Special badge', false, true, false, false],
    [vi ? 'Thông báo ứng viên' : 'Notify candidates', false, true, false, false],
    [vi ? 'Banner trang chủ' : 'Homepage banner', false, false, true, true],
    [vi ? 'Hiển thị đa trang' : 'Multi-page display', false, false, false, true],
    [vi ? 'Phân tích' : 'Analytics', vi ? 'Cơ bản' : 'Basic', vi ? 'Nâng cao' : 'Advanced', vi ? 'Theo giờ' : 'Hourly', vi ? 'Theo giờ' : 'Hourly'],
  ];

  const faqs = [
    { Icon: CreditCard, q: vi ? 'Các phương thức thanh toán nào được chấp nhận?' : 'Which payment methods are accepted?',    a: vi ? 'Chúng tôi chấp nhận thẻ tín dụng, thẻ ghi nợ, chuyển khoản ngân hàng và ví điện tử. Tất cả giao dịch đều được bảo mật SSL 256-bit.' : 'We accept credit cards, debit cards, bank transfers, and e-wallets. All transactions use 256-bit SSL security.' },
    { Icon: Shield,     q: vi ? 'Gói dịch vụ có tự động gia hạn không?' : 'Do packages auto-renew?',                    a: vi ? 'Không. Gói boost/banner là dịch vụ một lần, không tự động gia hạn. Bạn có thể mua lại khi cần.' : 'No. Boost/banner packages are one-time services with no auto-renewal. You can purchase again when needed.' },
    { Icon: Clock,      q: vi ? 'Khi nào tin tuyển dụng bắt đầu hiện thị sau khi mua?' : 'When does the post start showing after purchase?',                    a: vi ? 'Ngay lập tức. Tin tuyển dụng sẽ được đẩy lên và hiển thị nổi bật trong vòng 1-2 phút sau khi thanh toán thành công.' : 'Immediately. Your job post will be boosted and featured within 1-2 minutes after successful payment.' },
    { Icon: HelpCircle, q: vi ? 'Có thể mua nhiều gói cùng lúc không?' : 'Can I buy multiple packages at once?',                            a: vi ? 'Có. Bạn có thể mua nhiều gói khác nhau cho cùng một tin hoặc áp dụng cho nhiều tin khác nhau. Tất cả đều hoạt động đồng thời.' : 'Yes. You can purchase multiple packages for the same post or apply them to different posts. All will work simultaneously.' },
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
          $primary={plan.featured} 
          whileTap={{ scale: 0.97 }}
          onClick={() => handleClickPackageButton(plan)}
        >
          {plan.featured && <Sparkles />}
          {plan.featured ? (vi ? 'Bắt Đầu Ngay' : 'Start Now') : (vi ? 'Chọn Gói' : 'Select Plan')}
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

          {/* Pricing grid */}
          <PricingGrid>
            {plans.map((plan, i) => buildCard(plan, i))}
          </PricingGrid>

          {/* Comparison */}
          <SectionCard
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.32 }}
          >
            <SectionHead><h2>{vi ? 'So Sánh Chi Tiết Các Gói' : 'Detailed Package Comparison'}</h2></SectionHead>
            <CompTable>
              <thead>
                <tr>
                  <th>{vi ? 'Tính Năng' : 'Feature'}</th>
                  <th style={{ color: '#10B981' }}>Quick Boost</th>
                  <th style={{ color: '#1e40af' }}>Hot Search</th>
                  <th style={{ color: '#F59E0B' }}>Spotlight Banner</th>
                  <th style={{ color: '#DC2626' }}>Top Spotlight</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map(([label, ...vals], ri) => (
                  <tr key={ri}>
                    <td>{label}</td>
                    {vals.map((v, vi2) => (
                      <td key={vi2}>
                        {typeof v === 'boolean'
                          ? v ? <Check style={{ color: '#10B981' }} /> : <X style={{ color: '#EF4444' }} />
                          : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </CompTable>
          </SectionCard>

          {/* FAQ */}
          <SectionCard
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.32 }}
          >
            <SectionHead><h2>{vi ? 'Câu Hỏi Thường Gặp' : 'FAQ'}</h2></SectionHead>
            {faqs.map(({ Icon, q, a }, i) => (
              <FAQItem
                key={i}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09, duration: 0.24 }}
              >
                <h3><Icon />{q}</h3>
                <p>{a}</p>
              </FAQItem>
            ))}
          </SectionCard>
        </Inner>

        {/* Duration Selection Modal */}
        {showDurationModal && selectedPackage && (
          <ModalOverlay onClick={() => setShowDurationModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h3>{vi ? 'Chọn thời hạn gói' : 'Select Package Duration'}</h3>
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
                <DurationOptions>
                  {selectedPackage.prices.map((priceOption, idx) => (
                    <DurationOptionCard 
                      key={idx}
                      $color={selectedPackage.color}
                      onClick={() => handleSelectDuration(priceOption)}
                    >
                      <DurationLabel>{priceOption.duration}</DurationLabel>
                      <DurationPrice $color={selectedPackage.color}>{priceOption.amount}</DurationPrice>
                    </DurationOptionCard>
                  ))}
                </DurationOptions>
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedPackage && selectedDuration && (
          <ModalOverlay onClick={() => setShowConfirmModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h3>{vi ? 'Xác nhận mua gói' : 'Confirm Purchase'}</h3>
                <CloseButton onClick={() => setShowConfirmModal(false)}>
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
                    <span>{vi ? 'Thời hạn:' : 'Duration:'}</span>
                    <strong>{selectedDuration.duration}</strong>
                  </DetailRow>
                  <DetailRow>
                    <span>{vi ? 'Giá:' : 'Price:'}</span>
                    <strong style={{ color: selectedPackage.color }}>{selectedDuration.amount}</strong>
                  </DetailRow>
                </PurchaseDetails>
                <InfoNote>
                  {vi 
                    ? '⏳ Yêu cầu mua gói sẽ được gửi đến admin để duyệt. Bạn sẽ nhận được thông báo khi gói được kích hoạt.'
                    : '⏳ Purchase request will be sent to admin for approval. You will be notified when the package is activated.'}
                </InfoNote>
              </ModalBody>
              <ModalFooter>
                <CancelButton onClick={() => setShowConfirmModal(false)}>
                  {vi ? 'Hủy' : 'Cancel'}
                </CancelButton>
                <ConfirmButton onClick={handleConfirmPurchase}>
                  {vi ? 'Xác nhận mua' : 'Confirm Purchase'}
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
                {vi ? 'Thanh toán thành công!' : 'Payment Successful!'}
              </SuccessTitle>
              <SuccessMessage>
                {vi 
                  ? 'Yêu cầu mua gói của bạn đã được gửi đến admin. Bạn sẽ nhận được thông báo khi gói được kích hoạt.'
                  : 'Your package purchase request has been sent to admin. You will be notified when the package is activated.'}
              </SuccessMessage>
              <SuccessButton onClick={() => setShowSuccessModal(false)}>
                {vi ? 'Đóng' : 'Close'}
              </SuccessButton>
            </SuccessModalContent>
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
              >
                <X size={60} />
              </ErrorIcon>
              <ErrorTitle>
                {vi ? 'Số dư không đủ!' : 'Insufficient Balance!'}
              </ErrorTitle>
              <ErrorMessage>
                {vi 
                  ? `Bạn cần ${selectedDuration.amount} để mua gói này. Vui lòng nạp thêm tiền vào ví.`
                  : `You need ${selectedDuration.amount} to purchase this package. Please top up your wallet.`}
              </ErrorMessage>
              <ModalFooter style={{ justifyContent: 'center', borderTop: 'none', paddingTop: 0 }}>
                <CancelButton onClick={() => setShowInsufficientBalanceModal(false)}>
                  {vi ? 'Đóng' : 'Close'}
                </CancelButton>
                <ConfirmButton onClick={() => {
                  setShowInsufficientBalanceModal(false);
                  navigate('/employer/wallet');
                }}>
                  {vi ? 'Nạp tiền ngay' : 'Top Up Now'}
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
