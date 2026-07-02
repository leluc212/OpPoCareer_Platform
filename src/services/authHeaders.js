/**
 * Shared authentication header utility
 *
 * Gets the ID token from Amplify v6 fetchAuthSession().
 * Handles token refresh automatically when expired.
 */
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Decode a JWT and return its payload, or null on failure.
 */
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (_) {
    return null;
  }
}

/**
 * Returns true if the JWT is expired (or expires within 60 seconds).
 */
function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now() + 60_000;
}

/**
 * Extract a validated JWT string from an Amplify v6 idToken object (or plain string).
 * Returns null if the value is not a proper 3-part JWT.
 */
function extractJwtString(idToken) {
  if (!idToken) return null;

  // Amplify v6 JWT class: toString() returns full JWT string.
  // Prefer toString() over jwtToken (jwtToken may be just the signature in some versions).
  const raw =
    (typeof idToken === 'string' ? idToken : null) ||
    idToken?.toString?.() ||
    idToken?.jwtToken ||
    '';

  const cleaned = raw.trim().replace(/[\r\n\t]/g, '');

  // Must be a 3-part JWT: header.payload.signature
  if (cleaned.split('.').length !== 3) {
    console.warn(
      `⚠️ [getIdToken] Non-JWT value from Amplify (${cleaned.slice(0, 40)}...) — skipping. Parts: ${cleaned.split('.').length}`
    );
    return null;
  }
  return cleaned;
}

/**
 * Returns the raw JWT id-token string from Amplify fetchAuthSession().
 * If the token is expired, forces a session refresh.
 * Returns null if no valid token is available (user not logged in).
 */
export async function getIdToken() {
  try {
    const session = await fetchAuthSession();
    const idToken = session?.tokens?.idToken;

    if (idToken) {
      const cleaned = extractJwtString(idToken);

      if (cleaned) {
        // Token expired → force refresh
        if (isTokenExpired(cleaned)) {
          try {
            const refreshed = await fetchAuthSession({ forceRefresh: true });
            const refreshedJwt = extractJwtString(refreshed?.tokens?.idToken);
            if (refreshedJwt) return refreshedJwt;
          } catch (_) {
            console.warn('[getIdToken] Token expired and refresh failed');
          }
        }
        return cleaned;
      }

      // extractJwtString returned null → try forceRefresh
      console.warn('[getIdToken] extractJwtString returned null — trying forceRefresh');
      try {
        const refreshed = await fetchAuthSession({ forceRefresh: true });
        const refreshedJwt = extractJwtString(refreshed?.tokens?.idToken);
        if (refreshedJwt) return refreshedJwt;
      } catch (_) {
        console.warn('[getIdToken] forceRefresh also failed');
      }
    } else {
      console.warn('[getIdToken] session.tokens.idToken is null/undefined');
    }
  } catch (err) {
    console.warn('[getIdToken] fetchAuthSession threw:', err?.message);
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
