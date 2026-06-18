import { fetchAuthSession } from 'aws-amplify/auth';
import { getAuthHeaders } from './authHeaders.js';

// HTTP API uses the $default stage, so the invoke URL must NOT include /prod.
const API_BASE_URL = 'https://l1636ie205.execute-api.ap-southeast-1.amazonaws.com';

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(payload).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

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
      throw new Error(error.error || 'Failed to update application status');
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
 * Get all applications (admin only)
 * Intelligent fetcher that handles IAM vs Cognito authorizer mismatches
 * @returns {Promise<Array>} List of all applications
 */
/**
 * Universal Resilient Fetcher for Admin Operations
 * Automatically handles IAM locks, Cognito auth, and Proxy fallbacks
 */
async function fetchResiliently({ path, defaultUrl, serviceName = 'Service' }) {
  const endpoints = [
    { url: path, label: 'Vite Proxy' },
    { url: defaultUrl, label: 'Direct AWS' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 [${serviceName}] Attempting fetch: ${endpoint.url}`);
      const token = await getAuthTokenForApplications();
      const headers = { 'Content-Type': 'application/json' };
      if (token && !endpoint.url.startsWith('/')) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(endpoint.url, { method: 'GET', headers, mode: 'cors' });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ [${serviceName}] Success with ${endpoint.label}`);
        return data.applications || (Array.isArray(data) ? data : []);
      }

      const errorBody = await response.text();
      console.warn(`⚠️ [${serviceName}] ${endpoint.label} failed with ${response.status}: ${errorBody.substring(0, 80)}`);
    } catch (err) {
      console.error(`❌ [${serviceName}] Error on ${endpoint.label}:`, err.message);
    }
  }

  console.error(`❌ [${serviceName}] All fetch paths exhausted for ${path}`);
  return [];
}

/**
 * Get authentication token (reused here to avoid duplicating getAuthHeaders for the unified fetcher)
 */
async function getAuthTokenForApplications() {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;
    if (!idToken) return null;
    return idToken.toString().trim().replace(/[\r\n\t]/g, '');
  } catch (err) {
    return null;
  }
}

const applicationService = {
  submitApplication,
  getMyCandidateApplications,
  getCandidateApplications,
  getJobApplications,
  updateApplicationStatus,
  
  /**
   * Get all applications via Vite proxy → Lambda Function URL (no browser CORS issues)
   */
  async getAllApplications() {
    return fetchResiliently({
      path: '/api-lambda-applications/applications',
      defaultUrl: 'https://65fnfwjx5m7iq5ilmoj5ea7nwq0cespm.lambda-url.ap-southeast-1.on.aws/applications',
      serviceName: 'ApplicationService'
    });
  }
};

export default applicationService;
