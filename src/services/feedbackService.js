import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_CANDIDATE_API_URL || 'https://mrag7hkw11.execute-api.ap-southeast-1.amazonaws.com/prod';

const getAuthToken = async () => {
  try {
    const session = await fetchAuthSession();
    if (!session || !session.tokens) return null;
    const idToken = session.tokens.idToken;
    if (!idToken) return null;
    return typeof idToken === 'string' ? idToken : idToken.toString();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

class FeedbackService {
  async makeRequest(endpoint, options = {}) {
    try {
      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        mode: 'cors'
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`FeedbackService request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getAllFeedbacks() {
    try {
      const data = await this.makeRequest('/feedback');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Error fetching feedbacks:', e);
      return [];
    }
  }

  async submitFeedback(category, comment, user = null, imageBase64List = []) {
    try {
      const payload = {
        category: category || 'other',
        comment: comment || '',
        userId: user?.userId || 'anonymous-guest',
        userName: user?.fullName || user?.name || (user?.email ? user.email.split('@')[0] : 'Khách vãng lai'),
        userEmail: user?.email || 'guest.anonymous@oppo.com',
        userRole: user?.role || 'guest',
        ...(imageBase64List && imageBase64List.length > 0 && { imageUrls: imageBase64List })
      };

      const result = await this.makeRequest('/feedback', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      console.log('✅ Feedback successfully stored in DynamoDB:', result);

      const feedbackData = result.data || result;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('newFeedbackSubmitted', { detail: feedbackData }));
      }

      return feedbackData;
    } catch (e) {
      console.error('Error submitting feedback:', e);
      throw e;
    }
  }

  async markAsRead(id) {
    try {
      const result = await this.makeRequest(`/feedback/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'read' })
      });
      console.log(`👁️ Feedback ${id} marked as read in DynamoDB.`);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('feedbackStatusChanged', { detail: { id, status: 'read' } }));
      }

      return true;
    } catch (e) {
      console.error('Error marking feedback as read:', e);
      return false;
    }
  }

  async deleteFeedback(id) {
    try {
      await this.makeRequest(`/feedback/${id}`, {
        method: 'DELETE'
      });
      console.log(`🗑️ Feedback ${id} deleted from DynamoDB.`);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('feedbackStatusChanged', { detail: { id, action: 'deleted' } }));
      }

      return true;
    } catch (e) {
      console.error('Error deleting feedback:', e);
      return false;
    }
  }

  async getUnreadCount() {
    try {
      const feedbacks = await this.getAllFeedbacks();
      return feedbacks.filter(item => item.status === 'unread').length;
    } catch (e) {
      console.error('Error calculating unread count:', e);
      return 0;
    }
  }
}

export default new FeedbackService();
