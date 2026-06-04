import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import { Button, Input } from '../../components/FormElements';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import employerProfileService from '../../services/employerProfileService';
import { getWallet, withdrawWallet } from '../../services/packageCatalogService';
import { createWithdrawalRequestNotification } from '../../services/notificationService';
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  Download,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  DollarSign,
  Calendar,
  Plus,
  Users,
  Eye,
  EyeOff,
  X,
  CheckCircle,
  Zap,
  Banknote,
  Send,
  AlertCircle,
  Clock,
  BarChart3,
  FileText,
  Copy,
  Check
} from 'lucide-react';

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
    margin-bottom: 32px;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
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
      'success': props.theme.colors.success,
      'error': props.theme.colors.error,
      'warning': props.theme.colors.warning,
      'primary': props.theme.colors.primary
    };
    return colorMap[props.$color] || props.theme.colors.primary;
  }};
  
  &:hover {
    border-color: ${props => {
    const colorMap = {
      'success': props.theme.colors.success,
      'error': props.theme.colors.error,
      'warning': props.theme.colors.warning,
      'primary': props.theme.colors.primary
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
      'success': props.theme.colors.successBg,
      'error': props.theme.colors.errorBg,
      'warning': props.theme.colors.warningBg,
      'primary': props.theme.colors.primary + '15'
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
      'success': props.theme.colors.success,
      'error': props.theme.colors.error,
      'warning': props.theme.colors.warning,
      'primary': props.theme.colors.primary
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
        font-size: 24px;
        font-weight: 800;
        color: ${props => props.theme.colors.text};
        letter-spacing: -0.5px;
      }
    }
  }
`;

const ContentSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  
  .filter-group {
    display: flex;
    gap: 8px;
    flex: 1;
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
  
  h3 {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 24px;
    color: ${props => props.theme.colors.text};
    display: flex;
    align-items: center;
    gap: 12px;
    
    svg {
      width: 22px;
      height: 22px;
      color: ${props => props.theme.colors.primary};
    }
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
        font-size: 16px;
        font-weight: 700;
        color: ${props => props.theme.colors.text};
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      p {
        font-size: 14px;
        color: ${props => props.theme.colors.textLight};
        display: flex;
        align-items: center;
        gap: 6px;
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
    
    .date {
      font-size: 13px;
      color: ${props => props.theme.colors.textLight};
      display: flex;
      align-items: center;
      gap: 4px;
      justify-content: flex-end;
      
      svg {
        width: 12px;
        height: 12px;
      }
    }
  }
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

// ── Deposit Modal Styled Components ──────────────────────────────────────────

const ModalOverlay = styled(motion.div)`
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

const ModalBox = styled(motion.div)`
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

const ModalHead = styled.div`
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

const ModalHeadIcon = styled.div`
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

const ModalHeadTitle = styled.div`
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

const ModalCloseBtn = styled.button`
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

const ModalBody = styled.div`
  padding: 16px 24px 8px;
  overflow-y: auto;
  flex: 1;
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #94a3b8;
  margin-bottom: 6px;
`;

const QuickAmountsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
`;

const QuickAmountBtn = styled.button`
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

const AmountInputWrapper = styled.div`
  position: relative;
  margin-bottom: 8px;
`;

const CurrencyLabel = styled.div`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  font-weight: 700;
  color: #94a3b8;
  pointer-events: none;
`;

const DepositInput = styled.input`
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

const AmountPreview = styled.div`
  font-size: 12px;
  color: #64748b;
  margin-bottom: 12px;
  min-height: 18px;
  padding-left: 4px;
`;

const ModalFooter = styled.div`
  padding: 12px 24px 20px;
  display: flex;
  gap: 12px;
  flex-shrink: 0;
`;

const CancelBtn = styled.button`
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

const ConfirmBtn = styled(motion.button)`
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

const SuccessState = styled(motion.div)`
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

const LoadingSpinner = styled(motion.div)`
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
`;

// ── Withdraw Modal Extra Components ───────────────────────────────────────────

const WithdrawModalHead = styled(ModalHead)`
  background: linear-gradient(135deg, #b45309 0%, #92400e 100%);
`;

const WithdrawConfirmBtn = styled(ConfirmBtn)`
  background: linear-gradient(135deg, #b45309 0%, #92400e 100%);
  box-shadow: 0 4px 16px rgba(180, 83, 9, 0.35);
  &:not(:disabled):hover { box-shadow: 0 8px 24px rgba(180, 83, 9, 0.5); }
`;

const WithdrawInput = styled.input`
  width: 100%;
  padding: 10px 16px;
  border: 2px solid ${props => props.$invalid ? '#ef4444' : '#e2e8f0'};
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
  background: #ffffff;
  &:focus {
    border-color: #b45309;
    box-shadow: 0 0 0 4px rgba(180, 83, 9, 0.1);
  }
  &::placeholder { color: #cbd5e1; font-weight: 400; }
`;

const WithdrawAmountInput = styled(DepositInput)`
  &:focus {
    border-color: #b45309;
    box-shadow: 0 0 0 4px rgba(180, 83, 9, 0.1);
  }
`;

const WithdrawQuickBtn = styled(QuickAmountBtn)`
  padding: 9px 4px;
  font-size: 12px;
  ${props => props.$selected && `
    border-color: #b45309 !important;
    background: #FEF3C7 !important;
    color: #b45309 !important;
  `}
  &:hover {
    border-color: #b45309;
    background: #FEF3C7;
    color: #b45309;
  }
`;

const BalanceHint = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${props => props.$error ? '#ef4444' : '#64748b'};
  margin-bottom: 12px;
  padding: 6px 10px;
  background: ${props => props.$error ? '#fef2f2' : '#f8fafc'};
  border-radius: 10px;
  border: 1px solid ${props => props.$error ? '#fecaca' : '#e2e8f0'};
  svg { width: 14px; height: 14px; flex-shrink: 0; }
`;

const Divider = styled.div`
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0 16px;
`;

const WithdrawSuccessState = styled(SuccessState)`
  svg { color: #10b981; }
  .amount-text { color: #b45309; }
`;

const QRContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
`;

const QRCodeImage = styled.img`
  width: 220px;
  height: 220px;
  border-radius: 16px;
  border: 4px solid #f1f5f9;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const PaymentDetailsTable = styled.div`
  width: 100%;
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DetailRow = styled.div`
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

const CopyButton = styled.button`
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

const PollingStatus = styled.div`
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

const EmployerWallet = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const employerId = user?.userId || user?.id || user?.email || 'mock_employer_id';

  const [balance, setBalance] = useState(0);
  const [walletCode, setWalletCode] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [companyName, setCompanyName] = useState('N/A');
  const [companyLogo, setCompanyLogo] = useState('');
  const [redirectBackUrl, setRedirectBackUrl] = useState(null);

  // Fetch company profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await employerProfileService.getMyProfile();
        if (profile) {
          setCompanyName(profile.companyName || 'N/A');
          setCompanyLogo(profile.companyLogo || '');
        }
      } catch (err) {
        console.error('Error loading employer profile:', err);
        const savedProfile = localStorage.getItem('employerProfile');
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            setCompanyName(parsed.companyName || 'N/A');
            setCompanyLogo(parsed.companyLogo || '');
          } catch (e) {}
        }
      }
    };
    if (employerId) {
      loadProfile();
    }
  }, [employerId]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Deposit modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositStep, setDepositStep] = useState(1); // 1: Select amount, 2: Show VietQR and polling
  const [depositRawAmount, setDepositRawAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const depositInputRef = useRef(null);

  // Copy to clipboard state
  const [copiedText, setCopiedText] = useState('');

  // Withdraw modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawRawAmount, setWithdrawRawAmount] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const withdrawInputRef = useRef(null);

  const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

  const formatQuickAmount = (n) => {
    if (n >= 1000000) return (n / 1000000) + 'M';
    return (n / 1000) + 'K';
  };

  const parsedDepositAmount = parseInt(depositRawAmount.replace(/\D/g, '') || '0');
  const formattedDepositPreview = parsedDepositAmount > 0
    ? parsedDepositAmount.toLocaleString('vi-VN') + ' VND'
    : '';

  const parsedWithdrawAmount = parseInt(withdrawRawAmount.replace(/\D/g, '') || '0');
  const withdrawExceedsBalance = parsedWithdrawAmount > balance;
  const withdrawFormValid =
    parsedWithdrawAmount > 0 &&
    !withdrawExceedsBalance &&
    withdrawBankName &&
    withdrawAccountNumber &&
    withdrawAccountName;

  const fetchWalletData = async (showLoadingSpinner = true) => {
    if (!employerId) return;
    try {
      if (showLoadingSpinner) setLoading(true);
      const wallet = await getWallet(employerId);
      setBalance(wallet.walletBalance || 0);
      setWalletCode(wallet.walletCode || '');
      // Format transactions to have required attributes
      const txs = (wallet.walletTransactions || []).map((t, idx) => ({
        id: t.transactionId || idx,
        type: t.type,
        amount: Number(t.amount || 0),
        description: t.description || '',
        date: t.timestamp || '',
        paymentDetails: t.paymentDetails || {}
      }));
      setTransactions(txs);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  // Load wallet on mount
  useEffect(() => {
    fetchWalletData();
  }, [employerId]);

  // Handle redirect from post quick job page with pre-entered deposit amount
  useEffect(() => {
    if (location.state && location.state.depositAmount && walletCode) {
      setDepositRawAmount(String(location.state.depositAmount));
      setDepositStep(2);
      setShowDepositModal(true);
      if (location.state.fromPage) {
        setRedirectBackUrl(location.state.fromPage);
      }
      // Clear location state to prevent modal reopening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, walletCode, navigate, location.pathname]);

  // Polling for deposits while deposit modal is open in step 2
  useEffect(() => {
    let intervalId;
    if (showDepositModal && depositStep === 2 && employerId) {
      intervalId = setInterval(async () => {
        try {
          const wallet = await getWallet(employerId);
          const newBal = wallet.walletBalance || 0;
          if (newBal > balance) {
            setBalance(newBal);
            const txs = (wallet.walletTransactions || []).map((t, idx) => ({
              id: t.transactionId || idx,
              type: t.type,
              amount: Number(t.amount || 0),
              description: t.description || '',
              date: t.timestamp || '',
              paymentDetails: t.paymentDetails || {}
            }));
            setTransactions(txs);
            setDepositSuccess(true);
            setDepositRawAmount('');
            clearInterval(intervalId);

            setTimeout(() => {
              setShowDepositModal(false);
              setDepositSuccess(false);
              if (redirectBackUrl) {
                navigate(redirectBackUrl, { replace: true });
              }
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
  }, [showDepositModal, depositStep, employerId, balance, redirectBackUrl, navigate]);

  const receipts = [
    { id: 1, title: language === 'vi' ? 'Hóa đơn #2026021401' : 'Invoice #2026021401', date: '14/02/2026', amount: '2,500,000 VND' },
    { id: 2, title: language === 'vi' ? 'Hóa đơn #2026021201' : 'Invoice #2026021201', date: '12/02/2026', amount: '3,000,000 VND' },
    { id: 3, title: language === 'vi' ? 'Hóa đơn #2026021001' : 'Invoice #2026021001', date: '10/02/2026', amount: '1,800,000 VND' }
  ];

  const formatCurrency = (amount) => {
    const formatted = new Intl.NumberFormat('vi-VN').format(amount);
    return formatted + ' VND';
  };

  const handleDownloadReceipt = (receiptId) => {
    alert(language === 'vi' ? `Tải xuống hóa đơn #${receiptId}` : `Download invoice #${receiptId}`);
  };

  const handleWithdraw = () => {
    setWithdrawRawAmount('');
    setWithdrawBankName('');
    setWithdrawAccountNumber('');
    setWithdrawAccountName('');
    setWithdrawSuccess(false);
    setWithdrawLoading(false);
    setShowWithdrawModal(true);
    setTimeout(() => withdrawInputRef.current?.focus(), 120);
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawFormValid || !employerId) return;
    setWithdrawLoading(true);
    
    // Define the request payload
    const newRequest = {
      id: `WITHDRAW_${Date.now()}`,
      employerId,
      companyName,
      companyLogo,
      amount: parsedWithdrawAmount,
      bankName: withdrawBankName,
      accountNumber: withdrawAccountNumber,
      accountName: withdrawAccountName,
      status: 'pending', // 'pending', 'approved', 'rejected'
      createdAt: new Date().toISOString(),
    };

    try {
      const result = await withdrawWallet(
        employerId,
        parsedWithdrawAmount,
        withdrawBankName,
        withdrawAccountNumber,
        withdrawAccountName,
        companyName,
        companyLogo
      );

      // Save to localStorage so Admin can view it
      const existingRequests = JSON.parse(localStorage.getItem('admin_withdraw_requests') || '[]');
      existingRequests.unshift({
        ...newRequest,
        id: result.requestId || newRequest.id
      });
      localStorage.setItem('admin_withdraw_requests', JSON.stringify(existingRequests));

      setBalance(result.walletBalance || 0);
      const txs = (result.walletTransactions || []).map((t, idx) => ({
        id: t.transactionId || idx,
        type: t.type,
        amount: Number(t.amount || 0),
        description: t.description || '',
        date: t.timestamp || '',
        paymentDetails: t.paymentDetails || {}
      }));
      setTransactions(txs);

      setWithdrawLoading(false);
      setWithdrawSuccess(true);

      // Notify admin about withdrawal request
      try {
        await createWithdrawalRequestNotification({
          employerId,
          companyName,
          amount: parsedWithdrawAmount,
          bankName: withdrawBankName,
          accountNumber: withdrawAccountNumber,
          accountName: withdrawAccountName,
        });
      } catch (notifErr) {
        console.warn('Notification error (withdrawal request):', notifErr.message);
      }

      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess(false);
      }, 2400);
    } catch (error) {
      console.warn('API withdrawal failed, using local simulation fallback:', error);
      
      // Local Storage fallback: Save request anyway so Admin receives it
      const existingRequests = JSON.parse(localStorage.getItem('admin_withdraw_requests') || '[]');
      existingRequests.unshift(newRequest);
      localStorage.setItem('admin_withdraw_requests', JSON.stringify(existingRequests));

      // Locally deduct balance and record a mock transaction
      setBalance(prev => Math.max(0, prev - parsedWithdrawAmount));
      
      const localTx = {
        id: `TX_${Date.now()}`,
        type: 'expense',
        amount: parsedWithdrawAmount,
        description: `Rút tiền về ${withdrawBankName}`,
        date: new Date().toISOString(),
        paymentDetails: { bankName: withdrawBankName, accountNumber: withdrawAccountNumber }
      };
      setTransactions(prev => [localTx, ...prev]);

      // Notify admin even on fallback
      try {
        await createWithdrawalRequestNotification({
          employerId,
          companyName,
          amount: parsedWithdrawAmount,
          bankName: withdrawBankName,
          accountNumber: withdrawAccountNumber,
          accountName: withdrawAccountName,
        });
      } catch (notifErr) {
        console.warn('Notification error (withdrawal request fallback):', notifErr.message);
      }

      setWithdrawLoading(false);
      setWithdrawSuccess(true);

      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess(false);
      }, 2400);
    }
  };

  const handleWithdrawAmountInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setWithdrawRawAmount(raw);
  };

  const handleDeposit = () => {
    setDepositRawAmount('');
    setDepositSuccess(false);
    setDepositLoading(false);
    setDepositStep(1);
    setShowDepositModal(true);
    setTimeout(() => depositInputRef.current?.focus(), 120);
  };

  const handleConfirmDeposit = () => {
    if (parsedDepositAmount <= 0) return;
    setDepositStep(2);
  };

  const handleDepositAmountInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setDepositRawAmount(raw);
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleExportTransactions = () => {
    try {
      // 1. Define CSV headers
      const headers = language === 'vi' 
        ? ['Mã giao dịch', 'Loại giao dịch', 'Chi tiết', 'Số tiền (VND)', 'Ngày giao dịch']
        : ['Transaction ID', 'Type', 'Description', 'Amount (VND)', 'Date'];
        
      // 2. Format row data
      const rows = filteredTransactions.map(tx => {
        const isIncome = tx.type === 'income' || tx.type === 'credit';
        const sign = isIncome ? '+' : '-';
        const formattedAmount = `${sign}${Math.abs(tx.amount)}`;
        
        const txType = isIncome
          ? (language === 'vi' ? 'Nạp tiền / Thu nhập' : 'Deposit / Income')
          : (language === 'vi' ? 'Rút tiền / Chi tiêu' : 'Withdrawal / Expense');
          
        return [
          tx.id,
          txType,
          tx.description ? tx.description.replace(/,/g, ';') : '',
          formattedAmount,
          tx.date ? new Date(tx.date).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : ''
        ];
      });
      
      // 3. Construct CSV Content (with UTF-8 BOM for Excel to display Vietnamese characters correctly)
      const csvContent = "\uFEFF" // UTF-8 BOM
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
        
      // 4. Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `opporeview_employer_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting transactions:', err);
      alert(language === 'vi' ? 'Xuất báo cáo thất bại!' : 'Failed to export report!');
    }
  };
  // Calculate stats
  const totalIncome = transactions
    .filter(t => t.type === 'income' || t.type === 'credit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense' || t.type === 'debit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Filter transactions based on filter type and date
  const filteredTransactions = transactions.filter(t => {
    // Filter by type
    if (filterType === 'income' && !(t.type === 'income' || t.type === 'credit')) return false;
    if (filterType === 'expense' && !(t.type === 'expense' || t.type === 'debit')) return false;
    
    // Filter by date
    if (filterDate) {
      if (!t.date) return false;
      const txDate = new Date(t.date);
      const yyyy = txDate.getFullYear();
      const mm = String(txDate.getMonth() + 1).padStart(2, '0');
      const dd = String(txDate.getDate()).padStart(2, '0');
      const formattedTxDate = `${yyyy}-${mm}-${dd}`;
      
      if (formattedTxDate !== filterDate) return false;
    }
    
    return true;
  });

  return (
    <DashboardLayout role="employer" key={language}>
      <WalletContainer>
        <Header>
          <h1>
            <WalletIcon />
            {language === 'vi' ? 'Ví Điện Tử' : 'E-Wallet'}
          </h1>
        </Header>

        <BalanceCard
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="balance-header">
            <div className="balance-info">
              <div className="label">{language === 'vi' ? 'Số Dư Khả Dụng' : 'Available Balance'}</div>
              <div className="amount-wrapper">
                <div className="amount">
                  {showBalance ? formatCurrency(balance) : '••••••••'}
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
                {language === 'vi' ? 'Cập nhật lần cuối: Hôm nay' : 'Last updated: Today'}
              </div>
            </div>
            <WalletIcon className="wallet-icon" />
          </div>
          <div className="balance-actions">
            <ActionButton
              onClick={handleDeposit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={18} />
              {language === 'vi' ? 'Nạp Tiền' : 'Deposit'}
            </ActionButton>
            <ActionButton
              onClick={handleWithdraw}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowUpRight size={18} />
              {language === 'vi' ? 'Rút Tiền' : 'Withdraw'}
            </ActionButton>

          </div>
        </BalanceCard>

        <StatsGrid>
          <StatCard
            $color="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="stat-left">
              <div className="icon">
                <TrendingUp />
              </div>
              <div className="stat-info">
                <div className="stat-label">{language === 'vi' ? 'Tổng tiền nạp' : 'Total Deposits'}</div>
                <div className="stat-value">{formatCurrency(totalIncome)}</div>
              </div>
            </div>
          </StatCard>

          <StatCard
            $color="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="stat-left">
              <div className="icon">
                <TrendingDown />
              </div>
              <div className="stat-info">
                <div className="stat-label">{language === 'vi' ? 'Đã Rút Trong Tháng' : 'Total Expenses'}</div>
                <div className="stat-value">{formatCurrency(totalExpense)}</div>
              </div>
            </div>
          </StatCard>

          <StatCard
            $color="primary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="stat-left">
              <div className="icon">
                <BarChart3 />
              </div>
              <div className="stat-info">
                <div className="stat-label">{language === 'vi' ? 'Số lượng giao dịch' : 'Transactions'}</div>
                <div className="stat-value">{transactions.length}</div>
              </div>
            </div>
          </StatCard>


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
                    {language === 'vi' ? 'Xuất' : 'Export'}
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
                    {language === 'vi' ? 'Nạp tiền' : 'Deposits'}
                  </FilterButton>
                  <FilterButton
                    $active={filterType === 'expense'}
                    onClick={() => setFilterType('expense')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {language === 'vi' ? 'Rút tiền' : 'Withdrawals'}
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
                {filteredTransactions.map((transaction, index) => (
                  <TransactionItem
                    key={transaction.id}
                    $type={transaction.type === 'debit' ? 'expense' : (transaction.type === 'credit' ? 'income' : transaction.type)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="transaction-info">
                      <div className="icon">
                        {(transaction.type === 'income' || transaction.type === 'credit') ? <ArrowDownLeft /> : <ArrowUpRight />}
                      </div>
                      <div className="details">
                        <h4>{transaction.description || transaction.title}</h4>
                        <p>
                          <Receipt style={{ width: '14px', height: '14px' }} />
                          {transaction.description}
                        </p>
                      </div>
                    </div>
                    <div className="transaction-amount">
                      <div className="amount">
                        {(transaction.type === 'income' || transaction.type === 'credit') ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </div>
                      <div className="date">
                        <Calendar />
                        {transaction.date
                          ? new Date(transaction.date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')
                          : ''}
                      </div>
                    </div>
                  </TransactionItem>
                ))}
              </TransactionList>
            </Card>
          </div>


        </ContentSection>
      </WalletContainer>

      {/* ── Withdraw Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showWithdrawModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget && !withdrawLoading) setShowWithdrawModal(false); }}
          >
            <ModalBox
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            >
              {withdrawSuccess ? (
                <WithdrawSuccessState
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
                  <h3>{language === 'vi' ? 'Yêu cầu rút tiền thành công!' : 'Withdrawal Submitted!'}</h3>
                  <div className="amount-text">
                    -{parsedWithdrawAmount.toLocaleString('vi-VN')} VND
                  </div>
                  <p>{language === 'vi' ? 'Tiền sẽ được chuyển về tài khoản của bạn trong 1–3 ngày làm việc.' : 'Funds will be transferred within 1–3 business days.'}</p>
                </WithdrawSuccessState>
              ) : (
                <>
                  <WithdrawModalHead>
                    <ModalCloseBtn onClick={() => !withdrawLoading && setShowWithdrawModal(false)}>
                      <X />
                    </ModalCloseBtn>
                    <ModalHeadIcon>
                      <Send />
                    </ModalHeadIcon>
                    <ModalHeadTitle>
                      <h2>{language === 'vi' ? 'Rút tiền' : 'Withdraw Funds'}</h2>
                      <p>{language === 'vi' ? 'Chuyển tiền về tài khoản ngân hàng' : 'Transfer funds to your bank account'}</p>
                    </ModalHeadTitle>
                  </WithdrawModalHead>

                  <ModalBody>
                    {/* Amount */}
                    <SectionLabel>{language === 'vi' ? 'Chọn nhanh' : 'Quick select'}</SectionLabel>
                    <QuickAmountsGrid>
                      {QUICK_AMOUNTS.map(amt => (
                        <WithdrawQuickBtn
                          key={amt}
                          $selected={parsedWithdrawAmount === amt}
                          onClick={() => setWithdrawRawAmount(String(amt))}
                        >
                          {formatQuickAmount(amt)}
                        </WithdrawQuickBtn>
                      ))}
                    </QuickAmountsGrid>

                    <SectionLabel>{language === 'vi' ? 'Số tiền rút' : 'Withdraw amount'}</SectionLabel>
                    <AmountInputWrapper>
                      <WithdrawAmountInput
                        ref={withdrawInputRef}
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={withdrawRawAmount ? parseInt(withdrawRawAmount).toLocaleString('vi-VN') : ''}
                        onChange={handleWithdrawAmountInput}
                        $invalid={withdrawRawAmount !== '' && (parsedWithdrawAmount <= 0 || withdrawExceedsBalance)}
                      />
                      <CurrencyLabel>VND</CurrencyLabel>
                    </AmountInputWrapper>

                    <BalanceHint $error={withdrawExceedsBalance}>
                      {withdrawExceedsBalance ? (
                        <><AlertCircle />{language === 'vi' ? 'Vượt số dư khả dụng!' : 'Exceeds available balance!'}</>
                      ) : (
                        <><AlertCircle />{language === 'vi' ? `Số dư khả dụng: ${balance.toLocaleString('vi-VN')} VND` : `Available: ${balance.toLocaleString('vi-VN')} VND`}</>
                      )}
                    </BalanceHint>

                    <SectionLabel>{language === 'vi' ? 'Ngân hàng thụ hưởng' : 'Recipient Bank'}</SectionLabel>
                    <AmountInputWrapper>
                      <WithdrawInput
                        type="text"
                        placeholder={language === 'vi' ? "Ví dụ: Vietcombank, MBBank..." : "e.g. Vietcombank, MBBank..."}
                        value={withdrawBankName}
                        onChange={(e) => setWithdrawBankName(e.target.value)}
                        style={{ marginBottom: '12px' }}
                      />
                    </AmountInputWrapper>

                    <SectionLabel>{language === 'vi' ? 'Số tài khoản' : 'Account Number'}</SectionLabel>
                    <AmountInputWrapper>
                      <WithdrawInput
                        type="text"
                        placeholder={language === 'vi' ? "Nhập số tài khoản" : "Enter account number"}
                        value={withdrawAccountNumber}
                        onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                        style={{ marginBottom: '12px' }}
                      />
                    </AmountInputWrapper>

                    <SectionLabel>{language === 'vi' ? 'Tên chủ tài khoản' : 'Account Holder'}</SectionLabel>
                    <AmountInputWrapper>
                      <WithdrawInput
                        type="text"
                        placeholder={language === 'vi' ? "NHAP TEN KHONG DAU" : "ENTER NAME IN ALL CAPS"}
                        value={withdrawAccountName}
                        onChange={(e) => setWithdrawAccountName(e.target.value.toUpperCase())}
                        style={{ marginBottom: '12px' }}
                      />
                    </AmountInputWrapper>

                  </ModalBody>

                  <ModalFooter>
                    <CancelBtn onClick={() => !withdrawLoading && setShowWithdrawModal(false)}>
                      {language === 'vi' ? 'Hủy' : 'Cancel'}
                    </CancelBtn>
                    <WithdrawConfirmBtn
                      onClick={handleConfirmWithdraw}
                      disabled={withdrawLoading || !withdrawFormValid}
                      whileTap={{ scale: 0.97 }}
                    >
                      {withdrawLoading ? (
                        <LoadingSpinner
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                        />
                      ) : (
                        <>
                          <Send />
                          {language === 'vi' ? 'Xác nhận rút tiền' : 'Confirm Withdrawal'}
                        </>
                      )}
                    </WithdrawConfirmBtn>
                  </ModalFooter>
                </>
              )}
            </ModalBox>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ── Deposit Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDepositModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget && !depositLoading) setShowDepositModal(false); }}
          >
            <ModalBox
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            >
              {depositSuccess ? (
                <SuccessState
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
                </SuccessState>
              ) : (
                <>
                  {/* Header */}
                  <ModalHead>
                    <ModalCloseBtn onClick={() => !depositLoading && setShowDepositModal(false)}>
                      <X />
                    </ModalCloseBtn>
                    <ModalHeadIcon>
                      <Banknote />
                    </ModalHeadIcon>
                    <ModalHeadTitle>
                      <h2>{language === 'vi' ? 'Nạp tiền vào ví' : 'Deposit to Wallet'}</h2>
                      <p>{language === 'vi' ? 'Chọn hoặc nhập số tiền muốn nạp' : 'Select or enter the amount to deposit'}</p>
                    </ModalHeadTitle>
                  </ModalHead>

                  {/* Body */}
                  <ModalBody>
                    {depositStep === 1 ? (
                      <>
                        <SectionLabel>{language === 'vi' ? 'Chọn nhanh' : 'Quick select'}</SectionLabel>
                        <QuickAmountsGrid>
                          {QUICK_AMOUNTS.map(amt => (
                            <QuickAmountBtn
                              key={amt}
                              $selected={parseInt(depositRawAmount.replace(/\D/g, '') || '0') === amt}
                              onClick={() => setDepositRawAmount(String(amt))}
                            >
                              {formatQuickAmount(amt)}
                            </QuickAmountBtn>
                          ))}
                        </QuickAmountsGrid>

                        <SectionLabel>{language === 'vi' ? 'Nhập số tiền' : 'Enter amount'}</SectionLabel>
                        <AmountInputWrapper>
                          <DepositInput
                            ref={depositInputRef}
                            type="text"
                            inputMode="numeric"
                            placeholder={language === 'vi' ? '0' : '0'}
                            value={depositRawAmount ? parseInt(depositRawAmount).toLocaleString('vi-VN') : ''}
                            onChange={handleDepositAmountInput}
                            $invalid={depositRawAmount !== '' && parsedDepositAmount <= 0}
                          />
                          <CurrencyLabel>VND</CurrencyLabel>
                        </AmountInputWrapper>
                        <AmountPreview>
                          {formattedDepositPreview
                            ? `≈ ${formattedDepositPreview}`
                            : (language === 'vi' ? 'Tối thiểu 1.000 VND' : 'Minimum 1,000 VND')}
                        </AmountPreview>
                      </>
                    ) : (
                      <QRContainer>
                        <QRCodeImage
                          src={`https://img.vietqr.io/image/MB-0777799991702-compact.png?amount=${parsedDepositAmount}&addInfo=OPPOWALLET%20${walletCode}&accountName=NGUYEN%20THI%20THUY%20DUNG`}
                          alt="VietQR Transfer Code"
                        />
                        <PollingStatus>
                          <Clock size={16} />
                          {language === 'vi' ? 'Đang chờ giao dịch chuyển khoản...' : 'Waiting for transfer transaction...'}
                        </PollingStatus>
                        <PaymentDetailsTable>
                          <DetailRow>
                            <span className="label">{language === 'vi' ? 'Ngân hàng' : 'Bank'}</span>
                            <span className="value">MBBank</span>
                          </DetailRow>
                          <DetailRow>
                            <span className="label">{language === 'vi' ? 'Số tài khoản' : 'Account No.'}</span>
                            <span className="value">
                              0777799991702
                              <CopyButton onClick={() => handleCopyText('0777799991702', 'account')}>
                                {copiedText === 'account' ? <><Check size={11} /> {language === 'vi' ? 'Đã chép' : 'Copied'}</> : <><Copy size={11} /> {language === 'vi' ? 'Sao chép' : 'Copy'}</>}
                              </CopyButton>
                            </span>
                          </DetailRow>
                          <DetailRow>
                            <span className="label">{language === 'vi' ? 'Tên thụ hưởng' : 'Account Name'}</span>
                            <span className="value">NGUYEN THI THUY DUNG</span>
                          </DetailRow>
                          <DetailRow>
                            <span className="label">{language === 'vi' ? 'Số tiền' : 'Amount'}</span>
                            <span className="value" style={{ color: '#10b981', fontSize: '15px' }}>{formatCurrency(parsedDepositAmount)}</span>
                          </DetailRow>
                          <DetailRow>
                            <span className="label">{language === 'vi' ? 'Nội dung chuyển' : 'Content'}</span>
                            <span className="value" style={{ color: '#1e40af' }}>
                              {`OPPOWALLET ${walletCode}`}
                              <CopyButton onClick={() => handleCopyText(`OPPOWALLET ${walletCode}`, 'content')}>
                                {copiedText === 'content' ? <><Check size={11} /> {language === 'vi' ? 'Đã chép' : 'Copied'}</> : <><Copy size={11} /> {language === 'vi' ? 'Sao chép' : 'Copy'}</>}
                              </CopyButton>
                            </span>
                          </DetailRow>
                        </PaymentDetailsTable>
                      </QRContainer>
                    )}
                  </ModalBody>

                  {/* Footer */}
                  <ModalFooter>
                    {depositStep === 1 ? (
                      <>
                        <CancelBtn onClick={() => !depositLoading && setShowDepositModal(false)}>
                          {language === 'vi' ? 'Huỷ' : 'Cancel'}
                        </CancelBtn>
                        <ConfirmBtn
                          onClick={handleConfirmDeposit}
                          disabled={depositLoading || parsedDepositAmount <= 0}
                          whileTap={{ scale: 0.97 }}
                        >
                          {depositLoading ? (
                            <LoadingSpinner
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                            />
                          ) : (
                            <>
                              <Zap />
                              {language === 'vi' ? 'Tạo mã QR' : 'Generate QR'}
                            </>
                          )}
                        </ConfirmBtn>
                      </>
                    ) : (
                      <>
                        <CancelBtn onClick={() => setDepositStep(1)} style={{ flex: 1 }}>
                          {language === 'vi' ? 'Quay lại' : 'Back'}
                        </CancelBtn>
                        <ConfirmBtn
                          onClick={() => setShowDepositModal(false)}
                          style={{ flex: 1, background: '#64748b', boxShadow: 'none' }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {language === 'vi' ? 'Đóng' : 'Close'}
                        </ConfirmBtn>
                      </>
                    )}
                  </ModalFooter>
                </>
              )}
            </ModalBox>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default EmployerWallet;
