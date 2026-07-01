/**
 * Banner Service
 * Handles CRUD operations for banners via API Gateway → Lambda → DynamoDB/S3
 * 
 * API endpoint: VITE_BANNER_API_URL
 * Banners stored in DynamoDB table: Banners
 * Images stored in S3: banner/ folder
 */

import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_BANNER_API_URL || 'https://dlidp35x33.execute-api.ap-southeast-1.amazonaws.com/prod';
const S3_BASE_URL = import.meta.env.VITE_S3_ASSETS_URL || 
  `https://${import.meta.env.VITE_S3_BUCKET_NAME || 'opporeview-cv-storage'}.s3.ap-southeast-1.amazonaws.com`;

export const MAX_ACTIVE_BANNERS = 5;

// ─── Auth Helper ─────────────────────────────────────────────────────────────

const getAuthHeaders = async () => {
  try {
    const session = await fetchAuthSession();
    const token = session?.tokens?.idToken?.toString();
    if (token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
    }
  } catch {
    // swallow — proceed without auth header
  }
  return { 'Content-Type': 'application/json' };
};

// ─── File Helpers ─────────────────────────────────────────────────────────────

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

const sanitizeFilename = (filename) => {
  const lastDot = filename.lastIndexOf('.');
  const name = lastDot > 0 ? filename.substring(0, lastDot) : filename;
  const ext  = lastDot > 0 ? filename.substring(lastDot) : '';
  const safe = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s_-]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 80);
  return safe + ext;
};

// ─── Local Storage Fallback ───────────────────────────────────────────────────
// When the backend is not yet deployed, banners are persisted in localStorage
// so the admin can still test the full UI workflow.

const LS_KEY = 'opporeview_banners';

const loadFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveToStorage = (banners) => {
  localStorage.setItem(LS_KEY, JSON.stringify(banners));
};

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Fetch all banners from the backend.
 * Falls back to localStorage if the API is unavailable.
 */
export const getAllBanners = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/banners`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const banners = data.banners || data.data || data || [];
    saveToStorage(banners); // keep local copy in sync
    return banners;
  } catch (err) {
    console.warn('⚠️ [bannerService] API unavailable, using localStorage fallback:', err.message);
    return loadFromStorage();
  }
};

/**
 * Upload a banner image to S3 via Lambda (base64 POST pattern).
 * Returns the S3 URL of the uploaded image.
 * Falls back to a local object URL for testing when the API is unavailable.
 */
export const uploadBannerImage = async (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Chỉ chấp nhận file JPG, PNG, WebP, GIF');
  }
  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) {
    throw new Error('File không được vượt quá 10MB');
  }

  try {
    const base64Content = await fileToBase64(file);
    const safeFileName = `banner_${Date.now()}_${sanitizeFilename(file.name)}`;

    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/banners/upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fileName: safeFileName,
        fileContent: base64Content.split(',')[1],
        fileType: file.type,
        folder: 'banner'
      }),
      mode: 'cors'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.imageUrl || `${S3_BASE_URL}/banner/${safeFileName}`;
  } catch (err) {
    if (err.message.startsWith('Chỉ chấp nhận') || err.message.startsWith('File không')) {
      throw err;
    }
    console.warn('⚠️ [bannerService] Upload API unavailable, using object URL:', err.message);
    // Return a local preview URL so the UI works without a deployed backend
    return URL.createObjectURL(file);
  }
};

/**
 * Create a new banner record.
 */
export const createBanner = async (bannerData) => {
  const newBanner = {
    ...bannerData,
    bannerId: `banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    isActive: false,
    targetRegions: bannerData.targetRegions || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/banners`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newBanner),
      mode: 'cors'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const created = data.banner || data.data || newBanner;

    // Update local cache
    const local = loadFromStorage();
    saveToStorage([...local, created]);
    return created;
  } catch (err) {
    console.warn('⚠️ [bannerService] API unavailable, saving to localStorage:', err.message);
    const local = loadFromStorage();
    saveToStorage([...local, newBanner]);
    return newBanner;
  }
};

/**
 * Update a banner (title, link, active state, etc.)
 */
export const updateBanner = async (bannerId, updates) => {
  const payload = { ...updates, updatedAt: new Date().toISOString() };

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/banners/${encodeURIComponent(bannerId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
      mode: 'cors'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const updated = data.banner || data.data || { ...payload, bannerId };

    const local = loadFromStorage();
    saveToStorage(local.map(b => b.bannerId === bannerId ? { ...b, ...updated } : b));
    return updated;
  } catch (err) {
    console.warn('⚠️ [bannerService] API unavailable, updating localStorage:', err.message);
    const local = loadFromStorage();
    const updated = local.map(b => b.bannerId === bannerId ? { ...b, ...payload } : b);
    saveToStorage(updated);
    return updated.find(b => b.bannerId === bannerId);
  }
};

/**
 * Delete a banner.
 */
export const deleteBanner = async (bannerId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/banners/${encodeURIComponent(bannerId)}`, {
      method: 'DELETE',
      headers,
      mode: 'cors'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.warn('⚠️ [bannerService] API unavailable, deleting from localStorage:', err.message);
  }

  // Always clean up local cache
  const local = loadFromStorage();
  saveToStorage(local.filter(b => b.bannerId !== bannerId));
};

/**
 * Toggle active state.
 * Enforces MAX_ACTIVE_BANNERS limit — cannot activate if already at cap.
 * Returns { success, activeBanners, message }
 */
export const toggleBannerActive = async (bannerId, currentBanners) => {
  const target = currentBanners.find(b => b.bannerId === bannerId);
  if (!target) throw new Error('Banner not found');

  const isTopSpotlight = !!target.isTopSpotlight;
  const activeSameType = currentBanners.filter(
    b => b.isActive && !!b.isTopSpotlight === isTopSpotlight && b.bannerId !== bannerId
  );

  if (!target.isActive && activeSameType.length >= MAX_ACTIVE_BANNERS) {
    return {
      success: false,
      message: isTopSpotlight
        ? `Đã đạt giới hạn ${MAX_ACTIVE_BANNERS} banner Top Spotlight đang chạy. Hãy tắt một banner trước.`
        : `Đã đạt giới hạn ${MAX_ACTIVE_BANNERS} banner tiêu chuẩn đang chạy. Hãy tắt một banner trước.`
    };
  }

  const newState = !target.isActive;
  await updateBanner(bannerId, { isActive: newState });

  return { success: true, isActive: newState };
};

/**
 * Get only the active banners (for use on the public website).
 * Optionally filters by candidate location (region targeting).
 * @param {string} [candidateLocation] - Candidate's location string (e.g. "Quận 1, TP.HCM")
 * Returns banners sorted by type (Top Spotlight first) and order/createdAt.
 */
export const getActiveBanners = async (candidateLocation = '') => {
  const all = await getAllBanners();
  const activeAndFiltered = all
    .filter(b => b.isActive)
    .filter(b => {
      // Check expiration
      if (b.expiredAt && new Date(b.expiredAt).getTime() < Date.now()) {
        return false;
      }
      // If no targetRegions set (empty or missing), show to everyone
      if (!b.targetRegions || b.targetRegions.length === 0) return true;
      // If candidate has no location, only show banners without region targeting
      if (!candidateLocation) return false;
      // Check if any target region matches the candidate's location string
      const loc = candidateLocation.toLowerCase();
      return b.targetRegions.some(region => loc.includes(region.toLowerCase()));
    });

  const spotlightBanners = activeAndFiltered
    .filter(b => !!b.isTopSpotlight)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, MAX_ACTIVE_BANNERS);

  const standardBanners = activeAndFiltered
    .filter(b => !b.isTopSpotlight)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, MAX_ACTIVE_BANNERS);

  return [...spotlightBanners, ...standardBanners];
};

export default {
  getAllBanners,
  uploadBannerImage,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
  getActiveBanners,
  MAX_ACTIVE_BANNERS
};
