import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import {
  AlertCircle, RefreshCw, Wifi, WifiOff, Search, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import applicationService from '../../services/applicationService';
import {
  createWorkerReplacedNotification,
  createChangeRequestApprovedNotification,
  createChangeRequestRejectedNotification
} from '../../services/notificationService';

// ─── Styled components ────────────────────────────────────────────────────────

const PageContainer = styled.div`
  animation: fadeIn 0.4s ease-in;
  @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes crFadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 28px;
`;

const PageTitle = styled.h1`
  font-size: 26px;
  font-weight: 800;
  color: ${p => p.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  align-items: center;
`;

const SearchInput = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 320px;
  svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; pointer-events: none; }
  input {
    width: 100%;
    padding: 9px 12px 9px 36px;
    border: 1.5px solid #E2E8F0;
    border-radius: 10px;
    font-size: 14px;
    outline: none;
    &:focus { border-color: #F97316; }
  }
`;

const FilterSelect = styled.select`
  padding: 9px 12px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  outline: none;
  &:focus { border-color: #F97316; }
`;

const StatsRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const StatChip = styled.div`
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  background: ${p => p.$bg || '#F8FAFC'};
  color: ${p => p.$color || '#64748B'};
  border: 1.5px solid ${p => p.$border || '#E2E8F0'};
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RequestCard = styled.div`
  background: ${p => p.$bg || 'white'};
  border: 1.5px solid ${p => p.$border || '#FFEDD5'};
  border-radius: 16px;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
  box-shadow: 0 2px 8px rgba(249,115,22,0.07);
  animation: ${p => p.$isNew ? 'crFadeIn 0.4s ease-out' : 'none'};
`;

const PaginationRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 28px;
`;

const PageBtn = styled.button`
  padding: 7px 12px;
  border-radius: 8px;
  border: 1.5px solid ${p => p.$active ? '#F97316' : '#E2E8F0'};
  background: ${p => p.$active ? '#F97316' : 'white'};
  color: ${p => p.$active ? 'white' : '#475569'};
  font-weight: ${p => p.$active ? 700 : 500};
  font-size: 13px;
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${p => p.disabled ? 0.4 : 1};
`;

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const AdminChangeRequests = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Data state
  const [changeRequests, setChangeRequests] = useState([]);
  const [crLoading, setCrLoading] = useState(false);
  const [crActionLoading, setCrActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [newCardIds, setNewCardIds] = useState(new Set());

  // Filter / pagination state
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [filterCompany, setFilterCompany] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // WebSocket
  const [wsStatus, setWsStatus] = useState('disconnected');
  const wsRef = useRef(null);
  const wsRetryCount = useRef(0);
  const wsRetryTimer = useRef(null);
  const newCardTimers = useRef({});

  const WS_ENDPOINT = import.meta.env.VITE_ADMIN_WS_ENDPOINT || '';
  const WS_MAX_RETRY = 5;
  const WS_RETRY_DELAY = 3000;

  const clearNewBadge = useCallback((applicationId) => {
    setNewCardIds(prev => { const next = new Set(prev); next.delete(applicationId); return next; });
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!WS_ENDPOINT) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    setWsStatus('connecting');
    const ws = new WebSocket(WS_ENDPOINT);
    wsRef.current = ws;
    ws.onopen = () => { setWsStatus('connected'); wsRetryCount.current = 0; };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'NEW_REQUEST') {
          const newReq = msg.data;
          setChangeRequests(prev => {
            if (prev.some(r => r.applicationId === newReq.applicationId)) return prev;
            return [newReq, ...prev];
          });
          setNewCardIds(prev => new Set([...prev, newReq.applicationId]));
          if (newCardTimers.current[newReq.applicationId]) clearTimeout(newCardTimers.current[newReq.applicationId]);
          newCardTimers.current[newReq.applicationId] = setTimeout(() => {
            clearNewBadge(newReq.applicationId);
            delete newCardTimers.current[newReq.applicationId];
          }, 5000);
        } else if (msg.type === 'REQUEST_UPDATED') {
          const updated = msg.data;
          if (updated.status && updated.status !== 'pending_change') {
            setChangeRequests(prev => prev.map(r =>
              r.applicationId === updated.applicationId ? { ...r, ...updated } : r
            ));
          }
        }
      } catch (e) { console.warn('AdminChangeRequests WS: lỗi parse message', e); }
    };
    ws.onerror = () => { setWsStatus('disconnected'); };
    ws.onclose = () => {
      setWsStatus('disconnected'); wsRef.current = null;
      if (wsRetryCount.current < WS_MAX_RETRY) {
        wsRetryCount.current += 1;
        wsRetryTimer.current = setTimeout(() => connectWebSocket(), WS_RETRY_DELAY);
      }
    };
  }, [WS_ENDPOINT, clearNewBadge]);

  const fetchChangeRequests = async () => {
    setCrLoading(true);
    try {
      const list = await applicationService.listChangeRequests();
      const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const enhanced = (list || []).map(app => {
        let cr = app.changeRequest || app.change_request || null;
        if (cr && typeof cr === 'string') { try { cr = JSON.parse(cr); } catch (e) {} }
        const rawEmployer = app.employerName || app.companyName || '';
        const employerNameDisplay = rawEmployer && !isUUID(rawEmployer) ? rawEmployer : '(Không xác định)';
        const rawWorker = app.workerName || app.candidateName || '';
        const workerNameDisplay = rawWorker && !isUUID(rawWorker) ? rawWorker : '(Không xác định)';
        return {
          ...app,
          employerName: employerNameDisplay,
          companyName: employerNameDisplay,
          workerName: workerNameDisplay,
          candidateName: workerNameDisplay,
          changeRequest: cr,
          changeRequestStatus: app.changeRequestStatus || app.change_request_status || ''
        };
      });
      setChangeRequests(enhanced);
    } catch (e) {
      console.error('Failed to load change requests', e);
    } finally {
      setCrLoading(false);
    }
  };

  useEffect(() => {
    fetchChangeRequests();
    connectWebSocket();
    return () => {
      if (wsRetryTimer.current) clearTimeout(wsRetryTimer.current);
      Object.values(newCardTimers.current).forEach(clearTimeout);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null; }
    };
  }, []);

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => { setCurrentPage(1); }, [searchText, filterStatus, filterCompany]);

  // Danh sách công ty duy nhất để filter
  const companyList = [...new Set(
    changeRequests.map(r => r.employerName || r.companyName || '').filter(Boolean)
  )].sort();

  // Lọc danh sách
  const filtered = changeRequests.filter(req => {
    const appStatus = String(req.status || '');
    const crStatus = String(req.changeRequestStatus || '').toLowerCase();
    const isPending = appStatus === 'pending_change';
    const isApproved = crStatus === 'approved' || appStatus === 'ĐÃ_BỊ_THAY_THẾ' || appStatus === 'change_approved';

    if (filterStatus === 'pending' && !isPending) return false;
    if (filterStatus === 'approved' && !isApproved) return false;
    if (filterStatus === 'rejected' && crStatus !== 'rejected') return false;

    const company = req.employerName || req.companyName || '';
    if (filterCompany !== 'all' && company !== filterCompany) return false;

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const haystack = [
        req.jobTitle, req._jobTitle, req.employerName, req.companyName,
        req.workerName, req.candidateName, req.jobId, req.applicationId,
        req.changeRequest?.reasonType, req.changeRequest?.reasonDetail
      ].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    const aTime = new Date(a.changeRequest?.requestedAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.changeRequest?.requestedAt || b.updatedAt || 0).getTime();
    return bTime - aTime;
  });

  // Stats — dùng status thực từ server làm nguồn sự thật
  const pendingCount = changeRequests.filter(r => r.status === 'pending_change').length;
  const approvedCount = changeRequests.filter(r => {
    const s = String(r.changeRequestStatus || '').toLowerCase();
    const appS = String(r.status || '');
    return s === 'approved' || appS === 'ĐÃ_BỊ_THAY_THẾ' || appS === 'change_approved';
  }).length;
  const rejectedCount = changeRequests.filter(r => String(r.changeRequestStatus || '').toLowerCase() === 'rejected').length;

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleApprove = async (req) => {
    setCrActionLoading(req.applicationId);
    try {
      const result = await applicationService.approveChangeRequest(req.applicationId);
      setChangeRequests(prev => prev.map(r =>
        r.applicationId === req.applicationId ? { ...r, changeRequestStatus: 'approved' } : r
      ));
      const cr = req.changeRequest || {};
      await Promise.allSettled([
        createWorkerReplacedNotification({
          workerId: result.workerId || req.candidateId || cr.workerId,
          jobLocation: result.jobLocation || req.jobLocation,
          workDateDisplay: result.workDateDisplay || req.jobWorkDate,
          jobTitle: result.jobTitle || req.jobTitle,
          reasonType: result.reasonType || cr.reasonType,
          reasonDetail: result.reasonDetail || cr.reasonDetail || cr.reason
        }),
        createChangeRequestApprovedNotification({
          employerId: result.employerId || req.employerId,
          companyName: req.employerName,
          candidateName: req.candidateName,
          changeRequestType: cr.reasonType,
        })
      ]);
    } catch (e) {
      alert(`Lỗi: ${e.message}`);
    } finally {
      setCrActionLoading(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    const { applicationId } = rejectModal;
    const rejectedReq = changeRequests.find(r => r.applicationId === applicationId);
    setCrActionLoading(applicationId);
    setRejectModal(null);
    try {
      await applicationService.rejectChangeRequest(applicationId, rejectNotes);
      setChangeRequests(prev => prev.map(r =>
        r.applicationId === applicationId ? { ...r, changeRequestStatus: 'rejected' } : r
      ));
      if (rejectedReq) {
        const cr = rejectedReq.changeRequest || {};
        await createChangeRequestRejectedNotification({
          employerId: rejectedReq.employerId,
          companyName: rejectedReq.employerName,
          candidateName: rejectedReq.candidateName,
          changeRequestType: cr.reasonType,
          applicationId,
          reason: rejectNotes
        }).catch(() => {});
      }
    } catch (e) {
      alert(`Lỗi: ${e.message}`);
    } finally {
      setCrActionLoading(null);
    }
  };

  const typeViMap = { cancel_shift: 'Huỷ ca làm', staff_replacement: 'Thay thế nhân viên', change_worker: 'Thay đổi nhân viên' };

  return (
    <DashboardLayout role="admin">
      <PageContainer>
        {/* Header */}
        <PageHeader>
          <PageTitle>
            <AlertCircle size={26} color="#F97316" />
            Yêu cầu thay đổi nhân viên
            {pendingCount > 0 && (
              <span style={{ background: '#F97316', color: 'white', borderRadius: 99, padding: '2px 10px', fontSize: 14, fontWeight: 700 }}>
                {pendingCount}
              </span>
            )}
            {WS_ENDPOINT && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12,
                fontWeight: 600, color: wsStatus === 'connected' ? '#10B981' : wsStatus === 'connecting' ? '#F59E0B' : '#94A3B8'
              }}>
                {wsStatus === 'connected' ? <><Wifi size={13} />Realtime</> : wsStatus === 'connecting' ? <><WifiOff size={13} />Đang kết nối...</> : <><WifiOff size={13} />Offline</>}
              </span>
            )}
          </PageTitle>
          <button
            onClick={fetchChangeRequests}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569' }}
          >
            <RefreshCw size={14} /> Làm mới
          </button>
        </PageHeader>

        {/* Stats chips */}
        <StatsRow>
          <StatChip $bg="#FFF7ED" $color="#F97316" $border="#FED7AA">⏳ Chờ duyệt: {pendingCount}</StatChip>
          <StatChip $bg="#F0FDF4" $color="#16A34A" $border="#BBF7D0">✅ Đã duyệt: {approvedCount}</StatChip>
          <StatChip $bg="#FEF2F2" $color="#DC2626" $border="#FECACA">✕ Từ chối: {rejectedCount}</StatChip>
          <StatChip $bg="#F8FAFC" $color="#64748B" $border="#E2E8F0">Tổng: {changeRequests.length}</StatChip>
        </StatsRow>

        {/* Filter bar */}
        <FilterBar>
          <SearchInput>
            <Search size={15} />
            <input
              placeholder="Tìm theo tên công ty, nhân viên, vị trí..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </SearchInput>
          <FilterSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </FilterSelect>
          <FilterSelect value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
            <option value="all">Tất cả công ty</option>
            {companyList.map(c => <option key={c} value={c}>{c}</option>)}
          </FilterSelect>
        </FilterBar>

        {/* Danh sách */}
        {crLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8', fontSize: 15 }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: '#F8FAFC', borderRadius: 16, border: '1.5px dashed #E2E8F0', color: '#94A3B8' }}>
            <AlertCircle size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div style={{ fontWeight: 600, fontSize: 15 }}>Không tìm thấy yêu cầu nào</div>
          </div>
        ) : (
          <>
            <CardList>
              {paginated.map(req => {
                const cr = req.changeRequest || {};
                const isNew = newCardIds.has(req.applicationId);
                const appStatus = String(req.status || '');
                const crStatus = String(req.changeRequestStatus || '').toLowerCase();
                // isPending chỉ true khi application thực sự đang ở trạng thái pending_change trên server
                const isPending = appStatus === 'pending_change';
                const isApproved = crStatus === 'approved' || appStatus === 'ĐÃ_BỊ_THAY_THẾ' || appStatus === 'change_approved';
                const isRejected = crStatus === 'rejected';
                const borderColor = isApproved ? '#BBF7D0' : isRejected ? '#FECACA' : (isNew ? '#FED7AA' : '#FFEDD5');
                const bgColor = isApproved ? '#F0FDF4' : isRejected ? '#FEF2F2' : 'white';
                const typeLabel = typeViMap[cr.type] || cr.typeLabel || cr.type || '(Không xác định)';
                const isReplacement = cr.type === 'staff_replacement' || cr.type === 'change_worker';
                const reasonLabel = cr.reasonType || '';
                const detailLabel = cr.reasonDetail || cr.reason || '';
                return (
                  <RequestCard key={req.applicationId} $bg={bgColor} $border={borderColor} $isNew={isNew}>
                    <div>
                      {/* Row 1 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                        {isPending && <div style={{ background: '#FFF7ED', borderRadius: 10, padding: '5px 11px', fontSize: 12, fontWeight: 700, color: '#F97316', border: '1px solid #FFEDD5', whiteSpace: 'nowrap' }}>⏳ Chờ duyệt</div>}
                        {isApproved && <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '5px 11px', fontSize: 12, fontWeight: 700, color: '#16A34A', border: '1px solid #BBF7D0', whiteSpace: 'nowrap' }}>✅ Đã duyệt</div>}
                        {isRejected && <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '5px 11px', fontSize: 12, fontWeight: 700, color: '#DC2626', border: '1px solid #FECACA', whiteSpace: 'nowrap' }}>✕ Từ chối</div>}
                        {isNew && <span style={{ background: '#EF4444', color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800, letterSpacing: '0.5px' }}>MỚI</span>}
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>{req.jobTitle || req._jobTitle || req.applicationId}</div>
                      </div>
                      {/* Row 2 */}
                      <div style={{ fontSize: 13, color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '4px 20px', marginBottom: 8 }}>
                        <span>🏢 Nhà tuyển dụng: <b style={{ color: '#334155' }}>{req.employerName || req.companyName || req.employerId || '-'}</b></span>
                        <span>👤 Nhân viên: <b style={{ color: '#334155' }}>{req.workerName || req.candidateName || req.candidateId || '-'}</b></span>
                        <span style={{ color: '#94A3B8' }}>Job ID: {req.jobId || '-'}</span>
                      </div>
                      {/* Row 3 */}
                      <div style={{ fontSize: 13, color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '4px 20px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {isReplacement ? '👥' : '🕐'}<b style={{ color: '#F97316' }}>{typeLabel}</b>
                        </span>
                        {reasonLabel && <span>↳ <b style={{ color: '#DC2626' }}>{reasonLabel}</b></span>}
                        {detailLabel && <span style={{ fontStyle: 'italic', color: '#475569' }}>💬 "{detailLabel}"</span>}
                        <span>🕐 {cr.requestedAt || (req.updatedAt ? new Date(req.updatedAt).toLocaleString('vi-VN') : '-')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                      {isPending ? (
                        <>
                          <button
                            disabled={crActionLoading === req.applicationId}
                            onClick={() => handleApprove(req)}
                            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: crActionLoading === req.applicationId ? '#E2E8F0' : 'linear-gradient(135deg,#10B981,#059669)', color: 'white', fontWeight: 700, fontSize: 13, cursor: crActionLoading === req.applicationId ? 'not-allowed' : 'pointer' }}
                          >
                            {crActionLoading === req.applicationId ? '...' : '✔ Duyệt'}
                          </button>
                          <button
                            disabled={crActionLoading === req.applicationId}
                            onClick={() => { setRejectModal({ applicationId: req.applicationId, candidateName: req.candidateName || req.applicationId }); setRejectNotes(''); }}
                            style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: 13, cursor: crActionLoading === req.applicationId ? 'not-allowed' : 'pointer' }}
                          >
                            ✕ Từ chối
                          </button>
                        </>
                      ) : (
                        <div style={{ fontSize: 13, fontWeight: 600, padding: '10px 4px', color: isApproved ? '#16A34A' : '#DC2626' }}>
                          {isApproved ? '✅ Đã xử lý' : '✕ Đã từ chối'}
                        </div>
                      )}
                    </div>
                  </RequestCard>
                );
              })}
            </CardList>

            {/* Phân trang */}
            {totalPages > 1 && (
              <PaginationRow>
                <PageBtn disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft size={15} />
                </PageBtn>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '...'
                      ? <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#94A3B8' }}>…</span>
                      : <PageBtn key={item} $active={item === currentPage} onClick={() => setCurrentPage(item)}>{item}</PageBtn>
                  )}
                <PageBtn disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight size={15} />
                </PageBtn>
              </PaginationRow>
            )}
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#94A3B8' }}>
              Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length} yêu cầu
            </div>
          </>
        )}

        {/* Modal từ chối */}
        {rejectModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 18, color: '#1E293B', marginBottom: 12 }}>Từ chối yêu cầu</h3>
              <p style={{ fontSize: 14, color: '#64748B', marginBottom: 14 }}>
                Nhập lý do từ chối yêu cầu cho "<b>{rejectModal.candidateName}</b>":
              </p>
              <textarea
                rows={4}
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                placeholder="Lý do từ chối (không bắt buộc)..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E2E8F0', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', marginBottom: 20, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setRejectModal(null)} style={{ padding: '10px 18px', background: '#F1F5F9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Hủy</button>
                <button onClick={handleConfirmReject} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#EF4444,#DC2626)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
};

export default AdminChangeRequests;
