import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';

import { useLanguage } from '../../context/LanguageContext';
import { s3Images } from '../../utils/s3Images';
import UrgentRecommendationsModal from '../../components/UrgentRecommendationsModal';

import { Users, Briefcase, Building2, DollarSign, CheckSquare, XSquare, Shield, Calendar, ArrowRight, Zap, TrendingUp, Star, Sparkles, Eye, Rocket, FileText, ChevronDown, AlertCircle, RefreshCw, X, Wifi, WifiOff } from 'lucide-react';

// Import Services
import adminEmployerService from '../../services/adminEmployerService';
import candidateProfileService from '../../services/candidateProfileService';
import jobPostService from '../../services/jobPostService';
import quickJobService from '../../services/quickJobService';
import applicationService from '../../services/applicationService';
import adminReportService from '../../services/adminReportService';
import { createWorkerReplacedNotification, createChangeRequestApprovedNotification, createChangeRequestRejectedNotification } from '../../services/notificationService';

const DashboardContainer = styled.div`
  animation: fadeIn 0.5s ease-in;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes crFadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 48px;
  
  @media (max-width: 1400px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatBox = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 24px;
  border-left: 4px solid ${props => props.$borderColor || '#3b82f6'};
  box-shadow: ${props => props.theme.shadows.card};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.$bgColor || '#3b82f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 24px;
    height: 24px;
    color: white;
  }
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  line-height: 1;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatChange = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$positive ? '#10b981' : '#ef4444'};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatDescription = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  margin-top: 8px;
  font-weight: 500;
`;

const Section = styled.section`
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    margin-bottom: 24px;
  }
`;

const SectionHeader = styled.div`
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  
  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
  
  h2 {
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    position: relative;
    padding-left: 16px;
    
    @media (max-width: 768px) {
      font-size: 20px;
      padding-left: 12px;
    }
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 5px;
      height: 28px;
      background: ${props => props.theme.colors.gradientPrimary};
      border-radius: 3px;
      
      @media (max-width: 768px) {
        width: 4px;
        height: 22px;
      }
    }
  }
`;

const ViewAllButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  &:hover {
    opacity: 0.9;
    transform: translateX(2px);
  }
  
  transition: all 0.2s;
`;

const BoostSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 24px;
  margin-bottom: 40px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const BoostCard = styled.div`
  background: ${props => props.$bgColor || 'white'};
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const BoostHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  
  .icon-wrapper {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.$iconBg || '#FEF3C7'};
    
    svg {
      width: 18px;
      height: 18px;
      color: ${props => props.$iconColor || '#D97706'};
    }
  }
  
  h3 {
    font-size: 24px;
    font-weight: 800;
    color: #111827;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const BoostMainStat = styled.div`
  background: #FFF9F0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .top-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .number {
      font-size: 28px;
      font-weight: 800;
      color: #111827;
    }

    .label {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
    }

    .change {
      font-size: 12px;
      font-weight: 600;
      color: #059669;
      background: #D1FAE5;
      padding: 4px 8px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 3px;
      
      svg {
        width: 12px;
        height: 12px;
      }
    }
  }

  .bottom-row {
    font-size: 15px;
    color: #4B5563;
    font-weight: 500;
    
    span {
      color: #111827;
      font-weight: 700;
    }
  }
`;

const BoostOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const BoostOption = styled.div`
  background: white;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #F3F4F6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
  
  &:hover {
    border-color: #E5E7EB;
    transform: translateY(-1px);
  }
  
  .icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.$iconBg || '#EFF6FF'};
    flex-shrink: 0;
    
    svg {
      width: 18px;
      height: 18px;
      color: ${props => props.$iconColor || '#3B82F6'};
    }
  }
  
  .content {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .name {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
    
    .count {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      
      span {
        font-size: 12px;
        font-weight: 500;
        color: #6B7280;
        margin-left: 2px;
      }
    }
  }
`;

const ChartsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 40px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const RevenueSection = styled.div`
  margin-bottom: 40px;
`;

const RevenueChartCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
`;

const RevenueStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const RevenueStatBox = styled.div`
  background: ${props => props.$bgColor || '#EFF6FF'};
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  
  .icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    
    svg {
      width: 22px;
      height: 22px;
      color: ${props => props.$iconColor || '#1E40AF'};
    }
  }
  
  .content {
    flex: 1;
    
    .label {
      font-size: 13px;
      font-weight: 500;
      color: #64748B;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .value {
      font-size: 20px;
      font-weight: 700;
      color: #1E293B;
      letter-spacing: -0.5px;
    }
  }
`;

const ChartCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    font-size: 16px;
    font-weight: 700;
    color: #1F2937;
  }
`;

const ChartFilters = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  
  button {
    padding: 6px 12px;
    border: 1px solid #E5E7EB;
    background: white;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    color: #6B7280;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover, &.active {
      background: #EFF6FF;
      border-color: #3B82F6;
      color: #1E40AF;
    }
  }
`;

const ChartLegend = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
  }
`;

const ChartContainer = styled.div`
  height: 300px;
  position: relative;
`;

const SimpleBarChart = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 320px;
  padding: 40px 20px 10px;
  background-image: linear-gradient(#f9fafb 1px, transparent 1px);
  background-size: 100% 40px;
`;

const BarGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 20px 25px;
  background: #F8FAFC;
  border-radius: 16px;
  border: 1px solid #F1F5F9;
  transition: all 0.3s;
  flex: 1;
  max-width: 220px;
  
  &:hover {
    background: #F1F5F9;
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  
  .bars {
    display: flex;
    align-items: flex-end;
    gap: 15px;
    height: 220px;
    justify-content: center;
  }
  
  .bar {
    width: 20px;
    border-radius: 4px 4px 0 0;
    transition: all 0.3s;
    cursor: pointer;
    
    &:hover {
      opacity: 0.8;
    }
  }
  
  .label {
    font-size: 11px;
    color: #6B7280;
    font-weight: 500;
  }
`;

const SimpleLineChart = styled.div`
  height: 400px;
  position: relative;
  padding: 20px 0;
`;

const LineChartSvg = styled.svg`
  width: 100%;
  height: 100%;
`;

const TableWrapper = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 2px solid ${props => props.theme.colors.border};
  overflow-x: auto;
  box-shadow: ${props => props.theme.shadows.card};
  
  @media (max-width: 768px) {
    border-radius: ${props => props.theme.borderRadius.md};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
  
  @media (max-width: 768px) {
    min-width: 600px;
  }
  
  th {
    text-align: left;
    padding: 16px 20px;
    background: ${props => props.theme.colors.bgDark};
    font-weight: 700;
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid ${props => props.theme.colors.border};
    white-space: nowrap;
    
    @media (max-width: 768px) {
      padding: 12px 10px;
      font-size: 11px;
    }
  }
  
  td {
    padding: 16px 20px;
    border-bottom: 1px solid ${props => props.theme.colors.border};
    font-size: 14px;
    
    @media (max-width: 768px) {
      padding: 12px 10px;
      font-size: 12px;
    }
  }
  
  tbody tr:last-child td {
    border-bottom: none;
  }
  
  tbody tr {
    transition: all 0.2s;
    cursor: pointer;
    
    &:hover {
      background: ${props => props.theme.colors.bgDark};
    }
  }
`;

const VerificationBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$verified ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.$verified ? '#15803d' : '#dc2626'};
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    if (props.$status === 'success') return '#dcfce7';
    if (props.$status === 'danger') return '#fee2e2';
    return '#fef3c7';
  }};
  color: ${props => {
    if (props.$status === 'success') return '#15803d';
    if (props.$status === 'danger') return '#dc2626';
    return '#ca8a04';
  }};
`;

const DateText = styled.span`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  display: block;
  
  &.interview {
    color: ${props => props.theme.colors.primary};
    font-weight: 600;
  }
`;

const SpotlightSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 40px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const SpotlightCard = styled.div`
  background: ${props => props.$bgColor || '#F0F9FF'};
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const SpotlightBadge = styled.div`
  background: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
  color: ${props => props.$color || '#1E40AF'};
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const SpotlightSelector = styled.div`
  position: absolute;
  top: 60px;
  left: 24px;
  z-index: 100;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #E5E7EB;
  width: 280px;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
  
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const SelectorOption = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #F3F4F6;
    color: ${props => props.$color || '#3B82F6'};
  }
  
  &.active {
    background: #EFF6FF;
    color: #2563EB;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const SpotlightTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 20px;
  margin-top: 0;
`;

const SpotlightList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SpotlightItem = styled.div`
  background: white;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid transparent; /* Tránh nhảy kích thước khi hover hoặc border thay đổi */
  min-height: 85px; /* Đảm bảo chiều cao tối thiểu bằng nhau */
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
  
  @media (max-width: 768px) {
    padding: 12px;
    gap: 10px;
  }
`;

const SpotlightAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.$bgColor || '#E0E7FF'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  color: ${props => props.$color || '#4F46E5'};
  flex-shrink: 0;
`;

const SpotlightContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const SpotlightName = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SpotlightMeta = styled.div`
  font-size: 12px;
  color: #6B7280;
  font-weight: 500;
`;

const SpotlightBadgeStatus = styled.div`
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$bgColor || '#DBEAFE'};
  color: ${props => props.$color || '#1E40AF'};
  flex-shrink: 0;
  text-align: center;
  min-width: 100px;
  line-height: 1.3;
`;

const ManagementSection = styled.div`
  margin-bottom: 40px;
`;

const ManagementTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 24px;
  padding-left: 16px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 5px;
    height: 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 3px;
  }
`;

const ManagementGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;

const ManagementCard = styled.div`
  background: ${props => props.$bgColor || '#F0F9FF'};
  border-radius: 16px;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: auto 1fr auto auto auto auto auto;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
  
  @media (max-width: 1024px) {
    grid-template-columns: auto 1fr auto;
    gap: 12px;
  }
`;

const ManagementAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: ${props => props.$bgColor || '#1F2937'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: white;
  flex-shrink: 0;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ManagementInfo = styled.div`
  flex: 1;
  min-width: 0;
  
  @media (max-width: 1024px) {
    flex: 1;
  }
`;

const ManagementName = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ManagementMeta = styled.div`
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
`;

const ManagementColumn = styled.div`
  text-align: center;
  min-width: 100px;
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

const ManagementColumnLabel = styled.div`
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const ManagementColumnValue = styled.div`
  font-size: 15px;
  color: #1F2937;
  font-weight: 700;
`;

const ManagementStatus = styled.div`
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$bgColor || '#DBEAFE'};
  color: ${props => props.$color || '#1E40AF'};
  white-space: nowrap;
  text-align: center;
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

const ManagementAction = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 20px;
    height: 20px;
    color: #6B7280;
  }
  
  &:hover svg {
    color: #1F2937;
  }
  
  @media (max-width: 1024px) {
    width: 36px;
    height: 36px;
  }
`;

const AdminDashboard = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [activeSpotlight, setActiveSpotlight] = useState('banner');
  const [showSelector, setShowSelector] = useState(false);
  
  // Real Data State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalEmployers: 0,
    totalJobPosts: 0,
    totalApplications: 0,
    urgentJobs: 0,
    standardJobs: 0,
    totalRevenue: 0,
    trends: {}
  });
  const [employers, setEmployers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [allJobPosts, setAllJobPosts] = useState([]);
  const [applications, setApplications] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [chartData, setChartData] = useState({
    activityData: [],
    quarterlyData: [],
    revenueTrend: []
  });

  // Change Request state
  const [changeRequests, setChangeRequests] = useState([]);
  const [crLoading, setCrLoading] = useState(false);
  const [crActionLoading, setCrActionLoading] = useState(null); // applicationId being processed
  const [rejectModal, setRejectModal] = useState(null); // { applicationId, candidateName }
  const [rejectNotes, setRejectNotes] = useState('');

  // AI Urgent recommendations
  const [showRecsModal, setShowRecsModal] = useState(false);
  const [activeRecommendations, setActiveRecommendations] = useState(null);
  const [recJobTitle, setRecJobTitle] = useState('');

  // WebSocket state
  const [wsStatus, setWsStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'
  const wsRef = useRef(null);
  const wsRetryCount = useRef(0);
  const wsRetryTimer = useRef(null);
  const newCardTimers = useRef({}); // { applicationId: timerId }
  const [newCardIds, setNewCardIds] = useState(new Set()); // IDs hiển thị badge "Mới"

  const WS_ENDPOINT = import.meta.env.VITE_ADMIN_WS_ENDPOINT || '';
  const WS_MAX_RETRY = 5;
  const WS_RETRY_DELAY = 3000;

  const clearNewBadge = useCallback((applicationId) => {
    setNewCardIds(prev => {
      const next = new Set(prev);
      next.delete(applicationId);
      return next;
    });
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!WS_ENDPOINT) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    setWsStatus('connecting');
    const ws = new WebSocket(WS_ENDPOINT);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      wsRetryCount.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'NEW_REQUEST') {
          const newReq = msg.data;
          setChangeRequests(prev => {
            // Tránh trùng lặp
            if (prev.some(r => r.applicationId === newReq.applicationId)) return prev;
            return [newReq, ...prev];
          });
          // Thêm badge "Mới" trong 5 giây
          setNewCardIds(prev => new Set([...prev, newReq.applicationId]));
          if (newCardTimers.current[newReq.applicationId]) {
            clearTimeout(newCardTimers.current[newReq.applicationId]);
          }
          newCardTimers.current[newReq.applicationId] = setTimeout(() => {
            clearNewBadge(newReq.applicationId);
            delete newCardTimers.current[newReq.applicationId];
          }, 5000);
        } else if (msg.type === 'REQUEST_UPDATED') {
          const updated = msg.data;
          // Xoá khỏi danh sách nếu không còn pending_change
          if (updated.status && updated.status !== 'pending_change') {
            setChangeRequests(prev => prev.filter(r => r.applicationId !== updated.applicationId));
          }
        }
      } catch (e) {
        console.warn('AdminDashboard WS: lỗi parse message', e);
      }
    };

    ws.onerror = () => {
      setWsStatus('disconnected');
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      wsRef.current = null;
      // Tự động reconnect tối đa WS_MAX_RETRY lần
      if (wsRetryCount.current < WS_MAX_RETRY) {
        wsRetryCount.current += 1;
        wsRetryTimer.current = setTimeout(() => {
          connectWebSocket();
        }, WS_RETRY_DELAY);
      }
    };
  }, [WS_ENDPOINT, clearNewBadge]);

  useEffect(() => {
    fetchDashboardData();
    fetchChangeRequests();
    connectWebSocket();

    return () => {
      // Cleanup WebSocket khi unmount
      if (wsRetryTimer.current) clearTimeout(wsRetryTimer.current);
      Object.values(newCardTimers.current).forEach(clearTimeout);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Ngăn reconnect khi unmount
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const fetchChangeRequests = async () => {
    setCrLoading(true);
    try {
      const list = await applicationService.listChangeRequests();
      // Normalize data — đồng nhất với EmployersManagement.loadChangeRequests
      const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const enhanced = (list || []).map(app => {
        // Normalize changeRequest (support stringified JSON)
        let cr = app.changeRequest || app.change_request || null;
        if (cr && typeof cr === 'string') {
          try { cr = JSON.parse(cr); } catch (e) { /* leave as-is */ }
        }

        // Resolve employer name — skip UUID values
        const rawEmployer = app.employerName || app.companyName || '';
        const employerNameDisplay = rawEmployer && !isUUID(rawEmployer) ? rawEmployer : '(Không xác định)';

        // Resolve worker name — skip UUID values
        const rawWorker = app.workerName || app.candidateName || '';
        const workerNameDisplay = rawWorker && !isUUID(rawWorker) ? rawWorker : '(Không xác định)';

        return {
          ...app,
          employerName: employerNameDisplay,
          companyName: employerNameDisplay,
          workerName: workerNameDisplay,
          candidateName: workerNameDisplay,
          changeRequest: cr,
          changeRequestStatus: app.changeRequestStatus || app.change_request_status || ''
        };
      });
      setChangeRequests(enhanced);
    } catch (e) {
      console.error('Failed to load change requests', e);
    } finally {
      setCrLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching Admin Dashboard data from database via AdminReportService...');
      
      const data = await adminReportService.getReportsData();
      
      const calculatedStats = adminReportService.calculateStats(data);
      const activity = adminReportService.getActivityData(data);
      const quarterly = adminReportService.getQuarterlyData(data);
      const revenueTrend = adminReportService.getRevenueByMonth(data.subscriptions);
      
      setEmployers(data.employers);
      setCandidates(data.candidates);
      setAllJobPosts([...data.standardJobs, ...data.quickJobs]);
      setApplications(data.applications);
      setSubscriptions(data.subscriptions);

      setStats({
        ...calculatedStats,
        totalJobPosts: calculatedStats.totalStandardJobs + calculatedStats.totalQuickJobs,
        urgentJobs: calculatedStats.totalQuickJobs,
        standardJobs: calculatedStats.totalStandardJobs,
        totalApplications: data.applications.length
      });

      setChartData({
        activityData: activity,
        quarterlyData: quarterly,
        revenueTrend: revenueTrend
      });

      console.log('✅ Dashboard data synchronized with database');
      console.log(`💰 Commission (15%) calculated from ${calculatedStats.totalQuickJobs} urgent jobs`);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const spotlightOptions = [
    {
      id: 'banner',
      label: language === 'vi' ? 'Top Spotlight Banner Đang Chạy' : 'Top Spotlight Banner Running',
      title: language === 'vi' ? 'Nhà Tuyển Dụng Nổi Bật' : 'Featured Employers',
      icon: Star,
      color: '#0284C7',
      bgColor: '#E0F2FE'
    },
    {
      id: 'quick_boost',
      label: language === 'vi' ? 'Top Quick Boost Đang Chạy' : 'Top Quick Boost Running',
      title: language === 'vi' ? 'Ưu Tiên Quick Boost' : 'Quick Boost Favorites',
      icon: Zap,
      color: '#1E40AF',
      bgColor: '#DBEAFE'
    },
    {
      id: 'hot_search',
      label: language === 'vi' ? 'Top Hot Search Đang Chạy' : 'Top Hot Search Running',
      title: language === 'vi' ? 'Hot Search Phổ Biến' : 'Popular Hot Searches',
      icon: TrendingUp,
      color: '#DC2626',
      bgColor: '#FEE2E2'
    },
    {
      id: 'spotlight',
      label: language === 'vi' ? 'Top Spotlight Đang Chạy' : 'Top Spotlight Running',
      title: language === 'vi' ? 'Ưu Tiên Spotlight' : 'Spotlight Favorites',
      icon: Sparkles,
      color: '#7C3AED',
      bgColor: '#EDE9FE'
    }
  ];

  const currentOption = spotlightOptions.find(opt => opt.id === activeSpotlight);
  const Icon = currentOption.icon;

  // Calculate real statistics from data
  const totalCandidatesValue = stats.totalCandidates;
  const totalEmployersValue = stats.totalEmployers;
  const totalJobPostsValue = stats.totalJobPosts;
  const totalApplicationsValue = stats.totalApplications;

  const totalRevenue = stats.totalRevenue || 0;
  
  // Calculate specific revenue segments for footer display
  const revenueFromBoost = allJobPosts.filter(j => j.category === 'urgent' || j.jobType === 'urgent').length * 100000;
  const revenueFromHotSearch = allJobPosts.filter(j => j.views > 200).length * 200000;
  const revenueFromBanner = allJobPosts.filter(j => j.featured).length * 500000;
  const revenueFromTopSpotlight = allJobPosts.filter(j => j.jobType === 'hot').length * 800000;

  // Real data for charts - calculated from actual job posts
  const urgentJobs = allJobPosts.filter(post => post.category === 'urgent' || post.category === 'quick-jobs' || post.jobType === 'urgent').length;
  const standardJobsValue = allJobPosts.filter(post => post.category === 'standard' || post.category === 'standard-jobs').length;

  // Calculate commission (Hoa Hồng) - 15% of total salary of urgent/quick jobs
  const totalQuickSalary = allJobPosts
    .filter(j => j.category === 'urgent' || j.category === 'quick-jobs' || j.jobType === 'urgent')
    .reduce((sum, j) => sum + (Number(j.totalSalary) || 0), 0);
  const totalCommission = totalQuickSalary * 0.15;

  // Activity data - calculated from real job posts data
  // Showing cumulative growth over 7 days based on actual total posts
  const totalPosts = allJobPosts.length; // From database
  const conversionRate = 0.65; // 65% of posts get applications (realistic for part-time jobs)

  const activityData = chartData.activityData;
  const quarterlyJobData = chartData.quarterlyData.map(q => ({
    label: q.name,
    standard: Math.round(q.jobs * 0.7 * 10), // simulated application multiplier for visual
    standardPosts: Math.round(q.jobs * 0.7),
    quick: Math.round(q.jobs * 0.3 * 10),
    quickPosts: Math.round(q.jobs * 0.3)
  }));

  const revenueTrendData = chartData.revenueTrend.map(d => ({
    month: d.month,
    actual: d.revenue,
    target: d.target
  }));

  const getApprovalStatusText = (status) => {
    if (status === 'approved') return language === 'vi' ? 'Đã duyệt' : 'Approved';
    if (status === 'rejected') return language === 'vi' ? 'Không duyệt' : 'Rejected';
    if (status === 'pending') return language === 'vi' ? 'Chờ duyệt' : 'Pending';
    return status;
  };

  const getApprovalStatusVariant = (status) => {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    return 'warning';
  };

  // Platform data for urgent jobs section
  const platformData = {
    totalJobs: urgentJobs,
    change: `+${Math.round((urgentJobs / (totalJobPostsValue || 1)) * 100)}%`,
    discount: '15%',
    price: totalCommission > 0 
      ? new Intl.NumberFormat('vi-VN').format(Math.round(totalCommission)) + ' VND'
      : '0 VND'
  };

  // Boost packages data - derived from actual counts
  const boostPackages = [
    { name: language === 'vi' ? 'Quick Boost' : 'Quick Boost', count: urgentJobs, iconBg: '#DBEAFE', iconColor: '#1E40AF' },
    { name: language === 'vi' ? 'Spotlight Banner' : 'Spotlight Banner', count: allJobPosts.filter(j => j.featured).length, iconBg: '#E0E7FF', iconColor: '#4F46E5' },
    { name: language === 'vi' ? 'Hot Search' : 'Hot Search', count: allJobPosts.filter(j => j.views > 200).length, iconBg: '#FEE2E2', iconColor: '#DC2626' },
    { name: language === 'vi' ? 'Top Spotlight' : 'Top Spotlight', count: allJobPosts.filter(j => j.jobType === 'hot').length, iconBg: '#FCE7F3', iconColor: '#BE185D' }
  ];

  // Top Employers - Nhà tuyển dụng nổi bật (Từ database)
  const spotlightData = {
    banner: allJobPosts.filter(j => j.featured).slice(0, 4).map(j => ({
      id: j.idJob || j.id,
      name: j.employerName || j.companyName || 'Employer',
      type: j.category || 'Standard',
      daysRemaining: 7,
      budget: '4.000'
    })),
    quick_boost: allJobPosts.filter(j => j.category === 'urgent').slice(0, 4).map(j => ({
      id: j.idJob || j.id,
      name: j.employerName || j.companyName || 'Employer',
      type: 'Urgent',
      daysRemaining: 3,
      budget: '3.500'
    })),
    hot_search: allJobPosts.filter(j => j.views > 200).slice(0, 4).map(j => ({
      id: j.idJob || j.id,
      name: j.employerName || j.companyName || 'Employer',
      type: 'Trending',
      daysRemaining: 5,
      budget: '6.000'
    })),
    spotlight: allJobPosts.slice(0, 4).map(j => ({
      id: j.idJob || j.id,
      name: j.employerName || j.companyName || 'Employer',
      type: 'Spotlight',
      daysRemaining: 10,
      budget: '10.000'
    }))
  };

  // Fallback if empty
  if (spotlightData.banner.length === 0) spotlightData.banner = [{ id: 0, name: 'Sẵn sàng vị trí', type: 'Banner', daysRemaining: 0, budget: '0' }];
  if (spotlightData.quick_boost.length === 0) spotlightData.quick_boost = [{ id: 0, name: 'Sẵn sàng vị trí', type: 'Quick', daysRemaining: 0, budget: '0' }];
  if (spotlightData.hot_search.length === 0) spotlightData.hot_search = [{ id: 0, name: 'Sẵn sàng vị trí', type: 'Hot', daysRemaining: 0, budget: '0' }];
  if (spotlightData.spotlight.length === 0) spotlightData.spotlight = [{ id: 0, name: 'Sẵn sàng vị trí', type: 'Spotlight', daysRemaining: 0, budget: '0' }];

  const currentSpotlightList = spotlightData[activeSpotlight] || spotlightData.banner;

  // Top Candidates - Ứng viên mới (Từ database)
  const topCandidates = candidates.slice(0, 4).map(can => ({
    id: can.userId,
    name: can.fullName || (can.email ? can.email.split('@')[0] : (can.userId ? `ID: ${can.userId.substring(0, 8)}` : (language === 'vi' ? 'Ứng viên mới' : 'New Candidate'))),
    status: 'verified',
    joinedTime: can.createdAt ? new Date(can.createdAt).toLocaleDateString() : 'Recently',
    ekycStatus: language === 'vi' ? 'Đã Duyệt Xác Thực' : 'Verified'
  }));

  // Fallback if empty
  if (topCandidates.length === 0) {
    topCandidates.push({ id: 0, name: 'Đang chờ ứng viên', status: 'pending', joinedTime: '-', ekycStatus: '-' });
  }

  // Management Posts - Bài đăng cần quản lý (Lấy từ database)
  const managementPosts = allJobPosts.slice(0, 4).map(post => ({
    id: post.idJob || post.id,
    employer: post.employerName || post.companyName || 'Unknown Employer',
    type: post.title,
    time: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently',
    status: post.status?.toUpperCase() || 'ACTIVE',
    statusColor: post.status === 'active' ? { bg: '#D1FAE5', color: '#059669' } : { bg: '#FEF3C7', color: '#D97706' },
    joinDate: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''
  }));

  // Management Candidates - Kết hợp Ứng viên và Nhà tuyển dụng mới (Lấy từ database)
  const managementCandidates = [
    ...employers.slice(0, 2).map(emp => ({
      id: `emp-${emp.userId || emp.id}`,
      name: emp.companyName || emp.businessName || 'New Employer',
      joinDate: emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'Recently',
      verified: emp.isVerified ? 'DA_DUYET' : 'CHUA',
      verifiedColor: emp.isVerified ? { bg: '#D1FAE5', color: '#059669' } : { bg: '#FEE2E2', color: '#DC2626' },
      status: emp.approvalStatus?.toUpperCase() || 'PENDING',
      statusColor: emp.approvalStatus === 'approved' ? { bg: '#D1FAE5', color: '#059669' } : { bg: '#FEF3C7', color: '#D97706' },
      approvalDate: emp.approvedAt ? new Date(emp.approvedAt).toLocaleDateString() : '-'
    })),
    ...candidates.slice(0, 2).map(can => ({
      id: `can-${can.userId || can.id}`,
      name: can.fullName || (can.email ? can.email.split('@')[0] : (can.userId ? `ID: ${can.userId.substring(0, 8)}` : (language === 'vi' ? 'Ứng viên mới' : 'New Candidate'))),
      joinDate: can.createdAt ? new Date(can.createdAt).toLocaleDateString() : 'Recently',
      verified: 'DA_DUYET',
      verifiedColor: { bg: '#D1FAE5', color: '#059669' },
      status: 'VERIFIED',
      statusColor: { bg: '#D1FAE5', color: '#059669' },
      approvalDate: can.updatedAt ? new Date(can.updatedAt).toLocaleDateString() : '-'
    }))
  ];

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <DashboardContainer style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Rocket className="animate-bounce" style={{ width: '48px', height: '48px', color: '#6366f1', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              {language === 'vi' ? 'Đang tải dữ liệu hệ thống...' : 'Syncing system data...'}
            </h2>
          </div>
        </DashboardContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" key={language}>
      <DashboardContainer>
        {/* ===== YÊU CẦU THAY ĐỔI NHÂN VIÊN — đầu trang ===== */}
        <Section style={{ marginBottom: '36px' }}>
          <SectionHeader>
            <h2>
              <AlertCircle size={20} style={{ display: 'inline', marginRight: 8, color: '#F97316', verticalAlign: 'middle' }} />
              {language === 'vi' ? 'Yêu cầu thay đổi nhân viên' : 'Staff Change Requests'}
              {changeRequests.length > 0 && (
                <span style={{
                  marginLeft: 10, background: '#F97316', color: 'white',
                  borderRadius: '50%', padding: '2px 8px', fontSize: 13, fontWeight: 700
                }}>{changeRequests.length}</span>
              )}
              {/* Chỉ báo trạng thái WebSocket */}
              {WS_ENDPOINT && (
                <span style={{
                  marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 600, verticalAlign: 'middle',
                  color: wsStatus === 'connected' ? '#10B981' : wsStatus === 'connecting' ? '#F59E0B' : '#94A3B8'
                }}>
                  {wsStatus === 'connected'
                    ? <><Wifi size={13} />Realtime</>
                    : wsStatus === 'connecting'
                    ? <><WifiOff size={13} />Đang kết nối...</>
                    : <><WifiOff size={13} />Offline</>}
                </span>
              )}
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {changeRequests.length > 5 && (
                <button
                  onClick={() => navigate('/admin/employers', { state: { activeTab: 'change_requests' } })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', background: '#FFF7ED', border: '1.5px solid #FED7AA',
                    borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#F97316'
                  }}
                >
                  {language === 'vi' ? `Xem thêm (${changeRequests.length - 5})` : `View more (${changeRequests.length - 5})`}
                  <ArrowRight size={14} />
                </button>
              )}
              <button
                onClick={fetchChangeRequests}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                  borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569'
                }}
              >
                <RefreshCw size={14} />{language === 'vi' ? 'Làm mới' : 'Refresh'}
              </button>
            </div>
          </SectionHeader>

          {crLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              {language === 'vi' ? 'Đang tải...' : 'Loading...'}
            </div>
          ) : changeRequests.length === 0 ? (
            <div style={{
              padding: '40px', textAlign: 'center', background: '#F8FAFC',
              borderRadius: 16, border: '1.5px dashed #E2E8F0', color: '#94A3B8'
            }}>
              <AlertCircle size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {language === 'vi' ? 'Không có yêu cầu nào đang chờ duyệt' : 'No pending change requests'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...changeRequests]
                .sort((a, b) => {
                  const aTime = new Date(a.changeRequest?.requestedAt || a.updatedAt || 0).getTime();
                  const bTime = new Date(b.changeRequest?.requestedAt || b.updatedAt || 0).getTime();
                  return bTime - aTime;
                })
                .slice(0, 5)
                .map(req => {
                const cr = req.changeRequest || {};
                const isNew = newCardIds.has(req.applicationId);
                const crStatus = String(req.changeRequestStatus || '').toLowerCase();
                const appStatus = String(req.status || '');
                const isPending = crStatus !== 'approved' && crStatus !== 'rejected' && appStatus !== 'ĐÃ_BỊ_THAY_THẾ';
                const isApproved = crStatus === 'approved';
                const isRejected = crStatus === 'rejected';
                const borderColor = isApproved ? '#BBF7D0' : isRejected ? '#FECACA' : (isNew ? '#FED7AA' : '#FFEDD5');
                const bgColor = isApproved ? '#F0FDF4' : isRejected ? '#FEF2F2' : 'white';

                // Loại thay đổi — đồng nhất với EmployersManagement
                const typeViMap = { cancel_shift: 'Huỷ ca làm', staff_replacement: 'Thay thế nhân viên', change_worker: 'Thay đổi nhân viên' };
                const typeLabel = typeViMap[cr.type] || cr.typeLabel || cr.type || '(Không xác định)';
                const isReplacement = cr.type === 'staff_replacement' || cr.type === 'change_worker';
                const reasonLabel = cr.reasonType || '';
                const detailLabel = cr.reasonDetail || cr.reason || '';

                return (
                  <div key={req.applicationId} style={{
                    background: bgColor, border: `1.5px solid ${borderColor}`,
                    borderRadius: 16, padding: '20px 24px',
                    display: 'grid', gridTemplateColumns: '1fr auto', gap: 16,
                    alignItems: 'center', boxShadow: '0 2px 8px rgba(249,115,22,0.07)',
                    animation: isNew ? 'crFadeIn 0.4s ease-out' : 'none'
                  }}>
                    <div>
                      {/* Row 1: status badge + NEW badge + job title */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        {isPending && (
                          <div style={{ background: '#FFF7ED', borderRadius: 10, padding: '5px 11px', fontSize: 12, fontWeight: 700, color: '#F97316', border: '1px solid #FFEDD5', whiteSpace: 'nowrap' }}>
                            ⏳ {language === 'vi' ? 'Chờ duyệt' : 'Pending'}
                          </div>
                        )}
                        {isApproved && (
                          <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '5px 11px', fontSize: 12, fontWeight: 700, color: '#16A34A', border: '1px solid #BBF7D0', whiteSpace: 'nowrap' }}>
                            ✅ {language === 'vi' ? 'Đã duyệt' : 'Approved'}
                          </div>
                        )}
                        {isRejected && (
                          <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '5px 11px', fontSize: 12, fontWeight: 700, color: '#DC2626', border: '1px solid #FECACA', whiteSpace: 'nowrap' }}>
                            ✕ {language === 'vi' ? 'Từ chối' : 'Rejected'}
                          </div>
                        )}
                        {isNew && (
                          <span style={{ background: '#EF4444', color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800, letterSpacing: '0.5px' }}>MỚI</span>
                        )}
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>
                          {req.jobTitle || req._jobTitle || req.applicationId}
                        </div>
                      </div>

                      {/* Row 2: employer + worker + job ID */}
                      <div style={{ fontSize: 13, color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '4px 20px', marginBottom: 8 }}>
                        <span>🏢 {language === 'vi' ? 'Nhà tuyển dụng:' : 'Employer:'} <b style={{ color: '#334155' }}>{req.employerName || req.companyName || req.employerId || '-'}</b></span>
                        <span>👤 {language === 'vi' ? 'Nhân viên:' : 'Worker:'} <b style={{ color: '#334155' }}>{req.workerName || req.candidateName || req.candidateId || '-'}</b></span>
                        <span style={{ color: '#94A3B8' }}>Job ID: {req.jobId || '-'}</span>
                      </div>

                      {/* Row 3: change type + reason + date */}
                      <div style={{ fontSize: 13, color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '4px 20px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {isReplacement ? '👥' : '🕐'}
                          <b style={{ color: '#F97316' }}>{typeLabel}</b>
                        </span>
                        {reasonLabel && (
                          <span>↳ <b style={{ color: '#DC2626' }}>{reasonLabel}</b></span>
                        )}
                        {detailLabel && (
                          <span style={{ fontStyle: 'italic', color: '#475569' }}>💬 "{detailLabel}"</span>
                        )}
                        <span>🕐 {cr.requestedAt || (req.updatedAt ? new Date(req.updatedAt).toLocaleString('vi-VN') : '-')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                      {isPending ? (
                        <>
                          <button
                            disabled={crActionLoading === req.applicationId}
                            onClick={async () => {
                              setCrActionLoading(req.applicationId);
                              try {
                                const result = await applicationService.approveChangeRequest(req.applicationId);
                                setChangeRequests(prev => prev.map(r =>
                                  r.applicationId === req.applicationId ? { ...r, changeRequestStatus: 'approved' } : r
                                ));
                                const cr = req.changeRequest || {};
                                await Promise.allSettled([
                                  createWorkerReplacedNotification({
                                    workerId: result.workerId || req.candidateId || cr.workerId,
                                    jobLocation: result.jobLocation || req.jobLocation,
                                    workDateDisplay: result.workDateDisplay || req.jobWorkDate,
                                    jobTitle: result.jobTitle || req.jobTitle,
                                    reasonType: result.reasonType || cr.reasonType,
                                    reasonDetail: result.reasonDetail || cr.reasonDetail || cr.reason
                                  }),
                                  createChangeRequestApprovedNotification({
                                    employerId: result.employerId || req.employerId,
                                    companyName: req.employerName,
                                    candidateName: req.candidateName,
                                    changeRequestType: cr.reasonType,
                                    applicationId: req.applicationId
                                  })
                                ]);
                                if (result.recommendations) {
                                  setActiveRecommendations(result.recommendations);
                                  setRecJobTitle(result.jobTitle || req.jobTitle || 'Ca làm');
                                  setShowRecsModal(true);
                                }
                              } catch (e) {
                                alert(language === 'vi' ? `Lỗi: ${e.message}` : `Error: ${e.message}`);
                              } finally {
                                setCrActionLoading(null);
                              }
                            }}
                            style={{
                              padding: '10px 18px', borderRadius: 10, border: 'none',
                              background: crActionLoading === req.applicationId ? '#E2E8F0' : 'linear-gradient(135deg, #10B981, #059669)',
                              color: 'white', fontWeight: 700, fontSize: 13,
                              cursor: crActionLoading === req.applicationId ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {crActionLoading === req.applicationId ? '...' : (language === 'vi' ? '✔ Duyệt' : '✔ Approve')}
                          </button>
                          <button
                            disabled={crActionLoading === req.applicationId}
                            onClick={() => {
                              setRejectModal({ applicationId: req.applicationId, candidateName: req.candidateName || req.applicationId });
                              setRejectNotes('');
                            }}
                            style={{
                              padding: '10px 18px', borderRadius: 10, border: '1.5px solid #FECACA',
                              background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: 13,
                              cursor: crActionLoading === req.applicationId ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {language === 'vi' ? '✕ Từ chối' : '✕ Reject'}
                          </button>
                        </>
                      ) : (
                        <div style={{
                          fontSize: 13, fontWeight: 600, padding: '10px 4px',
                          color: isApproved ? '#16A34A' : '#DC2626'
                        }}>
                          {isApproved
                            ? (language === 'vi' ? '✅ Đã xử lý' : '✅ Processed')
                            : (language === 'vi' ? '✕ Đã từ chối' : '✕ Rejected')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* 4 Thống kê chính */}
        <StatsGrid>
          <StatBox $borderColor="#667eea">
            <StatHeader>
              <StatIcon $bgColor="#667eea">
                <Users />
              </StatIcon>
              <StatContent>
                <StatTitle>{language === 'vi' ? 'Tổng ứng viên' : 'Total Candidates'}</StatTitle>
                <StatValue>
                  {totalCandidatesValue.toLocaleString()}
                  <StatChange $positive={!stats.trends.candidates?.startsWith('-')}>
                    ↗ {stats.trends.candidates || '0%'}
                  </StatChange>
                </StatValue>
              </StatContent>
            </StatHeader>
            <StatDescription>
              {language === 'vi' ? 'so với tháng trước' : 'vs last month'}
            </StatDescription>
          </StatBox>

          <StatBox $borderColor="#10b981">
            <StatHeader>
              <StatIcon $bgColor="#10b981">
                <Building2 />
              </StatIcon>
              <StatContent>
                <StatTitle>{language === 'vi' ? 'Tổng nhà tuyển dụng' : 'Total Employers'}</StatTitle>
                <StatValue>
                  {totalEmployersValue.toLocaleString()}
                  <StatChange $positive={!stats.trends.employers?.startsWith('-')}>
                    ↗ {stats.trends.employers || '0%'}
                  </StatChange>
                </StatValue>
              </StatContent>
            </StatHeader>
            <StatDescription>
              {language === 'vi' ? 'so với tháng trước' : 'vs last month'}
            </StatDescription>
          </StatBox>

          <StatBox $borderColor="#3b82f6">
            <StatHeader>
              <StatIcon $bgColor="#3b82f6">
                <Briefcase />
              </StatIcon>
              <StatContent>
                <StatTitle>{language === 'vi' ? 'Bài đăng tuyển dụng' : 'Job Posts'}</StatTitle>
                <StatValue>
                  {totalJobPostsValue.toLocaleString()}
                  <StatChange $positive={!stats.trends.standardJobs?.startsWith('-')}>
                    ↗ {stats.trends.standardJobs || '0%'}
                  </StatChange>
                </StatValue>
              </StatContent>
            </StatHeader>
            <StatDescription>
              {language === 'vi' ? 'so với tháng trước' : 'vs last month'}
            </StatDescription>
          </StatBox>

          <StatBox $borderColor="#f59e0b">
            <StatHeader>
              <StatIcon $bgColor="#f59e0b">
                <DollarSign />
              </StatIcon>
              <StatContent>
                <StatTitle>{language === 'vi' ? 'Tổng doanh thu' : 'Total Revenue'}</StatTitle>
                <StatValue>
                  {(totalRevenue / 1000000).toFixed(1)}M
                  <StatChange $positive={!stats.trends.revenue?.startsWith('-')}>
                    ↗ {stats.trends.revenue || '0%'}
                  </StatChange>
                </StatValue>
              </StatContent>
            </StatHeader>
            <StatDescription>
              {language === 'vi' ? 'VND - tháng này' : 'VND - this month'}
            </StatDescription>
          </StatBox>
        </StatsGrid>

        {/* Tin tuyển gấp & Gói Boost */}
        <BoostSection>
          {/* Tin tuyển gấp */}
          <BoostCard>
            <BoostHeader $iconBg="#FEF3C7" $iconColor="#F59E0B">
              <h3>{language === 'vi' ? 'BÀI TUYỂN GẤP' : 'URGENT JOBS'}</h3>
            </BoostHeader>
            <BoostMainStat>
              <div className="top-row">
                <span className="number">{platformData.totalJobs}</span>
                <span className="label">{language === 'vi' ? 'Tin tuyển gấp' : 'Urgent Jobs'}</span>
                <span className="change">
                  <TrendingUp /> {platformData.change}
                </span>
              </div>
              <div className="bottom-row">
                {language === 'vi' ? `Hoa Hồng ${platformData.discount}: ` : `Commission ${platformData.discount}: `}
                <span>{platformData.price}</span>
              </div>
            </BoostMainStat>
          </BoostCard>

          {/* Gói Boost */}
          <BoostCard>
            <BoostHeader $iconBg="#E0E7FF" $iconColor="#4F46E5">
              <h3>{language === 'vi' ? 'GÓI BOOST' : 'BOOST PACKAGES'}</h3>
            </BoostHeader>
            <BoostOptions>
              {boostPackages.map((pkg, index) => {
                let IconComponent;
                if (pkg.name === 'Quick Boost') IconComponent = Zap;
                else if (pkg.name === 'Spotlight Banner') IconComponent = Star;
                else if (pkg.name === 'Hot Search') IconComponent = TrendingUp;
                else if (pkg.name === 'Top Spotlight') IconComponent = Sparkles;
                else IconComponent = Briefcase;

                return (
                  <BoostOption key={index} $iconBg={pkg.iconBg} $iconColor={pkg.iconColor}>
                    <div className="icon">
                      <IconComponent />
                    </div>
                    <div className="content">
                      <div className="name">{pkg.name}</div>
                      <div className="count">
                        {pkg.count} <span>{language === 'vi' ? 'Tin' : 'Jobs'}</span>
                      </div>
                    </div>
                  </BoostOption>
                );
              })}
            </BoostOptions>
          </BoostCard>
        </BoostSection>

        {/* Spotlight Banner - Nhà tuyển dụng & Ứng viên nổi bật */}
        {/* Spotlight Section - Nhà Tuyển Dụng Mới & Ứng Viên Mới */}
        <SpotlightSection>
          {/* Nhà Tuyển Dụng Mới - Đã thu gọn và mang lên bên trái */}
          <SpotlightCard $bgColor="#EDE9FE">
            <SpotlightBadge $color="#7C3AED">
              <Building2 />
              <span>{language === 'vi' ? 'Nhà Tuyển Dụng Mới' : 'New Employers'}</span>
            </SpotlightBadge>
            <SpotlightTitle>
              {language === 'vi' ? 'Nhà Tuyển Dụng Vừa Tham Gia' : 'Recently Joined Employers'}
            </SpotlightTitle>
            <SpotlightList>
              {managementCandidates.map((candidate, index) => {
                const initials = candidate.name.split(' ').slice(0, 2).map(w => w[0]).join('');
                const colors = [
                  { bg: '#E0E7FF', color: '#4F46E5' },
                  { bg: '#DBEAFE', color: '#0284C7' },
                  { bg: '#FEE2E2', color: '#DC2626' }
                ];
                const colorScheme = colors[index % colors.length];

                return (
                  <SpotlightItem
                    key={candidate.id}
                    onClick={() => navigate('/admin/employers')}
                    style={{
                      backgroundColor: candidate.verified === 'CHO_DUYET' ? '#FEFCE8' : 'white',
                      border: candidate.verified === 'CHO_DUYET' ? '1px solid #FEF3C7' : 'none'
                    }}
                  >
                    <SpotlightAvatar $bgColor={colorScheme.bg} $color={colorScheme.color}>
                      {initials}
                    </SpotlightAvatar>
                    <SpotlightContent>
                      <SpotlightName>{candidate.name}</SpotlightName>
                      <SpotlightMeta>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: candidate.verified === 'DA_DUYET' ? '#D1FAE5' : (candidate.verified === 'CHO_DUYET' ? '#FEF3C7' : '#FEE2E2'),
                          color: candidate.verified === 'DA_DUYET' ? '#059669' : (candidate.verified === 'CHO_DUYET' ? '#D97706' : '#DC2626'),
                          textTransform: 'uppercase',
                          marginBottom: '4px'
                        }}>
                          {language === 'vi' ? (
                            candidate.verified === 'DA_DUYET' ? 'Đã Duyệt Xác Thực' :
                              (candidate.verified === 'CHO_DUYET' ? 'Chờ Duyệt Xác Thực' : 'Chưa Xác Thực')
                          ) : (
                            candidate.verified === 'DA_DUYET' ? 'Verified' :
                              (candidate.verified === 'CHO_DUYET' ? 'Pending' : 'Not Verified')
                          )}
                        </span>
                      </SpotlightMeta>
                    </SpotlightContent>
                    <SpotlightBadgeStatus $bgColor="#D1FAE5" $color="#059669">
                      {candidate.joinDate}
                    </SpotlightBadgeStatus>
                  </SpotlightItem>
                );
              })}
            </SpotlightList>
          </SpotlightCard>

          {/* Ứng viên mới - Bên phải */}
          <SpotlightCard $bgColor="#EDE9FE">
            <SpotlightBadge $color="#7C3AED">
              <Users />
              <span>{language === 'vi' ? 'Ứng Viên Mới' : 'New Candidates'}</span>
            </SpotlightBadge>
            <SpotlightTitle>
              {language === 'vi' ? 'Ứng Viên Vừa Tham Gia' : 'Recently Joined Candidates'}
            </SpotlightTitle>
            <SpotlightList>
              {topCandidates.map((candidate, index) => {
                const initials = candidate.name.split(' ').slice(-2).map(w => w[0]).join('');
                const colors = [
                  { bg: '#E0E7FF', color: '#4F46E5' },
                  { bg: '#DBEAFE', color: '#0284C7' },
                  { bg: '#FEE2E2', color: '#DC2626' },
                  { bg: '#D1FAE5', color: '#059669' }
                ];
                const colorScheme = colors[index % colors.length];

                return (
                  <SpotlightItem key={candidate.id} onClick={() => navigate('/admin/candidates')}>
                    <SpotlightAvatar $bgColor={colorScheme.bg} $color={colorScheme.color}>
                      {initials}
                    </SpotlightAvatar>
                    <SpotlightContent>
                      <SpotlightName>{candidate.name}</SpotlightName>
                      <SpotlightMeta>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: candidate.status === 'verified' ? '#D1FAE5' : '#FEE2E2',
                          color: candidate.status === 'verified' ? '#059669' : '#DC2626',
                          textTransform: 'uppercase'
                        }}>
                          eKYC
                        </span>
                      </SpotlightMeta>
                    </SpotlightContent>
                    <SpotlightBadgeStatus
                      $bgColor="#D1FAE5"
                      $color="#059669"
                    >
                      {candidate.joinedTime}
                    </SpotlightBadgeStatus>
                  </SpotlightItem>
                );
              })}
            </SpotlightList>
          </SpotlightCard>
        </SpotlightSection>

        <SpotlightSection>
          {/* Nhà tuyển dụng nổi bật & Spotlight Banner */}
          <SpotlightCard $bgColor={currentOption.bgColor}>
            <div style={{ position: 'relative' }}>
              <SpotlightBadge
                $color={currentOption.color}
                onClick={() => setShowSelector(!showSelector)}
              >
                <Icon />
                <span>{currentOption.label}</span>
                <ChevronDown size={14} style={{ opacity: 0.6 }} />
              </SpotlightBadge>

              {showSelector && (
                <SpotlightSelector>
                  {spotlightOptions.map(option => {
                    const OptionIcon = option.icon;
                    return (
                      <SelectorOption
                        key={option.id}
                        className={activeSpotlight === option.id ? 'active' : ''}
                        $color={option.color}
                        onClick={() => {
                          setActiveSpotlight(option.id);
                          setShowSelector(false);
                        }}
                      >
                        <OptionIcon />
                        {option.label}
                      </SelectorOption>
                    );
                  })}
                </SpotlightSelector>
              )}
            </div>

            <SpotlightTitle>
              {currentOption.title}
            </SpotlightTitle>
            <SpotlightList>
              {currentSpotlightList.map((employer, index) => {
                const initials = employer.name.split(' ').slice(0, 2).map(w => w[0]).join('');
                const colors = [
                  { bg: '#DBEAFE', color: '#1E40AF' },
                  { bg: '#FEE2E2', color: '#DC2626' },
                  { bg: '#E0E7FF', color: '#4F46E5' },
                  { bg: '#FEF3C7', color: '#D97706' }
                ];
                const colorScheme = colors[index % colors.length];

                return (
                  <SpotlightItem key={employer.id} onClick={() => navigate('/admin/employers')}>
                    <SpotlightAvatar $bgColor={colorScheme.bg} $color={colorScheme.color}>
                      {initials}
                    </SpotlightAvatar>
                    <SpotlightContent>
                      <SpotlightName>{employer.name}</SpotlightName>
                      <SpotlightMeta>{employer.type}</SpotlightMeta>
                    </SpotlightContent>
                    <SpotlightBadgeStatus $bgColor="#DBEAFE" $color="#1E40AF">
                      <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '2px' }}>
                        {language === 'vi' ? `còn ${employer.daysRemaining} ngày` : `${employer.daysRemaining} days`}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: '500', opacity: 0.8 }}>
                        {language === 'vi' ? `Tiếp cận: ${employer.budget}` : `Reach: ${employer.budget}`}
                      </div>
                    </SpotlightBadgeStatus>
                  </SpotlightItem>
                );
              })}
            </SpotlightList>
          </SpotlightCard>

          {/* QUẢN LÝ BÀI ĐĂNG - Chuyển lên bên phải */}
          <SpotlightCard $bgColor="#DCFCE7">
            <SpotlightBadge $color="#7C3AED">
              <FileText />
              <span>{language === 'vi' ? 'QUẢN LÝ BÀI ĐĂNG' : 'POST MANAGEMENT'}</span>
            </SpotlightBadge>
            <SpotlightTitle>
              {language === 'vi' ? 'Bài Đăng Chờ Duyệt' : 'Pending Posts'}
            </SpotlightTitle>
            <SpotlightList>
              {managementPosts.map((post, index) => {
                const initials = post.employer.split(' ').slice(0, 2).map(w => w[0]).join('');
                const colors = ['#1E40AF', '#DC2626', '#059669', '#D97706', '#7C3AED'];
                const bgColor = colors[index % colors.length];

                const logoMap = {
                  'Cơm tấm Phúc Lộc Thọ': s3Images.system.logoPlt,
                  'Katinat': s3Images.system.katinatlogo,
                  'The Coffee House': s3Images.system.coffeehouse,
                  'Highlands Coffee': s3Images.system.highlands,
                };
                const logo = logoMap[post.employer] || null;

                return (
                  <SpotlightItem key={post.id} onClick={() => navigate('/admin/posts')}>
                    <SpotlightAvatar $bgColor={bgColor} $color="white">
                      {logo ? <img src={logo} alt={post.employer} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} /> : initials}
                    </SpotlightAvatar>
                    <SpotlightContent>
                      <SpotlightName>{post.employer}</SpotlightName>
                      <SpotlightMeta>
                        <div>{post.type}</div>
                      </SpotlightMeta>
                    </SpotlightContent>
                    <SpotlightBadgeStatus $bgColor="#F3F4F6" $color="#6B7280">
                      <div style={{ fontSize: '12px', fontWeight: '700' }}>{post.time}</div>
                      <div style={{ fontSize: '10px' }}>{post.joinDate}</div>
                    </SpotlightBadgeStatus>
                  </SpotlightItem>
                );
              })}
            </SpotlightList>
          </SpotlightCard>
        </SpotlightSection>

        {/* Biểu đồ Hoạt động nền tảng */}
        <ChartsSection>
          {/* Line Chart - Hoạt động nền tảng */}
          <ChartCard>
            <ChartHeader>
              <h3>{language === 'vi' ? 'Hoạt động Nền Tảng' : 'Platform Activity'}</h3>
              <ChartFilters>
                <button className="active">{language === 'vi' ? 'Tuần' : 'Week'}</button>
                <button>{language === 'vi' ? 'Tháng' : 'Month'}</button>
                <button>{language === 'vi' ? 'Năm' : 'Year'}</button>
              </ChartFilters>
            </ChartHeader>
            <ChartLegend>
              <div className="legend-item">
                <div className="dot" style={{ background: '#3B82F6' }}></div>
                <span>{language === 'vi' ? 'Tin đăng' : 'Posts'}</span>
              </div>
              <div className="legend-item">
                <div className="dot" style={{ background: '#10B981' }}></div>
                <span>{language === 'vi' ? 'Ứng tuyển' : 'Applications'}</span>
              </div>
            </ChartLegend>
            <SimpleLineChart>
              <LineChartSvg viewBox="0 0 700 320">
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="50"
                    y1={50 + i * 50}
                    x2="650"
                    y2={50 + i * 50}
                    stroke="#f0f0f0"
                    strokeWidth="1"
                  />
                ))}

                {/* Y-axis labels */}
                {[(totalPosts > 80 ? totalPosts : 80), Math.round(totalPosts * 0.75), Math.round(totalPosts * 0.5), Math.round(totalPosts * 0.25), '0'].map((val, i) => (
                  <text
                    key={i}
                    x="40"
                    y={55 + i * 50}
                    textAnchor="end"
                    fontSize="11"
                    fill="#9ca3af"
                    fontWeight="400"
                  >
                    {val}
                  </text>
                ))}

                {/* Posts line with area */}
                <polyline
                  fill="url(#gradient1)"
                  stroke="none"
                  points={`50,250 ${activityData.map((d, i) =>
                    `${50 + (i / (activityData.length - 1)) * 600},${250 - (d.posts / (totalPosts > 80 ? totalPosts : 80)) * 200}`
                  ).join(' ')} 650,250`}
                />
                <polyline
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={activityData.map((d, i) =>
                    `${50 + (i / (activityData.length - 1)) * 600},${250 - (d.posts / (totalPosts > 80 ? totalPosts : 80)) * 200}`
                  ).join(' ')}
                />

                {/* Applications line with area */}
                <polyline
                  fill="url(#gradient2)"
                  stroke="none"
                  points={`50,250 ${activityData.map((d, i) =>
                    `${50 + (i / (activityData.length - 1)) * 600},${250 - (d.applications / (totalPosts > 80 ? totalPosts : 80)) * 200}`
                  ).join(' ')} 650,250`}
                />
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={activityData.map((d, i) =>
                    `${50 + (i / (activityData.length - 1)) * 600},${250 - (d.applications / (totalPosts > 80 ? totalPosts : 80)) * 200}`
                  ).join(' ')}
                />

                {/* Data points with values */}
                {activityData.map((d, i) => {
                  const maxVal = totalPosts > 80 ? totalPosts : 80;
                  const x = 50 + (i / (activityData.length - 1)) * 600;
                  const yPosts = 250 - (d.posts / maxVal) * 200;
                  const yApps = 250 - (d.applications / maxVal) * 200;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={yPosts} r="4" fill="#3B82F6" stroke="white" strokeWidth="2" />
                      <circle cx={x} cy={yApps} r="4" fill="#10B981" stroke="white" strokeWidth="2" />

                      {/* Value labels */}
                      <text x={x} y={yPosts - 10} textAnchor="middle" fontSize="10" fill="#3B82F6" fontWeight="600">
                        {d.posts}
                      </text>
                      <text x={x} y={yApps - 10} textAnchor="middle" fontSize="10" fill="#10B981" fontWeight="600">
                        {d.applications}
                      </text>

                      {/* Date labels */}
                      <text x={x} y="275" textAnchor="middle" fontSize="11" fill="#6b7280" fontWeight="400">
                        {d.date}
                      </text>
                    </g>
                  );
                })}
              </LineChartSvg>
            </SimpleLineChart>
          </ChartCard>

          {/* Bar Chart - Thống kê công việc theo quý */}
          <ChartCard>
            <ChartHeader>
              <h3>{language === 'vi' ? 'Ứng tuyển theo loại công việc' : 'Applications by Job Type'}</h3>
              <ChartFilters>
                <button className="active">{language === 'vi' ? 'Quý' : 'Quarter'}</button>
                <button>{language === 'vi' ? 'Năm' : 'Year'}</button>
              </ChartFilters>
            </ChartHeader>
            <ChartLegend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px 30px', background: '#F8FAFC', padding: '10px 15px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div className="legend-item">
                    <div className="dot" style={{ background: '#2563EB', width: '10px', height: '10px' }}></div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#1E293B' }}>{language === 'vi' ? 'Ứng tuyển Tiêu chuẩn' : 'Std Apps'}</span>
                  </div>
                  <div className="legend-item">
                    <div className="dot" style={{ background: '#93C5FD', width: '10px', height: '10px', opacity: 0.8 }}></div>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748B' }}>{language === 'vi' ? 'Bài đăng' : 'Posts'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div className="legend-item">
                    <div className="dot" style={{ background: '#D97706', width: '10px', height: '10px' }}></div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#1E293B' }}>{language === 'vi' ? 'Ứng tuyển Tuyển gấp' : 'Urg Apps'}</span>
                  </div>
                  <div className="legend-item">
                    <div className="dot" style={{ background: '#FCD34D', width: '10px', height: '10px', opacity: 0.8 }}></div>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748B' }}>{language === 'vi' ? 'Bài đăng' : 'Posts'}</span>
                  </div>
                </div>
              </div>
            </ChartLegend>
            <SimpleBarChart>
              {quarterlyJobData.map((d, i) => (
                <BarGroup key={i}>
                  <div className="bars">
                    {/* Standard Pair */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '100%' }}>
                      <div
                        className="bar"
                        style={{
                          height: `${(d.standard / 1000) * 100}%`,
                          background: '#3B82F6',
                          position: 'relative',
                          borderRadius: '4px 4px 0 0',
                          width: '36px',
                          boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        <span style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', fontWeight: '900', color: '#1D4ED8' }}>
                          {d.standard}
                        </span>
                      </div>
                      <div
                        className="bar"
                        style={{
                          height: `${(d.standardPosts / 1000) * 100}%`,
                          background: '#BFDBFE',
                          position: 'relative',
                          borderRadius: '4px 4px 0 0',
                          width: '28px'
                        }}
                      >
                        <span style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', fontWeight: '800', color: '#3B82F6' }}>
                          {d.standardPosts}
                        </span>
                      </div>
                    </div>

                    {/* Urgent Pair */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '100%' }}>
                      <div
                        className="bar"
                        style={{
                          height: `${(d.quick / 1000) * 100}%`,
                          background: '#F59E0B',
                          position: 'relative',
                          borderRadius: '4px 4px 0 0',
                          width: '36px',
                          boxShadow: '0 4px 6px rgba(245, 158, 11, 0.3)'
                        }}
                      >
                        <span style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', fontWeight: '900', color: '#B45309' }}>
                          {d.quick}
                        </span>
                      </div>
                      <div
                        className="bar"
                        style={{
                          height: `${(d.quickPosts / 1000) * 100}%`,
                          background: '#FDE68A',
                          position: 'relative',
                          borderRadius: '4px 4px 0 0',
                          width: '28px'
                        }}
                      >
                        <span style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', fontWeight: '800', color: '#D97706' }}>
                          {d.quickPosts}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="label" style={{ fontWeight: '800', fontSize: '13px', margin: '12px 0 6px' }}>{d.label}</div>
                </BarGroup>
              ))}
            </SimpleBarChart>
          </ChartCard>
        </ChartsSection>

        {/* Doanh Thu Từ Dịch Vụ */}
        <RevenueSection>
          <SectionHeader>
            <h2>{language === 'vi' ? 'Doanh Thu Từ Dịch Vụ' : 'Revenue From Services'}</h2>
          </SectionHeader>

          <RevenueChartCard>
            <ChartHeader>
              <h3>{language === 'vi' ? 'Xu Hướng Doanh Thu' : 'Revenue Trend'}</h3>
              <ChartFilters>
                <button className="active">{language === 'vi' ? '6 Tháng' : '6 Months'}</button>
                <button>{language === 'vi' ? 'Năm' : 'Year'}</button>
                <button>{language === 'vi' ? 'Tất cả' : 'All'}</button>
              </ChartFilters>
            </ChartHeader>

            {/* Legend */}
            <ChartLegend>
              <div className="legend-item">
                <div className="dot" style={{ background: '#3b82f6' }}></div>
                <span style={{ fontWeight: '600' }}>{language === 'vi' ? 'Doanh thu thực tế' : 'Actual Revenue'}</span>
              </div>
              <div className="legend-item">
                <div className="dot" style={{ background: '#f97316' }}></div>
                <span style={{ fontWeight: '600' }}>{language === 'vi' ? 'Mục tiêu' : 'Target'}</span>
              </div>
            </ChartLegend>

            <SimpleLineChart>
              <LineChartSvg viewBox="0 0 1200 350" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <line
                    key={i}
                    x1="60"
                    y1={30 + i * 45}
                    x2="1140"
                    y2={30 + i * 45}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                  />
                ))}

                {/* Y-axis labels */}
                {['6000', '5000', '4000', '3000', '2000', '1000', '0'].map((val, i) => (
                  <text
                    key={i}
                    x="50"
                    y={35 + i * 45}
                    textAnchor="end"
                    fontSize="12"
                    fill="#94A3B8"
                    fontWeight="700"
                  >
                    {val}
                  </text>
                ))}

                {/* Decorative Artistic Bars (4 columns per month) */}
                {revenueTrendData.length > 0 && revenueTrendData.map((d, i) => {
                  const x = 120 + i * 140; 
                  return (
                    <g key={`bars-${i}`}>
                      <rect x={x - 44} y={300 - d.actual * 40} width="18" height={d.actual * 40} fill="#0284c7" opacity="0.4" rx="3" />
                      <rect x={x - 22} y={300 - d.target * 35} width="18" height={d.target * 35} fill="#8b5cf6" opacity="0.4" rx="3" />
                      <rect x={x + 4} y={300 - d.actual * 45} width="18" height={d.actual * 45} fill="#f59e0b" opacity="0.4" rx="3" />
                      <rect x={x + 26} y={300 - d.target * 30} width="18" height={d.target * 30} fill="#10b981" opacity="0.4" rx="3" />
                    </g>
                  );
                })}

                {/* Smooth Orange Curve (Target) */}
                {revenueTrendData.length > 0 && (
                  <path
                    d={`M 120 ${300 - revenueTrendData[0].target * 45} 
                       ${revenueTrendData.map((d, i) => {
                      if (i === 0) return '';
                      const prev = revenueTrendData[i - 1];
                      const cp1x = (120 + (i - 1) * 140) + 70;
                      const cp2x = (120 + i * 140) - 70;
                      return `C ${cp1x} ${300 - prev.target * 45}, ${cp2x} ${300 - d.target * 45}, ${120 + i * 140} ${300 - d.target * 45}`;
                    }).join(' ')}`}
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                )}

                {/* Smooth Blue Curve (Actual) */}
                {revenueTrendData.length > 0 && (
                  <path
                    d={`M 120 ${300 - revenueTrendData[0].actual * 50} 
                       ${revenueTrendData.map((d, i) => {
                      if (i === 0) return '';
                      const prev = revenueTrendData[i - 1];
                      const cp1x = (120 + (i - 1) * 140) + 70;
                      const cp2x = (120 + i * 140) - 70;
                      return `C ${cp1x} ${300 - prev.actual * 50}, ${cp2x} ${300 - d.actual * 50}, ${120 + i * 140} ${300 - d.actual * 50}`;
                    }).join(' ')}`}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                )}

                {/* Data points */}
                {revenueTrendData.length > 0 && revenueTrendData.map((d, i) => {
                  const x = 120 + i * 140;
                  const yBlue = 300 - d.actual * 50;
                  const yOrange = 300 - d.target * 45;
                  return (
                    <g key={`points-${i}`}>
                      <circle cx={x} cy={yBlue} r="7" fill="#3B82F6" stroke="white" strokeWidth="3" />
                      <circle cx={x} cy={yOrange} r="7" fill="#F97316" stroke="white" strokeWidth="3" />
                    </g>
                  );
                })}

                {/* Month labels */}
                {revenueTrendData.map((d, i) => (
                  <text
                    key={`month-${i}`}
                    x={120 + i * 140}
                    y="335"
                    textAnchor="middle"
                    fontSize="13"
                    fill="#94A3B8"
                    fontWeight="700"
                  >
                    {language === 'vi' ? `Tháng ${i + 1}` : `Month ${i + 1}`}
                  </text>
                ))}
              </LineChartSvg>
            </SimpleLineChart>

            <RevenueStatsGrid style={{ marginTop: '20px', borderTop: '1px solid #F1F5F9', paddingTop: '24px' }}>
              <RevenueStatBox $bgColor="#E0F2FE" $iconColor="#0369A1">
                <div className="icon">
                  <CheckSquare />
                </div>
                <div className="content">
                  <div className="label">
                    {language === 'vi' ? 'Quick Boost' : 'Quick Boost'}
                  </div>
                  <div className="value">{revenueFromBoost.toLocaleString('vi-VN')}đ</div>
                </div>
              </RevenueStatBox>

              <RevenueStatBox $bgColor="#F3E8FF" $iconColor="#7E22CE">
                <div className="icon">
                  <TrendingUp />
                </div>
                <div className="content">
                  <div className="label">
                    {language === 'vi' ? 'Hot Search' : 'Hot Search'}
                  </div>
                  <div className="value">{revenueFromHotSearch.toLocaleString('vi-VN')}đ</div>
                </div>
              </RevenueStatBox>

              <RevenueStatBox $bgColor="#FFEDD5" $iconColor="#D97706">
                <div className="icon">
                  <Star />
                </div>
                <div className="content">
                  <div className="label">
                    {language === 'vi' ? 'Spotlight Banner' : 'Spotlight Banner'}
                  </div>
                  <div className="value">{revenueFromBanner.toLocaleString('vi-VN')}đ</div>
                </div>
              </RevenueStatBox>

              <RevenueStatBox $bgColor="#D1FAE5" $iconColor="#059669">
                <div className="icon">
                  <Sparkles />
                </div>
                <div className="content">
                  <div className="label">
                    {language === 'vi' ? 'Top Spotlight' : 'Top Spotlight'}
                  </div>
                  <div className="value">{revenueFromTopSpotlight.toLocaleString('vi-VN')}đ</div>
                </div>
              </RevenueStatBox>
            </RevenueStatsGrid>
          </RevenueChartCard>
        </RevenueSection>

        {/* Reject Modal */}
        {rejectModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onClick={() => setRejectModal(null)}>
            <div style={{
              background: 'white', borderRadius: 20, padding: 32, maxWidth: 460, width: '92%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 800, fontSize: 18, color: '#1E293B', margin: 0 }}>
                  {language === 'vi' ? 'Từ chối yêu cầu' : 'Reject Request'}
                </h3>
                <button onClick={() => setRejectModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} color="#64748B" />
                </button>
              </div>
              <p style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>
                {language === 'vi'
                  ? `Nhập lý do từ chối yêu cầu cho "${rejectModal.candidateName}":`
                  : `Enter rejection reason for "${rejectModal.candidateName}":`}
              </p>
              <textarea
                rows={4}
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                placeholder={language === 'vi' ? 'Lý do từ chối (không bắt buộc)...' : 'Rejection reason (optional)...'}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  border: '1.5px solid #E2E8F0', fontSize: 14, fontFamily: 'inherit',
                  resize: 'vertical', marginBottom: 20
                }}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setRejectModal(null)} style={{
                  padding: '10px 18px', background: '#F1F5F9', border: 'none',
                  borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#475569'
                }}>
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  onClick={async () => {
                    const { applicationId } = rejectModal;
                    const rejectedReq = changeRequests.find(r => r.applicationId === applicationId);
                    setCrActionLoading(applicationId);
                    setRejectModal(null);
                    try {
                      await applicationService.rejectChangeRequest(applicationId, rejectNotes);
                      setChangeRequests(prev => prev.filter(r => r.applicationId !== applicationId));
                      // Gửi notification cho employer
                      if (rejectedReq) {
                        const cr = rejectedReq.changeRequest || {};
                        await createChangeRequestRejectedNotification({
                          employerId: rejectedReq.employerId,
                          companyName: rejectedReq.employerName,
                          candidateName: rejectedReq.candidateName,
                          changeRequestType: cr.reasonType,
                          applicationId,
                          reason: rejectNotes
                        }).catch(() => {});
                      }
                    } catch (e) {
                      alert(language === 'vi' ? `Lỗi: ${e.message}` : `Error: ${e.message}`);
                    } finally {
                      setCrActionLoading(null);
                    }
                  }}
                  style={{
                    padding: '10px 22px', background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    border: 'none', borderRadius: 10, color: 'white', fontWeight: 700,
                    fontSize: 14, cursor: 'pointer'
                  }}
                >
                  {language === 'vi' ? 'Xác nhận từ chối' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Urgent recommendations modal */}
        <UrgentRecommendationsModal
          isOpen={showRecsModal}
          onClose={() => setShowRecsModal(false)}
          recommendations={activeRecommendations}
          jobTitle={recJobTitle}
        />

      </DashboardContainer>
    </DashboardLayout>
  );
};

export default AdminDashboard;



