import { fetchAuthSession } from 'aws-amplify/auth';
import { getAuthHeaders, getIdToken } from './authHeaders.js';

// HTTP API uses the $default stage, so the invoke URL must NOT include /prod.
const API_BASE_URL = 'https://l1636ie205.execute-api.ap-southeast-1.amazonaws.com';

/**
 * Submit a job application
 * @param {string} jobId - Job ID
 * @param {string} cvUrl - S3 presigned URL of the CV
 * @param {string} cvFilename - Original filename of the CV
 * @param {string} [cvS3Key] - S3 key of the CV (used for reliable URL refresh)
 * @returns {Promise<Object>} Application data
 */
export async function submitApplication(jobId, cvUrl, cvFilename, cvS3Key, extraFields = {}) {
  try {
    console.log('📤 Submitting application:', { jobId, cvUrl, cvFilename, extraFields });
    
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jobId,
        cvUrl,
        cvFilename,
        ...(cvS3Key && { cvS3Key }),
        ...extraFields
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      // Include status code and error code in the error message for better handling
      const errorMsg = error.error || 'Failed to submit application';
      const errorCode = error.code || '';
      const statusCode = response.status;
      
      // Create error with all info
      const err = new Error(errorMsg);
      err.statusCode = statusCode;
      err.errorCode = errorCode;
      err.response = error;
      
      throw err;
    }
    
    const data = await response.json();
    console.log('✅ Application submitted:', data);
    return data;
  } catch (error) {
    console.error('❌ Error submitting application:', error);
    throw error;
  }
}

/**
 * Get all applications for the current candidate
 * @returns {Promise<Array>} List of applications
 */
export async function getMyCandidateApplications() {
  try {
    let userId = null;
    try {
      const session = await fetchAuthSession();
      userId = session.tokens?.idToken?.payload?.sub;
    } catch (e) {
      userId = null;
    }

    if (!userId) {
      return [];
    }
    
    // Try Vite proxy first in dev mode to avoid CORS
    const urls = import.meta.env.DEV
      ? [
          `${API_BASE_URL}/applications/candidate/${userId}`,
          `/api-applications/candidate/${userId}`
        ]
      : [`${API_BASE_URL}/applications/candidate/${userId}`];
    
    for (const url of urls) {
      try {
        // ✅ FIX: Always send Bearer token, even via Vite proxy
        // Cognito authorizer needs the token to extract claims (user ID)
        const headers = await getAuthHeaders();
        const response = await fetch(url, { 
          method: 'GET', 
          headers,
          mode: 'cors'  // ✅ Enable CORS mode
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Loaded candidate applications:', data);
          return data.applications || [];
        }
        
      } catch (fetchErr) {
        console.warn(`⚠️ Failed to fetch applications from ${url}:`, fetchErr.message);
        continue; // Try next URL
      }
    }
    
    // All URLs failed - return empty array for new users
    console.log('ℹ️ No applications found - normal for new users');
    return [];
  } catch (error) {
    console.error('❌ Error getting candidate applications:', error);
    return []; // Return empty instead of throwing for better UX
  }
}

/**
 * Get all applications for a specific candidate (employer only)
 * @param {string} candidateId - Candidate ID
 * @returns {Promise<Array>} List of applications
 */
export async function getCandidateApplications(candidateId) {
  try {
    if (!candidateId) return [];
    
    const headers = await getAuthHeaders();
    const urls = import.meta.env.DEV
      ? [
          `${API_BASE_URL}/applications/candidate/${candidateId}`,
          `/api-applications/candidate/${candidateId}`
        ]
      : [`${API_BASE_URL}/applications/candidate/${candidateId}`];
      
    for (const url of urls) {
      try {
        const response = await fetch(url, { 
          method: 'GET', 
          headers,
          mode: 'cors'
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.applications || [];
        }
      } catch (fetchErr) {
        console.warn(`⚠️ Failed to fetch candidate applications from ${url}:`, fetchErr.message);
        continue;
      }
    }
    return [];
  } catch (error) {
    console.error('❌ Error getting candidate applications:', error);
    return [];
  }
}


/**
 * Get all applications for a specific job (employer only)
 * @param {string} jobId - Job ID
 * @returns {Promise<Array>} List of applications
 */
export async function getJobApplications(jobId) {
  if (!jobId) {
    return [];
  }
  const maxRetries = 2;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 500ms, 1000ms
        await new Promise(r => setTimeout(r, 500 * attempt));
        console.log(`🔄 Retry ${attempt}/${maxRetries} for job:`, jobId);
      } else {
        console.log('📥 Loading applications for job:', jobId);
      }

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/applications/job/${jobId}`, {
        method: 'GET',
        headers
      });

      if (response.status === 503 || response.status === 502) {
        // Service unavailable - retry
        lastError = new Error(`Service unavailable (${response.status})`);
        continue;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to get job applications (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Loaded job applications:', data);
      return data.applications || [];
    } catch (error) {
      lastError = error;
      // Don't retry on auth errors or non-transient errors
      if (
        error.message?.includes('No authentication token') ||
        (!error.message?.includes('503') && !error.message?.includes('502') && !error.message?.includes('unavailable'))
      ) {
        break; // exit retry loop
      }
    }
  }

  if (lastError?.message?.includes('No authentication token')) {
    // Session not ready yet on page load — silent fail, no console error
    return [];
  }

  console.error('❌ Error getting job applications after retries:', lastError);
  return []; // Return empty instead of throwing to not break dashboard
}

/**
 * Update application status (employer only)
 * @param {string} applicationId - Application ID
 * @param {string} status - New status (pending, reviewed, accepted, rejected)
 * @returns {Promise<Object>} Updated application
 */
export async function updateApplicationStatus(applicationId, status, extraFields = {}) {
  try {
    console.log('📝 Updating application status:', { applicationId, status, extraFields });
    
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ 
        status,
        ...extraFields
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      const err = new Error(error.error || 'Failed to update application status');
      err.errorCode = error.errorCode || null;
      err.serverMessage = error.message || null;
      throw err;
    }
    
    const data = await response.json();
    console.log('✅ Application status updated:', data);
    return data;
  } catch (error) {
    console.error('❌ Error updating application status:', error);
    throw error;
  }
}

/**
 * Employer rejects the replacement worker and requests 85% refund
 * @param {string} applicationId - Application ID of the replaced worker
 * @returns {Promise<Object>} Refund response
 */
export async function rejectReplacementWorker(applicationId) {
  try {
    console.log('📤 Rejecting replacement worker for:', applicationId);
    const headers = await getAuthHeaders();
    const url = import.meta.env.DEV
      ? `/api-applications/${applicationId}/reject-replacement`
      : `${API_BASE_URL}/applications/${applicationId}/reject-replacement`;
      
    const response = await fetch(url, {
      method: 'PUT',
      headers
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to reject replacement worker');
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Error rejecting replacement worker:', error);
    throw error;
  }
}

/**
 * Get all applications (admin only)
 * Intelligent fetcher that handles IAM vs Cognito authorizer mismatches
 * @returns {Promise<Array>} List of all applications
 */
/**
 * Universal Resilient Fetcher for Admin Operations
 * Uses Vite proxy in dev to avoid browser CORS restrictions on Lambda Function URLs.
 * In production, a server-side proxy or API Gateway must be used — never call a
 * Lambda Function URL directly from the browser (it will always be CORS-blocked
 * unless the Lambda's CORS policy explicitly allows the production origin).
 */
async function fetchResiliently({ path, serviceName = 'Service' }) {
  try {
    console.log(`🔍 [${serviceName}] Fetching via proxy: ${path}`);
    const token = await getAuthTokenForApplications();
    const headers = { 'Content-Type': 'application/json' };
    // Include auth token even through the proxy so the Lambda can identify the caller.
    // The Vite proxy strips CORS restrictions but passes the Authorization header through.
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(path, { method: 'GET', headers });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ [${serviceName}] Success`);
      return data.applications || (Array.isArray(data) ? data : []);
    }

    const errorBody = await response.text();
    console.warn(`⚠️ [${serviceName}] Proxy request failed with ${response.status}: ${errorBody.substring(0, 80)}`);
  } catch (err) {
    console.error(`❌ [${serviceName}] Fetch error:`, err.message);
  }

  console.warn(`⚠️ [${serviceName}] Could not load data for ${path} — returning empty array`);
  return [];
}

/**
 * Get authentication token for resilient fetcher — delegates to shared getIdToken.
 */
async function getAuthTokenForApplications() {
  try {
    return await getIdToken();
  } catch (_) {
    return null;
  }
}

const applicationService = {
  submitApplication,
  getMyCandidateApplications,
  getCandidateApplications,
  getJobApplications,
  updateApplicationStatus,
  rejectReplacementWorker,
  
  /**
   * Get all applications (admin only).
   * In dev: routed through the Vite proxy at /api-lambda-applications → Lambda Function URL,
   *         which avoids browser CORS restrictions entirely.
   * In prod: must be routed through an API Gateway or server-side proxy — direct Lambda
   *          Function URLs cannot be called from the browser due to CORS.
   */
  async getAllApplications() {
    return fetchResiliently({
      path: '/api-lambda-applications/applications',
      serviceName: 'ApplicationService'
    });
  },

  /**
   * Admin: List all applications with status pending_change
   */
  async listChangeRequests() {
    try {
      const headers = await getAuthHeaders();
      const url = import.meta.env.DEV
        ? '/api-applications/change-requests'
        : `${API_BASE_URL}/applications/change-requests`;
      const response = await fetch(url, { method: 'GET', headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.applications || [];
    } catch (err) {
      console.error('❌ Error listing change requests:', err);
      return [];
    }
  },

  /**
   * Employer: Get available workers for replacement in a specific job
   * Uses Lambda Function URL proxy to bypass API Gateway Cognito authorizer (avoids 403).
   */
  async getAvailableWorkers(jobId) {
    try {
      const headers = await getAuthHeaders();
      // Use Lambda Function URL proxy to bypass API Gateway Cognito authorizer.
      // In dev, the Vite proxy at /api-lambda-applications handles the CORS rewrite.
      // In prod, route through an API Gateway or server-side proxy instead of calling
      // the Lambda Function URL directly (direct calls are CORS-blocked in browsers).
      const url = import.meta.env.DEV
        ? `/api-lambda-applications/applications/available-workers/${jobId}`
        : `/api-lambda-applications/applications/available-workers/${jobId}`;
      const response = await fetch(url, { method: 'GET', headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.workers || [];
    } catch (err) {
      console.error('❌ Error fetching available workers:', err);
      return [];
    }
  },

  /**
   * Admin: Approve a pending_change request — performs real-time worker swap
   */
  async approveChangeRequest(applicationId) {
    // Lấy token trực tiếp từ getIdToken (nguồn duy nhất, đã validate JWT)
    const token = await getIdToken();

    if (!token) {
      console.error('❌ [approveChangeRequest] Không lấy được token — user chưa đăng nhập?');
      throw new Error('Bạn không có quyền thực hiện hành động này. Vui lòng đăng xuất và đăng nhập lại.');
    }

    // ===== DEBUG: xác nhận token cuối cùng thực sự được gửi đi =====
    const parts = token.split('.');
    console.log('[DEBUG approveChangeRequest] Token parts count (JWT=3):', parts.length);
    console.log('[DEBUG approveChangeRequest] Token prefix:', token.slice(0, 40) + '...');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const remainMs = (payload.exp * 1000) - Date.now();
        if (remainMs <= 0) {
          console.warn('⚠️ [approveChangeRequest] Token đã HẾT HẠN — cần đăng nhập lại');
        } else {
          console.log(`🔑 [approveChangeRequest] Token hợp lệ — còn ${Math.round(remainMs / 60000)} phút | token_use=${payload.token_use} | groups=${JSON.stringify(payload['cognito:groups'])} | sub=${payload.sub?.slice(0, 8)}...`);
        }
      } catch (_) {}
    } else {
      console.warn(`⚠️ [approveChangeRequest] Token KHÔNG phải JWT chuẩn! Chỉ có ${parts.length} phần.`);
    }
    // ================================================================

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Log header thực sự được gửi đi (ngay trước fetch)
    console.log('[DEBUG approveChangeRequest] Authorization header gửi đi:', headers['Authorization'].slice(0, 60) + '...');

    const url = import.meta.env.DEV
      ? `/api-applications/${applicationId}/approve-change`
      : `${API_BASE_URL}/applications/${applicationId}/approve-change`;
    console.log(`📤 [approveChangeRequest] PUT ${url}`);

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error(`❌ [approveChangeRequest] HTTP ${response.status}`, err);
      if (response.status === 403) {
        throw new Error('Bạn không có quyền thực hiện hành động này. Vui lòng đăng xuất và đăng nhập lại.');
      }
      throw new Error(err.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  /**
   * Admin: Reject a pending_change (shift cancel) request — ca làm giữ nguyên
   */
  async rejectChangeRequest(applicationId, notes = '') {
    const headers = await getAuthHeaders();
    const url = import.meta.env.DEV
      ? `/api-applications/${applicationId}/reject-change`
      : `${API_BASE_URL}/applications/${applicationId}/reject-change`;
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ notes })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}`);
    }
    return response.json();
  }
};

export default applicationService;
