// Service for managing candidate profiles with DynamoDB backend
// This service handles all API calls related to candidate profile operations

import { fetchAuthSession } from 'aws-amplify/auth';

// API base URL - use proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.DEV 
  ? '/api'  // Use Vite proxy in development to avoid CORS
  : (import.meta.env.VITE_API_URL || 'https://xyp4wkszi7.execute-api.ap-southeast-1.amazonaws.com/prod');

const CANDIDATE_LIST_API_URL = import.meta.env.VITE_CANDIDATE_API_URL || 'https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod';

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
      const token = useListApi ? null : await getAuthToken(); // Don't send token to public list API
      
      // Decode token to get userId for logging
      if (token && !useListApi) {
        const tokenPayload = decodeToken(token);
        if (tokenPayload) {
          console.log('🔑 Request with userId from token:', tokenPayload.sub);
        }
      }
      
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      };

      console.log(`📤 ${useListApi ? 'CANDIDATE_LIST' : 'PROFILE'} request: ${options.method || 'GET'} ${baseUrl}${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
        mode: 'cors' // Explicitly set CORS mode
      });

      // Handle 404 as a special case - profile doesn't exist yet
      if (response.status === 404) {
        const error = await response.json().catch(() => ({ message: 'Profile not found' }));
        throw new Error(error.message || 'No profile exists for this user ID');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
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

      const result = await this.makeRequest(`/profile/${userId}`);
      
      if (result.success && result.data) {
        console.log('✅ Profile loaded from DynamoDB:', result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      
      // Return null if profile doesn't exist yet (404 or "not found" message)
      if (error.message.includes('not found') || 
          error.message.includes('404') ||
          error.message.includes('No profile exists')) {
        console.log('ℹ️ No profile found in DynamoDB - this is normal for new users');
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
   * Get all candidate profiles (Admin/Batch operation)
   */
  async getAllCandidates(limit = 100) {
    try {
      console.log('🔍 Listing all candidates from public API...');
      
      // Use the candidates API (sd7ds72m8g) which is public
      const response = await fetch(`${CANDIDATE_LIST_API_URL}/candidates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data; // Return raw data, the dashboard handles transformation if needed
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error listing all candidates:', error);
      return [];
    }
  }
}

// Export singleton instance
export default new CandidateProfileService();
