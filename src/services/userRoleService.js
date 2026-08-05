import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_USER_ROLE_API_URL
  || 'https://1v4xboca50.execute-api.ap-southeast-1.amazonaws.com';

async function getAuthToken() {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken;
  if (!idToken) throw new Error('User not authenticated');
  return idToken.toString().trim();
}

export async function updateMyRole(role) {
  if (!['candidate', 'employer'].includes(role)) {
    throw new Error('Invalid role value');
  }

  if (!API_BASE_URL) {
    throw new Error('User role API is not configured');
  }

  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/users/me/role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ role }),
    mode: 'cors'
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Role update failed: HTTP ${response.status}`);
  }

  return { success: true, data };
}
