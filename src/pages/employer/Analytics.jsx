import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { TrendingUp, TrendingDown, Users, Eye, DollarSign, Calendar, BarChart3, PieChart, Briefcase, Download, Filter } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import jobPostService from '../../services/jobPostService';
import { getJobApplications } from '../../services/applicationService';
import applicationService from '../../services/applicationService';
import quickJobService from '../../services/quickJobService';
import { getWallet } from '../../services/packageCatalogService';

// ─── Page wrapper ────────────────────────────────────────────
const PageContainer = styled(motion.div)``;

// ─── Header (đồng nhất với Applications) ─────────────────────
const PageHeader = styled.div`
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
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
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg { width: 22px; height: 22px; color: #1e40af; }
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

// ─── Filter bar ────────────────────────────────────────
const FilterBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Select = styled.select`
  padding: 10px 16px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.bgDark};
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  @media (max-width: 768px) {
    flex: 1;
    font-size: 13px;
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ─── Stat cards ───────────────────────────────────────────────
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled(motion.div)`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  position: relative;
  overflow: hidden;
  cursor: pointer;

  &::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    border-radius: 16px 0 0 16px;
    background: ${props => props.$accent || '#1e40af'};
    opacity: 0.6;
    transition: opacity 0.3s ease;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    background: ${props => props.$accent || '#1e40af'};
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: ${props => props.$accent || '#BFDBFE'};
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.12);

    &::before {
      opacity: 1;
      width: 5px;
    }

    &::after {
      opacity: 0.02;
    }
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const StatIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: ${props => props.$bg || '#EFF6FF'};
  border: 1.5px solid ${props => props.$border || '#BFDBFE'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.$iconColor || '#1e40af'};
    transition: transform 0.3s ease;
  }

  ${StatCard}:hover & {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.15);

    svg {
      transform: scale(1.1);
    }
  }
`;

const StatTrend = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 100px;
  background: ${props => props.$positive ? '#ECFDF5' : '#FEF2F2'};
  color: ${props => props.$positive ? '#10B981' : '#EF4444'};
  border: 1px solid ${props => props.$positive ? '#A7F3D0' : '#FECACA'};
  font-size: 12px;
  font-weight: 700;
  svg { width: 12px; height: 12px; }
`;

const StatValue = styled.div`
  font-size: 30px;
  font-weight: 900;
  color: ${props => props.theme.colors.text};
  letter-spacing: -1px;
  line-height: 1;
  margin-bottom: 6px;
  transition: all 0.3s ease;

  ${StatCard}:hover & {
    transform: translateX(2px);
    color: ${props => props.$accent || props.theme.colors.text};
  }
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.textLight};
  font-size: 13px;
  font-weight: 500;
`;

// ─── Charts ───────────────────────────────────────────────────
const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 22px 24px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.12);
    border-color: #BFDBFE;
  }
`;

const ChartHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #F1F5F9;

  .title-group {
    h3 {
      font-size: 16px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      margin-bottom: 4px;
    }
    p {
      font-size: 12px;
      color: #94A3B8;
      font-weight: 500;
    }
  }

  svg {
    color: #94A3B8;
    flex-shrink: 0;
  }
`;

const ChartSvg = styled.svg`
  width: 100%;
  height: 260px;
  overflow: visible;

  @media (max-width: 640px) {
    height: 200px;
  }
`;

const ChartLegend = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748B;
  font-weight: 600;

  &::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.$color};
  }
`;

const Tooltip = styled.div`
  position: absolute;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(8px);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  pointer-events: none;
  white-space: nowrap;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translate(-50%, -100%);
  margin-top: -8px;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid rgba(15, 23, 42, 0.95);
  }
`;

const SectionDivider = styled.div`
  width: 100%;
  height: 1px;
  background: #E8EFFF;
  margin: 32px 0;
`;

const PipelineCard = styled.div`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
`;

const PipelineHeader = styled.div`
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #F1F5F9;

  h3 {
    font-size: 16px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
  }

  p {
    font-size: 12px;
    color: #94A3B8;
    font-weight: 500;
  }
`;

const PipelineStage = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const StageName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const StageValue = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;

  span {
    color: #94A3B8;
    font-weight: 500;
    margin-left: 4px;
    font-size: 12px;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #F1F5F9;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.$width}%;
  background: ${props => props.$color};
  border-radius: 4px;
  transition: width 0.5s ease;
`;

const TotalRow = styled.div`
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #E8EFFF;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TotalLabel = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #64748B;
`;

const TotalValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: #1e40af;
`;

// ─── Top jobs table ───────────────────────────────────────────
const TableContainer = styled(motion.div)`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.12);
    border-color: #BFDBFE;
  }
`;

const TableHeader = styled.div`
  padding: 18px 22px;
  border-bottom: 1px solid #F1F5F9;
  h3 { font-size: 15px; font-weight: 700; color: ${props => props.theme.colors.text}; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 14px 22px;
    background: #F8FAFC;
    color: #94A3B8;
    font-size: 11.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    border-bottom: 1px solid #F1F5F9;
  }

  td {
    padding: 16px 22px;
    font-size: 13.5px;
    color: ${props => props.theme.colors.text};
    font-weight: 500;
    border-bottom: 1px solid #F1F5F9;
  }

  tbody tr {
    transition: all 0.2s ease;

    &:hover {
      background: #FAFBFF;
      transform: scale(1.01);
    }

    &:last-child td {
      border-bottom: none;
    }
  }

  @media (max-width: 768px) {
    th, td {
      padding: 12px 16px;
      font-size: 12px;
    }
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;
  background: ${props =>
    props.$status === 'active' ? '#ECFDF5' :
    props.$status === 'closed' ? '#FEF2F2' : '#FFFBEB'};
  color: ${props =>
    props.$status === 'active' ? '#10B981' :
    props.$status === 'closed' ? '#EF4444' : '#F59E0B'};
  border: 1px solid ${props =>
    props.$status === 'active' ? '#A7F3D0' :
    props.$status === 'closed' ? '#FECACA' : '#FDE68A'};
  &::before {
    content: '';
    width: 5px; height: 5px;
    border-radius: 50%;
    background: currentColor;
  }
`;

// ─── Component ────────────────────────────────────────────────
const Analytics = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState('month');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // ── DB state ──────────────────────────────────────────────
  const [jobPosts, setJobPosts] = useState([]);
  const [quickJobs, setQuickJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [totalSpent, setTotalSpent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobs, qJobs] = await Promise.all([
          jobPostService.getMyJobPosts().catch(() => []),
          quickJobService.getMyQuickJobs ? quickJobService.getMyQuickJobs().catch(() => []) : Promise.resolve([]),
        ]);
        const jobArr = Array.isArray(jobs) ? jobs : [];
        const qJobArr = Array.isArray(qJobs) ? qJobs : [];
        setJobPosts(jobArr);
        setQuickJobs(qJobArr);

        // Fetch tất cả applications của employer bằng 1 request, tránh throttling
        let allApps = [];
        try {
          // Thử lấy tất cả rồi filter theo employerId
          const allResult = await applicationService.getAllApplications().catch(() => null);
          if (allResult && Array.isArray(allResult)) {
            const employerJobIds = new Set([
              ...jobArr.map(j => j.idJob || j.id),
              ...qJobArr.map(j => j.jobID || j.id),
            ].filter(Boolean));
            allApps = allResult.filter(app => employerJobIds.has(app.jobId || app.jobID));
          } else {
            // Fallback: batch 3 jobs cùng lúc để tránh throttle
            const allJobIds = [
              ...jobArr.map(j => j.idJob || j.id),
              ...qJobArr.map(j => j.jobID || j.id),
            ].filter(Boolean);
            const BATCH = 3;
            for (let i = 0; i < allJobIds.length; i += BATCH) {
              const batch = allJobIds.slice(i, i + BATCH);
              const results = await Promise.all(batch.map(id => getJobApplications(id).catch(() => [])));
              allApps.push(...results.flat());
              if (i + BATCH < allJobIds.length) await new Promise(r => setTimeout(r, 200));
            }
          }
        } catch (_) {}
        setApplications(allApps);

        // Fetch wallet for spending data
        if (user?.userId) {
          try {
            const wallet = await getWallet(user.userId);
            const spent = wallet?.transactions
              ? wallet.transactions
                  .filter(t => t.type === 'debit' || t.amount < 0)
                  .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)
              : null;
            setTotalSpent(spent);
          } catch (_) { /* wallet not available */ }
        }
      } catch (e) {
        console.error('Analytics fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.userId]);

  // ── Helper: lọc theo timeFilter ──────────────────────────
  const getCutoff = (filter) => {
    const now = new Date();
    const cutoff = new Date();
    if (filter === 'week')    cutoff.setDate(now.getDate() - 7);
    else if (filter === 'month')   cutoff.setDate(now.getDate() - 30);
    else if (filter === 'quarter') cutoff.setDate(now.getDate() - 90);
    else if (filter === 'year')    cutoff.setFullYear(now.getFullYear(), 0, 1);
    return cutoff;
  };

  const filterByTime = (items, dateField) => {
    const cutoff = getCutoff(timeFilter);
    return items.filter(j => {
      const dateStr = j[dateField] || j.createdAt || '';
      if (!dateStr) return true;
      const d = new Date(dateStr);
      return !isNaN(d) && d >= cutoff;
    });
  };

  // Kỳ trước (để tính trend)
  const getPrevCutoff = () => {
    const now = new Date();
    const curr = getCutoff(timeFilter);
    const diff = now - curr;
    return new Date(curr - diff);
  };

  const filterByPrevPeriod = (items, dateField) => {
    const currCutoff = getCutoff(timeFilter);
    const prevCutoff = getPrevCutoff();
    return items.filter(j => {
      const dateStr = j[dateField] || j.createdAt || '';
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return !isNaN(d) && d >= prevCutoff && d < currCutoff;
    });
  };

  const calcTrend = (curr, prev) => {
    if (prev === 0) return curr > 0 ? '+100%' : '0%';
    const pct = Math.round(((curr - prev) / prev) * 100);
    return `${pct >= 0 ? '+' : ''}${pct}%`;
  };

  const filteredJobs      = useMemo(() => filterByTime(jobPosts, 'createdAt'),  [jobPosts, timeFilter]);
  const filteredQuickJobs = useMemo(() => filterByTime(quickJobs, 'createdAt'), [quickJobs, timeFilter]);
  const filteredApps      = useMemo(() => filterByTime(applications, 'createdAt'), [applications, timeFilter]);
  const prevApps          = useMemo(() => filterByPrevPeriod(applications, 'createdAt'), [applications, timeFilter]);

  // ── Computed stats từ DB thực ──────────────────────────
  const totalJobs = filteredJobs.length + filteredQuickJobs.length;
  const prevJobs  = useMemo(() => {
    const c = getPrevCutoff(); const cu = getCutoff(timeFilter);
    return [...jobPosts, ...quickJobs].filter(j => {
      const d = new Date(j.createdAt || '');
      return !isNaN(d) && d >= c && d < cu;
    }).length;
  }, [jobPosts, quickJobs, timeFilter]);

  // Ứng viên từ applications thực tế
  const totalApplications = filteredApps.length;
  const prevApplications  = prevApps.length;

  // Views từ field views trong job
  const totalViews = useMemo(() =>
    filteredJobs.reduce((sum, j) => sum + (Number(j.views) || 0), 0) +
    filteredQuickJobs.reduce((sum, j) => sum + (Number(j.views) || 0), 0),
  [filteredJobs, filteredQuickJobs]);

  const prevViews = useMemo(() => {
    const c = getPrevCutoff(); const cu = getCutoff(timeFilter);
    return [...jobPosts, ...quickJobs].filter(j => {
      const d = new Date(j.createdAt || '');
      return !isNaN(d) && d >= c && d < cu;
    }).reduce((sum, j) => sum + (Number(j.views) || 0), 0);
  }, [jobPosts, quickJobs, timeFilter]);

  // Xu hướng ứng tuyển theo tháng — dùng applications.createdAt thực tế
  const applicationData = useMemo(() => {
    const months = language === 'vi'
      ? ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const counts = Array(12).fill(0);
    applications.forEach(app => {
      const date = app.createdAt ? new Date(app.createdAt) : null;
      if (date && !isNaN(date)) {
        counts[date.getMonth()] += 1;
      }
    });
    // Fallback: nếu không có applications, dùng applicants từ jobs
    const hasRealData = counts.some(v => v > 0);
    if (!hasRealData) {
      [...jobPosts, ...quickJobs].forEach(j => {
        const date = j.createdAt ? new Date(j.createdAt) : null;
        if (date && !isNaN(date)) {
          counts[date.getMonth()] += (Number(j.applicants) || 0);
        }
      });
    }

    return months.map((month, i) => ({ month, value: counts[i] }));
  }, [applications, jobPosts, quickJobs, language]);

  const maxValue = useMemo(() => Math.max(10, ...applicationData.map(d => d.value)), [applicationData]);
  const hasChartData = useMemo(() => applicationData.some(d => d.value > 0), [applicationData]);

  // Top jobs: dùng applications thực tế để đếm
  const topJobs = useMemo(() => {
    const appCountMap = {};
    applications.forEach(app => {
      const id = app.jobId || app.jobID;
      if (id) appCountMap[id] = (appCountMap[id] || 0) + 1;
    });

    const allJobs = [
      ...jobPosts.map(j => ({
        id: j.idJob || j.id,
        title: j.title || '',
        applications: appCountMap[j.idJob || j.id] ?? (Number(j.applicants) || 0),
        views: Number(j.views) || 0,
        status: j.status === 'active' ? 'active' : j.status === 'closed' ? 'closed' : 'draft',
      })),
      ...quickJobs.map(j => ({
        id: j.jobID || j.id,
        title: j.title || '',
        applications: appCountMap[j.jobID || j.id] ?? (Number(j.applicants) || 0),
        views: Number(j.views) || 0,
        status: (j.status === 'approved' || j.status === 'active') ? 'active' : 'closed',
      })),
    ];
    return allJobs.sort((a, b) => b.applications - a.applications).slice(0, 5);
  }, [jobPosts, quickJobs, applications]);

  const candidateDistribution = useMemo(() => {
    const catMap = {};

    const mapLabel = (raw) => {
      const r = (raw || '').toLowerCase();
      if (r.includes('part') || r === 'part-time') return language === 'vi' ? 'Bán thời gian' : 'Part-time';
      if (r.includes('full') || r === 'full-time') return language === 'vi' ? 'Bán thời gian' : 'Part-time';
      if (r.includes('standard') || r === 'standard') return language === 'vi' ? 'Tiêu chuẩn' : 'Standard';
      if (r.includes('urgent') || r.includes('gấp')) return language === 'vi' ? 'Tuyển gấp' : 'Urgent';
      if (r.includes('intern') || r.includes('thực tập')) return language === 'vi' ? 'Thực tập' : 'Internship';
      return raw || (language === 'vi' ? 'Khác' : 'Other');
    };

    // Dùng applications thực tế để đếm theo loại job
    const jobTypeMap = {};
    jobPosts.forEach(j => { jobTypeMap[j.idJob || j.id] = mapLabel(j.category || j.jobType || 'standard'); });
    quickJobs.forEach(j => { jobTypeMap[j.jobID || j.id] = language === 'vi' ? 'Tuyển gấp' : 'Urgent'; });

    applications.forEach(app => {
      const id = app.jobId || app.jobID;
      const cat = jobTypeMap[id] || (language === 'vi' ? 'Khác' : 'Other');
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    // Fallback nếu không có applications
    if (Object.keys(catMap).length === 0) {
      jobPosts.forEach(j => {
        const cat = mapLabel(j.category || j.jobType || 'standard');
        catMap[cat] = (catMap[cat] || 0) + (Number(j.applicants) || 0);
      });
      quickJobs.forEach(j => {
        const cat = language === 'vi' ? 'Tuyển gấp' : 'Urgent';
        catMap[cat] = (catMap[cat] || 0) + (Number(j.applicants) || 0);
      });
    }

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
    const entries = Object.entries(catMap).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;

    if (entries.length === 0) {
      return [
        { label: language === 'vi' ? 'Tiêu chuẩn' : 'Standard', value: 60, color: '#3B82F6' },
        { label: language === 'vi' ? 'Tuyển gấp' : 'Urgent', value: 40, color: '#EC4899' },
      ];
    }
    return entries.map(([label, val], i) => ({
      label,
      value: Math.round((val / total) * 100),
      color: colors[i % colors.length],
    }));
  }, [jobPosts, quickJobs, applications, language]);

  // ── Generate smooth curve path ────────────────────────────
  const generatePath = (data) => {
    const points = data.map((d, i) => ({
      x: 60 + (i * 50),
      y: 220 - (d.value / maxValue) * 180
    }));
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const xMid = (points[i].x + points[i + 1].x) / 2;
      const yMid = (points[i].y + points[i + 1].y) / 2;
      const cpX1 = (xMid + points[i].x) / 2;
      const cpX2 = (xMid + points[i + 1].x) / 2;
      path += ` Q ${cpX1} ${points[i].y}, ${xMid} ${yMid}`;
      path += ` Q ${cpX2} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
    }
    return path;
  };

  const applicationPath = generatePath(applicationData);

  // Handler xuất CSV
  const handleExportExcel = () => {
    const vi = language === 'vi';
    const periodLabel = timePills.find(p => p.id === timeFilter)?.label || timeFilter;

    // Sheet 1: Thống kê tổng quan
    const summaryRows = [
      [vi ? 'Chỉ số' : 'Metric', vi ? 'Giá trị' : 'Value'],
      [vi ? 'Khoảng thời gian' : 'Period', periodLabel],
      [vi ? 'Tổng tin tuyển dụng' : 'Total Jobs', totalJobs],
      [vi ? 'Tổng ứng viên' : 'Total Applications', totalApplications],
      [vi ? 'Lượt xem' : 'Total Views', totalViews],
      [vi ? 'Chi phí tuyển dụng' : 'Hiring Cost', totalSpent != null ? totalSpent.toLocaleString('vi-VN') + '₫' : '—'],
    ];

    // Sheet 2: Top công việc
    const jobRows = [
      [vi ? 'Tiêu đề' : 'Title', vi ? 'Ứng viên' : 'Applications', vi ? 'Lượt xem' : 'Views', vi ? 'Trạng thái' : 'Status'],
      ...topJobs.map(j => [j.title, j.applications, j.views, j.status]),
    ];

    // Sheet 3: Xu hướng theo tháng
    const trendRows = [
      [vi ? 'Tháng' : 'Month', vi ? 'Số ứng tuyển' : 'Applications'],
      ...applicationData.map(d => [d.month, d.value]),
    ];

    // Gộp thành 1 CSV với separator
    const toCSV = (rows) => rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

    const csv = [
      `=== ${vi ? 'THỐNG KÊ TỔNG QUAN' : 'SUMMARY'} ===`,
      toCSV(summaryRows),
      '',
      `=== ${vi ? 'TOP CÔNG VIỆC' : 'TOP JOBS'} ===`,
      toCSV(jobRows),
      '',
      `=== ${vi ? 'XU HƯỚNG ỨNG TUYỂN' : 'APPLICATION TREND'} ===`,
      toCSV(trendRows),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `analytics_${timeFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    {
      icon: <Briefcase />,
      label: language === 'vi' ? 'Tổng tin tuyển dụng' : 'Total job posts',
      value: loading ? '...' : String(totalJobs),
      trend: calcTrend(totalJobs, prevJobs),
      positive: totalJobs >= prevJobs,
      accent: '#1e40af', bg: '#EFF6FF', border: '#BFDBFE', iconColor: '#1e40af'
    },
    {
      icon: <Users />,
      label: language === 'vi' ? 'Tổng ứng viên' : 'Total candidates',
      value: loading ? '...' : totalApplications.toLocaleString('vi-VN'),
      trend: calcTrend(totalApplications, prevApplications),
      positive: totalApplications >= prevApplications,
      accent: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8', iconColor: '#EC4899'
    },
    {
      icon: <Eye />,
      label: language === 'vi' ? 'Lượt xem công việc' : 'Job views',
      value: loading ? '...' : totalViews.toLocaleString('vi-VN'),
      trend: calcTrend(totalViews, prevViews),
      positive: totalViews >= prevViews,
      accent: '#06B6D4', bg: '#ECFEFF', border: '#A5F3FC', iconColor: '#06B6D4'
    },
    {
      icon: <DollarSign />,
      label: language === 'vi' ? 'Chi phí tuyển dụng' : 'Hiring cost',
      value: loading ? '...' : totalSpent != null
        ? totalSpent.toLocaleString('vi-VN') + '₫'
        : '—',
      trend: '—',
      positive: true,
      accent: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', iconColor: '#10B981'
    },
  ];

  const timePills = [
    { id: 'week',    label: language === 'vi' ? '7 ngày qua'  : 'Last 7 days' },
    { id: 'month',   label: language === 'vi' ? '30 ngày qua' : 'Last 30 days' },
    { id: 'quarter', label: language === 'vi' ? '3 tháng qua' : 'Last 3 months' },
    { id: 'year',    label: language === 'vi' ? 'Năm nay'     : 'This year' },
  ];

  return (
    <DashboardLayout role="employer" key={language}>
      <PageContainer
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* ── Header ── */}
        <PageHeader>
          <PageTitleGroup>
            <PageIconBox><BarChart3 /></PageIconBox>
            <PageTitleText>
              <h1>{language === 'vi' ? 'Phân tích & Thống kê' : 'Analytics & Insights'}</h1>
              <p>{language === 'vi' ? 'Theo dõi hiệu suất tuyển dụng của bạn' : 'Track your hiring performance'}</p>
            </PageTitleText>
          </PageTitleGroup>

          {/* Time filter dropdown & Export button */}
          <FilterBar>
            <FilterGroup>
              <Filter size={18} />
              <Select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
                {timePills.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </FilterGroup>
            <ExportButton onClick={handleExportExcel}>
              <Download />
              {language === 'vi' ? 'Xuất Excel' : 'Export Excel'}
            </ExportButton>
          </FilterBar>
        </PageHeader>

        {/* ── Stat cards ── */}
        <StatsGrid>
          {stats.map((stat, i) => (
            <StatCard
              key={i}
              $accent={stat.accent}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.07 }}
              whileHover={{ y: -3 }}
            >
              <StatHeader>
                <StatIcon $bg={stat.bg} $border={stat.border} $iconColor={stat.iconColor}>
                  {stat.icon}
                </StatIcon>
                <StatTrend $positive={stat.positive}>
                  {stat.positive ? <TrendingUp /> : <TrendingDown />}
                  {stat.trend}
                </StatTrend>
              </StatHeader>
              <StatValue $accent={stat.accent}>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatCard>
          ))}
        </StatsGrid>

        {/* ── Charts ── */}
        <ChartsGrid>
          <ChartCard>
            <ChartHeader>
              <div className="title-group">
                <h3>{language === 'vi' ? 'Xu hướng ứng tuyển' : 'Application Trend'}</h3>
                <p>{language === 'vi' ? 'Theo dõi số lượng ứng tuyển theo thời gian' : 'Track application count over time'}</p>
              </div>
              <Calendar size={18} />
            </ChartHeader>
            <ChartLegend>
              <LegendItem $color="#1e40af">{language === 'vi' ? 'Số lượng ứng tuyển' : 'Applications'}</LegendItem>
            </ChartLegend>
            {!hasChartData ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '260px', color: '#94A3B8', gap: '8px' }}>
                <BarChart3 size={40} strokeWidth={1.5} />
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                  {language === 'vi' ? 'Chưa có dữ liệu ứng tuyển' : 'No application data yet'}
                </div>
                <div style={{ fontSize: '12px' }}>
                  {language === 'vi' ? 'Dữ liệu sẽ xuất hiện khi có ứng viên apply' : 'Data will appear when candidates apply'}
                </div>
              </div>
            ) : (
            <ChartSvg viewBox="0 0 660 260">
              <defs>
                <linearGradient id="applicationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e40af" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="40"
                  y1={40 + i * 45}
                  x2="640"
                  y2={40 + i * 45}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
              ))}

              {/* Y-axis labels */}
              {[4, 3, 2, 1, 0].map((i) => {
                const yVal = Math.round((maxValue / 4) * i);
                return (
                  <text
                    key={i}
                    x="30"
                    y={45 + (4 - i) * 45}
                    textAnchor="end"
                    fontSize="11"
                    fill="#94A3B8"
                    fontWeight="500"
                  >
                    {yVal}
                  </text>
                );
              })}

              {/* Area under curve */}
              <path
                d={`${applicationPath} L 660 220 L 60 220 Z`}
                fill="url(#applicationGradient)"
              />

              {/* Line */}
              <path
                d={applicationPath}
                fill="none"
                stroke="#1e40af"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points with hover */}
              {applicationData.map((d, i) => {
                const cx = 60 + i * 50;
                const cy = 220 - (d.value / maxValue) * 180;
                const isHovered = hoveredPoint === i;

                return (
                  <g key={i}>
                    {/* Hover area */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r="15"
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />

                    {/* Glow when hovered */}
                    {isHovered && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="8"
                        fill="#1e40af"
                        opacity="0.3"
                        filter="url(#glow)"
                      />
                    )}

                    {/* Data point */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? "6" : "4"}
                      fill="#1e40af"
                      stroke="#ffffff"
                      strokeWidth="2"
                      style={{
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    />

                    {/* Tooltip */}
                    {isHovered && (
                      <>
                        <rect
                          x={cx - 35}
                          y={cy - 50}
                          width="70"
                          height="36"
                          rx="6"
                          fill="rgba(15, 23, 42, 0.95)"
                        />
                        <text
                          x={cx}
                          y={cy - 34}
                          textAnchor="middle"
                          fontSize="11"
                          fill="white"
                          fontWeight="600"
                        >
                          {d.month}
                        </text>
                        <text
                          x={cx}
                          y={cy - 20}
                          textAnchor="middle"
                          fontSize="14"
                          fill="white"
                          fontWeight="800"
                        >
                          {d.value}
                        </text>
                        <path
                          d={`M ${cx - 4} ${cy - 14} L ${cx + 4} ${cy - 14} L ${cx} ${cy - 8} Z`}
                          fill="rgba(15, 23, 42, 0.95)"
                        />
                      </>
                    )}
                  </g>
                );
              })}

              {/* X-axis labels */}
              {applicationData.map((d, i) => (
                <text
                  key={i}
                  x={60 + i * 50}
                  y="245"
                  textAnchor="middle"
                  fontSize="11"
                  fill="#94A3B8"
                  fontWeight="500"
                >
                  {d.month}
                </text>
              ))}
            </ChartSvg>
            )}
          </ChartCard>

          <ChartCard>
            <ChartHeader>
              <div className="title-group">
                <h3>{language === 'vi' ? 'Phân bố ứng viên' : 'Candidate Distribution'}</h3>
                <p>{language === 'vi' ? 'Theo ngành nghề và vị trí' : 'By industry and position'}</p>
              </div>
              <PieChart size={18} />
            </ChartHeader>
            <ChartLegend>
              {candidateDistribution.map((item, i) => (
                <LegendItem key={i} $color={item.color}>
                  {item.label} ({item.value}%)
                </LegendItem>
              ))}
            </ChartLegend>
            <ChartSvg viewBox="0 0 300 220">
              {(() => {
                let currentAngle = -90;
                const centerX = 150;
                const centerY = 110;
                const radius = 80;
                const innerRadius = 50;

                return candidateDistribution.map((item, i) => {
                  const angle = (item.value / 100) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;
                  const isHovered = hoveredSegment === i;

                  // Calculate outer radius with hover effect
                  const outerRadius = isHovered ? radius + 8 : radius;

                  const x1 = centerX + outerRadius * Math.cos((Math.PI * startAngle) / 180);
                  const y1 = centerY + outerRadius * Math.sin((Math.PI * startAngle) / 180);
                  const x2 = centerX + outerRadius * Math.cos((Math.PI * endAngle) / 180);
                  const y2 = centerY + outerRadius * Math.sin((Math.PI * endAngle) / 180);

                  const x3 = centerX + innerRadius * Math.cos((Math.PI * endAngle) / 180);
                  const y3 = centerY + innerRadius * Math.sin((Math.PI * endAngle) / 180);
                  const x4 = centerX + innerRadius * Math.cos((Math.PI * startAngle) / 180);
                  const y4 = centerY + innerRadius * Math.sin((Math.PI * startAngle) / 180);

                  const largeArcFlag = angle > 180 ? 1 : 0;

                  const pathData = [
                    `M ${x1} ${y1}`,
                    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    `L ${x3} ${y3}`,
                    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                    'Z'
                  ].join(' ');

                  currentAngle = endAngle;

                  // Calculate percentage label position
                  const midAngle = startAngle + angle / 2;
                  const labelRadius = (outerRadius + innerRadius) / 2;
                  const labelX = centerX + labelRadius * Math.cos((Math.PI * midAngle) / 180);
                  const labelY = centerY + labelRadius * Math.sin((Math.PI * midAngle) / 180);

                  return (
                    <g key={i}>
                      {/* Shadow when hovered */}
                      {isHovered && (
                        <path
                          d={pathData}
                          fill={item.color}
                          opacity="0.2"
                          filter="url(#glow)"
                        />
                      )}

                      {/* Main segment */}
                      <path
                        d={pathData}
                        fill={item.color}
                        stroke="#ffffff"
                        strokeWidth="2"
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          opacity: hoveredSegment !== null && !isHovered ? 0.5 : 1
                        }}
                        onMouseEnter={() => setHoveredSegment(i)}
                        onMouseLeave={() => setHoveredSegment(null)}
                      />
                    </g>
                  );
                });
              })()}

              {/* Center circle */}
              <circle cx="150" cy="110" r="45" fill="#ffffff" />
            </ChartSvg>
          </ChartCard>
        </ChartsGrid>

        {/* ── Top jobs ── */}
        <TableContainer
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
        >
          <TableHeader>
            <h3>{language === 'vi' ? 'Top công việc hot nhất' : 'Top Performing Jobs'}</h3>
          </TableHeader>
          <Table>
            <thead>
              <tr>
                <th>{language === 'vi' ? 'Tiêu đề công việc' : 'Job title'}</th>
                <th>{language === 'vi' ? 'Ứng viên' : 'Candidates'}</th>
                <th>{language === 'vi' ? 'Lượt xem' : 'Views'}</th>
                <th>{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {topJobs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Briefcase size={36} strokeWidth={1.5} />
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>
                        {language === 'vi' ? 'Chưa có tin tuyển dụng nào' : 'No job posts yet'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : topJobs.map((job, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: i === 0 ? '#FEF3C7' : i === 1 ? '#DBEAFE' : '#F3F4F6',
                        color: i === 0 ? '#F59E0B' : i === 1 ? '#3B82F6' : '#6B7280',
                        fontSize: '12px',
                        fontWeight: '800'
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontWeight: '600' }}>{job.title}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: '#EFF6FF',
                      color: '#1e40af',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}>
                      {job.applications}
                    </span>
                  </td>
                  <td style={{ color: '#64748B' }}>{job.views.toLocaleString()}</td>
                  <td>
                    <StatusBadge $status={job.status}>
                      {job.status === 'active' && (language === 'vi' ? 'Đang tuyển' : 'Active')}
                      {job.status === 'closed' && (language === 'vi' ? 'Đã đóng' : 'Closed')}
                      {job.status === 'draft'  && (language === 'vi' ? 'Nháp' : 'Draft')}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      </PageContainer>
    </DashboardLayout>
  );
};

export default Analytics;
