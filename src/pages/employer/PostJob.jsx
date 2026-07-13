import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { Button, Input, TextArea, Select, FormGroup, Label } from '../../components/FormElements';
import { Save, ArrowLeft, AlertCircle, Briefcase, Clock, ClipboardList, Plus, Trash2, Sparkles, Loader2, UploadCloud, CheckCircle2, AlertTriangle, FileText, X, Info } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import jobPostService from '../../services/jobPostService';
import employerProfileService from '../../services/employerProfileService';
import { fetchAuthSession } from 'aws-amplify/auth';
import cvAiService from '../../services/cvAiService';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import { createJobPendingApprovalNotification, createJobPendingNotificationForEmployer } from '../../services/notificationService';

// Days of week options for work-hour slots. `key` is the stable token persisted
// into the workHours string; vi/en are the display labels.
const WORK_DAY_OPTIONS = [
  { key: 'T2', vi: 'T2', en: 'Mon' },
  { key: 'T3', vi: 'T3', en: 'Tue' },
  { key: 'T4', vi: 'T4', en: 'Wed' },
  { key: 'T5', vi: 'T5', en: 'Thu' },
  { key: 'T6', vi: 'T6', en: 'Fri' },
  { key: 'T7', vi: 'T7', en: 'Sat' },
  { key: 'CN', vi: 'CN', en: 'Sun' },
];

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

const shimmer = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const pulseGlow = keyframes`
  0% {
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.2), 0 0 0 0px rgba(99, 102, 241, 0.4);
  }
  50% {
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4), 0 0 0 8px rgba(99, 102, 241, 0);
  }
  100% {
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.2), 0 0 0 0px rgba(99, 102, 241, 0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-2px) scale(1.1);
  }
`;

const MethodSelectorContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const SelectorCard = styled.button`
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 28px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  background: #ffffff;
  
  /* Accent borders based on selection and variant */
  border: 2.5px solid ${props => props.$active 
    ? (props.$variant === 'ai' ? '#8b5cf6' : '#2563eb') 
    : '#e2e8f0'};
    
  box-shadow: ${props => props.$active 
    ? (props.$variant === 'ai' ? '0 12px 28px -5px rgba(139, 92, 246, 0.18)' : '0 12px 28px -5px rgba(37, 99, 235, 0.18)')
    : '0 4px 12px rgba(0, 0, 0, 0.03)'};

  &:hover {
    transform: translateY(-4px);
    border-color: ${props => props.$variant === 'ai' ? '#8b5cf6' : '#2563eb'};
    box-shadow: ${props => props.$variant === 'ai' 
      ? '0 16px 36px -5px rgba(139, 92, 246, 0.25), 0 10px 16px -6px rgba(139, 92, 246, 0.25)' 
      : '0 16px 36px -5px rgba(37, 99, 235, 0.25), 0 10px 16px -6px rgba(37, 99, 235, 0.25)'};
    
    .icon-wrapper {
      transform: scale(1.08);
      background: ${props => props.$variant === 'ai' ? '#8b5cf6' : '#2563eb'};
      color: #ffffff;
      
      svg {
        filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.4));
      }
    }
  }

  &:active {
    transform: translateY(-1px);
  }

  .icon-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    background: ${props => props.$active 
      ? (props.$variant === 'ai' ? '#8b5cf6' : '#2563eb')
      : (props.$variant === 'ai' ? '#f5f3ff' : '#eff6ff')};
      
    color: ${props => props.$active 
      ? '#ffffff'
      : (props.$variant === 'ai' ? '#7c3aed' : '#2563eb')};

    svg {
      width: 26px;
      height: 26px;
    }
  }

  .card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .card-title {
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
  }

  .card-subtitle {
    font-size: 13.5px;
    color: #64748b;
    line-height: 1.45;
    font-weight: 500;
    margin: 0;
  }

  .badge {
    background: ${props => props.$active ? 'rgba(255, 255, 255, 0.22)' : '#f5f3ff'};
    color: ${props => props.$active ? '#ffffff' : '#7c3aed'};
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.5px;
    border: 1px solid ${props => props.$active ? 'rgba(255, 255, 255, 0.3)' : '#ddd6fe'};
    display: inline-flex;
    align-items: center;
  }
`;

const InfoCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 28px;
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const InfoCard = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
    border-color: #cbd5e1;
  }

  .card-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    color: #475569;
    
    svg {
      width: 20px;
      height: 20px;
    }
  }

  .card-title {
    font-size: 15px;
    font-weight: 750;
    color: #1e293b;
    margin: 0;
  }

  .card-desc {
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
    font-weight: 500;
    margin: 0;
  }
`;

const GuidelinesHeader = styled.div`
  margin-top: 48px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  animation: ${fadeIn} 0.5s ease-out;

  h2 {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.2px;
  }

  p {
    font-size: 13.5px;
    color: #64748b;
    margin: 0;
  }
`;

const PostJobContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  animation: ${fadeIn} 0.4s ease-out;
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
  
  @media (max-width: 768px) {
    padding: 32px 24px;
    border-radius: 16px;
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
      
      @media (max-width: 768px) {
        font-size: 24px;
      }
    }
    
    p {
      color: ${props => props.theme.colors.textLight};
      font-size: 15px;
      line-height: 1.6;
    }
  }
`;

const SectionLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  svg {
    width: 16px;
    height: 16px;
    color: #1e40af;
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

const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.$columns || '1fr'};
  gap: 20px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const WorkHoursRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const WorkHoursActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 42px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid ${props => props.$danger ? '#fecaca' : '#bfdbfe'};
  background: ${props => props.$danger ? '#fff1f2' : '#eff6ff'};
  color: ${props => props.$danger ? '#dc2626' : '#1e40af'};
  font-size: 13px;
  font-weight: 700;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(30, 64, 175, 0.12);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  svg {
    width: 14px;
    height: 14px;
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

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SpinningLoader = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const AiButton = styled.button`
  width: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%);
  background-size: 200% 200%;
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 750;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: ${shimmer} 5s ease infinite, ${pulseGlow} 2.5s infinite;
  margin-bottom: 14px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.35) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: skewX(-25deg);
    transition: all 0.75s;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
    border-color: rgba(255, 255, 255, 0.3);
    
    &::before {
      left: 150%;
    }

    .sparkle-icon {
      animation: ${float} 1s ease infinite;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
  }

  &:disabled {
    background: #e2e8f0;
    color: #94a3b8;
    border-color: #cbd5e1;
    box-shadow: none;
    cursor: not-allowed;
  }

  .sparkle-icon {
    color: #ffd700;
    filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.8));
    transition: transform 0.3s ease;
  }

  .cta-badge {
    background: rgba(255, 255, 255, 0.22);
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.5px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    display: inline-flex;
    align-items: center;
    color: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
`;

const VerificationWarning = styled.div`
  background: #FEF3C7;
  border: 2px solid #FCD34D;
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 32px;
  color: #92400E;
  display: flex;
  align-items: start;
  gap: 16px;
  
  svg {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    color: #D97706;
  }
  
  .content {
    flex: 1;
    
    h3 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #78350F;
    }
    
    p {
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 16px;
      color: #92400E;
    }
    
    button {
      background: #1e40af;
      color: white;
      font-weight: 700;
      padding: 10px 20px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      
      &:hover {
        background: #1e3a8a;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
      }
    }
  }
`;

const VerificationModalContent = styled.div`
  text-align: center;
  padding: 32px 24px;
  
  .icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    border-radius: 50%;
    background: #FEF3C7;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D97706;
    border: 3px solid #FCD34D;
    
    svg {
      width: 40px;
      height: 40px;
    }
  }
  
  h3 {
    font-size: 24px;
    font-weight: 800;
    margin-bottom: 16px;
    color: #1E293B;
  }
  
  p {
    font-size: 15px;
    color: #64748B;
    line-height: 1.7;
    margin-bottom: 28px;
  }
  
  .button-group {
    display: flex;
    gap: 12px;
    justify-content: center;
    
    button {
      flex: 1;
      max-width: 200px;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
      }
    }
  }
`;

const AnimatedFormGroup = styled(FormGroup)`
  animation: ${fadeIn} 0.3s ease-out;
  margin-bottom: 20px;
`;

const PostJob = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const editingJob = location.state?.job; // Get job data if editing
  const isEditing = !!editingJob;

  const createWorkHourSlot = (isNew = true) => ({ startTime: '', endTime: '', days: [], isNew });
  const parseWorkHours = (workHours) => {
    const normalized = String(workHours || '')
      .split(/\s*(?:\||\n)\s*/)
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        let days = [];
        let timeStr = part;
        const atIdx = part.indexOf('@');
        if (atIdx !== -1) {
          days = part.slice(0, atIdx).split(',').map(d => d.trim()).filter(Boolean);
          timeStr = part.slice(atIdx + 1).trim();
        }
        const [startTime = '', endTime = ''] = timeStr.split('-').map(t => t.trim());
        return startTime && endTime ? { startTime, endTime, days, isNew: false } : null;
      })
      .filter(Boolean)
      .slice(0, 5);

    return normalized.length > 0 ? normalized : [createWorkHourSlot(false)];
  };
  const serializeWorkHours = (slots) => slots
    .filter(slot => slot.startTime && slot.endTime)
    .map(slot => {
      const time = `${slot.startTime} - ${slot.endTime}`;
      return slot.days && slot.days.length > 0 ? `${slot.days.join(',')} | ${time}` : time;
    })
    .join(' | ');

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showAiInfoModal, setShowAiInfoModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [workHoursList, setWorkHoursList] = useState([createWorkHourSlot(false)]);
  const [workHourErrors, setWorkHourErrors] = useState({}); // { [slotIndex]: 'error message' }
  const [fieldErrors, setFieldErrors] = useState({}); // inline errors for description, requirements, etc.
  const [salaryError, setSalaryError] = useState(false); // true when salary < minimum wage
  const [profileHasNoAddress, setProfileHasNoAddress] = useState(false); // true khi hồ sơ không có địa chỉ nào
  const [loadingAi, setLoadingAi] = useState(false);
  const [profileAddress, setProfileAddress] = useState('');
  const [profileBranches, setProfileBranches] = useState([]); // [] = 1 trụ sở, [a,b,...] = nhiều chi nhánh

  const [showJdParser, setShowJdParser] = useState(false);
  const [jdActiveTab, setJdActiveTab] = useState('file');
  const [jdText, setJdText] = useState('');
  const [parsingJd, setParsingJd] = useState(false);
  const [fieldWarnings, setFieldWarnings] = useState([]);
  const [showStandardForm, setShowStandardForm] = useState(isEditing);


  const [formData, setFormData] = useState({
    title: '',
    location: '',
    jobType: 'part-time',
    urgencyLevel: 'standard',
    workDays: '',
    workHours: '',
    salary: '',
    salaryUnit: 'hour',
    tags: '',
    description: '',
    requirements: '',
    benefits: '',
    isAiScreeningEnabled: false,
    customQuestions: '',
    customFields: []
  });

  // Check verification status on mount — fetch real isVerified from API
  // Also pre-fill location from employer profile when creating a new job
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const profile = await employerProfileService.getMyProfile();
        if (profile && profile.isVerified === true) {
          setVerificationStatus('approved');
        } else {
          const verificationData = profile?.verificationStatus || null;
          if (verificationData === 'pending') {
            setVerificationStatus('pending');
          } else {
            setVerificationStatus('not_started');
          }
          // Không tự động hiện modal khi vào trang
        }

        // Auto-fill location from profile address when creating a new job
        if (!isEditing && profile?.address) {
          setFormData(prev => ({
            ...prev,
            location: prev.location || profile.address
          }));
        }

        // Store the profile address and branches for location selection logic
        const address = profile?.address || '';
        const branches = Array.isArray(profile?.branches) ? profile.branches.filter(b => b?.trim()) : [];
        setProfileAddress(address);
        setProfileBranches(branches);

        // Flag when employer has no address at all (neither main address nor branches)
        if (!address && branches.length === 0) {
          setProfileHasNoAddress(true);
        } else {
          setProfileHasNoAddress(false);
        }

        // Auto-fill: if only 1 address (no branches), pre-fill location automatically
        if (!isEditing) {
          if (branches.length === 0 && address) {
            // Single location — auto fill & lock
            setFormData(prev => ({ ...prev, location: address }));
          }
          // Multi-branch: don't pre-fill, let user choose from dropdown
        }
      } catch (err) {
        console.error('Error checking verification status:', err);
        setVerificationStatus('not_started');
      }
    };
    checkVerification();
  }, [isEditing]);

  // Pre-fill form if editing
  useEffect(() => {
    if (editingJob) {
      const parsedWorkHours = parseWorkHours(editingJob.workHours || `${editingJob.startTime || ''} - ${editingJob.endTime || ''}`);
      setWorkHoursList(parsedWorkHours);
      setFormData({
        title: editingJob.title || '',
        location: editingJob.location || '',
        jobType: editingJob.jobType || 'part-time',
        urgencyLevel: editingJob.urgencyLevel || 'standard',
        workDays: editingJob.workDays || '',
        workHours: editingJob.workHours || serializeWorkHours(parsedWorkHours),
        salary: editingJob.salary || '',
        salaryUnit: editingJob.salaryUnit || 'hour',
        tags: editingJob.tags || '',
        description: editingJob.description || '',
        requirements: editingJob.requirements || '',
        benefits: editingJob.benefits || '',
        isAiScreeningEnabled: editingJob.isAiScreeningEnabled || false,
        customQuestions: editingJob.customQuestions ? editingJob.customQuestions.join('\n') : '',
        customFields: Array.isArray(editingJob.customFields) ? editingJob.customFields : []
      });
    }
  }, [editingJob]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      workHours: serializeWorkHours(workHoursList)
    }));
  }, [workHoursList]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Clear warning for this field if any
    setFieldWarnings(prev => prev.filter(w => w !== name));

    // Real-time salary validation: warn when salary/hour < 25000
    if (name === 'salary') {
      const num = parseFloat(String(value).replace(/[.,\s]/g, ''));
      const unit = formData.salaryUnit; // read current unit from state
      if (value !== '' && !isNaN(num) && unit === 'hour' && num < 25000) {
        setSalaryError(true);
      } else {
        setSalaryError(false);
      }
    }
    // Also re-check when unit changes
    if (name === 'salaryUnit') {
      const num = parseFloat(String(formData.salary).replace(/[.,\s]/g, ''));
      if (formData.salary !== '' && !isNaN(num) && value === 'hour' && num < 25000) {
        setSalaryError(true);
      } else {
        setSalaryError(false);
      }
    }

    // Update formData
    setFormData(prev => {
      const val = type === 'checkbox' ? checked : value;
      const updated = { ...prev, [name]: val };
      return updated;
    });
  };

  const runJdParsing = async (payload) => {
    setParsingJd(true);
    try {
      const result = await cvAiService.parseJd({
        ...payload,
        language: language
      });

      if (result) {
        setFormData(prev => ({
          ...prev,
          title: result.title || prev.title,
          location: result.location || prev.location,
          salary: result.salary || prev.salary,
          salaryUnit: result.salaryUnit || prev.salaryUnit || 'hour',
          tags: Array.isArray(result.tags) ? result.tags.join(', ') : (result.tags || prev.tags),
          description: result.description || prev.description,
          requirements: result.requirements || prev.requirements,
          benefits: result.benefits || prev.benefits,
          workDays: result.workDays || prev.workDays,
        }));

        if (Array.isArray(result.workHoursList) && result.workHoursList.length > 0) {
          setWorkHoursList(result.workHoursList.map((slot, index) => ({
            startTime: slot.startTime || '',
            endTime: slot.endTime || '',
            days: slot.days || [],
            isNew: index > 0
          })));
        }

        setFieldWarnings(result.warnings || []);

        toast.success(language === 'vi'
          ? 'AI đã tự động phân bổ và điền thông tin vào biểu mẫu thành công!'
          : 'AI has successfully extracted and filled the form!');

        setShowJdParser(false);
        setShowStandardForm(true);
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

  // Real-time validate duration for a single slot
  const validateSlotDuration = (slot, index) => {
    if (slot.startTime && slot.endTime) {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      const duration = endMin > startMin ? endMin - startMin : (endMin + 1440) - startMin;
      if (duration < 60) {
        setWorkHourErrors(prev => ({
          ...prev,
          [index]: language === 'vi'
            ? 'Mỗi ca làm việc phải kéo dài tối thiểu 1 tiếng.'
            : 'Each work shift must be at least 1 hour.'
        }));
        return false;
      }
    }
    // Clear error for this slot
    setWorkHourErrors(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    return true;
  };

  const handleWorkHourChange = (index, field, value) => {
    setWorkHoursList(prev => {
      const updated = prev.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: value } : slot
      );
      // Validate real-time after state update
      const updatedSlot = updated[index];
      if (updatedSlot.startTime && updatedSlot.endTime) {
        const [sh, sm] = updatedSlot.startTime.split(':').map(Number);
        const [eh, em] = updatedSlot.endTime.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        const duration = endMin > startMin ? endMin - startMin : (endMin + 1440) - startMin;
        if (duration < 60) {
          setWorkHourErrors(p => ({
            ...p,
            [index]: language === 'vi'
              ? 'Mỗi ca làm việc phải kéo dài tối thiểu 1 tiếng.'
              : 'Each work shift must be at least 1 hour.'
          }));
        } else {
          setWorkHourErrors(p => {
            const n = { ...p };
            delete n[index];
            return n;
          });
        }
      } else {
        // If either time is cleared, also clear the error
        setWorkHourErrors(p => {
          const n = { ...p };
          delete n[index];
          return n;
        });
      }
      // Re-validate 3-hour rule if startTime changed and workDays is set
      if (field === 'startTime' && formData.workDays) {
        const newStartTime = value;
        if (newStartTime) {
          const shiftStart = new Date(`${formData.workDays}T${newStartTime}:00`);
          const hoursLeft = (shiftStart - new Date()) / (1000 * 60 * 60);
          if (hoursLeft < 3) {
            setFieldErrors(p => ({
              ...p,
              workDays: language === 'vi'
                ? 'Bài đăng phải được tạo trước giờ bắt đầu ca làm ít nhất 3 tiếng. Vui lòng chọn ca làm việc muộn hơn.'
                : 'Job post must be created at least 3 hours before the shift starts. Please choose a later shift time.'
            }));
          } else {
            setFieldErrors(p => { const n = { ...p }; delete n.workDays; return n; });
          }
        }
      }
      return updated;
    });
  };

  const toggleWorkHourDay = (index, dayKey) => {
    setWorkHoursList(prev => prev.map((slot, slotIndex) => {
      if (slotIndex !== index) return slot;
      const days = slot.days || [];
      const nextDays = days.includes(dayKey)
        ? days.filter(d => d !== dayKey)
        : [...days, dayKey];
      // Keep canonical week order (T2 -> CN)
      const ordered = WORK_DAY_OPTIONS.map(o => o.key).filter(k => nextDays.includes(k));
      return { ...slot, days: ordered };
    }));
  };

  const addWorkHour = () => {
    setWorkHoursList(prev => {
      if (prev.length >= 5) return prev;
      return [...prev, createWorkHourSlot()];
    });
  };

  const removeWorkHour = (index) => {
    setWorkHoursList(prev => {
      if (prev.length === 1) return prev;
      const next = prev.filter((_, slotIndex) => slotIndex !== index);
      return next.length > 0 ? next : [createWorkHourSlot()];
    });
  };

  const handleGenerateJdWithAi = async () => {
    if (!formData.title.trim()) return;

    setLoadingAi(true);
    try {
      const result = await cvAiService.suggestJd({
        title: formData.title,
        location: formData.location,
        jobType: formData.jobType,
        workDays: formData.workDays,
        workHours: formData.workHours,
        salary: formData.salary,
        tags: formData.tags,
        language: language
      });

      if (result) {
        // Merge responsibilities bullet points into description so they are visible and saved
        const descText = result.description || '';
        const respText = result.responsibilities || '';
        const mergedDesc = descText && respText
          ? `${descText}\n\n${respText}`
          : (descText || respText || prev.description);

        setFormData(prev => ({
          ...prev,
          description: mergedDesc,
          requirements: result.requirements || prev.requirements,
          benefits: result.benefits || prev.benefits
        }));
      }
    } catch (error) {
      console.error('Error generating JD with AI:', error);
      toast.error(error.message || (language === 'vi'
        ? 'Không thể tạo JD tự động. Vui lòng thử lại.'
        : 'Failed to generate JD. Please try again.'));
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate location
    if (!formData.location.trim()) {
      toast.warning(language === 'vi'
        ? (!profileAddress
          ? 'Vui lòng cập nhật địa chỉ trong Hồ Sơ Công Ty trước khi đăng tin.'
          : 'Vui lòng chọn địa điểm làm việc.')
        : 'Please select a work location.');
      return;
    }

    // 2. Require salary
    if (!String(formData.salary).trim()) {
      toast.warning(language === 'vi'
        ? 'Vui lòng nhập mức lương.'
        : 'Please enter the salary.');
      return;
    }

    // 2b. Minimum wage: 25,000 VNĐ/giờ
    if (formData.salaryUnit === 'hour') {
      const salaryNum = parseFloat(String(formData.salary).replace(/[.,\s]/g, ''));
      if (!isNaN(salaryNum) && salaryNum < 25000) {
        setSalaryError(true);
        toast.warning(language === 'vi'
          ? 'Mức lương theo giờ phải từ 25.000 VNĐ trở lên.'
          : 'Hourly salary must be at least 25,000 VND.');
        return;
      }
    }

    // 3. Validate description and requirements are not empty
    const newFieldErrors = {};
    if (!formData.description.trim()) {
      newFieldErrors.description = language === 'vi'
        ? 'Vui lòng nhập mô tả công việc.'
        : 'Please enter job description.';
    }
    if (!formData.requirements.trim()) {
      newFieldErrors.requirements = language === 'vi'
        ? 'Vui lòng nhập yêu cầu công việc.'
        : 'Please enter job requirements.';
    }
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      toast.warning(language === 'vi'
        ? 'Vui lòng điền đầy đủ các trường bắt buộc.'
        : 'Please fill in all required fields.');
      return;
    }
    setFieldErrors({});

    // 4. Validate each work hour slot: end time must be at least 1 hour after start time
    for (let i = 0; i < workHoursList.length; i++) {
      const slot = workHoursList[i];
      if (slot.startTime && slot.endTime) {
        const [sh, sm] = slot.startTime.split(':').map(Number);
        const [eh, em] = slot.endTime.split(':').map(Number);
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        // Handle overnight shifts: if end <= start, add 24h to end
        const duration = endMinutes > startMinutes
          ? endMinutes - startMinutes
          : (endMinutes + 1440) - startMinutes;
        if (duration < 60) {
          toast.warning(language === 'vi'
            ? `Ca làm việc ${i + 1}: Mỗi ca làm việc phải kéo dài tối thiểu 1 tiếng.`
            : `Shift ${i + 1}: Each work shift must be at least 1 hour.`);
          return;
        }
      }
    }

    // 5. Validate work date + first shift start time → must be at least 3 hours from now
    if (formData.workDays) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.workDays < today) {
        toast.warning(language === 'vi'
          ? 'Ngày làm việc không được ở trong quá khứ.'
          : 'Work date cannot be in the past.');
        return;
      }

      // Find the first slot with a startTime to compute shiftStartDateTime
      const firstSlotWithTime = workHoursList.find(s => s.startTime);
      if (firstSlotWithTime) {
        const shiftStartDateTime = new Date(`${formData.workDays}T${firstSlotWithTime.startTime}:00`);
        const now = new Date();
        const hoursUntilShift = (shiftStartDateTime - now) / (1000 * 60 * 60);
        if (hoursUntilShift < 3) {
          toast.warning(language === 'vi'
            ? 'Bài đăng phải được tạo trước giờ bắt đầu ca làm ít nhất 3 tiếng. Vui lòng chọn ca làm việc muộn hơn.'
            : 'Job post must be created at least 3 hours before the shift starts. Please choose a later shift time.');
          return;
        }
      } else {
        // No startTime filled: fall back to checking date midnight is >= now + 3h
        const deadlineStart = new Date(formData.workDays + 'T00:00:00');
        const threeHoursFromNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
        if (deadlineStart < threeHoursFromNow) {
          toast.warning(language === 'vi'
            ? 'Bài đăng phải được tạo trước giờ bắt đầu ca làm ít nhất 3 tiếng. Vui lòng chọn ca làm việc muộn hơn.'
            : 'Job post must be created at least 3 hours before the shift starts. Please choose a later shift time.');
          return;
        }
      }
    }

    // 6. Block new job posting if not verified
    if (!isEditing && verificationStatus !== 'approved') {
      setShowVerificationModal(true);
      return;
    }

    console.log('🔥🔥🔥 SUBMIT BUTTON CLICKED');
    console.log('📦 Form data:', formData);
    console.log('📝 Is editing:', isEditing);
    console.log('📝 Editing job:', editingJob);

    try {
      const customQuestionsArray = formData.customQuestions
        ? formData.customQuestions.split('\n').map(q => q.trim()).filter(q => q.length > 0)
        : [];

      // Tạo payload sạch để loại bỏ customQuestions kiểu string cũ
      const sanitizedCustomFields = (formData.customFields || [])
        .map(f => ({ label: (f.label || '').trim(), value: (f.value || '').trim() }))
        .filter(f => f.label.length > 0 || f.value.length > 0);

      const cleanFormData = {
        ...formData,
        customQuestions: customQuestionsArray,
        customFields: sanitizedCustomFields
      };

      if (isEditing) {
        // Update existing job in DynamoDB
        const jobId = editingJob.idJob || editingJob.id;
        console.log('🔄 Updating job with ID:', jobId);

        if (!jobId) {
          throw new Error('Job ID not found');
        }

        await jobPostService.updateJobPost(jobId, cleanFormData);
        console.log('✅ Job post updated successfully');
      } else {
        // Get authenticated user info
        const session = await fetchAuthSession();
        let employerId = 'anonymous';
        let employerEmail = 'anonymous@example.com';
        let employerName = language === 'vi' ? 'Công ty' : 'Company';

        if (session && session.tokens) {
          const idTokenPayload = session.tokens.idToken?.payload;
          employerId = idTokenPayload?.sub || 'anonymous';
          employerEmail = idTokenPayload?.email || 'anonymous@example.com';

          // Try to get company name from EmployerProfile
          try {
            const profile = await employerProfileService.getMyProfile();
            if (profile && profile.companyName) {
              employerName = profile.companyName;
              console.log('✅ Got company name from profile:', employerName);
            } else {
              // Fallback to email username
              employerName = employerEmail.split('@')[0];
              console.log('⚠️ No company name in profile, using email username');
            }
          } catch (error) {
            console.warn('⚠️ Could not load employer profile:', error);
            employerName = employerEmail.split('@')[0];
          }

          console.log('✅ User authenticated:', { employerId, employerEmail, employerName });
        } else {
          console.warn('⚠️ No authentication session - using anonymous');
        }

        // Generate job ID
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomStr = '';
        for (let i = 0; i < 5; i++) {
          randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const jobId = `JOB-${year}${month}${day}-${randomStr}`;

        const payload = {
          idJob: jobId,
          employerId: employerId,
          employerEmail: employerEmail,
          employerName: employerName,
          ...cleanFormData,
          // Require admin moderation for standard jobs
          status: 'pending',
          applicants: 0,
          views: 0,
          responseRate: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        console.log('📤 Sending request with employer info:', payload);

        // Use direct API (CORS is fixed)
        const apiUrl = 'https://dlidp35x33.execute-api.ap-southeast-1.amazonaws.com/prod/jobs';

        console.log('🔗 API URL:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          mode: 'cors'
        });

        console.log('📥 Response status:', response.status);

        const result = await response.json();
        console.log('📥 Response data:', result);

        if (response.ok) {
          console.log('✅ Job post created successfully with ID:', result.data.idJob);
          try {
            await createJobPendingApprovalNotification({
              employerId,
              companyName: employerName,
              jobTitle: cleanFormData.title,
              jobId: result.data.idJob || jobId,
              isQuickJob: false
            });
            console.log('✅ Sent pending approval notification to admin');
          } catch (notifErr) {
            console.warn('⚠️ Failed to send notification to admin:', notifErr);
          }
          try {
            await createJobPendingNotificationForEmployer({
              employerId,
              companyName: employerName,
              jobTitle: cleanFormData.title,
              jobId: result.data.idJob || jobId,
              isQuickJob: false
            });
            console.log('✅ Sent pending approval notification to employer');
          } catch (notifErr) {
            console.warn('⚠️ Failed to send notification to employer:', notifErr);
          }
        } else {
          throw new Error('API request failed: ' + response.status);
        }
      }

      // Show success toast and navigate back to standard jobs page
      if (!isEditing) {
        toast.success(language === 'vi'
          ? 'Đăng bài thành công! Bài đăng đang chờ Admin xét duyệt.'
          : 'Job posted successfully! Your post is pending admin approval.');
      } else {
        toast.success(language === 'vi'
          ? 'Cập nhật bài đăng thành công!'
          : 'Job post updated successfully!');
      }
      navigate('/employer/standard-jobs');
    } catch (error) {
      console.error('❌ Error saving job post:', error);
      toast.error(language === 'vi'
        ? 'Có lỗi xảy ra khi lưu tin tuyển dụng. Vui lòng thử lại.'
        : 'Error saving job post. Please try again.');
    }
  };

  return (
    <DashboardLayout role="employer" showSearch={false} key={language}>
      <PostJobContainer>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeft /> {language === 'vi' ? 'Quay lại' : 'Back'}
        </BackButton>

        {/* Verification Warning */}
        {verificationStatus !== '' && verificationStatus !== 'approved' && !isEditing && (
          <VerificationWarning>
            <AlertCircle />
            <div className="content">
              <h3>{language === 'vi' ? '⚠️ Yêu cầu xác thực hồ sơ công ty' : '⚠️ Company Verification Required'}</h3>
              <p>
                {language === 'vi'
                  ? 'Bạn cần hoàn tất xác thực hồ sơ công ty trước khi đăng tin tuyển dụng. Quá trình xác thực bao gồm 4 bước: Giấy phép kinh doanh, Thông tin doanh nghiệp, Người đại diện, và Thông tin liên hệ.'
                  : 'You need to complete company verification before posting jobs. The verification process includes 4 steps: Business License, Company Information, Representative, and Contact Information.'}
              </p>
              {verificationStatus === 'pending' ? (
                <p style={{ fontWeight: '600', marginBottom: 0 }}>
                  {language === 'vi'
                    ? '✓ Hồ sơ đang được xem xét. Chúng tôi sẽ phê duyệt trong vòng 24-48 giờ.'
                    : '✓ Your profile is under review. We will approve within 24-48 hours.'}
                </p>
              ) : (
                <button onClick={() => navigate('/employer/verification')}>
                  {language === 'vi' ? 'Bắt đầu xác thực ngay' : 'Start Verification Now'}
                </button>
              )}
            </div>
          </VerificationWarning>
        )}

        {/* Method Selector Banners */}
        {!isEditing && (
          <div style={{ marginBottom: '28px' }}>
            <MethodSelectorContainer>
              <SelectorCard
                type="button"
                $variant="ai"
                $active={showJdParser}
                onClick={() => {
                  setShowJdParser(true);
                  setShowStandardForm(false);
                }}
              >
                <div className="icon-wrapper">
                  <Sparkles />
                </div>
                <div className="card-content">
                  <div className="card-header-row">
                    <span className="card-title">
                      {language === 'vi'
                        ? 'Tạo tin tuyển dụng từ JD'
                        : 'Quick post from JD'}
                    </span>
                    <span className="badge">
                      {language === 'vi' ? 'AI điền tự động' : 'AI Autofill'}
                    </span>
                  </div>
                  <span className="card-subtitle">
                    {language === 'vi'
                      ? 'Tải lên PDF hoặc dán mô tả công việc, AI tự phân tích và điền form trong 3 giây'
                      : 'Upload PDF or paste job details, AI parses and fills form fields in 3s'}
                  </span>
                </div>
              </SelectorCard>

              <SelectorCard
                type="button"
                $variant="manual"
                $active={showStandardForm}
                onClick={() => {
                  setShowStandardForm(true);
                  setShowJdParser(false);
                }}
              >
                <div className="icon-wrapper">
                  <FileText />
                </div>
                <div className="card-content">
                  <span className="card-title">
                    {language === 'vi'
                      ? 'Tạo tin tuyển dụng thủ công'
                      : 'Manual Post (Hand-fill)'}
                  </span>
                  <span className="card-subtitle">
                    {language === 'vi'
                      ? 'Tự nhập tay chi tiết các trường thông tin (hỗ trợ tạo nhanh mô tả công việc bằng AI)'
                      : 'Manually input all details (supports quick JD text generation with AI assistance)'}
                  </span>
                </div>
              </SelectorCard>
            </MethodSelectorContainer>

            {showJdParser && (
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
        )}

        {!showStandardForm && !showJdParser && !isEditing && (
          <div style={{ marginBottom: '40px' }}>
            <GuidelinesHeader>
              <h2>
                {language === 'vi'
                  ? 'Hướng dẫn & Tính năng hỗ trợ tuyển dụng thông minh'
                  : 'Guides & Smart Recruiting Support Features'}
              </h2>
              <p>
                {language === 'vi'
                  ? 'Khám phá các công cụ AI giúp tối ưu hóa quy trình tuyển dụng của bạn nhanh chóng'
                  : 'Explore AI tools that help optimize your recruiting workflow quickly'}
              </p>
            </GuidelinesHeader>
            <InfoCardsGrid>
              <InfoCard>
                <div className="card-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <Sparkles />
                </div>
                <h3 className="card-title">
                  {language === 'vi' ? 'Trích xuất tự động qua AI' : 'AI Autofill Parsing'}
                </h3>
                <p className="card-desc">
                  {language === 'vi'
                    ? 'Tải lên tài liệu JD hiện có dưới dạng PDF hoặc dán văn bản mô tả. AI sẽ tự động đọc, trích xuất thông tin và điền đầy đủ vào biểu mẫu chỉ trong 3 giây.'
                    : 'Upload your existing JD PDF or paste job description text. AI will parse, extract requirements and fill the fields automatically.'}
                </p>
              </InfoCard>

              <InfoCard>
                <div className="card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <ClipboardList />
                </div>
                <h3 className="card-title">
                  {language === 'vi' ? 'Tạo nhanh văn bản JD bằng AI' : 'AI Quick JD Generation'}
                </h3>
                <p className="card-desc">
                  {language === 'vi'
                    ? 'Khi điền biểu mẫu thủ công, bạn chỉ cần điền tiêu đề công việc, AI sẽ hỗ trợ bạn tự động tạo đầy đủ phần mô tả công việc, yêu cầu tuyển dụng và quyền lợi tương ứng.'
                    : 'When manually filling out the form, simply write the job title. AI can suggest and write the description, requirements, and perks instantly.'}
                </p>
              </InfoCard>

              <InfoCard>
                <div className="card-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <CheckCircle2 />
                </div>
                <h3 className="card-title">
                  {language === 'vi' ? 'Sàng lọc CV & Phỏng vấn ảo' : 'AI Screening & Chatbot'}
                </h3>
                <p className="card-desc">
                  {language === 'vi'
                    ? 'Kích hoạt lọc hồ sơ bằng AI để chấm điểm CV ứng viên, đồng thời tự động phỏng vấn trực tuyến qua chat với AI Interviewer ở vòng sàng lọc sơ tuyển.'
                    : 'Enable AI screening to score CV candidates, and run automated chat interviews with the AI Interviewer simulator as a preliminary round.'}
                </p>
              </InfoCard>
            </InfoCardsGrid>
          </div>
        )}

        {showStandardForm && (
          <PageLayout>
            {/* Main Form Content */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FormCard>
              <FormHeader>
                <div className="icon-box">
                  <Briefcase />
                </div>
                <div className="header-text">
                  <h1>{isEditing
                    ? (language === 'vi' ? 'Cập nhật tin tuyển dụng' : 'Edit Job Posting')
                    : (language === 'vi' ? 'Đăng Bài Tiêu Chuẩn' : 'Post New Job')}
                  </h1>
                  <p>{isEditing
                    ? (language === 'vi' ? 'Cập nhật thông tin tin tuyển dụng' : 'Update job posting details')
                    : (language === 'vi' ? 'Điền thông tin để tạo tin tuyển dụng' : 'Fill in the details to create a job posting')}
                  </p>
                </div>
              </FormHeader>

              <InfoBox>
                <Clock />
                <div className="info-content">
                  <div className="info-title">{language === 'vi' ? 'Lưu ý về bài đăng' : 'Posting Guidelines'}</div>
                  <div className="info-text">
                    {language === 'vi'
                      ? 'Bài đăng sẽ được hiển thị đến hết thời hạn nộp hồ sơ. Phù hợp cho các vị trí cần tuyển dụng lâu dài.'
                      : 'Posts will be prioritized ultil end of application deadline. Suitable for long-term recruitment positions.'}
                  </div>
                </div>
              </InfoBox>

              <form onSubmit={handleSubmit}>
                {/* Phân loại job: Tiêu chuẩn / Tuyển gấp */}
                <FormGroup style={{ marginBottom: '20px' }}>
                  <Label>{language === 'vi' ? 'Phân loại tin tuyển dụng ' : 'Job Classification '}<span style={{ color: '#E24B4A' }}>*</span></Label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: 'standard' }))}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: `2px solid ${formData.urgencyLevel === 'standard' ? '#1e40af' : '#e2e8f0'}`,
                        background: formData.urgencyLevel === 'standard' ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '4px',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: '700', color: formData.urgencyLevel === 'standard' ? '#1e40af' : '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {language === 'vi' ? 'Tiêu chuẩn' : 'Standard'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>
                        {language === 'vi' ? 'Tuyển dụng dài hạn, hiển thị đến hết deadline' : 'Long-term hiring, shown until deadline'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: 'urgent' }))}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: `2px solid ${formData.urgencyLevel === 'urgent' ? '#dc2626' : '#e2e8f0'}`,
                        background: formData.urgencyLevel === 'urgent' ? '#fef2f2' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '4px',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: '700', color: formData.urgencyLevel === 'urgent' ? '#dc2626' : '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {language === 'vi' ? 'Tuyển gấp' : 'Urgent Hiring'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>
                        {language === 'vi' ? 'Ưu tiên hiển thị, badge đỏ nổi bật cho ứng viên' : 'Priority display, red badge highlighted for candidates'}
                      </span>
                    </button>
                  </div>
                </FormGroup>

                <FormRow $columns="1fr 1fr">
                  <FormGroup>
                    <Label>{language === 'vi' ? 'Tiêu đề công việc - Vị trí công việc ' : 'Job Title - Position '}<span style={{ color: '#E24B4A' }}>*</span></Label>
                    <Input name="title" placeholder={language === 'vi' ? 'Nhân viên pha chế' : 'e.g., Waiter'} value={formData.title} onChange={handleChange} required />
                    {fieldWarnings.includes('title') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy tiêu đề phù hợp, vui lòng điền tay.' : 'AI did not find job title, please input manually.'}
                      </small>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label>{language === 'vi' ? 'Địa điểm làm việc ' : 'Work Location '}<span style={{ color: '#E24B4A' }}>*</span></Label>
                    {/* Gộp: trụ sở chính + chi nhánh → dropdown duy nhất */}
                    {profileAddress ? (
                      <>
                        <Select
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          required
                          style={{ width: '100%' }}
                        >
                          <option value="">{language === 'vi' ? '-- Chọn địa điểm làm việc --' : '-- Select work location --'}</option>
                          <option value={profileAddress}>
                            {profileBranches.length > 0
                              ? (language === 'vi' ? `Trụ sở chính: ${profileAddress}` : `Main office: ${profileAddress}`)
                              : profileAddress}
                          </option>
                          {profileBranches.map((branch, idx) => (
                            <option key={idx} value={branch}>{`Địa điểm ${idx + 1}: ${branch}`}</option>
                          ))}
                        </Select>
                        <small style={{ color: '#64748b', marginTop: '6px', display: 'block', fontSize: '12px' }}>
                          {language === 'vi'
                            ? 'Mỗi bài đăng chỉ áp dụng cho 1 vị trí và 1 địa điểm làm việc duy nhất.'
                            : 'Each post applies to 1 position and 1 work location only.'}
                        </small>
                      </>
                    ) : (
                      /* Chưa có địa chỉ trong hồ sơ → nhập tay + cảnh báo */
                      <>
                        <div style={{
                          padding: '10px 14px',
                          background: '#fff7ed',
                          border: '1.5px solid #fed7aa',
                          borderRadius: '10px',
                          fontSize: '13px',
                          color: '#9a3412',
                          fontWeight: 600,
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px'
                        }}>
                          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px', color: '#ea580c' }} />
                          <span>
                            {language === 'vi'
                              ? 'Vui lòng cập nhật địa chỉ trong Hồ Sơ Công Ty trước khi đăng tin.'
                              : 'Please update your address in Company Profile before posting.'}
                            {' '}
                            <button
                              type="button"
                              onClick={() => navigate('/employer/profile')}
                              style={{ color: '#1e40af', fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                            >
                              {language === 'vi' ? 'Cập nhật ngay' : 'Update now'}
                            </button>
                          </span>
                        </div>
                        <Input
                          name="location"
                          placeholder={language === 'vi' ? 'Quận 1, TP.HCM' : 'e.g., District 1, HCMC'}
                          value={formData.location}
                          onChange={handleChange}
                          required
                        />
                      </>
                    )}
                    {fieldWarnings.includes('location') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy địa điểm làm việc, vui lòng điền tay.' : 'AI did not find location, please input manually.'}
                      </small>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label>{language === 'vi' ? 'Ngày làm việc ' : 'Work Date '}<span style={{ color: '#E24B4A' }}>*</span></Label>
                    <Input
                      name="workDays"
                      type="date"
                      min={(() => {
                        // min = today (actual validation happens on submit + real-time below)
                        return new Date().toISOString().split('T')[0];
                      })()}
                      placeholder={language === 'vi' ? 'Chọn ngày làm' : 'Select work date'}
                      value={formData.workDays}
                      onChange={(e) => {
                        handleChange(e);
                        // Real-time: check 3-hour rule with first available startTime
                        const selectedDate = e.target.value;
                        if (selectedDate) {
                          const firstSlot = workHoursList.find(s => s.startTime);
                          if (firstSlot) {
                            const shiftStart = new Date(`${selectedDate}T${firstSlot.startTime}:00`);
                            const hoursLeft = (shiftStart - new Date()) / (1000 * 60 * 60);
                            if (hoursLeft < 3) {
                              setFieldErrors(prev => ({
                                ...prev,
                                workDays: language === 'vi'
                                  ? 'Bài đăng phải được tạo trước giờ bắt đầu ca làm ít nhất 3 tiếng. Vui lòng chọn ca làm việc muộn hơn.'
                                  : 'Job post must be created at least 3 hours before the shift starts. Please choose a later shift time.'
                              }));
                            } else {
                              setFieldErrors(prev => { const n = { ...prev }; delete n.workDays; return n; });
                            }
                          } else {
                            setFieldErrors(prev => { const n = { ...prev }; delete n.workDays; return n; });
                          }
                        } else {
                          setFieldErrors(prev => { const n = { ...prev }; delete n.workDays; return n; });
                        }
                      }}
                      required
                    />
                    {fieldErrors.workDays && (
                      <small style={{ color: '#E24B4A', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ⚠️ {fieldErrors.workDays}
                      </small>
                    )}
                    {fieldWarnings.includes('workDays') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy thời hạn phù hợp, vui lòng điền tay.' : 'AI did not find deadline, please input manually.'}
                      </small>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label>{language === 'vi' ? 'Khung giờ làm việc ' : 'Working Hours '}<span style={{ color: '#E24B4A' }}>*</span></Label>
                    {fieldWarnings.includes('workHours') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy khung giờ làm việc phù hợp, vui lòng điền tay.' : 'AI did not find working hours, please input manually.'}
                      </small>
                    )}
                    <div style={{ marginTop: '4px' }}>
                      {workHoursList.map((slot, index) => (
                        <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                          <WorkHoursRow style={{ marginBottom: 0 }}>
                            <div>
                              <Label style={{ fontSize: '13px', marginBottom: '8px' }}>{language === 'vi' ? 'Từ' : 'From'}</Label>
                              <Input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => handleWorkHourChange(index, 'startTime', e.target.value)}
                                required
                              />
                              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                {language === 'vi' ? 'Gợi ý: 09:00 SA' : 'e.g. 09:00 AM'}
                              </span>
                            </div>
                            <div>
                              <Label style={{ fontSize: '13px', marginBottom: '8px' }}>{language === 'vi' ? 'Đến' : 'To'}</Label>
                              <Input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => handleWorkHourChange(index, 'endTime', e.target.value)}
                                required
                              />
                              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                {language === 'vi' ? 'Gợi ý: 06:00 CH' : 'e.g. 06:00 PM'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <WorkHoursActionButton
                                type="button"
                                onClick={addWorkHour}
                                disabled={workHoursList.length >= 5}
                                title={language === 'vi' ? 'Thêm khung giờ' : 'Add time slot'}
                              >
                                <Plus />
                              </WorkHoursActionButton>
                              {slot.isNew && (
                                <WorkHoursActionButton
                                  type="button"
                                  $danger
                                  onClick={() => removeWorkHour(index)}
                                  title={language === 'vi' ? 'Xóa khung giờ' : 'Remove time slot'}
                                >
                                  <Trash2 />
                                </WorkHoursActionButton>
                              )}
                            </div>
                          </WorkHoursRow>
                          <div style={{ marginTop: '12px' }}>
                            <Label style={{ fontSize: '13px', marginBottom: '8px' }}>{language === 'vi' ? 'Thứ' : 'Days'}</Label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {WORK_DAY_OPTIONS.map(opt => {
                                const active = (slot.days || []).includes(opt.key);
                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => toggleWorkHourDay(index, opt.key)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      border: `1px solid ${active ? '#1e40af' : '#cbd5e1'}`,
                                      background: active ? '#1e40af' : '#ffffff',
                                      color: active ? '#ffffff' : '#475569',
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    {language === 'vi' ? opt.vi : opt.en}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {workHourErrors[index] && (
                            <small style={{ color: '#E24B4A', fontWeight: '600', marginTop: '8px', display: 'block' }}>
                              ⚠️ {workHourErrors[index]}
                            </small>
                          )}
                        </div>
                      ))}
                    </div>
                  </FormGroup>

                  <FormGroup>
                    <Label>{language === 'vi' ? 'Mức lương ' : 'Salary '}<span style={{ color: '#E24B4A' }}>*</span></Label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          name="salary"
                          type="text"
                          inputMode="numeric"
                          placeholder={language === 'vi' ? 'Ví dụ: 25.000' : 'e.g., 25,000'}
                          // Store raw digits, display with thousand separators
                          value={formData.salary ? Number(String(formData.salary).replace(/[.,\s]/g, '')).toLocaleString('vi-VN') : ''}
                          onChange={e => handleChange({ target: { name: 'salary', value: e.target.value.replace(/\D/g, '') } })}
                          required
                          style={{
                            borderColor: salaryError ? '#EF4444' : '',
                            background: salaryError ? '#FFF1F2' : '',
                          }}
                        />
                      </div>
                      <Select
                        name="salaryUnit"
                        value={formData.salaryUnit}
                        onChange={handleChange}
                        style={{ maxWidth: '160px' }}
                      >
                        <option value="hour">{language === 'vi' ? 'VNĐ/giờ' : 'VND/hour'}</option>
                        <option value="month">{language === 'vi' ? 'VNĐ/tháng' : 'VND/month'}</option>
                      </Select>
                    </div>
                    {salaryError ? (
                      <small style={{ color: '#DC2626', fontSize: '12px', marginTop: '6px', display: 'block', fontWeight: '600' }}>
                        ⚠️ {language === 'vi' ? 'Lương theo giờ phải từ 25.000 VNĐ trở lên.' : 'Hourly salary must be at least 25,000 VND.'}
                      </small>
                    ) : formData.salaryUnit === 'hour' && (
                      <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {language === 'vi' ? 'Tối thiểu 25.000 VNĐ/giờ' : 'Minimum 25,000 VND/hour'}
                      </small>
                    )}
                    {fieldWarnings.includes('salary') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy mức lương phù hợp, vui lòng điền tay.' : 'AI did not find salary, please input manually.'}
                      </small>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label>{language === 'vi' ? 'Đặc điểm' : 'Tags'}</Label>
                    <Input
                      name="tags"
                      placeholder={language === 'vi' ? 'Pha chế, F&B, Coffee (phân cách bằng dấu phẩy)' : 'Barista, F&B, Coffee (comma separated)'}
                      value={formData.tags}
                      onChange={handleChange}
                    />
                    <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
                      {language === 'vi'
                        ? 'Nhập các đặc điểm và phân cách bằng dấu phẩy. Ví dụ: Pha chế, F&B, Coffee'
                        : 'Enter tags separated by commas. Example: Barista, F&B, Coffee'}
                    </p>
                  </FormGroup>
                </FormRow>

                {/* AI Screening & Custom Interview Questions */}
                <FormRow $columns="1fr">
                  <FormGroup style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F5F3FF', padding: '18px', borderRadius: '12px', border: '2px solid #DDD6FE', transition: 'all 0.3s ease' }}>
                      <input
                        type="checkbox"
                        id="isAiScreeningEnabled"
                        name="isAiScreeningEnabled"
                        checked={formData.isAiScreeningEnabled}
                        onChange={handleChange}
                        style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#8b5cf6' }}
                      />
                      <label htmlFor="isAiScreeningEnabled" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1 }}>
                        <span style={{ fontWeight: '700', fontSize: '15px', color: '#4C1D95', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sparkles size={16} color="#8b5cf6" />
                          {language === 'vi' ? 'Chọn lọc ứng viên qua AI (Phỏng vấn)' : 'Screen Candidates with AI (Interview)'}
                          <button
                            type="button"
                            aria-label={language === 'vi' ? 'Xem mô tả chức năng AI' : 'View AI feature description'}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAiInfoModal(true); }}
                            style={{
                              background: 'none', border: 'none', padding: 0, margin: 0,
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', flexShrink: 0
                            }}
                          >
                            <Info size={16} color="#8b5cf6" />
                          </button>
                        </span>
                        <span style={{ fontSize: '12px', color: '#6D28D9', marginTop: '4px', fontWeight: '500' }}>
                          {language === 'vi'
                            ? 'Kích hoạt phòng phỏng vấn ứng viên trực tuyến qua AI'
                            : 'Enable interview candidate with AI'}
                        </span>
                      </label>
                    </div>
                  </FormGroup>

                  {formData.isAiScreeningEnabled && (
                    <AnimatedFormGroup>
                      <Label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#4C1D95' }}>
                        <ClipboardList size={16} color="#8b5cf6" />
                        {language === 'vi' ? 'Câu hỏi phỏng vấn riêng từ bạn dành cho AI học (Mỗi câu hỏi một dòng) ' : 'Custom Interview Questions for AI to Learn (One question per line) '}<span style={{ color: '#E24B4A' }}>*</span>
                      </Label>
                      <TextArea
                        name="customQuestions"
                        placeholder={language === 'vi'
                          ? "Ví dụ:\nBạn có sẵn sàng tăng ca hoặc làm ca đêm khi cửa hàng đông khách không?\nBạn đã có chứng chỉ pha chế chuyên nghiệp nào chưa?"
                          : "Example:\nAre you willing to work overtime or night shifts if the store gets busy?\nDo you have any professional barista certifications?"}
                        value={formData.customQuestions}
                        onChange={handleChange}
                        rows={4}
                        style={{ border: '1px solid #C084FC', focusBorderColor: '#8B5CF6' }}
                      />
                      <p style={{ fontSize: '12px', color: '#7C3AED', marginTop: '6px', fontWeight: '500' }}>
                        {language === 'vi'
                          ? 'AI Interviewer sẽ học các câu hỏi này và đưa vào cuộc phỏng vấn trực tiếp với Candidate ở Vòng 2.'
                          : 'The AI Interviewer will learn these questions and include them in the live interview with candidates.'}
                      </p>
                    </AnimatedFormGroup>
                  )}
                </FormRow>

                <FormGroup style={{ marginTop: '8px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <SectionLabel style={{ marginBottom: 0 }}>
                      <span>{language === 'vi' ? 'Mô tả công việc' : 'Job Description'} <span style={{ color: '#E24B4A' }}>*</span></span>
                    </SectionLabel>
                  </div>
                  {formData.title && (
                    <AiButton
                      type="button"
                      onClick={handleGenerateJdWithAi}
                      disabled={loadingAi}
                    >
                      {loadingAi ? (
                        <>
                          <SpinningLoader size={16} />
                          <span>
                            {language === 'vi' ? 'AI đang soạn thảo Mô tả, Yêu cầu & Quyền lợi...' : 'AI is drafting Job Description, Requirements & Benefits...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="sparkle-icon" size={18} />
                          <span>
                            {language === 'vi'
                              ? 'Bạn đã nhập Tiêu đề? Nhấp để AI viết hộ Mô tả, Yêu cầu & Quyền lợi ngay!'
                              : 'Job Title filled? Click to let AI write Description, Requirements & Benefits instantly!'}
                          </span>
                          <span className="cta-badge">
                            {language === 'vi' ? 'Miễn phí' : 'Free AI Draft'}
                          </span>
                        </>
                      )}
                    </AiButton>
                  )}
                  <TextArea name="description" placeholder={language === 'vi' ? 'Mô tả vị trí công việc...' : 'Describe the position...'} value={formData.description} onChange={(e) => { handleChange(e); if (e.target.value.trim()) setFieldErrors(prev => { const n = { ...prev }; delete n.description; return n; }); }} required />
                  {fieldErrors.description && (
                    <small style={{ color: '#E24B4A', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.description}
                    </small>
                  )}
                  {fieldWarnings.includes('description') && (
                    <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                      ⚠️ {language === 'vi' ? 'AI không thể tạo mô tả công việc, vui lòng nhập tay.' : 'AI did not generate description, please input manually.'}
                    </small>
                  )}
                </FormGroup>

                <FormGroup>
                  <SectionLabel>
                    <span>{language === 'vi' ? 'Yêu cầu' : 'Requirements'} <span style={{ color: '#E24B4A' }}>*</span></span>
                  </SectionLabel>
                  <TextArea name="requirements" placeholder={language === 'vi' ? 'Liệt kê yêu cầu và trình độ...' : 'List requirements and qualifications...'} value={formData.requirements} onChange={(e) => { handleChange(e); if (e.target.value.trim()) setFieldErrors(prev => { const n = { ...prev }; delete n.requirements; return n; }); }} />
                  {fieldErrors.requirements && (
                    <small style={{ color: '#E24B4A', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.requirements}
                    </small>
                  )}
                  {fieldWarnings.includes('requirements') && (
                    <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                      ⚠️ {language === 'vi' ? 'AI không thể tạo yêu cầu công việc, vui lòng nhập tay.' : 'AI did not generate requirements, please input manually.'}
                    </small>
                  )}
                </FormGroup>

                <FormGroup>
                  <SectionLabel>
                    <span>{language === 'vi' ? 'Quyền lợi' : 'Benefits'}</span>
                  </SectionLabel>
                  <TextArea name="benefits" placeholder={language === 'vi' ? 'Liệt kê quyền lợi và phúc lợi...' : 'List benefits and perks...'} value={formData.benefits} onChange={handleChange} />
                  {fieldWarnings.includes('benefits') && (
                    <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                      ⚠️ {language === 'vi' ? 'AI không thể tạo quyền lợi, vui lòng nhập tay.' : 'AI did not generate benefits, please input manually.'}
                    </small>
                  )}
                </FormGroup>

                {/* Custom fields - employer-defined extra JD sections */}
                {(formData.customFields || []).map((field, index) => (
                  <FormGroup key={index}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleCustomFieldChange(index, 'label', e.target.value)}
                        placeholder={language === 'vi' ? 'Tên mục (vd: Địa điểm làm việc)...' : 'Field title (e.g. Work location)...'}
                        style={{
                          flex: 1,
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#1E293B',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          padding: '10px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(index)}
                        title={language === 'vi' ? 'Xóa mục này' : 'Remove this field'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '38px',
                          height: '38px',
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
                  <Button type="button" $variant="secondary" onClick={() => navigate('/employer/dashboard')}>
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </Button>
                  <SubmitButton type="submit" $variant="primary" $size="large">
                    <Save /> {isEditing
                      ? (language === 'vi' ? 'Cập Nhật' : 'Update Job')
                      : (language === 'vi' ? 'Đăng Tin' : 'Post Job')}
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

            <ChecklistItem $filled={!!formData.workDays.trim()} $warning={fieldWarnings.includes('workDays')}>
              <div className="label-group">
                {fieldWarnings.includes('workDays') ? <AlertTriangle color="#dc2626" /> : !!formData.workDays.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Ngày làm việc' : 'Work Date'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={workHoursList.some(s => s.startTime && s.endTime)} $warning={fieldWarnings.includes('workHours')}>
              <div className="label-group">
                {fieldWarnings.includes('workHours') ? <AlertTriangle color="#dc2626" /> : workHoursList.some(s => s.startTime && s.endTime) ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Khung giờ làm việc' : 'Working hours'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={!!formData.salary.trim()} $warning={fieldWarnings.includes('salary')}>
              <div className="label-group">
                {fieldWarnings.includes('salary') ? <AlertTriangle color="#dc2626" /> : !!formData.salary.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Mức lương' : 'Salary'}</span>
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

            <ChecklistItem $filled={!!formData.benefits.trim()} $warning={fieldWarnings.includes('benefits')}>
              <div className="label-group">
                {fieldWarnings.includes('benefits') ? <AlertTriangle color="#dc2626" /> : !!formData.benefits.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Quyền lợi ứng viên' : 'Benefits'}</span>
              </div>
            </ChecklistItem>
          </SidebarCard>
        </PageLayout>
        )}
      </PostJobContainer>

      {/* Verification Required Modal */}
      <Modal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          if (verificationStatus !== 'approved') {
            navigate('/employer/dashboard');
          }
        }}
        title={language === 'vi' ? 'Xác Thực Hồ Sơ Công Ty' : 'Company Verification'}
        size="medium"
      >
        <VerificationModalContent>
          <div className="icon">
            <AlertCircle />
          </div>
          <h3>{language === 'vi' ? 'Yêu cầu xác thực hồ sơ' : 'Verification Required'}</h3>
          <p>
            {verificationStatus === 'pending'
              ? (language === 'vi'
                ? 'Hồ sơ công ty của bạn đang được xem xét. Vui lòng chờ phê duyệt trước khi đăng tin tuyển dụng. Thời gian xử lý: 24-48 giờ.'
                : 'Your company profile is under review. Please wait for approval before posting jobs. Processing time: 24-48 hours.')
              : (language === 'vi'
                ? 'Để đăng tin tuyển dụng, bạn cần hoàn tất 4 bước xác thực hồ sơ công ty: Giấy phép kinh doanh, Thông tin doanh nghiệp, Người đại diện và Thông tin liên hệ.'
                : 'To post jobs, you need to complete 4 steps of company verification: Business License, Company Information, Representative, and Contact Information.')}
          </p>
          <div className="button-group">
            <Button
              $variant="secondary"
              onClick={() => {
                setShowVerificationModal(false);
                navigate('/employer/dashboard');
              }}
            >
              {language === 'vi' ? 'Để sau' : 'Later'}
            </Button>
            {verificationStatus !== 'pending' && (
              <Button
                $variant="primary"
                onClick={() => navigate('/employer/verification')}
              >
                {language === 'vi' ? 'Xác thực ngay' : 'Verify Now'}
              </Button>
            )}
          </div>
        </VerificationModalContent>
      </Modal>

      {/* AI Interview feature description modal */}
      <Modal isOpen={showAiInfoModal} onClose={() => setShowAiInfoModal(false)}>
        <div style={{ padding: '8px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={22} color="#8b5cf6" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#4C1D95', margin: 0 }}>
              {language === 'vi' ? 'Chọn lọc ứng viên qua AI' : 'AI Candidate Screening'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#166534', marginBottom: '4px' }}>
                {language === 'vi' ? 'Vòng 1 — Chấm điểm CV (luôn bật)' : 'Round 1 — CV Scoring (always on)'}
              </div>
              <p style={{ fontSize: '13.5px', color: '#3F6212', lineHeight: 1.6, margin: 0 }}>
                {language === 'vi'
                  ? 'Mọi CV ứng tuyển vào tin tuyển dụng tiêu chuẩn đều được AI tự động phân tích và chấm điểm mức độ phù hợp — dù bạn có bật tùy chọn bên dưới hay không.'
                  : 'Every CV submitted to a standard job is automatically analyzed and scored by AI for fit — whether or not you enable the option below.'}
              </p>
            </div>

            <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#5B21B6', marginBottom: '4px' }}>
                {language === 'vi' ? 'Vòng 2 — Phỏng vấn AI (tùy chọn này)' : 'Round 2 — AI Interview (this option)'}
              </div>
              <p style={{ fontSize: '13.5px', color: '#6D28D9', lineHeight: 1.6, margin: 0 }}>
                {language === 'vi'
                  ? 'Khi bật, ứng viên có CV được bạn duyệt sẽ tham gia thêm một buổi phỏng vấn chat trực tuyến với AI. Bạn có thể thêm câu hỏi riêng để AI hỏi ứng viên. Điểm phỏng vấn sẽ hiển thị trong hồ sơ ứng viên để bạn tham khảo khi ra quyết định.'
                  : 'When enabled, candidates whose CV you approve take an additional live AI chat interview. You can add custom questions for the AI to ask. Interview scores appear in the candidate profile to support your decision.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button $variant="primary" onClick={() => setShowAiInfoModal(false)}>
              {language === 'vi' ? 'Đã hiểu' : 'Got it'}
            </Button>
          </div>
        </div>
      </Modal>

      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />
    </DashboardLayout>
  );
};

export default PostJob;

