// Admin service for managing employer profiles
// This service handles admin-specific operations like listing all employers and approving profiles

import { getIdToken } from './authHeaders.js';

const API_BASE_URL = import.meta.env.VITE_EMPLOYER_API_URL || 'https://dlidp35x33.execute-api.ap-southeast-1.amazonaws.com/prod';

/**
 * Admin Employer Service
 * Handles admin operations for employer management
 */
class AdminEmployerService {
  constructor() {
    console.log('📝 AdminEmployerService initialized');
    console.log('🔗 API URL:', API_BASE_URL);
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, options = {}) {
    try {
      // Dùng chung getIdToken() từ authHeaders.js — nguồn duy nhất, validate JWT 3-part
      const token = await getIdToken();

      if (!token) {
        throw new Error('Authentication required - no valid token');
      }

      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        // Authorization gán SAU options.headers để không bị overwrite
        'Authorization': `Bearer ${token}`,
      };

      console.log(`📤 Admin request: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        mode: 'cors'
      });

      console.log(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Request failed' }));
        console.error(`❌ API Error ${response.status}:`, errorBody);
        throw new Error(errorBody.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Admin API request successful');
      return data;
    } catch (error) {
      console.error('❌ Admin API request failed:', error);
      throw error;
    }
  }

  /**
   * Get all employer profiles (Admin only)
   * Uses DynamoDB scan to retrieve all profiles
   */
  async getAllEmployers() {
    try {
      console.log('🔍 Fetching all employer profiles from DynamoDB...');

      const result = await this.makeRequest('/admin/employers');

      if (result.success && result.data) {
        console.log(`✅ Loaded ${result.data.length} employer profiles from DynamoDB`);
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Error fetching all employers:', error);
      throw error;
    }
  }

  /**
   * Approve employer profile (Admin only)
   * Also sets isVerified = true so the employer can post jobs and view CVs.
   */
  async approveEmployer(userId) {
    try {
      console.log(`✅ Approving employer: ${userId}`);

      const result = await this.makeRequest(`/admin/employers/${userId}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          approvalStatus: 'approved',
          approvedAt: new Date().toISOString(),
          isVerified: true          // gate check in PostJob / Applications uses isVerified
        })
      });

      if (result.success) {
        console.log('✅ Employer approved successfully');
        return result.data;
      }

      throw new Error('Failed to approve employer');
    } catch (error) {
      console.error('❌ Error approving employer:', error);
      throw error;
    }
  }

  /**
   * Reject employer profile (Admin only)
   */
  async rejectEmployer(userId, reason = '') {
    try {
      console.log(`❌ Rejecting employer: ${userId}`);

      const result = await this.makeRequest(`/admin/employers/${userId}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          approvalStatus: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason
        })
      });

      if (result.success) {
        console.log('✅ Employer rejected successfully');
        return result.data;
      }

      throw new Error('Failed to reject employer');
    } catch (error) {
      console.error('❌ Error rejecting employer:', error);
      throw error;
    }
  }

  /**
   * Update employer verification status (Admin only)
   */
  async updateVerificationStatus(userId, isVerified) {
    try {
      console.log(`🔐 Updating verification status for ${userId}: ${isVerified}`);

      const result = await this.makeRequest(`/admin/employers/${userId}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          isVerified,
          verifiedAt: isVerified ? new Date().toISOString() : null
        })
      });

      if (result.success) {
        console.log('✅ Verification status updated');
        return result.data;
      }

      throw new Error('Failed to update verification status');
    } catch (error) {
      console.error('❌ Error updating verification status:', error);
      throw error;
    }
  }

  /**
   * Get all pending profile change requests (Admin only)
   */
  async getPendingProfileChanges() {
    try {
      console.log('🔍 Fetching all pending profile change requests...');

      const result = await this.makeRequest('/admin/employers/pending-changes');

      if (result.success && result.data) {
        console.log(`✅ Loaded ${result.data.length} pending profile change requests`);
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Error fetching pending profile changes:', error);
      throw error;
    }
  }

  /**
   * Approve pending profile changes (Admin only)
   */
  async approveProfileChanges(userId) {
    try {
      console.log(`✅ Approving profile changes for: ${userId}`);

      const result = await this.makeRequest(`/admin/employers/${userId}/approve-changes`, {
        method: 'POST',
        body: JSON.stringify({})
      });

      if (result.success) {
        console.log('✅ Profile changes approved successfully');
        return result.data;
      }

      throw new Error(result.message || 'Failed to approve profile changes');
    } catch (error) {
      console.error('❌ Error approving profile changes:', error);
      throw error;
    }
  }

  /**
   * Reject pending profile changes (Admin only)
   */
  async rejectProfileChanges(userId, rejectionReason = '') {
    try {
      console.log(`❌ Rejecting profile changes for: ${userId}`);

      const result = await this.makeRequest(`/admin/employers/${userId}/reject-changes`, {
        method: 'POST',
        body: JSON.stringify({
          rejectionReason
        })
      });

      if (result.success) {
        console.log('✅ Profile changes rejected successfully');
        return result.data;
      }

      throw new Error(result.message || 'Failed to reject profile changes');
    } catch (error) {
      console.error('❌ Error rejecting profile changes:', error);
      throw error;
    }
  }

  /**
   * Get verification data for a specific employer (Admin only)
   * Returns verificationData, status, submittedAt
   */
  async getVerificationData(userId) {
    try {
      console.log(`📋 Fetching verification data for employer: ${userId}`);
      const result = await this.makeRequest(`/profile/${userId}/verification`);
      if (result.success && result.data) {
        return result.data; // { verificationData, submittedAt, status }
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching verification data:', error);
      return null;
    }
  }

  /**
   * Update employer's quick job activation status (Admin only)
   */
  async updateQuickJobStatus(userId, status) {    try {
      console.log(`⚡ Updating quick job status for ${userId}: ${status}`);

      const result = await this.makeRequest(`/admin/employers/${userId}/quick-job-status`, {
        method: 'POST',
        body: JSON.stringify({
          quickJobStatus: status,
          updatedAt: new Date().toISOString()
        })
      });

      if (result.success) {
        console.log('✅ Quick job status updated');
        return result.data;
      }

      throw new Error('Failed to update quick job status');
    } catch (error) {
      console.error('❌ Error updating quick job status:', error);
      throw error;
    }
  }
}

export default new AdminEmployerService();

