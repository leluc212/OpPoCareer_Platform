// Admin service for managing employer profiles
// This service handles admin-specific operations like listing all employers and approving profiles

import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_EMPLOYER_API_URL || 'https://dlidp35x33.execute-api.ap-southeast-1.amazonaws.com/prod';

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

    return tokenString;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    return null;
  }
};

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
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Authentication required - no valid token');
      }

      const cleanToken = token.trim().replace(/[\r\n\t]/g, '');

      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Only attach Authorization when communicating with a direct API endpoint
      // (not when API_BASE_URL is a local proxy path like '/api-...'). Forwarding
      // Cognito tokens to API Gateway via the proxy can cause SigV4 parsing errors.
      if (!API_BASE_URL.startsWith('/')) {
        headers['Authorization'] = `Bearer ${cleanToken}`;
      } else {
        console.log('ℹ️ Skipping Authorization header for local proxy request (admin)');
      }

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
   */
  async approveEmployer(userId) {
    try {
      console.log(`✅ Approving employer: ${userId}`);

      const result = await this.makeRequest(`/admin/employers/${userId}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          approvalStatus: 'approved',
          approvedAt: new Date().toISOString()
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
}

export default new AdminEmployerService();
