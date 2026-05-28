// Service for managing quick job posts with DynamoDB backend
// Table: PostQuickJob

import { fetchAuthSession } from 'aws-amplify/auth';
import employerProfileService from './employerProfileService';

// API base URL - stage prefix MUST be /prod as verified from other services
const API_BASE_URL = 'https://6zw89pkuxb.execute-api.ap-southeast-1.amazonaws.com/prod';

/**
 * Generate random quick job ID
 * Format: QJOB-YYYYMMDD-XXXXX (e.g., QJOB-20260312-A7B3C)
 */
const generateQuickJobId = () => {
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
  
  return `QJOB-${year}${month}${day}-${randomStr}`;
};

/**
 * Get authentication token and user info from Amplify Cognito
 */
const getAuthInfo = async () => {
  try {
    const session = await fetchAuthSession();
    
    if (!session || !session.tokens) {
      console.warn('⚠️ No session or tokens available');
      return { token: null, userId: null, email: null };
    }
    
    const idToken = session.tokens.idToken;
    if (!idToken) {
      console.warn('⚠️ No ID token in session');
      return { token: null, userId: null, email: null };
    }
    
    let tokenString = typeof idToken === 'string' ? idToken : idToken.toString();
    tokenString = tokenString.trim().replace(/[\r\n\t]/g, '');
    
    // Extract user info from token payload
    const payload = idToken.payload || {};
    const userId = payload.sub || null;
    const email = payload.email || null;
    
    console.log('✅ Auth info obtained from Cognito');
    return { token: tokenString, userId, email };
  } catch (error) {
    console.error('❌ Error getting auth info from Cognito:', error);
    return { token: null, userId: null, email: null };
  }
};

/**
 * Get company info from employer profile
 */
const getCompanyInfo = async () => {
  try {
    // Try to get from Cognito token first
    const session = await fetchAuthSession();
    if (session && session.tokens && session.tokens.idToken) {
      const payload = session.tokens.idToken.payload || {};
      const companyName = payload['custom:companyName'] || payload.companyName;
      if (companyName) {
        console.log('✅ Company name from Cognito:', companyName);
        return { companyName };
      }
    }
    
    // Try to get from localStorage (cached profile)
    const cachedProfile = localStorage.getItem('employerProfile');
    if (cachedProfile) {
      const profile = JSON.parse(cachedProfile);
      const companyName = profile.companyName || profile.businessName;
      if (companyName) {
        console.log('✅ Company name from cached profile:', companyName);
        return { companyName };
      }
    }
    
    // Try to fetch from employer profile API
    try {
      const profile = await employerProfileService.getMyProfile();
      if (profile && (profile.companyName || profile.businessName)) {
        const companyName = profile.companyName || profile.businessName;
        console.log('✅ Company name from API:', companyName);
        return { companyName };
      }
    } catch (apiError) {
      console.warn('⚠️ Could not fetch from employer profile API:', apiError);
    }
    
    // Fallback
    console.warn('⚠️ No company name found, using default');
    return {
      companyName: 'Unknown Company'
    };
  } catch (error) {
    console.error('❌ Error getting company info:', error);
    return {
      companyName: 'Unknown Company'
    };
  }
};

/**
 * Quick Job Service
 * Handles all operations for PostQuickJob table
 */
class QuickJobService {
  constructor() {
    console.log('🚀 QuickJobService initialized');
    console.log('🔗 API URL:', API_BASE_URL);
  }

  async makeRequest(endpoint, options = {}) {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    try {
      const { token } = await getAuthInfo();
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      const isPublicGet = options.method === 'GET' || !options.method;
      
      if (token && !isPublicGet) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Authorization header added');
      } else if (token && isPublicGet) {
        console.log('ℹ️ Public GET request - skipping Authorization header to avoid CORS issues');
      }
      // No need for "No token" warning if it's public

      console.log(`📤 QuickJobService: Requesting ${options.method || 'GET'} ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        mode: 'cors'
      });

      console.log(`📥 QuickJobService: Response status: ${response.status} from ${fullUrl}`);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Request failed' }));
        console.error(`❌ QuickJobService API Error ${response.status}:`, errorBody);
        throw new Error(errorBody.message || `HTTP ${response.status} from ${fullUrl}`);
      }

      const data = await response.json();
      console.log('✅ QuickJobService API request successful');
      return data;
    } catch (error) {
      console.error(`❌ QuickJobService Request error for ${fullUrl}:`, error);
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('CORS') ||
          error.message.includes('NetworkError') ||
          error.name === 'TypeError') {
        throw new Error('Cannot connect to API. Using offline mode.');
      }
      throw error;
    }
  }

  /**
   * Create new quick job post
   */
  async createQuickJob(jobData) {
    console.log('🚀 createQuickJob CALLED');
    console.log('📦 Job data received:', jobData);
    
    try {
      const { userId, email } = await getAuthInfo();
      
      // Use companyName from jobData if provided, otherwise get from profile
      let companyName = jobData.companyName;
      if (!companyName) {
        const companyInfo = await getCompanyInfo();
        companyName = companyInfo.companyName;
      }
      console.log('🏢 Company name:', companyName);
      
      // Generate unique job ID
      const jobId = generateQuickJobId();
      
      const payload = {
        idJob: jobId,
        employerId: userId || 'anonymous',
        employerEmail: email || 'anonymous@example.com',
        companyName: companyName,
        title: jobData.title,
        location: jobData.location,
        latitude: jobData.latitude ? Math.round(jobData.latitude * 1000000) / 1000000 : null, // Round to 6 decimal places
        longitude: jobData.longitude ? Math.round(jobData.longitude * 1000000) / 1000000 : null, // Round to 6 decimal places
        jobType: jobData.jobType || 'part-time',
        hourlyRate: Math.round(jobData.hourlyRate || 0), // Convert to integer
        startTime: jobData.startTime,
        endTime: jobData.endTime,
        totalHours: Math.round((jobData.totalHours || 0) * 10) / 10, // Round to 1 decimal place
        totalSalary: Math.round(jobData.totalSalary || 0), // Convert to integer
        description: jobData.description || '',
        requirements: jobData.requirements || '',
        status: jobData.status || 'pending',
        category: 'quick-jobs',
        applicants: 0,
        views: 0,
        workDate: jobData.workDate || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('📝 Creating quick job with ID:', jobId);
      console.log('📤 Payload:', payload);

      const result = await this.makeRequest('/quick-jobs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (result.success && result.data) {
        console.log('✅ Quick job created in DynamoDB:', result.data);
        return result.data;
      }

      throw new Error('Failed to create quick job');
    } catch (error) {
      console.error('❌ Error creating quick job:', error);
      throw error;
    }
  }

  /**
   * Update existing quick job
   */
  async updateQuickJob(jobId, updates) {
    try {
      const payload = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      console.log('📝 Updating quick job:', jobId, payload);

      const result = await this.makeRequest(`/quick-jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (result.success && result.data) {
        console.log('✅ Quick job updated in DynamoDB');
        return result.data;
      }

      throw new Error('Failed to update quick job');
    } catch (error) {
      console.error('❌ Error updating quick job:', error);
      throw error;
    }
  }

  /**
   * Get all quick jobs for current employer
   */
  async getMyQuickJobs() {
    console.log('🚀 getMyQuickJobs() called');
    try {
      const { userId } = await getAuthInfo();
      
      if (!userId) {
        console.warn('⚠️ No authentication - returning empty array');
        return [];
      }

      console.log('🔍 Getting quick jobs for employer:', userId);

      const result = await this.makeRequest(`/quick-jobs/employer/${userId}`);
      
      if (result.success && result.data) {
        console.log('✅ Quick jobs loaded from DynamoDB:', result.data.length, 'jobs');
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Error fetching quick jobs:', error);
      return [];
    }
  }

  /**
   * Get single quick job by ID
   */
  async getQuickJob(jobId) {
    try {
      console.log('🔍 Getting quick job:', jobId);

      const result = await this.makeRequest(`/quick-jobs/${jobId}`);
      
      if (result.success && result.data) {
        console.log('✅ Quick job loaded from DynamoDB');
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching quick job:', error);
      return null;
    }
  }

  /**
   * Delete quick job (soft delete)
   */
  async deleteQuickJob(jobId) {
    try {
      console.log('🗑️ Deleting quick job:', jobId);

      const result = await this.makeRequest(`/quick-jobs/${jobId}`, {
        method: 'DELETE'
      });
      
      if (result.success) {
        console.log('✅ Quick job deleted from DynamoDB');
        return true;
      }

      throw new Error('Failed to delete quick job');
    } catch (error) {
      console.error('❌ Error deleting quick job:', error);
      throw error;
    }
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId, status) {
    return this.updateQuickJob(jobId, { status });
  }

  /**
   * Increment view count
   */
  async incrementViews(jobId) {
    try {
      const result = await this.makeRequest(`/quick-jobs/${jobId}/views`, {
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
   * Get all active quick jobs (for candidates)
   */
  async getAllActiveQuickJobs() {
    console.log('🚀 getAllActiveQuickJobs() called');
    try {
      // Use /quick-jobs/active which is supported by Lambda
      const result = await this.makeRequest('/quick-jobs/active');
      
      if (result.success && result.data) {
        console.log('✅ Active quick jobs loaded from DynamoDB:', result.data.length, 'jobs');
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Error fetching active quick jobs:', error);
      return [];
    }
  }

  /**
   * Get all quick job posts (admin view)
   */
  async getAllQuickJobs() {
    console.log('🚀 getAllQuickJobs() called');
    try {
      // Use the base /quick-jobs endpoint which we just enabled in Lambda
      const result = await this.makeRequest('/quick-jobs');

      if (result.success && result.data) {
        console.log('✅ All quick jobs loaded from DynamoDB:', result.data.length, 'jobs');
        return result.data;
      }

      return [];
        } catch (error) {
      console.error('❌ Error fetching all quick jobs from /quick-jobs:', error);
      // Fallback to active jobs if base endpoint fails
      return this.getAllActiveQuickJobs();
        }
  }
}

// Export singleton instance
export default new QuickJobService();
