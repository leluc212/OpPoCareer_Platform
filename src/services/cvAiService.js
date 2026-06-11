import { getAuthHeaders } from './authHeaders';

const API_BASE_URL =
  (import.meta.env.VITE_CV_AI_API_URL || '/api-cv-ai').replace(/\/$/, '');

const toApiCv = (cvData) => ({
  full_name: cvData.fullName || '',
  title: cvData.title || '',
  email: cvData.email || '',
  phone: cvData.phone || '',
  address: cvData.address || '',
  objective: cvData.objective || '',
  skills: cvData.skills || [],
  languages: cvData.languages || [],
  experiences: (cvData.experiences || []).map((item) => ({
    company: item.company || '',
    role: item.role || '',
    duration: item.duration || '',
    description: item.description || '',
  })),
  educations: (cvData.educations || []).map((item) => ({
    school: item.school || '',
    degree: item.degree || '',
    duration: item.duration || '',
    description: item.description || '',
  })),
});

const isAnalysisResponse = (value) => (
  value
  && Number.isFinite(value.score)
  && typeof value.summary === 'string'
  && Array.isArray(value.strengths)
  && Array.isArray(value.improvements)
  && Array.isArray(value.missing_skills)
  && Array.isArray(value.suggested_skills)
);

const errorMessage = (status, code, language) => {
  const vi = language === 'vi';
  if (status === 401) return vi ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : 'Your session has expired. Please sign in again.';
  if (status === 403) return vi ? 'Tài khoản này không có quyền phân tích CV.' : 'This account cannot analyze CVs.';
  if (status === 413) return vi ? 'Nội dung CV quá lớn để phân tích.' : 'The CV content is too large to analyze.';
  if (code === 'PROFILE_TITLE_REQUIRED') return vi ? 'Hãy bổ sung chức danh nghề nghiệp trong Hồ sơ cá nhân trước khi tạo CV bằng AI.' : 'Please add a career title to your profile before generating a CV.';
  if (status === 422 || code === 'CV_TOO_EMPTY') return vi ? 'Hãy bổ sung chức danh và nội dung CV trước khi phân tích.' : 'Add a title and more CV content before analysis.';
  if (status === 429 || code === 'AI_RATE_LIMITED') return vi ? 'Hệ thống đang xử lý nhiều yêu cầu. Vui lòng thử lại sau ít phút.' : 'The service is busy. Please try again in a few minutes.';
  if (code === 'AI_NOT_CONFIGURED') return vi ? 'Dịch vụ Gemini chưa được cấu hình API key. Vui lòng liên hệ quản trị viên.' : 'The Gemini service has not been configured with an API key.';
  if (code === 'AI_CREDENTIAL_INVALID') return vi ? 'Gemini API key không hợp lệ. Vui lòng tạo key trong Google AI Studio và cấu hình lại.' : 'The Gemini API key is invalid. Create a key in Google AI Studio and configure it again.';
  if (code === 'AI_TIMEOUT') return vi ? 'AI phản hồi quá chậm. Vui lòng thử lại.' : 'The AI response timed out. Please try again.';
  if (status >= 500) return vi ? 'Dịch vụ phân tích CV đang tạm gián đoạn. Vui lòng thử lại.' : 'The CV analysis service is temporarily unavailable.';
  return vi ? 'Không thể phân tích CV. Vui lòng thử lại.' : 'Unable to analyze the CV. Please try again.';
};

export const analyzeCV = async ({
  cvData,
  targetJobTitle = '',
  targetJobDescription = '',
  language = 'vi',
}) => {
  const headers = await getAuthHeaders();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${API_BASE_URL}/cv/analyze`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        cv: toApiCv(cvData),
        target_job_title: targetJobTitle || null,
        target_job_description: targetJobDescription || null,
        language,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(errorMessage(response.status, payload?.error?.code, language));
    }
    if (!isAnalysisResponse(payload)) {
      throw new Error(language === 'vi'
        ? 'Kết quả phân tích không hợp lệ. Vui lòng thử lại.'
        : 'The analysis result is invalid. Please try again.');
    }
    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(language === 'vi'
        ? 'Yêu cầu phân tích đã hết thời gian chờ. Vui lòng thử lại.'
        : 'The analysis request timed out. Please try again.');
    }
    if (error instanceof TypeError) {
      throw new Error(language === 'vi'
        ? 'Không thể kết nối tới dịch vụ phân tích CV.'
        : 'Could not connect to the CV analysis service.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};

export const generateCV = async ({
  profile,
  language = 'vi',
}) => {
  const headers = await getAuthHeaders();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${API_BASE_URL}/cv/generate`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        profile,
        language,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(errorMessage(response.status, payload?.error?.code, language));
    }
    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(language === 'vi'
        ? 'Yêu cầu tạo CV đã hết thời gian chờ. Vui lòng thử lại.'
        : 'The generation request timed out. Please try again.');
    }
    if (error instanceof TypeError) {
      throw new Error(language === 'vi'
        ? 'Không thể kết nối tới dịch vụ tạo CV.'
        : 'Could not connect to the CV generation service.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};

export const recommendCandidates = async ({
  jobData,
  language = 'vi',
}) => {
  const headers = await getAuthHeaders();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 35_000);

  try {
    const response = await fetch(`${API_BASE_URL}/cv/recommend-candidates`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        job: {
          title: jobData.title || '',
          description: jobData.description || '',
          requirements: jobData.requirements || '',
          responsibilities: jobData.responsibilities || '',
          benefits: jobData.benefits || '',
        },
        language,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(errorMessage(response.status, payload?.error?.code, language));
    }
    return payload?.recommendations || [];
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(language === 'vi'
        ? 'Yêu cầu gợi ý ứng viên đã hết thời gian chờ. Vui lòng thử lại.'
        : 'The recommendation request timed out. Please try again.');
    }
    if (error instanceof TypeError) {
      throw new Error(language === 'vi'
        ? 'Không thể kết nối tới dịch vụ gợi ý ứng viên.'
        : 'Could not connect to the recommendation service.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};

export default { analyzeCV, generateCV, recommendCandidates };
