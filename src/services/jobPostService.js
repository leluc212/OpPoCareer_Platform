// Service for managing job posts with DynamoDB backend
// Table: PostStandardJob

import { fetchAuthSession } from 'aws-amplify/auth';

// API base URL - dùng Vite proxy để tránh CORS khi dev local
const API_BASE_URL = import.meta.env.VITE_EMPLOYER_API_URL || '/api-employer';

/**
 * Generate random job ID
 * Format: JOB-YYYYMMDD-XXXXX (e.g., JOB-20260312-A7B3C)
 */
const generateJobId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random 5-character alphanumeric string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `JOB-${year}${month}${day}-${randomStr}`;
};

/**
 * Get authentication token from Amplify Cognito
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
    
    console.log('✅ Auth token obtained from Cognito');
    return tokenString;
  } catch (error) {
    console.error('❌ Error getting auth token from Cognito:', error);
    return null;
  }
};

/**
 * Job Post Service
 * Handles all operations for PostStandardJob table
 */
class JobPostService {
  constructor() {
    console.log('🚀🚀🚀 JobPostService initialized - VERSION 2.0');
    console.log('🔗 API URL:', API_BASE_URL);
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, options = {}) {
    try {
      const token = await getAuthToken();
      
      console.log('🔑 Token check:', token ? 'Token exists' : 'No token');
      
      // Don't require token for public GET requests to avoid CORS preflight issues
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      const isPublicGet = options.method === 'GET' || !options.method;
      
      if (token && !isPublicGet) {
        const cleanToken = token.trim().replace(/[\r\n\t]/g, '');
        headers['Authorization'] = `Bearer ${cleanToken}`;
        console.log('🔑 Authorization header added');
      } else if (token && isPublicGet) {
        console.log('ℹ️ Public GET request - skipping Authorization header to avoid CORS issues');
      } else {
        console.log('⚠️ No authorization header - proceeding without auth');
      }

      console.log(`📤 Making ${options.method || 'GET'} request to ${API_BASE_URL}${endpoint}`);
      
      const requestOptions = {
        ...options,
        headers,
        mode: 'cors'
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

      console.log(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Request failed' }));
        if (response.status !== 404) {
          console.error(`❌ API Error ${response.status}:`, errorBody);
        }
        throw new Error(errorBody.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API request successful:', data);
      return data;
    } catch (error) {
      if (!error.message.includes('not found') && !error.message.includes('404')) {
        console.error('❌ Request error:', error);
      }
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('CORS') ||
          error.message.includes('NetworkError') ||
          error.name === 'TypeError') {
        console.error('❌ API request failed - network/CORS issue:', error);
        throw new Error('Cannot connect to API.');
      }
      throw error;
    }
  }

  /**
   * Create new job post
   */
  async createJobPost(jobData) {
    console.log('🚀🚀🚀 createJobPost CALLED - VERSION 2.0');
    console.log('📦 Job data received:', jobData);
    
    try {
      const session = await fetchAuthSession();
      
      console.log('📝 Session check:', session ? 'Session exists' : 'No session');
      
      let userId = 'anonymous';
      let employerEmail = 'anonymous@example.com';
      
      if (session && session.tokens) {
        const idTokenPayload = session.tokens.idToken?.payload;
        userId = idTokenPayload?.sub || 'anonymous';
        employerEmail = idTokenPayload?.email || 'anonymous@example.com';
        console.log('✅ User authenticated:', userId);
      } else {
        console.warn('⚠️ No authentication session - using anonymous');
      }

      // Generate unique job ID
      const jobId = generateJobId();
      
      const payload = {
        idJob: jobId,
        employerId: userId,
        employerEmail: employerEmail,
        title: jobData.title,
        location: jobData.location,
        latitude: jobData.latitude || null,
        longitude: jobData.longitude || null,
        jobType: jobData.jobType,
        workDays: jobData.workDays,
        workHours: jobData.workHours,
        salary: jobData.salary || null,
        tags: jobData.tags || '',
        description: jobData.description,
        requirements: jobData.requirements || '',
        benefits: jobData.benefits || '',
        isAiScreeningEnabled: jobData.isAiScreeningEnabled || false,
        customQuestions: jobData.customQuestions || [],
        // New posts should require admin moderation; set to 'pending' by default
        status: 'pending',
        applicants: 0,
        views: 0,
        responseRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('📝 Creating job post with ID:', jobId);
      console.log('📤 Payload:', payload);

      const result = await this.makeRequest('/jobs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (result.success && result.data) {
        console.log('✅ Job post created in DynamoDB:', result.data);
        return result.data;
      }

      throw new Error('Failed to create job post');
    } catch (error) {
      console.error('❌ Error creating job post:', error);
      console.error('❌ Error details:', error.message);
      throw error;
    }
  }

  /**
   * Update existing job post
   */
  async updateJobPost(jobId, updates) {
    try {
      const payload = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      console.log('📝 Updating job post:', jobId, payload);

      const result = await this.makeRequest(`/jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (result.success && result.data) {
        console.log('✅ Job post updated in DynamoDB:', result.data);
        return result.data;
      }

      throw new Error('Failed to update job post');
    } catch (error) {
      console.error('❌ Error updating job post:', error);
      throw error;
    }
  }

  /**
   * Get all job posts for current employer
   */
  async getMyJobPosts() {
    console.log('🚀 getMyJobPosts() called');
    try {
      const session = await fetchAuthSession();
      
      let userId = null;
      
      if (session && session.tokens) {
        const idTokenPayload = session.tokens.idToken?.payload;
        userId = idTokenPayload?.sub;
        console.log('✅ User authenticated, userId:', userId);
      } else {
        console.log('⚠️ No session or tokens found');
      }
      
      if (!userId) {
        console.warn('⚠️ No authentication - getting all active jobs instead');
        // If no auth, get all active jobs
        return this.getAllActiveJobs();
      }

      console.log('🔍 Getting job posts for employer:', userId);
      console.log('📡 Calling API: /jobs/employer/' + userId);

      const result = await this.makeRequest(`/jobs/employer/${userId}`);
      
      console.log('📥 API Response:', result);
      
      if (result.success && result.data) {
        console.log('✅ Job posts loaded from DynamoDB:', result.data.length, 'jobs');
        console.log('📦 Jobs data:', result.data);
        return result.data;
      }

      console.warn('⚠️ No data in response, returning empty array');
      return [];
    } catch (error) {
      console.error('❌ Error fetching job posts:', error);
      console.error('❌ Error details:', error.message, error.stack);
      // Return empty array instead of fallback
      return [];
    }
  }

  /**
   * Get single job post by ID
   */
  async getJobPost(jobId) {
    try {
      console.log('🔍 Getting job post:', jobId);

      const result = await this.makeRequest(`/jobs/${jobId}`);
      
      if (result.success && result.data) {
        console.log('✅ Job post loaded from DynamoDB');
        return result.data;
      }

      return null;
    } catch (error) {
      if (!error.message.includes('not found') && !error.message.includes('404')) {
        console.error('❌ Error fetching job post:', error);
      }
      throw error;
    }
  }

  /**
   * Delete job post (soft delete)
   */
  async deleteJobPost(jobId) {
    try {
      console.log('🗑️ Deleting job post:', jobId);

      const result = await this.makeRequest(`/jobs/${jobId}`, {
        method: 'DELETE'
      });
      
      if (result.success) {
        console.log('✅ Job post deleted from DynamoDB');
        return true;
      }

      throw new Error('Failed to delete job post');
    } catch (error) {
      console.error('❌ Error deleting job post:', error);
      throw error;
    }
  }

  /**
   * Update job status (active, paused, closed)
   */
  async updateJobStatus(jobId, status) {
    return this.updateJobPost(jobId, { status });
  }

  /**
   * Increment view count
   */
  async incrementViews(jobId) {
    try {
      const result = await this.makeRequest(`/jobs/${jobId}/views`, {
        method: 'POST'
      });
      
      if (result.success) {
        console.log('✅ View count incremented');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error incrementing views:', error);
      return false;
    }
  }

  /**
   * Get all active job posts (for candidates)
   */
  async getAllActiveJobs() {
    console.log('🚀 getAllActiveJobs() called');
    try {
      console.log('🔍 Getting all active job posts');
      console.log('📡 Calling API: /jobs/active');

      const result = await this.makeRequest('/jobs/active');
      
      console.log('📥 API Response:', result);
      
      if (result.success && result.data) {
        console.log('✅ Active jobs loaded from DynamoDB:', result.data.length, 'jobs');
        console.log('📦 Jobs data:', result.data);
        return result.data;
      }

      console.warn('⚠️ No data in response, returning empty array');
      return [];
    } catch (error) {
      console.error('❌ Error fetching active jobs:', error);
      console.error('❌ Error details:', error.message, error.stack);
      throw error;
    }
  }

  /**
   * Get all job posts (admin view)
   */
   async getAllJobPosts() {
     console.log('🚀 getAllJobPosts() called');
     try {
       // Thử /jobs trước
       let result;
       try {
         result = await this.makeRequest('/jobs');
       } catch (e) {
         console.warn('⚠️ Request to /jobs failed, trying fallback /jobs/');
         result = await this.makeRequest('/jobs/');
       }

       if (result && result.success && result.data) {
         console.log('✅ All job posts loaded from DynamoDB:', result.data.length, 'jobs');
         return result.data;
       }

       return [];
     } catch (error) {
       console.error('❌ Error fetching all job posts:', error);
       return this.getAllActiveJobs();
     }
  }
}

// Export singleton instance
export default new JobPostService();
