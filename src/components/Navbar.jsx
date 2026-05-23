import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Bell, Search, LogOut, User, Users, Briefcase, DollarSign, AlertCircle, Settings, Eye, CheckCircle, Star, UserPlus, History, Building2, Tag as TagIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import candidateProfileService from '../services/candidateProfileService';
import employerProfileService from '../services/employerProfileService';
import jobPostService from '../services/jobPostService';
import { getNotifications, getUnreadCount, markAsRead } from '../services/notificationService';
import RelativeTime from './RelativeTime';

const NavbarContainer = styled.nav`
  height: 80px;
  background: ${props => props.theme.colors.bgLight};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  background: ${props => props.theme.colors.bgLight}98;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
  overflow: visible;
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 28px;
  flex: 1;
  overflow: visible;
`;

const SearchBar = styled.div`
  position: relative;
  max-width: 500px;
  width: 100%;
  overflow: visible;
  
  input {
    width: 100%;
    padding: 14px 20px 14px 52px;
    border: 2px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.full};
    background: ${props => props.theme.colors.bgLight};
    color: ${props => props.theme.colors.text};
    font-size: 15px;
    font-weight: 500;
    transition: all ${props => props.theme.transitions.normal};
    
    &:focus {
      border-color: ${props => props.theme.colors.primary};
      box-shadow: 0 0 0 4px ${props => props.theme.colors.primary}15, 0 8px 16px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }
    
    &::placeholder {
      color: ${props => props.theme.colors.textLight};
    }
  }
  
  > svg {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: ${props => props.theme.colors.primary};
    opacity: 0.7;
    cursor: pointer;
    transition: all ${props => props.theme.transitions.normal};
    
    &:hover {
      color: ${props => props.theme.colors.primary};
      opacity: 1;
      transform: translateY(-50%) scale(1.1);
    }
  }
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SearchSuggestionDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.bgLight};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: 0 12px 40px rgba(0,0,0,0.18);
  z-index: 9999;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px 0;
  animation: slideDown 0.15s ease-out;

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 2px;
  }
`;

const SearchSuggestionItem = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: ${props => props.theme.colors.text};
  transition: background 0.15s;

  &:hover {
    background: ${props => props.theme.colors.bgDark};
    color: ${props => props.theme.colors.primary};
  }

  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.theme.colors.textLight};
    flex-shrink: 0;
  }

  .sub {
    font-size: 11px;
    color: ${props => props.theme.colors.textLight};
    margin-left: auto;
  }
`;

const SearchSuggestionHeader = styled.div`
  padding: 4px 16px 6px;
  font-size: 10px;
  font-weight: 800;
  color: ${props => props.theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const IconButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.theme.colors.bgDark};
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all ${props => props.theme.transitions.normal};
  border: 2px solid transparent;
  
  &:hover {
    background: ${props => props.theme.colors.gradientPrimary};
    color: white;
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => props.theme.colors.primary};
  }
  
  svg {
    width: 22px;
    height: 22px;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: #e41e3f;
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${props => props.theme.colors.bgLight};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  line-height: 1;
`;

const NotificationDropdown = styled.div`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 400px;
  max-height: 600px;
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  z-index: 1000;
  animation: slideDown 0.2s ease-out;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const NotificationHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    font-size: 20px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }
  
  button {
    color: ${props => props.theme.colors.primary};
    font-size: 14px;
    font-weight: 600;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    
    &:hover {
      background: ${props => props.theme.colors.bgDark};
    }
  }
`;

const NotificationTabs = styled.div`
  display: flex;
  padding: 8px 12px;
  gap: 8px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const NotificationTab = styled.button`
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.bgDark};
  }
`;

const NotificationList = styled.div`
  max-height: 480px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.bgDark};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 4px;
    
    &:hover {
      background: ${props => props.theme.colors.textLight};
    }
  }
`;

const NotificationItem = styled.div`
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.$unread ? props.theme.colors.bgDark : 'transparent'};
  
  &:hover {
    background: ${props => props.theme.colors.bgDark};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const NotificationIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${props => props.$color || props.theme.colors.primary}15;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => props.$color || props.theme.colors.primary};
  }
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
  
  .title {
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
  }
  
  .message {
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .time {
    font-size: 12px;
    color: ${props => props.theme.colors.primary};
    margin-top: 4px;
    font-weight: 600;
  }
`;

const NotificationDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary};
  flex-shrink: 0;
  margin-top: 4px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme.colors.gradientPrimary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  text-transform: uppercase;
  box-shadow: ${props => props.theme.shadows.sm};
  transition: all ${props => props.theme.transitions.normal};
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 20px;
  margin-left: 12px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.theme.colors.bgDark};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.normal};
  border: 2px solid transparent;
  
  &:hover {
    background: ${props => props.theme.colors.gradientPrimary};
    color: white;
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.intense};
    border-color: ${props => props.theme.colors.primary};
    
    ${Avatar} {
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
    }
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  
  span:first-child {
    font-size: 14px;
    font-weight: 500;
  }
  
  span:last-child {
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
  }
`;

const Navbar = ({ showSearch = true }) => {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState(() => JSON.parse(localStorage.getItem('jobSearchHistory') || '[]'));
  const [allJobTitles, setAllJobTitles] = useState([]);
  const searchBarRef = useRef(null);
  const [companyLogo, setCompanyLogo] = useState(() => localStorage.getItem('companyLogo') || '/OpPoReview/images/katinatlogo.jpg');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationTab, setNotificationTab] = useState('all');
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [employerProfile, setEmployerProfile] = useState(null);
  const notificationRef = useRef(null);

  // Load job titles for suggestions
  useEffect(() => {
    if (user?.role !== 'candidate') return;
    jobPostService.getAllActiveJobs().then(jobs => {
      const titles = [];
      const companies = [];
      const seen = new Set();
      jobs.forEach(j => {
        if (j.title && !seen.has(j.title)) { titles.push({ label: j.title, type: 'job' }); seen.add(j.title); }
        if (j.employerName && !seen.has(j.employerName)) { companies.push({ label: j.employerName, type: 'company' }); seen.add(j.employerName); }
      });
      setAllJobTitles([...titles, ...companies]);
    }).catch(() => {});
  }, [user]);

  // Generate suggestions when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      const history = JSON.parse(localStorage.getItem('jobSearchHistory') || '[]');
      setSearchHistory(history);
      setSearchSuggestions(history.slice(0, 6).map(h => ({ label: h, type: 'history' })));
      return;
    }
    const q = searchQuery.toLowerCase();
    const matched = allJobTitles.filter(s => s.label.toLowerCase().includes(q)).slice(0, 7);
    setSearchSuggestions(matched);
  }, [searchQuery, allJobTitles]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Get notifications from service
  const [realNotifications, setRealNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadNotifications = async () => {
      let effectiveUser = user;
      if (!effectiveUser) {
        try {
          const storedUser = localStorage.getItem('user');
          effectiveUser = storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
          console.error('❌ [Navbar] Failed to parse stored user:', error);
        }
      }

      if (!effectiveUser) {
        console.log('⚠️ No user, skipping notification load');
        return;
      }
      
      try {
        // CRITICAL FIX: Ensure we use UUID from Cognito, not email
        let userId;
        
        if (effectiveUser.role === 'admin') {
          userId = 'admin';
        } else {
          userId = effectiveUser.userId || effectiveUser.id;
          
          // If userId looks like an email, fetch the real UUID from Cognito
          if (!userId || userId.includes('@')) {
            console.warn('⚠️ [Navbar] userId is email, fetching UUID from Cognito...');
            try {
              const { fetchAuthSession } = await import('aws-amplify/auth');
              const session = await fetchAuthSession();
              if (session && session.tokens) {
                const uuidFromToken = session.tokens.idToken.payload.sub;
                console.log('✅ [Navbar] Got UUID from Cognito:', uuidFromToken);
                userId = uuidFromToken;
                
                // Update user object in localStorage
                const updatedUser = { ...effectiveUser, userId: uuidFromToken };
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }
            } catch (cognitoError) {
              console.error('❌ [Navbar] Failed to get UUID from Cognito:', cognitoError);
            }
          }
        }
        
        if (!userId || !effectiveUser.role) {
          console.log('⚠️ [Navbar] Missing userId or role, skipping notification load');
          return;
        }

        console.log('🔔 Loading notifications for:', { userId, role: effectiveUser.role, userObject: effectiveUser });
        
        const notifs = await getNotifications(userId, effectiveUser.role);
        console.log('📥 Received notifications:', notifs);
        console.log('📊 Notifications count:', notifs?.length || 0);
        
        const count = await getUnreadCount(userId, effectiveUser.role);
        console.log('📬 Unread count:', count);
        
        setRealNotifications(notifs || []);
        setUnreadCount(count || 0);
      } catch (error) {
        console.error('❌ Error loading notifications:', error);
        console.error('Error details:', error.message, error.stack);
      }
    };

    loadNotifications();
    
    // Poll every 10 seconds
    const interval = setInterval(loadNotifications, 10000);
    
    // Listen for user login events
    const handleUserLogin = () => {
      console.log('🔐 [Navbar] User logged in - reloading notifications...');
      // Wait a bit for user state to be fully updated
      setTimeout(loadNotifications, 500);
    };
    
    window.addEventListener('userLoggedIn', handleUserLogin);

    return () => {
      clearInterval(interval);
      window.removeEventListener('userLoggedIn', handleUserLogin);
    };
  }, [user]);

  // Use only real notifications from API
  const notifications = realNotifications;
  const filteredNotifications = notifications;

  useEffect(() => {
    const handleLogoChange = () => {
      setCompanyLogo(localStorage.getItem('companyLogo') || '/OpPoReview/images/katinatlogo.jpg');
    };
    window.addEventListener('logoChanged', handleLogoChange);
    return () => window.removeEventListener('logoChanged', handleLogoChange);
  }, []);

  // Fetch candidate profile if user is a candidate
  useEffect(() => {
    const fetchCandidateProfile = async () => {
      if (user?.role === 'candidate') {
        try {
          const profile = await candidateProfileService.getMyProfile();
          setCandidateProfile(profile);
        } catch (error) {
          console.error('Error fetching candidate profile:', error);
        }
      }
    };

    fetchCandidateProfile();
  }, [user]);

  // Fetch employer profile if user is an employer
  useEffect(() => {
    const fetchEmployerProfile = async () => {
      if (user?.role === 'employer') {
        try {
          const profile = await employerProfileService.getMyProfile();
          setEmployerProfile(profile);
        } catch (error) {
          console.error('Error fetching employer profile:', error);
        }
      }
    };

    fetchEmployerProfile();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const getRoleTranslation = (role) => {
    if (role === 'candidate') return t.login.roleCandidate;
    if (role === 'employer') return t.login.roleEmployer;
    if (role === 'admin') return t.login.roleAdmin;
    return role;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleNotifications = (e) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
  };

  const handleNotificationItemClick = () => {
    setShowNotifications(false);
    if (user?.role === 'candidate') {
      navigate('/candidate/notifications');
    } else if (user?.role === 'employer') {
      navigate('/employer/notifications');
    } else if (user?.role === 'admin') {
      navigate('/admin/notifications');
    }
  };

  const handleSettingsClick = () => {
    if (user?.role === 'candidate') {
      navigate('/candidate/settings');
    } else if (user?.role === 'employer') {
      navigate('/employer/settings');
    } else if (user?.role === 'admin') {
      navigate('/admin/settings');
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const history = JSON.parse(localStorage.getItem('jobSearchHistory') || '[]');
      const updated = [searchQuery.trim(), ...history.filter(h => h !== searchQuery.trim())].slice(0, 5);
      localStorage.setItem('jobSearchHistory', JSON.stringify(updated));
      setShowSearchSuggestions(false);
      navigate('/candidate/jobs', { state: { searchKeyword: searchQuery } });
    }
  };

  const handleSearchIconClick = () => {
    if (searchQuery.trim()) {
      const history = JSON.parse(localStorage.getItem('jobSearchHistory') || '[]');
      const updated = [searchQuery.trim(), ...history.filter(h => h !== searchQuery.trim())].slice(0, 5);
      localStorage.setItem('jobSearchHistory', JSON.stringify(updated));
      setShowSearchSuggestions(false);
      navigate('/candidate/jobs', { state: { searchKeyword: searchQuery } });
    }
  };

  const handleProfileClick = () => {
    if (user?.role === 'candidate') {
      navigate('/candidate/profile');
    } else if (user?.role === 'employer') {
      navigate('/employer/profile');
    } else if (user?.role === 'admin') {
      navigate('/admin/profile');
    }
  };

  return (
    <NavbarContainer>
      <NavLeft>
        {showSearch && (
          <SearchBar ref={searchBarRef}>
            <Search onClick={handleSearchIconClick} style={{ cursor: 'pointer' }} />
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm việc, công ty...' : 'Search jobs, companies...'}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchSuggestions(true); }}
              onFocus={() => setShowSearchSuggestions(true)}
              onKeyPress={handleSearch}
            />
            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <SearchSuggestionDropdown>
                {!searchQuery.trim() && searchSuggestions.some(s => s.type === 'history') && (
                  <SearchSuggestionHeader>{language === 'vi' ? 'Tìm kiếm gần đây' : 'Recent Searches'}</SearchSuggestionHeader>
                )}
                {searchQuery.trim() && (
                  <SearchSuggestionHeader>{language === 'vi' ? 'Gợi ý' : 'Suggestions'}</SearchSuggestionHeader>
                )}
                {searchSuggestions.map((s, i) => (
                  <SearchSuggestionItem
                    key={i}
                    onMouseDown={() => {
                      setSearchQuery(s.label);
                      setShowSearchSuggestions(false);
                      const history = JSON.parse(localStorage.getItem('jobSearchHistory') || '[]');
                      const updated = [s.label, ...history.filter(h => h !== s.label)].slice(0, 5);
                      localStorage.setItem('jobSearchHistory', JSON.stringify(updated));
                      navigate('/candidate/jobs', { state: { searchKeyword: s.label } });
                    }}
                  >
                    {s.type === 'history' ? <History /> : s.type === 'company' ? <Building2 /> : <Search />}
                    <span>{s.label}</span>
                    {s.type === 'company' && <span className="sub">{language === 'vi' ? 'Công ty' : 'Company'}</span>}
                  </SearchSuggestionItem>
                ))}
              </SearchSuggestionDropdown>
            )}
          </SearchBar>
        )}
      </NavLeft>

      <NavRight>
        <div style={{ position: 'relative' }} ref={notificationRef}>
          <IconButton onClick={toggleNotifications}>
            <Bell />
            {unreadCount > 0 && <Badge>{unreadCount > 99 ? '99+' : unreadCount}</Badge>}
          </IconButton>

          {showNotifications && (
            <NotificationDropdown>
              <NotificationHeader>
                <h3>{language === 'vi' ? 'Thông báo' : 'Notifications'}</h3>
                <button onClick={handleNotificationItemClick}>{language === 'vi' ? 'Xem tất cả' : 'View all'}</button>
              </NotificationHeader>

              <NotificationTabs>
                <NotificationTab
                  $active={notificationTab === 'all'}
                  onClick={() => setNotificationTab('all')}
                >
                  {language === 'vi' ? 'Tất cả' : 'All'}
                </NotificationTab>
                <NotificationTab
                  $active={notificationTab === 'unread'}
                  onClick={() => setNotificationTab('unread')}
                >
                  {language === 'vi' ? 'Chưa đọc' : 'Unread'}
                </NotificationTab>
              </NotificationTabs>

              <NotificationList>
                {filteredNotifications
                  .filter(n => notificationTab === 'all' || !n.read)
                  .map((notification) => {
                    // Check if this is a real notification from service or static one
                    const isRealNotification = notification.notificationId && notification.recipientId;
                    
                    // Get icon based on notification type
                    let Icon = Bell;
                    if (isRealNotification) {
                      switch (notification.type) {
                        case 'package_purchase_request':
                          Icon = Briefcase;
                          break;
                        case 'package_approved':
                          Icon = CheckCircle;
                          break;
                        case 'employers':
                          Icon = Building2;
                          break;
                        case 'posts':
                          Icon = AlertCircle;
                          break;
                        case 'payments':
                          Icon = DollarSign;
                          break;
                        case 'urgent':
                          Icon = AlertCircle;
                          break;
                        default:
                          Icon = Bell;
                      }
                    } else {
                      Icon = notification.icon;
                    }
                    
                    return (
                      <NotificationItem
                        key={isRealNotification ? notification.notificationId : notification.id}
                        $unread={isRealNotification ? !notification.read : notification.unread}
                        onClick={async () => {
                          if (isRealNotification) {
                            try {
                              await markAsRead(notification.notificationId);
                              setRealNotifications(prev => prev.map(n => 
                                n.notificationId === notification.notificationId ? { ...n, read: true } : n
                              ));
                              if (notification.actionUrl) {
                                navigate(notification.actionUrl);
                              }
                            } catch (error) {
                              console.error('Error marking notification as read:', error);
                            }
                          }
                          handleNotificationItemClick();
                        }}
                      >
                        <NotificationIcon $color={notification.color}>
                          <Icon />
                        </NotificationIcon>
                        <NotificationContent>
                          <div className="title">
                            {isRealNotification 
                              ? (language === 'vi' ? notification.title : notification.titleEn)
                              : notification.title}
                          </div>
                          <div className="message">
                            {isRealNotification
                              ? (language === 'vi' ? notification.message : notification.messageEn)
                              : notification.message}
                            {notification.jobTitle && (
                              <span> — {notification.jobTitle}</span>
                            )}
                          </div>
                          <div className="time">
                            {isRealNotification 
                              ? <RelativeTime timestamp={notification.createdAt} language={language} />
                              : notification.time}
                          </div>
                        </NotificationContent>
                        {(isRealNotification ? !notification.read : notification.unread) && <NotificationDot />}
                      </NotificationItem>
                    );
                  })}
              </NotificationList>
            </NotificationDropdown>
          )}
        </div>

        <IconButton onClick={handleSettingsClick} title={language === 'vi' ? 'Cài đặt' : 'Settings'}>
          <Settings />
        </IconButton>

        <UserMenu onClick={handleProfileClick}>
          <Avatar>
            {user?.role === 'employer' ? (
              employerProfile?.companyLogo ? (
                <img src={employerProfile.companyLogo} alt="Company Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <img src={companyLogo} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              )
            ) : user?.role === 'candidate' && candidateProfile?.profileImage ? (
              <img src={candidateProfile.profileImage} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              (candidateProfile?.fullName?.charAt(0) || user?.name?.charAt(0) || 'U').toUpperCase()
            )}
          </Avatar>
          <UserInfo>
            <span>{user?.role === 'employer' ? (employerProfile?.companyName || (language === 'vi' ? 'Chưa cập nhật tên công ty' : 'Company name not updated')) : (candidateProfile?.fullName || user?.name || 'User')}</span>
            <span>{getRoleTranslation(user?.role) || 'Role'}</span>
          </UserInfo>
        </UserMenu>

        <IconButton onClick={handleLogout}>
          <LogOut />
        </IconButton>
      </NavRight>
    </NavbarContainer>
  );
};

export default Navbar;

