import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download, FileText, AlertCircle, RefreshCw,
} from 'lucide-react';
import { getJobApplications } from '../../services/applicationService';

/* ─── Helpers ─────────────────────────────────────────── */
const getExt = (name = '') => name.split('.').pop().toLowerCase().replace(/\?.*$/, '');

const detectType = (fileName, url) => {
  const ext = getExt(fileName) || getExt(url);
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) return 'office';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  return 'office';
};

/* ─── Component ───────────────────────────────────────── */
const CVViewer = () => {
  const [searchParams] = useSearchParams();

  const initialUrl    = searchParams.get('url')           || '';
  const fileName      = searchParams.get('name')          || 'CV';
  const candName      = searchParams.get('candidate')     || '';
  const jobTitle      = searchParams.get('job')           || '';
  const jobId         = searchParams.get('jobId')         || '';
  const applicationId = searchParams.get('applicationId') || '';
  const candidateId   = searchParams.get('candidateId')   || '';

  const [cvUrl, setCvUrl] = useState(initialUrl);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fileType = detectType(fileName, cvUrl);

  useEffect(() => {
    if (candName) document.title = `CV – ${candName}`;
  }, [candName]);

  /* ── Refresh CV URL from backend ── */
  const refreshCvUrl = useCallback(async () => {
    if (!jobId) return null;
    try {
      setRefreshing(true);
      const apps = await getJobApplications(jobId);
      const match = apps.find(a =>
        (applicationId && a.applicationId === applicationId) ||
        (candidateId && a.candidateId === candidateId)
      );
      if (match?.cvUrl) {
        setCvUrl(match.cvUrl);
        setError('');
        setLoading(true);
        return match.cvUrl;
      }
    } catch (e) {
      console.warn('Could not refresh CV URL:', e);
    } finally {
      setRefreshing(false);
    }
    return null;
  }, [jobId, applicationId, candidateId]);

  /* ── Auto-refresh URL on mount if expired ── */
  useEffect(() => {
    if (!jobId) return;
    // Luôn refresh URL từ backend khi mở để đảm bảo URL mới nhất
    // (backend generate presigned URL mới mỗi lần gọi API)
    console.log('🔄 Auto-refreshing CV URL from backend...');
    refreshCvUrl();
  }, [refreshCvUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Timeout: nếu iframe không load trong 10s → auto refresh rồi mới hiện error ── */
  useEffect(() => {
    if (!cvUrl) { setLoading(false); setError('no_url'); return; }
    const timeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          // Thử auto-refresh trước khi hiện lỗi
          if (jobId) {
            refreshCvUrl().then(freshUrl => {
              if (!freshUrl) setError('load_failed');
            });
          } else {
            setError('load_failed');
          }
          return false;
        }
        return prev;
      });
    }, 10000);
    return () => clearTimeout(timeout);
  }, [cvUrl, jobId, refreshCvUrl]);

  const onIframeLoad = useCallback(() => {
    setLoading(false);
    setError('');
  }, []);

  /* ── Google Docs URL for Office files ── */
  const googleDocsUrl = cvUrl
    ? `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(cvUrl)}`
    : '';

  /* ── Image handlers ── */
  const onImgLoad = useCallback(() => setLoading(false), []);
  const onImgError = useCallback(() => { setLoading(false); setError('load_failed'); }, []);

  /* ─── Render ─────────────────────────────────────────── */
  if (!cvUrl) {
    return (
      <div style={S.page}>
        <div style={S.center}>
          <AlertCircle size={48} color="#ef4444" />
          <h2 style={{ color: '#f1f5f9', marginTop: 12 }}>Không tìm thấy CV</h2>
          <p style={{ color: '#94a3b8' }}>Đường dẫn không hợp lệ hoặc đã hết hạn.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>

      {/* ── Top bar ── */}
      <div style={S.topBar}>
        <div style={S.topLeft}>
          <div style={S.iconBox}><FileText size={20} color="#fff" /></div>
          <div style={{ overflow: 'hidden' }}>
            <div style={S.fileName}>{fileName}</div>
            {(candName || jobTitle) && (
              <div style={S.meta}>
                {candName && <span>{candName}</span>}
                {candName && jobTitle && <span style={{ margin: '0 6px', opacity: 0.4 }}>•</span>}
                {jobTitle && <span>{jobTitle}</span>}
              </div>
            )}
          </div>
        </div>

        <div style={S.topRight}>
          <a href={cvUrl} download={fileName} target="_blank" rel="noreferrer" style={S.downloadBtn}>
            <Download size={15} /> Tải về
          </a>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={S.body}>

        {/* Loading spinner */}
        {loading && (
          <div style={S.center}>
            <div style={S.spinner} />
            <p style={{ color: '#94a3b8', marginTop: 16 }}>Đang tải...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error === 'load_failed' && (
          <div style={S.center}>
            <AlertCircle size={48} color="#f59e0b" />
            <h2 style={{ color: '#f1f5f9', marginTop: 12 }}>Không thể hiển thị file</h2>
            <p style={{ color: '#94a3b8', maxWidth: 340, textAlign: 'center' }}>
              Link xem CV có thể đã hết hạn hoặc trình duyệt không hỗ trợ xem trực tiếp.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {jobId && (
                <button
                  onClick={refreshCvUrl}
                  disabled={refreshing}
                  style={{ ...S.downloadBtn, background: 'linear-gradient(135deg, #059669, #10b981)' }}
                >
                  <RefreshCw size={15} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : {}} />
                  {refreshing ? 'Đang tải...' : 'Thử lại'}
                </button>
              )}
              <a href={cvUrl} target="_blank" rel="noreferrer" style={{ ...S.downloadBtn, background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}>
                <FileText size={15} /> Mở trong tab mới
              </a>
              <a href={cvUrl} download={fileName} target="_blank" rel="noreferrer" style={S.downloadBtn}>
                <Download size={15} /> Tải về máy
              </a>
            </div>
          </div>
        )}

        {/* ── PDF — dùng iframe embed trực tiếp (browser built-in PDF viewer) ── */}
        {fileType === 'pdf' && !error && (
          <iframe
            key={cvUrl}
            src={`${cvUrl}#toolbar=1&navpanes=0&view=FitV`}
            title={fileName}
            onLoad={onIframeLoad}
            style={{
              display: loading ? 'none' : 'block',
              width: '100%',
              height: '100%',
              flex: 1,
              border: 'none',
              background: '#fff',
            }}
          />
        )}

        {/* ── Image ── */}
        {fileType === 'image' && !error && (
          <img
            src={cvUrl}
            alt={fileName}
            onLoad={onImgLoad}
            onError={onImgError}
            style={{
              display: loading ? 'none' : 'block',
              maxWidth: '100%', margin: '0 auto',
              borderRadius: 8,
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
            }}
          />
        )}

        {/* ── Office / DOC / DOCX via Google Docs ── */}
        {fileType === 'office' && !error && (
          <iframe
            key={googleDocsUrl}
            src={googleDocsUrl}
            title={fileName}
            onLoad={onIframeLoad}
            style={{
              display: loading ? 'none' : 'block',
              width: '100%', height: '100%', flex: 1,
              border: 'none', background: '#fff',
            }}
          />
        )}
      </div>
    </div>
  );
};

/* ─── Styles ──────────────────────────────────────────── */
const S = {
  page: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: '#1e293b', fontFamily: "'Inter', sans-serif",
  },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', background: '#0f172a',
    borderBottom: '1px solid #334155', flexShrink: 0, gap: 12,
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden', flex: 1 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  fileName: {
    fontSize: 15, fontWeight: 700, color: '#f1f5f9',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  meta: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  topRight: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  downloadBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '9px 18px', borderRadius: 10,
    background: 'linear-gradient(135deg, #1e40af, #2563eb)',
    color: '#fff', fontSize: 14, fontWeight: 600,
    border: 'none', cursor: 'pointer', textDecoration: 'none',
  },
  body: {
    flex: 1, overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  },
  center: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: 300, color: '#f1f5f9', textAlign: 'center', gap: 8,
  },
  spinner: {
    width: 44, height: 44, borderRadius: '50%',
    border: '4px solid #334155', borderTopColor: '#6366f1',
    animation: 'spin 0.8s linear infinite',
  },
};

// Spinner animation
if (typeof document !== 'undefined' && !document.getElementById('cvv-styles')) {
  const st = document.createElement('style');
  st.id = 'cvv-styles';
  st.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(st);
}

export default CVViewer;
