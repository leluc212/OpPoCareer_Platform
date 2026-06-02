import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import quickJobService from '../../services/quickJobService';
import applicationService from '../../services/applicationService';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Percent,
  BarChart3,
  X,
  MapPin,
  Timer
} from 'lucide-react';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  animation: ${fadeIn} 0.5s ease-in;
`;

const PageHeader = styled.div`
  margin-bottom: 28px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
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
  background: #EDE9FE;
  border: 1.5px solid #C4B5FD;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg { width: 24px; height: 24px; color: #7C3AED; }
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

const BalanceCard = styled(motion.div)`
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

const BalanceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
`;

const BalanceInfo = styled.div`
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

const ToggleBtn = styled.button`
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.25); }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const StatCard = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const StatIcon = styled.div`
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

const StatInfo = styled.div`
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

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
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

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TransactionCard = styled(motion.div)`
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

const TxLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
`;

const TxIcon = styled.div`
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

const TxInfo = styled.div`
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

const TxAmounts = styled.div`
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

const StatusBadge = styled.span`
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

// Detail Modal styles
const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: 20px;
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
`;

const ModalHeader = styled.div`
  padding: 24px 28px 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const ModalHeaderLeft = styled.div`
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

const CloseBtn = styled.button`
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

const ModalBody = styled.div`
  padding: 24px 28px;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const DetailBox = styled.div`
  background: ${props => props.bg || '#F9FAFB'};
  border: 1px solid ${props => props.borderColor || props.theme.colors.border};
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
    color: ${props => props.valueColor || props.theme.colors.text};
  }
  .detail-sub {
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
    margin-top: 3px;
  }
`;

const ConfirmRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const ConfirmCard = styled.div`
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

const FlowDiagram = styled.div`
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

const FlowRow = styled.div`
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

const EmptyState = styled.div`
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

const AdminEscrow = () => {
  const { language } = useLanguage();
  const [escrowJobs, setEscrowJobs] = useState([]);
  const [escrowTx, setEscrowTx] = useState([]);
  const [showBalance, setShowBalance] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    // 1. Initial load from localStorage (instant rendering)
    const savedJobs = JSON.parse(localStorage.getItem('escrow_jobs') || '[]');
    const savedTx = JSON.parse(localStorage.getItem('escrow_transactions') || '[]');
    setEscrowJobs(savedJobs);
    setEscrowTx(savedTx);

    // 2. Fetch live data from AWS DynamoDB database and update
    const loadLiveData = async () => {
      try {
        const [realJobs, realApps] = await Promise.all([
          quickJobService.getAllQuickJobs().catch(() => []),
          applicationService.getAllApplications().catch(() => [])
        ]);

        if (realJobs.length > 0) {
          // Map DynamoDB quick jobs to escrow structure
          const dbEscrowJobs = realJobs.map(job => {
            const jobId = job.jobID || job.idJob || job.id;
            const jobApps = realApps.filter(app => String(app.jobId) === String(jobId));
            
            const completedApp = jobApps.find(app => app.status === 'completed');
            const pendingCandidateApp = jobApps.find(app => app.status === 'completed_pending_candidate');
            
            const employerConfirmed = !!completedApp || !!pendingCandidateApp;
            const candidateConfirmed = !!completedApp;
            
            let status = 'held';
            if (job.status === 'deleted') {
              status = 'refunded';
            } else if (completedApp) {
              status = 'released';
            }

            const totalHours = Number(job.totalHours || 0);
            const hourlyRate = Number(job.hourlyRate || 0);
            const amount = Number(job.totalSalary) || (hourlyRate * totalHours) || 0;

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
              hourlyRate: hourlyRate
            };
          }).filter(ej => ej.amount > 0);

          // Map completed jobs to transaction list
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

          // Merge local storage + live database (avoiding duplicates, prioritizing database data)
          const mergedJobsMap = new Map();
          
          // First add local storage jobs
          savedJobs.forEach(job => {
            if (job && job.jobId) {
              mergedJobsMap.set(String(job.jobId), job);
            }
          });
          
          // Then add/overwrite with database jobs, which are ground truth
          dbEscrowJobs.forEach(dbJob => {
            if (dbJob && dbJob.jobId) {
              const key = String(dbJob.jobId);
              if (mergedJobsMap.has(key)) {
                // If it already exists, merge fields; database values override local storage
                const localJob = mergedJobsMap.get(key);
                mergedJobsMap.set(key, {
                  ...localJob,
                  ...dbJob,
                  // Ensure if either version says 'released' (database taking precedence), status resolves to it
                  status: dbJob.status !== 'held' ? dbJob.status : (localJob.status !== 'held' ? localJob.status : 'held')
                });
              } else {
                mergedJobsMap.set(key, dbJob);
              }
            }
          });
          
          const finalJobs = Array.from(mergedJobsMap.values());

          // Merge transaction lists (avoiding duplicates, prioritizing database transactions)
          const mergedTxMap = new Map();
          
          savedTx.forEach(tx => {
            if (tx && (tx.jobId || tx.id)) {
              mergedTxMap.set(String(tx.jobId || tx.id), tx);
            }
          });
          
          dbEscrowTx.forEach(dbTx => {
            if (dbTx && (dbTx.jobId || dbTx.id)) {
              const key = String(dbTx.jobId || dbTx.id);
              if (mergedTxMap.has(key)) {
                const localTx = mergedTxMap.get(key);
                mergedTxMap.set(key, {
                  ...localTx,
                  ...dbTx
                });
              } else {
                mergedTxMap.set(key, dbTx);
              }
            }
          });
          
          const finalTx = Array.from(mergedTxMap.values());

          // Sort chronologically (newest first)
          finalJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          finalTx.sort((a, b) => new Date(b.date) - new Date(a.date));

          setEscrowJobs(finalJobs);
          setEscrowTx(finalTx);
        }
      } catch (err) {
        console.error("❌ Error fetching live escrow data from database:", err);
      }
    };

    loadLiveData();
  }, []);

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

  const filteredJobs = filter === 'all'
    ? escrowJobs
    : escrowJobs.filter(j => j.status === filter);

  const formatCurrency = (amount) => {
    return amount.toLocaleString('vi-VN') + ' VN\u0110';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const stats = [
    {
      icon: <Lock />,
      value: formatCurrency(totalHeld),
      label: language === 'vi' ? 'Ti\u1EC1n \u0111ang gi\u1EEF' : 'Currently Held',
      bg: '#FEF3C7',
      color: '#D97706'
    },
    {
      icon: <Unlock />,
      value: formatCurrency(totalReleased),
      label: language === 'vi' ? 'T\u1ED5ng \u0111\u00E3 gi\u1EA3i ng\u00E2n' : 'Total Released',
      bg: '#D1FAE5',
      color: '#059669'
    },
    {
      icon: <TrendingUp />,
      value: formatCurrency(totalCommission),
      label: language === 'vi' ? 'Hoa h\u1ED3ng (15%)' : 'Commission (15%)',
      bg: '#EDE9FE',
      color: '#7C3AED'
    },
    {
      icon: <BarChart3 />,
      value: `${heldCount} / ${releasedCount}`,
      label: language === 'vi' ? 'Ch\u1EDD / Ho\u00E0n th\u00E0nh' : 'Pending / Done',
      bg: '#EFF6FF',
      color: '#1e40af'
    }
  ];

  const filters = [
    { key: 'all', label: language === 'vi' ? 'T\u1EA5t c\u1EA3' : 'All' },
    { key: 'held', label: language === 'vi' ? '\u0110ang gi\u1EEF' : 'Held' },
    { key: 'released', label: language === 'vi' ? '\u0110\u00E3 gi\u1EA3i ng\u00E2n' : 'Released' },
    { key: 'refunded', label: language === 'vi' ? 'Ho\u00E0n tr\u1EA3' : 'Refunded' }
  ];

  const getStatusIcon = (status) => {
    switch(status) {
      case 'held': return <Lock size={12} />;
      case 'released': return <CheckCircle size={12} />;
      case 'refunded': return <XCircle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const getStatusLabel = (status) => {
    if (language === 'vi') {
      switch(status) {
        case 'held': return '\u0110ang gi\u1EEF';
        case 'released': return '\u0110\u00E3 gi\u1EA3i ng\u00E2n';
        case 'refunded': return 'Ho\u00E0n tr\u1EA3';
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
    <DashboardLayout>
      <PageContainer>
        <PageHeader>
          <PageTitleGroup>
            <PageIconBox>
              <ShieldCheck />
            </PageIconBox>
            <PageTitleText>
              <h1>{language === 'vi' ? 'Qu\u1EA3n L\u00FD Escrow' : 'Escrow Management'}</h1>
              <p>{language === 'vi' ? 'Gi\u00E1m s\u00E1t to\u00E0n b\u1ED9 giao d\u1ECBch escrow tr\u00EAn n\u1EC1n t\u1EA3ng' : 'Monitor all escrow transactions on the platform'}</p>
            </PageTitleText>
          </PageTitleGroup>
        </PageHeader>

        <BalanceCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BalanceHeader>
            <BalanceInfo>
              <div className="label">
                {language === 'vi' ? 'T\u1ED5ng ti\u1EC1n trong Escrow' : 'Total in Escrow'}
              </div>
              <div className="amount">
                {showBalance ? formatCurrency(totalHeld) : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
              </div>
              <div className="sub-info">
                <span>
                  <TrendingUp size={14} />
                  {language === 'vi' ? 'Hoa h\u1ED3ng:' : 'Commission:'} {formatCurrency(totalCommission)}
                </span>
                <span>
                  <Users size={14} />
                  {language === 'vi' ? '\u0110\u00E3 tr\u1EA3 \u1EE8ng vi\u00EAn:' : 'Paid to candidates:'} {formatCurrency(totalCandidatePaid)}
                </span>
              </div>
            </BalanceInfo>
            <ToggleBtn onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
            </ToggleBtn>
          </BalanceHeader>
        </BalanceCard>

        <StatsGrid>
          {stats.map((stat, i) => (
            <StatCard
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <StatIcon bg={stat.bg} color={stat.color}>
                {stat.icon}
              </StatIcon>
              <StatInfo>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </StatInfo>
            </StatCard>
          ))}
        </StatsGrid>

        {/* Recent Releases */}
        {escrowTx.length > 0 && (
          <>
            <SectionTitle>
              <Unlock size={18} />
              {language === 'vi' ? 'Giao d\u1ECBch gi\u1EA3i ng\u00E2n g\u1EA7n \u0111\u00E2y' : 'Recent Releases'}
            </SectionTitle>
            <TransactionList style={{ marginBottom: 32 }}>
              {escrowTx.slice(0, 5).map((tx, i) => {
                const relatedJob = escrowJobs.find(j => j.jobId === tx.jobId);
                return (
                <TransactionCard
                  key={tx.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  onClick={() => relatedJob && setSelectedJob(relatedJob)}
                >
                  <TxLeft>
                    <TxIcon $status="released">
                      <CheckCircle />
                    </TxIcon>
                    <TxInfo>
                      <div className="tx-title">{tx.jobTitle}</div>
                      <div className="tx-id">Job ID: {tx.jobId}</div>
                      <div className="tx-date">{formatDate(tx.date)}</div>
                    </TxInfo>
                  </TxLeft>
                  <TxAmounts>
                    <div className="total">{formatCurrency(tx.totalAmount)}</div>
                    <div className="breakdown">
                      <span className="candidate-share">
                        {language === 'vi' ? 'Ứng viên' : 'Candidate'}: {formatCurrency(tx.candidateAmount)} (85%)
                      </span>
                      <span className="admin-share">
                        {language === 'vi' ? 'Nền tảng' : 'Platform'}: {formatCurrency(tx.adminAmount)} (15%)
                      </span>
                    </div>
                  </TxAmounts>
                </TransactionCard>
                );
              })}
            </TransactionList>
          </>
        )}

        {/* All Escrow Jobs */}
        <SectionTitle>
          <Briefcase size={18} />
          {language === 'vi' ? 'T\u1EA5t c\u1EA3 c\u00F4ng vi\u1EC7c Escrow' : 'All Escrow Jobs'}
        </SectionTitle>

        <FilterRow>
          {filters.map(f => (
            <FilterButton
              key={f.key}
              $active={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </FilterButton>
          ))}
        </FilterRow>

        <TransactionList>
          {filteredJobs.length === 0 ? (
            <EmptyState>
              <div className="icon-wrap"><ShieldCheck /></div>
              <h3>{language === 'vi' ? 'Ch\u01B0a c\u00F3 giao d\u1ECBch escrow' : 'No escrow transactions'}</h3>
              <p>{language === 'vi' ? 'C\u00E1c giao d\u1ECBch escrow s\u1EBD xu\u1EA5t hi\u1EC7n khi nh\u00E0 tuy\u1EC3n d\u1EE5ng \u0111\u0103ng b\u00E0i tuy\u1EC3n g\u1EA5p.' : 'Escrow transactions will appear when employers post urgent jobs.'}</p>
            </EmptyState>
          ) : (
            filteredJobs.map((job, i) => (
              <TransactionCard
                key={job.jobId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => setSelectedJob(job)}
              >
                <TxLeft>
                  <TxIcon $status={job.status}>
                    {job.status === 'released' ? <CheckCircle /> : <Lock />}
                  </TxIcon>
                  <TxInfo>
                    <div className="tx-title">{job.jobTitle}</div>
                    <div className="tx-id">Job ID: {job.jobId} &bull; {language === 'vi' ? 'Nh\u00E0 tuy\u1EC3n d\u1EE5ng' : 'Employer'}: {job.employerConfirmed ? '\u2713' : '\u2717'} &bull; {language === 'vi' ? '\u1EE8ng vi\u00EAn' : 'Candidate'}: {job.candidateConfirmed ? '\u2713' : '\u2717'}</div>
                    <div className="tx-date">{formatDate(job.createdAt)}</div>
                  </TxInfo>
                </TxLeft>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <TxAmounts>
                    <div className="total">{formatCurrency(job.amount)}</div>
                    {job.status === 'released' && (
                      <div className="breakdown">
                        <span className="admin-share">+{formatCurrency(job.amount - Math.round(job.amount * 0.85))} (15%)</span>
                      </div>
                    )}
                  </TxAmounts>
                  <StatusBadge $status={job.status}>
                    {getStatusIcon(job.status)}
                    {getStatusLabel(job.status)}
                  </StatusBadge>
                </div>
              </TransactionCard>
            ))
          )}
        </TransactionList>
      </PageContainer>

      {/* Job Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedJob(null)}
          >
            <ModalContent
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalHeaderLeft>
                  <h2>{selectedJob.jobTitle}</h2>
                  <div className="modal-job-id">Job ID: {selectedJob.jobId}</div>
                </ModalHeaderLeft>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusBadge $status={selectedJob.status}>
                    {getStatusIcon(selectedJob.status)}
                    {getStatusLabel(selectedJob.status)}
                  </StatusBadge>
                  <CloseBtn onClick={() => setSelectedJob(null)}>
                    <X />
                  </CloseBtn>
                </div>
              </ModalHeader>

              <ModalBody>
                <DetailGrid>
                  <DetailBox bg="#FEF3C7" borderColor="#FCD34D" valueColor="#D97706">
                    <div className="detail-label"><Lock size={14} /> {language === 'vi' ? 'S\u1ED1 ti\u1EC1n escrow' : 'Escrow Amount'}</div>
                    <div className="detail-value">{formatCurrency(selectedJob.amount)}</div>
                  </DetailBox>
                  <DetailBox>
                    <div className="detail-label"><Calendar size={14} /> {language === 'vi' ? 'Ng\u00E0y \u0111\u0103ng' : 'Posted Date'}</div>
                    <div className="detail-value" style={{ fontSize: 15 }}>{formatDate(selectedJob.createdAt)}</div>
                  </DetailBox>
                  <DetailBox>
                    <div className="detail-label"><Clock size={14} /> {language === 'vi' ? 'S\u1ED1 gi\u1EDD l\u00E0m' : 'Working Hours'}</div>
                    <div className="detail-value">{selectedJob.totalHours}h</div>
                  </DetailBox>
                  <DetailBox bg="#F0FDF4" borderColor="#6EE7B7" valueColor="#059669">
                    <div className="detail-label"><DollarSign size={14} /> {language === 'vi' ? 'L\u01B0\u01A1ng \u1EE9ng vi\u00EAn nh\u1EADn' : 'Candidate Receives'}</div>
                    <div className="detail-value">{formatCurrency(Math.round(selectedJob.amount * 0.85))}</div>
                  </DetailBox>
                </DetailGrid>

                {selectedJob.status === 'released' && selectedJob.releasedAt && (
                  <DetailGrid style={{ gridTemplateColumns: '1fr' }}>
                    <DetailBox bg="#F0FDF4" borderColor="#6EE7B7" valueColor="#059669">
                      <div className="detail-label"><CheckCircle size={14} /> {language === 'vi' ? 'Ng\u00E0y gi\u1EA3i ng\u00E2n' : 'Released Date'}</div>
                      <div className="detail-value" style={{ fontSize: 15 }}>{formatDate(selectedJob.releasedAt)}</div>
                    </DetailBox>
                  </DetailGrid>
                )}

                <div style={{ fontSize: 13, fontWeight: 700, color: 'inherit', marginBottom: 10 }}>
                  {language === 'vi' ? 'X\u00E1c nh\u1EADn ho\u00E0n th\u00E0nh' : 'Completion Confirmation'}
                </div>
                <ConfirmRow>
                  <ConfirmCard $confirmed={selectedJob.employerConfirmed}>
                    <div className="confirm-icon">
                      {selectedJob.employerConfirmed ? <CheckCircle /> : <Clock />}
                    </div>
                    <div className="confirm-info">
                      <div className="confirm-role">{language === 'vi' ? 'Nh\u00E0 tuy\u1EC3n d\u1EE5ng' : 'Employer'}</div>
                      <div className="confirm-status">
                        {selectedJob.employerConfirmed
                          ? (language === 'vi' ? '\u0110\u00E3 x\u00E1c nh\u1EADn' : 'Confirmed')
                          : (language === 'vi' ? 'Ch\u01B0a x\u00E1c nh\u1EADn' : 'Pending')
                        }
                      </div>
                    </div>
                  </ConfirmCard>
                  <ConfirmCard $confirmed={selectedJob.candidateConfirmed}>
                    <div className="confirm-icon">
                      {selectedJob.candidateConfirmed ? <CheckCircle /> : <Clock />}
                    </div>
                    <div className="confirm-info">
                      <div className="confirm-role">{language === 'vi' ? '\u1EE8ng vi\u00EAn' : 'Candidate'}</div>
                      <div className="confirm-status">
                        {selectedJob.candidateConfirmed
                          ? (language === 'vi' ? '\u0110\u00E3 x\u00E1c nh\u1EADn' : 'Confirmed')
                          : (language === 'vi' ? 'Ch\u01B0a x\u00E1c nh\u1EADn' : 'Pending')
                        }
                      </div>
                    </div>
                  </ConfirmCard>
                </ConfirmRow>

                <FlowDiagram>
                  <div className="flow-title">
                    <TrendingUp /> {language === 'vi' ? 'Ph\u00E2n b\u1ED5 d\u00F2ng ti\u1EC1n' : 'Fund Distribution'}
                  </div>
                  <FlowRow>
                    <span className="flow-label"><DollarSign /> {language === 'vi' ? 'T\u1ED5ng escrow' : 'Total Escrow'}</span>
                    <span className="flow-value">{formatCurrency(selectedJob.amount)}</span>
                  </FlowRow>
                  <FlowRow color="#059669">
                    <span className="flow-label"><Users /> {language === 'vi' ? '\u1EE8ng vi\u00EAn (85%)' : 'Candidate (85%)'}</span>
                    <span className="flow-value">{formatCurrency(Math.round(selectedJob.amount * 0.85))}</span>
                  </FlowRow>
                  <FlowRow color="#7C3AED">
                    <span className="flow-label"><ShieldCheck /> {language === 'vi' ? 'N\u1EC1n t\u1EA3ng (15%)' : 'Platform (15%)'}</span>
                    <span className="flow-value">{formatCurrency(selectedJob.amount - Math.round(selectedJob.amount * 0.85))}</span>
                  </FlowRow>
                </FlowDiagram>
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default AdminEscrow;
