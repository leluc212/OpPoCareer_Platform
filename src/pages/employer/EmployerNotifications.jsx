import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import RelativeTime from '../../components/RelativeTime';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../services/notificationService';
import {
  Bell,
  BellOff,
  UserPlus,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  Star,
  X,
  Package,
  Briefcase
} from 'lucide-react';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const NotificationsContainer = styled.div`
  animation: ${fadeIn} 0.5s ease-in;
`;

const PageHeader = styled.div`
  margin-bottom: 28px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

const PageTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PageIconBox = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 15px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: #1e40af;
  }
`;

const PageTitleText = styled.div`
  h1 {
    font-size: 26px;
    font-weight: 800;
    color: ${props => props.theme.colors.text};
    letter-spacing: -0.5px;
    line-height: 1.2;
    margin-bottom: 4px;
  }

  p {
    color: ${props => props.theme.colors.textLight};
    font-size: 13.5px;
    font-weight: 500;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 6px;
  background: #f8fafc;
  border-radius: 14px;
  overflow-x: auto;
  border: 1.5px solid #E8EFFF;
  flex: 1;
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 3px;
  }
`;

const Tab = styled(motion.button)`
  padding: 10px 20px;
  background: ${props => props.$active ? '#ffffff' : 'transparent'};
  border: none;
  font-size: 14px;
  font-weight: 700;
  color: ${props => props.$active ? '#1e40af' : '#64748B'};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: ${props => props.$active ? '0 2px 8px rgba(30, 64, 175, 0.08)' : 'none'};
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    color: #1e40af;
    background: ${props => props.$active ? '#ffffff' : '#f1f5f9'};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled(motion.button)`
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: ${props => props.$variant === 'primary' ? '#1e40af' : '#ffffff'};
  color: ${props => props.$variant === 'primary' ? 'white' : '#1E293B'};
  border: 1.5px solid ${props => props.$variant === 'primary' ? 'transparent' : '#e2e8f0'};
  box-shadow: ${props => props.$variant === 'primary'
    ? '0 4px 12px rgba(30, 64, 175, 0.25)'
    : '0 2px 8px rgba(0, 0, 0, 0.05)'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$variant === 'primary'
    ? '0 6px 16px rgba(30, 64, 175, 0.35)'
    : '0 4px 12px rgba(0, 0, 0, 0.1)'};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const NotificationsGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const NotificationCard = styled(motion.div)`
  background: #ffffff;
  border: 1.5px solid ${props => props.$read ? '#F1F5F9' : '#BFDBFE'};
  border-radius: 16px;
  padding: 20px 24px;
  transition: all 0.22s ease;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.04);
  position: relative;
  overflow: hidden;
  display: flex;
  gap: 16px;
  align-items: start;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-radius: 16px 0 0 16px;
    background: ${props => {
    switch (props.$type) {
      case 'application': return '#1e40af';
      case 'interview': return '#10B981';
      case 'system': return '#1e40af';
      case 'rating': return '#F59E0B';
      default: return '#64748B';
    }
  }};
    opacity: ${props => props.$read ? '0.2' : '0.8'};
    transition: opacity 0.2s ease;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.12);
    border-color: #93C5FD;
    &::before {
      opacity: 1;
    }
  }
`;

const NotificationIcon = styled.div`
  width: 46px;
  height: 46px;
  min-width: 46px;
  border-radius: 14px;
  background: ${props => {
    switch (props.$type) {
      case 'application': return '#EFF6FF';
      case 'interview': return '#ECFDF5';
      case 'system': return '#EFF6FF';
      case 'rating': return '#FFFBEB';
      default: return '#F8FAFC';
    }
  }};
  border: 1.5px solid ${props => {
    switch (props.$type) {
      case 'application': return '#BFDBFE';
      case 'interview': return '#A7F3D0';
      case 'system': return '#BFDBFE';
      case 'rating': return '#FDE68A';
      default: return '#E2E8F0';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => {
    switch (props.$type) {
      case 'application': return '#1e40af';
      case 'interview': return '#10B981';
      case 'system': return '#1e40af';
      case 'rating': return '#F59E0B';
      default: return '#64748B';
    }
  }};
  transition: all 0.2s ease;
  
  ${NotificationCard}:hover & {
    transform: scale(1.05);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 6px;
  line-height: 1.4;
`;

const NotificationMessage = styled.p`
  font-size: 14.5px;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 8px;
  font-weight: 500;
`;

const NotificationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #64748B;
    font-weight: 500;
    
    svg {
      width: 14px;
      height: 14px;
      opacity: 0.8;
    }
  }
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 8px;
  flex-direction: column;
  align-items: flex-end;
`;

const IconButton = styled(motion.button)`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${props => {
    if (props.$variant === 'danger') return '#FEF2F2';
    return '#F1F5F9';
  }};
  color: ${props => {
    if (props.$variant === 'danger') return '#EF4444';
    return '#64748B';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid ${props => {
    if (props.$variant === 'danger') return '#FECACA';
    return '#E2E8F0';
  }};
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: ${props => {
    if (props.$variant === 'danger') return '#FEE2E2';
    return '#E2E8F0';
  }};
    color: ${props => {
    if (props.$variant === 'danger') return '#DC2626';
    return '#334155';
  }};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => {
    if (props.$variant === 'danger') return 'rgba(239, 68, 68, 0.15)';
    return 'rgba(0, 0, 0, 0.05)';
  }};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const UnreadBadge = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
`;

const EmptyState = styled(motion.div)`
  text-align: center;
  padding: 80px 20px;
  background: ${props => props.theme.colors.bgLight};
  border-radius: 20px;
  border: 2px dashed ${props => props.theme.colors.border};
  
  svg {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
    color: ${props => props.theme.colors.primary};
    opacity: 0.4;
  }
  
  h3 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 10px;
    color: ${props => props.theme.colors.text};
  }
  
  p {
    font-size: 15px;
    color: ${props => props.theme.colors.textLight};
  }
`;

const LoadingState = styled(motion.div)`
  text-align: center;
  padding: 80px 20px;
  
  .spinner {
    width: 60px;
    height: 60px;
    margin: 0 auto 20px;
    border: 4px solid #E5E7EB;
    border-top-color: #1e40af;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  p {
    font-size: 15px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const ModalBox = styled(motion.div)`
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 24px 60px rgba(30, 64, 175, 0.18);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 24px 28px 20px;
  border-bottom: 1.5px solid #f1f5f9;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  background: ${props => props.$isQuickJob ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' : 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'};
`;

const ModalIconWrap = styled.div`
  width: 52px;
  height: 52px;
  min-width: 52px;
  border-radius: 14px;
  background: ${props => props.$isQuickJob ? '#FDE68A' : '#BFDBFE'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$isQuickJob ? '#D97706' : '#1e40af'};
  svg { width: 24px; height: 24px; }
`;

const ModalTitleGroup = styled.div`
  flex: 1;
  min-width: 0;
  h2 {
    font-size: 17px;
    font-weight: 800;
    color: #1E293B;
    margin-bottom: 4px;
    line-height: 1.3;
  }
  p {
    font-size: 13px;
    color: #64748B;
    font-weight: 500;
  }
`;

const ModalCloseBtn = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(0,0,0,0.06);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
  flex-shrink: 0;
  transition: all 0.15s;
  &:hover { background: rgba(0,0,0,0.12); color: #1E293B; }
  svg { width: 18px; height: 18px; }
`;

const ModalBody = styled.div`
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const ModalInfoRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;

  .icon-box {
    width: 34px;
    height: 34px;
    min-width: 34px;
    border-radius: 9px;
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1e40af;
    svg { width: 16px; height: 16px; }
  }

  .info {
    flex: 1;
    min-width: 0;
    .label { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .value { font-size: 14.5px; font-weight: 700; color: #1E293B; }
  }
`;

const ModalFooter = styled.div`
  padding: 16px 28px 24px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const ModalBtn = styled(motion.button)`
  padding: 11px 22px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  transition: all 0.2s;
  background: ${props => props.$primary ? '#1e40af' : '#f1f5f9'};
  color: ${props => props.$primary ? '#fff' : '#475569'};
  box-shadow: ${props => props.$primary ? '0 4px 14px rgba(30,64,175,0.25)' : 'none'};
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$primary ? '0 8px 20px rgba(30,64,175,0.35)' : '0 4px 10px rgba(0,0,0,0.08)'};
  }
  svg { width: 16px; height: 16px; }
`;

const EmployerNotifications = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to get icon for notification type
  const getIconForType = (type) => {
    switch (type) {
      case 'application': return UserPlus;
      case 'package_approved': return CheckCircle;
      case 'package_purchase_request': return Package;
      case 'system': return AlertCircle;
      case 'rating': return Star;
      default: return Bell;
    }
  };

  const loadNotifications = useCallback(async () => {
    let effectiveUser = user;
    if (!effectiveUser) {
      try {
        const storedUser = localStorage.getItem('user');
        effectiveUser = storedUser ? JSON.parse(storedUser) : null;
      } catch (error) {
        console.error('❌ [EmployerNotifications] Failed to parse stored user:', error);
      }
    }

    if (!effectiveUser) {
      console.log('⚠️ [EmployerNotifications] No user, skipping notification load');
      setLoading(false);
      return;
    }
    
    try {
      // CRITICAL FIX: Ensure we use UUID from Cognito, not email
      let userId = effectiveUser.userId || effectiveUser.id;
      
      // If userId looks like an email, fetch the real UUID from Cognito
      if (!userId || userId.includes('@')) {
        console.warn('⚠️ [EmployerNotifications] userId is email, fetching UUID from Cognito...');
        try {
          const { fetchAuthSession } = await import('aws-amplify/auth');
          const session = await fetchAuthSession();
          if (session && session.tokens) {
            const uuidFromToken = session.tokens.idToken.payload.sub;
            console.log('✅ [EmployerNotifications] Got UUID from Cognito:', uuidFromToken);
            userId = uuidFromToken;
            
            // Update user object in AuthContext and localStorage
            const updatedUser = { ...effectiveUser, userId: uuidFromToken };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (cognitoError) {
          console.error('❌ [EmployerNotifications] Failed to get UUID from Cognito:', cognitoError);
        }
      }
      
      const role = effectiveUser.role;
      if (!userId || !role) {
        console.log('⚠️ [EmployerNotifications] Missing userId or role, skipping notification load');
        setLoading(false);
        return;
      }
      console.log('🔔 [EmployerNotifications] Loading notifications for:', { userId, role });
      
      const notifs = await getNotifications(userId, role);
      console.log('📥 [EmployerNotifications] Received notifications:', notifs?.length || 0);
      
      // Transform API notifications to match component format
      const transformedNotifs = notifs.map(notif => ({
        id: notif.notificationId,
        type: notif.type,
        title: language === 'vi' ? notif.title : (notif.titleEn || notif.title),
        message: language === 'vi' ? notif.message : (notif.messageEn || notif.message),
        jobTitle: notif.data?.jobTitle || notif.data?.packageName,
        createdAt: notif.createdAt, // Keep original timestamp for RelativeTime component
        read: notif.read,
        isQuickJob: notif.data?.isQuickJob || false,
        icon: getIconForType(notif.type),
        actionUrl: notif.actionUrl,
        actionText: language === 'vi' ? notif.actionText : (notif.actionTextEn || notif.actionText),
        data: notif.data
      }));
      
      setNotifications(transformedNotifs);
      setLoading(false);
    } catch (error) {
      console.error('❌ [EmployerNotifications] Error loading notifications:', error);
      setLoading(false);
    }
  }, [user, language]); // Dependencies: user and language

  // Load notifications from API
  useEffect(() => {
    console.log('🔄 [EmployerNotifications] useEffect triggered, user:', user?.email || 'no user');
    
    // Load immediately when component mounts or user changes
    loadNotifications();
    
    // Poll every 5 seconds for updates (balanced between responsiveness and server load)
    const interval = setInterval(loadNotifications, 5000);
    
    // Listen for storage events (triggered when new notification is created)
    const handleStorageChange = () => {
      console.log('🔄 Storage event detected - reloading notifications...');
      loadNotifications();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for focus events (reload when user returns to tab)
    const handleFocus = () => {
      console.log('👁️ Tab focused - reloading notifications...');
      loadNotifications();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Listen for user login events
    const handleUserLogin = () => {
      console.log('🔐 User logged in - reloading notifications...');
      // Wait a bit for user state to be fully updated
      setTimeout(loadNotifications, 500);
    };
    
    window.addEventListener('userLoggedIn', handleUserLogin);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('userLoggedIn', handleUserLogin);
    };
  }, [loadNotifications]); // Dependency: loadNotifications (which depends on user and language)

  const tabs = [
    { id: 'all', label: language === 'vi' ? 'Tất cả' : 'All', count: notifications.length },
    { id: 'unread', label: language === 'vi' ? 'Chưa đọc' : 'Unread', count: notifications.filter(n => !n.read).length },
    { id: 'application', label: language === 'vi' ? 'Ứng tuyển' : 'Applications', count: notifications.filter(n => n.type === 'application').length },
    { id: 'system', label: language === 'vi' ? 'Hệ thống' : 'System', count: notifications.filter(n => n.type === 'system').length }
  ];

  const filteredNotifications = notifications.filter(notification => {
    // Filter by active tab
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.type === activeTab;
  });

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Opens the detail modal (marks as read too)
  const handleOpenDetail = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    setSelectedNotification({ ...notification, read: true });
  };

  // Navigate to the correct page from inside the modal
  const handleGoToApplications = (notification) => {
    setSelectedNotification(null);
    if (notification.type === 'application') {
      const targetPath = notification.isQuickJob ? '/employer/quick-jobs' : '/employer/standard-jobs';
      navigate(targetPath, {
        state: {
          fromNotifications: true,
          jobId: notification?.data?.jobId || notification?.data?.idJob || null,
          staffTab: notification.isQuickJob ? 'pending_confirm' : undefined
        }
      });
    } else {
      navigate('/employer/dashboard');
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    const unreadIds = notifications.filter(n => !n.read).map(n => n.id).filter(Boolean);
    if (unreadIds.length === 0) {
      return;
    }

    await Promise.allSettled(unreadIds.map(id => markAsRead(id)));
    await loadNotifications();
  };

  const handleDelete = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout role="employer" key={language}>
      <NotificationsContainer>
        <PageHeader>
          <PageTitleGroup>
            <PageIconBox>
              <Bell />
            </PageIconBox>
            <PageTitleText>
              <h1>{language === 'vi' ? 'Thông Báo' : 'Notifications'}</h1>
              <p>{language === 'vi' ? 'Cập nhật tình trạng tuyển dụng' : 'Stay updated on hiring status'}</p>
            </PageTitleText>
          </PageTitleGroup>
        </PageHeader>

        <HeaderActions>
          <TabContainer>
            {tabs.map(tab => (
              <Tab
                key={tab.id}
                $active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </Tab>
            ))}
          </TabContainer>

          <ActionButtons>
            {unreadCount > 0 && (
              <ActionButton
                $variant="primary"
                onClick={handleMarkAllAsRead}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle />
                {language === 'vi' ? 'Đánh dấu đã đọc tất cả' : 'Mark all as read'}
              </ActionButton>
            )}
          </ActionButtons>
        </HeaderActions>

        {loading ? (
          <LoadingState
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="spinner"></div>
            <p>{language === 'vi' ? 'Đang tải thông báo...' : 'Loading notifications...'}</p>
          </LoadingState>
        ) : filteredNotifications.length > 0 ? (
          <NotificationsGrid>
            {filteredNotifications.map((notification, index) => (
              <NotificationCard
                key={notification.id}
                $type={notification.type}
                $read={notification.read}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                onClick={() =>
                  (notification.type === 'application'
                    ? handleGoToApplications(notification)
                    : handleOpenDetail(notification))
                }
              >
                <NotificationIcon $type={notification.type}>
                  <notification.icon />
                </NotificationIcon>

                <NotificationContent>
                  <NotificationTitle>{notification.title}</NotificationTitle>
                  <NotificationMessage>
                    {notification.message}
                    {notification.jobTitle && (
                      <span> — {notification.jobTitle}</span>
                    )}
                  </NotificationMessage>
                  <NotificationMeta>
                    <div className="meta-item">
                      <Clock />
                      <RelativeTime timestamp={notification.createdAt} language={language} />
                    </div>
                    {notification.type === 'application' && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: notification.isQuickJob ? '#FEF3C7' : '#EFF6FF',
                        color: notification.isQuickJob ? '#D97706' : '#1e40af',
                        border: `1px solid ${notification.isQuickJob ? '#FDE68A' : '#BFDBFE'}`
                      }}>
                        {notification.isQuickJob
                          ? (language === 'vi' ? '⚡ Tuyển gấp' : '⚡ Quick Job')
                          : (language === 'vi' ? '📋 Tiêu chuẩn' : '📋 Standard')}
                      </span>
                    )}
                    {!notification.read && <UnreadBadge>{language === 'vi' ? 'MỚI' : 'NEW'}</UnreadBadge>}
                  </NotificationMeta>
                </NotificationContent>

                <NotificationActions>
                  <IconButton
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenDetail(notification);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title={language === 'vi' ? 'Xem chi tiết' : 'View details'}
                  >
                    <Eye />
                  </IconButton>
                  <IconButton
                    $variant="danger"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title={language === 'vi' ? 'Xóa' : 'Delete'}
                  >
                    <Trash2 />
                  </IconButton>
                </NotificationActions>
              </NotificationCard>
            ))}
          </NotificationsGrid>
        ) : (
          <EmptyState
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <BellOff />
            <h3>{language === 'vi' ? 'Không có thông báo' : 'No notifications'}</h3>
            <p>{language === 'vi' ? 'Bạn chưa có thông báo nào trong danh mục này' : 'There are no notifications in this category yet'}</p>
          </EmptyState>
        )}
      </NotificationsContainer>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedNotification(null)}
        >
          <ModalBox
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <ModalHeader $isQuickJob={selectedNotification.isQuickJob}>
              <ModalIconWrap $isQuickJob={selectedNotification.isQuickJob}>
                <selectedNotification.icon />
              </ModalIconWrap>
              <ModalTitleGroup>
                <h2>{selectedNotification.title}</h2>
                <p><RelativeTime timestamp={selectedNotification.createdAt} language={language} /></p>
              </ModalTitleGroup>
              <ModalCloseBtn onClick={() => setSelectedNotification(null)}>
                <X />
              </ModalCloseBtn>
            </ModalHeader>

            <ModalBody>
              <ModalInfoRow>
                <div className="icon-box"><UserPlus /></div>
                <div className="info">
                  <div className="label">{language === 'vi' ? 'Nội dung' : 'Message'}</div>
                  <div className="value">{selectedNotification.message}</div>
                </div>
              </ModalInfoRow>

              {selectedNotification.jobTitle && (
                <ModalInfoRow>
                  <div className="icon-box"><FileText /></div>
                  <div className="info">
                    <div className="label">{language === 'vi' ? 'Tên gói' : 'Package Name'}</div>
                    <div className="value">{selectedNotification.jobTitle}</div>
                  </div>
                </ModalInfoRow>
              )}

              {selectedNotification.type === 'application' && (
                <ModalInfoRow>
                  <div className="icon-box">
                    {selectedNotification.isQuickJob ? <Star /> : <CheckCircle />}
                  </div>
                  <div className="info">
                    <div className="label">{language === 'vi' ? 'Loại công việc' : 'Job Type'}</div>
                    <div className="value" style={{ color: selectedNotification.isQuickJob ? '#D97706' : '#1e40af' }}>
                      {selectedNotification.isQuickJob
                        ? (language === 'vi' ? '⚡ Tuyển gấp (Quick Job)' : '⚡ Quick Job')
                        : (language === 'vi' ? '📋 Tiêu chuẩn (Standard Job)' : '📋 Standard Job')}
                    </div>
                  </div>
                </ModalInfoRow>
              )}
            </ModalBody>

            <ModalFooter>
              <ModalBtn
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedNotification(null)}
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </ModalBtn>
              {selectedNotification.type === 'application' && (
                <ModalBtn
                  $primary
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleGoToApplications(selectedNotification)}
                >
                  <Eye />
                  {language === 'vi'
                    ? (selectedNotification.isQuickJob ? 'Xem hồ sơ tuyển gấp' : 'Xem hồ sơ tiêu chuẩn')
                    : (selectedNotification.isQuickJob ? 'View Quick Job Applications' : 'View Standard Applications')}
                </ModalBtn>
              )}
            </ModalFooter>
          </ModalBox>
        </ModalOverlay>
      )}
    </DashboardLayout>
  );
};

export default EmployerNotifications;
