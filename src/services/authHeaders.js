/**
 * Shared authentication header utility
 *
 * Tries Amplify's fetchAuthSession first. If the session cache hasn't rehydrated
 * yet (common race condition on page load / after PKCE login), falls back to the
 * OPPO_ID_TOKEN key written by AuthContext during the PKCE token exchange.
 */
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Returns the raw JWT id-token string, or null if unavailable.
 */
export async function getIdToken() {
  try {
    const session = await fetchAuthSession();
    const idToken = session?.tokens?.idToken;
    if (idToken) {
      const tokenStr = typeof idToken === 'string' ? idToken : idToken.toString();
      return tokenStr.trim().replace(/[\r\n\t]/g, '');
    }
  } catch (_) {
    // Amplify not ready — fall through to localStorage
  }

  // Fallback: token written by AuthContext during PKCE login
  const localToken = localStorage.getItem('OPPO_ID_TOKEN');
  if (localToken) {
    return localToken.trim();
  }

  return null;
}

/**
 * Returns fetch-compatible headers with Authorization bearer token.
 * Retries up to `retries` times with increasing delay to handle the race
 * condition where Amplify's session cache is still being restored.
 *
 * @param {number} retries - number of attempts (default 3)
 * @throws {Error} if no token is available after all retries
 */
export async function getAuthHeaders(retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, 300 * attempt));
    }

    const token = await getIdToken();
    if (token) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
    }
  }

  const err = new Error('No authentication token available');
  console.warn('⚠️ No authentication token available');
  throw err;
}
