/**
 * ekycService.js — Gọi VNPT eKYC qua API Gateway Lambda
 *
 * Endpoint: https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod
 * Override bằng env var VITE_EKYC_API_URL nếu cần.
 */

import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE =
  import.meta.env.VITE_EKYC_API_URL ||
  'https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod';

// ─── Auth header ──────────────────────────────────────────────────────────────
const getAuthHeaders = async () => {
  try {
    const session  = await fetchAuthSession();
    const idToken  = session?.tokens?.idToken;
    if (!idToken) return { 'Content-Type': 'application/json' };
    const tokenStr = (typeof idToken === 'string' ? idToken : idToken.toString()).trim();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenStr}`,
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
};

// ─── Image compression ────────────────────────────────────────────────────────
/**
 * Nén ảnh về ≤1080px, JPEG 0.85.
 * Tuân thủ Nghị định 13/2023: ảnh chỉ gửi để xác thực, không lưu công khai.
 */
export const compressImage = (base64DataUrl, maxWidth = 1080) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width  = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Không thể load ảnh để nén'));
    img.src = base64DataUrl;
  });

// ─── POST /ekyc/ocr ───────────────────────────────────────────────────────────
/**
 * OCR ảnh CCCD mặt trước/sau qua VNPT eKYC.
 * @param {string} imageFront  base64 data URL
 * @param {string} [imageBack] base64 data URL (optional)
 */
export const ocrCCCD = async (imageFront, imageBack = null) => {
  const headers = await getAuthHeaders();

  const [front, back] = await Promise.all([
    compressImage(imageFront),
    imageBack ? compressImage(imageBack) : Promise.resolve(null),
  ]);

  const res = await fetch(`${API_BASE}/ekyc/ocr`, {
    method:  'POST',
    headers,
    body: JSON.stringify({
      imageFront: front,
      ...(back && { imageBack: back }),
    }),
  });

  if (res.status === 429) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.errorMsg || 'Đã vượt quá giới hạn xác thực trong ngày.');
  }
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.errorMsg || `OCR thất bại (${res.status})`);
  }
  return res.json();
};

// ─── POST /ekyc/verify-face ───────────────────────────────────────────────────
/**
 * Xác minh khuôn mặt: face matching + liveness.
 * Nếu similarity ≥ 85% và liveness = true → Lambda update DynamoDB kycStatus=VERIFIED.
 * @param {string} faceImage     base64 data URL selfie
 * @param {string} [idFrontImage] base64 data URL CCCD mặt trước
 */
export const verifyFace = async (faceImage, idFrontImage = null, idFrontHash = null) => {
  const headers = await getAuthHeaders();

  const [face, idFront] = await Promise.all([
    compressImage(faceImage, 720),
    idFrontImage ? compressImage(idFrontImage) : Promise.resolve(null),
  ]);

  const res = await fetch(`${API_BASE}/ekyc/verify-face`, {
    method:  'POST',
    headers,
    body: JSON.stringify({
      faceImage: face,
      ...(idFront     && { idFrontImage: idFront }),
      ...(idFrontHash && { idFrontHash }),  // tái dùng hash từ bước OCR, tiết kiệm 1 upload
    }),
  });

  if (res.status === 429) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.errorMsg || 'Đã vượt quá giới hạn xác thực trong ngày.');
  }
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.errorMsg || `Xác minh khuôn mặt thất bại (${res.status})`);
  }
  return res.json();
};

// ─── GET /ekyc/status/:userId ─────────────────────────────────────────────────
export const getKycStatus = async (userId) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/ekyc/status/${userId}`, { headers });
  if (!res.ok) throw new Error(`Không lấy được trạng thái KYC (${res.status})`);
  return res.json();
};
