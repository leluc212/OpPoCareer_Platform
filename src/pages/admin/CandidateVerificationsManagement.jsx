/**
 * CandidateVerificationsManagement.jsx
 * Trang admin duyệt / từ chối yêu cầu xác minh ứng viên
 * Design đồng bộ với CandidatesManagement.jsx
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import candidateProfileService from '../../services/candidateProfileService';
import {
  Shield, CheckCircle, XCircle, Clock, Search, RefreshCw,
  User, Mail, Phone, Calendar, Eye, BadgeCheck, AlertCircle,
  ChevronDown, X, FileText, Check
} from 'lucide-react';

// ─── Styled Components (same design tokens as CandidatesManagement) ──────────
const PageContainer = styled.div`
  animation: fadeIn 0.5s ease-in;
  @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
`;

const PageHeader = styled.div`
  margin-bottom: 28px;
  display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;
  @media (max-width: 768px) { flex-direction: column; margin-bottom: 16px; }
  h1 { font-size: 28px; font-weight: 700; margin-bottom: 6px; color: ${p => p.theme.colors.text}; }
  p  { color: ${p => p.theme.colors.textLight}; font-size: 14px; }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px; margin-bottom: 24px;
`;

const StatCard = styled(motion.div)`
  background: ${p => p.theme.colors.bgLight};
  border: 2px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.borderRadius.lg};
  padding: 20px;
  display: flex; align-items: center; gap: 16px;
  box-shadow: ${p => p.theme.shadows.card};
`;

const StatIcon = styled.div`
  width: 48px; height: 48px; border-radius: 12px;
  background: ${p => p.$bg}; display: flex; align-items: center; justify-content: center;
  svg { width: 22px; height: 22px; color: ${p => p.$color}; }
`;

const StatInfo = styled.div`
  .label { font-size: 12px; font-weight: 600; color: ${p => p.theme.colors.textLight}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .value { font-size: 26px; font-weight: 800; color: ${p => p.theme.colors.text}; }
`;

const FilterSection = styled.div`
  background: ${p => p.theme.colors.bgLight};
  padding: 16px 20px; border-radius: ${p => p.theme.borderRadius.lg};
  margin-bottom: 20px; border: 2px solid ${p => p.theme.colors.border};
  display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
`;

const SearchBox = styled.div`
  flex: 1; min-width: 240px; position: relative;
  svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
        color: ${p => p.theme.colors.textLight}; width: 16px; height: 16px; }
  input { width: 100%; padding: 10px 12px 10px 38px;
          border: 2px solid ${p => p.theme.colors.border};
          border-radius: ${p => p.theme.borderRadius.md};
          font-size: 14px; background: ${p => p.theme.colors.bgDark};
          color: ${p => p.theme.colors.text};
          &:focus { outline: none; border-color: ${p => p.theme.colors.primary}; }
          &::placeholder { color: ${p => p.theme.colors.textLight}; } }
`;

const FilterBtn = styled.button`
  padding: 9px 16px; border: 2px solid ${p => p.$active ? p.theme.colors.primary : p.theme.colors.border};
  background: ${p => p.$active ? p.theme.colors.primary : p.theme.colors.bgDark};
  color: ${p => p.$active ? 'white' : p.theme.colors.text};
  border-radius: ${p => p.theme.borderRadius.md};
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 6px;
  &:hover { border-color: ${p => p.theme.colors.primary}; }
  svg { width: 14px; height: 14px; }
`;

const ReloadButton = styled.button`
  display: flex; align-items: center; gap: 8px;
  padding: 9px 20px; background: ${p => p.theme.colors.primary}; color: white;
  border: none; border-radius: ${p => p.theme.borderRadius.md};
  font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap;
  &:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  .spinning { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const TableWrapper = styled.div`
  background: ${p => p.theme.colors.bgLight};
  border-radius: ${p => p.theme.borderRadius.lg};
  border: 2px solid ${p => p.theme.colors.border};
  overflow-x: auto; box-shadow: ${p => p.theme.shadows.card};
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse; min-width: 860px;
  th { text-align: left; padding: 14px 18px; background: ${p => p.theme.colors.bgDark};
       font-weight: 700; font-size: 12px; color: ${p => p.theme.colors.textLight};
       text-transform: uppercase; letter-spacing: 0.5px;
       border-bottom: 2px solid ${p => p.theme.colors.border}; white-space: nowrap; }
  td { padding: 14px 18px; border-bottom: 1px solid ${p => p.theme.colors.border};
       font-size: 14px; color: ${p => p.theme.colors.text}; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr { transition: all 0.2s; &:hover { background: ${p => p.theme.colors.bgDark}; } }
`;

const StatusBadge = styled.span`
  padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700;
  display: inline-flex; align-items: center; gap: 5px;
  background: ${p => ({ SUBMITTED: '#fef3c7', APPROVED: '#dcfce7', REJECTED: '#fee2e2', PENDING: '#f3f4f6' })[p.$s] || '#f3f4f6'};
  color: ${p => ({ SUBMITTED: '#d97706', APPROVED: '#15803d', REJECTED: '#dc2626', PENDING: '#6b7280' })[p.$s] || '#6b7280'};
  svg { width: 13px; height: 13px; }
`;

const ApproveBtn = styled.button`
  padding: 6px 14px; border: none; border-radius: ${p => p.theme.borderRadius.md};
  background: #10b981; color: white; font-size: 13px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; gap: 5px; transition: all 0.2s;
  &:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
  svg { width: 14px; height: 14px; }
`;

const RejectBtn = styled(ApproveBtn)`
  background: #ef4444;
  &:hover { background: #dc2626; box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
`;

const ViewBtn = styled.button`
  padding: 6px 12px; border: 2px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgDark}; color: ${p => p.theme.colors.text};
  border-radius: ${p => p.theme.borderRadius.md}; font-size: 13px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s;
  &:hover { border-color: ${p => p.theme.colors.primary}; color: ${p => p.theme.colors.primary}; }
  svg { width: 14px; height: 14px; }
`;

const EmptyState = styled.div`
  text-align: center; padding: 60px 24px; color: ${p => p.theme.colors.textLight};
  svg { width: 48px; height: 48px; margin: 0 auto 16px; display: block; opacity: 0.4; }
  p { font-size: 15px; font-weight: 600; }
`;

// ─── Detail Drawer / Modal ────────────────────────────────────────────────────
const DrawerOverlay = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000;
  display: flex; align-items: center; justify-content: flex-end;
`;

const Drawer = styled(motion.div)`
  width: 480px; max-width: 100vw; height: 100vh;
  background: ${p => p.theme.colors.bgLight};
  border-left: 2px solid ${p => p.theme.colors.border};
  overflow-y: auto; display: flex; flex-direction: column;
  box-shadow: -8px 0 32px rgba(0,0,0,0.15);
`;

const DrawerHeader = styled.div`
  padding: 24px; border-bottom: 2px solid ${p => p.theme.colors.border};
  display: flex; align-items: center; justify-content: space-between;
  h2 { font-size: 18px; font-weight: 700; color: ${p => p.theme.colors.text};
       display: flex; align-items: center; gap: 10px;
       svg { width: 20px; height: 20px; color: ${p => p.theme.colors.primary}; } }
  button { background: none; border: none; cursor: pointer; padding: 4px;
           color: ${p => p.theme.colors.textLight};
           &:hover { color: ${p => p.theme.colors.text}; }
           svg { width: 20px; height: 20px; } }
`;

const DrawerBody = styled.div`padding: 24px; flex: 1;`;

const InfoRow = styled.div`
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 0; border-bottom: 1px solid ${p => p.theme.colors.border};
  &:last-child { border-bottom: none; }
  svg { width: 18px; height: 18px; color: ${p => p.theme.colors.primary}; flex-shrink: 0; margin-top: 1px; }
  .lbl { font-size: 12px; font-weight: 600; color: ${p => p.theme.colors.textLight}; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.4px; }
  .val { font-size: 14px; font-weight: 600; color: ${p => p.theme.colors.text}; }
`;

const DrawerFooter = styled.div`
  padding: 20px 24px; border-top: 2px solid ${p => p.theme.colors.border};
  display: flex; gap: 10px;
`;

const NoteInput = styled.textarea`
  width: 100%; padding: 10px 12px;
  border: 2px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.borderRadius.md};
  font-size: 13px; font-family: inherit; color: ${p => p.theme.colors.text};
  background: ${p => p.theme.colors.bgDark}; resize: vertical; min-height: 72px;
  margin-bottom: 12px;
  &:focus { outline: none; border-color: ${p => p.theme.colors.primary}; }
  &::placeholder { color: ${p => p.theme.colors.textLight}; }
`;

const KycBadge = styled.div`
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px;
  border-radius: 100px; font-size: 13px; font-weight: 700;
  background: ${p => p.$done ? '#dcfce7' : '#fee2e2'};
  color: ${p => p.$done ? '#15803d' : '#dc2626'};
  svg { width: 15px; height: 15px; }
`;

// ─── Component ────────────────────────────────────────────────────────────────
const CandidateVerificationsManagement = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const vi = language === 'vi';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const t = (v, e) => vi ? v : e;

  const load = async () => {
    setLoading(true);
    try {
      // Fetch all candidates and filter by verificationStatus
      const all = await candidateProfileService.getAllCandidates();
      const filtered = all.filter(c =>
        c.verificationStatus && c.verificationStatus !== 'PENDING'
      );
      setItems(filtered.map(c => ({
        id: c.userId || c.id,
        name: c.fullName || c.email?.split('@')[0] || 'Unknown',
        email: c.email || '',
        phone: c.phone || '',
        location: c.location || '',
        verificationStatus: c.verificationStatus || 'PENDING',
        verificationSubmittedAt: c.verificationSubmittedAt || '',
        verificationApprovedAt: c.verificationApprovedAt || '',
        verificationRejectedAt: c.verificationRejectedAt || '',
        verificationNote: c.verificationNote || '',
        kycDone: c.kycCompleted || c.ekycStatus === 'verified' || false,
        profileCompletion: c.profileCompletion || 0,
        title: c.title || '',
        createdAt: c.createdAt || '',
        bio: c.bio || '',
        skills: c.skills || [],
      })));
    } catch (e) {
      console.error('Error loading verifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (candidateId) => {
    setActionLoading(true);
    try {
      await candidateProfileService.approveVerification(candidateId, note);
      setItems(prev => prev.map(i => i.id === candidateId
        ? { ...i, verificationStatus: 'APPROVED', verificationApprovedAt: new Date().toISOString() }
        : i
      ));
      setSelected(null); setNote('');
    } catch (e) {
      alert(t('Lỗi khi duyệt. Vui lòng thử lại.', 'Error approving. Please try again.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (candidateId) => {
    if (!note.trim()) {
      alert(t('Vui lòng nhập lý do từ chối.', 'Please enter a rejection reason.'));
      return;
    }
    setActionLoading(true);
    try {
      await candidateProfileService.rejectVerification(candidateId, note);
      setItems(prev => prev.map(i => i.id === candidateId
        ? { ...i, verificationStatus: 'REJECTED', verificationRejectedAt: new Date().toISOString(), verificationNote: note }
        : i
      ));
      setSelected(null); setNote('');
    } catch (e) {
      alert(t('Lỗi khi từ chối. Vui lòng thử lại.', 'Error rejecting. Please try again.'));
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = items.filter(i => {
    const matchSearch = !searchTerm ||
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || i.verificationStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    ALL: items.length,
    SUBMITTED: items.filter(i => i.verificationStatus === 'SUBMITTED').length,
    APPROVED: items.filter(i => i.verificationStatus === 'APPROVED').length,
    REJECTED: items.filter(i => i.verificationStatus === 'REJECTED').length,
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
  const statusLabel = (s) => ({ SUBMITTED: t('Chờ duyệt','Pending'), APPROVED: t('Đã duyệt','Approved'), REJECTED: t('Từ chối','Rejected'), PENDING: t('Chưa gửi','Not sent') })[s] || s;
  const statusIcon = (s) => ({ SUBMITTED: <Clock />, APPROVED: <CheckCircle />, REJECTED: <XCircle />, PENDING: <AlertCircle /> })[s] || null;

  return (
    <DashboardLayout role="admin" key={language}>
      <PageContainer>

        <PageHeader>
          <div>
            <h1>{t('Duyệt Xác Minh Ứng Viên', 'Candidate Verifications')}</h1>
            <p>{t('Xem xét và phê duyệt yêu cầu xác minh từ ứng viên', 'Review and approve verification requests from candidates')}</p>
          </div>
        </PageHeader>

        {/* Stats */}
        <StatsRow>
          {[
            { label: t('Tổng yêu cầu','Total'), value: counts.ALL, color: '#1e40af', bg: '#EFF6FF', icon: Shield },
            { label: t('Chờ duyệt','Pending'), value: counts.SUBMITTED, color: '#d97706', bg: '#fef3c7', icon: Clock },
            { label: t('Đã duyệt','Approved'), value: counts.APPROVED, color: '#10b981', bg: '#dcfce7', icon: BadgeCheck },
            { label: t('Từ chối','Rejected'), value: counts.REJECTED, color: '#ef4444', bg: '#fee2e2', icon: XCircle },
          ].map((s, i) => (
            <StatCard key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <StatIcon $color={s.color} $bg={s.bg}><s.icon /></StatIcon>
              <StatInfo><div className="label">{s.label}</div><div className="value">{s.value}</div></StatInfo>
            </StatCard>
          ))}
        </StatsRow>

        {/* Filters */}
        <FilterSection>
          <SearchBox>
            <Search />
            <input
              placeholder={t('Tìm theo tên hoặc email...', 'Search by name or email...')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </SearchBox>
          {['ALL','SUBMITTED','APPROVED','REJECTED'].map(s => (
            <FilterBtn key={s} $active={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {s === 'ALL' ? t('Tất cả','All') : statusLabel(s)}
              {counts[s] > 0 && <span style={{ background: statusFilter === s ? 'rgba(255,255,255,0.25)' : '#e5e7eb', borderRadius: 999, padding: '0 6px', fontSize: 11 }}>{counts[s]}</span>}
            </FilterBtn>
          ))}
          <ReloadButton onClick={load} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            {loading ? t('Đang tải...','Loading...') : t('Làm mới','Refresh')}
          </ReloadButton>
        </FilterSection>

        {/* Table */}
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <th>{t('Ứng viên','Candidate')}</th>
                <th>{t('eKYC','eKYC')}</th>
                <th>{t('Hoàn thiện hồ sơ','Profile')}</th>
                <th>{t('Ngày gửi','Submitted')}</th>
                <th>{t('Trạng thái','Status')}</th>
                <th>{t('Thao tác','Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <EmptyState>
                      <Shield />
                      <p>{loading ? t('Đang tải...','Loading...') : t('Không có yêu cầu nào','No verification requests found')}</p>
                    </EmptyState>
                  </td>
                </tr>
              ) : filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={11} />{item.email}
                    </div>
                  </td>
                  <td>
                    <KycBadge $done={item.kycDone}>
                      {item.kycDone ? <CheckCircle /> : <XCircle />}
                      {item.kycDone ? t('Đã xác minh','Verified') : t('Chưa','Not done')}
                    </KycBadge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                        <div style={{ height: '100%', width: `${item.profileCompletion}%`, background: item.profileCompletion >= 60 ? '#10b981' : '#f59e0b', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: item.profileCompletion >= 60 ? '#10b981' : '#f59e0b' }}>
                        {item.profileCompletion}%
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={13} />{fmtDate(item.verificationSubmittedAt)}
                    </div>
                  </td>
                  <td>
                    <StatusBadge $s={item.verificationStatus}>
                      {statusIcon(item.verificationStatus)}
                      {statusLabel(item.verificationStatus)}
                    </StatusBadge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <ViewBtn onClick={() => { setSelected(item); setNote(item.verificationNote || ''); }}>
                        <Eye />{t('Xem','View')}
                      </ViewBtn>
                      {item.verificationStatus === 'SUBMITTED' && (
                        <>
                          <ApproveBtn onClick={() => handleApprove(item.id)}>
                            <Check />{t('Duyệt','Approve')}
                          </ApproveBtn>
                          <RejectBtn onClick={() => { setSelected(item); setNote(''); }}>
                            <X />{t('Từ chối','Reject')}
                          </RejectBtn>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>

      </PageContainer>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <DrawerOverlay
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <Drawer
              initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              onClick={e => e.stopPropagation()}
            >
              <DrawerHeader>
                <h2><Shield />{t('Chi tiết xác minh','Verification Detail')}</h2>
                <button onClick={() => setSelected(null)}><X /></button>
              </DrawerHeader>

              <DrawerBody>
                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: '#F8FAFC', borderRadius: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 22, fontWeight: 800 }}>
                    {selected.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{selected.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{selected.title || t('Ứng viên','Candidate')}</div>
                    <StatusBadge $s={selected.verificationStatus} style={{ marginTop: 4 }}>
                      {statusIcon(selected.verificationStatus)}{statusLabel(selected.verificationStatus)}
                    </StatusBadge>
                  </div>
                </div>

                {/* Info */}
                <InfoRow><Mail /><div><div className="lbl">Email</div><div className="val">{selected.email}</div></div></InfoRow>
                <InfoRow><Phone /><div><div className="lbl">{t('Điện thoại','Phone')}</div><div className="val">{selected.phone || '—'}</div></div></InfoRow>
                <InfoRow><User /><div><div className="lbl">{t('Địa chỉ','Location')}</div><div className="val">{selected.location || '—'}</div></div></InfoRow>
                <InfoRow>
                  <Shield />
                  <div>
                    <div className="lbl">eKYC</div>
                    <KycBadge $done={selected.kycDone}>
                      {selected.kycDone ? <CheckCircle /> : <XCircle />}
                      {selected.kycDone ? t('Đã xác minh CCCD + khuôn mặt','ID + face verified') : t('Chưa xác minh','Not verified')}
                    </KycBadge>
                  </div>
                </InfoRow>
                <InfoRow>
                  <FileText />
                  <div>
                    <div className="lbl">{t('Hoàn thiện hồ sơ','Profile completion')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${selected.profileCompletion}%`, background: selected.profileCompletion >= 60 ? '#10b981' : '#f59e0b', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 14, color: selected.profileCompletion >= 60 ? '#10b981' : '#f59e0b' }}>{selected.profileCompletion}%</span>
                    </div>
                  </div>
                </InfoRow>
                {selected.bio && <InfoRow><FileText /><div><div className="lbl">Bio</div><div className="val" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{selected.bio}</div></div></InfoRow>}
                {selected.skills?.length > 0 && (
                  <InfoRow>
                    <BadgeCheck />
                    <div>
                      <div className="lbl">{t('Kỹ năng','Skills')}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {selected.skills.map((s, i) => (
                          <span key={i} style={{ padding: '3px 10px', background: '#EFF6FF', color: '#1e40af', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </InfoRow>
                )}
                <InfoRow><Calendar /><div><div className="lbl">{t('Ngày gửi yêu cầu','Submitted at')}</div><div className="val">{fmtDate(selected.verificationSubmittedAt)}</div></div></InfoRow>
                {selected.verificationNote && (
                  <InfoRow><AlertCircle /><div><div className="lbl">{t('Ghi chú admin','Admin note')}</div><div className="val">{selected.verificationNote}</div></div></InfoRow>
                )}

                {/* Note input for approve/reject */}
                {selected.verificationStatus === 'SUBMITTED' && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {t('Ghi chú (bắt buộc khi từ chối)','Note (required when rejecting)')}
                    </div>
                    <NoteInput
                      placeholder={t('Nhập ghi chú cho ứng viên...','Enter a note for the candidate...')}
                      value={note}
                      onChange={e => setNote(e.target.value)}
                    />
                  </div>
                )}

                {/* Quick view link */}
                <button
                  onClick={() => navigate(`/admin/candidates/${selected.id}`)}
                  style={{ marginTop: 16, width: '100%', padding: '10px', border: '2px solid #E2E8F0', background: 'white', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#1e40af' }}
                >
                  <Eye size={15} />{t('Xem hồ sơ đầy đủ','View full profile')}
                </button>
              </DrawerBody>

              {selected.verificationStatus === 'SUBMITTED' && (
                <DrawerFooter>
                  <ApproveBtn style={{ flex: 1, justifyContent: 'center', padding: '12px' }} onClick={() => handleApprove(selected.id)} disabled={actionLoading}>
                    <CheckCircle size={16} />{actionLoading ? t('Đang xử lý...','Processing...') : t('Phê duyệt','Approve')}
                  </ApproveBtn>
                  <RejectBtn style={{ flex: 1, justifyContent: 'center', padding: '12px' }} onClick={() => handleReject(selected.id)} disabled={actionLoading}>
                    <XCircle size={16} />{actionLoading ? t('Đang xử lý...','Processing...') : t('Từ chối','Reject')}
                  </RejectBtn>
                </DrawerFooter>
              )}
            </Drawer>
          </DrawerOverlay>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default CandidateVerificationsManagement;
