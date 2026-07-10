/**
 * ExperienceManagement.jsx  –  Admin page
 * Route: /admin/experiences
 *
 * Lists all candidate work-experience submissions.
 * Admin can filter by status, view proof images, approve or reject.
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Search,
  Eye,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Image,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../hooks/useToast';
import {
  getAllExperiences,
  approveExperience,
  rejectExperience,
} from '../../services/experienceService';

// ─── Styled Components ─────────────────────────────────────────────────────────

const Container = styled.div`
  padding: ${p => p.$embedded ? '0' : '32px'};
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) { padding: ${p => p.$embedded ? '0' : '16px'}; }
`;

const PageHeader = styled.div`
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 32px;
`;

const PageIconBox = styled.div`
  width: 52px; height: 52px; border-radius: 15px;
  background: #eff6ff; border: 1.5px solid #bfdbfe;
  display: flex; align-items: center; justify-content: center;
  svg { width: 22px; height: 22px; color: #1e40af; }
`;

const PageTitleText = styled.div`
  h1 { font-size: 26px; font-weight: 800; color: ${p => p.theme.colors.text}; margin-bottom: 4px; }
  p  { font-size: 13.5px; color: ${p => p.theme.colors.textLight}; font-weight: 500; }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px; margin-bottom: 24px;
`;

const StatCard = styled.div`
  padding: 20px; background: white;
  border: 1.5px solid #e8efff; border-radius: 12px;
  transition: all 0.2s;
  &:hover { border-color: #bfdbfe; box-shadow: 0 4px 12px rgba(30,64,175,0.1); }
  .v { font-size: 28px; font-weight: 800; color: ${p => p.$c || '#1e40af'}; margin-bottom: 4px; }
  .l { font-size: 13px; color: #64748b; font-weight: 600; }
`;

const FilterBar = styled.div`
  display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;
`;

const SearchBox = styled.div`
  flex: 1; min-width: 280px; position: relative;
  svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #64748b; }
  input {
    width: 100%; padding: 11px 14px 11px 42px;
    border: 1.5px solid #e8efff; border-radius: 12px; font-size: 14px;
    transition: all 0.2s;
    &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  }
`;

const FilterBtn = styled.button`
  padding: 11px 18px; border-radius: 10px; font-size: 13px;
  font-weight: 600; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 6px;
  border: 1.5px solid;
  ${p => p.$active
    ? 'background:#1e40af;color:white;border-color:#1e40af;'
    : 'background:white;color:#64748b;border-color:#e8efff;&:hover{background:#f8fafc;border-color:#bfdbfe;}'}
  svg { width: 15px; height: 15px; }
`;

const TableWrap = styled.div`
  background: white; border: 1.5px solid #e8efff; border-radius: 16px; overflow: hidden;
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse;
`;

const Thead = styled.thead`
  background: #f8fafc; border-bottom: 2px solid #e8efff;
`;

const Th = styled.th`
  padding: 14px 16px; text-align: left; font-size: 12px;
  font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;
`;

const Tr = styled.tr`
  border-bottom: 1px solid #f1f5f9; transition: background 0.15s;
  &:hover { background: #f8fafc; }
  &:last-child { border-bottom: none; }
`;

const Td = styled.td`
  padding: 14px 16px; font-size: 14px; color: #1e293b;
  vertical-align: middle;
`;

const StatusBadge = styled.span`
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: 700;
  ${p => p.$s === 'APPROVED' && 'background:#d1fae5;color:#065f46;border:1.5px solid #34d399;'}
  ${p => p.$s === 'PENDING'  && 'background:#fef3c7;color:#92400e;border:1.5px solid #fcd34d;'}
  ${p => p.$s === 'REJECTED' && 'background:#fee2e2;color:#991b1b;border:1.5px solid #fca5a5;'}
  svg { width: 12px; height: 12px; }
`;

const ActionBtn = styled.button`
  padding: 7px 14px; border-radius: 8px; font-size: 13px;
  font-weight: 600; cursor: pointer; transition: all 0.2s;
  display: inline-flex; align-items: center; gap: 5px;
  border: 1.5px solid; margin-right: 6px;
  ${p => p.$variant === 'approve' && 'background:#d1fae5;color:#065f46;border-color:#34d399;&:hover{background:#a7f3d0;}'}
  ${p => p.$variant === 'reject'  && 'background:#fee2e2;color:#991b1b;border-color:#fca5a5;&:hover{background:#fecaca;}'}
  ${p => p.$variant === 'view'    && 'background:#eff6ff;color:#1e40af;border-color:#bfdbfe;&:hover{background:#dbeafe;}'}
  svg { width: 14px; height: 14px; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const EmptyState = styled.div`
  padding: 60px 20px; text-align: center;
  .icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
  h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
  p  { font-size: 14px; color: #64748b; }
`;

// ── Detail Modal ──────────────────────────────────────────────────────────────

const Overlay = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px;
`;

const ModalBox = styled(motion.div)`
  background: #fff; border-radius: 20px; padding: 32px;
  width: 100%; max-width: 640px; max-height: 92vh; overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2);
  @media (max-width: 640px) { padding: 20px 16px; }
`;

const ModalHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;
  h3 { font-size: 20px; font-weight: 800; color: #1e293b; }
  button {
    background: #f1f5f9; border: none; border-radius: 8px;
    width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #64748b;
    &:hover { background: #e2e8f0; }
    svg { width: 18px; height: 18px; }
  }
`;

const DetailRow = styled.div`
  display: flex; gap: 8px; margin-bottom: 12px; font-size: 14px;
  .lbl { color: #64748b; font-weight: 600; min-width: 130px; }
  .val { color: #1e293b; }
`;

const ProofGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(120px,1fr)); gap: 10px; margin-top: 12px;
`;

const ProofThumb = styled.div`
  position: relative; aspect-ratio: 1; border-radius: 10px;
  overflow: hidden; border: 1.5px solid #e2e8f0; cursor: pointer;
  img { width: 100%; height: 100%; object-fit: cover; }
  &:hover img { opacity: 0.85; }
`;

const RejectForm = styled.div`
  margin-top: 16px;
  textarea {
    width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0;
    border-radius: 10px; font-size: 14px; resize: vertical; min-height: 80px;
    box-sizing: border-box;
    &:focus { outline: none; border-color: #ef4444; }
  }
`;

const ModalFooter = styled.div`
  display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px;
  button {
    padding: 11px 22px; border-radius: 10px; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; border: 1.5px solid;
  }
  .cancel { background:#f1f5f9; border-color:#e2e8f0; color:#374151; &:hover{background:#e2e8f0;} }
  .approve { background:#065f46; color:white; border-color:#065f46; &:hover{background:#047857;} }
  .reject  { background:#991b1b; color:white; border-color:#991b1b; &:hover{background:#b91c1c;} }
  button:disabled { opacity:0.5; cursor:not-allowed; }
`;

// Lightbox
const Lightbox = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 2000;
  display: flex; align-items: center; justify-content: center;
  img { max-width: 92vw; max-height: 88vh; border-radius: 12px; object-fit: contain; }
`;

const LightboxNav = styled.button`
  position: absolute; top: 50%; transform: translateY(-50%);
  background: rgba(255,255,255,0.15); border: none; border-radius: 50%;
  width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: white; font-size: 22px;
  &:hover { background: rgba(255,255,255,0.3); }
  ${p => p.$left ? 'left: 16px;' : 'right: 16px;'}
  svg { width: 22px; height: 22px; }
`;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS_VI = ['','Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'];

function fmtPeriod(exp) {
  const s = `${MONTHS_VI[exp.startMonth] || exp.startMonth}/${exp.startYear}`;
  const e = exp.isCurrent ? 'Hiện tại'
    : exp.endMonth && exp.endYear ? `${MONTHS_VI[exp.endMonth]}/${exp.endYear}` : '';
  return e ? `${s} – ${e}` : s;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN');
}

function statusLabel(s, lang) {
  const m = {
    APPROVED: lang === 'vi' ? 'Đã duyệt' : 'Approved',
    PENDING:  lang === 'vi' ? 'Chờ duyệt': 'Pending',
    REJECTED: lang === 'vi' ? 'Từ chối'  : 'Rejected',
  };
  return m[s] || s;
}

function statusIconEl(s) {
  if (s === 'APPROVED') return <CheckCircle />;
  if (s === 'REJECTED') return <XCircle />;
  return <Clock />;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ExperienceManagement = ({ embedded = false }) => {
  const { language } = useLanguage();
  const toast = useToast();
  const vi = language === 'vi';

  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected]       = useState(null);   // item in modal
  const [rejectReason, setRejectReason] = useState('');
  const [rejectMode, setRejectMode]   = useState(false);
  const [acting, setActing]           = useState(false);

  // Lightbox
  const [lbImages, setLbImages]   = useState([]);
  const [lbIndex, setLbIndex]     = useState(0);
  const [showLb, setShowLb]       = useState(false);

  // Polling every 30 s
  const loadData = useCallback(async () => {
    try {
      const data = await getAllExperiences(statusFilter === 'all' ? 'all' : statusFilter.toUpperCase());
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    loadData();
    const id = setInterval(loadData, 30_000);
    return () => clearInterval(id);
  }, [loadData]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const filtered = items.filter(it => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      it.companyName?.toLowerCase().includes(q) ||
      it.jobTitle?.toLowerCase().includes(q) ||
      it.candidateId?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total:    items.length,
    pending:  items.filter(i => i.status === 'PENDING').length,
    approved: items.filter(i => i.status === 'APPROVED').length,
    rejected: items.filter(i => i.status === 'REJECTED').length,
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function doApprove(experienceId) {
    setActing(true);
    try {
      await approveExperience(experienceId);
      toast.success(vi ? 'Đã duyệt kinh nghiệm!' : 'Experience approved!');
      setSelected(null);
      await loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActing(false);
    }
  }

  async function doReject(experienceId) {
    if (!rejectReason.trim()) {
      toast.error(vi ? 'Vui lòng nhập lý do từ chối' : 'Please enter a rejection reason');
      return;
    }
    setActing(true);
    try {
      await rejectExperience(experienceId, rejectReason.trim());
      toast.success(vi ? 'Đã từ chối!' : 'Rejected!');
      setSelected(null);
      setRejectReason('');
      setRejectMode(false);
      await loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActing(false);
    }
  }

  function openDetail(item) {
    setSelected(item);
    setRejectReason('');
    setRejectMode(false);
  }

  function openLightbox(images, idx) {
    setLbImages(images);
    setLbIndex(idx);
    setShowLb(true);
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Container $embedded={embedded}>
      {/* Header – ẩn khi nhúng vào tab */}
      {!embedded && (
      <PageHeader>
        <PageIconBox><Briefcase /></PageIconBox>
        <PageTitleText>
          <h1>{vi ? 'Kinh nghiệm chờ duyệt' : 'Experience Review'}</h1>
          <p>{vi ? 'Duyệt kinh nghiệm làm việc của ứng viên' : "Review candidates' work experience submissions"}</p>
        </PageTitleText>
      </PageHeader>
      )}

      {/* Stats */}
      <StatsGrid>
        <StatCard $c="#1e40af"><div className="v">{stats.total}</div><div className="l">{vi ? 'Tổng số' : 'Total'}</div></StatCard>
        <StatCard $c="#f59e0b"><div className="v">{stats.pending}</div><div className="l">{vi ? 'Chờ duyệt' : 'Pending'}</div></StatCard>
        <StatCard $c="#10b981"><div className="v">{stats.approved}</div><div className="l">{vi ? 'Đã duyệt' : 'Approved'}</div></StatCard>
        <StatCard $c="#ef4444"><div className="v">{stats.rejected}</div><div className="l">{vi ? 'Từ chối' : 'Rejected'}</div></StatCard>
      </StatsGrid>

      {/* Filters */}
      <FilterBar>
        <SearchBox>
          <Search />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={vi ? 'Tìm theo tên công ty, vị trí...' : 'Search company, position...'}
          />
        </SearchBox>
        {['all', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <FilterBtn key={s} $active={statusFilter === s} onClick={() => setStatusFilter(s)}>
            {s === 'all'      && (vi ? 'Tất cả' : 'All')}
            {s === 'PENDING'  && <><Clock />{vi ? 'Chờ duyệt' : 'Pending'}</>}
            {s === 'APPROVED' && <><CheckCircle />{vi ? 'Đã duyệt' : 'Approved'}</>}
            {s === 'REJECTED' && <><XCircle />{vi ? 'Từ chối' : 'Rejected'}</>}
          </FilterBtn>
        ))}
      </FilterBar>

      {/* Table */}
      <TableWrap>
        {loading ? (
          <EmptyState><div className="icon">⏳</div><h3>{vi ? 'Đang tải...' : 'Loading...'}</h3></EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState>
            <div className="icon">📋</div>
            <h3>{vi ? 'Không có dữ liệu' : 'No data'}</h3>
            <p>{vi ? 'Chưa có kinh nghiệm nào phù hợp với bộ lọc' : 'No experiences match the current filter'}</p>
          </EmptyState>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>{vi ? 'Ứng viên' : 'Candidate'}</Th>
                <Th>{vi ? 'Công ty' : 'Company'}</Th>
                <Th>{vi ? 'Vị trí' : 'Position'}</Th>
                <Th>{vi ? 'Ngày gửi' : 'Submitted'}</Th>
                <Th>{vi ? 'Trạng thái' : 'Status'}</Th>
                <Th>{vi ? 'Thao tác' : 'Actions'}</Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.map(it => (
                <Tr key={it.experienceId}>
                  <Td>
                    <div>
                      <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{it.candidateId?.slice(0, 8)}…</span>
                      {it.candidateName && (
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{it.candidateName}</div>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={14} color="#64748b" />
                      <strong>{it.companyName}</strong>
                    </div>
                  </Td>
                  <Td>{it.jobTitle}</Td>
                  <Td style={{ fontSize: 13, color: '#64748b' }}>{fmtDate(it.createdAt)}</Td>
                  <Td>
                    <StatusBadge $s={it.status}>
                      {statusIconEl(it.status)}
                      {statusLabel(it.status, language)}
                    </StatusBadge>
                  </Td>
                  <Td>
                    <ActionBtn $variant="view" onClick={() => openDetail(it)}>
                      <Eye />{vi ? 'Xem' : 'View'}
                    </ActionBtn>
                    {it.status === 'PENDING' && (
                      <>
                        <ActionBtn $variant="approve" disabled={acting} onClick={() => doApprove(it.experienceId)}>
                          <Check />
                        </ActionBtn>
                        <ActionBtn $variant="reject" disabled={acting} onClick={() => { openDetail(it); setRejectMode(true); }}>
                          <X />
                        </ActionBtn>
                      </>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </TableWrap>

      {/* ── Detail Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <Overlay
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setSelected(null)}
          >
            <ModalBox initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <ModalHeader>
                <h3>{vi ? 'Chi tiết kinh nghiệm' : 'Experience Detail'}</h3>
                <button onClick={() => setSelected(null)}><X /></button>
              </ModalHeader>

              <DetailRow>
                <span className="lbl">{vi ? 'Ứng viên ID' : 'Candidate ID'}</span>
                <span className="val" style={{ fontFamily: 'monospace', fontSize: 13 }}>{selected.candidateId}</span>
              </DetailRow>
              {selected.candidateName && (
                <DetailRow>
                  <span className="lbl">{vi ? 'Tên ứng viên' : 'Candidate Name'}</span>
                  <span className="val"><strong>{selected.candidateName}</strong></span>
                </DetailRow>
              )}
              <DetailRow>
                <span className="lbl">{vi ? 'Công ty' : 'Company'}</span>
                <span className="val"><strong>{selected.companyName}</strong></span>
              </DetailRow>
              <DetailRow>
                <span className="lbl">{vi ? 'Vị trí' : 'Position'}</span>
                <span className="val">{selected.jobTitle}</span>
              </DetailRow>
              <DetailRow>
                <span className="lbl">{vi ? 'Thời gian' : 'Period'}</span>
                <span className="val">{fmtPeriod(selected)}</span>
              </DetailRow>
              <DetailRow>
                <span className="lbl">{vi ? 'Trạng thái' : 'Status'}</span>
                <StatusBadge $s={selected.status}>
                  {statusIconEl(selected.status)}
                  {statusLabel(selected.status, language)}
                </StatusBadge>
              </DetailRow>
              {selected.description && (
                <DetailRow style={{ flexDirection: 'column', gap: 6 }}>
                  <span className="lbl">{vi ? 'Mô tả' : 'Description'}</span>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {selected.description}
                  </p>
                </DetailRow>
              )}

              {/* Proof images */}
              {selected.proofImages?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                    {vi ? 'Hình ảnh chứng minh' : 'Proof Images'}
                  </p>
                  <ProofGrid>
                    {selected.proofImages.map((url, i) => (
                      <ProofThumb key={i} onClick={() => openLightbox(selected.proofImages, i)}>
                        <img src={url} alt={`proof-${i}`} />
                      </ProofThumb>
                    ))}
                  </ProofGrid>
                </div>
              )}

              {/* Reject reason if already rejected */}
              {selected.status === 'REJECTED' && selected.rejectedReason && (
                <div style={{ marginTop: 16, padding: '10px 14px', background: '#fef2f2', borderLeft: '3px solid #ef4444', borderRadius: 6 }}>
                  <strong style={{ fontSize: 13, color: '#991b1b' }}>
                    {vi ? 'Lý do từ chối: ' : 'Rejection reason: '}
                  </strong>
                  <span style={{ fontSize: 13, color: '#991b1b' }}>{selected.rejectedReason}</span>
                </div>
              )}

              {/* Reject input form */}
              {rejectMode && selected.status === 'PENDING' && (
                <RejectForm>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>
                    {vi ? 'Lý do từ chối *' : 'Rejection reason *'}
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder={vi ? 'Nhập lý do từ chối...' : 'Enter rejection reason...'}
                    rows={3}
                  />
                </RejectForm>
              )}

              <ModalFooter>
                <button className="cancel" onClick={() => setSelected(null)}>
                  {vi ? 'Đóng' : 'Close'}
                </button>
                {selected.status === 'PENDING' && !rejectMode && (
                  <>
                    <button className="reject" onClick={() => setRejectMode(true)}>
                      <span>{vi ? 'Từ chối' : 'Reject'}</span>
                    </button>
                    <button className="approve" disabled={acting} onClick={() => doApprove(selected.experienceId)}>
                      {acting ? '…' : (vi ? '✓ Duyệt' : '✓ Approve')}
                    </button>
                  </>
                )}
                {selected.status === 'PENDING' && rejectMode && (
                  <>
                    <button className="cancel" onClick={() => setRejectMode(false)}>
                      {vi ? 'Hủy' : 'Back'}
                    </button>
                    <button className="reject" disabled={acting} onClick={() => doReject(selected.experienceId)}>
                      {acting ? '…' : (vi ? 'Xác nhận từ chối' : 'Confirm reject')}
                    </button>
                  </>
                )}
              </ModalFooter>
            </ModalBox>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showLb && (
          <Lightbox
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowLb(false)}
          >
            <img src={lbImages[lbIndex]} alt="" onClick={e => e.stopPropagation()} />
            {lbImages.length > 1 && (
              <>
                <LightboxNav $left onClick={e => { e.stopPropagation(); setLbIndex(i => (i - 1 + lbImages.length) % lbImages.length); }}>
                  <ChevronLeft />
                </LightboxNav>
                <LightboxNav onClick={e => { e.stopPropagation(); setLbIndex(i => (i + 1) % lbImages.length); }}>
                  <ChevronRight />
                </LightboxNav>
              </>
            )}
            <button
              onClick={() => setShowLb(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
            >
              <X size={18} />
            </button>
          </Lightbox>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default ExperienceManagement;
