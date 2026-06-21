import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import TableFilter from '../../components/TableFilter';
import Modal from '../../components/Modal';
import { useLanguage } from '../../context/LanguageContext';
import jobPostService from '../../services/jobPostService';
import quickJobService from '../../services/quickJobService';
import { Button } from '../../components/FormElements';
import notificationService from '../../services/notificationService';
import adminReportService from '../../services/adminReportService';
import {
  Briefcase,
  Zap,
  Calendar,
  Users,
  FileText,
  Eye,
  CheckCircle,
  Ban,
  Clock,
  BarChart3,
  Mail,
  Phone,
  Building2,
  User
} from 'lucide-react';

const PageContainer = styled.div``;

const PageHeader = styled.div`
  margin-bottom: 32px;
  
  h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  p {
    color: ${props => props.theme.colors.textLight};
    font-size: 16px;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid ${props => props.theme.colors.border};
`;

const Tab = styled.button`
  padding: 12px 24px;
  background: none;
  border: none;
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.textLight};
  font-weight: ${props => props.$active ? '600' : '500'};
  font-size: 15px;
  cursor: pointer;
  border-bottom: 3px solid ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  margin-bottom: -2px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.bgDark};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StatBox = styled.div`
  background: ${props => props.theme.colors.bgLight};
  padding: 20px;
  border-radius: ${props => props.theme.borderRadius.lg};
  border-left: 4px solid ${props => props.$color || props.theme.colors.primary};
  box-shadow: ${props => props.theme.shadows.sm};
  
  h3 {
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    margin-bottom: 8px;
    font-weight: 500;
    text-transform: uppercase;
  }
  
  p {
    font-size: 28px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }
`;

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  margin-bottom: 24px;
  align-items: start;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: ${props => props.theme.colors.bgLight};
  padding: 24px;
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.border};
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BarChartContainer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 250px;
  gap: 12px;
  padding: 20px 0;
`;

const Bar = styled.div`
  flex: 1;
  background: ${props => props.$color};
  border-radius: ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md} 0 0;
  height: ${props => props.$height}%;
  min-height: 20px;
  position: relative;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  
  &:hover {
    opacity: 0.8;
    transform: translateY(-5px);
  }
`;

const BarLabel = styled.div`
  position: absolute;
  bottom: -30px;
  font-size: 12px;
  color: ${props => props.theme.colors.textLight};
  text-align: center;
  width: 100%;
  font-weight: 500;
`;

const BarValue = styled.div`
  position: absolute;
  top: -25px;
  font-size: 14px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const PieChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const PieChartSVG = styled.svg`
  width: 200px;
  height: 200px;
`;

const PieLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: ${props => props.theme.borderRadius.md};
`;

const LegendColor = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: ${props => props.$color};
  margin-right: 8px;
`;

const LegendLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: ${props => props.theme.colors.text};
  flex: 1;
`;

const LegendValue = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const TableWrapper = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.sm};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    padding: 16px;
    background: ${props => props.theme.colors.bgDark};
    font-weight: 600;
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    border-bottom: 2px solid ${props => props.theme.colors.border};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  td {
    padding: 16px;
    border-bottom: 1px solid ${props => props.theme.colors.border};
    font-size: 14px;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const IconButton = styled.button`
  padding: 8px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.$variant === 'danger' ? '#fee2e2' : props.$variant === 'success' ? '#dcfce7' : '#e0e7ff'};
  color: ${props => props.$variant === 'danger' ? '#dc2626' : props.$variant === 'success' ? '#15803d' : '#4338ca'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.disabled ? 0.45 : 1};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
    if (props.$status === 'warning') return '#fef3c7';
    if (props.$status === 'pending') return '#e0e7ff';
    return '#f3f4f6';
  }};
  color: ${props => {
    if (props.$status === 'approved') return '#15803d';
    if (props.$status === 'rejected') return '#dc2626';
    if (props.$status === 'warning') return '#ca8a04';
    if (props.$status === 'pending') return '#4338ca';
    return '#6b7280';
  }};
`;

const DateText = styled.span`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  display: block;
`;

const DetailModal = styled.div`
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
`;

const DetailSection = styled.div`
  margin-bottom: 24px;
  padding: 20px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: ${props => props.theme.borderRadius.lg};
  border-left: 4px solid ${props => props.theme.colors.primary};
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  label {
    display: block;
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
    margin-bottom: 4px;
    font-weight: 600;
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.colors.text};
    font-weight: 500;
  }
`;

const CandidateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CandidateCard = styled.div`
  padding: 16px;
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 12px;
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CandidateInfo = styled.div`
  h4 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
    color: ${props => props.theme.colors.text};
  }
  
  p {
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 2px;
  }
`;

const CandidateDate = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CandidateStatus = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 16px 24px;
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const PaginationInfo = styled.div`
  color: ${props => props.theme.colors.textLight};
  font-size: 14px;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const PageButton = styled.button`
  padding: 8px 12px;
  border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.bgLight};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  font-weight: ${props => props.$active ? '600' : '500'};
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.bgDark};
    border-color: ${props => props.theme.colors.primary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageEllipsis = styled.span`
  padding: 8px 4px;
  color: ${props => props.theme.colors.textLight};
`;

const PostsManagement = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('urgent');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [standardJobs, setStandardJobs] = useState([]);
  const [urgentJobs, setUrgentJobs] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const itemsPerPage = 20;

  const sortJobsForModeration = (jobs) => {
    const statusPriority = {
      pending: 0,
      'ai-approved': 1,
      approved: 2,
      warning: 3,
      rejected: 4
    };

    return [...jobs].sort((a, b) => {
      const aPriority = statusPriority[a.status] ?? 99;
      const bPriority = statusPriority[b.status] ?? 99;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      const aTime = new Date(a.createdAtRaw || a.postDate || 0).getTime();
      const bTime = new Date(b.createdAtRaw || b.postDate || 0).getTime();
      return bTime - aTime;
    });
  };

  const normalizeStatus = (status) => {
    const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';
    if (!normalized) return 'pending';
    if (normalized === 'active') return 'approved';
    if (normalized === 'closed' || normalized === 'deleted' || normalized === 'rejected') return 'rejected';
    if (normalized === 'paused' || normalized === 'warning') return 'warning';
    return normalized;
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDateValue = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' && value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (!Number.isNaN(date.getTime())) return date;
      }
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatSalary = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value;
    return `${numeric.toLocaleString('vi-VN')} VND`;
  };

  const mapStandardJob = (job) => {
    const applications = Number(job.applicants ?? job.views ?? 0);
    const cvSent = Number.isFinite(Number(job.cvSent)) ? Number(job.cvSent) : Math.floor(applications * 0.7);
    const reach = Number(job.views ?? job.reach ?? 0);
    const employerName = job.companyName || job.employerName || job.company || job.employerEmail || job.employerId || 'N/A';

    return {
      id: job.idJob || job.jobID || job.id || job.jobId,
      employerId: job.employerId || job.employer || job.companyId || job.company || job.employerEmail || null,
      title: job.title || '',
      employer: employerName,
      company: employerName,
      employerType: job.companyType || '',
      employerEmail: job.employerEmail || 'N/A',
      employerPhone: job.employerPhone || '',
      createdAtRaw: job.createdAt || job.updatedAt || '',
      postDate: formatDate(job.createdAt) || job.postDate || '',
      endDate: formatDate(job.endDate) || formatDate(job.expiryDate) || '',
      shift: job.workHours || job.shift || '',
      workTime: job.workHours || job.workTime || '',
      workDate: job.workDate || job.workDays || '',
      salary: formatSalary(job.salary) || job.salary || '',
      applications: Number.isNaN(applications) ? 0 : applications,
      cvSent: Number.isNaN(cvSent) ? 0 : cvSent,
      reach: Number.isNaN(reach) ? 0 : reach,
      status: normalizeStatus(job.status),
      aiApproved: job.aiApproved || false,
      location: job.location || '',
      tags: job.tags || [],
      candidates: job.candidates || [],
      description: job.description || '',
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      jobSource: 'standard'
    };
  };

  const mapQuickJob = (job) => {
    const applications = Number(job.applicants ?? job.views ?? 0);
    const cvSent = Number.isFinite(Number(job.cvSent)) ? Number(job.cvSent) : Math.floor(applications * 0.7);
    const reach = Number(job.views ?? job.reach ?? 0);
    const employerName = job.companyName || job.employerName || job.company || job.employerEmail || job.employerId || 'N/A';
    const workTime = job.workHours || (job.startTime && job.endTime ? `${job.startTime} - ${job.endTime}` : job.workTime || '');
    const salaryValue = job.totalSalary ?? job.hourlyRate ?? job.salary;

    return {
      id: job.jobID || job.idJob || job.id || job.jobId,
      employerId: job.employerId || job.employer || job.companyId || job.company || job.employerEmail || null,
      title: job.title || '',
      employer: employerName,
      company: employerName,
      employerType: job.companyType || '',
      employerEmail: job.employerEmail || 'N/A',
      employerPhone: job.employerPhone || '',
      createdAtRaw: job.createdAt || job.updatedAt || '',
      postDate: formatDate(job.createdAt) || job.postDate || '',
      endDate: formatDate(job.endDate) || formatDate(job.expiryDate) || '',
      shift: job.shift || '',
      workTime: workTime,
      workDate: job.workDate || '',
      salary: formatSalary(salaryValue) || salaryValue || '',
      applications: Number.isNaN(applications) ? 0 : applications,
      cvSent: Number.isNaN(cvSent) ? 0 : cvSent,
      reach: Number.isNaN(reach) ? 0 : reach,
      status: normalizeStatus(job.status),
      aiApproved: job.aiApproved || false,
      location: job.location || '',
      tags: job.tags || [],
      candidates: job.candidates || [],
      description: job.description || '',
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      jobSource: 'urgent'
    };
  };

  const refreshPosts = async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const [standardResponse, urgentResponse, subsResponse] = await Promise.all([
        jobPostService.getAllJobPosts ? jobPostService.getAllJobPosts() : jobPostService.getAllActiveJobs(),
        quickJobService.getAllQuickJobs ? quickJobService.getAllQuickJobs() : quickJobService.getAllActiveQuickJobs(),
        adminReportService.getAllSubscriptions().catch(() => [])
      ]);

      const standardList = Array.isArray(standardResponse) ? standardResponse : standardResponse?.data || [];
      const urgentList = Array.isArray(urgentResponse) ? urgentResponse : urgentResponse?.data || [];
      const subsList = Array.isArray(subsResponse) ? subsResponse : [];

      setStandardJobs(sortJobsForModeration(standardList.map(mapStandardJob)));
      setUrgentJobs(sortJobsForModeration(urgentList.map(mapQuickJob)));
      setSubscriptions(subsList);
    } catch (err) {
      setLoadError(err?.message || 'Failed to load posts');
      setStandardJobs([]);
      setUrgentJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshPosts();
  }, [language]);

  // Removed auto-switch-to-urgent behavior to allow viewing Standard Jobs

  const handleModerationAction = async (job, action) => {
    // Deprecated - now use confirm flow
    console.warn('handleModerationAction should not be called directly; use requestModerationAction');
  };

  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmJob, setConfirmJob] = useState(null);
  const [confirmAction, setConfirmAction] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  const requestModerationAction = (job, action) => {
    console.log('🔔 requestModerationAction called', { job, action });
    // Build message by action
    const title = action === 'approve'
      ? (language === 'vi' ? 'Xác nhận duyệt bài' : 'Confirm approve')
      : (language === 'vi' ? 'Xác nhận từ chối bài' : 'Confirm reject');

    const msg = action === 'approve'
      ? (language === 'vi'
        ? 'Bạn có chắc muốn duyệt bài này? Sau khi duyệt, bài sẽ hiển thị cho người tìm việc. Bạn vẫn có thể từ chối/xóa sau này.'
        : 'Are you sure you want to approve this post? It will be visible to candidates. You can still reject/delete later.')
      : (language === 'vi'
        ? 'Bạn có chắc muốn từ chối bài này? Sau khi từ chối, trạng thái sẽ là "Đã từ chối".'
        : 'Are you sure you want to reject this post? It will be marked as rejected.');

    setConfirmJob(job);
    setConfirmAction(action);
    setConfirmMessage(msg);
    setConfirmModalOpen(true);
  };

  const performModerationAction = async () => {
    console.log('🔔 performModerationAction executing', { confirmJob, confirmAction });
    const job = confirmJob;
    const action = confirmAction;
    setConfirmModalOpen(false);
    if (!job) return;

    const jobId = job?.id || job?.jobID || job?.idJob || job?.jobId;
    if (!jobId) return;

    try {
      if (job.jobSource === 'urgent') {
        if (action === 'approve') {
          // Set backend status to 'active' (frontend maps to 'approved')
          await quickJobService.updateJobStatus(jobId, 'active');
          // Notify employer
          try {
            const recipient = job.employerId || job.employerEmail || job.employer || null;
            if (recipient) await notificationService.createJobApprovedNotification(recipient, job);
          } catch (e) {
            console.error('Failed to send approval notification:', e);
          }
        } else {
          // Soft-delete / mark deleted so it shows as rejected
          await quickJobService.updateJobStatus(jobId, 'deleted');
          try {
            const recipient = job.employerId || job.employerEmail || job.employer || null;
            if (recipient) await notificationService.createJobRejectedNotification(recipient, job);
          } catch (e) {
            console.error('Failed to send rejection notification:', e);
          }
        }
      } else {
        if (action === 'approve') {
          await jobPostService.updateJobStatus(jobId, 'active');
          try {
            const recipient = job.employerId || job.employerEmail || job.employer || null;
            if (recipient) await notificationService.createJobApprovedNotification(recipient, job);
          } catch (e) {
            console.error('Failed to send approval notification:', e);
          }
        } else {
          await jobPostService.updateJobStatus(jobId, 'deleted');
          try {
            const recipient = job.employerId || job.employerEmail || job.employer || null;
            if (recipient) await notificationService.createJobRejectedNotification(recipient, job);
          } catch (e) {
            console.error('Failed to send rejection notification:', e);
          }
        }
      }

      await refreshPosts();
    } catch (error) {
      setLoadError(error?.message || 'Failed to update post status');
    }
  };

  const currentJobs = activeTab === 'longterm' ? standardJobs : urgentJobs;

  const getStatusText = (status) => {
    if (status === 'ai-approved') return language === 'vi' ? 'AI Tự động duyệt' : 'AI Auto-approved';
    if (status === 'approved') return language === 'vi' ? 'Đã duyệt' : 'Approved';
    if (status === 'rejected') return language === 'vi' ? 'Đã từ chối' : 'Rejected';
    if (status === 'warning') return language === 'vi' ? 'Bị cảnh báo' : 'Warning';
    if (status === 'pending') return language === 'vi' ? 'Chờ duyệt' : 'Pending';
    return status;
  };

  const filterOptions = [
    { value: 'ai-approved', label: language === 'vi' ? 'AI Tự động duyệt' : 'AI Auto-approved' },
    { value: 'approved', label: language === 'vi' ? 'Đã duyệt' : 'Approved' },
    { value: 'pending', label: language === 'vi' ? 'Chờ duyệt' : 'Pending' },
    { value: 'warning', label: language === 'vi' ? 'Bị cảnh báo' : 'Warning' },
    { value: 'rejected', label: language === 'vi' ? 'Đã từ chối' : 'Rejected' },
  ];

  const filteredJobs = useMemo(() => {
    return currentJobs.filter(job => {
      const matchesSearch = searchTerm === '' ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.employer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilters = filters.length === 0 || filters.includes(job.status);

      return matchesSearch && matchesFilters;
    });
  }, [currentJobs, searchTerm, filters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentJobs_paginated = filteredJobs.slice(startIndex, endIndex);

  // Reset to page 1 when search or filters change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterToggle = (filterValue) => {
    setFilters(prev =>
      prev.includes(filterValue)
        ? prev.filter(f => f !== filterValue)
        : [...prev, filterValue]
    );
    setCurrentPage(1);
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setShowDetailModal(true);
  };

  const getCandidateStatusText = (status) => {
    if (status === 'approved') return language === 'vi' ? 'Đã duyệt' : 'Approved';
    if (status === 'rejected') return language === 'vi' ? 'Đã từ chối' : 'Rejected';
    if (status === 'pending') return language === 'vi' ? 'Chờ duyệt' : 'Pending';
    return status;
  };

  const stats = {
    total: currentJobs.length,
    approved: currentJobs.filter(j => j.status === 'approved').length,
    pending: currentJobs.filter(j => j.status === 'pending').length,
    warning: currentJobs.filter(j => j.status === 'warning').length,
    rejected: currentJobs.filter(j => j.status === 'rejected').length,
  };

  const totalApplications = currentJobs.reduce((sum, job) => sum + job.applications, 0);
  const totalCVSent = currentJobs.reduce((sum, job) => sum + job.cvSent, 0);

  const getJobDate = (job) => parseDateValue(job.createdAtRaw) || parseDateValue(job.postDate) || parseDateValue(job.workDate);

  const buildMonthlyData = (jobs) => {
    const now = new Date();
    const results = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const label = language === 'vi'
        ? `T${month + 1}`
        : date.toLocaleString('en-US', { month: 'short' });

      const periodStart = new Date(year, month, 1);
      const periodEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const periodJobs = jobs.filter((job) => {
        const jobDate = getJobDate(job);
        return jobDate && jobDate >= periodStart && jobDate <= periodEnd;
      });

      const posts = periodJobs.length;
      const reach = periodJobs.reduce((sum, job) => sum + (job.reach || 0), 0);

      results.push({ period: label, posts, reach });
    }
    return results;
  };

  const buildQuarterlyData = (jobs) => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const results = [];

    for (let i = 3; i >= 0; i -= 1) {
      const quarterOffset = currentQuarter - i;
      const yearOffset = Math.floor((quarterOffset - 1) / 4);
      const quarter = ((quarterOffset - 1 + 4) % 4) + 1;
      const year = now.getFullYear() + yearOffset;
      const startMonth = (quarter - 1) * 3;
      const periodStart = new Date(year, startMonth, 1);
      const periodEnd = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);

      const periodJobs = jobs.filter((job) => {
        const jobDate = getJobDate(job);
        return jobDate && jobDate >= periodStart && jobDate <= periodEnd;
      });

      const posts = periodJobs.length;
      const reach = periodJobs.reduce((sum, job) => sum + (job.reach || 0), 0);

      results.push({ period: `Q${quarter}`, posts, reach });
    }

    return results;
  };

  // Dữ liệu biểu đồ theo tháng - Tổng bài đăng và Tổng lượt tiếp cận
  const [chartView, setChartView] = useState('month'); // 'month' or 'quarter'

  const chartData = useMemo(() => {
    if (chartView === 'month') {
      return buildMonthlyData(currentJobs);
    }
    return buildQuarterlyData(currentJobs);
  }, [chartView, currentJobs, language]);

  const maxPosts = Math.max(1, ...chartData.map(d => d.posts));
  const maxReach = Math.max(1, ...chartData.map(d => d.reach));

  // Dữ liệu cho biểu đồ tròn
  const pieData = [
    { label: language === 'vi' ? 'Đã duyệt' : 'Approved', value: stats.approved, color: '#10b981' },
    { label: language === 'vi' ? 'Chờ duyệt' : 'Pending', value: stats.pending, color: '#4338ca' },
    { label: language === 'vi' ? 'Bị cảnh báo' : 'Warning', value: stats.warning, color: '#f59e0b' },
    { label: language === 'vi' ? 'Đã từ chối' : 'Rejected', value: stats.rejected, color: '#ef4444' },
  ];

  const total = pieData.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const pieSlices = pieData.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const x1 = 100 + 80 * Math.cos((Math.PI * startAngle) / 180);
    const y1 = 100 + 80 * Math.sin((Math.PI * startAngle) / 180);
    const x2 = 100 + 80 * Math.cos((Math.PI * (startAngle + angle)) / 180);
    const y2 = 100 + 80 * Math.sin((Math.PI * (startAngle + angle)) / 180);
    const largeArc = angle > 180 ? 1 : 0;

    return {
      ...item,
      path: `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`,
      percentage: percentage.toFixed(1)
    };
  });

  return (
    <DashboardLayout role="admin" key={language}>
      <PageContainer>
        <PageHeader>
          <h1>{language === 'vi' ? 'Quản Lý Bài Đăng' : 'Posts Management'}</h1>
          <p>{language === 'vi' ? 'Quản lý Công việc Tiêu chuẩn và Công việc Tuyển gấp' : 'Manage standard and urgent job posts'}</p>
        </PageHeader>

        <TabContainer>
          <Tab
            $active={activeTab === 'longterm'}
            onClick={() => {
              setActiveTab('longterm');
              setSearchTerm('');
              setFilters([]);
              setCurrentPage(1);
            }}
          >
            <Briefcase />
            {language === 'vi' ? 'Công việc Tiêu chuẩn' : 'Standard Jobs'}
            <span style={{
              marginLeft: '4px',
              padding: '2px 8px',
              background: activeTab === 'longterm' ? '#1e40af' : '#64748b',
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {standardJobs.length}
            </span>
          </Tab>
          <Tab
            $active={activeTab === 'urgent'}
            onClick={() => {
              setActiveTab('urgent');
              setSearchTerm('');
              setFilters([]);
              setCurrentPage(1);
            }}
          >
            <Zap />
            {language === 'vi' ? 'Công việc Tuyển gấp' : 'Urgent Jobs'}
            <span style={{
              marginLeft: '4px',
              padding: '2px 8px',
              background: activeTab === 'urgent' ? '#1e40af' : '#64748b',
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {urgentJobs.length}
            </span>
          </Tab>
        </TabContainer>

        <ChartsContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <StatBox $color="#1e40af">
              <h3>{language === 'vi' ? 'Tổng bài đăng' : 'Total Posts'}</h3>
              <p>{stats.total}</p>
            </StatBox>
            <StatBox $color="#8b5cf6">
              <h3>{language === 'vi' ? 'Tổng ứng tuyển' : 'Total Applications'}</h3>
              <p>{totalApplications}</p>
            </StatBox>
            <StatBox $color="#10b981">
              <h3>{language === 'vi' ? 'Tổng CV đã gửi' : 'Total CV Sent'}</h3>
              <p>{totalCVSent}</p>
            </StatBox>
            <StatBox $color="#4338ca">
              <h3>{language === 'vi' ? 'Bài đăng được duyệt' : 'Approved Posts'}</h3>
              <p>{(stats.approved || 0) + (stats['ai-approved'] || 0)}</p>
            </StatBox>
          </div>

          <ChartCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <ChartTitle>
                <BarChart3 size={20} />
                {language === 'vi' ? 'Thống Kê Bài Đăng & Lượt Tiếp Cận' : 'Posts & Reach Statistics'}
              </ChartTitle>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setChartView('month')}
                  style={{
                    padding: '6px 12px',
                    border: `2px solid ${chartView === 'month' ? '#1e40af' : '#e2e8f0'}`,
                    background: chartView === 'month' ? '#1e40af' : 'white',
                    color: chartView === 'month' ? 'white' : '#64748b',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {language === 'vi' ? 'Theo tháng' : 'Monthly'}
                </button>
                <button
                  onClick={() => setChartView('quarter')}
                  style={{
                    padding: '6px 12px',
                    border: `2px solid ${chartView === 'quarter' ? '#1e40af' : '#e2e8f0'}`,
                    background: chartView === 'quarter' ? '#1e40af' : 'white',
                    color: chartView === 'quarter' ? 'white' : '#64748b',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {language === 'vi' ? 'Theo quý' : 'Quarterly'}
                </button>
              </div>
            </div>

            {/* Chart using SVG for better rendering */}
            <div style={{ height: '320px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 900 320" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                    <stop offset="100%" stopColor="#1e40af" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <line
                    key={i}
                    x1="60"
                    y1={40 + i * 45}
                    x2="860"
                    y2={40 + i * 45}
                    stroke="#f0f0f0"
                    strokeWidth="1"
                  />
                ))}

                {/* Y-axis labels */}
                {chartView === 'month'
                  ? ['7000', '6000', '5000', '4000', '3000', '2000', '1000', '0'].map((val, i) => (
                    <text
                      key={i}
                      x="50"
                      y={40 + i * 32}
                      textAnchor="end"
                      fontSize="11"
                      fill="#9ca3af"
                      fontWeight="500"
                    >
                      {val}
                    </text>
                  ))
                  : ['20000', '15000', '10000', '5000', '0'].map((val, i) => (
                    <text
                      key={i}
                      x="50"
                      y={40 + i * 56}
                      textAnchor="end"
                      fontSize="11"
                      fill="#9ca3af"
                      fontWeight="500"
                    >
                      {val}
                    </text>
                  ))
                }

                {/* Bars */}
                {chartData.map((data, index) => {
                  const barWidth = 35;
                  const groupWidth = 800 / chartData.length;
                  const centerX = 80 + index * groupWidth + groupWidth / 2;
                  const postsHeight = (data.posts / maxPosts) * 200;
                  const reachHeight = (data.reach / maxReach) * 200;

                  return (
                    <g key={index}>
                      {/* Posts bar (blue) */}
                      <rect
                        x={centerX - barWidth - 3}
                        y={265 - postsHeight}
                        width={barWidth}
                        height={postsHeight}
                        fill="url(#blueGradient)"
                        rx="4"
                        opacity="0.9"
                      />

                      {/* Reach bar (green) */}
                      <rect
                        x={centerX + 3}
                        y={265 - reachHeight}
                        width={barWidth}
                        height={reachHeight}
                        fill="url(#greenGradient)"
                        rx="4"
                        opacity="0.9"
                      />

                      {/* Posts value */}
                      <text
                        x={centerX - barWidth / 2 - 3}
                        y={260 - postsHeight - 5}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#1e40af"
                        fontWeight="700"
                      >
                        {data.posts}
                      </text>

                      {/* Reach value */}
                      <text
                        x={centerX + barWidth / 2 + 3}
                        y={260 - reachHeight - 5}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#10b981"
                        fontWeight="700"
                      >
                        {data.reach}
                      </text>

                      {/* Period label */}
                      <text
                        x={centerX}
                        y="290"
                        textAnchor="middle"
                        fontSize="13"
                        fill="#6b7280"
                        fontWeight="600"
                      >
                        {data.period}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '16px',
                  background: 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)',
                  borderRadius: '4px'
                }}></div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                  {language === 'vi' ? 'Tổng bài đăng' : 'Total Posts'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '16px',
                  background: 'linear-gradient(180deg, #34d399 0%, #10b981 100%)',
                  borderRadius: '4px'
                }}></div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                  {language === 'vi' ? 'Tổng lượt tiếp cận' : 'Total Reach'}
                </span>
              </div>
            </div>
          </ChartCard>
        </ChartsContainer>

        {isLoading && (
          <div style={{ marginBottom: '16px', color: '#64748b', fontWeight: 600 }}>
            {language === 'vi' ? 'Đang tải dữ liệu bài đăng...' : 'Loading job posts...'}
          </div>
        )}

        {loadError && (
          <div style={{ marginBottom: '16px', color: '#dc2626', fontWeight: 600 }}>
            {language === 'vi' ? `Không tải được dữ liệu: ${loadError}` : `Failed to load data: ${loadError}`}
          </div>
        )}

        <TableFilter
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          filterOptions={filterOptions}
          activeFilters={filters}
          onFilterToggle={handleFilterToggle}
          searchPlaceholder={language === 'vi' ? 'Tìm kiếm bài đăng...' : 'Search posts...'}
        />

        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <th>{language === 'vi' ? 'Tiêu đề' : 'Title'}</th>
                <th>{language === 'vi' ? 'Nhà tuyển dụng' : 'Employer'}</th>
                <th>{language === 'vi' ? 'Ngày đăng' : 'Post Date'}</th>
                <th>{language === 'vi' ? 'Ngày kết thúc' : 'End Date'}</th>
                <th>{language === 'vi' ? 'Ứng tuyển' : 'Applications'}</th>
                <th>{language === 'vi' ? 'CV đã gửi' : 'CV Sent'}</th>
                <th>{language === 'vi' ? 'Gói hỗ trợ' : 'Support Package'}</th>
                <th>{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {currentJobs_paginated.map((job) => (
                <tr key={job.id || `${job.jobSource}-${job.title}-${job.postDate}-${job.employer}`}>
                  <td style={{ fontWeight: 600 }}>{job.title}</td>
                  <td>{job.employer}</td>
                  <td>
                    <DateText>
                      <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {job.postDate}
                    </DateText>
                  </td>
                  <td>
                    <DateText>
                      <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {job.endDate}
                    </DateText>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} />
                      <strong>{job.applications}</strong>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={14} />
                      <strong>{job.cvSent}</strong>
                    </div>
                  </td>
                  <td>
                    {(() => {
                      const activeSub = subscriptions.find(s =>
                        s.status === 'active' &&
                        (s.employerId === job.employerId || s.companyEmail === job.employerEmail)
                      );
                      return activeSub ? (
                        <span style={{ background: '#ede9fe', color: '#5b21b6', borderRadius: '12px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {activeSub.packageName || (language === 'vi' ? 'Có gói' : 'Active')}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
                      );
                    })()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                      {(() => {
                        const s = job.status;
                        const cfg = s === 'pending'
                          ? { bg: '#fef3c7', color: '#92400e', text: language === 'vi' ? 'Chờ duyệt' : 'Pending' }
                          : s === 'approved' || s === 'ai-approved'
                            ? { bg: '#d1fae5', color: '#065f46', text: language === 'vi' ? 'Đã duyệt' : 'Approved' }
                            : s === 'rejected'
                              ? { bg: '#fee2e2', color: '#991b1b', text: language === 'vi' ? 'Từ chối' : 'Rejected' }
                              : s === 'warning'
                                ? { bg: '#fff7ed', color: '#9a3412', text: language === 'vi' ? 'Cảnh báo' : 'Warning' }
                                : { bg: '#f1f5f9', color: '#475569', text: s };
                        return (
                          <span style={{ background: cfg.bg, color: cfg.color, borderRadius: '12px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {cfg.text}
                          </span>
                        );
                      })()}
                      <ActionButtons>
                        <IconButton
                          type="button"
                          onClick={() => handleViewDetails(job)}
                          title={language === 'vi' ? 'Xem chi tiết' : 'View details'}
                        >
                          <Eye size={16} />
                        </IconButton>
                        <IconButton
                          type="button"
                          $variant="success"
                          title={language === 'vi' ? 'Phê duyệt' : 'Approve'}
                          onClick={() => requestModerationAction(job, 'approve')}
                          disabled={job.status !== 'pending'}
                        >
                          <CheckCircle size={16} />
                        </IconButton>
                        <IconButton
                          type="button"
                          $variant="danger"
                          title={language === 'vi' ? 'Từ chối' : 'Reject'}
                          onClick={() => requestModerationAction(job, 'reject')}
                          disabled={job.status === 'rejected'}
                        >
                          <Ban size={16} />
                        </IconButton>
                      </ActionButtons>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>

        {filteredJobs.length > 0 && (
          <PaginationContainer>
            <PaginationInfo>
              {language === 'vi'
                ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, filteredJobs.length)} trong tổng số ${filteredJobs.length} bài đăng`
                : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredJobs.length)} of ${filteredJobs.length} posts`
              }
            </PaginationInfo>

            <PaginationButtons>
              <PageButton
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                {language === 'vi' ? 'Trước' : 'Previous'}
              </PageButton>

              {(() => {
                const pages = [];

                if (totalPages <= 7) {
                  // Show all pages if 7 or fewer
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(
                      <PageButton
                        key={i}
                        $active={currentPage === i}
                        onClick={() => setCurrentPage(i)}
                      >
                        {i}
                      </PageButton>
                    );
                  }
                } else {
                  // Always show first page
                  pages.push(
                    <PageButton
                      key={1}
                      $active={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                    >
                      1
                    </PageButton>
                  );

                  // Show ellipsis after first page if current page is far from start
                  if (currentPage > 3) {
                    pages.push(<PageEllipsis key="ellipsis-start">...</PageEllipsis>);
                  }

                  // Show pages around current page
                  const startPage = Math.max(2, currentPage - 1);
                  const endPage = Math.min(totalPages - 1, currentPage + 1);

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <PageButton
                        key={i}
                        $active={currentPage === i}
                        onClick={() => setCurrentPage(i)}
                      >
                        {i}
                      </PageButton>
                    );
                  }

                  // Show ellipsis before last page if current page is far from end
                  if (currentPage < totalPages - 2) {
                    pages.push(<PageEllipsis key="ellipsis-end">...</PageEllipsis>);
                  }

                  // Always show last page
                  pages.push(
                    <PageButton
                      key={totalPages}
                      $active={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </PageButton>
                  );
                }

                return pages;
              })()}

              <PageButton
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                {language === 'vi' ? 'Sau' : 'Next'}
              </PageButton>
            </PaginationButtons>
          </PaginationContainer>
        )}

        {showDetailModal && selectedJob && (<>
          <Modal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            title={language === 'vi' ? 'Chi Tiết Bài Đăng' : 'Post Details'}
          >
            <DetailModal>
              <DetailSection>
                <SectionTitle>
                  <Briefcase size={20} />
                  {language === 'vi' ? 'Thông Tin Công Việc' : 'Job Information'}
                </SectionTitle>
                <InfoGrid>
                  <InfoItem style={{ gridColumn: '1 / -1' }}>
                    <label>{language === 'vi' ? 'Vị trí' : 'Position'}</label>
                    <p style={{ fontSize: '16px', fontWeight: '600' }}>{selectedJob.title}</p>
                  </InfoItem>
                  <InfoItem>
                    <label>{language === 'vi' ? 'Công ty' : 'Company'}</label>
                    <p style={{ fontSize: '15px', fontWeight: '600' }}>{selectedJob.company}</p>
                  </InfoItem>
                  <InfoItem>
                    <label>{language === 'vi' ? 'Địa điểm' : 'Location'}</label>
                    <p>{selectedJob.location}</p>
                  </InfoItem>
                  <InfoItem>
                    <label>{language === 'vi' ? 'Mức lương trung bình' : 'Salary'}</label>
                    <p style={{ fontSize: '15px', fontWeight: '600' }}>
                      {selectedJob.salary || (language === 'vi' ? '25.000 VND/giờ' : '25,000 VND/hour')}
                    </p>
                  </InfoItem>
                  <InfoItem>
                    <label>{language === 'vi' ? 'Loại hình' : 'Work Type'}</label>
                    <p>{selectedJob.workType || 'Part-time'}</p>
                  </InfoItem>
                  <InfoItem>
                    <label>{language === 'vi' ? 'Ngày đăng' : 'Post Date'}</label>
                    <p>{selectedJob.postDate}</p>
                  </InfoItem>
                  <InfoItem>
                    <label>{language === 'vi' ? 'Ngày làm' : 'Work Date'}</label>
                    <p>{selectedJob.workDate || (language === 'vi' ? '22/03/2026' : '22/03/2026')}</p>
                  </InfoItem>
                  <InfoItem>
                    <label>{language === 'vi' ? 'Thời gian' : 'Time'}</label>
                    <p>{selectedJob.workTime || '06:00 - 14:00'}</p>
                  </InfoItem>
                  <InfoItem>
                    <label>{language === 'vi' ? 'Số lượng ứng tuyển' : 'Applications'}</label>
                    <p>{selectedJob.applications}</p>
                  </InfoItem>
                  <InfoItem>
                    <label>{language === 'vi' ? 'CV đã gửi' : 'CV Sent'}</label>
                    <p>{selectedJob.cvSent}</p>
                  </InfoItem>
                  <InfoItem>
                    <label>{language === 'vi' ? 'Trạng thái' : 'Status'}</label>
                    <StatusBadge $status={selectedJob.status}>
                      {getStatusText(selectedJob.status)}
                    </StatusBadge>
                  </InfoItem>
                </InfoGrid>
              </DetailSection>

              <DetailSection>
                <SectionTitle>
                  <FileText size={20} />
                  {language === 'vi' ? 'Mô Tả Công Việc (JD)' : 'Job Description (JD)'}
                </SectionTitle>
                <InfoItem style={{ marginTop: '12px' }}>
                  <p style={{
                    lineHeight: '1.8',
                    whiteSpace: 'pre-line',
                    background: '#ffffff',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}>
                    {selectedJob.description || (language === 'vi'
                      ? `• Thái độ nhiệt tình, thân thiện với khách hàng\n• Nhanh nhẹn, chịu được áp lực công việc cao điểm\n• Có tinh thần trách nhiệm và làm việc nhóm tốt\n• Chấp nhận làm việc theo ca, kể cả cuối tuần và lễ`
                      : `• Enthusiastic and friendly attitude towards customers\n• Quick and able to handle peak hour pressure\n• Responsible and good teamwork spirit\n• Accept shift work, including weekends and holidays`
                    )}
                  </p>
                </InfoItem>
                {selectedJob.benefits && (
                  <InfoItem style={{ marginTop: '16px' }}>
                    <label style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>
                      {language === 'vi' ? 'CHẾ ĐỘ PHÚC LỢI:' : 'BENEFITS:'}
                    </label>
                    <p style={{
                      lineHeight: '1.8',
                      whiteSpace: 'pre-line',
                      background: '#ffffff',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '14px',
                      marginTop: '8px'
                    }}>
                      {selectedJob.benefits}
                    </p>
                  </InfoItem>
                )}
              </DetailSection>

              <DetailSection>
                <SectionTitle>
                  <Building2 size={20} />
                  {language === 'vi' ? 'Thông Tin Nhà Tuyển Dụng' : 'Employer Information'}
                </SectionTitle>
                <InfoGrid>
                  <InfoItem style={{ gridColumn: '1 / -1' }}>
                    <label>{language === 'vi' ? 'Tên công ty' : 'Company Name'}</label>
                    <p style={{ fontSize: '15px', fontWeight: '600' }}>{selectedJob.employer}</p>
                  </InfoItem>
                  <InfoItem>
                    <label>Email</label>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} />
                      {selectedJob.employerEmail}
                    </p>
                  </InfoItem>
                  <InfoItem>
                    <label>{language === 'vi' ? 'Số điện thoại' : 'Phone'}</label>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} />
                      {selectedJob.employerPhone}
                    </p>
                  </InfoItem>
                </InfoGrid>
              </DetailSection>

              <DetailSection>
                <SectionTitle>
                  <Users size={20} />
                  {language === 'vi' ? 'Danh Sách Ứng Viên' : 'Candidates List'}
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 10px',
                    background: '#1e40af',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    {selectedJob.candidates?.length || 0}
                  </span>
                </SectionTitle>
                <CandidateList>
                  {selectedJob.candidates && selectedJob.candidates.length > 0 ? (
                    selectedJob.candidates.map((candidate, index) => (
                      <CandidateCard key={index}>
                        <CandidateInfo>
                          <h4>
                            <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            {candidate.name}
                          </h4>
                          <p>
                            <Mail size={12} />
                            {candidate.email}
                          </p>
                          <p>
                            <Phone size={12} />
                            {candidate.phone}
                          </p>
                        </CandidateInfo>
                        <CandidateDate>
                          <Calendar size={14} />
                          {candidate.appliedDate}
                        </CandidateDate>
                        <CandidateStatus>
                          <StatusBadge $status={candidate.status}>
                            {getCandidateStatusText(candidate.status)}
                          </StatusBadge>
                        </CandidateStatus>
                      </CandidateCard>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                      {language === 'vi' ? 'Chưa có ứng viên nào' : 'No candidates yet'}
                    </p>
                  )}
                </CandidateList>
              </DetailSection>
            </DetailModal>
          </Modal>


        </>)}
        {/* Confirmation modal for approve/reject actions (global) */}
        <Modal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          title={confirmAction === 'approve' ? (language === 'vi' ? 'Xác nhận duyệt' : 'Confirm approve') : (language === 'vi' ? 'Xác nhận từ chối' : 'Confirm reject')}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 16 }}>{confirmMessage}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <Button variant="secondary" onClick={() => setConfirmModalOpen(false)}>
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button variant="danger" onClick={performModerationAction}>
                {language === 'vi' ? 'Xác nhận' : 'Confirm'}
              </Button>
            </div>
          </div>
        </Modal>

      </PageContainer>
    </DashboardLayout>
  );
};

export default PostsManagement;



