/**
 * ekycService.js — Gọi Didit eKYC qua API Gateway Lambda
 *
 * Đã migration từ VNPT sang Didit:
 *   - VNPT: bearer token expire 8h, cần refresh định kỳ, upload ảnh base64
 *   - Didit: session-based flow — tạo session → redirect user → nhận kết quả qua webhook
 *
 * Endpoint: https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod
 * Override bằng env var VITE_EKYC_API_URL nếu cần.
 *
 * [VNPT CODE GỐC — ĐÃ COMMENT LẠI ĐỂ ROLLBACK NẾU CẦN]
 * Tìm kiếm "VNPT_LEGACY" để thấy code cũ
 */

import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE =
  import.meta.env.VITE_EKYC_API_URL ||
  'https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod';

// ─── Auth header (Cognito JWT — giữ nguyên cho các route yêu cầu JWT) ────────
const getAuthHeaders = async () => {
  // 1. Thử Amplify fetchAuthSession trước
  try {
    const session  = await fetchAuthSession();
    const idToken  = session?.tokens?.idToken;
    if (idToken) {
      const tokenStr = (typeof idToken === 'string' ? idToken : idToken.toString()).trim();
      if (tokenStr) {
        return {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${tokenStr}`,
        };
      }
    }
  } catch {
    // ignore, fallback below
  }

  // 2. Fallback: quét localStorage tìm idToken Cognito
  try {
    const idTokenKey = Object.keys(localStorage).find(
      k => k.includes('CognitoIdentityServiceProvider') && k.endsWith('.idToken')
    );
    if (idTokenKey) {
      const idToken = localStorage.getItem(idTokenKey);
      if (idToken) return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` };
    }
  } catch { /* ignore */ }

  // 3. Fallback: sessionStorage
  try {
    const idTokenKey = Object.keys(sessionStorage).find(
      k => k.includes('CognitoIdentityServiceProvider') && k.endsWith('.idToken')
    );
    if (idTokenKey) {
      const idToken = sessionStorage.getItem(idTokenKey);
      if (idToken) return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` };
    }
  } catch { /* ignore */ }

  return { 'Content-Type': 'application/json' };
};


// ─── Didit: Tạo session xác minh ─────────────────────────────────────────────
/**
 * Tạo session xác minh Didit.
 * Trả về { session_id, redirect_url } — frontend redirect user đến redirect_url.
 *
 * Khác biệt với VNPT:
 *   - VNPT: upload ảnh CCCD + selfie trực tiếp
 *   - Didit: tạo session → user thực hiện trên trang Didit → kết quả về qua webhook
 *
 * @param {string} [callbackUrl] URL callback sau khi user hoàn tất trên Didit
 */
export const createVerificationSession = async (callbackUrl = '') => {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_BASE}/ekyc/session`, {
    method:  'POST',
    headers,
    body: JSON.stringify({ callbackUrl }),
  });

  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.errorMsg || `Tạo session xác minh thất bại (${res.status})`);
  }
  return res.json();
};


// ─── GET /ekyc/status/:userId ─────────────────────────────────────────────────
/**
 * Lấy trạng thái KYC từ DynamoDB.
 * Contract giữ nguyên — trả về { kycStatus, kycCompleted, kycVerifiedAt, provider }.
 */
export const getKycStatus = async (userId) => {
  const headers = await getAuthHeaders();
  const res     = await fetch(`${API_BASE}/ekyc/status/${userId}`, { headers });
  if (!res.ok) throw new Error(`Không lấy được trạng thái KYC (${res.status})`);
  return res.json();
};


// ─── Image compression utils (giữ lại — có thể dùng cho upload profile ảnh) ──
/**
 * Nén/resize ảnh, xử lý EXIF orientation.
 */
export const compressImage = (base64DataUrl, maxWidth = 1080) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width < 300 || height < 300) {
        reject(new Error(`Ảnh quá nhỏ (${width}x${height}px). Cần tối thiểu 300x300px`));
        return;
      }
      if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
      if (width < 480) { const scale = 480 / width; width = 480; height = Math.round(height * scale); }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('Không thể load ảnh. Vui lòng chọn file ảnh hợp lệ.'));
    img.src = base64DataUrl;
  });

export const compressImageWithOrientation = (base64DataUrl, maxWidth = 1080) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let orientation = 1;
      try {
        const b64    = base64DataUrl.includes(',') ? base64DataUrl.split(',')[1] : base64DataUrl;
        const binary = atob(b64.substring(0, 500));
        const bytes  = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        for (let i = 0; i < bytes.length - 1; i++) {
          if (bytes[i] === 0xFF && bytes[i + 1] === 0xE1) {
            for (let j = i; j < Math.min(i + 200, bytes.length - 1); j++) {
              if (bytes[j] === 0x01 && bytes[j + 1] === 0x12) { orientation = bytes[j + 9] || 1; break; }
            }
            break;
          }
        }
      } catch { /* ignore EXIF errors */ }

      let { width, height } = img;
      const isRotated = orientation >= 5 && orientation <= 8;
      let canvasW = isRotated ? height : width;
      let canvasH = isRotated ? width : height;
      if (canvasW > maxWidth) { canvasH = Math.round((canvasH * maxWidth) / canvasW); canvasW = maxWidth; }
      if (canvasW < 480) { const scale = 480 / canvasW; canvasW = 480; canvasH = Math.round(canvasH * scale); }
      if (canvasW < 300 || canvasH < 300) { reject(new Error('Ảnh quá nhỏ. Cần tối thiểu 300x300px')); return; }

      const canvas = document.createElement('canvas');
      canvas.width = canvasW; canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.save();
      switch (orientation) {
        case 2: ctx.transform(-1, 0, 0, 1, canvasW, 0); break;
        case 3: ctx.transform(-1, 0, 0, -1, canvasW, canvasH); break;
        case 4: ctx.transform(1, 0, 0, -1, 0, canvasH); break;
        case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
        case 6: ctx.transform(0, 1, -1, 0, canvasH, 0); break;
        case 7: ctx.transform(0, -1, -1, 0, canvasH, canvasW); break;
        case 8: ctx.transform(0, -1, 1, 0, 0, canvasW); break;
        default: break;
      }
      ctx.drawImage(img, 0, 0, isRotated ? canvasH : canvasW, isRotated ? canvasW : canvasH);
      ctx.restore();
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('Không thể load ảnh. Vui lòng chọn file ảnh hợp lệ.'));
    img.src = base64DataUrl;
  });


/*
 * ══════════════════════════════════════════════════════════════════════
 * VNPT_LEGACY — Code VNPT cũ, giữ lại để rollback khi cần
 * Không xoá cho đến khi Didit hoạt động ổn định ở production
 * ══════════════════════════════════════════════════════════════════════
 *
 * export const ocrCCCD = async (imageFront, imageBack = null) => {
 *   const headers = await getAuthHeaders();
 *   const compressIfNeeded = async (dataUrl) => {
 *     if (!dataUrl) return null;
 *     const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
 *     const sizeBytes = (b64.length * 3) / 4;
 *     if (sizeBytes > 500 * 1024) return compressImageWithOrientation(dataUrl, 1200);
 *     return compressImageWithOrientation(dataUrl, 1920);
 *   };
 *   const [front, back] = await Promise.all([
 *     compressIfNeeded(imageFront),
 *     imageBack ? compressIfNeeded(imageBack) : Promise.resolve(null),
 *   ]);
 *   const res = await fetch(`${API_BASE}/ekyc/ocr`, {
 *     method: 'POST', headers,
 *     body: JSON.stringify({ imageFront: front, ...(back && { imageBack: back }) }),
 *   });
 *   if (res.status === 429) { const d = await res.json().catch(() => ({})); throw new Error(d.errorMsg || 'Đã vượt quá giới hạn xác thực trong ngày.'); }
 *   if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.errorMsg || `OCR thất bại (${res.status})`); }
 *   return res.json();
 * };
 *
 * export const verifyFace = async (faceImage, front_hash = null, front_token = null, ocrData = null) => {
 *   const headers = await getAuthHeaders();
 *   const [face]  = await Promise.all([compressImageWithOrientation(faceImage, 720)]);
 *   const res = await fetch(`${API_BASE}/ekyc/verify-face`, {
 *     method: 'POST', headers,
 *     body: JSON.stringify({ faceImage: face, ...(front_hash && { front_hash }), ...(front_token && { front_token }), ...(ocrData && { ocrData }) }),
 *   });
 *   if (res.status === 429) { const d = await res.json().catch(() => ({})); throw new Error(d.errorMsg || 'Đã vượt quá giới hạn xác thực trong ngày.'); }
 *   if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.errorMsg || `Xác minh khuôn mặt thất bại (${res.status})`); }
 *   return res.json();
 * };
 *
 * ══════════════════════════════════════════════════════════════════════
 */
