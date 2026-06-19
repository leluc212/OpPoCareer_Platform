import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Bell, Package, CheckCircle, X } from 'lucide-react';
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
      if (url === '/candidate/jobs') {
        const isQuickJobRelated = ['success', 'CV_ACCEPTED', 'quick_job_activation_approved'].includes(notification.type);
        url = isQuickJobRelated ? '/candidate/jobs?tab=shift' : '/candidate/jobs?tab=standard';
      }
      navigate(url);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(userId, role);
    await loadNotifications();
  };

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'package':
        return <Package />;
      case 'check-circle':
        return <CheckCircle />;
      default:
        return <Bell />;
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
                <NotificationIcon $color={notification.color}>
                  {getIcon(notification.icon)}
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
