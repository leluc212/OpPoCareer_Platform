import { fetchAuthSession } from 'aws-amplify/auth';

const API_ENDPOINT = 'https://l1636ie205.execute-api.ap-southeast-1.amazonaws.com';

/**
 * Get authenticated headers with JWT token
 */
async function getAuthHeaders() {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    
    if (!idToken) {
      throw new Error('No authentication token available');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    throw error;
  }
}

/**
 * Submit a job application
 * @param {string} jobId - Job ID
 * @param {string} cvUrl - S3 URL of the CV
 * @param {string} cvFilename - Original filename of the CV
 * @returns {Promise<Object>} Application data
 */
export async function submitApplication(jobId, cvUrl, cvFilename) {
  try {
    console.log('📤 Submitting application:', { jobId, cvUrl, cvFilename });
    
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_ENDPOINT}/applications`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jobId,
        cvUrl,
        cvFilename
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
    const session = await fetchAuthSession();
    const userId = session.tokens?.idToken?.payload?.sub;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_ENDPOINT}/applications/candidate/${userId}`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get applications');
    }
    
    const data = await response.json();
    console.log('✅ Loaded candidate applications:', data);
    return data.applications || [];
  } catch (error) {
    console.error('❌ Error getting candidate applications:', error);
    throw error;
  }
}

/**
 * Get all applications for a specific job (employer only)
 * @param {string} jobId - Job ID
 * @returns {Promise<Array>} List of applications
 */
export async function getJobApplications(jobId) {
  try {
    console.log('📥 Loading applications for job:', jobId);
    
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_ENDPOINT}/applications/job/${jobId}`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get job applications');
    }
    
    const data = await response.json();
    console.log('✅ Loaded job applications:', data);
    return data.applications || [];
  } catch (error) {
    console.error('❌ Error getting job applications:', error);
    throw error;
  }
}

/**
 * Update application status (employer only)
 * @param {string} applicationId - Application ID
 * @param {string} status - New status (pending, reviewed, accepted, rejected)
 * @returns {Promise<Object>} Updated application
 */
export async function updateApplicationStatus(applicationId, status) {
  try {
    console.log('📝 Updating application status:', { applicationId, status });
    
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_ENDPOINT}/applications/${applicationId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status })
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

const applicationService = {
  submitApplication,
  getMyCandidateApplications,
  getJobApplications,
  updateApplicationStatus
};

export default applicationService;
