import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import JobCard from '../../components/JobCard';
import DynamicTranslate from '../../components/DynamicTranslate';
import StatusBadge from '../../components/StatusBadge';
import ProfileSetupPrompt from '../../components/ProfileSetupPrompt';

import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import candidateProfileService from '../../services/candidateProfileService';
import jobPostService from '../../services/jobPostService';
import quickJobService from '../../services/quickJobService';
import applicationService from '../../services/applicationService';
import { s3Images } from '../../utils/s3Images';
import { getActiveBanners } from '../../services/bannerService';
import {
  Briefcase,
  FileText,
  Star,
  TrendingUp,
  Search,
  CheckCircle,
  Clock,
  Calendar,
  Target,
  Award,
  Bell,
  ArrowUpRight,
  Eye,
  MapPin,
  Users,
  Upload,
  Edit3,
  Sparkles,
  X,
  Building2,
  StarIcon,
  Send,
  ChevronDown,
  ChevronUp,
  Phone,
  MoreVertical,
  AlertCircle,
  DollarSign,
  Shield
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import cvAiService from '../../services/cvAiService';



const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
`;


const DashboardContainer = styled.div`
  animation: ${fadeIn} 0.5s ease-in;
`;

const WelcomeBanner = styled(motion.div)`
  background: linear-gradient(135deg, #1e40af 0%, #1e40af 100%);
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 40px;
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(14, 57, 149, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 400px;
    height: 400px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    right: 20%;
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
  }
`;

const WelcomeContent = styled.div`
  position: relative;
  z-index: 1;
  color: white;
  flex: 1;
  
  h1 {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 12px;
  }
  
  p {
    font-size: 16px;
    opacity: 0.95;
    margin-bottom: 24px;
    font-weight: 500;
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled(motion.button)`
  padding: 14px 28px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.$variant === 'primary' ? 'white' : 'rgba(255, 255, 255, 0.2)'};
  color: ${props => props.$variant === 'primary' ? props.theme.colors.primary : 'white'};
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid ${props => props.$variant === 'primary' ? 'white' : 'rgba(255, 255, 255, 0.3)'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const IllustrationContainer = styled.div`
  position: relative;
  z-index: 1;
  
  svg {
    width: 180px;
    height: 180px;
    animation: ${float} 3s ease-in-out infinite;
  }
`;

const ProfileReminderBanner = styled(motion.div)`
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1.5px solid #fcd34d;
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 16px 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ReminderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #92400e;

  svg {
    width: 24px;
    height: 24px;
    color: #d97706;
    flex-shrink: 0;
  }

  div {
    h4 {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 2px;
      margin-top: 0;
      color: #92400e;
    }
    p {
      font-size: 13px;
      opacity: 0.95;
      margin: 0;
      color: #b45309;
      font-weight: 500;
    }
  }
`;

const ReminderAction = styled(Link)`
  padding: 8px 16px;
  background: #d97706;
  color: white !important;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: #b45309;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const TopInfoRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: stretch;

  @media (max-width: 1200px) {
    flex-direction: column;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  min-width: 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2.5fr 1fr;
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const shine = keyframes`
  0% { left: -100%; }
  100% { left: 200%; }
`;

const pulseSpotlight = keyframes`
  0%, 100% { box-shadow: 0 0 15px rgba(220, 38, 38, 0.4), 0 10px 40px rgba(0,0,0,0.15); }
  50% { box-shadow: 0 0 30px rgba(220, 38, 38, 0.75), 0 10px 40px rgba(0,0,0,0.25); }
`;

const BoostBannerWrap = styled(motion.div)`
  position: relative;
  margin-bottom: 24px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  cursor: pointer;
  background: #f3f4f6;
  border: ${props => props.$isTopSpotlight ? '3px solid #dc2626' : 'none'};
  animation: ${props => props.$isTopSpotlight ? css`${pulseSpotlight} 3s infinite ease-in-out` : 'none'};
  transition: all 0.4s ease;
  aspect-ratio: 16/6;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.35) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: skewX(-25deg);
    animation: ${props => props.$isTopSpotlight ? css`${shine} 3.5s infinite ease-in-out` : 'none'};
    pointer-events: none;
    z-index: 1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover img {
    transform: scale(1.02);
  }
`;

const BannerDots = styled.div`
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
`;

const BannerDot = styled.button`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: ${props => props.$active ? '#fff' : 'rgba(255, 255, 255, 0.4)'};
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.7);
    width: ${props => props.$active ? '8px' : '12px'};
  }
  
  ${props => props.$active && `
    width: 24px;
    background: #fff;
  `}
`;



const SidebarCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SideAdWrap = styled(motion.div)`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  cursor: pointer;
  position: sticky;
  top: 100px;
  z-index: 10;

  img {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.03);
  }
`;

const SideAdTag = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(245,158,11,0.92);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
`;

const Section = styled(motion.section)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 28px;
  border: 2px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.card};
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: ${props => props.theme.shadows.lg};
    border-color: ${props => props.theme.colors.primary}30;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid ${props => props.theme.colors.border};
  
  h2 {
    font-size: 20px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    display: flex;
    align-items: center;
    gap: 10px;
    
    svg {
      width: 24px;
      height: 24px;
      color: ${props => props.theme.colors.primary};
    }
  }
  
  a {
    color: ${props => props.theme.colors.primary};
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.3s ease;
    
    &:hover {
      gap: 8px;
    }
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const JobsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;

const ApplicationCard = styled(motion.div)`
  padding: 14px 18px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  margin-bottom: 10px;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateX(8px);
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const ApplicationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const ApplicationInfo = styled.div`
  flex: 1;
  
  h4 {
    font-size: 14px;
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

const ApplicationMeta = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
  font-size: 12px;
  color: ${props => props.theme.colors.textLight};
  
  span {
    display: flex;
    align-items: center;
    gap: 4px;
    
    svg {
      width: 13px;
      height: 13px;
    }
  }
`;

const ActivityFeed = styled.div``;

const ActivityItem = styled(motion.div)`
  display: flex;
  gap: 16px;
  padding: 24px;
  border-left: 4px solid ${props => props.$color || props.theme.colors.border};
  margin-bottom: 12px;
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  border: 1px solid ${props => props.theme.colors.border};
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  
  &:hover {
    transform: translateX(4px);
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => props.$color || props.theme.colors.primary};
  }
`;

const ActivityIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.$color || props.theme.colors.primary}15;
  color: ${props => props.$color || props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 28px;
    height: 28px;
  }
`;

const RecentList = styled.div`
  max-height: 420px;
  overflow-y: auto;
  padding-right: 8px;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 8px;
  }
`;

const ActivityContent = styled.div`
  flex: 1;
  
  h5 {
    font-size: 17px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 6px;
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
  }
`;

const RecommendedJobCard = styled(motion.div)`
  padding: 16px;
  border: 1.5px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  transition: all 0.25s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 6px 24px rgba(0,0,0,0.08);
    transform: translateY(-3px);
  }
`;

const JobTypeBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  width: fit-content;
  
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
`;

const AiMatchSection = styled.div`
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const AiMatchBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4338ca;
  font-size: 11.5px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 6px;
  align-self: flex-start;
  
  svg {
    width: 13px !important;
    height: 13px !important;
    color: #4f46e5;
  }
`;

const AiMatchReason = styled.p`
  font-size: 12.5px;
  color: #475569;
  line-height: 1.5;
  font-style: italic;
  margin: 0;
  
  &::before {
    content: '"';
  }
  &::after {
    content: '"';
  }
`;

const KycPromptCard = styled.div`
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #bfdbfe;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  max-width: 500px;
  margin: 20px auto;
  box-shadow: 0 4px 20px rgba(30, 64, 175, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  
  .icon-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(30, 64, 175, 0.1);
    color: #2563eb;
    
    svg {
      width: 30px !important;
      height: 30px !important;
    }
  }
  
  h3 {
    font-size: 18px;
    font-weight: 800;
    color: #1e3a8a;
    margin: 0;
  }
  
  p {
    font-size: 14px;
    color: #1e40af;
    line-height: 1.6;
    margin: 0;
  }
  
  button {
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
    color: white;
    font-weight: 700;
    font-size: 14px;
    padding: 12px 24px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
    
    &:hover {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(30, 64, 175, 0.35);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
`;

const JobHeader = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
  min-height: 64px;
  align-items: flex-start;
`;

const CompanyLogo = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.primary}15;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 20px;
  color: ${props => props.theme.colors.primary};
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
`;

const JobInfo = styled.div`
  flex: 1;
  min-width: 0;
  
  h4 {
    font-size: 15px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.35;
  }
  
  p {
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const JobDetails = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  
  span {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;
    
    svg {
      width: 16px;
      height: 16px;
      color: ${props => props.theme.colors.primary};
    }
  }
`;

const JobTags = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  
  span {
    padding: 6px 14px;
    background: ${props => props.theme.colors.primary}12;
    color: ${props => props.theme.colors.primary};
    border-radius: ${props => props.theme.borderRadius.full};
    font-size: 12px;
    font-weight: 700;
    border: 1px solid ${props => props.theme.colors.primary}25;
  }
`;

const CurrentJobSection = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 24px 28px;
  margin-bottom: 32px;
  border: 2px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.card};
  transition: all 0.3s ease;

  &:hover {
    box-shadow: ${props => props.theme.shadows.lg};
    border-color: ${props => props.theme.colors.primary}30;
  }
`;

const CurrentJobHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid ${props => props.theme.colors.border};

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }

  svg {
    width: 24px;
    height: 24px;
    color: ${props => props.theme.colors.primary};
  }
`;

const CurrentJobCard = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border: 2px solid ${props => props.theme.colors.primary}20;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.theme.colors.primary}05;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const CurrentJobLogo = styled.div`
  width: 60px;
  height: 60px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.theme.colors.primary}15;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 22px;
  color: ${props => props.theme.colors.primary};
  flex-shrink: 0;
`;

const CurrentJobInfo = styled.div`
  flex: 1;

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 6px;
  }

  p {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;
    margin-bottom: 4px;
  }
`;

const CurrentJobMeta = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 8px;
  flex-wrap: wrap;

  span {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;

    svg {
      width: 15px;
      height: 15px;
      color: ${props => props.theme.colors.primary};
    }
  }
`;

const CurrentJobBadge = styled.span`
  padding: 6px 16px;
  background: ${props => props.$status === 'completed_pending_candidate' ? 'rgba(245, 158, 11, 0.15)' : props.theme.colors.success + '15'};
  color: ${props => props.$status === 'completed_pending_candidate' ? '#D97706' : props.theme.colors.success};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 13px;
  font-weight: 700;
  border: 1px solid ${props => props.$status === 'completed_pending_candidate' ? 'rgba(245, 158, 11, 0.3)' : props.theme.colors.success + '30'};
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ViewDetailButton = styled(motion.button)`
  padding: 8px 20px;
  background: ${props => props.theme.colors.primary}10;
  color: ${props => props.theme.colors.primary};
  border: 2px solid ${props => props.theme.colors.primary}30;
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  margin-left: 12px;

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: white;
    border-color: ${props => props.theme.colors.primary};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ModalOverlay = styled(motion.div)`
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
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
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

    svg {
      width: 24px;
      height: 24px;
      color: ${props => props.theme.colors.primary};
    }
  }

  button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.textLight};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: ${props => props.theme.colors.error}15;
      color: ${props => props.theme.colors.error};
    }
  }
`;

const ModalBody = styled.div`
  padding: 20px 24px;
`;

const JobDetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.theme.colors.primary};
    flex-shrink: 0;
  }

  .label {
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;
    min-width: 120px;
  }

  .value {
    font-size: 14px;
    color: ${props => props.theme.colors.text};
    font-weight: 600;
  }
`;

const JobStatusTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: ${props => props.$completed ? props.theme.colors.success + '15' : '#F59E0B15'};
  color: ${props => props.$completed ? props.theme.colors.success : '#F59E0B'};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 13px;
  font-weight: 700;
  border: 1px solid ${props => props.$completed ? props.theme.colors.success + '30' : '#F59E0B30'};

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 2px solid ${props => props.theme.colors.border};
`;

const ModalButton = styled(motion.button)`
  flex: 1;
  padding: 12px 18px;
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;

  &.primary {
    background: ${props => props.theme.colors.primary};
    color: white;

    &:hover {
      background: ${props => props.theme.colors.primary}dd;
      box-shadow: 0 8px 20px ${props => props.theme.colors.primary}40;
    }
  }

  &.secondary {
    background: transparent;
    color: ${props => props.theme.colors.primary};
    border-color: ${props => props.theme.colors.primary}30;

    &:hover {
      background: ${props => props.theme.colors.primary}10;
    }
  }

  &.success {
    background: ${props => props.theme.colors.success};
    color: white;

    &:hover {
      background: ${props => props.theme.colors.success}dd;
      box-shadow: 0 8px 20px ${props => props.theme.colors.success}40;
    }
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SuccessMessage = styled(motion.div)`
  text-align: center;
  padding: 20px 0;

  .icon-wrapper {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: ${props => props.theme.colors.success}15;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;

    svg {
      width: 32px;
      height: 32px;
      color: ${props => props.theme.colors.success};
    }
  }

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    line-height: 1.6;
  }
`;

const ReviewForm = styled(motion.div)`
  margin-top: 12px;
`;

const ReviewCategory = styled.div`
  margin-bottom: 12px;

  .category-label {
    font-size: 13px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
      width: 16px;
      height: 16px;
      color: ${props => props.theme.colors.primary};
    }
  }
`;

const StarRow = styled.div`
  display: flex;
  gap: 6px;
`;

const StarButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.2);
  }

  svg {
    width: 24px;
    height: 24px;
    fill: ${props => props.$active ? '#F59E0B' : 'transparent'};
    stroke: ${props => props.$active ? '#F59E0B' : props.theme.colors.textLight + '60'};
    stroke-width: 2;
    transition: all 0.2s;
  }
`;

const ReviewTextArea = styled.textarea`
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

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textLight}80;
  }
`;

const ReviewSubmittedMessage = styled(motion.div)`
  text-align: center;
  padding: 24px 0;

  .icon-wrapper {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: ${props => props.theme.colors.success}15;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;

    svg {
      width: 32px;
      height: 32px;
      color: ${props => props.theme.colors.success};
    }
  }

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    line-height: 1.6;
  }
`;

const CandidateDashboard = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime] = useState(new Date());
  const [showJobDetail, setShowJobDetail] = useState(false);
  const showJobDetailRef = useRef(false);
  useEffect(() => {
    showJobDetailRef.current = showJobDetail;
  }, [showJobDetail]);
  const [jobCompleted, setJobCompleted] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [ratings, setRatings] = useState({ overall: 0, environment: 0, attitude: 0, accuracy: 0 });
  const [reviewText, setReviewText] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [realApplications, setRealApplications] = useState([]);
  const [selectedAppDetail, setSelectedAppDetail] = useState(null); // for application detail modal
  const [realRecommendedJobs, setRealRecommendedJobs] = useState([]);
  const recommendedJobsRef = useRef([]);
  useEffect(() => {
    recommendedJobsRef.current = realRecommendedJobs;
  }, [realRecommendedJobs]);
  const [allActiveJobs, setAllActiveJobs] = useState([]);
  const [currentJob, setCurrentJob] = useState(null);
  // Bug 6 fix: track recently-replaced notifications để hiện banner cho candidate
  const [replacedNotice, setReplacedNotice] = useState(null); // { jobTitle, replacedAt }
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isApplicationsExpanded, setIsApplicationsExpanded] = useState(false);
  const [successfulMatchesCount, setSuccessfulMatchesCount] = useState(0);
  const [banners, setBanners] = useState([
    { src: s3Images.banner.seoul, alt: "Seoul Vua Mì Cay" },
    { src: s3Images.banner.unnamed1, alt: "Banner" },
    { src: s3Images.banner.unnamed, alt: "Banner" }
  ]);

  // Load active banners from admin (max 5)
  // Load active banners - reload when candidate profile is available for region targeting
  useEffect(() => {
    const location = candidateProfile?.location || '';
    getActiveBanners(location).then(activeBanners => {
      if (activeBanners && activeBanners.length > 0) {
        setBanners(activeBanners.map(b => ({ src: b.imageUrl, alt: b.title || 'Banner', linkUrl: b.linkUrl, isTopSpotlight: !!b.isTopSpotlight })));
      }
    }).catch(() => {/* fallback to default banners */ });
  }, [candidateProfile?.location]);

  useEffect(() => {
    const bannerInterval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 7000);
    return () => clearInterval(bannerInterval);
  }, [banners.length]);

  // Fetch candidate profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const profile = await candidateProfileService.getOrCreateProfile(user);
        setCandidateProfile(profile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch jobs and applications
  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoadingData(true);

      // Fetch all active jobs (Standard + Quick)
      const [standardJobs, quickJobs] = await Promise.all([
        jobPostService.getAllActiveJobs().catch(() => []),
        quickJobService.getAllActiveQuickJobs().catch(() => [])
      ]);

      // Merge and filter out expired jobs
      const todayOnly = new Date();
      todayOnly.setHours(0, 0, 0, 0);

      const allJobs = [...standardJobs, ...quickJobs].filter(job => {
        // Standard jobs: workDays is the application deadline
        const deadline = job.workDays || job.workDate;
        if (!deadline) return true; // No deadline set → always show
        const deadlineDate = new Date(deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        return deadlineDate > todayOnly; // Hide if deadline has passed
      });
      setAllActiveJobs(allJobs);

      // Fetch employer profiles to get companyLogo for job cards
      const uniqueEmployerIds = [...new Set(allJobs.map(j => j.employerId).filter(Boolean))];
      if (uniqueEmployerIds.length > 0) {
        const API_BASE = import.meta.env.VITE_EMPLOYER_API_URL || 'https://dlidp35x33.execute-api.ap-southeast-1.amazonaws.com/prod';
        const { fetchAuthSession } = await import('aws-amplify/auth');
        let token = null;
        try {
          const session = await fetchAuthSession();
          const raw = session?.tokens?.idToken;
          token = raw ? (typeof raw === 'string' ? raw : raw.toString()) : null;
        } catch (_) {}

        if (token) {
          const profileResults = await Promise.all(
            uniqueEmployerIds.map(id =>
              fetch(`${API_BASE}/profile/${id}`, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
              }).then(r => r.ok ? r.json() : null).catch(() => null)
            )
          );
          // Build employerId → companyLogo map
          const logoMap = {};
          profileResults.forEach(res => {
            if (res?.success && res?.data?.userId && res?.data?.companyLogo) {
              logoMap[res.data.userId] = res.data.companyLogo;
            }
          });
          // Patch allJobs with companyLogo
          allJobs.forEach(j => {
            if (j.employerId && logoMap[j.employerId]) {
              j.companyLogo = logoMap[j.employerId];
            }
          });
        }
      }

      // Fetch profile if not loaded to check KYC status
      let profile = candidateProfile;
      if (!profile) {
        profile = await candidateProfileService.getOrCreateProfile(user).catch(() => null);
        if (profile) setCandidateProfile(profile);
      }

      const isKycVerified = !!(profile && (
        profile.kycCompleted ||
        profile.kycStatus === 'VERIFIED' ||
        profile.ekycStatus === 'verified' ||
        profile.ekycStatus === 'VERIFIED'
      ));

      let recommended = [];
      if (isKycVerified) {
        const shouldFetchAI = showLoading || recommendedJobsRef.current.length === 0;
        if (shouldFetchAI) {
          try {
            const aiRecommendations = await cvAiService.recommendJobsForCandidate({ language }).catch(() => []);

            if (aiRecommendations && aiRecommendations.length > 0) {
              aiRecommendations.forEach(rec => {
                const matchedJob = allJobs.find(job => (job.idJob || job.jobID || job.id) === rec.jobId);
                if (matchedJob) {
                  const isQuick = matchedJob.jobType === 'quick' || !!(matchedJob.jobID && !matchedJob.idJob) || !!matchedJob.totalSalary;
                  const totalSalary = Number(matchedJob.totalSalary || 0);
                  const hourlyRate = Number(matchedJob.hourlyRate || 0);
                  const totalHours = Number(matchedJob.totalHours || 0);
                  const candidateIncome = Math.round(totalSalary * 0.85);
                  const jobSalary = isQuick
                    ? (candidateIncome > 0
                      ? `${candidateIncome.toLocaleString('vi-VN')} VNĐ/${totalHours}h`
                      : `${Math.round(hourlyRate * 0.85).toLocaleString('vi-VN')} VNĐ/giờ`)
                    : formatSalary(matchedJob.salary || matchedJob.totalSalary, matchedJob.salaryUnit);

                  recommended.push({
                    id: matchedJob.idJob || matchedJob.jobID || matchedJob.id,
                    title: matchedJob.title || 'Untitled',
                    company: matchedJob.employerName || matchedJob.companyName || (language === 'vi' ? 'Công ty' : 'Company'),
                    companyLogo: matchedJob.companyLogo || null,
                    location: matchedJob.location || '',
                    type: isQuick ? (language === 'vi' ? 'Việc làm ngắn hạn' : 'Quick Job') : (language === 'vi' ? 'Bán thời gian' : 'Part-time'),
                    salary: jobSalary,
                    postedAt: formatRelativeTime(matchedJob.createdAt),
                    tags: typeof matchedJob.tags === 'string' ? matchedJob.tags.split(',').map(t => t.trim()) : (matchedJob.tags || []),
                    isQuick,
                    workHours: matchedJob.workHours || (matchedJob.startTime && matchedJob.endTime ? `${matchedJob.startTime} - ${matchedJob.endTime}` : '') || '',
                    workDays: matchedJob.workDays || '',
                    workDate: matchedJob.workDate || '',
                    matchScore: rec.matchScore,
                    matchReason: rec.matchReason
                  });
                }
              });
            }
          } catch (aiErr) {
            // AI recommendations unavailable - continue without them
          }
        } else {
          // Keep existing recommendations for background refresh
          recommended = [...recommendedJobsRef.current];
        }

        // Fallback: rule-based matching if AI recommendations failed or returned nothing
        if (recommended.length === 0 && allJobs.length > 0) {
          const candLocation = (profile?.location || '').toLowerCase().trim();
          const candTitle = (profile?.title || '').toLowerCase().trim();
          const candSkills = Array.isArray(profile?.skills)
            ? profile.skills.map(s => s.toLowerCase().trim())
            : [];

          const fallbackJobs = allJobs.map(job => {
            let score = 0;
            const jobTitle = (job.title || '').toLowerCase();
            const jobLoc = (job.location || '').toLowerCase();
            const jobTags = typeof job.tags === 'string'
              ? job.tags.split(',').map(t => t.toLowerCase().trim())
              : (job.tags || []).map(t => String(t).toLowerCase().trim());

            // 1. Location match
            if (candLocation && jobLoc && (jobLoc.includes(candLocation) || candLocation.includes(jobLoc))) {
              score += 50;
            }

            // 2. Title keyword match
            if (candTitle && jobTitle) {
              const titleWords = candTitle.split(/\s+/).filter(w => w.length > 2);
              titleWords.forEach(word => {
                if (jobTitle.includes(word)) {
                  score += 15;
                }
              });
            }

            // 3. Skills match
            if (candSkills.length > 0 && jobTags.length > 0) {
              const commonTags = candSkills.filter(tag => jobTags.includes(tag));
              score += commonTags.length * 10;
            }

            return { job, score };
          });

          // Sort by score descending, then by date descending
          fallbackJobs.sort((a, b) => {
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            return new Date(b.job.createdAt || 0) - new Date(a.job.createdAt || 0);
          });

          const topFallback = fallbackJobs.slice(0, 5).map(item => item.job);

          topFallback.forEach(matchedJob => {
            const isQuick = matchedJob.jobType === 'quick' || !!(matchedJob.jobID && !matchedJob.idJob) || !!matchedJob.totalSalary;
            const totalSalary = Number(matchedJob.totalSalary || 0);
            const hourlyRate = Number(matchedJob.hourlyRate || 0);
            const totalHours = Number(matchedJob.totalHours || 0);
            const candidateIncome = Math.round(totalSalary * 0.85);
            const jobSalary = isQuick
              ? (candidateIncome > 0
                ? `${candidateIncome.toLocaleString('vi-VN')} VNĐ/${totalHours}h`
                : `${Math.round(hourlyRate * 0.85).toLocaleString('vi-VN')} VNĐ/giờ`)
              : formatSalary(matchedJob.salary || matchedJob.totalSalary, matchedJob.salaryUnit);

            recommended.push({
              id: matchedJob.idJob || matchedJob.jobID || matchedJob.id,
              title: matchedJob.title || 'Untitled',
              company: matchedJob.employerName || matchedJob.companyName || (language === 'vi' ? 'Công ty' : 'Company'),
              companyLogo: matchedJob.companyLogo || null,
              location: matchedJob.location || '',
              type: isQuick ? (language === 'vi' ? 'Việc làm ngắn hạn' : 'Quick Job') : (language === 'vi' ? 'Bán thời gian' : 'Part-time'),
              salary: jobSalary,
              postedAt: formatRelativeTime(matchedJob.createdAt),
              tags: typeof matchedJob.tags === 'string' ? matchedJob.tags.split(',').map(t => t.trim()) : (matchedJob.tags || []),
              isQuick,
              workHours: matchedJob.workHours || (matchedJob.startTime && matchedJob.endTime ? `${matchedJob.startTime} - ${matchedJob.endTime}` : '') || '',
              workDays: matchedJob.workDays || '',
              workDate: matchedJob.workDate || '',
            });
          });
        }
      }

      setRealRecommendedJobs(recommended);

      // Fetch user's applications
      const apps = await applicationService.getMyCandidateApplications();

      // Filter out applications for deleted jobs
      const activeApps = apps.filter(app => app.status !== 'job_deleted');

      // Find IDs of jobs not in our active lists
      const missingJobIds = [...new Set(activeApps.map(app => app.jobId).filter(id => id && !allJobs.find(j => (j.idJob || j.id || j.jobID) === id)))];

      // Fetch missing jobs individually to ensure "real data" even for inactive jobs
      let additionalJobs = [];
      if (missingJobIds.length > 0) {
        const jobResults = await Promise.all(missingJobIds.map(async (id) => {
          try {
            // Try standard job service first, then quick job service
            const standard = await jobPostService.getJobById(id);
            if (standard) return standard;
            return await quickJobService.getQuickJob(id);
          } catch (e) {
            return null;
          }
        }));
        additionalJobs = jobResults.filter(Boolean);
      }

      const finalAllJobs = [...allJobs, ...additionalJobs];

      const mappedApps = activeApps
        .sort((a, b) => new Date(b.appliedAt || b.createdAt || 0) - new Date(a.appliedAt || a.createdAt || 0))
        .map(app => {
          const job = finalAllJobs.find(j => (j.idJob || j.id || j.jobID) === app.jobId);

          return {
            id: app.applicationId || app.id,
            jobId: app.jobId,
            title: job?.title || app.jobTitle || '---',
            company: job?.employerName || job?.companyName || app.employerName || '---',
            appliedDate: formatRelativeTime(app.appliedAt || app.createdAt),
            status: mapStatus(app.status),
            urgent: job?.isUrgent || app.jobType === 'quick' || !!job?.jobID || false,
            isValid: !!job, // Flag if we found the actual job record
            // Extra detail fields
            location: job?.location || job?.address || app.location || '---',
            salary: (() => {
              const isQuick = job?.jobType === 'quick' || !!job?.totalSalary;
              if (isQuick) {
                const totalSalary = Number(job?.totalSalary || 0);
                const hourlyRate = Number(job?.hourlyRate || 0);
                const totalHours = Number(job?.totalHours || 0);
                const candidateIncome = Math.round(totalSalary * 0.85);
                if (candidateIncome > 0) return `${candidateIncome.toLocaleString('vi-VN')} VNĐ/${totalHours}h`;
                if (hourlyRate > 0) return `${Math.round(hourlyRate * 0.85).toLocaleString('vi-VN')} VNĐ/giờ`;
              }
              const raw = job?.salary || job?.salaryRange;
              const unit = job?.salaryUnit || 'hour';
              if (!raw) return '---';
              if (typeof raw === 'number') {
                const finalNum = raw < 1000 ? raw * 1000 : raw;
                const unitLabel = unit === 'month' ? ' VNĐ/tháng' : ' VNĐ/h';
                return `${finalNum.toLocaleString('vi-VN')}${unitLabel}`;
              }
              if (typeof raw === 'string') {
                const cleanNum = parseFloat(raw.replace(/[^\d.]/g, ''));
                if (!isNaN(cleanNum)) {
                  const finalNum = cleanNum < 1000 ? cleanNum * 1000 : cleanNum;
                  const unitLabel = unit === 'month' ? ' VNĐ/tháng' : ' VNĐ/h';
                  return `${finalNum.toLocaleString('vi-VN')}${unitLabel}`;
                }
                return raw;
              }
              return '---';
            })(),
            workHours: job?.workHours || job?.shift || job?.shiftTime || '---',
            description: job?.description || job?.jobDescription || '',
            tags: job?.tags || [],
            cvFilename: app.cvFilename || app.cvFileName || '',
            cvUrl: app.cvUrl || '',
            cvS3Key: app.cvS3Key || '',
            rawStatus: app.status,
          };
        })
        // Only show applications where we have a valid, resolved job record
        // and avoid "Unknown" placeholders
        .filter(app =>
          app.id &&
          app.isValid &&
          app.title !== '---' &&
          app.company !== '---' &&
          !app.title.includes('Unknown') &&
          !app.company.includes('Unknown') &&
          !app.company.includes('không xác định')
        )
        .slice(0, 20);

      setRealApplications(mappedApps);

      // Find current job (latest accepted or completed_pending_candidate application)
      const acceptedApp = apps
        .filter(app =>
          app.status === 'accepted' ||
          app.status === 'completed_pending_candidate' ||
          (app.status === 'completed' && !app.candidateRating)
        )
        .sort((a, b) => new Date(b.appliedAt || b.createdAt || 0) - new Date(a.appliedAt || a.createdAt || 0))[0];

      if (acceptedApp) {
        const job = finalAllJobs.find(j => (j.idJob || j.id || j.jobID) === acceptedApp.jobId);

        const companyVal = job ? (job.employerName || job.companyName) : null;
        const isJobValid = job &&
          job.title &&
          !job.title.includes('Unknown') &&
          companyVal &&
          !companyVal.includes('Unknown') &&
          !companyVal.includes('không xác định');

        if (isJobValid) {
          const isQuick = job.jobType === 'quick' || !!job.totalSalary;
          const totalSalary = Number(job.totalSalary || 0);
          const hourlyRate = Number(job.hourlyRate || 0);
          const totalHours = Number(job.totalHours || 0);
          const candidateIncome = Math.round(totalSalary * 0.85);
          const jobSalary = isQuick
            ? (candidateIncome > 0
              ? `${candidateIncome.toLocaleString('vi-VN')} VNĐ/${totalHours}h`
              : `${Math.round(hourlyRate * 0.85).toLocaleString('vi-VN')} VNĐ/giờ`)
            : formatSalary(job.salary || job.totalSalary, job.salaryUnit);

          setCurrentJob({
            jobId: job.idJob || job.id || job.jobID,
            title: job.title,
            company: job.employerName || job.companyName || '---',
            location: job.location || '',
            salary: jobSalary,
            workHours: job.workHours || (job.startTime && job.endTime ? `${job.startTime} - ${job.endTime}` : '---'),
            rawSalary: totalSalary,
            hourlyRate: hourlyRate,
            totalHours: totalHours,
            startDate: new Date(acceptedApp.appliedAt || acceptedApp.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US'),
            status: acceptedApp.status,
            applicationId: acceptedApp.applicationId,
            employerRating: acceptedApp.employerRating || null,
            employerConfirmedAt: acceptedApp.employerConfirmedAt || null
          });
        } else {
          if (!showJobDetailRef.current) {
            setCurrentJob(null);
          }
        }
      } else {
        if (!showJobDetailRef.current) {
          setCurrentJob(null);
        }
      }

      // Bug 6 fix: detect recently-replaced applications để hiện banner thông báo cho candidate
      // Dùng field replacedNoticeDismissed trong DB để dismissed state tồn tại vĩnh viễn.
      // Gom TẤT CẢ đơn bị thay thế chưa dismiss — khi bấm X sẽ tắt hết cùng lúc và không hiện lại.
      const undismissedReplaced = apps.filter(app =>
        (app.status === 'ĐÃ_BỊ_THAY_THẾ' || app.status === 'change_approved') &&
        !app.replacedNoticeDismissed
      );
      if (undismissedReplaced.length > 0) {
        const first = undismissedReplaced[0];
        const replacedJob = finalAllJobs.find(j =>
          (j.idJob || j.id || j.jobID) === first.jobId
        );
        setReplacedNotice({
          applicationId: first.applicationId,
          jobTitle: replacedJob?.title || first.jobTitle || 'Ca làm',
          replacedAt: first.replacedAt || first.updatedAt,
          rawStatus: first.status,
          // All undismissed replaced apps, so one X dismisses them all permanently
          allApplications: undismissedReplaced.map(a => ({ applicationId: a.applicationId, rawStatus: a.status })),
        });
      } else {
        setReplacedNotice(null);
      }

      // Calculate successful matches count for the current month
      const nowObj = new Date();
      const currentYear = nowObj.getFullYear();
      const currentMonth = nowObj.getMonth();

      const monthlyMatches = apps.filter(app => {
        // Must be accepted or completed status
        const isAccepted = app.status === 'accepted' ||
          app.status === 'completed' ||
          app.status === 'completed_pending_candidate';
        if (!isAccepted) return false;

        // Must be urgent job
        const job = finalAllJobs.find(j => (j.idJob || j.id || j.jobID) === app.jobId);
        const isUrgent = job?.isUrgent || app.jobType === 'quick' || !!job?.jobID || false;
        if (!isUrgent) return false;

        // Must be in current month
        const appDateStr = app.updatedAt || app.appliedAt || app.createdAt;
        if (!appDateStr) return false;
        const appDate = new Date(appDateStr);
        return appDate.getFullYear() === currentYear && appDate.getMonth() === currentMonth;
      });

      setSuccessfulMatchesCount(monthlyMatches.length);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      if (showLoading) setIsLoadingData(false);
    }
  }, [language]);

  useEffect(() => {
    fetchData();

    // Implement real-time feel with periodic refresh (every 30 seconds)
    const interval = setInterval(() => {
      fetchData(false); // Background refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Helper: Format salary
  const formatSalary = (salary, salaryUnit = 'hour') => {
    if (!salary) return language === 'vi' ? 'Thỏa thuận' : 'Negotiable';

    const unit = salaryUnit === 'month'
      ? (language === 'vi' ? ' VNĐ/tháng' : ' VND/month')
      : (language === 'vi' ? ' VNĐ/h' : ' VND/hr');

    // If it's a number string (e.g., "24" or "25.000")
    if (typeof salary === 'string') {
      const cleanSalary = salary.replace(/[^\d.]/g, '');
      const num = parseFloat(cleanSalary);
      if (!isNaN(num)) {
        // If the number is small (e.g., 24), treat it as thousands
        const finalNum = num < 1000 ? num * 1000 : num;
        return `${finalNum.toLocaleString('vi-VN')}${unit}`;
      }
      return salary; // Return as is if it's already non-numeric string like "6 triệu"
    }

    if (typeof salary === 'number') {
      const finalNum = salary < 1000 ? salary * 1000 : salary;
      return `${finalNum.toLocaleString('vi-VN')}${unit}`;
    }

    return salary;
  };

  // Helper: Format relative time
  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    const now = new Date();

    // Calculate difference in seconds
    let diffInSeconds = Math.floor((now - date) / 1000);

    // Handle small clock drifts (if diff is negative, treat as "just now")
    if (diffInSeconds < 0) diffInSeconds = 0;

    if (diffInSeconds < 60) return language === 'vi' ? 'Vừa xong' : 'Just now';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} ${language === 'vi' ? 'phút trước' : 'minutes ago'}`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ${language === 'vi' ? 'giờ trước' : 'hours ago'}`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} ${language === 'vi' ? 'ngày trước' : 'days ago'}`;

    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
  };

  // Helper: Map status to UI format
  const mapStatus = (status) => {
    // Bug 6 fix: thêm các status từ change request flow để hiển thị đúng
    const statusMap = {
      'pending': 'unseen',
      'reviewed': 'seen',
      'accepted': 'approved',
      'rejected': 'rejected',
      // Trạng thái sau khi bị thay thế — hiển thị riêng, không gây nhầm lẫn với "đang duyệt"
      'ĐÃ_BỊ_THAY_THẾ': 'replaced',
      'change_approved': 'replaced',
      'ĐÃ_HUỶ': 'cancelled',
      'completed': 'completed',
      'completed_pending_candidate': 'completed',
      'pending_change': 'pending_change',
    };
    return statusMap[status] || 'unseen';
  };

  const releaseEscrowFunds = (job) => {
    // Escrow release is handled by the database via applicationService.updateApplicationStatus('completed').
    // Wallet.jsx computes balance from Applications + CandidateProfiles (DynamoDB) — no localStorage needed.
    const jobId = job.jobId;
    const totalAmount = Number(job.rawSalary) || 0;
    const candidateAmount = Math.round(totalAmount * 0.85);
    const adminAmount = totalAmount - candidateAmount;
    console.log(`💰 Escrow released for job ${jobId}. Candidate: ${candidateAmount} VND, Admin: ${adminAmount} VND (recorded in DB via application status)`);
  };

  const handleConfirmCompletion = async () => {
    if (!currentJob?.applicationId) return;
    try {
      setIsConfirming(true);
      const appId = currentJob.applicationId;
      await applicationService.updateApplicationStatus(appId, 'completed', {
        candidateConfirmed: true,
        candidateConfirmedAt: new Date().toISOString(),
        chatMessages: []
      });

      // Clear chat messages locally
      localStorage.removeItem(`chat_${appId}`);
      localStorage.removeItem(`chat_read_${appId}`);
      localStorage.removeItem(`chat_read_employer_${appId}`);

      // Perform Escrow Release
      releaseEscrowFunds(currentJob);

      setJobCompleted(true);
      fetchData(false); // Refresh data
    } catch (err) {
      console.error('Error confirming job completion:', err);
      alert(language === 'vi' ? 'Xác nhận hoàn thành thất bại, vui lòng thử lại!' : 'Failed to confirm completion, please try again!');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!currentJob?.applicationId) return;
    try {
      setIsSubmittingReview(true);
      const appId = currentJob.applicationId;
      const candidateRating = {
        overall: ratings.overall,
        environment: ratings.environment,
        attitude: ratings.attitude,
        accuracy: ratings.accuracy,
        comment: reviewText
      };
      await applicationService.updateApplicationStatus(appId, 'completed', {
        candidateRating
      });

      // Save to client-side Completed Jobs Database table
      try {
        const completedJobs = JSON.parse(localStorage.getItem('completed_jobs_db') || '[]');
        const newCompletedJob = {
          applicationId: appId,
          jobId: currentJob.jobId,
          title: currentJob.title,
          company: currentJob.company,
          location: currentJob.location,
          salary: currentJob.salary,
          workHours: currentJob.workHours,
          startDate: currentJob.startDate,
          candidateRating,
          employerRating: currentJob.employerRating || null,
          completedAt: new Date().toISOString()
        };
        localStorage.setItem('completed_jobs_db', JSON.stringify([newCompletedJob, ...completedJobs]));
        console.log('✅ Saved completed job and ratings to local database: completed_jobs_db');
      } catch (dbErr) {
        console.error('Failed to save to local completed_jobs_db:', dbErr);
      }

      setReviewSubmitted(true);
      setTimeout(() => {
        handleCloseModal();
        fetchData(false); // Refresh data to hide the card
      }, 1500);
    } catch (err) {
      console.error('Error submitting candidate review:', err);
      alert(language === 'vi' ? 'Gửi đánh giá thất bại, vui lòng thử lại!' : 'Failed to submit review, please try again!');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCloseModal = () => {
    setShowJobDetail(false);
    setJobCompleted(false);
    setShowReviewForm(false);
    setReviewSubmitted(false);
    setRatings({ overall: 0, environment: 0, attitude: 0, accuracy: 0 });
    setReviewText('');
  };

  const canCloseModal = !jobCompleted || reviewSubmitted;

  const renderStars = (category) => (
    <StarRow>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarButton
          key={star}
          $active={ratings[category] >= star}
          onClick={() => setRatings(prev => ({ ...prev, [category]: star }))}
        >
          <Star />
        </StarButton>
      ))}
    </StarRow>
  );

  // Translation helper functions
  const translateSalary = (salaryStr) => {
    if (language === 'vi') return salaryStr;
    return salaryStr
      .replace(/triệu/g, 'million')
      .replace(/\/ca/g, '/shift')
      .replace(/\/giờ/g, '/hour');
  };

  const translateLocation = (locationStr) => {
    if (language === 'vi') return locationStr;
    return locationStr
      .replace(/Quận/g, 'District')
      .replace(/TP\.HCM/g, 'HCMC')
      .replace(/Hà Nội/g, 'Hanoi')
      .replace(/Đà Nẵng/g, 'Da Nang')
      .replace(/Tân Bình/g, 'Tan Binh')
      .replace(/Phú Nhuận/g, 'Phu Nhuan');
  };

  // Translate job titles
  const translateJobTitle = (titleVi) => {
    if (language === 'vi') return titleVi;
    const titleMap = {
      'Nhân viên Pha Chế': 'Barista',
      'Nhân viên Phục Vụ': 'Service Staff',
      'Đầu Bếp Phụ': 'Assistant Chef',
      'Nhân viên Pha chế - Part-time': 'Barista - Part-time',
      'Nhân viên Phục vụ - Part-time': 'Service Staff - Part-time',
      'Nhân viên Phụ bếp - Part-time': 'Kitchen Assistant - Part-time',
      'Nhân viên Bưng bê - Part-time': 'Food Runner - Part-time',
      'Nhân viên Phục vụ': 'Service Staff',
      'Nhân viên Pha chế': 'Barista',
      'Nhân viên Phụ bếp': 'Kitchen Assistant',
      'Nhân viên Bưng bê': 'Food Runner',
    };
    return titleMap[titleVi] || titleVi;
  };

  // Translate job type
  const translateJobType = (typeVi) => {
    if (language === 'vi') return typeVi;
    const typeMap = {
      'Bán thời gian': 'Part-time',
      'Hợp đồng': 'Contract',
      'Thực tập': 'Internship'
    };
    return typeMap[typeVi] || typeVi;
  };

  // Translate job tags
  const translateTag = (tagVi) => {
    if (language === 'vi') return tagVi;
    const tagMap = {
      'Bán hàng': 'Sales',
      'Giao tiếp': 'Communication',
      'Nhiệt tình': 'Enthusiastic',
      'Văn phòng': 'Office',
      'Word/Excel': 'Word/Excel',
      'Hành chính': 'Admin',
      'Phục vụ': 'Service',
      'F&B': 'F&B',
      'Ca làm linh động': 'Flexible Shifts',
      'Pha chế': 'Barista',
      'Phụ bếp': 'Kitchen Asst.',
      'Nhà hàng': 'Restaurant',
      'Lẩu': 'Hot Pot',
      'Part-time': 'Part-time',
      'Coffee': 'Coffee',
      'Pizza': 'Pizza',
    };
    return tagMap[tagVi] || tagVi;
  };

  // Translate time posted
  const translatePostedAt = (timeStr) => {
    if (language === 'vi') return timeStr;
    return timeStr
      .replace(/ngày trước/g, 'days ago')
      .replace(/giờ trước/g, 'hours ago')
      .replace(/tuần trước/g, 'weeks ago')
      .replace(/tháng trước/g, 'months ago');
  };

  // Data removed: now using realApplications and realRecommendedJobs state





  // Calculate profile completion from actual profile data (mirrors CandidateProfile.jsx logic)
  const profileCompletion = (() => {
    if (!candidateProfile) return 0;
    let completion = 0;
    if (candidateProfile.fullName?.trim()) completion += 7;
    if (candidateProfile.email?.trim()) completion += 7;
    if (candidateProfile.phone?.trim()) completion += 7;
    if (candidateProfile.cccd?.trim()) completion += 7;
    if (candidateProfile.dateOfBirth?.trim()) completion += 7;
    if (candidateProfile.location?.trim()) completion += 7;
    if (candidateProfile.title?.trim()) completion += 7;
    if (candidateProfile.bio?.trim()) completion += 7;
    if (candidateProfile.profileImage) completion += 14;
    if (candidateProfile.kycCompleted) completion += 30;
    return Math.min(completion, 100);
  })();

  const isKycVerified = !!(candidateProfile && (
    candidateProfile.kycCompleted ||
    candidateProfile.kycStatus === 'VERIFIED' ||
    candidateProfile.ekycStatus === 'verified' ||
    candidateProfile.ekycStatus === 'VERIFIED'
  ));

  const getGreeting = () => {
    const hour = currentTime.getHours(); if (language === 'en') {
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    } if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <>
      <DashboardLayout role="candidate" key={language}>
        {!isLoadingProfile && (
          <ProfileSetupPrompt
            role="candidate"
            userId={user?.email}
            profileName={candidateProfile?.fullName}
            profilePhone={candidateProfile?.phone}
          />
        )}
        <DashboardContainer>
          {/* Welcome Banner */}
          <WelcomeBanner
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <WelcomeContent>
              <h1>{getGreeting()}, {candidateProfile?.fullName || (language === 'vi' ? 'Ứng Viên' : 'Candidate')}! 👋</h1>
              <p>{language === 'vi' ? 'Chúc bạn một ngày làm việc hiệu quả!' : 'Have a productive day!'}</p>
              <QuickActions>
                <ActionButton
                  as={motion.a}
                  href="/candidate/jobs"
                  onClick={(e) => { e.preventDefault(); navigate('/candidate/jobs'); }}
                  $variant="primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Search />
                  {language === 'vi' ? 'Tìm Việc Làm' : 'Find Jobs'}
                </ActionButton>
                <ActionButton
                  as={motion.a}
                  href="/candidate/profile"
                  onClick={(e) => { e.preventDefault(); navigate('/candidate/profile'); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Edit3 />
                  {language === 'vi' ? 'Cập Nhật CV' : 'Update CV'}
                </ActionButton>
              </QuickActions>
            </WelcomeContent>
            <IllustrationContainer>
              <Briefcase size={180} color="rgba(255,255,255,0.3)" />
            </IllustrationContainer>
          </WelcomeBanner>

          {/* Profile Warning Reminder Banner */}
          {profileCompletion < 100 && (
            <ProfileReminderBanner
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ReminderContent>
                <AlertCircle />
                <div>
                  <h4>{language === 'vi' ? 'Hồ sơ của bạn chưa hoàn thiện' : 'Your profile is incomplete'}</h4>
                  <p>{language === 'vi' ? 'Hoàn thành hồ sơ để tăng cơ hội tiếp cận nhà tuyển dụng.' : 'Complete your profile to increase visibility to employers.'}</p>
                </div>
              </ReminderContent>
              <ReminderAction
                to="/candidate/profile"
                onClick={(e) => { e.preventDefault(); navigate('/candidate/profile'); }}
              >
                <Upload />
                {language === 'vi' ? 'Hoàn thiện ngay' : 'Complete now'}
              </ReminderAction>
            </ProfileReminderBanner>
          )}

          {/* Stats Row */}
          <TopInfoRow>
            <StatsGrid>
              <StatsCard
                title={language === 'vi' ? 'Hồ Sơ Đã Nộp' : 'Applications'}
                value={realApplications.length.toString()}
                change={realApplications.length > 0 ? "+1" : "0"}
                changeText={language === 'vi' ? 'gần đây' : 'recently'}
                icon={FileText}
                color="#1e40af"
                positive={realApplications.length > 0}
              />
              <StatsCard
                title={language === 'vi' ? 'Việc Đã Lưu' : 'Saved Jobs'}
                value={(candidateProfile?.savedJobs?.length || 0).toString()}
                change="0"
                changeText={language === 'vi' ? 'tuần này' : 'this week'}
                icon={Star}
                color="#F59E0B"
                positive={false}
                onClick={() => navigate('/candidate/jobs?tab=saved')}
              />
              <StatsCard
                title={language === 'vi' ? 'Job Match Thành Công' : 'Successful Matches'}
                value={successfulMatchesCount.toString()}
                change={successfulMatchesCount > 0 ? `+${successfulMatchesCount}` : "0"}
                changeText={language === 'vi' ? 'tháng này' : 'this month'}
                icon={CheckCircle}
                color="#1e40af"
                positive={successfulMatchesCount > 0}
              />
            </StatsGrid>
          </TopInfoRow>

          {/* Công việc hiện tại */}
          <CurrentJobSection
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CurrentJobHeader>
              <Briefcase />
              <h2>{language === 'vi' ? 'Công Việc Hiện Tại' : 'Current Job Details'}</h2>
            </CurrentJobHeader>

            {/* Bug 6 fix: banner thông báo ca làm đã bị thay đổi bởi employer */}
            {replacedNotice && (
              <div style={{
                background: '#FEF3C7', border: '1.5px solid #FDE68A', borderRadius: '12px',
                padding: '14px 16px', marginBottom: '16px',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#92400E', marginBottom: '4px' }}>
                    {language === 'vi' ? 'Ca làm của bạn đã bị kết thúc sớm' : 'Your shift has ended early'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#78350F', lineHeight: '1.5' }}>
                    {language === 'vi'
                      ? `Nhà tuyển dụng đã gửi yêu cầu thay đổi nhân viên cho ca "${replacedNotice.jobTitle}" và đã được admin duyệt.`
                      : `The employer submitted a worker change request for "${replacedNotice.jobTitle}" which was approved by admin.`
                    }
                  </div>
                </div>
                <button
                  onClick={async () => {
                    // Dismiss: mark ALL currently-replaced apps as dismissed in DB so the banner
                    // never comes back (even after logout/login). Hide immediately for good UX.
                    const targets = (replacedNotice.allApplications && replacedNotice.allApplications.length > 0)
                      ? replacedNotice.allApplications
                      : [{ applicationId: replacedNotice.applicationId, rawStatus: replacedNotice.rawStatus }];
                    setReplacedNotice(null);
                    try {
                      await Promise.all(targets.map(t =>
                        applicationService.updateApplicationStatus(
                          t.applicationId,
                          t.rawStatus || 'ĐÃ_BỊ_THAY_THẾ',
                          { replacedNoticeDismissed: true }
                        )
                      ));
                    } catch (err) {
                      console.error('Could not save notice dismissed state:', err);
                    }
                  }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#92400E', flexShrink: 0, fontSize: '18px', lineHeight: 1,
                    padding: '0 4px',
                  }}
                  aria-label="Đóng thông báo"
                >
                  ×
                </button>
              </div>
            )}
            {currentJob ? (
              <CurrentJobCard
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300 }}
                onClick={() => navigate('/candidate/jobs', { state: { selectedJobId: currentJob.jobId } })}
              >
                <CurrentJobLogo>{currentJob.company.charAt(0)}</CurrentJobLogo>
                <CurrentJobInfo>
                  <h3><DynamicTranslate text={currentJob.title} showIndicator={false} /></h3>
                  <p>{currentJob.company}</p>
                  <CurrentJobMeta>
                    <span><MapPin /><DynamicTranslate text={currentJob.location} showIndicator={false} /></span>
                    <span><Clock />{currentJob.workHours}</span>
                    <span><span style={{ fontWeight: '500' }}>{language === 'vi' ? 'Thu nhập:' : 'Income:'}</span> {currentJob.salary}</span>
                    <span><Calendar />{language === 'vi' ? `Từ ${currentJob.startDate}` : `Since ${currentJob.startDate}`}</span>
                  </CurrentJobMeta>
                </CurrentJobInfo>
                <CurrentJobBadge $status={currentJob.status}>
                  {currentJob.status === 'completed_pending_candidate' ? (
                    <>
                      <Clock style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                      {language === 'vi' ? 'Chờ bạn xác nhận' : 'Pending Your Confirm'}
                    </>
                  ) : (
                    <>
                      <CheckCircle />
                      {language === 'vi' ? 'Đang làm việc' : 'Active'}
                    </>
                  )}
                </CurrentJobBadge>
                <ViewDetailButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); setShowJobDetail(true); }}
                >
                  <Eye />
                  {language === 'vi' ? 'Xem chi tiết' : 'Details'}
                </ViewDetailButton>
              </CurrentJobCard>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: '#6B7280', fontSize: '14px', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
                {language === 'vi' ? 'Chưa có công việc tuyển gấp nào.' : 'No active shift jobs yet.'}
              </div>
            )}
          </CurrentJobSection>

          {/* Modal chi tiết công việc */}
          {showJobDetail && (
            <ModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (canCloseModal) handleCloseModal(); }}
            >
              <ModalContent
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ModalHeader>
                  <h2><Briefcase />{language === 'vi' ? (showReviewForm ? 'Đánh Giá Nhà Tuyển Dụng' : 'Chi Tiết Công Việc Tuyển Gấp') : (showReviewForm ? 'Rate Employer' : 'Shift Job Details')}</h2>
                  {canCloseModal && <button onClick={handleCloseModal}><X size={18} /></button>}
                </ModalHeader>
                <ModalBody>
                  {!jobCompleted ? (
                    <>
                      {currentJob?.status === 'completed_pending_candidate' && (
                        <div style={{
                          background: 'linear-gradient(135deg, #FEF3C7, #FDE68A20)',
                          border: '1.5px solid #FCD34D',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          marginBottom: '16px',
                          fontSize: '13px',
                          color: '#B45309',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <AlertCircle style={{ color: '#D97706', width: '18px', height: '18px', flexShrink: 0 }} />
                          {language === 'vi'
                            ? 'Nhà tuyển dụng đã xác nhận hoàn thành công việc và gửi đánh giá cho bạn. Vui lòng kiểm tra và xác nhận hoàn thành!'
                            : 'Employer has confirmed job completion and rated you. Please review and confirm completion!'}
                        </div>
                      )}

                      {currentJob?.employerRating && (
                        <div style={{
                          background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE40)',
                          border: '1.5px solid #BFDBFE',
                          borderRadius: '16px',
                          padding: '18px',
                          marginBottom: '20px',
                          textAlign: 'left'
                        }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1e40af', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Star style={{ fill: '#3b82f6', color: '#3b82f6', width: '18px', height: '18px' }} />
                            {language === 'vi' ? 'Đánh giá từ Nhà tuyển dụng' : 'Employer\'s Review'}
                          </h4>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: '14px' }}>
                            {/* Overall */}
                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px dashed #BFDBFE' }}>
                              <span style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>{language === 'vi' ? 'Đánh giá chung' : 'Overall'}</span>
                              <span style={{ display: 'flex', gap: '2px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star key={star} style={{ width: '14px', height: '14px', fill: currentJob.employerRating.overall >= star ? '#F59E0B' : 'transparent', color: '#F59E0B' }} />
                                ))}
                              </span>
                            </div>

                            {/* Categories */}
                            {[
                              { key: 'attitude', label: language === 'vi' ? 'Thái độ làm việc' : 'Work Attitude' },
                              { key: 'efficiency', label: language === 'vi' ? 'Hiệu quả công việc' : 'Work Efficiency' },
                              { key: 'discipline', label: language === 'vi' ? 'Kỷ luật & Đúng giờ' : 'Discipline & Punctuality' },
                              { key: 'skills', label: language === 'vi' ? 'Kỹ năng công việc' : 'Job Skills' }
                            ].map(cat => (
                              <div key={cat.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{cat.label}</span>
                                <span style={{ display: 'flex', gap: '2px' }}>
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} style={{ width: '12px', height: '12px', fill: currentJob.employerRating[cat.key] >= star ? '#F59E0B' : 'transparent', color: '#F59E0B' }} />
                                  ))}
                                </span>
                              </div>
                            ))}
                          </div>

                          {currentJob.employerRating.comment && (
                            <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px 12px', borderLeft: '3px solid #3B82F6', fontSize: '13px', color: '#334155', fontStyle: 'italic' }}>
                              "{currentJob.employerRating.comment}"
                            </div>
                          )}
                        </div>
                      )}

                      <JobDetailRow>
                        <Briefcase />
                        <span className="label">{language === 'vi' ? 'Vị trí' : 'Position'}</span>
                        <span className="value">{currentJob?.title || '---'}</span>
                      </JobDetailRow>
                      <JobDetailRow>
                        <Building2 />
                        <span className="label">{language === 'vi' ? 'Công ty' : 'Company'}</span>
                        <span className="value">{currentJob?.company || '---'}</span>
                      </JobDetailRow>
                      <JobDetailRow>
                        <MapPin />
                        <span className="label">{language === 'vi' ? 'Địa điểm' : 'Location'}</span>
                        <span className="value">{currentJob?.location || '---'}</span>
                      </JobDetailRow>
                      <JobDetailRow>
                        <Clock />
                        <span className="label">{language === 'vi' ? 'Giờ làm' : 'Shift'}</span>
                        <span className="value">{currentJob?.workHours || '---'}</span>
                      </JobDetailRow>
                      <JobDetailRow>
                        <DollarSign style={{ width: '18px', height: '18px', color: '#10B981', flexShrink: 0 }} />
                        <span className="label" style={{ color: '#10B981', fontWeight: '700' }}>
                          {language === 'vi' ? 'Thu nhập:' : 'Income:'}
                        </span>
                        <span className="value" style={{ color: '#10B981', fontWeight: '800' }}>
                          {currentJob?.salary || '---'}
                        </span>
                      </JobDetailRow>
                      <JobDetailRow>
                        <Calendar />
                        <span className="label">{language === 'vi' ? 'Bắt đầu' : 'Started'}</span>
                        <span className="value">{currentJob?.startDate || '---'}</span>
                      </JobDetailRow>
                      <JobDetailRow>
                        <CheckCircle />
                        <span className="label">{language === 'vi' ? 'Trạng thái' : 'Status'}</span>
                        <JobStatusTag>
                          <Clock />
                          {language === 'vi' ? 'Đang thực hiện' : 'In Progress'}
                        </JobStatusTag>
                      </JobDetailRow>
                      <ModalActions>
                        <ModalButton
                          className="secondary"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowJobDetail(false)}
                        >
                          {language === 'vi' ? 'Đóng' : 'Close'}
                        </ModalButton>
                        <ModalButton
                          className="success"
                          whileHover={!isConfirming ? { scale: 1.02 } : {}}
                          whileTap={!isConfirming ? { scale: 0.98 } : {}}
                          onClick={handleConfirmCompletion}
                          disabled={isConfirming}
                        >
                          <CheckCircle />
                          {isConfirming
                            ? (language === 'vi' ? 'Đang xác nhận...' : 'Confirming...')
                            : (language === 'vi' ? 'Xác nhận hoàn thành' : 'Confirm Completion')}
                        </ModalButton>
                      </ModalActions>
                    </>
                  ) : !showReviewForm ? (
                    <>
                      <SuccessMessage
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <div className="icon-wrapper">
                          <CheckCircle />
                        </div>
                        <h3>{language === 'vi' ? 'Công việc đã hoàn thành!' : 'Job Completed!'}</h3>
                        <p>{language === 'vi' ? 'Lương của bạn sẽ được chuyển vào ví trong vòng 48h.' : 'Your salary will be transferred to your wallet within 48 hours.'}</p>
                      </SuccessMessage>
                      <ModalActions>
                        <ModalButton
                          className="primary"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowReviewForm(true)}
                        >
                          <Star />
                          {language === 'vi' ? 'Đánh giá Nhà tuyển dụng' : 'Rate Employer'}
                        </ModalButton>
                      </ModalActions>
                    </>
                  ) : !reviewSubmitted ? (
                    <>
                      <ReviewForm
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p style={{ fontSize: '14px', color: 'inherit', marginBottom: '12px', fontWeight: 600 }}>
                          {currentJob?.company || 'Employer'}
                        </p>
                        <ReviewCategory style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A40)', padding: '14px 16px', borderRadius: '12px', border: '2px solid #F59E0B30', marginBottom: '16px' }}>
                          <div className="category-label" style={{ fontSize: '15px', fontWeight: 700, color: '#B45309' }}>

                            {language === 'vi' ? '⭐ Đánh giá tổng quan' : '⭐ Overall Rating'}
                          </div>
                          {renderStars('overall')}
                        </ReviewCategory>
                        <ReviewCategory>
                          <div className="category-label">
                            <Building2 />
                            {language === 'vi' ? 'Môi trường làm việc' : 'Work Environment'}
                          </div>
                          {renderStars('environment')}
                        </ReviewCategory>
                        <ReviewCategory>
                          <div className="category-label">
                            <Users />
                            {language === 'vi' ? 'Thái độ nhà tuyển dụng' : 'Employer Attitude'}
                          </div>
                          {renderStars('attitude')}
                        </ReviewCategory>
                        <ReviewCategory>
                          <div className="category-label">
                            <CheckCircle />
                            {language === 'vi' ? 'Công việc đúng với mô tả' : 'Job Matches Description'}
                          </div>
                          {renderStars('accuracy')}
                        </ReviewCategory>
                        <ReviewCategory>
                          <div className="category-label">
                            <Edit3 />
                            {language === 'vi' ? 'Nhận xét của bạn' : 'Your Review'}
                          </div>
                          <ReviewTextArea
                            placeholder={language === 'vi' ? 'Chia sẻ trải nghiệm làm việc của bạn...' : 'Share your work experience...'}
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                          />
                        </ReviewCategory>
                      </ReviewForm>
                      <ModalActions>
                        <ModalButton
                          className="primary"
                          whileHover={(ratings.overall && ratings.environment && ratings.attitude && ratings.accuracy && !isSubmittingReview) ? { scale: 1.02 } : {}}
                          whileTap={(ratings.overall && ratings.environment && ratings.attitude && ratings.accuracy && !isSubmittingReview) ? { scale: 0.98 } : {}}
                          onClick={handleSubmitReview}
                          style={{ opacity: (ratings.overall && ratings.environment && ratings.attitude && ratings.accuracy) ? 1 : 0.5 }}
                          disabled={!ratings.overall || !ratings.environment || !ratings.attitude || !ratings.accuracy || isSubmittingReview}
                        >
                          <CheckCircle />
                          {isSubmittingReview
                            ? (language === 'vi' ? 'Đang gửi...' : 'Submitting...')
                            : (language === 'vi' ? 'Gửi đánh giá' : 'Submit Review')}
                        </ModalButton>
                      </ModalActions>
                    </>
                  ) : (
                    <>
                      <ReviewSubmittedMessage
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <div className="icon-wrapper">
                          <CheckCircle />
                        </div>
                        <h3>{language === 'vi' ? 'Cảm ơn bạn đã đánh giá!' : 'Thank you for your review!'}</h3>
                        <p>{language === 'vi' ? 'Đánh giá của bạn sẽ giúp cộng đồng ứng viên tìm được công việc tốt hơn.' : 'Your review helps other candidates find better jobs.'}</p>
                      </ReviewSubmittedMessage>
                      <ModalActions>
                        <ModalButton
                          className="primary"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCloseModal}
                        >
                          {language === 'vi' ? 'Hoàn tất' : 'Done'}
                        </ModalButton>
                      </ModalActions>
                    </>
                  )}
                </ModalBody>
              </ModalContent>
            </ModalOverlay>
          )}

          <ContentGrid>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Bamos Boost Banner */}
              <BoostBannerWrap
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.22 }}
                whileHover={{ y: -2 }}
                onClick={() => {
                  const link = banners[currentBannerIndex]?.linkUrl;
                  if (link) window.open(link, '_blank', 'noopener,noreferrer');
                }}
                style={{ cursor: banners[currentBannerIndex]?.linkUrl ? 'pointer' : 'default' }}
                $isTopSpotlight={banners[currentBannerIndex]?.isTopSpotlight}
              >

                <div style={{ position: 'relative', width: '100%', height: '100%', lineHeight: 0 }}>
                  <AnimatePresence mode="sync">
                    <motion.img
                      key={currentBannerIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 1.8,
                        ease: 'easeInOut'
                      }}
                      src={banners[currentBannerIndex].src}
                      alt={banners[currentBannerIndex].alt}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                  </AnimatePresence>
                </div>
                <BannerDots>
                  {banners.map((_, idx) => (
                    <BannerDot
                      key={idx}
                      $active={currentBannerIndex === idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentBannerIndex(idx);
                      }}
                    />
                  ))}
                </BannerDots>
              </BoostBannerWrap>

              {/* Recommended Jobs - Full Width */}
              <Section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <SectionHeader>
                  <h2>
                    <Target />
                    {language === 'vi' ? 'Việc làm phù hợp với bạn' : 'AI Job Recommendations'}
                  </h2>
                  <Link to="/candidate/jobs">
                    {language === 'vi' ? 'Xem tất cả' : 'View all'}
                    <ArrowUpRight />
                  </Link>
                </SectionHeader>

                <JobsGrid style={{ display: 'block' }}>
                  {isLoadingData ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
                      {language === 'vi' ? 'Đang tìm việc làm phù hợp...' : 'Finding suitable jobs...'}
                    </div>
                  ) : !isKycVerified ? (
                    <KycPromptCard>
                      <div className="icon-wrapper">
                        <Shield />
                      </div>
                      <h3>{language === 'vi' ? 'Yêu cầu hoàn thành KYC' : 'KYC Verification Required'}</h3>
                      <p>
                        {language === 'vi'
                          ? 'Vui lòng hoàn thành xác thực danh tính (eKYC) để mở khóa tính năng đề xuất công việc bằng trí tuệ nhân tạo (AI) phù hợp nhất với bạn.'
                          : 'Please complete identity verification (eKYC) to unlock AI-powered job recommendations tailored for you.'}
                      </p>
                      <button onClick={() => navigate('/candidate/profile')}>
                        {language === 'vi' ? 'Xác thực ngay' : 'Verify Now'}
                      </button>
                    </KycPromptCard>
                  ) : realRecommendedJobs.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', alignItems: 'stretch' }}>
                      {realRecommendedJobs.map((job, index) => {
                        // Helpers
                        const formatDate = (d) => {
                          if (!d || d === 'undefined' || d === '') return '';
                          try { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}`; } catch { return d; }
                        };
                        const loc = job.location || '';
                        const commaIdx = loc.indexOf(',');
                        const shortLoc = commaIdx > 0 && commaIdx <= 40 ? loc.slice(0, commaIdx) : loc.slice(0, 38);
                        const needsTruncate = loc.length > 40;

                        return (
                          <RecommendedJobCard
                            key={job.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => navigate({ pathname: '/candidate/jobs', search: `?tab=${job.isQuick ? 'shift' : 'standard'}` }, { state: { selectedJobId: job.id } })}
                          >
                            {/* Header: logo + title + company + urgent badge */}
                            <JobHeader>
                              <CompanyLogo>
                                {job.companyLogo
                                  ? <img src={job.companyLogo} alt={job.company} />
                                  : job.company.charAt(0)}
                              </CompanyLogo>
                              <JobInfo>
                                {(job.isQuick || job.urgent) ? (
                                  <JobTypeBadge>{language === 'vi' ? 'Tuyển gấp' : 'Urgent'}</JobTypeBadge>
                                ) : (
                                  <JobTypeBadge style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>{language === 'vi' ? 'Tiêu chuẩn' : 'Standard'}</JobTypeBadge>
                                )}
                                <h4><DynamicTranslate text={job.title} showIndicator={false} /></h4>
                                <p><DynamicTranslate text={job.company} showIndicator={false} /></p>
                              </JobInfo>
                            </JobHeader>

                            {/* Address truncated */}
                            {loc && (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                                <MapPin size={12} style={{ flexShrink: 0, marginTop: '2px', color: '#9CA3AF' }} />
                                <span>
                                  <DynamicTranslate text={needsTruncate ? shortLoc : loc} showIndicator={false} />
                                  {needsTruncate && <span style={{ color: '#3b82f6', fontWeight: 600, marginLeft: '3px', cursor: 'default' }}>...</span>}
                                </span>
                              </div>
                            )}

                            {/* Salary */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: '#059669', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 500, color: '#6B7280' }}>{language === 'vi' ? 'Thu nhập trung bình:' : 'Income:'}</span>
                              {translateSalary(job.salary)}
                            </div>

                            {/* Work hours */}
                            {job.workHours && job.workHours !== '' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>
                                <Clock size={12} style={{ flexShrink: 0, color: '#9CA3AF' }} />
                                <span>{language === 'vi' ? 'Thời gian:' : 'Hours:'} {job.workHours}</span>
                              </div>
                            )}

                            {/* Deadline: standard job */}
                            {!job.isQuick && job.workDays && job.workDays !== '' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>
                                <Calendar size={12} style={{ flexShrink: 0, color: '#9CA3AF' }} />
                                <span>{language === 'vi' ? 'Hạn nộp:' : 'Deadline:'} {formatDate(job.workDays)}</span>
                              </div>
                            )}

                            {/* Work date: quick job */}
                            {job.isQuick && job.workDate && job.workDate !== '' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>
                                <Calendar size={12} style={{ flexShrink: 0, color: '#9CA3AF' }} />
                                <span>{language === 'vi' ? 'Ngày làm:' : 'Work date:'} {formatDate(job.workDate)}</span>
                              </div>
                            )}

                            {/* Posted time */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>
                              <Clock size={12} style={{ flexShrink: 0 }} />
                              <span>{translatePostedAt(job.postedAt)}</span>
                            </div>

                            {/* Tags */}
                            {job.tags && job.tags.filter(t => t && t.trim() !== '').length > 0 && (
                              <JobTags>
                                {job.tags.filter(t => t && t.trim() !== '').map((tag, idx) => (
                                  <span key={idx}>{tag}</span>
                                ))}
                              </JobTags>
                            )}

                            {/* AI match score */}
                            {job.matchScore !== undefined && (
                              <AiMatchSection>
                                <AiMatchBadge>
                                  <Sparkles size={13} />
                                  <span>{language === 'vi' ? `Phù hợp ${job.matchScore}%` : `${job.matchScore}% match`}</span>
                                </AiMatchBadge>
                                {job.matchReason && (
                                  <AiMatchReason>{job.matchReason}</AiMatchReason>
                                )}
                              </AiMatchSection>
                            )}
                          </RecommendedJobCard>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280', fontSize: '14px', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
                      {language === 'vi' ? 'Chưa có việc làm phù hợp.' : 'No suitable jobs yet.'}
                    </div>
                  )}
                </JobsGrid>
              </Section>

              {/* Recent Applications - compact */}
              <Section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <SectionHeader>
                  <h2>
                    <FileText />
                    {language === 'vi' ? 'Đơn Ứng Tuyển Của Bạn Gần Đây' : 'Your Recent Applications'}
                  </h2>
                </SectionHeader>

                {isLoadingData ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
                    {language === 'vi' ? 'Đang tải dữ liệu...' : 'Loading data...'}
                  </div>
                ) : realApplications.length > 0 ? (
                  <>
                    <RecentList>
                      {realApplications.slice(0, isApplicationsExpanded ? 20 : 2).map((app, index) => (
                        <ApplicationCard
                          key={app.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.08 }}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => setSelectedAppDetail(app)}
                        >
                          <ApplicationHeader>
                            <ApplicationInfo>
                              <h4><DynamicTranslate text={app.title} showIndicator={false} /></h4>
                              <p><DynamicTranslate text={app.company} showIndicator={false} /></p>
                            </ApplicationInfo>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                              <StatusBadge status={app.status} />
                              {app.urgent ? (
                                <StatusBadge status="urgent" size="sm">{language === 'vi' ? 'Tuyển gấp' : 'Urgent'}</StatusBadge>
                              ) : (
                                <StatusBadge status="active" size="sm">{language === 'vi' ? 'Tiêu chuẩn' : 'Standard'}</StatusBadge>
                              )}
                            </div>
                          </ApplicationHeader>
                          <ApplicationMeta>
                            <span>
                              <Clock />
                              {translatePostedAt(app.appliedDate)}
                            </span>
                            <span>
                              <Eye />
                              {language === 'vi' ? 'Xem chi tiết' : 'View details'}
                            </span>
                          </ApplicationMeta>
                        </ApplicationCard>
                      ))}
                    </RecentList>
                    {realApplications.length > 2 && (
                      <div style={{ textAlign: 'center', marginTop: '12px' }}>
                        <button
                          onClick={() => setIsApplicationsExpanded(!isApplicationsExpanded)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#4F46E5',
                            fontWeight: '600',
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {isApplicationsExpanded ? (
                            <>
                              {language === 'vi' ? 'Thu gọn' : 'Show less'}
                              <ChevronUp size={16} />
                            </>
                          ) : (
                            <>
                              {language === 'vi' ? 'Xem thêm' : 'Show more'}
                              <ChevronDown size={16} />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280', fontSize: '14px', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
                    {language === 'vi' ? 'Chưa có đơn ứng tuyển nào.' : 'No applications yet.'}
                  </div>
                )}
              </Section>
            </div>

            {/* Application Detail Modal */}
            <AnimatePresence>
              {selectedAppDetail && (
                <ModalOverlay
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedAppDetail(null)}
                >
                  <ModalContent
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ModalHeader>
                      <h2>
                        <FileText />
                        {language === 'vi' ? 'Chi Tiết Đơn Ứng Tuyển' : 'Application Details'}
                      </h2>
                      <button onClick={() => setSelectedAppDetail(null)}><X size={18} /></button>
                    </ModalHeader>
                    <ModalBody>
                      {/* Job Info */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                          {language === 'vi' ? 'Thông tin công việc' : 'Job Information'}
                        </div>
                        <JobDetailRow>
                          <Briefcase />
                          <span className="label">{language === 'vi' ? 'Vị trí' : 'Position'}</span>
                          <span className="value"><DynamicTranslate text={selectedAppDetail.title} showIndicator={false} /></span>
                        </JobDetailRow>
                        <JobDetailRow>
                          <Building2 />
                          <span className="label">{language === 'vi' ? 'Công ty' : 'Company'}</span>
                          <span className="value"><DynamicTranslate text={selectedAppDetail.company} showIndicator={false} /></span>
                        </JobDetailRow>
                        {selectedAppDetail.location && selectedAppDetail.location !== '---' && (
                          <JobDetailRow>
                            <MapPin />
                            <span className="label">{language === 'vi' ? 'Địa điểm' : 'Location'}</span>
                            <span className="value"><DynamicTranslate text={selectedAppDetail.location} showIndicator={false} /></span>
                          </JobDetailRow>
                        )}
                        {selectedAppDetail.salary && selectedAppDetail.salary !== '---' && (
                          <JobDetailRow>
                            <DollarSign style={{ color: '#10B981' }} />
                            <span className="label" style={{ color: '#10B981', fontWeight: '700' }}>{language === 'vi' ? 'Mức lương' : 'Salary'}</span>
                            <span className="value" style={{ color: '#10B981', fontWeight: '800' }}>
                              <DynamicTranslate text={selectedAppDetail.salary} showIndicator={false} />
                            </span>
                          </JobDetailRow>
                        )}
                        {selectedAppDetail.workHours && selectedAppDetail.workHours !== '---' && (
                          <JobDetailRow>
                            <Clock />
                            <span className="label">{language === 'vi' ? 'Ca làm' : 'Shift'}</span>
                            <span className="value"><DynamicTranslate text={selectedAppDetail.workHours} showIndicator={false} /></span>
                          </JobDetailRow>
                        )}
                        <JobDetailRow>
                          <Calendar />
                          <span className="label">{language === 'vi' ? 'Ngày nộp' : 'Applied'}</span>
                          <span className="value">{translatePostedAt(selectedAppDetail.appliedDate)}</span>
                        </JobDetailRow>
                        <JobDetailRow>
                          <CheckCircle />
                          <span className="label">{language === 'vi' ? 'Trạng thái' : 'Status'}</span>
                          <span className="value"><StatusBadge status={selectedAppDetail.status} /></span>
                        </JobDetailRow>
                      </div>

                      {/* CV Info */}
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #E5E7EB' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                          {language === 'vi' ? 'CV đã ứng tuyển' : 'Submitted CV'}
                        </div>
                        {selectedAppDetail.cvFilename ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: '#F0FDF4',
                            border: '1.5px solid #BBF7D0',
                            borderRadius: '10px',
                            padding: '12px 16px',
                          }}>
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '8px',
                              background: '#10B981', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', flexShrink: 0
                            }}>
                              <FileText style={{ color: 'white', width: '20px', height: '20px' }} />
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: '#065F46', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {selectedAppDetail.cvFilename}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                                {language === 'vi' ? 'CV đã nộp kèm đơn' : 'CV submitted with application'}
                              </div>
                            </div>
                            {selectedAppDetail.cvUrl && (
                              <a
                                href={selectedAppDetail.cvUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  padding: '7px 14px', borderRadius: '8px',
                                  background: '#10B981', color: 'white',
                                  fontSize: '13px', fontWeight: '700', textDecoration: 'none',
                                  flexShrink: 0
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Eye style={{ width: '14px', height: '14px' }} />
                                {language === 'vi' ? 'Xem' : 'View'}
                              </a>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: '13px', color: '#6B7280', fontStyle: 'italic', textAlign: 'center', padding: '12px', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #E5E7EB' }}>
                            {language === 'vi' ? 'Không có thông tin CV.' : 'No CV information available.'}
                          </div>
                        )}
                      </div>

                      <ModalActions>
                        <ModalButton
                          className="secondary"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedAppDetail(null)}
                        >
                          {language === 'vi' ? 'Đóng' : 'Close'}
                        </ModalButton>
                        <ModalButton
                          className="primary"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedAppDetail(null);
                            navigate({
                              pathname: '/candidate/jobs',
                              search: `?tab=${selectedAppDetail.urgent ? 'shift' : 'standard'}`
                            }, { state: { selectedJobId: selectedAppDetail.jobId } });
                          }}
                        >
                          <Briefcase />
                          {language === 'vi' ? 'Xem tin tuyển dụng' : 'View Job Post'}
                        </ModalButton>
                      </ModalActions>
                    </ModalBody>
                  </ModalContent>
                </ModalOverlay>
              )}
            </AnimatePresence>

            {/* Side Banners */}
            <SidebarCol>
              <SideAdWrap
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -3 }}
              >
                <img src={s3Images.poster.phucloctho} alt="Phúc Lộc Thọ" />
              </SideAdWrap>
            </SidebarCol>
          </ContentGrid>

        </DashboardContainer>
      </DashboardLayout>


    </>
  );
};

export default CandidateDashboard;
