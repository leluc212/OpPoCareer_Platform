const parseNotificationData = (notification) => {
  if (typeof notification?.data !== 'string') return notification?.data || {};
  try {
    return JSON.parse(notification.data);
  } catch {
    return {};
  }
};

const getAdminPath = (actionUrl = '') => {
  try {
    return new URL(actionUrl, 'http://localhost').pathname;
  } catch {
    return String(actionUrl).split('?')[0];
  }
};

export const EMPTY_ADMIN_NOTIFICATION_BADGES = Object.freeze({
  total: 0,
  employers: 0,
  employerQuickJobs: 0,
  employerChangeRequests: 0,
  employerProfileChanges: 0,
  candidates: 0,
  candidateVerifications: 0,
  posts: 0,
  packages: 0,
  wallet: 0,
  walletEmployer: 0,
  walletCandidate: 0,
  reports: 0,
  changeRequests: 0
});

/** Map unread admin notifications to the screen/tab that handles them. */
export const getAdminNotificationBadgeCounts = (notifications = []) => {
  const counts = { ...EMPTY_ADMIN_NOTIFICATION_BADGES };
  const unreadNotifications = (Array.isArray(notifications) ? notifications : [])
    .filter(notification => !notification?.read);

  counts.total = unreadNotifications.length;

  unreadNotifications.forEach(notification => {
    const type = notification.type || '';
    const data = parseNotificationData(notification);
    const path = getAdminPath(notification.actionUrl || '');

    if (type === 'withdrawal_request') {
      counts.walletEmployer += 1;
      return;
    }

    if (type === 'candidate_withdrawal_request') {
      counts.walletCandidate += 1;
      return;
    }

    if (type === 'package_purchase_request') {
      counts.packages += 1;
      return;
    }

    if (type === 'candidate_verification_request') {
      counts.candidates += 1;
      counts.candidateVerifications += 1;
      return;
    }

    if (type === 'quick_job_activation_request') {
      counts.employers += 1;
      counts.employerQuickJobs += 1;
      return;
    }

    if (type === 'change_request_submitted') {
      counts.employers += 1;
      counts.employerChangeRequests += 1;
      return;
    }

    if (type === 'profile_change_request') {
      counts.employers += 1;
      counts.employerProfileChanges += 1;
      return;
    }

    if (type === 'job_pending_approval') {
      const isQuickJob = data.isQuickJob === true || String(data.isQuickJob).toLowerCase() === 'true';
      if (isQuickJob || path === '/admin/employers') {
        counts.employers += 1;
        counts.employerQuickJobs += 1;
      } else {
        counts.posts += 1;
      }
      return;
    }

    // Older notifications may only contain an actionUrl.
    if (path === '/admin/employers') counts.employers += 1;
    if (path === '/admin/candidates') counts.candidates += 1;
    if (path === '/admin/posts') counts.posts += 1;
    if (path === '/admin/packages') counts.packages += 1;
    if (path === '/admin/reports') counts.reports += 1;
    if (path === '/admin/change-requests') counts.changeRequests += 1;
    if (path === '/admin/wallet') counts.wallet += 1;
  });

  counts.wallet = counts.walletEmployer + counts.walletCandidate + counts.wallet;
  return counts;
};

export default getAdminNotificationBadgeCounts;
