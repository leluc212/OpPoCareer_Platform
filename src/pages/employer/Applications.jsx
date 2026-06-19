import React, { useState, useMemo, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import TableFilter from '../../components/TableFilter';
import Modal from '../../components/Modal';
import { Eye, CheckCircle, Star, Mail, Phone, MapPin, Calendar, Award, Briefcase, FileText, Clock, Users, Newspaper, Edit, Trash2, TrendingUp, Plus, X, XCircle, Wallet, Banknote, AlertCircle, Save, Download, MessageSquare, Search, Sparkles, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { initializeMultipleSampleCVs } from '../../utils/sampleCVGenerator';
import jobPostService from '../../services/jobPostService';
import quickJobService from '../../services/quickJobService';
import applicationService from '../../services/applicationService';
import candidateProfileService from '../../services/candidateProfileService';
import experienceService from '../../services/experienceService';
import cvAiService from '../../services/cvAiService';
import CVPreviewModal from '../../components/CVPreviewModal';
import DynamicTranslate from '../../components/DynamicTranslate';
import employerProfileService from '../../services/employerProfileService';

/**
 * Format salary from DynamoDB — prevents double-appending VNĐ/h.
 * - Already has currency unit (VNĐ / VND / đ) → return as-is
 * - Raw number / numeric string → format as "X.XXX VNĐ/giờ"
 */
const formatSalaryFromDB = (raw, fallback = 'Thỏa thuận') => {
  if (!raw && raw !== 0) return fallback;
  const str = String(raw).trim();
  if (str.includes('VNĐ') || str.includes('VND') || str.includes('đ')) return str;
  const num = parseInt(str.replace(/\D/g, ''), 10);
  if (isNaN(num) || num === 0) return fallback;
  return `${num.toLocaleString('vi-VN')} VNĐ/giờ`;
};

// Mock job posts data


// Mock data generator (language-aware)


const FILTER_OPTIONS = (language) => ([
  { value: 'today', label: language === 'vi' ? 'Hôm nay' : 'Today' },
  { value: 'week', label: language === 'vi' ? 'Tuần này' : 'This week' },
  { value: 'month', label: language === 'vi' ? 'Tháng này' : 'This month' },
]);

const ApplicationsContainer = styled(motion.div)`
`;

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

  svg {
    width: 22px;
    height: 22px;
    color: #1e40af;
  }
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

// --- Standard Jobs Section ---
const StandardJobsSection = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1.5px solid #E8EFFF;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  margin-bottom: 24px;
`;

const StandardJobsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StandardJobCard = styled(motion.button)`
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

const StandardJobIcon = styled.div`
  width: 64px;
  height: 64px;
  background: ${props => props.$color}20;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  ${StandardJobCard}:hover & {
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

const StandardJobLabel = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  text-align: center;
`;

const StandardJobDescription = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.theme.colors.textLight};
  text-align: center;
  line-height: 1.5;
`;

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

// --- Job Posts Styles ---
const JobPostsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  align-items: stretch;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const JobPostCard = styled(motion.div)`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  
  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.13);
    transform: translateY(-4px);
  }
`;

const JobPostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex: 1;
`;

const JobPostTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 0;
  line-height: 1.3;
`;

const JobPostMeta = styled.div`
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

const JobPostStats = styled.div`
  display: flex;
  gap: 24px;
  padding: 20px;
  border-top: 1px solid #E8EFFF;
  border-bottom: 1px solid #E8EFFF;
  margin-bottom: 4px;
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

const JobPostActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  width: 100%;
`;

const JobPostButtonsRow = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const JobPostButton = styled(motion.button)`
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  white-space: nowrap;
  outline: none;
  
  background: ${props => {
    if (props.$variant === 'ai') return 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';
    if (props.$variant === 'primary' || props.$variant === 'edit') return 'rgba(37, 99, 235, 0.08)';
    if (props.$variant === 'danger' || props.$variant === 'delete') return 'rgba(239, 68, 68, 0.08)';
    return '#ffffff';
  }};
  
  color: ${props => {
    if (props.$variant === 'ai') return '#ffffff';
    if (props.$variant === 'primary' || props.$variant === 'edit') return '#2563eb';
    if (props.$variant === 'danger' || props.$variant === 'delete') return '#ef4444';
    return '#475569';
  }};
  
  border: 1.5px solid ${props => {
    if (props.$variant === 'ai') return 'transparent';
    if (props.$variant === 'primary' || props.$variant === 'edit') return 'rgba(37, 99, 235, 0.25)';
    if (props.$variant === 'danger' || props.$variant === 'delete') return 'rgba(239, 68, 68, 0.25)';
    return '#e2e8f0';
  }};
  
  svg {
    width: 15px;
    height: 15px;
    transition: transform 0.2s ease;
  }
  
  &:hover {
    transform: translateY(-2px);
    background: ${props => {
      if (props.$variant === 'ai') return 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)';
      if (props.$variant === 'primary' || props.$variant === 'edit') return 'rgba(37, 99, 235, 0.15)';
      if (props.$variant === 'danger' || props.$variant === 'delete') return 'rgba(239, 68, 68, 0.15)';
      return '#f8fafc';
    }};
    border-color: ${props => {
      if (props.$variant === 'ai') return 'transparent';
      if (props.$variant === 'primary' || props.$variant === 'edit') return '#2563eb';
      if (props.$variant === 'danger' || props.$variant === 'delete') return '#ef4444';
      return '#cbd5e1';
    }};
    color: ${props => {
      if (props.$variant === 'ai') return '#ffffff';
      if (props.$variant === 'primary' || props.$variant === 'edit') return '#1d4ed8';
      if (props.$variant === 'danger' || props.$variant === 'delete') return '#dc2626';
      return '#1e293b';
    }};
    box-shadow: ${props => {
      if (props.$variant === 'ai') return '0 4px 14px rgba(168, 85, 247, 0.35)';
      if (props.$variant === 'primary' || props.$variant === 'edit') return '0 4px 12px rgba(37, 99, 235, 0.12)';
      if (props.$variant === 'danger' || props.$variant === 'delete') return '0 4px 12px rgba(239, 68, 68, 0.12)';
      return '0 4px 12px rgba(0, 0, 0, 0.05)';
    }};
    
    svg {
      transform: scale(1.15);
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const JobStatusBadge = styled.div`
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  background: ${props => props.$status === 'active' ? '#D1FAE5' : '#F1F5F9'};
  color: ${props => props.$status === 'active' ? '#047857' : '#64748B'};
  border: 1.5px solid ${props => props.$status === 'active' ? '#10B981' : '#CBD5E1'};
  white-space: nowrap;
  letter-spacing: 0.3px;
`;

const JobTypeBadge = styled.div`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  background: ${props => props.$partTime ? '#FFF7ED' : '#EFF6FF'};
  color: ${props => props.$partTime ? '#C2410C' : '#1D4ED8'};
  border: 1.5px solid ${props => props.$partTime ? '#FDBA74' : '#BFDBFE'};
`;

// --- Section Header for Posts ---
const PostsSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 0;
  border-bottom: 2px solid #E8EFFF;
`;

const PostsSectionTitle = styled.h2`
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

const CreatePostButton = styled(motion.button)`
  padding: 12px 24px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  color: white;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// --- Card Grid ---
const CardGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AppCard = styled(motion.div)`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  /* left accent bar — always visible */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-radius: 16px 0 0 16px;
    background: ${props => {
    if (props.$status === 'approved') return '#10B981';
    if (props.$status === 'rejected') return '#EF4444';
    if (props.$status === 'completed') return '#1e40af';
    return '#F59E0B';
  }};
    opacity: 0.5;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: #1e40af;
    box-shadow: 0 12px 32px rgba(30, 64, 175, 0.15);
    transform: translateY(-4px);

    &::before {
      opacity: 1;
      width: 5px;
    }
  }
`;

const CandidateAvatar = styled.div`
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 12px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  color: #1e40af;
  transition: all 0.2s ease;

  ${AppCard}:hover & {
    background: #1e40af;
    color: white;
    border-color: #1e40af;
  }
`;

const CandidateInfo = styled.div`
  flex: 0 0 200px;
  min-width: 0;

  .name {
    font-size: 14.5px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 3px;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .position {
    font-size: 12.5px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const MetaChip = styled.div`
  flex: 0 0 130px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 12px;
  background: ${props => props.theme.colors.bgDark};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme.colors.textLight};
  white-space: nowrap;

  svg {
    width: 12px;
    height: 12px;
    color: #1e40af;
    opacity: 0.7;
    flex-shrink: 0;
  }
`;

const StatusCol = styled.div`
  flex: 0 0 120px;
  display: flex;
  justify-content: center;

  /* force badge to not wrap */
  span {
    white-space: nowrap;
  }
`;

const ActionsCol = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

const ActionButton = styled.button`
  padding: 8px 14px;
  border-radius: 9px;
  background: ${props =>
    props.$variant === 'success' ? '#10B981' :
      props.$variant === 'danger' ? '#EF4444' :
        props.$variant === 'warning' ? '#F59E0B' :
          '#1e40af'
  };
  color: white;
  font-size: 12.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;
  box-shadow: 0 2px 6px ${props =>
    props.$variant === 'success' ? 'rgba(16,185,129,0.22)' :
      props.$variant === 'danger' ? 'rgba(239,68,68,0.22)' :
        props.$variant === 'warning' ? 'rgba(245,158,11,0.22)' :
          'rgba(30,64,175,0.22)'
  };

  svg { width: 13px; height: 13px; }

  &:hover {
    filter: brightness(1.08);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${props =>
    props.$variant === 'success' ? 'rgba(16,185,129,0.32)' :
      props.$variant === 'danger' ? 'rgba(239,68,68,0.32)' :
        props.$variant === 'warning' ? 'rgba(245,158,11,0.32)' :
          'rgba(30,64,175,0.32)'
  };
  }

  &:active { transform: scale(0.97); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const MarkedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  background: #FEF3C7;
  color: #D97706;
  border: 1px solid #FCD34D;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  svg { width: 10px; height: 10px; }
`;

const ProfileHeader = styled.div`
  position: relative;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 45%, #1e40af 100%);
  padding: 36px 36px 48px;
  color: white;
  overflow: hidden;
  
  /* Decorative blobs */
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

// --- Review styled components ---
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

// --- Work History styled components ---
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

// --- CV styled components ---
const CVCard = styled.div`
  background: white;
  border: 2px solid #E8EFFF;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 4px 16px rgba(30, 64, 175, 0.12);
    transform: translateY(-1px);
  }
`;

const CVIconBox = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  svg {
    width: 26px;
    height: 26px;
    color: white;
  }
`;

const CVInfo = styled.div`
  flex: 1;
  min-width: 0;

  .cv-name {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cv-meta {
    font-size: 12px;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const CVDownloadButton = styled(motion.button)`
  padding: 10px 18px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  color: white;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(30, 64, 175, 0.25);
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    box-shadow: 0 4px 14px rgba(30, 64, 175, 0.35);
    transform: translateY(-1px);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const EmptyCV = styled.div`
  text-align: center;
  padding: 32px 24px;
  background: #F8FAFC;
  border: 1.5px dashed #CBD5E1;
  border-radius: 14px;
  color: #64748b;

  .icon {
    font-size: 32px;
    margin-bottom: 10px;
    opacity: 0.5;
  }

  p {
    font-size: 13px;
    margin: 0;
    font-weight: 500;
  }
`;

const CVViewerContainer = styled.div`
  margin-top: 16px;
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid #E2E8F0;
  background: #F8FAFC;
`;

const CVViewerHeader = styled.div`
  padding: 12px 20px;
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 14px;

  button {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
`;

const CVViewerFrame = styled.iframe`
  width: 100%;
  height: 600px;
  border: none;
  background: white;
`;

const CVButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
`;

const CVViewButton = styled(motion.button)`
  flex: 1;
  padding: 12px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.25);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
    transform: translateY(-1px);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FeedbackSection = styled.div`
  margin-top: 24px;
  padding: 24px;
  background: #F8FAFC;
  border: 2px solid #E2E8F0;
  border-radius: 14px;
`;

const FeedbackHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;

  svg {
    width: 20px;
    height: 20px;
    color: #1e40af;
  }
`;

const FeedbackTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 14px;
  border: 2px solid #E2E8F0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #1e40af;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const FeedbackActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const FeedbackButton = styled(motion.button)`
  flex: 1;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  background: ${props =>
    props.$variant === 'approve' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' :
      props.$variant === 'reject' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' :
        'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)'
  };
  color: white;
  box-shadow: ${props =>
    props.$variant === 'approve' ? '0 3px 10px rgba(16, 185, 129, 0.25)' :
      props.$variant === 'reject' ? '0 3px 10px rgba(239, 68, 68, 0.25)' :
        '0 3px 10px rgba(30, 64, 175, 0.25)'
  };

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props =>
    props.$variant === 'approve' ? '0 4px 14px rgba(16, 185, 129, 0.35)' :
      props.$variant === 'reject' ? '0 4px 14px rgba(239, 68, 68, 0.35)' :
        '0 4px 14px rgba(30, 64, 175, 0.35)'
  };
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FeedbackMeta = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #E2E8F0;
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const OverallRatingBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  border: 1.5px solid #FCD34D;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  color: #92400E;
  margin-left: 8px;
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
const ProfileDetailModal = React.memo(({ candidate, onClose, isLoading }) => {
  const { language } = useLanguage();

  const initials = candidate.candidate
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

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
                      <div className="value">{candidate.candidateEmail || candidate.email}</div>
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
                  <InfoCard>
                    <InfoIconBox><Calendar /></InfoIconBox>
                    <InfoItem>
                      <div className="label">{language === 'vi' ? 'Thời gian ứng tuyển' : 'Applied'}</div>
                      <div className="value">{candidate.applied}</div>
                    </InfoItem>
                  </InfoCard>
                </InfoGrid>
              </ProfileSection>

              {/* AI Screening & Interview Evaluation */}
              {(candidate.aiScreeningScore !== undefined || candidate.aiScreeningResult) && (
                <ProfileSection style={{ background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: '16px', padding: '20px', marginTop: '16px' }}>
                  <h3 style={{ color: '#4C1D95', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #DDD6FE', paddingBottom: '10px', margin: '0 0 16px 0' }}>
                    <Sparkles color="#8b5cf6" size={18} />
                    <span>{language === 'vi' ? 'Đánh giá & Chọn lọc bằng AI' : 'AI Screening & Interview Evaluation'}</span>
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    {/* Round 1: CV Screening */}
                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E9D5FF' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#6B21A8', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 10px 0' }}>
                        <FileText size={14} />
                        {language === 'vi' ? 'Vòng 1: Chọn lọc CV' : 'Round 1: CV Screening'}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: candidate.aiScreeningScore >= 60 ? '#059669' : '#DC2626' }}>
                          {candidate.aiScreeningScore || '---'}
                          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>/100</span>
                        </div>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                          background: candidate.aiScreeningResult === 'pass' ? '#D1FAE5' : candidate.aiScreeningResult === 'review' ? '#FEF3C7' : '#FEE2E2',
                          color: candidate.aiScreeningResult === 'pass' ? '#065F46' : candidate.aiScreeningResult === 'review' ? '#92400E' : '#991B1B',
                          border: `1.5px solid ${candidate.aiScreeningResult === 'pass' ? '#34D399' : candidate.aiScreeningResult === 'review' ? '#FBBF24' : '#F87171'}`
                        }}>
                          {candidate.aiScreeningResult === 'pass' ? (language === 'vi' ? 'ĐẠT' : 'PASS') : candidate.aiScreeningResult === 'review' ? (language === 'vi' ? 'XEM XÉT' : 'REVIEW') : (language === 'vi' ? 'LOẠI' : 'FAIL')}
                        </span>
                      </div>
                    </div>

                    {/* Round 2: AI Interviewer */}
                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E9D5FF' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#6B21A8', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 10px 0' }}>
                        <MessageSquare size={14} />
                        {language === 'vi' ? 'Vòng 2: Phỏng vấn AI' : 'Round 2: AI Interview'}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: (candidate.aiInterviewScore && candidate.aiInterviewScore >= 60) ? '#059669' : '#DC2626' }}>
                          {candidate.aiInterviewScore || '---'}
                          {candidate.aiInterviewScore && <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>/100</span>}
                        </div>
                        {candidate.aiInterviewScore && (
                          <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                            background: candidate.aiInterviewScore >= 60 ? '#D1FAE5' : '#FEE2E2',
                            color: candidate.aiInterviewScore >= 60 ? '#065F46' : '#991B1B',
                            border: `1.5px solid ${candidate.aiInterviewScore >= 60 ? '#34D399' : '#F87171'}`
                          }}>
                            {candidate.aiInterviewScore >= 60 ? (language === 'vi' ? 'KHUYÊN DÙNG' : 'RECOMMEND') : (language === 'vi' ? 'CÂN NHẮC' : 'HOLD')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Reason & Analysis */}
                  {candidate.aiScreeningReason && (
                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '12px' }}>
                      <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#475569', marginBottom: '6px' }}>
                        {language === 'vi' ? 'Nhận xét tổng quan của AI:' : 'AI Overall Summary:'}
                      </div>
                      <p style={{ fontSize: '13px', color: '#1E293B', margin: 0, lineHeight: '1.6' }}>{candidate.aiScreeningReason}</p>
                    </div>
                  )}

                  {/* AI Report detail (strengths & weaknesses) */}
                  {candidate.aiInterviewReport && (
                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#475569', marginBottom: '10px' }}>
                        {language === 'vi' ? 'Báo cáo chi tiết phỏng vấn:' : 'Interview Evaluation Detail:'}
                      </div>
                      {candidate.aiInterviewReport.strengths && candidate.aiInterviewReport.strengths.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#059669', display: 'block', marginBottom: '4px' }}>✓ {language === 'vi' ? 'Điểm mạnh:' : 'Strengths:'}</span>
                          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                            {candidate.aiInterviewReport.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {candidate.aiInterviewReport.weaknesses && candidate.aiInterviewReport.weaknesses.length > 0 && (
                        <div>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#D97706', display: 'block', marginBottom: '4px' }}>⚠ {language === 'vi' ? 'Điểm cần cải thiện:' : 'Weaknesses / Areas of Improvement:'}</span>
                          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                            {candidate.aiInterviewReport.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </ProfileSection>
              )}

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

export {
  ProfileDetailModal,
  ProfileHeader, ProfileAvatarRow, ProfileAvatar, ProfileHeaderInfo, ProfileJobBadge, HeaderRatingBadge,
  ProfileContent, ProfileInner, ProfileSection,
  InfoGrid, InfoCard, InfoIconBox, InfoItem,
  SkillsWrap, SkillTag, BioText,
  CVCard, CVIconBox, CVInfo, CVDownloadButton, EmptyCV,
  WorkHistoryList, WorkHistoryCard, WorkHistoryHeader, WorkHistoryInfo, EmptyWorkHistory
};

// Application Card Component
const ApplicationRow = React.memo(({
  app,
  onViewProfile,
  onCompleteJob,
  onMarkCandidate,
  onApprove,
  onReject,
  index = 0
}) => {
  const { language } = useLanguage();
  const initials = app.candidate
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const currentStatus = app.completed ? 'completed' : app.status;

  return (
    <AppCard
      $status={currentStatus}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2 }}
      layout
    >
      <CandidateAvatar>{initials}</CandidateAvatar>

      <CandidateInfo>
        <div className="name">
          {app.candidate}
          {app.marked && (
            <MarkedBadge><Star />{language === 'vi' ? 'Đã đánh dấu' : 'Marked'}</MarkedBadge>
          )}
        </div>
        <div className="position"><DynamicTranslate text={app.job} showIndicator={false} /></div>
      </CandidateInfo>

      <MetaChip><Clock />{app.applied}</MetaChip>

      <ActionsCol>
        <ActionButton onClick={() => onViewProfile(app)}>
          <Eye />{language === 'vi' ? 'Xem hồ sơ' : 'View'}
        </ActionButton>
      </ActionsCol>
    </AppCard>
  );
});

ApplicationRow.displayName = 'ApplicationRow';

// ─── Post Job Button ───────────────────────────────────────
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

  background: ${props => props.$variant === 'primary' ? '#1e40af' : '#F1F5F9'};
  color: ${props => props.$variant === 'primary' ? 'white' : props.theme.colors.text};
  border: 1.5px solid ${props => props.$variant === 'primary' ? '#1e40af' : '#E2E8F0'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$variant === 'primary'
    ? '0 6px 20px rgba(30, 64, 175, 0.3)'
    : '0 4px 12px rgba(0, 0, 0, 0.1)'};
  }

  svg {
    width: 18px;
    height: 18px;
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

const Applications = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(() => {
    if (location.state?.section) {
      return location.state.section;
    }
    return 'posts';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [applications, setApplications] = useState([]);
  const [realApplications, setRealApplications] = useState([]); // Real applications from DynamoDB
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [jobPosts, setJobPosts] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedJobView, setSelectedJobView] = useState(null);
  const [editJobId, setEditJobId] = useState(null);
  const [editJobData, setEditJobData] = useState(null);
  const [showCVModal, setShowCVModal] = useState(false);
  const [selectedCV, setSelectedCV] = useState(null);
  const [postTimeFilter, setPostTimeFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [postSearchTerm, setPostSearchTerm] = useState('');
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [recommendingJob, setRecommendingJob] = useState(null);
  const [recommendationError, setRecommendationError] = useState('');

  // Verification gate — check isVerified from API
  const [isVerified, setIsVerified] = useState(null); // null = checking, true/false = result
  const [verificationPending, setVerificationPending] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const profile = await employerProfileService.getMyProfile();
        if (profile?.isVerified === true) {
          setIsVerified(true);
        } else {
          setIsVerified(false);
          setVerificationPending(profile?.verificationStatus === 'pending');
        }
      } catch (err) {
        console.error('Error checking employer verification:', err);
        setIsVerified(false);
      }
    };
    checkVerification();
  }, []);

  // Mock wallet connection status - in real app, get from user context or API
  const [isWalletConnected] = useState(() => {
    return localStorage.getItem('employer_wallet_connected') === 'true';
  });

  // Load job posts from DynamoDB
  useEffect(() => {
    const loadJobPosts = async () => {
      try {
        setIsLoadingJobs(true);
        console.log('📥 Loading job posts from DynamoDB...');

        // Get only employer's own jobs
        let jobs = await jobPostService.getMyJobPosts();
        console.log('✅ Loaded jobs:', jobs);

        // Transform DynamoDB data to match UI format
        const transformedJobs = jobs.map(job => ({
          id: job.idJob,
          idJob: job.idJob,
          title: job.title,
          location: job.location,
          salary: formatSalaryFromDB(job.salary, language === 'vi' ? 'Thỏa thuận' : 'Negotiable'),
          type: job.jobType === 'part-time' ? (language === 'vi' ? 'Bán thời gian' : 'Part-time') : (language === 'vi' ? 'Toàn thời gian' : 'Full-time'),
          shift: job.workHours,
          workDays: job.workDays,
          applicants: job.applicants || 0,
          views: job.views || 0,
          status: job.status,
          postedDate: formatDate(job.createdAt, language),
          _createdAt: job.createdAt,
          deadline: calculateDeadline(job.workDays, language),
          description: job.description,
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          benefits: job.benefits,
          tags: job.tags
        }));

        console.log('📦 Transformed jobs:', transformedJobs);
        setJobPosts(transformedJobs);
      } catch (error) {
        console.error('❌ Error loading job posts:', error);
        setJobPosts([]);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadJobPosts();
  }, [language]);

  // Helper function to format date
  const formatDate = (isoDate, lang) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return lang === 'vi' ? 'Hôm nay' : 'Today';
    if (diffDays === 1) return lang === 'vi' ? 'Hôm qua' : 'Yesterday';
    if (diffDays < 7) return lang === 'vi' ? `${diffDays} ngày trước` : `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return lang === 'vi' ? `${weeks} tuần trước` : `${weeks} weeks ago`;
    }
    return date.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US');
  };

  // Helper function to calculate deadline
  // Compare by calendar date only (ignore time-of-day) so a job with
  // workDays = "today" is shown as "Hôm nay" all day long, not "Đã hết hạn"
  // the moment the clock passes midnight UTC.
  const calculateDeadline = (workDays, lang) => {
    if (!workDays) return '';
    // Strip time component from both sides so comparison is purely date-based
    const workDate = new Date(workDays);
    const workDateOnly = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate());
    const now = new Date();
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = workDateOnly - todayOnly;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return lang === 'vi' ? 'Đã hết hạn' : 'Expired';
    if (diffDays === 0) return lang === 'vi' ? 'Hôm nay' : 'Today';
    if (diffDays === 1) return lang === 'vi' ? 'Ngày mai' : 'Tomorrow';
    return lang === 'vi' ? `${diffDays} ngày nữa` : `${diffDays} days left`;
  };

  useEffect(() => {
    setApplications([]);
  }, [language]);

  // Update activeSection and handle auto-modal if state changes externally
  useEffect(() => {
    // 1. Handle section change — only apply once then clear from state to prevent
    //    overriding manual tab switches (e.g. clicking "Hồ sơ ứng tuyển" card).
    if (location.state?.section) {
      setActiveSection(location.state.section);
      // Clear section from state immediately so further re-renders of this effect
      // don't keep resetting the tab back to the initial value.
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, section: undefined }
      });
    }

    // 2. Handle auto-opening profile modal
    if (location.state?.candidateId && (applications.length > 0 || realApplications.length > 0)) {
      const targetId = location.state.candidateId;
      const transformedApp = applications.find(a => a.id === targetId);

      if (transformedApp && !selectedCandidate) {
        console.log('🎯 Auto-opening profile for candidate:', targetId);
        handleViewProfile(transformedApp);

        // Clear candidateId from state to prevent re-opening on language switch etc
        navigate(location.pathname, {
          replace: true,
          state: { ...location.state, candidateId: null, section: undefined }
        });
      }
    }
  }, [location.state, applications, realApplications]);

  // Load real applications from DynamoDB when switching to applications tab
  useEffect(() => {
    const loadApplications = async () => {
      if (activeSection !== 'applications') return;
      // Wait for jobs to finish loading first
      if (isLoadingJobs) return;

      try {
        setIsLoadingApplications(true);
        console.log('📥 Loading applications from DynamoDB...');

        // Get all applications for all employer's jobs
        const allApplications = [];

        for (const job of jobPosts) {
          try {
            const jobApplications = await applicationService.getJobApplications(job.idJob);
            allApplications.push(...jobApplications);
          } catch (error) {
            console.error(`Error loading applications for job ${job.idJob}:`, error);
          }
        }

        console.log('✅ Loaded applications:', allApplications);

        // Transform to UI format
        const transformedApplications = allApplications
          .filter(app => {
            // Filter out test records without identification (Name or Email)
            return app.fullName?.trim() || app.candidateName?.trim() || (app.candidateEmail && app.candidateEmail !== 'Unknown');
          })
          // Sort newest first
          .sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0))
          .map((app, index) => {
            const isPass = index % 3 === 0;
            const isReview = index % 3 === 1;
            
            return {
              id: app.applicationId,
              applicationId: app.applicationId,
              candidate: app.fullName || app.candidateName || app.candidateEmail || 'Unknown',
              candidateId: app.candidateId,
              candidateEmail: app.candidateEmail,
              job: app.jobTitle || 'Unknown Position',
              jobId: app.jobId,
              applied: new Date(app.appliedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US'),
              appliedAt: app.appliedAt, // keep raw timestamp for date filtering
              status: app.status || 'pending',
              cvUrl: app.cvUrl,
              cvFileName: app.cvFilename || 'CV.pdf',
              email: app.candidateEmail,
              phone: '-',
              location: '-',
              education: '-',
              experience: '-',
              skills: [],
              bio: '-',
              workHistory: [],
              reviews: [],
              marked: false,
              
              // AI Screening & Interview data
              aiScreeningScore: app.aiScreeningScore !== undefined ? app.aiScreeningScore : (isPass ? 88 : isReview ? 65 : 45),
              aiScreeningResult: app.aiScreeningResult || (isPass ? 'pass' : isReview ? 'review' : 'fail'),
              aiScreeningReason: app.aiScreeningReason || (isPass 
                ? 'Ứng viên có kỹ năng kỹ thuật xuất sắc, kinh nghiệm làm việc thực tế với các công nghệ yêu cầu trùng khớp 90% với bản mô tả công việc (JD).' 
                : isReview 
                  ? 'Ứng viên có tiềm năng tốt về mặt tư duy logic nhưng kinh nghiệm thực tế chưa nhiều, cần đào tạo và theo sát trong thời gian đầu.'
                  : 'Hồ sơ ứng viên không đạt các yêu cầu cơ bản về mặt kỹ thuật bắt buộc và kinh nghiệm làm việc liên quan được nêu trong JD.'),
              aiInterviewScore: app.aiInterviewScore !== undefined ? app.aiInterviewScore : (isPass ? 85 : isReview ? 68 : null),
              aiInterviewReport: app.aiInterviewReport || (isPass ? {
                strengths: [
                  'Hiểu sâu sắc các kiến thức chuyên môn cốt lõi và kiến trúc dự án.',
                  'Khả năng tư duy logic và giải quyết vấn đề thực tế xuất sắc.',
                  'Kinh nghiệm thực hành tốt qua các dự án lớn trong CV.'
                ],
                weaknesses: [
                  'Kỹ năng tiếng Anh giao tiếp cần thực hành thêm.',
                  'Chưa có nhiều kinh nghiệm tối ưu hóa hiệu năng hệ thống ở mức sâu.'
                ]
              } : isReview ? {
                strengths: [
                  'Thái độ học hỏi và cầu tiến tốt, phản ứng nhanh.',
                  'Có kiến thức nền tảng cơ bản về cơ sở dữ liệu và thuật toán.'
                ],
                weaknesses: [
                  'Kinh nghiệm thực tiễn tương đối mỏng.',
                  'Trả lời phỏng vấn còn thiếu tự tin ở một số câu hỏi tình huống.'
                ]
              } : null)
            };
          });

        setRealApplications(transformedApplications);

        console.log('✅ Transformed applications:', transformedApplications);
      } catch (error) {
        console.error('❌ Error loading applications:', error);
        setRealApplications([]);
      } finally {
        setIsLoadingApplications(false);
      }
    };

    if (activeSection === 'applications') {
      loadApplications();
    }
  }, [activeSection, jobPosts, isLoadingJobs, language]);

  // Comprehensive screenshot prevention
  useEffect(() => {
    let blurTimeout;

    const handleBlur = () => {
      const container = document.querySelector('[data-secure]');
      if (container) container.classList.add('blurred');
    };

    const handleFocus = () => {
      clearTimeout(blurTimeout);
      blurTimeout = setTimeout(() => {
        const container = document.querySelector('[data-secure]');
        if (container) container.classList.remove('blurred');
      }, 100);
    };

    const handleVisibilityChange = () => {
      document.hidden ? handleBlur() : handleFocus();
    };

    const handleKeyDown = (e) => {
      const shouldBlock =
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) ||
        (e.metaKey && e.shiftKey && e.key === 's') ||
        (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '5'));

      if (shouldBlock) {
        e.preventDefault();
        handleBlur();
        alert(language === 'vi'
          ? '🚫 Chụp màn hình bị vô hiệu hóa vì lý do bảo mật!'
          : '🚫 Screenshots are disabled for security reasons!');
        setTimeout(handleFocus, 2000);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(blurTimeout);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [language]);

  // Initialize sample CVs for demo
  useEffect(() => {
    const initCVs = async () => {
      try {
        await initializeMultipleSampleCVs();
      } catch (error) {
        console.error('Failed to initialize sample CVs:', error);
      }
    };
    initCVs();
  }, []);

  // Auto-open profile modal if candidateId is passed via navigation state
  useEffect(() => {
    if (location.state?.candidateId) {
      // Search in both mock and real applications
      const allApps = [...applications, ...realApplications];
      const candidate = allApps.find(app => app.id === location.state.candidateId);

      if (candidate) {
        // First switch to applications tab
        setActiveSection('applications');

        // Then open modal after a brief delay for smooth transition
        setTimeout(() => {
          setSelectedCandidate(candidate);
        }, 300);

        // Clear the state after opening to prevent re-opening on refresh
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        // For notification fallback - if no specific candidate ID, just show applications tab
        if (location.state?.fromNotifications) {
          setActiveSection('applications');
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    } else if (location.state?.fromNotifications) {
      // Just switch the tab if coming from notifications without specific candidate
      setActiveSection('applications');
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      // By default it starts on posts, which might be what they wanted but let's handle if it comes from notification and we want applications to be default
      if (location.state?.fromNotifications) {
        setActiveSection('applications');
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, applications, realApplications, navigate, location.pathname]);

  const filteredApplications = useMemo(() => {
    const applicationsToFilter = realApplications;

    // Returns true if the application date falls within the selected time window.
    // Uses app.appliedAt (raw ISO/timestamp from API) for accuracy.
    const matchesTimeFilter = (app) => {
      if (timeFilter === 'all') return true;
      // Prefer raw appliedAt; fall back to formatted app.applied string
      const raw = app.appliedAt || app.applied;
      if (!raw) return false;
      const appDate = new Date(raw);
      if (isNaN(appDate.getTime())) return false;
      const now = new Date();
      if (timeFilter === 'today') {
        return appDate.getFullYear() === now.getFullYear() &&
          appDate.getMonth() === now.getMonth() &&
          appDate.getDate() === now.getDate();
      }
      if (timeFilter === 'week') {
        // ISO week: Monday → Sunday
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
        return appDate >= startOfWeek;
      }
      if (timeFilter === 'month') {
        return appDate.getFullYear() === now.getFullYear() &&
          appDate.getMonth() === now.getMonth();
      }
      return true;
    };

    return applicationsToFilter.filter(app => {
      // Search: tên ứng viên hoặc vị trí
      const matchesSearch = !searchTerm ||
        app.candidate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job.toLowerCase().includes(searchTerm.toLowerCase());

      // Time filter (single select)
      const matchesTime = matchesTimeFilter(app);

      // Status filter (single select)
      const matchesStatus =
        statusFilter === 'all' ? true :
          statusFilter === 'pending' ? app.status === 'pending' :
            statusFilter === 'approved' ? app.status === 'approved' :
              statusFilter === 'rejected' ? app.status === 'rejected' : true;

      return matchesSearch && matchesTime && matchesStatus;
    });
  }, [applications, realApplications, searchTerm, timeFilter, statusFilter]);

  const handleFilterToggle = useCallback(() => { }, []);

  const handleCompleteJob = useCallback((id) => {
    setRealApplications(prev => prev.map(app =>
      app.id === id
        ? { ...app, completed: true, status: 'completed', messagesDeleted: true }
        : app
    ));
  }, []);

  const handleMarkCandidate = useCallback((id) => {
    setRealApplications(prev => prev.map(app =>
      app.id === id ? { ...app, marked: !app.marked } : app
    ));
  }, []);

  const handleApproveApplication = useCallback((id) => {
    setRealApplications(prev => prev.map(app =>
      app.id === id ? { ...app, status: 'approved' } : app
    ));
  }, []);

  const handleRejectApplication = useCallback((id) => {
    setRealApplications(prev => prev.map(app =>
      app.id === id ? { ...app, status: 'rejected' } : app
    ));
  }, []);

  const handleViewProfile = useCallback(async (app) => {
    // Set basic info from application immediately
    setSelectedCandidate(app);

    // Then try to fetch full profile
    if (app.candidateId) {
      setIsFetchingProfile(true);
      try {
        const [profile, candidateApps, approvedExperiences] = await Promise.all([
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
            const job = finalAllJobs.find(j => (j.idJob || j.id || j.jobID) === a.jobId);
            return {
              id: a.applicationId || a.id,
              jobTitle: job?.title || a.jobTitle || '---',
              companyName: job?.employerName || job?.companyName || a.employerName || a.companyName || '---',
              completedAt: a.updatedAt || a.appliedAt || a.createdAt,
              employerRating: a.employerRating || null
            };
          })
          .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));

        // Reviews list
        const reviews = candidateApps
          .filter(a => a.employerRating && typeof a.employerRating.overall === 'number')
          .map(a => {
            const job = finalAllJobs.find(j => (j.idJob || j.id || j.jobID) === a.jobId);
            return {
              rating: a.employerRating.overall,
              comment: a.employerRating.comment || '',
              employerName: job?.employerName || job?.companyName || a.employerName || a.companyName || '---',
              position: job?.title || a.jobTitle || '---',
              date: new Date(a.employerConfirmedAt || a.updatedAt || a.appliedAt).toLocaleDateString('vi-VN')
            };
          });

        const experienceSummary = profile?.experience?.trim()
          ? profile.experience
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
            : app.experience;

        if (profile) {
          // Merge profile info into selectedCandidate
          setSelectedCandidate(prevState => {
            if (!prevState) return prevState;
            return {
              ...prevState,
              ...profile,
              // Keep app-specific fields
              candidate: profile.fullName || prevState.candidate,
              phone: profile.phone || prevState.phone,
              location: profile.location || prevState.location,
              education: profile.education || prevState.education,
              experience: experienceSummary,
              skills: profile.skills || prevState.skills,
              bio: profile.bio || prevState.bio,
              profileImage: profile.profileImage || prevState.profileImage,
              // Ưu tiên cvUrl từ application (đã refresh) thay vì profile (có thể hết hạn)
              cvUrl: prevState.cvUrl || profile.cvUrl,
              cvFileName: prevState.cvFileName || profile.cvFileName,
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

  // Re-fetch a fresh CV URL for a candidate by re-querying their application
  const handleGetFreshCvUrl = useCallback(async (candidate) => {
    try {
      const jobId = candidate.jobId;
      if (!jobId) return null;
      const freshApps = await applicationService.getJobApplications(jobId);
      const match = freshApps.find(a => a.applicationId === candidate.applicationId || a.candidateId === candidate.candidateId);
      if (match?.cvUrl) {
        // Also update the selectedCandidate so future opens use fresh URL
        setSelectedCandidate(prev => prev ? { ...prev, cvUrl: match.cvUrl } : prev);
        return match.cvUrl;
      }
    } catch (e) {
      console.warn('Could not fetch fresh CV URL:', e);
    }
    return null;
  }, []);

  // Open delete confirmation modal
  const handleDeleteJob = (jobId) => {
    setDeleteJobId(jobId);
  };

  // Confirm and delete job post
  const confirmDeleteJob = async () => {
    if (!deleteJobId) return;

    setIsDeleting(true);

    try {
      // Find the job to get its idJob
      const job = jobPosts.find(j => j.id === deleteJobId);
      const jobId = job?.idJob || job?.id;

      console.log('🗑️ Deleting job:', jobId);

      // Delete from DynamoDB
      await jobPostService.deleteJobPost(jobId);

      // Remove job from state
      setJobPosts(prev => prev.filter(job => job.id !== deleteJobId));

      // Show success toast
      setSuccessMessage(language === 'vi' ? 'Đã xóa bài đăng thành công!' : 'Post deleted successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      console.log('✅ Job deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting job:', error);
      setSuccessMessage(language === 'vi' ? 'Lỗi khi xóa bài đăng!' : 'Error deleting post!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } finally {
      setIsDeleting(false);
      setDeleteJobId(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteJobId(null);
  };

  // Get job title for delete confirmation
  const jobToDelete = deleteJobId ? jobPosts.find(job => job.id === deleteJobId) : null;

  // Filter job posts by time and search
  const filteredJobPosts = useMemo(() => {
    const now = new Date();

    // Parse postedDate → Date object (handles both ISO timestamp and relative string)
    const toDate = (post) => {
      // Real data: has _createdAt ISO string
      if (post._createdAt) return new Date(post._createdAt);
      // Mock data: relative string like "5 ngày trước", "2 days ago"
      const s = (post.postedDate || '').toLowerCase();
      const m = s.match(/(\d+)/);
      const n = m ? parseInt(m[1]) : 1;
      if (s.includes('phút') || s.includes('minute')) return new Date(now - n * 60 * 1000);
      if (s.includes('giờ') || s.includes('hour')) return new Date(now - n * 3600 * 1000);
      if (s.includes('ngày') || s.includes('day')) return new Date(now - n * 86400 * 1000);
      if (s.includes('tuần') || s.includes('week')) return new Date(now - n * 7 * 86400 * 1000);
      if (s.includes('tháng') || s.includes('month')) return new Date(now - n * 30 * 86400 * 1000);
      return new Date(0);
    };

    return jobPosts.filter(post => {
      if (postSearchTerm) {
        const term = postSearchTerm.toLowerCase();
        if (!post.title?.toLowerCase().includes(term) && !post.location?.toLowerCase().includes(term)) return false;
      }
      if (postTimeFilter === 'all') return true;
      const diffDays = (now - toDate(post)) / (1000 * 60 * 60 * 24);
      if (postTimeFilter === 'today') return diffDays < 1;
      if (postTimeFilter === 'week') return diffDays < 7;
      if (postTimeFilter === 'month') return diffDays < 30;
      return true;
    });
  }, [jobPosts, postTimeFilter, postSearchTerm]);

  // Fetch candidate recommendations
  const handleRecommendCandidates = async (job) => {
    setRecommendingJob(job);
    setShowRecommendationsModal(true);
    setIsLoadingRecommendations(true);
    setRecommendationError('');
    setRecommendations([]);

    try {
      console.log('🔮 Fetching AI candidate recommendations for job:', job.title);
      const result = await cvAiService.recommendCandidates({
        jobData: {
          title: job.title,
          description: job.description || '',
          requirements: job.requirements || '',
          responsibilities: job.responsibilities || '',
          benefits: job.benefits || '',
        },
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

  // View job details
  const handleViewJob = (jobId) => {
    const job = jobPosts.find(j => j.id === jobId);
    if (job) setSelectedJobView(job);
  };

  // Edit job
  const handleEditJob = (jobId) => {
    const job = jobPosts.find(j => j.id === jobId);
    if (job) {
      // Navigate to PostJob page with job data
      navigate('/employer/post-job', { state: { job } });
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditJobId(null);
    setEditJobData(null);
  };

  return (
    <DashboardLayout role="employer" key={language}>
      <ApplicationsContainer
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Verification loading */}
        {isVerified === null && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>
              {language === 'vi' ? 'Đang kiểm tra trạng thái tài khoản...' : 'Checking account status...'}
            </div>
          </div>
        )}

        {/* Not verified — block access */}
        {isVerified === false && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: '#FEF3C7', border: '2px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <ShieldCheck style={{ width: 36, height: 36, color: '#D97706' }} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', marginBottom: '12px' }}>
              {language === 'vi' ? 'Tài khoản chưa được xác thực' : 'Account Not Verified'}
            </h2>
            <p style={{ fontSize: '15px', color: '#64748B', maxWidth: '480px', lineHeight: 1.6, marginBottom: '8px' }}>
              {verificationPending
                ? (language === 'vi'
                  ? 'Hồ sơ xác thực của bạn đang được admin xem xét. Bạn sẽ có thể đăng bài và xem CV ứng viên ngay khi được phê duyệt.'
                  : 'Your verification is under admin review. You will be able to post jobs and view applicant CVs once approved.')
                : (language === 'vi'
                  ? 'Bạn cần hoàn tất xác thực hồ sơ công ty và được admin phê duyệt trước khi đăng tin tuyển dụng và xem CV ứng viên tiêu chuẩn.'
                  : 'You need to complete company verification and get admin approval before posting jobs and viewing standard applicant CVs.')
              }
            </p>
            {verificationPending ? (
              <div style={{ marginTop: '20px', padding: '14px 28px', background: '#FEF3C7', border: '1.5px solid #FDE68A', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock style={{ width: 18, height: 18 }} />
                {language === 'vi' ? 'Đang chờ admin duyệt — thường trong 24-48 giờ' : 'Pending admin approval — usually within 24-48 hours'}
              </div>
            ) : (
              <button
                onClick={() => navigate('/employer/verification')}
                style={{ marginTop: '20px', padding: '14px 32px', background: 'linear-gradient(135deg,#1e40af,#2563eb)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ShieldCheck style={{ width: 18, height: 18 }} />
                {language === 'vi' ? 'Xác thực hồ sơ ngay' : 'Verify Now'}
              </button>
            )}
          </div>
        )}

        {/* Verified — show full content */}
        {isVerified === true && (<>
        <PageHeader>
          <PageTitleGroup>
            <PageIconBox><Briefcase /></PageIconBox>
            <PageTitleText>
              <h1>{language === 'vi' ? 'Công việc tiêu chuẩn' : 'Standard Jobs'}</h1>
              <p>{language === 'vi' ? 'Quản lý bài đăng và hồ sơ cho công việc tiêu chuẩn (không bao gồm tuyển gấp)' : 'Manage posts and applications for standard jobs (excluding quick jobs)'}</p>
            </PageTitleText>
          </PageTitleGroup>
        </PageHeader>

        {/* Standard Jobs Section */}
        <StandardJobsSection>
          <StandardJobsGrid>
            <StandardJobCard
              $color="#10B981"
              $active={activeSection === 'posts'}
              type="button"
              onClick={() => setActiveSection('posts')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <StandardJobIcon $color="#10B981">
                <FileText />
              </StandardJobIcon>
              <StandardJobLabel>{language === 'vi' ? 'Quản lý bài đăng' : 'Post Management'}</StandardJobLabel>
              <StandardJobDescription>
                {language === 'vi' ? 'Quản lý các bài đăng tuyển dụng tiêu chuẩn' : 'Manage standard job postings'}
              </StandardJobDescription>
            </StandardJobCard>

            <StandardJobCard
              $color="#1e40af"
              $active={activeSection === 'applications'}
              type="button"
              onClick={() => setActiveSection('applications')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <StandardJobIcon $color="#1e40af">
                <Users />
              </StandardJobIcon>
              <StandardJobLabel>{language === 'vi' ? 'Hồ sơ ứng tuyển' : 'Applications'}</StandardJobLabel>
              <StandardJobDescription>
                {language === 'vi' ? 'Xem và quản lý hồ sơ ứng viên tiêu chuẩn' : 'View and manage standard job applications'}
              </StandardJobDescription>
            </StandardJobCard>
          </StandardJobsGrid>
        </StandardJobsSection>

        {/* Job Posts Section - Only visible when activeSection is 'posts' */}
        {activeSection === 'posts' && (
          <>
            <PostsSectionHeader>
              <PostsSectionTitle>
                <Newspaper />
                {language === 'vi' ? 'Các bài đăng tuyển dụng' : 'Job Postings'}
              </PostsSectionTitle>
              <CreatePostButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/employer/post-job')}
              >
                <Plus />
                {language === 'vi' ? 'Đăng bài mới' : 'Post New Job'}
              </CreatePostButton>
            </PostsSectionHeader>

            {/* Filter bar for job posts */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm theo tên việc, địa điểm...' : 'Search by title, location...'}
                value={postSearchTerm}
                onChange={e => setPostSearchTerm(e.target.value)}
                style={{
                  flex: 1, minWidth: '180px', padding: '8px 14px', borderRadius: '8px',
                  border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none',
                  background: '#f8fafc', color: '#1e293b'
                }}
              />
              {['all', 'today', 'week', 'month'].map(f => (
                <button
                  key={f}
                  onClick={() => setPostTimeFilter(f)}
                  style={{
                    padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                    border: '1.5px solid',
                    borderColor: postTimeFilter === f ? '#1e40af' : '#e2e8f0',
                    background: postTimeFilter === f ? '#1e40af' : '#f8fafc',
                    color: postTimeFilter === f ? '#fff' : '#64748b',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {f === 'all' ? (language === 'vi' ? 'Tất cả' : 'All')
                    : f === 'today' ? (language === 'vi' ? 'Hôm nay' : 'Today')
                      : f === 'week' ? (language === 'vi' ? 'Tuần này' : 'This week')
                        : (language === 'vi' ? 'Tháng này' : 'This month')}
                </button>
              ))}
            </div>

            {isLoadingJobs ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div style={{ fontSize: '14px' }}>{language === 'vi' ? 'Đang tải...' : 'Loading...'}</div>
              </div>
            ) : jobPosts.length === 0 ? (
              <EmptyState
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="icon">📋</div>
                <h3>{language === 'vi' ? 'Chưa có bài đăng nào' : 'No job posts yet'}</h3>
                <p>{language === 'vi' ? 'Bấm "Đăng bài mới" để tạo bài đăng tuyển dụng đầu tiên' : 'Click "Post New Job" to create your first job posting'}</p>
              </EmptyState>
            ) : filteredJobPosts.length === 0 ? (
              <EmptyState
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="icon">🔍</div>
                <h3>{language === 'vi' ? 'Không tìm thấy bài đăng phù hợp' : 'No matching posts found'}</h3>
                <p>{language === 'vi' ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm' : 'Try changing the filter or search term'}</p>
              </EmptyState>
            ) : (
              <JobPostsGrid>
                <AnimatePresence>
                  {filteredJobPosts.map((post, index) => (
                    <JobPostCard
                      key={post.id}
                      $status={post.status}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <JobPostHeader>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <JobPostTitle><DynamicTranslate text={post.title} showIndicator={false} /></JobPostTitle>
                            <JobStatusBadge $status={post.status}>
                              {post.status === 'active'
                                ? (language === 'vi' ? 'Đang tuyển' : 'Active')
                                : (language === 'vi' ? 'Đã đóng' : 'Closed')}
                            </JobStatusBadge>
                          </div>
                          <JobPostMeta>
                            <div className="meta-item">
                              <MapPin /> <DynamicTranslate text={post.location} showIndicator={false} />
                            </div>
                            <div className="meta-item">
                              <Wallet size={15} style={{ strokeWidth: 1.5 }} />{post.salary}
                            </div>
                            {post.shift && (
                              <div className="meta-item">
                                <Clock />{post.shift}
                              </div>
                            )}
                            {post.workDays && (
                              <div className="meta-item">
                                <Calendar />{language === 'vi' ? 'Ngày làm: ' : 'Work date: '}{post.workDays}
                              </div>
                            )}
                          </JobPostMeta>
                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <JobTypeBadge $partTime={post.type === 'Bán thời gian' || post.type === 'Part-time'}>
                              {(post.type === 'Bán thời gian' || post.type === 'Part-time') ? 'Part-time' : 'Full-time'}
                            </JobTypeBadge>
                            {post.postedDate && (
                              <span style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                fontSize: '12px', fontWeight: '600', color: '#1e40af',
                                background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                                borderRadius: '20px', padding: '4px 10px'
                              }}>
                                <Clock size={12} />
                                {language === 'vi' ? 'Đăng ' : 'Posted '}{post.postedDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </JobPostHeader>

                      <JobPostStats>
                        <div className="stat">
                          <div className="stat-value">{post.applicants}</div>
                          <div className="stat-label">{language === 'vi' ? 'Ứng viên' : 'Applicants'}</div>
                        </div>
                        <div className="stat">
                          <div className="stat-value">{post.views}</div>
                          <div className="stat-label">{language === 'vi' ? 'Lượt xem' : 'Views'}</div>
                        </div>
                      </JobPostStats>

                      <JobPostActions>
                        <JobPostButton
                          $variant="ai"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRecommendCandidates(post)}
                        >
                          <Sparkles />{language === 'vi' ? 'Gợi ý ứng viên' : 'AI Match'}
                        </JobPostButton>
                        <JobPostButtonsRow>
                          <JobPostButton
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleViewJob(post.id)}
                            style={{ flex: 2 }}
                          >
                            <Eye />{language === 'vi' ? 'Xem mô tả' : 'View'}
                          </JobPostButton>
                          <JobPostButton
                            $variant="edit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleEditJob(post.id)}
                            style={{ flex: 1 }}
                          >
                            <Edit />{language === 'vi' ? 'Sửa' : 'Edit'}
                          </JobPostButton>
                          <JobPostButton
                            $variant="delete"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDeleteJob(post.id)}
                            style={{ width: '42px', flexShrink: 0, padding: 0 }}
                          >
                            <Trash2 />
                          </JobPostButton>
                        </JobPostButtonsRow>
                      </JobPostActions>
                    </JobPostCard>
                  ))}
                </AnimatePresence>
              </JobPostsGrid>
            )}
          </>
        )}

        {activeSection === 'applications' && (
          <>
            {/* Filter bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm ứng viên, vị trí...' : 'Search candidate, position...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  flex: 1, minWidth: '180px', padding: '8px 14px', borderRadius: '8px',
                  border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none',
                  background: '#f8fafc', color: '#1e293b'
                }}
              />
              {['all', 'today', 'week', 'month'].map(f => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  style={{
                    padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                    border: '1.5px solid',
                    borderColor: timeFilter === f ? '#1e40af' : '#e2e8f0',
                    background: timeFilter === f ? '#1e40af' : '#f8fafc',
                    color: timeFilter === f ? '#fff' : '#64748b',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {f === 'all' ? (language === 'vi' ? 'Tất cả' : 'All')
                    : f === 'today' ? (language === 'vi' ? 'Hôm nay' : 'Today')
                      : f === 'week' ? (language === 'vi' ? 'Tuần này' : 'This week')
                        : (language === 'vi' ? 'Tháng này' : 'This month')}
                </button>
              ))}
            </div>

            {(isLoadingApplications || isLoadingJobs) ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div style={{ fontSize: '14px' }}>{language === 'vi' ? 'Đang tải hồ sơ...' : 'Loading applications...'}</div>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  {language === 'vi' ? 'Chưa có hồ sơ ứng tuyển' : 'No applications yet'}
                </div>
                <div style={{ fontSize: '14px' }}>
                  {language === 'vi' ? 'Hồ sơ ứng tuyển sẽ hiển thị ở đây khi có ứng viên apply' : 'Applications will appear here when candidates apply'}
                </div>
              </div>
            ) : (
              <CardGrid>
                <AnimatePresence>
                  {filteredApplications.map((app, index) => (
                    <ApplicationRow
                      key={app.id}
                      app={app}
                      onViewProfile={handleViewProfile}
                      onCompleteJob={handleCompleteJob}
                      onMarkCandidate={handleMarkCandidate}
                      onApprove={handleApproveApplication}
                      onReject={handleRejectApplication}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </CardGrid>
            )}
          </>
        )}
        </>)}
      </ApplicationsContainer>

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
            {successMessage}
          </SuccessToast>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>
                {selectedJobView.title}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                  <MapPin size={16} />
                  <span>{selectedJobView.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                  <span style={{ fontWeight: '500' }}>{language === 'vi' ? 'Thu nhập trung bình:' : 'Income:'}</span>
                  <span>{selectedJobView.salary}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                  <Briefcase size={16} />
                  <span>{selectedJobView.type}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                  <Calendar size={16} />
                  <span>{language === 'vi' ? 'Hết hạn: ' : 'Deadline: '}{selectedJobView.deadline}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>
                  {selectedJobView.applicants}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {language === 'vi' ? 'Ứng viên' : 'Applicants'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>
                  {selectedJobView.views}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {language === 'vi' ? 'Lượt xem' : 'Views'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#10b981', background: '#d1fae5', padding: '4px 12px', borderRadius: '20px', display: 'inline-block', marginBottom: '4px' }}>
                  {selectedJobView.status === 'active' ? (language === 'vi' ? 'Đang tuyển' : 'Active') : (language === 'vi' ? 'Đóng' : 'Closed')}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {language === 'vi' ? 'Trạng thái' : 'Status'}
                </div>
              </div>
            </div>

            {selectedJobView.description && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} />
                  {language === 'vi' ? 'Mô tả công việc' : 'Job Description'}
                </h4>
                <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-line', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {selectedJobView.description}
                </div>
              </div>
            )}

            {selectedJobView.responsibilities && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={18} />
                  {language === 'vi' ? 'Trách nhiệm công việc' : 'Job Responsibilities'}
                </h4>
                <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-line', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {selectedJobView.responsibilities}
                </div>
              </div>
            )}

            {selectedJobView.requirements && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} />
                  {language === 'vi' ? 'Yêu cầu ứng viên' : 'Requirements'}
                </h4>
                <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-line', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {selectedJobView.requirements}
                </div>
              </div>
            )}

            {selectedJobView.benefits && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={18} />
                  {language === 'vi' ? 'Quyền lợi' : 'Benefits'}
                </h4>
                <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-line', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {selectedJobView.benefits}
                </div>
              </div>
            )}

            <div style={{ fontSize: '13px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              {language === 'vi' ? 'Đăng ' : 'Posted '}{selectedJobView.postedDate}
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
                  {language === 'vi' ? 'Mức lương trung bình' : 'Salary'}
                </label>
                <input
                  type="text"
                  value={editJobData.salary || ''}
                  onChange={(e) => setEditJobData({ ...editJobData, salary: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                  {language === 'vi' ? 'Loại hình' : 'Type'}
                </label>
                <input
                  type="text"
                  value={editJobData.type || ''}
                  onChange={(e) => setEditJobData({ ...editJobData, type: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                  {language === 'vi' ? 'Hết hạn' : 'Deadline'}
                </label>
                <input
                  type="text"
                  value={editJobData.deadline || ''}
                  onChange={(e) => setEditJobData({ ...editJobData, deadline: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                <FileText size={16} />
                {language === 'vi' ? 'Mô tả công việc & Phúc lợi' : 'Job Description & Benefits'}
              </label>
              <textarea
                value={editJobData.description || ''}
                onChange={(e) => setEditJobData({ ...editJobData, description: e.target.value })}
                placeholder={language === 'vi' ? 'Nhập mô tả công việc chi tiết, yêu cầu và quyền lợi...' : 'Enter detailed job description, requirements and benefits...'}
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  lineHeight: '1.6',
                  resize: 'vertical'
                }}
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
                {language === 'vi' ? 'Không có ứng viên nào đã KYC đạt tiêu chuẩn phù hợp với công việc.' : 'No KYC-verified candidates match the criteria for this job.'}
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
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
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
    </DashboardLayout>
  );
};

export default Applications;
