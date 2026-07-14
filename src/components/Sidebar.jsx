import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { s3Images } from '../utils/s3Images';
import notificationService from '../services/notificationService';
import jobPostService from '../services/jobPostService';
import quickJobService from '../services/quickJobService';
import applicationService from '../services/applicationService';
import adminEmployerService from '../services/adminEmployerService';
import { getWithdrawalRequests } from '../services/packageCatalogService';
import candidateProfileService from '../services/candidateProfileService';
import feedbackService from '../services/feedbackService';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Bell, 
  Settings,
  FileText,
  Star,
  CreditCard,
  CheckCircle,
  BarChart3,
  Package,
  MapPin,
  ShieldCheck,
  Wallet,
  LogOut,
  UsersRound,
  User,
  Bookmark,
  Building2,
  Clock,
  Image,
  ArrowLeftRight
} from 'lucide-react';

const SidebarContainer = styled.aside`
  width: 80px;
  background: ${props => props.theme.colors.white};
  border-right: 1px solid ${props => props.theme.colors.border};
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.04);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
  z-index: 100;
  
  &:hover {
    width: 260px;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
  }
`;

const Logo = styled.div`
  padding: 28px 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}05 0%, transparent 100%);
  position: relative;
  min-height: 88px;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 48px;
    height: 3px;
    background: linear-gradient(90deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
    border-radius: 3px 3px 0 0;
    transition: all 0.3s ease;
  }
  
  ${SidebarContainer}:hover &::after {
    width: 120px;
  }
  
  img {
    height: 36px;
    transition: all 0.3s ease;
    filter: drop-shadow(0 2px 8px ${props => props.theme.colors.primary}20);
  }
  
  ${SidebarContainer}:hover & img {
    height: 40px;
  }
`;

const LogoText = styled.h1`
  font-size: 22px;
  font-weight: 700;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  color: ${props => props.theme.colors.primary};
  letter-spacing: -0.2px;
  line-height: 1.4;
  white-space: nowrap;
  opacity: 0;
  max-height: 0;
  overflow: visible;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(-10px);
  font-feature-settings: "kern" 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding-top: 2px;
  
  ${SidebarContainer}:hover & {
    opacity: 1;
    max-height: 45px;
    transform: translateY(0);
  }
`;

const Nav = styled.nav`
  flex: 1;
  padding: 16px 10px;
  overflow-y: auto;
  overflow-x: hidden;
  
  ${SidebarContainer}:hover & {
    padding: 16px 12px;
  }
  
  /* Optimize scrolling - prevent auto-scroll */
  scroll-behavior: auto !important;
  overscroll-behavior: contain;
  scroll-snap-type: none;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 2px;
    
    &:hover {
      background: ${props => props.theme.colors.primary};
    }
  }
`;

const NavSection = styled.div`
  margin-bottom: 20px;
  padding-bottom: 16px;
  
  &:first-child {
    margin-top: 4px;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid transparent;
  }
  
  ${SidebarContainer}:hover &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.colors.border};
    margin-bottom: 24px;
    padding-bottom: 20px;
  }
`;

const NavSectionTitle = styled.p`
  font-size: 10px;
  font-weight: 700;
  color: ${props => props.theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 8px;
  padding: 0 12px;
  white-space: nowrap;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(-10px);
  
  ${SidebarContainer}:hover & {
    opacity: 0.6;
    max-height: 24px;
    margin-bottom: 12px;
    transform: translateX(0);
  }
`;

const NavLink = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: ${props => props.theme.borderRadius.lg};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  background: ${props => props.$active ? `linear-gradient(135deg, ${props.theme.colors.primary}, ${props.theme.colors.secondary})` : 'transparent'};
  font-weight: ${props => props.$active ? 600 : 500};
  font-size: 14px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 4px;
  position: relative;
  cursor: pointer;
  user-select: none;
  outline: none;
  justify-content: center;
  
  ${SidebarContainer}:hover & {
    justify-content: flex-start;
    padding: 12px 14px;
    margin-bottom: 6px;
  }
  
  /* Active indicator bar */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: ${props => props.$active ? '60%' : '0'};
    background: white;
    transition: height 0.25s ease;
    border-radius: 0 3px 3px 0;
    opacity: ${props => props.$active ? 1 : 0};
  }
  
  /* Hover indicator bar */
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    background: ${props => props.theme.colors.primary};
    transition: height 0.25s ease;
    border-radius: 0 3px 3px 0;
    opacity: 0;
  }
  
  &:focus {
    outline: none;
  }
  
  &:focus-visible {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }
  
  svg {
    width: 22px;
    height: 22px;
    min-width: 22px;
    stroke-width: 2;
    transition: all 0.25s ease;
  }
  
  span {
    white-space: nowrap;
    opacity: 0;
    max-width: 0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  ${SidebarContainer}:hover & span {
    opacity: 1;
    max-width: 180px;
  }
  
  &:hover {
    background: ${props => props.$active 
      ? `linear-gradient(135deg, ${props.theme.colors.primary}, ${props.theme.colors.secondary})` 
      : `${props.theme.colors.primary}10`};
    color: ${props => props.$active ? 'white' : props.theme.colors.primary};
    transform: ${props => props.$active ? 'none' : 'translateX(2px)'};
    
    &::after {
      height: ${props => props.$active ? '0' : '50%'};
      opacity: ${props => props.$active ? 0 : 1};
    }
    
    svg {
      transform: ${props => props.$active ? 'scale(1.05)' : 'scale(1.1)'};
    }
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const IconWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Badge = styled.div`
  position: absolute;
  top: -8px;
  right: -10px;
  background: ${props => props.theme.colors.danger || '#ef4444'};
  color: white;
  border-radius: 99px;
  padding: 1px 5px;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  min-width: 15px;
  height: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid ${props => props.theme.colors.white || '#ffffff'};
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  z-index: 10;
`;

const Sidebar = ({ role, onHoverChange }) => {
  const { t, language } = useLanguage();
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);
  const isNavigatingRef = useRef(false);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [standardPendingCount, setStandardPendingCount] = useState(0);
  const [quickPendingCount, setQuickPendingCount] = useState(0);
  const [adminBadges, setAdminBadges] = useState({
    employers: 0,
    candidates: 0,
    posts: 0,
    wallet: 0,
    notifications: 0,
    reports: 0,
    changeRequests: 0
  });

  useEffect(() => {
    let active = true;
    let intervalId;

    const fetchCounts = async () => {
      const userId = role === 'admin' ? 'admin' : (user?.userId || user?.id || user?.email);
      if (!userId || !role) return;

      try {
        // 1. Fetch unread notifications count
        if (role === 'admin') {
          const [notifs, employers, changeRequestsRaw, standardJobsRaw, quickJobsRaw, withdrawalsRaw, candidatesRaw, feedbacksRaw] = await Promise.all([
            notificationService.getNotifications(userId, role).catch(() => []),
            adminEmployerService.getAllEmployers().catch(() => []),
            applicationService.listChangeRequests().catch(() => []),
            (jobPostService.getAllJobPosts ? jobPostService.getAllJobPosts() : jobPostService.getAllActiveJobs()).catch(() => []),
            (quickJobService.getAllQuickJobs ? quickJobService.getAllQuickJobs() : quickJobService.getAllActiveQuickJobs()).catch(() => []),
            getWithdrawalRequests().catch(() => []),
            candidateProfileService.getAllCandidates().catch(() => []),
            feedbackService.getAllFeedbacks().catch(() => [])
          ]);
          const unreadNotifs = notifs.filter(n => !n.read);
          
          const reportsCount = (feedbacksRaw || []).filter(item => item.status === 'unread').length;
          
          // pendingChangeCount = đúng theo server: chỉ status === 'pending_change'
          const pendingChangeCount = (changeRequestsRaw || []).filter(r => r.status === 'pending_change').length;
          
          // Badge employer = unread notifications liên quan đến employer (bấm vào xem → hết badge)
          const employersCount = unreadNotifs.filter(n => n.actionUrl === '/admin/employers').length;
          const candidatesCount = unreadNotifs.filter(n => (n.actionUrl === '/admin/candidates' || n.actionUrl === '/admin/candidates?tab=experiences' || n.actionUrl === '/admin/experiences') && n.type !== 'candidate_withdrawal_request').length;

          // Calculate pending standard and quick jobs (neither approved nor rejected)
          const standardList = Array.isArray(standardJobsRaw) ? standardJobsRaw : (standardJobsRaw?.data || []);
          const quickList = Array.isArray(quickJobsRaw) ? quickJobsRaw : (quickJobsRaw?.data || []);
          const getPendingCount = (list) => {
            return (list || []).filter(job => {
              const status = typeof job.status === 'string' ? job.status.trim().toLowerCase() : '';
              const isApproved = ['active', 'approved', 'ai-approved'].includes(status);
              const isRejected = ['closed', 'deleted', 'rejected'].includes(status);
              return !isApproved && !isRejected;
            }).length;
          };
          const pendingStandardCount = getPendingCount(standardList);
          const pendingQuickCount = getPendingCount(quickList);
          const pendingChangeRequestsCount = (changeRequestsRaw || []).filter(r => r.status === 'pending_change').length;

          const postsCount = pendingStandardCount + pendingQuickCount + pendingChangeRequestsCount;

          // Calculate pending withdrawal requests (status === 'pending') for employers and candidates
          const pendingEmployerWithdrawals = (withdrawalsRaw || []).filter(w => (w.status === 'pending' || !w.status) && w.isCandidate !== true).length;
          let pendingCandidateWithdrawals = 0;
          if (Array.isArray(candidatesRaw)) {
            candidatesRaw.forEach(c => {
              if (Array.isArray(c.withdrawals)) {
                c.withdrawals.forEach(w => {
                  const status = w.status || 'pending';
                  if (status === 'pending') {
                    pendingCandidateWithdrawals++;
                  }
                });
              }
            });
          }
          const walletCount = pendingEmployerWithdrawals + pendingCandidateWithdrawals;
          const totalUnreadCount = unreadNotifs.length;
          
          if (active) {
            setAdminBadges({
              employers: employersCount,
              candidates: candidatesCount,
              posts: postsCount,
              wallet: walletCount,
              notifications: totalUnreadCount,
              reports: reportsCount,
              changeRequests: pendingChangeCount
            });
            setUnreadNotifications(totalUnreadCount);
          }
        } else {
          const count = await notificationService.getUnreadCount(userId, role);
          if (active) setUnreadNotifications(count);
        }

        // 2. Fetch unread chat count
        let chatCount = 0;
        if (role === 'candidate') {
          const apps = await applicationService.getMyCandidateApplications().catch(() => []);
          apps.forEach(app => {
            if (app.status === 'completed' || app.status === 'completed_pending_candidate' || app.status === 'ĐÃ_BỊ_THAY_THẾ' || app.status === 'change_approved') {
              return;
            }
            let messages = app.chatMessages || [];
            const savedMessages = localStorage.getItem(`chat_${app.applicationId}`);
            if (savedMessages) {
              try {
                const localMsgs = JSON.parse(savedMessages);
                if (localMsgs.length > messages.length) messages = localMsgs;
              } catch (e) {}
            }
            if (messages.length > 0) {
              const lastMsg = messages[messages.length - 1];
              if (lastMsg && lastMsg.sender === 'me') {
                const lastReadId = localStorage.getItem(`chat_read_${app.applicationId}`);
                if (lastReadId !== String(lastMsg.id)) {
                  chatCount++;
                }
              }
            }
          });
        } else if (role === 'employer') {
          const quickJobs = await quickJobService.getMyQuickJobs().catch(() => []);
          for (const job of quickJobs) {
            const apps = await applicationService.getJobApplications(job.idJob || job.id).catch(() => []);
            apps.forEach(app => {
              if (app.status === 'accepted') {
                let messages = app.chatMessages || [];
                const savedMessages = localStorage.getItem(`chat_${app.applicationId}`);
                if (savedMessages) {
                  try {
                    const localMsgs = JSON.parse(savedMessages);
                    if (localMsgs.length > messages.length) messages = localMsgs;
                  } catch (e) {}
                }
                if (messages.length > 0) {
                  const lastMsg = messages[messages.length - 1];
                  if (lastMsg && lastMsg.sender === 'them') {
                    const lastReadId = localStorage.getItem(`chat_read_employer_${app.applicationId}`);
                    if (lastReadId !== String(lastMsg.id)) {
                      chatCount++;
                    }
                  }
                }
              }
            });
          }
        }
        if (active) setUnreadChatCount(chatCount);

        // 3. Fetch applications counts for employer
        if (role === 'employer') {
          // Helper to check if application has been viewed by employer
          const isViewedByEmployer = (applicationId) => {
            const userId = user?.userId || user?.id || user?.email;
            if (!userId || !applicationId) return false;
            const viewedKey = `employer_viewed_apps_${userId}`;
            const viewedApps = JSON.parse(localStorage.getItem(viewedKey) || '[]');
            return viewedApps.includes(applicationId);
          };

          // Standard Job Applications Count (status === 'pending' AND not viewed)
          const stdJobs = await jobPostService.getMyJobPosts();
          if (stdJobs && stdJobs.length > 0) {
            const stdPromises = stdJobs.map(job =>
              applicationService.getJobApplications(job.idJob).catch(() => [])
            );
            const stdAppsList = await Promise.all(stdPromises);
            const pendingStdCount = stdAppsList.flat().filter(app => 
              app.status === 'pending' && !isViewedByEmployer(app.applicationId)
            ).length;
            if (active) setStandardPendingCount(pendingStdCount);
          } else {
            if (active) setStandardPendingCount(0);
          }

          // Quick Job Applications Count (Chờ xác nhận & Chờ thay đổi)
          const quickJobs = await quickJobService.getMyQuickJobs();
          if (quickJobs && quickJobs.length > 0) {
            const quickPromises = quickJobs.map(job =>
              applicationService.getJobApplications(job.id || job.idJob || job.jobID).catch(() => [])
            );
            const quickAppsList = await Promise.all(quickPromises);
            const pendingQCount = quickAppsList.flat().filter(app => {
              const status = app.status || 'pending';
              const changeStatus = app.changeRequestStatus || app.change_request_status || app.changeRequest?.status || app.change_request?.status;
              const hasPendingChange = changeStatus && !['approved', 'rejected', 'cancelled'].includes(String(changeStatus).toLowerCase());
              return status === 'pending' || status === 'pending_change' || hasPendingChange;
            }).length;
            if (active) setQuickPendingCount(pendingQCount);
          } else {
            if (active) setQuickPendingCount(0);
          }
        }
      } catch (error) {
        console.error('Error fetching sidebar counts:', error);
      }
    };

    fetchCounts();
    intervalId = setInterval(fetchCounts, 10000); // poll every 10s

    const handleUpdate = () => {
      fetchCounts();
    };

    window.addEventListener('newFeedbackSubmitted', handleUpdate);
    window.addEventListener('feedbackStatusChanged', handleUpdate);
    window.addEventListener('applicationsViewed', handleUpdate);

    return () => {
      active = false;
      clearInterval(intervalId);
      window.removeEventListener('newFeedbackSubmitted', handleUpdate);
      window.removeEventListener('feedbackStatusChanged', handleUpdate);
      window.removeEventListener('applicationsViewed', handleUpdate);
    };
  }, [user, role]);

  const handleMouseEnter = () => {
    if (onHoverChange) onHoverChange(true);
  };
  
  const handleMouseLeave = () => {
    if (onHoverChange) onHoverChange(false);
  };
  
  // Save scroll position to sessionStorage whenever it changes
  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;
    
    const handleScroll = () => {
      if (!isNavigatingRef.current) {
        sessionStorage.setItem('sidebarScrollPos', navElement.scrollTop.toString());
      }
    };
    
    navElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => navElement.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Restore scroll position from sessionStorage after navigation
  useLayoutEffect(() => {
    const savedScrollPos = sessionStorage.getItem('sidebarScrollPos');
    
    if (navRef.current && savedScrollPos !== null) {
      const scrollPos = parseInt(savedScrollPos, 10);
      
      // Set scroll immediately
      navRef.current.scrollTop = scrollPos;
      
      // Double check after a small delay
      const timeoutId = setTimeout(() => {
        if (navRef.current) {
          navRef.current.scrollTop = scrollPos;
        }
        isNavigatingRef.current = false;
      }, 10);
      
      return () => clearTimeout(timeoutId);
    }
    
    isNavigatingRef.current = false;
  }, [location.pathname]);
  
  const handleNavClick = async (link, e) => {
    if (link.to === '#') {
      e?.preventDefault();
      return;
    }
    
    if (link.isLogout) {
      e?.preventDefault();
      await logout();
      navigate('/', { replace: true });
      return;
    }
    
    e?.preventDefault();
    isNavigatingRef.current = true;
    
    if (navRef.current) {
      sessionStorage.setItem('sidebarScrollPos', navRef.current.scrollTop.toString());
    }
    
    // special case for standard jobs section
    if (link.to === '/employer/standard-jobs') {
      navigate(link.to, { state: { section: 'posts' } });
    } else {
      navigate(link.to);
    }
  };
  
  const candidateLinks = [
    { section: t.sidebar.main, items: [
      { to: '/candidate/dashboard', icon: LayoutDashboard, label: t.sidebar.dashboard },
      { to: '/candidate/jobs', icon: Briefcase, label: t.sidebar.findJobs },
    ]},
    { section: t.sidebar.communication, items: [
      { to: '/candidate/notifications', icon: Bell, label: t.sidebar.notifications },
    ]},
    { section: t.sidebar.account, items: [
      { to: '/candidate/profile', icon: Users, label: t.sidebar.myProfile },
    ]},
    { section: t.sidebar.utilities, items: [
      { to: '/candidate/wallet', icon: Wallet, label: t.sidebar.digitalWallet },
      { to: 'logout', icon: LogOut, label: language === 'vi' ? 'Đăng xuất' : 'Log Out', isLogout: true }
    ]}
  ];
  
  const employerLinks = [
    { section: t.sidebar.main, items: [
      { to: '/employer/dashboard', icon: LayoutDashboard, label: t.sidebar.dashboard },
      { to: '/employer/standard-jobs', icon: Briefcase, label: t.sidebar.applications },
      { to: '/employer/quick-jobs', icon: Clock, label: t.sidebar.userManagement || 'HR Management' },
    ]},
    { section: t.sidebar.communication, items: [
      { to: '/employer/notifications', icon: Bell, label: t.sidebar.notifications },
    ]},
    { section: t.sidebar.account, items: [
      { to: '/employer/profile', icon: Users, label: t.sidebar.companyProfile },
      { to: '/employer/subscription', icon: CreditCard, label: t.sidebar.subscription },
    ]},
    { section: t.sidebar.utilities, items: [
      { to: '/employer/analytics', icon: BarChart3, label: t.sidebar.reports || 'Analytics' },
      { to: '/employer/wallet', icon: Wallet, label: t.sidebar.digitalWallet },
      { to: 'logout', icon: LogOut, label: language === 'vi' ? 'Đăng xuất' : 'Log Out', isLogout: true }
    ]}
  ];
  
  const adminLinks = [
    { section: t.sidebar.main, items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: t.sidebar.dashboard },
      { to: '/admin/candidates', icon: Users, label: language === 'vi' ? 'Ứng Viên' : 'Candidates' },
      { to: '/admin/employers', icon: Building2, label: language === 'vi' ? 'Nhà Tuyển Dụng' : 'Employers' },
      { to: '/admin/management', icon: ShieldCheck, label: language === 'vi' ? 'Quản Lý Admin' : 'Admin Management' },
    ]},
    { section: t.sidebar.platform || 'Management', items: [
      { to: '/admin/posts', icon: FileText, label: language === 'vi' ? 'Quản lý bài đăng' : 'Posts Management' },
      { to: '/admin/banners', icon: Image, label: language === 'vi' ? 'Quản lý Banner' : 'Banner Management' },
      { to: '/admin/change-requests', icon: ArrowLeftRight, label: language === 'vi' ? 'Yêu cầu thay đổi' : 'Change Requests' },
      { to: '/admin/packages', icon: Package, label: t.sidebar.packages },
      { to: '/admin/reports', icon: BarChart3, label: t.sidebar.reports },
    ]},
    { section: t.sidebar.utilities || 'Utilities', items: [
      { to: '/admin/wallet', icon: Wallet, label: t.sidebar.digitalWallet },
      { to: '/admin/notifications', icon: Bell, label: t.sidebar.notifications },
      { to: '/admin/profile', icon: User, label: t.sidebar.myProfile },
      { to: 'logout', icon: LogOut, label: language === 'vi' ? 'Đăng xuất' : 'Log Out', isLogout: true }
    ]}
  ];
  
  const links = role === 'candidate' ? candidateLinks 
    : role === 'employer' ? employerLinks 
    : adminLinks;
  
  return (
    <SidebarContainer 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Logo>
        <img src={s3Images.system.logo} alt="Ốp Pờ" style={{ height: '60px' }} />
        <LogoText>Ốp Pờ</LogoText>
      </Logo>
      
      <Nav ref={navRef}>
        {links.map((section, idx) => (
          <NavSection key={idx}>
            <NavSectionTitle>{section.section}</NavSectionTitle>
            {section.items.map((link, linkIdx) => {
              const Icon = link.icon;
              
              let badgeCount = 0;
              if (role === 'admin') {
                if (link.to === '/admin/employers') {
                  badgeCount = adminBadges.employers;
                } else if (link.to === '/admin/candidates') {
                  badgeCount = adminBadges.candidates;
                } else if (link.to === '/admin/posts') {
                  badgeCount = adminBadges.posts;
                } else if (link.to === '/admin/wallet') {
                  badgeCount = adminBadges.wallet;
                } else if (link.to === '/admin/notifications') {
                  badgeCount = adminBadges.notifications;
                } else if (link.to === '/admin/reports') {
                  badgeCount = adminBadges.reports;
                } else if (link.to === '/admin/change-requests') {
                  badgeCount = adminBadges.changeRequests || 0;
                }
              } else {
                if (link.to.endsWith('/notifications')) {
                  badgeCount = unreadNotifications + unreadChatCount;
                } else if (link.to === '/employer/standard-jobs') {
                  badgeCount = standardPendingCount;
                } else if (link.to === '/employer/quick-jobs') {
                  badgeCount = quickPendingCount;
                }
              }

              return (
                <NavLink
                  key={linkIdx}
                  $active={location.pathname === link.to}
                  onClick={(e) => handleNavClick(link, e)}
                  onMouseDown={(e) => e.preventDefault()}
                  tabIndex={0}
                >
                  <IconWrapper>
                    <Icon />
                    {badgeCount > 0 && (
                      <Badge>{badgeCount > 99 ? '99+' : badgeCount}</Badge>
                    )}
                  </IconWrapper>
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </NavSection>
        ))}
      </Nav>
    </SidebarContainer>
  );
};

export default Sidebar;

