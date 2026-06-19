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
      return { token: null, userId: null, email: null };
    }
    
    const idToken = session.tokens.idToken;
    if (!idToken) {
      return { token: null, userId: null, email: null };
    }
    
    let tokenString = typeof idToken === 'string' ? idToken : idToken.toString();
    tokenString = tokenString.trim().replace(/[\r\n\t]/g, '');
    
    const payload = idToken.payload || {};
    const userId = payload.sub || null;
    const email = payload.email || null;
    
    return { token: tokenString, userId, email };
  } catch (error) {
    return { token: null, userId: null, email: null };
  }
};

/**
 * Get company info from employer profile
 */
const getCompanyInfo = async () => {
  try {
    const session = await fetchAuthSession();
    if (session && session.tokens && session.tokens.idToken) {
      const payload = session.tokens.idToken.payload || {};
      const companyName = payload['custom:companyName'] || payload.companyName;
      if (companyName) {
        return { companyName };
      }
    }
    
    try {
      const profile = await employerProfileService.getMyProfile();
      if (profile && (profile.companyName || profile.businessName)) {
        return { companyName: profile.companyName || profile.businessName };
      }
    } catch (apiError) {
      // Could not fetch from employer profile API
    }
    
    return { companyName: 'Unknown Company' };
  } catch (error) {
    return { companyName: 'Unknown Company' };
  }
};

/**
 * Quick Job Service
 * Handles all operations for PostQuickJob table
 */
class QuickJobService {
  constructor() {
    // QuickJobService ready
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
      }

      const response = await fetch(fullUrl, {
        ...options,
        headers,
        mode: 'cors'
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorBody.message || `HTTP ${response.status} from ${fullUrl}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('CORS') ||
          error.message.includes('NetworkError') ||
          error.name === 'TypeError') {
        throw new Error('Cannot connect to API.');
      }
      throw error;
    }
  }

  /**
   * Create new quick job post
   */
  async createQuickJob(jobData) {
    try {
      const { userId, email } = await getAuthInfo();
      
      let companyName = jobData.companyName;
      if (!companyName) {
        const companyInfo = await getCompanyInfo();
        companyName = companyInfo.companyName;
      }
      
      const jobId = generateQuickJobId();
      
      const payload = {
        idJob: jobId,
        employerId: userId || 'anonymous',
        employerEmail: email || 'anonymous@example.com',
        companyName: companyName,
        title: jobData.title,
        location: jobData.location,
        latitude: jobData.latitude ? Math.round(jobData.latitude * 1000000) / 1000000 : null,
        longitude: jobData.longitude ? Math.round(jobData.longitude * 1000000) / 1000000 : null,
        jobType: jobData.jobType || 'part-time',
        hourlyRate: Math.round(jobData.hourlyRate || 0),
        startTime: jobData.startTime,
        endTime: jobData.endTime,
        totalHours: Math.round((jobData.totalHours || 0) * 10) / 10,
        totalSalary: Math.round(jobData.totalSalary || 0),
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

      const result = await this.makeRequest('/quick-jobs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (result.success && result.data) {
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

      const result = await this.makeRequest(`/quick-jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (result.success && result.data) {
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
    try {
      const { userId } = await getAuthInfo();
      
      if (!userId) {
        return [];
      }

      const result = await this.makeRequest(`/quick-jobs/employer/${userId}`);
      
      if (result.success && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get single quick job by ID
   */
  async getQuickJob(jobId) {
    try {
      const result = await this.makeRequest(`/quick-jobs/${jobId}`);
      
      if (result.success && result.data) {
        return result.data;
      }

      return null;
    } catch (error) {
      // Silently return null for not-found or unavailable jobs
      return null;
    }
  }

  /**
   * Delete quick job (soft delete)
   */
  async deleteQuickJob(jobId) {
    try {
      const result = await this.makeRequest(`/quick-jobs/${jobId}`, {
        method: 'DELETE'
      });
      
      if (result.success) {
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
      
      return result.success || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all active quick jobs (for candidates)
   */
  async getAllActiveQuickJobs() {
    try {
      const result = await this.makeRequest('/quick-jobs/active');
      
      if (result.success && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all quick job posts (admin view)
   */
  async getAllQuickJobs() {
    try {
      const result = await this.makeRequest('/quick-jobs');

      if (result.success && result.data) {
        return result.data;
      }

      return [];
        } catch (error) {
      return this.getAllActiveQuickJobs();
        }
  }
}

// Export singleton instance
export default new QuickJobService();
