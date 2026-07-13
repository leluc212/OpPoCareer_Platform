/**
 * PackageExpiryModal
 * Modal thông báo "Gói dịch vụ sắp hết hạn" — dữ liệu thật từ API.
 *
 * Props:
 *  - notification   : object notification type='package_expiring'
 *  - onClose        : () => void
 *  - onRenewed      : () => void
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Clock, X, AlertTriangle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const SUBS_API    = import.meta.env.VITE_PACKAGE_SUBSCRIPTIONS_API?.replace(/\/$/, '') ?? '';
const NOTIF_API   = import.meta.env.VITE_NOTIFICATIONS_API?.replace(/\/$/, '') ?? '';
const EMPLOYER_API = import.meta.env.VITE_EMPLOYER_API_URL || '/api-employer';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcCountdown(iso) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return { totalMinutes: 0, hh: 0, mm: 0, display: '00:00', urgent: true, warning: true };
  const totalMinutes = Math.floor(diff / 60000);
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return {
    totalMinutes,
    hh,
    mm,
    display: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
    urgent:  totalMinutes < 60,
    warning: totalMinutes < 180,
  };
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function formatExpiry(iso) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return { time, date };
}

/** Tên tiêu đề modal động theo tên gói */
function buildModalTitle(packageName) {
  if (!packageName) return 'Gói dịch vụ sắp hết hạn';
  return `Gói ${packageName} sắp dừng hoạt động`;
}

/** Warning text có highlight đỏ — trả về array của text/JSX */
function buildWarningParts(rank, views, applicants, expiryTime) {
  const time = expiryTime || '';
  if (!rank || rank === 0) {
    return [
      { text: 'Tin của bạn đang được hiển thị. Gia hạn để giữ vị trí và tiếp tục thu hút ứng viên.' }
    ];
  }
  if (rank <= 3) {
    return [
      { text: 'Đây là tin tuyển dụng ' },
      { text: 'đang hiệu quả nhất', red: true },
      { text: ' của bạn tháng này. Khi gói kết thúc, tin sẽ rớt khỏi vị trí ưu tiên và ' },
      { text: 'lượng ứng tuyển có thể giảm ngay lập tức', red: true },
      { text: time ? `. Gia hạn trước ${time} để giữ nguyên phong độ này.` : '.' },
    ];
  }
  if (rank <= 10) {
    return [
      { text: `Tin đang ở Top ${rank} với ` },
      { text: `${views.toLocaleString('vi-VN')} lượt xem`, red: true },
      { text: ` và ${applicants.toLocaleString('vi-VN')} ứng tuyển. Gia hạn để duy trì ` },
      { text: 'đà tăng trưởng này', red: true },
      { text: '.' },
    ];
  }
  return [
    { text: `Tin đang ở vị trí #${rank}. Gia hạn để ` },
    { text: 'đẩy thứ hạng lên cao hơn', red: true },
    { text: ' và tăng khả năng tiếp cận ứng viên phù hợp.' },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PackageExpiryModal({ notification, onClose, onRenewed }) {
  const toast     = useToast();
  const navigate  = useNavigate();

  const [countdown, setCountdown]   = useState(null);
  const [jobData,   setJobData]     = useState(null);
  const [subData,   setSubData]     = useState(null);
  const [rank,      setRank]        = useState(null);
  const [loading,   setLoading]     = useState(true);
  const [fetchError,setFetchError]  = useState(null);

  const subscriptionId = notification?.data?.subscriptionId;
  const employerId     = notification?.recipientId;

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Mock mode
    const isMock = notification?.notificationId?.startsWith('TEST-');
    if (isMock) {
      const mockExpiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
      setSubData({
        subscriptionId: 'SUB-TEST-001',
        packageName:    notification?.data?.packageName || 'Quick Boost',
        duration:       notification?.data?.duration    || '5 ngày',
        companyName:    'Công ty Demo',
        expiryDateTime: mockExpiresAt,
        status:         'active',
      });
      setJobData({
        idJob:      'JOB-TEST-001',
        title:      notification?.data?.jobTitle || 'Nhân viên Pha chế',
        views:      500,
        applicants: 65,
        status:     'active',
      });
      setRank(1);
      setLoading(false);
      return;
    }

    if (!subscriptionId || !employerId) {
      setFetchError('Không đủ thông tin để tải dữ liệu.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const subRes = await fetch(`${SUBS_API}/subscriptions/${subscriptionId}`);
        if (!subRes.ok) throw new Error('Không lấy được gói dịch vụ');
        const subJson = await subRes.json();
        if (cancelled) return;
        setSubData(subJson?.data || subJson);

        const jobsRes = await fetch(`${EMPLOYER_API}/jobs/employer/${employerId}`);
        if (jobsRes.ok) {
          const jobsJson = await jobsRes.json();
          const jobs = jobsJson?.data || jobsJson || [];
          const linkedJobId = notification?.data?.jobId;
          let target = linkedJobId
            ? jobs.find(j => j.idJob === linkedJobId || j.id === linkedJobId)
            : null;
          if (!target && jobs.length > 0) {
            target = [...jobs]
              .filter(j => j.status !== 'deleted' && j.status !== 'expired')
              .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]
              || jobs[0];
          }
          if (cancelled) return;
          setJobData(target);
          if (target) {
            const active = jobs.filter(j => j.status !== 'deleted' && j.status !== 'expired');
            const sorted = [...active].sort((a, b) => (b.views || 0) - (a.views || 0));
            const idx = sorted.findIndex(j => (j.idJob || j.id) === (target.idJob || target.id));
            setRank(idx >= 0 ? idx + 1 : null);
          }
        }
      } catch (err) {
        if (!cancelled) setFetchError(err.message || 'Lỗi tải dữ liệu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [subscriptionId, employerId, notification]);

  // ── Countdown realtime ─────────────────────────────────────────────────────
  useEffect(() => {
    const exp = subData?.expiryDateTime;
    if (!exp) return;
    setCountdown(calcCountdown(exp));
    const id = setInterval(() => setCountdown(calcCountdown(exp)), 60_000);
    return () => clearInterval(id);
  }, [subData?.expiryDateTime]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDismiss = useCallback(async () => {
    onClose?.();
    if (notification?.notificationId && NOTIF_API && !notification.notificationId.startsWith('TEST-')) {
      try {
        await fetch(`${NOTIF_API}/notifications/${notification.notificationId}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ read: true, dismissedAt: new Date().toISOString() }),
        });
      } catch { /* silent */ }
    }
  }, [notification, onClose]);

  const handleRenew = useCallback(() => {
    // Đóng modal trước
    onClose?.();
    // Navigate đến trang Subscription, truyền state để auto-highlight gói cần gia hạn
    navigate('/employer/subscription', {
      state: {
        renewPackage: {
          packageName: subData?.packageName || notification?.data?.packageName,
          duration:    subData?.duration    || notification?.data?.duration,
        },
      },
    });
  }, [subData, notification, navigate, onClose]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const expiry       = subData?.expiryDateTime ? formatExpiry(subData.expiryDateTime) : null;
  const views        = jobData?.views      || 0;
  const applicants   = jobData?.applicants || 0;
  const jobTitle     = jobData?.title || notification?.data?.jobTitle || 'Vị trí tuyển dụng';
  const packageName  = subData?.packageName || notification?.data?.packageName || 'Gói dịch vụ';
  const duration     = subData?.duration   || notification?.data?.duration    || '';
  const createdAt    = notification?.createdAt;
  const modalTitle   = buildModalTitle(packageName);
  const warningParts = buildWarningParts(rank, views, applicants, expiry?.time);

  // countdown color logic
  const isUrgent  = countdown?.urgent;
  const isWarning = countdown?.warning && !countdown?.urgent;
  const cdColor   = isUrgent ? '#EF4444' : isWarning ? '#F59E0B' : '#1e40af';
  const cdRowBg   = isUrgent ? '#FFF1F1' : isWarning ? '#FFFBEB' : '#EFF6FF';
  const cdRowBorder = isUrgent ? '#FECACA' : isWarning ? '#FDE68A' : '#BFDBFE';
  const clockColor  = isUrgent ? '#EF4444' : isWarning ? '#F59E0B' : '#94a3b8';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div style={s.backdrop} onClick={handleDismiss} aria-hidden="true" />

      <div role="dialog" aria-modal="true" aria-labelledby="pkg-title" style={s.modal}>

        {/* ── Header ── */}
        <div style={s.header}>
          {/* Bell circle — amber tint */}
          <div style={s.bellWrap}>
            <Bell size={22} color="#D97706" strokeWidth={2} />
          </div>
          <div style={s.headerText}>
            <div id="pkg-title" style={s.title}>{modalTitle}</div>
            <div style={s.subtitle}>
              Thông báo {createdAt ? relativeTime(createdAt) : '—'}
            </div>
          </div>
          <button style={s.closeBtn} onClick={handleDismiss} aria-label="Đóng">
            <X size={16} strokeWidth={2.5} color="#9ca3af" />
          </button>
        </div>

        {/* ── Divider ── */}
        <div style={s.divider} />

        {/* ── Body ── */}
        {loading ? (
          <div style={s.center}>
            <div style={s.spinner} />
            <span style={s.loadingTxt}>Đang tải dữ liệu…</span>
          </div>
        ) : fetchError ? (
          <div style={s.errorRow}>
            <AlertTriangle size={16} color="#EF4444" />
            <span style={s.errorTxt}>{fetchError}</span>
          </div>
        ) : (
          <>
            {/* Countdown strip */}
            <div style={{ ...s.cdStrip, background: cdRowBg, borderColor: cdRowBorder }}>
              <div style={s.cdLeft}>
                <Clock size={15} color={clockColor} strokeWidth={2} />
                <span style={{ ...s.cdText, color: isUrgent ? '#EF4444' : '#475569' }}>
                  Hết hạn lúc <strong>{expiry?.time ?? '—'}</strong> · {expiry?.date ?? '—'}
                </span>
              </div>
              {countdown && (
                <span style={{ ...s.cdBadge, color: cdColor }}>
                  Còn {countdown.display}
                </span>
              )}
            </div>

            {/* Job card */}
            <div style={s.jobCard}>
              <div style={s.jobCardTop}>
                <span style={s.jobTitle}>{jobTitle}</span>
                <span style={s.pkgBadge}>{packageName}{duration ? ` · ${duration}` : ''}</span>
              </div>
              {/* Stats */}
              <div style={s.statsRow}>
                <div style={s.statCell}>
                  <span style={s.statVal}>{views.toLocaleString('vi-VN')}</span>
                  <span style={s.statLbl}>Lượt xem</span>
                </div>
                <div style={s.statDivider} />
                <div style={s.statCell}>
                  <span style={s.statVal}>{applicants.toLocaleString('vi-VN')}</span>
                  <span style={s.statLbl}>Ứng tuyển</span>
                </div>
                <div style={s.statDivider} />
                <div style={s.statCell}>
                  <span style={{ ...s.statVal, color: rank != null && rank <= 3 ? '#1e40af' : '#1e293b', fontWeight: 700 }}>
                    {rank != null ? `Top ${rank}` : '—'}
                  </span>
                  <span style={s.statLbl}>Vị trí hiển thị</span>
                </div>
              </div>
            </div>

            {/* Warning text */}
            <p style={s.warnText}>
              {warningParts.map((part, i) =>
                part.red
                  ? <strong key={i} style={{ color: '#EF4444', fontWeight: 600 }}>{part.text}</strong>
                  : <span key={i}>{part.text}</span>
              )}
            </p>
          </>
        )}

        {/* ── Actions ── */}
        <div style={s.actions}>
          <button style={s.laterBtn} onClick={handleDismiss} disabled={renewing}>
            Để sau
          </button>
          <button
            style={s.renewBtn}
            onClick={handleRenew}
            disabled={loading}
          >
            <Zap size={15} strokeWidth={2.2} fill="currentColor" />
            Gia hạn ngay
          </button>
        </div>
      </div>

      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.4)',
    zIndex: 1200,
    backdropFilter: 'blur(3px)',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    zIndex: 1201,
    width: 360,
    maxWidth: 'calc(100vw - 24px)',
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
    fontFamily: 'Inter,-apple-system,sans-serif',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },

  // Header — amber tint bg
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '18px 18px 14px',
    background: '#FFFBEB',
  },
  bellWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: '#FEF3C7',
    border: '1.5px solid #FDE68A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1e293b',
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 3,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    padding: 4,
    cursor: 'pointer',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  divider: {
    height: 1,
    background: '#f1f5f9',
  },

  // Loading / Error
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '28px 20px 20px',
  },
  spinner: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2.5px solid #e2e8f0',
    borderTopColor: '#1e40af',
    animation: 'spin 0.7s linear infinite',
  },
  loadingTxt: {
    fontSize: 13,
    color: '#94a3b8',
  },
  errorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 18px',
    background: '#FEF2F2',
    margin: '14px 18px 0',
    borderRadius: 10,
  },
  errorTxt: {
    fontSize: 13,
    color: '#dc2626',
  },

  // Countdown strip
  cdStrip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    margin: '16px 18px 0',
    padding: '10px 14px',
    borderRadius: 12,
    border: '1.5px solid',
  },
  cdLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    minWidth: 0,
  },
  cdText: {
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cdBadge: {
    fontSize: 18,
    fontWeight: 800,
    flexShrink: 0,
    letterSpacing: '-0.01em',
  },

  // Job card
  jobCard: {
    margin: '12px 18px 0',
    border: '1.5px solid #e8efff',
    borderRadius: 12,
    padding: '14px 14px 12px',
    background: '#fff',
  },
  jobCardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1e293b',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  pkgBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#3730a3',
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
    borderRadius: 20,
    padding: '3px 10px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
  },
  statCell: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    background: '#e2e8f0',
    flexShrink: 0,
  },
  statVal: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1e293b',
    lineHeight: 1.1,
  },
  statLbl: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 500,
  },

  // Warning text — plain, no box
  warnText: {
    fontSize: 13.5,
    color: '#374151',
    lineHeight: 1.6,
    margin: '14px 18px 0',
    padding: 0,
  },

  // Actions
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 18px 18px',
    marginTop: 14,
  },
  laterBtn: {
    background: 'none',
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '10px 4px',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  renewBtn: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    borderRadius: 12,
    background: 'linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    boxShadow: '0 4px 14px rgba(30,64,175,0.35)',
    transition: 'opacity 0.15s',
  },
  btnSpinner: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.35)',
    borderTopColor: '#fff',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  },
};
