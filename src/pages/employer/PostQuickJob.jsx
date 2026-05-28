import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import AddressInput from '../../components/AddressInput';
import { Button, Input, TextArea, Select, FormGroup, Label } from '../../components/FormElements';
import { Save, ArrowLeft, AlertCircle, CheckCircle, Clock, Zap, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import quickJobService from '../../services/quickJobService';
import employerProfileService from '../../services/employerProfileService';

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

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.15);
  }
  50% {
    box-shadow: 0 4px 20px rgba(30, 64, 175, 0.3);
  }
`;

const countUp = keyframes`
  from {
    transform: scale(0.95);
    opacity: 0.5;
  }
  to {
    transform: scale(1);
    opacity: 1;
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
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    p {
      color: ${props => props.theme.colors.textLight};
      font-size: 15px;
      line-height: 1.6;
    }
  }
`;

const UrgentBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border: 2px solid #1e40af;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  color: #1e40af;
  animation: ${fadeIn} 0.6s ease-out;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(30, 64, 175, 0.2);
  }
  
  svg {
    width: 14px;
    height: 14px;
    animation: ${pulseGlow} 2s ease-in-out infinite;
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

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 32px;
  border-top: 2px solid ${props => props.theme.colors.border};
`;

const TotalSalaryBox = styled.div`
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border: 2px solid #1e40af;
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.15);
  height: 100%;
  min-height: 100px;
  animation: ${slideInRight} 0.4s ease-out;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.25);
  }
  
  .salary-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .label-text {
      font-size: 13px;
      font-weight: 600;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      animation: ${fadeIn} 0.5s ease-out;
    }
    
    .hours-info {
      font-size: 12px;
      color: #1e40af;
      opacity: 0.8;
      animation: ${fadeIn} 0.6s ease-out;
    }
  }
  
  .salary-amount {
    display: flex;
    align-items: baseline;
    gap: 4px;
    
    .amount {
      font-size: 32px;
      font-weight: 800;
      color: #1e40af;
      letter-spacing: -0.5px;
      animation: ${countUp} 0.4s ease-out;
      transition: all 0.2s ease;
    }
    
    .currency {
      font-size: 16px;
      font-weight: 600;
      color: #1e40af;
      opacity: 0.7;
    }
  }
  
  &.empty {
    opacity: 0.5;
    border-style: dashed;
    animation: ${pulseGlow} 2s ease-in-out infinite;
  }
  
  &.active {
    animation: ${pulseGlow} 1.5s ease-in-out;
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

const ModalContent = styled.div`
  text-align: center;
`;

const ModalIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$success ? '#D1FAE5' : '#FEE2E2'};
  
  svg {
    width: 40px;
    height: 40px;
    color: ${props => props.$success ? '#059669' : '#DC2626'};
  }
`;

const ModalTitle = styled.h3`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  color: ${props => props.theme.colors.text};
`;

const ModalMessage = styled.p`
  font-size: 15px;
  color: ${props => props.theme.colors.textLight};
  line-height: 1.6;
  margin-bottom: 24px;
`;

const PostQuickJob = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [salaryBoxActive, setSalaryBoxActive] = useState(false);
  const [salaryError, setSalaryError] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);

  const parseHourlyRateInput = (input) => {
    const rawValue = String(input ?? '').trim();
    if (!rawValue) return NaN;

    // Interpret separators as thousand delimiters: 32.000 / 32,000 => 32000
    const normalizedValue = rawValue.replace(/[.,\s]/g, '');
    const parsedValue = Number(normalizedValue);

    return Number.isFinite(parsedValue) ? parsedValue : NaN;
  };

  const [formData, setFormData] = useState(() => {
    // Load draft from localStorage on mount
    const savedDraft = localStorage.getItem('quickJobDraft');
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
    return {
      title: '',
      location: '',
      latitude: '', // GPS latitude
      longitude: '', // GPS longitude
      jobType: '', // Loại hình công việc
      hourlyRate: '', // Lương theo giờ
      startTime: '', // Thời gian bắt đầu ca
      endTime: '', // Thời gian kết thúc ca
      workDate: '', // Ngày làm việc
      description: '',
      requirements: '', // Yêu cầu
      contactPhone: ''
    };
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Parse hourly rate internally while keeping what user typed
    if (name === 'hourlyRate') {
      const numValue = parseHourlyRateInput(value);

      // Show error if value is entered and < 31875
      if (value !== '' && !isNaN(numValue) && numValue < 31875) {
        setSalaryError(true);
      } else {
        setSalaryError(false);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle address change from AddressInput component
  const handleAddressChange = (address) => {
    setFormData(prev => ({
      ...prev,
      location: address
    }));
  };

  // Handle coordinates change from AddressInput component
  const handleCoordinatesChange = (coordinates) => {
    if (coordinates) {
      setFormData(prev => ({
        ...prev,
        latitude: coordinates.lat.toString(),
        longitude: coordinates.lng.toString()
      }));
      console.log('✅ GPS coordinates updated:', coordinates);
    }
  };

  // Calculate total salary based on hourly rate and working hours
  const calculateTotalSalary = () => {
    const { hourlyRate, startTime, endTime } = formData;
    
    if (!hourlyRate || !startTime || !endTime) {
      return null;
    }

    const rate = parseHourlyRateInput(hourlyRate);
    if (isNaN(rate) || rate < 31875) {
      return null;
    }

    // Parse time strings (HH:MM)
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      return null;
    }

    // Calculate hours worked
    let hoursWorked = (endHour + endMin / 60) - (startHour + startMin / 60);
    
    // Handle negative (next day scenario)
    if (hoursWorked < 0) {
      hoursWorked += 24;
    }

    if (hoursWorked === 0) {
      return null;
    }

    const totalSalary = rate * hoursWorked;
    
    return {
      hours: hoursWorked,
      total: totalSalary
    };
  };

  const salaryCalculation = calculateTotalSalary();

  // Auto-save form data to localStorage
  useEffect(() => {
    localStorage.setItem('quickJobDraft', JSON.stringify(formData));
  }, [formData]);

  // Trigger animation when salary calculation changes
  useEffect(() => {
    if (salaryCalculation) {
      setSalaryBoxActive(true);
      const timer = setTimeout(() => setSalaryBoxActive(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [salaryCalculation?.total]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.location || !formData.hourlyRate || !formData.workDate) {
      setModalType('error');
      setShowModal(true);
      return;
    }

    // Validate work date is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (formData.workDate < today) {
      setModalType('error');
      setPaymentInfo({
        error: true,
        message: language === 'vi' 
          ? 'Ngày làm việc không được ở trong quá khứ.'
          : 'Work date cannot be in the past.'
      });
      setShowModal(true);
      return;
    }

    // Validate hourly rate must be >= 31875
    const rate = parseHourlyRateInput(formData.hourlyRate);
    if (isNaN(rate) || rate < 31875) {
      setSalaryError(true);
      setModalType('error');
      setShowModal(true);
      return;
    }

    // Check if time range is provided
    if (!formData.startTime || !formData.endTime) {
      setModalType('error');
      setPaymentInfo({
        error: true,
        message: language === 'vi' 
          ? 'Vui lòng điền đầy đủ khung giờ làm việc.'
          : 'Please fill in the working hours.'
      });
      setShowModal(true);
      return;
    }

    // Calculate total salary (fee to deduct)
    const calculation = calculateTotalSalary();
    if (!calculation || !calculation.total) {
      setModalType('error');
      setPaymentInfo({
        error: true,
        message: language === 'vi' 
          ? 'Không thể tính tổng lương. Vui lòng kiểm tra lại thông tin.'
          : 'Cannot calculate total salary. Please check your information.'
      });
      setShowModal(true);
      return;
    }

    const totalFee = Math.round(calculation.total); // Lấy tổng lương làm phí

    // Check wallet balance
    const walletData = JSON.parse(localStorage.getItem('employer_wallet') || '{"balance": 0}');
    const currentBalance = walletData.balance || 0;

    if (currentBalance < totalFee) {
      setModalType('error');
      setPaymentInfo({
        error: true,
        message: language === 'vi' 
          ? `Số dư không đủ. Bạn cần ${totalFee.toLocaleString('vi-VN')} VNĐ nhưng chỉ có ${currentBalance.toLocaleString('vi-VN')} VNĐ.`
          : `Insufficient balance. You need ${totalFee.toLocaleString('vi-VN')} VND but only have ${currentBalance.toLocaleString('vi-VN')} VND.`
      });
      setShowModal(true);
      return;
    }

    try {
      // Deduct fee from wallet
      const newBalance = currentBalance - totalFee;
      walletData.balance = newBalance;
      localStorage.setItem('employer_wallet', JSON.stringify(walletData));

      // Save transaction (wallet debit)
      const transaction = {
        id: Date.now(),
        type: 'debit',
        amount: totalFee,
        description: language === 'vi' 
          ? `Escrow - Đăng bài: ${formData.title} (${calculation.hours.toFixed(1)}h x ${rate.toLocaleString('vi-VN')} VNĐ)`
          : `Escrow - Post job: ${formData.title} (${calculation.hours.toFixed(1)}h x ${rate.toLocaleString('vi-VN')} VND)`,
        date: new Date().toISOString(),
        balanceAfter: newBalance
      };

      const transactions = JSON.parse(localStorage.getItem('employer_transactions') || '[]');
      transactions.unshift(transaction);
      localStorage.setItem('employer_transactions', JSON.stringify(transactions));

      // Get company name from employer profile
      let companyName = 'Unknown Company';
      try {
        const profile = await employerProfileService.getMyProfile();
        if (profile && (profile.companyName || profile.businessName)) {
          companyName = profile.companyName || profile.businessName;
          console.log('✅ Company name from profile:', companyName);
        }
      } catch (error) {
        console.warn('⚠️ Could not get company name from profile:', error);
        // Try localStorage as fallback
        const cachedProfile = localStorage.getItem('employerProfile');
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          companyName = parsed.companyName || parsed.businessName || 'Unknown Company';
        }
      }

      // Prepare job data for DynamoDB
      const jobData = {
        title: formData.title,
        location: formData.location,
        latitude: formData.latitude ? Math.round(parseFloat(formData.latitude) * 1000000) / 1000000 : null,
        longitude: formData.longitude ? Math.round(parseFloat(formData.longitude) * 1000000) / 1000000 : null,
        jobType: formData.jobType || 'part-time',
        hourlyRate: Math.round(rate), // Ensure integer
        startTime: formData.startTime,
        endTime: formData.endTime,
        totalHours: Math.round(calculation.hours * 10) / 10, // Round to 1 decimal place
        totalSalary: Math.round(totalFee), // Ensure integer
        description: formData.description || '',
        requirements: formData.requirements || '',
        contactPhone: formData.contactPhone || '',
        companyName: companyName,  // Add company name here
        status: 'pending',  // Created by employer -> require admin approval
        workDate: formData.workDate || '' // Store work date in workDate attribute
      };

      console.log('🚀 Submitting quick job to DynamoDB:', jobData);

      // Save to DynamoDB via quickJobService
      const savedJob = await quickJobService.createQuickJob(jobData);

      console.log('✅ Quick job saved:', savedJob);

      // Save to escrow - hold the funds by job ID
      const escrowJob = {
        jobId: savedJob.idJob || savedJob.id,
        jobTitle: formData.title,
        amount: totalFee,
        status: 'held',
        employerConfirmed: false,
        candidateConfirmed: false,
        createdAt: new Date().toISOString(),
        totalHours: calculation.hours,
        hourlyRate: rate
      };

      const escrowJobs = JSON.parse(localStorage.getItem('escrow_jobs') || '[]');
      escrowJobs.unshift(escrowJob);
      localStorage.setItem('escrow_jobs', JSON.stringify(escrowJobs));

      // Clear draft
      localStorage.removeItem('quickJobDraft');

      // Set payment info for success message
      setPaymentInfo({
        fee: totalFee,
        hours: calculation.hours,
        hourlyRate: rate,
        previousBalance: currentBalance,
        newBalance: newBalance,
        escrow: true
      });

      setModalType('success');
      setShowModal(true);
    } catch (error) {
      console.error('❌ Error creating quick job:', error);
      
      // Rollback wallet deduction
      walletData.balance = currentBalance;
      localStorage.setItem('employer_wallet', JSON.stringify(walletData));
      
      setModalType('error');
      setPaymentInfo({
        error: true,
        message: language === 'vi' 
          ? `Lỗi khi tạo bài đăng: ${error.message}`
          : `Error creating job post: ${error.message}`
      });
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    if (modalType === 'success') {
      navigate('/employer/quick-jobs');
    }
  };

  const translations = {
    vi: {
      backButton: 'Quay lại',
      pageTitle: 'Đăng bài tuyển gấp',
      pageSubtitle: 'Tạo bài đăng tuyển dụng khẩn cấp với thời gian xét duyệt nhanh chóng',
      urgentBadge: 'Tuyển gấp',
      infoTitle: 'Lưu ý về tuyển gấp',
      infoText: 'Bài đăng tuyển gấp sẽ được ưu tiên hiển thị và có thời hạn ngắn (2-7 ngày). Phù hợp cho các vị trí cần tuyển ngay lập tức.',
      
      // Form labels
      jobTitle: 'Tiêu đề công việc - Vị trí công việc',
      jobTitlePlaceholder: 'VD: Nhân viên Phục Vụ - Cần ngay',
      location: 'Địa điểm làm việc',
      locationPlaceholder: 'VD: Quận 1, TP.HCM',
      jobType: 'Loại hình công việc *',
      jobTypePartTime: 'Bán thời gian',
      jobTypeFullTime: 'Toàn thời gian',
      jobTypePlaceholder: 'Chọn loại hình',
      hourlyRate: 'Lương (VND)',
      hourlyRatePlaceholder: '',
      hourlyRateMin: 'Phải lớn hơn hoặc bằng 31.875 VNĐ',
      workDate: 'Ngày làm',
      workDatePlaceholder: 'Chọn ngày làm việc',
      workingHours: 'Khung giờ làm việc',
      startTime: 'Từ',
      endTime: 'Đến',
      startTimePlaceholder: '',
      endTimePlaceholder: '',
      
      totalSalary: 'Tổng lương ước tính',
      totalSalaryEmpty: 'Nhập lương và khung giờ để xem tổng',
      hoursWorked: 'giờ làm việc',
      
      description: 'Mô tả công việc',
      descriptionPlaceholder: 'Mô tả ngắn gọn về công việc cần tuyển...',
      
      requirements: 'Yêu cầu',
      requirementsPlaceholder: 'Liệt kê các yêu cầu cần thiết cho ứng viên...',
      
      contactPhone: 'Số điện thoại liên hệ',
      contactPhonePlaceholder: '0123 456 789',
      
      // Buttons
      cancelButton: 'Hủy',
      submitButton: 'Đăng bài ngay',
      
      // Modal
      successTitle: 'Đăng bài thành công!',
      successMessage: 'Bài đăng tuyển gấp của bạn đã được tạo và sẽ hiển thị trong vài phút.',
      paymentDeducted: 'Đã trừ phí đăng bài',
      remainingBalance: 'Số dư còn lại',
      errorTitle: 'Có lỗi xảy ra',
      errorMessage: 'Vui lòng điền đầy đủ các thông tin bắt buộc và đảm bảo lương theo giờ tối thiểu 31.875 VNĐ.',
      closeButton: 'Đóng'
    },
    en: {
      backButton: 'Back',
      pageTitle: 'Post Urgent Job',
      pageSubtitle: 'Create an urgent job posting with fast approval process',
      urgentBadge: 'Urgent Hiring',
      infoTitle: 'About Urgent Jobs',
      infoText: 'Urgent job postings will be prioritized and have shorter duration (2-7 days). Suitable for positions that need immediate filling.',
      
      // Form labels
      jobTitle: 'Job Title',
      jobTitlePlaceholder: 'e.g., Server - Immediate Need',
      location: 'Work Location',
      locationPlaceholder: 'e.g., District 1, HCMC',
      jobType: 'Job Type *',
      jobTypePartTime: 'Part-time',
      jobTypeFullTime: 'Full-time',
      jobTypePlaceholder: 'Select type',
      hourlyRate: 'Salary (VND)',
      hourlyRatePlaceholder: '',
      hourlyRateMin: 'Must be greater than or equal to 31,875 VND',
      workDate: 'Work Date',
      workDatePlaceholder: 'Select work date',
      workingHours: 'Working Hours',
      startTime: 'From',
      endTime: 'To',
      startTimePlaceholder: '',
      endTimePlaceholder: '',
      
      totalSalary: 'Estimated Total Salary',
      totalSalaryEmpty: 'Enter salary and hours to see total',
      hoursWorked: 'hours worked',
      
      description: 'Job Description',
      descriptionPlaceholder: 'Brief description of the job...',
      
      requirements: 'Requirements',
      requirementsPlaceholder: 'List the necessary requirements for candidates...',
      
      contactPhone: 'Contact Phone',
      contactPhonePlaceholder: '0123 456 789',
      
      // Buttons
      cancelButton: 'Cancel',
      submitButton: 'Post Now',
      
      // Modal
      successTitle: 'Posted Successfully!',
      successMessage: 'Your urgent job posting has been created and will be visible in a few minutes.',
      paymentDeducted: 'Posting fee deducted',
      remainingBalance: 'Remaining balance',
      errorTitle: 'Error Occurred',
      errorMessage: 'Please fill in all required fields and ensure hourly rate is at least 31.875 VND.',
      closeButton: 'Close'
    }
  };

  const t = translations[language];

  return (
    <DashboardLayout role="employer">
      <PostJobContainer>
        <BackButton onClick={() => navigate('/employer/quick-jobs')}>
          <ArrowLeft />
          {t.backButton}
        </BackButton>

        <FormCard>
          <FormHeader>
            <div className="icon-box">
              <Zap />
            </div>
            <div className="header-text">
              <h1>
                {t.pageTitle}
                <UrgentBadge>
                  <Clock />
                  {t.urgentBadge}
                </UrgentBadge>
              </h1>
              <p>{t.pageSubtitle}</p>
            </div>
          </FormHeader>

          <InfoBox>
            <AlertCircle />
            <div className="info-content">
              <div className="info-title">{t.infoTitle}</div>
              <div className="info-text">{t.infoText}</div>
            </div>
          </InfoBox>

          <form onSubmit={handleSubmit}>
            <FormGroup>
              <Label required>{t.jobTitle}</Label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t.jobTitlePlaceholder}
                required
              />
            </FormGroup>

            <FormRow $columns="1fr 1fr">
              <FormGroup>
                <Label required>{t.location}</Label>
                <AddressInput
                  value={formData.location}
                  onChange={handleAddressChange}
                  onCoordinatesChange={handleCoordinatesChange}
                  placeholder={t.locationPlaceholder}
                  required
                  showCoordinates={true}
                />
              </FormGroup>

              <FormGroup>
                <Label required>{t.jobType}</Label>
                <Select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t.jobTypePlaceholder}</option>
                  <option value="part-time">{t.jobTypePartTime}</option>
                  <option value="full-time">{t.jobTypeFullTime}</option>
                </Select>
              </FormGroup>
            </FormRow>

            <FormRow $columns="1fr 1fr">
              <FormGroup>
                <Label required>{t.hourlyRate}</Label>
                <Input
                  name="hourlyRate"
                  type="number"
                  min="0"
                  step="any"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  placeholder={t.hourlyRatePlaceholder}
                  required
                  style={{
                    borderColor: salaryError ? '#EF4444' : '',
                    background: salaryError ? '#FEE2E2' : ''
                  }}
                />
                {salaryError ? (
                  <small style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                    ⚠️ {language === 'vi' ? 'Lương phải lớn hơn hoặc bằng 31.875 VNĐ' : 'Salary must be >= 31,875 VND'}
                  </small>
                ) : (
                  <small style={{ color: '#000000', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {t.hourlyRateMin}
                  </small>
                )}
              </FormGroup>

              <FormGroup>
                <Label required>{t.workDate}</Label>
                <Input
                  name="workDate"
                  type="date"
                  value={formData.workDate}
                  onChange={handleChange}
                  placeholder={t.workDatePlaceholder}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </FormGroup>
            </FormRow>

            <FormRow $columns="1fr 1fr">
              <FormGroup>
                <Label>{t.workingHours}</Label>
                <FormRow $columns="1fr 1fr">
                  <div>
                    <Label style={{ fontSize: '13px', marginBottom: '8px' }}>{t.startTime}</Label>
                    <Input
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleChange}
                      placeholder={t.startTimePlaceholder}
                    />
                  </div>
                  <div>
                    <Label style={{ fontSize: '13px', marginBottom: '8px' }}>{t.endTime}</Label>
                    <Input
                      name="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={handleChange}
                      placeholder={t.endTimePlaceholder}
                    />
                  </div>
                </FormRow>
              </FormGroup>
              
              {/* Total Salary Display */}
              <FormGroup>
                <Label style={{ opacity: 0, pointerEvents: 'none' }}>-</Label>
                <TotalSalaryBox className={`${!salaryCalculation ? 'empty' : ''} ${salaryBoxActive ? 'active' : ''}`}>
                  <div className="salary-label">
                    <div className="label-text">{t.totalSalary}</div>
                    {salaryCalculation && (
                      <div className="hours-info">
                        {salaryCalculation.hours.toFixed(1)} {t.hoursWorked}
                      </div>
                    )}
                  </div>
                  <div className="salary-amount">
                    {salaryCalculation ? (
                      <>
                        <span className="amount">
                          {salaryCalculation.total.toLocaleString('vi-VN', { 
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0 
                          })}
                        </span>
                        <span className="currency">VNĐ</span>
                      </>
                    ) : (
                      <span style={{ fontSize: '14px', color: '#1e40af', opacity: 0.6 }}>
                        {t.totalSalaryEmpty}
                      </span>
                    )}
                  </div>
                </TotalSalaryBox>
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>{t.description}</Label>
              <TextArea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t.descriptionPlaceholder}
                rows={4}
              />
            </FormGroup>

            <FormGroup>
              <Label>{t.requirements}</Label>
              <TextArea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder={t.requirementsPlaceholder}
                rows={3}
              />
            </FormGroup>

            <FormActions>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/employer/quick-jobs')}
              >
                {t.cancelButton}
              </Button>
              <SubmitButton type="submit">
                <Save />
                {t.submitButton}
              </SubmitButton>
            </FormActions>
          </form>
        </FormCard>
      </PostJobContainer>

      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title=""
      >
        <ModalContent>
          <ModalIcon $success={modalType === 'success'}>
            {modalType === 'success' ? <CheckCircle /> : <AlertCircle />}
          </ModalIcon>
          <ModalTitle>
            {modalType === 'success' ? t.successTitle : t.errorTitle}
          </ModalTitle>
          <ModalMessage>
            {modalType === 'success' ? t.successMessage : (paymentInfo?.error ? paymentInfo.message : t.errorMessage)}
          </ModalMessage>
          {modalType === 'success' && paymentInfo && !paymentInfo.error && (
            <div style={{
              background: '#EFF6FF',
              border: '2px solid #BFDBFE',
              borderRadius: '12px',
              padding: '16px 20px',
              marginTop: '16px',
              marginBottom: '8px'
            }}>
              <div style={{
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px dashed #BFDBFE'
              }}>
                <div style={{ fontSize: '13px', color: '#1e3a8a', marginBottom: '6px' }}>
                  {language === 'vi' ? 'Chi tiết thanh toán:' : 'Payment details:'}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#1e40af',
                  marginBottom: '4px'
                }}>
                  <span>{language === 'vi' ? 'Số giờ làm việc:' : 'Working hours:'}</span>
                  <span style={{ fontWeight: '600' }}>{paymentInfo.hours.toFixed(1)}h</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#1e40af'
                }}>
                  <span>{language === 'vi' ? 'Lương/giờ:' : 'Hourly rate:'}</span>
                  <span style={{ fontWeight: '600' }}>{paymentInfo.hourlyRate.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px', color: '#1e3a8a', fontWeight: '600' }}>
                  {t.paymentDeducted}:
                </span>
                <span style={{ fontSize: '16px', color: '#DC2626', fontWeight: '700' }}>
                  -{paymentInfo.fee.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '8px',
                borderTop: '1px solid #BFDBFE'
              }}>
                <span style={{ fontSize: '14px', color: '#1e3a8a', fontWeight: '600' }}>
                  {t.remainingBalance}:
                </span>
                <span style={{ fontSize: '18px', color: '#059669', fontWeight: '700' }}>
                  {paymentInfo.newBalance.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              {paymentInfo.escrow && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  background: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#92400E',
                  lineHeight: '1.5'
                }}>
                  🔒 {language === 'vi'
                    ? 'Số tiền đang được giữ trong Ví Escrow. Khi cả hai bên xác nhận hoàn thành, 85% sẽ chuyển cho ứng viên và 15% cho nền tảng.'
                    : 'Funds are held in Escrow. When both parties confirm completion, 85% goes to the candidate and 15% to the platform.'}
                </div>
              )}
            </div>
          )}
          {modalType === 'error' && (paymentInfo?.message?.includes('Số dư không đủ') || paymentInfo?.message?.includes('Insufficient balance')) ? (
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <Button 
                onClick={handleModalClose}
                style={{ 
                  flex: 1,
                  background: '#E5E7EB',
                  color: '#374151'
                }}
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </Button>
              <Button 
                onClick={() => {
                  setShowModal(false);
                  navigate('/employer/wallet');
                }}
                style={{ 
                  flex: 1,
                  background: '#3B82F6',
                  color: 'white'
                }}
              >
                {language === 'vi' ? '💰 Nạp tiền' : '💰 Add Funds'}
              </Button>
            </div>
          ) : (
            <Button onClick={handleModalClose}>
              {t.closeButton}
            </Button>
          )}
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
};

export default PostQuickJob;
