import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, DollarSign, Clock, Calendar, ChevronRight, ChevronLeft,
  Send, Users, Briefcase, Globe,
  Check, X,
  AlertCircle, Award, Bookmark, ExternalLink
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import jobPostService from '../../services/jobPostService';
import adminEmployerService from '../../services/adminEmployerService';
import candidateProfileService from '../../services/candidateProfileService';
import { getMyCandidateApplications } from '../../services/applicationService';
import { formatShiftString } from '../../utils/formatDays';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}`;
const shimmerAnim = keyframes`0%{background-position:-600px 0}100%{background-position:600px 0}`;

// ─── Layout ───────────────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  animation: ${fadeUp} 0.45s ease;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 0 100px;
`;

const Breadcrumb = styled.nav`
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
  font-size: 13px; color: ${p => p.theme.colors.textLight}; margin-bottom: 20px;
  button {
    color: ${p => p.theme.colors.primary}; background: none; border: none;
    padding: 0; cursor: pointer; font-size: 13px; font-family: inherit;
    &:hover { text-decoration: underline; }
  }
  span.sep { color: ${p => p.theme.colors.border}; display: flex; align-items: center; }
  span.current { color: ${p => p.theme.colors.text}; font-weight: 500; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
  @media (max-width: 880px) { grid-template-columns: 1fr; }
`;

const MainCol = styled.div`display: flex; flex-direction: column; gap: 18px;`;

const SideCol = styled.div`
  display: flex; flex-direction: column; gap: 14px;
  @media (min-width: 881px) { position: sticky; top: 80px; }
`;

// ─── Shared UI ────────────────────────────────────────────────────────────────
const Card = styled.div`
  background: ${p => p.theme.colors.bgLight};
  border-radius: 14px;
  border: 1.5px solid ${p => p.theme.colors.border};
  padding: ${p => p.$sm ? '16px' : '24px'};
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
`;

const SectionTitle = styled.h2`
  font-size: 16px; font-weight: 700;
  color: ${p => p.theme.colors.text};
  padding-left: 12px;
  border-left: 4px solid ${p => p.theme.colors.primary};
  margin-bottom: 14px;
`;

const Skeleton = styled.div`
  background: linear-gradient(90deg,
    ${p => p.theme.colors.bgDark} 25%,
    ${p => p.theme.colors.border} 50%,
    ${p => p.theme.colors.bgDark} 75%);
  background-size: 600px 100%;
  animation: ${shimmerAnim} 1.4s infinite;
  border-radius: 8px;
  height: ${p => p.$h || '14px'};
  width: ${p => p.$w || '100%'};
  margin-bottom: ${p => p.$mb || '0px'};
`;

const PillGroup = styled.div`display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px;`;

const Pill = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background: ${p => p.$link ? p.theme.colors.primary + '12' : p.theme.colors.bgDark};
  color: ${p => p.$link ? p.theme.colors.primary : p.theme.colors.text};
  border: 1.5px solid ${p => p.$link ? p.theme.colors.primary + '35' : p.theme.colors.border};
  cursor: ${p => p.$link ? 'pointer' : 'default'};
  transition: opacity .2s;
  &:hover { opacity: ${p => p.$link ? .75 : 1}; }
`;

const RichText = styled.div`
  font-size: 14.5px;
  line-height: 1.8;
  color: ${p => p.theme.colors.text};
  white-space: pre-wrap;
  word-break: break-word;
  h2,h3,h4 { font-weight: 700; margin: 10px 0 4px; }
  ul,ol { padding-left: 18px; margin: 4px 0; }
  li { margin-bottom: 3px; }
  strong,b { font-weight: 700; }
`;

// ─── Header area styles ───────────────────────────────────────────────────────
const JobTitle = styled.h1`
  font-size: 22px; font-weight: 800;
  color: ${p => p.theme.colors.text};
  line-height: 1.3; flex: 1;
`;

const VerifiedBadge = styled.span`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600; color: #059669;
  background: #ecfdf5; border: 1px solid #6ee7b7;
  border-radius: 20px; padding: 2px 10px; white-space: nowrap;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 10px;
  margin: 14px 0;
  @media (max-width: 560px) { grid-template-columns: 1fr 1fr; }
`;

const InfoTile = styled.div`
  display: flex; align-items: center; gap: 9px;
  padding: 11px 13px;
  background: ${p => p.theme.colors.bgDark};
  border-radius: 10px;
`;

const TileIcon = styled.div`
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  background: ${p => p.theme.colors.primary}14;
  color: ${p => p.theme.colors.primary};
  display: flex; align-items: center; justify-content: center;
  svg { width: 15px; height: 15px; }
`;

// ─── Action buttons ───────────────────────────────────────────────────────────
const BtnRow = styled.div`
  display: flex; gap: 10px;
  @media (max-width: 560px) {
    position: fixed; bottom: 0; left: 0; right: 0;
    padding: 10px 14px;
    background: ${p => p.theme.colors.bgLight};
    border-top: 1px solid ${p => p.theme.colors.border};
    z-index: 200; box-shadow: 0 -4px 16px rgba(0,0,0,.1);
  }
`;

const ApplyBtn = styled(motion.button)`
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 12px 18px;
  background: linear-gradient(135deg,#059669,#047857);
  color: #fff; border: none; border-radius: 10px;
  font-size: 14px; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 14px rgba(5,150,105,.28);
  &:hover { opacity: .92; }
  &:disabled { opacity: .55; cursor: not-allowed; }
  svg { width: 16px; height: 16px; }
`;

const SaveBtn = styled(motion.button)`
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: all .2s;
  background: ${p => p.$saved ? p.theme.colors.primary + '16' : 'transparent'};
  color: ${p => p.$saved ? p.theme.colors.primary : p.theme.colors.textLight};
  border: 2px solid ${p => p.$saved ? p.theme.colors.primary : p.theme.colors.border};
  &:hover { border-color: ${p => p.theme.colors.primary}; color: ${p => p.theme.colors.primary}; }
  svg { width: 16px; height: 16px; }
`;

// ─── Gallery ──────────────────────────────────────────────────────────────────
const GalleryRow = styled.div`display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; margin-top: 10px;`;
const GThumb = styled.div`
  position: relative; aspect-ratio: 4/3; border-radius: 9px; overflow: hidden; cursor: pointer;
  img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
  &:hover img { transform: scale(1.06); }
`;
const GOverlay = styled.div`
  position: absolute; inset: 0; background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 20px; font-weight: 700;
`;
const LBOverlay = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0,0,0,.92);
  z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;
`;
const LBNav = styled.button`
  position: absolute; top: 50%; transform: translateY(-50%);
  ${p => p.$left ? 'left:18px' : 'right:18px'};
  background: rgba(255,255,255,.14); color: #fff; border: none;
  border-radius: 50%; width: 46px; height: 46px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  &:hover { background: rgba(255,255,255,.25); }
  svg { width: 20px; height: 20px; }
`;

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const LogoBox = styled.div`
  width: 56px; height: 56px; border-radius: 10px; overflow: hidden; flex-shrink: 0;
  border: 1.5px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgDark};
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 800; color: ${p => p.theme.colors.primary};
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const MetaRow = styled.div`
  display: flex; align-items: flex-start; gap: 7px; font-size: 13px;
  color: ${p => p.theme.colors.textLight}; margin-bottom: 6px;
  svg { width: 14px; height: 14px; color: ${p => p.theme.colors.primary}; flex-shrink: 0; margin-top: 1px; }
`;
const InfoItem = styled.div`
  display: flex; align-items: flex-start; gap: 9px; padding: 7px 0;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  &:last-child { border: none; }
  svg { width: 15px; height: 15px; color: ${p => p.theme.colors.primary}; flex-shrink: 0; margin-top: 2px; }
`;
const SugCard = styled.div`
  display: flex; gap: 9px; padding: 9px; border-radius: 9px; cursor: pointer;
  transition: background .18s;
  &:hover { background: ${p => p.theme.colors.bgDark}; }
`;
const SugLogo = styled.div`
  width: 38px; height: 38px; border-radius: 8px; flex-shrink: 0; overflow: hidden;
  background: ${p => p.theme.colors.bgDark};
  border: 1px solid ${p => p.theme.colors.border};
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: ${p => p.theme.colors.primary};
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const ReportBox = styled.div`
  background: ${p => p.theme.colors.bgDark}; border: 1px solid ${p => p.theme.colors.border};
  border-radius: 10px; padding: 13px 16px; font-size: 13px;
  color: ${p => p.theme.colors.textLight}; line-height: 1.6;
  display: flex; gap: 9px; align-items: flex-start;
  svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 2px; color: #f59e0b; }
  a { color: ${p => p.theme.colors.primary}; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = d => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  // Format theo timezone Việt Nam (UTC+7)
  const vnDate = new Date(dt.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  return `${String(vnDate.getDate()).padStart(2,'0')}/${String(vnDate.getMonth()+1).padStart(2,'0')}/${vnDate.getFullYear()}`;
};

// Format workHours using shared utility
const fmtWorkHours = raw => {
  if (!raw) return '';
  return formatShiftString(raw, 'vi');
};
const daysLeft = d => {
  if (!d) return null;
  return Math.ceil((new Date(d) - Date.now()) / 86400000);
};
const fmtSalary = j => {
  if (!j.salary) return 'Thỏa thuận';
  const s = String(j.salary);
  if (/thỏa thuận|negotiate/i.test(s)) return 'Thỏa thuận';
  const unit = j.salaryUnit === 'month' ? 'đ/tháng' : j.salaryUnit === 'shift' ? 'đ/ca' : 'đ/giờ';
  // Nếu đã chứa VND hoặc triệu thì giữ nguyên
  if (s.includes('VND') || s.includes('triệu') || s.includes('đ')) return s;
  // Format số có dấu chấm phân cách hàng nghìn
  const num = s.replace(/[^\d]/g, '');
  if (!num) return s;
  const formatted = Number(num).toLocaleString('vi-VN');
  return `${formatted}${unit}`;
};
const tagsArr = j => {
  if (!j?.tags) return [];
  if (Array.isArray(j.tags)) return j.tags.filter(Boolean);
  return j.tags.split(',').map(t => t.trim()).filter(Boolean);
};
const richHtml = text => {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/^[-•]\s*/gm, '');
};
// ─── Component ────────────────────────────────────────────────────────────────
// standalone=true  → /candidate/jobs/:jobId  (DashboardLayout)
// standalone=false → /jobs/:jobId            (inside LandingPage, no layout)
const JobDetail = ({ standalone = true }) => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [job, setJob]           = useState(null);
  const [employer, setEmployer] = useState(null);
  const [allJobs, setAllJobs]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [missing, setMissing]   = useState(false);

  const [saved, setSaved]               = useState(false);
  const [lb, setLb]                     = useState({ open: false, idx: 0 });
  const [alreadyApplied, setApplied]    = useState(false);

  // ── Load job ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!jobId) { setMissing(true); setLoading(false); return; }
    setLoading(true); setMissing(false);

    Promise.all([
      jobPostService.getJobPost(jobId).catch(() => null),
      jobPostService.getAllActiveJobs().catch(() => []),
      adminEmployerService.getAllEmployers().catch(() => []),
    ]).then(([found, list, employers]) => {
      if (!found) { setMissing(true); setLoading(false); return; }

      const empMap = (Array.isArray(employers) ? employers : [])
        .reduce((m, e) => { if (e.userId) m[e.userId] = e; return m; }, {});

      const emp = empMap[found.employerId] || null;
      setEmployer(emp);
      setJob({ ...found, companyLogo: emp?.companyLogo || null });

      // Suggestions: other standard jobs
      const others = (Array.isArray(list) ? list : [])
        .filter(j => j.idJob !== found.idJob)
        .map(j => ({ ...j, companyLogo: empMap[j.employerId]?.companyLogo || null }));
      setAllJobs(others);
    })
    .catch(() => setMissing(true))
    .finally(() => setLoading(false));

    jobPostService.incrementViews(jobId).catch(() => {});
  }, [jobId]);

  // ── Saved / applied state ─────────────────────────────────────────────────
  useEffect(() => {
    if (!job) return;
    const id = job.idJob;

    if (isAuthenticated && user?.role === 'candidate') {
      candidateProfileService.getMyProfile()
        .then(p => { if (Array.isArray(p?.savedJobs)) setSaved(p.savedJobs.includes(id)); })
        .catch(() => {});
      getMyCandidateApplications()
        .then(apps => { if (Array.isArray(apps)) setApplied(apps.some(a => a.jobId === id)); })
        .catch(() => {});
    } else {
      try { setSaved(JSON.parse(localStorage.getItem('public_saved_jobs') || '[]').includes(id)); } catch {}
    }
  }, [job, isAuthenticated, user]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleSave = async () => {
    if (!job) return;
    const id = job.idJob;
    const next = !saved;
    setSaved(next);
    if (isAuthenticated && user?.role === 'candidate') {
      try {
        await candidateProfileService.toggleSavedJob(id);
        toast.addToast({
          type: 'success',
          title: next ? 'Đã lưu tin' : 'Đã bỏ lưu',
          message: next ? 'Công việc đã được lưu vào danh sách của bạn.' : 'Đã xóa công việc khỏi danh sách lưu.',
          duration: 2500
        });
      } catch (err) {
        setSaved(!next);
        toast.addToast({
          type: 'error',
          title: 'Lỗi',
          message: 'Không thể lưu tin. Vui lòng thử lại.',
          duration: 3000
        });
      }
    } else {
      try {
        const ls = JSON.parse(localStorage.getItem('public_saved_jobs') || '[]');
        localStorage.setItem('public_saved_jobs', JSON.stringify(next ? [...ls, id] : ls.filter(x => x !== id)));
        toast.addToast({
          type: 'success',
          title: next ? 'Đã lưu tin' : 'Đã bỏ lưu',
          message: next ? 'Công việc đã được lưu.' : 'Đã xóa công việc khỏi danh sách lưu.',
          duration: 2500
        });
      } catch {
        setSaved(!next);
      }
    }
  };

  const handleApply = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { redirect: `/candidate/jobs/${jobId}` } });
      return;
    }
    // Navigate to JobListing and open apply modal via selectedJobId state
    navigate('/candidate/jobs', { state: { selectedJobId: `dynamo-${job.idJob}` } });
  };

  const openLb  = idx => setLb({ open: true, idx });
  const closeLb = ()  => setLb(s => ({ ...s, open: false }));
  const prevLb  = ()  => setLb(s => ({ ...s, idx: (s.idx - 1 + gallery.length) % gallery.length }));
  const nextLb  = ()  => setLb(s => ({ ...s, idx: (s.idx + 1) % gallery.length }));

  // ── Derived values ───────────────────────────────────────────────────────
  const title      = job?.title || '';
  const company    = employer?.companyName || '';
  const location   = job?.location || '';
  const salary     = job ? fmtSalary(job) : '';
  // Không có field experience trong DB — chỉ hiển thị nếu có trong requirements
  const expMatch   = (job?.requirements || '').match(/(\d+\s*năm\s*kinh\s*nghiệm|\d+\s*year)/i);
  const experience = expMatch ? expMatch[0] : null;
  // Không có deadline trong PostStandardJob — workDays là ngày làm việc
  const deadline   = null;
  const remaining  = null;
  const tags       = job ? tagsArr(job) : [];
  const isVerified = employer?.isVerified || employer?.approvalStatus === 'approved';

  const gallery = [
    employer?.companyBanner,
    ...(Array.isArray(employer?.companyImages) ? employer.companyImages : []),
    employer?.companyImage,
  ].filter(url => url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:'))).slice(0, 10);

  const industries  = employer?.industry
    ? (Array.isArray(employer.industry) ? employer.industry : [employer.industry])
    : [];
  const locParts    = location.split(',').map(s => s.trim()).filter(Boolean);
  const listRoute   = standalone ? '/candidate/jobs' : '/jobs';
  const homeRoute   = standalone ? '/candidate/dashboard' : '/';

  const suggested = allJobs
    .filter(j => {
      if (j.employerId === job?.employerId) return true;
      return tagsArr(j).some(t => tags.includes(t)) || j.location === location;
    })
    .slice(0, 3);

  // ── Reusable action row ────────────────────────────────────────────────────
  const Buttons = () => (
    <BtnRow>
      <ApplyBtn onClick={handleApply} disabled={alreadyApplied} whileTap={{ scale: .97 }}>
        <Send size={16} />
        {alreadyApplied ? 'Đã ứng tuyển' : 'Ứng tuyển ngay'}
      </ApplyBtn>
      <SaveBtn onClick={toggleSave} $saved={saved} whileTap={{ scale: .95 }}>
        <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
        {saved ? 'Đã lưu' : 'Lưu tin'}
      </SaveBtn>
    </BtnRow>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    const inner = (
      <PageWrapper>
        <Card>
          <Skeleton $h="12px" $w="240px" $mb="20px" />
          <Skeleton $h="28px" $w="60%" $mb="14px" />
          <Skeleton $h="70px" $mb="14px" />
          <Skeleton $h="44px" $w="50%" />
        </Card>
      </PageWrapper>
    );
    return standalone ? <DashboardLayout role="candidate">{inner}</DashboardLayout> : inner;
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (missing || !job) {
    const inner = (
      <PageWrapper>
        <Card style={{ textAlign: 'center', padding: '56px 32px' }}>
          <AlertCircle size={44} style={{ color: '#f59e0b', margin: '0 auto 14px' }} />
          <h2 style={{ marginBottom: 8 }}>Không tìm thấy tin tuyển dụng</h2>
          <p style={{ color: '#64748b', marginBottom: 18, fontSize: 14 }}>Tin đã bị xóa hoặc đường dẫn không hợp lệ.</p>
          <ApplyBtn onClick={() => navigate(listRoute)} style={{ display: 'inline-flex', width: 'auto', padding: '10px 22px' }}>
            <ChevronLeft size={15} /> Quay lại danh sách
          </ApplyBtn>
        </Card>
      </PageWrapper>
    );
    return standalone ? <DashboardLayout role="candidate">{inner}</DashboardLayout> : inner;
  }

  // ── Main render ────────────────────────────────────────────────────────────
  const inner = (
    <PageWrapper>
      {/* Nút quay lại */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: '1.5px solid #e2e8f0',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: '#64748b',
            transition: 'all .18s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#1e40af'; e.currentTarget.style.color = '#1e40af'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
        >
          <ChevronLeft size={15} /> Quay lại
        </button>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
        <Grid style={{ flex: 1, minWidth: 0 }}>
          {/* ── LEFT ────────────────────────────────────────────────────── */}
          <MainCol>

            {/* 1. Header */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <JobTitle>{title}</JobTitle>
                {isVerified && <VerifiedBadge><Check size={11} /> Đã xác thực</VerifiedBadge>}
              </div>

              {/* Tiles: chỉ hiện tile có data thực từ DB */}
              {(() => {
                const tiles = [
                  { icon: <DollarSign />, label: 'Mức lương', val: salary },
                  { icon: <MapPin />,     label: 'Địa điểm',  val: location || null },
                  { icon: <Clock />,      label: 'Giờ làm',   val: job.workHours ? fmtWorkHours(job.workHours) : null },
                  { icon: <Calendar />,   label: 'Ngày làm',  val: job.workDays ? fmtDate(job.workDays) : null },
                  ...(experience ? [{ icon: <Award />, label: 'Kinh nghiệm', val: experience }] : []),
                ].filter(t => t.val);

                if (tiles.length === 0) return null;
                return (
                  <InfoGrid style={{ gridTemplateColumns: `repeat(${Math.min(tiles.length, 3)}, 1fr)` }}>
                    {tiles.map((t, i) => (
                      <InfoTile key={i}>
                        <TileIcon>{t.icon}</TileIcon>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 1 }}>{t.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{t.val}</div>
                        </div>
                      </InfoTile>
                    ))}
                  </InfoGrid>
                );
              })()}



              {deadline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, marginBottom: 18,
                  color: remaining !== null && remaining <= 3 ? '#dc2626' : '#64748b' }}>
                  <Calendar size={14} style={{ color: remaining !== null && remaining <= 3 ? '#dc2626' : '#1e40af' }} />
                  <span>
                    Hạn nộp: <strong>{fmtDate(deadline)}</strong>
                    {remaining !== null && (
                      <span style={{ marginLeft: 6 }}>
                        {remaining > 0 ? `(Còn ${remaining} ngày)` : remaining === 0 ? '(Hôm nay là ngày cuối!)' : '(Đã hết hạn)'}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </Card>

            {/* 2. Chi tiết tin */}
            <Card>
              <SectionTitle>Chi tiết tin tuyển dụng</SectionTitle>
              {tags.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginRight: 7 }}>Yêu cầu:</span>
                  <PillGroup>{tags.map((t, i) => <Pill key={i}>{t}</Pill>)}</PillGroup>
                </div>
              )}
              {industries.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginRight: 7 }}>Chuyên môn:</span>
                  <PillGroup>
                    {industries.map((p, i) => (
                      <Pill key={i} $link onClick={() => navigate(listRoute, { state: { searchKeyword: p } })}>{p}</Pill>
                    ))}
                  </PillGroup>
                </div>
              )}
              {gallery.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 7 }}>Môi trường làm việc</div>
                  <GalleryRow>
                    {gallery.slice(0, 3).map((src, i) => (
                      <GThumb key={i} onClick={() => openLb(i)}>
                        <img src={src} alt={`Ảnh ${i + 1}`} onError={e => { e.target.parentElement.style.display = 'none'; }} />
                        {i === 2 && gallery.length > 3 && <GOverlay>+{gallery.length - 3}</GOverlay>}
                      </GThumb>
                    ))}
                  </GalleryRow>
                </div>
              )}
            </Card>

            {/* 3. Mô tả */}
            {job.description && (
              <Card>
                <SectionTitle>Mô tả công việc</SectionTitle>
                <RichText dangerouslySetInnerHTML={{ __html: richHtml(job.description) }} />
              </Card>
            )}

            {/* 4. Yêu cầu */}
            {job.requirements && (
              <Card>
                <SectionTitle>Yêu cầu ứng viên</SectionTitle>
                <RichText dangerouslySetInnerHTML={{ __html: richHtml(job.requirements) }} />
              </Card>
            )}

            {/* 5. Phúc lợi */}
            {job.benefits && (
              <Card>
                <SectionTitle>Phúc lợi &amp; môi trường</SectionTitle>
                <RichText dangerouslySetInnerHTML={{ __html: richHtml(job.benefits) }} />
              </Card>
            )}

            {/* 6. Địa điểm */}
            {(job.location || employer?.address) && (
              <Card>
                <SectionTitle>Địa điểm làm việc</SectionTitle>
                <p style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', marginBottom: 7 }}>
                  Địa chỉ theo chi nhánh tuyển dụng.
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                  <MapPin size={15} style={{ color: '#1e40af', marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 14 }}>{job.location || employer?.address}</span>
                </div>
              </Card>
            )}

            {/* 7. Thời gian làm việc */}
            {(job.workDays || job.workHours || job.workDate || (Array.isArray(job.workHoursList) && job.workHoursList.length > 0)) && (
              <Card>
                <SectionTitle>Thời gian làm việc</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {job.workDays && (
                    <div style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 14 }}>
                      <Calendar size={14} style={{ color: '#1e40af' }} />
                      <span><strong>Ngày làm:</strong> {job.workDays}</span>
                    </div>
                  )}
                  {job.workDate && (
                    <div style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 14 }}>
                      <Calendar size={14} style={{ color: '#1e40af' }} />
                      <span><strong>Ngày làm việc:</strong> {fmtDate(job.workDate)}</span>
                    </div>
                  )}
                  {job.workHours && (
                    <div style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 14 }}>
                      <Clock size={14} style={{ color: '#1e40af' }} />
                      <span><strong>Giờ làm:</strong> {fmtWorkHours(job.workHours)}</span>
                    </div>
                  )}
                  {Array.isArray(job.workHoursList) && job.workHoursList.length > 0 && (
                    <div style={{ marginTop: 3 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Các ca làm việc:</div>
                      {job.workHoursList.map((slot, i) => (
                        <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 14, marginBottom: 3 }}>
                          <Clock size={13} style={{ color: '#1e40af' }} />
                          <span>Ca {i + 1}: {slot.startTime} – {slot.endTime}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 8. Cách thức ứng tuyển */}
            <Card>
              <SectionTitle>Cách thức ứng tuyển</SectionTitle>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
                Ứng viên nộp hồ sơ trực tuyến bằng cách bấm <strong>Ứng tuyển ngay</strong> dưới đây.
              </p>
            </Card>


            {/* Nút hành động — cuối trang */}
            <Card><Buttons /></Card>

          </MainCol>

          {/* ── RIGHT (Sidebar) ──────────────────────────────────────── */}
          <SideCol>

            {/* Card 1: Thông tin công ty */}
            <Card $sm>
              <div style={{ display: 'flex', gap: 11, alignItems: 'center', marginBottom: 12 }}>
                <LogoBox>
                  {employer?.companyLogo
                    ? <img src={employer.companyLogo} alt={company} />
                    : (company || 'C').charAt(0).toUpperCase()}
                </LogoBox>
                {company && <div style={{ fontWeight: 700, fontSize: 15 }}>{company}</div>}
              </div>
              {employer?.companySize && <MetaRow><Users size={14} /><span>Quy mô: {employer.companySize}</span></MetaRow>}
              {(employer?.industry || industries[0]) && <MetaRow><Briefcase size={14} /><span>Lĩnh vực: {employer?.industry || industries[0]}</span></MetaRow>}
              {(employer?.address || location) && <MetaRow><MapPin size={14} /><span>Địa điểm: {employer?.address || location}</span></MetaRow>}
              {employer?.website && (
                <MetaRow>
                  <Globe size={14} />
                  <a href={employer.website} target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', fontSize: 13 }}>
                    {employer.website.replace(/^https?:\/\//, '')}
                  </a>
                </MetaRow>
              )}
              {employer?.userId && (
                <Link to={`/candidate/employer/${employer.userId}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#1e40af', marginTop: 10 }}>
                  <ExternalLink size={13} /> Xem trang công ty
                </Link>
              )}
            </Card>

            {/* Card 2: Danh mục nghề */}
            {(industries.length > 0 || tags.length > 0) && (
              <Card $sm>
                <SectionTitle style={{ marginBottom: 8 }}>Danh mục nghề liên quan</SectionTitle>
                <PillGroup>
                  {industries.map((p, i) => <Pill key={i} $link onClick={() => navigate(listRoute, { state: { searchKeyword: p } })}>{p}</Pill>)}
                  {tags.slice(0, 4).map((t, i) => <Pill key={`t${i}`} $link onClick={() => navigate(listRoute, { state: { searchKeyword: t } })}>{t}</Pill>)}
                </PillGroup>
              </Card>
            )}

            {/* Card 4: Khu vực */}
            {locParts.length > 0 && (
              <Card $sm>
                <SectionTitle style={{ marginBottom: 8 }}>Tìm việc theo khu vực</SectionTitle>
                <PillGroup>
                  {locParts.map((lp, i) => <Pill key={i} $link onClick={() => navigate(listRoute, { state: { searchLocation: lp } })}>{lp}</Pill>)}
                  {industries[0] && locParts[0] && (
                    <Pill $link onClick={() => navigate(listRoute, { state: { searchKeyword: industries[0], searchLocation: locParts[0] } })}>
                      Việc làm {industries[0]} tại {locParts[0]}
                    </Pill>
                  )}
                </PillGroup>
              </Card>
            )}

            {/* Card 5: Gợi ý việc làm */}
            {suggested.length > 0 && (
              <Card $sm>
                <SectionTitle style={{ marginBottom: 8 }}>Gợi ý việc làm phù hợp</SectionTitle>
                {suggested.map((sj, i) => (
                  <SugCard key={sj.idJob || i} onClick={() => navigate(`${standalone ? '/candidate' : ''}/jobs/${sj.idJob}`)}>
                    <SugLogo>
                      {sj.companyLogo
                        ? <img src={sj.companyLogo} alt="" />
                        : (sj.companyName || sj.employerEmail || '?').charAt(0).toUpperCase()}
                    </SugLogo>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{sj.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sj.companyName || sj.location || ''}
                      </div>
                    </div>
                  </SugCard>
                ))}
              </Card>
            )}

            {/* Card 6: Thông tin chung — data thực từ DB */}
            <Card $sm>
              <SectionTitle style={{ marginBottom: 8 }}>Thông tin chung</SectionTitle>
              {(() => {
                const rows = [];
                // Loại hình công việc (jobType từ DB)
                const jobTypeLabel = job.jobType === 'full-time' ? 'Toàn thời gian'
                  : job.jobType === 'part-time' ? 'Bán thời gian'
                  : job.jobType === 'internship' ? 'Thực tập'
                  : job.jobType === 'contract' ? 'Hợp đồng'
                  : job.jobType || null;
                if (jobTypeLabel) rows.push({ icon: <Briefcase size={15} />, label: 'Loại hình', val: jobTypeLabel });

                // Mức độ ưu tiên (urgencyLevel)
                const urgLabel = job.urgencyLevel === 'urgent' ? 'Tuyển gấp' : job.urgencyLevel === 'standard' ? 'Tiêu chuẩn' : null;
                if (urgLabel) rows.push({ icon: <Award size={15} />, label: 'Mức độ', val: urgLabel });

                // Đơn vị lương
                if (job.salaryUnit) {
                  const unitLabel = job.salaryUnit === 'month' ? 'Theo tháng' : job.salaryUnit === 'shift' ? 'Theo ca' : 'Theo giờ';
                  rows.push({ icon: <DollarSign size={15} />, label: 'Hình thức lương', val: unitLabel });
                }

                // Ngày làm việc
                if (job.workDays) rows.push({ icon: <Calendar size={15} />, label: 'Ngày làm việc', val: job.workDays });

                // Giờ làm
                if (job.workHours) rows.push({ icon: <Clock size={15} />, label: 'Giờ làm việc', val: fmtWorkHours(job.workHours) });

                // Tags (kỹ năng yêu cầu)
                if (tags.length > 0) rows.push({ icon: <Users size={15} />, label: 'Kỹ năng yêu cầu', val: tags.join(', ') });

                if (rows.length === 0) return (
                  <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>
                    Chưa có thông tin bổ sung
                  </div>
                );

                return rows.map((row, i) => (
                  <InfoItem key={i}>
                    {row.icon}
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{row.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{row.val}</div>
                    </div>
                  </InfoItem>
                ));
              })()}
            </Card>

          </SideCol>
        </Grid>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lb.open && (
          <LBOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeLb}>
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src={gallery[lb.idx]} alt="" style={{ maxWidth: '88vw', maxHeight: '78vh', borderRadius: 10, objectFit: 'contain' }} />
              <div style={{ color: '#fff', fontSize: 13, marginTop: 8 }}>{lb.idx + 1} / {gallery.length}</div>
            </div>
            {gallery.length > 1 && <>
              <LBNav $left onClick={e => { e.stopPropagation(); prevLb(); }}><ChevronLeft size={20} /></LBNav>
              <LBNav       onClick={e => { e.stopPropagation(); nextLb(); }}><ChevronRight size={20} /></LBNav>
            </>}
            <button onClick={closeLb} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,.14)', border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <X size={18} />
            </button>
          </LBOverlay>
        )}
      </AnimatePresence>
    </PageWrapper>
  );

  return standalone ? <DashboardLayout role="candidate"><Toast toasts={toast.toasts} removeToast={toast.removeToast} />{inner}</DashboardLayout> : <><Toast toasts={toast.toasts} removeToast={toast.removeToast} />{inner}</>;
};

export default JobDetail;
