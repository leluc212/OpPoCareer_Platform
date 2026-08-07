// Service for managing job posts with DynamoDB backend
// Table: PostStandardJob

import { fetchAuthSession } from 'aws-amplify/auth';
import { getIdToken } from './authHeaders.js';
import employerProfileService from './employerProfileService.js';

// API base URL - dùng Vite proxy để tránh CORS khi dev local
// Vite's proxy only exists during local development; production uses API Gateway.
const API_BASE_URL = import.meta.env.VITE_EMPLOYER_API_URL
  || (import.meta.env.DEV
    ? '/api-employer'
    : 'https://fhkig55p32.execute-api.ap-southeast-1.amazonaws.com/prod');

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
 * Get authentication token from Amplify Cognito using shared authHeaders utility
 */
const getAuthToken = async () => {
  try {
    const token = await getIdToken();
    return token;
  } catch (error) {
    console.warn('⚠️ getAuthToken failed:', error?.message);
    return null;
  }
};

/**
 * Job Post Service
 * Handles all operations for PostStandardJob table
 */
class JobPostService {
  constructor() {
    // JobPostService ready
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, options = {}) {
    try {
      const token = await getAuthToken();
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      const isPublicGet = options.method === 'GET' || !options.method;
      
      if (token && !isPublicGet) {
        const cleanToken = token.trim().replace(/[\r\n\t]/g, '');
        headers['Authorization'] = `Bearer ${cleanToken}`;
      }

      const requestOptions = {
        ...options,
        headers,
        mode: 'cors'
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(errorBody.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('CORS') ||
          error.message.includes('NetworkError') ||
          error.name === 'TypeError') {
        throw new Error('Không thể kết nối đến máy chủ API.');
      }
      throw error;
    }
  }

  /**
   * Create new job post
   */
  async createJobPost(jobData) {
    try {
      const session = await fetchAuthSession();
      
      let userId = 'anonymous';
      let employerEmail = 'anonymous@example.com';
      let employerName = 'Company';
      
      if (session && session.tokens) {
        const idTokenPayload = session.tokens.idToken?.payload;
        userId = idTokenPayload?.sub || 'anonymous';
        employerEmail = idTokenPayload?.email || 'anonymous@example.com';

        try {
          const profile = await employerProfileService.getMyProfile();
          if (profile && profile.companyName) {
            employerName = profile.companyName;
          } else {
            employerName = employerEmail.split('@')[0];
          }
        } catch (e) {
          employerName = employerEmail.split('@')[0];
        }
      }

      // Generate unique job ID
      const jobId = generateJobId();
      
      const payload = {
        idJob: jobId,
        employerId: userId,
        employerEmail: employerEmail,
        employerName: employerName,
        title: jobData.title,
        location: jobData.location,
        latitude: jobData.latitude || null,
        longitude: jobData.longitude || null,
        jobType: jobData.jobType,
        workDays: jobData.workDays,
        workHours: jobData.workHours || jobData.workHoursText || '',
        salary: jobData.salary || null,
        salaryUnit: jobData.salaryUnit || 'hour',
        tags: jobData.tags || '',
        description: jobData.description,
        requirements: jobData.requirements || '',
        benefits: jobData.benefits || '',
        customFields: jobData.customFields || [],
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

      const result = await this.makeRequest('/jobs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (result.success && result.data) {
        return result.data;
      }

      throw new Error(result.message || 'Failed to create job post');
    } catch (error) {
      console.error('❌ Error creating job post:', error);
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

      const result = await this.makeRequest(`/jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (result.success && result.data) {
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
    try {
      const session = await fetchAuthSession();
      
      let userId = null;
      
      if (session && session.tokens) {
        const idTokenPayload = session.tokens.idToken?.payload;
        userId = idTokenPayload?.sub;
      }
      
      if (!userId) {
        return this.getAllActiveJobs();
      }

      const result = await this.makeRequest(`/jobs/employer/${userId}`);
      
      if (result.success && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get single job post by ID
   */
  async getJobPost(jobId) {
    try {
      const result = await this.makeRequest(`/jobs/${jobId}`);
      
      if (result.success && result.data) {
        return result.data;
      }

      return null;
    } catch (error) {
      // Silently return null for not-found or errored jobs
      return null;
    }
  }

  /**
   * Delete job post (soft delete)
   */
  async deleteJobPost(jobId) {
    try {
      const result = await this.makeRequest(`/jobs/${jobId}`, {
        method: 'DELETE'
      });
      
      if (result.success) {
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
      
      return result.success || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all active job posts (for candidates)
   */
  async getAllActiveJobs() {
    try {
      const result = await this.makeRequest('/jobs/active');
      
      if (result.success && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all job posts (admin view)
   */
  async getAllJobPosts() {
    try {
      let result;
      try {
        result = await this.makeRequest('/jobs');
      } catch (e) {
        result = await this.makeRequest('/jobs/');
      }

      if (result && result.success && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      return this.getAllActiveJobs();
    }
  }
}

// Export singleton instance
export default new JobPostService();
