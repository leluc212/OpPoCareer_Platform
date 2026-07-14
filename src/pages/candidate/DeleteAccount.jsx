import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import candidateProfileService from '../../services/candidateProfileService';
import { 
  Trash2, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  ShieldAlert,
  Loader2
} from 'lucide-react';

const PageContainer = styled(motion.div)`
  max-width: 700px;
  margin: 0 auto;
  padding: 0 24px 80px;
`;

const BackButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  color: ${props => props.theme.colors.textLight};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 24px;
  margin-bottom: 32px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.bgDark};
    color: ${props => props.theme.colors.text};
    border-color: ${props => props.theme.colors.textLight};
  }
`;

const MainCard = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: 24px;
  padding: 0;
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
  overflow: hidden;
`;

const CardHeader = styled.div`
  background: linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%);
  padding: 32px;
  border-bottom: 1px solid #FEE2E2;
  text-align: center;

  .icon-wrapper {
    width: 64px;
    height: 64px;
    background: #FEE2E2;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: #EF4444;
  }

  h1 {
    font-size: 24px;
    font-weight: 800;
    color: #991B1B;
    margin-bottom: 8px;
  }

  p {
    font-size: 15px;
    color: #B91C1C;
    font-weight: 500;
    opacity: 0.8;
  }
`;

const CardBody = styled.div`
  padding: 32px;
`;

const WarningGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 32px;
`;

const WarningItem = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #F9FAFB;
  border-radius: 16px;
  border: 1px solid #F3F4F6;
  transition: all 0.2s ease;

  &:hover {
    border-color: #E5E7EB;
    background: #F3F4F6;
  }

  .icon {
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6B7280;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .text {
    h4 {
      font-size: 15px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      margin-bottom: 4px;
    }
    p {
      font-size: 13px;
      color: ${props => props.theme.colors.textLight};
      line-height: 1.5;
    }
  }
`;

const SectionLabel = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;

  svg { color: #6B7280; }
`;

const InputGroup = styled.div`
  margin-bottom: 24px;

  label {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 10px;
  }

  input {
    width: 100%;
    padding: 14px 18px;
    background: #F9FAFB;
    border: 2px solid ${props => props.theme.colors.border};
    border-radius: 14px;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: #EF4444;
      background: white;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
    }
    
    &::placeholder { color: #9CA3AF; }
  }
`;

const ConsentBox = styled.div`
  padding: 20px;
  background: #FEF2F2;
  border-radius: 16px;
  border: 1px dashed #FCA5A5;
  margin-bottom: 32px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  margin-bottom: 12px;
  
  &:last-child { margin-bottom: 0; }

  input { margin-top: 4px; width: 18px; height: 18px; }

  span {
    font-size: 13.5px;
    font-weight: 500;
    color: #991B1B;
    line-height: 1.5;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ConfirmBtn = styled(motion.button)`
  flex: 2;
  height: 54px;
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);

  &:disabled {
    background: #E5E7EB;
    color: #9CA3AF;
    box-shadow: none;
    cursor: not-allowed;
  }
`;

const CancelBtn = styled(motion.button)`
  flex: 1;
  height: 54px;
  background: white;
  color: ${props => props.theme.colors.text};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  
  &:hover {
    background: #F9FAFB;
    border-color: #9CA3AF;
  }
`;

const SuccessOverlay = styled(motion.div)`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: white;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;

  h2 { font-size: 28px; font-weight: 800; color: #059669; margin-top: 24px; }
  p { font-size: 16px; color: #4B5563; margin-top: 12px; }
`;

function DeleteAccount() {
  const { language } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [confirmations, setConfirmations] = useState({ understand: false, permanent: false });
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const vi = language === 'vi';
  const expectedText = vi ? 'XÓA TÀI KHOẢN' : 'DELETE ACCOUNT';
  
  const isValid = 
    confirmations.understand && 
    confirmations.permanent && 
    password.length >= 6 && 
    confirmText === expectedText;

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!isValid || isDeleting) return;

    try {
      setIsDeleting(true);
      
      // Submit deletion request — admin will review and approve
      await candidateProfileService.requestAccountDeletion();
      
      setIsSuccess(true);

    } catch (error) {
      console.error('❌ Account deletion request error:', error);
      toast.error(vi ? 'Có lỗi xảy ra: ' + (error.message || 'Thử lại sau') : 'Error occurred: ' + (error.message || 'Try again later'));
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout role="candidate" showSearch={false} key={language}>
      <PageContainer
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <BackButton onClick={() => navigate('/candidate/settings')} whileHover={{ x: -4 }}>
          <ArrowLeft size={16} />
          {vi ? 'Hủy và quay lại' : 'Cancel and go back'}
        </BackButton>

        <MainCard>
          <AnimatePresence>
            {isSuccess && (
              <SuccessOverlay
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  <CheckCircle2 size={72} color="#059669" />
                </motion.div>
                <h2>{vi ? 'Yêu cầu đã được gửi' : 'Request Submitted'}</h2>
                <p>{vi ? 'Yêu cầu xóa tài khoản của bạn đang chờ admin xét duyệt. Chúng tôi sẽ thông báo khi có kết quả.' : 'Your account deletion request is pending admin review. We will notify you when there is a decision.'}</p>
                <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '24px' }}>
                  {vi ? 'Bạn có thể tiếp tục sử dụng tài khoản trong thời gian chờ.' : 'You can continue using your account while waiting.'}
                </p>
              </SuccessOverlay>
            )}
          </AnimatePresence>

          <CardHeader>
            <div className="icon-wrapper">
              <ShieldAlert size={32} />
            </div>
            <h1>{vi ? 'Xóa tài khoản của bạn?' : 'Delete your account?'}</h1>
            <p>{vi ? 'Chúng mình rất tiếc khi thấy bạn rời đi' : 'We are sorry to see you go'}</p>
          </CardHeader>

          <CardBody>
            <SectionLabel><AlertTriangle size={18} /> {vi ? 'Hậu quả khi thực hiện' : 'What happens'}</SectionLabel>
            <WarningGrid>
              <WarningItem>
                <div className="icon"><Trash2 size={18} /></div>
                <div className="text">
                  <h4>{vi ? 'Dữ liệu bị xóa vĩnh viễn' : 'Permanent Deletion'}</h4>
                  <p>{vi ? 'Hồ sơ, Kỹ năng và CV của bạn sẽ bị gỡ bỏ hoàn toàn.' : 'Your profile, skills, and CV will be completely removed.'}</p>
                </div>
              </WarningItem>
              <WarningItem>
                <div className="icon"><Info size={18} /></div>
                <div className="text">
                  <h4>{vi ? 'Kinh nghiệm không sao lưu' : 'Lose Reputation'}</h4>
                  <p>{vi ? 'Điểm uy tín và lịch sử đánh giá của bạn sẽ không thể khôi phục.' : 'Your reputation points and rating history cannot be recovered.'}</p>
                </div>
              </WarningItem>
            </WarningGrid>

            <form onSubmit={handleDelete}>
              <SectionLabel><ShieldAlert size={18} /> {vi ? 'Xác nhận danh tính' : 'Identity confirmation'}</SectionLabel>
              <InputGroup>
                <label>{vi ? 'Mật khẩu tài khoản' : 'Account password'}</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </InputGroup>

              <InputGroup>
                <label>{vi ? `Nhập chữ "${expectedText}"` : `Type "${expectedText}"`}</label>
                <input 
                  type="text" 
                  value={confirmText} 
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={expectedText}
                  required
                />
              </InputGroup>

              <ConsentBox>
                <CheckboxLabel>
                  <input 
                    type="checkbox" 
                    checked={confirmations.understand} 
                    onChange={(e) => setConfirmations(prev => ({...prev, understand: e.target.checked}))}
                  />
                  <span>{vi ? 'Tôi hiểu rằng các công việc đang ứng tuyển sẽ bị hủy bỏ' : 'I understand that active applications will be cancelled'}</span>
                </CheckboxLabel>
                <CheckboxLabel>
                  <input 
                    type="checkbox" 
                    checked={confirmations.permanent} 
                    onChange={(e) => setConfirmations(prev => ({...prev, permanent: e.target.checked}))}
                  />
                  <span>{vi ? 'Tôi xác nhận hành động này là không thể đảo ngược' : 'I confirm this action is irreversible'}</span>
                </CheckboxLabel>
              </ConsentBox>

              <ActionButtons>
                <CancelBtn 
                  type="button" 
                  onClick={() => navigate('/candidate/settings')}
                >
                  {vi ? 'Giữ lại tài khoản' : 'Keep my account'}
                </CancelBtn>
                <ConfirmBtn 
                  type="submit" 
                  disabled={!isValid || isDeleting}
                  whileTap={{ scale: 0.98 }}
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Trash2 size={20} />
                      {vi ? 'Xác nhận xóa tài khoản' : 'Confirm Delete Account'}
                    </>
                  )}
                </ConfirmBtn>
              </ActionButtons>
            </form>
          </CardBody>
        </MainCard>
      </PageContainer>
    </DashboardLayout>
  );
}

export default DeleteAccount;
