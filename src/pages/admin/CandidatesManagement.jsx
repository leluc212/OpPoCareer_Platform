import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import { useLanguage } from '../../context/LanguageContext';
import {
  Users,
  Search,
  CheckSquare,
  XSquare,
  Calendar,
  TrendingUp,
  Briefcase,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  BadgeCheck,
  AlertCircle,
  Eye,
  Mail,
  Phone
} from 'lucide-react';
import jobPostService from '../../services/jobPostService';
import quickJobService from '../../services/quickJobService';
import candidateProfileService from '../../services/candidateProfileService';
import notificationService from '../../services/notificationService';

const API_URL = import.meta.env.VITE_CANDIDATE_API_URL;

const PageContainer = styled.div`
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
`;

const PageHeader = styled.div`
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  
  @media (max-width: 768px) {
    margin-bottom: 20px;
    flex-direction: column;
  }
  
  > div {
    flex: 1;
  }
  
  h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
    color: ${props => props.theme.colors.text};
    
    @media (max-width: 768px) {
      font-size: 24px;
      margin-bottom: 6px;
    }
  }
  
  p {
    color: ${props => props.theme.colors.textLight};
    font-size: 16px;
    
    @media (max-width: 768px) {
      font-size: 14px;
    }
  }
`;

const ReloadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryDark || '#4338ca'};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const LastUpdated = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  margin-bottom: 16px;
  font-style: italic;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    margin-bottom: 20px;
  }
`;


const FilterSection = styled.div`
  background: ${props => props.theme.colors.bgLight};
  padding: 20px;
  border-radius: ${props => props.theme.borderRadius.lg};
  margin-bottom: 24px;
  border: 2px solid ${props => props.theme.colors.border};
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 16px;
    gap: 12px;
  }
`;

const SearchBox = styled.div`
  flex: 1;
  min-width: 250px;
  position: relative;
  
  @media (max-width: 768px) {
    min-width: 100%;
  }
  
  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${props => props.theme.colors.textLight};
    width: 18px;
    height: 18px;
    
    @media (max-width: 768px) {
      width: 16px;
      height: 16px;
    }
  }
  
  input {
    width: 100%;
    padding: 10px 12px 10px 40px;
    border: 2px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    font-size: 14px;
    background: ${props => props.theme.colors.bgDark};
    color: ${props => props.theme.colors.text};
    transition: all 0.2s;
    
    @media (max-width: 768px) {
      padding: 8px 10px 8px 36px;
      font-size: 13px;
    }
    
    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.primary};
    }
    
    &::placeholder {
      color: ${props => props.theme.colors.textLight};
    }
  }
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
  min-width: 900px;
  
  @media (max-width: 768px) {
    min-width: 700px;
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
    color: ${props => props.theme.colors.text};
    
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



const DateText = styled.span`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
`;











const ChartsSection = styled.div`
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    margin-top: 24px;
  }
`;

const TimeFilterTabs = styled.div`
  display: flex;
  gap: 8px;
`;

const TimeTab = styled.button`
  padding: 8px 16px;
  border: 2px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.bgDark};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  }
`;

const ChartCard = styled.div`
  background: ${props => props.theme.colors.bgLight};
  padding: 24px;
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 2px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.card};
`;

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid ${props => props.theme.colors.border};
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  h3 {
    font-size: 18px;
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
  }
`;

const ChartContainer = styled.div`
  height: 350px;
  position: relative;
`;

const ChartSVG = styled.svg`
  width: 100%;
  height: 100%;
`;

const ChartLegend = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 16px;
  }
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${props => props.theme.colors.text};
  font-weight: 600;
`;

const LegendDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$color};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 20px;
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 2px solid ${props => props.theme.colors.border};
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
`;

const PaginationInfo = styled.div`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const PageButton = styled.button`
  padding: 8px 12px;
  border: 2px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.bgDark};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 40px;
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 13px;
    min-width: 36px;
  }
  
  &:hover:not(:disabled) {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageEllipsis = styled.span`
  color: ${props => props.theme.colors.textLight};
  font-weight: 600;
  padding: 0 4px;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid ${props => props.theme.colors.border};
`;

const Tab = styled.button`
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.textLight};
  background: ${props => props.$active ? props.theme.colors.bgLight : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.bgLight};
  }
`;

const TabBadge = styled.span`
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 6px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CandidateInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CandidateAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.$bgColor || '#e0e7ff'};
  color: ${props => props.$color || '#4338ca'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CandidateDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const CandidateName = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: ${props => props.theme.colors.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CandidateMeta = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const IconButton = styled.button`
  padding: 8px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  background: #e0e7ff;
  color: #4338ca;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ApproveButton = styled.button`
  padding: 6px 16px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  background: #10b981;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const RejectButton = styled(ApproveButton)`
  background: #ef4444;
  &:hover {
    background: #dc2626;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: ${props => props.theme.borderRadius.full};
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

const CandidatesManagement = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState('month'); // month, quarter, year
  const itemsPerPage = 20;

  // State management for data
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiStats, setApiStats] = useState({
    total: 0,
    thisMonth: 0,
    verified: 0,
    responseRate: 0,
    trend: '0%'
  });
  const [apiChartData, setApiChartData] = useState([]);
  const [apiJobChartData, setApiJobChartData] = useState([]);

  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates', 'withdrawals', 'verifications'
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [verifLoading, setVerifLoading] = useState(false);

  const loadWithdrawRequests = () => {
    const dbRequests = [];
    
    // 1. Gather from candidates list (database)
    if (Array.isArray(candidates)) {
      candidates.forEach(candidate => {
        if (Array.isArray(candidate.withdrawals)) {
          candidate.withdrawals.forEach(w => {
            dbRequests.push({
              id: w.id || `withdraw-${w.date}`,
              employerId: candidate.id,
              companyName: candidate.name,
              amount: Math.abs(Number(w.amount || 0)),
              bankName: w.bankName || '',
              accountNumber: w.accountNumber || '',
              accountName: w.accountName || '',
              status: w.status || 'pending',
              createdAt: w.date || new Date().toISOString(),
              isCandidate: true
            });
          });
        }
      });
    }

    // 2. Gather from localStorage as fallback
    try {
      const stored = localStorage.getItem('admin_withdraw_requests');
      if (stored) {
        const allRequests = JSON.parse(stored);
        const localCandidateReqs = allRequests.filter(req => req.isCandidate === true);
        localCandidateReqs.forEach(localReq => {
          if (!dbRequests.some(dbReq => dbReq.id === localReq.id)) {
            dbRequests.push(localReq);
          }
        });
      }
    } catch (e) {
      console.error('Error loading candidate withdraw requests from localStorage:', e);
    }

    dbRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setWithdrawRequests(dbRequests);
  };

  const getCandidateInitials = (name) => {
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

  // ─── Load verification requests ────────────────────────────────────────────
  const loadVerifications = async () => {
    setVerifLoading(true);
    try {
      const all = await candidateProfileService.getAllCandidates();
      const fromServer = all
        .filter(c => c.verificationStatus === 'SUBMITTED' || c.verificationStatus === 'APPROVED' || c.verificationStatus === 'REJECTED')
        .map(c => ({
          id: c.userId || c.id,
          name: c.fullName || c.name || c.email?.split('@')[0] || 'Unknown',
          email: c.email || '',
          phone: c.phone || c.phoneNumber || '',
          avatar: c.avatar || c.profileImage || null,
          verificationStatus: c.verificationStatus,
          verificationSubmittedAt: c.verificationSubmittedAt || c.updatedAt || '',
          verificationNote: c.verificationNote || '',
          kycDone: c.kycCompleted || c.ekycStatus === 'verified' || false,
          profileCompletion: c.profileCompletion || 0,
        }))
        .sort((a, b) => new Date(b.verificationSubmittedAt) - new Date(a.verificationSubmittedAt));

      setVerifications(fromServer);
    } catch (e) {
      console.error('Error loading verifications:', e);
    } finally {
      setVerifLoading(false);
    }
  };

  const handleApproveVerif = async (candidateId) => {
    // Optimistic update trước
    setVerifications(prev => prev.map(v =>
      v.id === candidateId ? { ...v, verificationStatus: 'APPROVED' } : v
    ));
    try {
      await candidateProfileService.approveVerification(candidateId, '');
    } catch (e) {
      // Rollback nếu lỗi
      setVerifications(prev => prev.map(v =>
        v.id === candidateId ? { ...v, verificationStatus: 'REJECTED' } : v
      ));
      alert(language === 'vi' ? 'Lỗi khi duyệt' : 'Error approving');
    }
  };

  const handleRejectVerif = async (candidateId) => {
    // Xóa khỏi list ngay lập tức (giống bên tuyển gấp NTD)
    setVerifications(prev => prev.filter(v => v.id !== candidateId));
    try {
      await candidateProfileService.rejectVerification(candidateId, '');
    } catch (e) {
      // Rollback nếu lỗi - load lại từ server
      loadVerifications();
      alert(language === 'vi' ? 'Lỗi khi từ chối' : 'Error rejecting');
    }
  };
  // ───────────────────────────────────────────────────────────────────────────

  const handleApproveWithdrawal = async (requestId) => {
    try {
      const request = withdrawRequests.find(req => req.id === requestId);
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

      const stored = JSON.parse(localStorage.getItem('admin_withdraw_requests') || '[]');
      const updated = stored.map(req => req.id === requestId ? { ...req, status: 'approved' } : req);
      localStorage.setItem('admin_withdraw_requests', JSON.stringify(updated));

      setWithdrawRequests(prev => 
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

  const handleRejectWithdrawal = async (requestId) => {
    try {
      const request = withdrawRequests.find(req => req.id === requestId);
      if (!request) return;

      const candidateId = request.employerId;

      const profile = await candidateProfileService.getProfile(candidateId);
      if (profile) {
        const existingWithdrawals = profile.withdrawals || [];
        const updatedWithdrawals = existingWithdrawals.map(w => 
          w.id === requestId ? { ...w, status: 'rejected' } : w
        );
        await candidateProfileService.adminUpdateCandidateProfile(candidateId, {
          withdrawals: updatedWithdrawals
        });
      }

      const stored = JSON.parse(localStorage.getItem('admin_withdraw_requests') || '[]');
      const updated = stored.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req);
      localStorage.setItem('admin_withdraw_requests', JSON.stringify(updated));

      setWithdrawRequests(prev => 
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

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('📡 Fetching raw data from DynamoDB for local processing...');

      const [candidateData, standardJobs, quickJobs] = await Promise.all([
        candidateProfileService.getAllCandidates(),
        jobPostService.getAllJobPosts().catch(() => []),
        quickJobService.getAllQuickJobs().catch(() => [])
      ]);

      // Transform and filter candidates for the table
      if (Array.isArray(candidateData)) {
        const transformedData = candidateData
          .filter(item =>
            (item.email && item.email.includes('@')) ||
            (item.fullName && item.fullName.trim() !== '' && item.fullName !== 'Unknown User')
          ) // Filter out junk
          .map((item, index) => ({
            id: item.userId || item.id || `candidate-${index}`,
            name: item.fullName || (item.email ? item.email.split('@')[0] : 'Unknown User'),
            email: item.email || 'No email provided',
            phone: item.phone || 'No phone',
            ekycVerified: item.kycCompleted || item.ekycStatus === 'verified' || false,
            approvalStatus: (item.kycCompleted || item.ekycStatus === 'verified') ? 'approved' : 'pending',
            joined: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Incomplete setup',
            location: item.location || 'Unknown',
            title: item.title || 'Candidate',
            createdAt: item.createdAt, // Keep raw for processing
            withdrawals: item.withdrawals || [] // Keep withdrawals array!
          }));
        setCandidates(transformedData);

        // Compute withdrawals from candidates directly
        const dbRequests = [];
        transformedData.forEach(candidate => {
          if (Array.isArray(candidate.withdrawals)) {
            candidate.withdrawals.forEach(w => {
              dbRequests.push({
                id: w.id || `withdraw-${w.date}`,
                employerId: candidate.id,
                companyName: candidate.name,
                amount: Math.abs(Number(w.amount || 0)),
                bankName: w.bankName || '',
                accountNumber: w.accountNumber || '',
                accountName: w.accountName || '',
                status: w.status || 'pending',
                createdAt: w.date || new Date().toISOString(),
                isCandidate: true
              });
            });
          }
        });

        // Merge from localStorage as fallback
        try {
          const stored = localStorage.getItem('admin_withdraw_requests');
          if (stored) {
            const allRequests = JSON.parse(stored);
            const localCandidateReqs = allRequests.filter(req => req.isCandidate === true);
            localCandidateReqs.forEach(localReq => {
              if (!dbRequests.some(dbReq => dbReq.id === localReq.id)) {
                dbRequests.push(localReq);
              }
            });
          }
        } catch (e) {
          console.error('Error loading candidate withdraw requests from localStorage:', e);
        }

        dbRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setWithdrawRequests(dbRequests);
      }

      setJobs([...standardJobs, ...quickJobs]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'withdrawals') {
      loadWithdrawRequests();
    }
    if (activeTab === 'verifications') {
      loadVerifications();
    }
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const getApprovalStatusText = (status) => {
    if (status === 'approved') return language === 'vi' ? 'Đã duyệt' : 'Approved';
    if (status === 'rejected') return language === 'vi' ? 'Không duyệt' : 'Rejected';
    if (status === 'pending') return language === 'vi' ? 'Chờ duyệt' : 'Pending';
    if (status === 'unseen') return language === 'vi' ? 'Chưa xem' : 'Not Viewed';
    if (status === 'seen') return language === 'vi' ? 'Đã xem' : 'Viewed';
    return status;
  };

  const getApprovalStatusVariant = (status) => {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    if (status === 'seen') return 'info';
    return 'warning';
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredWithdrawRequests = withdrawRequests.filter(req => {
    const matchesSearch = searchTerm === '' || 
      req.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.accountNumber.includes(searchTerm);
    return matchesSearch;
  });

  // Pagination calculations
  const totalPages = activeTab === 'withdrawals'
    ? Math.ceil(filteredWithdrawRequests.length / itemsPerPage)
    : Math.ceil(filteredCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCandidates = filteredCandidates.slice(startIndex, endIndex);
  const currentWithdrawRequests = filteredWithdrawRequests.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Calculate real data from candidates for charts
  const getChartData = () => {
    const now = new Date();
    let data = [];

    if (timeFilter === 'month') {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = `T${date.getMonth() + 1}`;

        // Ensure we only count records that explicitly have a createdAt and match the month
        const candidatesCount = candidates.filter(c => c.createdAt && c.createdAt.startsWith(monthStr)).length;

        const monthJobs = jobs.filter(j => j.createdAt && j.createdAt.startsWith(monthStr));
        const regularJobs = monthJobs.filter(j => j.category !== 'urgent' && j.jobType !== 'urgent').length;
        const urgentJobs = monthJobs.length - regularJobs;

        data.push({
          label: monthLabel,
          count: candidatesCount,
          regularJobs,
          urgentJobs
        });
      }
    } else if (timeFilter === 'quarter') {
      // Last 4 quarters
      for (let i = 3; i >= 0; i--) {
        const quarterStart = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
        const quarterEnd = new Date(now.getFullYear(), now.getMonth() - (i * 3) + 3, 0);
        const quarterLabel = `Q${Math.floor(quarterStart.getMonth() / 3) + 1}`;

        const candidatesCount = candidates.filter(c => {
          const joinDate = new Date(c.createdAt || '');
          return joinDate >= quarterStart && joinDate <= quarterEnd;
        }).length;

        const monthJobs = jobs.filter(j => {
          const jobDate = new Date(j.createdAt || '');
          return jobDate >= quarterStart && jobDate <= quarterEnd;
        });
        const regularJobs = monthJobs.filter(j => j.category !== 'urgent' && j.jobType !== 'urgent').length;
        const urgentJobs = monthJobs.length - regularJobs;

        data.push({
          label: quarterLabel,
          count: candidatesCount,
          regularJobs,
          urgentJobs
        });
      }
    } else { // year
      // Last 3 years
      for (let i = 2; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const yearStr = year.toString();

        const candidatesCount = candidates.filter(c => (c.createdAt || '').startsWith(yearStr)).length;

        const yearJobs = jobs.filter(j => (j.createdAt || '').startsWith(yearStr));
        const regularJobs = yearJobs.filter(j => j.category !== 'urgent' && j.jobType !== 'urgent').length;
        const urgentJobs = yearJobs.length - regularJobs;

        data.push({
          label: yearStr,
          count: candidatesCount,
          regularJobs,
          urgentJobs
        });
      }
    }

    return data;
  };

  const currentChartData = getChartData();

  // Helper function to generate additional stats - from real data
  const getAdditionalStats = () => {
    // Current month stats
    const now = new Date();
    const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const activeThisMonth = candidates.filter(c => (c.createdAt || '').startsWith(thisMonthStr)).length;

    // Previous month for trend (if needed, but for now let's keep it simple)
    const verifiedCandidates = candidates.filter(c => c.ekycVerified).length;
    const responseRate = candidates.length > 0 ? Math.round((verifiedCandidates / candidates.length) * 100) : 0;

    return [
      {
        id: 'active',
        title: language === 'vi' ? 'Ứng Viên Tháng Này' : 'This Month',
        value: activeThisMonth.toString(),
        icon: TrendingUp,
        color: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
      },
      {
        id: 'verified',
        title: language === 'vi' ? 'Đã Xác Thực' : 'Verified',
        value: verifiedCandidates.toString(),
        icon: CheckSquare,
        color: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
      },
      {
        id: 'response',
        title: language === 'vi' ? 'Tỷ Lệ Xác Thực' : 'Verification Rate',
        value: `${responseRate}%`,
        icon: Users,
        color: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
      }
    ];
  };

  // Control which stats to show - easily configurable
  // To add more stats: 
  // 1. Add new stat object to getAdditionalStats()
  // 2. Add the stat ID to enabledStats array
  // 3. Import any new icons needed
  const enabledStats = ['total', 'active']; // Add: 'verified', 'response' for more stats
  const additionalStats = getAdditionalStats();

  return (
    <DashboardLayout role="admin" key={language}>
      <PageContainer>
        <PageHeader>
          <div>
            <h1>{language === 'vi' ? 'Quản Lý Ứng Viên' : 'Candidates Management'}</h1>
            <p>{language === 'vi' ? 'Quản lý thông tin và trạng thái của tất cả ứng viên' : 'Manage information and status of all candidates'}</p>
          </div>
        </PageHeader>

        {lastUpdated && (
          <LastUpdated>
            {language === 'vi' ? 'Cập nhật lần cuối: ' : 'Last updated: '}
            {lastUpdated.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
          </LastUpdated>
        )}

        <StatsGrid>
          {/* Main total stats - always shown */}
          <StatsCard
            title={language === 'vi' ? 'Tổng Ứng Viên' : 'Total Candidates'}
            value={candidates.length.toString()}
            icon={Users}
            color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />

          {/* Additional stats - controlled by enabledStats array */}
          {additionalStats
            .filter(stat => enabledStats.includes(stat.id))
            .map(stat => (
              <StatsCard
                key={stat.id}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            ))
          }
        </StatsGrid>

        <TabsContainer>
          <Tab 
            $active={activeTab === 'candidates'}
            onClick={() => setActiveTab('candidates')}
          >
            <Users size={18} style={{ marginRight: '8px' }} />
            {language === 'vi' ? 'Danh sách ứng viên' : 'Candidates List'}
          </Tab>
          <Tab 
            $active={activeTab === 'withdrawals'}
            onClick={() => setActiveTab('withdrawals')}
          >
            <TrendingUp size={18} style={{ marginRight: '8px' }} />
            {language === 'vi' ? 'Yêu cầu rút tiền' : 'Withdrawal Requests'}
            {withdrawRequests.filter(req => req.status === 'pending').length > 0 && (
              <TabBadge>{withdrawRequests.filter(req => req.status === 'pending').length}</TabBadge>
            )}
          </Tab>
          <Tab
            $active={activeTab === 'verifications'}
            onClick={() => setActiveTab('verifications')}
          >
            <Zap size={18} style={{ marginRight: '8px' }} />
            {language === 'vi' ? 'Duyệt Tuyển Gấp' : 'Quick Job Approvals'}
            {verifications.filter(v => v.verificationStatus === 'SUBMITTED').length > 0 && (
              <TabBadge>{verifications.filter(v => v.verificationStatus === 'SUBMITTED').length}</TabBadge>
            )}
          </Tab>
        </TabsContainer>

        {activeTab === 'candidates' && (
          <ChartsSection>
            <ChartCard>
              <ChartHeader>
                <h3>
                  <TrendingUp />
                  {language === 'vi' ? 'Tăng Trưởng Ứng Viên' : 'Candidate Growth'}
                </h3>
                <TimeFilterTabs>
                  <TimeTab
                    $active={timeFilter === 'month'}
                    onClick={() => setTimeFilter('month')}
                  >
                    {language === 'vi' ? 'Tháng' : 'Month'}
                  </TimeTab>
                  <TimeTab
                    $active={timeFilter === 'quarter'}
                    onClick={() => setTimeFilter('quarter')}
                  >
                    {language === 'vi' ? 'Quý' : 'Quarter'}
                  </TimeTab>
                  <TimeTab
                    $active={timeFilter === 'year'}
                    onClick={() => setTimeFilter('year')}
                  >
                    {language === 'vi' ? 'Năm' : 'Year'}
                  </TimeTab>
                </TimeFilterTabs>
              </ChartHeader>
              <ChartContainer>
                <ChartSVG viewBox="0 0 700 350">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <line
                      key={i}
                      x1="50"
                      y1={50 + i * 50}
                      x2="650"
                      y2={50 + i * 50}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Dynamic polyline based on real data */}
                  <polyline
                    points={currentChartData.map((item, i) => {
                      const x = 100 + (i * (500 / Math.max(currentChartData.length - 1, 1)));
                      const maxCandidates = Math.max(...currentChartData.map(d => d.count), 1);
                      const y = 280 - (item.count / maxCandidates) * 200;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#667eea"
                    strokeWidth="4"
                  />

                  {/* Dynamic points based on real data */}
                  {currentChartData.map((item, i) => {
                    const x = 100 + (i * (500 / Math.max(currentChartData.length - 1, 1)));
                    const maxCandidates = Math.max(...currentChartData.map(d => d.count), 1);
                    const y = 280 - (item.count / maxCandidates) * 200;

                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="6" fill="#667eea" stroke="white" strokeWidth="2" />
                        <text
                          x={x}
                          y="320"
                          textAnchor="middle"
                          fontSize="14"
                          fill="#6b7280"
                          fontWeight="600"
                        >
                          {item.label}
                        </text>
                        <text
                          x={x}
                          y={y - 15}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#667eea"
                          fontWeight="700"
                        >
                          {item.count}
                        </text>
                      </g>
                    );
                  })}
                </ChartSVG>
              </ChartContainer>
              <ChartLegend>
                <LegendItem>
                  <LegendDot $color="#667eea" />
                  {language === 'vi' ? 'Số lượng ứng viên mới' : 'New candidates count'}
                </LegendItem>
              </ChartLegend>
            </ChartCard>

            <ChartCard>
              <ChartHeader>
                <h3>
                  <Briefcase />
                  {language === 'vi' ? 'Tăng Trưởng Công Việc' : 'Job Growth'}
                </h3>
                <TimeFilterTabs>
                  <TimeTab
                    $active={timeFilter === 'month'}
                    onClick={() => setTimeFilter('month')}
                  >
                    {language === 'vi' ? 'Tháng' : 'Month'}
                  </TimeTab>
                  <TimeTab
                    $active={timeFilter === 'quarter'}
                    onClick={() => setTimeFilter('quarter')}
                  >
                    {language === 'vi' ? 'Quý' : 'Quarter'}
                  </TimeTab>
                  <TimeTab
                    $active={timeFilter === 'year'}
                    onClick={() => setTimeFilter('year')}
                  >
                    {language === 'vi' ? 'Năm' : 'Year'}
                  </TimeTab>
                </TimeFilterTabs>
              </ChartHeader>
              <ChartContainer>
                <ChartSVG viewBox="0 0 700 350">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <line
                      key={i}
                      x1="50"
                      y1={50 + i * 50}
                      x2="650"
                      y2={50 + i * 50}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Job thường - Dynamic polyline */}
                  <polyline
                    points={currentChartData.map((item, i) => {
                      const x = 100 + (i * (500 / Math.max(currentChartData.length - 1, 1)));
                      const maxJobs = Math.max(...currentChartData.map(d => Math.max(d.regularJobs, d.urgentJobs)), 1);
                      const y = 280 - (item.regularJobs / maxJobs) * 200;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                  />

                  {/* Công việc Tuyển gấp - Dynamic polyline */}
                  <polyline
                    points={currentChartData.map((item, i) => {
                      const x = 100 + (i * (500 / Math.max(currentChartData.length - 1, 1)));
                      const maxJobs = Math.max(...currentChartData.map(d => Math.max(d.regularJobs, d.urgentJobs)), 1);
                      const y = 280 - (item.urgentJobs / maxJobs) * 200;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                  />

                  {/* Dynamic points for regular jobs */}
                  {currentChartData.map((item, i) => {
                    const x = 100 + (i * (500 / Math.max(currentChartData.length - 1, 1)));
                    const maxJobs = Math.max(...currentChartData.map(d => Math.max(d.regularJobs, d.urgentJobs)), 1);
                    const y = 280 - (item.regularJobs / maxJobs) * 200;

                    return (
                      <g key={`regular-${i}`}>
                        <circle cx={x} cy={y} r="5" fill="#10b981" stroke="white" strokeWidth="2" />
                        <text
                          x={x}
                          y="320"
                          textAnchor="middle"
                          fontSize="14"
                          fill="#6b7280"
                          fontWeight="600"
                        >
                          {item.label}
                        </text>
                        <text
                          x={x}
                          y={y - 15}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#10b981"
                          fontWeight="700"
                        >
                          {item.regularJobs}
                        </text>
                      </g>
                    );
                  })}

                  {/* Dynamic points for urgent jobs */}
                  {currentChartData.map((item, i) => {
                    const x = 100 + (i * (500 / Math.max(currentChartData.length - 1, 1)));
                    const maxJobs = Math.max(...currentChartData.map(d => Math.max(d.regularJobs, d.urgentJobs)), 1);
                    const y = 280 - (item.urgentJobs / maxJobs) * 200;

                    return (
                      <g key={`urgent-${i}`}>
                        <circle cx={x} cy={y} r="5" fill="#f59e0b" stroke="white" strokeWidth="2" />
                        <text
                          x={x}
                          y={y - 15}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#f59e0b"
                          fontWeight="700"
                        >
                          {item.urgentJobs}
                        </text>
                      </g>
                    );
                  })}
                </ChartSVG>
              </ChartContainer>
              <ChartLegend>
                <LegendItem>
                  <LegendDot $color="#10b981" />
                  {language === 'vi' ? 'Job thường' : 'Regular Jobs'}
                </LegendItem>
                <LegendItem>
                  <LegendDot $color="#f59e0b" />
                  {language === 'vi' ? 'Công việc Tuyển gấp' : 'Urgent Jobs'}
                </LegendItem>
              </ChartLegend>
            </ChartCard>
          </ChartsSection>
        )}

        <FilterSection>
          <SearchBox>
            <Search />
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm kiếm theo tên hoặc email...' : 'Search by name or email...'}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </SearchBox>
          <ReloadButton onClick={loadData} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            {loading
              ? (language === 'vi' ? 'Đang tải...' : 'Loading...')
              : (language === 'vi' ? 'Làm mới' : 'Refresh')
            }
          </ReloadButton>
        </FilterSection>

        <TableWrapper>
          {activeTab === 'candidates' ? (
            <Table>
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>{language === 'vi' ? 'STT' : 'No.'}</th>
                  <th>{language === 'vi' ? 'Tên ứng viên' : 'Candidate Name'}</th>
                  <th>{language === 'vi' ? 'Email' : 'Email'}</th>
                  <th>{language === 'vi' ? 'Số điện thoại' : 'Phone Number'}</th>
                  <th>{language === 'vi' ? 'Xác nhận 4 bước eKYC' : 'eKYC 4 Steps Verification'}</th>
                  <th>{language === 'vi' ? 'Ngày tham gia' : 'Join Date'}</th>
                </tr>
              </thead>
              <tbody>
                {currentCandidates.map((candidate, index) => (
                  <tr
                    key={candidate.id}
                    onClick={() => navigate(`/admin/candidates/${candidate.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6b7280' }}>
                      {startIndex + index + 1}
                    </td>
                    <td style={{ fontWeight: 600 }}>{candidate.name}</td>
                    <td>{candidate.email}</td>
                    <td style={{ color: '#64748b' }}>
                      {candidate.phone}
                    </td>
                    <td>
                      <VerificationBadge $verified={candidate.ekycVerified}>
                        {candidate.ekycVerified ? <CheckSquare /> : <XSquare />}
                        {candidate.ekycVerified
                          ? (language === 'vi' ? 'Đã xác thực' : 'Verified')
                          : (language === 'vi' ? 'Chưa xác thực' : 'Not Verified')
                        }
                      </VerificationBadge>
                    </td>
                    <td>
                      <DateText>
                        <Calendar size={14} />
                        {candidate.joined}
                      </DateText>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : activeTab === 'withdrawals' ? (
            <Table>
              <thead>
                <tr>
                  <th>{language === 'vi' ? 'Ứng viên' : 'Candidate'}</th>
                  <th>{language === 'vi' ? 'Số tiền rút' : 'Withdraw Amount'}</th>
                  <th>{language === 'vi' ? 'Thông tin thụ hưởng' : 'Beneficiary Details'}</th>
                  <th>{language === 'vi' ? 'Ngày yêu cầu' : 'Requested Date'}</th>
                  <th>{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                  <th>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {currentWithdrawRequests.map((req, index) => (
                  <tr key={req.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{req.companyName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {req.employerId}</div>
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
                      <StatusBadge $status={req.status}>
                        {req.status === 'approved' && <CheckSquare size={12} />}
                        {req.status === 'pending' && <Clock size={12} />}
                        {req.status === 'rejected' && <XCircle size={12} />}
                        {getApprovalStatusText(req.status)}
                      </StatusBadge>
                    </td>
                    <td>
                      {req.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <ApproveButton onClick={() => handleApproveWithdrawal(req.id)}>
                            <CheckCircle size={16} />
                            {language === 'vi' ? 'Duyệt' : 'Approve'}
                          </ApproveButton>
                          <RejectButton onClick={() => handleRejectWithdrawal(req.id)}>
                            <XCircle size={16} />
                            {language === 'vi' ? 'Từ chối' : 'Reject'}
                          </RejectButton>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                          {language === 'vi' ? 'Đã xử lý' : 'Processed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {currentWithdrawRequests.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                      {language === 'vi' ? 'Không tìm thấy yêu cầu rút tiền nào' : 'No withdrawal requests found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          ) : (
            /* ── Tab: Duyệt Tuyển Gấp ── */
            <Table>
              <thead>
                <tr>
                  <th>{language === 'vi' ? 'Ứng viên' : 'Candidate'}</th>
                  <th>{language === 'vi' ? 'Liên hệ' : 'Contact'}</th>
                  <th>{language === 'vi' ? 'eKYC' : 'eKYC'}</th>
                  <th>{language === 'vi' ? 'Hồ sơ' : 'Profile'}</th>
                  <th>{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                  <th>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {verifLoading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    {language === 'vi' ? 'Đang tải...' : 'Loading...'}
                  </td></tr>
                ) : verifications.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    {language === 'vi' ? 'Không có yêu cầu xác minh nào' : 'No verification requests found'}
                  </td></tr>
                ) : verifications
                    .filter(v => !searchTerm || v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((v, index) => {
                      const colorScheme = getColorScheme(index);
                      const initials = getCandidateInitials(v.name);
                      return (
                  <tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/candidates/${v.id}`)}>
                    <td>
                      <CandidateInfo>
                        <CandidateAvatar $bgColor={colorScheme.bg} $color={colorScheme.color}>
                          {v.avatar ? <img src={v.avatar} alt={v.name} /> : initials}
                        </CandidateAvatar>
                        <CandidateDetails>
                          <CandidateName>{v.name}</CandidateName>
                          <CandidateMeta>ID: {v.id?.slice(0, 16)}...</CandidateMeta>
                        </CandidateDetails>
                      </CandidateInfo>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B' }}>
                          <Mail size={12} />
                          {v.email}
                        </div>
                        {v.phone && v.phone !== 'N/A' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B' }}>
                            <Phone size={12} />
                            {v.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <VerificationBadge $verified={v.kycDone}>
                        {v.kycDone ? <CheckSquare /> : <XSquare />}
                        {v.kycDone ? (language === 'vi' ? 'Đã xác thực' : 'Verified') : (language === 'vi' ? 'Chưa' : 'No')}
                      </VerificationBadge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${v.profileCompletion}%`, background: v.profileCompletion >= 60 ? '#10b981' : '#f59e0b', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: v.profileCompletion >= 60 ? '#10b981' : '#f59e0b' }}>{v.profileCompletion}%</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge $status={v.verificationStatus === 'SUBMITTED' ? 'pending' : v.verificationStatus === 'APPROVED' ? 'approved' : 'rejected'}>
                        {v.verificationStatus === 'SUBMITTED' && <Clock size={12} />}
                        {v.verificationStatus === 'APPROVED' && <CheckCircle size={12} />}
                        {v.verificationStatus === 'REJECTED' && <XCircle size={12} />}
                        {v.verificationStatus === 'SUBMITTED' && (language === 'vi' ? 'Chờ duyệt' : 'Pending')}
                        {v.verificationStatus === 'APPROVED' && (language === 'vi' ? 'Đã duyệt' : 'Approved')}
                        {v.verificationStatus === 'REJECTED' && (language === 'vi' ? 'Từ chối' : 'Rejected')}
                      </StatusBadge>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <ActionButtons>
                        {v.verificationStatus === 'SUBMITTED' && (
                          <>
                            <ApproveButton onClick={() => handleApproveVerif(v.id)}>
                              <CheckCircle size={16} />
                              {language === 'vi' ? 'Duyệt' : 'Approve'}
                            </ApproveButton>
                            <RejectButton onClick={() => handleRejectVerif(v.id)}>
                              <XCircle size={16} />
                              {language === 'vi' ? 'Từ chối' : 'Reject'}
                            </RejectButton>
                          </>
                        )}
                        {v.verificationStatus === 'APPROVED' && (
                          <RejectButton onClick={() => handleRejectVerif(v.id)}>
                            <XCircle size={16} />
                            {language === 'vi' ? 'Hủy kích hoạt' : 'Deactivate'}
                          </RejectButton>
                        )}
                        <IconButton
                          title={language === 'vi' ? 'Xem chi tiết' : 'View details'}
                          onClick={() => navigate(`/admin/candidates/${v.id}`)}
                        >
                          <Eye size={16} />
                        </IconButton>
                      </ActionButtons>
                    </td>
                  </tr>
                      );
                    })}
              </tbody>
            </Table>
          )}
        </TableWrapper>

        <PaginationContainer>
          <PaginationInfo>
            {language === 'vi'
              ? `Đang xem ${startIndex + 1}-${Math.min(endIndex, activeTab === 'withdrawals' ? filteredWithdrawRequests.length : activeTab === 'verifications' ? verifications.length : filteredCandidates.length)} trên ${activeTab === 'withdrawals' ? filteredWithdrawRequests.length : activeTab === 'verifications' ? verifications.length : filteredCandidates.length} kết quả`
              : `Showing ${startIndex + 1}-${Math.min(endIndex, activeTab === 'withdrawals' ? filteredWithdrawRequests.length : activeTab === 'verifications' ? verifications.length : filteredCandidates.length)} of ${activeTab === 'withdrawals' ? filteredWithdrawRequests.length : activeTab === 'verifications' ? verifications.length : filteredCandidates.length} results`
            }
          </PaginationInfo>

          <PaginationButtons>
            <PageButton
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              {language === 'vi' ? '← Trước' : '← Previous'}
            </PageButton>

            {/* First page */}
            {currentPage > 3 && (
              <>
                <PageButton onClick={() => setCurrentPage(1)}>1</PageButton>
                <PageEllipsis>...</PageEllipsis>
              </>
            )}

            {/* Page numbers around current page */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                return page === currentPage ||
                  page === currentPage - 1 ||
                  page === currentPage + 1 ||
                  (page === 1 && currentPage <= 2) ||
                  (page === totalPages && currentPage >= totalPages - 1);
              })
              .map(page => (
                <PageButton
                  key={page}
                  $active={page === currentPage}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PageButton>
              ))
            }

            {/* Last page */}
            {currentPage < totalPages - 2 && (
              <>
                <PageEllipsis>...</PageEllipsis>
                <PageButton onClick={() => setCurrentPage(totalPages)}>{totalPages}</PageButton>
              </>
            )}

            <PageButton
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              {language === 'vi' ? 'Sau →' : 'Next →'}
            </PageButton>
          </PaginationButtons>
        </PaginationContainer>
      </PageContainer>
    </DashboardLayout>
  );
};

export default CandidatesManagement;


