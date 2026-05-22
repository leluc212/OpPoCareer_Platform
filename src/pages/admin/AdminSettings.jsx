import React, { useState } from 'react';
import styled from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Globe, Moon, Sun } from 'lucide-react';
import { Button } from '../../components/FormElements';
import UnderDevelopmentModal from '../../components/UnderDevelopmentModal';

const SettingsContainer = styled.div`
  max-width: 900px;
`;

const SettingsCard = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 32px;
  margin-bottom: 24px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
  color: ${props => props.theme.colors.text};
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
`;

const SettingInfo = styled.div`
  flex: 1;
  margin-right: 20px;
  
  h3 {
    font-size: 16px;
    font-weight: 500;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    
    span {
      color: ${props => props.theme.colors.text};
    }
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    line-height: 1.5;
  }
`;

const LanguageOptions = styled.div`
  display: flex;
  gap: 12px;
`;

const LanguageButton = styled.button`
  padding: 8px 20px;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 2px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.bgDark};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-2px);
  }
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
    
    &:checked + span {
      background: ${props => props.theme.colors.primary};
    }
    
    &:checked + span:before {
      transform: translateX(22px);
    }
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.theme.colors.border};
    border-radius: 28px;
    transition: 0.3s;
    
    &:before {
      position: absolute;
      content: '';
      height: 20px;
      width: 20px;
      left: 4px;
      bottom: 4px;
      background: ${props => props.theme.colors.bgLight};
      border-radius: 50%;
      transition: 0.3s;
    }
  }
`;

const AdminSettings = () => {
  const { language, changeLanguage, t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
  };
  
  const handleDarkModeToggle = () => {
    setIsDevModalOpen(true);
  };

  return (
    <>
    <DashboardLayout role="admin" showSearch={false} key={language}>
      <SettingsContainer>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '32px' }}>{t.settings.title}</h1>

        <SettingsCard>
          <SectionTitle>{t.settings.accountSettings}</SectionTitle>
          
          <SettingItem>
            <SettingInfo>
              <h3>
                <Globe size={18} style={{ marginRight: '8px', flexShrink: 0 }} />
                <span>{t.settings.language}</span>
              </h3>
              <p>{t.settings.languageDescription}</p>
            </SettingInfo>
            <LanguageOptions>
              <LanguageButton
                $active={language === 'vi'}
                onClick={() => handleLanguageChange('vi')}
              >
                {t.settings.vietnamese}
              </LanguageButton>
              <LanguageButton
                $active={language === 'en'}
                onClick={() => handleLanguageChange('en')}
              >
                {t.settings.english}
              </LanguageButton>
            </LanguageOptions>
          </SettingItem>
          
          <SettingItem>
            <SettingInfo>
              <h3>
                {isDarkMode ? (
                  <Moon size={18} style={{ marginRight: '8px', flexShrink: 0 }} />
                ) : (
                  <Sun size={18} style={{ marginRight: '8px', flexShrink: 0 }} />
                )}
                <span>{t.settings.darkMode}</span>
              </h3>
              <p>{t.settings.darkModeDesc}</p>
            </SettingInfo>
            <Toggle>
              <input type="checkbox" checked={isDarkMode} onChange={handleDarkModeToggle} />
              <span></span>
            </Toggle>
          </SettingItem>
        </SettingsCard>
      </SettingsContainer>
      
    </DashboardLayout>

      <UnderDevelopmentModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
      />
    </>
  );
};

export default AdminSettings;
