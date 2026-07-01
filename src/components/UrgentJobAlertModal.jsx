import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { Zap, Clock, MapPin, DollarSign, Briefcase, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getKycStatus } from '../services/ekycService';
import { getCVInfo } from '../services/cvUploadService';
import { markAsRead, createEmployerApplicationNotification, createCandidateApplicationSubmittedNotification } from '../services/notificationService';
import applicationService from '../services/applicationService';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
`;

const AlertHeader = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #991b1b;
  
  svg {
    color: #ef4444;
    flex-shrink: 0;
    margin-top: 2px;
    animation: pulse 1.5s infinite;
  }
  
  .title {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  
  .desc {
    font-size: 13px;
    color: #7f1d1d;
    line-height: 1.4;
  }

  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
`;

const JobDetailsCard = styled.div`
  background: ${props => props.theme.colors.bgDark};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .job-title {
    font-size: 18px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin: 0;
  }
  
  .company-name {
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.colors.primary};
    margin-top: -12px;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  border-top: 1px solid ${props => props.theme.colors.border};
  padding-top: 16px;
  
  @media (min-width: 480px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  
  svg {
    color: ${props => props.theme.colors.primary};
    flex-shrink: 0;
  }
  
  .label {
    font-weight: 500;
    margin-right: 4px;
  }
  
  .value {
    font-weight: 600;
    color: ${props => props.theme.colors.text};
  }
`;

const StatusBox = styled.div`
  background: ${props => props.$bgColor};
  border: 1px solid ${props => props.$borderColor};
  color: ${props => props.$color};
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    flex-shrink: 0;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: ${props => props.$primary ? props.theme.colors.gradientPrimary : 'transparent'};
  color: ${props => props.$primary ? 'white' : props.theme.colors.textLight};
  border: ${props => props.$primary ? 'none' : `1.5px solid ${props.theme.colors.border}`};
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props => props.$primary ? props.theme.shadows.md : 'none'};
    background: ${props => props.$primary ? props.theme.colors.primary : props.theme.colors.bgDark};
    color: ${props => props.$primary ? 'white' : props.theme.colors.text};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SuccessView = styled.div`
  text-align: center;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  
  svg {
    color: #10b981;
  }
  
  h3 {
    font-size: 20px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin: 0;
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    line-height: 1.5;
    max-width: 320px;
    margin: 0;
  }
`;

const UrgentJobAlertModal = ({ isOpen, onClose, notification, onApplied }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorState, setErrorState] = useState(null); // 'ekyc_required', 'cv_required', 'system_error'
  const [errorMessage, setErrorMessage] = useState('');

  if (!notification) return null;

  const data = notification.data || {};
  const jobId = data.jobId;
  const jobTitle = data.jobTitle || 'Ca làm việc';
  const companyName = data.companyName || 'Nhà tuyển dụng';
  const location = data.location || 'Chưa cập nhật địa điểm';
  const salary = data.salary || 'Thỏa thuận';
  const workTime = data.workTime || 'Chưa cập nhật thời gian';
  const employerId = data.employerId || notification.senderId || 'system';

  const handleSkip = async () => {
    try {
      await markAsRead(notification.notificationId);
    } catch (e) {
      console.warn('Failed to mark skip notification as read:', e);
    }
    onClose();
  };

  const handleApply = async () => {
    setLoading(true);
    setErrorState(null);
    setErrorMessage('');

    try {
      // 1. Resolve User ID
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub;
      const userEmail = session.tokens?.idToken?.payload?.email;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // 2. Validate eKYC Status
      try {
        const kycRes = await getKycStatus(userId);
        const isVerified = kycRes?.kycCompleted || kycRes?.kycStatus === 'VERIFIED';
        if (!isVerified) {
          setErrorState('ekyc_required');
          setLoading(false);
          return;
        }
      } catch (ekycErr) {
        console.error('Error fetching KYC status:', ekycErr);
        setErrorState('ekyc_required');
        setLoading(false);
        return;
      }

      // 3. Retrieve CVs
      let cvList = [];
      try {
        const cvData = await getCVInfo(userId);
        cvList = cvData?.cvList || [];
      } catch (cvErr) {
        console.error('Error loading CV info:', cvErr);
      }

      if (cvList.length === 0) {
        setErrorState('cv_required');
        setLoading(false);
        return;
      }

      const defaultCV = cvList[0];

      // 4. Submit application
      await applicationService.submitApplication(
        jobId,
        defaultCV.cvUrl,
        defaultCV.cvFileName || 'CV.pdf',
        defaultCV.cvS3Key
      );

      // 5. Send alerts to employer & candidate
      try {
        const candidateName = userEmail ? userEmail.split('@')[0] : 'Ứng viên';
        
        if (employerId && employerId !== 'system') {
          await createEmployerApplicationNotification({
            employerId,
            candidateId: userId,
            candidateName,
            jobTitle,
            companyName,
            jobId,
            isQuickJob: true
          });
        }

        await createCandidateApplicationSubmittedNotification({
          candidateId: userId,
          jobTitle,
          companyName,
          jobId,
          isQuickJob: true
        });
      } catch (notifyErr) {
        console.warn('Failed to send apply notifications:', notifyErr);
      }

      // 6. Mark notification as read
      try {
        await markAsRead(notification.notificationId);
      } catch (e) {
        console.warn('Failed to mark read:', e);
      }

      setSuccess(true);
      if (onApplied) onApplied(notification.notificationId);

    } catch (err) {
      console.error('Quick Apply failed:', err);
      setErrorState('system_error');
      setErrorMessage(err.message || 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={language === 'vi' ? '🔔 Tuyển dụng khẩn cấp!' : '🔔 Urgent Opportunity!'}
      size="medium"
    >
      <Container>
        {success ? (
          <SuccessView>
            <CheckCircle2 size={56} />
            <h3>{language === 'vi' ? 'Ứng tuyển thành công!' : 'Applied successfully!'}</h3>
            <p>
              {language === 'vi' 
                ? 'Hồ sơ của bạn đã được gửi trực tiếp tới Nhà tuyển dụng để tuyển dụng khẩn cấp.' 
                : 'Your profile has been sent directly to the Employer for urgent recruitment.'}
            </p>
            <ActionButton $primary onClick={onClose} style={{ marginTop: 12 }}>
              {language === 'vi' ? 'Đóng' : 'Close'}
            </ActionButton>
          </SuccessView>
        ) : (
          <>
            <AlertHeader>
              <Zap size={22} />
              <div>
                <div className="title">
                  {language === 'vi' ? 'Tuyển dụng thay thế gấp' : 'Urgent Replacement Need'}
                </div>
                <div className="desc">
                  {language === 'vi'
                    ? 'Bạn đang ở trong bán kính phù hợp và có trạng thái sẵn sàng làm việc. Hãy ứng cử ngay!'
                    : 'You are within the matching area and marked as active. Apply now!'}
                </div>
              </div>
            </AlertHeader>

            <JobDetailsCard>
              <h4 className="job-title">{jobTitle}</h4>
              <div className="company-name">{companyName}</div>

              <InfoGrid>
                <InfoItem>
                  <MapPin size={16} />
                  <div>
                    <span className="label">{language === 'vi' ? 'Địa điểm:' : 'Location:'}</span>
                    <span className="value">{location}</span>
                  </div>
                </InfoItem>

                <InfoItem>
                  <DollarSign size={16} />
                  <div>
                    <span className="label">{language === 'vi' ? 'Thu nhập:' : 'Salary:'}</span>
                    <span className="value" style={{ color: '#ef4444' }}>{salary}</span>
                  </div>
                </InfoItem>

                <InfoItem>
                  <Clock size={16} />
                  <div>
                    <span className="label">{language === 'vi' ? 'Thời gian:' : 'Time:'}</span>
                    <span className="value">{workTime}</span>
                  </div>
                </InfoItem>

                <InfoItem>
                  <Briefcase size={16} />
                  <div>
                    <span className="label">{language === 'vi' ? 'Loại hình:' : 'Job type:'}</span>
                    <span className="value">{language === 'vi' ? 'Làm gấp' : 'Urgent replacement'}</span>
                  </div>
                </InfoItem>
              </InfoGrid>
            </JobDetailsCard>

            {errorState === 'ekyc_required' && (
              <StatusBox $bgColor="#fffbeb" $borderColor="#fde68a" $color="#92400e">
                <AlertTriangle size={18} />
                <div>
                  {language === 'vi'
                    ? 'Bạn chưa xác thực eKYC. Vui lòng xác thực trước khi ứng tuyển.'
                    : 'eKYC verification is required to apply.'}
                  <div style={{ marginTop: 8 }}>
                    <ActionButton $primary onClick={() => handleRedirect('/candidate/ekyc')} style={{ padding: '6px 12px', fontSize: 12 }}>
                      {language === 'vi' ? 'Xác thực eKYC ngay' : 'Verify eKYC now'} <ArrowRight size={12} />
                    </ActionButton>
                  </div>
                </div>
              </StatusBox>
            )}

            {errorState === 'cv_required' && (
              <StatusBox $bgColor="#eff6ff" $borderColor="#bfdbfe" $color="#1e40af">
                <AlertTriangle size={18} />
                <div>
                  {language === 'vi'
                    ? 'Bạn chưa tải CV lên hệ thống. Vui lòng tải CV lên Hồ sơ cá nhân.'
                    : 'No CV found. Please upload a CV first.'}
                  <div style={{ marginTop: 8 }}>
                    <ActionButton $primary onClick={() => handleRedirect('/candidate/profile')} style={{ padding: '6px 12px', fontSize: 12 }}>
                      {language === 'vi' ? 'Tải CV lên ngay' : 'Upload CV now'} <ArrowRight size={12} />
                    </ActionButton>
                  </div>
                </div>
              </StatusBox>
            )}

            {errorState === 'system_error' && (
              <StatusBox $bgColor="#fef2f2" $borderColor="#fecaca" $color="#991b1b">
                <AlertTriangle size={18} />
                <div>
                  {language === 'vi' ? 'Lỗi ứng tuyển:' : 'Application error:'} {errorMessage}
                </div>
              </StatusBox>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <ActionButton disabled={loading} onClick={handleSkip}>
                {language === 'vi' ? 'Bỏ qua' : 'Skip'}
              </ActionButton>
              
              {!success && errorState !== 'ekyc_required' && errorState !== 'cv_required' && (
                <ActionButton $primary disabled={loading} onClick={handleApply}>
                  {loading 
                    ? (language === 'vi' ? 'Đang ứng tuyển...' : 'Applying...') 
                    : (language === 'vi' ? 'Ứng tuyển nhanh' : 'Quick Apply')}
                </ActionButton>
              )}
            </div>
          </>
        )}
      </Container>
    </Modal>
  );
};

export default UrgentJobAlertModal;
