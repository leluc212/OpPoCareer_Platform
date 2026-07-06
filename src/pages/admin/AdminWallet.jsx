import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import { Button, Input } from '../../components/FormElements';
import adminReportService from '../../services/adminReportService';
import quickJobService from '../../services/quickJobService';
import applicationService from '../../services/applicationService';
import { getWithdrawalRequests, updateWithdrawalStatus } from '../../services/packageCatalogService';
import candidateProfileService from '../../services/candidateProfileService';
import notificationService from '../../services/notificationService';
import {
  createWithdrawalApprovedNotification,
  createWithdrawalRejectedNotification
} from '../../services/notificationService';
import UnderDevelopmentModal from '../../components/UnderDevelopmentModal';
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Calendar,
  Settings,
  Receipt,
  FileText,
  BarChart3,
  Eye,
  EyeOff,
  X,
  XCircle,
  ShieldCheck,
  Lock,
  Unlock,
  Briefcase,
  Percent,
  MapPin,
  Timer,
  Users,
  CheckCircle
} from 'lucide-react';

const TabNavigation = styled.div`
  display: flex;
  gap: 8px;
  background: ${props => props.theme.colors.bgLight || '#F1F5F9'};
  padding: 6px;
  border-radius: 14px;
  margin-bottom: 32px;
  border: 1px solid ${props => props.theme.colors.border || '#E2E8F0'};
  width: fit-content;
`;

const TabButton = styled.button`
  padding: 10px 24px;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  background: ${props => props.$active ? 'white' : 'transparent'};
  border: none;
  border-radius: 10px;
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.textLight};
  box-shadow: ${props => props.$active ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'};
  transition: all 0.2s ease-in-out;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const WithdrawTableWrapper = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  margin-top: 16px;
`;

const WithdrawTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  
  th, td {
    padding: 16px 24px;
    border-bottom: 1px solid #e2e8f0;
  }
  
  th {
    background: #f8fafc;
    font-weight: 600;
    color: #475569;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  tbody tr {
    transition: background 0.15s;
    &:hover {
      background: #f8fafc;
    }
  }
`;

const WithdrawCompanyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const WithdrawCompanyLogo = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${props => props.$bgColor || '#e0e7ff'};
  color: ${props => props.$color || '#4338ca'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const WithdrawCompanyDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const WithdrawCompanyName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 4px;
`;

const WithdrawCompanyMeta = styled.div`
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const WithdrawStatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    if (props.$status === 'approved') return '#dcfce7';
    if (props.$status === 'rejected') return '#fee2e2';
    if (props.$status === 'pending') return '#fef3c7';
    return '#f3f4f6';
  }};
  color: ${props => {
    if (props.$status === 'approved') return '#15803d';
    if (props.$status === 'rejected') return '#dc2626';
    if (props.$status === 'pending') return '#ca8a04';
    return '#6b7280';
  }};
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const WithdrawActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const WithdrawApproveButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #059669;
  }
`;

const WithdrawRejectButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #dc2626;
  }
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  flex-wrap: wrap;
  gap: 16px;
  padding: 0 24px 24px;
`;

const PaginationInfo = styled.span`
  font-size: 14px;
  color: #64748b;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const PageButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: ${props => props.$active ? props.theme.colors.primary : 'white'};
  color: ${props => props.$active ? 'white' : '#475569'};
  font-weight: 600;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.$active ? 'white' : props.theme.colors.primary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EscrowBalanceCard = styled(motion.div)`
  background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 32px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(124, 58, 237, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 400px;
    height: 400px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 50%;
  }
  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -10%;
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
  }
`;

const EscrowBalanceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
`;

const EscrowBalanceInfo = styled.div`
  .label {
    font-size: 14px;
    font-weight: 500;
    opacity: 0.85;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .amount {
    font-size: 42px;
    font-weight: 800;
    letter-spacing: -1px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sub-info {
    font-size: 13px;
    opacity: 0.8;
    display: flex;
    gap: 20px;
    span { display: flex; align-items: center; gap: 6px; }
  }
`;

const EscrowToggleBtn = styled.button`
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.25); }
`;

const EscrowStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const EscrowStatCard = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const EscrowStatIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${props => props.bg || '#EDE9FE'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg { width: 20px; height: 20px; color: ${props => props.color || '#7C3AED'}; }
`;

const EscrowStatInfo = styled.div`
  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }
  .stat-label {
    font-size: 12.5px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;
    margin-top: 2px;
  }
`;

const EscrowFilterRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const EscrowFilterButton = styled.button`
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1.5px solid ${props => props.$active ? '#7C3AED' : props.theme.colors.border};
  background: ${props => props.$active ? '#7C3AED' : props.theme.colors.bgLight};
  color: ${props => props.$active ? '#fff' : props.theme.colors.textLight};
  &:hover {
    border-color: #7C3AED;
    color: ${props => props.$active ? '#fff' : '#7C3AED'};
  }
`;

const EscrowSectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EscrowTransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EscrowTransactionCard = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  transition: all 0.2s;
  cursor: pointer;
  &:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border-color: ${props => props.theme.colors.primary}40;
    transform: translateY(-1px);
  }
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const EscrowTxLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
`;

const EscrowTxIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: ${props => props.$status === 'released' ? '#D1FAE5' : '#FEF3C7'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg {
    width: 18px;
    height: 18px;
    color: ${props => props.$status === 'released' ? '#059669' : '#D97706'};
  }
`;

const EscrowTxInfo = styled.div`
  .tx-title {
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 3px;
  }
  .tx-id {
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
    font-family: monospace;
  }
  .tx-date {
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
    margin-top: 2px;
  }
`;

const EscrowTxAmounts = styled.div`
  text-align: right;
  .total {
    font-size: 15px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 3px;
  }
  .breakdown {
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .candidate-share { color: #059669; font-weight: 500; }
  .admin-share { color: #7C3AED; font-weight: 500; }
`;

const EscrowStatusBadge = styled.span`
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: ${props => {
    switch(props.$status) {
      case 'held': return '#FEF3C7';
      case 'released': return '#D1FAE5';
      case 'refunded': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  }};
  color: ${props => {
    switch(props.$status) {
      case 'held': return '#D97706';
      case 'released': return '#059669';
      case 'refunded': return '#DC2626';
      default: return '#6B7280';
    }
  }};
`;

const EscrowModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const EscrowModalContent = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: 20px;
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
`;

const EscrowModalHeader = styled.div`
  padding: 24px 28px 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const EscrowModalHeaderLeft = styled.div`
  flex: 1;
  h2 {
    font-size: 18px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
  }
  .modal-job-id {
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
    font-family: monospace;
  }
`;

const EscrowCloseBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.bgLight};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  svg { width: 18px; height: 18px; color: ${props => props.theme.colors.textLight}; }
  &:hover { background: #FEE2E2; svg { color: #DC2626; } }
`;

const EscrowModalBody = styled.div`
  padding: 24px 28px;
`;

const EscrowDetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const EscrowDetailBox = styled.div`
  background: ${props => props.$bg || '#F9FAFB'};
  border: 1px solid ${props => props.$borderColor || props.theme.colors.border};
  border-radius: 12px;
  padding: 16px;
  .detail-label {
    font-size: 11.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: ${props => props.theme.colors.textLight};
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    svg { width: 14px; height: 14px; }
  }
  .detail-value {
    font-size: 18px;
    font-weight: 700;
    color: ${props => props.$valueColor || props.theme.colors.text};
  }
  .detail-sub {
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
    margin-top: 3px;
  }
`;

const EscrowConfirmRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const EscrowConfirmCard = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1.5px solid ${props => props.$confirmed ? '#6EE7B7' : props.theme.colors.border};
  background: ${props => props.$confirmed ? '#F0FDF4' : '#F9FAFB'};
  .confirm-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.$confirmed ? '#D1FAE5' : '#F3F4F6'};
    svg { width: 16px; height: 16px; color: ${props => props.$confirmed ? '#059669' : '#9CA3AF'}; }
  }
  .confirm-info {
    .confirm-role {
      font-size: 12px;
      color: ${props => props.theme.colors.textLight};
      font-weight: 500;
    }
    .confirm-status {
      font-size: 14px;
      font-weight: 600;
      color: ${props => props.$confirmed ? '#059669' : props.theme.colors.textLight};
    }
  }
`;

const EscrowFlowDiagram = styled.div`
  background: #F8FAFC;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 20px;
  .flow-title {
    font-size: 13px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
    svg { width: 16px; height: 16px; color: #7C3AED; }
  }
`;

const EscrowFlowRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed ${props => props.theme.colors.border};
  &:last-child { border-bottom: none; }
  .flow-label {
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    display: flex;
    align-items: center;
    gap: 6px;
    svg { width: 14px; height: 14px; }
  }
  .flow-value {
    font-size: 14px;
    font-weight: 700;
    color: ${props => props.color || props.theme.colors.text};
  }
`;

const EscrowEmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${props => props.theme.colors.textLight};
  .icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #EDE9FE;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    svg { width: 28px; height: 28px; color: #7C3AED; }
  }
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 6px;
  }
  p { font-size: 13.5px; }
`;

const WalletContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    display: flex;
    align-items: center;
    gap: 12px;

    svg {
      width: 36px;
      height: 36px;
      color: ${props => props.theme.colors.primary};
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
`;

const BalanceCard = styled(motion.div)`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, #1e40af 100%);
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 48px;
  margin-bottom: 32px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px -10px ${props => props.theme.colors.primary}40;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    border-radius: 50%;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    border-radius: 50%;
  }

  .balance-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 0;
    position: relative;
    z-index: 1;

    .balance-info {
      flex: 1;

      .label {
        font-size: 14px;
        font-weight: 500;
        opacity: 0.85;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .amount-wrapper {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 12px;

        .amount {
          font-size: 52px;
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1;
        }

        .toggle-balance {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
          }
        }
      }

      .last-updated {
        font-size: 13px;
        opacity: 0.75;
        display: flex;
        align-items: center;
        gap: 6px;

        svg {
          width: 14px;
          height: 14px;
        }
      }
    }

    .wallet-icon {
      width: 80px;
      height: 80px;
      opacity: 0.15;
    }
  }

  .balance-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
  }
`;

const ActionButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  padding: 12px 24px;
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 20px 24px;
  border: 2px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s;
  box-shadow: ${props => props.theme.shadows.sm};
  border-left: 3px solid ${props => {
    const colorMap = {
      success: props.theme.colors.success,
      error: props.theme.colors.error,
      warning: props.theme.colors.warning,
      primary: props.theme.colors.primary
    };
    return colorMap[props.$color] || props.theme.colors.primary;
  }};

  &:hover {
    border-color: ${props => {
      const colorMap = {
        success: props.theme.colors.success,
        error: props.theme.colors.error,
        warning: props.theme.colors.warning,
        primary: props.theme.colors.primary
      };
      return colorMap[props.$color] || props.theme.colors.primary;
    }};
    transform: translateX(4px);
    box-shadow: ${props => props.theme.shadows.md};
  }

  .stat-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;

    .icon {
      width: 48px;
      height: 48px;
      border-radius: ${props => props.theme.borderRadius.lg};
      background: ${props => {
        const colorMap = {
          success: props.theme.colors.successBg,
          error: props.theme.colors.errorBg,
          warning: props.theme.colors.warningBg,
          primary: props.theme.colors.primary + '15'
        };
        return colorMap[props.$color] || props.theme.colors.primary + '15';
      }};
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg {
        width: 24px;
        height: 24px;
        color: ${props => {
          const colorMap = {
            success: props.theme.colors.success,
            error: props.theme.colors.error,
            warning: props.theme.colors.warning,
            primary: props.theme.colors.primary
          };
          return colorMap[props.$color] || props.theme.colors.primary;
        }};
      }
    }

    .stat-info {
      flex: 1;
      min-width: 0;

      .stat-label {
        font-size: 13px;
        color: ${props => props.theme.colors.textLight};
        font-weight: 500;
        margin-bottom: 6px;
      }

      .stat-value {
        font-size: 20px;
        font-weight: 800;
        color: ${props => props.theme.colors.text};
        letter-spacing: -0.5px;
      }
    }
  }

  .stat-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .stat-change {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: ${props => props.$positive ? props.theme.colors.success : props.theme.colors.error};
      background: ${props => props.$positive ? props.theme.colors.successBg : props.theme.colors.errorBg};
      padding: 6px 10px;
      border-radius: ${props => props.theme.borderRadius.full};
      font-weight: 600;
      white-space: nowrap;

      svg {
        width: 12px;
        height: 12px;
      }
    }
  }
`;

const ContentSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 32px;
  border: 2px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.sm};
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary}30;
    box-shadow: ${props => props.theme.shadows.md};
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;

    h2 {
      font-size: 22px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      display: flex;
      align-items: center;
      gap: 12px;

      svg {
        width: 24px;
        height: 24px;
        color: ${props => props.theme.colors.primary};
      }
    }

    .header-action {
      display: flex;
      gap: 8px;
    }
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;

  .filter-group {
    display: flex;
    gap: 8px;
    flex: 1;
    flex-wrap: wrap;
  }
`;

const FilterButton = styled(motion.button)`
  padding: 10px 20px;
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.bgDark};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  box-shadow: ${props => props.$active ? props.theme.shadows.sm : 'none'};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.bgDark};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 3px;

    &:hover {
      background: ${props => props.theme.colors.primary};
    }
  }
`;

const TransactionItem = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 2px solid ${props => props.theme.colors.border};
  transition: all 0.3s;
  cursor: pointer;
  box-shadow: ${props => props.theme.shadows.sm};

  &:hover {
    border-color: ${props => props.$type === 'income' ? props.theme.colors.success : props.theme.colors.error};
    transform: translateX(8px);
    box-shadow: ${props => props.theme.shadows.md};
  }

  .transaction-info {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 0;

    .icon {
      width: 52px;
      height: 52px;
      border-radius: ${props => props.theme.borderRadius.lg};
      background: ${props => props.$type === 'income' ? props.theme.colors.successBg : props.theme.colors.errorBg};
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg {
        width: 24px;
        height: 24px;
        color: ${props => props.$type === 'income' ? props.theme.colors.success : props.theme.colors.error};
      }
    }

    .details {
      flex: 1;
      min-width: 0;

      h4 {
        font-size: 15px;
        font-weight: 700;
        color: ${props => props.theme.colors.text};
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      p {
        font-size: 13px;
        color: ${props => props.theme.colors.textLight};
        display: flex;
        align-items: center;
        gap: 6px;

        svg {
          width: 14px;
          height: 14px;
        }
      }
    }
  }

  .transaction-amount {
    text-align: right;
    flex-shrink: 0;

    .amount {
      font-size: 20px;
      font-weight: 800;
      color: ${props => props.$type === 'income' ? props.theme.colors.success : props.theme.colors.error};
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }
  }
`;

const StatusBadge = styled.span`
  padding: 3px 10px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    switch (props.$status) {
      case 'completed': return props.theme.colors.successBg;
      case 'pending':   return props.theme.colors.warningBg;
      case 'failed':    return props.theme.colors.errorBg;
      default:          return props.theme.colors.infoBg;
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'completed': return props.theme.colors.success;
      case 'pending':   return props.theme.colors.warning;
      case 'failed':    return props.theme.colors.error;
      default:          return props.theme.colors.info;
    }
  }};
`;

const ReceiptCard = styled(motion.div)`
  padding: 20px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 2px solid ${props => props.theme.colors.border};
  margin-bottom: 12px;
  transition: all 0.3s;
  box-shadow: ${props => props.theme.shadows.sm};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
    cursor: pointer;
  }

  .receipt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;

    h4 {
      font-size: 15px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      display: flex;
      align-items: center;
      gap: 8px;

      svg {
        width: 18px;
        height: 18px;
        color: ${props => props.theme.colors.primary};
      }
    }

    .download-btn {
      color: ${props => props.theme.colors.primary};
      cursor: pointer;
      padding: 8px;
      border-radius: ${props => props.theme.borderRadius.md};
      background: ${props => props.theme.colors.primary}10;
      transition: all 0.2s;

      &:hover {
        background: ${props => props.theme.colors.primary}20;
        transform: scale(1.1);
      }
    }
  }

  .receipt-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};

    .amount {
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      font-size: 15px;
    }
  }
`;

const AdminWallet = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'escrow' | 'withdrawals'
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('');

  // Withdrawal requests states
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [candidateWithdrawRequests, setCandidateWithdrawRequests] = useState([]);
  const [withdrawTypeTab, setWithdrawTypeTab] = useState('employer'); // 'employer' | 'candidate'
  const [withdrawSearch, setWithdrawSearch] = useState('');
  const [withdrawStatusFilter, setWithdrawStatusFilter] = useState('all');
  const [withdrawWeekFilter, setWithdrawWeekFilter] = useState(false);
  const [withdrawCurrentPage, setWithdrawCurrentPage] = useState(1);

  useEffect(() => {
    setWithdrawCurrentPage(1);
  }, [withdrawTypeTab]);

  // Escrow specific states
  const [escrowJobs, setEscrowJobs] = useState([]);
  const [escrowTx, setEscrowTx] = useState([]);
  const [showEscrowBalance, setShowEscrowBalance] = useState(true);
  const [escrowFilter, setEscrowFilter] = useState('all');
  const [selectedEscrowJob, setSelectedEscrowJob] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
  };

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      
      const [subscriptions, realJobs, apps, withdrawalRequests, candidateData] = await Promise.all([
        adminReportService.getAllSubscriptions().catch(() => []),
        quickJobService.getAllQuickJobs().catch(() => []),
        applicationService.getAllApplications().catch(() => []),
        getWithdrawalRequests().catch(() => []),
        candidateProfileService.getAllCandidates().catch(() => [])
      ]);

      // 1. Process Subscription Purchases as Income Transactions
      const subscriptionTransactions = subscriptions
        .filter(item => item.status === 'active' || item.status === 'expired' || item.status === 'expiring' || item.status === 'locked' || item.approvalStatus === 'approved' || item.status === 'pending' || item.approvalStatus === 'pending')
        .map(item => {
          const priceVal = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
          const isPending = item.status === 'pending' || item.approvalStatus === 'pending';
          
          return {
            id: `sub-${item.subscriptionId || item.id || Math.random()}`,
            type: 'income',
            title: language === 'vi'
              ? `Thanh toán gói ${item.packageName || item.package} - ${item.companyName || item.employer}`
              : `Package payment ${item.packageName || item.package} - ${item.companyName || item.employer}`,
            meta: language === 'vi' ? 'Gói dịch vụ' : 'Package subscription',
            amount: priceVal,
            date: item.purchaseDate || (item.purchaseDateTime ? new Date(item.purchaseDateTime).toLocaleDateString('vi-VN') : ''),
            time: item.purchaseDateTime ? new Date(item.purchaseDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '00:00',
            status: isPending ? 'pending' : 'completed',
            rawDate: item.purchaseDateTime || item.purchaseDate || item.createdAt || new Date().toISOString()
          };
        });

      // 2. Process Escrow Commission (15%) from Completed Applications of Quick Jobs as Income Transactions
      const completedApps = apps.filter(app => app.status === 'completed');
      const commissionTransactions = completedApps
        .map(app => {
          const job = realJobs.find(j => String(j.idJob || j.id || j.jobID) === String(app.jobId));
          const totalAmount = job ? (Number(job.totalSalary) || (Number(job.hourlyRate || 0) * Number(job.totalHours || 0)) || 0) : 0;
          const candidateAmount = Math.round(totalAmount * 0.85);
          const adminCommission = totalAmount - candidateAmount;

          if (adminCommission <= 0) return null;

          return {
            id: `escrow-${app.applicationId || app.id}`,
            type: 'income',
            title: language === 'vi'
              ? `Hoa hồng dịch vụ (15%) - ${job?.title || 'Công việc tuyển gấp'}`
              : `Service commission (15%) - ${job?.title || 'Urgent job'}`,
            meta: language === 'vi' ? 'Ví điện tử' : 'Digital Wallet',
            amount: adminCommission,
            date: new Date(app.candidateConfirmedAt || app.updatedAt || app.createdAt || Date.now()).toLocaleDateString('vi-VN'),
            time: new Date(app.candidateConfirmedAt || app.updatedAt || app.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            status: 'completed',
            rawDate: app.candidateConfirmedAt || app.updatedAt || app.createdAt || new Date().toISOString()
          };
        })
        .filter(Boolean);

      // 3. Process Withdrawal Requests (both employer and candidate) as Expense Transactions
      const withdrawalTransactions = (Array.isArray(withdrawalRequests) ? withdrawalRequests : []).map(w => {
        const isApproved = w.status === 'approved';
        const isRejected = w.status === 'rejected';
        const rawDate = w.createdAt || w.updatedAt || new Date().toISOString();

        return {
          id: `withdraw-${w.requestId || w.id}`,
          type: 'expense',
          title: language === 'vi'
            ? `Giải ngân cho ${w.companyName || 'Ứng viên'}`
            : `Payout to ${w.companyName || 'Candidate'}`,
          meta: language === 'vi' ? 'Chuyển khoản ngân hàng' : 'Bank transfer',
          amount: parseFloat(w.amount || 0),
          date: new Date(rawDate).toLocaleDateString('vi-VN'),
          time: new Date(rawDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          status: isApproved ? 'completed' : (isRejected ? 'failed' : 'pending'),
          rawDate,
          rawStatus: w.status
        };
      });

      // Merge and sort all transactions by rawDate descending
      const allTx = [...subscriptionTransactions, ...commissionTransactions, ...withdrawalTransactions];
      allTx.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

      setTransactions(allTx);

      // Summarize metrics
      // Total Income is from completed subscriptions + completed commissions
      const sumIncome = subscriptionTransactions
        .filter(tx => tx.status === 'completed')
        .reduce((sum, tx) => sum + tx.amount, 0) + 
        commissionTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      // Total Expenses is from approved withdraw requests
      const sumExpenses = withdrawalTransactions
        .filter(tx => tx.rawStatus === 'approved')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const netPlatformBalance = sumIncome - sumExpenses;

      setBalance(netPlatformBalance);
      setTotalIncome(sumIncome);
      setTotalExpenses(sumExpenses);
      setNetProfit(sumIncome - sumExpenses);
      setTransactionCount(allTx.length);

      // Map Escrow Jobs (Quick jobs that have salary)
      const dbEscrowJobs = realJobs.map(job => {
        const jobId = job.jobID || job.idJob || job.id;
        const jobApps = apps.filter(app => String(app.jobId) === String(jobId));
        
        const completedApp = jobApps.find(app => app.status === 'completed');
        const pendingCandidateApp = jobApps.find(app => app.status === 'completed_pending_candidate');
        
        const employerConfirmed = !!completedApp || !!pendingCandidateApp;
        const candidateConfirmed = !!completedApp;
        
        let status = 'held';
        if (job.status === 'deleted' || job.status === 'ĐÃ_HOÀN_TRẢ' || job.status === 'refunded') {
          status = 'refunded';
        } else if (completedApp) {
          status = 'released';
        }

        const totalHours = Number(job.totalHours || 0);
        const hourlyRate = Number(job.hourlyRate || 0);
        const amount = Number(job.totalSalary) || (hourlyRate * totalHours) || 0;

        const replacedApps = jobApps.filter(app => app.status === 'ĐÃ_BỊ_THAY_THẾ');
        const replacedCandidateNames = replacedApps.map(app => app.fullName || app.candidateName || app.candidateEmail || app.candidateId).filter(Boolean);

        const activeApp = completedApp || pendingCandidateApp || jobApps.find(app => ['accepted', 'approved', 'reviewed'].includes(app.status) && app.status !== 'ĐÃ_BỊ_THAY_THẾ');
        const candidateName = activeApp ? (activeApp.fullName || activeApp.candidateName || activeApp.candidateEmail || activeApp.candidateId) : null;
        const employerName = job.companyName || job.employerEmail || job.employerId || (language === 'vi' ? 'Chưa rõ' : 'Unknown');

        return {
          jobId: jobId,
          jobTitle: job.title || 'Untitled Job',
          amount: amount,
          status: status,
          employerConfirmed,
          candidateConfirmed,
          createdAt: job.createdAt || new Date().toISOString(),
          releasedAt: completedApp?.candidateConfirmedAt || completedApp?.updatedAt || null,
          totalHours: totalHours,
          hourlyRate: hourlyRate,
          employerName,
          candidateName,
          replacedCandidateNames
        };
      }).filter(ej => ej.amount > 0);

      const dbEscrowTx = [];
      dbEscrowJobs.forEach((ej) => {
        if (ej.status === 'released') {
          const totalAmount = ej.amount;
          const candidateAmount = Math.round(totalAmount * 0.85);
          const adminAmount = totalAmount - candidateAmount;
          
          dbEscrowTx.push({
            id: `db-tx-${ej.jobId}`,
            jobId: ej.jobId,
            jobTitle: ej.jobTitle,
            totalAmount,
            candidateAmount,
            adminAmount,
            date: ej.releasedAt || ej.createdAt || new Date().toISOString(),
            type: 'release'
          });
        }
      });

      // Sort chronologically (newest first)
      dbEscrowJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      dbEscrowTx.sort((a, b) => new Date(b.date) - new Date(a.date));

      setEscrowJobs(dbEscrowJobs);
      setEscrowTx(dbEscrowTx);

      const mappedWithdrawals = (withdrawalRequests || []).map(item => ({
        ...item,
        id: item.requestId || item.id
      })).filter(req => req.isCandidate !== true);
      setWithdrawRequests(mappedWithdrawals);

      const candRequests = [];
      if (Array.isArray(candidateData)) {
        candidateData.forEach(candidate => {
          if (Array.isArray(candidate.withdrawals)) {
            candidate.withdrawals.forEach(w => {
              candRequests.push({
                id: w.id || `withdraw-${w.date}`,
                employerId: candidate.userId || candidate.id,
                companyName: candidate.fullName || candidate.name || (candidate.email ? candidate.email.split('@')[0] : 'Unknown Candidate'),
                amount: Math.abs(Number(w.amount || 0)),
                bankName: w.bankName || '',
                accountNumber: w.accountNumber || '',
                accountName: w.accountName || '',
                status: w.status || 'pending',
                createdAt: w.date || new Date().toISOString(),
                isCandidate: true,
                companyLogo: candidate.avatar || candidate.profileImage || null
              });
            });
          }
        });
      }
      candRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCandidateWithdrawRequests(candRequests);

      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(language === 'vi' ? `Hôm nay, ${timeStr}` : `Today, ${timeStr}`);
    } catch (err) {
      console.error('Error loading admin wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveWithdrawal = async (requestId) => {
    const req = withdrawRequests.find(r => r.id === requestId);
    try {
      await updateWithdrawalStatus(requestId, 'approved');
      setWithdrawRequests(prev =>
        prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r)
      );

      // Send notification to employer
      if (req?.employerId) {
        try {
          await createWithdrawalApprovedNotification({
            employerId: req.employerId,
            amount: req.amount || 0,
            bankName: req.bankName || req.bank || '',
            accountNumber: req.accountNumber || req.bankAccount || '',
          });
        } catch (notifErr) {
          console.warn('Notification error (withdrawal approved):', notifErr.message);
        }
      }
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      alert(language === 'vi' ? 'Không thể duyệt yêu cầu rút tiền' : 'Failed to approve withdrawal');
    }
  };

  const handleRejectWithdrawal = async (requestId) => {
    const req = withdrawRequests.find(r => r.id === requestId);
    try {
      await updateWithdrawalStatus(requestId, 'rejected');
      setWithdrawRequests(prev =>
        prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r)
      );

      // Send notification to employer
      if (req?.employerId) {
        try {
          await createWithdrawalRejectedNotification({
            employerId: req.employerId,
            amount: req.amount || 0,
            bankName: req.bankName || req.bank || '',
            accountNumber: req.accountNumber || req.bankAccount || '',
          });
        } catch (notifErr) {
          console.warn('Notification error (withdrawal rejected):', notifErr.message);
        }
      }
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
      alert(language === 'vi' ? 'Không thể từ chối yêu cầu rút tiền' : 'Failed to reject withdrawal');
    }
  };

  const handleApproveCandidateWithdrawal = async (requestId) => {
    try {
      const request = candidateWithdrawRequests.find(req => req.id === requestId);
      if (!request) return;

      const candidateId = request.employerId;

      const profile = await candidateProfileService.getProfile(candidateId);
      if (profile) {
        const existingWithdrawals = profile.withdrawals || [];
        const updatedWithdrawals = existingWithdrawals.map(w => 
          w.id === requestId ? { ...w, status: 'approved' } : w
        );
        await candidateProfileService.adminUpdateCandidateProfile(candidateId, {
          withdrawals: updatedWithdrawals
        });
      }

      setCandidateWithdrawRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, status: 'approved' } : req
        )
      );

      try {
        await notificationService.createCandidateWithdrawalStatusNotification(request, 'approved');
      } catch (notifyErr) {
        console.error('Error sending approval notification:', notifyErr);
      }

      alert(language === 'vi' ? 'Duyệt yêu cầu rút tiền thành công!' : 'Withdrawal request approved successfully!');
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      alert(language === 'vi' ? 'Không thể duyệt yêu cầu rút tiền' : 'Failed to approve withdrawal');
    }
  };

  const handleRejectCandidateWithdrawal = async (requestId) => {
    try {
      const request = candidateWithdrawRequests.find(req => req.id === requestId);
      if (!request) return;

      const candidateId = request.employerId;

      const profile = await candidateProfileService.getProfile(candidateId);
      if (profile) {
        const existingWithdrawals = profile.withdrawals || [];
        const updatedWithdrawals = existingWithdrawals.map(w => 
          w.id === requestId ? { ...w, status: 'rejected' } : w
        );
        const refundAmount = Number(request.amount || 0);
        const currentBalance = Number(profile.walletBalance || 0);
        const newBalance = Math.max(0, currentBalance + refundAmount);
        await candidateProfileService.adminUpdateCandidateProfile(candidateId, {
          withdrawals: updatedWithdrawals,
          walletBalance: newBalance
        });
      }

      setCandidateWithdrawRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, status: 'rejected' } : req
        )
      );

      try {
        await notificationService.createCandidateWithdrawalStatusNotification(request, 'rejected');
      } catch (notifyErr) {
        console.error('Error sending rejection notification:', notifyErr);
      }

      alert(language === 'vi' ? 'Đã từ chối yêu cầu rút tiền!' : 'Withdrawal request rejected!');
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
      alert(language === 'vi' ? 'Không thể từ chối yêu cầu rút tiền' : 'Failed to reject withdrawal');
    }
  };

  const filteredWithdrawRequests = useMemo(() => {
    return withdrawRequests.filter(req => {
      const matchesSearch = withdrawSearch === '' ||
        req.companyName.toLowerCase().includes(withdrawSearch.toLowerCase()) ||
        (req.employerId && req.employerId.toLowerCase().includes(withdrawSearch.toLowerCase()));
        
      const matchesStatus = withdrawStatusFilter === 'all' || req.status === withdrawStatusFilter;
      
      let matchesWeek = true;
      if (withdrawWeekFilter) {
        const reqDate = new Date(req.createdAt);
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);
        matchesWeek = reqDate >= startOfWeek;
      }
      
      return matchesSearch && matchesStatus && matchesWeek;
    });
  }, [withdrawRequests, withdrawSearch, withdrawStatusFilter, withdrawWeekFilter]);

  const withdrawItemsPerPage = 15;
  const totalWithdrawPages = Math.ceil(filteredWithdrawRequests.length / withdrawItemsPerPage);
  const withdrawStartIndex = (withdrawCurrentPage - 1) * withdrawItemsPerPage;
  const currentWithdrawRequests = filteredWithdrawRequests.slice(withdrawStartIndex, withdrawStartIndex + withdrawItemsPerPage);

  const filteredCandidateWithdrawRequests = useMemo(() => {
    return candidateWithdrawRequests.filter(req => {
      const matchesSearch = withdrawSearch === '' ||
        req.companyName.toLowerCase().includes(withdrawSearch.toLowerCase()) ||
        (req.employerId && req.employerId.toLowerCase().includes(withdrawSearch.toLowerCase())) ||
        req.bankName.toLowerCase().includes(withdrawSearch.toLowerCase()) ||
        req.accountNumber.includes(withdrawSearch);
        
      const matchesStatus = withdrawStatusFilter === 'all' || req.status === withdrawStatusFilter;
      
      let matchesWeek = true;
      if (withdrawWeekFilter) {
        const reqDate = new Date(req.createdAt);
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);
        matchesWeek = reqDate >= startOfWeek;
      }
      
      return matchesSearch && matchesStatus && matchesWeek;
    });
  }, [candidateWithdrawRequests, withdrawSearch, withdrawStatusFilter, withdrawWeekFilter]);

  const candWithdrawItemsPerPage = 15;
  const candWithdrawTotalPages = Math.ceil(filteredCandidateWithdrawRequests.length / candWithdrawItemsPerPage);
  const candWithdrawStartIndex = (withdrawCurrentPage - 1) * candWithdrawItemsPerPage;
  const currentCandWithdrawRequests = filteredCandidateWithdrawRequests.slice(candWithdrawStartIndex, candWithdrawStartIndex + candWithdrawItemsPerPage);

  const getWithdrawStatusText = (status) => {
    switch(status) {
      case 'approved': return language === 'vi' ? 'Đã duyệt' : 'Approved';
      case 'rejected': return language === 'vi' ? 'Từ chối' : 'Rejected';
      case 'pending': return language === 'vi' ? 'Chờ duyệt' : 'Pending';
      default: return status;
    }
  };

  const getCompanyInitials = (name) => {
    if (!name || name === 'N/A') return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getColorScheme = (index) => {
    const schemes = [
      { bg: '#e0e7ff', color: '#4338ca' },
      { bg: '#fef3c7', color: '#ca8a04' },
      { bg: '#dcfce7', color: '#15803d' },
      { bg: '#fee2e2', color: '#dc2626' },
      { bg: '#f3e8ff', color: '#7c3aed' },
    ];
    return schemes[index % schemes.length];
  };

  useEffect(() => {
    loadWalletData();
  }, [language]);

  const stats = [
    {
      label: language === 'vi' ? 'Tổng Thu Nhập' : 'Total Income',
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: 'success',
      change: language === 'vi' ? 'Tích lũy' : 'Cumulative',
      positive: true
    },
    {
      label: language === 'vi' ? 'Tổng Chi Phí' : 'Total Expenses',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'error',
      change: language === 'vi' ? 'Giải ngân' : 'Payouts',
      positive: false
    },
    {
      label: language === 'vi' ? 'Lợi Nhuận Ròng' : 'Net Profit',
      value: formatCurrency(netProfit),
      icon: DollarSign,
      color: 'primary',
      change: language === 'vi' ? 'Số dư khả dụng' : 'Available balance',
      positive: true
    },
    {
      label: language === 'vi' ? 'Số Giao Dịch' : 'Transactions',
      value: String(transactionCount),
      icon: BarChart3,
      color: 'warning',
      change: language === 'vi' ? 'Tổng giao dịch' : 'Total transactions',
      positive: true
    }
  ];

  const handleExportTransactions = () => {
    try {
      const headers = language === 'vi' 
        ? ['Mã giao dịch', 'Loại giao dịch', 'Chi tiết', 'Số tiền (VND)', 'Ngày giao dịch']
        : ['Transaction ID', 'Type', 'Description', 'Amount (VND)', 'Date'];
        
      const rows = filtered.map(tx => {
        const isIncome = tx.type === 'income';
        const sign = isIncome ? '+' : '-';
        const formattedAmount = `${sign}${Math.abs(tx.amount)}`;
        
        const txType = isIncome
          ? (language === 'vi' ? 'Thu nhập / Doanh thu' : 'Income / Revenue')
          : (language === 'vi' ? 'Chi phí / Giải ngân' : 'Expense / Payout');
          
        const cleanText = (s) => (s || '').replace(/^(Escrow|escrow)\s*[-–]\s*/i, '').replace(/qua SePay/gi, '').replace(/SePay/gi, '').trim();

        return [
          tx.id,
          txType,
          tx.title ? cleanText(tx.title).replace(/,/g, ';') : '',
          formattedAmount,
          tx.date && tx.time ? `${tx.date} ${tx.time}` : ''
        ];
      });
      
      const csvContent = "\uFEFF"
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
        
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `opporeview_admin_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting transactions:', err);
    }
  };

  const handleExportReport = () => {
    try {
      const headers = language === 'vi'
        ? ['Chỉ số', 'Giá trị']
        : ['Metric', 'Value'];
        
      const rows = [
        [language === 'vi' ? 'Tổng số dư nền tảng' : 'Total Platform Balance', formatCurrency(balance)],
        [language === 'vi' ? 'Tổng thu nhập' : 'Total Income', formatCurrency(totalIncome)],
        [language === 'vi' ? 'Tổng chi phí' : 'Total Expenses', formatCurrency(totalExpenses)],
        [language === 'vi' ? 'Lợi nhuận ròng' : 'Net Profit', formatCurrency(netProfit)],
        [language === 'vi' ? 'Số lượng giao dịch' : 'Number of Transactions', transactionCount]
      ];
      
      const csvContent = "\uFEFF"
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
        
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `opporeview_admin_wallet_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting report:', err);
    }
  };

  const handleDownloadInvoice = (invoice) => {
    try {
      const invoiceContent = `
=============================================
${language === 'vi' ? 'HÓA ĐƠN NỀN TẢNG OPPOREVIEW' : 'OPPOREVIEW PLATFORM INVOICE'}
=============================================
${language === 'vi' ? 'Mã hóa đơn' : 'Invoice ID'}: INV-${invoice.id.substring(4, 12)}
${language === 'vi' ? 'Mã giao dịch' : 'Transaction ID'}: ${invoice.id}
${language === 'vi' ? 'Ngày' : 'Date'}: ${invoice.date}
${language === 'vi' ? 'Số tiền' : 'Amount'}: ${invoice.amount}
---------------------------------------------
${language === 'vi' ? 'Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!' : 'Thank you for using our services!'}
=============================================
`;
      const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `invoice_INV-${invoice.id.substring(4, 12)}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading invoice:', err);
    }
  };

  const handleExportAllInvoices = () => {
    try {
      const headers = language === 'vi'
        ? ['Mã hóa đơn', 'Mã giao dịch', 'Ngày', 'Số tiền']
        : ['Invoice ID', 'Transaction ID', 'Date', 'Amount'];
        
      const allInvoices = transactions
        .filter(tx => tx.id.startsWith('sub-') && tx.status === 'completed')
        .map(tx => [
          `INV-${tx.id.substring(4, 12)}`,
          tx.id,
          tx.date,
          formatCurrency(tx.amount)
        ]);
        
      const csvContent = "\uFEFF"
        + [headers.join(','), ...allInvoices.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
        
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `opporeview_admin_all_invoices_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting invoices:', err);
    }
  };

  // Derive Dynamic Receipts (Invoices) from successful subscription transactions
  const receipts = transactions
    .filter(tx => tx.id.startsWith('sub-') && tx.status === 'completed')
    .slice(0, 4)
    .map(tx => ({
      id: tx.id,
      title: language === 'vi' ? `Hóa đơn #INV-${tx.id.substring(4, 12)}` : `Invoice #INV-${tx.id.substring(4, 12)}`,
      date: tx.date,
      amount: formatCurrency(tx.amount)
    }));

  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    
    if (filterDate) {
      if (!t.rawDate) return false;
      const txDate = new Date(t.rawDate);
      const yyyy = txDate.getFullYear();
      const mm = String(txDate.getMonth() + 1).padStart(2, '0');
      const dd = String(txDate.getDate()).padStart(2, '0');
      const formattedTxDate = `${yyyy}-${mm}-${dd}`;
      if (formattedTxDate !== filterDate) return false;
    }
    return true;
  });

  const statusLabel = (status) => {
    const map = {
      completed: language === 'vi' ? 'Hoàn thành' : 'Completed',
      pending:   language === 'vi' ? 'Đang xử lý' : 'Pending',
      failed:    language === 'vi' ? 'Thất bại' : 'Failed'
    };
    return map[status] || status;
  };

  const totalHeld = escrowJobs
    .filter(j => j.status === 'held')
    .reduce((sum, j) => sum + j.amount, 0);

  const totalReleased = escrowJobs
    .filter(j => j.status === 'released')
    .reduce((sum, j) => sum + j.amount, 0);

  const totalCommission = escrowTx
    .filter(t => t.type === 'release')
    .reduce((sum, t) => sum + t.adminAmount, 0);

  const totalCandidatePaid = escrowTx
    .filter(t => t.type === 'release')
    .reduce((sum, t) => sum + t.candidateAmount, 0);

  const heldCount = escrowJobs.filter(j => j.status === 'held').length;
  const releasedCount = escrowJobs.filter(j => j.status === 'released').length;

  const filteredJobs = escrowFilter === 'all'
    ? escrowJobs
    : escrowJobs.filter(j => j.status === escrowFilter);

  const formatEscrowCurrency = (amount) => {
    return amount.toLocaleString('vi-VN') + ' VN\u0110';
  };

  const formatEscrowDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const escrowStats = [
    {
      icon: <Lock />,
      value: formatEscrowCurrency(totalHeld),
      label: language === 'vi' ? 'Tiền đang giữ' : 'Currently Held',
      bg: '#FEF3C7',
      color: '#D97706'
    },
    {
      icon: <Unlock />,
      value: formatEscrowCurrency(totalReleased),
      label: language === 'vi' ? 'Tổng đã giải ngân' : 'Total Released',
      bg: '#D1FAE5',
      color: '#059669'
    },
    {
      icon: <TrendingUp />,
      value: formatEscrowCurrency(totalCommission),
      label: language === 'vi' ? 'Hoa hồng (15%)' : 'Commission (15%)',
      bg: '#EDE9FE',
      color: '#7C3AED'
    },
    {
      icon: <BarChart3 />,
      value: `${heldCount} / ${releasedCount}`,
      label: language === 'vi' ? 'Chờ / Hoàn thành' : 'Pending / Done',
      bg: '#EFF6FF',
      color: '#1e40af'
    }
  ];

  const escrowFilters = [
    { key: 'all', label: language === 'vi' ? 'Tất cả' : 'All' },
    { key: 'held', label: language === 'vi' ? 'Đang giữ' : 'Held' },
    { key: 'released', label: language === 'vi' ? 'Đã giải ngân' : 'Released' },
    { key: 'refunded', label: language === 'vi' ? 'Hoàn trả' : 'Refunded' }
  ];

  const getEscrowStatusIcon = (status) => {
    switch(status) {
      case 'held': return <Lock size={12} />;
      case 'released': return <CheckCircle size={12} />;
      case 'refunded': return <XCircle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const getEscrowStatusLabel = (status) => {
    if (language === 'vi') {
      switch(status) {
        case 'held': return 'Đang giữ';
        case 'released': return 'Đã giải ngân';
        case 'refunded': return 'Hoàn trả';
        default: return status;
      }
    }
    switch(status) {
      case 'held': return 'Held';
      case 'released': return 'Released';
      case 'refunded': return 'Refunded';
      default: return status;
    }
  };

  return (
    <DashboardLayout role="admin" key={language}>
      <WalletContainer>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #1e40af', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#6B7280', fontSize: '15px', fontWeight: '500' }}>
              {language === 'vi' ? 'Đang tải dữ liệu ví...' : 'Loading wallet data...'}
            </p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <>
            <Header>
              <h1>
                <WalletIcon />
                {language === 'vi' ? 'Ví Điện Tử Nền Tảng' : 'Platform E-Wallet'}
              </h1>
              {activeTab === 'overview' && (
                <div className="header-actions">
                  <Button
                    $variant="primary"
                    $size="small"
                    onClick={handleExportReport}
                  >
                    <Download style={{ width: '18px', height: '18px' }} />
                    {language === 'vi' ? 'Xuất Báo Cáo' : 'Export Report'}
                  </Button>
                </div>
              )}
            </Header>

            <TabNavigation>
              <TabButton 
                $active={activeTab === 'overview'} 
                onClick={() => setActiveTab('overview')}
              >
                {language === 'vi' ? 'Tổng quan doanh thu' : 'Revenue Overview'}
              </TabButton>
              <TabButton 
                $active={activeTab === 'escrow'} 
                onClick={() => setActiveTab('escrow')}
              >
                {language === 'vi' ? 'Quản lý thanh toán (Escrow)' : 'Payment Management (Escrow)'}
              </TabButton>
              <TabButton 
                $active={activeTab === 'withdrawals'} 
                onClick={() => setActiveTab('withdrawals')}
              >
                {language === 'vi' ? 'Yêu cầu rút tiền' : 'Withdrawal Requests'}
              </TabButton>
            </TabNavigation>

            {activeTab === 'overview' && (
              <>
                <BalanceCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="balance-header" style={{ marginBottom: 0 }}>
                    <div className="balance-info">
                      <div className="label">
                        {language === 'vi' ? 'Tổng Số Dư Nền Tảng' : 'Total Platform Balance'}
                      </div>
                      <div className="amount-wrapper">
                        <div className="amount">
                          {showBalance ? formatCurrency(balance) : '••••••••••••'}
                        </div>
                        <button
                          className="toggle-balance"
                          onClick={() => setShowBalance(!showBalance)}
                        >
                          {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                      <div className="last-updated">
                        <Clock />
                        {language === 'vi' ? `Cập nhật lần cuối: ${lastUpdated}` : `Last updated: ${lastUpdated}`}
                      </div>
                    </div>
                    <WalletIcon className="wallet-icon" />
                  </div>
                </BalanceCard>

                <StatsGrid>
                  {stats.map((stat, index) => (
                    <StatCard
                      key={index}
                      $color={stat.color}
                      $positive={stat.positive}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="stat-left">
                        <div className="icon">
                          <stat.icon />
                        </div>
                        <div className="stat-info">
                          <div className="stat-label">{stat.label}</div>
                          <div className="stat-value">{stat.value}</div>
                        </div>
                      </div>
                      <div className="stat-right">
                        <div className="stat-change">
                          {stat.positive ? <TrendingUp /> : <TrendingDown />}
                          {stat.change}
                        </div>
                      </div>
                    </StatCard>
                  ))}
                </StatsGrid>

                <ContentSection>
                  <div>
                    <Card
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="card-header">
                        <h2>
                          <Calendar />
                          {language === 'vi' ? 'Lịch Sử Giao Dịch' : 'Transaction History'}
                        </h2>
                        <div className="header-action">
                          <Button
                            $variant="secondary"
                            $size="small"
                            onClick={handleExportTransactions}
                          >
                            <Download style={{ width: '16px', height: '16px' }} />
                            {language === 'vi' ? 'Xuất Excel' : 'Export Excel'}
                          </Button>
                        </div>
                      </div>

                      <FilterBar>
                        <div className="filter-group">
                          <FilterButton
                            $active={filterType === 'all'}
                            onClick={() => setFilterType('all')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {language === 'vi' ? 'Tất Cả' : 'All'}
                          </FilterButton>
                          <FilterButton
                            $active={filterType === 'income'}
                            onClick={() => setFilterType('income')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {language === 'vi' ? 'Thu Nhập' : 'Income'}
                          </FilterButton>
                          <FilterButton
                            $active={filterType === 'expense'}
                            onClick={() => setFilterType('expense')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {language === 'vi' ? 'Chi Phí' : 'Expense'}
                          </FilterButton>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            style={{ width: 'auto', padding: '10px 16px' }}
                          />
                          {filterDate && (
                            <Button
                              $variant="ghost"
                              $size="small"
                              onClick={() => setFilterDate('')}
                              style={{ padding: '8px', minWidth: 'auto', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title={language === 'vi' ? 'Xóa lọc' : 'Clear filter'}
                            >
                              <X size={16} />
                            </Button>
                          )}
                        </div>
                      </FilterBar>

                      <TransactionList>
                        {filtered.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}>
                            {language === 'vi' ? 'Không tìm thấy giao dịch nào' : 'No transactions found'}
                          </div>
                        ) : (
                          filtered.map((tx, index) => (
                            <TransactionItem
                              key={tx.id}
                              $type={tx.type}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <div className="transaction-info">
                                <div className="icon">
                                  {tx.type === 'income'
                                    ? <ArrowDownLeft />
                                    : <ArrowUpRight />}
                                </div>
                                <div className="details">
                                  <h4>{(tx.title || '').replace(/^(Escrow|escrow)\s*[-–]\s*/i, '').replace(/qua SePay/gi, '').replace(/SePay/gi, '').trim()}</h4>
                                  <p>
                                    <CreditCard style={{ width: '14px', height: '14px' }} />
                                    {(tx.meta || '').replace(/^(Escrow|escrow)\s*[-–]\s*/i, '').replace(/qua SePay/gi, '').replace(/SePay/gi, '').trim()}
                                    {' • '}
                                    <Clock style={{ width: '14px', height: '14px' }} />
                                    {tx.date} {tx.time}
                                  </p>
                                </div>
                              </div>
                              <div className="transaction-amount">
                                <div className="amount">
                                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </div>
                                <StatusBadge $status={tx.status}>
                                  {statusLabel(tx.status)}
                                </StatusBadge>
                              </div>
                            </TransactionItem>
                          ))
                        )}
                      </TransactionList>
                    </Card>
                  </div>

                  <div>
                    <Card
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="card-header">
                        <h2>
                          <Receipt />
                          {language === 'vi' ? 'Hóa Đơn Nền Tảng' : 'Platform Invoices'}
                        </h2>
                      </div>

                      {receipts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}>
                          {language === 'vi' ? 'Chưa có hóa đơn nào' : 'No invoices yet'}
                        </div>
                      ) : (
                        receipts.map((receipt, index) => (
                          <ReceiptCard
                            key={receipt.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="receipt-header">
                              <h4>
                                <FileText />
                                {receipt.title}
                              </h4>
                              <Download
                                className="download-btn"
                                style={{ width: '18px', height: '18px' }}
                                onClick={() => handleDownloadInvoice(receipt)}
                              />
                            </div>
                            <div className="receipt-info">
                              <span>{receipt.date}</span>
                              <span className="amount">{receipt.amount}</span>
                            </div>
                          </ReceiptCard>
                        ))
                      )}

                      {receipts.length > 0 && (
                        <Button
                          $variant="ghost"
                          $fullWidth
                          style={{ marginTop: '16px' }}
                          onClick={handleExportAllInvoices}
                        >
                          {language === 'vi' ? 'Xem Tất Cả Hóa Đơn' : 'View All Invoices'}
                        </Button>
                      )}
                    </Card>
                  </div>
                </ContentSection>
              </>
            )}

            {activeTab === 'escrow' && (
              <>
                <EscrowBalanceCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <EscrowBalanceHeader>
                    <EscrowBalanceInfo>
                      <div className="label">
                        {language === 'vi' ? 'Tổng tiền đang giữ' : 'Total Funds Held'}
                      </div>
                      <div className="amount">
                        {showEscrowBalance ? formatEscrowCurrency(totalHeld) : '••••••••'}
                      </div>
                      <div className="sub-info">
                        <span>
                          <TrendingUp size={14} />
                          {language === 'vi' ? 'Hoa hồng:' : 'Commission:'} {formatEscrowCurrency(totalCommission)}
                        </span>
                        <span>
                          <Users size={14} />
                          {language === 'vi' ? 'Đã trả Ứng viên:' : 'Paid to candidates:'} {formatEscrowCurrency(totalCandidatePaid)}
                        </span>
                      </div>
                    </EscrowBalanceInfo>
                    <EscrowToggleBtn onClick={() => setShowEscrowBalance(!showEscrowBalance)}>
                      {showEscrowBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                    </EscrowToggleBtn>
                  </EscrowBalanceHeader>
                </EscrowBalanceCard>

                <EscrowStatsGrid>
                  {escrowStats.map((stat, i) => (
                    <EscrowStatCard
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                    >
                      <EscrowStatIcon bg={stat.bg} color={stat.color}>
                        {stat.icon}
                      </EscrowStatIcon>
                      <EscrowStatInfo>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                      </EscrowStatInfo>
                    </EscrowStatCard>
                  ))}
                </EscrowStatsGrid>

                {escrowTx.length > 0 && (
                  <>
                    <EscrowSectionTitle>
                      <Unlock size={18} />
                      {language === 'vi' ? 'Giao dịch giải ngân gần đây' : 'Recent Releases'}
                    </EscrowSectionTitle>
                    <EscrowTransactionList style={{ marginBottom: 32 }}>
                      {escrowTx.slice(0, 5).map((tx, i) => {
                        const relatedJob = escrowJobs.find(j => j.jobId === tx.jobId);
                        return (
                          <EscrowTransactionCard
                            key={tx.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            onClick={() => relatedJob && setSelectedEscrowJob(relatedJob)}
                          >
                            <EscrowTxLeft>
                              <EscrowTxIcon $status="released">
                                <CheckCircle />
                              </EscrowTxIcon>
                              <EscrowTxInfo>
                                <div className="tx-title">{tx.jobTitle}</div>
                                <div className="tx-id">Job ID: {tx.jobId}</div>
                                <div className="tx-date">{formatEscrowDate(tx.date)}</div>
                              </EscrowTxInfo>
                            </EscrowTxLeft>
                            <EscrowTxAmounts>
                              <div className="total">{formatEscrowCurrency(tx.totalAmount)}</div>
                              <div className="breakdown">
                                <span className="candidate-share">
                                  {language === 'vi' ? 'Ứng viên' : 'Candidate'}: {formatEscrowCurrency(tx.candidateAmount)} (85%)
                                </span>
                                <span className="admin-share">
                                  {language === 'vi' ? 'Nền tảng' : 'Platform'}: {formatEscrowCurrency(tx.adminAmount)} (15%)
                                </span>
                              </div>
                            </EscrowTxAmounts>
                          </EscrowTransactionCard>
                        );
                      })}
                    </EscrowTransactionList>
                  </>
                )}

                <EscrowSectionTitle>
                  <Briefcase size={18} />
                  {language === 'vi' ? 'Tất cả công việc' : 'All Jobs'}
                </EscrowSectionTitle>

                <EscrowFilterRow>
                  {escrowFilters.map(f => (
                    <EscrowFilterButton
                      key={f.key}
                      $active={escrowFilter === f.key}
                      onClick={() => setEscrowFilter(f.key)}
                    >
                      {f.label}
                    </EscrowFilterButton>
                  ))}
                </EscrowFilterRow>

                <EscrowTransactionList>
                  {filteredJobs.length === 0 ? (
                    <EscrowEmptyState>
                      <div className="icon-wrap"><ShieldCheck /></div>
                      <h3>{language === 'vi' ? 'Chưa có giao dịch' : 'No transactions'}</h3>
                      <p>{language === 'vi' ? 'Các giao dịch sẽ xuất hiện khi nhà tuyển dụng đăng bài tuyển gấp.' : 'Transactions will appear when employers post urgent jobs.'}</p>
                    </EscrowEmptyState>
                  ) : (
                    filteredJobs.map((job, i) => (
                      <EscrowTransactionCard
                        key={job.jobId}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        onClick={() => setSelectedEscrowJob(job)}
                      >
                        <EscrowTxLeft>
                          <EscrowTxIcon $status={job.status}>
                            {job.status === 'released' ? <CheckCircle /> : <Lock />}
                          </EscrowTxIcon>
                          <EscrowTxInfo>
                            <div className="tx-title">{job.jobTitle}</div>
                            <div className="tx-id">Job ID: {job.jobId} &bull; {language === 'vi' ? 'Nhà tuyển dụng' : 'Employer'}: {job.employerConfirmed ? '✓' : '✗'} &bull; {language === 'vi' ? 'Ứng viên' : 'Candidate'}: {job.candidateConfirmed ? '✓' : '✗'}</div>
                            <div className="tx-date">{formatEscrowDate(job.createdAt)}</div>
                          </EscrowTxInfo>
                        </EscrowTxLeft>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <EscrowTxAmounts>
                            <div className="total">{formatEscrowCurrency(job.amount)}</div>
                            {job.status === 'released' && (
                              <div className="breakdown">
                                <span className="admin-share">+{formatEscrowCurrency(job.amount - Math.round(job.amount * 0.85))} (15%)</span>
                              </div>
                            )}
                          </EscrowTxAmounts>
                          <EscrowStatusBadge $status={job.status}>
                            {getEscrowStatusIcon(job.status)}
                            {getEscrowStatusLabel(job.status)}
                          </EscrowStatusBadge>
                        </div>
                      </EscrowTransactionCard>
                    ))
                  )}
                </EscrowTransactionList>
              </>
            )}

            {activeTab === 'withdrawals' && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #E2E8F0' }}>
                  <button
                    onClick={() => { setWithdrawTypeTab('employer'); setWithdrawSearch(''); }}
                    style={{
                      padding: '12px 24px',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: withdrawTypeTab === 'employer' ? '#6d28d9' : '#64748B',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `3px solid ${withdrawTypeTab === 'employer' ? '#6d28d9' : 'transparent'}`,
                      cursor: 'pointer',
                      marginBottom: '-2px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {language === 'vi' ? 'Nhà tuyển dụng' : 'Employer'}
                  </button>
                  <button
                    onClick={() => { setWithdrawTypeTab('candidate'); setWithdrawSearch(''); }}
                    style={{
                      padding: '12px 24px',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: withdrawTypeTab === 'candidate' ? '#6d28d9' : '#64748B',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `3px solid ${withdrawTypeTab === 'candidate' ? '#6d28d9' : 'transparent'}`,
                      cursor: 'pointer',
                      marginBottom: '-2px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {language === 'vi' ? 'Ứng viên' : 'Candidate'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px', maxWidth: '400px' }}>
                    <Input
                      type="text"
                      placeholder={withdrawTypeTab === 'employer' 
                        ? (language === 'vi' ? 'Tìm kiếm công ty, ID...' : 'Search company, ID...')
                        : (language === 'vi' ? 'Tìm kiếm ứng viên, ngân hàng...' : 'Search candidate, bank...')}
                      value={withdrawSearch}
                      onChange={(e) => { setWithdrawSearch(e.target.value); setWithdrawCurrentPage(1); }}
                      style={{ width: '100%', padding: '10px 16px' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {[
                      { value: 'all', labelVi: 'Tất cả', labelEn: 'All' },
                      { value: 'pending', labelVi: 'Chờ duyệt', labelEn: 'Pending' },
                      { value: 'approved', labelVi: 'Đồng ý', labelEn: 'Approved' },
                      { value: 'rejected', labelVi: 'Từ chối', labelEn: 'Rejected' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setWithdrawStatusFilter(opt.value); setWithdrawCurrentPage(1); }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: `2px solid ${withdrawStatusFilter === opt.value ? '#6d28d9' : '#e2e8f0'}`,
                          background: withdrawStatusFilter === opt.value ? '#6d28d9' : 'white',
                          color: withdrawStatusFilter === opt.value ? 'white' : '#475569',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {language === 'vi' ? opt.labelVi : opt.labelEn}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => { setWithdrawWeekFilter(prev => !prev); setWithdrawCurrentPage(1); }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: `2px solid ${withdrawWeekFilter ? '#f59e0b' : '#e2e8f0'}`,
                        background: withdrawWeekFilter ? '#f59e0b' : 'white',
                        color: withdrawWeekFilter ? 'white' : '#475569',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {language === 'vi' ? 'Tuần này' : 'This Week'}
                    </button>
                  </div>
                </div>
 
                <WithdrawTableWrapper>
                  <WithdrawTable>
                    <thead>
                      <tr>
                        <th>{withdrawTypeTab === 'employer' ? (language === 'vi' ? 'Nhà tuyển dụng' : 'Employer') : (language === 'vi' ? 'Ứng viên' : 'Candidate')}</th>
                        <th>{language === 'vi' ? 'Số tiền rút' : 'Withdraw Amount'}</th>
                        <th>{language === 'vi' ? 'Thông tin thụ hưởng' : 'Beneficiary Details'}</th>
                        <th>{language === 'vi' ? 'Ngày yêu cầu' : 'Requested Date'}</th>
                        <th>{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                        <th>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(withdrawTypeTab === 'employer' ? currentWithdrawRequests : currentCandWithdrawRequests).map((req, index) => {
                        const colorScheme = getColorScheme(index);
                        const initials = getCompanyInitials(req.companyName);
 
                        return (
                          <tr key={req.id}>
                            <td>
                              <WithdrawCompanyInfo>
                                <WithdrawCompanyLogo $bgColor={colorScheme.bg} $color={colorScheme.color}>
                                  {req.companyLogo ? (
                                    <img src={req.companyLogo} alt={req.companyName} />
                                  ) : (
                                    initials
                                  )}
                                </WithdrawCompanyLogo>
                                <WithdrawCompanyDetails>
                                  <WithdrawCompanyName>{req.companyName}</WithdrawCompanyName>
                                  <WithdrawCompanyMeta>
                                    {withdrawTypeTab === 'employer' ? <Briefcase size={12} /> : <Users size={12} />}
                                    ID: {req.employerId}
                                  </WithdrawCompanyMeta>
                                </WithdrawCompanyDetails>
                              </WithdrawCompanyInfo>
                            </td>
                            <td>
                              <span style={{ fontWeight: 800, color: '#b45309', fontSize: '15px' }}>
                                -{req.amount.toLocaleString('vi-VN')} VND
                              </span>
                            </td>
                            <td>
                              <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                                <div><strong>NH:</strong> {req.bankName}</div>
                                <div><strong>STK:</strong> {req.accountNumber}</div>
                                <div style={{ textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>
                                  <strong>Tên:</strong> {req.accountName}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} />
                                {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                              </div>
                            </td>
                            <td>
                              <WithdrawStatusBadge $status={req.status}>
                                {req.status === 'approved' && <CheckCircle size={12} />}
                                {req.status === 'pending' && <Clock size={12} />}
                                {req.status === 'rejected' && <XCircle size={12} />}
                                {getWithdrawStatusText(req.status)}
                              </WithdrawStatusBadge>
                            </td>
                            <td>
                              {req.status === 'pending' ? (
                                <WithdrawActionButtons>
                                  <WithdrawApproveButton onClick={() => withdrawTypeTab === 'employer' ? handleApproveWithdrawal(req.id) : handleApproveCandidateWithdrawal(req.id)}>
                                    <CheckCircle size={16} />
                                    {language === 'vi' ? 'Duyệt' : 'Approve'}
                                  </WithdrawApproveButton>
                                  <WithdrawRejectButton onClick={() => withdrawTypeTab === 'employer' ? handleRejectWithdrawal(req.id) : handleRejectCandidateWithdrawal(req.id)}>
                                    <XCircle size={16} />
                                    {language === 'vi' ? 'Từ chối' : 'Reject'}
                                  </WithdrawRejectButton>
                                </WithdrawActionButtons>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                                  {language === 'vi' ? 'Đã xử lý' : 'Processed'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {(withdrawTypeTab === 'employer' ? currentWithdrawRequests : currentCandWithdrawRequests).length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                            {language === 'vi' ? 'Không tìm thấy yêu cầu rút tiền nào' : 'No withdrawal requests found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </WithdrawTable>
 
                  {((withdrawTypeTab === 'employer' ? totalWithdrawPages : candWithdrawTotalPages) > 1) && (
                    <PaginationWrapper>
                      <PaginationInfo>
                        {withdrawTypeTab === 'employer' ? (
                          language === 'vi' 
                            ? `Hiển thị ${withdrawStartIndex + 1}-${Math.min(withdrawStartIndex + withdrawItemsPerPage, filteredWithdrawRequests.length)} trong số ${filteredWithdrawRequests.length} yêu cầu`
                            : `Showing ${withdrawStartIndex + 1}-${Math.min(withdrawStartIndex + withdrawItemsPerPage, filteredWithdrawRequests.length)} of ${filteredWithdrawRequests.length} requests`
                        ) : (
                          language === 'vi' 
                            ? `Hiển thị ${candWithdrawStartIndex + 1}-${Math.min(candWithdrawStartIndex + candWithdrawItemsPerPage, filteredCandidateWithdrawRequests.length)} trong số ${filteredCandidateWithdrawRequests.length} yêu cầu`
                            : `Showing ${candWithdrawStartIndex + 1}-${Math.min(candWithdrawStartIndex + candWithdrawItemsPerPage, filteredCandidateWithdrawRequests.length)} of ${filteredCandidateWithdrawRequests.length} requests`
                        )}
                      </PaginationInfo>
                      <PaginationButtons>
                        <PageButton 
                          disabled={withdrawCurrentPage === 1}
                          onClick={() => setWithdrawCurrentPage(prev => prev - 1)}
                        >
                          {language === 'vi' ? 'Trước' : 'Previous'}
                        </PageButton>
                        {Array.from({ length: withdrawTypeTab === 'employer' ? totalWithdrawPages : candWithdrawTotalPages }, (_, idx) => (
                          <PageButton
                            key={idx + 1}
                            $active={withdrawCurrentPage === idx + 1}
                            onClick={() => setWithdrawCurrentPage(idx + 1)}
                          >
                            {idx + 1}
                          </PageButton>
                        ))}
                        <PageButton 
                          disabled={withdrawCurrentPage === (withdrawTypeTab === 'employer' ? totalWithdrawPages : candWithdrawTotalPages)}
                          onClick={() => setWithdrawCurrentPage(prev => prev + 1)}
                        >
                          {language === 'vi' ? 'Sau' : 'Next'}
                        </PageButton>
                      </PaginationButtons>
                    </PaginationWrapper>
                  )}
                </WithdrawTableWrapper>
              </>
            )}

            <AnimatePresence>
              {selectedEscrowJob && (
                <EscrowModalOverlay
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedEscrowJob(null)}
                >
                  <EscrowModalContent
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <EscrowModalHeader>
                      <EscrowModalHeaderLeft>
                        <h2>{selectedEscrowJob.jobTitle}</h2>
                        <div className="modal-job-id">Job ID: {selectedEscrowJob.jobId}</div>
                      </EscrowModalHeaderLeft>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <EscrowStatusBadge $status={selectedEscrowJob.status}>
                          {getEscrowStatusIcon(selectedEscrowJob.status)}
                          {getEscrowStatusLabel(selectedEscrowJob.status)}
                        </EscrowStatusBadge>
                        <EscrowCloseBtn onClick={() => setSelectedEscrowJob(null)}>
                          <X />
                        </EscrowCloseBtn>
                      </div>
                    </EscrowModalHeader>

                    <EscrowModalBody>
                      <EscrowDetailGrid>
                        <EscrowDetailBox $bg="#FEF3C7" $borderColor="#FCD34D" $valueColor="#D97706">
                          <div className="detail-label"><Lock size={14} /> {language === 'vi' ? 'Số tiền' : 'Amount'}</div>
                          <div className="detail-value">{formatEscrowCurrency(selectedEscrowJob.amount)}</div>
                        </EscrowDetailBox>
                        <EscrowDetailBox>
                          <div className="detail-label"><Calendar size={14} /> {language === 'vi' ? 'Ngày đăng' : 'Posted Date'}</div>
                          <div className="detail-value" style={{ fontSize: 15 }}>{formatEscrowDate(selectedEscrowJob.createdAt)}</div>
                        </EscrowDetailBox>
                        <EscrowDetailBox>
                          <div className="detail-label"><Briefcase size={14} /> {language === 'vi' ? 'Nhà tuyển dụng' : 'Employer'}</div>
                          <div className="detail-value" style={{ fontSize: 15 }}>{selectedEscrowJob.employerName || (language === 'vi' ? 'Chưa rõ' : 'Unknown')}</div>
                        </EscrowDetailBox>
                        <EscrowDetailBox>
                          <div className="detail-label">
                            <Users size={14} />{' '}
                            {selectedEscrowJob.replacedCandidateNames && selectedEscrowJob.replacedCandidateNames.length > 0
                              ? (language === 'vi' ? 'Ứng viên thay thế' : 'Replacement Candidate')
                              : (language === 'vi' ? 'Ứng viên' : 'Candidate')}
                          </div>
                          <div className="detail-value" style={{ fontSize: 15, color: selectedEscrowJob.replacedCandidateNames && selectedEscrowJob.replacedCandidateNames.length > 0 ? '#10B981' : 'inherit', fontWeight: selectedEscrowJob.replacedCandidateNames && selectedEscrowJob.replacedCandidateNames.length > 0 ? 700 : 500 }}>
                            {selectedEscrowJob.candidateName || (language === 'vi' ? 'Chưa có' : 'None')}
                          </div>
                        </EscrowDetailBox>
                        {selectedEscrowJob.replacedCandidateNames && selectedEscrowJob.replacedCandidateNames.length > 0 && (
                          <EscrowDetailBox $bg="#FEF2F2" $borderColor="#FCA5A5" $valueColor="#EF4444">
                            <div className="detail-label">
                              <Users size={14} /> {language === 'vi' ? 'Ứng viên bị thay thế' : 'Replaced Candidate(s)'}
                            </div>
                            <div className="detail-value" style={{ fontSize: 13, color: '#EF4444', textDecoration: 'line-through' }}>
                              {selectedEscrowJob.replacedCandidateNames.map((name, idx) => (
                                <div key={idx} style={{ marginTop: idx > 0 ? '4px' : '0' }}>👤 {name}</div>
                              ))}
                            </div>
                          </EscrowDetailBox>
                        )}
                        <EscrowDetailBox>
                          <div className="detail-label"><Clock size={14} /> {language === 'vi' ? 'Số giờ làm' : 'Working Hours'}</div>
                          <div className="detail-value">{selectedEscrowJob.totalHours}h</div>
                        </EscrowDetailBox>
                        <EscrowDetailBox $bg="#F0FDF4" $borderColor="#6EE7B7" $valueColor="#059669">
                          <div className="detail-label"><DollarSign size={14} /> {language === 'vi' ? 'Lương ứng viên nhận' : 'Candidate Receives'}</div>
                          <div className="detail-value">{formatEscrowCurrency(Math.round(selectedEscrowJob.amount * 0.85))}</div>
                        </EscrowDetailBox>
                      </EscrowDetailGrid>

                      {selectedEscrowJob.status === 'released' && selectedEscrowJob.releasedAt && (
                        <EscrowDetailGrid style={{ gridTemplateColumns: '1fr' }}>
                          <EscrowDetailBox $bg="#F0FDF4" $borderColor="#6EE7B7" $valueColor="#059669">
                            <div className="detail-label"><CheckCircle size={14} /> {language === 'vi' ? 'Ngày giải ngân' : 'Released Date'}</div>
                            <div className="detail-value" style={{ fontSize: 15 }}>{formatEscrowDate(selectedEscrowJob.releasedAt)}</div>
                          </EscrowDetailBox>
                        </EscrowDetailGrid>
                      )}

                      <div style={{ fontSize: 13, fontWeight: 700, color: 'inherit', marginBottom: 10 }}>
                        {language === 'vi' ? 'Xác nhận hoàn thành' : 'Completion Confirmation'}
                      </div>
                      <EscrowConfirmRow>
                        <EscrowConfirmCard $confirmed={selectedEscrowJob.employerConfirmed}>
                          <div className="confirm-icon">
                            {selectedEscrowJob.employerConfirmed ? <CheckCircle /> : <Clock />}
                          </div>
                          <div className="confirm-info">
                            <div className="confirm-role">{language === 'vi' ? 'Nhà tuyển dụng' : 'Employer'}</div>
                            <div className="confirm-status">
                              {selectedEscrowJob.employerConfirmed
                                ? (language === 'vi' ? 'Đã xác nhận' : 'Confirmed')
                                : (language === 'vi' ? 'Chưa xác nhận' : 'Pending')
                              }
                            </div>
                          </div>
                        </EscrowConfirmCard>
                        <EscrowConfirmCard $confirmed={selectedEscrowJob.candidateConfirmed}>
                          <div className="confirm-icon">
                            {selectedEscrowJob.candidateConfirmed ? <CheckCircle /> : <Clock />}
                          </div>
                          <div className="confirm-info">
                            <div className="confirm-role">{language === 'vi' ? 'Ứng viên' : 'Candidate'}</div>
                            <div className="confirm-status">
                              {selectedEscrowJob.candidateConfirmed
                                ? (language === 'vi' ? 'Đã xác nhận' : 'Confirmed')
                                : (language === 'vi' ? 'Chưa xác nhận' : 'Pending')
                              }
                            </div>
                          </div>
                        </EscrowConfirmCard>
                      </EscrowConfirmRow>

                      <EscrowFlowDiagram>
                        <div className="flow-title">
                          <TrendingUp /> {language === 'vi' ? 'Phân bổ dòng tiền' : 'Fund Distribution'}
                        </div>
                        <EscrowFlowRow>
                          <span className="flow-label"><DollarSign /> {language === 'vi' ? 'Tổng tiền' : 'Total'}</span>
                          <span className="flow-value">{formatEscrowCurrency(selectedEscrowJob.amount)}</span>
                        </EscrowFlowRow>
                        <EscrowFlowRow color="#059669">
                          <span className="flow-label"><Users /> {language === 'vi' ? 'Ứng viên (85%)' : 'Candidate (85%)'}</span>
                          <span className="flow-value">{formatEscrowCurrency(Math.round(selectedEscrowJob.amount * 0.85))}</span>
                        </EscrowFlowRow>
                        <EscrowFlowRow color="#7C3AED">
                          <span className="flow-label"><ShieldCheck /> {language === 'vi' ? 'Nền tảng (15%)' : 'Platform (15%)'}</span>
                          <span className="flow-value">{formatEscrowCurrency(selectedEscrowJob.amount - Math.round(selectedEscrowJob.amount * 0.85))}</span>
                        </EscrowFlowRow>
                      </EscrowFlowDiagram>
                    </EscrowModalBody>
                  </EscrowModalContent>
                </EscrowModalOverlay>
              )}
            </AnimatePresence>
          </>
        )}
      </WalletContainer>

      <UnderDevelopmentModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
      />
    </DashboardLayout>
  );
};

export default AdminWallet;
