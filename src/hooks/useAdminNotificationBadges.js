import { useEffect, useState } from 'react';
import notificationService from '../services/notificationService';
import {
  EMPTY_ADMIN_NOTIFICATION_BADGES,
  getAdminNotificationBadgeCounts
} from '../utils/adminNotificationBadges';

const POLL_INTERVAL_MS = 10000;

export const useAdminNotificationBadges = (enabled = true) => {
  const [counts, setCounts] = useState(EMPTY_ADMIN_NOTIFICATION_BADGES);

  useEffect(() => {
    if (!enabled) {
      setCounts(EMPTY_ADMIN_NOTIFICATION_BADGES);
      return undefined;
    }

    let active = true;

    const loadCounts = async () => {
      const notifications = await notificationService
        .getNotifications('admin', 'admin')
        .catch(() => []);
      if (active) setCounts(getAdminNotificationBadgeCounts(notifications));
    };

    loadCounts();
    const intervalId = setInterval(loadCounts, POLL_INTERVAL_MS);
    const handleNotificationChange = () => loadCounts();
    window.addEventListener('notificationsChanged', handleNotificationChange);

    return () => {
      active = false;
      clearInterval(intervalId);
      window.removeEventListener('notificationsChanged', handleNotificationChange);
    };
  }, [enabled]);

  return counts;
};

export default useAdminNotificationBadges;
