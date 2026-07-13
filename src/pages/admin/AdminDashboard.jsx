import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';

import { useLanguage } from '../../context/LanguageContext';
import { s3Images } from '../../utils/s3Images';
import UrgentRecommendationsModal from '../../components/UrgentRecommendationsModal';

import { Users, Briefcase, Building2, DollarSign, CheckSquare, XSquare, Shield, Calendar, ArrowRight, Zap, TrendingUp, Star, Sparkles, Eye, Rocket, FileText, ChevronDown, AlertCircle } from 'lucide-react';

// Import Services
import adminEmployerService from '../../services/adminEmployerService';
import candidateProfileService from '../../services/candidateProfileService';
import jobPostService from '../../services/jobPostService';
import quickJobService from '../../services/quickJobService';
import applicationService from '../../services/applicationService';
import adminReportService from '../../services/adminReportService';
import {
  ChartCard,
  ChartHeader,
  ChartFilters,
  ChartLegend,
  ChartScrollWrapper,
  ChartsGrid2 as ChartsSection,
} from '../../components/UnifiedChart';

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

// ─── Local chart containers ────────────────────────────────────

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

  // Change Request state — chỉ dùng để hiển thị số lượng tóm tắt ở Dashboard
  const [changeRequests, setChangeRequests] = useState([]);
  const [crLoading, setCrLoading] = useState(false);

  // AI Urgent recommendations
  const [showRecsModal, setShowRecsModal] = useState(false);
  const [activeRecommendations, setActiveRecommendations] = useState(null);
  const [recJobTitle, setRecJobTitle] = useState('');

  // Urgent jobs list modal
  const [showUrgentJobsModal, setShowUrgentJobsModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchChangeRequests();

    // Realtime: chỉ refresh danh sách NTD và ứng viên mỗi 10 giây
    const realtimeInterval = setInterval(async () => {
      try {
        const [freshEmployers, freshCandidates] = await Promise.all([
          adminEmployerService.getAllEmployers(),
          candidateProfileService.getAllCandidates()
        ]);
        if (freshEmployers && freshEmployers.length > 0) setEmployers(freshEmployers);
        if (freshCandidates && freshCandidates.length > 0) setCandidates(freshCandidates);
      } catch (e) {
        // silent fail
      }
    }, 10000);

    return () => clearInterval(realtimeInterval);
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

  // Chart period state
  const [activityPeriod, setActivityPeriod] = useState('week');
  const [revenuePeriod, setRevenuePeriod] = useState('6months');
  const [selectedQuarterYear, setSelectedQuarterYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState('all'); // 'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'

  // Helper: lấy date string YYYY-MM-DD từ application — field là appliedAt (không phải createdAt)
  const getAppDateStr = (a) => {
    const raw = a.appliedAt || a.createdAt || a.applied_at || '';
    if (!raw) return '';
    const num = Number(raw);
    if (!isNaN(num) && num > 0) {
      const d = new Date(num < 1e12 ? num * 1000 : num);
      return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    }
    // ISO string — lấy 10 ký tự đầu
    return String(raw).slice(0, 10);
  };

  // Activity chart data — tính thật từ allJobPosts và applications
  const buildActivityData = (period) => {
    const now = new Date();
    const points = [];

    if (period === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('vi-VN', { weekday: 'short' });
        const posts = allJobPosts.filter(j => (j.createdAt || '').startsWith(ds)).length;
        const apps = applications.filter(a => getAppDateStr(a) === ds).length;
        points.push({ label, posts, apps });
      }
    } else if (period === 'month') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        const posts = allJobPosts.filter(j => (j.createdAt || '').startsWith(ds)).length;
        const apps = applications.filter(a => getAppDateStr(a) === ds).length;
        points.push({ label, posts, apps });
      }
    } else {
      // year — 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `T${d.getMonth() + 1}`;
        const posts = allJobPosts.filter(j => (j.createdAt || '').startsWith(ym)).length;
        const apps = applications.filter(a => getAppDateStr(a).startsWith(ym)).length;
        points.push({ label, posts, apps });
      }
    }
    return points;
  };

  const activityChartData = buildActivityData(activityPeriod);

  // Revenue trend — tính thật từ subscriptions theo kỳ
  const buildRevenueData = (period) => {
    const now = new Date();
    const points = [];
    const months = period === '6months' ? 6 : period === 'year' ? 12 : 24;
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `T${d.getMonth() + 1}`;
      const revenue = subscriptions
        .filter(s => s.status !== 'pending' && s.status !== 'rejected')
        .filter(s => (s.purchaseDateTime || s.createdAt || '').startsWith(ym))
        .reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
      points.push({ label, revenue });
    }
    return points;
  };

  const revenueChartData = buildRevenueData(revenuePeriod);

  // Quarterly data — ứng tuyển theo loại công việc (tiêu chuẩn vs tuyển gấp)
  // Build a jobId -> isUrgent lookup map từ allJobPosts để join với applications
  const jobTypeMap = {};
  allJobPosts.forEach(j => {
    const id = j.idJob || j.id || j.jobId;
    if (id) {
      jobTypeMap[id] = j.category === 'urgent' || j.category === 'quick-jobs' || j.jobType === 'urgent';
    }
  });

  const isUrgentJob = (jobId) => {
    if (!jobId) return false;
    // Nếu có trong map thì dùng map
    if (jobId in jobTypeMap) return jobTypeMap[jobId];
    // Fallback: check trực tiếp field jobType trên application
    return false;
  };

  const buildQuarterlyData = (year, quarterFilter) => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const filtered = quarterFilter === 'all' ? quarters : quarters.filter(q => q === quarterFilter);

    return filtered.map((q) => {
      const qi = quarters.indexOf(q);
      const s = qi * 3, e = s + 2;
      const inPeriod = dateStr => {
        if (!dateStr) return false;
        const num = Number(dateStr);
        let dt;
        if (!isNaN(num) && num > 0) dt = new Date(num < 1e12 ? num * 1000 : num);
        else dt = new Date(dateStr);
        if (isNaN(dt.getTime())) return false;
        return dt.getFullYear() === year && dt.getMonth() >= s && dt.getMonth() <= e;
      };

      const appsInQ = applications.filter(a => inPeriod(a.appliedAt || a.createdAt || a.applied_at));

      const urgentApps = appsInQ.filter(a => {
        const jobId = a.jobId || a.idJob;
        // Ưu tiên join với jobTypeMap, fallback sang field jobType của application
        if (jobId && jobId in jobTypeMap) return jobTypeMap[jobId];
        const t = (a.jobType || a.category || '').toLowerCase();
        return t === 'quick' || t === 'urgent' || t === 'quick-job' || t === 'quick-jobs';
      }).length;

      const stdApps = appsInQ.filter(a => {
        const jobId = a.jobId || a.idJob;
        if (jobId && jobId in jobTypeMap) return !jobTypeMap[jobId];
        const t = (a.jobType || a.category || '').toLowerCase();
        return t === 'standard' || t === 'standard-jobs' || t === '';
      }).length;

      // Bài đăng trong quý
      const postsInQ = allJobPosts.filter(j => inPeriod(j.createdAt));
      const urgentPosts = postsInQ.filter(j => j.category === 'urgent' || j.category === 'quick-jobs' || j.jobType === 'urgent').length;
      const stdPosts = postsInQ.length - urgentPosts;

      return { label: q, stdApps, urgentApps, stdPosts, urgentPosts };
    });
  };

  const quarterlyChartData = buildQuarterlyData(selectedQuarterYear, selectedQuarter);

  // Danh sách năm có thể chọn (từ năm đầu tiên có data đến năm hiện tại)
  const availableYears = (() => {
    const currentYear = new Date().getFullYear();
    const allDates = [
      ...applications.map(a => a.appliedAt || a.createdAt || a.applied_at),
      ...allJobPosts.map(j => j.createdAt)
    ].filter(Boolean).map(d => {
      const num = Number(d);
      const dt = !isNaN(num) && num > 0 ? new Date(num < 1e12 ? num * 1000 : num) : new Date(d);
      return isNaN(dt.getTime()) ? null : dt.getFullYear();
    }).filter(Boolean);
    const minYear = allDates.length > 0 ? Math.min(...allDates) : currentYear;
    const years = [];
    for (let y = currentYear; y >= Math.max(minYear, currentYear - 4); y--) years.push(y);
    return years;
  })();

  // Legacy kept for backward compat
  const activityData = chartData.activityData;

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

  // Top Employers spotlight — lấy từ subscriptions thật, tính daysRemaining từ expiryDateTime
  const calcDaysRemaining = (expiryStr) => {
    if (!expiryStr) return 0;
    const expiry = new Date(expiryStr);
    if (isNaN(expiry.getTime())) return 0;
    const diff = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');

  // Boost packages — đếm từ subscriptions active thật
  const boostPackages = [
    { name: 'Quick Boost', count: activeSubscriptions.filter(s => s.packageName === 'Quick Boost').length, iconBg: '#DBEAFE', iconColor: '#1E40AF' },
    { name: 'Spotlight Banner', count: activeSubscriptions.filter(s => s.packageName === 'Spotlight Banner').length, iconBg: '#E0E7FF', iconColor: '#4F46E5' },
    { name: 'Hot Search', count: activeSubscriptions.filter(s => s.packageName === 'Hot Search').length, iconBg: '#FEE2E2', iconColor: '#DC2626' },
    { name: 'Top Spotlight', count: activeSubscriptions.filter(s => s.packageName === 'Top Spotlight').length, iconBg: '#FCE7F3', iconColor: '#BE185D' }
  ];

  const buildSpotlightList = (filterFn) =>
    activeSubscriptions
      .filter(filterFn)
      .sort((a, b) => calcDaysRemaining(b.expiryDateTime) - calcDaysRemaining(a.expiryDateTime))
      .slice(0, 4)
      .map(s => ({
        id: s.subscriptionId || s.employerId,
        name: s.companyName || s.employerId || 'Employer',
        type: s.packageName || 'Package',
        daysRemaining: calcDaysRemaining(s.expiryDateTime || s.expiryDate),
        budget: s.price ? new Intl.NumberFormat('vi-VN').format(Number(s.price)) : '0'
      }));

  const spotlightData = {
    banner: buildSpotlightList(s => s.packageName === 'Spotlight Banner'),
    quick_boost: buildSpotlightList(s => s.packageName === 'Quick Boost'),
    hot_search: buildSpotlightList(s => s.packageName === 'Hot Search'),
    spotlight: buildSpotlightList(s => s.packageName === 'Top Spotlight')
  };

  // Fallback nếu không có subscription nào
  const emptyFallback = [{ id: 0, name: language === 'vi' ? 'Chưa có gói đang chạy' : 'No active package', type: '-', daysRemaining: 0, budget: '0' }];
  if (spotlightData.banner.length === 0) spotlightData.banner = emptyFallback;
  if (spotlightData.quick_boost.length === 0) spotlightData.quick_boost = emptyFallback;
  if (spotlightData.hot_search.length === 0) spotlightData.hot_search = emptyFallback;
  if (spotlightData.spotlight.length === 0) spotlightData.spotlight = emptyFallback;

  const currentSpotlightList = spotlightData[activeSpotlight] || spotlightData.banner;

  // Helper: format ngày Việt Nam DD/MM/YYYY — xử lý ISO string, số epoch, Decimal
  const formatDateVN = (dateStr) => {
    if (!dateStr) return 'Recently';
    // Nếu là Decimal hoặc số (epoch seconds/milliseconds)
    const num = Number(dateStr);
    let d;
    if (!isNaN(num) && num > 0) {
      // epoch seconds (< 1e12) hoặc milliseconds
      d = new Date(num < 1e12 ? num * 1000 : num);
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return 'Recently';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper: lấy timestamp ms để sort — xử lý ISO string, số epoch, Decimal
  const getTimestamp = (dateStr) => {
    if (!dateStr) return 0;
    const num = Number(dateStr);
    if (!isNaN(num) && num > 0) return num < 1e12 ? num * 1000 : num;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  // Top Candidates - Ứng viên mới (Từ database) — sort mới nhất lên đầu
  const topCandidates = [...candidates]
    .sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))
    .slice(0, 4)
    .map(can => ({
      id: can.userId,
      name: can.fullName || (can.email ? can.email.split('@')[0] : (can.userId ? `ID: ${can.userId.substring(0, 8)}` : (language === 'vi' ? 'Ứng viên mới' : 'New Candidate'))),
      status: 'verified',
      joinedTime: formatDateVN(can.createdAt),
      ekycStatus: language === 'vi' ? 'Đã Duyệt Xác Thực' : 'Verified'
    }));

  // Fallback if empty
  if (topCandidates.length === 0) {
    topCandidates.push({ id: 0, name: 'Đang chờ ứng viên', status: 'pending', joinedTime: '-', ekycStatus: '-' });
  }

  // Management Posts - CHỈ lấy bài đăng status 'pending', sort mới nhất lên đầu
  const managementPosts = [...allJobPosts]
    .filter(post => post.status === 'pending')
    .sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))
    .slice(0, 4)
    .map(post => ({
      id: post.idJob || post.id,
      employer: post.employerName || post.companyName || 'Unknown Employer',
      type: post.title,
      joinDate: formatDateVN(post.createdAt),
      status: 'PENDING',
      statusColor: { bg: '#FEF3C7', color: '#D97706' }
    }));

  // Nhà tuyển dụng mới nhất - sort theo createdAt giảm dần, hiển thị 4 mới nhất
  const managementCandidates = [...employers]
    .sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))
    .slice(0, 4)
    .map(emp => ({
      id: `emp-${emp.userId || emp.id}`,
      rawId: emp.userId || emp.id,
      name: emp.companyName || emp.businessName || 'New Employer',
      joinDate: formatDateVN(emp.createdAt),
      verified: emp.isVerified ? 'DA_DUYET' : 'CHUA',
      verifiedColor: emp.isVerified ? { bg: '#D1FAE5', color: '#059669' } : { bg: '#FEE2E2', color: '#DC2626' },
      status: emp.approvalStatus?.toUpperCase() || 'PENDING',
      statusColor: emp.approvalStatus === 'approved' ? { bg: '#D1FAE5', color: '#059669' } : { bg: '#FEF3C7', color: '#D97706' },
      approvalDate: emp.approvedAt ? formatDateVN(emp.approvedAt) : '-'
    }));

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
        {/* ===== YÊU CẦU THAY ĐỔI NHÂN VIÊN — khối tóm tắt ===== */}
        {(() => {
          const pendingCount = changeRequests.filter(r => r.status === 'pending_change').length;
          return (
            <div style={{
              marginBottom: 36,
              background: pendingCount > 0 ? '#FFF7ED' : '#F8FAFC',
              border: `2px solid ${pendingCount > 0 ? '#FED7AA' : '#E2E8F0'}`,
              borderRadius: 18,
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              boxShadow: pendingCount > 0 ? '0 4px 16px rgba(249,115,22,0.10)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: pendingCount > 0 ? 'linear-gradient(135deg,#F97316,#EA580C)' : '#E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <AlertCircle size={24} color="white" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 17, color: '#1E293B' }}>
                      {language === 'vi' ? 'Yêu cầu thay đổi nhân viên' : 'Staff Change Requests'}
                    </span>
                    {pendingCount > 0 && (
                      <span style={{ background: '#F97316', color: 'white', borderRadius: 99, padding: '2px 10px', fontSize: 13, fontWeight: 800 }}>
                        {pendingCount}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: '#64748B' }}>
                    {crLoading
                      ? 'Đang tải...'
                      : pendingCount > 0
                        ? `Có ${pendingCount} yêu cầu đang chờ xử lý`
                        : 'Không có yêu cầu nào đang chờ xử lý'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/change-requests')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '11px 22px',
                  background: pendingCount > 0 ? 'linear-gradient(135deg,#F97316,#EA580C)' : '#E2E8F0',
                  border: 'none', borderRadius: 12,
                  color: pendingCount > 0 ? 'white' : '#64748B',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  boxShadow: pendingCount > 0 ? '0 4px 12px rgba(249,115,22,0.30)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {language === 'vi' ? 'Xem chi tiết' : 'View details'}
                <ArrowRight size={16} />
              </button>
            </div>
          );
        })()}

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
            <BoostMainStat
              onClick={() => setShowUrgentJobsModal(true)}
              style={{ cursor: 'pointer' }}
              title={language === 'vi' ? 'Xem danh sách bài tuyển gấp' : 'View urgent job list'}
            >
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
            <SpotlightBadge $color="#7C3AED" onClick={() => navigate('/admin/employers')} style={{ cursor: 'pointer' }}>
              <Building2 />
              <span>{language === 'vi' ? 'Nhà Tuyển Dụng Mới' : 'New Employers'}</span>
            </SpotlightBadge>

            <SpotlightList>
              {managementCandidates.map((candidate, index) => {
                const initials = candidate.name.split(' ').slice(0, 2).map(w => w[0]).join('');
                const colors = [
                  { bg: '#E0E7FF', color: '#4F46E5' },
                  { bg: '#DBEAFE', color: '#0284C7' },
                  { bg: '#FEE2E2', color: '#DC2626' },
                  { bg: '#D1FAE5', color: '#059669' }
                ];
                const colorScheme = colors[index % colors.length];

                return (
                  <SpotlightItem
                    key={candidate.id}
                    onClick={() => candidate.rawId ? navigate(`/admin/employers/${candidate.rawId}`) : navigate('/admin/employers')}
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
            <SpotlightBadge $color="#7C3AED" onClick={() => navigate('/admin/candidates')} style={{ cursor: 'pointer' }}>
              <Users />
              <span>{language === 'vi' ? 'Ứng Viên Mới' : 'New Candidates'}</span>
            </SpotlightBadge>
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
                  <SpotlightItem
                    key={candidate.id}
                    onClick={() => candidate.id ? navigate(`/admin/candidates/${candidate.id}`) : navigate('/admin/candidates')}
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
            <SpotlightBadge $color="#7C3AED" onClick={() => navigate('/admin/posts')} style={{ cursor: 'pointer' }}>
              <FileText />
              <span>{language === 'vi' ? 'QUẢN LÝ BÀI ĐĂNG' : 'POST MANAGEMENT'}</span>
            </SpotlightBadge>
            <SpotlightTitle>
              {language === 'vi' ? 'Bài Đăng Chờ Duyệt' : 'Pending Posts'}
            </SpotlightTitle>
            <SpotlightList>
              {managementPosts.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
                  {language === 'vi' ? 'Không có bài đăng nào chờ duyệt' : 'No posts pending approval'}
                </div>
              ) : managementPosts.map((post, index) => {
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
                    <SpotlightBadgeStatus $bgColor="#FEF3C7" $color="#D97706">
                      <div style={{ fontSize: '12px', fontWeight: '700' }}>{post.joinDate}</div>
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
                {[
                  { key: 'week', label: language === 'vi' ? 'Tuần' : 'Week' },
                  { key: 'month', label: language === 'vi' ? 'Tháng' : 'Month' },
                  { key: 'year', label: language === 'vi' ? 'Năm' : 'Year' }
                ].map(f => (
                  <button
                    key={f.key}
                    className={activityPeriod === f.key ? 'active' : ''}
                    onClick={() => setActivityPeriod(f.key)}
                  >{f.label}</button>
                ))}
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
            {(() => {
              const data = activityChartData;
              const totalPosts = data.reduce((s, d) => s + d.posts, 0);
              const totalApps = data.reduce((s, d) => s + d.apps, 0);
              const maxVal = Math.max(...data.map(d => Math.max(d.posts, d.apps)), 1);
              // Làm tròn maxVal lên bội số đẹp
              const step = maxVal <= 5 ? 1 : maxVal <= 20 ? 5 : maxVal <= 100 ? 10 : 50;
              const yMax = Math.ceil(maxVal / step) * step;
              const PAD_L = 48, PAD_R = 20, PAD_T = 30, PAD_B = 40;
              const W = 620, H = 220;
              const scaleY = v => PAD_T + (H - PAD_T - PAD_B) * (1 - v / yMax);
              const scaleX = i => PAD_L + (i / Math.max(data.length - 1, 1)) * (W - PAD_L - PAD_R);
              const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((yMax / 4) * (4 - i)));
              // Hiển thị nhãn thưa nếu nhiều điểm
              const skipLabel = data.length > 15 ? Math.floor(data.length / 8) : 1;
              return (
                <>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                    <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#1D4ED8', fontWeight: 700 }}>
                      {language === 'vi' ? 'Tin đăng' : 'Posts'}: {totalPosts}
                    </div>
                    <div style={{ background: '#ECFDF5', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#065F46', fontWeight: 700 }}>
                      {language === 'vi' ? 'Ứng tuyển' : 'Applications'}: {totalApps}
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 320, display: 'block' }}>
                    <defs>
                      <linearGradient id="actGrad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="actGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Grid */}
                    {yTicks.map((v, i) => (
                      <g key={i}>
                        <line x1={PAD_L} y1={scaleY(v)} x2={W - PAD_R} y2={scaleY(v)} stroke="#F1F5F9" strokeWidth="1" />
                        <text x={PAD_L - 6} y={scaleY(v) + 4} textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600">{v}</text>
                      </g>
                    ))}
                    <line x1={PAD_L} y1={scaleY(0)} x2={W - PAD_R} y2={scaleY(0)} stroke="#E2E8F0" strokeWidth="1.5" />
                    {/* Area posts */}
                    {data.length > 1 && (
                      <polygon
                        fill="url(#actGrad1)"
                        points={[
                          `${scaleX(0)},${scaleY(0)}`,
                          ...data.map((d, i) => `${scaleX(i)},${scaleY(d.posts)}`),
                          `${scaleX(data.length - 1)},${scaleY(0)}`
                        ].join(' ')}
                      />
                    )}
                    {/* Area apps */}
                    {data.length > 1 && (
                      <polygon
                        fill="url(#actGrad2)"
                        points={[
                          `${scaleX(0)},${scaleY(0)}`,
                          ...data.map((d, i) => `${scaleX(i)},${scaleY(d.apps)}`),
                          `${scaleX(data.length - 1)},${scaleY(0)}`
                        ].join(' ')}
                      />
                    )}
                    {/* Lines */}
                    {data.length > 1 && (
                      <>
                        <polyline fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          points={data.map((d, i) => `${scaleX(i)},${scaleY(d.posts)}`).join(' ')} />
                        <polyline fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          points={data.map((d, i) => `${scaleX(i)},${scaleY(d.apps)}`).join(' ')} />
                      </>
                    )}
                    {/* Points + labels */}
                    {data.map((d, i) => {
                      const x = scaleX(i);
                      const yP = scaleY(d.posts);
                      const yA = scaleY(d.apps);
                      const showLbl = i % skipLabel === 0;
                      return (
                        <g key={i}>
                          <circle cx={x} cy={yP} r="4" fill="#3B82F6" stroke="white" strokeWidth="2" />
                          <circle cx={x} cy={yA} r="4" fill="#10B981" stroke="white" strokeWidth="2" />
                          {d.posts > 0 && <text x={x} y={yP - 8} textAnchor="middle" fontSize="10" fill="#3B82F6" fontWeight="700">{d.posts}</text>}
                          {d.apps > 0 && <text x={x} y={yA - 8} textAnchor="middle" fontSize="10" fill="#10B981" fontWeight="700">{d.apps}</text>}
                          {showLbl && <text x={x} y={H - PAD_B + 16} textAnchor="middle" fontSize="10" fill="#64748B">{d.label}</text>}
                        </g>
                      );
                    })}
                  </svg>
                  </div>
                </>
              );
            })()}
          </ChartCard>

          {/* Line Chart - Ứng tuyển theo loại công việc theo Quý */}
          <ChartCard>
            <ChartHeader>
              <h3>{language === 'vi' ? 'Ứng tuyển theo Loại Công Việc' : 'Applications by Job Type'}</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Filter quý */}
                <ChartFilters>
                  {['all', 'Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                    <button
                      key={q}
                      className={selectedQuarter === q ? 'active' : ''}
                      onClick={() => setSelectedQuarter(q)}
                    >
                      {q === 'all' ? (language === 'vi' ? 'Cả năm' : 'All') : q}
                    </button>
                  ))}
                </ChartFilters>
                {/* Dropdown chọn năm */}
                <select
                  value={selectedQuarterYear}
                  onChange={e => setSelectedQuarterYear(Number(e.target.value))}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1E40AF',
                    background: '#EFF6FF',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </ChartHeader>
            <ChartLegend>
              <div className="legend-item">
                <div className="dot" style={{ background: '#3B82F6' }}></div>
                <span>{language === 'vi' ? 'ƯT Tiêu chuẩn' : 'Std Apps'}</span>
              </div>
              <div className="legend-item">
                <div className="dot" style={{ background: '#F59E0B' }}></div>
                <span>{language === 'vi' ? 'ƯT Tuyển gấp' : 'Urgent Apps'}</span>
              </div>
            </ChartLegend>
            {(() => {
              const data = quarterlyChartData;
              const maxVal = Math.max(...data.map(d => Math.max(d.stdApps, d.urgentApps)), 1);
              const step = maxVal <= 5 ? 1 : maxVal <= 20 ? 5 : maxVal <= 100 ? 10 : 50;
              const yMax = Math.ceil(maxVal / step) * step;
              const PAD_L = 48, PAD_R = 20, PAD_T = 30, PAD_B = 40;
              const W = 620, H = 220;
              // Dùng cùng cách scale như "Hoạt động Nền Tảng": điểm đầu tại PAD_L, điểm cuối tại W-PAD_R
              const scaleY = v => PAD_T + (H - PAD_T - PAD_B) * (1 - v / yMax);
              const scaleX = i => PAD_L + (i / (data.length - 1)) * (W - PAD_L - PAD_R);
              const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((yMax / 4) * (4 - i)));
              const totalStd = data.reduce((s, d) => s + d.stdApps, 0);
              const totalUrgent = data.reduce((s, d) => s + d.urgentApps, 0);
              return (
                <>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                    <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#1D4ED8', fontWeight: 700 }}>
                      {language === 'vi' ? 'ƯT Tiêu chuẩn' : 'Std Apps'}: {totalStd}
                    </div>
                    <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#B45309', fontWeight: 700 }}>
                      {language === 'vi' ? 'ƯT Tuyển gấp' : 'Urgent Apps'}: {totalUrgent}
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 280, display: 'block' }}>
                      <defs>
                        <linearGradient id="qGrad1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="qGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid — y=0 baseline */}
                      {yTicks.map((v, i) => (
                        <g key={i}>
                          <line x1={PAD_L} y1={scaleY(v)} x2={W - PAD_R} y2={scaleY(v)} stroke="#F1F5F9" strokeWidth="1" />
                          <text x={PAD_L - 6} y={scaleY(v) + 4} textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600">{v}</text>
                        </g>
                      ))}
                      <line x1={PAD_L} y1={scaleY(0)} x2={W - PAD_R} y2={scaleY(0)} stroke="#E2E8F0" strokeWidth="1.5" />
                      {/* Area fills */}
                      <polygon fill="url(#qGrad1)" points={[
                        `${scaleX(0)},${scaleY(0)}`,
                        ...data.map((d, i) => `${scaleX(i)},${scaleY(d.stdApps)}`),
                        `${scaleX(data.length - 1)},${scaleY(0)}`
                      ].join(' ')} />
                      <polygon fill="url(#qGrad2)" points={[
                        `${scaleX(0)},${scaleY(0)}`,
                        ...data.map((d, i) => `${scaleX(i)},${scaleY(d.urgentApps)}`),
                        `${scaleX(data.length - 1)},${scaleY(0)}`
                      ].join(' ')} />
                      {/* Lines */}
                      <polyline fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        points={data.map((d, i) => `${scaleX(i)},${scaleY(d.stdApps)}`).join(' ')} />
                      <polyline fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        points={data.map((d, i) => `${scaleX(i)},${scaleY(d.urgentApps)}`).join(' ')} />
                      {/* Points + value labels + x labels */}
                      {data.map((d, i) => {
                        const x = scaleX(i);
                        const yS = scaleY(d.stdApps);
                        const yU = scaleY(d.urgentApps);
                        return (
                          <g key={i}>
                            <circle cx={x} cy={yS} r="4" fill="#3B82F6" stroke="white" strokeWidth="2" />
                            <circle cx={x} cy={yU} r="4" fill="#F59E0B" stroke="white" strokeWidth="2" />
                            {d.stdApps > 0 && <text x={x} y={yS - 8} textAnchor="middle" fontSize="10" fill="#3B82F6" fontWeight="700">{d.stdApps}</text>}
                            {d.urgentApps > 0 && <text x={x} y={yU - 8} textAnchor="middle" fontSize="10" fill="#B45309" fontWeight="700">{d.urgentApps}</text>}
                            <text x={x} y={H - PAD_B + 16} textAnchor="middle" fontSize="11" fill="#6b7280" fontWeight="400">{d.label}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </>
              );
            })()}
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
                {[
                  { key: '6months', label: language === 'vi' ? '6 Tháng' : '6 Months' },
                  { key: 'year', label: language === 'vi' ? '12 Tháng' : '12 Months' },
                  { key: 'all', label: language === 'vi' ? '24 Tháng' : '24 Months' }
                ].map(f => (
                  <button key={f.key} className={revenuePeriod === f.key ? 'active' : ''} onClick={() => setRevenuePeriod(f.key)}>{f.label}</button>
                ))}
              </ChartFilters>
            </ChartHeader>

            <ChartLegend>
              <div className="legend-item">
                <div className="dot" style={{ background: '#3b82f6' }}></div>
                <span style={{ fontWeight: '600' }}>{language === 'vi' ? 'Doanh thu (VND)' : 'Revenue (VND)'}</span>
              </div>
            </ChartLegend>

            {(() => {
              const data = revenueChartData;
              const maxVal = Math.max(...data.map(d => d.revenue), 1);
              const step = maxVal <= 100000 ? 10000 : maxVal <= 1000000 ? 100000 : maxVal <= 10000000 ? 1000000 : 10000000;
              const yMax = Math.ceil(maxVal / step) * step;
              const fmtY = v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v;
              const PAD_L = 58, PAD_R = 20, PAD_T = 30, PAD_B = 40;
              const W = 900, H = 240;
              const chartH = H - PAD_T - PAD_B;
              const scaleY = v => PAD_T + chartH * (1 - v / yMax);
              const scaleX = i => PAD_L + (i / Math.max(data.length - 1, 1)) * (W - PAD_L - PAD_R);
              const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((yMax / 4) * (4 - i)));
              const skipLabel = data.length > 12 ? 2 : 1;
              const totalRevByPeriod = data.reduce((s, d) => s + d.revenue, 0);
              return (
                <>
                  <div style={{ marginBottom: 10, fontSize: 14, color: '#1E293B', fontWeight: 700 }}>
                    {language === 'vi' ? 'Tổng kỳ này' : 'Period total'}: {' '}
                    <span style={{ color: '#3B82F6' }}>{new Intl.NumberFormat('vi-VN').format(Math.round(totalRevByPeriod))} VND</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 400, display: 'block' }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid */}
                      {yTicks.map((v, i) => (
                        <g key={i}>
                          <line x1={PAD_L} y1={scaleY(v)} x2={W - PAD_R} y2={scaleY(v)} stroke="#F1F5F9" strokeWidth="1" />
                          <text x={PAD_L - 6} y={scaleY(v) + 4} textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600">{fmtY(v)}</text>
                        </g>
                      ))}
                      <line x1={PAD_L} y1={scaleY(0)} x2={W - PAD_R} y2={scaleY(0)} stroke="#E2E8F0" strokeWidth="1.5" />
                      {/* Area */}
                      {data.length > 1 && (
                        <polygon fill="url(#revGrad)" points={[
                          `${scaleX(0)},${scaleY(0)}`,
                          ...data.map((d, i) => `${scaleX(i)},${scaleY(d.revenue)}`),
                          `${scaleX(data.length - 1)},${scaleY(0)}`
                        ].join(' ')} />
                      )}
                      {/* Line */}
                      {data.length > 1 && (
                        <polyline fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          points={data.map((d, i) => `${scaleX(i)},${scaleY(d.revenue)}`).join(' ')} />
                      )}
                      {/* Points */}
                      {data.map((d, i) => {
                        const x = scaleX(i);
                        const y = scaleY(d.revenue);
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="4" fill="#3B82F6" stroke="white" strokeWidth="2" />
                            {d.revenue > 0 && <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fill="#3B82F6" fontWeight="700">{fmtY(d.revenue)}</text>}
                            {i % skipLabel === 0 && <text x={x} y={H - PAD_B + 16} textAnchor="middle" fontSize="10" fill="#64748B">{d.label}</text>}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </>
              );
            })()}

            <RevenueStatsGrid style={{ marginTop: '20px', borderTop: '1px solid #F1F5F9', paddingTop: '24px' }}>
              {[
                { label: 'Quick Boost', color: '#E0F2FE', iconColor: '#0369A1', icon: <CheckSquare />, pkg: 'Quick Boost' },
                { label: 'Hot Search', color: '#F3E8FF', iconColor: '#7E22CE', icon: <TrendingUp />, pkg: 'Hot Search' },
                { label: 'Spotlight Banner', color: '#FFEDD5', iconColor: '#D97706', icon: <Star />, pkg: 'Spotlight Banner' },
                { label: 'Top Spotlight', color: '#D1FAE5', iconColor: '#059669', icon: <Sparkles />, pkg: 'Top Spotlight' }
              ].map(item => {
                const rev = subscriptions
                  .filter(s => s.packageName === item.pkg && s.status !== 'pending' && s.status !== 'rejected')
                  .reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
                return (
                  <RevenueStatBox key={item.label} $bgColor={item.color} $iconColor={item.iconColor}>
                    <div className="icon">{item.icon}</div>
                    <div className="content">
                      <div className="label">{item.label}</div>
                      <div className="value">{new Intl.NumberFormat('vi-VN').format(Math.round(rev))}đ</div>
                    </div>
                  </RevenueStatBox>
                );
              })}
            </RevenueStatsGrid>
          </RevenueChartCard>
        </RevenueSection>

        {/* AI Urgent recommendations modal */}
        <UrgentRecommendationsModal
          isOpen={showRecsModal}
          onClose={() => setShowRecsModal(false)}
          recommendations={activeRecommendations}
          jobTitle={recJobTitle}
        />

        {/* Urgent Jobs List Modal */}
        {showUrgentJobsModal && (() => {
          const urgentJobList = allJobPosts.filter(
            post => post.category === 'urgent' || post.category === 'quick-jobs' || post.jobType === 'urgent'
          );
          return (
            <div
              onClick={() => setShowUrgentJobsModal(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px'
              }}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'white', borderRadius: '16px', width: '100%', maxWidth: '760px',
                  maxHeight: '80vh', display: 'flex', flexDirection: 'column',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                }}
              >
                {/* Header */}
                <div style={{
                  padding: '20px 24px', borderBottom: '1px solid #F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Zap size={18} color="#F59E0B" />
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '17px', color: '#111827' }}>
                        {language === 'vi' ? 'BÀI TUYỂN GẤP' : 'URGENT JOBS'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '1px' }}>
                        {urgentJobList.length} {language === 'vi' ? 'tin' : 'jobs'} · {language === 'vi' ? 'Hoa hồng 15%' : '15% Commission'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUrgentJobsModal(false)}
                    style={{
                      background: '#F3F4F6', border: 'none', borderRadius: '8px',
                      width: '32px', height: '32px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer', color: '#6B7280', fontSize: '18px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
                    onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}
                  >
                    ✕
                  </button>
                </div>

                {/* Body */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '16px 24px' }}>
                  {urgentJobList.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '48px 0', color: '#9CA3AF'
                    }}>
                      <Zap size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>
                        {language === 'vi' ? 'Chưa có bài tuyển gấp nào' : 'No urgent jobs yet'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {urgentJobList.map((job, idx) => {
                        const salary = job.salary || job.totalSalary || job.salaryPerHour || '';
                        const commission = salary
                          ? new Intl.NumberFormat('vi-VN').format(Math.round(Number(salary) * 0.15)) + ' VND'
                          : '—';
                        const statusColor = job.status === 'approved' ? { bg: '#D1FAE5', color: '#059669' }
                          : job.status === 'pending' ? { bg: '#FEF3C7', color: '#D97706' }
                          : { bg: '#FEE2E2', color: '#DC2626' };
                        const statusLabel = job.status === 'approved'
                          ? (language === 'vi' ? 'Đã duyệt' : 'Approved')
                          : job.status === 'pending'
                          ? (language === 'vi' ? 'Chờ duyệt' : 'Pending')
                          : (job.status || '—');

                        return (
                          <div
                            key={job.idJob || job.id || idx}
                            style={{
                              background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '10px',
                              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px',
                              transition: 'border-color 0.2s, box-shadow 0.2s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = '#F59E0B';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(245,158,11,0.12)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = '#E5E7EB';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {/* Index badge */}
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '6px',
                              background: '#FEF3C7', color: '#D97706', fontWeight: '700',
                              fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {idx + 1}
                            </div>

                            {/* Job info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontWeight: '700', fontSize: '14.5px', color: '#111827',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                              }}>
                                {job.title || job.jobTitle || (language === 'vi' ? '(Không có tiêu đề)' : '(No title)')}
                              </div>
                              <div style={{ fontSize: '12.5px', color: '#6B7280', marginTop: '3px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <span>🏢 {job.companyName || job.employerName || '—'}</span>
                                {job.location && <span>📍 {job.location}</span>}
                                {job.workDate && <span>📅 {job.workDate}</span>}
                              </div>
                            </div>

                            {/* Salary & commission */}
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              {salary && (
                                <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#111827' }}>
                                  {new Intl.NumberFormat('vi-VN').format(Number(salary))} VND
                                </div>
                              )}
                              <div style={{ fontSize: '11.5px', color: '#F59E0B', fontWeight: '600', marginTop: '2px' }}>
                                💰 {language === 'vi' ? 'HH: ' : 'Comm: '}{commission}
                              </div>
                            </div>

                            {/* Status badge */}
                            <div style={{
                              padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px',
                              fontWeight: '700', background: statusColor.bg, color: statusColor.color,
                              flexShrink: 0
                            }}>
                              {statusLabel}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{
                  padding: '14px 24px', borderTop: '1px solid #F3F4F6',
                  display: 'flex', justifyContent: 'flex-end', gap: '10px'
                }}>
                  <button
                    onClick={() => { setShowUrgentJobsModal(false); navigate('/admin/jobs'); }}
                    style={{
                      padding: '8px 18px', borderRadius: '8px', border: 'none',
                      background: '#F59E0B', color: 'white', fontWeight: '700',
                      fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <ArrowRight size={15} />
                    {language === 'vi' ? 'Xem tất cả' : 'View all'}
                  </button>
                  <button
                    onClick={() => setShowUrgentJobsModal(false)}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E7EB',
                      background: 'white', color: '#374151', fontWeight: '600',
                      fontSize: '13.5px', cursor: 'pointer'
                    }}
                  >
                    {language === 'vi' ? 'Đóng' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </DashboardContainer>
    </DashboardLayout>
  );
};

export default AdminDashboard;



