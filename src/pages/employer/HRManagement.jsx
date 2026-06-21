import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Users, UsersRound, FileText, MessageSquare, Clock, MapPin, Phone, Mail, Edit, Edit3, Trash2, Eye, CheckCircle, Send, Search, Calendar, Newspaper, TrendingUp, TrendingDown, AlertCircle, User, Plus, X, XCircle, Wallet, Save, Award, Star, Briefcase, Zap, Banknote, ThumbsUp, ThumbsDown, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import Modal from '../../components/Modal';
import CVPreviewModal from '../../components/CVPreviewModal';
import ConfirmModal from '../../components/ConfirmModal';
import quickJobService from '../../services/quickJobService';
import employerProfileService from '../../services/employerProfileService';
import applicationService from '../../services/applicationService';
import cvAiService from '../../services/cvAiService';
import jobPostService from '../../services/jobPostService';
import experienceService from '../../services/experienceService';
import candidateProfileService from '../../services/candidateProfileService';
import { createCandidateCvAcceptedNotification, createCandidateCvRejectedNotification, createQuickJobActivationRequestNotification, createChatMessageNotification, createEmployerReviewNotification } from '../../services/notificationService';
import DynamicTranslate from '../../components/DynamicTranslate';

// Helper: tính số giờ từ chuỗi shift "HH:MM - HH:MM"
const calcShiftHours = (shift) => {
  if (!shift) return 0;
  const parts = shift.split(' - ');
  if (parts.length !== 2) return 0;
  const [startH, startM] = parts[0].split(':').map(Number);
  const [endH, endM] = parts[1].split(':').map(Number);
  let start = startH * 60 + startM;
  let end = endH * 60 + endM;
  if (end <= start) end += 24 * 60; // qua đêm
  return (end - start) / 60;
};

// Mock HR Staff Data
// Mock HR Staff Data - REMOVED: Now using only real data from DynamoDB
const getHRStaff = (language) => {
  // Return empty array - all staff data now comes from realApplications (DynamoDB)
  return [];
};

// Mock Quick Job Posts Data


// Mock Chat Conversations Data


// ─── Animations ────────────────────────────────────────────
const pulseAnimation = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.03);
    }
  }
`;

// ─── Page wrapper ─────────────────────────────────────────
const PageContainer = styled(motion.div)`
  ${pulseAnimation}
`;
// ─── Page header (đồng nhất Applications) ─────────────────
const PageHeader = styled.div`
  margin-bottom: 28px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

const PageTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PageIconBox = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 15px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg { width: 22px; height: 22px; color: #1e40af; }
`;

const PageTitleText = styled.div`
  h1 {
    font-size: 26px;
    font-weight: 800;
    color: ${props => props.theme.colors.text};
    letter-spacing: -0.5px;
    line-height: 1.2;
    margin-bottom: 4px;
  }
  p {
    color: ${props => props.theme.colors.textLight};
    font-size: 13.5px;
    font-weight: 500;
  }
`;

const CountBadge = styled.div`
  align-self: flex-start;
  padding: 6px 16px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  color: #1e40af;
  white-space: nowrap;
`;

const EmptyState = styled(motion.div)`
  text-align: center;
  padding: 60px 20px;
  background: #ffffff;
  border-radius: 16px;
  border: 1.5px dashed #E2E8F0;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.05);

  .icon { font-size: 36px; margin-bottom: 12px; opacity: 0.5; }
  h3 { font-size: 18px; font-weight: 700; margin-bottom: 6px; color: ${props => props.theme.colors.text}; }
  p { font-size: 14px; color: ${props => props.theme.colors.textLight}; }
`;

// ─── Quick Jobs Section ────────────────────────────────────
const QuickJobsSection = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1.5px solid #E8EFFF;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  margin-bottom: 24px;
`;

const QuickJobsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const QuickJobCard = styled(motion.button)`
  padding: 28px 24px;
  background: ${props => {
    const alpha = props.$active ? '20' : '08';
    return `linear-gradient(135deg, ${props.$color}${alpha} 0%, ${props.$color}05 100%)`;
  }};
  border: 2px solid ${props => props.$active ? props.$color : props.$color + '30'};
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${props => props.$color};
    transform: translateY(-4px);
    box-shadow: ${props => `0 12px 40px ${props.$color}25`};
    background: ${props => `linear-gradient(135deg, ${props.$color}25 0%, ${props.$color}10 100%)`};
  }
`;

const QuickJobIcon = styled.div`
  width: 64px;
  height: 64px;
  background: ${props => props.$color}20;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  ${QuickJobCard}:hover & {
    background: ${props => props.$color};
    
    svg {
      color: white;
    }
  }
  
  svg {
    width: 32px;
    height: 32px;
    color: ${props => props.$color};
    transition: color 0.3s ease;
  }
`;

const QuickJobLabel = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  text-align: center;
`;

const QuickJobDescription = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.theme.colors.textLight};
  text-align: center;
  line-height: 1.5;
`;

// ─── HR Staff Styles ───────────────────────────────────────
const StaffGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-top: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StaffCard = styled(motion.div)`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.13);
    transform: translateY(-2px);
  }
`;

const StaffHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const StaffName = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 4px;
`;

const StaffPosition = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
`;

const StaffStatus = styled.div`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  background: ${props =>
    props.$status === 'active' ? '#D1FAE5' :
      props.$status === 'completed' ? '#E0E7FF' :
        props.$status === 'pending' ? '#FEF9C3' :
          props.$status === 'pending_confirmation' ? '#FEE2E2' :
            props.$status === 'pending_change' ? '#FFEDD5' :
              '#FEF3C7'};
  color: ${props =>
    props.$status === 'active' ? '#047857' :
      props.$status === 'completed' ? '#3730A3' :
        props.$status === 'pending' ? '#854D0E' :
          props.$status === 'pending_confirmation' ? '#B91C1C' :
            props.$status === 'pending_change' ? '#C2410C' :
              '#92400E'};
  border: 1px solid ${props =>
    props.$status === 'active' ? '#10B981' :
      props.$status === 'completed' ? '#818CF8' :
        props.$status === 'pending' ? '#EAB308' :
          props.$status === 'pending_confirmation' ? '#EF4444' :
            props.$status === 'pending_change' ? '#F97316' :
              '#F59E0B'};
`;

const StaffMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  padding: 16px 0;
  border-top: 1px solid #E8EFFF;
  border-bottom: 1px solid #E8EFFF;
  min-height: 220px; /* Giữ chiều cao đồng đều dù có/không phone/email */
  
  .meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    
    svg {
      width: 14px;
      height: 14px;
      color: #1e40af;
    }
  }
`;

const StaffActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const StaffTabBar = styled.div`
  display: inline-flex;
  gap: 8px;
  margin-bottom: 28px;
`;

const StaffTabButton = styled.button`
  padding: 10px 24px;
  cursor: pointer;
  border-radius: 10px;
  border: 1.5px solid ${props => props.$active ? props.$color : '#E2E8F0'};
  background: ${props => props.$active ? props.$color + '10' : '#FFFFFF'};
  color: ${props => props.$active ? props.$color : '#94A3B8'};
  font-size: 13px;
  font-weight: ${props => props.$active ? '700' : '500'};
  box-shadow: ${props => props.$active ? `0 2px 10px ${props.$color}25` : '0 1px 4px rgba(0,0,0,0.06)'};
  transition: all 0.18s ease;
  white-space: nowrap;

  &:hover {
    border-color: ${props => props.$color};
    color: ${props => props.$color};
    background: ${props => props.$color + '08'};
    box-shadow: 0 3px 12px ${props => props.$color}20;
  }
`;

const ChangeRequestBanner = styled.div`
  background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD550 100%);
  border: 1.5px solid #FED7AA;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(251, 146, 60, 0.08);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: #F97316;
  }

  .cr-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .cr-urgency-urgent {
    font-size: 10px;
    font-weight: 800;
    color: #DC2626;
    background: #FEF2F2;
    border: 1px solid #FECACA;
    padding: 3px 8px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .cr-urgency-normal {
    font-size: 10px;
    font-weight: 800;
    color: #92400E;
    background: #FFFBEB;
    border: 1px solid #FEF3C7;
    padding: 3px 8px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .cr-shift-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13.5px;
    font-weight: 700;
    color: #7C2D12;
    margin-bottom: 8px;
    
    svg { 
      width: 14px; 
      height: 14px; 
      color: #F97316;
      flex-shrink: 0;
    }

    .replacement-label {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #F97316;
        font-size: 12px;
        background: #FFF7ED;
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid #FFEDD5;
    }
  }

  .cr-reason {
    font-size: 13px;
    color: #92400E;
    line-height: 1.5;
    font-weight: 500;
    padding: 10px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    margin-bottom: 8px;
    border: 1px dashed #FED7AA;
  }

  .cr-time {
    font-size: 11px;
    color: #B45309;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 0.8;
    
    svg { width: 12px; height: 12px; }
  }
`;

// --- Styled components for Quick Jobs Introduction ---
const IntroWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 1000px;
  margin: 0 auto;
  padding: 16px;
  font-family: 'Outfit', 'Inter', sans-serif;
`;

const IntroHero = styled.div`
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%);
  border-radius: 24px;
  padding: 48px 40px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(30, 64, 175, 0.2);
  
  &::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
    border-radius: 50%;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -60px;
    left: 10%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%);
    border-radius: 50%;
  }
`;

const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #fef08a;
  margin-bottom: 20px;
  backdrop-filter: blur(8px);
  
  svg {
    width: 14px;
    height: 14px;
    fill: #fef08a;
  }
`;

const HeroTitle = styled.h1`
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.8px;
  margin-bottom: 16px;
  line-height: 1.2;
  color: white !important;
`;

const HeroDesc = styled.p`
  font-size: 16px;
  line-height: 1.6;
  max-width: 680px;
  opacity: 0.92;
  margin: 0;
  font-weight: 500;
`;

const IntroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const IntroCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  border: 1.5px solid #e8efff;
  box-shadow: 0 10px 30px rgba(30, 64, 175, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  &:hover {
    transform: translateY(-6px);
    border-color: #bfdbfe;
    box-shadow: 0 16px 36px rgba(30, 64, 175, 0.09);
  }
`;

const CardIconBox = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: ${props => props.$bgColor || '#EFF6FF'};
  border: 1.5px solid ${props => props.$borderColor || '#BFDBFE'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 22px;
    height: 22px;
    color: ${props => props.$color || '#1e40af'};
  }
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

const CardText = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
  margin: 0;
  font-weight: 500;
`;

const IntroSectionHeader = styled.div`
  margin-top: 16px;
  margin-bottom: 24px;
  h2 {
    font-size: 24px;
    font-weight: 800;
    color: #1e293b;
    letter-spacing: -0.5px;
    margin: 0;
  }
  p {
    font-size: 14px;
    color: #64748b;
    margin-top: 6px;
    margin-bottom: 0;
    font-weight: 500;
  }
`;

const StepsTimeline = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StepItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  
  .step-num {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #1e40af;
    color: white;
    font-size: 15px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(30, 64, 175, 0.3);
  }
  
  .step-title {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    margin-top: 4px;
  }
  
  .step-desc {
    font-size: 13.5px;
    line-height: 1.5;
    color: #64748b;
    font-weight: 500;
  }
`;

const FaqPanel = styled.div`
  background: #f8fafc;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FaqItem = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  
  svg {
    width: 20px;
    height: 20px;
    color: #3b82f6;
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .faq-q {
    font-size: 15.5px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 6px;
  }
  
  .faq-a {
    font-size: 14px;
    line-height: 1.6;
    color: #64748b;
    font-weight: 500;
  }
`;

const ActionBanner = styled.div`
  background: white;
  border-radius: 24px;
  border: 2px solid #e8efff;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(30, 64, 175, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
  }
`;

const PendingBanner = styled(ActionBanner)`
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-color: #fde68a;
  
  &::before {
    background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
  }
`;

const ActionButton = styled(motion.button)`
  padding: 16px 36px;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  color: white;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(30, 64, 175, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const CancelButton = styled(motion.button)`
  padding: 16px 36px;
  background: white;
  color: #ef4444;
  font-size: 16px;
  font-weight: 700;
  border: 2px solid #fee2e2;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.05);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  svg {
    width: 18px;
    height: 18px;
  }

  &:hover:not(:disabled) {
    background: #fef2f2;
    border-color: #fecaca;
    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ChangeTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
`;

const ChangeTypeButton = styled.button`
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1.5px solid ${props => props.$selected ? '#F59E0B' : '#E5E7EB'};
  background: ${props => props.$selected ? 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' : '#FAFAFA'};
  color: ${props => props.$selected ? '#D97706' : '#6B7280'};

  svg { width: 15px; height: 15px; flex-shrink: 0; }

  &:hover {
    border-color: #F59E0B;
    background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
    color: #D97706;
  }
`;

const StaffButton = styled(motion.button)`
  flex: 1;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
  
  background: ${props => {
    if (props.$variant === 'danger') return '#EF4444';
    if (props.$variant === 'warning') return '#FEF3C7';
    if (props.$variant === 'success') return '#D1FAE5';
    return '#EFF6FF';
  }};
  color: ${props => {
    if (props.$variant === 'danger') return 'white';
    if (props.$variant === 'warning') return '#D97706';
    if (props.$variant === 'success') return '#065F46';
    return '#1e40af';
  }};
  border: 1.5px solid ${props => {
    if (props.$variant === 'danger') return '#EF4444';
    if (props.$variant === 'warning') return '#FCD34D';
    if (props.$variant === 'success') return '#6EE7B7';
    return '#BFDBFE';
  }};
  
  svg {
    width: 14px;
    height: 14px;
  }
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => {
    if (props.$variant === 'danger') return '0 4px 12px rgba(239, 68, 68, 0.3)';
    if (props.$variant === 'warning') return '0 4px 12px rgba(245, 158, 11, 0.3)';
    if (props.$variant === 'success') return '0 4px 12px rgba(16, 185, 129, 0.3)';
    return '0 4px 12px rgba(30, 64, 175, 0.15)';
  }};
  }
`;

// ─── Quick Job Posts Styles ────────────────────────────────
const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 0;
  border-bottom: 2px solid #E8EFFF;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.theme.colors.primary};
  }
`;

const PostJobButton = styled(motion.button)`
  padding: 10px 18px;
  border-radius: 10px;
  background: #1e40af;
  color: white;
  font-weight: 700;
  font-size: 13.5px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(30, 64, 175, 0.28);
  transition: all 0.2s ease;

  &:hover {
    background: #1e3a8a;
    box-shadow: 0 6px 18px rgba(30, 64, 175, 0.38);
    transform: translateY(-1px);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const QuickJobPostsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const QuickJobPostCard = styled(motion.div)`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.13);
    transform: translateY(-4px);
  }
`;

const QuickJobPostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex: 1;
`;

const QuickJobPostTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 0;
  line-height: 1.3;
`;

const QuickJobPostMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;
    
    svg {
      width: 16px;
      height: 16px;
      color: #1e40af;
      flex-shrink: 0;
    }
  }
`;

const QuickJobPostStats = styled.div`
  display: flex;
  gap: 24px;
  padding: 20px;
  border-top: 1px solid #E8EFFF;
  border-bottom: 1px solid #E8EFFF;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  border-radius: 12px;
  
  .stat {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    flex: 1;
    
    .stat-value {
      font-size: 28px;
      font-weight: 800;
      color: #1e40af;
      line-height: 1;
    }
    
    .stat-label {
      font-size: 13px;
      color: ${props => props.theme.colors.textLight};
      font-weight: 600;
    }
  }
`;

const QuickJobPostActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  width: 100%;
`;

const QuickJobPostButtonsRow = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const QuickJobPostButton = styled(motion.button)`
  flex: 1;
  padding: 12px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  white-space: nowrap;
  
  background: ${props => {
    if (props.$variant === 'primary') return 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)';
    if (props.$variant === 'danger') return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
    if (props.$variant === 'ai') return 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';
    return 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)';
  }};
  
  color: ${props => props.$variant === 'primary' || props.$variant === 'danger' || props.$variant === 'ai' ? 'white' : '#1e40af'};
  border: 1.5px solid ${props => {
    if (props.$variant === 'primary') return '#F59E0B';
    if (props.$variant === 'danger') return '#EF4444';
    if (props.$variant === 'ai') return '#a855f7';
    return '#BFDBFE';
  }};
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => {
      if (props.$variant === 'primary') return '0 6px 16px rgba(245, 158, 11, 0.4)';
      if (props.$variant === 'danger') return '0 6px 16px rgba(239, 68, 68, 0.4)';
      if (props.$variant === 'ai') return '0 6px 16px rgba(168, 85, 247, 0.4)';
      return '0 6px 16px rgba(30, 64, 175, 0.2)';
    }};
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const QuickJobStatusBadge = styled.div`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  background: ${props => props.$status === 'active' ? '#FEF3C7' : '#F1F5F9'};
  color: ${props => props.$status === 'active' ? '#92400E' : '#64748B'};
  border: 1px solid ${props => props.$status === 'active' ? '#F59E0B' : '#CBD5E1'};
`;

// ─── Chat Styles ───────────────────────────────────────────
const ChatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-top: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChatCard = styled(motion.div)`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  
  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.13);
    transform: translateY(-2px);
  }
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const ChatInfo = styled.div`
  flex: 1;
`;

const ChatName = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 4px;
`;

const ChatRole = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
`;

const ChatStatus = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.$status === 'online' ? '#10B981' : '#94A3B8'};
  box-shadow: ${props => props.$status === 'online' ? '0 0 0 2px #D1FAE5' : 'none'};
`;

const ChatMessagePreview = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
`;

const ChatFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #E8EFFF;
`;

const ChatTime = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 600;
`;

const ChatUnread = styled.div`
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  background: #DBEAFE;
  color: #1e40af;
  border: 1px solid #BFDBFE;
`;

// ─── Chat Modal Styles ──────────────────────────
const ChatModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;
`;

const ChatModalContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  height: 80vh;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  margin: auto;
  position: relative;
  z-index: 10000;
`;

const ChatModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 2px solid #E8EFFF;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
`;

const ChatModalHeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ChatModalAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: 700;
  position: relative;
`;

const ChatModalOnlineStatus = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$online ? '#10B981' : '#94A3B8'};
  border: 2px solid white;
`;

const ChatModalHeaderText = styled.div`
  h3 {
    font-size: 18px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 2px;
  }
  p {
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;
  }
`;

const ChatModalCloseButton = styled(motion.button)`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: white;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #F1F5F9;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ChatModalMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #F8FAFC;
`;

const ChatMessage = styled(motion.div)`
  display: flex;
  justify-content: ${props => props.$sender === 'me' ? 'flex-end' : 'flex-start'};
  align-items: center;
  gap: 8px;
  position: relative;

  &:hover .delete-button {
    opacity: 1;
  }
`;

const ChatMessageBubble = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: ${props => props.$sender === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
  background: ${props => props.$sender === 'me' ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' : 'white'};
  color: ${props => props.$sender === 'me' ? 'white' : props.theme.colors.text};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .message-text {
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 4px;
  }

  .message-time {
    font-size: 11px;
    opacity: 0.7;
    text-align: right;
  }
`;

const DeleteMessageButton = styled(motion.button)`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #EF4444;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  flex-shrink: 0;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: #DC2626;
  }
`;

const ChatModalInput = styled.div`
  padding: 20px 24px;
  border-top: 2px solid #E8EFFF;
  background: white;
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ChatInputField = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #E8EFFF;
  border-radius: 12px;
  font-size: 14px;
  color: ${props => props.theme.colors.text};
  background: #F8FAFC;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #1e40af;
    background: white;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.textLight};
  }
`;

const ChatSendButton = styled(motion.button)`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);

  svg {
    width: 20px;
    height: 20px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ─── Wallet Verification Modal ─────────────────────────────
const WalletModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;
`;

const WalletModalContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  margin: auto;
  position: relative;
  z-index: 10000;
`;

const WalletModalIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;

  svg {
    width: 40px;
    height: 40px;
    color: #D97706;
  }
`;

const WalletModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  margin-bottom: 12px;
`;

const WalletModalMessage = styled.p`
  font-size: 15px;
  color: ${props => props.theme.colors.textLight};
  line-height: 1.6;
  margin-bottom: 32px;
`;

const WalletModalActions = styled.div`
  display: flex;
  gap: 12px;
`;

const WalletModalButton = styled(motion.button)`
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  background: ${props => props.$variant === 'primary' ? (props.disabled ? '#94A3B8' : '#1e40af') : '#F1F5F9'};
  color: ${props => props.$variant === 'primary' ? 'white' : props.theme.colors.text};
  border: 1.5px solid ${props => props.$variant === 'primary' ? (props.disabled ? '#94A3B8' : '#1e40af') : '#E2E8F0'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};

  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : (props.$variant === 'primary'
    ? '0 6px 20px rgba(30, 64, 175, 0.3)'
    : '0 4px 12px rgba(0, 0, 0, 0.1)')};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const TermsCheckboxContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
  text-align: left;
  
  input[type="checkbox"] {
    margin-top: 4px;
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #1e40af;
  }
  
  label {
    font-size: 14px;
    color: ${props => props.theme.colors.text};
    line-height: 1.6;
    cursor: pointer;
    user-select: none;
    
    a {
      color: #1e40af;
      font-weight: 600;
      text-decoration: underline;
      
      &:hover {
        color: #1e3a8a;
      }
    }
  }
`;

// ─── Inline Terms Box ─────────────────────────────────────
const InlineTermsBox = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border: 1.5px solid ${props => props.theme.colors.border};
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
`;

const InlineTermsHeader = styled.div`
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  padding: 16px 22px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-size: 15px;
  font-weight: 800;
  svg { width: 18px; height: 18px; flex-shrink: 0; }
`;

const InlineTermsScrollArea = styled.div`
  max-height: 280px;
  overflow-y: auto;
  padding: 20px 22px;
  font-size: 13px;
  line-height: 1.75;
  color: ${props => props.theme.colors.textLight};

  h4 {
    font-size: 13px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin: 14px 0 6px;
  }
  ul {
    padding-left: 18px;
    margin: 4px 0 10px;
    li { margin-bottom: 3px; }
  }
  .highlight {
    background: #eff6ff;
    border-left: 3px solid #1e40af;
    border-radius: 0 8px 8px 0;
    padding: 10px 14px;
    margin: 10px 0;
    color: #1e40af;
    font-weight: 500;
    font-size: 13px;
  }
`;

const InlineTermsFooter = styled.div`
  padding: 14px 22px 18px;
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  gap: 12px;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #1e40af;
    flex-shrink: 0;
    margin-top: 1px;
  }
  label {
    font-size: 13.5px;
    color: ${props => props.theme.colors.text};
    line-height: 1.55;
    cursor: pointer;
    font-weight: 500;
    a {
      color: #1e40af;
      font-weight: 700;
      text-decoration: underline;
      &:hover { color: #1e3a8a; }
    }
  }
`;

// ─── Delete Confirmation Modal ─────────────────────────────
const DeleteModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;
`;

const DeleteModalContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  margin: auto;
  position: relative;
  z-index: 10000;
`;

const DeleteModalIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;

  svg {
    width: 40px;
    height: 40px;
    color: #EF4444;
  }
`;

const DeleteModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  margin-bottom: 12px;
`;

const DeleteModalMessage = styled.p`
  font-size: 15px;
  color: ${props => props.theme.colors.textLight};
  line-height: 1.6;
  margin-bottom: 8px;
`;

const DeleteModalJobTitle = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  background: #F8FAFC;
  padding: 12px 16px;
  border-radius: 12px;
  margin: 16px 0 24px;
  border: 2px solid #E2E8F0;
`;

const DeleteModalActions = styled.div`
  display: flex;
  gap: 12px;
`;

const DeleteModalButton = styled(motion.button)`
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid;

  ${props => props.$variant === 'danger' ? `
    background: #EF4444;
    color: white;
    border-color: #EF4444;
    &:hover:not(:disabled) {
      background: #DC2626;
      border-color: #DC2626;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
    }
  ` : `
    background: white;
    color: ${props.theme.colors.text};
    border-color: #E2E8F0;
    &:hover:not(:disabled) {
      background: #F8FAFC;
      border-color: #CBD5E1;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ─── Confirm Complete Modal ───────────────────────────────
const RateModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const RateModalContent = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
`;

const RateModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 2px solid ${props => props.theme.colors.border};
  h2 {
    font-size: 18px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    display: flex;
    align-items: center;
    gap: 10px;
    svg { width: 24px; height: 24px; color: ${props => props.theme.colors.primary}; }
  }
  button {
    width: 36px; height: 36px; border-radius: 50%;
    border: none;
    background: ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.textLight};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s;
    &:hover { background: ${props => props.theme.colors.error}15; color: ${props => props.theme.colors.error}; }
  }
`;

const RateModalBody = styled.div`
  padding: 20px 24px;
`;

const RateCategory = styled.div`
  margin-bottom: 12px;
  .category-label {
    font-size: 13px; font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
    display: flex; align-items: center; gap: 8px;
    svg { width: 16px; height: 16px; color: ${props => props.theme.colors.primary}; }
  }
`;

const RateStarRow = styled.div`
  display: flex;
  gap: 6px;
`;

const RateStarButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  transition: transform 0.2s;
  &:hover { transform: scale(1.2); }
  svg {
    width: 24px; height: 24px;
    fill: ${props => props.$active ? '#F59E0B' : 'transparent'};
    stroke: ${props => props.$active ? '#F59E0B' : props.theme.colors.textLight + '60'};
    stroke-width: 2;
    transition: all 0.2s;
  }
`;

const RateTextArea = styled.textarea`
  width: 100%;
  min-height: 70px;
  padding: 10px 14px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 14px;
  font-family: inherit;
  color: ${props => props.theme.colors.text};
  background: ${props => props.theme.colors.bgLight};
  resize: vertical;
  transition: border-color 0.3s;
  box-sizing: border-box;
  &:focus { outline: none; border-color: ${props => props.theme.colors.primary}; }
  &::placeholder { color: ${props => props.theme.colors.textLight}80; }
`;

const RateActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 2px solid ${props => props.theme.colors.border};
`;

const RateActionButton = styled(motion.button)`
  flex: 1;
  padding: 12px 18px;
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 14px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  background: ${props => props.theme.colors.primary};
  color: white;
  opacity: ${props => props.disabled ? 0.5 : 1};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primary}dd;
    box-shadow: 0 8px 20px ${props => props.theme.colors.primary}40;
  }
  svg { width: 18px; height: 18px; }
`;

// ─── Confirm Complete Modal ───────────────────────────────
const ConfirmCompleteOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const ConfirmCompleteContainer = styled(motion.div)`
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 440px;
  padding: 36px 32px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(16,185,129,0.1);
  text-align: center;
  position: relative;
  z-index: 10000;
`;

const ConfirmCompleteIcon = styled.div`
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  svg {
    width: 44px;
    height: 44px;
    color: #059669;
  }
`;

const ConfirmCompleteTitle = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 10px;
`;

const ConfirmCompleteMessage = styled.p`
  font-size: 14px;
  color: #6B7280;
  line-height: 1.65;
  margin-bottom: 8px;
`;

const ConfirmCompleteStaffName = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: #065F46;
  background: linear-gradient(135deg, #ECFDF5, #D1FAE5);
  padding: 12px 16px;
  border-radius: 12px;
  margin: 16px 0 24px;
  border: 2px solid #A7F3D0;
`;

const ConfirmCompleteActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ConfirmCompleteButton = styled(motion.button)`
  flex: 1;
  padding: 13px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border: 2px solid;
  transition: all 0.2s ease;
  ${props => props.$variant === 'success' ? `
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    color: white;
    border-color: #059669;
    &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16,185,129,0.35); }
  ` : `
    background: white;
    color: #374151;
    border-color: #E5E7EB;
    &:hover { background: #F9FAFB; border-color: #D1D5DB; }
  `}
  svg { width: 18px; height: 18px; }
`;

const CompleteSuccessToast = styled(motion.div)`
  position: fixed;
  top: 24px;
  right: 24px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  padding: 14px 20px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.4);
  font-weight: 700;
  font-size: 14px;
  z-index: 10001;
  svg { width: 20px; height: 20px; flex-shrink: 0; }
`;

// ─── Success Toast ─────────────────────────────────────────
const SuccessToast = styled(motion.div)`
  position: fixed;
  top: 24px;
  right: 24px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
  z-index: 1002;
  font-weight: 600;
  font-size: 15px;

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

const ErrorNotification = styled(motion.div)`
  position: fixed;
  top: 24px;
  right: 24px;
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  color: white;
  padding: 18px 28px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 10px 40px rgba(239, 68, 68, 0.4);
  z-index: 10000;
  font-weight: 600;
  font-size: 15px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  max-width: 400px;

  svg {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }
  
  .error-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .error-title {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    
    .error-message {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.95;
      line-height: 1.4;
    }
  }
`;

// ─── Profile Modal Styled Components ───────────────────────
const ProfileHeader = styled.div`
  position: relative;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 45%, #1e40af 100%);
  padding: 36px 36px 48px;
  color: white;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -60px;
    width: 220px;
    height: 220px;
    background: radial-gradient(circle, rgba(96, 165, 250, 0.25) 0%, transparent 70%);
    border-radius: 50%;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -40px;
    left: 30%;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
    border-radius: 50%;
  }
`;

const ProfileAvatarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 1;
`;

const ProfileAvatar = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%);
  border: 2.5px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: white;
  letter-spacing: -1px;
  backdrop-filter: blur(8px);
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3);
`;

const ProfileHeaderInfo = styled.div`
  h2 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
  }
`;

const ProfileJobBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  
  svg {
    width: 14px;
    height: 14px;
    opacity: 0.8;
  }
`;

const HeaderRatingBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  padding: 5px 14px;
  background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(252,211,77,0.18));
  border: 1.5px solid rgba(252, 211, 77, 0.5);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  color: #FDE68A;
  backdrop-filter: blur(4px);
  
  .stars {
    display: flex;
    gap: 2px;
    align-items: center;
  }
  
  .star-char {
    font-size: 13px;
    line-height: 1;
  }
  
  .rating-text {
    margin-left: 2px;
    font-size: 13px;
    font-weight: 700;
  }
  
  .count-text {
    font-size: 11px;
    font-weight: 500;
    opacity: 0.8;
  }
`;

const ProfileContent = styled.div`
  padding: 0;
  margin-top: -16px;
  position: relative;
  z-index: 2;
`;

const ProfileInner = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: 16px 16px 0 0;
  padding: 28px 28px 8px;
`;

const ProfileSection = styled.div`
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  
  h3 {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 14px;
    color: ${props => props.theme.colors.textLight};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: ${props => props.theme.colors.border};
    }
    
    svg {
      width: 14px;
      height: 14px;
      color: ${props => props.theme.colors.primary};
    }
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

const InfoCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.border};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary}30;
    background: #EFF6FF;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.08);
  }
`;

const InfoIconBox = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1e40af15, #3b82f620);
  border: 1px solid ${props => props.theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.theme.colors.primary};
  }
`;

const InfoItem = styled.div`
  flex: 1;
  min-width: 0;
  
  .label {
    font-size: 11px;
    font-weight: 600;
    color: ${props => props.theme.colors.textLight};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }
  
  .value {
    font-size: 14px;
    color: ${props => props.theme.colors.text};
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const SkillsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const SkillTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 7px 16px;
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  color: #1e40af;
  border: 1.5px solid #BFDBFE;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
    color: white;
    border-color: #1e40af;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
  }
`;

const BioText = styled.p`
  font-size: 14px;
  line-height: 1.7;
  color: ${props => props.theme.colors.textLight};
  background: ${props => props.theme.colors.bgDark};
  border-radius: 12px;
  padding: 16px;
  border: 1px solid ${props => props.theme.colors.border};
  border-left: 3px solid #1e40af;
  margin: 0;
`;

const HiddenInfo = styled.div`
  font-size: 14px;
  color: #94a3b8;
  font-weight: 600;
  letter-spacing: 2px;
`;

const WorkScheduleCard = styled.div`
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border: 2px solid #BFDBFE;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ScheduleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  
  svg {
    width: 18px;
    height: 18px;
    color: #1e40af;
    flex-shrink: 0;
  }
  
  .label {
    font-weight: 600;
    color: #1e40af;
    min-width: 120px;
  }
  
  .value {
    color: #1e293b;
    font-weight: 700;
  }
`;

const ChatButton = styled(motion.button)`
  width: 100%;
  padding: 14px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    transform: translateY(-1px);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const WorkingStatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  border: 2px solid #6EE7B7;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;
  color: #065F46;
`;

const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ReviewCard = styled.div`
  background: ${props => props.theme.colors.bgDark};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 14px;
  padding: 16px 18px;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(30, 64, 175, 0.09);
    border-color: #BFDBFE;
  }
`;

const ReviewHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 12px;
`;

const ReviewEmployerInfo = styled.div`
  .employer-name {
    font-size: 14px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 2px;
  }
  .position-date {
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const StarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
`;

const StarIcon = styled.span`
  font-size: 16px;
  line-height: 1;
  color: ${props => props.$filled ? '#F59E0B' : '#E2E8F0'};
  filter: ${props => props.$filled ? 'drop-shadow(0 1px 2px rgba(245,158,11,0.4))' : 'none'};
`;

const RatingLabel = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #F59E0B;
  margin-left: 4px;
`;

const ReviewComment = styled.p`
  font-size: 13px;
  line-height: 1.6;
  color: ${props => props.theme.colors.textLight};
  margin: 0;
  font-style: italic;
`;

const EmptyReviews = styled.div`
  text-align: center;
  padding: 28px 16px;
  color: ${props => props.theme.colors.textLight};
  background: ${props => props.theme.colors.bgDark};
  border-radius: 12px;
  border: 1.5px dashed ${props => props.theme.colors.border};
  
  .icon { font-size: 28px; margin-bottom: 8px; }
  p { font-size: 13px; margin: 0; }
`;

// Star rendering helper
const StarRating = ({ rating }) => (
  <StarRow>
    {[1, 2, 3, 4, 5].map(i => (
      <StarIcon key={i} $filled={i <= rating}>★</StarIcon>
    ))}
    <RatingLabel>{rating}/5</RatingLabel>
  </StarRow>
);

// Profile Detail Modal Component
const StaffProfileModal = React.memo(({ staff, onClose }) => {
  const { language } = useLanguage();
  const initials = staff.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const avgRating = staff.reviews && staff.reviews.length > 0
    ? (staff.reviews.reduce((s, r) => s + r.rating, 0) / staff.reviews.length)
    : null;

  return (
    <>
      <ProfileHeader>
        <ProfileAvatarRow>
          <ProfileAvatar>{initials}</ProfileAvatar>
          <ProfileHeaderInfo>
            <h2>{staff.name}</h2>
            <ProfileJobBadge>
              <Briefcase />
              {language === 'vi' ? 'Vị trí:' : 'Position:'} {staff.position}
            </ProfileJobBadge>
            {avgRating !== null && (
              <HeaderRatingBadge>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} className="star-char" style={{ color: i <= Math.round(avgRating) ? '#FCD34D' : 'rgba(255,255,255,0.25)' }}>★</span>
                  ))}
                </div>
                <span className="rating-text">{avgRating.toFixed(1)}/5</span>
                <span className="count-text">({staff.reviews.length} {language === 'vi' ? 'đánh giá' : 'reviews'})</span>
              </HeaderRatingBadge>
            )}
          </ProfileHeaderInfo>
        </ProfileAvatarRow>
      </ProfileHeader>

      <ProfileContent>
        <ProfileInner>
          <ProfileSection>
            <h3><FileText /> {language === 'vi' ? 'Thông tin công việc' : 'Work Information'}</h3>
            <InfoGrid>
              <InfoCard>
                <InfoIconBox><MapPin /></InfoIconBox>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Địa điểm' : 'Location'}</div>
                  <div className="value">{staff.location}</div>
                </InfoItem>
              </InfoCard>
              <InfoCard>
                <InfoIconBox><Calendar /></InfoIconBox>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Ngày làm' : 'Work Date'}</div>
                  <div className="value">{staff.startDate}</div>
                </InfoItem>
              </InfoCard>
              <InfoCard>
                <InfoIconBox><Clock /></InfoIconBox>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Giờ làm' : 'Work Hours'}</div>
                  <div className="value">{staff.shift}</div>
                </InfoItem>
              </InfoCard>
              <InfoCard>
                <InfoIconBox><CheckCircle /></InfoIconBox>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Giờ xác nhận' : 'Confirmed At'}</div>
                  <div className="value">{staff.confirmedAt}</div>
                </InfoItem>
              </InfoCard>
              <InfoCard>
                <InfoIconBox><Briefcase /></InfoIconBox>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Vị trí' : 'Position'}</div>
                  <div className="value">{staff.position}</div>
                </InfoItem>
              </InfoCard>
              <InfoCard style={{ background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', borderColor: '#10B981' }}>
                <InfoIconBox style={{ background: '#10B981' }}><Banknote style={{ color: 'white' }} /></InfoIconBox>
                <InfoItem>
                  <div className="label" style={{ color: '#065F46' }}>{language === 'vi' ? 'Số tiền chi' : 'Amount Paid'}</div>
                  <div className="value" style={{ color: '#047857', fontWeight: '700', fontSize: '16px' }}>
                    {staff.totalPaid ? `${staff.totalPaid.toLocaleString('vi-VN')} VNĐ` : 'N/A'}
                  </div>
                </InfoItem>
              </InfoCard>
            </InfoGrid>
          </ProfileSection>
        </ProfileInner>
      </ProfileContent>
    </>
  );
});

const RecommendationModalHeader = styled.div`
  background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%);
  padding: 28px 24px;
  color: white;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -30px;
    right: -30px;
    width: 140px;
    height: 140px;
    background: radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, transparent 70%);
    border-radius: 50%;
  }

  h2 {
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
    display: flex;
    align-items: center;
    gap: 10px;

    svg {
      width: 24px;
      height: 24px;
    }
  }

  p {
    font-size: 13.5px;
    color: rgba(255, 255, 255, 0.85);
    font-weight: 500;
  }
`;

const RecommendationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  max-height: 550px;
  overflow-y: auto;
`;

const RecommendationCard = styled(motion.div)`
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.04);
  transition: all 0.25s ease;

  &:hover {
    border-color: #a78bfa;
    box-shadow: 0 10px 24px rgba(124, 58, 237, 0.1);
    transform: translateY(-2px);
  }
`;

const RecommendationCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const RecommendationCandidateName = styled.h4`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

const MatchScoreBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 100px;
  font-size: 13.5px;
  font-weight: 800;
  
  background: ${props => {
    if (props.$score >= 80) return '#d1fae5';
    if (props.$score >= 65) return '#fef3c7';
    return '#f3f4f6';
  }};
  
  color: ${props => {
    if (props.$score >= 80) return '#065f46';
    if (props.$score >= 65) return '#92400e';
    return '#374151';
  }};

  border: 1.5px solid ${props => {
    if (props.$score >= 80) return '#34d399';
    if (props.$score >= 65) return '#fbbf24';
    return '#d1d5db';
  }};
`;

const ScoreProgressContainer = styled.div`
  width: 100%;
  height: 6px;
  background: #f1f5f9;
  border-radius: 100px;
  overflow: hidden;
  position: relative;
`;

const ScoreProgressBar = styled.div`
  height: 100%;
  width: ${props => props.$width}%;
  background: ${props => {
    if (props.$score >= 80) return 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
    if (props.$score >= 65) return 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)';
    return 'linear-gradient(90deg, #6b7280 0%, #9ca3af 100%)';
  }};
  border-radius: 100px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
`;

const RecommendationReason = styled.p`
  font-size: 13.5px;
  line-height: 1.6;
  color: #475569;
  margin: 0;
  background: #f8fafc;
  padding: 14px 16px;
  border-radius: 12px;
  border-left: 4px solid #7c3aed;
`;

const RecommendationsLoadingContainer = styled.div`
  padding: 60px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const PulseAILogo = styled(motion.div)`
  width: 72px;
  height: 72px;
  border-radius: 24px;
  background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 32px rgba(124, 58, 237, 0.35);
  color: white;

  svg {
    width: 36px;
    height: 36px;
  }
`;

const LoadingText = styled.p`
  font-size: 15px;
  font-weight: 600;
  color: #475569;
  margin: 0;
`;

const WorkHistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const WorkHistoryCard = styled.div`
  background: ${props => props.theme.colors.bgDark};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 14px;
  padding: 16px 18px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(30, 64, 175, 0.09);
    border-color: #BFDBFE;
  }
`;

const WorkHistoryHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const WorkHistoryInfo = styled.div`
  .job-title {
    font-size: 14.5px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 2px;
  }
  .company-date {
    font-size: 12.5px;
    color: ${props => props.theme.colors.textLight};
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
  }
`;

const EmptyWorkHistory = styled.div`
  text-align: center;
  padding: 28px 16px;
  color: ${props => props.theme.colors.textLight};
  background: ${props => props.theme.colors.bgDark};
  border-radius: 12px;
  border: 1.5px dashed ${props => props.theme.colors.border};
  
  .icon { font-size: 28px; margin-bottom: 8px; }
  p { font-size: 13px; margin: 0; }
`;

// ─── Component ─────────────────────────────────────────────
const HRManagement = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(() => {
    const saved = sessionStorage.getItem('employer_hr_active_section');
    return saved !== null ? saved : 'posts';
  }); // Default to 'posts' (Quản lý bài đăng)
  const [hrStaff, setHrStaff] = useState(() => getHRStaff(language).map(s => ({ ...s, rated: false, pendingRating: false })));
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [recommendingJob, setRecommendingJob] = useState(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [requestSending, setRequestSending] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [viewedChangeRequest, setViewedChangeRequest] = useState(null);
  const [isProcessingChange, setIsProcessingChange] = useState(false);

  const handleViewProfile = useCallback(async (app) => {
    // Set basic info from application immediately
    setSelectedCandidate(app);

    // Then try to fetch full profile
    if (app.candidateId) {
      setIsFetchingProfile(true);
      try {
        const [prof, candidateApps, approvedExperiences] = await Promise.all([
          candidateProfileService.getProfile(app.candidateId),
          applicationService.getCandidateApplications(app.candidateId).catch(() => []),
          experienceService.getCandidateApprovedExperiences(app.candidateId).catch(() => [])
        ]);

        // Only fetch job details for completed applications (work history)
        const completedApps = candidateApps.filter(a => a.status === 'completed' || a.status === 'completed_pending_candidate');
        const neededJobIds = [...new Set(completedApps.map(a => a.jobId).filter(Boolean))];
        
        let finalAllJobs = [];
        if (neededJobIds.length > 0) {
          // Batch requests (max 3 concurrent) to avoid Lambda throttling
          for (let i = 0; i < neededJobIds.length; i += 3) {
            const batch = neededJobIds.slice(i, i + 3);
            const batchResults = await Promise.all(batch.map(async (id) => {
              try {
                if (/^\d+$/.test(id)) return null;
                if (id.startsWith('QJOB-')) {
                  return await quickJobService.getQuickJob(id).catch(() => null);
                }
                return await jobPostService.getJobPost(id).catch(() => null);
              } catch (e) {
                return null;
              }
            }));
            finalAllJobs.push(...batchResults.filter(Boolean));
          }
        }

        // Detailed work history (completed applications)
        const workHistory = candidateApps
          .filter(a => a.status === 'completed' || a.status === 'completed_pending_candidate')
          .map(a => {
            const j = finalAllJobs.find(x => (x.idJob || x.id || x.jobID) === a.jobId);
            return {
              id: a.applicationId || a.id,
              jobTitle: j?.title || a.jobTitle || '---',
              companyName: j?.employerName || j?.companyName || a.employerName || a.companyName || '---',
              completedAt: a.updatedAt || a.appliedAt || a.createdAt,
              employerRating: a.employerRating || null
            };
          })
          .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));

        // Reviews list
        const reviews = candidateApps
          .filter(a => a.employerRating && typeof a.employerRating.overall === 'number')
          .map(a => {
            const j = finalAllJobs.find(x => (x.idJob || x.id || x.jobID) === a.jobId);
            return {
              rating: a.employerRating.overall,
              comment: a.employerRating.comment || '',
              employerName: j?.employerName || j?.companyName || a.employerName || a.companyName || '---',
              position: j?.title || a.jobTitle || '---',
              date: new Date(a.employerConfirmedAt || a.updatedAt || a.appliedAt).toLocaleDateString('vi-VN')
            };
          });

        const experienceSummary = prof?.experience?.trim()
          ? prof.experience
          : approvedExperiences.length > 0
            ? approvedExperiences
                .slice(0, 3)
                .map(exp => {
                  const role = exp.jobTitle || 'Kinh nghiệm';
                  const company = exp.companyName ? ` tại ${exp.companyName}` : '';
                  const period = exp.isCurrent
                    ? ' (Hiện tại)'
                    : (exp.startMonth && exp.startYear)
                      ? ` (${exp.startMonth}/${exp.startYear}${exp.endMonth && exp.endYear ? ` - ${exp.endMonth}/${exp.endYear}` : ''})`
                      : '';
                  return `${role}${company}${period}`;
                })
                .join('; ')
            : (app.experience || '');

        if (prof) {
          // Merge profile info into selectedCandidate
          setSelectedCandidate(prevState => {
            if (!prevState) return prevState;
            return {
              ...prevState,
              ...prof,
              // Keep app-specific fields
              candidate: prof.fullName || prevState.candidate,
              phone: prof.phone || prevState.phone,
              location: prof.location || prevState.location,
              education: prof.education || prevState.education,
              experience: experienceSummary,
              skills: prof.skills || prevState.skills,
              bio: prof.bio || prevState.bio,
              profileImage: prof.profileImage || prevState.profileImage,
              cvUrl: prevState.cvUrl || prof.cvUrl,
              cvFileName: prevState.cvFileName || prof.cvFileName,
              workHistory,
              reviews
            };
          });
        } else {
          setSelectedCandidate(prevState => {
            if (!prevState) return prevState;
            return {
              ...prevState,
              workHistory,
              reviews
            };
          });
        }
      } catch (error) {
        // Profile fetch failed silently - basic info already shown
      } finally {
        setIsFetchingProfile(false);
      }
    }
  }, []);

  const handleCloseProfile = useCallback(() => {
    setSelectedCandidate(null);
    setIsFetchingProfile(false);
  }, []);

  // Persist active section to sessionStorage on change

  useEffect(() => {
    sessionStorage.setItem('employer_hr_active_section', activeSection);
  }, [activeSection]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const data = await employerProfileService.getMyProfile();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching employer profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleRequestActivation = async () => {
    try {
      setRequestSending(true);
      const updated = await employerProfileService.updateProfile({
        quickJobStatus: 'pending'
      });
      setProfile(updated);

      // Send notification to Admin
      try {
        const empId = updated?.userId || updated?.id || user?.userId || user?.id || user?.email || null;
        const compName = updated?.companyName || user?.companyName || user?.name || 'Nhà tuyển dụng';
        if (empId) {
          await createQuickJobActivationRequestNotification({
            employerId: empId,
            companyName: compName
          });
          console.log('✅ Notification sent to Admin for quick job activation request');
        }
      } catch (notifyErr) {
        console.error('❌ Error sending quick job activation notification to admin:', notifyErr);
      }

      setSuccessToastMessage(language === 'vi' ? 'Gửi yêu cầu thành công! Chúng tôi sẽ liên hệ sớm nhất.' : 'Request sent successfully! We will contact you soon.');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    } catch (err) {
      console.error('Error requesting quick jobs activation:', err);
      alert(language === 'vi' ? 'Không thể gửi yêu cầu, vui lòng thử lại sau.' : 'Failed to send request, please try again later.');
    } finally {
      setRequestSending(false);
    }
  };

  const handleCancelRequest = () => {
    setShowCancelConfirmModal(true);
  };

  const executeCancelRequest = async () => {
    try {
      setRequestSending(true);
      const updated = await employerProfileService.updateProfile({
        quickJobStatus: 'not_requested'
      });
      setProfile(updated);
      setShowCancelConfirmModal(false);
      setSuccessToastMessage(language === 'vi' ? 'Hủy yêu cầu thành công!' : 'Request cancelled successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    } catch (err) {
      console.error('Error cancelling quick jobs request:', err);
      alert(language === 'vi' ? 'Không thể hủy yêu cầu, vui lòng thử lại sau.' : 'Failed to cancel request, please try again later.');
    } finally {
      setRequestSending(false);
    }
  };


  // Auto-switch to HR/applications tab when coming from notifications or Navbar chat
  useEffect(() => {
    if (location.state?.fromNotifications || location.state?.activeSection === 'hr') {
      setActiveSection('hr');

      if (location.state?.staffTab) {
        setStaffTabFilter(location.state.staffTab);
      } else if (location.state?.fromNotifications) {
        setStaffTabFilter('pending_confirm');
      }

      // Handle automatic chat opening
      if (location.state?.activeApplicationId) {
        handleOpenChat(location.state.activeApplicationId);
      }

      // Clear state to prevent reopening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Helper function to check if more than 1 hour has passed
  const hasPassedOneHourSinceConfirmed = (confirmedAt) => {
    if (!confirmedAt) return false;
    try {
      const [datePart, timePart] = confirmedAt.split(' - ');
      const dateParts = datePart.split('/');
      let day, month, year;

      if (language === 'vi') {
        [day, month, year] = dateParts;
      } else {
        [month, day, year] = dateParts;
      }

      const [hours, minutes] = timePart.split(':');
      const confirmedTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
      const now = new Date();
      const oneHourInMs = 60 * 60 * 1000;
      const timeDifference = now - confirmedTime;
      const hasPassed = timeDifference > oneHourInMs;

      console.log('⏰ Checking time:', {
        confirmedAt,
        confirmedTime: confirmedTime.toLocaleString(),
        now: now.toLocaleString(),
        timeDifferenceInMinutes: Math.floor(timeDifference / 60000),
        hasPassed1Hour: hasPassed
      });

      return hasPassed;
    } catch (e) {
      console.error('Error parsing time:', e);
      return false;
    }
  };

  // Helper function to check if currently working
  const isCurrentlyWorking = (shift) => {
    if (!shift) return false;
    try {
      const [startTime, endTime] = shift.split(' - ');
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const now = new Date();
      const nowHour = now.getHours();
      const nowMin = now.getMinutes();
      const nowTimeInMin = nowHour * 60 + nowMin;
      const startTimeInMin = startHour * 60 + startMin;
      const endTimeInMin = endHour * 60 + endMin;

      const isWorking = nowTimeInMin >= startTimeInMin && nowTimeInMin <= endTimeInMin;

      console.log('🕐 Checking working status:', {
        shift,
        currentTime: `${nowHour}:${nowMin}`,
        nowTimeInMin,
        startTimeInMin,
        endTimeInMin,
        isWorking
      });

      return isWorking;
    } catch (e) {
      console.error('Error checking working hours:', e);
      return false;
    }
  };

  const handleChatWithStaff = (staff) => {
    // Open chat modal with applicationId
    handleOpenChat(staff.applicationId);
  };

  // Load quick jobs from DynamoDB
  const [quickJobPosts, setQuickJobPosts] = useState([]);
  const [allQuickJobs, setAllQuickJobs] = useState([]); // All jobs including closed (for HR section)
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Load applications from Quick Jobs
  const [realApplications, setRealApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [changeRequestStatusOverrides, setChangeRequestStatusOverrides] = useState({});
  const changeRequestStatusOverridesRef = useRef({});

  const setChangeRequestStatusOverridesSync = (updater) => {
    setChangeRequestStatusOverrides(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      changeRequestStatusOverridesRef.current = next;
      return next;
    });
  };

  // Load jobs from DynamoDB on mount
  useEffect(() => {
    loadQuickJobsFromDynamoDB();
  }, []);

  // Load applications when switching to HR section
  useEffect(() => {
    if (activeSection === 'hr' && allQuickJobs.length > 0) {
      loadApplicationsFromQuickJobs();
    }
  }, [activeSection, allQuickJobs]);

  const loadQuickJobsFromDynamoDB = async () => {
    try {
      setLoadingJobs(true);
      console.log('📥 Loading quick jobs from DynamoDB...');

      const jobs = await quickJobService.getMyQuickJobs();
      console.log('✅ Loaded jobs:', jobs);

      // Format jobs for display
      const formattedJobs = jobs.map(job => ({
        id: job.id || job.idJob || job.jobID,
        idJob: job.idJob || job.jobID,
        title: job.title,
        location: job.location,
        hourlyRate: job.hourlyRate,
        startTime: job.startTime,
        endTime: job.endTime,
        totalHours: job.totalHours,
        workDate: job.workDate || '', // Map workDate from DB
        jobType: job.jobType || 'part-time',
        salary: (() => {
          if (job.hourlyRate && job.totalHours) {
            const total = Math.round(parseInt(job.hourlyRate) * job.totalHours);
            const h = Number.isInteger(job.totalHours) ? job.totalHours : parseFloat(job.totalHours.toFixed(1));
            return `${total.toLocaleString('vi-VN')} VNĐ/${h}h`;
          }
          if (job.hourlyRate) {
            return `${parseInt(job.hourlyRate).toLocaleString('vi-VN')} VNĐ/giờ`;
          }
          return language === 'vi' ? 'Thỏa thuận' : 'Negotiable';
        })(),
        shift: job.workHours || (job.startTime && job.endTime ? `${job.startTime} - ${job.endTime}` : ''),
        deadline: (() => {
          // Use workDate from database instead of calculating from createdAt
          if (job.workDate) {
            try {
              const workDateObj = new Date(job.workDate);
              const day = workDateObj.getDate().toString().padStart(2, '0');
              const month = (workDateObj.getMonth() + 1).toString().padStart(2, '0');
              const year = workDateObj.getFullYear();
              return language === 'vi' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
            } catch (e) {
              return job.workDate; // Return as-is if parsing fails
            }
          }
          return language === 'vi' ? 'Chưa xác định' : 'Not specified';
        })(),
        description: job.description,
        requirements: job.requirements,
        customFields: Array.isArray(job.customFields) ? job.customFields : [],
        contactPhone: job.contactPhone,
        companyName: job.companyName,
        status: job.status,
        applicants: job.applicants || 0,
        views: job.views || 0,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }));

      // Auto-close expired quick jobs (workDate + endTime has passed)
      const now = new Date();
      const nowDateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      const nowTimeStr = now.toTimeString().slice(0, 5); // HH:MM format

      const expiredJobs = formattedJobs.filter(job => {
        if (job.status !== 'active' || !job.workDate) return false;
        const endTime = job.endTime || '23:59';
        // Expired if: workDate < today, OR workDate == today and endTime has passed
        return job.workDate < nowDateStr || (job.workDate === nowDateStr && endTime <= nowTimeStr);
      });

      if (expiredJobs.length > 0) {
        console.log(`⏰ Auto-closing ${expiredJobs.length} expired quick job(s)...`);
        for (const job of expiredJobs) {
          try {
            await quickJobService.updateJobStatus(job.idJob, 'closed');
            console.log(`✅ Auto-closed expired quick job: ${job.idJob} (${job.title})`);
          } catch (err) {
            console.error(`❌ Failed to auto-close quick job ${job.idJob}:`, err);
          }
        }
      }

      // Hide closed jobs from the post management list
      const visibleJobs = formattedJobs.filter(job => {
        if (job.status === 'closed') return false;
        // Also hide jobs we just detected as expired
        if (expiredJobs.some(ej => ej.idJob === job.idJob)) return false;
        return true;
      });

      // Keep all jobs (including closed) for HR section to load applications
      setAllQuickJobs(formattedJobs);
      setQuickJobPosts(visibleJobs);
    } catch (error) {
      console.error('❌ Error loading quick jobs:', error);
      setQuickJobPosts([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    const refreshJobs = () => {
      loadQuickJobsFromDynamoDB();
    };

    const handleFocus = () => {
      refreshJobs();
    };

    window.addEventListener('focus', handleFocus);
    const intervalId = setInterval(refreshJobs, 20000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, []);

  const loadApplicationsFromQuickJobs = async (statusOverrides = changeRequestStatusOverrides) => {
    try {
      setLoadingApplications(true);
      console.log('📥 Loading applications from Quick Jobs...');

      // applicationService is statically imported at the top of this file

      // Load applications for ALL quick jobs (including closed ones for HR management)
      const allApplications = [];
      const now = new Date();
      const nowDateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const nowTimeStr = now.toTimeString().slice(0, 5); // HH:MM

      for (const job of allQuickJobs) {
        try {
          const jobApplications = await applicationService.getJobApplications(job.idJob);

          // Check if this job has expired
          const endTime = job.endTime || '23:59';
          const workDate = job.workDate || '';
          const jobExpired = workDate && (workDate < nowDateStr || (workDate === nowDateStr && endTime <= nowTimeStr));

          const applicationsWithJobInfo = jobApplications.map(app => ({
            ...app,
            jobTitle: job.title,
            jobLocation: job.location,
            jobSalary: job.salary,
            jobShift: job.shift,
            jobWorkDate: job.workDate,
            companyName: job.companyName,
            jobType: 'quick',
            _jobExpired: jobExpired
          }));

          allApplications.push(...applicationsWithJobInfo);
        } catch (error) {
          console.error(`Error loading applications for job ${job.idJob}:`, error);
        }
      }

      // Auto-complete expired applications that are still active/accepted
      const expiredActiveApps = allApplications.filter(app =>
        app._jobExpired && (app.status === 'accepted' || app.status === 'pending')
      );

      if (expiredActiveApps.length > 0) {
        console.log(`⏰ Auto-completing ${expiredActiveApps.length} expired application(s)...`);
        for (const app of expiredActiveApps) {
          try {
            await applicationService.updateApplicationStatus(app.applicationId, 'completed');
            app.status = 'completed';
            console.log(`✅ Auto-completed expired application: ${app.applicationId}`);
          } catch (err) {
            console.error(`❌ Failed to auto-complete application ${app.applicationId}:`, err);
          }
        }
      }

      const mergedApplications = allApplications.map(app => {
        const overrideEntry = statusOverrides[String(app.applicationId)];
        const overrideStatus = typeof overrideEntry === 'string' ? overrideEntry : overrideEntry?.status;
        const overrideChangeReq = typeof overrideEntry === 'object' ? overrideEntry?.changeRequest : null;

        const serverChangeRequestStatus = String(
          app.changeRequestStatus ||
          app.change_request_status ||
          app.changeRequest?.status ||
          app.change_request?.status ||
          app.extraFields?.changeRequestStatus ||
          app.extraFields?.change_request_status ||
          ''
        ).toLowerCase();
        const isFinalizedChangeRequest = ['approved', 'rejected', 'cancelled'].includes(serverChangeRequestStatus);

        if (overrideStatus === 'pending_change' && overrideChangeReq) {
          return {
            ...app,
            status: 'pending_change',
            changeRequest: overrideChangeReq,
            change_request: overrideChangeReq,
          };
        }

        if (overrideStatus && ['approved', 'rejected', 'cancelled'].includes(String(overrideStatus).toLowerCase())) {
          return {
            ...app,
            status: 'accepted',
            changeRequest: null,
            change_request: null,
            changeRequestStatus: overrideStatus,
            change_request_status: overrideStatus,
          };
        }

        if (isFinalizedChangeRequest) {
          return {
            ...app,
            status: 'accepted',
            changeRequest: null,
            change_request: null,
            changeRequestStatus: serverChangeRequestStatus,
            change_request_status: serverChangeRequestStatus,
          };
        }

        return app;
      });

      console.log('✅ Loaded applications from DB:', mergedApplications);
      setRealApplications(mergedApplications);
    } catch (error) {
      console.error('❌ Error loading applications:', error);
      setRealApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  // Create chat conversations from accepted & completed staff
  const chatConversations = useMemo(() => {
    if (!realApplications || !Array.isArray(realApplications)) {
      return [];
    }

    return realApplications
      .filter(app => app.status === 'accepted' || app.status === 'completed_pending_candidate')
      .map(app => {
        let unread = 0;
        let lastMessageText = language === 'vi' ? 'Bắt đầu trò chuyện...' : 'Start conversation...';
        let lastMessageTime = '';

        const savedMessages = localStorage.getItem(`chat_${app.applicationId}`);
        if (savedMessages) {
          try {
            const msgs = JSON.parse(savedMessages);
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg) {
              lastMessageText = lastMsg.text;
              lastMessageTime = lastMsg.time;

              if (lastMsg.sender === 'them') { // sent by candidate
                const lastReadId = localStorage.getItem(`chat_read_employer_${app.applicationId}`);
                if (lastReadId !== String(lastMsg.id)) {
                  unread = 1;
                }
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        return {
          id: app.applicationId, // Use applicationId as chat ID
          name: app.candidateEmail || 'Ứng viên', // Use email as name for now
          role: language === 'vi' ? 'Nhân viên' : 'Staff',
          position: app.jobTitle || (language === 'vi' ? 'Vị trí' : 'Position'),
          status: 'online', // Default to online
          lastMessage: lastMessageText,
          time: lastMessageTime || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          unread: unread,
          isCompleted: app.status === 'completed',
          candidateId: app.candidateId,
          jobId: app.jobId
        };
      });
  }, [realApplications, language, changeRequestStatusOverrides]);

  const [activeChatId, setActiveChatId] = useState(null);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const chatMessagesEndRef = useRef(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastMessage, setSuccessToastMessage] = useState('');
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorNotificationMessage, setErrorNotificationMessage] = useState('');

  // Poll applications periodically when in 'hr' section to get new chat messages
  useEffect(() => {
    if (activeSection !== 'hr' || allQuickJobs.length === 0) return;

    const intervalId = setInterval(() => {
      console.log('🔄 Polling latest applications for chat sync...');
      loadApplicationsFromQuickJobs(changeRequestStatusOverridesRef.current);
    }, 10000); // refresh applications every 10s

    return () => clearInterval(intervalId);
  }, [activeSection, allQuickJobs]);

  // Sync DB chat messages to localStorage on realApplications update
  useEffect(() => {
    if (!realApplications || !Array.isArray(realApplications)) return;
    realApplications.forEach(app => {
      if (app.status === 'completed') {
        localStorage.removeItem(`chat_${app.applicationId}`);
        localStorage.removeItem(`chat_read_employer_${app.applicationId}`);
        localStorage.removeItem(`chat_read_${app.applicationId}`);
      } else if (app.chatMessages && Array.isArray(app.chatMessages) && app.chatMessages.length > 0) {
        const savedMessagesStr = localStorage.getItem(`chat_${app.applicationId}`);
        const dbStr = JSON.stringify(app.chatMessages);
        if (savedMessagesStr !== dbStr) {
          // DB has different content than local — DB is source of truth
          console.log(`[Employer Sync] Syncing chat messages from DB for ${app.applicationId}`);
          localStorage.setItem(`chat_${app.applicationId}`, dbStr);
          // If this is the active chat, trigger a change immediately
          if (activeChatId === app.applicationId) {
            setCurrentMessages(app.chatMessages);
          }
        }
      }
    });
  }, [realApplications, activeChatId]);

  const [confirmCompleteStaff, setConfirmCompleteStaff] = useState(null);
  const [showCompleteToast, setShowCompleteToast] = useState(false);
  const [completedStaffSummary, setCompletedStaffSummary] = useState(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateStaff, setRateStaff] = useState(null);
  const [ratings, setRatings] = useState({ overall: 0, attitude: 0, efficiency: 0, discipline: 0, skills: 0 });
  const [ratingHover, setRatingHover] = useState({ overall: 0, attitude: 0, efficiency: 0, discipline: 0, skills: 0 });
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showChangeRequestToast, setShowChangeRequestToast] = useState(false);
  const [changeRequestStaff, setChangeRequestStaff] = useState(null);
  const [changeRequestReason, setChangeRequestReason] = useState('');
  const [changeRequestType, setChangeRequestType] = useState('');
  const [staffTabFilter, setStaffTabFilter] = useState('working');
  const [showChangeRequestSuccess, setShowChangeRequestSuccess] = useState(false);
  const [selectedJobView, setSelectedJobView] = useState(null);
  const [editJobId, setEditJobId] = useState(null);
  const [editJobData, setEditJobData] = useState(null);
  const [showShiftEndedModal, setShowShiftEndedModal] = useState(false);
  const [shiftEndedShown, setShiftEndedShown] = useState(false);
  const [showCVPreview, setShowCVPreview] = useState(false);
  const [selectedCV, setSelectedCV] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectStaff, setRejectStaff] = useState(null);

  // Convert applications to staff format for display
  const staffFromApplications = useMemo(() => {
    // Get current time for additional expired guard
    const now = new Date();
    const nowDateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const nowTimeStr = now.toTimeString().slice(0, 5); // HH:MM

    return realApplications
      .filter(app => app.status === 'pending' || app.status === 'accepted' || app.status === 'pending_change') // Show pending, accepted and pending_change
      .filter(app => {
        // Guard: hide applications whose job has already expired
        let workDate = app.jobWorkDate || '';
        if (!workDate) return true; // No date info, keep showing

        // Normalize workDate to YYYY-MM-DD if it's in DD/MM/YYYY or MM/DD/YYYY format
        if (workDate.includes('/')) {
          const parts = workDate.split('/');
          if (parts.length === 3) {
            // Assume DD/MM/YYYY (Vietnamese format)
            const [d, m, y] = parts;
            if (y && y.length === 4) {
              workDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
          }
        }

        // Extract endTime from shift (e.g. "07:00 - 11:30")
        let endTime = '23:59';
        if (app.jobShift && app.jobShift.includes('-')) {
          const parts = app.jobShift.split('-').map(t => t.trim());
          if (parts[1]) endTime = parts[1];
        }
        // Expired if workDate < today, OR workDate == today and endTime passed
        if (workDate < nowDateStr || (workDate === nowDateStr && endTime <= nowTimeStr)) {
          return false;
        }
        return true;
      })
      .map(app => {
        // Calculate totalPaid from jobSalary
        let totalPaid = 0;
        let hourlyRate = 0;

        if (app.jobSalary) {
          // Parse salary: "224.400 VNĐ/8h" or "28.000 VNĐ/giờ"
          const salaryMatch = app.jobSalary.match(/([\d.]+)/);
          if (salaryMatch) {
            const salaryValue = parseInt(salaryMatch[1].replace(/\./g, ''));

            if (app.jobSalary.includes('/giờ') || app.jobSalary.includes('/hour')) {
              // Hourly rate: calculate from shift hours
              hourlyRate = salaryValue;

              // Parse shift hours: "09:00 - 17:00"
              if (app.jobShift && app.jobShift.includes('-')) {
                const [startTime, endTime] = app.jobShift.split('-').map(t => t.trim());
                const [startH, startM] = startTime.split(':').map(Number);
                const [endH, endM] = endTime.split(':').map(Number);

                let hours = (endH + endM / 60) - (startH + startM / 60);
                if (hours < 0) hours += 24; // overnight shift

                totalPaid = Math.round(hourlyRate * hours);
              }
            } else {
              // Total salary already calculated: "224.400 VNĐ/8h"
              totalPaid = salaryValue;

              // Extract hourly rate if format includes hours
              const hoursMatch = app.jobSalary.match(/\/([\d.]+)h/);
              if (hoursMatch) {
                const hours = parseFloat(hoursMatch[1]);
                hourlyRate = Math.round(totalPaid / hours);
              }
            }
          }
        }

        // Use acceptedAt if available (when status is accepted), otherwise use appliedAt
        const timeToUse = app.acceptedAt || app.appliedAt;

        // Format timestamp to readable format
        let formattedTime = timeToUse;
        if (timeToUse && !timeToUse.includes('/')) {
          // Only format if it's ISO timestamp (not already formatted)
          try {
            const date = new Date(timeToUse);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            formattedTime = language === 'vi'
              ? `${day}/${month}/${year} - ${hours}:${minutes}`
              : `${month}/${day}/${year} - ${hours}:${minutes}`;
          } catch (error) {
            console.error('Error formatting time:', error);
          }
        }

        const effectiveChangeRequest = app.changeRequest || app.change_request || null;
        const changeRequestStatus = app.changeRequestStatus || app.change_request_status || app.changeRequest?.status || app.change_request?.status || app.extraFields?.changeRequestStatus || app.extraFields?.change_request_status;
        const normalizedChangeRequestStatus = String(changeRequestStatus || '').toLowerCase();
        const isFinalizedChangeRequest = ['approved', 'rejected', 'cancelled'].includes(normalizedChangeRequestStatus);
        const hasPendingChangeRequest = Boolean(effectiveChangeRequest) && !isFinalizedChangeRequest;

        // Map status: pending -> pending_confirmation, pending_change only when the change request is still active.
        const mappedStatus = app.status === 'pending'
          ? 'pending_confirmation'
          : (app.status === 'pending_change' || hasPendingChangeRequest)
            ? 'pending_change'
            : 'active';

        // Calculate unread count for this application
        let unreadCount = 0;
        const savedMessages = localStorage.getItem(`chat_${app.applicationId}`);
        if (savedMessages) {
          try {
            const msgs = JSON.parse(savedMessages);
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.sender === 'them') { // sent by candidate
              const lastReadId = localStorage.getItem(`chat_read_employer_${app.applicationId}`);
              if (lastReadId !== String(lastMsg.id)) {
                unreadCount = 1;
              }
            }
          } catch (e) {
            console.error('Error parsing chat messages for unread count:', e);
          }
        }

        return {
          id: app.applicationId,
          applicationId: app.applicationId,
          name: app.candidateEmail?.split('@')[0] || 'Unknown', // Use email prefix as name
          position: app.jobTitle,
          companyName: app.companyName,
          location: app.jobLocation || 'N/A',
          phone: '***-***-****', // Hidden until confirmed
          email: '***@***.***', // Hidden until confirmed
          startDate: app.jobWorkDate || 'N/A',
          status: mappedStatus,
          shift: app.jobShift || 'N/A',
          hourlyRate: hourlyRate,
          confirmedAt: formattedTime,
          totalPaid: totalPaid,
          canRequestChange: false,
          isWithinTimeWindow: true,
          cvUrl: app.cvUrl,
          cvFilename: app.cvFilename || 'CV.pdf',
          candidateId: app.candidateId,
          candidateEmail: app.candidateEmail,
          jobId: app.jobId,
          changeRequest: hasPendingChangeRequest ? effectiveChangeRequest : null,
          unreadCount: unreadCount
        };
      });
  }, [realApplications, language]);

  // Combine mock staff with real applications
  const allStaff = useMemo(() => {
    // When real data exists, avoid mixing demo rows to prevent action/status confusion.
    if (staffFromApplications.length > 0) {
      return staffFromApplications;
    }
    return hrStaff;
  }, [hrStaff, staffFromApplications]);

  const staffTabCounts = useMemo(() => {
    const counts = {
      working: 0,
      pending_confirm: 0,
      pending_change: 0
    };

    allStaff.forEach(staff => {
      if (staff.status === 'active') counts.working += 1;
      if (staff.status === 'pending_confirmation') counts.pending_confirm += 1;
      if (staff.status === 'pending_change') counts.pending_change += 1;
    });

    return counts;
  }, [allStaff]);

  // Mock wallet connection status - in real app, get from user context or API
  const [isWalletConnected] = useState(() => {
    return localStorage.getItem('employer_wallet_connected') === 'true';
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [inlineAgreed, setInlineAgreed] = useState(false);

  // Reopen wallet modal when returning from terms page
  useEffect(() => {
    if (location.state?.fromTermsPage) {
      setShowWalletModal(true);
      // Clear the state to prevent reopening on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Check if all visible staff have been rated -> end shift (called from Done button)
  const checkAndEndShift = (updatedStaff) => {
    if (shiftEndedShown) return;
    const ratedStaff = updatedStaff.filter(s => s.rated);
    const stillPending = updatedStaff.filter(s => s.isWithinTimeWindow && !s.rated);
    if (ratedStaff.length > 0 && stillPending.length === 0) {
      setShowShiftEndedModal(true);
      setShiftEndedShown(true);
    }
  };

  const activeChat = activeChatId && chatConversations
    ? chatConversations.find(chat => chat.id === activeChatId)
    : null;

  // Load messages from localStorage when opening a chat
  useEffect(() => {
    if (activeChatId) {
      const savedMessages = localStorage.getItem(`chat_${activeChatId}`);
      let currentMsgs = [];
      if (savedMessages) {
        try {
          currentMsgs = JSON.parse(savedMessages);
          setCurrentMessages(currentMsgs);
        } catch (e) {
          console.error(e);
        }
      } else {
        const chat = chatConversations && chatConversations.find(c => c.id === activeChatId);
        if (chat?.isCompleted) {
          currentMsgs = [];
          setCurrentMessages(currentMsgs);
        } else if (chat) {
          // Add initial greeting message
          const companyName = user?.role === 'employer' ? (language === 'vi' ? 'Katinat Quận Cam' : 'Katinat District Cam') : (user?.name || 'Company');
          const greetingMessage = {
            id: Date.now(),
            sender: 'me',
            text: language === 'vi'
              ? `Xin chào! ${companyName} đã duyệt CV ứng tuyển công việc tuyển gấp của bạn. Bạn có thể liên hệ với chúng tôi qua đây nhé! 😊`
              : `Hello! ${companyName} has approved your urgent job application. You can contact us here! 😊`,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          };
          currentMsgs = [greetingMessage];
          setCurrentMessages(currentMsgs);
          localStorage.setItem(`chat_${activeChatId}`, JSON.stringify(currentMsgs));
        }
      }

      // Mark as read immediately on open
      const lastMsg = currentMsgs[currentMsgs.length - 1];
      if (lastMsg) {
        localStorage.setItem(`chat_read_employer_${activeChatId}`, String(lastMsg.id));
      }
    }
  }, [activeChatId, chatConversations, language, user]);

  // Sync active chat messages in real time for employer
  useEffect(() => {
    if (!activeChatId) return;

    const syncMessages = () => {
      const savedMessages = localStorage.getItem(`chat_${activeChatId}`);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setCurrentMessages(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
              // Mark as read when new messages are received while the chat is open
              const lastMsg = parsed[parsed.length - 1];
              if (lastMsg) {
                localStorage.setItem(`chat_read_employer_${activeChatId}`, String(lastMsg.id));
              }
              return parsed;
            }
            return prev;
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        setCurrentMessages([]);
      }
    };

    // Poll every 1 second
    const interval = setInterval(syncMessages, 1000);

    // Listen for storage events (updates from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === `chat_${activeChatId}`) {
        syncMessages();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeChatId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (activeChatId && currentMessages.length > 0) {
      localStorage.setItem(`chat_${activeChatId}`, JSON.stringify(currentMessages));
    }
  }, [currentMessages, activeChatId]);

  // Auto-scroll employer chat to bottom when messages update
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages, activeChatId]);

  const handleOpenChat = (chatId) => {
    setActiveChatId(chatId);

    // Mark as read immediately when opening
    const chatApp = realApplications.find(a => a.applicationId === chatId);
    if (chatApp && chatApp.chatMessages && chatApp.chatMessages.length > 0) {
      const lastMsg = chatApp.chatMessages[chatApp.chatMessages.length - 1];
      if (lastMsg) {
        localStorage.setItem(`chat_read_employer_${chatId}`, String(lastMsg.id));
        // Force re-calculation of staffFromApplications by updating realApplications
        setRealApplications(prev => [...prev]);
      }
    }
  };

  const handleCloseChat = () => {
    setActiveChatId(null);
    setCurrentMessages([]);
    setMessageInput('');
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeChatId || activeChat?.isCompleted) return;

    const newMessage = {
      id: Date.now(), // Use timestamp for unique ID
      sender: 'me',
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...currentMessages, newMessage];
    setCurrentMessages(updated);
    setMessageInput('');
    localStorage.setItem(`chat_${activeChatId}`, JSON.stringify(updated));
    localStorage.setItem(`chat_read_employer_${activeChatId}`, String(newMessage.id));

    // Sync to DynamoDB
    applicationService.updateApplicationStatus(
      activeChatId,
      activeChat?.isCompleted ? 'completed' : 'accepted',
      { chatMessages: updated }
    ).then(() => {
      // Send notification to candidate (DISABLED)
      /*
      if (activeChat?.candidateId) {
        const senderName = user?.companyName || user?.company || user?.name || 'Nhà tuyển dụng';
        createChatMessageNotification({
          recipientId: activeChat.candidateId,
          recipientRole: 'candidate',
          senderId: user?.userId || user?.id || 'employer',
          senderName: senderName,
          messageText: newMessage.text,
          applicationId: activeChatId,
          jobTitle: activeChat.position
        }).catch(err => console.error('Failed to send candidate message notification:', err));
      }
      */
    }).catch(err => console.error('Failed to sync employer message to DB:', err));
  };

  const handleDeleteMessage = (messageId) => {
    const updatedMessages = currentMessages.filter(msg => msg.id !== messageId);
    setCurrentMessages(updatedMessages);

    // Update localStorage after deletion
    if (activeChatId) {
      if (updatedMessages.length > 0) {
        localStorage.setItem(`chat_${activeChatId}`, JSON.stringify(updatedMessages));
      } else {
        localStorage.removeItem(`chat_${activeChatId}`);
      }

      // Sync deletion to DynamoDB
      applicationService.updateApplicationStatus(
        activeChatId,
        activeChat?.isCompleted ? 'completed' : 'accepted',
        { chatMessages: updatedMessages }
      ).catch(err => console.error('Failed to sync deletion to DB:', err));
    }
  };

  const handleConfirmCV = async (staffId) => {
    // Find the staff member to get applicationId
    const staff = allStaff.find(s => s.id === staffId);
    if (!staff || !staff.applicationId) {
      console.error('❌ Staff or applicationId not found');
      return;
    }

    try {
      // Update application status to 'accepted' via API
      await applicationService.updateApplicationStatus(staff.applicationId, 'accepted');

      // Update confirmedAt to current time in realApplications
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');

      const newConfirmedAt = language === 'vi'
        ? `${day}/${month}/${year} - ${hours}:${minutes}`
        : `${month}/${day}/${year} - ${hours}:${minutes}`;

      // Update realApplications with new confirmedAt
      setRealApplications(prev => prev.map(app =>
        app.applicationId === staff.applicationId
          ? { ...app, status: 'accepted', acceptedAt: newConfirmedAt }
          : app
      ));

      if (staff.candidateId) {
        try {
          const employerId = user?.userId || user?.id || user?.email || null;
          const rawCompanyName = staff.companyName || user?.companyName || user?.company || user?.name || '';
          const companyName = rawCompanyName && !rawCompanyName.includes('@') ? rawCompanyName : 'Nhà tuyển dụng';

          await createCandidateCvAcceptedNotification({
            candidateId: staff.candidateId,
            jobTitle: staff.position,
            companyName,
            jobId: staff.jobId,
            employerId
          });
        } catch (notifyError) {
          console.error('❌ Error sending candidate accepted notification:', notifyError);
        }
      }

      // Show success message
      console.log('✅ Application accepted successfully at:', newConfirmedAt);
    } catch (error) {
      console.error('❌ Error accepting application:', error);
    }
  };

  const handleApproveChange = (staffId) => {
    setHrStaff(prev => prev.map(s => {
      if (s.id !== staffId) return s;
      const newShift = s.changeRequest?.to || s.shift;
      return { ...s, status: 'active', shift: newShift, changeRequest: null };
    }));
  };

  const handleRejectChange = (staffId) => {
    setHrStaff(prev => prev.map(s =>
      s.id === staffId ? { ...s, status: 'active', changeRequest: null } : s
    ));
  };

  const handleCancelChangeRequest = async (appId) => {
    console.log('handleCancelChangeRequest called with appId:', appId);
    if (!appId) {
      setErrorNotificationMessage(language === 'vi' ? 'Không tìm thấy mã yêu cầu để hủy' : 'Missing request id to cancel');
      setShowErrorNotification(true);
      setTimeout(() => setShowErrorNotification(false), 3000);
      return;
    }

    if (!window.confirm(language === 'vi' ? 'Bạn có chắc chắn muốn hủy yêu cầu này?' : 'Are you sure you want to cancel this request?')) return;
    console.log('User confirmed cancellation for appId:', appId);

    const hasRealApplication = realApplications.some(app => String(app.applicationId) === String(appId));

    // Handle mock/local staff rows immediately so the button always has visible effect.
    if (!hasRealApplication) {
      setHrStaff(prev => prev.map(s =>
        String(s.id) === String(appId)
          ? { ...s, status: 'active', changeRequest: null }
          : s
      ));
      setStaffTabFilter('working');
      setSuccessToastMessage(language === 'vi' ? 'Đã hủy yêu cầu thành công' : 'Request cancelled successfully');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      loadApplicationsFromQuickJobs().catch(() => {});
      return;
    }

    try {
      setIsProcessingChange(true);
      const nextOverrides = {
        ...changeRequestStatusOverridesRef.current,
        [String(appId)]: 'cancelled'
      };
      setChangeRequestStatusOverridesSync(nextOverrides);

      // Update server: status back to 'accepted' and clear changeRequest
      await applicationService.updateApplicationStatus(appId, 'accepted', {
        changeRequest: null,
        changeRequestStatus: 'cancelled'
      });

      // Update local state immediately so UI responds instantly
      setRealApplications(prev => prev.map(app =>
        String(app.applicationId) === String(appId)
          ? { ...app, status: 'accepted', changeRequest: null, change_request: null, changeRequestStatus: 'cancelled' }
          : app
      ));
      setHrStaff(prev => prev.map(s =>
        String(s.id) === String(appId) ? { ...s, status: 'active', changeRequest: null } : s
      ));

      // Switch tab immediately — don't wait for DB reload
      setStaffTabFilter('working');
      setSuccessToastMessage(language === 'vi' ? 'Đã hủy yêu cầu thành công' : 'Request cancelled successfully');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      // Reload from DB in background to sync
      loadApplicationsFromQuickJobs(nextOverrides).catch(e =>
        console.warn('Error reloading applications after cancellation:', e)
      );
    } catch (err) {
      console.error('Error cancelling change request:', err);
      setErrorNotificationMessage(language === 'vi' ? 'Lỗi khi hủy yêu cầu' : 'Error cancelling request');
      setShowErrorNotification(true);
      setTimeout(() => setShowErrorNotification(false), 3000);
    } finally {
      setIsProcessingChange(false);
    }
  };

  const handleRejectCV = async () => {
    if (!rejectStaff) return;

    try {
      // Update application status to 'rejected' via API
      await applicationService.updateApplicationStatus(rejectStaff.applicationId, 'rejected');

      if (rejectStaff.candidateId) {
        try {
          const employerId = user?.userId || user?.id || user?.email || null;
          const rawCompanyName = rejectStaff.companyName || user?.companyName || user?.company || user?.name || '';
          const companyName = rawCompanyName && !rawCompanyName.includes('@') ? rawCompanyName : 'Nhà tuyển dụng';

          await createCandidateCvRejectedNotification({
            candidateId: rejectStaff.candidateId,
            jobTitle: rejectStaff.position,
            companyName,
            jobId: rejectStaff.jobId,
            employerId
          });
        } catch (notifyError) {
          console.error('❌ Error sending candidate rejected notification:', notifyError);
        }
      }

      // Reload applications from Quick Jobs
      await loadApplicationsFromQuickJobs();

      // Show success message
      console.log('✅ Application rejected successfully');

      // Close modal
      setShowRejectModal(false);
      setRejectStaff(null);
    } catch (error) {
      console.error('❌ Error rejecting application:', error);
      // Still close modal even if error
      setShowRejectModal(false);
      setRejectStaff(null);
    }
  };

  const handleCreatePost = () => {
    // Nếu đã approved thì navigate thẳng, không cần check terms
    // Terms chỉ check ở trang intro (khi chưa approved)
    navigate('/employer/post-quick-job');
  };

  const closeWalletModal = () => {
    setShowWalletModal(false);
    setAgreedToTerms(false);
  };

  const handleConnectWallet = () => {
    localStorage.setItem('quick_job_wallet_terms_agreed', 'true');
    setShowWalletModal(false);
    setAgreedToTerms(false);
    navigate('/employer/post-quick-job');
  };

  // Open delete confirmation modal
  const handleDeleteJob = (jobId) => {
    setDeleteJobId(jobId);
  };

  // Confirm and delete job from DynamoDB
  const confirmDeleteJob = async () => {
    if (!deleteJobId) return;

    setIsDeleting(true);

    try {
      // Get the actual job ID for API (idJob or jobID)
      const job = quickJobPosts.find(j => j.id === deleteJobId);
      const apiJobId = job?.idJob || deleteJobId;

      // Delete job from DynamoDB via API
      await quickJobService.deleteQuickJob(apiJobId);

      // Reload jobs from DynamoDB
      await loadQuickJobsFromDynamoDB();

      // Show success toast with correct message
      setSuccessToastMessage(language === 'vi' ? 'Đã xóa bài đăng thành công!' : 'Post deleted successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('Error deleting job:', error);
      setErrorNotificationMessage(language === 'vi' ? 'Lỗi khi xóa công việc' : 'Error deleting job');
      setShowErrorNotification(true);
      setTimeout(() => setShowErrorNotification(false), 3000);
    }

    setIsDeleting(false);
    setDeleteJobId(null);
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteJobId(null);
  };

  // Get job title for delete confirmation
  const jobToDelete = deleteJobId ? quickJobPosts.find(job => job.id === deleteJobId) : null;

  // View job details
  const handleViewJob = (jobId) => {
    const job = quickJobPosts.find(j => j.id === jobId);
    if (job) setSelectedJobView(job);
  };

  // Edit job
  const handleEditJob = (jobId) => {
    const job = quickJobPosts.find(j => j.id === jobId);
    if (job) {
      setEditJobId(jobId);
      setEditJobData({ ...job });
    }
  };

  // Save edited job
  const handleSaveEdit = async () => {
    if (!editJobData) return;

    // Validate hourly rate
    const hourlyRate = parseFloat(editJobData.hourlyRate);
    if (isNaN(hourlyRate) || hourlyRate < 29500) {
      setErrorNotificationMessage(language === 'vi'
        ? 'Lương phải lớn hơn hoặc bằng 29.500 VNĐ/giờ'
        : 'Hourly rate must be greater than or equal to 29,500 VND');
      setShowErrorNotification(true);
      return;
    }

    // Validate work date
    if (editJobData.workDate) {
      const today = new Date().toISOString().split('T')[0];
      if (editJobData.workDate < today) {
        setErrorNotificationMessage(language === 'vi'
          ? 'Ngày làm việc không được ở trong quá khứ.'
          : 'Work date cannot be in the past.');
        setShowErrorNotification(true);
        return;
      }
    }

    try {
      // Clear any previous errors
      setShowErrorNotification(false);

      // Calculate totalHours and totalSalary
      let totalHours = 0;
      let totalSalary = 0;

      if (editJobData.startTime && editJobData.endTime) {
        const [startHour, startMin] = editJobData.startTime.split(':').map(Number);
        const [endHour, endMin] = editJobData.endTime.split(':').map(Number);

        if (!isNaN(startHour) && !isNaN(startMin) && !isNaN(endHour) && !isNaN(endMin)) {
          let hoursWorked = (endHour + endMin / 60) - (startHour + startMin / 60);

          // Handle overnight shifts
          if (hoursWorked < 0) {
            hoursWorked += 24;
          }

          totalHours = hoursWorked;
          totalSalary = Math.round(hourlyRate * hoursWorked);
        }
      }

      // Get the actual job ID for API (idJob or jobID)
      const job = quickJobPosts.find(j => j.id === editJobId);
      const apiJobId = job?.idJob || editJobId;

      // Prepare update data with recalculated values
      const updateData = {
        ...editJobData,
        hourlyRate: hourlyRate,
        totalHours: totalHours,
        totalSalary: totalSalary
      };

      // Update job in DynamoDB via API
      await quickJobService.updateQuickJob(apiJobId, updateData);

      // Reload jobs from DynamoDB
      await loadQuickJobsFromDynamoDB();

      // Show success toast with correct message
      setSuccessToastMessage(language === 'vi' ? 'Đã cập nhật bài đăng!' : 'Post updated!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      setEditJobId(null);
      setEditJobData(null);
    } catch (error) {
      console.error('Error updating job:', error);
      setErrorNotificationMessage(language === 'vi' ? 'Lỗi khi cập nhật công việc' : 'Error updating job');
      setShowErrorNotification(true);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditJobId(null);
    setEditJobData(null);
    setShowErrorNotification(false);
  };

  // Reload jobs when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadQuickJobsFromDynamoDB();
      }
    };

    const handleFocus = () => {
      loadQuickJobsFromDynamoDB();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [language]);

  if (loadingProfile) {
    return (
      <DashboardLayout role="employer" key={language}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '16px' }}>
          <RefreshCw size={36} style={{ color: '#1e40af', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e40af' }}>
            {language === 'vi' ? 'Đang tải thông tin...' : 'Loading profile...'}
          </span>
        </div>
      </DashboardLayout>
    );
  }

  if (profile?.quickJobStatus !== 'approved') {
    return (
      <DashboardLayout role="employer" key={language}>
        <IntroWrapper>
          <IntroHero>
            <HeroBadge>
              <Zap /> {language === 'vi' ? 'TÍNH NĂNG ĐẶC BIỆT' : 'PREMIUM FEATURE'}
            </HeroBadge>
            <HeroTitle>
              {language === 'vi' ? 'Dịch vụ tuyển gấp' : 'Urgent Recruitment'}
            </HeroTitle>
            <HeroDesc>
              {language === 'vi'
                ? 'Giải pháp tuyển dụng tức thì tối ưu. Tìm kiếm nhân sự chất lượng cao và lấp đầy ca làm trống chỉ trong vài giờ thay vì nhiều ngày.'
                : 'The ultimate real-time hiring solution. Match with high-quality workers and fill empty shifts within hours instead of days.'}
            </HeroDesc>
          </IntroHero>

          <IntroSectionHeader>
            <h2>{language === 'vi' ? 'Công việc tuyển gấp là gì?' : 'What is Urgent Recruitment?'}</h2>
            <p>{language === 'vi' ? 'Các ưu điểm vượt trội của tính năng tuyển gấp' : 'Key benefits of urgent job postings'}</p>
          </IntroSectionHeader>

          <IntroGrid>
            <IntroCard>
              <CardIconBox $bgColor="#fee2e2" $borderColor="#fca5a5" $color="#dc2626">
                <Zap />
              </CardIconBox>
              <CardTitle>{language === 'vi' ? 'Nổi bật & Đẩy tin' : 'Highlighted & Boosted'}</CardTitle>
              <CardText>
                {language === 'vi'
                  ? 'Bài đăng của bạn sẽ có biểu tượng "Tuyển gấp" nổi bật và hiển thị ở vị trí ưu tiên trên trang chủ của ứng viên.'
                  : 'Your posts will feature a prominent "Urgent" badge and display at the top of the candidates\' feed.'}
              </CardText>
            </IntroCard>

            <IntroCard>
              <CardIconBox $bgColor="#dcfce7" $borderColor="#86efac" $color="#16a34a">
                <UsersRound />
              </CardIconBox>
              <CardTitle>{language === 'vi' ? 'Tiếp cận Real-time' : 'Real-time Matching'}</CardTitle>
              <CardText>
                {language === 'vi'
                  ? 'Hệ thống tự động gửi thông báo đẩy (push) đến điện thoại của ứng viên phù hợp trong phạm vi lân cận ngay khi tạo tin.'
                  : 'The system instantly sends push notifications to suitable candidates nearby as soon as the job is posted.'}
              </CardText>
            </IntroCard>

            <IntroCard>
              <CardIconBox $bgColor="#eff6ff" $borderColor="#bfdbfe" $color="#2563eb">
                <Wallet />
              </CardIconBox>
              <CardTitle>{language === 'vi' ? 'Thanh toán an toàn' : 'Secure Payment'}</CardTitle>
              <CardText>
                {language === 'vi'
                  ? 'Lương được giữ an toàn và tự động giải ngân cho ứng viên ngay sau khi hoàn thành công việc.'
                  : 'Funds are securely held and automatically released to the worker once the shift is completed.'}
              </CardText>
            </IntroCard>
          </IntroGrid>

          <IntroSectionHeader>
            <h2>{language === 'vi' ? 'Cách thức hoạt động' : 'How it works'}</h2>
            <p>{language === 'vi' ? 'Quy trình tuyển dụng tinh gọn và nhanh chóng qua 4 bước' : 'A streamlined 4-step recruitment process'}</p>
          </IntroSectionHeader>

          <StepsTimeline>
            <StepItem>
              <div className="step-num">1</div>
              <div className="step-title">{language === 'vi' ? 'Gửi yêu cầu kích hoạt' : 'Request Activation'}</div>
              <div className="step-desc">
                {language === 'vi'
                  ? 'Đăng ký sử dụng tính năng và chờ hệ thống kiểm duyệt hồ sơ doanh nghiệp của bạn.'
                  : 'Submit an activation request and wait for the system to verify your company profile.'}
              </div>
            </StepItem>

            <StepItem>
              <div className="step-num">2</div>
              <div className="step-title">{language === 'vi' ? 'Nạp tiền lương' : 'Deposit Shift Pay'}</div>
              <div className="step-desc">
                {language === 'vi'
                  ? 'Nạp tiền lương tương ứng vào ví điện tử Ốp Pờ. Hệ thống sẽ giữ an toàn để đảm bảo quyền lợi ứng viên.'
                  : 'Deposit the shift salary into your Op Po wallet. The system holds it to secure candidates.'}
              </div>
            </StepItem>

            <StepItem>
              <div className="step-num">3</div>
              <div className="step-title">{language === 'vi' ? 'Chat Real-time' : 'Real-time Chat'}</div>
              <div className="step-desc">
                {language === 'vi'
                  ? 'Ứng viên sẽ nhận việc tức thì. Bạn có thể chat realtime để trao đổi và hướng dẫn công việc.'
                  : 'Candidates accept the job instantly. Chat with them in real-time to organize the shift details.'}
              </div>
            </StepItem>

            <StepItem>
              <div className="step-num">4</div>
              <div className="step-title">{language === 'vi' ? 'Xác nhận & Thanh toán' : 'Complete & Pay'}</div>
              <div className="step-desc">
                {language === 'vi'
                  ? 'Xác nhận công việc hoàn thành. Hệ thống sẽ tự động chuyển khoản vào ví của ứng viên.'
                  : 'Confirm job completion. The system automatically releases held funds to the worker\'s wallet.'}
              </div>
            </StepItem>
          </StepsTimeline>

          <IntroSectionHeader>
            <h2>{language === 'vi' ? 'Các thông tin quan trọng' : 'Important Details'}</h2>
            <p>{language === 'vi' ? 'Quy định và chính sách hoạt động của công việc tuyển gấp' : 'Urgent jobs policies and terms'}</p>
          </IntroSectionHeader>

          <FaqPanel>
            <FaqItem>
              <AlertCircle />
              <div>
                <div className="faq-q">{language === 'vi' ? 'Mức lương sàn tuyển gấp là bao nhiêu?' : 'What is the minimum hourly rate?'}</div>
                <div className="faq-a">
                  {language === 'vi'
                    ? 'Để đảm bảo thu hút ứng viên trong thời gian ngắn, lương của Công việc tuyển gấp phải cao hơn mức lương tối thiểu vùng.'
                    : 'To attract workers quickly, the urgent hourly wage must be higher than the regional minimum wage.'}
                </div>
              </div>
            </FaqItem>

            <FaqItem>
              <TrendingUp />
              <div>
                <div className="faq-q">{language === 'vi' ? 'Phí hoa hồng dịch vụ là bao nhiêu?' : 'What is the service fee?'}</div>
                <div className="faq-a">
                  {language === 'vi'
                    ? 'Hệ thống thu phí dịch vụ 15% tính trên tổng lương ca làm việc khi bài đăng được hoàn thành thành công.'
                    : 'The system charges a 15% commission fee based on the total shift salary upon successful completion.'}
                </div>
              </div>
            </FaqItem>

            <FaqItem>
              <CheckCircle />
              <div>
                <div className="faq-q">{language === 'vi' ? 'Chính sách hoàn tiền ra sao?' : 'What is the refund policy?'}</div>
                <div className="faq-a">
                  {language === 'vi'
                    ? 'Nếu ca làm việc không diễn ra hoặc chưa có ứng viên phù hợp (sau lần Yêu cầu thay đổi ứng viên đầu tiên) chúng tôi sẽ giữ 15% phí sàn, 85% số tiền sẽ được hoàn trả lại ví của bạn.'
                    : 'If the shift does not occur or no worker accepts it (after the first shift change request), 100% of the held funds are returned to your wallet.'}
                </div>
              </div>
            </FaqItem>
          </FaqPanel>

          {profile?.quickJobStatus === 'pending' ? (
            <PendingBanner>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#854d0e', margin: '0 0 8px 0' }}>
                {language === 'vi' ? 'Yêu cầu đang chờ duyệt' : 'Request Pending Approval'}
              </h3>
              <p style={{ fontSize: '14px', color: '#a16207', margin: '0 0 16px 0', fontWeight: '500' }}>
                {language === 'vi'
                  ? 'Chúng tôi đã nhận được yêu cầu kích hoạt của bạn và sẽ liên hệ sớm nhất trong vòng 24 giờ.'
                  : 'We have received your activation request and will contact you as soon as possible within 24 hours.'}
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', width: '100%', marginTop: '16px' }}>
                <ActionButton disabled={true} style={{ background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', boxShadow: 'none', padding: '12px 28px' }}>
                  <RefreshCw size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
                  {language === 'vi' ? 'Đang xử lý...' : 'Processing...'}
                </ActionButton>
                <CancelButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancelRequest}
                  disabled={requestSending}
                  style={{ padding: '12px 28px' }}
                >
                  <X size={18} />
                  {language === 'vi' ? 'Hủy yêu cầu' : 'Cancel Request'}
                </CancelButton>
              </div>
            </PendingBanner>
          ) : (
            <>
              <ActionBanner style={{ textAlign: 'center', padding: '28px 32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>
                  {language === 'vi' ? 'Bắt đầu sử dụng Công việc tuyển gấp' : 'Start using Urgent Recruitment'}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px 0', fontWeight: '500' }}>
                  {language === 'vi'
                    ? 'Kích hoạt tính năng tuyển gấp ngay hôm nay để lấp đầy ca làm việc của bạn trong tích tắc.'
                    : 'Activate the urgent recruitment feature today and fill your empty work shifts in no time.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, justifyContent: 'center', marginBottom: 20, textAlign: 'left', maxWidth: 460, margin: '0 auto 20px' }}>
                  <input
                    type="checkbox"
                    id="inline-terms-check"
                    checked={inlineAgreed}
                    onChange={e => setInlineAgreed(e.target.checked)}
                    style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer', accentColor: '#1e40af', flexShrink: 0 }}
                  />
                  <label htmlFor="inline-terms-check" style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.55, cursor: 'pointer', fontWeight: 500 }}>
                    {language === 'vi' ? 'Tôi đã đọc và đồng ý với ' : 'I have read and agree to the '}
                    <a href="/terms-urgent-jobs" target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', fontWeight: 700, textDecoration: 'underline' }}>
                      {language === 'vi' ? 'Điều khoản sử dụng Job Gấp' : 'Quick Job Terms'}
                    </a>
                    {language === 'vi' ? ' của Ốp Pờ.' : ' of Ốp Pờ.'}
                  </label>
                </div>
                <ActionButton
                  whileHover={inlineAgreed ? { scale: 1.05 } : {}}
                  whileTap={inlineAgreed ? { scale: 0.95 } : {}}
                  disabled={requestSending || !inlineAgreed}
                  onClick={inlineAgreed ? handleRequestActivation : undefined}
                  style={!inlineAgreed ? { opacity: 0.5, cursor: 'not-allowed', filter: 'grayscale(0.3)' } : {}}
                >
                  {language === 'vi' ? 'Gửi yêu cầu kích hoạt Công việc tuyển gấp' : 'Request Urgent Jobs Activation'}
                </ActionButton>
              </ActionBanner>
            </>
          )}
        </IntroWrapper>
        <AnimatePresence>
          {showSuccessToast && (
            <SuccessToast
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CheckCircle />
              <span>{successToastMessage}</span>
            </SuccessToast>
          )}
        </AnimatePresence>
        <ConfirmModal
          isOpen={showCancelConfirmModal}
          title={language === 'vi' ? 'Hủy yêu cầu kích hoạt' : 'Cancel Activation Request'}
          message={language === 'vi'
            ? 'Bạn có chắc chắn muốn hủy yêu cầu kích hoạt Công việc tuyển gấp? Bạn sẽ phải gửi lại yêu cầu nếu muốn kích hoạt sau này.'
            : 'Are you sure you want to cancel the Urgent Jobs activation request? You will need to resubmit the request if you change your mind.'}
          confirmText={language === 'vi' ? 'Hủy yêu cầu' : 'Cancel Request'}
          cancelText={language === 'vi' ? 'Giữ lại' : 'Keep Request'}
          onConfirm={executeCancelRequest}
          onCancel={() => setShowCancelConfirmModal(false)}
          type="danger"
          isLoading={requestSending}
        />
      </DashboardLayout>
    );
  }

  // Fetch candidate recommendations
  const handleRecommendCandidates = async (job) => {
    setRecommendingJob(job);
    setShowRecommendationsModal(true);
    setIsLoadingRecommendations(true);
    setRecommendationError('');
    setRecommendations([]);

    try {
      console.log('🔮 Fetching AI candidate recommendations for quick job:', job.title);
      const result = await cvAiService.recommendCandidates({
        jobData: {
          title: job.title,
          description: job.description || '',
          requirements: job.requirements || '',
          responsibilities: '',
          benefits: '',
        },
        isQuickJob: true,
        language,
      });

      console.log('✅ AI Recommendations result:', result);
      setRecommendations(result);
    } catch (err) {
      console.error('❌ Error getting AI recommendations:', err);
      setRecommendationError(err.message || (language === 'vi' ? 'Không thể lấy đề xuất ứng viên.' : 'Failed to fetch candidate recommendations.'));
    } finally {
      setIsLoadingRecommendations(false);
    }
  };



  return (
    <DashboardLayout role="employer" key={language}>
      <PageContainer
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <PageHeader>
          <PageTitleGroup>
            <PageIconBox><Clock /></PageIconBox>
            <PageTitleText>
              <h1>{language === 'vi' ? 'Công việc tuyển gấp' : 'Quick Jobs'}</h1>
              <p>{language === 'vi' ? 'Quản lý nhân sự, bài đăng và tin nhắn tuyển dụng nhanh' : 'Manage HR, posts and recruitment messages quickly'}</p>
            </PageTitleText>
          </PageTitleGroup>
        </PageHeader>

        {/* Quick Jobs Section */}
        <QuickJobsSection>
          <QuickJobsGrid>
            <QuickJobCard
              $color="#10B981"
              $active={activeSection === 'posts'}
              onClick={() => setActiveSection('posts')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <QuickJobIcon $color="#10B981">
                <FileText />
              </QuickJobIcon>
              <QuickJobLabel>{language === 'vi' ? 'Quản lý bài đăng' : 'Post Management'}</QuickJobLabel>
              <QuickJobDescription>
                {language === 'vi' ? 'Tạo và quản lý các tin tuyển dụng' : 'Create and manage job postings'}
              </QuickJobDescription>
            </QuickJobCard>

            <QuickJobCard
              $color="#1e40af"
              $active={activeSection === 'hr'}
              onClick={() => setActiveSection('hr')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <QuickJobIcon $color="#1e40af">
                <UsersRound />
              </QuickJobIcon>
              <QuickJobLabel>{language === 'vi' ? 'Quản lý nhân sự' : 'HR Management'}</QuickJobLabel>
              <QuickJobDescription>
                {language === 'vi' ? 'Quản lý và theo dõi nhân viên đang làm việc' : 'Manage and track your workforce'}
              </QuickJobDescription>
            </QuickJobCard>
          </QuickJobsGrid>
        </QuickJobsSection>

        {/* Content Section */}
        {activeSection === 'hr' && (
          <>
            <SectionHeader>
              <div>
                <SectionTitle>
                  <UsersRound />
                  {language === 'vi' ? 'Quản lý nhân sự' : 'HR Management'}
                </SectionTitle>
                <p style={{
                  fontSize: '13px',
                  color: '#64748B',
                  marginTop: '8px',
                  fontWeight: '500'
                }}>
                  {language === 'vi'
                    ? 'Tự động ẩn sau khi hoàn thành'
                    : 'Auto-hidden after completion'}
                </p>
              </div>
            </SectionHeader>

            <StaffTabBar>
              {[
                { key: 'working', label: language === 'vi' ? 'Đang làm' : 'Working', color: '#10B981', status: 'active' },
                { key: 'pending_confirm', label: language === 'vi' ? 'Chờ xác nhận' : 'Pending Confirmation', color: '#EF4444', status: 'pending_confirmation' },
                { key: 'pending_change', label: language === 'vi' ? 'Chờ thay đổi' : 'Pending Changes', color: '#F97316', status: 'pending_change' },
                { key: 'completed', label: language === 'vi' ? 'Đã hoàn thành' : 'Completed', color: '#6366F1', status: 'completed' },
              ].map(tab => (
                <StaffTabButton
                  key={tab.key}
                  $active={staffTabFilter === tab.key}
                  $color={tab.color}
                  onClick={() => setStaffTabFilter(tab.key)}
                >
                  {tab.key === 'pending_confirm' && staffTabCounts.pending_confirm > 0
                    ? `${tab.label} (${staffTabCounts.pending_confirm})`
                    : tab.label}
                </StaffTabButton>
              ))}
            </StaffTabBar>

            {allStaff.filter(staff => {
              if (staffTabFilter === 'working') return staff.status === 'active' || staff.status === 'completed_pending_candidate';
              if (staffTabFilter === 'pending_confirm') return staff.status === 'pending_confirmation';
              if (staffTabFilter === 'pending_change') return staff.status === 'pending_change';
              if (staffTabFilter === 'completed') return staff.status === 'completed';
              return false;
            }).length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: '#64748B'
              }}>
                <Clock style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.3 }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  {language === 'vi' ? 'Không có nhân sự' : 'No staff'}
                </h3>
                <p style={{ fontSize: '14px' }}>
                  {language === 'vi'
                    ? 'Không có nhân sự nào trong mục này'
                    : 'No staff in this category'}
                </p>
              </div>
            ) : (
              <StaffGrid>
                <AnimatePresence>
                  {allStaff
                    .filter(staff => {
                      if (staffTabFilter === 'working') return staff.status === 'active' || staff.status === 'completed_pending_candidate';
                      if (staffTabFilter === 'pending_confirm') return staff.status === 'pending_confirmation';
                      if (staffTabFilter === 'pending_change') return staff.status === 'pending_change';
                      if (staffTabFilter === 'completed') return staff.status === 'completed';
                      return false;
                    })
                    .map((staff, index) => (
                      <StaffCard
                        key={staff.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <StaffHeader>
                          <div>
                            <StaffName>{staff.name}</StaffName>
                            <StaffPosition>{staff.position}</StaffPosition>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                            {staffTabFilter === 'working' && staff.status !== 'completed_pending_candidate' ? null : (
                              staffTabFilter === 'pending_confirm' ? (
                                <StaffStatus $status="pending_confirmation">
                                  {language === 'vi' ? 'Chờ xác nhận' : 'Pending Confirm'}
                                </StaffStatus>
                              ) : (
                                isCurrentlyWorking(staff.shift) && !staff.pendingRating && staff.status !== 'completed_pending_candidate' ? (
                                  <StaffStatus $status="active">
                                    {language === 'vi' ? 'Đang làm' : 'Working'}
                                  </StaffStatus>
                                ) : staff.pendingRating ? (
                                  <StaffStatus $status="pending">
                                    {language === 'vi' ? 'Chờ đánh giá' : 'Pending Review'}
                                  </StaffStatus>
                                ) : (
                                  <StaffStatus $status={staff.status}>
                                    {staff.status === 'active'
                                      ? (language === 'vi' ? 'Đang làm' : 'Active')
                                      : staff.status === 'completed'
                                        ? (language === 'vi' ? 'Hoàn thành' : 'Completed')
                                        : staff.status === 'completed_pending_candidate'
                                          ? (language === 'vi' ? 'Chờ ứng viên xác nhận' : 'Pending Candidate Confirm')
                                          : staff.status === 'pending_confirmation'
                                            ? (language === 'vi' ? 'Chờ xác nhận' : 'Pending Confirm')
                                            : staff.status === 'pending_change'
                                              ? (language === 'vi' ? 'Chờ thay đổi' : 'Pending Change')
                                              : (language === 'vi' ? 'Đang làm' : 'Active')}
                                  </StaffStatus>
                                )
                              )
                            )}
                          </div>
                        </StaffHeader>

                        <StaffMeta>
                          <div className="meta-row">
                            <MapPin />{staff.location}
                          </div>
                          <div className="meta-row">
                            <Calendar />{language === 'vi' ? 'Ngày làm:' : 'Work date:'} {staff.startDate}
                          </div>
                          <div className="meta-row">
                            <Clock />{language === 'vi' ? 'Giờ làm:' : 'Work hours:'} {staff.shift}
                          </div>
                          <div className="meta-row">
                            <CheckCircle />{language === 'vi' ? 'Xác nhận:' : 'Confirmed:'} {staff.confirmedAt}
                          </div>
                          <div className="meta-row" style={{ color: '#10B981', fontWeight: '600' }}>
                            <Banknote />{language === 'vi' ? 'Số tiền chi:' : 'Amount paid:'} {staff.totalPaid.toLocaleString('vi-VN')} VNĐ
                          </div>
                        </StaffMeta>

                        {staff.status === 'completed' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', width: '100%' }}>
                            {/* Employer's review of the candidate */}
                            {staff.employerRating && (
                              <div style={{
                                background: 'rgba(16, 185, 129, 0.05)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '12px',
                                padding: '12px',
                                fontSize: '13px'
                              }}>
                                <div style={{ fontWeight: '700', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                  <Star style={{ fill: '#10B981', color: '#10B981', width: '13px', height: '13px' }} />
                                  {language === 'vi' ? 'Đánh giá của bạn về nhân viên' : 'Your Rating of Employee'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <span style={{ fontWeight: '600', color: '#334155' }}>{staff.employerRating.overall}/5</span>
                                  <span style={{ display: 'flex', gap: '1px' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star key={star} style={{ width: '11px', height: '11px', fill: staff.employerRating.overall >= star ? '#F59E0B' : 'transparent', color: '#F59E0B' }} />
                                    ))}
                                  </span>
                                </div>
                                {staff.employerRating.comment && (
                                  <div style={{ fontStyle: 'italic', color: '#475569' }}>
                                    "{staff.employerRating.comment}"
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Candidate's review of the employer */}
                            {staff.candidateRating ? (
                              <div style={{
                                background: 'rgba(99, 102, 241, 0.05)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: '12px',
                                padding: '12px',
                                fontSize: '13px'
                              }}>
                                <div style={{ fontWeight: '700', color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                  <Star style={{ fill: '#6366F1', color: '#6366F1', width: '13px', height: '13px' }} />
                                  {language === 'vi' ? 'Đánh giá từ Ứng viên' : 'Candidate\'s Feedback'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                  <span style={{ fontWeight: '600', color: '#334155' }}>{staff.candidateRating.overall}/5</span>
                                  <span style={{ display: 'flex', gap: '1px' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star key={star} style={{ width: '11px', height: '11px', fill: staff.candidateRating.overall >= star ? '#F59E0B' : 'transparent', color: '#F59E0B' }} />
                                    ))}
                                  </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', margin: '6px 0', padding: '6px 0', borderTop: '1px dashed rgba(99, 102, 241, 0.2)', borderBottom: '1px dashed rgba(99, 102, 241, 0.2)' }}>
                                  {[
                                    { key: 'environment', label: language === 'vi' ? 'Môi trường' : 'Environment' },
                                    { key: 'attitude', label: language === 'vi' ? 'Thái độ' : 'Attitude' },
                                    { key: 'accuracy', label: language === 'vi' ? 'Đúng mô tả' : 'Accuracy' }
                                  ].map(cat => (
                                    <div key={cat.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '11px', color: '#64748B' }}>{cat.label}</span>
                                      <span style={{ display: 'flex', gap: '1px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                          <Star key={star} style={{ width: '10px', height: '10px', fill: staff.candidateRating[cat.key] >= star ? '#F59E0B' : 'transparent', color: '#F59E0B' }} />
                                        ))}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {staff.candidateRating.comment && (
                                  <div style={{ fontStyle: 'italic', color: '#475569' }}>
                                    "{staff.candidateRating.comment}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{
                                padding: '10px',
                                background: '#F8FAFC',
                                border: '1px dashed #E2E8F0',
                                borderRadius: '12px',
                                fontSize: '12px',
                                color: '#64748B',
                                textAlign: 'center'
                              }}>
                                {language === 'vi' ? 'Chờ ứng viên gửi đánh giá...' : 'Waiting for candidate review...'}
                              </div>
                            )}
                          </div>
                        )}

                        {staff.status === 'pending_change' && staff.changeRequest && (
                          <ChangeRequestBanner>
                            <div className="cr-header">
                              <span className={staff.changeRequest.urgency === 'urgent' ? 'cr-urgency-urgent' : 'cr-urgency-normal'}>
                                {staff.changeRequest.urgency === 'urgent'
                                  ? (language === 'vi' ? '🔴 Khẩn cấp' : '🔴 Urgent')
                                  : (language === 'vi' ? 'Bình thường' : 'Normal')}
                              </span>
                            </div>
                            {staff.changeRequest.type === 'shift_change' && (
                              <div className="cr-shift-row">
                                <Clock />{staff.changeRequest.from}
                                <ArrowRight />
                                {staff.changeRequest.to}
                              </div>
                            )}
                            {staff.changeRequest.type === 'staff_replacement' && (
                              <div className="cr-shift-row">
                                <User size={16} />
                                {language === 'vi' ? 'Yêu cầu thay đổi' : 'Change request'}
                              </div>
                            )}
                            <div className="cr-reason">"{staff.changeRequest.reason}"</div>
                            <div className="cr-time">
                              <Clock />{language === 'vi' ? 'Gửi lúc:' : 'Sent at:'} {staff.changeRequest.requestedAt}
                            </div>
                          </ChangeRequestBanner>
                        )}

                        <StaffActions>
                          {/* Temporarily hidden - View profile button */}
                          {/* <StaffButton
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedStaff(staff)}
                          >
                            <User />{language === 'vi' ? 'Xem hồ sơ' : 'View profile'}
                          </StaffButton> */}

                          {/* Show chat button when job is active or completed, change request only when active */}
                          {(staff.status === 'active' || staff.status === 'completed') && (
                            <>
                              <StaffButton
                                $variant="success"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  handleChatWithStaff(staff);
                                }}
                                style={{ position: 'relative' }}
                              >
                                <MessageSquare />{language === 'vi' ? 'Nhắn tin' : 'Chat'}
                                {staff.unreadCount > 0 && (
                                  <span style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-6px',
                                    background: '#EF4444',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}>
                                    1
                                  </span>
                                )}
                              </StaffButton>
                              {staff.status === 'active' && (
                                <StaffButton
                                  $variant="warning"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setChangeRequestStaff(staff);
                                    setChangeRequestReason('');
                                    setChangeRequestType('');
                                  }}
                                >
                                  <AlertCircle />{language === 'vi' ? 'Yêu cầu thay đổi' : 'Request Change'}
                                </StaffButton>
                              )}
                            </>
                          )}
                          {staff.status === 'pending_confirmation' ? (
                            <>
                              {staff.cvUrl && (
                                <StaffButton
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setSelectedCV({ url: staff.cvUrl, filename: staff.cvFilename, applicationId: staff.id, jobId: staff.jobId });
                                    setShowCVPreview(true);
                                  }}
                                >
                                  <Eye />{language === 'vi' ? 'Xem CV' : 'View CV'}
                                </StaffButton>
                              )}
                              <StaffButton
                                $variant="success"
                                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', border: 'none' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleConfirmCV(staff.id)}
                              >
                                <CheckCircle />{language === 'vi' ? 'Đồng ý CV' : 'Approve CV'}
                              </StaffButton>
                              <StaffButton
                                $variant="danger"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setRejectStaff(staff);
                                  setShowRejectModal(true);
                                }}
                              >
                                <XCircle />{language === 'vi' ? 'Từ chối CV' : 'Reject CV'}
                              </StaffButton>
                            </>
                          ) : staff.canRequestChange && (
                            <StaffButton
                              $variant="warning"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setChangeRequestStaff(staff);
                                setChangeRequestReason('');
                                setChangeRequestType('');
                              }}
                            >
                              <AlertCircle />{language === 'vi' ? 'Yêu cầu thay đổi' : 'Request change'}
                            </StaffButton>
                          )}
                          {staff.status === 'active' && !staff.pendingRating && (
                            <StaffButton
                              $variant="success"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              style={{ width: '100%', flex: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', border: 'none', padding: '12px 16px', fontSize: '14px' }}
                              onClick={() => setConfirmCompleteStaff(staff)}
                            >
                              <CheckCircle />{language === 'vi' ? 'Xác nhận hoàn thành công việc' : 'Confirm job completion'}
                            </StaffButton>
                          )}
                          {staff.pendingRating && (
                            <StaffButton
                              $variant="success"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              style={{ width: '100%', flex: 'none', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff', border: 'none', padding: '12px 16px', fontSize: '14px' }}
                              onClick={() => {
                                setRateStaff({ ...staff });
                                setRatings({ overall: 0, attitude: 0, efficiency: 0, discipline: 0, skills: 0 });
                                setRatingHover({ overall: 0, attitude: 0, efficiency: 0, discipline: 0, skills: 0 });
                                setRatingComment('');
                                setRatingSubmitted(false);
                                setShowRateModal(true);
                              }}
                            >
                              <Star />{language === 'vi' ? 'Đánh giá ngay' : 'Rate now'}
                            </StaffButton>
                          )}
                          {staff.status === 'pending_change' && (
                            <>
                              <StaffButton
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setViewedChangeRequest(staff)}
                                style={{ background: '#FFF7ED', color: '#F97316', border: '1.5px solid #FFEDD5' }}
                              >
                                <Eye />{language === 'vi' ? 'Xem chi tiết' : 'View details'}
                              </StaffButton>
                              <StaffButton
                                $variant="danger"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  console.log('Staff list cancel clicked for', staff.applicationId || staff.id);
                                  handleCancelChangeRequest(staff.applicationId || staff.id);
                                }}
                              >
                                <XCircle />{language === 'vi' ? 'Hủy yêu cầu' : 'Cancel'}
                              </StaffButton>
                            </>
                          )}
                        </StaffActions>
                      </StaffCard>
                    ))}
                </AnimatePresence>
              </StaffGrid>
            )}
          </>
        )}

        {activeSection === 'posts' && (
          <>
            <SectionHeader>
              <div>
                <SectionTitle>
                  <FileText />
                  {language === 'vi' ? 'Quản lý bài đăng' : 'Post Management'}
                </SectionTitle>
                <p style={{
                  fontSize: '13px',
                  color: '#64748B',
                  marginTop: '8px',
                  fontWeight: '500'
                }}>
                  {language === 'vi' ? 'Bài đăng tuyển gấp' : 'Shift posts'}
                </p>
              </div>
              <PostJobButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreatePost}
              >
                <Plus />
                {language === 'vi' ? 'Đăng bài mới' : 'Create Post'}
              </PostJobButton>
            </SectionHeader>
            {quickJobPosts.length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: '#64748B'
              }}>
                <FileText style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.3 }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  {language === 'vi' ? 'Chưa có bài đăng nào' : 'No posts yet'}
                </h3>
                <p style={{ fontSize: '14px' }}>
                  {language === 'vi'
                    ? 'Bắt đầu tuyển dụng bằng cách tạo bài đăng đầu tiên của bạn'
                    : 'Start hiring by creating your first job post'}
                </p>
              </div>
            ) : (
              <QuickJobPostsGrid>
                <AnimatePresence>
                  {quickJobPosts.map((post, index) => (
                    <QuickJobPostCard
                      key={post.id}
                      $status={post.status}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <QuickJobPostHeader>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <QuickJobPostTitle style={{ margin: 0, flex: 1 }}><DynamicTranslate text={post.title} showIndicator={false} /></QuickJobPostTitle>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                              border: '2px solid #EF4444',
                              borderRadius: '100px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#991B1B',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}>
                              <Zap size={12} style={{ color: '#EF4444' }} />
                              {language === 'vi' ? 'Tuyển gấp' : 'Urgent'}
                            </div>
                            {/* Approval status badge */}
                            {(() => {
                              const s = post.status;
                              if (s === 'approved' || s === 'active') return (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '100px', fontSize: '12px', fontWeight: '700', color: '#15803d', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  <CheckCircle size={11} /> {language === 'vi' ? 'Đã duyệt' : 'Approved'}
                                </div>
                              );
                              if (s === 'rejected') return (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '100px', fontSize: '12px', fontWeight: '700', color: '#dc2626', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  <XCircle size={11} /> {language === 'vi' ? 'Từ chối' : 'Rejected'}
                                </div>
                              );
                              // pending or anything else
                              return (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: '100px', fontSize: '12px', fontWeight: '700', color: '#b45309', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  <Clock size={11} /> {language === 'vi' ? 'Chờ duyệt' : 'Pending'}
                                </div>
                              );
                            })()}
                          </div>
                          <QuickJobPostMeta>
                            <div className="meta-item">
                              <MapPin /><DynamicTranslate text={post.location} showIndicator={false} />
                            </div>
                            <div className="meta-item">
                              <Wallet size={15} style={{ strokeWidth: 1.5 }} />{post.salary}
                            </div>
                          </QuickJobPostMeta>
                          <QuickJobPostMeta>
                            {post.shift && (
                              <div className="meta-item">
                                <Clock />{post.shift}
                              </div>
                            )}
                            <div className="meta-item">
                              <Calendar />{post.deadline}
                            </div>
                          </QuickJobPostMeta>
                        </div>
                      </QuickJobPostHeader>

                      <QuickJobPostStats>
                        <div className="stat">
                          <div className="stat-value">{post.applicants}</div>
                          <div className="stat-label">{language === 'vi' ? 'Ứng viên' : 'Applicants'}</div>
                        </div>
                        <div className="stat">
                          <div className="stat-value">{post.views}</div>
                          <div className="stat-label">{language === 'vi' ? 'Lượt xem' : 'Views'}</div>
                        </div>
                      </QuickJobPostStats>

                      <QuickJobPostActions>
                        <QuickJobPostButton
                          $variant="ai"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRecommendCandidates(post)}
                        >
                          <Sparkles />{language === 'vi' ? 'Gợi ý ứng viên' : 'AI Match'}
                        </QuickJobPostButton>
                        <QuickJobPostButtonsRow>
                          <QuickJobPostButton
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleViewJob(post.id)}
                            style={{ flex: 2 }}
                          >
                            <Eye />{language === 'vi' ? 'Xem mô tả' : 'View'}
                          </QuickJobPostButton>
                          <QuickJobPostButton
                            $variant="primary"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleEditJob(post.id)}
                            style={{ flex: 1 }}
                          >
                            <Edit />{language === 'vi' ? 'Sửa' : 'Edit'}
                          </QuickJobPostButton>
                          <QuickJobPostButton
                            $variant="danger"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDeleteJob(post.id)}
                            style={{ width: '42px', flexShrink: 0, padding: 0 }}
                          >
                            <Trash2 />
                          </QuickJobPostButton>
                        </QuickJobPostButtonsRow>
                      </QuickJobPostActions>
                    </QuickJobPostCard>
                  ))}
                </AnimatePresence>
              </QuickJobPostsGrid>
            )}
          </>
        )}



        {/* Chat Modal */}
        <AnimatePresence>
          {activeChatId && activeChat && (
            <ChatModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseChat}
            >
              <ChatModalContainer
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ChatModalHeader>
                  <ChatModalHeaderInfo>
                    <ChatModalAvatar>
                      {activeChat.name.charAt(0)}
                      <ChatModalOnlineStatus $online={activeChat.status === 'online'} />
                    </ChatModalAvatar>
                    <ChatModalHeaderText>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3>{activeChat.name}</h3>
                        {activeChat.isCompleted ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#F1F5F9',
                            color: '#64748B',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            letterSpacing: '0.3px',
                            border: '1px solid #CBD5E1'
                          }}>
                            🔒 {language === 'vi' ? 'ĐÃ HOÀN THÀNH' : 'COMPLETED'}
                          </span>
                        ) : null}
                      </div>
                      <p>{activeChat.role} • {activeChat.position}</p>
                    </ChatModalHeaderText>
                  </ChatModalHeaderInfo>
                  <ChatModalCloseButton
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCloseChat}
                  >
                    <X />
                  </ChatModalCloseButton>
                </ChatModalHeader>

                <ChatModalMessages>
                  {currentMessages.map((msg, index) => (
                    <ChatMessage
                      key={msg.id}
                      $sender={msg.sender}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {msg.sender === 'me' && (
                        <DeleteMessageButton
                          className="delete-button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteMessage(msg.id)}
                        >
                          <X />
                        </DeleteMessageButton>
                      )}
                      <ChatMessageBubble $sender={msg.sender}>
                        <div className="message-text">{msg.text}</div>
                        <div className="message-time">{msg.time}</div>
                      </ChatMessageBubble>
                      {msg.sender === 'them' && (
                        <DeleteMessageButton
                          className="delete-button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteMessage(msg.id)}
                        >
                          <X />
                        </DeleteMessageButton>
                      )}
                    </ChatMessage>
                  ))}
                  <div ref={chatMessagesEndRef} />
                </ChatModalMessages>

                {activeChat.isCompleted ? (
                  <div style={{
                    padding: '18px 24px',
                    textAlign: 'center',
                    background: '#F1F5F9',
                    borderTop: '1px solid #E2E8F0',
                    color: '#64748B',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%'
                  }}>
                    🔒 {language === 'vi' ? 'Cuộc trò chuyện đã khóa do công việc đã hoàn thành' : 'Chat locked because the job is completed'}
                  </div>
                ) : (
                  <ChatModalInput>
                    <ChatInputField
                      type="text"
                      placeholder={language === 'vi' ? 'Nhập tin nhắn...' : 'Type a message...'}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <ChatSendButton
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                    >
                      <Send />
                    </ChatSendButton>
                  </ChatModalInput>
                )}
              </ChatModalContainer>
            </ChatModalOverlay>
          )}
        </AnimatePresence>

        {/* Confirm Complete Job Modal */}
        <AnimatePresence>
          {confirmCompleteStaff && (
            <ConfirmCompleteOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmCompleteStaff(null)}
            >
              <ConfirmCompleteContainer
                initial={{ scale: 0.88, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 24 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
              >
                <ConfirmCompleteIcon>
                  <CheckCircle />
                </ConfirmCompleteIcon>
                <ConfirmCompleteTitle>
                  {language === 'vi' ? 'Xác nhận hoàn thành' : 'Confirm Completion'}
                </ConfirmCompleteTitle>
                <ConfirmCompleteMessage>
                  {language === 'vi'
                    ? 'Bạn xác nhận nhân viên này đã hoàn thành công việc?'
                    : 'Confirm that this staff member has completed the job?'}
                </ConfirmCompleteMessage>
                <ConfirmCompleteStaffName>
                  {confirmCompleteStaff.name} — {confirmCompleteStaff.position}
                </ConfirmCompleteStaffName>
                <ConfirmCompleteActions>
                  <ConfirmCompleteButton
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setConfirmCompleteStaff(null)}
                  >
                    <X />{language === 'vi' ? 'Hủy' : 'Cancel'}
                  </ConfirmCompleteButton>
                  <ConfirmCompleteButton
                    $variant='success'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const staffData = { ...confirmCompleteStaff };
                      setHrStaff(prev => prev.map(s =>
                        s.id === confirmCompleteStaff.id
                          ? { ...s, pendingRating: true }
                          : s
                      ));
                      setConfirmCompleteStaff(null);
                      setCompletedStaffSummary(staffData);
                    }}
                  >
                    <CheckCircle />{language === 'vi' ? 'Xác nhận' : 'Confirm'}
                  </ConfirmCompleteButton>
                </ConfirmCompleteActions>
              </ConfirmCompleteContainer>
            </ConfirmCompleteOverlay>
          )}
          {showCompleteToast && (
            <CompleteSuccessToast
              initial={{ opacity: 0, y: -20, x: 100 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
            >
              <CheckCircle />
              {language === 'vi' ? 'Đã xác nhận hoàn thành công việc!' : 'Job completion confirmed!'}
            </CompleteSuccessToast>
          )}
          {showChangeRequestToast && (
            <CompleteSuccessToast
              initial={{ opacity: 0, y: -20, x: 100 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', top: '24px' }}
            >
              <CheckCircle />
              {language === 'vi' ? 'Yêu cầu thay đổi đã được gửi!' : 'Change request submitted!'}
            </CompleteSuccessToast>
          )}
        </AnimatePresence>

        {/* Change Request Success Modal */}
        {/* ... existing success modal ... */}

        {/* View Change Request Detail Modal (Employer Side) */}
        <AnimatePresence>
          {viewedChangeRequest && (
            <RateModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewedChangeRequest(null)}
            >
              <RateModalContent
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '480px' }}
              >
                <RateModalHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', background: '#FFF7ED', borderRadius: '8px' }}>
                      <AlertCircle size={18} color="#F97316" />
                    </div>
                    <h2>{language === 'vi' ? 'Chi Tiết Yêu Cầu' : 'Request Details'}</h2>
                  </div>
                  <button onClick={() => setViewedChangeRequest(null)}><X size={18} /></button>
                </RateModalHeader>
                <RateModalBody>
                  <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                          {language === 'vi' ? 'Nhân viên' : 'Staff'}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700 }}>{viewedChangeRequest.name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                          {language === 'vi' ? 'Loại yêu cầu' : 'Request Type'}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#F97316' }}>
                          {viewedChangeRequest.changeRequest?.typeLabel || (language === 'vi' ? 'Thay đổi nhân sự' : 'Personnel Change')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                      {language === 'vi' ? 'Lý do gửi Admin:' : 'Reason sent to Admin:'}
                    </div>
                    <div style={{ background: '#FAFAFA', border: '1.5px solid #F1F5F9', borderRadius: '12px', padding: '16px', fontSize: '14px', lineHeight: '1.6', color: '#1E293B' }}>
                      {viewedChangeRequest.changeRequest?.reason}
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center' }}>
                    {language === 'vi' ? 'Đã gửi lúc:' : 'Sent at:'} {viewedChangeRequest.changeRequest?.requestedAt}
                  </div>
                </RateModalBody>
                <div style={{ padding: '20px 24px 32px' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const appId = viewedChangeRequest.applicationId || viewedChangeRequest.id;
                      console.log('Modal cancel clicked for', appId);
                      setViewedChangeRequest(null);
                      handleCancelChangeRequest(appId);
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <XCircle size={16} />
                    {language === 'vi' ? 'Hủy yêu cầu này' : 'Cancel this request'}
                  </motion.button>
                </div>
              </RateModalContent>
            </RateModalOverlay>
          )}
        </AnimatePresence>

        {/* Change Request Success Modal */}
        <AnimatePresence>
          {showChangeRequestSuccess && (
            <RateModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChangeRequestSuccess(false)}
            >
              <RateModalContent
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '400px' }}
              >
                <RateModalHeader>
                  <h2><AlertCircle />{language === 'vi' ? 'Yêu Cầu Đã Gửi' : 'Request Submitted'}</h2>
                </RateModalHeader>
                <RateModalBody style={{ textAlign: 'center', padding: '32px 24px' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircle style={{ width: '36px', height: '36px', color: '#D97706' }} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '10px' }}>
                    {language === 'vi' ? 'Yêu cầu đã được gửi!' : 'Request submitted!'}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.65', marginBottom: '28px' }}>
                    {language === 'vi'
                      ? 'Chúng tôi đã nhận yêu cầu thay đổi của bạn và sẽ xử lý trong thời gian sớm nhất.'
                      : 'We have received your change request and will process it as soon as possible.'}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowChangeRequestSuccess(false)}
                    style={{ width: '100%', padding: '13px 20px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {language === 'vi' ? 'Đóng' : 'Close'}
                  </motion.button>
                </RateModalBody>
              </RateModalContent>
            </RateModalOverlay>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {changeRequestStaff && (
            <RateModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChangeRequestStaff(null)}
            >
              <RateModalContent
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '520px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
              >
                <RateModalHeader style={{ padding: '24px', borderBottom: '1.5px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #FFEDD5' }}>
                      <AlertCircle style={{ color: '#F97316' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', margin: '0' }}>
                        {language === 'vi' ? 'Yêu Cầu Thay Đổi' : 'Request Change'}
                      </h2>
                      <p style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500', margin: '2px 0 0' }}>
                        {language === 'vi' ? 'Gửi yêu cầu điều chỉnh về nhân sự/công việc' : 'Send adjustment request for staff/work'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setChangeRequestStaff(null)}
                    style={{ background: '#F8FAF8', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '10px' }}
                  >
                    <X size={18} color="#64748B" />
                  </button>
                </RateModalHeader>

                <RateModalBody style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                  {/* Staff Info Card */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '24px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      border: '1px solid #E2E8F0'
                    }}>
                      <User style={{ width: '22px', height: '22px', color: '#1E40AF' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '15.5px', color: '#1E293B' }}>{changeRequestStaff.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#64748B', marginTop: '3px', fontWeight: '500' }}>
                        <span>{changeRequestStaff.position}</span>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#CBD5E1' }}></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {changeRequestStaff.shift}
                        </span>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', background: 'rgba(30, 64, 175, 0.03)', borderRadius: '50%' }}></div>
                  </div>

                  {/* Reason grid - More premium buttons */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '14px' }}>
                      <RefreshCw size={16} color="#F97316" />
                      {language === 'vi' ? 'Lý do chính của yêu cầu' : 'Primary reason for request'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        {
                          value: 'poor_performance',
                          label: language === 'vi' ? 'Làm việc không hiệu quả' : 'Poor Performance',
                          icon: TrendingDown,
                          color: '#EF4444'
                        },
                        {
                          value: 'attitude_issue',
                          label: language === 'vi' ? 'Thái độ không phù hợp' : 'Attitude Issue',
                          icon: AlertCircle,
                          color: '#F97316'
                        },
                        {
                          value: 'skill_mismatch',
                          label: language === 'vi' ? 'Kỹ năng không đáp ứng' : 'Skill Mismatch',
                          icon: XCircle,
                          color: '#3B82F6'
                        },
                        {
                          value: 'unreliable',
                          label: language === 'vi' ? 'Không đáng tin cậy' : 'Unreliable',
                          icon: Clock,
                          color: '#6366F1'
                        },
                      ].map(opt => {
                        const Icon = opt.icon;
                        const isSelected = changeRequestType === opt.value;
                        return (
                          <motion.button
                            key={opt.value}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setChangeRequestType(opt.value)}
                            style={{
                              padding: '12px',
                              borderRadius: '12px',
                              border: '2px solid',
                              borderColor: isSelected ? opt.color : '#F1F5F9',
                              background: isSelected ? `${opt.color}08` : 'white',
                              color: isSelected ? opt.color : '#64748B',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              gap: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              textAlign: 'left',
                              boxShadow: isSelected ? `0 4px 12px ${opt.color}15` : 'none'
                            }}
                          >
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '8px',
                              background: isSelected ? `${opt.color}15` : '#F8FAFC',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}>
                              <Icon size={16} />
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '700' }}>{opt.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message Detail */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '14px' }}>
                      <Edit3 size={16} color="#F97316" />
                      {language === 'vi' ? 'Mô tả chi tiết nguyên nhân' : 'Detailed reason description'}
                    </div>
                    <textarea
                      rows={4}
                      placeholder={language === 'vi' ? 'Vui lòng cung cấp thêm chi tiết để admin hỗ trợ bạn tốt nhất...' : 'Please provide more details for admin to assist you best...'}
                      value={changeRequestReason}
                      onChange={e => setChangeRequestReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '14px',
                        border: '1.5px solid #E2E8F0',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1E293B',
                        resize: 'none',
                        background: '#FAFAFA',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#F97316';
                        e.target.style.background = 'white';
                        e.target.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#E2E8F0';
                        e.target.style.background = '#FAFAFA';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </RateModalBody>

                <div style={{ padding: '20px 24px 32px', background: 'white', borderTop: '1.5px solid #F1F5F9' }}>
                  <motion.button
                    whileHover={changeRequestReason.trim() && changeRequestType ? { scale: 1.02 } : {}}
                    whileTap={changeRequestReason.trim() && changeRequestType ? { scale: 0.98 } : {}}
                    disabled={!changeRequestReason.trim() || !changeRequestType}
                    onClick={() => {
                      if (!changeRequestReason.trim() || !changeRequestType) return;

                      const now = new Date();
                      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                      const dateStr = language === 'vi'
                        ? `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`
                        : `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}/${now.getFullYear()}`;

                      const typeLabels = {
                        'poor_performance': language === 'vi' ? 'Làm việc không hiệu quả' : 'Poor Performance',
                        'attitude_issue': language === 'vi' ? 'Thái độ không phù hợp' : 'Attitude Issue',
                        'skill_mismatch': language === 'vi' ? 'Kỹ năng không đáp ứng' : 'Skill Mismatch',
                        'unreliable': language === 'vi' ? 'Không đáng tin cậy' : 'Unreliable'
                      };

                      const changeReq = {
                        type: 'staff_replacement',
                        reasonCode: changeRequestType,
                        typeLabel: typeLabels[changeRequestType],
                        reason: changeRequestReason,
                        requestedAt: `${dateStr} - ${timeStr}`,
                        urgency: 'normal',
                        sentToAdmin: true
                      };

                      // Switch tab immediately so the user sees the new request without waiting for sync.
                      setStaffTabFilter('pending_change');

                      // Store override so polls don't overwrite pending_change state
                      setChangeRequestStatusOverridesSync(prev => ({
                        ...prev,
                        [String(changeRequestStaff.applicationId)]: {
                          status: 'pending_change',
                          changeRequest: changeReq
                        }
                      }));

                      // Sync to server
                      applicationService.updateApplicationStatus(
                        changeRequestStaff.applicationId,
                        'pending_change',
                        { changeRequest: changeReq, changeRequestStatus: 'pending' }
                      ).catch(err => {
                        console.error('❌ Failed to sync change request to DB:', err);
                      });

                      setRealApplications(prev => prev.map(app =>
                        app.applicationId === changeRequestStaff.applicationId
                          ? {
                            ...app,
                            status: 'pending_change',
                            changeRequest: changeReq
                          }
                          : app
                      ));

                      setChangeRequestStaff(null);
                      setChangeRequestReason('');
                      setChangeRequestType('');
                      // Show toast instead of blocking modal
                      setSuccessToastMessage(language === 'vi' ? 'Yêu cầu thay đổi đã được gửi!' : 'Change request submitted!');
                      setShowSuccessToast(true);
                      setTimeout(() => setShowSuccessToast(false), 3000);
                    }}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '14px',
                      fontSize: '16px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      cursor: (changeRequestReason.trim() && changeRequestType) ? 'pointer' : 'not-allowed',
                      border: 'none',
                      background: (changeRequestReason.trim() && changeRequestType)
                        ? 'linear-gradient(135deg, #1E40AF, #3B82F6)'
                        : '#E2E8F0',
                      color: (changeRequestReason.trim() && changeRequestType) ? 'white' : '#94A3B8',
                      boxShadow: (changeRequestReason.trim() && changeRequestType)
                        ? '0 8px 20px rgba(30, 64, 175, 0.25)'
                        : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Send size={18} />
                    {language === 'vi' ? 'Gửi yêu cầu ngay' : 'Submit Request'}
                  </motion.button>
                  <p style={{ textAlign: 'center', fontSize: '12px', color: '#94A3B8', marginTop: '16px', fontWeight: '500' }}>
                    {language === 'vi'
                      ? 'Yêu cầu sẽ được gửi trực tiếp đến quản trị viên xử lý.'
                      : 'Request will be sent directly to the administrator.'}
                  </p>
                </div>
              </RateModalContent>
            </RateModalOverlay>
          )}
        </AnimatePresence>

        {/* Job Completed Summary Modal (employer side) */}
        <AnimatePresence>
          {completedStaffSummary && (
            <RateModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RateModalContent
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={e => e.stopPropagation()}
              >
                <RateModalHeader>
                  <h2><Briefcase />{language === 'vi' ? 'Chi Tiết Công Việc Tuyển Gấp' : 'Quick Job Details'}</h2>
                </RateModalHeader>
                <RateModalBody style={{ textAlign: 'center', padding: '32px 24px' }}>
                  {/* Icon */}
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircle style={{ width: '36px', height: '36px', color: '#059669' }} />
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
                    {language === 'vi' ? 'Công việc đã hoàn thành!' : 'Job completed!'}
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.7, marginBottom: '0' }}>
                    {language === 'vi'
                      ? `Tiền công sẽ được giải phóng cho ${completedStaffSummary.name} trong vòng 48h.`
                      : `Payment will be released to ${completedStaffSummary.name} within 48h.`}
                  </p>

                  <RateActions>
                    <RateActionButton
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setRateStaff(completedStaffSummary);
                        setRatings({ overall: 0, attitude: 0, efficiency: 0, discipline: 0, skills: 0 });
                        setRatingHover({ overall: 0, attitude: 0, efficiency: 0, discipline: 0, skills: 0 });
                        setRatingComment('');
                        setRatingSubmitted(false);
                        setCompletedStaffSummary(null);
                        setShowRateModal(true);
                      }}
                    >
                      <Star />
                      {language === 'vi' ? 'Đánh giá Nhân viên' : 'Rate Employee'}
                    </RateActionButton>
                  </RateActions>
                </RateModalBody>
              </RateModalContent>
            </RateModalOverlay>
          )}
        </AnimatePresence>

        {/* Rate Employee Modal */}
        <AnimatePresence>
          {showRateModal && rateStaff && (() => {
            const categories = [
              { key: 'attitude', label: language === 'vi' ? 'Thái độ làm việc' : 'Work Attitude', Icon: Users },
              { key: 'efficiency', label: language === 'vi' ? 'Hiệu quả công việc' : 'Work Efficiency', Icon: TrendingUp },
              { key: 'discipline', label: language === 'vi' ? 'Kỷ luật và đúng giờ' : 'Discipline & Punctuality', Icon: Clock },
              { key: 'skills', label: language === 'vi' ? 'Kỹ năng công việc' : 'Job Skills', Icon: Award },
            ];
            const renderStars = (catKey) => (
              <RateStarRow>
                {[1, 2, 3, 4, 5].map(star => (
                  <RateStarButton
                    key={star}
                    type="button"
                    $active={(ratingHover[catKey] || ratings[catKey]) >= star}
                    onMouseEnter={() => setRatingHover(p => ({ ...p, [catKey]: star }))}
                    onMouseLeave={() => setRatingHover(p => ({ ...p, [catKey]: 0 }))}
                    onClick={() => setRatings(p => ({ ...p, [catKey]: star }))}
                  >
                    <Star />
                  </RateStarButton>
                ))}
              </RateStarRow>
            );
            const canSubmit = ratings.overall > 0 && ratings.attitude > 0 && ratings.efficiency > 0 && ratings.discipline > 0 && ratings.skills > 0;
            return (
              <RateModalOverlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { if (ratingSubmitted) { setShowRateModal(false); setRateStaff(null); } }}
              >
                <RateModalContent
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  onClick={e => e.stopPropagation()}
                >
                  <RateModalHeader>
                    <h2><Briefcase />{language === 'vi' ? (ratingSubmitted ? 'Đánh Giá Hoàn Tất' : 'Đánh Giá Nhân Viên') : (ratingSubmitted ? 'Review Submitted' : 'Rate Employee')}</h2>
                    {ratingSubmitted && (
                      <button onClick={() => { setShowRateModal(false); setRateStaff(null); checkAndEndShift(hrStaff); }}><X size={18} /></button>
                    )}
                  </RateModalHeader>
                  <RateModalBody>
                    {!ratingSubmitted ? (
                      <>
                        <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                          {rateStaff.name} — {rateStaff.position}
                        </p>

                        {/* Overall */}
                        <RateCategory style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A40)', padding: '14px 16px', borderRadius: '12px', border: '2px solid #F59E0B30', marginBottom: '16px' }}>
                          <div className="category-label" style={{ fontSize: '15px', fontWeight: 700, color: '#B45309' }}>
                            {language === 'vi' ? '⭐ Đánh giá tổng quan' : '⭐ Overall Rating'}
                          </div>
                          {renderStars('overall')}
                        </RateCategory>

                        {/* Categories */}
                        {categories.map(({ key, label, Icon }) => (
                          <RateCategory key={key}>
                            <div className="category-label">
                              <Icon />{label}
                            </div>
                            {renderStars(key)}
                          </RateCategory>
                        ))}

                        {/* Comment */}
                        <RateCategory>
                          <div className="category-label">
                            <Edit3 />{language === 'vi' ? 'Nhận xét của bạn' : 'Your Review'}
                          </div>
                          <RateTextArea
                            placeholder={language === 'vi' ? 'Chia sẻ trải nghiệm làm việc với nhân viên này...' : 'Share your experience working with this employee...'}
                            value={ratingComment}
                            onChange={e => setRatingComment(e.target.value)}
                          />
                        </RateCategory>

                        <RateActions>
                          <RateActionButton
                            whileHover={canSubmit && !requestSending ? { scale: 1.02 } : {}}
                            whileTap={canSubmit && !requestSending ? { scale: 0.98 } : {}}
                            disabled={!canSubmit || requestSending}
                            onClick={async () => {
                              if (!canSubmit) return;
                              const staffId = rateStaff.id;
                              try {
                                setRequestSending(true);
                                const employerRating = {
                                  overall: ratings.overall,
                                  attitude: ratings.attitude,
                                  efficiency: ratings.efficiency,
                                  discipline: ratings.discipline,
                                  skills: ratings.skills,
                                  comment: ratingComment
                                };
                                const employerConfirmedAt = new Date().toISOString();

                                await applicationService.updateApplicationStatus(staffId, 'completed_pending_candidate', {
                                  employerRating,
                                  employerConfirmedAt
                                });

                                setHrStaff(prev => prev.map(s =>
                                  s.id === staffId
                                    ? {
                                      ...s,
                                      status: 'completed_pending_candidate',
                                      rated: true,
                                      pendingRating: false,
                                      canRequestChange: false,
                                      isWithinTimeWindow: false,
                                      employerRating,
                                      employerConfirmedAt
                                    }
                                    : s
                                ));
                                setRatingSubmitted(true);

                                // Notify candidate about the review
                                try {
                                  const employerProfile = await employerProfileService.getMyProfile().catch(() => null);
                                  await createEmployerReviewNotification({
                                    candidateId: rateStaff.candidateId,
                                    candidateName: rateStaff.name || rateStaff.candidate,
                                    employerId: user?.userId || user?.id,
                                    companyName: employerProfile?.companyName || user?.companyName || 'Nhà tuyển dụng',
                                    jobTitle: rateStaff.position || rateStaff.jobTitle,
                                    rating: employerRating.overall,
                                    comment: ratingComment
                                  });
                                } catch (notifErr) {
                                  console.warn('⚠️ Failed to send review notification to candidate:', notifErr.message);
                                }
                              } catch (err) {
                                console.error('Failed to submit employer rating:', err);
                                alert(language === 'vi' ? 'Đánh giá thất bại, vui lòng thử lại!' : 'Failed to submit rating, please try again!');
                              } finally {
                                setRequestSending(false);
                              }
                            }}
                          >
                            <CheckCircle />
                            {requestSending
                              ? (language === 'vi' ? 'Đang gửi...' : 'Submitting...')
                              : (language === 'vi' ? 'Gửi đánh giá' : 'Submit Review')}
                          </RateActionButton>
                        </RateActions>
                      </>
                    ) : (
                      <>
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10B98115', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <CheckCircle style={{ width: '32px', height: '32px', color: '#10B981' }} />
                          </div>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'inherit', marginBottom: '8px' }}>
                            {language === 'vi' ? 'Cảm ơn bạn đã đánh giá!' : 'Thank you for your review!'}
                          </h3>
                          <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.7 }}>
                            {language === 'vi'
                              ? 'Đánh giá của bạn giúp cộng đồng tìm được nhân viên chất lượng hơn.'
                              : 'Your review helps the community find better employees.'}
                          </p>
                        </div>
                        <RateActions>
                          <RateActionButton
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setShowRateModal(false);
                              setRateStaff(null);
                              checkAndEndShift(hrStaff);
                            }}
                          >
                            <CheckCircle />
                            {language === 'vi' ? 'Hoàn tất' : 'Done'}
                          </RateActionButton>
                        </RateActions>
                      </>
                    )}
                  </RateModalBody>
                </RateModalContent>
              </RateModalOverlay>
            );
          })()}
        </AnimatePresence>

        {/* Shift Ended Modal - shown when ALL staff have been rated */}
        <AnimatePresence>
          {showShiftEndedModal && (
            <ConfirmCompleteOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ConfirmCompleteContainer
                initial={{ scale: 0.88, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 24 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                style={{ maxWidth: '420px' }}
              >
                {/* green glow icon */}
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #D1FAE5, #6EE7B7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}>
                  <CheckCircle style={{ width: '40px', height: '40px', color: '#059669' }} />
                </div>

                <ConfirmCompleteTitle>
                  {language === 'vi' ? 'Ca làm đã kết thúc!' : 'Shift has ended!'}
                </ConfirmCompleteTitle>
                <ConfirmCompleteMessage>
                  {language === 'vi'
                    ? 'Tất cả nhân viên đã được đánh giá. Ca làm việc đã chính thức kết thúc.'
                    : 'All employees have been reviewed. The work shift has officially ended.'}
                </ConfirmCompleteMessage>

                {/* Rated staff list */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  {hrStaff.filter(s => s.rated).map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 14px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User style={{ width: '18px', height: '18px', color: 'white' }} />
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#065F46' }}>{s.name}</div>
                        <div style={{ fontSize: '11px', color: '#059669' }}>{s.position}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Star style={{ width: '12px', height: '12px', color: '#F59E0B', fill: '#F59E0B' }} />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#065F46' }}>
                          {language === 'vi' ? 'Đã đánh giá' : 'Rated'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <ConfirmCompleteButton
                  $variant='success'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ width: '100%' }}
                  onClick={() => setShowShiftEndedModal(false)}
                >
                  <CheckCircle />{language === 'vi' ? 'Đóng' : 'Close'}
                </ConfirmCompleteButton>
              </ConfirmCompleteContainer>
            </ConfirmCompleteOverlay>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {deleteJobId && jobToDelete && (
            <DeleteModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDelete}
            >
              <DeleteModalContainer
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <DeleteModalIcon>
                  <AlertCircle />
                </DeleteModalIcon>
                <DeleteModalTitle>
                  {language === 'vi' ? 'Xác nhận xóa bài đăng' : 'Confirm Delete Post'}
                </DeleteModalTitle>
                <DeleteModalMessage>
                  {language === 'vi'
                    ? 'Bạn có chắc chắn muốn xóa bài đăng này? Hành động này không thể hoàn tác.'
                    : 'Are you sure you want to delete this post? This action cannot be undone.'}
                </DeleteModalMessage>
                <DeleteModalJobTitle>
                  {jobToDelete.title}
                </DeleteModalJobTitle>
                <DeleteModalActions>
                  <DeleteModalButton
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={cancelDelete}
                    disabled={isDeleting}
                  >
                    <X />
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </DeleteModalButton>
                  <DeleteModalButton
                    $variant="danger"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmDeleteJob}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Trash2 />
                        </motion.div>
                        {language === 'vi' ? 'Đang xóa...' : 'Deleting...'}
                      </>
                    ) : (
                      <>
                        <Trash2 />
                        {language === 'vi' ? 'Xóa bài đăng' : 'Delete Post'}
                      </>
                    )}
                  </DeleteModalButton>
                </DeleteModalActions>
              </DeleteModalContainer>
            </DeleteModalOverlay>
          )}

          {showSuccessToast && (
            <SuccessToast
              initial={{ opacity: 0, y: -20, x: 100 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
            >
              <CheckCircle />
              {successToastMessage}
            </SuccessToast>
          )}
        </AnimatePresence>

        {/* Reject CV Confirmation Modal */}
        <AnimatePresence>
          {showRejectModal && rejectStaff && (
            <DeleteModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowRejectModal(false);
                setRejectStaff(null);
              }}
            >
              <DeleteModalContainer
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <DeleteModalIcon>
                  <XCircle />
                </DeleteModalIcon>
                <DeleteModalTitle>
                  {language === 'vi' ? 'Xác nhận từ chối CV' : 'Confirm Reject CV'}
                </DeleteModalTitle>
                <DeleteModalMessage>
                  {language === 'vi'
                    ? 'Bạn có chắc chắn muốn từ chối CV của ứng viên này? Hành động này không thể hoàn tác.'
                    : 'Are you sure you want to reject this candidate\'s CV? This action cannot be undone.'}
                </DeleteModalMessage>
                <DeleteModalJobTitle>
                  {rejectStaff.name} - {rejectStaff.position}
                </DeleteModalJobTitle>
                <DeleteModalActions>
                  <DeleteModalButton
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectStaff(null);
                    }}
                  >
                    <X />
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </DeleteModalButton>
                  <DeleteModalButton
                    $variant="danger"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRejectCV}
                  >
                    <XCircle />
                    {language === 'vi' ? 'Từ chối CV' : 'Reject CV'}
                  </DeleteModalButton>
                </DeleteModalActions>
              </DeleteModalContainer>
            </DeleteModalOverlay>
          )}
        </AnimatePresence>

        {/* Error Notification */}
        <AnimatePresence>
          {showErrorNotification && (
            <ErrorNotification
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <AlertCircle />
              <div className="error-content">
                <div className="error-title">
                  {language === 'vi' ? 'Có lỗi xảy ra' : 'Error Occurred'}
                </div>
                <div className="error-message">
                  {errorNotificationMessage}
                </div>
              </div>
            </ErrorNotification>
          )}
        </AnimatePresence>

        {/* View Job Modal */}
        {selectedJobView && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedJobView(null)}
            title={language === 'vi' ? 'Chi tiết bài đăng' : 'Job Post Details'}
            size="large"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Header with Title and Urgent Badge */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', flex: 1, margin: 0 }}>
                    {selectedJobView.title}
                  </h3>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                    border: '2px solid #EF4444',
                    borderRadius: '100px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#991B1B',
                    whiteSpace: 'nowrap'
                  }}>
                    <Zap size={14} style={{ color: '#EF4444' }} />
                    {language === 'vi' ? 'Tuyển gấp' : 'Urgent'}
                  </div>
                </div>

                {/* Meta Information Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #BFDBFE'
                    }}>
                      <MapPin size={18} style={{ color: '#1e40af' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600', marginBottom: '2px' }}>
                        {language === 'vi' ? 'Địa điểm' : 'Location'}
                      </div>
                      <div style={{ fontWeight: '600', color: '#334155' }}>{selectedJobView.location}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#F0FDF4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #BBF7D0'
                    }}>
                      <Banknote size={18} style={{ color: '#16A34A' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600', marginBottom: '2px' }}>
                        {language === 'vi' ? 'Mức lương' : 'Salary'}
                      </div>
                      <div style={{ fontWeight: '700', color: '#16A34A' }}>{selectedJobView.salary}</div>
                    </div>
                  </div>

                  {selectedJobView.shift && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: '#FEF3C7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #FDE047'
                      }}>
                        <Clock size={18} style={{ color: '#CA8A04' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600', marginBottom: '2px' }}>
                          {language === 'vi' ? 'Giờ làm' : 'Working Hours'}
                        </div>
                        <div style={{ fontWeight: '600', color: '#334155' }}>{selectedJobView.shift}</div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#FCE7F3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #FBCFE8'
                    }}>
                      <Calendar size={18} style={{ color: '#BE185D' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600', marginBottom: '2px' }}>
                        {language === 'vi' ? 'Ngày làm' : 'Work Date'}
                      </div>
                      <div style={{ fontWeight: '600', color: '#334155' }}>{selectedJobView.deadline}</div>
                    </div>
                  </div>

                  {selectedJobView.contactPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px', gridColumn: 'span 2' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: '#E0E7FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #C7D2FE'
                      }}>
                        <Phone size={18} style={{ color: '#4F46E5' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600', marginBottom: '2px' }}>
                          {language === 'vi' ? 'Liên hệ' : 'Contact'}
                        </div>
                        <div style={{ fontWeight: '600', color: '#334155' }}>{selectedJobView.contactPhone}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description Section */}
              {selectedJobView.description && (
                <div style={{
                  padding: '20px',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #E2E8F0'
                  }}>
                    <FileText size={18} style={{ color: '#1e40af' }} />
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                      {language === 'vi' ? 'Mô tả công việc' : 'Job Description'}
                    </h4>
                  </div>
                  <p style={{
                    fontSize: '14px',
                    lineHeight: '1.8',
                    color: '#475569',
                    whiteSpace: 'pre-wrap',
                    margin: 0
                  }}>
                    {selectedJobView.description}
                  </p>
                </div>
              )}

              {/* Requirements Section */}
              {selectedJobView.requirements && (
                <div style={{
                  padding: '20px',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #E2E8F0'
                  }}>
                    <Briefcase size={18} style={{ color: '#1e40af' }} />
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                      {language === 'vi' ? 'Yêu cầu công việc' : 'Job Requirements'}
                    </h4>
                  </div>
                  <p style={{
                    fontSize: '14px',
                    lineHeight: '1.8',
                    color: '#475569',
                    whiteSpace: 'pre-wrap',
                    margin: 0
                  }}>
                    {selectedJobView.requirements}
                  </p>
                </div>
              )}

              {/* Custom fields - employer-defined extra JD sections */}
              {Array.isArray(selectedJobView.customFields) && selectedJobView.customFields
                .filter(f => f && (f.label || f.value))
                .map((field, idx) => (
                  <div key={idx} style={{
                    padding: '20px',
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                      paddingBottom: '12px',
                      borderBottom: '2px solid #E2E8F0'
                    }}>
                      <FileText size={18} style={{ color: '#1e40af' }} />
                      <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                        {field.label}
                      </h4>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      lineHeight: '1.8',
                      color: '#475569',
                      whiteSpace: 'pre-wrap',
                      margin: 0
                    }}>
                      {field.value}
                    </p>
                  </div>
                ))}

              {/* Stats Section */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                padding: '24px',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                borderRadius: '12px',
                border: '2px solid #BFDBFE'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <Users size={20} style={{ color: '#1e40af' }} />
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e40af' }}>
                      {selectedJobView.applicants}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: '600' }}>
                    {language === 'vi' ? 'Ứng viên' : 'Applicants'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <Eye size={20} style={{ color: '#1e40af' }} />
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e40af' }}>
                      {selectedJobView.views}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: '600' }}>
                    {language === 'vi' ? 'Lượt xem' : 'Views'}
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Edit Job Modal */}
        {editJobId && editJobData && (
          <Modal
            isOpen={true}
            onClose={handleCancelEdit}
            title={language === 'vi' ? 'Chỉnh sửa bài đăng' : 'Edit Job Post'}
            size="large"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Error Banner */}
              <AnimatePresence>
                {showErrorNotification && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                      border: '2px solid #EF4444',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}
                  >
                    <AlertCircle style={{ width: '24px', height: '24px', color: '#DC2626', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#991B1B', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                        {language === 'vi' ? 'Có lỗi xảy ra' : 'Error Occurred'}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#B91C1C', lineHeight: '1.4', whiteSpace: 'nowrap' }}>
                        {errorNotificationMessage}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                  {language === 'vi' ? 'Tiêu đề' : 'Title'}
                </label>
                <input
                  type="text"
                  value={editJobData.title || ''}
                  onChange={(e) => setEditJobData({ ...editJobData, title: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                    {language === 'vi' ? 'Địa điểm' : 'Location'}
                  </label>
                  <input
                    type="text"
                    value={editJobData.location || ''}
                    onChange={(e) => setEditJobData({ ...editJobData, location: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                    {language === 'vi' ? 'Loại hình công việc' : 'Job Type'}
                  </label>
                  <select
                    value={editJobData.jobType || 'part-time'}
                    onChange={(e) => setEditJobData({ ...editJobData, jobType: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', background: 'white' }}
                  >
                    <option value="part-time">{language === 'vi' ? 'Bán thời gian' : 'Part-time'}</option>
                    <option value="full-time">{language === 'vi' ? 'Toàn thời gian' : 'Full-time'}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                    {language === 'vi' ? 'Lương (VNĐ/giờ)' : 'Hourly Rate (VND)'}
                  </label>
                  <input
                    type="number"
                    value={editJobData.hourlyRate || ''}
                    onChange={(e) => {
                      setEditJobData({ ...editJobData, hourlyRate: e.target.value });
                      // Clear error when user starts typing
                      if (showErrorNotification && errorNotificationMessage.includes('Lương') || errorNotificationMessage.includes('Hourly')) {
                        setShowErrorNotification(false);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${editJobData.hourlyRate && parseFloat(editJobData.hourlyRate) < 29500 ? '#EF4444' : '#e2e8f0'}`,
                      borderRadius: '12px',
                      fontSize: '14px',
                      background: editJobData.hourlyRate && parseFloat(editJobData.hourlyRate) < 29500 ? '#FEE2E2' : 'white'
                    }}
                    min="29500"
                  />
                  {editJobData.hourlyRate && parseFloat(editJobData.hourlyRate) < 29500 && (
                    <small style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                      ⚠️ {language === 'vi' ? 'Lương phải lớn hơn hoặc bằng 29.500 VNĐ' : 'Salary must be >= 29,500 VND'}
                    </small>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                    {language === 'vi' ? 'Ngày làm' : 'Work Date'}
                  </label>
                  <input
                    type="date"
                    value={editJobData.workDate || ''}
                    onChange={(e) => setEditJobData({ ...editJobData, workDate: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px' }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                    {language === 'vi' ? 'Giờ bắt đầu' : 'Start Time'}
                  </label>
                  <input
                    type="time"
                    value={editJobData.startTime || ''}
                    onChange={(e) => setEditJobData({ ...editJobData, startTime: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                    {language === 'vi' ? 'Giờ kết thúc' : 'End Time'}
                  </label>
                  <input
                    type="time"
                    value={editJobData.endTime || ''}
                    onChange={(e) => setEditJobData({ ...editJobData, endTime: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                  {language === 'vi' ? 'Mô tả công việc' : 'Job Description'}
                </label>
                <textarea
                  value={editJobData.description || ''}
                  onChange={(e) => setEditJobData({ ...editJobData, description: e.target.value })}
                  rows={4}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', resize: 'vertical' }}
                  placeholder={language === 'vi' ? 'Mô tả ngắn gọn về công việc...' : 'Brief description of the job...'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                  {language === 'vi' ? 'Yêu cầu' : 'Requirements'}
                </label>
                <textarea
                  value={editJobData.requirements || ''}
                  onChange={(e) => setEditJobData({ ...editJobData, requirements: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', resize: 'vertical' }}
                  placeholder={language === 'vi' ? 'Liệt kê các yêu cầu cần thiết...' : 'List necessary requirements...'}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancelEdit}
                  style={{ padding: '12px 24px', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'white', color: '#334155', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveEdit}
                  style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Save size={16} />
                  {language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}
                </motion.button>
              </div>
            </div>
          </Modal>
        )}

        {/* Staff Profile Modal */}
        {selectedStaff && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedStaff(null)}
            size="large"
            noPadding={true}
          >
            <StaffProfileModal
              staff={selectedStaff}
              onClose={() => setSelectedStaff(null)}
            />
          </Modal>
        )}

        {/* CV Preview Modal */}
        {showCVPreview && selectedCV && (
          <CVPreviewModal
            cvUrl={selectedCV.url}
            fileName={selectedCV.filename}
            onClose={() => {
              setShowCVPreview(false);
              setSelectedCV(null);
            }}
            onGetFreshUrl={async () => {
              try {
                if (!selectedCV.jobId) return null;
                const freshApps = await applicationService.getJobApplications(selectedCV.jobId);
                const match = freshApps.find(a => a.applicationId === selectedCV.applicationId);
                if (match?.cvUrl) {
                  setSelectedCV(prev => prev ? { ...prev, url: match.cvUrl } : prev);
                  return match.cvUrl;
                }
              } catch (e) {
                console.warn('Could not refresh CV URL in HRManagement:', e);
              }
              return null;
            }}
            onDownload={async () => {
              try {
                const response = await fetch(selectedCV.url);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = selectedCV.filename || 'CV.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                console.error('Error downloading CV:', error);
              }
            }}
          />
        )}

        {/* AI Candidate Recommendations Modal */}
        {showRecommendationsModal && recommendingJob && (
          <Modal
            isOpen={true}
            onClose={() => setShowRecommendationsModal(false)}
            noPadding={true}
            size="large"
          >
            <RecommendationModalHeader>
              <h2>
                <Sparkles />
                {language === 'vi' ? 'Gợi ý ứng viên phù hợp bằng AI' : 'AI Candidate Recommendations'}
              </h2>
              <p>
                {language === 'vi' ? 'Dành cho vị trí:' : 'For position:'} {recommendingJob.title}
              </p>
            </RecommendationModalHeader>

            {isLoadingRecommendations ? (
              <RecommendationsLoadingContainer>
                <PulseAILogo
                  animate={{
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      "0 12px 32px rgba(124, 58, 237, 0.35)",
                      "0 12px 48px rgba(124, 58, 237, 0.6)",
                      "0 12px 32px rgba(124, 58, 237, 0.35)"
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles />
                </PulseAILogo>
                <LoadingText>
                  {language === 'vi' ? 'Đang phân tích và tìm ứng viên phù hợp nhất...' : 'Analyzing and scanning for the best candidates...'}
                </LoadingText>
              </RecommendationsLoadingContainer>
            ) : recommendationError ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#ef4444' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#ef4444' }} />
                <p style={{ fontWeight: '600', marginBottom: '16px' }}>{recommendationError}</p>
                <ActionButton
                  onClick={() => handleRecommendCandidates(recommendingJob)}
                  style={{ margin: '0 auto' }}
                >
                  {language === 'vi' ? 'Thử lại' : 'Retry'}
                </ActionButton>
              </div>
            ) : recommendations.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                  {language === 'vi' ? 'Không tìm thấy ứng viên phù hợp' : 'No suitable candidates found'}
                </h3>
                <p style={{ fontSize: '14px' }}>
                  {language === 'vi' ? 'Không có ứng viên nào đã kích hoạt dịch vụ tuyển gấp đạt tiêu chuẩn phù hợp với công việc.' : 'No urgent-activated candidates match the criteria for this job.'}
                </p>
              </div>
            ) : (
              <RecommendationList>
                {recommendations.map((rec, idx) => (
                  <RecommendationCard
                    key={rec.candidateId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <RecommendationCardHeader>
                      <RecommendationCandidateName>{rec.fullName}</RecommendationCandidateName>
                      <MatchScoreBadge $score={rec.matchScore}>
                        <Sparkles size={14} />
                        {rec.matchScore}%
                      </MatchScoreBadge>
                    </RecommendationCardHeader>

                    <ScoreProgressContainer>
                      <ScoreProgressBar $width={rec.matchScore} $score={rec.matchScore} />
                    </ScoreProgressContainer>

                    <RecommendationReason>{rec.matchReason}</RecommendationReason>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <ActionButton
                        onClick={() => {
                          handleViewProfile({
                            id: rec.candidateId,
                            candidateId: rec.candidateId,
                            candidate: rec.fullName,
                            job: recommendingJob.title,
                            applied: '-',
                            status: 'pending',
                            email: '',
                            phone: '-',
                            location: '-',
                            education: '-',
                            experience: '-',
                            skills: [],
                            bio: '-',
                            reviews: [],
                            marked: false
                          });
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                          boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                          margin: 0
                        }}
                      >
                        <Eye />
                        {language === 'vi' ? 'Xem hồ sơ ứng viên' : 'View Candidate Profile'}
                      </ActionButton>
                    </div>
                  </RecommendationCard>
                ))}
              </RecommendationList>
            )}
          </Modal>
        )}

        {selectedCandidate && (
          <Modal
            isOpen={true}
            onClose={handleCloseProfile}
            size="large"
            noPadding={true}
          >
            <ProfileDetailModal
              candidate={selectedCandidate}
              onClose={handleCloseProfile}
              isLoading={isFetchingProfile}
            />
          </Modal>
        )}
      </PageContainer>

      {/* ── Wallet Terms Modal đã được chuyển thành inline terms trong trang intro ── */}
    </DashboardLayout>
  );
};

// Profile Detail Modal Component
const ProfileDetailModal = React.memo(({ candidate, onClose, isLoading }) => {
  const { language } = useLanguage();

  const initials = candidate.candidate
    ? candidate.candidate
        .split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : 'CN';

  const avgRating = candidate.reviews && candidate.reviews.length > 0
    ? (candidate.reviews.reduce((s, r) => s + r.rating, 0) / candidate.reviews.length)
    : null;

  return (
    <>
      <ProfileHeader>
        <ProfileAvatarRow>
          <ProfileAvatar>
            {candidate.profileImage ? (
              <img src={candidate.profileImage} alt={candidate.candidate} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : initials}
          </ProfileAvatar>
          <ProfileHeaderInfo>
            <h2>{candidate.candidate}</h2>
            <ProfileJobBadge>
              <Briefcase />
              {language === 'vi' ? 'Ứng tuyển:' : 'Applied for:'} {candidate.job}
            </ProfileJobBadge>
            {avgRating !== null && (
              <HeaderRatingBadge>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} className="star-char" style={{ color: i <= Math.round(avgRating) ? '#FCD34D' : 'rgba(255,255,255,0.25)' }}>★</span>
                  ))}
                </div>
                <span className="rating-text">{avgRating.toFixed(1)}/5</span>
                <span className="count-text">({candidate.reviews.length} {language === 'vi' ? 'đánh giá' : 'reviews'})</span>
              </HeaderRatingBadge>
            )}
          </ProfileHeaderInfo>
        </ProfileAvatarRow>
      </ProfileHeader>

      <ProfileContent>
        <ProfileInner>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ display: 'inline-block', marginBottom: '12px' }}
              >
                <Clock size={24} />
              </motion.div>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                {language === 'vi' ? 'Đang tải thông tin chi tiết...' : 'Loading candidate details...'}
              </p>
            </div>
          ) : (
            <>
              {/* Contact Info */}
              <ProfileSection>
                <h3><FileText /> {language === 'vi' ? 'Thông tin liên hệ' : 'Contact'}</h3>
                <InfoGrid>
                  <InfoCard>
                    <InfoIconBox><Mail /></InfoIconBox>
                    <InfoItem>
                      <div className="label">{language === 'vi' ? 'Email' : 'Email'}</div>
                      <div className="value">{candidate.candidateEmail || candidate.email || '---'}</div>
                    </InfoItem>
                  </InfoCard>
                  <InfoCard>
                    <InfoIconBox><Phone /></InfoIconBox>
                    <InfoItem>
                      <div className="label">{language === 'vi' ? 'Điện thoại' : 'Phone'}</div>
                      <div className="value">{candidate.phone && candidate.phone !== '-' ? candidate.phone : (language === 'vi' ? 'Chưa cập nhật' : 'Not updated')}</div>
                    </InfoItem>
                  </InfoCard>
                  <InfoCard>
                    <InfoIconBox><MapPin /></InfoIconBox>
                    <InfoItem>
                      <div className="label">{language === 'vi' ? 'Địa điểm' : 'Location'}</div>
                      <div className="value">{candidate.location && candidate.location !== '-' ? candidate.location : (language === 'vi' ? 'Chưa cập nhật' : 'Not updated')}</div>
                    </InfoItem>
                  </InfoCard>
                </InfoGrid>
              </ProfileSection>

              {/* Education & Experience */}
              <ProfileSection>
                <h3><Award /> {language === 'vi' ? 'Học vấn & Kinh nghiệm' : 'Education & Experience'}</h3>
                <InfoGrid>
                  <InfoCard>
                    <InfoIconBox><Award /></InfoIconBox>
                    <InfoItem>
                      <div className="label">{language === 'vi' ? 'Trình độ học vấn' : 'Education'}</div>
                      <div className="value">{candidate.education && candidate.education !== '-' ? candidate.education : (language === 'vi' ? 'Chưa cập nhật' : 'Not updated')}</div>
                    </InfoItem>
                  </InfoCard>
                  <InfoCard>
                    <InfoIconBox><Briefcase /></InfoIconBox>
                    <InfoItem>
                      <div className="label">{language === 'vi' ? 'Kinh nghiệm' : 'Experience'}</div>
                      <div className="value">{candidate.experience && candidate.experience !== '-' ? candidate.experience : (language === 'vi' ? 'Chưa cập nhật' : 'Not updated')}</div>
                    </InfoItem>
                  </InfoCard>
                </InfoGrid>
              </ProfileSection>

              {/* Skills */}
              {(candidate.skills && candidate.skills.length > 0) && (
                <ProfileSection>
                  <h3><Star /> {language === 'vi' ? 'Kỹ năng' : 'Skills'}</h3>
                  <SkillsWrap>
                    {candidate.skills.map((skill, index) => (
                      <SkillTag key={index}>{skill}</SkillTag>
                    ))}
                  </SkillsWrap>
                </ProfileSection>
              )}

              {/* Bio */}
              {(candidate.bio && candidate.bio !== '-') && (
                <ProfileSection>
                  <h3><FileText /> {language === 'vi' ? 'Giới thiệu bản thân' : 'About'}</h3>
                  <BioText>{candidate.bio}</BioText>
                </ProfileSection>
              )}

              {/* Lịch sử việc làm */}
              <ProfileSection>
                <h3><Briefcase /> {language === 'vi' ? 'Lịch sử việc làm' : 'Employment History'}</h3>
                {candidate.workHistory && candidate.workHistory.length > 0 ? (
                  <WorkHistoryList>
                    {candidate.workHistory.map((item, idx) => (
                      <WorkHistoryCard key={item.id || idx}>
                        <WorkHistoryHeader>
                          <WorkHistoryInfo>
                            <div className="job-title">{item.jobTitle}</div>
                            <div className="company-date">
                              <span>{item.companyName}</span>
                              <span>•</span>
                              <span>
                                {new Date(item.completedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </WorkHistoryInfo>
                        </WorkHistoryHeader>
                        {item.employerRating && (
                          <div style={{ marginTop: '10px' }}>
                            <StarRating rating={item.employerRating.overall} />
                            {item.employerRating.comment && (
                              <p style={{ fontSize: '13px', fontStyle: 'italic', margin: '6px 0 0 0', color: '#475569' }}>
                                "{item.employerRating.comment}"
                              </p>
                            )}
                          </div>
                        )}
                      </WorkHistoryCard>
                    ))}
                  </WorkHistoryList>
                ) : (
                  <EmptyWorkHistory>
                    <div className="icon">💼</div>
                    <p>{language === 'vi' ? 'Chưa có lịch sử làm việc nào.' : 'No work history available.'}</p>
                  </EmptyWorkHistory>
                )}
              </ProfileSection>
            </>
          )}
        </ProfileInner>
      </ProfileContent>
    </>
  );
});

ProfileDetailModal.displayName = 'ProfileDetailModal';

export default HRManagement;
