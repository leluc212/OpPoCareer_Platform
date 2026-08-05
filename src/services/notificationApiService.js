// Notification API Service - DynamoDB Backend
import { getAuthHeaders } from './authHeaders.js';

const API_ENDPOINT = (
  import.meta.env.VITE_NOTIFICATIONS_API
  || 'https://iuo7ofruu6.execute-api.ap-southeast-1.amazonaws.com'
).replace(/\/$/, '');

/**
 * Get all notifications for a user
 * @param {string} userId - User ID
 * @param {string} role - User role (admin, employer, candidate)
 */
export const getNotifications = async (userId, role) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_ENDPOINT}/notifications/user/${encodeURIComponent(userId)}?role=${encodeURIComponent(role)}`,
      { headers }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    const data = await response.json();
    let list = Array.isArray(data) ? data : [];

    // RecipientIndex may be stale in production. Fall back to the recipient
    // filter route, which reads the source table directly.
    if (list.length === 0) {
      const fallbackResponse = await fetch(
        `${API_ENDPOINT}/notifications?recipientId=${encodeURIComponent(userId)}&recipientRole=${encodeURIComponent(role)}`,
        { headers }
      );
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        list = Array.isArray(fallbackData) ? fallbackData : [];
      }
    }

    return list.filter(n => n.type !== 'chat_message');
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @param {string} role - User role
 */
export const getUnreadCount = async (userId, role) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/notifications/unread/${userId}?role=${role}`, {
      headers: await getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }
    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

/**
 * Create a new notification
 * @param {object} notification - Notification data
 */
export const createNotification = async (notification) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/notifications`, {
      method: 'POST',
      headers: {
        ...(await getAuthHeaders()),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notification)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create notification');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
export const markAsRead = async (notificationId) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/notifications/${notificationId}`, {
      method: 'PUT',
      headers: {
        ...(await getAuthHeaders()),
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
 * @param {string} userId - User ID
 * @param {string} role - User role
 */
export const markAllAsRead = async (userId, role) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/notifications/mark-all-read/${userId}?role=${role}`, {
      method: 'PUT',
      headers: await getAuthHeaders()
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
 * @param {string} notificationId - Notification ID
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders()
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
 * Create notification when employer requests package purchase
 */
export const createPackagePurchaseRequestNotification = async (subscription) => {
  const notification = {
    type: 'package_purchase_request',
    title: 'Yêu cầu mua gói dịch vụ mới',
    titleEn: 'New Package Purchase Request',
    message: `${subscription.companyName} yêu cầu mua gói ${subscription.packageName} (${subscription.duration})`,
    messageEn: `${subscription.companyName} requested to purchase ${subscription.packageName} package (${subscription.duration})`,
    recipientId: 'admin',
    recipientRole: 'admin',
    senderId: subscription.employerId,
    senderName: subscription.companyName,
    data: {
      subscriptionId: subscription.subscriptionId,
      packageName: subscription.packageName,
      duration: subscription.duration,
      price: subscription.price
    },
    icon: 'package',
    color: '#3b82f6',
    actionUrl: '/admin/packages',
    actionText: 'Xem chi tiết',
    actionTextEn: 'View Details'
  };

  return await createNotification(notification);
};

/**
 * Create notification when admin approves package
 */
export const createPackageApprovedNotification = async (subscription, employerId) => {
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

  return await createNotification(notification);
};

export default {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createPackagePurchaseRequestNotification,
  createPackageApprovedNotification
};
