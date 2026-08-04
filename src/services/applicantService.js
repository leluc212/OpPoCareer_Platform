// Applicant Service
// Lay danh sach ung vien tu DynamoDB qua CandidateProfileAPI.

import { fetchAuthSession } from 'aws-amplify/auth';

// DEV: dung Vite proxy /api -> CandidateProfileAPI /candidates.
// PROD: gọi thẳng endpoint
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : `${import.meta.env.VITE_CANDIDATE_API_URL || 'https://mrag7hkw11.execute-api.ap-southeast-1.amazonaws.com/prod'}/candidates`;

/**
 * Lấy Cognito ID Token từ Amplify session
 * CandidateProfileAPI dung COGNITO_USER_POOLS authorizer nen bat buoc phai co token.
 */
const getAuthToken = async () => {
  try {
    const session = await fetchAuthSession();
    if (!session?.tokens?.idToken) {
      console.warn('⚠️ [ApplicantService] Không có Cognito session/token');
      return null;
    }
    const raw = session.tokens.idToken;
    // Đảm bảo token là string thuần, không có ký tự thừa
    return (typeof raw === 'string' ? raw : raw.toString()).trim().replace(/[\r\n\t]/g, '');
  } catch (err) {
    console.error('❌ [ApplicantService] Lỗi lấy auth token:', err);
    return null;
  }
};

/**
 * Xử lý response từ fetch
 */
async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Applicant Service
 * Tải toàn bộ dữ liệu ứng viên từ DynamoDB để xử lý cục bộ
 */
const applicantService = {
  async getAllApplicants() {
    try {
      console.log('📡 [ApplicantService] Đang tải dữ liệu ứng viên từ DynamoDB...');

      // CandidateProfileAPI dung Cognito authorizer -> phai gui Bearer token.
      const token = await getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 [ApplicantService] Đã đính kèm Cognito token');
      } else {
        console.warn('⚠️ [ApplicantService] Không có token - request có thể bị từ chối (Missing Authentication Token)');
      }

      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers,
        mode: 'cors'
      });

      const data = await handleResponse(response);

      // Lọc bỏ record rác / ghost không có email hoặc tên thật
      if (Array.isArray(data)) {
        const filtered = data.filter(item =>
          (item.email && item.email.includes('@')) ||
          (item.fullName && item.fullName.trim() !== '' && item.fullName !== 'Unknown User')
        );
        console.log(`✅ [ApplicantService] Tải thành công ${filtered.length}/${data.length} ứng viên hợp lệ`);
        return filtered;
      }

      return [];
    } catch (error) {
      console.error('❌ [ApplicantService] Lỗi tải ứng viên:', error.message);
      throw error;
    }
  }
};

export default applicantService;
