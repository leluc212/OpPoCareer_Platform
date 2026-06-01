import React, { useState } from 'react';
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
  EyeOff
} from 'lucide-react';
import { Button, Input, FormGroup, Label } from '../../components/FormElements';

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

const Wallet = () => {
  const { language } = useLanguage();
  const [balance] = useState(15750000);
  const [showBalance, setShowBalance] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  const stats = [
    {
      label: language === 'vi' ? 'Tổng Thu Nhập Tháng' : 'Total Income',
      value: '12,300,000 VND',
      icon: TrendingUp,
      color: 'success',
      change: '+15.3%',
      positive: true
    },
    {
      label: language === 'vi' ? 'Đã Rút Trong Tháng' : 'Withdrawn',
      value: '5,000,000 VND',
      icon: TrendingDown,
      color: 'error',
      change: '-8.2%',
      positive: false
    },
    {
      label: language === 'vi' ? 'Số Lượng Giao Dịch' : 'Transactions',
      value: '23',
      icon: BarChart3,
      color: 'primary',
      change: '+12',
      positive: true
    }
  ];

  const transactions = [
    {
      id: 1,
      type: 'income',
      title: language === 'vi' ? 'Nhận tiền từ The Coffee House' : 'Payment from The Coffee House',
      description: language === 'vi' ? 'Thanh toán cho công việc #12345' : 'Payment for job #12345',
      amount: 2500000,
      date: '2026-02-13'
    },
    {
      id: 2,
      type: 'income',
      title: language === 'vi' ? 'Nhận tiền từ Highlands Coffee' : 'Payment from Highlands Coffee',
      description: language === 'vi' ? 'Thanh toán cho công việc #12344' : 'Payment for job #12344',
      amount: 3000000,
      date: '2026-02-10'
    },
    {
      id: 3,
      type: 'expense',
      title: language === 'vi' ? 'Rút tiền về ngân hàng' : 'Withdraw to bank',
      description: language === 'vi' ? 'Chuyển về tài khoản VCB' : 'Transfer to VCB account',
      amount: -5000000,
      date: '2026-02-08'
    },
    {
      id: 4,
      type: 'income',
      title: language === 'vi' ? 'Nhận tiền từ Pizza 4P\'s' : 'Payment from Pizza 4P\'s',
      description: language === 'vi' ? 'Thanh toán cho công việc #12343' : 'Payment for job #12343',
      amount: 1800000,
      date: '2026-02-05'
    },
    {
      id: 5,
      type: 'income',
      title: language === 'vi' ? 'Nhận tiền từ Golden Gate Group' : 'Payment from Golden Gate Group',
      description: language === 'vi' ? 'Thanh toán cho công việc #12342' : 'Payment for job #12342',
      amount: 2200000,
      date: '2026-02-01'
    }
  ];

  const receipts = [
    { id: 1, title: language === 'vi' ? 'Hóa đơn #INV-2026-001' : 'Invoice #INV-2026-001', date: '13/02/2026', amount: '2,500,000 VND' },
    { id: 2, title: language === 'vi' ? 'Hóa đơn #INV-2026-002' : 'Invoice #INV-2026-002', date: '10/02/2026', amount: '3,000,000 VND' },
    { id: 3, title: language === 'vi' ? 'Hóa đơn #INV-2026-003' : 'Invoice #INV-2026-003', date: '05/02/2026', amount: '1,800,000 VND' },
    { id: 4, title: language === 'vi' ? 'Hóa đơn #INV-2026-004' : 'Invoice #INV-2026-004', date: '01/02/2026', amount: '2,200,000 VND' }
  ];

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter(t => t.type === filterType);

  return (
    <DashboardLayout role="candidate" showSearch={false} key={language}>
      <WalletContainer>
        <Header>
          <h1>
            <WalletIcon />
            {language === 'vi' ? 'Ví Điện Tử' : 'E-Wallet'}
          </h1>
          <div className="header-actions">
            <Button
              $variant="secondary"
              $size="small"
              onClick={() => setIsDevModalOpen(true)}
            >
              <Settings style={{ width: '18px', height: '18px' }} />
              {language === 'vi' ? 'Cài Đặt' : 'Settings'}
            </Button>
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
              <div className="last-updated">
                <Clock />
                {language === 'vi' ? 'Cập nhật lần cuối: Hôm nay, 14:30' : 'Last updated: Today, 14:30'}
              </div>
            </div>
            <WalletIcon className="wallet-icon" />
          </div>
          <div className="balance-actions">
            <ActionButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDevModalOpen(true)}
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
                  style={{ width: 'auto', padding: '10px 16px' }}
                />
              </FilterBar>

              <TransactionList>
                {filteredTransactions.map((transaction, index) => (
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
                        <h4>{transaction.title}</h4>
                        <p>
                          <Receipt style={{ width: '14px', height: '14px' }} />
                          {transaction.description}
                        </p>
                      </div>
                    </div>
                    <div className="transaction-amount">
                      <div className="amount">
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('vi-VN')} VND
                      </div>
                      <div className="date">
                        <Calendar />
                        {new Date(transaction.date).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </TransactionItem>
                ))}
              </TransactionList>
            </Card>
          </div>


        </ContentSection>
      </WalletContainer>
    </DashboardLayout>
  );
};

export default Wallet;
