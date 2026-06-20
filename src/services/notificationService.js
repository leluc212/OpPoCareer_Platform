// Notification Service for Package Subscriptions

const API_ENDPOINT = import.meta.env.VITE_NOTIFICATIONS_API;

// Debug: Log API endpoint on module load
console.log('🔧 notificationService.js loaded');
console.log('🔧 API_ENDPOINT:', API_ENDPOINT);
console.log('🔧 import.meta.env:', import.meta.env);

// ===== API Functions =====

/**
 * Get all notifications from API
 */
export const getAllNotifications = async () => {
  if (!API_ENDPOINT) {
    throw new Error('Notifications API endpoint is not configured');
  }

  try {
    const response = await fetch(`${API_ENDPOINT}/notifications`);
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error getting notifications from API:', error);
    throw error;
  }
};

/**
 * Get notifications for a specific user
 * @param {string} userId - User ID
 * @param {string} role - 'admin', 'employer', or 'candidate'
 */
export const getNotifications = async (userId, role) => {
  if (!API_ENDPOINT) {
    throw new Error('Notifications API endpoint is not configured');
  }

  console.log('🔔 [notificationService] getNotifications called with userId:', userId, 'role:', role);
  console.log('🔔 [notificationService] URL:', `${API_ENDPOINT}/notifications/user/${userId}?role=${role}`);

  try {
    // Use /notifications/user/{userId}?role=... endpoint which uses GSI query (faster & paginated)
    const response = await fetch(`${API_ENDPOINT}/notifications/user/${userId}?role=${role}`);
    console.log('🔔 [notificationService] Response status:', response.status);
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    const data = await response.json();
    console.log('🔔 [notificationService] Data received:', data?.length, 'items');
    const list = data || [];
    return list.filter(n => n.type !== 'chat_message');
  } catch (error) {
    console.error('Error getting notifications from API:', error);
    throw error;
  }
};

/**
 * Get unread count for a user
 */
export const getUnreadCount = async (userId, role) => {
  try {
    const notifications = await getNotifications(userId, role);
    return notifications.filter(n => !n.read).length;
  } catch (error) {
    return 0;
  }
};

/**
 * Create notification when employer requests package purchase
 * @param {object} subscription - Subscription data
 */
export const createPackagePurchaseRequestNotification = async (subscription) => {
  console.log('📝 Creating package purchase notification with data:', subscription);

  const notification = {
    type: 'package_purchase_request',
    title: 'Yêu cầu mua gói dịch vụ mới',
    titleEn: 'New Package Purchase Request',
    message: `${subscription.companyName} yêu cầu mua gói ${subscription.packageName} (${subscription.duration}) - Giá: ${subscription.price.toLocaleString('vi-VN')} VND`,
    messageEn: `${subscription.companyName} requested to purchase ${subscription.packageName} package (${subscription.duration}) - Price: ${subscription.price.toLocaleString('vi-VN')} VND`,
    recipientId: 'admin',
    recipientRole: 'admin',
    senderId: subscription.employerId,
    senderName: subscription.companyName,
    data: {
      subscriptionId: subscription.subscriptionId,
      packageName: subscription.packageName,
      duration: subscription.duration,
      price: subscription.price,
      employerId: subscription.employerId,
      companyName: subscription.companyName
    },
    icon: 'package',
    color: '#3b82f6',
    actionUrl: '/admin/packages',
    actionText: 'Xem chi tiết',
    actionTextEn: 'View Details'
  };

  console.log('📤 Sending notification to API with UTF-8 encoding:');
  console.log('   API Endpoint:', API_ENDPOINT);
  console.log('   Notification data:', JSON.stringify(notification, null, 2));
  console.log('   ⚠️ CRITICAL: recipientId =', notification.recipientId, '(must be "admin")');
  console.log('   ⚠️ CRITICAL: recipientRole =', notification.recipientRole, '(must be "admin")');

  const result = await saveNotification(notification);
  console.log('✅ Notification API response:', result);

  // Verify notification was created
  if (result && result.success) {
    console.log('✅ Notification created successfully with ID:', result.data?.notificationId);
  } else {
    console.error('❌ Notification creation may have failed:', result);
  }

  return result;
};

/**
 * Create notification when admin approves package
 * @param {object} subscription - Subscription data
 * @param {string} employerId - Employer ID
 */
export const createPackageApprovedNotification = async (subscription, employerId) => {
  console.log('📝 Creating package approved notification');
  console.log('   Subscription data:', subscription);
  console.log('   Employer ID:', employerId);
  console.log('   Employer ID type:', typeof employerId);

  if (!employerId) {
    const error = new Error('❌ CRITICAL: employerId is required but was not provided!');
    console.error(error);
    throw error;
  }

  const notification = {
    type: 'package_approved',
    title: 'Gói dịch vụ đã được kích hoạt',
    titleEn: 'Package Activated',
    message: `Gói ${subscription.packageName} (${subscription.duration}) của bạn đã được admin phê duyệt và kích hoạt thành công!`,
    messageEn: `Your ${subscription.packageName} package (${subscription.duration}) has been approved and activated!`,
    recipientId: employerId,
    recipientRole: 'employer',
    senderId: 'admin',
    senderName: 'Admin',
    data: {
      subscriptionId: subscription.subscriptionId,
      packageName: subscription.packageName,
      duration: subscription.duration,
      expiryDate: subscription.expiryDate
    },
    icon: 'check-circle',
    color: '#10b981',
    actionUrl: '/employer/subscription',
    actionText: 'Xem gói của tôi',
    actionTextEn: 'View My Packages'
  };

  console.log('📤 Sending package approved notification to API:');
  console.log('   API Endpoint:', API_ENDPOINT);
  console.log('   Notification data:', JSON.stringify(notification, null, 2));
  console.log('   ⚠️ CRITICAL: recipientId =', notification.recipientId, '(must be employerId)');
  console.log('   ⚠️ CRITICAL: recipientRole =', notification.recipientRole, '(must be "employer")');

  const result = await saveNotification(notification);
  console.log('✅ Package approved notification API response:', result);

  // Verify notification was created
  if (result && result.success) {
    console.log('✅ Package approved notification created successfully with ID:', result.data?.notificationId);
    console.log('✅ Employer will see this notification in their navbar');
  } else {
    console.error('❌ Package approved notification creation may have failed:', result);
  }

  return result;
};

/**
 * Create notification when candidate applies for a job
 * @param {object} payload - Application notification data
 */
export const createEmployerApplicationNotification = async (payload) => {
  const {
    employerId,
    candidateId,
    candidateName,
    jobTitle,
    companyName,
    jobId,
    isQuickJob
  } = payload;

  if (!employerId) {
    const error = new Error('❌ CRITICAL: employerId is required but was not provided!');
    console.error(error);
    throw error;
  }

  const safeCandidateName = candidateName || 'Ứng viên';
  const safeJobTitle = jobTitle || 'vị trí mới';
  const safeCompanyName = companyName || 'công ty của bạn';

  const notification = {
    type: 'application',
    title: 'Ứng viên mới ứng tuyển',
    titleEn: 'New application received',
    message: `${safeCandidateName} đã ứng tuyển vào vị trí ${safeJobTitle} tại ${safeCompanyName}.`,
    messageEn: `${safeCandidateName} applied for ${safeJobTitle} at ${safeCompanyName}.`,
    recipientId: employerId,
    recipientRole: 'employer',
    senderId: candidateId || 'candidate',
    senderName: safeCandidateName,
    data: {
      jobId: jobId || null,
      jobTitle: safeJobTitle,
      companyName: safeCompanyName,
      candidateId: candidateId || null,
      candidateName: safeCandidateName,
      isQuickJob: !!isQuickJob
    },
    icon: 'user-plus',
    color: '#3b82f6',
    actionUrl: isQuickJob ? '/employer/quick-jobs' : '/employer/standard-jobs',
    actionText: 'Xem hồ sơ',
    actionTextEn: 'View applications'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when candidate completes AI Interview (Round 2)
 * @param {object} payload - { employerId, candidateId, candidateName, jobTitle, companyName, jobId }
 */
export const createEmployerAiInterviewCompletedNotification = async (payload) => {
  const {
    employerId,
    candidateId,
    candidateName,
    jobTitle,
    companyName,
    jobId
  } = payload;

  if (!employerId) {
    const error = new Error('❌ CRITICAL: employerId is required but was not provided!');
    console.error(error);
    throw error;
  }

  const safeCandidateName = candidateName || 'Ứng viên';
  const safeJobTitle = jobTitle || 'vị trí mới';
  const safeCompanyName = companyName || 'công ty của bạn';

  const notification = {
    type: 'ai_interview_complete',
    title: 'Kết quả phỏng vấn AI hoàn thành',
    titleEn: 'AI Interview Completed',
    message: `Ứng viên ${safeCandidateName} đã hoàn thành buổi phỏng vấn AI cho vị trí ${safeJobTitle}.`,
    messageEn: `Candidate ${safeCandidateName} has completed the AI interview for ${safeJobTitle}.`,
    recipientId: employerId,
    recipientRole: 'employer',
    senderId: candidateId || 'candidate',
    senderName: safeCandidateName,
    data: {
      jobId: jobId || null,
      jobTitle: safeJobTitle,
      companyName: safeCompanyName,
      candidateId: candidateId || null,
      candidateName: safeCandidateName,
      isQuickJob: false
    },
    icon: 'volume-2',
    color: '#8b5cf6',
    actionUrl: '/employer/standard-jobs',
    actionText: 'Xem kết quả',
    actionTextEn: 'View Results'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when employer accepts candidate CV (quick job)
 * @param {object} payload - Candidate notification data
 */
export const createCandidateCvAcceptedNotification = async (payload) => {
  const {
    candidateId,
    jobTitle,
    companyName,
    jobId,
    employerId
  } = payload;

  if (!candidateId) {
    const error = new Error('❌ CRITICAL: candidateId is required but was not provided!');
    console.error(error);
    throw error;
  }

  const safeJobTitle = jobTitle || 'công việc tuyển gấp';
  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  const notification = {
    type: 'success',
    title: 'CV của bạn đã được chấp nhận',
    titleEn: 'Your CV has been accepted',
    message: `CV của bạn đã được ${safeCompanyName} chấp nhận cho vị trí ${safeJobTitle}. Bạn có thể nhắn tin cho Nhà tuyển dụng ngay ở phần bong bóng chat bên phải dưới màn hình.`,
    messageEn: `Your CV was accepted by ${safeCompanyName} for the ${safeJobTitle} position. You can message the employer using the chat bubble at the bottom right of the screen.`,
    recipientId: candidateId,
    recipientRole: 'candidate',
    senderId: employerId || 'employer',
    senderName: safeCompanyName,
    data: {
      jobId: jobId || null,
      jobTitle: safeJobTitle,
      companyName: safeCompanyName,
      employerId: employerId || null,
      isQuickJob: true
    },
    icon: 'check-circle',
    color: '#10b981',
    actionUrl: '/candidate/jobs?tab=shift',
    actionText: 'Xem việc làm tuyển gấp',
    actionTextEn: 'View shift jobs'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when employer rejects candidate CV (quick job)
 * @param {object} payload - Candidate notification data
 */
export const createCandidateCvRejectedNotification = async (payload) => {
  const {
    candidateId,
    jobTitle,
    companyName,
    jobId,
    employerId
  } = payload;

  if (!candidateId) {
    const error = new Error('❌ CRITICAL: candidateId is required but was not provided!');
    console.error(error);
    throw error;
  }

  const safeJobTitle = jobTitle || 'công việc tuyển gấp';
  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  const notification = {
    type: 'system',
    title: 'CV của bạn chưa được chấp nhận',
    titleEn: 'Your CV was not accepted',
    message: `CV của bạn cho vị trí ${safeJobTitle} tại ${safeCompanyName} chưa được chấp nhận. Bạn có thể cập nhật hồ sơ và tiếp tục ứng tuyển các công việc phù hợp khác.`,
    messageEn: `Your CV for the ${safeJobTitle} position at ${safeCompanyName} was not accepted. You can update your profile and apply for other suitable jobs.`,
    recipientId: candidateId,
    recipientRole: 'candidate',
    senderId: employerId || 'employer',
    senderName: safeCompanyName,
    data: {
      jobId: jobId || null,
      jobTitle: safeJobTitle,
      companyName: safeCompanyName,
      employerId: employerId || null,
      isQuickJob: true
    },
    icon: 'alert-circle',
    color: '#ef4444',
    actionUrl: '/candidate/jobs?tab=shift',
    actionText: 'Xem việc làm khác',
    actionTextEn: 'Browse other jobs'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when employer approves candidate CV for a standard job (directing to AI interview within 2 days)
 * @param {object} payload - Candidate notification data
 */
export const createCandidateCvApprovedNotification = async (payload) => {
  const {
    candidateId,
    jobTitle,
    companyName,
    jobId,
    employerId
  } = payload;

  if (!candidateId) {
    const error = new Error('❌ CRITICAL: candidateId is required but was not provided!');
    console.error(error);
    throw error;
  }

  const safeJobTitle = jobTitle || 'công việc tiêu chuẩn';
  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  const notification = {
    type: 'success',
    title: 'CV của bạn đã được duyệt vòng 1',
    titleEn: 'Your CV has been approved (Round 1)',
    message: `CV của bạn cho vị trí ${safeJobTitle} tại ${safeCompanyName} đã được duyệt. Trong vòng 2 ngày bạn phải vào hệ thống để phỏng vấn với AI.`,
    messageEn: `Your CV for the position ${safeJobTitle} at ${safeCompanyName} has been approved. You must enter the platform to interview with AI within 2 days.`,
    recipientId: candidateId,
    recipientRole: 'candidate',
    senderId: employerId || 'employer',
    senderName: safeCompanyName,
    data: {
      jobId: jobId || null,
      jobTitle: safeJobTitle,
      companyName: safeCompanyName,
      employerId: employerId || null,
      isQuickJob: false
    },
    icon: 'check-circle',
    color: '#10b981',
    actionUrl: '/candidate/dashboard',
    actionText: 'Phỏng vấn với AI ngay',
    actionTextEn: 'Start AI Interview'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when employer rejects candidate CV for a standard job
 * @param {object} payload - Candidate notification data
 */
export const createCandidateCvRejectedStandardNotification = async (payload) => {
  const {
    candidateId,
    jobTitle,
    companyName,
    jobId,
    employerId
  } = payload;

  if (!candidateId) {
    const error = new Error('❌ CRITICAL: candidateId is required but was not provided!');
    console.error(error);
    throw error;
  }

  const safeJobTitle = jobTitle || 'công việc tiêu chuẩn';
  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  const notification = {
    type: 'system',
    title: 'Hồ sơ tuyển dụng của bạn không được duyệt',
    titleEn: 'Your CV was not accepted',
    message: `CV của bạn cho vị trí ${safeJobTitle} tại ${safeCompanyName} chưa được chấp nhận. Bạn có thể cập nhật hồ sơ và tiếp tục ứng tuyển các công việc phù hợp khác.`,
    messageEn: `Your CV for the ${safeJobTitle} position at ${safeCompanyName} was not accepted. You can update your profile and apply for other suitable jobs.`,
    recipientId: candidateId,
    recipientRole: 'candidate',
    senderId: employerId || 'employer',
    senderName: safeCompanyName,
    data: {
      jobId: jobId || null,
      jobTitle: safeJobTitle,
      companyName: safeCompanyName,
      employerId: employerId || null,
      isQuickJob: false
    },
    icon: 'x-circle',
    color: '#ef4444',
    actionUrl: '/candidate/jobs',
    actionText: 'Tìm việc làm khác',
    actionTextEn: 'Browse other jobs'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when a new chat message is sent
 * @param {object} payload - { recipientId, recipientRole, senderId, senderName, messageText, applicationId, jobTitle }
 */
export const createChatMessageNotification = async (payload) => {
  const {
    recipientId,
    recipientRole,
    senderId,
    senderName,
    messageText,
    applicationId,
    jobTitle
  } = payload;

  if (!recipientId || !recipientRole) {
    console.error('❌ recipientId and recipientRole are required for chat notification');
    return null;
  }

  const notification = {
    type: 'chat_message',
    title: recipientRole === 'employer' ? 'Tin nhắn mới từ ứng viên' : 'Tin nhắn mới từ nhà tuyển dụng',
    titleEn: recipientRole === 'employer' ? 'New message from candidate' : 'New message from employer',
    message: `${senderName}: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`,
    messageEn: `${senderName}: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`,
    recipientId,
    recipientRole,
    senderId,
    senderName,
    data: {
      applicationId,
      jobTitle,
      messageText: messageText.substring(0, 100)
    },
    icon: 'message-square',
    color: '#3b82f6',
    actionUrl: recipientRole === 'employer' ? '/employer/quick-jobs' : '/candidate/jobs?tab=shift',
    actionText: 'Xem tin nhắn',
    actionTextEn: 'View message'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when admin approves a job post (employer notification)
 * @param {string} employerId
 * @param {object} job - job data (title, companyName, jobId)
 */
export const createJobApprovedNotification = async (employerId, job) => {
  if (!employerId) {
    const error = new Error('employerId is required');
    console.error(error);
    throw error;
  }

  const notification = {
    type: 'job_approved',
    title: 'Bài đăng đã được phê duyệt',
    titleEn: 'Job post approved',
    message: `${job.companyName || job.employer || 'Nhà tuyển dụng'}: Bài "${job.title || 'công việc'}" đã được duyệt và đang hiển thị.`,
    messageEn: `Your job "${job.title || 'job post'}" has been approved and is now visible.`,
    recipientId: employerId,
    recipientRole: 'employer',
    senderId: 'admin',
    senderName: 'Admin',
    data: {
      jobId: job.id || job.jobID || job.idJob || null,
      title: job.title || '',
      companyName: job.companyName || job.employer || ''
    },
    icon: 'check-circle',
    color: '#10b981',
    actionUrl: '/employer/quick-jobs',
    actionText: 'Xem bài',
    actionTextEn: 'View post'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when admin rejects a job post (employer notification)
 * @param {string} employerId
 * @param {object} job - job data (title, companyName, jobId)
 */
export const createJobRejectedNotification = async (employerId, job) => {
  if (!employerId) {
    const error = new Error('employerId is required');
    console.error(error);
    throw error;
  }

  const notification = {
    type: 'job_rejected',
    title: 'Bài đăng đã bị từ chối',
    titleEn: 'Job post rejected',
    message: `${job.companyName || job.employer || 'Nhà tuyển dụng'}: Bài "${job.title || 'công việc'}" đã bị từ chối bởi admin.`,
    messageEn: `Your job "${job.title || 'job post'}" has been rejected by admin.`,
    recipientId: employerId,
    recipientRole: 'employer',
    senderId: 'admin',
    senderName: 'Admin',
    data: {
      jobId: job.id || job.jobID || job.idJob || null,
      title: job.title || '',
      companyName: job.companyName || job.employer || ''
    },
    icon: 'alert-circle',
    color: '#ef4444',
    actionUrl: '/employer/quick-jobs',
    actionText: 'Xem bài',
    actionTextEn: 'View post'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when employer requests quick jobs activation
 * @param {object} payload - { employerId, companyName }
 */
export const createQuickJobActivationRequestNotification = async (payload) => {
  const { employerId, companyName } = payload;
  if (!employerId) {
    throw new Error('employerId is required');
  }

  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  const notification = {
    type: 'quick_job_activation_request',
    title: 'Yêu cầu kích hoạt Công việc tuyển gấp',
    titleEn: 'Quick Jobs Activation Request',
    message: `Nhà tuyển dụng "${safeCompanyName}" đã gửi yêu cầu kích hoạt tính năng Công việc tuyển gấp.`,
    messageEn: `Employer "${safeCompanyName}" has requested activation for Quick Jobs.`,
    recipientId: 'admin',
    recipientRole: 'admin',
    senderId: employerId,
    senderName: safeCompanyName,
    data: {
      employerId,
      companyName: safeCompanyName
    },
    icon: 'zap',
    color: '#f59e0b',
    actionUrl: '/admin/employers',
    actionText: 'Xem chi tiết',
    actionTextEn: 'View details'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when admin approves quick jobs activation
 * @param {string} employerId
 * @param {string} companyName
 */
export const createQuickJobActivationApprovedNotification = async (employerId, companyName) => {
  if (!employerId) {
    throw new Error('employerId is required');
  }

  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  const notification = {
    type: 'quick_job_activation_approved',
    title: 'Đã kích hoạt Công việc tuyển gấp',
    titleEn: 'Quick Jobs Activated',
    message: `Chúc mừng! Tài khoản của bạn đã được Admin kích hoạt tính năng đăng tuyển Công việc tuyển gấp.`,
    messageEn: `Congratulations! Your account has been activated for Quick Jobs postings by Admin.`,
    recipientId: employerId,
    recipientRole: 'employer',
    senderId: 'admin',
    senderName: 'Admin',
    data: {
      employerId,
      companyName: safeCompanyName
    },
    icon: 'check-circle',
    color: '#10b981',
    actionUrl: '/employer/quick-jobs',
    actionText: 'Bắt đầu sử dụng',
    actionTextEn: 'Get started'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when admin rejects quick jobs activation
 * @param {string} employerId
 * @param {string} companyName
 */
export const createQuickJobActivationRejectedNotification = async (employerId, companyName) => {
  if (!employerId) {
    throw new Error('employerId is required');
  }

  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  const notification = {
    type: 'quick_job_activation_rejected',
    title: 'Từ chối kích hoạt Công việc tuyển gấp',
    titleEn: 'Quick Jobs Activation Rejected',
    message: `Yêu cầu kích hoạt tính năng tuyển gấp của bạn chưa được duyệt. Vui lòng kiểm tra lại hồ sơ doanh nghiệp hoặc liên hệ hỗ trợ.`,
    messageEn: `Your request to activate the Quick Jobs feature was not approved. Please check your company profile or contact support.`,
    recipientId: employerId,
    recipientRole: 'employer',
    senderId: 'admin',
    senderName: 'Admin',
    data: {
      employerId,
      companyName: safeCompanyName
    },
    icon: 'x-circle',
    color: '#ef4444',
    actionUrl: '/employer/quick-jobs',
    actionText: 'Xem chi tiết',
    actionTextEn: 'View details'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when admin deactivates quick jobs
 * @param {string} employerId
 * @param {string} companyName
 */
export const createQuickJobActivationDeactivatedNotification = async (employerId, companyName) => {
  if (!employerId) {
    throw new Error('employerId is required');
  }

  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  const notification = {
    type: 'quick_job_activation_deactivated',
    title: 'Hủy kích hoạt Công việc tuyển gấp',
    titleEn: 'Quick Jobs Deactivated',
    message: `Tính năng Công việc tuyển gấp của bạn đã bị hủy kích hoạt bởi Admin.`,
    messageEn: `Your Quick Jobs feature has been deactivated by Admin.`,
    recipientId: employerId,
    recipientRole: 'employer',
    senderId: 'admin',
    senderName: 'Admin',
    data: {
      employerId,
      companyName: safeCompanyName
    },
    icon: 'x-circle',
    color: '#ef4444',
    actionUrl: '/employer/quick-jobs',
    actionText: 'Xem chi tiết',
    actionTextEn: 'View details'
  };

  return await saveNotification(notification);
};

/**
 * Notify admin when a candidate submits a quick job verification request
 * @param {string} candidateId - Cognito userId của ứng viên
 * @param {string} candidateName - Tên ứng viên
 */
export const createCandidateVerificationRequestNotification = async (candidateId, candidateName) => {
  if (!candidateId) throw new Error('candidateId is required');

  const safeName = candidateName || 'Ứng viên';

  const notification = {
    type: 'candidate_verification_request',
    title: 'Yêu cầu duyệt hồ sơ Tuyển Gấp',
    titleEn: 'Quick Job Profile Verification Request',
    message: `Ứng viên "${safeName}" đã gửi yêu cầu xét duyệt hồ sơ Tuyển Gấp. Vui lòng kiểm tra và phê duyệt.`,
    messageEn: `Candidate "${safeName}" has submitted a Quick Job profile verification request. Please review and approve.`,
    recipientId: 'admin',
    recipientRole: 'admin',
    senderId: candidateId,
    senderName: safeName,
    data: { candidateId, candidateName: safeName },
    icon: 'user-check',
    color: '#8b5cf6',
    actionUrl: '/admin/candidates',
    actionText: 'Xem hồ sơ',
    actionTextEn: 'View Profile'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when candidate's CV passes AI screening round 1
 * @param {object} payload - { candidateId, jobTitle, companyName, jobId, score }
 */
export const createCandidateAiScreeningPassedNotification = async (payload) => {
  const { candidateId, jobTitle, companyName, jobId, score } = payload;

  if (!candidateId) {
    console.error('❌ candidateId is required for AI screening notification');
    return null;
  }

  const safeJobTitle = jobTitle || 'công việc';
  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  const notification = {
    type: 'success',
    title: 'CV của bạn đã được duyệt vòng 1',
    titleEn: 'Your CV passed Round 1 screening',
    message: `CV của bạn cho vị trí ${safeJobTitle} tại ${safeCompanyName} đã được duyệt. Tiếp tục hoàn thành phỏng vấn với AI để hoàn tất ứng tuyển.`,
    messageEn: `Your CV for the ${safeJobTitle} position at ${safeCompanyName} has been approved. Complete the AI interview to finalize your application.`,
    recipientId: candidateId,
    recipientRole: 'candidate',
    senderId: 'system',
    senderName: 'Hệ thống AI',
    data: {
      jobId: jobId || null,
      jobTitle: safeJobTitle,
      companyName: safeCompanyName,
      score: score || null,
      stage: 'round1_passed'
    },
    icon: 'check-circle',
    color: '#10b981',
    actionUrl: '/candidate/jobs',
    actionText: 'Xem việc làm',
    actionTextEn: 'View jobs'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when candidate's application is submitted successfully
 * @param {object} payload - { candidateId, jobTitle, companyName, jobId, isQuickJob }
 */
export const createCandidateApplicationSubmittedNotification = async (payload) => {
  const { candidateId, jobTitle, companyName, jobId, isQuickJob } = payload;

  if (!candidateId) {
    console.error('❌ candidateId is required for application submitted notification');
    return null;
  }

  const safeJobTitle = jobTitle || 'công việc';
  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  const notification = {
    type: 'system',
    title: 'Ứng tuyển thành công',
    titleEn: 'Application submitted successfully',
    message: `Bạn đã ứng tuyển thành công vào vị trí ${safeJobTitle} tại ${safeCompanyName}. Nhà tuyển dụng sẽ xem xét hồ sơ của bạn sớm nhất có thể.`,
    messageEn: `You have successfully applied for the ${safeJobTitle} position at ${safeCompanyName}. The employer will review your profile as soon as possible.`,
    recipientId: candidateId,
    recipientRole: 'candidate',
    senderId: 'system',
    senderName: 'Ốp Pờ',
    data: {
      jobId: jobId || null,
      jobTitle: safeJobTitle,
      companyName: safeCompanyName,
      isQuickJob: !!isQuickJob
    },
    icon: 'briefcase',
    color: '#3b82f6',
    actionUrl: isQuickJob ? '/candidate/jobs?tab=shift' : '/candidate/jobs?tab=standard',
    actionText: 'Xem việc đã ứng tuyển',
    actionTextEn: 'View applied jobs'
  };

  return await saveNotification(notification);
};

/**
 * Notify candidate when admin approves, rejects, or deactivates their quick job verification
 * @param {string} candidateId - Cognito userId của ứng viên
 * @param {string} candidateName - Tên ứng viên
 * @param {'approved'|'rejected'|'deactivated'} status
 */
export const createCandidateQuickJobVerifNotification = async (candidateId, candidateName, status) => {
  if (!candidateId) throw new Error('candidateId is required');

  const isApproved = status === 'approved';
  const isDeactivated = status === 'deactivated';
  const safeName = candidateName || 'Ứng viên';

  let type, title, titleEn, message, messageEn, icon, color, actionUrl, actionText, actionTextEn;

  if (isApproved) {
    type = 'success';
    title = 'Hồ sơ Tuyển Gấp đã được duyệt';
    titleEn = 'Quick Job Profile Approved';
    message = `Chúc mừng ${safeName}! Hồ sơ của bạn đã được Admin xét duyệt thành công. Bạn có thể bắt đầu nhận việc làm tuyển gấp ngay bây giờ.`;
    messageEn = `Congratulations ${safeName}! Your profile has been approved by Admin. You can now start receiving Quick Job offers.`;
    icon = 'check-circle';
    color = '#10b981';
    actionUrl = '/candidate/jobs?tab=shift';
    actionText = 'Xem việc làm tuyển gấp';
    actionTextEn = 'View jobs';
  } else if (isDeactivated) {
    type = 'system';
    title = 'Tài khoản Tuyển Gấp bị hủy kích hoạt';
    titleEn = 'Quick Job Access Deactivated';
    message = `Tài khoản của bạn đã bị hủy kích hoạt. Bạn sẽ không nhận được việc làm tuyển gấp cho đến khi được kích hoạt lại. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.`;
    messageEn = `Your Quick Job access has been deactivated by Admin. You will not receive Quick Job offers until reactivated. Please contact support for more information.`;
    icon = 'x-circle';
    color = '#f59e0b';
    actionUrl = '/candidate/profile';
    actionText = 'Liên hệ hỗ trợ';
    actionTextEn = 'Contact support';
  } else {
    // rejected
    type = 'system';
    title = 'Hồ sơ Tuyển Gấp chưa được duyệt';
    titleEn = 'Quick Job Profile Not Approved';
    message = `Hồ sơ Tuyển Gấp của bạn chưa đáp ứng yêu cầu xét duyệt. Vui lòng cập nhật đầy đủ thông tin cá nhân và hoàn thành eKYC để được xét duyệt lại.`;
    messageEn = `Your Quick Job profile did not meet the review requirements. Please complete your personal information and eKYC to reapply.`;
    icon = 'alert-circle';
    color = '#ef4444';
    actionUrl = '/candidate/profile';
    actionText = 'Cập nhật hồ sơ';
    actionTextEn = 'Update profile';
  }

  const notification = {
    type,
    title,
    titleEn,
    message,
    messageEn,
    recipientId: candidateId,
    recipientRole: 'candidate',
    senderId: 'admin',
    senderName: 'Admin Ốp Pờ',
    data: { status, candidateId, candidateName: safeName },
    icon,
    color,
    actionUrl,
    actionText,
    actionTextEn
  };

  return await saveNotification(notification);
};

/**
 * Save a notification via the API
 * @param {object} notification - Notification data
 */
const saveNotification = async (notification) => {
  try {
    console.log('💾 Saving notification to API...');
    console.log('API Endpoint:', API_ENDPOINT);
    console.log('API Endpoint type:', typeof API_ENDPOINT);
    console.log('API Endpoint value:', API_ENDPOINT ? 'EXISTS' : 'UNDEFINED');

    if (!API_ENDPOINT) {
      const error = new Error('❌ CRITICAL: API_ENDPOINT is undefined! Check .env file.');
      console.error(error);
      throw error;
    }

    // Ensure all string fields are properly encoded
    // IMPORTANT: Do NOT send createdAt - let Lambda generate it automatically with current timestamp
    const notificationToSend = {
      type: notification.type,
      title: notification.title || '',
      titleEn: notification.titleEn || notification.title || '',
      message: notification.message || '',
      messageEn: notification.messageEn || notification.message || '',
      recipientId: notification.recipientId || '',
      recipientRole: notification.recipientRole || '',
      senderId: notification.senderId || 'system',
      senderName: notification.senderName || 'System',
      data: notification.data || {},
      icon: notification.icon || 'bell',
      color: notification.color || '#3b82f6',
      actionUrl: notification.actionUrl || '',
      actionText: notification.actionText || '',
      actionTextEn: notification.actionTextEn || ''
      // createdAt will be auto-generated by Lambda with current timestamp
    };

    console.log('🔍 DEBUG: Notification payload to send (should NOT have createdAt):');
    console.log(JSON.stringify(notificationToSend, null, 2));
    console.log('⚠️ If you see "createdAt" above, the code is wrong!');

    console.log('Notification object to send:', notificationToSend);
    console.log('Stringifying notification with UTF-8...');
    const notificationJson = JSON.stringify(notificationToSend);
    console.log('Notification JSON length:', notificationJson.length, 'bytes');
    console.log('Notification JSON preview:', notificationJson.substring(0, 200) + '...');

    const url = `${API_ENDPOINT}/notifications`;
    console.log('🌐 Full URL:', url);
    console.log('📤 Making POST request with UTF-8 encoding...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json'
      },
      body: notificationJson
    });

    console.log('✅ Response received!');
    console.log('API Response status:', response.status);
    console.log('API Response statusText:', response.statusText);
    console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('API Response text length:', responseText.length);
    console.log('API Response text:', responseText);

    if (!response.ok) {
      const errorMsg = `Failed to save notification: ${response.status} ${response.statusText} - ${responseText}`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse response JSON:', parseError);
      console.error('Response text was:', responseText);
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    }

    console.log('✅ Notification saved successfully!');
    console.log('Response data:', data);

    if (data.success && data.data) {
      console.log('✅ Notification ID:', data.data.notificationId);
      console.log('✅ Recipient:', data.data.recipientId, '/', data.data.recipientRole);
      console.log('✅ Title:', data.data.title);
      console.log('✅ Message:', data.data.message);
      console.log('⏰ CreatedAt from Lambda (UTC):', data.data.createdAt);

      // Parse timestamp
      const createdAt = new Date(data.data.createdAt);
      console.log('⏰ CreatedAt (Vietnam time):', createdAt.toLocaleString('vi-VN'));
      console.log('');
      console.log('🎯 TO VERIFY THIS NOTIFICATION:');
      console.log(`   1. Go to notifications page`);
      console.log(`   2. Find notification with ID: ${data.data.notificationId}`);
      console.log(`   3. It should show "Vừa xong" or "X giây trước"`);
      console.log('');
      console.log('⚠️ NOTE: Do NOT look at old notifications - they will show old timestamps!');
    }

    return data;
  } catch (error) {
    console.error('❌ Error saving notification:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Re-throw to let caller handle it
    throw error;
  }
};

/**
 * Notify admin when employer submits a withdrawal request
 */
export const createWithdrawalRequestNotification = async ({ employerId, companyName, amount, bankName, accountNumber, accountName }) => {
  const notification = {
    type: 'withdrawal_request',
    title: 'Yêu cầu rút tiền mới',
    titleEn: 'New Withdrawal Request',
    message: `${companyName || employerId} đã gửi yêu cầu rút ${Number(amount).toLocaleString('vi-VN')} VND về tài khoản ${bankName} - ${accountNumber} (${accountName}).`,
    messageEn: `${companyName || employerId} has submitted a withdrawal request for ${Number(amount).toLocaleString('vi-VN')} VND to ${bankName} - ${accountNumber} (${accountName}).`,
    recipientId: 'admin',
    recipientRole: 'admin',
    senderId: employerId,
    senderName: companyName || employerId,
    data: { employerId, companyName, amount, bankName, accountNumber, accountName },
    icon: 'banknote',
    color: '#f59e0b',
    actionUrl: '/admin/employers',
    actionText: 'Xem yêu cầu',
    actionTextEn: 'View Request'
  };
  return await saveNotification(notification);
};

/**
 * Notify employer when their withdrawal request is approved
 */
export const createWithdrawalApprovedNotification = async ({ employerId, amount, bankName, accountNumber }) => {
  const notification = {
    type: 'withdrawal_approved',
    title: 'Yêu cầu rút tiền đã được duyệt',
    titleEn: 'Withdrawal Request Approved',
    message: `Yêu cầu rút ${Number(amount).toLocaleString('vi-VN')} VND của bạn đã được admin phê duyệt. Tiền sẽ được chuyển vào tài khoản ${bankName} - ${accountNumber} trong vòng 1-3 ngày làm việc.`,
    messageEn: `Your withdrawal request of ${Number(amount).toLocaleString('vi-VN')} VND has been approved. Funds will be transferred to ${bankName} - ${accountNumber} within 1-3 business days.`,
    recipientId: employerId,
    recipientRole: 'employer',
    senderId: 'admin',
    senderName: 'Admin',
    data: { amount, bankName, accountNumber },
    icon: 'check-circle',
    color: '#10b981',
    actionUrl: '/employer/wallet',
    actionText: 'Xem ví của tôi',
    actionTextEn: 'View My Wallet'
  };
  return await saveNotification(notification);
};

/**
 * Notify employer when their withdrawal request is rejected
 */
export const createWithdrawalRejectedNotification = async ({ employerId, amount, bankName, accountNumber, reason }) => {
  const notification = {
    type: 'withdrawal_rejected',
    title: 'Yêu cầu rút tiền bị từ chối',
    titleEn: 'Withdrawal Request Rejected',
    message: `Yêu cầu rút ${Number(amount).toLocaleString('vi-VN')} VND của bạn đã bị từ chối${reason ? `: ${reason}` : ''}. Số dư đã được hoàn lại vào ví của bạn. Vui lòng liên hệ admin để biết thêm chi tiết.`,
    messageEn: `Your withdrawal request of ${Number(amount).toLocaleString('vi-VN')} VND has been rejected${reason ? `: ${reason}` : ''}. The amount has been returned to your wallet.`,
    recipientId: employerId,
    recipientRole: 'employer',
    senderId: 'admin',
    senderName: 'Admin',
    data: { amount, bankName, accountNumber, reason },
    icon: 'x-circle',
    color: '#ef4444',
    actionUrl: '/employer/wallet',
    actionText: 'Xem ví của tôi',
    actionTextEn: 'View My Wallet'
  };
  return await saveNotification(notification);
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/notifications/${notificationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ read: true })
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId, role) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ recipientId: userId, recipientRole: role })
    });

    if (!response.ok) {
      throw new Error('Failed to mark all as read');
    }

    return true;
  } catch (error) {
    console.error('Error marking all as read:', error);
    return false;
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/notifications/${notificationId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }

    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

/**
 * Soft delete/restore a notification (inactive flag)
 */
export const setNotificationDeleted = async (notificationId, deleted) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/notifications/${notificationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ deleted: !!deleted })
    });

    if (!response.ok) {
      throw new Error('Failed to update notification deleted status');
    }

    return true;
  } catch (error) {
    console.error('Error updating notification deleted status:', error);
    return false;
  }
};

/**
 * Clear all notifications for a user
 */
export const clearAllNotifications = async (userId, role) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/notifications/clear-all`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ recipientId: userId, recipientRole: role })
    });

    if (!response.ok) {
      throw new Error('Failed to clear notifications');
    }

    return true;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return false;
  }
};

/**
 * Create notification when candidate requests withdrawal
 * @param {object} request - Withdrawal request details
 */
export const createCandidateWithdrawalRequestNotification = async (request) => {
  const notification = {
    type: 'candidate_withdrawal_request',
    title: 'Yêu cầu rút tiền từ ứng viên',
    titleEn: 'New Candidate Withdrawal Request',
    message: `${request.companyName} yêu cầu rút số tiền ${request.amount.toLocaleString('vi-VN')} VND về ngân hàng ${request.bankName}.`,
    messageEn: `${request.companyName} requested to withdraw ${request.amount.toLocaleString('vi-VN')} VND to bank ${request.bankName}.`,
    recipientId: 'admin',
    recipientRole: 'admin',
    senderId: request.employerId || 'candidate',
    senderName: request.companyName,
    data: {
      withdrawalId: request.id,
      amount: request.amount,
      bankName: request.bankName,
      accountNumber: request.accountNumber,
      accountName: request.accountName,
      candidateId: request.employerId || 'candidate'
    },
    icon: 'dollar-sign',
    color: '#3b82f6',
    actionUrl: '/admin/candidates',
    actionText: 'Xem chi tiết',
    actionTextEn: 'View Details'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when admin updates candidate withdrawal status
 * @param {object} request - Withdrawal request details
 * @param {string} status - 'approved' or 'rejected'
 */
export const createCandidateWithdrawalStatusNotification = async (request, status) => {
  const isApproved = status === 'approved';
  const notification = {
    type: isApproved ? 'success' : 'system',
    title: isApproved ? 'Yêu cầu rút tiền được phê duyệt' : 'Yêu cầu rút tiền bị từ chối',
    titleEn: isApproved ? 'Withdrawal Request Approved' : 'Withdrawal Request Rejected',
    message: isApproved
      ? `Yêu cầu rút số tiền ${request.amount.toLocaleString('vi-VN')} VND về ngân hàng ${request.bankName} đã được duyệt.`
      : `Yêu cầu rút số tiền ${request.amount.toLocaleString('vi-VN')} VND về ngân hàng ${request.bankName} đã bị từ chối.`,
    messageEn: isApproved
      ? `Your withdrawal request of ${request.amount.toLocaleString('vi-VN')} VND to ${request.bankName} has been approved.`
      : `Your withdrawal request of ${request.amount.toLocaleString('vi-VN')} VND to ${request.bankName} has been rejected.`,
    recipientId: request.employerId || 'candidate',
    recipientRole: 'candidate',
    senderId: 'admin',
    senderName: 'Admin',
    data: {
      withdrawalId: request.id,
      amount: request.amount,
      bankName: request.bankName,
      status: status
    },
    icon: isApproved ? 'check-circle' : 'alert-circle',
    color: isApproved ? '#10b981' : '#ef4444',
    actionUrl: '/candidate/wallet',
    actionText: 'Xem ví',
    actionTextEn: 'View Wallet'
  };

  return await saveNotification(notification);
};

/**
 * Notify employer when their change request is approved
 */
export const createChangeRequestApprovedNotification = async ({ employerId, companyName, candidateName, changeRequestType, applicationId }) => {
  const safeCompanyName = companyName || 'Nhà tuyển dụng';
  const typeText = changeRequestType || 'thay đổi nhân sự';
  const notification = {
    type: 'change_request_approved',
    title: 'Yêu cầu thay đổi nhân sự đã được duyệt',
    titleEn: 'Personnel Change Request Approved',
    message: `Yêu cầu thay đổi cho ứng viên "${candidateName || 'N/A'}" (${typeText}) của ${safeCompanyName} đã được admin phê duyệt thành công.`,
    messageEn: `Your personnel change request for candidate "${candidateName || 'N/A'}" (${typeText}) has been approved by admin.`,
    recipientId: employerId,
    recipientRole: 'employer',
    senderId: 'admin',
    senderName: 'Admin',
    data: { employerId, companyName: safeCompanyName, candidateName, changeRequestType, applicationId },
    icon: 'check-circle',
    color: '#10b981',
    actionUrl: '/employer/quick-jobs',
    actionText: 'Xem danh sách',
    actionTextEn: 'View List'
  };
  return await saveNotification(notification);
};

/**
 * Notify employer when their change request is rejected
 */
export const createChangeRequestRejectedNotification = async ({ employerId, companyName, candidateName, changeRequestType, applicationId, reason }) => {
  const safeCompanyName = companyName || 'Nhà tuyển dụng';
  const typeText = changeRequestType || 'thay đổi nhân sự';
  const notification = {
    type: 'change_request_rejected',
    title: 'Yêu cầu thay đổi nhân sự bị từ chối',
    titleEn: 'Personnel Change Request Rejected',
    message: `Yêu cầu thay đổi cho ứng viên "${candidateName || 'N/A'}" (${typeText}) của ${safeCompanyName} đã bị admin từ chối${reason ? `: ${reason}` : ''}.`,
    messageEn: `Your personnel change request for candidate "${candidateName || 'N/A'}" (${typeText}) has been rejected by admin.`,
    recipientId: employerId,
    recipientRole: 'employer',
    senderId: 'admin',
    senderName: 'Admin',
    data: { employerId, companyName: safeCompanyName, candidateName, changeRequestType, applicationId, reason },
    icon: 'x-circle',
    color: '#ef4444',
    actionUrl: '/employer/quick-jobs',
    actionText: 'Xem danh sách',
    actionTextEn: 'View List'
  };
  return await saveNotification(notification);
};

export default {
  getAllNotifications,
  getNotifications,
  getUnreadCount,
  createPackagePurchaseRequestNotification,
  createPackageApprovedNotification,
  createWithdrawalRequestNotification,
  createWithdrawalApprovedNotification,
  createWithdrawalRejectedNotification,
  createEmployerApplicationNotification,
  createEmployerAiInterviewCompletedNotification,
  createCandidateCvAcceptedNotification,
  createCandidateCvRejectedNotification,
  createJobApprovedNotification,
  createJobRejectedNotification,
  createChatMessageNotification,
  createQuickJobActivationRequestNotification,
  createQuickJobActivationApprovedNotification,
  createQuickJobActivationRejectedNotification,
  createQuickJobActivationDeactivatedNotification,
  createCandidateVerificationRequestNotification,
  createCandidateQuickJobVerifNotification,
  createCandidateWithdrawalRequestNotification,
  createCandidateWithdrawalStatusNotification,
  createCandidateAiScreeningPassedNotification,
  createCandidateApplicationSubmittedNotification,
  createChangeRequestApprovedNotification,
  createChangeRequestRejectedNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  setNotificationDeleted,
  clearAllNotifications
};

/**
 * Notify candidate when employer submits a review/rating for them
 * @param {object} payload - { candidateId, candidateName, employerId, companyName, jobTitle, rating, comment }
 */
export const createEmployerReviewNotification = async (payload) => {
  const {
    candidateId,
    candidateName,
    employerId,
    companyName,
    jobTitle,
    rating,
    comment
  } = payload;

  if (!candidateId) {
    console.error('❌ candidateId is required for employer review notification');
    return null;
  }

  const safeCandidateName = candidateName || 'Ứng viên';
  const safeCompanyName = companyName || 'Nhà tuyển dụng';
  const safeJobTitle = jobTitle || 'công việc';
  const safeRating = Number(rating) || 0;

  const stars = '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);

  const notification = {
    type: 'employer_review',
    title: 'Bạn đã nhận được đánh giá mới',
    titleEn: 'You received a new review',
    message: `${safeCompanyName} đã đánh giá bạn ${stars} (${safeRating}/5) cho công việc "${safeJobTitle}".${comment ? ` Nhận xét: "${comment}"` : ''}`,
    messageEn: `${safeCompanyName} rated you ${stars} (${safeRating}/5) for "${safeJobTitle}".${comment ? ` Comment: "${comment}"` : ''}`,
    recipientId: candidateId,
    recipientRole: 'candidate',
    senderId: employerId || 'employer',
    senderName: safeCompanyName,
    data: {
      employerId: employerId || null,
      companyName: safeCompanyName,
      jobTitle: safeJobTitle,
      rating: safeRating,
      comment: comment || '',
      candidateId,
      candidateName: safeCandidateName
    },
    icon: 'star',
    color: '#F59E0B',
    actionUrl: '/candidate/profile',
    actionText: 'Xem hồ sơ của bạn',
    actionTextEn: 'View your profile'
  };

  return await saveNotification(notification);
};
