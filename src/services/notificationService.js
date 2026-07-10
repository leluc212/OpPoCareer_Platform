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
    title: 'Bạn đã nhận được ca gấp',
    titleEn: 'You got the urgent shift',
    message: `Hồ sơ của bạn đã được ${safeCompanyName} duyệt. Liên hệ với NTD qua bong bóng chat ở góc phải màn hình để biết thông tin chi tiết và nhận ca ngay!`,
    messageEn: `Your profile has been approved by ${safeCompanyName}. Contact the employer via the chat bubble on the right side of the screen for details and to confirm your shift!`,
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
    title: 'Hồ sơ ca gấp chưa được thông qua',
    titleEn: 'Quick shift application not approved',
    message: `${safeCompanyName} đã xem xét nhưng CV của bạn chưa phù hợp cho ca gấp này. Vẫn còn rất nhiều công việc phù hợp khác đang chờ bạn ứng tuyển!`,
    messageEn: `${safeCompanyName} has reviewed your application but your CV wasn't the right fit for this shift. There are still many other suitable jobs waiting for you!`,
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
 * Create notification when employer approves candidate CV for a standard job.
 * Trigger: NTD bấm "Duyệt"/"Đồng ý" trên CV đã qua vòng AI.
 * Kèm theo: ứng viên có 2 ngày để thực hiện phỏng vấn AI.
 * @param {object} payload - Candidate notification data
 */
export const createCandidateCvApprovedNotification = async (payload) => {
  const {
    candidateId,
    jobTitle,
    companyName,
    jobId,
    applicationId,
    employerId,
    isAiScreeningEnabled
  } = payload;

  if (!candidateId) {
    const error = new Error('❌ CRITICAL: candidateId is required but was not provided!');
    console.error(error);
    throw error;
  }

  const safeJobTitle = jobTitle || 'công việc tiêu chuẩn';
  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  // Tính deadline phỏng vấn AI: now + 2 ngày
  const interviewDeadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

  const hasAi = !!isAiScreeningEnabled;

  const notification = {
    type: 'employer_cv_approved',
    title: hasAi
      ? 'CV của bạn đã được NTD duyệt và tiến hành vòng phỏng vấn'
      : 'CV của bạn đã được NTD duyệt',
    titleEn: hasAi
      ? 'Your CV has been approved — proceed to AI Interview'
      : 'Your CV has been approved by the employer',
    message: hasAi
      ? `CV của bạn cho vị trí ${safeJobTitle} tại ${safeCompanyName} đã được thông qua. Hãy đăng nhập vào hệ thống trong vòng 2 ngày để tiến hành bước phỏng vấn với AI.`
      : `CV của bạn cho vị trí ${safeJobTitle} tại ${safeCompanyName} đã được thông qua. Nhà tuyển dụng sẽ liên hệ với bạn sớm để thông báo các bước tiếp theo.`,
    messageEn: hasAi
      ? `Your CV for the ${safeJobTitle} position at ${safeCompanyName} has been approved. Please log in within 2 days to proceed with the AI interview.`
      : `Your CV for the ${safeJobTitle} position at ${safeCompanyName} has been approved. The employer will contact you soon with next steps.`,
    recipientId: candidateId,
    recipientRole: 'candidate',
    senderId: employerId || 'employer',
    senderName: safeCompanyName,
    data: {
      jobId: jobId || null,
      applicationId: applicationId || null,
      jobTitle: safeJobTitle,
      companyName: safeCompanyName,
      employerId: employerId || null,
      isQuickJob: false,
      interviewDeadline: hasAi ? interviewDeadline : null,
      stage: 'employer_approved'
    },
    icon: 'check-circle',
    color: '#10b981',
    actionUrl: '/candidate/jobs?tab=standard',
    actionText: hasAi ? 'Phỏng vấn với AI ngay' : 'Xem việc làm của bạn',
    actionTextEn: hasAi ? 'Start AI Interview' : 'View your applications'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when employer rejects candidate CV for a standard job.
 * Trigger: NTD bấm "Từ chối"/"Không duyệt" trên CV đã qua vòng AI.
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
    type: 'employer_cv_rejected',
    title: 'Hồ sơ chưa được duyệt',
    titleEn: 'Your application was not approved',
    message: `Rất tiếc, CV ứng tuyển vị trí ${safeJobTitle} tại ${safeCompanyName} của bạn chưa phù hợp với tiêu chí của nhà tuyển dụng ở thời điểm hiện tại. Hãy cập nhật thêm kỹ năng và thử sức với các cơ hội khác nhé!`,
    messageEn: `Unfortunately, your CV for the ${safeJobTitle} position at ${safeCompanyName} did not meet the employer's criteria at this time. Update your skills and explore other opportunities!`,
    recipientId: candidateId,
    recipientRole: 'candidate',
    senderId: employerId || 'employer',
    senderName: safeCompanyName,
    data: {
      jobId: jobId || null,
      jobTitle: safeJobTitle,
      companyName: safeCompanyName,
      employerId: employerId || null,
      isQuickJob: false,
      stage: 'employer_rejected'
    },
    icon: 'x-circle',
    color: '#ef4444',
    actionUrl: '/candidate/jobs?tab=standard',
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

  // Determine if it's a quick job. 
  // We prioritize jobSource if available ('standard' vs 'urgent').
  const isQuickJob = job.jobSource === 'urgent' || (job.jobSource !== 'standard' && (job.isQuickJob === true || job.jobType === 'urgent'));

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
      companyName: job.companyName || job.employer || '',
      isQuickJob
    },
    icon: 'check-circle',
    color: '#10b981',
    actionUrl: isQuickJob ? '/employer/quick-jobs' : '/employer/standard-jobs',
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

  const isQuickJob = job.jobSource === 'urgent' || (job.jobSource !== 'standard' && (job.isQuickJob === true || job.jobType === 'urgent'));

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
      companyName: job.companyName || job.employer || '',
      isQuickJob
    },
    icon: 'x-circle',
    color: '#ef4444',
    actionUrl: isQuickJob ? '/employer/quick-jobs' : '/employer/standard-jobs',
    actionText: 'Xem chi tiết',
    actionTextEn: 'View details'
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
 * Trigger: Ngay sau khi AI chấm điểm CV và xác định ĐẠT tiêu chí sơ loại.
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
    type: 'ai_screening_passed',
    title: 'Hồ sơ ứng tuyển đã qua sàng lọc AI',
    titleEn: 'Your CV passed AI screening',
    message: `CV của bạn cho vị trí ${safeJobTitle} tại ${safeCompanyName} đã qua vòng sơ loại AI và đang chờ Nhà tuyển dụng xét duyệt.`,
    messageEn: `Your CV for the ${safeJobTitle} position at ${safeCompanyName} has passed the AI screening and is pending employer review.`,
    recipientId: candidateId,
    recipientRole: 'candidate',
    senderId: 'system',
    senderName: 'Hệ thống AI',
    data: {
      jobId: jobId || null,
      jobTitle: safeJobTitle,
      companyName: safeCompanyName,
      score: score || null,
      stage: 'ai_passed'
    },
    icon: 'check-circle',
    color: '#10b981',
    actionUrl: '/candidate/jobs?tab=standard',
    actionText: 'Xem trạng thái hồ sơ',
    actionTextEn: 'View application status'
  };

  return await saveNotification(notification);
};

/**
 * Create notification when candidate's CV FAILS AI screening round 1
 * Trigger: AI chấm điểm CV và xác định KHÔNG ĐẠT tiêu chí sơ loại.
 * CV dừng lại ở đây — KHÔNG gửi cho NTD.
 * @param {object} payload - { candidateId, jobTitle, companyName, jobId }
 */
export const createCandidateAiScreeningRejectedNotification = async (payload) => {
  const { candidateId, jobTitle, companyName, jobId } = payload;

  if (!candidateId) {
    console.error('❌ candidateId is required for AI screening rejected notification');
    return null;
  }

  const safeJobTitle = jobTitle || 'công việc';
  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  const notification = {
    type: 'ai_screening_rejected',
    title: 'Hồ sơ không qua sàng lọc AI',
    titleEn: 'Your CV did not pass AI screening',
    message: `Rất tiếc, CV ứng tuyển vị trí ${safeJobTitle} tại ${safeCompanyName} của bạn chưa phù hợp ở vòng sơ loại AI. Hãy cập nhật thêm kỹ năng và thử sức với các cơ hội khác nhé!`,
    messageEn: `Unfortunately, your CV for the ${safeJobTitle} position at ${safeCompanyName} did not meet the AI screening criteria. Update your skills and try other opportunities!`,
    recipientId: candidateId,
    recipientRole: 'candidate',
    senderId: 'system',
    senderName: 'Hệ thống AI',
    data: {
      jobId: jobId || null,
      jobTitle: safeJobTitle,
      companyName: safeCompanyName,
      stage: 'ai_rejected'
    },
    icon: 'alert-circle',
    color: '#ef4444',
    actionUrl: '/candidate/jobs?tab=standard',
    actionText: 'Xem việc làm khác',
    actionTextEn: 'Browse other jobs'
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
    data: { status, candidateId, candidateName: safeName, isQuickJob: true },
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
 * Notify admin when an employer submits a new job post pending approval
 */
export const createJobPendingApprovalNotification = async ({ employerId, companyName, jobTitle, jobId, isQuickJob }) => {
  const notification = {
    type: 'job_pending_approval',
    title: isQuickJob ? 'Yêu cầu duyệt tin tuyển gấp mới' : 'Yêu cầu duyệt tin tuyển dụng mới',
    titleEn: isQuickJob ? 'New Urgent Job pending approval' : 'New Job post pending approval',
    message: `Nhà tuyển dụng "${companyName || employerId}" đã đăng tin mới: "${jobTitle}". Vui lòng kiểm tra và phê duyệt.`,
    messageEn: `Employer "${companyName || employerId}" has posted a new job: "${jobTitle}". Please review and approve.`,
    recipientId: 'admin',
    recipientRole: 'admin',
    senderId: employerId,
    senderName: companyName || employerId,
    data: { employerId, companyName, jobTitle, jobId, isQuickJob: !!isQuickJob },
    icon: 'briefcase',
    color: '#2563eb',
    actionUrl: isQuickJob ? '/admin/employers' : '/admin/posts',
    actionText: 'Xem tin tuyển dụng',
    actionTextEn: 'View Job Post'
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
    const response = await fetch(`${API_ENDPOINT}/notifications/mark-all-read/${userId}?role=${role}`, {
      method: 'PUT'
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
  if (!employerId) return null;
  const safeCompanyName = companyName || 'Nhà tuyển dụng';
  const notification = {
    type: 'change_request_approved',
    title: 'Yêu cầu thay đổi nhân viên đã được chấp nhận',
    titleEn: 'Staff Change Request Approved',
    message: 'Yêu cầu thay đổi nhân viên của bạn đã được chấp nhận.',
    messageEn: 'Your staff change request has been approved.',
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
 * Notify old worker when their shift is cancelled due to employer cancellation request
 * @param {{ workerId, jobLocation, workDateDisplay, jobTitle, reasonType, reasonDetail }} payload
 */
export const createWorkerReplacedNotification = async ({ workerId, jobLocation, workDateDisplay, jobTitle, reasonType, reasonDetail }) => {
  if (!workerId) return null;
  const safeLocation = jobLocation || 'địa điểm làm việc';
  const safeDate = workDateDisplay || 'ngày làm việc';
  const reasonStr = reasonType
    ? (reasonDetail ? `${reasonType} - ${reasonDetail}` : reasonType)
    : '';
  const notification = {
    type: 'worker_replaced_shift_cancelled',
    title: 'Thông báo hủy ca làm',
    titleEn: 'Shift cancellation notice',
    message: `Rất tiếc, ca làm của bạn tại ${safeLocation} vào ${safeDate} đã bị hủy.${reasonStr ? ` Lý do: ${reasonStr}.` : ''}`,
    messageEn: `We're sorry, your shift at ${safeLocation} on ${safeDate} has been cancelled.${reasonStr ? ` Reason: ${reasonStr}.` : ''}`,
    recipientId: workerId,
    recipientRole: 'candidate',
    senderId: 'admin',
    senderName: 'Admin',
    data: { workerId, jobLocation: safeLocation, workDateDisplay: safeDate, jobTitle, reasonType, reasonDetail },
    icon: 'bell',
    color: '#EF4444',
    actionUrl: '/candidate/applications',
    actionText: 'Xem lịch sử làm việc',
    actionTextEn: 'View work history'
  };
  return await saveNotification(notification);
};

/**
 * Notify new worker when they are assigned to a shift via replacement
 * @param {{ workerId, jobLocation, workDateDisplay, jobShift }} payload
 */
export const createNewWorkerAssignedNotification = async ({ workerId, jobTitle, jobLocation, workDateDisplay, jobShift, originalEndTime }) => {
  if (!workerId) return null;
  const safeLocation = jobLocation || 'địa điểm làm việc';
  const safeDate = workDateDisplay || 'ngày làm việc';
  const safeShift = jobShift || originalEndTime || '';
  const notification = {
    type: 'new_worker_assigned_shift',
    title: 'Bạn có ca làm mới',
    titleEn: 'You have a new shift',
    message: `Bạn có ca làm mới tại ${safeLocation} ngày ${safeDate}${safeShift ? `, ${safeShift}` : ''}.`,
    messageEn: `You have a new shift at ${safeLocation} on ${safeDate}${safeShift ? `, ${safeShift}` : ''}.`,
    recipientId: workerId,
    recipientRole: 'candidate',
    senderId: 'admin',
    senderName: 'Admin',
    data: { workerId, jobTitle, jobLocation: safeLocation, workDateDisplay: safeDate, jobShift: safeShift },
    icon: 'zap',
    color: '#10b981',
    actionUrl: '/candidate/applications',
    actionText: 'Xem ca làm',
    actionTextEn: 'View shift'
  };
  return await saveNotification(notification);
};

/**
 * Notify employer when their shift cancellation request is rejected
 */
export const createChangeRequestRejectedNotification = async ({ employerId, companyName, candidateName, changeRequestType, applicationId, reason }) => {
  if (!employerId) return null;
  const safeCompanyName = companyName || 'Nhà tuyển dụng';
  const notification = {
    type: 'change_request_rejected',
    title: 'Yêu cầu thay đổi nhân viên bị từ chối',
    titleEn: 'Staff Change Request Rejected',
    message: 'Yêu cầu thay đổi nhân viên của bạn đã bị từ chối. Worker hiện tại vẫn tiếp tục ca làm.',
    messageEn: 'Your staff change request has been rejected. The current worker continues the shift.',
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

/**
 * Create notification to Admin when Employer submits a Shift Cancellation Request
 * @param {object} payload - { employerId, companyName, candidateName, changeRequestType, changeRequestReason, applicationId }
 */
export const createChangeRequestSubmittedNotification = async (payload) => {
  const { employerId, companyName, candidateName, changeRequestType, changeRequestReason, applicationId } = payload;
  
  if (!employerId) {
    console.error('❌ employerId is required for change request notification');
    return null;
  }

  const safeCompanyName = companyName || 'Nhà tuyển dụng';
  const safeCandidateName = candidateName || 'nhân viên';

  const notification = {
    type: 'change_request_submitted',
    title: 'Yêu cầu thay đổi nhân viên mới',
    titleEn: 'New staff change request',
    message: `${safeCompanyName} vừa gửi yêu cầu thay đổi nhân viên của ${safeCandidateName}. Lý do: ${changeRequestType}. ${changeRequestReason ? `Chi tiết: ${changeRequestReason}` : ''}`,
    messageEn: `${safeCompanyName} requested a staff change for ${safeCandidateName}. Reason: ${changeRequestType}. ${changeRequestReason ? `Detail: ${changeRequestReason}` : ''}`,
    recipientId: 'admin',
    recipientRole: 'admin',
    senderId: employerId,
    senderName: safeCompanyName,
    data: {
      employerId,
      companyName: safeCompanyName,
      candidateName: safeCandidateName,
      changeRequestType,
      changeRequestReason: changeRequestReason || '',
      applicationId: applicationId || null
    },
    icon: 'circle-x',
    color: '#DC2626',
    actionUrl: '/admin/employers',
    actionText: 'Xem chi tiết',
    actionTextEn: 'View details'
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
  createJobPendingApprovalNotification,
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
  createCandidateAiScreeningRejectedNotification,
  createCandidateApplicationSubmittedNotification,
  createChangeRequestSubmittedNotification,
  createChangeRequestApprovedNotification,
  createChangeRequestRejectedNotification,
  createWorkerReplacedNotification,
  createNewWorkerAssignedNotification,
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

/**
 * Thông báo cho Admin khi NTD gửi yêu cầu chỉnh sửa hồ sơ công ty
 * @param {object} payload - { employerId, companyName }
 */
export const createProfileChangeRequestNotification = async (payload) => {
  const { employerId, companyName } = payload;
  if (!employerId) {
    throw new Error('employerId is required');
  }

  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  const notification = {
    type: 'profile_change_request',
    title: 'Yêu cầu chỉnh sửa hồ sơ công ty',
    titleEn: 'Company Profile Change Request',
    message: `Nhà tuyển dụng "${safeCompanyName}" đã gửi yêu cầu chỉnh sửa hồ sơ công ty. Vui lòng xem xét và phê duyệt.`,
    messageEn: `Employer "${safeCompanyName}" has submitted a company profile change request. Please review and approve.`,
    recipientId: 'admin',
    recipientRole: 'admin',
    senderId: employerId,
    senderName: safeCompanyName,
    data: {
      employerId,
      companyName: safeCompanyName
    },
    icon: 'edit',
    color: '#f59e0b',
    actionUrl: '/admin/employers?tab=profile-changes',
    actionText: 'Xem yêu cầu',
    actionTextEn: 'View request'
  };

  return await saveNotification(notification);
};

/**
 * Thông báo cho NTD khi Admin duyệt yêu cầu chỉnh sửa hồ sơ
 * @param {string} employerId
 * @param {string} companyName
 */
export const createProfileChangeApprovedNotification = async (employerId, companyName) => {
  if (!employerId) {
    throw new Error('employerId is required');
  }

  const safeCompanyName = companyName || 'Nhà tuyển dụng';

  const notification = {
    type: 'profile_change_approved',
    title: 'Hồ sơ công ty đã được cập nhật',
    titleEn: 'Company Profile Updated',
    message: `Yêu cầu chỉnh sửa hồ sơ công ty của bạn đã được Admin duyệt. Thông tin công ty đã được cập nhật.`,
    messageEn: `Your company profile change request has been approved by Admin. Company information has been updated.`,
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
    actionUrl: '/employer/profile',
    actionText: 'Xem hồ sơ',
    actionTextEn: 'View profile'
  };

  return await saveNotification(notification);
};

/**
 * Thông báo cho NTD khi Admin từ chối yêu cầu chỉnh sửa hồ sơ
 * @param {string} employerId
 * @param {string} companyName
 * @param {string} rejectionReason
 */
export const createProfileChangeRejectedNotification = async (employerId, companyName, rejectionReason = '') => {
  if (!employerId) {
    throw new Error('employerId is required');
  }

  const safeCompanyName = companyName || 'Nhà tuyển dụng';
  const reasonText = rejectionReason ? ` Lý do: ${rejectionReason}.` : '';

  const notification = {
    type: 'profile_change_rejected',
    title: 'Yêu cầu chỉnh sửa hồ sơ bị từ chối',
    titleEn: 'Company Profile Change Rejected',
    message: `Yêu cầu chỉnh sửa hồ sơ công ty của bạn đã bị Admin từ chối.${reasonText} Vui lòng kiểm tra lại thông tin và gửi lại.`,
    messageEn: `Your company profile change request has been rejected by Admin.${rejectionReason ? ` Reason: ${rejectionReason}.` : ''} Please review and resubmit.`,
    recipientId: employerId,
    recipientRole: 'employer',
    senderId: 'admin',
    senderName: 'Admin',
    data: {
      employerId,
      companyName: safeCompanyName,
      rejectionReason
    },
    icon: 'x-circle',
    color: '#ef4444',
    actionUrl: '/employer/profile',
    actionText: 'Chỉnh sửa lại',
    actionTextEn: 'Edit again'
  };

  return await saveNotification(notification);
};
