import { cloneDefaultPackageCatalog } from '../data/packageCatalog';

// Primary API endpoint (set in env after deploy). In development you can set
// `VITE_PACKAGE_SUBSCRIPTIONS_PROXY_BASE=/api-packages` and configure the
// dev server proxy to forward `/api-packages` to the real API to avoid CORS.
const API_ENDPOINT = import.meta.env.VITE_PACKAGE_SUBSCRIPTIONS_API;
const DEV_PROXY_BASE = import.meta.env.VITE_PACKAGE_SUBSCRIPTIONS_PROXY_BASE || '/api-packages';

const normalizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizePackageItem = (item) => {
  if (!item) return null;

  const defaults = {
    packageId: item.packageId || item.id || item.packageName,
    packageName: item.packageName || item.name || 'Gói dịch vụ',
    order: normalizeNumber(item.order) || 1,
    subtitle: typeof item.subtitle === 'object'
      ? {
          vi: item.subtitle.vi || '',
          en: item.subtitle.en || ''
        }
      : {
          vi: item.subtitleVi || item.subtitle || '',
          en: item.subtitleEn || item.subtitle || ''
        },
    prices: Array.isArray(item.prices)
      ? item.prices.map((price) => ({
          duration: price.duration || '',
          amount: normalizeNumber(price.amount)
        }))
      : [],
    features: Array.isArray(item.features)
      ? {
          vi: [...item.features],
          en: [...item.features]
        }
      : {
          vi: Array.isArray(item.features?.vi) ? [...item.features.vi] : [],
          en: Array.isArray(item.features?.en) ? [...item.features.en] : []
        },
    color: item.color || '#1e40af',
    bg: item.bg || '#EFF6FF',
    bd: item.bd || '#BFDBFE',
    dur: item.dur || '4s',
    featured: Boolean(item.featured),
    iconKey: item.iconKey || item.icon || 'sparkles',
    updatedAt: item.updatedAt || null,
    createdAt: item.createdAt || null
  };

  return defaults;
};

const mergeWithDefaults = (items) => {
  const defaults = cloneDefaultPackageCatalog();
  const byId = new Map((items || [])
    .map(normalizePackageItem)
    .filter(Boolean)
    .map((item) => [item.packageId, item]));

  return defaults.map((item) => {
    const saved = byId.get(item.packageId);
    if (!saved) return item;

    return {
      ...item,
      ...saved,
      subtitle: {
        ...item.subtitle,
        ...saved.subtitle
      },
      prices: saved.prices.length ? saved.prices : item.prices,
      features: {
        vi: saved.features.vi.length ? saved.features.vi : item.features.vi,
        en: saved.features.en.length ? saved.features.en : item.features.en
      }
    };
  });
};

export const getDefaultPackageCatalog = () => cloneDefaultPackageCatalog();

export const getPackageCatalog = async () => {
  // Choose base URL: deployed API endpoint has priority. In dev, allow proxy.
  const base = API_ENDPOINT || (import.meta.env.DEV ? DEV_PROXY_BASE : null);

  if (!base) {
    return cloneDefaultPackageCatalog();
  }

  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/packages`);
    if (!response.ok) {
      console.warn('Package catalog fetch returned non-OK response', response.status);
      return cloneDefaultPackageCatalog();
    }

    const payload = await response.json();
    const data = Array.isArray(payload) ? payload : payload?.data || [];
    return mergeWithDefaults(data);
  } catch (err) {
    // Network or CORS error — fall back to bundled defaults so the UI stays usable.
    // eslint-disable-next-line no-console
    console.error('Failed to fetch package catalog, using defaults:', err);
    return cloneDefaultPackageCatalog();
  }
};

export const updatePackageCatalogItem = async (packageItem) => {
  const base = API_ENDPOINT || (import.meta.env.DEV ? DEV_PROXY_BASE : null);
  if (!base) {
    throw new Error('Package subscriptions API endpoint is not configured');
  }

  const url = `${base.replace(/\/$/, '')}/packages/${encodeURIComponent(packageItem.packageId)}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(packageItem)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to update package catalog item');
  }

  const payload = await response.json();
  return payload?.data || payload;
};

export const normalizePackageCatalogItem = (item) => normalizePackageItem(item);

export const getWallet = async (employerId) => {
  const base = API_ENDPOINT || (import.meta.env.DEV ? DEV_PROXY_BASE : null);
  if (!base) {
    throw new Error('API endpoint is not configured');
  }

  const url = `${base.replace(/\/$/, '')}/wallet/${encodeURIComponent(employerId)}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to fetch wallet info');
  }

  const payload = await response.json();
  return payload?.data || payload;
};

export const withdrawWallet = async (employerId, amount, bankName, accountNumber, accountName, companyName = '', companyLogo = '') => {
  const base = API_ENDPOINT || (import.meta.env.DEV ? DEV_PROXY_BASE : null);
  if (!base) {
    throw new Error('API endpoint is not configured');
  }

  const url = `${base.replace(/\/$/, '')}/wallet/withdraw`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      employerId,
      amount,
      bankName,
      accountNumber,
      accountName,
      companyName,
      companyLogo
    })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to process withdrawal');
  }

  const payload = await response.json();
  return payload?.data || payload;
};

export const getWithdrawalRequests = async () => {
  const base = API_ENDPOINT || (import.meta.env.DEV ? DEV_PROXY_BASE : null);
  if (!base) {
    throw new Error('API endpoint is not configured');
  }

  const url = `${base.replace(/\/$/, '')}/wallet/withdrawals`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to fetch withdrawal requests');
  }

  const payload = await response.json();
  return payload?.data || payload;
};

export const updateWithdrawalStatus = async (requestId, status) => {
  const base = API_ENDPOINT || (import.meta.env.DEV ? DEV_PROXY_BASE : null);
  if (!base) {
    throw new Error('API endpoint is not configured');
  }

  const url = `${base.replace(/\/$/, '')}/wallet/withdrawals/${encodeURIComponent(requestId)}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to update withdrawal status');
  }

  const payload = await response.json();
  return payload?.data || payload;
};
