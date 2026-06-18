import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { Button, Input, TextArea, Select, FormGroup, Label } from '../../components/FormElements';
import { Save, ArrowLeft, AlertCircle, Briefcase, Clock, FileText, CheckSquare, ClipboardList, Gift, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import jobPostService from '../../services/jobPostService';
import employerProfileService from '../../services/employerProfileService';
import { fetchAuthSession } from 'aws-amplify/auth';
import cvAiService from '../../services/cvAiService';

// Keyframe animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PostJobContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
  animation: ${fadeIn} 0.4s ease-out;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
  margin-bottom: 24px;
  background: none;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
    transform: translateX(-4px);
  }
  
  svg {
    width: 20px;
    height: 20px;
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: translateX(-2px);
  }
`;

const FormCard = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 40px;
  border: 1px solid ${props => props.theme.colors.border};
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.5s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #1e40af 0%, #2563eb 100%);
  }
  
  @media (max-width: 768px) {
    padding: 32px 24px;
    border-radius: 16px;
  }
`;

const FormHeader = styled.div`
  margin-bottom: 32px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  
  .icon-box {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 2px solid #BFDBFE;
    
    svg {
      width: 28px;
      height: 28px;
      color: #1e40af;
    }
  }
  
  .header-text {
    flex: 1;
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      color: ${props => props.theme.colors.text};
      
      @media (max-width: 768px) {
        font-size: 24px;
      }
    }
    
    p {
      color: ${props => props.theme.colors.textLight};
      font-size: 15px;
      line-height: 1.6;
    }
  }
`;

const SectionLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  svg {
    width: 16px;
    height: 16px;
    color: #1e40af;
    flex-shrink: 0;
  }
`;

const SubmitButton = styled(Button)`
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  border: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(30, 64, 175, 0.3);
  }
`;

const InfoBox = styled.div`
  background: #EFF6FF;
  border: 2px solid #BFDBFE;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
  animation: ${fadeIn} 0.7s ease-out;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.1);
  }
  
  svg {
    width: 20px;
    height: 20px;
    color: #1e40af;
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .info-content {
    flex: 1;
    
    .info-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 4px;
    }
    
    .info-text {
      font-size: 13px;
      color: #1e3a8a;
      line-height: 1.6;
    }
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.$columns || '1fr'};
  gap: 20px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const WorkHoursRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const WorkHoursActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 42px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid ${props => props.$danger ? '#fecaca' : '#bfdbfe'};
  background: ${props => props.$danger ? '#fff1f2' : '#eff6ff'};
  color: ${props => props.$danger ? '#dc2626' : '#1e40af'};
  font-size: 13px;
  font-weight: 700;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(30, 64, 175, 0.12);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 32px;
  border-top: 2px solid ${props => props.theme.colors.border};
`;

const SalaryInputWrapper = styled.div`
  position: relative;
  flex: 1;
  
  input {
    padding-right: 70px;
  }
  
  &::after {
    content: 'VNĐ/h';
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #1e40af;
    font-weight: 700;
    font-size: 13px;
    pointer-events: none;
    background: #EFF6FF;
    padding: 4px 10px;
    border-radius: 6px;
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SpinningLoader = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const AiButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: white;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  margin-bottom: 12px;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const VerificationWarning = styled.div`
  background: #FEF3C7;
  border: 2px solid #FCD34D;
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 32px;
  color: #92400E;
  display: flex;
  align-items: start;
  gap: 16px;
  
  svg {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    color: #D97706;
  }
  
  .content {
    flex: 1;
    
    h3 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #78350F;
    }
    
    p {
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 16px;
      color: #92400E;
    }
    
    button {
      background: #1e40af;
      color: white;
      font-weight: 700;
      padding: 10px 20px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      
      &:hover {
        background: #1e3a8a;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
      }
    }
  }
`;

const VerificationModalContent = styled.div`
  text-align: center;
  padding: 32px 24px;
  
  .icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    border-radius: 50%;
    background: #FEF3C7;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D97706;
    border: 3px solid #FCD34D;
    
    svg {
      width: 40px;
      height: 40px;
    }
  }
  
  h3 {
    font-size: 24px;
    font-weight: 800;
    margin-bottom: 16px;
    color: #1E293B;
  }
  
  p {
    font-size: 15px;
    color: #64748B;
    line-height: 1.7;
    margin-bottom: 28px;
  }
  
  .button-group {
    display: flex;
    gap: 12px;
    justify-content: center;
    
    button {
      flex: 1;
      max-width: 200px;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
      }
    }
  }
`;

const PostJob = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const editingJob = location.state?.job; // Get job data if editing
  const isEditing = !!editingJob;

  const createWorkHourSlot = (isNew = true) => ({ startTime: '', endTime: '', isNew });
  const parseWorkHours = (workHours) => {
    const normalized = String(workHours || '')
      .split(/\s*(?:\||,|\n)\s*/)
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const [startTime = '', endTime = ''] = part.split('-').map(t => t.trim());
        return startTime && endTime ? { startTime, endTime, isNew: false } : null;
      })
      .filter(Boolean)
      .slice(0, 5);

    return normalized.length > 0 ? normalized : [createWorkHourSlot(false)];
  };
  const serializeWorkHours = (slots) => slots
    .filter(slot => slot.startTime && slot.endTime)
    .map(slot => `${slot.startTime} - ${slot.endTime}`)
    .join(' | ');

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [workHoursList, setWorkHoursList] = useState([createWorkHourSlot(false)]);
  const [loadingAi, setLoadingAi] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    jobType: '',
    workDays: '',
    workHours: '',
    salary: '',
    tags: '',
    description: '',
    requirements: '',
    benefits: ''
  });

  // Check verification status on mount — fetch real isVerified from API
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const profile = await employerProfileService.getMyProfile();
        if (profile && profile.isVerified === true) {
          setVerificationStatus('approved');
        } else {
          // Check if pending (submitted but not yet approved)
          const verificationData = profile?.verificationStatus || null;
          if (verificationData === 'pending') {
            setVerificationStatus('pending');
          } else {
            setVerificationStatus('not_started');
          }
          if (!isEditing) {
            setShowVerificationModal(true);
          }
        }
      } catch (err) {
        console.error('Error checking verification status:', err);
        // Fallback: block access
        setVerificationStatus('not_started');
        if (!isEditing) setShowVerificationModal(true);
      }
    };
    checkVerification();
  }, [isEditing]);

  // Pre-fill form if editing
  useEffect(() => {
    if (editingJob) {
      const parsedWorkHours = parseWorkHours(editingJob.workHours || `${editingJob.startTime || ''} - ${editingJob.endTime || ''}`);
      setWorkHoursList(parsedWorkHours);
      setFormData({
        title: editingJob.title || '',
        location: editingJob.location || '',
        jobType: editingJob.jobType || '',
        workDays: editingJob.workDays || '',
        workHours: editingJob.workHours || serializeWorkHours(parsedWorkHours),
        salary: editingJob.salary || '',
        tags: editingJob.tags || '',
        description: editingJob.description || '',
        requirements: editingJob.requirements || '',
        benefits: editingJob.benefits || ''
      });
    }
  }, [editingJob]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      workHours: serializeWorkHours(workHoursList)
    }));
  }, [workHoursList]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update formData
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkHourChange = (index, field, value) => {
    setWorkHoursList(prev => prev.map((slot, slotIndex) => (
      slotIndex === index ? { ...slot, [field]: value } : slot
    )));
  };

  const addWorkHour = () => {
    setWorkHoursList(prev => {
      if (prev.length >= 5) return prev;
      return [...prev, createWorkHourSlot()];
    });
  };

  const removeWorkHour = (index) => {
    setWorkHoursList(prev => {
      if (prev.length === 1) return prev;
      const next = prev.filter((_, slotIndex) => slotIndex !== index);
      return next.length > 0 ? next : [createWorkHourSlot()];
    });
  };

  const handleGenerateJdWithAi = async () => {
    if (!formData.title.trim()) return;
    
    setLoadingAi(true);
    try {
      const result = await cvAiService.suggestJd({
        title: formData.title,
        location: formData.location,
        jobType: formData.jobType,
        workDays: formData.workDays,
        workHours: formData.workHours,
        salary: formData.salary,
        tags: formData.tags,
        language: language
      });
      
      if (result) {
        setFormData(prev => ({
          ...prev,
          description: result.description || prev.description,
          responsibilities: result.responsibilities || prev.responsibilities,
          requirements: result.requirements || prev.requirements,
          benefits: result.benefits || prev.benefits
        }));
      }
    } catch (error) {
      console.error('Error generating JD with AI:', error);
      alert(error.message || (language === 'vi' 
        ? 'Không thể tạo JD tự động. Vui lòng thử lại.' 
        : 'Failed to generate JD. Please try again.'));
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate work date is not in the past
    if (formData.workDays) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.workDays < today) {
        alert(language === 'vi'
          ? 'Ngày làm việc không được ở trong quá khứ.'
          : 'Work date cannot be in the past.');
        return;
      }
    }

    // Block new job posting if not verified
    if (!isEditing && verificationStatus !== 'approved') {
      setShowVerificationModal(true);
      return;
    }

    console.log('🔥🔥🔥 SUBMIT BUTTON CLICKED');
    console.log('📦 Form data:', formData);
    console.log('📝 Is editing:', isEditing);
    console.log('📝 Editing job:', editingJob);

    try {
      if (isEditing) {
        // Update existing job in DynamoDB
        const jobId = editingJob.idJob || editingJob.id;
        console.log('🔄 Updating job with ID:', jobId);

        if (!jobId) {
          throw new Error('Job ID not found');
        }

        await jobPostService.updateJobPost(jobId, formData);
        console.log('✅ Job post updated successfully');
      } else {
        // Get authenticated user info
        const session = await fetchAuthSession();
        let employerId = 'anonymous';
        let employerEmail = 'anonymous@example.com';
        let employerName = language === 'vi' ? 'Công ty' : 'Company';

        if (session && session.tokens) {
          const idTokenPayload = session.tokens.idToken?.payload;
          employerId = idTokenPayload?.sub || 'anonymous';
          employerEmail = idTokenPayload?.email || 'anonymous@example.com';

          // Try to get company name from EmployerProfile
          try {
            const profile = await employerProfileService.getMyProfile();
            if (profile && profile.companyName) {
              employerName = profile.companyName;
              console.log('✅ Got company name from profile:', employerName);
            } else {
              // Fallback to email username
              employerName = employerEmail.split('@')[0];
              console.log('⚠️ No company name in profile, using email username');
            }
          } catch (error) {
            console.warn('⚠️ Could not load employer profile:', error);
            employerName = employerEmail.split('@')[0];
          }

          console.log('✅ User authenticated:', { employerId, employerEmail, employerName });
        } else {
          console.warn('⚠️ No authentication session - using anonymous');
        }

        // Generate job ID
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomStr = '';
        for (let i = 0; i < 5; i++) {
          randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const jobId = `JOB-${year}${month}${day}-${randomStr}`;

        const payload = {
          idJob: jobId,
          employerId: employerId,
          employerEmail: employerEmail,
          employerName: employerName,
          ...formData,
          // Require admin moderation for standard jobs
          status: 'pending',
          applicants: 0,
          views: 0,
          responseRate: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        console.log('📤 Sending request with employer info:', payload);

        // Use direct API (CORS is fixed)
        const apiUrl = 'https://dlidp35x33.execute-api.ap-southeast-1.amazonaws.com/prod/jobs';

        console.log('🔗 API URL:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          mode: 'cors'
        });

        console.log('📥 Response status:', response.status);

        const result = await response.json();
        console.log('📥 Response data:', result);

        if (response.ok) {
          console.log('✅ Job post created successfully with ID:', result.data.idJob);
        } else {
          throw new Error('API request failed: ' + response.status);
        }
      }

      // Navigate back to standard jobs page
      navigate('/employer/standard-jobs');
    } catch (error) {
      console.error('❌ Error saving job post:', error);
      alert(language === 'vi'
        ? 'Có lỗi xảy ra khi lưu tin tuyển dụng. Vui lòng thử lại.'
        : 'Error saving job post. Please try again.');
    }
  };

  return (
    <DashboardLayout role="employer" showSearch={false} key={language}>
      <PostJobContainer>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeft /> {language === 'vi' ? 'Quay lại' : 'Back'}
        </BackButton>

        {/* Verification Warning */}
        {verificationStatus !== 'approved' && !isEditing && (
          <VerificationWarning>
            <AlertCircle />
            <div className="content">
              <h3>{language === 'vi' ? '⚠️ Yêu cầu xác thực hồ sơ công ty' : '⚠️ Company Verification Required'}</h3>
              <p>
                {language === 'vi'
                  ? 'Bạn cần hoàn tất xác thực hồ sơ công ty trước khi đăng tin tuyển dụng. Quá trình xác thực bao gồm 4 bước: Giấy phép kinh doanh, Thông tin doanh nghiệp, Người đại diện, và Thông tin liên hệ.'
                  : 'You need to complete company verification before posting jobs. The verification process includes 4 steps: Business License, Company Information, Representative, and Contact Information.'}
              </p>
              {verificationStatus === 'pending' ? (
                <p style={{ fontWeight: '600', marginBottom: 0 }}>
                  {language === 'vi'
                    ? '✓ Hồ sơ đang được xem xét. Chúng tôi sẽ phê duyệt trong vòng 24-48 giờ.'
                    : '✓ Your profile is under review. We will approve within 24-48 hours.'}
                </p>
              ) : (
                <button onClick={() => navigate('/employer/verification')}>
                  {language === 'vi' ? 'Bắt đầu xác thực ngay' : 'Start Verification Now'}
                </button>
              )}
            </div>
          </VerificationWarning>
        )}

        <FormCard>
          <FormHeader>
            <div className="icon-box">
              <Briefcase />
            </div>
            <div className="header-text">
              <h1>{isEditing
                ? (language === 'vi' ? 'Chỉnh Sửa Tin Tuyển Dụng' : 'Edit Job Posting')
                : (language === 'vi' ? 'Đăng Bài Tiêu Chuẩn' : 'Post New Job')}
              </h1>
              <p>{isEditing
                ? (language === 'vi' ? 'Cập nhật thông tin tin tuyển dụng' : 'Update job posting details')
                : (language === 'vi' ? 'Điền thông tin để tạo tin tuyển dụng' : 'Fill in the details to create a job posting')}
              </p>
            </div>
          </FormHeader>

          <InfoBox>
            <Clock />
            <div className="info-content">
              <div className="info-title">{language === 'vi' ? 'Lưu ý về bài đăng' : 'Posting Guidelines'}</div>
              <div className="info-text">
                {language === 'vi'
                  ? 'Bài đăng sẽ được ưu tiên hiển thị và có thời hạn tuyển dụng linh hoạt. Phù hợp cho các vị trí cần tuyển dụng lâu dài.'
                  : 'Posts will be prioritized and have flexible recruitment deadlines. Suitable for long-term recruitment positions.'}
              </div>
            </div>
          </InfoBox>

          <form onSubmit={handleSubmit}>
            <FormRow $columns="1fr 1fr">
              <FormGroup>
                <Label>{language === 'vi' ? 'Tiêu đề công việc - Vị trí công việc *' : 'Job Title - Position *'}</Label>
                <Input name="title" placeholder={language === 'vi' ? 'Nhân viên pha chế' : 'e.g., Waiter'} value={formData.title} onChange={handleChange} required />
              </FormGroup>

              <FormGroup>
                <Label>{language === 'vi' ? 'Địa điểm *' : 'Location *'}</Label>
                <Input
                  name="location"
                  placeholder={language === 'vi' ? 'Quận 1' : 'e.g., District 1'}
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>{language === 'vi' ? 'Loại hình công việc *' : 'Job Type *'}</Label>
                <Select name="jobType" value={formData.jobType} onChange={handleChange} required>
                  <option value="">{language === 'vi' ? 'Chọn loại hình' : 'Select type'}</option>
                  <option value="part-time">{language === 'vi' ? 'Bán thời gian' : 'Part-time'}</option>
                  <option value="full-time">{language === 'vi' ? 'Toàn thời gian' : 'Full-time'}</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>{language === 'vi' ? 'Thời hạn nộp hồ sơ *' : 'Application Deadline *'}</Label>
                <Input
                  name="workDays"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  placeholder={language === 'vi' ? 'Chọn thời hạn' : 'Select deadline'}
                  value={formData.workDays}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>{language === 'vi' ? 'Khung giờ làm việc *' : 'Working Hours *'}</Label>
                <div style={{ marginTop: '4px' }}>
                  {workHoursList.map((slot, index) => (
                    <WorkHoursRow key={index}>
                      <div>
                        <Label style={{ fontSize: '13px', marginBottom: '8px' }}>{language === 'vi' ? 'Từ' : 'From'}</Label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleWorkHourChange(index, 'startTime', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label style={{ fontSize: '13px', marginBottom: '8px' }}>{language === 'vi' ? 'Đến' : 'To'}</Label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleWorkHourChange(index, 'endTime', e.target.value)}
                          required
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <WorkHoursActionButton
                          type="button"
                          onClick={addWorkHour}
                          disabled={workHoursList.length >= 5}
                          title={language === 'vi' ? 'Thêm khung giờ' : 'Add time slot'}
                        >
                          <Plus />
                        </WorkHoursActionButton>
                        {slot.isNew && (
                          <WorkHoursActionButton
                            type="button"
                            $danger
                            onClick={() => removeWorkHour(index)}
                            title={language === 'vi' ? 'Xóa khung giờ' : 'Remove time slot'}
                          >
                            <Trash2 />
                          </WorkHoursActionButton>
                        )}
                      </div>
                    </WorkHoursRow>
                  ))}
                </div>
              </FormGroup>

              <FormGroup>
                <Label>{language === 'vi' ? 'Mức lương' : 'Salary'}</Label>
                <SalaryInputWrapper>
                  <Input
                    name="salary"
                    type="number"
                    placeholder={language === 'vi' ? 'Ví dụ: 25000' : 'e.g., 25000'}
                    value={formData.salary}
                    onChange={handleChange}
                  />
                </SalaryInputWrapper>
              </FormGroup>

              <FormGroup>
                <Label>{language === 'vi' ? 'Đặc điểm (Không bắt buộc)' : 'Tags (Optional)'}</Label>
                <Input
                  name="tags"
                  placeholder={language === 'vi' ? 'Pha chế, F&B, Coffee (phân cách bằng dấu phẩy)' : 'Barista, F&B, Coffee (comma separated)'}
                  value={formData.tags}
                  onChange={handleChange}
                />
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
                  {language === 'vi'
                    ? 'Nhập các đặc điểm và phân cách bằng dấu phẩy. Ví dụ: Pha chế, F&B, Coffee'
                    : 'Enter tags separated by commas. Example: Barista, F&B, Coffee'}
                </p>
              </FormGroup>
            </FormRow>

            <FormGroup style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <SectionLabel style={{ marginBottom: 0 }}>
                  <FileText />
                  <span>{language === 'vi' ? 'Mô tả công việc *' : 'Job Description *'}</span>
                </SectionLabel>
                {formData.title && (
                  <AiButton
                    type="button"
                    onClick={handleGenerateJdWithAi}
                    disabled={loadingAi}
                    style={{ marginBottom: 0 }}
                  >
                    {loadingAi ? (
                      <>
                        <SpinningLoader size={14} />
                        {language === 'vi' ? 'Đang tạo JD...' : 'Generating JD...'}
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        {language === 'vi' ? 'Tạo nhanh JD với AI' : 'Quickly generate JD with AI'}
                      </>
                    )}
                  </AiButton>
                )}
              </div>
              <TextArea name="description" placeholder={language === 'vi' ? 'Mô tả vị trí công việc...' : 'Describe the position...'} value={formData.description} onChange={handleChange} required />
            </FormGroup>



            <FormGroup>
              <SectionLabel>
                <ClipboardList />
                <span>{language === 'vi' ? 'Yêu cầu' : 'Requirements'}</span>
              </SectionLabel>
              <TextArea name="requirements" placeholder={language === 'vi' ? 'Liệt kê yêu cầu và trình độ...' : 'List requirements and qualifications...'} value={formData.requirements} onChange={handleChange} />
            </FormGroup>

            <FormGroup>
              <SectionLabel>
                <Gift />
                <span>{language === 'vi' ? 'Quyền lợi' : 'Benefits'}</span>
              </SectionLabel>
              <TextArea name="benefits" placeholder={language === 'vi' ? 'Liệt kê quyền lợi và phúc lợi...' : 'List benefits and perks...'} value={formData.benefits} onChange={handleChange} />
            </FormGroup>

            <FormActions>
              <Button type="button" $variant="secondary" onClick={() => navigate('/employer/dashboard')}>
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <SubmitButton type="submit" $variant="primary" $size="large">
                <Save /> {isEditing
                  ? (language === 'vi' ? 'Cập Nhật' : 'Update Job')
                  : (language === 'vi' ? 'Đăng Tin' : 'Post Job')}
              </SubmitButton>
            </FormActions>
          </form>
        </FormCard>
      </PostJobContainer>

      {/* Verification Required Modal */}
      <Modal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          if (verificationStatus !== 'approved') {
            navigate('/employer/dashboard');
          }
        }}
        title={language === 'vi' ? 'Xác Thực Hồ Sơ Công Ty' : 'Company Verification'}
        size="medium"
      >
        <VerificationModalContent>
          <div className="icon">
            <AlertCircle />
          </div>
          <h3>{language === 'vi' ? 'Yêu cầu xác thực hồ sơ' : 'Verification Required'}</h3>
          <p>
            {verificationStatus === 'pending'
              ? (language === 'vi'
                ? 'Hồ sơ công ty của bạn đang được xem xét. Vui lòng chờ phê duyệt trước khi đăng tin tuyển dụng. Thời gian xử lý: 24-48 giờ.'
                : 'Your company profile is under review. Please wait for approval before posting jobs. Processing time: 24-48 hours.')
              : (language === 'vi'
                ? 'Để đăng tin tuyển dụng, bạn cần hoàn tất 4 bước xác thực hồ sơ công ty: Giấy phép kinh doanh, Thông tin doanh nghiệp, Người đại diện và Thông tin liên hệ.'
                : 'To post jobs, you need to complete 4 steps of company verification: Business License, Company Information, Representative, and Contact Information.')}
          </p>
          <div className="button-group">
            <Button
              $variant="secondary"
              onClick={() => {
                setShowVerificationModal(false);
                navigate('/employer/dashboard');
              }}
            >
              {language === 'vi' ? 'Để sau' : 'Later'}
            </Button>
            {verificationStatus !== 'pending' && (
              <Button
                $variant="primary"
                onClick={() => navigate('/employer/verification')}
              >
                {language === 'vi' ? 'Xác thực ngay' : 'Verify Now'}
              </Button>
            )}
          </div>
        </VerificationModalContent>
      </Modal>
    </DashboardLayout>
  );
};

export default PostJob;
