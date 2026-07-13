import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Bell, Package, CheckCircle, CheckCircle2, AlertCircle, XCircle, Briefcase, Zap, Star, X, MessageSquare, UserPlus, UserCheck, Volume2, Banknote, Edit } from 'lucide-react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notificationService';
import { useLanguage } from '../context/LanguageContext';

const BellContainer = styled.div`
  position: relative;
`;

const BellButton = styled.button`
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  color: ${props => props.theme.colors.text};
  
  &:hover {
    background: ${props => props.theme.colors.bgDark};
  }
  
  svg {
    width: 22px;
    height: 22px;
  }
`;

const Badge = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 380px;
  max-height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid ${props => props.theme.colors.border};
  z-index: 1000;
  overflow: hidden;
  display: ${props => props.$show ? 'flex' : 'none'};
  flex-direction: column;
`;

const DropdownHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    font-size: 16px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }
`;

const MarkAllButton = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover {
    background: #eff6ff;
  }
`;

const NotificationList = styled.div`
  overflow-y: auto;
  max-height: 400px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
`;

const NotificationItem = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$unread ? '#f8fafc' : 'white'};
  position: relative;
  
  &:hover {
    background: #f1f5f9;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const NotificationIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const NotificationTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 4px;
`;

const NotificationMessage = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  line-height: 1.5;
  margin-bottom: 8px;
`;

const NotificationTime = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textLight};
`;

const UnreadDot = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 50%;
`;

const EmptyState = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: ${props => props.theme.colors.textLight};
  
  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    opacity: 0.3;
  }
  
  p {
    font-size: 14px;
  }
`;

const NotificationBell = ({ userId, role }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const notifs = await getNotifications(userId, role);
      const count = await getUnreadCount(userId, role);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Poll for updates every 10 seconds
    const interval = setInterval(loadNotifications, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [userId, role]);

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification.id);
    await loadNotifications();
    setShowDropdown(false);
    
    if (notification.actionUrl) {
      let url = notification.actionUrl;

      // Parse data field if it's a JSON string (DynamoDB may return it as string)
      const notifData = typeof notification.data === 'string'
        ? (() => { try { return JSON.parse(notification.data); } catch { return {}; } })()
        : (notification.data || {});

      // Xử lý thông báo EMPLOYER_APPROVED (NTD duyệt CV, ứng viên vào phỏng vấn AI)
      if (notification.type === 'employer_cv_approved' && notifData?.jobId) {
        // Kiểm tra hạn phỏng vấn 2 ngày
        if (notifData.interviewDeadline) {
          const deadline = new Date(notifData.interviewDeadline);
          if (new Date() > deadline) {
            // Đã quá hạn — không cho vào trang phỏng vấn
            alert('Rất tiếc, thời gian phỏng vấn đã hết hạn. Vui lòng liên hệ nhà tuyển dụng hoặc tìm cơ hội khác.');
            return;
          }
        }
        // Còn hạn — điều hướng vào trang phỏng vấn AI
        navigate('/candidate/jobs?tab=standard', {
          state: {
            selectedJobId: notifData.jobId,
            applicationId: notifData.applicationId || null,
            openInterview: true
          }
        });
        return;
      }

      // Handle CV-approved notification (type: 'success') — redirect to AI interview
      // Also catches old notifications that still have '/candidate/dashboard' or '/candidate/jobs' as actionUrl
      const isCvApproved = (notification.type === 'success' || notification.type === 'CV_ACCEPTED') && notifData?.jobId;
      const isDashboardUrl = url === '/candidate/dashboard' || url === '/candidate/jobs';
      
      if (isCvApproved || (isDashboardUrl && (notification.type === 'success' || notification.type === 'employer_cv_approved'))) {
        navigate('/candidate/jobs?tab=standard', {
          state: { selectedJobId: notifData.jobId, openInterview: true }
        });
        return;
      }

      // Normalize /candidate/jobs → add ?tab param (standard catch-all)
      if (url === '/candidate/jobs') {
        url = '/candidate/jobs?tab=standard';
        const jobId = notifData?.jobId;
        if (jobId) {
          navigate(url, { state: { selectedJobId: jobId, openInterview: true } });
          return;
        }
      }
      navigate(url);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(userId, role);
    await loadNotifications();
  };

  const getIcon = (notification) => {
    const iconType = notification.icon;
    const type = notification.type || '';
    const title = (notification.title || '').toLowerCase();
    const message = (notification.message || '').toLowerCase();

    const isSuccess = title.includes('thành công') || title.includes('success') || title.includes('chấp nhận') || title.includes('accepted');
    const isUrgent = title.includes('tuyển gấp') || title.includes('urgent') || message.includes('tuyển gấp');
    const isRejected = title.includes('chưa được duyệt') || title.includes('không phù hợp') || title.includes('not approved') || title.includes('rejected') || type === 'employer_cv_rejected' || type === 'ai_screening_rejected';

    // Ưu tiên detect từ nội dung trước
    if (isRejected) return <XCircle style={{ color: '#ef4444' }} />;
    if (isSuccess) return <CheckCircle2 style={{ color: '#10B981' }} />;
    if (isUrgent) return <Zap style={{ color: '#ef4444' }} />;

    // Fallback theo type từ DB
    switch (type) {
      case 'success':
      case 'CV_ACCEPTED':
      case 'application_success':
      case 'cv_approved':
      case 'ai_screening_passed':
      case 'employer_cv_approved':
      case 'package_approved':
      case 'job_approved':
      case 'quick_job_activation_approved':
      case 'withdrawal_approved':
      case 'change_request_approved':
      case 'profile_change_approved':
        return <CheckCircle2 style={{ color: '#10B981' }} />;
      case 'application':
      case 'job_pending_approval':
        return <Briefcase />;
      case 'job_urgent':
      case 'urgent':
      case 'new_worker_assigned_shift':
        return <Zap style={{ color: '#ef4444' }} />;
      case 'employer_review':
        return <Star style={{ color: '#F59E0B' }} />;
      case 'ai_screening_rejected':
      case 'employer_cv_rejected':
      case 'job_rejected':
      case 'quick_job_activation_rejected':
      case 'quick_job_activation_deactivated':
      case 'withdrawal_rejected':
      case 'change_request_rejected':
      case 'profile_change_rejected':
      case 'worker_replaced_shift_cancelled':
        return <XCircle style={{ color: '#ef4444' }} />;
      case 'chat_message':
        return <MessageSquare style={{ color: '#3b82f6' }} />;
      case 'ai_interview_complete':
        return <Volume2 style={{ color: '#8b5cf6' }} />;
      case 'withdrawal_request':
      case 'candidate_withdrawal_request':
        return <Banknote style={{ color: '#10B981' }} />;
      case 'candidate_verification_request':
        return <UserCheck style={{ color: '#10B981' }} />;
      case 'profile_change_request':
        return <Edit style={{ color: '#F59E0B' }} />;
      default:
        break;
    }

    // Fallback theo icon string từ DB
    switch (iconType) {
      case 'package':
        return <Package />;
      case 'check-circle':
        return <CheckCircle2 style={{ color: '#10B981' }} />;
      case 'x-circle':
      case 'alert-circle':
      case 'circle-x':
        return <XCircle style={{ color: '#ef4444' }} />;
      case 'briefcase':
        return <Briefcase />;
      case 'zap':
        return <Zap style={{ color: '#ef4444' }} />;
      case 'star':
        return <Star style={{ color: '#F59E0B' }} />;
      case 'message-square':
        return <MessageSquare style={{ color: '#3b82f6' }} />;
      case 'user-plus':
        return <UserPlus style={{ color: '#3b82f6' }} />;
      case 'user-check':
        return <UserCheck style={{ color: '#10B981' }} />;
      case 'volume-2':
        return <Volume2 style={{ color: '#8b5cf6' }} />;
      case 'banknote':
      case 'dollar-sign':
        return <Banknote style={{ color: '#10B981' }} />;
      case 'edit':
        return <Edit style={{ color: '#F59E0B' }} />;
      default:
        return <Bell />;
    }
  };

  const getColor = (notification) => {
    const title = (notification.title || '').toLowerCase();
    const message = (notification.message || '').toLowerCase();
    const type = notification.type || '';

    const isSuccess = title.includes('thành công') || title.includes('success') || title.includes('chấp nhận') || title.includes('accepted');
    const isUrgent = title.includes('tuyển gấp') || title.includes('urgent') || message.includes('tuyển gấp');
    const isRejected = title.includes('chưa được duyệt') || title.includes('không phù hợp') || title.includes('not approved') || title.includes('rejected') || type === 'employer_cv_rejected' || type === 'ai_screening_rejected';

    if (isRejected) return '#ef4444';
    if (isSuccess) return '#10B981';
    if (isUrgent) return '#ef4444';

    switch (type) {
      case 'success':
      case 'CV_ACCEPTED':
      case 'application_success':
      case 'cv_approved':
      case 'ai_screening_passed':
      case 'employer_cv_approved':
      case 'package_approved':
      case 'job_approved':
      case 'quick_job_activation_approved':
      case 'withdrawal_approved':
      case 'change_request_approved':
      case 'profile_change_approved':
        return '#10B981';
      case 'job_urgent':
      case 'urgent':
      case 'ai_screening_rejected':
      case 'employer_cv_rejected':
      case 'job_rejected':
      case 'quick_job_activation_rejected':
      case 'quick_job_activation_deactivated':
      case 'withdrawal_rejected':
      case 'change_request_rejected':
      case 'profile_change_rejected':
        return '#ef4444';
      case 'employer_review':
        return '#F59E0B';
      case 'application':
      case 'chat_message':
      case 'package_purchase_request':
      case 'job_pending_approval':
      case 'candidate_verification_request':
      case 'profile_change_request':
        return '#1e40af';
      case 'ai_interview_complete':
        return '#8b5cf6';
      case 'withdrawal_request':
      case 'candidate_withdrawal_request':
      case 'new_worker_assigned_shift':
        return '#10B981';
      case 'worker_replaced_shift_cancelled':
        return '#ef4444';
      default:
        return notification.color || '#1e40af';
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'vi' ? 'Vừa xong' : 'Just now';
    if (diffMins < 60) return language === 'vi' ? `${diffMins} phút trước` : `${diffMins} min ago`;
    if (diffHours < 24) return language === 'vi' ? `${diffHours} giờ trước` : `${diffHours} hours ago`;
    if (diffDays < 7) return language === 'vi' ? `${diffDays} ngày trước` : `${diffDays} days ago`;
    
    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
  };

  return (
    <BellContainer>
      <BellButton onClick={() => setShowDropdown(!showDropdown)}>
        <Bell />
        {unreadCount > 0 && <Badge>{unreadCount > 99 ? '99+' : unreadCount}</Badge>}
      </BellButton>

      <Dropdown $show={showDropdown}>
        <DropdownHeader>
          <h3>{language === 'vi' ? 'Thông báo' : 'Notifications'}</h3>
          {unreadCount > 0 && (
            <MarkAllButton onClick={handleMarkAllAsRead}>
              {language === 'vi' ? 'Đánh dấu đã đọc' : 'Mark all read'}
            </MarkAllButton>
          )}
        </DropdownHeader>

        <NotificationList>
          {notifications.length === 0 ? (
            <EmptyState>
              <Bell />
              <p>{language === 'vi' ? 'Không có thông báo mới' : 'No new notifications'}</p>
            </EmptyState>
          ) : (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                $unread={!notification.read}
                onClick={() => handleNotificationClick(notification)}
              >
                {!notification.read && <UnreadDot />}
                <NotificationIcon $color={getColor(notification)}>
                  {getIcon(notification)}
                </NotificationIcon>
                <NotificationTitle>
                  {language === 'vi' ? notification.title : notification.titleEn}
                </NotificationTitle>
                <NotificationMessage>
                  {language === 'vi' ? notification.message : notification.messageEn}
                </NotificationMessage>
                <NotificationTime>
                  {formatTime(notification.createdAt)}
                </NotificationTime>
              </NotificationItem>
            ))
          )}
        </NotificationList>
      </Dropdown>
    </BellContainer>
  );
};

export default NotificationBell;
