// Service for managing employer profiles with DynamoDB backend
// This service handles all API calls related to employer profile operations

import { fetchAuthSession } from 'aws-amplify/auth';
import { getIdToken } from './authHeaders.js';

// API base URL - use Vite proxy in dev to avoid CORS, direct URL in production
const API_BASE_URL = import.meta.env.DEV
  ? '/api-employer'
  : (import.meta.env.VITE_EMPLOYER_API_URL || 'https://dlidp35x33.execute-api.ap-southeast-1.amazonaws.com/prod');

/**
 * Get authentication token — delegates to shared authHeaders utility which
 * handles the Amplify session → localStorage fallback automatically.
 */
const getAuthToken = async () => {
  const token = await getIdToken();
  if (token) {
    console.log('✅ Auth token obtained');
    console.log('Token preview:', token.substring(0, 50) + '...');
    console.log('Token length:', token.length);
  }
  return token;
};

/**
 * Employer Profile Service
 * 
 * Production implementation using API Gateway + Lambda + DynamoDB
 */
class EmployerProfileService {
  constructor() {
    console.log('📝 EmployerProfileService initialized (API mode)');
    console.log('🔗 API URL:', API_BASE_URL);
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, options = {}) {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        console.error('❌ No authentication token available');
        throw new Error('Authentication required - no valid token');
      }
      
      // CRITICAL: Ensure token is clean before adding to header
      const cleanToken = token.trim().replace(/[\r\n\t]/g, '');

      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Always include Authorization header - proxy will forward it, direct URL needs it
      headers['Authorization'] = `Bearer ${cleanToken}`;

      console.log(`📤 Making ${options.method || 'GET'} request to ${API_BASE_URL}${endpoint}`);
      console.log('[DEBUG makeRequest] URL:', `${API_BASE_URL}${endpoint}`);
      console.log('[DEBUG makeRequest] Full headers object:', headers);
      console.log('[DEBUG makeRequest] Authorization value:', headers['Authorization'] || headers['authorization']);
      console.log('[DEBUG makeRequest] Có prefix Bearer không:', (headers['Authorization'] || '').startsWith('Bearer '));
      console.log('🔑 Authorization header length:', headers.Authorization.length);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        mode: 'cors'
      });

      console.log(`📥 Response status: ${response.status}`);

      // Handle 404 as a special case - profile doesn't exist yet
      if (response.status === 404) {
        const error = await response.json().catch(() => ({ message: 'Profile not found' }));
        throw new Error(error.message || 'No profile exists for this user ID');
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Request failed' }));
        console.error(`❌ API Error ${response.status}:`, errorBody);
        throw new Error(errorBody.message || `HTTP ${response.status}`);
      }

      let data = await response.json();

      // Handle double-wrapped Lambda proxy responses:
      // Some API Gateway integrations return the Lambda proxy response object
      // as the HTTP body with statusCode/body nested inside (HTTP 200 outer).
      if (
        data &&
        typeof data.statusCode === 'number' &&
        typeof data.body === 'string'
      ) {
        console.warn('⚠️ Detected double-wrapped Lambda response, unwrapping...');
        const innerStatus = data.statusCode;
        let innerBody;
        try {
          innerBody = JSON.parse(data.body);
        } catch {
          innerBody = { message: data.body };
        }
        if (innerStatus === 401 || innerStatus === 403) {
          console.error(`❌ Auth error from Lambda (${innerStatus}):`, innerBody);
          throw new Error(innerBody.message || `Unauthorized (${innerStatus})`);
        }
        if (innerStatus >= 400) {
          console.error(`❌ API Error from Lambda (${innerStatus}):`, innerBody);
          throw new Error(innerBody.message || `HTTP ${innerStatus}`);
        }
        data = innerBody;
      }

      console.log('✅ API request successful');
      return data;
    } catch (error) {
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
   * Get current user's profile
   */
  async getMyProfile() {
    try {
      const session = await fetchAuthSession();
      
      if (!session || !session.tokens) {
        throw new Error('User not authenticated - no session');
      }
      
      // Extract userId from the ID token's sub claim
      const idTokenPayload = session.tokens.idToken?.payload;
      const userId = idTokenPayload?.sub;
      
      console.log('🔍 Getting employer profile for userId:', userId);
      
      if (!userId) {
        throw new Error('User not authenticated - no userId in token');
      }

      const result = await this.makeRequest(`/profile/${userId}`);
      
      if (result.success && result.data) {
        console.log('✅ Employer profile loaded from DynamoDB:', result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching employer profile:', error);
      
      // Return null if profile doesn't exist yet
      if (error.message.includes('not found') || 
          error.message.includes('404') ||
          error.message.includes('No profile exists')) {
        console.log('ℹ️ No employer profile found in DynamoDB - this is normal for new users');
        return null;
      }
      
      // For authentication errors, throw a more specific error
      if (error.message.includes('Forbidden') || 
          error.message.includes('Unauthorized') ||
          error.message.includes('not authenticated')) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      throw error;
    }
  }

  /**
   * Create new profile for current user
   */
  async createProfile(profileData) {
    try {
      const session = await fetchAuthSession();
      
      if (!session || !session.tokens) {
        throw new Error('User not authenticated - no session');
      }
      
      const idTokenPayload = session.tokens.idToken?.payload;
      const userId = idTokenPayload?.sub;
      const cognitoEmail = idTokenPayload?.email;
      
      console.log('📝 Creating employer profile for userId:', userId);
      console.log('📧 Using Cognito email:', cognitoEmail);
      
      if (!cognitoEmail) {
        throw new Error('Cannot get verified email from Cognito');
      }
      
      if (!userId) {
        throw new Error('User not authenticated - no userId in token');
      }

      const payload = {
        ...profileData,
        userId: userId,
        email: cognitoEmail,
        profileCompletion: this.calculateCompletion(profileData)
      };

      const result = await this.makeRequest('/profile', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (result.success && result.data) {
        console.log('✅ Employer profile created in DynamoDB:', result.data);
        return result.data;
      }

      throw new Error('Failed to create profile');
    } catch (error) {
      console.error('❌ Error creating employer profile:', error);
      throw error;
    }
  }

  /**
   * Update current user's profile
   */
  async updateProfile(updates) {
    try {
      const session = await fetchAuthSession();
      
      if (!session || !session.tokens) {
        throw new Error('User not authenticated - no session');
      }
      
      const idTokenPayload = session.tokens.idToken?.payload;
      const userId = idTokenPayload?.sub;
      const cognitoEmail = idTokenPayload?.email;
      
      if (!userId) {
        throw new Error('User not authenticated - no userId in token');
      }

      // Remove email from updates - it cannot be changed
      const { email, ...allowedUpdates } = updates;
      
      if (email && email !== cognitoEmail) {
        console.warn('Email cannot be changed. Using Cognito verified email:', cognitoEmail);
      }

      const payload = {
        ...allowedUpdates,
        profileCompletion: this.calculateCompletion(allowedUpdates)
      };

      const result = await this.makeRequest(`/profile/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (result.success && result.data) {
        console.log('✅ Employer profile updated in DynamoDB:', result.data);
        return result.data;
      }

      throw new Error('Failed to update profile');
    } catch (error) {
      console.error('❌ Error updating employer profile:', error);
      throw error;
    }
  }

  /**
   * Submit pending profile changes for admin review
   * This does NOT update the main profile immediately
   * @param {object} changes - All changed fields
   */
  async submitPendingChanges(changes) {
    try {
      const session = await fetchAuthSession();
      
      if (!session || !session.tokens) {
        throw new Error('User not authenticated - no session');
      }
      
      const idTokenPayload = session.tokens.idToken?.payload;
      const userId = idTokenPayload?.sub;
      
      if (!userId) {
        throw new Error('User not authenticated - no userId in token');
      }

      const result = await this.makeRequest(`/profile/${userId}/submit-changes`, {
        method: 'PUT',
        body: JSON.stringify({ changes })
      });
      
      if (result.success) {
        console.log('✅ Pending profile changes submitted for review');
        return result.data;
      }

      throw new Error(result.message || 'Failed to submit profile changes');
    } catch (error) {
      console.error('❌ Error submitting pending profile changes:', error);
      throw error;
    }
  }

  /**
   * Delete current user's profile (soft delete)
   */
  async deleteProfile() {
    try {
      const session = await fetchAuthSession();
      
      if (!session || !session.tokens) {
        throw new Error('User not authenticated - no session');
      }
      
      const idTokenPayload = session.tokens.idToken?.payload;
      const userId = idTokenPayload?.sub;
      
      if (!userId) {
        throw new Error('User not authenticated - no userId in token');
      }

      const result = await this.makeRequest(`/profile/${userId}`, {
        method: 'DELETE'
      });
      
      if (result.success) {
        console.log('✅ Employer profile soft deleted in DynamoDB');
        return true;
      }

      throw new Error('Failed to delete profile');
    } catch (error) {
      console.error('❌ Error deleting employer profile:', error);
      throw error;
    }
  }

  /**
   * Upload a company image (logo, banner, gallery) to S3 via presigned URL.
   * @param {string} userId
   * @param {'companyLogo'|'companyBanner'|'companyImage'} field
   * @param {{ name:string, data:string, type:string }} fileObj - data is base64 string (with or without data: prefix)
   * @returns {string} - public S3 URL
   */
  async uploadCompanyImage(userId, field, fileObj) {
    // 1. Get presigned URL from Lambda
    const presignRes = await this.makeRequest(`/profile/${userId}/image-upload-url`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: fileObj.name,
        fileType: fileObj.type,
        field
      })
    });
    if (!presignRes.success) throw new Error(`Failed to get upload URL for ${field}`);
    const { uploadUrl, fileUrl } = presignRes.data;

    // 2. Decode base64 → Blob
    const base64 = fileObj.data.includes(',') ? fileObj.data.split(',')[1] : fileObj.data;
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: fileObj.type });

    // 3. PUT directly to S3
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': fileObj.type }
    });
    if (!uploadRes.ok) throw new Error(`S3 upload failed for ${field}: ${uploadRes.status}`);

    console.log(`✅ Uploaded ${field} → ${fileUrl}`);
    return fileUrl;
  }

  /**
   * Upload a verification file to S3 via presigned URL.
   * @param {string} userId
   * @param {string} field  - e.g. 'businessLicense', 'idFrontImage'
   * @param {{ name:string, data:string, type:string }} fileObj - data is base64 string (with or without data: prefix)
   * @returns {string} - public S3 URL
   */
  async uploadVerificationFile(userId, field, fileObj) {
    // 1. Get presigned URL from Lambda
    const presignRes = await this.makeRequest(`/profile/${userId}/verification/upload-url`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: fileObj.name,
        fileType: fileObj.type,
        field
      })
    });
    if (!presignRes.success) throw new Error(`Failed to get upload URL for ${field}`);
    const { uploadUrl, fileUrl } = presignRes.data;

    // 2. Decode base64 → Blob
    const base64 = fileObj.data.includes(',') ? fileObj.data.split(',')[1] : fileObj.data;
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: fileObj.type });

    // 3. PUT directly to S3
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': fileObj.type }
    });
    if (!uploadRes.ok) throw new Error(`S3 upload failed for ${field}: ${uploadRes.status}`);

    console.log(`✅ Uploaded ${field} → ${fileUrl}`);
    return fileUrl;
  }

  /**
   * Submit verification request — uploads images to S3, stores only URLs in DynamoDB
   */
  async submitVerification(verificationData) {
    try {
      const session = await fetchAuthSession();
      
      if (!session || !session.tokens) {
        throw new Error('User not authenticated - no session');
      }
      
      const idTokenPayload = session.tokens.idToken?.payload;
      const userId = idTokenPayload?.sub;
      
      if (!userId) {
        throw new Error('User not authenticated - no userId in token');
      }

      // Upload each file field to S3 and replace with URL
      const uploadFileField = async (obj, field) => {
        if (obj?.[field]?.data) {
          console.log(`📤 Uploading ${field} to S3...`);
          const url = await this.uploadVerificationFile(userId, field, obj[field]);
          return { ...obj[field], data: null, url };
        }
        return obj?.[field] || null;
      };

      const step1 = verificationData?.step1 || {};
      const step3 = verificationData?.step3 || {};

      const [businessLicenseUploaded, idFrontUploaded, idBackUploaded, authLetterUploaded] = await Promise.all([
        uploadFileField(step1, 'businessLicense'),
        uploadFileField(step3, 'idFrontImage'),
        uploadFileField(step3, 'idBackImage'),
        uploadFileField(step3, 'authorizationLetter')
      ]);

      // Build clean verificationData with S3 URLs, no base64
      const cleanVerificationData = {
        ...verificationData,
        step1: {
          ...step1,
          businessLicense: businessLicenseUploaded
        },
        step3: {
          ...step3,
          idFrontImage: idFrontUploaded,
          idBackImage: idBackUploaded,
          authorizationLetter: authLetterUploaded
        }
      };

      const payload = {
        verificationData: cleanVerificationData,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      console.log('🔑 Submitting verification for userId:', userId);

      const result = await this.makeRequest(`/profile/${userId}/verification`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (result.success) {
        console.log('✅ Verification request submitted');
        return result.data;
      }

      throw new Error(result.message || `Failed to submit verification (success=false, raw=${JSON.stringify(result)})`);
    } catch (error) {
      console.error('❌ Error submitting verification — type:', typeof error, '— name:', error?.name, '— message:', error?.message, '— full:', error);
      throw error;
    }
  }

  /**
   * Approve verification (Admin only)
   */
  async approveVerification(userId, approvalData) {
    try {
      const payload = {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: approvalData.approvedBy,
        notes: approvalData.notes || ''
      };

      const result = await this.makeRequest(`/profile/${userId}/verification/approve`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (result.success) {
        console.log('✅ Verification approved');
        return result.data;
      }

      throw new Error('Failed to approve verification');
    } catch (error) {
      console.error('❌ Error approving verification:', error);
      throw error;
    }
  }

  /**
   * Reject verification (Admin only)
   */
  async rejectVerification(userId, rejectionData) {
    try {
      const payload = {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: rejectionData.rejectedBy,
        reason: rejectionData.reason || ''
      };

      const result = await this.makeRequest(`/profile/${userId}/verification/reject`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (result.success) {
        console.log('✅ Verification rejected');
        return result.data;
      }

      throw new Error('Failed to reject verification');
    } catch (error) {
      console.error('❌ Error rejecting verification:', error);
      throw error;
    }
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(userId) {
    try {
      const result = await this.makeRequest(`/profile/${userId}/verification`);
      
      if (result.success && result.data) {
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting verification status:', error);
      if (error.message.includes('not found') || error.message.includes('404')) {
        return null;
      }
      
      return null;
    }
  }

  /**
   * Calculate profile completion percentage
   */
  calculateCompletion(profileData) {
    let completion = 0;
    
    // Basic info (40% total - 10% each)
    if (profileData.companyName?.trim()) completion += 10;
    if (profileData.email?.trim()) completion += 10;
    if (profileData.phone?.trim()) completion += 10;
    if (profileData.address?.trim()) completion += 10;
    
    // Business info (30% total - 10% each)
    if (profileData.industry?.trim()) completion += 10;
    if (profileData.companySize?.trim()) completion += 10;
    if (profileData.description?.trim()) completion += 10;
    
    // Company logo (15%)
    if (profileData.companyLogo) completion += 15;
    
    // Website (5%)
    if (profileData.website?.trim()) completion += 5;
    
    // Legal documents (20% - 10% each)
    if (profileData.taxCode?.trim()) completion += 10;
    if (profileData.businessLicense?.trim()) completion += 10;
    
    return completion;
  }
}

// Export singleton instance
export default new EmployerProfileService();
