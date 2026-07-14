import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download, FileText, AlertCircle,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RefreshCw,
} from 'lucide-react';
import { getJobApplications } from '../../services/applicationService';

/* ─── Helpers ─────────────────────────────────────────── */
const getExt = (name = '') => name.split('.').pop().toLowerCase().replace(/\?.*$/, '');

const detectType = (fileName, url) => {
  const ext = getExt(fileName) || getExt(url);
  if (['pdf'].includes(ext))                        return 'pdf';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) return 'office';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  // Fallback: sniff Content-Type later; default to office viewer
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

  // Active URL — có thể được refresh nếu URL ban đầu hết hạn
  const [cvUrl, setCvUrl] = useState(initialUrl);
  const [refreshing, setRefreshing] = useState(false);

  const fileType = detectType(fileName, cvUrl);

  // PDF state
  const containerRef           = useRef(null);
  const [pdfDoc, setPdfDoc]    = useState(null);
  const [currentPage, setPage] = useState(1);
  const [totalPages, setTotal] = useState(0);
  const [scale, setScale]      = useState(1.3);

  // Generic state
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState('');   // 'no_url' | 'load_failed'

  useEffect(() => {
    if (candName) document.title = `CV – ${candName}`;
  }, [candName]);

  /* ── Refresh CV URL from backend (lấy presigned URL mới) ── */
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
        setLoading(true); // restart loading with new URL
        setPdfDoc(null);
        return match.cvUrl;
      }
    } catch (e) {
      console.warn('Could not refresh CV URL:', e);
    } finally {
      setRefreshing(false);
    }
    return null;
  }, [jobId, applicationId, candidateId]);

  /* ── Load PDF via pdf.js ─────────────────────────────── */
  useEffect(() => {
    if (fileType !== 'pdf') { setLoading(false); return; }
    if (!cvUrl)             { setLoading(false); setError('no_url'); return; }

    let timeout;
    let cancelled = false;

    const loadPdfJs = () => new Promise((resolve, reject) => {
      if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });

    // Timeout: nếu quá 15s không load được → thử refresh hoặc hiển thị lỗi
    timeout = setTimeout(async () => {
      if (!cancelled) {
        if (jobId) {
          const freshUrl = await refreshCvUrl();
          if (freshUrl) return;
        }
        setLoading(false);
        setError('load_failed');
      }
    }, 15000);

    loadPdfJs()
      .then(lib => lib.getDocument({ url: cvUrl, withCredentials: false }).promise)
      .then(doc  => { if (!cancelled) { setPdfDoc(doc); setTotal(doc.numPages); setLoading(false); clearTimeout(timeout); } })
      .catch(async ()  => {
        if (cancelled) return;
        clearTimeout(timeout);
        // Thử refresh URL nếu có jobId (URL hết hạn)
        if (jobId) {
          const freshUrl = await refreshCvUrl();
          if (freshUrl) return; // sẽ re-trigger effect với URL mới
        }
        setLoading(false);
        setError('load_failed');
      });

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [cvUrl, fileType, jobId, refreshCvUrl]);

  /* ── Render PDF page ─────────────────────────────────── */
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;
    let cancelled = false;

    pdfDoc.getPage(currentPage).then(page => {
      if (cancelled) return;
      const vp     = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width  = vp.width;
      canvas.height = vp.height;
      page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise.then(() => {
        if (cancelled || !containerRef.current) return;
        Object.assign(canvas.style, {
          display: 'block', margin: '0 auto',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)', borderRadius: '4px',
        });
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(canvas);
      });
    });
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, scale]);

  const changePage  = d => setPage(p  => Math.min(Math.max(1, p + d), totalPages));
  const changeScale = d => setScale(s => Math.min(Math.max(0.5, +(s + d).toFixed(1)), 3));

  /* ── Google Docs URL for Office files ───────────────── */
  const googleDocsUrl = cvUrl
    ? `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(cvUrl)}`
    : '';

  /* ── Image onLoad / onError ─────────────────────────── */
  const onImgLoad  = useCallback(() => setLoading(false), []);
  const onImgError = useCallback(() => { setLoading(false); setError('load_failed'); }, []);

  /* ── Office iframe onLoad ────────────────────────────── */
  const onOfficeLoad = useCallback(() => setLoading(false), []);

  // Timeout cho office/image: nếu 20s không load → hiện lỗi
  useEffect(() => {
    if (fileType === 'pdf' || !cvUrl) return;
    const timeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) { setError('load_failed'); return false; }
        return prev;
      });
    }, 20000);
    return () => clearTimeout(timeout);
  }, [fileType, cvUrl]);

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

      {/* ── Top bar ──────────────────────────────────── */}
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
          {/* Zoom — chỉ PDF */}
          {fileType === 'pdf' && pdfDoc && (
            <div style={S.zoomGroup}>
              <button style={S.iconBtn} onClick={() => changeScale(-0.1)} title="Thu nhỏ"><ZoomOut size={15} /></button>
              <span style={S.zoomLabel}>{Math.round(scale * 100)}%</span>
              <button style={S.iconBtn} onClick={() => changeScale( 0.1)} title="Phóng to"><ZoomIn  size={15} /></button>
            </div>
          )}
          {/* Refresh Google Docs — chỉ office */}
          {fileType === 'office' && !loading && (
            <button style={S.iconBtn} title="Tải lại" onClick={() => { setLoading(true); setError(''); }}>
              <RefreshCw size={16} color="#94a3b8" />
            </button>
          )}
          {/* Tải về */}
          <a href={cvUrl} download={fileName} target="_blank" rel="noreferrer" style={S.downloadBtn}>
            <Download size={15} /> Tải về
          </a>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────── */}
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
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
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
              <a href={cvUrl} download={fileName} target="_blank" rel="noreferrer" style={S.downloadBtn}>
                <Download size={15} /> Tải về máy
              </a>
            </div>
          </div>
        )}

        {/* ── PDF ──────────────────────────────────── */}
        {fileType === 'pdf' && !error && (
          <div ref={containerRef} style={{ width: '100%' }} />
        )}

        {/* ── Image ────────────────────────────────── */}
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

        {/* ── Office / DOC / DOCX via Google Docs ──── */}
        {fileType === 'office' && !error && (
          <iframe
            key={googleDocsUrl}           /* re-mount on refresh */
            src={googleDocsUrl}
            title={fileName}
            onLoad={onOfficeLoad}
            onError={() => { setLoading(false); setError('load_failed'); }}
            style={{
              display: loading ? 'none' : 'block',
              width: '100%', flex: 1,
              border: 'none', background: '#fff',
              minHeight: 'calc(100vh - 120px)',
            }}
          />
        )}
      </div>

      {/* ── Pagination (PDF only) ─────────────────── */}
      {fileType === 'pdf' && pdfDoc && totalPages > 1 && (
        <div style={S.pagination}>
          <button style={S.pageBtn} onClick={() => changePage(-1)} disabled={currentPage <= 1}>
            <ChevronLeft size={18} />
          </button>
          <span style={S.pageLabel}>Trang {currentPage} / {totalPages}</span>
          <button style={S.pageBtn} onClick={() => changePage(1)} disabled={currentPage >= totalPages}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
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
  topLeft:  { display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden', flex: 1 },
  iconBox:  {
    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  fileName: {
    fontSize: 15, fontWeight: 700, color: '#f1f5f9',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  meta:     { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  topRight: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  zoomGroup:{
    display: 'flex', alignItems: 'center', gap: 4,
    background: '#1e293b', borderRadius: 8, padding: '4px 8px',
  },
  iconBtn:  {
    background: 'transparent', border: 'none', color: '#94a3b8',
    cursor: 'pointer', padding: 4, borderRadius: 6,
    display: 'flex', alignItems: 'center',
  },
  zoomLabel:{ fontSize: 13, color: '#cbd5e1', minWidth: 40, textAlign: 'center' },
  downloadBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '9px 18px', borderRadius: 10,
    background: 'linear-gradient(135deg, #1e40af, #2563eb)',
    color: '#fff', fontSize: 14, fontWeight: 600,
    border: 'none', cursor: 'pointer', textDecoration: 'none',
  },
  body: {
    flex: 1, overflowY: 'auto', padding: '20px 16px',
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
  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: '12px 20px', background: '#0f172a',
    borderTop: '1px solid #334155', flexShrink: 0,
  },
  pageBtn: {
    background: '#1e293b', border: '1px solid #334155',
    color: '#94a3b8', borderRadius: 8, padding: '6px 10px',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
  pageLabel: { fontSize: 14, color: '#cbd5e1' },
};

// Spinner animation
if (typeof document !== 'undefined' && !document.getElementById('cvv-styles')) {
  const st = document.createElement('style');
  st.id = 'cvv-styles';
  st.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(st);
}

export default CVViewer;
