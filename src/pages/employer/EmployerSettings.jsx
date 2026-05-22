import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import UnderDevelopmentModal from '../../components/UnderDevelopmentModal';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Settings as SettingsIcon, Bell, FileText, Globe, Shield } from 'lucide-react';

// ─── Page wrapper ────────────────────────────────────────────
const PageContainer = styled(motion.div)`
  width: 100%;
`;

// ─── Header (đồng nhất với Applications) ─────────────────────
const PageHeader = styled.div`
  margin-bottom: 28px;
  display: flex;
  align-items: flex-start;
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
  svg { width: 22px; height: 22px; color: #1e40af; }
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

// ─── Settings sections ────────────────────────────────────────
const SettingsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SettingCard = styled(motion.div)`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  overflow: hidden;
`;

// Section header inside each card
const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid #F1F5F9;

  .icon-box {
    width: 40px;
    height: 40px;
    border-radius: 11px;
    background: ${props => props.$bg || '#EFF6FF'};
    border: 1.5px solid ${props => props.$border || '#BFDBFE'};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    svg { width: 18px; height: 18px; color: ${props => props.$iconColor || '#1e40af'}; }
  }

  .section-info {
    h3 {
      font-size: 15px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      margin-bottom: 2px;
    }
    p {
      font-size: 12.5px;
      color: ${props => props.theme.colors.textLight};
      font-weight: 500;
    }
  }
`;

// Each individual setting row
const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;

  &:not(:last-child) {
    border-bottom: 1px solid #F8FAFC;
  }

  &:hover {
    background: #FAFBFF;
  }

  > div:first-child {
    flex: 1;
    margin-right: 20px;
  }

  .label {
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    font-size: 14px;
    margin-bottom: 3px;
  }

  .description {
    color: ${props => props.theme.colors.textLight};
    font-size: 12.5px;
    line-height: 1.5;
  }
`;

// Language pills
const LanguageOptions = styled.div`
  display: flex;
  gap: 8px;
`;

const LangPill = styled(motion.button)`
  padding: 7px 16px;
  border-radius: 100px;
  background: ${props => props.$active ? '#1e40af' : 'transparent'};
  border: 1.5px solid ${props => props.$active ? '#1e40af' : '#E2E8F0'};
  color: ${props => props.$active ? 'white' : '#64748B'};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  &:hover {
    border-color: #1e40af;
    color: ${props => props.$active ? 'white' : '#1e40af'};
  }
`;

// Toggle switch
const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: #CBD5E1;
    transition: all 0.25s ease;
    border-radius: 26px;

    &:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: all 0.25s ease;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
  }

  input:checked + span {
    background: #10B981;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.25);
  }

  input:checked + span:before {
    transform: translateX(22px);
  }
`;

// Policy buttons
const PolicyButtons = styled.div`
  display: flex;
  gap: 10px;
  padding: 16px 22px;
  flex-wrap: wrap;
`;

const PolicyBtn = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 10px;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  svg { width: 15px; height: 15px; }
  &:hover {
    border-color: #BFDBFE;
    background: #EFF6FF;
    color: #1e40af;
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

// ─── Component ────────────────────────────────────────────────
const EmployerSettings = () => {
  const { language, changeLanguage, t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    applications: true,
    messages: true,
    system: false
  });
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  return (
    <>
    <DashboardLayout role="employer" key={language}>
      <PageContainer
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* ── Header ── */}
        <PageHeader>
          <PageTitleGroup>
            <PageIconBox><SettingsIcon /></PageIconBox>
            <PageTitleText>
              <h1>{t.settings.title}</h1>
              <p>{t.settings.subtitle}</p>
            </PageTitleText>
          </PageTitleGroup>
        </PageHeader>

        <SettingsGrid>

          {/* ── Display & Language ── */}
          <SettingCard
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
          >
            <SectionHeader $bg="#EFF6FF" $border="#BFDBFE" $iconColor="#1e40af">
              <div className="icon-box"><Globe /></div>
              <div className="section-info">
                <h3>{t.settings.appearance}</h3>
                <p>{language === 'vi' ? 'Ngôn ngữ và giao diện' : 'Language and appearance'}</p>
              </div>
            </SectionHeader>

            <SettingRow>
              <div>
                <div className="label">{t.settings.language}</div>
                <div className="description">{t.settings.languageDescription}</div>
              </div>
              <LanguageOptions>
                <LangPill $active={language === 'vi'} onClick={() => changeLanguage('vi')} whileTap={{ scale: 0.97 }}>
                  {t.settings.vietnamese}
                </LangPill>
                <LangPill $active={language === 'en'} onClick={() => changeLanguage('en')} whileTap={{ scale: 0.97 }}>
                  {t.settings.english}
                </LangPill>
              </LanguageOptions>
            </SettingRow>

            <SettingRow>
              <div>
                <div className="label">{t.settings.darkMode}</div>
                <div className="description">{t.settings.darkModeDesc}</div>
              </div>
              <Toggle>
                <input type="checkbox" checked={isDarkMode} onChange={() => setIsDevModalOpen(true)} />
                <span />
              </Toggle>
            </SettingRow>
          </SettingCard>

          {/* ── Notifications ── */}
          <SettingCard
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.11 }}
          >
            <SectionHeader $bg="#FFFBEB" $border="#FDE68A" $iconColor="#F59E0B">
              <div className="icon-box"><Bell /></div>
              <div className="section-info">
                <h3>{t.settings.notifications}</h3>
                <p>{t.settings.notificationsDesc}</p>
              </div>
            </SectionHeader>

            {[
              {
                key: 'applications',
                label:  language === 'vi' ? 'Đơn ứng tuyển mới'    : 'New Applications',
                desc:   language === 'vi' ? 'Nhận thông báo khi có ứng viên nộp đơn' : 'Get notified when candidates apply',
              },
              {
                key: 'messages',
                label:  language === 'vi' ? 'Tin nhắn'             : 'Messages',
                desc:   language === 'vi' ? 'Nhận thông báo tin nhắn mới' : 'Get notified of new messages',
              },
              {
                key: 'system',
                label:  language === 'vi' ? 'Thông báo hệ thống'   : 'System Notifications',
                desc:   language === 'vi' ? 'Nhận thông báo về cập nhật và bảo trì' : 'Get updates and maintenance notices',
              },
            ].map(item => (
              <SettingRow key={item.key}>
                <div>
                  <div className="label">{item.label}</div>
                  <div className="description">{item.desc}</div>
                </div>
                <Toggle>
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                  />
                  <span />
                </Toggle>
              </SettingRow>
            ))}
          </SettingCard>

          {/* ── Policy & Terms ── */}
          <SettingCard
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.17 }}
          >
            <SectionHeader $bg="#ECFDF5" $border="#A7F3D0" $iconColor="#10B981">
              <div className="icon-box"><FileText /></div>
              <div className="section-info">
                <h3>{t.settings.policyTerms}</h3>
                <p>{t.legalPrivacy.privacyDesc}</p>
              </div>
            </SectionHeader>

            <PolicyButtons>
              <PolicyBtn whileTap={{ scale: 0.97 }} onClick={() => setIsDevModalOpen(true)}>
                <FileText />{t.legalPrivacy.terms}
              </PolicyBtn>
              <PolicyBtn whileTap={{ scale: 0.97 }} onClick={() => setIsDevModalOpen(true)}>
                <Shield />{t.legalPrivacy.privacy}
              </PolicyBtn>
            </PolicyButtons>
          </SettingCard>

          {/* Danger Zone - Hidden */}
          {/* <SettingCard>
            <DangerZone>
              <h4>{language === 'vi' ? 'Vùng nguy hiểm' : 'Danger Zone'}</h4>
              <p>{language === 'vi' ? 'Các hành động này không thể hoàn tác. Vui lòng cân nhắc kỹ trước khi thực hiện.' : 'These actions cannot be undone. Please proceed with caution.'}</p>
              
              <ButtonGroup>
                <Button variant="outline" onClick={handleDeactivateAccount}>
                  <Trash2 size={18} />
                  {language === 'vi' ? 'Vô hiệu hóa tài khoản' : 'Deactivate Account'}
                </Button>
                <Button variant="danger" onClick={handleDeleteAccount}>
                  <Trash2 size={18} />
                  {language === 'vi' ? 'Xóa tài khoản vĩnh viễn' : 'Delete Account Permanently'}
                </Button>
              </ButtonGroup>
            </DangerZone>
          </SettingCard> */}
        </SettingsGrid>
      </PageContainer>

    </DashboardLayout>

      <UnderDevelopmentModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
      />
    </>
  );
};

export default EmployerSettings;
