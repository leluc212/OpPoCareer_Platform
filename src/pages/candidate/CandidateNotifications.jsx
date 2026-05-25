import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import RelativeTime from '../../components/RelativeTime';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markAsRead, setNotificationDeleted } from '../../services/notificationService';
import {
  Bell,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Eye,
  Clock,
  X,
  TrendingUp,
  Inbox,
  Mail
} from 'lucide-react';

const NotificationsContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const PageHeader = styled(motion.div)`
  background: linear-gradient(135deg, #1e40af 0%, #1e40af 100%);
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 48px;
  margin-bottom: 32px;
  color: white;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    border-radius: 50%;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    border-radius: 50%;
  }
  
  .header-content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-left {
      flex: 1;
      
      h1 {
        font-size: 36px;
        font-weight: 800;
        margin-bottom: 12px;
        letter-spacing: -0.5px;
        display: flex;
        align-items: center;
        gap: 16px;
        
        svg {
          width: 40px;
          height: 40px;
        }
      }
      
      p {
        font-size: 16px;
        opacity: 0.9;
        font-weight: 400;
      }
    }
    
    .header-stats {
      display: flex;
      gap: 24px;
      
      .stat-item {
        text-align: center;
        
        .stat-value {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 13px;
          opacity: 0.8;
          font-weight: 500;
        }
      }
    }
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FilterBar = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const FilterButton = styled(motion.button)`
  padding: 10px 20px;
  border-radius: 24px;
  border: none;
  background: ${props => props.$active
    ? 'linear-gradient(135deg, #1e40af 0%, #1e40af 100%)'
    : props.theme.colors.bgLight};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${props => props.$active
    ? '0 4px 12px rgba(30, 64, 175, 0.4)'
    : '0 2px 8px rgba(0, 0, 0, 0.08)'};
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  .badge {
    background: ${props => props.$active ? 'rgba(255, 255, 255, 0.3)' : props.theme.colors.primary};
    color: ${props => props.$active ? 'white' : 'white'};
    padding: 2px 7px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    min-width: 20px;
    text-align: center;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$active
    ? '0 6px 16px rgba(30, 64, 175, 0.5)'
    : '0 4px 12px rgba(0, 0, 0, 0.12)'};
    ${props => !props.$active && `
      background: ${props.theme.colors.bgDark};
    `}
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const NotificationCard = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 24px;
  border: 1px solid ${props => props.$unread ? props.theme.colors.primary : props.theme.colors.border};
  border-left: 4px solid ${props => props.$borderColor || props.theme.colors.border};
  display: flex;
  gap: 16px;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  
  &:hover {
    transform: translateX(4px);
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => props.$borderColor || props.theme.colors.primary};
  }
  
  ${props => props.$unread && `
    background: linear-gradient(135deg, rgba(30, 64, 175, 0.03) 0%, rgba(30, 64, 175, 0.03) 100%);
  `}
`;

const NotificationIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.$color || props.theme.colors.primary}15;
  color: ${props => props.$color || props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 28px;
    height: 28px;
  }
`;

const NotificationContent = styled.div`
  flex: 1;
  
  h3 {
    font-size: 17px;
    font-weight: 700;
    margin-bottom: 6px;
    color: ${props => props.theme.colors.text};
    display: flex;
    align-items: center;
    gap: 8px;
    
    .unread-badge {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${props => props.theme.colors.primary};
    }
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.colors.text};
    opacity: 0.85;
    margin-bottom: 10px;
    line-height: 1.6;
    font-weight: 500;
  }
  
  .notification-footer {
    display: flex;
    align-items: center;
    gap: 16px;
    
    time {
      font-size: 13px;
      color: ${props => props.theme.colors.text};
      opacity: 0.7;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
      
      svg {
        width: 14px;
        height: 14px;
      }
    }
  }
`;

const ActionButton = styled(motion.button)`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.bgDark};
  color: ${props => props.theme.colors.textLight};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: ${props => props.theme.colors.primary};
    color: white;
    border-color: ${props => props.theme.colors.primary};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const UndoToastWrap = styled(motion.div)`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 10000;
  display: flex;
  justify-content: flex-end;
`;

const UndoToast = styled.div`
  background: #0f172a;
  color: #f8fafc;
  border-radius: 14px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.25);
  border: 1px solid rgba(148, 163, 184, 0.2);
`;

const UndoMessage = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const UndoButton = styled.button`
  background: #e2e8f0;
  color: #0f172a;
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #ffffff;
    transform: translateY(-1px);
  }
`;

const Card = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 24px;
  border: 1px solid ${props => props.theme.colors.border};
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      display: flex;
      align-items: center;
      gap: 10px;
      
      svg {
        width: 20px;
        height: 20px;
        color: ${props => props.theme.colors.primary};
      }
    }
  }
`;

const QuickStats = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
`;

const StatItem = styled.div`
  padding: 16px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: ${props => props.theme.borderRadius.lg};
  border-left: 4px solid ${props => props.$color || props.theme.colors.primary};
  
  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    
    .stat-label {
      font-size: 13px;
      color: ${props => props.theme.colors.textLight};
      font-weight: 600;
    }
    
    svg {
      width: 18px;
      height: 18px;
      color: ${props => props.$color || props.theme.colors.primary};
    }
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 800;
    color: ${props => props.$color || props.theme.colors.primary};
  }
`;

const ActivityItem = styled.div`
  padding: 14px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: ${props => props.theme.borderRadius.lg};
  margin-bottom: 10px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
  }
  
  p {
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
  }
`;

function CandidateNotifications() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');

  const getIconForType = (type) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'application':
        return Briefcase;
      case 'system':
        return AlertCircle;
      default:
        return Bell;
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'application':
        return '#1e40af';
      case 'system':
        return '#ef4444';
      default:
        return '#1e40af';
    }
  };

  const [notifications, setNotifications] = useState([]);
  const [undoInfo, setUndoInfo] = useState(null);
  const undoTimerRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    let userId = user.userId || user.id || user.email;
    if (!userId || userId.includes('@')) {
      try {
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const session = await fetchAuthSession();
        if (session && session.tokens) {
          userId = session.tokens.idToken.payload.sub;
        }
      } catch (error) {
        console.error('❌ [CandidateNotifications] Failed to get UUID from Cognito:', error);
      }
    }

    if (!userId) return;

    try {
      const notifs = await getNotifications(userId, 'candidate');
      const mapped = (notifs || []).map(notif => ({
        id: notif.notificationId,
        type: notif.type || 'system',
        icon: getIconForType(notif.type),
        color: notif.color || getColorForType(notif.type),
        isQuickJob: notif.data?.isQuickJob ?? true,
        title: language === 'vi' ? notif.title : (notif.titleEn || notif.title),
        message: language === 'vi' ? notif.message : (notif.messageEn || notif.message),
        createdAt: notif.createdAt,
        unread: !notif.read,
        actionUrl: notif.actionUrl
      }));

      setNotifications(mapped);
    } catch (error) {
      console.error('❌ [CandidateNotifications] Error loading notifications:', error);
    }
  }, [user, language]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
  }, []);

  const handleRemoveNotification = async (notification, index) => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    setUndoInfo({ notification, index });

    undoTimerRef.current = setTimeout(() => {
      setUndoInfo(null);
      undoTimerRef.current = null;
    }, 5000);

    const success = await setNotificationDeleted(notification.id, true);
    if (!success) {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      setUndoInfo(null);
      setNotifications(prev => {
        if (prev.some(n => n.id === notification.id)) return prev;
        const next = [...prev];
        const safeIndex = Math.min(index, next.length);
        next.splice(safeIndex, 0, notification);
        return next;
      });
    }
  };

  const handleUndoDelete = async () => {
    if (!undoInfo) return;

    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    const { notification, index } = undoInfo;
    setUndoInfo(null);

    setNotifications(prev => {
      if (prev.some(n => n.id === notification.id)) return prev;
      const next = [...prev];
      const safeIndex = Math.min(index, next.length);
      next.splice(safeIndex, 0, notification);
      return next;
    });

    await setNotificationDeleted(notification.id, false);
  };

  const handleMarkAsRead = async (id) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, unread: false } : n
    ));
    await markAsRead(id);
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : filter === 'unread'
      ? notifications.filter(n => n.unread)
      : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <DashboardLayout role="candidate" showSearch={false} key={language}>
      <NotificationsContainer>
        <PageHeader
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="header-content">
            <div className="header-left">
              <h1><Bell />{language === 'vi' ? 'Thông Báo' : 'Notifications'}</h1>
              <p>{language === 'vi' ? 'Cập nhật mới nhất về công việc và hồ sơ của bạn' : 'Latest updates about your jobs and profile'}</p>
            </div>
            <div className="header-stats">
              <div className="stat-item">
                <div className="stat-value">{notifications.length}</div>
                <div className="stat-label">{language === 'vi' ? 'Tổng số' : 'Total'}</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{unreadCount}</div>
                <div className="stat-label">{language === 'vi' ? 'Chưa đọc' : 'Unread'}</div>
              </div>
            </div>
          </div>
        </PageHeader>

        <ContentGrid>
          <MainContent>
            <FilterBar
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <FilterButton
                $active={filter === 'all'}
                onClick={() => setFilter('all')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Inbox />
                <span>{language === 'vi' ? 'Tất cả' : 'All'}</span>
                <span className="badge">{notifications.length}</span>
              </FilterButton>
              <FilterButton
                $active={filter === 'unread'}
                onClick={() => setFilter('unread')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mail />
                <span>{language === 'vi' ? 'Chưa đọc' : 'Unread'}</span>
                <span className="badge">{unreadCount}</span>
              </FilterButton>
            </FilterBar>

            {filteredNotifications.map((notif, index) => (
              <NotificationCard
                key={notif.id}
                $unread={notif.unread}
                $borderColor={notif.color}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                onClick={() => handleMarkAsRead(notif.id)}
                whileHover={{ scale: 1.01 }}
              >
                <NotificationIcon $color={notif.color}>
                  <notif.icon />
                </NotificationIcon>
                <NotificationContent>
                  <h3>
                    {notif.title}
                    {notif.unread && <span className="unread-badge" />}
                  </h3>
                  <p>{notif.message}</p>
                  <div className="notification-footer">
                    <time>
                      <Clock />
                      <RelativeTime timestamp={notif.createdAt} language={language} />
                    </time>
                  </div>
                </NotificationContent>
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveNotification(notif, index);
                  }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X />
                </ActionButton>
              </NotificationCard>
            ))}

            {filteredNotifications.length === 0 && (
              <Card
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', padding: '60px 20px' }}
              >
                <Bell size={48} style={{ color: '#CBD5E1', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#E2E8F0' }}>
                  {language === 'vi' ? 'Không có thông báo' : 'No notifications'}
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '14px' }}>
                  {filter === 'unread'
                    ? (language === 'vi' ? 'Bạn đã đọc tất cả thông báo' : 'You have read all notifications')
                    : (language === 'vi' ? 'Không có thông báo nào trong mục này' : 'No notifications in this category')}
                </p>
              </Card>
            )}
          </MainContent>

          <Sidebar>
            <Card
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="card-header">
                <h2><TrendingUp />{language === 'vi' ? 'Thống kê' : 'Statistics'}</h2>
              </div>

              <QuickStats>
                <StatItem $color="#1e40af">
                  <div className="stat-header">
                    <span className="stat-label">{language === 'vi' ? 'Thông báo hôm nay' : 'Today\'s notifications'}</span>
                    <Bell />
                  </div>
                  <div className="stat-value">{notifications.filter(n => {
                    const notifTime = new Date(n.createdAt).getTime();
                    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
                    return notifTime > dayAgo;
                  }).length}</div>
                </StatItem>

                <StatItem $color="#10B981">
                  <div className="stat-header">
                    <span className="stat-label">{language === 'vi' ? 'Lượt xem hồ sơ' : 'Profile views'}</span>
                    <Eye />
                  </div>
                  <div className="stat-value">{notifications.filter(n => n.type === 'application' && (n.title.includes('xem') || n.title.includes('viewed'))).length}</div>
                </StatItem>

                <StatItem $color="#10B981">
                  <div className="stat-header">
                    <span className="stat-label">{language === 'vi' ? 'Hồ sơ được chấp nhận' : 'Accepted applications'}</span>
                    <CheckCircle />
                  </div>
                  <div className="stat-value">{notifications.filter(n => n.type === 'success' && n.title.includes(language === 'vi' ? 'chấp nhận' : 'accepted')).length}</div>
                </StatItem>
              </QuickStats>
            </Card>

            <Card
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="card-header">
                <h2><Clock />{language === 'vi' ? 'Hoạt động gần đây' : 'Recent Activity'}</h2>
              </div>

              {notifications.slice(0, 4).map((notif) => (
                <ActivityItem key={notif.id}>
                  <h4>{notif.title}</h4>
                  <p><RelativeTime timestamp={notif.createdAt} language={language} /></p>
                </ActivityItem>
              ))}
            </Card>
          </Sidebar>
        </ContentGrid>
      </NotificationsContainer>

      {undoInfo && (
        <UndoToastWrap
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
        >
          <UndoToast>
            <UndoMessage>
              {language === 'vi' ? 'Thông báo đã được xóa' : 'Notification deleted'}
            </UndoMessage>
            <UndoButton onClick={handleUndoDelete}>
              {language === 'vi' ? 'Hoàn tác' : 'Undo'}
            </UndoButton>
          </UndoToast>
        </UndoToastWrap>
      )}
    </DashboardLayout>
  );
}

export default CandidateNotifications;
