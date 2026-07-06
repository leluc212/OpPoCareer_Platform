/**
 * Shared authentication header utility
 *
 * Gets the ID token from Amplify v6 fetchAuthSession().
 * Handles token refresh automatically when expired.
 */
import { fetchAuthSession } from 'aws-amplify/auth';

// Cognito User Pool Client ID — used to scan localStorage for the idToken
// when the Amplify session object returns a non-JWT value.
const USER_POOL_CLIENT_ID = '2mv7qt4gpmq03dmlm0or9724n8';

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
 * Validate that a string is a proper 3-part JWT (header.payload.signature).
 * Returns the cleaned token string, or null if invalid.
 */
function validateJwt(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/[\r\n\t]/g, '');
  if (cleaned.split('.').length !== 3) return null;
  return cleaned;
}

/**
 * Extract a validated JWT string from an Amplify v6 idToken object (or plain string).
 *
 * Amplify v6 wraps the token in a decoded object: { toString: () => rawJwt, payload }.
 * We must call toString() to get the raw JWT string.
 * We do NOT use idToken.jwtToken — in some builds that field holds only the
 * signature (a bare Base64 hash), not the full JWT.
 */
function extractJwtString(idToken) {
  if (!idToken) return null;

  // Try each possible source in order of reliability
  const candidates = [
    typeof idToken === 'string' ? idToken : null,   // already a string
    idToken?.toString?.(),                            // Amplify v6 JWT object toString()
  ];

  for (const candidate of candidates) {
    const jwt = validateJwt(candidate);
    if (jwt) return jwt;
  }

  console.warn(
    `⚠️ [getIdToken] Could not extract valid JWT from Amplify token object`
  );
  return null;
}

/**
 * Scan localStorage for an Amplify-stored idToken for the configured client.
 * Amplify v6 stores tokens under keys like:
 *   CognitoIdentityServiceProvider.<clientId>.<username>.idToken
 * or the newer format:
 *   amplify-signin-with-hostedUI / cognito.<clientId>.<username>.idToken
 *
 * Returns a valid non-expired JWT string, or null.
 */
function getIdTokenFromLocalStorage() {
  try {
    const prefix = `CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}`;
    const lastUserKey = `${prefix}.LastAuthUser`;
    const username = localStorage.getItem(lastUserKey);

    if (username) {
      const tokenKey = `${prefix}.${username}.idToken`;
      const token = localStorage.getItem(tokenKey);
      const jwt = validateJwt(token);
      if (jwt && !isTokenExpired(jwt)) {
        console.log('[getIdToken] ✅ Retrieved valid token from localStorage');
        return jwt;
      }
    }

    // Fallback: scan all keys for any matching idToken pattern
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        key.includes(USER_POOL_CLIENT_ID) &&
        key.endsWith('.idToken')
      ) {
        const token = localStorage.getItem(key);
        const jwt = validateJwt(token);
        if (jwt && !isTokenExpired(jwt)) {
          console.log(`[getIdToken] ✅ Found valid token via localStorage scan (key: ${key})`);
          return jwt;
        }
      }
    }
  } catch (err) {
    console.warn('[getIdToken] localStorage scan failed:', err?.message);
  }
  return null;
}

/**
 * Returns the raw JWT id-token string from Amplify fetchAuthSession().
 * If the Amplify session object yields a bad value, falls back to localStorage.
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

      // Amplify session object gave us a bad token value → try forceRefresh first
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

  // Last resort: read directly from localStorage (bypasses Amplify token object)
  console.warn('[getIdToken] Falling back to localStorage token retrieval');
  const lsToken = getIdTokenFromLocalStorage();
  if (lsToken) return lsToken;

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
