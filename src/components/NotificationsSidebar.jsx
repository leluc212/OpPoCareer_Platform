import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Bell, Package, CheckCircle, AlertCircle, DollarSign, Users, Briefcase, Zap, XCircle, Star } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService';
import RelativeTime from './RelativeTime';

const SidebarContainer = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 20px;
  box-shadow: ${props => props.theme.shadows.card};
  border: 2px solid ${props => props.theme.colors.border};
  height: fit-content;
  max-height: 600px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid ${props => props.theme.colors.border};
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ViewAllButton = styled.button`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.colors.bgDark};
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const Tab = styled.button`
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.$active ? 'white' : props.theme.colors.textLight};
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.bgDark};
  }
`;

const NotificationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  max-height: 450px;
  padding-right: 4px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.bgDark};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 3px;
    
    &:hover {
      background: ${props => props.theme.colors.textLight};
    }
  }
`;

const NotificationItem = styled.div`
  background: ${props => props.$unread ? props.theme.colors.bgDark : 'transparent'};
  border: 1px solid ${props => props.$unread ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.colors.bgDark};
    transform: translateX(2px);
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
`;

const NotificationIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const UnreadDot = styled.div`
  width: 6px;
  height: 6px;
  background: ${props => props.theme.colors.primary};
  border-radius: 50%;
  flex-shrink: 0;
`;

const NotificationMessage = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textLight};
  line-height: 1.4;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NotificationTime = styled.div`
  font-size: 11px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${props => props.theme.colors.textLight};
  
  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
    opacity: 0.3;
  }
  
  p {
    font-size: 13px;
    font-weight: 500;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${props => props.theme.colors.textLight};
  font-size: 13px;
  font-weight: 500;
`;

const NotificationsSidebar = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    
    // Poll every 3 seconds for faster updates
    const interval = setInterval(loadNotifications, 3000);
    
    // Listen for storage events (triggered when new notification is created)
    const handleStorageChange = () => {
      console.log('🔄 [NotificationsSidebar] Storage event detected - reloading...');
      loadNotifications();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      // For employer/candidate, use userId (Cognito sub) which matches employerId in notifications
      // For admin, use 'admin' as recipientId
      const userId = user.role === 'admin' ? 'admin' : (user.userId || user.id || user.email);
      const role = user.role;
      console.log('🔔 [NotificationsSidebar] Loading notifications for:', { userId, role, userObject: user });
      
      const notifs = await getNotifications(userId, role);
      console.log('📥 [NotificationsSidebar] Received notifications:', notifs?.length || 0);
      
      setNotifications(notifs);
      setLoading(false);
    } catch (error) {
      console.error('❌ [NotificationsSidebar] Error loading notifications:', error);
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        await markAsRead(notification.notificationId);
        await loadNotifications();
      }
      
      // Navigate to action URL
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'package_purchase_request':
        return Package;
      case 'package_approved':
      case 'success':
      case 'CV_ACCEPTED':
      case 'withdrawal_approved':
      case 'quick_job_activation_approved':
      case 'job_approved':
        return CheckCircle;
      case 'employers':
        return Briefcase;
      case 'posts':
        return AlertCircle;
      case 'payments':
      case 'candidate_withdrawal_request':
      case 'withdrawal_request':
        return DollarSign;
      case 'urgent':
        return AlertCircle;
      case 'system':
      case 'CV_REJECTED':
      case 'withdrawal_rejected':
      case 'quick_job_activation_rejected':
      case 'quick_job_activation_deactivated':
      case 'job_rejected':
        return AlertCircle;
      case 'quick_job_activation_request':
        return Zap;
      case 'employer_review':
        return Star;
      default:
        return Bell;
    }
  };

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const handleViewAll = async () => {
    // Mark all as read before navigating
    try {
      const userId = user.role === 'admin' ? 'admin' : (user.userId || user.id || user.email);
      await markAllAsRead(userId, user.role);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }

    if (user.role === 'admin') {
      navigate('/admin/notifications');
    } else if (user.role === 'employer') {
      navigate('/employer/notifications');
    } else if (user.role === 'candidate') {
      navigate('/candidate/notifications');
    }
  };

  return (
    <SidebarContainer>
      <Header>
        <Title>
          <Bell />
          {language === 'vi' ? 'Thông báo' : 'Notifications'}
        </Title>
        <ViewAllButton onClick={handleViewAll}>
          {language === 'vi' ? 'Xem tất cả' : 'View all'}
        </ViewAllButton>
      </Header>

      <TabsContainer>
        <Tab 
          $active={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
        >
          {language === 'vi' ? 'Tất cả' : 'All'}
        </Tab>
        <Tab 
          $active={activeTab === 'unread'}
          onClick={() => setActiveTab('unread')}
        >
          {language === 'vi' ? 'Chưa đọc' : 'Unread'}
        </Tab>
      </TabsContainer>

      {loading ? (
        <LoadingState>
          {language === 'vi' ? 'Đang tải...' : 'Loading...'}
        </LoadingState>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState>
          <Bell />
          <p>{language === 'vi' ? 'Không có thông báo' : 'No notifications'}</p>
        </EmptyState>
      ) : (
        <NotificationsList>
          {filteredNotifications.slice(0, 10).map(notification => {
            const Icon = getNotificationIcon(notification.type);
            const title = language === 'vi' ? notification.title : notification.titleEn;
            const message = language === 'vi' ? notification.message : notification.messageEn;
            
            return (
              <NotificationItem
                key={notification.notificationId}
                $unread={!notification.read}
                onClick={() => handleNotificationClick(notification)}
              >
                <NotificationHeader>
                  <NotificationIcon $color={notification.color}>
                    <Icon />
                  </NotificationIcon>
                  <NotificationContent>
                    <NotificationTitle>
                      {!notification.read && <UnreadDot />}
                      {title}
                    </NotificationTitle>
                    <NotificationMessage>{message}</NotificationMessage>
                    <NotificationTime>
                      <RelativeTime timestamp={notification.createdAt} language={language} />
                    </NotificationTime>
                  </NotificationContent>
                </NotificationHeader>
              </NotificationItem>
            );
          })}
        </NotificationsList>
      )}
    </SidebarContainer>
  );
};

export default NotificationsSidebar;
