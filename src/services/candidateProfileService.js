// Service for managing candidate profiles with DynamoDB backend
// This service handles all API calls related to candidate profile operations

import { fetchAuthSession } from 'aws-amplify/auth';

// Prefer the direct API Gateway URL to avoid Vite proxy auth/header quirks.
// This HTTP API does not use the /prod stage prefix for profile routes.
const API_BASE_URL = import.meta.env.VITE_CANDIDATE_API_URL || 'https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod';
// Switch to xyp4wkszi7 for listing as well, as sd7ds72m8g is IAM-locked and xyp4wkszi7's Lambda returns the full list
const CANDIDATE_LIST_API_URL = import.meta.env.DEV ? '/api' : 'https://xyp4wkszi7.execute-api.ap-southeast-1.amazonaws.com/prod';

/**
 * Get authentication token from Amplify
 */
const getAuthToken = async () => {
  try {
    const session = await fetchAuthSession();
    
    if (!session || !session.tokens) {
      console.warn('⚠️ No session or tokens available');
      return null;
    }
    
    const idToken = session.tokens.idToken;
    if (!idToken) {
      console.warn('⚠️ No ID token in session');
      return null;
    }
    
    let tokenString = typeof idToken === 'string' ? idToken : idToken.toString();
    tokenString = tokenString.trim().replace(/[\r\n\t]/g, '');
    
    return tokenString;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    return null;
  }
};

/**
 * Decode JWT token to get userId (without verification for now)
 */
const decodeToken = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Candidate Profile Service
 * 
 * Production implementation using API Gateway + Lambda + DynamoDB
 */
class CandidateProfileService {
  constructor() {
    console.log('📝 CandidateProfileService initialized (API mode)');
    console.log('🔗 API URL:', API_BASE_URL);
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, options = {}, useListApi = false) {
    try {
      const baseUrl = useListApi ? CANDIDATE_LIST_API_URL : API_BASE_URL;
      
      // Try to get token for all requests (Admin might be logged in)
      const token = await getAuthToken();
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Attach Authorization only for direct AWS calls.
      const shouldAttachAuth = !baseUrl.startsWith('/');
      if (token && shouldAttachAuth) {
        headers['Authorization'] = `Bearer ${token}`;

        // Decode token to get userId for logging
        const tokenPayload = decodeToken(token);
        if (tokenPayload) {
          console.log('🔑 Request with userId from token:', tokenPayload.sub);
        }
      } else if (!useListApi) {
        console.warn('⚠️ No token available for non-list API request');
      }
      
      // If no token and it's a GET request, don't send any headers to keep it a "simple request"
      // BUT if it's a list API, we probably NEED the token now.
      if (!token && (!options.method || options.method === 'GET')) {
        delete headers['Content-Type'];
      }

      console.log(`📤 ${useListApi ? 'CANDIDATE_LIST' : 'PROFILE'} request: ${options.method || 'GET'} ${baseUrl}${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
        mode: 'cors'
      });

      // Handle 404 as a special case
      if (response.status === 404) {
        console.warn(`⚠️ API 404 at ${baseUrl}${endpoint}. Please check if the route or stage is correct.`);
        const errorData = await response.json().catch(() => ({ message: 'Route not found' }));
        throw new Error(errorData.message || `404 Not Found: ${baseUrl}${endpoint}`);
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        console.error(`❌ API Error ${response.status}:`, error);
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      // If it's a network error or CORS error, throw with more context
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        console.error('❌ API request failed - possible CORS or network issue:', error);
        throw new Error('Cannot connect to API. Please check your network connection or contact support.');
      }
      throw error;
    }
  }

  /**
   * Get current user's profile
   */
  async getMyProfile() {
    try {
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub;
      
      console.log('🔍 Getting profile for userId:', userId);
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      try {
        const result = await this.makeRequest(`/profile/${userId}`);
        if (result.success && result.data) {
          console.log('✅ Profile loaded from DynamoDB:', result.data);
          return result.data;
        }
        return null;
      } catch (firstError) {
        throw firstError;
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      
      // Return null if profile doesn't exist yet (404 or "not found" message)
      if (error.message.includes('not found') || 
          error.message.includes('404') ||
          error.message.includes('No profile exists')) {
        console.log('ℹ️ No profile found in DynamoDB');
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Get profile by user ID
   */
  async getProfile(userId) {
    try {
      const result = await this.makeRequest(`/profile/${userId}`);
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.message.includes('not found') || error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get profile by email
   */
  async getProfileByEmail(email) {
    try {
      const result = await this.makeRequest(`/profile/email/${encodeURIComponent(email)}`);
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching profile by email:', error);
      if (error.message.includes('not found') || error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create new profile for current user
   */
  async createProfile(profileData) {
    try {
      // Get verified email from Cognito
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub;
      const cognitoEmail = session.tokens?.idToken?.payload?.email;
      
      console.log('📝 Creating profile for userId:', userId);
      console.log('📧 Using Cognito email:', cognitoEmail);
      
      if (!cognitoEmail) {
        throw new Error('Cannot get verified email from Cognito');
      }
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Force use Cognito email
      const payload = {
        ...profileData,
        userId: userId, // Explicitly include userId in payload
        email: cognitoEmail, // Always use Cognito verified email
        profileCompletion: this.calculateCompletion(profileData)
      };

      const result = await this.makeRequest('/profile', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (result.success && result.data) {
        console.log('✅ Profile created in DynamoDB:', result.data);
        return result.data;
      }

      throw new Error('Failed to create profile');
    } catch (error) {
      console.error('❌ Error creating profile:', error);
      throw error;
    }
  }

  /**
   * Update current user's profile
   */
  async updateProfile(updates) {
    try {
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub;
      const cognitoEmail = session.tokens?.idToken?.payload?.email;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Remove email from updates - it cannot be changed
      const { email, ...allowedUpdates } = updates;
      
      // Warn if trying to change email
      if (email && email !== cognitoEmail) {
        console.warn('Email cannot be changed. Using Cognito verified email:', cognitoEmail);
      }

      // Add profile completion calculation
      const payload = {
        ...allowedUpdates,
        profileCompletion: this.calculateCompletion(updates)
      };

      const result = await this.makeRequest(`/profile/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (result.success && result.data) {
        console.log('✅ Profile updated in DynamoDB:', result.data);
        return result.data;
      }

      throw new Error('Failed to update profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Update specific candidate profile (for Admin operations)
   */
  async adminUpdateCandidateProfile(candidateId, updates) {
    try {
      const result = await this.makeRequest(`/profile/${candidateId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (result.success && result.data) {
        console.log(`✅ Profile for ${candidateId} updated in DynamoDB:`, result.data);
        return result.data;
      }
      throw new Error('Failed to update candidate profile');
    } catch (error) {
      console.error(`Error in adminUpdateCandidateProfile for ${candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Delete current user's profile (soft delete)
   */
  async deleteProfile() {
    try {
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const result = await this.makeRequest(`/profile/${userId}`, {
        method: 'DELETE'
      });
      
      if (result.success) {
        console.log('✅ Profile soft deleted in DynamoDB');
        return true;
      }

      throw new Error('Failed to delete profile');
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  /**
   * Toggle a job in the saved jobs list
   * @param {string} jobId - ID of the job to save/unsave
   */
  async toggleSavedJob(jobId) {
    try {
      const profile = await this.getMyProfile();
      if (!profile) {
        throw new Error('Candidate profile not found. Please create a profile first.');
      }

      const savedJobs = Array.isArray(profile.savedJobs) ? profile.savedJobs : [];
      const updatedSavedJobs = savedJobs.includes(jobId)
        ? savedJobs.filter(id => id !== jobId)
        : [...savedJobs, jobId];

      console.log(`🔄 Toggling job ${jobId}. New list:`, updatedSavedJobs);
      
      const result = await this.updateProfile({ savedJobs: updatedSavedJobs });
      
      // Dispatch a custom event to notify components like FloatingSupportBar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('savedJobsChanged', { detail: { savedJobs: updatedSavedJobs } }));
      }
      
      return result.savedJobs || [];
    } catch (error) {
      console.error('❌ Error toggling saved job:', error);
      throw error;
    }
  }

  /**
   * Calculate profile completion percentage
   */
  calculateCompletion(profileData) {
    let completion = 0;
    
    // Basic info (50% total)
    if (profileData.fullName?.trim()) completion += 10;
    if (profileData.email?.trim()) completion += 10;
    if (profileData.phone?.trim()) completion += 10;
    if (profileData.cccd?.trim()) completion += 10;
    if (profileData.dateOfBirth?.trim()) completion += 10;
    
    // Professional info (30% total)
    if (profileData.location?.trim()) completion += 10;
    if (profileData.title?.trim()) completion += 10;
    if (profileData.bio?.trim()) completion += 10;
    
    // Profile image (15%)
    if (profileData.profileImage) completion += 15;
    
    // Skills (5%)
    if (profileData.skills?.length >= 3) completion += 5;
    
    return completion;
  }

  /**
   * Universal Resilient Fetcher for Admin Operations
   * Automatically handles IAM locks, Cognito auth, and Proxy fallbacks
   */
  async fetchResiliently({ path, defaultUrl, serviceName = 'Service' }) {
    // Endpoints in priority: Proxy -> Direct AWS
    const endpoints = [
      { url: path, label: 'Vite Proxy' },
      { url: defaultUrl, label: 'Direct AWS', isDirect: true }
    ];

    const errors = [];
    let iamDetected = false;

    for (const endpoint of endpoints) {
      // Step 1: Try with Cognito Auth
      try {
        console.log(`🔍 [${serviceName}] Attempting fetch: ${endpoint.url} (Auth: true)`);
        const token = await getAuthToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers,
          mode: 'cors'
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ [${serviceName}] Success with ${endpoint.label} (Authenticated)`);
          return Array.isArray(data) ? data : (data.items || data.data || data.candidates || []);
        }

        const errorBody = await response.text();
        console.warn(`⚠️ [${serviceName}] ${endpoint.label} failed with ${response.status}: ${errorBody.substring(0, 50)}...`);

        // Detection: "Invalid key=value pair" means IAM is blocking the Cognito token
        if (response.status === 403 && (errorBody.includes('Invalid key=value pair') || errorBody.includes('Credential='))) {
          console.warn(`🚨 [${serviceName}] IAM Authorizer detected! Retrying without headers...`);
          iamDetected = true;
        }
      } catch (err) {
        console.error(`❌ [${serviceName}] Network/CORS error on ${endpoint.label}:`, err.message);
        errors.push({ label: endpoint.label, error: err.message });
      }

      // Step 2: Try without headers (for public or IAM-optional gateways)
      try {
        console.log(`🔍 [${serviceName}] Attempting fetch: ${endpoint.url} (Auth: false)`);
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors'
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ [${serviceName}] Success with ${endpoint.label} (Public)`);
          return Array.isArray(data) ? data : (data.items || data.data || data.candidates || []);
        }
      } catch (publicErr) {
        console.warn(`❌ [${serviceName}] Public fetch failed on ${endpoint.label}`);
      }
    }

    console.error(`❌ [${serviceName}] All fetch paths exhausted for ${path}`);
    const fallback = [];
    fallback._isBlockedByIam = iamDetected;
    fallback._errorCount = errors.length;
    return fallback;
  }

  /**
   * Get all candidates via Vite proxy (Lambda Function URL)
   */
  async getAllCandidates() {
    return this.fetchResiliently({
      path: '/api-lambda-candidates/candidates',
      defaultUrl: 'https://gvxkjnavgu4lelloct5chgyjaa0jmyab.lambda-url.ap-southeast-1.on.aws/candidates',
      serviceName: 'CandidateService'
    });
  }

  // ─── Verification APIs ────────────────────────────────────────────────────

  /**
   * Candidate submits a verification request
   * Updates verificationStatus → SUBMITTED in DynamoDB
   */
  async submitVerificationRequest() {
    try {
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub;
      if (!userId) throw new Error('User not authenticated');

      const result = await this.makeRequest('/candidate/verification-request', {
        method: 'POST',
        body: JSON.stringify({ candidateId: userId })
      });
      return result;
    } catch (error) {
      console.error('Error submitting verification request:', error);
      throw error;
    }
  }

  /**
   * Admin: get all candidates with SUBMITTED or REJECTED verificationStatus
   */
  async getPendingVerifications() {
    try {
      const result = await this.makeRequest('/admin/candidate-verifications');
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      return [];
    }
  }

  /**
   * Admin: approve a candidate verification
   */
  async approveVerification(candidateId, note = '') {
    try {
      const result = await this.makeRequest(`/profile/${candidateId}`, {
        method: 'PUT',
        body: JSON.stringify({
          verificationStatus: 'APPROVED',
          verificationApprovedAt: new Date().toISOString(),
          verificationNote: note
        })
      });
      return result;
    } catch (error) {
      console.error('Error approving verification:', error);
      throw error;
    }
  }

  /**
   * Admin: reject a candidate verification
   */
  async rejectVerification(candidateId, note = '') {
    try {
      const result = await this.makeRequest(`/profile/${candidateId}`, {
        method: 'PUT',
        body: JSON.stringify({
          verificationStatus: 'REJECTED',
          verificationRejectedAt: new Date().toISOString(),
          verificationNote: note
        })
      });
      return result;
    } catch (error) {
      console.error('Error rejecting verification:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new CandidateProfileService();
