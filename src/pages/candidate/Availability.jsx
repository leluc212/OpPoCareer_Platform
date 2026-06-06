import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { useLanguage } from '../../context/LanguageContext';
import candidateProfileService from '../../services/candidateProfileService';
import { 
  Power, 
  Search, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Bell, 
  AlertCircle, 
  Eye,
  Briefcase,
  CheckCircle,
  XCircle,
  Calendar,
  Settings,
  Target,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';
import { Button } from '../../components/FormElements';

const AvailabilityContainer = styled.div`
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
`;

const ContentGrid = styled.div`
  display: none;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const StatusCard = styled(motion.div)`
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    : 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)'};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 48px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: ${props => props.$active 
    ? '0 20px 60px -10px rgba(16, 185, 129, 0.4)'
    : '0 20px 60px -10px rgba(100, 116, 139, 0.3)'};
  
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
  
  .status-content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 32px;
    
    .status-info {
      flex: 1;
      
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.2);
        padding: 8px 16px;
        border-radius: ${props => props.theme.borderRadius.full};
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 20px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        
        svg {
          width: 16px;
          height: 16px;
        }
      }
      
      .status-label {
        font-size: 48px;
        font-weight: 800;
        margin-bottom: 16px;
        letter-spacing: -1px;
        line-height: 1;
      }
      
      .status-desc {
        font-size: 16px;
        opacity: 0.95;
        line-height: 1.6;
        margin-bottom: 24px;
      }
    }
    
    .status-icon {
      width: 120px;
      height: 120px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      border: 3px solid rgba(255, 255, 255, 0.3);
      flex-shrink: 0;
      
      svg {
        width: 60px;
        height: 60px;
      }
    }
  }
`;

const ToggleButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  padding: 14px 32px;
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.6);
    transform: translateY(-2px);
  }
`;

const Card = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 32px;
  border: 1px solid ${props => props.theme.colors.border};
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    
    h2 {
      font-size: 22px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      display: flex;
      align-items: center;
      gap: 12px;
      
      svg {
        width: 24px;
        height: 24px;
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
  transition: all 0.3s;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    border-color: ${props => props.$enabled ? props.theme.colors.primary : props.theme.colors.border};
    transform: translateX(4px);
    box-shadow: ${props => props.theme.shadows.sm};
  }
  
  .setting-left {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16px;
    
    .icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: ${props => props.theme.borderRadius.lg};
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
    }
    
    .setting-info {
      flex: 1;
      
      h3 {
        font-size: 16px;
        font-weight: 700;
        color: ${props => props.theme.colors.text};
        margin-bottom: 6px;
      }
      
      p {
        font-size: 14px;
        color: ${props => props.theme.colors.textLight};
        line-height: 1.5;
      }
    }
  }
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 56px;
  height: 32px;
  flex-shrink: 0;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
    
    &:checked + span {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    
    &:checked + span:before {
      transform: translateX(24px);
    }
    
    &:disabled + span {
      opacity: 0.4;
      cursor: not-allowed;
      background: #E2E8F0;
    }
    
    &:disabled:checked + span {
      opacity: 0.5;
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
    border-radius: 32px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:before {
      position: absolute;
      content: '';
      height: 24px;
      width: 24px;
      left: 4px;
      bottom: 4px;
      background: white;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  }
`;

const InfoBox = styled(motion.div)`
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.1) 0%, rgba(30, 64, 175, 0.1) 100%);
  border-left: 4px solid ${props => props.theme.colors.primary};
  padding: 24px;
  border-radius: ${props => props.theme.borderRadius.lg};
  margin-top: 24px;
  
  .info-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    
    svg {
      width: 20px;
      height: 20px;
      color: ${props => props.theme.colors.primary};
    }
    
    h4 {
      font-size: 15px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
    }
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    line-height: 1.7;
    margin-left: 32px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const StatCard = styled(motion.div)`
  text-align: center;
  padding: 28px 20px;
  background: ${props => props.theme.colors.bgDark};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  transition: all 0.3s;
  border-left: 3px solid ${props => props.$color || props.theme.colors.primary};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => props.$color || props.theme.colors.primary};
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    border-radius: ${props => props.theme.borderRadius.lg};
    background: ${props => props.$color || props.theme.colors.primary}15;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      width: 24px;
      height: 24px;
      color: ${props => props.$color || props.theme.colors.primary};
    }
  }
  
  .stat-value {
    font-size: 36px;
    font-weight: 800;
    color: ${props => props.$color || props.theme.colors.primary};
    margin-bottom: 8px;
    line-height: 1;
    letter-spacing: -1px;
  }
  
  .stat-label {
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 600;
  }
`;

const ActivityItem = styled(motion.div)`
  display: flex;
  align-items: start;
  gap: 16px;
  padding: 16px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: 12px;
  transition: all 0.3s;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateX(4px);
  }
  
  .icon {
    width: 40px;
    height: 40px;
    border-radius: ${props => props.theme.borderRadius.md};
    background: ${props => props.$color || props.theme.colors.primary}15;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    svg {
      width: 20px;
      height: 20px;
      color: ${props => props.$color || props.theme.colors.primary};
    }
  }
  
  .content {
    flex: 1;
    
    h4 {
      font-size: 14px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      margin-bottom: 4px;
    }
    
    p {
      font-size: 13px;
      color: ${props => props.theme.colors.textLight};
    }
  }
`;

const ConfirmationContent = styled.div`
  padding: 24px;
  
  .icon-wrapper {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    background: ${props => props.$isActive 
      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)'
      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid ${props => props.$isActive ? '#FEE2E2' : '#D1FAE5'};
    
    svg {
      width: 40px;
      height: 40px;
      color: ${props => props.$isActive ? '#EF4444' : '#10B981'};
    }
  }
  
  h3 {
    font-size: 24px;
    font-weight: 800;
    color: ${props => props.theme.colors.text};
    text-align: center;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }
  
  p {
    font-size: 15px;
    color: ${props => props.theme.colors.textLight};
    text-align: center;
    line-height: 1.7;
    margin-bottom: 28px;
  }
  
  .button-group {
    display: flex;
    gap: 12px;
    
    button {
      flex: 1;
      padding: 14px 24px;
      border-radius: ${props => props.theme.borderRadius.lg};
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      
      &.confirm {
        background: ${props => props.$isActive 
          ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
          : 'linear-gradient(135deg, #10B981 0%, #059669 100%)'};
        color: white;
        border: none;
        box-shadow: ${props => props.$isActive 
          ? '0 4px 12px rgba(239, 68, 68, 0.3)'
          : '0 4px 12px rgba(16, 185, 129, 0.3)'};
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: ${props => props.$isActive 
            ? '0 8px 20px rgba(239, 68, 68, 0.4)'
            : '0 8px 20px rgba(16, 185, 129, 0.4)'};
        }
      }
      
      &.cancel {
        background: ${props => props.theme.colors.bgDark};
        color: ${props => props.theme.colors.text};
        border: 1px solid ${props => props.theme.colors.border};
        
        &:hover {
          background: ${props => props.theme.colors.border};
        }
      }
      
      &:active {
        transform: translateY(0);
      }
    }
  }
`;

const Availability = () => {
  const { language } = useLanguage();
  const [isAvailable, setIsAvailable] = useState(() => {
    const saved = localStorage.getItem('candidate_job_search_is_available');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [enableJobSearch, setEnableJobSearch] = useState(() => {
    const saved = localStorage.getItem('candidate_job_search_is_available');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [enableRecommendations, setEnableRecommendations] = useState(() => {
    const saved = localStorage.getItem('candidate_job_search_is_available');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const syncProfileAvailability = async () => {
      try {
        const profile = await candidateProfileService.getMyProfile();
        if (profile) {
          setProfileData(profile);
          const activeState = profile.isActive !== false;
          setIsAvailable(activeState);
          setEnableJobSearch(activeState);
          setEnableRecommendations(activeState);
          localStorage.setItem('candidate_job_search_is_available', JSON.stringify(activeState));
        }
      } catch (err) {
        console.error('Failed to load candidate profile availability:', err);
      }
    };
    syncProfileAvailability();
  }, []);

  const handleToggleAvailability = () => {
    setShowConfirmModal(true);
  };
  
  const confirmToggle = async () => {
    const newStatus = !isAvailable;
    setLoading(true);
    
    let updates = { ...profileData, isActive: newStatus };
    
    if (newStatus && navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        updates.latitude = position.coords.latitude;
        updates.longitude = position.coords.longitude;
        console.log("📍 Syncing search GPS coordinates:", updates.latitude, updates.longitude);
      } catch (geoErr) {
        console.warn("Could not retrieve GPS coordinates for profile sync:", geoErr);
      }
    }
    
    try {
      // Update isActive attribute and GPS coordinates on candidate profile table in DynamoDB
      const updatedProfile = await candidateProfileService.updateProfile(updates);
      if (updatedProfile) {
        setProfileData(updatedProfile);
      }
      setIsAvailable(newStatus);
      localStorage.setItem('candidate_job_search_is_available', JSON.stringify(newStatus));
      if (newStatus) {
        setEnableJobSearch(true);
        setEnableRecommendations(true);
      } else {
        setEnableJobSearch(false);
        setEnableRecommendations(false);
      }
    } catch (err) {
      console.error('Failed to sync search status with backend:', err);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };


  const stats = [
    { label: language === 'vi' ? 'Lượt Xem Hồ Sơ' : 'Profile Views', value: isAvailable ? '156' : '0', icon: Eye, color: '#1e40af' },
    { label: language === 'vi' ? 'Gợi Ý Công Việc' : 'Job Recommendations', value: isAvailable ? '23' : '0', icon: Briefcase, color: '#10B981' },
    { label: language === 'vi' ? 'Lời Mời' : 'Invitations', value: isAvailable ? '12' : '0', icon: Target, color: '#F59E0B' }
  ];
  const activities = [
    { label: language === 'vi' ? 'FPT Software xem hồ sơ' : 'FPT Software viewed your profile', time: language === 'vi' ? '2 giờ trước' : '2 hours ago', icon: Eye, color: '#1e40af' },
    { label: language === 'vi' ? 'Nhận gợi ý: Senior React Dev' : 'Recommendation: Senior React Dev', time: language === 'vi' ? '5 giờ trước' : '5 hours ago', icon: Zap, color: '#10B981' }
  ];

  return (
    <DashboardLayout role="candidate" showSearch={false} key={language}>
      <AvailabilityContainer>
        <StatusCard 
          $active={isAvailable}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="status-content">
            <div className="status-info">
              <div className="status-badge">
                {isAvailable ? <CheckCircle /> : <XCircle />}
                {language === 'vi' ? 'Trạng Thái Hiện Tại' : 'Current Status'}
              </div>
              <div className="status-label">
                {isAvailable 
                  ? (language === 'vi' ? 'ĐANG TÌM VIỆC' : 'ACTIVELY LOOKING')
                  : (language === 'vi' ? 'TẠM DỪNG' : 'PAUSED')}
              </div>
              <div className="status-desc">
                {isAvailable 
                  ? (language === 'vi' 
                      ? 'Hồ sơ của bạn đang hiển thị với nhà tuyển dụng và bạn đang nhận gợi ý công việc'
                      : 'Your profile is visible to employers and you are receiving job suggestions')
                  : (language === 'vi'
                      ? 'Hồ sơ của bạn đã bị ẩn khỏi nhà tuyển dụng và không nhận gợi ý công việc'
                      : 'Your profile is hidden from employers and you are not receiving job suggestions')}
              </div>
              <ToggleButton 
                onClick={handleToggleAvailability} 
                $active={isAvailable}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Power />
                {loading 
                  ? (language === 'vi' ? 'Đang cập nhật...' : 'Updating...')
                  : (isAvailable 
                      ? (language === 'vi' ? 'Tắt Tìm Việc' : 'Pause Job Search')
                      : (language === 'vi' ? 'Bật Tìm Việc' : 'Activate Job Search'))}
              </ToggleButton>
            </div>
            <motion.div 
              className="status-icon"
              animate={{ 
                rotate: isAvailable ? 0 : 180,
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 0.5 }}
            >
              <Power />
            </motion.div>
          </div>
        </StatusCard>

        <ContentGrid>
          <MainContent>
            {/* Search Settings section removed */}
          </MainContent>

          <Sidebar>
            {/* Statistics and Recent Activity sections removed */}
          </Sidebar>
        </ContentGrid>
      </AvailabilityContainer>
      
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !loading && setShowConfirmModal(false)}
        title=""
      >
        <ConfirmationContent $isActive={isAvailable}>
          <motion.div 
            className="icon-wrapper"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <AlertCircle />
          </motion.div>
          <h3>{isAvailable 
            ? (language === 'vi' ? 'Tắt Trạng Thái Tìm Việc?' : 'Pause Job Search Status?')
            : (language === 'vi' ? 'Bật Trạng Thái Tìm Việc?' : 'Activate Job Search Status?')}
          </h3>
          <p>
            {isAvailable 
              ? (language === 'vi'
                  ? 'Khi tắt trạng thái tìm việc, hồ sơ của bạn sẽ bị ẩn khỏi nhà tuyển dụng và bạn sẽ không nhận được gợi ý công việc nào. Tất cả cài đặt tìm kiếm sẽ tự động bị vô hiệu hóa.'
                  : 'When you pause job search, your profile will be hidden from employers and you will not receive any job suggestions. All search settings will be automatically disabled.')
              : (language === 'vi'
                  ? 'Khi bật trạng thái tìm việc, hồ sơ của bạn sẽ hiển thị với nhà tuyển dụng và bạn sẽ nhận được các gợi ý công việc phù hợp. Các tính năng tìm kiếm sẽ được kích hoạt.'
                  : 'When you activate job search, your profile will be visible to employers and you will receive relevant job suggestions. Search features will be enabled.')}
          </p>
          <div className="button-group">
            <button className="cancel" onClick={() => setShowConfirmModal(false)} disabled={loading}>
              {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
            </button>
            <button className="confirm" onClick={confirmToggle} disabled={loading}>
              {loading 
                ? (language === 'vi' ? 'Đang xử lý...' : 'Processing...')
                : (isAvailable 
                    ? (language === 'vi' ? 'Tắt Ngay' : 'Pause Now')
                    : (language === 'vi' ? 'Bật Ngay' : 'Activate Now'))}
            </button>
          </div>
        </ConfirmationContent>
      </Modal>
    </DashboardLayout>
  );
};

export default Availability;
