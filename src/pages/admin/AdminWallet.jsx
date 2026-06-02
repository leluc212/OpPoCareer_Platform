import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import { Button, Input } from '../../components/FormElements';
import adminReportService from '../../services/adminReportService';
import quickJobService from '../../services/quickJobService';
import applicationService from '../../services/applicationService';
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
  EyeOff
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
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
  };

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      
      const [subscriptions, realJobs, apps] = await Promise.all([
        adminReportService.getAllSubscriptions().catch(() => []),
        quickJobService.getAllQuickJobs().catch(() => []),
        applicationService.getAllApplications().catch(() => [])
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
            meta: language === 'vi' ? 'Ví Escrow' : 'Escrow Wallet',
            amount: adminCommission,
            date: new Date(app.candidateConfirmedAt || app.updatedAt || app.createdAt || Date.now()).toLocaleDateString('vi-VN'),
            time: new Date(app.candidateConfirmedAt || app.updatedAt || app.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            status: 'completed',
            rawDate: app.candidateConfirmedAt || app.updatedAt || app.createdAt || new Date().toISOString()
          };
        })
        .filter(Boolean);

      // 3. Process Approved Withdrawal Requests from Candidate E-wallet as Expense Transactions
      const adminRequests = JSON.parse(localStorage.getItem('admin_withdraw_requests') || '[]');
      const withdrawalTransactions = adminRequests.map(w => {
        const isApproved = w.status === 'approved';
        const isRejected = w.status === 'rejected';
        
        return {
          id: `withdraw-${w.id}`,
          type: 'expense',
          title: language === 'vi'
            ? `Giải ngân cho ${w.companyName || 'Ứng viên'}`
            : `Payout to ${w.companyName || 'Candidate'}`,
          meta: language === 'vi' ? 'Chuyển khoản ngân hàng' : 'Bank transfer',
          amount: parseFloat(w.amount || 0),
          date: w.date ? new Date(w.date).toLocaleDateString('vi-VN') : '',
          time: w.date ? new Date(w.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '00:00',
          status: isApproved ? 'completed' : (isRejected ? 'failed' : 'pending'),
          rawDate: w.date || new Date().toISOString(),
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

      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(language === 'vi' ? `Hôm nay, ${timeStr}` : `Today, ${timeStr}`);
    } catch (err) {
      console.error('Error loading admin wallet data:', err);
    } finally {
      setIsLoading(false);
    }
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

  const filtered = filterType === 'all'
    ? transactions
    : transactions.filter(t => t.type === filterType);

  const statusLabel = (status) => {
    const map = {
      completed: language === 'vi' ? 'Hoàn thành' : 'Completed',
      pending:   language === 'vi' ? 'Đang xử lý' : 'Pending',
      failed:    language === 'vi' ? 'Thất bại' : 'Failed'
    };
    return map[status] || status;
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
              <div className="header-actions">
                <Button
                  $variant="primary"
                  $size="small"
                  onClick={() => setIsDevModalOpen(true)}
                >
                  <Download style={{ width: '18px', height: '18px' }} />
                  {language === 'vi' ? 'Xuất Báo Cáo' : 'Export Report'}
                </Button>
              </div>
            </Header>

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
                        onClick={() => setIsDevModalOpen(true)}
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
                    <Input
                      type="date"
                      style={{ width: 'auto', padding: '10px 16px' }}
                    />
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
                              <h4>{tx.title}</h4>
                              <p>
                                <CreditCard style={{ width: '14px', height: '14px' }} />
                                {tx.meta}
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
                            onClick={() => setIsDevModalOpen(true)}
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
                      onClick={() => setIsDevModalOpen(true)}
                    >
                      {language === 'vi' ? 'Xem Tất Cả Hóa Đơn' : 'View All Invoices'}
                    </Button>
                  )}
                </Card>
              </div>
            </ContentSection>
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
