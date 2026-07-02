import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import UnderDevelopmentModal from '../../components/UnderDevelopmentModal';

import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/FormElements';
import candidateProfileService from '../../services/candidateProfileService';
import {
  Bell,
  Mail,
  MessageSquare,
  Globe,
  Moon,
  Sun,
  Lock,
  Shield,
  FileText,
  Trash2,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  User,
  Phone,
  Key,
  Download,
  ChevronRight,
  Check
} from 'lucide-react';

const SettingsContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px 32px;
`;

const PageHeader = styled(motion.div)`
  background: linear-gradient(135deg, #1e40af 0%, #1e40af 100%);
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 56px 48px;
  margin-bottom: 40px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(30, 64, 175, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
    border-radius: 50%;
    animation: float 6s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    animation: float 8s ease-in-out infinite reverse;
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-20px) scale(1.05);
    }
  }
  
  .header-content {
    position: relative;
    z-index: 1;
    
    h1 {
      font-size: 42px;
      font-weight: 800;
      margin-bottom: 16px;
      letter-spacing: -1px;
      display: flex;
      align-items: center;
      gap: 18px;
      text-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
      
      svg {
        width: 44px;
        height: 44px;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
      }
    }
    
    p {
      font-size: 18px;
      opacity: 0.95;
      font-weight: 400;
      letter-spacing: 0.2px;
    }
  }
`;

const ContentGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 900px;
  margin: 0 auto;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Sidebar = styled.div`
  display: none;
`;

const Card = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 40px;
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 2px solid ${props => props.theme.colors.border};
    
    h2 {
      font-size: 24px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      display: flex;
      align-items: center;
      gap: 14px;
      
      svg {
        width: 28px;
        height: 28px;
        color: ${props => props.theme.colors.primary};
      }
    }
  }
`;

const SettingItem = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    border-color: ${props => props.$color || props.theme.colors.primary};
    transform: translateX(8px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    background: ${props => props.theme.colors.bgLight};
  }
  
  .setting-left {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 20px;
    
    .icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: ${props => props.theme.borderRadius.lg};
      background: linear-gradient(135deg, ${props => props.$color || props.theme.colors.primary}15, ${props => props.$color || props.theme.colors.primary}25);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px ${props => props.$color || props.theme.colors.primary}20;
      
      svg {
        width: 26px;
        height: 26px;
        color: ${props => props.$color || props.theme.colors.primary};
      }
    }
    
    .setting-info {
      flex: 1;
      
      h3 {
        font-size: 17px;
        font-weight: 700;
        color: ${props => props.theme.colors.text};
        margin-bottom: 8px;
      }
      
      p {
        font-size: 14px;
        color: ${props => props.theme.colors.textLight};
        line-height: 1.6;
      }
    }
  }
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  flex-shrink: 0;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
    
    &:checked + span {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
    }
    
    &:checked + span:before {
      transform: translateX(26px);
    }
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #CBD5E1;
    border-radius: 34px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    &:before {
      position: absolute;
      content: '';
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background: white;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
    }
  }
`;

const LanguageOptions = styled.div`
  display: flex;
  gap: 14px;
`;

const LanguageButton = styled(motion.button)`
  padding: 12px 24px;
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 2px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.$active ? 'linear-gradient(135deg, #1e40af 0%, #1e40af 100%)' : 'transparent'};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  box-shadow: ${props => props.$active ? '0 4px 16px rgba(30, 64, 175, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.05)'};
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-3px);
    box-shadow: 0 6px 20px ${props => props.$active ? 'rgba(30, 64, 175, 0.4)' : 'rgba(30, 64, 175, 0.15)'};
  }
  
  &:active {
    transform: translateY(-1px);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const PolicyItem = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    border-color: ${props => props.$color || props.theme.colors.primary};
    transform: translateX(8px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    background: ${props => props.theme.colors.bgLight};
    
    .icon {
      transform: scale(1.1);
    }
    
    > svg {
      transform: translateX(4px);
      color: ${props => props.$color || props.theme.colors.primary};
    }
  }
  
  .policy-left {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
    
    .icon {
      width: 56px;
      height: 56px;
      border-radius: ${props => props.theme.borderRadius.lg};
      background: linear-gradient(135deg, ${props => props.$color || props.theme.colors.primary}15, ${props => props.$color || props.theme.colors.primary}25);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
      flex-shrink: 0;
      box-shadow: 0 4px 12px ${props => props.$color || props.theme.colors.primary}20;
      
      svg {
        width: 26px;
        height: 26px;
        color: ${props => props.$color || props.theme.colors.primary};
      }
    }
    
    .policy-info {
      flex: 1;
      
      h3 {
        font-size: 17px;
        font-weight: 700;
        color: ${props => props.theme.colors.text};
        margin-bottom: 6px;
      }
      
      p {
        font-size: 14px;
        color: ${props => props.theme.colors.textLight};
        line-height: 1.6;
      }
    }
  }
  
  > svg {
    width: 22px;
    height: 22px;
    color: ${props => props.theme.colors.textLight};
    transition: all 0.3s ease;
    flex-shrink: 0;
  }
`;

const DangerZone = styled(Card)`
  border-color: #FEE2E2;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%);
`;

const ComingSoonWrapper = styled.div`
  position: relative;
`;

const ComingSoonOverlay = styled.div`
  position: absolute;
  inset: 0;
  border-radius: ${props => props.theme.borderRadius.xl};
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(3px);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: all;
`;

const ComingSoonBadge = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #F59E0B, #F97316);
  color: white;
  padding: 14px 28px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 15px;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
  letter-spacing: 0.3px;
  
  .badge-icon {
    font-size: 26px;
    line-height: 1;
  }
`;

const QuickStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const StatItem = styled.div`
  padding: 16px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: ${props => props.theme.borderRadius.lg};
  text-align: center;
  
  .stat-value {
    font-size: 24px;
    font-weight: 800;
    color: ${props => props.$color || props.theme.colors.primary};
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 600;
  }
`;

const DevMessage = styled(motion.div)`
  text-align: center;
  padding: 32px 24px;
  
  .icon-wrapper {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 146, 60, 0.15) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s ease-in-out infinite;
    
    svg {
      width: 40px;
      height: 40px;
      color: #F59E0B;
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 0 10px rgba(245, 158, 11, 0);
    }
  }
  
  h3 {
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 12px;
  }
  
  p {
    font-size: 15px;
    color: ${props => props.theme.colors.textLight};
    line-height: 1.6;
    margin-bottom: 8px;
  }
`;

function CandidateSettings() {
  const { language, changeLanguage, t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    email: true,
    profile: true,
    suggestions: false
  });

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showEmail: false,
    showPhone: false
  });

  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const navigate = useNavigate();
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  // Fetch profile on mount to load settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const profile = await candidateProfileService.getMyProfile();

        if (profile) {
          if (profile.notificationSettings) {
            setNotifications(prev => ({
              ...prev,
              ...profile.notificationSettings
            }));
          }

          if (profile.privacySettings) {
            setPrivacy(prev => ({
              ...prev,
              ...profile.privacySettings
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleNotificationToggle = async (key) => {
    const newValue = !notifications[key];
    const updatedNotifications = {
      ...notifications,
      [key]: newValue
    };

    // Optimistic update
    setNotifications(updatedNotifications);

    try {
      await candidateProfileService.updateProfile({
        notificationSettings: updatedNotifications
      });
      toast.success(t.common?.saveSuccess || 'Đã lưu cài đặt thông báo');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      // Revert on error
      setNotifications(notifications);
      toast.error(t.common?.saveError || 'Không thể lưu cài đặt');
    }
  };

  const handlePrivacyToggle = async (key) => {
    const newValue = !privacy[key];
    const updatedPrivacy = {
      ...privacy,
      [key]: newValue
    };

    // Optimistic update
    setPrivacy(updatedPrivacy);

    try {
      await candidateProfileService.updateProfile({
        privacySettings: updatedPrivacy
      });
      toast.success(t.common?.saveSuccess || 'Đã lưu cài đặt quyền riêng tư');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      // Revert on error
      setPrivacy(privacy);
      toast.error(t.common?.saveError || 'Không thể lưu cài đặt');
    }
  };



  return (
    <>
      <DashboardLayout role="candidate" showSearch={false} key={language}>
        <SettingsContainer>
          <PageHeader
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="header-content">
              <h1><SettingsIcon />{t.settings.title}</h1>
              <p>{t.settings.subtitle}</p>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ marginTop: 12, fontSize: 14, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  Đang tải cài đặt...
                </motion.div>
              )}
              <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            </div>
          </PageHeader>

          <ContentGrid>
            <MainContent>
              {/* Account Settings */}
              <Card
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="card-header">
                  <h2><User />{t.settings.accountSettings}</h2>
                </div>

                <SettingItem
                  $color="#1e40af"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="setting-left">
                    <div className="icon-wrapper">
                      <Globe />
                    </div>
                    <div className="setting-info">
                      <h3>{t.settings.language}</h3>
                      <p>{t.settings.languageDescription}</p>
                    </div>
                  </div>
                  <LanguageOptions>
                    <LanguageButton
                      $active={language === 'vi'}
                      onClick={() => changeLanguage('vi')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {language === 'vi' && <Check />}
                      {t.settings.vietnamese}
                    </LanguageButton>
                    <LanguageButton
                      $active={language === 'en'}
                      onClick={() => changeLanguage('en')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {language === 'en' && <Check />}
                      {t.settings.english}
                    </LanguageButton>
                  </LanguageOptions>
                </SettingItem>

                <SettingItem
                  $color="#F59E0B"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="setting-left">
                    <div className="icon-wrapper">
                      {isDarkMode ? <Moon /> : <Sun />}
                    </div>
                    <div className="setting-info">
                      <h3>{t.settings.darkMode}</h3>
                      <p>{t.settings.darkModeDesc}</p>
                    </div>
                  </div>
                  <Toggle>
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={() => setIsDevModalOpen(true)}
                    />
                    <span></span>
                  </Toggle>
                </SettingItem>
              </Card>

              {/* Account & Password */}
              <Card
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="card-header">
                  <h2><Lock />{t.settings.security}</h2>
                </div>

                <SettingItem
                  $color="#1e40af"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => navigate('/candidate/change-password')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="setting-left">
                    <div className="icon-wrapper">
                      <Key />
                    </div>
                    <div className="setting-info">
                      <h3>{t.security.changePassword}</h3>
                      <p>{t.security.changePasswordDesc}</p>
                    </div>
                  </div>
                  <ChevronRight />
                </SettingItem>

                <SettingItem
                  $color="#EF4444"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => navigate('/candidate/delete-account')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="setting-left">
                    <div className="icon-wrapper">
                      <Trash2 />
                    </div>
                    <div className="setting-info">
                      <h3>{t.security.deleteAccount}</h3>
                      <p>{t.security.deleteAccountDesc}</p>
                    </div>
                  </div>
                  <ChevronRight />
                </SettingItem>
              </Card>

              {/* Notifications */}
              <ComingSoonWrapper>
                <Card
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className="card-header">
                    <h2><Bell />{t.settings.notifications}</h2>
                  </div>

                  <SettingItem
                    $color="#10B981"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="setting-left">
                      <div className="icon-wrapper">
                        <Mail />
                      </div>
                      <div className="setting-info">
                        <h3>{t.settings.emailNotifications}</h3>
                        <p>{t.settings.emailNotificationsDesc}</p>
                      </div>
                    </div>
                    <Toggle>
                      <input
                        type="checkbox"
                        checked={notifications.email}
                        onChange={() => {}}
                        disabled
                      />
                      <span></span>
                    </Toggle>
                  </SettingItem>

                  <SettingItem
                    $color="#1e40af"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="setting-left">
                      <div className="icon-wrapper">
                        <Bell />
                      </div>
                      <div className="setting-info">
                        <h3>{t.settings.applicationUpdates}</h3>
                        <p>{t.settings.applicationUpdatesDesc}</p>
                      </div>
                    </div>
                    <Toggle>
                      <input
                        type="checkbox"
                        checked={notifications.profile}
                        onChange={() => {}}
                        disabled
                      />
                      <span></span>
                    </Toggle>
                  </SettingItem>

                  <SettingItem
                    $color="#F59E0B"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="setting-left">
                      <div className="icon-wrapper">
                        <MessageSquare />
                      </div>
                      <div className="setting-info">
                        <h3>{t.settings.newMatches}</h3>
                        <p>{t.settings.newMatchesDesc}</p>
                      </div>
                    </div>
                    <Toggle>
                      <input
                        type="checkbox"
                        checked={notifications.suggestions}
                        onChange={() => {}}
                        disabled
                      />
                      <span></span>
                    </Toggle>
                  </SettingItem>
                </Card>
                <ComingSoonOverlay>
                  <ComingSoonBadge>
                    <span className="badge-icon">🚧</span>
                    Tính năng đang phát triển
                  </ComingSoonBadge>
                </ComingSoonOverlay>
              </ComingSoonWrapper>

              {/* Privacy */}
              <ComingSoonWrapper>
                <Card
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="card-header">
                    <h2><Shield />{t.settings.privacy}</h2>
                  </div>

                  <SettingItem
                    $color="#10B981"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="setting-left">
                      <div className="icon-wrapper">
                        {privacy.showProfile ? <Eye /> : <EyeOff />}
                      </div>
                      <div className="setting-info">
                        <h3>{t.settings.profileVisibility}</h3>
                        <p>{t.settings.profileVisibilityDesc}</p>
                      </div>
                    </div>
                    <Toggle>
                      <input
                        type="checkbox"
                        checked={privacy.showProfile}
                        onChange={() => {}}
                        disabled
                      />
                      <span></span>
                    </Toggle>
                  </SettingItem>

                  <SettingItem
                    $color="#1e40af"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="setting-left">
                      <div className="icon-wrapper">
                        <Mail />
                      </div>
                      <div className="setting-info">
                        <h3>{t.settings.showEmail}</h3>
                        <p>{t.settings.showEmailDesc}</p>
                      </div>
                    </div>
                    <Toggle>
                      <input
                        type="checkbox"
                        checked={privacy.showEmail}
                        onChange={() => {}}
                        disabled
                      />
                      <span></span>
                    </Toggle>
                  </SettingItem>

                  <SettingItem
                    $color="#F59E0B"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="setting-left">
                      <div className="icon-wrapper">
                        <Phone />
                      </div>
                      <div className="setting-info">
                        <h3>{t.settings.showPhone}</h3>
                        <p>{t.settings.showPhoneDesc}</p>
                      </div>
                    </div>
                    <Toggle>
                      <input
                        type="checkbox"
                        checked={privacy.showPhone}
                        onChange={() => {}}
                        disabled
                      />
                      <span></span>
                    </Toggle>
                  </SettingItem>
                </Card>
                <ComingSoonOverlay>
                  <ComingSoonBadge>
                    <span className="badge-icon">🚧</span>
                    Tính năng đang phát triển
                  </ComingSoonBadge>
                </ComingSoonOverlay>
              </ComingSoonWrapper>

              {/* Policies */}
              <Card
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="card-header">
                  <h2><FileText />{t.settings.policyTerms}</h2>
                </div>

                <PolicyItem
                  $color="#1e40af"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => navigate('/candidate/policy/terms')}
                >
                  <div className="policy-left">
                    <div className="icon">
                      <FileText />
                    </div>
                    <div className="policy-info">
                      <h3>{t.legalPrivacy.terms}</h3>
                      <p>{t.legalPrivacy.termsDesc}</p>
                    </div>
                  </div>
                  <ChevronRight />
                </PolicyItem>

                <PolicyItem
                  $color="#10B981"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => navigate('/candidate/policy/privacy')}
                >
                  <div className="policy-left">
                    <div className="icon">
                      <Shield />
                    </div>
                    <div className="policy-info">
                      <h3>{t.legalPrivacy.privacy}</h3>
                      <p>{t.legalPrivacy.privacyDesc}</p>
                    </div>
                  </div>
                  <ChevronRight />
                </PolicyItem>

              </Card>
            </MainContent>

            <Sidebar>
              {/* Sidebar hidden */}
            </Sidebar>
          </ContentGrid>
        </SettingsContainer>

      </DashboardLayout>

      <UnderDevelopmentModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
      />
    </>
  );
}

export default CandidateSettings;
