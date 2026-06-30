import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import AddressInput from '../../components/AddressInput';
import { Button, Input, TextArea, Select, FormGroup, Label } from '../../components/FormElements';
import { Save, ArrowLeft, AlertCircle, CheckCircle, Clock, Zap, Globe, X, Banknote, Copy, Check, RefreshCw, Plus, Trash2, Sparkles, Loader2, UploadCloud, CheckCircle2, AlertTriangle, FileText, ClipboardList } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import quickJobService from '../../services/quickJobService';
import employerProfileService from '../../services/employerProfileService';
import hybridGeocodingService from '../../services/hybridGeocodingService';
import { useAuth } from '../../context/AuthContext';
import { getWallet, createWalletTransaction } from '../../services/packageCatalogService';
import cvAiService from '../../services/cvAiService';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';


// Keyframe animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.15);
  }
  50% {
    box-shadow: 0 4px 20px rgba(30, 64, 175, 0.3);
  }
`;

const countUp = keyframes`
  from {
    transform: scale(0.95);
    opacity: 0.5;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

const PostJobContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  animation: ${fadeIn} 0.4s ease-out;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
  margin-bottom: 24px;
  background: none;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
    transform: translateX(-4px);
  }
  
  svg {
    width: 20px;
    height: 20px;
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: translateX(-2px);
  }
`;

const FormCard = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 40px;
  border: 1px solid ${props => props.theme.colors.border};
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.5s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #1e40af 0%, #2563eb 100%);
  }
`;

const FormHeader = styled.div`
  margin-bottom: 32px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  
  .icon-box {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 2px solid #BFDBFE;
    
    svg {
      width: 28px;
      height: 28px;
      color: #1e40af;
    }
  }
  
  .header-text {
    flex: 1;
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      color: ${props => props.theme.colors.text};
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    p {
      color: ${props => props.theme.colors.textLight};
      font-size: 15px;
      line-height: 1.6;
    }
  }
`;

const UrgentBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border: 2px solid #1e40af;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  color: #1e40af;
  animation: ${fadeIn} 0.6s ease-out;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(30, 64, 175, 0.2);
  }
  
  svg {
    width: 14px;
    height: 14px;
    animation: ${pulseGlow} 2s ease-in-out infinite;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.$columns || '1fr'};
  gap: 20px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoBox = styled.div`
  background: #EFF6FF;
  border: 2px solid #BFDBFE;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
  animation: ${fadeIn} 0.7s ease-out;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.1);
  }
  
  svg {
    width: 20px;
    height: 20px;
    color: #1e40af;
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .info-content {
    flex: 1;
    
    .info-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 4px;
    }
    
    .info-text {
      font-size: 13px;
      color: #1e3a8a;
      line-height: 1.6;
    }
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 32px;
  border-top: 2px solid ${props => props.theme.colors.border};
`;

const SalaryInputWrap = styled.div`
  position: relative;

  .salary-unit {
    position: absolute;
    top: 50%;
    right: 14px;
    transform: translateY(-50%);
    font-size: 13px;
    font-weight: 600;
    color: #1e40af;
    pointer-events: none;
    white-space: nowrap;
  }
`;

const TotalSalaryBox = styled.div`
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border: 2px solid #1e40af;
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.15);
  height: 100%;
  min-height: 100px;
  animation: ${slideInRight} 0.4s ease-out;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.25);
  }
  
  .salary-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .label-text {
      font-size: 13px;
      font-weight: 600;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      animation: ${fadeIn} 0.5s ease-out;
    }
    
    .hours-info {
      font-size: 12px;
      color: #1e40af;
      opacity: 0.8;
      animation: ${fadeIn} 0.6s ease-out;
    }
  }
  
  .salary-amount {
    display: flex;
    align-items: baseline;
    gap: 4px;
    
    .amount {
      font-size: 32px;
      font-weight: 800;
      color: #1e40af;
      letter-spacing: -0.5px;
      animation: ${countUp} 0.4s ease-out;
      transition: all 0.2s ease;
    }
    
    .currency {
      font-size: 16px;
      font-weight: 600;
      color: #1e40af;
      opacity: 0.7;
    }
  }
  
  &.empty {
    opacity: 0.5;
    border-style: dashed;
    animation: ${pulseGlow} 2s ease-in-out infinite;
  }
  
  &.active {
    animation: ${pulseGlow} 1.5s ease-in-out;
  }
`;

const PageLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 28px;
  align-items: start;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const JdUploadCard = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%);
  border: 2px dashed #bfdbfe;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 28px;
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.08);
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 12px 30px -5px rgba(59, 130, 246, 0.15);
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: #f1f5f9;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
  }
`;

const TabButton = styled.button`
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  border: 1.5px solid ${props => props.$active ? '#3b82f6' : '#e2e8f0'};
  background: ${props => props.$active ? '#3b82f6' : '#ffffff'};
  color: ${props => props.$active ? '#ffffff' : '#475569'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active ? '#2563eb' : '#f8fafc'};
  }
`;

const FileUploadArea = styled.div`
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  padding: 28px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }
  
  input {
    display: none;
  }

  svg {
    width: 40px;
    height: 40px;
    color: #94a3b8;
    margin-bottom: 8px;
  }
`;

const SidebarCard = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 24px;
  border: 1px solid ${props => props.theme.colors.border};
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  
  @media (max-width: 1024px) {
    position: static;
  }
`;

const SidebarTitle = styled.h3`
  font-size: 15px;
  font-weight: 750;
  color: ${props => props.theme.colors.text};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ChecklistItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid ${props => props.theme.colors.border}22;
  font-size: 13.5px;
  color: ${props => props.$warning ? '#dc2626' : props.$filled ? '#059669' : '#64748b'};
  font-weight: ${props => (props.$warning || props.$filled) ? '600' : '500'};
  
  .label-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const SubmitButton = styled(Button)`
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  border: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(30, 64, 175, 0.3);
  }
`;

const ModalContent = styled.div`
  text-align: center;
`;

const ModalIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$success ? '#D1FAE5' : '#FEE2E2'};
  
  svg {
    width: 40px;
    height: 40px;
    color: ${props => props.$success ? '#059669' : '#DC2626'};
  }
`;

const ModalTitle = styled.h3`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  color: ${props => props.theme.colors.text};
`;

const ModalMessage = styled.p`
  font-size: 15px;
  color: ${props => props.theme.colors.textLight};
  line-height: 1.6;
  margin-bottom: 24px;
`;

// ── Deposit Modal Styled Components ──────────────────────────────────────────

const DepModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(10, 18, 40, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const DepModalBox = styled(motion.div)`
  background: #ffffff;
  border-radius: 24px;
  width: 100%;
  max-width: 460px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 32px 64px -12px rgba(14, 57, 149, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.08);
  overflow: hidden;
`;

const DepModalHead = styled.div`
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  padding: 20px 24px 16px;
  position: relative;
  color: white;
  overflow: hidden;
  flex-shrink: 0;

  &::before {
    content: '';
    position: absolute;
    top: -40px;
    right: -40px;
    width: 180px;
    height: 180px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 50%;
  }
`;

const DepModalHeadIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;

  svg { width: 20px; height: 20px; }
`;

const DepModalHeadTitle = styled.div`
  position: relative;
  z-index: 1;
  h2 {
    font-size: 18px;
    font-weight: 800;
    margin-bottom: 2px;
  }
  p {
    font-size: 12px;
    opacity: 0.8;
  }
`;

const DepModalCloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 2;

  &:hover { background: rgba(255, 255, 255, 0.28); transform: scale(1.1); }
  svg { width: 16px; height: 16px; }
`;

const DepModalBody = styled.div`
  padding: 16px 24px 8px;
  overflow-y: auto;
  flex: 1;
`;

const DepSectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #94a3b8;
  margin-bottom: 6px;
`;

const DepQuickAmountsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
`;

const DepQuickAmountBtn = styled.button`
  padding: 9px 6px;
  border: 2px solid ${props => props.$selected ? '#1e40af' : '#e2e8f0'};
  background: ${props => props.$selected ? '#EFF6FF' : '#f8fafc'};
  color: ${props => props.$selected ? '#1e40af' : '#475569'};
  border-radius: 12px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;

  &:hover {
    border-color: #1e40af;
    background: #EFF6FF;
    color: #1e40af;
    transform: translateY(-1px);
  }
`;

const DepAmountInputWrapper = styled.div`
  position: relative;
  margin-bottom: 8px;
`;

const DepCurrencyLabel = styled.div`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  font-weight: 700;
  color: #94a3b8;
  pointer-events: none;
`;

const DepDepositInput = styled.input`
  width: 100%;
  padding: 11px 60px 11px 16px;
  border: 2px solid ${props => props.$invalid ? '#ef4444' : '#e2e8f0'};
  border-radius: 14px;
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
  letter-spacing: 0.5px;

  &:focus {
    border-color: #1e40af;
    box-shadow: 0 0 0 4px rgba(30, 64, 175, 0.1);
  }

  &::placeholder {
    color: #cbd5e1;
    font-weight: 500;
    font-size: 15px;
  }
`;

const DepAmountPreview = styled.div`
  font-size: 12px;
  color: #64748b;
  margin-bottom: 12px;
  min-height: 18px;
  padding-left: 4px;
`;

const DepModalFooter = styled.div`
  padding: 12px 24px 20px;
  display: flex;
  gap: 12px;
  flex-shrink: 0;
`;

const DepCancelBtn = styled.button`
  flex: 1;
  padding: 12px;
  background: #f1f5f9;
  color: #64748b;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: #e2e8f0; color: #475569; }
`;

const DepConfirmBtn = styled(motion.button)`
  flex: 2;
  padding: 14px;
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(30, 64, 175, 0.35);
  transition: box-shadow 0.2s;

  &:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
  &:not(:disabled):hover { box-shadow: 0 8px 24px rgba(30, 64, 175, 0.5); }
  svg { width: 18px; height: 18px; }
`;

const DepSuccessState = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 28px 48px;
  text-align: center;

  svg {
    width: 64px;
    height: 64px;
    color: #10b981;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 22px;
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 8px;
  }

  p {
    font-size: 15px;
    color: #64748b;
  }

  .amount-text {
    font-size: 28px;
    font-weight: 900;
    color: #10b981;
    margin: 8px 0 4px;
  }
`;

const DepLoadingSpinner = styled(motion.div)`
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
`;

const DepQRContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
`;

const DepQRCodeImage = styled.img`
  width: 220px;
  height: 220px;
  border-radius: 16px;
  border: 4px solid #f1f5f9;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const DepPaymentDetailsTable = styled.div`
  width: 100%;
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DepDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13.5px;
  
  .label {
    color: #64748b;
    font-weight: 500;
  }
  
  .value {
    font-weight: 700;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const DepCopyButton = styled.button`
  background: #EFF6FF;
  border: none;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: #BFDBFE;
  }
`;

const DepPollingStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #1e40af;
  font-weight: 600;
  background: #EFF6FF;
  padding: 10px 16px;
  border-radius: 20px;
  margin-top: 8px;
  animation: pulseStatus 2.2s infinite ease-in-out;
  
  @keyframes pulseStatus {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(0.98); }
  }
`;

const PostQuickJob = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [salaryBoxActive, setSalaryBoxActive] = useState(false);
  const [salaryError, setSalaryError] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);

  const [showJdParser, setShowJdParser] = useState(false);
  const [jdActiveTab, setJdActiveTab] = useState('file');
  const [jdText, setJdText] = useState('');
  const [parsingJd, setParsingJd] = useState(false);
  const [fieldWarnings, setFieldWarnings] = useState([]);

  const { user } = useAuth();
  const employerId = user?.userId || user?.id || user?.email || 'mock_employer_id';
  const [realBalance, setRealBalance] = useState(0);

  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setCheckingAccess(true);
        const profile = await employerProfileService.getMyProfile();
        if (!profile || profile.quickJobStatus !== 'approved') {
          console.warn('⚠️ Access denied - Quick jobs feature not approved');
          navigate('/employer/quick-jobs');
        } else {
          setCheckingAccess(false);
        }
      } catch (err) {
        console.error('Error checking profile quick job access:', err);
        navigate('/employer/quick-jobs');
      }
    };
    checkAccess();
  }, [navigate]);




  // Deposit modal state
  const [walletCode, setWalletCode] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositStep, setDepositStep] = useState(1); // 1: Select amount, 2: Show VietQR and polling
  const [depositRawAmount, setDepositRawAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const depositInputRef = useRef(null);

  const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

  const formatQuickAmount = (n) => {
    if (n >= 1000000) return (n / 1000000) + 'M';
    return (n / 1000) + 'K';
  };

  const parsedDepositAmount = parseInt(depositRawAmount.replace(/\D/g, '') || '0');
  const formattedDepositPreview = parsedDepositAmount > 0
    ? parsedDepositAmount.toLocaleString('vi-VN') + ' VND'
    : '';

  useEffect(() => {
    const fetchBalance = async () => {
      if (!employerId || employerId === 'mock_employer_id') return;
      try {
        const wallet = await getWallet(employerId);
        setRealBalance(wallet.walletBalance || 0);
        setWalletCode(wallet.walletCode || '');
      } catch (err) {
        console.error('Error fetching wallet balance:', err);
      }
    };
    fetchBalance();
  }, [employerId]);

  // Polling for deposits while deposit modal is open in step 2
  useEffect(() => {
    let intervalId;
    if (showDepositModal && depositStep === 2 && employerId) {
      intervalId = setInterval(async () => {
        try {
          const wallet = await getWallet(employerId);
          const newBal = wallet.walletBalance || 0;
          if (newBal > realBalance) {
            setRealBalance(newBal);
            setDepositSuccess(true);
            setDepositRawAmount('');
            clearInterval(intervalId);

            setTimeout(() => {
              setShowDepositModal(false);
              setDepositSuccess(false);
            }, 2200);
          }
        } catch (err) {
          console.error('Error polling wallet balance:', err);
        }
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showDepositModal, depositStep, employerId, realBalance]);

  const handleDepositAmountInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setDepositRawAmount(raw);
  };

  const handleConfirmDeposit = () => {
    if (parsedDepositAmount <= 0) return;
    setDepositStep(2);
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };


  const parseHourlyRateInput = (input) => {
    const rawValue = String(input ?? '').trim();
    if (!rawValue) return NaN;

    // Interpret separators as thousand delimiters: 32.000 / 32,000 => 32000
    const normalizedValue = rawValue.replace(/[.,\s]/g, '');
    const parsedValue = Number(normalizedValue);

    return Number.isFinite(parsedValue) ? parsedValue : NaN;
  };

  const [formData, setFormData] = useState(() => {
    const defaults = {
      title: '',
      location: '',
      latitude: '', // GPS latitude
      longitude: '', // GPS longitude
      jobType: '', // Loại hình công việc
      hourlyRate: '', // Lương theo giờ
      startTime: '', // Thời gian bắt đầu ca (slot đầu tiên — giữ để tương thích)
      endTime: '', // Thời gian kết thúc ca (slot đầu tiên — giữ để tương thích)
      workDate: '', // Ngày làm việc
      description: '',
      requirements: '', // Yêu cầu
      contactPhone: '',
      customFields: [],
      workHoursList: [{ startTime: '', endTime: '' }] // Nhiều khung giờ làm việc
    };
    // Load draft from localStorage on mount
    const savedDraft = localStorage.getItem('quickJobDraft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        const merged = { ...defaults, ...parsed };
        // Migrate older drafts that only stored a single startTime/endTime
        if (!Array.isArray(merged.workHoursList) || merged.workHoursList.length === 0) {
          merged.workHoursList = [{ startTime: parsed.startTime || '', endTime: parsed.endTime || '' }];
        }
        return merged;
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
    return defaults;
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear warning for this field if any
    setFieldWarnings(prev => prev.filter(w => w !== name));

    // Parse hourly rate internally while keeping what user typed
    if (name === 'hourlyRate') {
      const numValue = parseHourlyRateInput(value);

      // Show error if value is entered and < 29500
      if (value !== '' && !isNaN(numValue) && numValue < 29500) {
        setSalaryError(true);
      } else {
        setSalaryError(false);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const runJdParsing = async (payload) => {
    setParsingJd(true);
    try {
      const result = await cvAiService.parseJd({
        ...payload,
        language: language
      });

      if (result) {
        setFormData(prev => {
          const newFormData = { ...prev };
          if (result.title) newFormData.title = result.title;
          if (result.location) newFormData.location = result.location;
          if (result.description) newFormData.description = result.description;
          if (result.requirements) newFormData.requirements = result.requirements;
          if (result.contactPhone) newFormData.contactPhone = result.contactPhone;

          let rate = '';
          if (result.hourlyRate) {
            rate = result.hourlyRate;
          } else if (result.salary && result.salaryUnit === 'hour') {
            rate = result.salary;
          } else if (result.salary) {
            rate = result.salary;
          }
          if (rate) {
            newFormData.hourlyRate = String(rate).replace(/\D/g, '');
          }

          if (result.workDate) {
            newFormData.workDate = result.workDate;
          } else if (result.workDays) {
            newFormData.workDate = result.workDays;
          }

          if (Array.isArray(result.workHoursList) && result.workHoursList.length > 0) {
            newFormData.workHoursList = result.workHoursList.map((slot) => ({
              startTime: slot.startTime || '',
              endTime: slot.endTime || ''
            }));
          }

          return newFormData;
        });

        let warnings = result.warnings || [];
        if (warnings.includes('salary')) {
          warnings = [...warnings.filter(w => w !== 'salary'), 'hourlyRate'];
        }
        if (warnings.includes('workDays') && !warnings.includes('workDate')) {
          warnings = [...warnings.filter(w => w !== 'workDays'), 'workDate'];
        }

        setFieldWarnings(warnings);

        toast.success(language === 'vi'
          ? 'AI đã tự động phân bổ và điền thông tin vào biểu mẫu thành công!'
          : 'AI has successfully extracted and filled the form!');

        setShowJdParser(false);
      }
    } catch (error) {
      console.error('Error parsing JD:', error);
      toast.error(error.message || (language === 'vi' ? 'Có lỗi xảy ra khi phân tích JD.' : 'Error parsing JD.'));
    } finally {
      setParsingJd(false);
    }
  };

  const handlePdfFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.warning(language === 'vi' ? 'Vui lòng chọn file PDF!' : 'Please select a PDF file!');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.warning(language === 'vi' ? 'Dung lượng file không được vượt quá 2MB!' : 'File size must not exceed 2MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result.split(',')[1];
      await runJdParsing({ fileContent: base64Str, fileType: 'application/pdf' });
    };
    reader.readAsDataURL(file);
  };

  // Custom fields (employer-defined extra JD sections)
  const handleAddCustomField = () => {
    setFormData(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), { label: '', value: '' }]
    }));
  };

  const handleRemoveCustomField = (index) => {
    setFormData(prev => ({
      ...prev,
      customFields: (prev.customFields || []).filter((_, i) => i !== index)
    }));
  };

  const handleCustomFieldChange = (index, key, value) => {
    setFormData(prev => ({
      ...prev,
      customFields: (prev.customFields || []).map((field, i) => (
        i === index ? { ...field, [key]: value } : field
      ))
    }));
  };

  // Handle address change from AddressInput component
  const handleAddressChange = (address) => {
    setFieldWarnings(prev => prev.filter(w => w !== 'location'));
    setFormData(prev => ({
      ...prev,
      location: address
    }));
  };

  // Handle coordinates change from AddressInput component
  const handleCoordinatesChange = (coordinates) => {
    if (coordinates) {
      setFormData(prev => ({
        ...prev,
        latitude: coordinates.lat.toString(),
        longitude: coordinates.lng.toString()
      }));
      console.log('✅ GPS coordinates updated:', coordinates);
    }
  };

  // Calculate total salary based on hourly rate and working hours
  // Work-hour slots management (multiple "Khung giờ làm việc")
  const addWorkHourSlot = () => {
    setFieldWarnings(prev => prev.filter(w => w !== 'workHoursList'));
    setFormData(prev => ({
      ...prev,
      workHoursList: [...(prev.workHoursList || []), { startTime: '', endTime: '' }]
    }));
  };

  const removeWorkHourSlot = (index) => {
    setFieldWarnings(prev => prev.filter(w => w !== 'workHoursList'));
    setFormData(prev => {
      const list = (prev.workHoursList || []).filter((_, i) => i !== index);
      return { ...prev, workHoursList: list.length > 0 ? list : [{ startTime: '', endTime: '' }] };
    });
  };

  const updateWorkHourSlot = (index, field, value) => {
    setFieldWarnings(prev => prev.filter(w => w !== 'workHoursList'));
    setFormData(prev => ({
      ...prev,
      workHoursList: (prev.workHoursList || []).map((slot, i) => (
        i === index ? { ...slot, [field]: value } : slot
      ))
    }));
  };

  const calculateTotalSalary = () => {
    const { hourlyRate, workHoursList } = formData;

    const rate = parseHourlyRateInput(hourlyRate);
    if (!hourlyRate || isNaN(rate) || rate < 29500) {
      return null;
    }

    const slots = Array.isArray(workHoursList) ? workHoursList : [];
    let totalHours = 0;

    for (const slot of slots) {
      if (!slot || !slot.startTime || !slot.endTime) continue;

      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) continue;

      let hoursWorked = (endHour + endMin / 60) - (startHour + startMin / 60);
      // Handle negative (next day scenario)
      if (hoursWorked < 0) hoursWorked += 24;

      totalHours += hoursWorked;
    }

    if (totalHours <= 0) {
      return null;
    }

    return {
      hours: totalHours,
      total: rate * totalHours
    };
  };

  const salaryCalculation = calculateTotalSalary();

  // Auto-save form data to localStorage
  useEffect(() => {
    localStorage.setItem('quickJobDraft', JSON.stringify(formData));
  }, [formData]);

  // Trigger animation when salary calculation changes
  useEffect(() => {
    if (salaryCalculation) {
      setSalaryBoxActive(true);
      const timer = setTimeout(() => setSalaryBoxActive(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [salaryCalculation?.total]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.location || !formData.hourlyRate || !formData.workDate || !formData.description || !formData.requirements) {
      setModalType('error');
      setShowModal(true);
      return;
    }

    let finalLat = formData.latitude;
    let finalLng = formData.longitude;

    if (!finalLat || !finalLng) {
      try {
        const geoInfo = await hybridGeocodingService.geocodeAddress(formData.location);
        if (geoInfo && geoInfo.lat && geoInfo.lng) {
          finalLat = geoInfo.lat.toString();
          finalLng = geoInfo.lng.toString();
        } else {
          throw new Error('Geocoding result missing coordinates');
        }
      } catch (err) {
        console.error('Failed to geocode address on submit:', err);
        setModalType('error');
        setPaymentInfo({
          error: true,
          message: language === 'vi' 
            ? 'Không thể xác định tọa độ GPS từ địa chỉ cung cấp. Vui lòng chọn địa chỉ cụ thể từ gợi ý.'
            : 'Could not resolve GPS coordinates from the provided address. Please select a specific address from suggestions.'
        });
        setShowModal(true);
        return;
      }
    }

    // Validate work date is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (formData.workDate < today) {
      setModalType('error');
      setPaymentInfo({
        error: true,
        message: language === 'vi'
          ? 'Ngày làm việc không được ở trong quá khứ.'
          : 'Work date cannot be in the past.'
      });
      setShowModal(true);
      return;
    }

    // Validate hourly rate must be >= 29500
    const rate = parseHourlyRateInput(formData.hourlyRate);
    if (isNaN(rate) || rate < 29500) {
      setSalaryError(true);
      setModalType('error');
      setShowModal(true);
      return;
    }

    // Check that at least one complete work-hour slot is provided
    const validSlots = (formData.workHoursList || []).filter(s => s.startTime && s.endTime);
    if (validSlots.length === 0) {
      setModalType('error');
      setPaymentInfo({
        error: true,
        message: language === 'vi'
          ? 'Vui lòng điền đầy đủ khung giờ làm việc.'
          : 'Please fill in the working hours.'
      });
      setShowModal(true);
      return;
    }

    // Calculate total salary (fee to deduct)
    const calculation = calculateTotalSalary();
    if (!calculation || !calculation.total) {
      setModalType('error');
      setPaymentInfo({
        error: true,
        message: language === 'vi'
          ? 'Không thể tính tổng lương. Vui lòng kiểm tra lại thông tin.'
          : 'Cannot calculate total salary. Please check your information.'
      });
      setShowModal(true);
      return;
    }

    const totalFee = Math.round(calculation.total); // Lấy tổng lương làm phí

    // Fetch fresh balance from wallet API
    let currentBalance = realBalance;
    try {
      if (employerId && employerId !== 'mock_employer_id') {
        const wallet = await getWallet(employerId);
        currentBalance = wallet.walletBalance || 0;
        setRealBalance(currentBalance);
      }
    } catch (err) {
      console.warn('API getWallet failed, falling back to local state:', err);
    }

    if (currentBalance < totalFee) {
      const missingAmount = totalFee - currentBalance;
      setModalType('error');
      setPaymentInfo({
        error: true,
        missingAmount: missingAmount,
        message: language === 'vi'
          ? `Số dư không đủ. Bạn cần nạp thêm ${missingAmount.toLocaleString('vi-VN')} VNĐ (Tổng chi phí: ${totalFee.toLocaleString('vi-VN')} VNĐ, Số dư hiện tại: ${currentBalance.toLocaleString('vi-VN')} VNĐ).`
          : `Insufficient balance. You need an additional ${missingAmount.toLocaleString('vi-VN')} VND (Total fee: ${totalFee.toLocaleString('vi-VN')} VND, Current balance: ${currentBalance.toLocaleString('vi-VN')} VND).`
      });
      setShowModal(true);
      return;
    }

    let newBalance = 0;
    let didDeductRealWallet = false;

    try {
      // Deduct fee from wallet (backend database)
      try {
        const description = language === 'vi'
          ? `Nạp tiền - Đăng bài: ${formData.title} (${calculation.hours.toFixed(1)}h x ${rate.toLocaleString('vi-VN')} VNĐ)`
          : `Deposit - Post job: ${formData.title} (${calculation.hours.toFixed(1)}h x ${rate.toLocaleString('vi-VN')} VND)`;

        const result = await createWalletTransaction(
          employerId,
          totalFee,
          'debit',
          description,
          {
            jobTitle: formData.title,
            hours: calculation.hours,
            hourlyRate: rate
          }
        );
        newBalance = result.walletBalance || 0;
        setRealBalance(newBalance);
        didDeductRealWallet = true;
      } catch (apiError) {
        console.warn('⚠️ API wallet debit failed:', apiError);
        // Re-throw so the outer catch handles it properly
        throw apiError;
      }

      // Get company name from employer profile
      let companyName = 'Unknown Company';
      try {
        const profile = await employerProfileService.getMyProfile();
        if (profile && (profile.companyName || profile.businessName)) {
          companyName = profile.companyName || profile.businessName;
          console.log('✅ Company name from profile:', companyName);
        }
      } catch (error) {
        console.warn('⚠️ Could not get company name from profile:', error);
        // Try localStorage as fallback
        const cachedProfile = localStorage.getItem('employerProfile');
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          companyName = parsed.companyName || parsed.businessName || 'Unknown Company';
        }
      }

      // Prepare job data for DynamoDB
      const jobData = {
        title: formData.title,
        location: formData.location,
        latitude: finalLat ? Math.round(parseFloat(finalLat) * 1000000) / 1000000 : null,
        longitude: finalLng ? Math.round(parseFloat(finalLng) * 1000000) / 1000000 : null,
        jobType: formData.jobType || 'part-time',
        hourlyRate: Math.round(rate), // Ensure integer
        startTime: validSlots[0].startTime,
        endTime: validSlots[0].endTime,
        workHours: validSlots.map(s => `${s.startTime} - ${s.endTime}`).join(' | '),
        totalHours: Math.round(calculation.hours * 10) / 10, // Round to 1 decimal place
        totalSalary: Math.round(totalFee), // Ensure integer
        description: formData.description || '',
        requirements: formData.requirements || '',
        contactPhone: formData.contactPhone || '',
        customFields: (formData.customFields || [])
          .map(f => ({ label: (f.label || '').trim(), value: (f.value || '').trim() }))
          .filter(f => f.label.length > 0 || f.value.length > 0),
        companyName: companyName,  // Add company name here
        status: 'pending',  // Quick jobs require admin approval
        workDate: formData.workDate || '' // Store work date in workDate attribute
      };

      console.log('🚀 Submitting quick job to DynamoDB:', jobData);

      // Save to DynamoDB via quickJobService
      const savedJob = await quickJobService.createQuickJob(jobData);

      console.log('✅ Quick job saved:', savedJob);

      // Clear draft
      localStorage.removeItem('quickJobDraft');

      // Set payment info for success message
      setPaymentInfo({
        fee: totalFee,
        hours: calculation.hours,
        hourlyRate: rate,
        previousBalance: currentBalance,
        newBalance: newBalance,
        escrow: true
      });

      setModalType('success');
      setShowModal(true);
    } catch (error) {
      console.error('❌ Error creating quick job:', error);

      // Rollback wallet deduction if API had deducted balance
      if (didDeductRealWallet) {
        try {
          const description = language === 'vi'
            ? `Hoàn tiền - Lỗi đăng bài: ${formData.title}`
            : `Refund - Job posting error: ${formData.title}`;
          const result = await createWalletTransaction(
            employerId,
            totalFee,
            'credit',
            description,
            { error: error.message }
          );
          setRealBalance(result.walletBalance || 0);
        } catch (refundError) {
          console.error('❌ Failed to refund wallet balance:', refundError);
        }
      }

      setModalType('error');
      setPaymentInfo({
        error: true,
        message: language === 'vi'
          ? `Lỗi khi tạo bài đăng: ${error.message}`
          : `Error creating job post: ${error.message}`
      });
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    if (modalType === 'success') {
      navigate('/employer/quick-jobs');
    }
  };

  const translations = {
    vi: {
      backButton: 'Quay lại',
      pageTitle: 'Đăng bài tuyển gấp',
      pageSubtitle: 'Tạo bài đăng tuyển dụng khẩn cấp với thời gian xét duyệt nhanh chóng',
      urgentBadge: 'Tuyển gấp',
      infoTitle: 'Lưu ý về tuyển gấp',
      infoText: 'Bài đăng tuyển gấp sẽ được ưu tiên hiển thị và có thời hạn ngắn (2-7 ngày). Phù hợp cho các vị trí cần tuyển ngay lập tức.',

      // Form labels
      jobTitle: 'Tiêu đề công việc - Vị trí công việc',
      jobTitlePlaceholder: 'VD: Nhân viên Phục Vụ - Cần ngay',
      location: 'Địa điểm làm việc',
      locationPlaceholder: 'VD: Quận 1, TP.HCM',
      jobType: 'Loại hình công việc *',
      jobTypePartTime: 'Bán thời gian',
      jobTypePlaceholder: 'Chọn loại hình',
      hourlyRate: 'Lương',
      hourlyRatePlaceholder: '',
      hourlyRateMin: 'Phải lớn hơn hoặc bằng 29.500 VNĐ',
      workDate: 'Ngày làm',
      workDatePlaceholder: 'Chọn ngày làm việc',
      workingHours: 'Khung giờ làm việc',
      startTime: 'Từ',
      endTime: 'Đến',
      startTimePlaceholder: '',
      endTimePlaceholder: '',

      totalSalary: 'Tổng lương ước tính',
      totalSalaryEmpty: 'Nhập lương và khung giờ để xem tổng',
      hoursWorked: 'giờ làm việc',

      description: 'Mô tả công việc',
      descriptionPlaceholder: 'Mô tả ngắn gọn về công việc cần tuyển...',

      requirements: 'Yêu cầu',
      requirementsPlaceholder: 'Liệt kê các yêu cầu cần thiết cho ứng viên...',

      contactPhone: 'Số điện thoại liên hệ',
      contactPhonePlaceholder: '0123 456 789',

      // Buttons
      cancelButton: 'Hủy',
      submitButton: 'Đăng bài ngay',

      // Modal
      successTitle: 'Đã gửi yêu cầu',
      successMessage: 'Bài đăng của bạn đã được gửi và đang chờ admin duyệt. Nó sẽ hiển thị sau khi được phê duyệt.',
      paymentDeducted: 'Đã trừ phí đăng bài',
      remainingBalance: 'Số dư còn lại',
      errorTitle: 'Có lỗi xảy ra',
      errorMessage: 'Vui lòng điền đầy đủ các thông tin bắt buộc và đảm bảo lương theo giờ tối thiểu 29.500 VNĐ.',
      closeButton: 'Đóng'
    },
    en: {
      backButton: 'Back',
      pageTitle: 'Post Urgent Job',
      pageSubtitle: 'Create an urgent job posting with fast approval process',
      urgentBadge: 'Urgent Hiring',
      infoTitle: 'About Urgent Jobs',
      infoText: 'Urgent job postings will be prioritized and have shorter duration (2-7 days). Suitable for positions that need immediate filling.',

      // Form labels
      jobTitle: 'Job Title',
      jobTitlePlaceholder: 'e.g., Server - Immediate Need',
      location: 'Work Location',
      locationPlaceholder: 'e.g., District 1, HCMC',
      jobType: 'Job Type *',
      jobTypePartTime: 'Part-time',
      jobTypePlaceholder: 'Select type',
      hourlyRate: 'Salary (VND)',
      hourlyRatePlaceholder: '',
      workDate: 'Work Date',
      workDatePlaceholder: 'Select work date',
      workingHours: 'Working Hours',
      startTime: 'From',
      endTime: 'To',
      startTimePlaceholder: '',
      endTimePlaceholder: '',

      totalSalary: 'Estimated Total Salary',
      totalSalaryEmpty: 'Enter salary and hours to see total',
      hoursWorked: 'hours worked',

      description: 'Job Description',
      descriptionPlaceholder: 'Brief description of the job...',

      requirements: 'Requirements',
      requirementsPlaceholder: 'List the necessary requirements for candidates...',

      contactPhone: 'Contact Phone',
      contactPhonePlaceholder: '0123 456 789',

      // Buttons
      cancelButton: 'Cancel',
      submitButton: 'Post Now',

      // Modal
      successTitle: 'Submitted for Approval',
      successMessage: 'Your job posting has been submitted and is awaiting admin approval. It will be visible once approved.',
      paymentDeducted: 'Posting fee deducted',
      remainingBalance: 'Remaining balance',
      errorTitle: 'Error Occurred',
      hourlyRateMin: 'Must be greater than or equal to 29,500 VND',
      errorMessage: 'Please fill in all required fields and ensure hourly rate is at least 29,500 VND.',
      closeButton: 'Close'
    }
  };

  if (checkingAccess) {
    return (
      <DashboardLayout role="employer">
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '16px' }}>
          <RefreshCw className="animate-spin" size={36} style={{ color: '#1e40af', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e40af' }}>
            {language === 'vi' ? 'Đang kiểm tra quyền truy cập...' : 'Checking access...'}
          </span>
        </div>
      </DashboardLayout>
    );
  }

  const t = translations[language];

  return (
    <DashboardLayout role="employer">
      <PostJobContainer>
        <BackButton onClick={() => navigate('/employer/quick-jobs')}>
          <ArrowLeft />
          {t.backButton}
        </BackButton>

        {/* JD Auto-Fill Banner */}
        <div style={{ marginBottom: '24px' }}>
          {!showJdParser ? (
            <Button
              type="button"
              $variant="secondary"
              onClick={() => setShowJdParser(true)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1.5px solid #bfdbfe',
                color: '#1e40af',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px',
                borderRadius: '12px'
              }}
            >
              <Sparkles size={18} />
              {language === 'vi'
                ? 'Đăng bài nhanh chóng từ JD đã có sẵn'
                : 'Quickly post from available JD'}
            </Button>
          ) : (
            <JdUploadCard>
              <button type="button" className="close-btn" onClick={() => setShowJdParser(false)}>
                <X size={16} />
              </button>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a8a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#2563eb" />
                {language === 'vi'
                  ? 'Đăng bài nhanh chóng từ JD đã có sẵn'
                  : 'Quickly post from available JD'}
              </h3>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <TabButton
                  type="button"
                  $active={jdActiveTab === 'file'}
                  onClick={() => setJdActiveTab('file')}
                >
                  {language === 'vi' ? 'Tải tệp PDF sẵn có' : 'Upload existing PDF'}
                </TabButton>
                <TabButton
                  type="button"
                  $active={jdActiveTab === 'text'}
                  onClick={() => setJdActiveTab('text')}
                >
                  {language === 'vi' ? 'Dán văn bản JD' : 'Paste JD Text'}
                </TabButton>
              </div>

              {parsingJd ? (
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontWeight: '600', color: '#1e3a8a', fontSize: '14px' }}>
                    {language === 'vi'
                      ? 'AI đang đọc nội dung JD và tự động điền các trường biểu mẫu...'
                      : 'AI is reading JD content and filling form fields...'}
                  </span>
                </div>
              ) : (
                <>
                  {jdActiveTab === 'file' ? (
                    <FileUploadArea onClick={() => document.getElementById('jd-pdf-upload').click()}>
                      <UploadCloud />
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                        {language === 'vi' ? 'Kéo & thả file PDF JD vào đây hoặc Click để chọn file' : 'Drag & drop PDF JD file here or click to select'}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>
                        {language === 'vi' ? 'Chấp nhận file .pdf có kích thước dưới 2MB' : 'Supports .pdf files under 2MB'}
                      </p>
                      <input
                        id="jd-pdf-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfFileSelect}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </FileUploadArea>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <TextArea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder={language === 'vi'
                          ? 'Dán nội dung mô tả công việc (JD) của bạn vào đây...'
                          : 'Paste your job description (JD) text here...'}
                        rows={6}
                      />
                      <Button
                        type="button"
                        $variant="primary"
                        disabled={!jdText.trim()}
                        onClick={() => runJdParsing({ text: jdText })}
                      >
                        <Sparkles size={14} />
                        {language === 'vi' ? 'Phân tích & Tự động điền' : 'Analyze & Autofill'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </JdUploadCard>
          )}
        </div>

        <PageLayout>
          {/* Main Form Content */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FormCard>
              <FormHeader>
                <div className="icon-box">
                  <Zap />
                </div>
                <div className="header-text">
                  <h1>
                    {t.pageTitle}
                    <UrgentBadge>
                      <Clock />
                      {t.urgentBadge}
                    </UrgentBadge>
                  </h1>
                  <p>{t.pageSubtitle}</p>
                </div>
              </FormHeader>

              <InfoBox>
                <AlertCircle />
                <div className="info-content">
                  <div className="info-title">{t.infoTitle}</div>
                  <div className="info-text">{t.infoText}</div>
                </div>
              </InfoBox>

              <form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label required>{t.jobTitle}</Label>
                  <Input
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={t.jobTitlePlaceholder}
                    required
                  />
                  {fieldWarnings.includes('title') && (
                    <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                      ⚠️ {language === 'vi' ? 'AI không tìm thấy tiêu đề phù hợp, vui lòng điền tay.' : 'AI did not find job title, please input manually.'}
                    </small>
                  )}
                </FormGroup>

                <FormRow $columns="1fr 1fr">
                  <FormGroup>
                    <Label required>{t.location}</Label>
                    <AddressInput
                      value={formData.location}
                      onChange={handleAddressChange}
                      onCoordinatesChange={handleCoordinatesChange}
                      placeholder={t.locationPlaceholder}
                      required
                      showCoordinates={true}
                    />
                    {fieldWarnings.includes('location') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy địa điểm làm việc, vui lòng điền tay.' : 'AI did not find location, please input manually.'}
                      </small>
                    )}
                  </FormGroup>
                </FormRow>

                <FormRow $columns="1fr 1fr">
                  <FormGroup>
                    <Label required>{t.hourlyRate}</Label>
                    <SalaryInputWrap>
                      <Input
                        name="hourlyRate"
                        type="number"
                        min="0"
                        step="any"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                        placeholder={t.hourlyRatePlaceholder}
                        required
                        style={{
                          borderColor: salaryError ? '#EF4444' : '',
                          background: salaryError ? '#FEE2E2' : '',
                          paddingRight: '74px'
                        }}
                      />
                      <span className="salary-unit">
                        {language === 'vi' ? 'VNĐ/h' : 'VNĐ/h'}
                      </span>
                    </SalaryInputWrap>
                    {salaryError ? (
                      <small style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                        ⚠️ {language === 'vi' ? 'Lương phải lớn hơn hoặc bằng 29.500 VNĐ' : 'Salary must be >= 29,500 VND'}
                      </small>
                    ) : (
                      <small style={{ color: '#000000', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {t.hourlyRateMin}
                      </small>
                    )}
                    {fieldWarnings.includes('hourlyRate') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy mức lương phù hợp, vui lòng điền tay.' : 'AI did not find salary, please input manually.'}
                      </small>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label required>{t.workDate}</Label>
                    <Input
                      name="workDate"
                      type="date"
                      value={formData.workDate}
                      onChange={handleChange}
                      placeholder={t.workDatePlaceholder}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    {fieldWarnings.includes('workDate') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy ngày làm việc phù hợp, vui lòng điền tay.' : 'AI did not find work date, please input manually.'}
                      </small>
                    )}
                  </FormGroup>
                </FormRow>

                <FormRow $columns="1fr 1fr">
                  <FormGroup>
                    <Label required>{t.workingHours}</Label>
                    {fieldWarnings.includes('workHoursList') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy khung giờ làm việc phù hợp, vui lòng điền tay.' : 'AI did not find working hours, please input manually.'}
                      </small>
                    )}
                    {(formData.workHoursList || []).map((slot, index) => (
                      <FormRow key={index} $columns="1fr 1fr auto" style={{ marginBottom: '10px', alignItems: 'end' }}>
                        <div>
                          <Label style={{ fontSize: '13px', marginBottom: '8px' }}>{t.startTime}</Label>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateWorkHourSlot(index, 'startTime', e.target.value)}
                            placeholder={t.startTimePlaceholder}
                            required
                          />
                        </div>
                        <div>
                          <Label style={{ fontSize: '13px', marginBottom: '8px' }}>{t.endTime}</Label>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateWorkHourSlot(index, 'endTime', e.target.value)}
                            placeholder={t.endTimePlaceholder}
                            required
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '6px', paddingBottom: '2px' }}>
                          <button
                            type="button"
                            onClick={addWorkHourSlot}
                            title={language === 'vi' ? 'Thêm khung giờ' : 'Add time slot'}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', flexShrink: 0, background: '#EFF6FF', color: '#1e40af', border: '1px solid #BFDBFE', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            <Plus size={16} />
                          </button>
                          {(formData.workHoursList || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeWorkHourSlot(index)}
                              title={language === 'vi' ? 'Xóa khung giờ' : 'Remove time slot'}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', flexShrink: 0, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '8px', cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </FormRow>
                    ))}
                  </FormGroup>

                  {/* Total Salary Display */}
                  <FormGroup>
                    <Label style={{ opacity: 0, pointerEvents: 'none' }}>-</Label>
                    <TotalSalaryBox className={`${!salaryCalculation ? 'empty' : ''} ${salaryBoxActive ? 'active' : ''}`}>
                      <div className="salary-label">
                        <div className="label-text">{t.totalSalary}</div>
                        {salaryCalculation && (
                          <div className="hours-info">
                            {salaryCalculation.hours.toFixed(1)} {t.hoursWorked}
                          </div>
                        )}
                      </div>
                      <div className="salary-amount">
                        {salaryCalculation ? (
                          <>
                            <span className="amount">
                              {salaryCalculation.total.toLocaleString('vi-VN', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              })}
                            </span>
                            <span className="currency">VNĐ</span>
                          </>
                        ) : (
                          <span style={{ fontSize: '14px', color: '#1e40af', opacity: 0.6 }}>
                            {t.totalSalaryEmpty}
                          </span>
                        )}
                      </div>
                    </TotalSalaryBox>
                  </FormGroup>
                </FormRow>

                <FormGroup>
                  <Label required>{t.description}</Label>
                  <TextArea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={t.descriptionPlaceholder}
                    rows={4}
                    required
                  />
                  {fieldWarnings.includes('description') && (
                    <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                      ⚠️ {language === 'vi' ? 'AI không thể tạo mô tả công việc, vui lòng nhập tay.' : 'AI did not generate description, please input manually.'}
                    </small>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label required>{t.requirements}</Label>
                  <TextArea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    placeholder={t.requirementsPlaceholder}
                    rows={3}
                    required
                  />
                  {fieldWarnings.includes('requirements') && (
                    <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                      ⚠️ {language === 'vi' ? 'AI không thể tạo yêu cầu công việc, vui lòng nhập tay.' : 'AI did not generate requirements, please input manually.'}
                    </small>
                  )}
                </FormGroup>

                {/* Custom fields - employer-defined extra JD sections */}
                {(formData.customFields || []).map((field, index) => (
                  <FormGroup key={index}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <Input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleCustomFieldChange(index, 'label', e.target.value)}
                        placeholder={language === 'vi' ? 'Tên mục (vd: Địa điểm làm việc)...' : 'Field title (e.g. Work location)...'}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(index)}
                        title={language === 'vi' ? 'Xóa mục này' : 'Remove this field'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '40px',
                          flexShrink: 0,
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <TextArea
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                      placeholder={language === 'vi' ? 'Nội dung mục này...' : 'Content for this field...'}
                      rows={3}
                    />
                  </FormGroup>
                ))}

                <FormGroup>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      background: '#EFF6FF',
                      color: '#1e40af',
                      border: '1px dashed #93C5FD',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={18} />
                    {language === 'vi' ? 'Thêm mục tùy chỉnh' : 'Add custom field'}
                  </button>
                </FormGroup>

                <FormActions>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/employer/quick-jobs')}
                  >
                    {t.cancelButton}
                  </Button>
                  <SubmitButton type="submit">
                    <Save />
                    {t.submitButton}
                  </SubmitButton>
                </FormActions>
              </form>
            </FormCard>
          </div>

          {/* Checklist Sidebar */}
          <SidebarCard>
            <SidebarTitle>
              <ClipboardList size={18} color="#1e40af" />
              {language === 'vi' ? 'Tiến độ điền tin' : 'Filling Progress'}
            </SidebarTitle>

            <ChecklistItem $filled={!!formData.title.trim()} $warning={fieldWarnings.includes('title')}>
              <div className="label-group">
                {fieldWarnings.includes('title') ? <AlertTriangle color="#dc2626" /> : !!formData.title.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Thông tin cơ bản' : 'Basic info'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={!!formData.location.trim()} $warning={fieldWarnings.includes('location')}>
              <div className="label-group">
                {fieldWarnings.includes('location') ? <AlertTriangle color="#dc2626" /> : !!formData.location.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Địa điểm làm việc' : 'Location'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={!!formData.hourlyRate.trim()} $warning={fieldWarnings.includes('hourlyRate')}>
              <div className="label-group">
                {fieldWarnings.includes('hourlyRate') ? <AlertTriangle color="#dc2626" /> : !!formData.hourlyRate.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Mức lương theo giờ' : 'Hourly rate'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={!!formData.workDate.trim()} $warning={fieldWarnings.includes('workDate')}>
              <div className="label-group">
                {fieldWarnings.includes('workDate') ? <AlertTriangle color="#dc2626" /> : !!formData.workDate.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Ngày làm việc' : 'Work date'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={(formData.workHoursList || []).some(s => s.startTime && s.endTime)} $warning={fieldWarnings.includes('workHoursList')}>
              <div className="label-group">
                {fieldWarnings.includes('workHoursList') ? <AlertTriangle color="#dc2626" /> : (formData.workHoursList || []).some(s => s.startTime && s.endTime) ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Khung giờ làm việc' : 'Working hours'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={!!formData.description.trim()} $warning={fieldWarnings.includes('description')}>
              <div className="label-group">
                {fieldWarnings.includes('description') ? <AlertTriangle color="#dc2626" /> : !!formData.description.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Mô tả công việc' : 'Job description'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={!!formData.requirements.trim()} $warning={fieldWarnings.includes('requirements')}>
              <div className="label-group">
                {fieldWarnings.includes('requirements') ? <AlertTriangle color="#dc2626" /> : !!formData.requirements.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Yêu cầu công việc' : 'Requirements'}</span>
              </div>
            </ChecklistItem>
          </SidebarCard>
        </PageLayout>
      </PostJobContainer>

      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title=""
      >
        <ModalContent>
          <ModalIcon $success={modalType === 'success'}>
            {modalType === 'success' ? <CheckCircle /> : <AlertCircle />}
          </ModalIcon>
          <ModalTitle>
            {modalType === 'success' ? t.successTitle : t.errorTitle}
          </ModalTitle>
          <ModalMessage>
            {modalType === 'success' ? t.successMessage : (paymentInfo?.error ? paymentInfo.message : t.errorMessage)}
          </ModalMessage>
          {modalType === 'success' && paymentInfo && !paymentInfo.error && (
            <div style={{
              background: '#EFF6FF',
              border: '2px solid #BFDBFE',
              borderRadius: '12px',
              padding: '16px 20px',
              marginTop: '16px',
              marginBottom: '8px'
            }}>
              <div style={{
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px dashed #BFDBFE'
              }}>
                <div style={{ fontSize: '13px', color: '#1e3a8a', marginBottom: '6px' }}>
                  {language === 'vi' ? 'Chi tiết thanh toán:' : 'Payment details:'}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#1e40af',
                  marginBottom: '4px'
                }}>
                  <span>{language === 'vi' ? 'Số giờ làm việc:' : 'Working hours:'}</span>
                  <span style={{ fontWeight: '600' }}>{paymentInfo.hours.toFixed(1)}h</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#1e40af'
                }}>
                  <span>{language === 'vi' ? 'VNĐ/h:' : 'Hourly rate:'}</span>
                  <span style={{ fontWeight: '600' }}>{paymentInfo.hourlyRate.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px', color: '#1e3a8a', fontWeight: '600' }}>
                  {t.paymentDeducted}:
                </span>
                <span style={{ fontSize: '16px', color: '#DC2626', fontWeight: '700' }}>
                  -{paymentInfo.fee.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '8px',
                borderTop: '1px solid #BFDBFE'
              }}>
                <span style={{ fontSize: '14px', color: '#1e3a8a', fontWeight: '600' }}>
                  {t.remainingBalance}:
                </span>
                <span style={{ fontSize: '18px', color: '#059669', fontWeight: '700' }}>
                  {paymentInfo.newBalance.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

            </div>
          )}
          {modalType === 'error' && (paymentInfo?.message?.includes('Số dư không đủ') || paymentInfo?.message?.includes('Insufficient balance')) ? (
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <Button
                onClick={handleModalClose}
                style={{
                  flex: 1,
                  background: '#E5E7EB',
                  color: '#374151'
                }}
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </Button>
              <Button
                onClick={() => {
                  setShowModal(false);
                  setDepositRawAmount(String(paymentInfo?.missingAmount || ''));
                  setDepositStep(2); // Go directly to step 2 (show QR code for the missing amount)
                  setShowDepositModal(true);
                }}
                style={{
                  flex: 1,
                  background: '#3B82F6',
                  color: 'white'
                }}
              >
                {language === 'vi' ? '💰 Nạp tiền' : '💰 Add Funds'}
              </Button>
            </div>
          ) : (
            <Button onClick={handleModalClose}>
              {t.closeButton}
            </Button>
          )}
        </ModalContent>
      </Modal>

      {/* ── Deposit Modal ── */}
      <AnimatePresence>
        {showDepositModal && (
          <DepModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget && !depositLoading) setShowDepositModal(false); }}
          >
            <DepModalBox
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            >
              {depositSuccess ? (
                <DepSuccessState
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', damping: 16, stiffness: 260 }}
                  >
                    <CheckCircle />
                  </motion.div>
                  <h3>{language === 'vi' ? 'Nạp tiền thành công!' : 'Deposit Successful!'}</h3>
                  <div className="amount-text">
                    +{parsedDepositAmount.toLocaleString('vi-VN')} VND
                  </div>
                  <p>{language === 'vi' ? 'Số dư ví của bạn đã được cập nhật.' : 'Your wallet balance has been updated.'}</p>
                </DepSuccessState>
              ) : (
                <>
                  {/* Header */}
                  <DepModalHead>
                    <DepModalCloseBtn type="button" onClick={() => !depositLoading && setShowDepositModal(false)}>
                      <X />
                    </DepModalCloseBtn>
                    <DepModalHeadIcon>
                      <Banknote />
                    </DepModalHeadIcon>
                    <DepModalHeadTitle>
                      <h2>{language === 'vi' ? 'Nạp tiền vào ví' : 'Deposit to Wallet'}</h2>
                      <p>{language === 'vi' ? 'Chọn hoặc nhập số tiền muốn nạp' : 'Select or enter the amount to deposit'}</p>
                    </DepModalHeadTitle>
                  </DepModalHead>

                  {/* Body */}
                  <DepModalBody>
                    {depositStep === 1 ? (
                      <>
                        <DepSectionLabel>{language === 'vi' ? 'Chọn nhanh' : 'Quick select'}</DepSectionLabel>
                        <DepQuickAmountsGrid>
                          {QUICK_AMOUNTS.map(amt => (
                            <DepQuickAmountBtn
                              key={amt}
                              type="button"
                              $selected={parseInt(depositRawAmount.replace(/\D/g, '') || '0') === amt}
                              onClick={() => setDepositRawAmount(String(amt))}
                            >
                              {formatQuickAmount(amt)}
                            </DepQuickAmountBtn>
                          ))}
                        </DepQuickAmountsGrid>

                        <DepSectionLabel>{language === 'vi' ? 'Nhập số tiền' : 'Enter amount'}</DepSectionLabel>
                        <DepAmountInputWrapper>
                          <DepDepositInput
                            ref={depositInputRef}
                            type="text"
                            inputMode="numeric"
                            placeholder={language === 'vi' ? '0' : '0'}
                            value={depositRawAmount ? parseInt(depositRawAmount).toLocaleString('vi-VN') : ''}
                            onChange={handleDepositAmountInput}
                            $invalid={depositRawAmount !== '' && parsedDepositAmount <= 0}
                          />
                          <DepCurrencyLabel>VND</DepCurrencyLabel>
                        </DepAmountInputWrapper>
                        <DepAmountPreview>
                          {formattedDepositPreview
                            ? `≈ ${formattedDepositPreview}`
                            : (language === 'vi' ? 'Tối thiểu 1.000 VND' : 'Minimum 1,000 VND')}
                        </DepAmountPreview>
                      </>
                    ) : (
                      <DepQRContainer>
                        <DepQRCodeImage
                          src={`https://img.vietqr.io/image/MB-0777799991702-compact.png?amount=${parsedDepositAmount}&addInfo=OPPOWALLET%20${walletCode}&accountName=NGUYEN%20THI%20THUY%20DUNG`}
                          alt="VietQR Transfer Code"
                        />
                        <DepPollingStatus>
                          <Clock size={16} />
                          {language === 'vi' ? 'Đang chờ giao dịch chuyển khoản...' : 'Waiting for transfer transaction...'}
                        </DepPollingStatus>
                        <DepPaymentDetailsTable>
                          <DepDetailRow>
                            <span className="label">{language === 'vi' ? 'Ngân hàng' : 'Bank'}</span>
                            <span className="value">MBBank</span>
                          </DepDetailRow>
                          <DepDetailRow>
                            <span className="label">{language === 'vi' ? 'Số tài khoản' : 'Account No.'}</span>
                            <span className="value">
                              0777799991702
                              <DepCopyButton type="button" onClick={() => handleCopyText('0777799991702', 'account')}>
                                {copiedText === 'account' ? <><Check size={11} /> {language === 'vi' ? 'Đã chép' : 'Copied'}</> : <><Copy size={11} /> {language === 'vi' ? 'Sao chép' : 'Copy'}</>}
                              </DepCopyButton>
                            </span>
                          </DepDetailRow>
                          <DepDetailRow>
                            <span className="label">{language === 'vi' ? 'Tên thụ hưởng' : 'Account Name'}</span>
                            <span className="value">NGUYEN THI THUY DUNG</span>
                          </DepDetailRow>
                          <DepDetailRow>
                            <span className="label">{language === 'vi' ? 'Số tiền' : 'Amount'}</span>
                            <span className="value" style={{ color: '#10b981', fontSize: '15px' }}>
                              {parsedDepositAmount.toLocaleString('vi-VN')} VND
                            </span>
                          </DepDetailRow>
                          <DepDetailRow>
                            <span className="label">{language === 'vi' ? 'Nội dung chuyển' : 'Content'}</span>
                            <span className="value" style={{ color: '#1e40af' }}>
                              {`OPPOWALLET ${walletCode}`}
                              <DepCopyButton type="button" onClick={() => handleCopyText(`OPPOWALLET ${walletCode}`, 'content')}>
                                {copiedText === 'content' ? <><Check size={11} /> {language === 'vi' ? 'Đã chép' : 'Copied'}</> : <><Copy size={11} /> {language === 'vi' ? 'Sao chép' : 'Copy'}</>}
                              </DepCopyButton>
                            </span>
                          </DepDetailRow>
                        </DepPaymentDetailsTable>
                      </DepQRContainer>
                    )}
                  </DepModalBody>

                  {/* Footer */}
                  <DepModalFooter>
                    {depositStep === 1 ? (
                      <>
                        <DepCancelBtn type="button" onClick={() => !depositLoading && setShowDepositModal(false)}>
                          {language === 'vi' ? 'Huỷ' : 'Cancel'}
                        </DepCancelBtn>
                        <DepConfirmBtn
                          type="button"
                          onClick={handleConfirmDeposit}
                          disabled={depositLoading || parsedDepositAmount <= 0}
                          whileTap={{ scale: 0.97 }}
                        >
                          {depositLoading ? (
                            <DepLoadingSpinner
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                            />
                          ) : (
                            <>
                              <Zap />
                              {language === 'vi' ? 'Tạo mã QR' : 'Generate QR'}
                            </>
                          )}
                        </DepConfirmBtn>
                      </>
                    ) : (
                      <>
                        <DepCancelBtn type="button" onClick={() => setDepositStep(1)} style={{ flex: 1 }}>
                          {language === 'vi' ? 'Quay lại' : 'Back'}
                        </DepCancelBtn>
                        <DepConfirmBtn
                          type="button"
                          onClick={() => setShowDepositModal(false)}
                          style={{ flex: 1, background: '#64748b', boxShadow: 'none' }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {language === 'vi' ? 'Đóng' : 'Close'}
                        </DepConfirmBtn>
                      </>
                    )}
                  </DepModalFooter>
                </>
              )}
            </DepModalBox>
          </DepModalOverlay>
        )}
      </AnimatePresence>
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />
    </DashboardLayout>
  );
};

export default PostQuickJob;
