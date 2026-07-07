import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Receipt,
  DollarSign,
  Calendar,
  Filter,
  Clock,
  BarChart3,
  FileText,
  Plus,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react';
import { Button, Input, FormGroup, Label } from '../../components/FormElements';
import quickJobService from '../../services/quickJobService';
import applicationService from '../../services/applicationService';
import candidateProfileService from '../../services/candidateProfileService';
import notificationService from '../../services/notificationService';

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
  grid-template-columns: 1fr;
  gap: 24px;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  
  .empty-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    background: ${props => props.theme.colors.bgDark};
    border-radius: ${props => props.theme.borderRadius.lg};
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      width: 40px;
      height: 40px;
      color: ${props => props.theme.colors.textLight};
    }
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
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
  max-width: 500px;
  width: 100%;
  padding: 32px;
  box-shadow: ${props => props.theme.shadows.lg};
  border: 2px solid ${props => props.theme.colors.border};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h3 {
    font-size: 20px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }
  
  button {
    background: transparent;
    border: none;
    cursor: pointer;
    color: ${props => props.theme.colors.textLight};
    &:hover { color: ${props => props.theme.colors.text}; }
  }
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 2px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.bgLight};
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
  }
`;

const ErrorMsg = styled.p`
  color: ${props => props.theme.colors.error};
  font-size: 12px;
  margin-top: 4px;
  font-weight: 500;
`;

const Wallet = () => {
  const { language } = useLanguage();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [candidateProfile, setCandidateProfile] = useState(null);

  // Stats states
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);

  // Withdraw Modal States
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);

      const [profile, apps, realJobs] = await Promise.all([
        candidateProfileService.getMyProfile().catch(() => null),
        applicationService.getMyCandidateApplications().catch(() => []),
        quickJobService.getAllQuickJobs().catch(() => [])
      ]);

      setCandidateProfile(profile);

      // Calculate dynamic income transactions from completed applications in database
      const incomeTransactions = apps
        .filter(app => app.status === 'completed')
        .map(app => {
          const job = realJobs.find(j => String(j.idJob || j.id || j.jobID) === String(app.jobId));
          const totalAmount = job ? (Number(job.totalSalary) || (Number(job.hourlyRate || 0) * Number(job.totalHours || 0)) || 0) : 0;
          const candidateAmount = Math.round(totalAmount * 0.85);
          const companyName = job?.companyName || job?.employerName || 'Nhà tuyển dụng';
          const jobTitle = job?.title || 'Công việc tuyển gấp';

          return {
            id: `income-${app.applicationId || app.id}`,
            type: 'income',
            title: language === 'vi' ? `Nhận tiền từ ${companyName}` : `Payment from ${companyName}`,
            description: language === 'vi' ? `Thanh toán cho công việc tuyển gấp: ${jobTitle}` : `Payment for urgent job: ${jobTitle}`,
            amount: candidateAmount,
            date: app.candidateConfirmedAt || app.updatedAt || app.createdAt || new Date().toISOString()
          };
        })
        .filter(t => t.amount > 0);

      // Get withdrawal transactions from database candidate profile
      // Status is authoritative from DB (profile.withdrawals[].status) — no localStorage sync needed
      const savedWithdrawals = profile?.withdrawals || [];
      const withdrawalTransactions = [];

      savedWithdrawals.forEach(w => {
        const currentStatus = w.status || 'pending';

        // Add the main withdrawal transaction (expense)
        withdrawalTransactions.push({
          id: w.id || `withdraw-${w.date}`,
          type: 'expense',
          title: w.title || (language === 'vi' ? 'Rút tiền về ngân hàng' : 'Withdraw to bank'),
          description: w.description || (language === 'vi' ? `Chuyển về tài khoản ${w.bankName} - ${w.accountNumber}` : `Transfer to ${w.bankName} - ${w.accountNumber}`),
          amount: -Math.abs(Number(w.amount || 0)), // Ensure negative
          date: w.date,
          status: currentStatus
        });

        // If the request was rejected, add a corresponding Refund transaction (income) to transaction list
        if (currentStatus === 'rejected') {
          withdrawalTransactions.push({
            id: `refund-${w.id || w.date}`,
            type: 'income',
            title: language === 'vi' ? 'Hoàn tiền rút chi tiêu' : 'Refund of withdrawal',
            description: language === 'vi'
              ? `Hoàn trả giao dịch rút tiền bị từ chối`
              : `Refund for rejected withdrawal request`,
            amount: Math.abs(Number(w.amount || 0)), // Positive refund amount
            date: w.date,
            status: 'approved'
          });
        }
      });

      // Merge and sort
      const mergedTx = [...incomeTransactions, ...withdrawalTransactions];
      mergedTx.sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(mergedTx);

      // Sums calculation - correctly compute available balance by only counting approved/pending withdrawals
      const sumIncome = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const sumWithdrawn = savedWithdrawals
        .filter(w => (w.status || 'pending') !== 'rejected')
        .reduce((sum, w) => sum + Math.abs(Number(w.amount || 0)), 0);

      // Prefer DB walletBalance (credited by backend when employer rates).
      // Fall back to dynamic calculation if field not yet populated.
      const dbBalance = profile?.walletBalance != null ? Number(profile.walletBalance) : null;
      const currentBalance = dbBalance != null
        ? Math.max(0, dbBalance)
        : Math.max(0, sumIncome - sumWithdrawn);

      setBalance(currentBalance);
      setTotalIncome(sumIncome);
      setTotalWithdrawn(sumWithdrawn);
      setTransactionCount(mergedTx.length);

    } catch (err) {
      console.error('Error loading wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, [language]);

  const handleConfirmWithdraw = async () => {
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum <= 0 || amountNum > balance || !withdrawBankName || !withdrawAccountNumber || !withdrawAccountName) {
      alert(language === 'vi' ? 'Thông tin rút tiền không hợp lệ!' : 'Invalid withdrawal details!');
      return;
    }

    try {
      setWithdrawLoading(true);

      const newWithdrawal = {
        id: `WITHDRAW-${Date.now()}`,
        type: 'expense',
        title: language === 'vi' ? 'Rút tiền về ngân hàng' : 'Withdraw to bank',
        description: language === 'vi'
          ? `Chuyển về tài khoản ${withdrawBankName} - ${withdrawAccountNumber}`
          : `Transfer to ${withdrawBankName} - ${withdrawAccountNumber}`,
        amount: -amountNum,
        date: new Date().toISOString(),
        bankName: withdrawBankName,
        accountNumber: withdrawAccountNumber,
        accountName: withdrawAccountName,
        status: 'pending'
      };

      // 1. Save to candidate profile in DynamoDB database
      const existingWithdrawals = candidateProfile?.withdrawals || [];
      const updatedWithdrawals = [newWithdrawal, ...existingWithdrawals];

      // NOTE: walletBalance is managed by backend:
      //   - Credited by application-lambda when employer submits rating
      //   - Debited by candidate-profile-lambda when new withdrawal is added (validated server-side)
      //   - Refunded by admin when rejection happens
      // We send only the updated withdrawals list; backend validates and blocks if balance insufficient.
      await candidateProfileService.updateProfile({
        withdrawals: updatedWithdrawals
      });

      // 2. Send notification to admin
      try {
        await notificationService.createCandidateWithdrawalRequestNotification({
          id: newWithdrawal.id,
          employerId: candidateProfile?.userId || 'candidate-user',
          companyName: candidateProfile?.fullName || 'Ứng viên',
          amount: amountNum,
          bankName: withdrawBankName,
          accountNumber: withdrawAccountNumber,
          accountName: withdrawAccountName
        });
      } catch (notifyErr) {
        console.error('Error sending withdrawal notification to admin:', notifyErr);
      }

      setWithdrawSuccess(true);

      // Reload wallet data
      await loadWalletData();

      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess(false);
        // Reset form
        setWithdrawAmount('');
        setWithdrawBankName('');
        setWithdrawAccountNumber('');
        setWithdrawAccountName('');
      }, 2000);

    } catch (err) {
      console.error('Error processing candidate withdrawal:', err);
      alert(language === 'vi' ? 'Yêu cầu rút tiền thất bại!' : 'Withdrawal request failed!');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleExportTransactions = () => {
    try {
      // 1. Define CSV headers
      const headers = language === 'vi'
        ? ['Mã giao dịch', 'Loại giao dịch', 'Tiêu đề', 'Chi tiết', 'Số tiền (VND)', 'Ngày giao dịch', 'Trạng thái']
        : ['Transaction ID', 'Type', 'Title', 'Description', 'Amount (VND)', 'Date', 'Status'];

      // 2. Format row data
      const rows = transactions.map(tx => {
        const txType = tx.type === 'income'
          ? (language === 'vi' ? 'Thu nhập' : 'Income')
          : (language === 'vi' ? 'Rút tiền / Chi tiêu' : 'Withdrawal / Expense');

        const txStatus = tx.status
          ? (tx.status === 'approved' ? (language === 'vi' ? 'Đã duyệt' : 'Approved')
            : tx.status === 'rejected' ? (language === 'vi' ? 'Từ chối' : 'Rejected')
              : (language === 'vi' ? 'Đang xử lý' : 'Pending'))
          : (language === 'vi' ? 'Thành công' : 'Success');

        const cleanText = (s) => (s || '').replace(/^(Escrow|escrow)\s*[-–]\s*/i, '').replace(/qua SePay/gi, '').replace(/SePay/gi, '').trim();

        return [
          tx.id,
          txType,
          cleanText(tx.title),
          tx.description ? cleanText(tx.description).replace(/,/g, ';') : '',
          tx.amount,
          new Date(tx.date).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US'),
          txStatus
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
      link.setAttribute('download', `opporeview_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting transactions:', err);
      alert(language === 'vi' ? 'Xuất báo cáo thất bại!' : 'Failed to export report!');
    }
  };

  const stats = [
    {
      label: language === 'vi' ? 'Tổng Thu Nhập' : 'Total Income',
      value: totalIncome.toLocaleString('vi-VN') + ' VND',
      icon: TrendingUp,
      color: 'success',
    },
    {
      label: language === 'vi' ? 'Đã Rút' : 'Withdrawn',
      value: totalWithdrawn.toLocaleString('vi-VN') + ' VND',
      icon: TrendingDown,
      color: 'error',
    },
    {
      label: language === 'vi' ? 'Số Lượng Giao Dịch' : 'Transactions',
      value: String(transactionCount),
      icon: BarChart3,
      color: 'primary',
    }
  ];

  const filteredTransactions = transactions.filter(t => {
    // Filter by type
    if (filterType !== 'all' && t.type !== filterType) {
      return false;
    }

    // Filter by date (compare local YYYY-MM-DD date representation)
    if (filterDate) {
      const d = new Date(t.date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${date}`;
      if (localDateStr !== filterDate) {
        return false;
      }
    }

    return true;
  });

  return (
    <DashboardLayout role="candidate" showSearch={false} key={language}>
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
                {language === 'vi' ? 'Ví Điện Tử' : 'E-Wallet'}
              </h1>
            </Header>

            <BalanceCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="balance-header">
                <div className="balance-info">
                  <div className="label">{language === 'vi' ? 'Số Dư Khả Dụng' : 'Available Balance'}</div>
                  <div className="amount-wrapper">
                    <div className="amount">
                      {showBalance ? balance.toLocaleString('vi-VN') + ' VND' : '••••••••'}
                    </div>
                    <button
                      className="toggle-balance"
                      onClick={() => setShowBalance(!showBalance)}
                    >
                      {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
                <WalletIcon className="wallet-icon" />
              </div>
              <div className="balance-actions">
                <ActionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowWithdrawModal(true)}
                >
                  <ArrowUpRight />
                  {language === 'vi' ? 'Rút Tiền' : 'Withdraw'}
                </ActionButton>
              </div>
            </BalanceCard>

            <StatsGrid>
              {stats.map((stat, index) => (
                <StatCard
                  key={index}
                  $color={stat.color}
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
                        {language === 'vi' ? 'Thu Nhập' : 'Income'}
                      </FilterButton>
                      <FilterButton
                        $active={filterType === 'expense'}
                        onClick={() => setFilterType('expense')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {language === 'vi' ? 'Rút tiền' : 'Withdraw'}
                      </FilterButton>
                    </div>
                    <Input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      style={{ width: 'auto', padding: '10px 16px' }}
                    />
                  </FilterBar>

                  <TransactionList>
                    {filteredTransactions.length === 0 ? (
                      <EmptyState>
                        <div className="empty-icon"><Calendar /></div>
                        <h3>{language === 'vi' ? 'Chưa có giao dịch nào' : 'No transactions yet'}</h3>
                        <p>{language === 'vi' ? 'Các giao dịch của bạn sẽ xuất hiện tại đây khi bạn hoàn thành công việc.' : 'Your transactions will appear here once you complete a job.'}</p>
                      </EmptyState>
                    ) : (
                      filteredTransactions.map((transaction, index) => (
                        <TransactionItem
                          key={transaction.id}
                          $type={transaction.type}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="transaction-info">
                            <div className="icon">
                              {transaction.type === 'income' ? <ArrowDownLeft /> : <ArrowUpRight />}
                            </div>
                            <div className="details">
                              <h4>{(transaction.title || '').replace(/^(Escrow|escrow)\s*[-–]\s*/i, '').replace(/qua SePay/gi, '').replace(/SePay/gi, '').trim()}</h4>
                              <p>
                                <Receipt style={{ width: '14px', height: '14px' }} />
                                {(transaction.description || (language === 'vi' ? 'Giao dịch ví' : 'Wallet transaction')).replace(/^(Escrow|escrow)\s*[-–]\s*/i, '').replace(/qua SePay/gi, '').replace(/SePay/gi, '').trim()}
                                {transaction.status && (
                                  <span style={{
                                    marginLeft: '8px',
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    background: transaction.status === 'approved' ? '#D1FAE5' : (transaction.status === 'rejected' ? '#FEE2E2' : '#FEF3C7'),
                                    color: transaction.status === 'approved' ? '#059669' : (transaction.status === 'rejected' ? '#DC2626' : '#D97706'),
                                  }}>
                                    {transaction.status === 'approved'
                                      ? (language === 'vi' ? 'Đã duyệt' : 'Approved')
                                      : (transaction.status === 'rejected'
                                        ? (language === 'vi' ? 'Từ chối' : 'Rejected')
                                        : (language === 'vi' ? 'Đang chờ' : 'Pending'))}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="transaction-amount">
                            <div className="amount">
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('vi-VN')} VND
                            </div>
                            <div className="date">
                              <Calendar />
                              {new Date(transaction.date).toLocaleString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </TransactionItem>
                      ))
                    )}
                  </TransactionList>
                </Card>
              </div>
            </ContentSection>
          </>
        )}
      </WalletContainer>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => !withdrawLoading && setShowWithdrawModal(false)}
        >
          <ModalContent
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <ModalHeader>
              <h3>{language === 'vi' ? 'Yêu cầu Rút tiền' : 'Withdraw Funds'}</h3>
              <button onClick={() => !withdrawLoading && setShowWithdrawModal(false)}>&times;</button>
            </ModalHeader>

            {withdrawSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#059669' }}>
                  <CheckCircle size={32} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', marginBottom: '8px' }}>
                  {language === 'vi' ? 'Gửi yêu cầu thành công!' : 'Request Sent Successfully!'}
                </h4>
                <p style={{ color: '#6B7280', fontSize: '14px' }}>
                  {language === 'vi' ? 'Hệ thống đang gửi yêu cầu rút tiền lên admin phê duyệt.' : 'System is submitting your request to admin for approval.'}
                </p>
              </div>
            ) : (
              <ModalBody>
                <FormGroup>
                  <Label>{language === 'vi' ? 'Chọn Ngân Hàng' : 'Select Bank'}</Label>
                  <Input
                    type="text"
                    placeholder={language === 'vi' ? 'Nhập tên ngân hàng (Ví dụ: Vietcombank, MB Bank...)' : 'Enter bank name (e.g. Vietcombank, MB Bank...)'}
                    value={withdrawBankName}
                    onChange={e => setWithdrawBankName(e.target.value)}
                    disabled={withdrawLoading}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{language === 'vi' ? 'Số Tài Khoản' : 'Account Number'}</Label>
                  <Input
                    type="text"
                    placeholder={language === 'vi' ? 'Nhập số tài khoản thụ hưởng' : 'Enter account number'}
                    value={withdrawAccountNumber}
                    onChange={e => setWithdrawAccountNumber(e.target.value.replace(/\D/g, ''))}
                    disabled={withdrawLoading}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{language === 'vi' ? 'Tên Tài Khoản (viết hoa không dấu)' : 'Account Name (uppercase, no accent)'}</Label>
                  <Input
                    type="text"
                    placeholder="E.g. NGUYEN VAN A"
                    value={withdrawAccountName}
                    onChange={e => setWithdrawAccountName(e.target.value.toUpperCase())}
                    disabled={withdrawLoading}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{language === 'vi' ? 'Số Tiền Rút (VND)' : 'Withdraw Amount (VND)'}</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={language === 'vi' ? 'Nhập số tiền cần rút' : 'Enter amount to withdraw'}
                    // Store raw digits in state, display with thousand separators for readability
                    value={withdrawAmount ? Number(withdrawAmount).toLocaleString('vi-VN') : ''}
                    onChange={e => setWithdrawAmount(e.target.value.replace(/\D/g, ''))}
                    disabled={withdrawLoading}
                  />
                  <span style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                    {language === 'vi' ? `Số dư khả dụng: ${balance.toLocaleString('vi-VN')} VND` : `Available balance: ${balance.toLocaleString('vi-VN')} VND`}
                  </span>
                  {Number(withdrawAmount) > balance && (
                    <ErrorMsg>{language === 'vi' ? 'Số dư không đủ!' : 'Insufficient balance!'}</ErrorMsg>
                  )}
                </FormGroup>

                <Button
                  $variant="primary"
                  style={{ width: '100%', marginTop: '8px' }}
                  onClick={handleConfirmWithdraw}
                  disabled={withdrawLoading || !withdrawBankName || !withdrawAccountNumber || !withdrawAccountName || !withdrawAmount || Number(withdrawAmount) > balance || Number(withdrawAmount) <= 0}
                >
                  {withdrawLoading
                    ? (language === 'vi' ? 'Đang gửi...' : 'Submitting...')
                    : (language === 'vi' ? 'Xác Nhận Rút Tiền' : 'Confirm Withdrawal')}
                </Button>
              </ModalBody>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </DashboardLayout>
  );
};

export default Wallet;
