// Payment service — VietQR + SePay integration
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = import.meta.env.DEV
  ? '/api-payments'
  : (import.meta.env.VITE_PAYMENTS_API_URL || 'https://ygabt1q860.execute-api.ap-southeast-1.amazonaws.com/prod');

/** @returns {Promise<string|null>} */
async function getToken() {
  try {
    const session = await fetchAuthSession();
    const token = session?.tokens?.idToken;
    if (!token) return null;
    return typeof token === 'string' ? token.trim() : token.toString().trim();
  } catch {
    return null;
  }
}

async function authHeaders() {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Create a payment intent
 * @param {{ userId: string, packageId: string, amount: number, packageName?: string, duration?: string }} params
 * @returns {Promise<{ paymentId: string, transferCode: string, amount: number, qrUrl: string, bankId: string, accountNo: string, accountName: string }>}
 */
export async function createPayment({ userId, packageId, amount, packageName, duration }) {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId, packageId, amount, packageName, duration }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Poll payment status
 * @param {string} paymentId
 * @returns {Promise<{ paymentId: string, status: 'pending'|'paid', amount: number, transferCode: string, paidAt?: string, transactionId?: string }>}
 */
export async function getPaymentStatus(paymentId) {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE}/payments/${paymentId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Poll until paid or timeout
 * @param {string} paymentId
 * @param {{ intervalMs?: number, timeoutMs?: number, onTick?: (status: string) => void }} options
 * @returns {Promise<'paid'|'timeout'>}
 */
export async function pollUntilPaid(paymentId, { intervalMs = 10000, timeoutMs = 600000, onTick } = {}) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const { status } = await getPaymentStatus(paymentId);
      onTick?.(status);
      if (status === 'paid') return 'paid';
    } catch (err) {
      console.warn('Poll error:', err.message);
    }
  }

  return 'timeout';
}
