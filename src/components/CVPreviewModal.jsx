import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, RefreshCw } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker - use cdnjs instead of unpkg for better CORS support
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  flex-direction: column;
  z-index: 10000;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const Title = styled.h3`
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400px;

  @media (max-width: 768px) {
    font-size: 15px;
    max-width: 180px;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const ControlButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;

    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 24px;
  position: relative;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const PDFContainer = styled.div`
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  overflow: auto;
  max-height: 85vh;
  max-width: 1200px;
  width: 90vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;

  @media (max-width: 768px) {
    width: 95vw;
    padding: 12px;
    border-radius: 4px;
    max-height: 80vh;
  }

  .react-pdf__Document {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .react-pdf__Page {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    overflow: hidden;
    max-width: 100%;
  }

  .react-pdf__Page__canvas {
    max-width: 100%;
    height: auto !important;
    display: block;
  }

  /* Text layer styles */
  .react-pdf__Page__textContent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    opacity: 0.2;
    line-height: 1;
  }

  .react-pdf__Page__textContent span {
    color: transparent;
    position: absolute;
    white-space: pre;
    cursor: text;
    transform-origin: 0% 0%;
  }

  /* Annotation layer styles */
  .react-pdf__Page__annotations {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .react-pdf__Page__annotations .linkAnnotation > a {
    position: absolute;
    font-size: 1em;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`;

const PageNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;

  @media (max-width: 768px) {
    gap: 8px;
    padding: 6px 12px;
  }
`;

const PageInfo = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  min-width: 80px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 12px;
    min-width: 60px;
  }
`;

const NavButton = styled.button`
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const LoadingMessage = styled.div`
  color: white;
  font-size: 16px;
  text-align: center;
  padding: 40px;
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(255, 255, 255, 0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  font-size: 16px;
  text-align: center;
  padding: 24px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 107, 0.3);
  max-width: 500px;
`;

const ZoomIndicator = styled.div`
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  pointer-events: none;
  opacity: ${props => props.$show ? 1 : 0};
  transition: opacity 0.3s;

  @media (max-width: 768px) {
    bottom: 16px;
    font-size: 12px;
    padding: 6px 12px;
  }
`;

const CVPreviewModal = ({ cvUrl, fileName, onClose, onDownload, onGetFreshUrl }) => {
  // Detect file type first (before any hooks)
  const isPDF = !!(fileName?.toLowerCase().endsWith('.pdf') ||
    (cvUrl?.includes('.pdf') && !cvUrl?.includes('.docx')));
  const isDOCX = !!(fileName?.toLowerCase().endsWith('.docx') ||
    fileName?.toLowerCase().endsWith('.doc') ||
    cvUrl?.includes('.docx'));

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.5);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);
  // DOCX rendered HTML
  const [docxHtml, setDocxHtml] = useState(null);
  // Fresh URL after refresh
  const [activeCvUrl, setActiveCvUrl] = useState(cvUrl);
  // Use iframe fallback when react-pdf fails
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  // Check if a presigned URL is expired or near expiry
  const isUrlExpired = (url) => {
    if (!url) return true;
    try {
      // Query-string presigned URL: has Expires= param (Unix timestamp)
      const expiresMatch = url.match(/[?&]Expires=(\d+)/i);
      if (expiresMatch) {
        const expireTs = parseInt(expiresMatch[1], 10) * 1000;
        return Date.now() >= expireTs - 60000; // expired or expires within 1 min
      }
      // X-Amz-Date style: check X-Amz-Expires duration
      const amzDateMatch = url.match(/X-Amz-Date=(\d{8}T\d{6}Z)/i);
      const amzExpiresMatch = url.match(/X-Amz-Expires=(\d+)/i);
      if (amzDateMatch && amzExpiresMatch) {
        const d = amzDateMatch[1]; // e.g. 20260101T120000Z
        const signedAt = new Date(
          `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}T${d.slice(9,11)}:${d.slice(11,13)}:${d.slice(13,15)}Z`
        ).getTime();
        const expiresIn = parseInt(amzExpiresMatch[1], 10) * 1000;
        return Date.now() >= signedAt + expiresIn - 60000;
      }
    } catch (_) { /* ignore */ }
    return false;
  };

  // On open, always refresh URL from backend to ensure freshness
  React.useEffect(() => {
    const refreshIfNeeded = async () => {
      if (onGetFreshUrl) {
        console.log('🔄 Refreshing CV URL from backend on open...');
        try {
          const freshUrl = await onGetFreshUrl();
          if (freshUrl) {
            console.log('✅ Got fresh CV URL');
            setActiveCvUrl(freshUrl);
            return;
          }
        } catch (e) {
          console.warn('Could not refresh CV URL:', e);
        }
      }
      setActiveCvUrl(cvUrl);
    };
    refreshIfNeeded();
  }, [cvUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch + convert DOCX → HTML using mammoth
  React.useEffect(() => {
    if (!activeCvUrl || !isDOCX) return;

    const fetchAndConvert = async (url) => {
      // Kiểm tra URL có phải presigned S3 không
      const hasExpiry = url?.includes('X-Amz-Expires') || url?.includes('X-Amz-Credential');
      if (!hasExpiry && url?.includes('amazonaws.com')) {
        console.warn('⚠️ URL có vẻ không phải presigned URL — có thể bị từ chối');
      }

      const response = await fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' });
      if (!response.ok) {
        // HTTP error (403, 404, 500...) → URL hết hạn hoặc không có quyền
        const errText = await response.text().catch(() => '');
        console.error('❌ [DEBUG] HTTP', response.status, 'body:', errText.slice(0, 300));
        const expiredError = new Error('URL đã hết hạn hoặc không có quyền truy cập file.');
        expiredError.isExpired = true;
        throw expiredError;
      }

      const contentType = response.headers.get('content-type') || '';
      console.log('📄 Content-Type:', contentType);

      // Đọc toàn bộ body dưới dạng ArrayBuffer trước
      const arrayBuffer = await response.arrayBuffer();
      const header = new Uint8Array(arrayBuffer.slice(0, 4));

      console.log('🔍 [DEBUG] Magic bytes:', header[0].toString(16), header[1].toString(16), header[2].toString(16), header[3].toString(16));

      // Kiểm tra magic bytes: DOCX/ZIP bắt đầu bằng PK (0x50 0x4B)
      const isPKZip = header[0] === 0x50 && header[1] === 0x4B;

      if (!isPKZip) {
        // Không phải ZIP → đây là XML/HTML error từ S3 (AccessDenied, ExpiredToken...)
        const errText = new TextDecoder().decode(arrayBuffer.slice(0, 500));
        console.error('❌ [DEBUG] S3 error body:', errText);

        // Phân tích loại lỗi từ XML S3 trả về
        const isExpiredToken = errText.includes('ExpiredToken') || errText.includes('Request has expired') || errText.includes('TokenExpired');
        const isAccessDenied = errText.includes('AccessDenied') || errText.includes('NoSuchKey');

        const expiredError = new Error(
          isExpiredToken ? 'URL đã hết hạn hoặc không có quyền truy cập file.' :
          isAccessDenied ? 'URL đã hết hạn hoặc không có quyền truy cập file.' :
          'File không hợp lệ hoặc không thể đọc được.'
        );
        expiredError.isExpired = isExpiredToken || isAccessDenied;
        throw expiredError;
      }

      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return result.value;
    };

    const convertDocx = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📥 Fetching DOCX from:', activeCvUrl);

        const html = await fetchAndConvert(activeCvUrl);
        console.log('✅ DOCX converted to HTML');
        setDocxHtml(html);
        setLoading(false);

      } catch (err) {
        console.error('❌ DOCX convert error:', err);

        // URL hết hạn → thử lấy URL mới và fetch lại
        if (err.isExpired && onGetFreshUrl) {
          console.log('🔄 URL expired, requesting fresh URL...');
          try {
            const freshUrl = await onGetFreshUrl();
            if (freshUrl) {
              // Kiểm tra URL mới có hợp lệ không trước khi fetch
              if (isUrlExpired(freshUrl)) {
                console.warn('⚠️ Fresh URL cũng đã hết hạn, không thể tải file.');
                setError('Link xem file đã hết hạn. Vui lòng tải xuống để xem.');
                setLoading(false);
                return;
              }
              console.log('✅ Got fresh URL, retrying DOCX fetch...');
              setActiveCvUrl(freshUrl);
              const html = await fetchAndConvert(freshUrl);
              console.log('✅ DOCX converted to HTML (retry)');
              setDocxHtml(html);
              setLoading(false);
              return;
            }
          } catch (retryErr) {
            console.error('❌ Retry also failed:', retryErr);
            // Nếu retry cũng lỗi hết hạn → hiển thị nút tải xuống
            setError('Link xem file đã hết hạn. Vui lòng tải xuống để xem.');
            setLoading(false);
            return;
          }
        }

        setError(
          err.isExpired
            ? 'Link xem file đã hết hạn. Vui lòng tải xuống để xem.'
            : `Không thể đọc file: ${err.message}`
        );
        setLoading(false);
      }
    };

    convertDocx();
  }, [activeCvUrl, isDOCX]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch PDF blob (chỉ với file PDF, skip DOCX)
  React.useEffect(() => {
    if (!activeCvUrl || !isPDF) {
      setLoading(false);
      return;
    }

    let objectUrl = null;
    let timeout;

    const fetchPdfFromUrl = async (url) => {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Accept': 'application/pdf' }
      });

      if (!response.ok) {
        const err = new Error(`HTTP ${response.status}: ${response.statusText}`);
        err.isExpired = response.status === 403 || response.status === 401;
        throw err;
      }

      const blob = await response.blob();

      // Kiểm tra: nếu blob quá nhỏ hoặc content-type không phải PDF → URL hết hạn
      if (blob.size < 100 || (blob.type && !blob.type.includes('pdf') && !blob.type.includes('octet-stream'))) {
        console.warn('⚠️ Response không phải PDF (type:', blob.type, 'size:', blob.size, ')');
        const err = new Error('Response is not a valid PDF');
        err.isExpired = true;
        throw err;
      }

      return blob;
    };

    const fetchPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📥 Fetching PDF from:', activeCvUrl);

        let blob;
        try {
          blob = await fetchPdfFromUrl(activeCvUrl);
        } catch (err) {
          // URL hết hạn → thử refresh URL mới trước khi fallback
          if (err.isExpired && onGetFreshUrl) {
            console.log('🔄 PDF URL expired, requesting fresh URL...');
            try {
              const freshUrl = await onGetFreshUrl();
              if (freshUrl && !isUrlExpired(freshUrl)) {
                console.log('✅ Got fresh PDF URL, retrying...');
                setActiveCvUrl(freshUrl);
                blob = await fetchPdfFromUrl(freshUrl);
              } else {
                // Fresh URL cũng hết hạn hoặc null → dùng iframe với URL mới nhất
                console.warn('⚠️ Fresh URL also expired, using iframe fallback...');
                if (freshUrl) setActiveCvUrl(freshUrl);
                setUseIframeFallback(true);
                setLoading(false);
                return;
              }
            } catch (retryErr) {
              console.error('❌ Retry with fresh URL also failed:', retryErr);
              // Vẫn thử iframe fallback với fresh URL nếu có
              setUseIframeFallback(true);
              setLoading(false);
              return;
            }
          } else if (onGetFreshUrl) {
            // Lỗi khác nhưng có onGetFreshUrl → thử refresh rồi dùng iframe
            console.log('🔄 PDF fetch failed, trying fresh URL for iframe fallback...');
            try {
              const freshUrl = await onGetFreshUrl();
              if (freshUrl) {
                setActiveCvUrl(freshUrl);
                setUseIframeFallback(true);
                setLoading(false);
                return;
              }
            } catch (_) { /* ignore */ }
            // Không refresh được → dùng iframe với URL hiện tại
            setUseIframeFallback(true);
            setLoading(false);
            return;
          } else {
            // Không có onGetFreshUrl → dùng iframe fallback luôn
            setUseIframeFallback(true);
            setLoading(false);
            return;
          }
        }

        objectUrl = URL.createObjectURL(blob);
        console.log('✅ PDF fetched, size:', blob.size);
        setPdfData(objectUrl);

        // Safety timeout: nếu react-pdf không fire callback trong 10s → dùng iframe fallback
        timeout = setTimeout(() => {
          setLoading(prev => {
            if (prev) {
              console.warn('⚠️ react-pdf không load được, dùng iframe fallback...');
              setUseIframeFallback(true);
              return false;
            }
            return prev;
          });
        }, 10000);

      } catch (err) {
        console.error('❌ Error fetching PDF:', err);
        // Luôn dùng iframe fallback thay vì chỉ hiện lỗi
        setUseIframeFallback(true);
        setLoading(false);
      }
    };

    fetchPDF();

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); if (timeout) clearTimeout(timeout); };
  }, [activeCvUrl, isPDF]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (err) => {
    console.error('PDF.js load error:', err);
    setLoading(false);
    setUseIframeFallback(true);
  };

  const handleZoomIn = () => {
    setScale(prev => { const n = Math.min(prev + 0.2, 3.0); showZoomMsg(); return n; });
  };
  const handleZoomOut = () => {
    setScale(prev => { const n = Math.max(prev - 0.2, 0.5); showZoomMsg(); return n; });
  };
  const showZoomMsg = () => {
    setShowZoomIndicator(true);
    setTimeout(() => setShowZoomIndicator(false), 1000);
  };

  const showPdfControls = isPDF && !useGoogleViewer && !useIframeFallback;

  const renderContent = () => {
    // Loading spinner
    if (loading) {
      return (
        <LoadingMessage>
          <div className="spinner" />
          {isDOCX ? 'Đang đọc file Word...' : 'Đang tải CV...'}
        </LoadingMessage>
      );
    }

    // Error state
    if (error) {
      return (
        <ErrorMessage>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          {error}
          {onDownload && (
            <div style={{ marginTop: '16px' }}>
              <ControlButton onClick={onDownload} style={{ width: 'auto', padding: '0 20px', background: 'rgba(255,255,255,0.2)' }}>
                <Download style={{ marginRight: '8px' }} />Tải xuống CV
              </ControlButton>
            </div>
          )}
        </ErrorMessage>
      );
    }

    // DOCX → rendered HTML
    if (isDOCX && docxHtml) {
      return (
        <PDFContainer style={{ maxHeight: '82vh', overflowY: 'auto' }}>
          <div
            style={{
              width: '100%',
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
              lineHeight: '1.7',
              color: '#1e293b',
              padding: '8px 4px',
            }}
            dangerouslySetInnerHTML={{ __html: docxHtml }}
          />
        </PDFContainer>
      );
    }

    // PDF native render
    if (isPDF && !useGoogleViewer && !useIframeFallback) {
      return (
        <PDFContainer>
          {numPages > 1 && (
            <PageNavigation>
              <NavButton onClick={() => setPageNumber(p => Math.max(p - 1, 1))} disabled={pageNumber <= 1}>
                <ChevronLeft />
              </NavButton>
              <PageInfo>Trang {pageNumber} / {numPages}</PageInfo>
              <NavButton onClick={() => setPageNumber(p => Math.min(p + 1, numPages))} disabled={pageNumber >= numPages}>
                <ChevronRight />
              </NavButton>
            </PageNavigation>
          )}
          <Document
            file={pdfData || activeCvUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <LoadingMessage>
                <div className="spinner" />
                Đang tải CV...
              </LoadingMessage>
            }
            options={{
              cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
              cMapPacked: true,
              withCredentials: false,
              standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/standard_fonts/`,
              isEvalSupported: false
            }}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </PDFContainer>
      );
    }

    // PDF iframe fallback — embed trực tiếp vào iframe (browser built-in PDF viewer)
    if (isPDF && useIframeFallback && activeCvUrl) {
      return (
        <PDFContainer style={{ padding: 0, overflow: 'hidden' }}>
          <iframe
            key={activeCvUrl}
            src={`${activeCvUrl}#toolbar=1&navpanes=0&view=FitH`}
            title={fileName || 'CV PDF'}
            style={{
              width: '100%',
              height: '82vh',
              border: 'none',
              background: '#fff',
            }}
            onLoad={() => setLoading(false)}
            onError={() => {
              // iframe cũng không load được → hiện error cuối cùng
              setUseGoogleViewer(true);
              setUseIframeFallback(false);
            }}
          />
        </PDFContainer>
      );
    }

    // PDF fallback cuối cùng (cả iframe lẫn fetch đều thất bại)
    if (useGoogleViewer) {
      return (
        <ErrorMessage>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          Không thể xem file PDF trong trình duyệt. URL có thể đã hết hạn.
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {onGetFreshUrl && (
              <ControlButton
                onClick={async () => {
                  try {
                    setUseGoogleViewer(false);
                    setUseIframeFallback(false);
                    setLoading(true);
                    setError(null);
                    setPdfData(null);
                    const freshUrl = await onGetFreshUrl();
                    if (freshUrl) {
                      setActiveCvUrl(freshUrl);
                    } else {
                      setUseGoogleViewer(true);
                      setLoading(false);
                    }
                  } catch (e) {
                    console.warn('Retry failed:', e);
                    setUseGoogleViewer(true);
                    setLoading(false);
                  }
                }}
                style={{ width: 'auto', padding: '0 20px', background: 'rgba(16,185,129,0.3)', border: '1px solid rgba(16,185,129,0.5)' }}
              >
                <RefreshCw style={{ marginRight: '8px', width: 16, height: 16 }} />Thử lại
              </ControlButton>
            )}
            {activeCvUrl && (
              <ControlButton
                onClick={() => window.open(activeCvUrl, '_blank')}
                style={{ width: 'auto', padding: '0 20px', background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.5)' }}
              >
                <Maximize2 style={{ marginRight: '8px', width: 16, height: 16 }} />Mở tab mới
              </ControlButton>
            )}
            {onDownload && (
              <ControlButton onClick={onDownload} style={{ width: 'auto', padding: '0 20px', background: 'rgba(255,255,255,0.2)' }}>
                <Download style={{ marginRight: '8px' }} />Tải xuống CV
              </ControlButton>
            )}
          </div>
        </ErrorMessage>
      );
    }

    // Unknown
    return (
      <ErrorMessage>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        Không thể xem file này trong trình duyệt.
        {onDownload && (
          <div style={{ marginTop: '16px' }}>
            <ControlButton onClick={onDownload} style={{ width: 'auto', padding: '0 20px', background: 'rgba(255,255,255,0.2)' }}>
              <Download style={{ marginRight: '8px' }} />Tải xuống CV
            </ControlButton>
          </div>
        )}
      </ErrorMessage>
    );
  };

  return (
    <Overlay onClick={onClose}>
      <Header onClick={e => e.stopPropagation()}>
        <Title>{fileName || 'CV'}</Title>
        <Controls>
          {showPdfControls && numPages > 1 && (
            <>
              <ControlButton onClick={() => setPageNumber(p => Math.max(p - 1, 1))} disabled={pageNumber <= 1} title="Trang trước">
                <ChevronLeft />
              </ControlButton>
              <ControlButton onClick={() => setPageNumber(p => Math.min(p + 1, numPages))} disabled={pageNumber >= numPages} title="Trang sau">
                <ChevronRight />
              </ControlButton>
            </>
          )}
          {showPdfControls && (
            <>
              <ControlButton onClick={handleZoomOut} disabled={scale <= 0.5} title="Thu nhỏ"><ZoomOut /></ControlButton>
              <ControlButton onClick={handleZoomIn} disabled={scale >= 3.0} title="Phóng to"><ZoomIn /></ControlButton>
            </>
          )}
          {onDownload && (
            <ControlButton onClick={onDownload} title="Tải xuống"><Download /></ControlButton>
          )}
          <ControlButton onClick={onClose} title="Đóng"><X /></ControlButton>
        </Controls>
      </Header>

      <Content onClick={e => e.stopPropagation()}>
        {renderContent()}
        <ZoomIndicator $show={showZoomIndicator}>{Math.round(scale * 100)}%</ZoomIndicator>
      </Content>
    </Overlay>
  );
};

export default CVPreviewModal;
