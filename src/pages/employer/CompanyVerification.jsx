import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { Button, Input, TextArea, FormGroup, Label, DateInput, Select } from '../../components/FormElements';
import {
  CheckCircle,
  Circle,
  Upload,
  FileText,
  Building,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import employerProfileService from '../../services/employerProfileService';

const VerificationContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 48px;
  
  h1 {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 12px;
    color: ${props => props.theme.colors.text};
  }
  
  p {
    font-size: 16px;
    color: ${props => props.theme.colors.textLight};
  }
`;

const StepperContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.theme.colors.border};
    z-index: 0;
  }
`;

const Step = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex: 1;
  position: relative;
  z-index: 1;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  
  .step-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${props => {
    if (props.$completed) return props.theme.colors.success;
    if (props.$active) return props.theme.colors.primary;
    return props.theme.colors.bgLight;
  }};
    border: 2px solid ${props => {
    if (props.$completed) return props.theme.colors.success;
    if (props.$active) return props.theme.colors.primary;
    return props.theme.colors.border;
  }};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => (props.$completed || props.$active) ? 'white' : props.theme.colors.textLight};
    font-weight: 700;
    transition: all 0.3s;
  }
  
  .step-label {
    font-size: 14px;
    font-weight: 600;
    color: ${props => {
    if (props.$active) return props.theme.colors.text;
    return props.theme.colors.textLight;
  }};
    text-align: center;
  }
`;

const FormCard = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 40px;
  box-shadow: ${props => props.theme.shadows.md};
`;

const FormTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid ${props => props.theme.colors.border};
  
  .icon {
    width: 48px;
    height: 48px;
    border-radius: ${props => props.theme.borderRadius.md};
    background: ${props => props.theme.colors.primary}20;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.colors.primary};
    
    svg {
      width: 24px;
      height: 24px;
    }
  }
  
  h2 {
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }
`;

const ErrorMessage = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 10px 14px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  color: #DC2626;
  font-size: 13px;
  font-weight: 500;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FileUploadArea = styled.div`
  border: 2px dashed ${props => props.$hasFile ? props.theme.colors.success : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: ${props => props.$hasFile ? props.theme.colors.success + '10' : props.theme.colors.bgDark};
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.primary}10;
  }
  
  .upload-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    color: ${props => props.$hasFile ? props.theme.colors.success : props.theme.colors.textLight};
  }
  
  .upload-text {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }
  
  .upload-hint {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
  }
  
  input[type="file"] {
    display: none;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 32px;
  
  button {
    flex: 1;
  }
`;

const InfoBox = styled.div`
  background: ${props => props.theme.colors.info}15;
  border-left: 4px solid ${props => props.theme.colors.info};
  padding: 16px;
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: 24px;
  
  display: flex;
  gap: 12px;
  
  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.theme.colors.info};
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .info-content {
    p {
      font-size: 14px;
      color: ${props => props.theme.colors.text};
      line-height: 1.6;
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    strong {
      font-weight: 600;
    }
  }
`;

const CompletionCard = styled(motion.div)`
  background: linear-gradient(135deg, ${props => props.theme.colors.success} 0%, ${props => props.theme.colors.success}dd 100%);
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 64px 40px;
  text-align: center;
  color: white;
  
  .success-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      width: 48px;
      height: 48px;
    }
  }
  
  h2 {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 16px;
  }
  
  p {
    font-size: 16px;
    opacity: 0.9;
    margin-bottom: 32px;
    line-height: 1.6;
  }
  
  button {
    background: white;
    color: ${props => props.theme.colors.success};
    font-weight: 700;
    padding: 14px 32px;
    border-radius: ${props => props.theme.borderRadius.md};
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    }
  }
`;

const SuccessMessage = styled(motion.div)`
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

const CompanyVerification = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState(null); // Track which file was uploaded

  const [expiryDateError, setExpiryDateError] = useState(false);

  const [step1Data, setStep1Data] = useState({
    businessLicense: null,
    licenseNumber: '',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: ''
  });

  const [step2Data, setStep2Data] = useState({
    companyName: '',
    taxCode: '',
    foundedYear: '',
    industry: '',
    companySize: '',
    website: '',
    fanpage: '',
    description: ''
  });

  const [step4Data, setStep4Data] = useState({
    address: '',
    phone: '',
    emails: [''],
    emergencyContact: '',
    emergencyPhone: ''
  });

  const steps = [
    {
      id: 0,
      label: language === 'vi' ? 'Giấy phép KD' : 'Business License',
      icon: FileText
    },
    {
      id: 1,
      label: language === 'vi' ? 'Thông tin DN' : 'Company Info',
      icon: Building
    },
    {
      id: 2,
      label: language === 'vi' ? 'Liên hệ' : 'Contact',
      icon: Phone
    }
  ];

  // Compress image before storing - optimized for localStorage
  const compressImage = (file, maxWidth = 800, quality = 0.4) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        // For non-image files (PDF, etc), check size limit
        if (file.size > 2 * 1024 * 1024) { // 2MB limit for PDFs
          reject(new Error('File quá lớn. Vui lòng sử dụng file nhỏ hơn 2MB'));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if image is too large
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with high compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          // Check if compressed size is still too large
          const sizeInBytes = (compressedDataUrl.length * 3) / 4;
          if (sizeInBytes > 500 * 1024) { // 500KB limit after compression
            // Try again with even lower quality
            const ultraCompressed = canvas.toDataURL('image/jpeg', 0.3);
            resolve(ultraCompressed);
          } else {
            resolve(compressedDataUrl);
          }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (field, file, step) => {
    if (!file) return;

    // Check file size before processing
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert(language === 'vi'
        ? 'File quá lớn! Vui lòng chọn file nhỏ hơn 5MB.'
        : 'File too large! Please select a file smaller than 5MB.');
      return;
    }

    try {
      // Compress image before storing
      const compressedDataUrl = await compressImage(file);

      // Check if localStorage has enough space
      const testKey = 'test_storage_' + Date.now();
      try {
        localStorage.setItem(testKey, compressedDataUrl);
        localStorage.removeItem(testKey);
      } catch (storageError) {
        // LocalStorage full
        console.warn('LocalStorage full, cannot store compressed image');
        throw storageError;
      }

      // Store both file name and compressed data
      const fileData = {
        name: file.name,
        data: compressedDataUrl,
        size: file.size,
        type: file.type
      };

      if (step === 0) {
        setStep1Data(prev => ({ ...prev, [field]: fileData }));
      }

      // Show success message for this specific field
      setUploadSuccess(field);
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      console.error('Error processing file:', error);
      alert(language === 'vi'
        ? 'Lỗi khi xử lý file. Vui lòng thử lại với file có kích thước nhỏ hơn hoặc sử dụng ảnh có độ phân giải thấp hơn.'
        : 'Error processing file. Please try again with a smaller file or lower resolution image.');
    }
  };

  const handleNext = () => {
    // Validate current step
    if (!validateStep(currentStep)) {
      return;
    }

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      // All steps completed
      submitVerification();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        console.log('=== VALIDATION STEP 1 ===');
        console.log('businessLicense:', step1Data.businessLicense);
        console.log('licenseNumber:', step1Data.licenseNumber);
        console.log('issueDate:', step1Data.issueDate);
        console.log('issuingAuthority:', step1Data.issuingAuthority);
        console.log('=========================');

        const missingFields = [];
        if (!step1Data.businessLicense) {
          missingFields.push(language === 'vi' ? 'Giấy phép kinh doanh' : 'Business License');
        }

        if (missingFields.length > 0) {
          console.log('Missing fields:', missingFields);
          alert((language === 'vi' ? 'Vui lòng điền đầy đủ các trường sau:\n' : 'Please fill in the following fields:\n') + missingFields.join(', '));
          return false;
        }
        break;
      case 1:
        if (!step2Data.companyName || !step2Data.taxCode || !step2Data.industry || !step2Data.description?.trim()) {
          alert(language === 'vi'
            ? 'Vui lòng điền đầy đủ thông tin doanh nghiệp (bao gồm Mô tả công ty)'
            : 'Please fill in all required company information (including Company Description)');
          return false;
        }
        break;
      case 2:
        if (!step4Data.address || !step4Data.phone || !step4Data.emails[0]) {
          alert(language === 'vi'
            ? 'Vui lòng điền đầy đủ thông tin liên hệ'
            : 'Please fill in all required contact information');
          return false;
        }
        break;
      default:
        return true;
    }
    return true;
  };

  const [submitting, setSubmitting] = useState(false);

  const submitVerification = async () => {
    const verificationData = {
      step1: {
        licenseNumber: step1Data.licenseNumber,
        issueDate: step1Data.issueDate,
        expiryDate: step1Data.expiryDate,
        issuingAuthority: step1Data.issuingAuthority,
        businessLicense: step1Data.businessLicense
          ? { name: step1Data.businessLicense.name, data: step1Data.businessLicense.data, type: step1Data.businessLicense.type }
          : null
      },
      step2: step2Data,
      step4: step4Data,
      submittedAt: new Date().toISOString()
    };

    console.log('Submitting verification to API...');
    setSubmitting(true);

    try {
      await employerProfileService.submitVerification(verificationData);

      // Auto-fill employer profile with data entered in verification form
      try {
        const profileUpdates = {
          // From step 2 - Company info
          companyName:  step2Data.companyName  || '',
          taxCode:      step2Data.taxCode      || '',
          industry:     step2Data.industry     || '',
          companySize:  step2Data.companySize  || '',
          website:      step2Data.website      || '',
          fanpage:      step2Data.fanpage      || '',
          description:  step2Data.description  || '',
          foundedYear:  step2Data.foundedYear  || '',
          // From step 4 - Contact info
          address:      step4Data.address      || '',
          phone:        step4Data.phone        || '',
          email:        step4Data.emails?.[0]  || '',
          emergencyContact: step4Data.emergencyContact || '',
          emergencyPhone:   step4Data.emergencyPhone   || '',
        };
        // Remove empty fields to avoid overwriting existing data with blanks
        const cleanUpdates = Object.fromEntries(
          Object.entries(profileUpdates).filter(([, v]) => v !== '')
        );
        await employerProfileService.updateProfile(cleanUpdates);
        console.log('✅ Employer profile auto-filled from verification data');
      } catch (profileErr) {
        // Non-fatal — verification still succeeded
        console.warn('⚠️ Could not auto-fill profile from verification:', profileErr);
      }

      // Mark all steps as completed
      setCompletedSteps([0, 1, 2]);
      setCurrentStep(3); // Show completion screen
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert(language === 'vi'
        ? `Đã xảy ra lỗi khi gửi hồ sơ xác thực: ${error.message}. Vui lòng thử lại.`
        : `Error submitting verification: ${error.message}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const goToDashboard = () => {
    navigate('/employer/dashboard');
  };

  if (currentStep === 3) {
    return (
      <DashboardLayout role="employer">
        <VerificationContainer>
          <CompletionCard
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="success-icon">
              <CheckCircle />
            </div>
            <h2>{language === 'vi' ? '🎉 Hoàn Tất Xác Thực!' : '🎉 Verification Complete!'}</h2>
            <p>
              {language === 'vi'
                ? 'Hồ sơ công ty của bạn đã được gửi thành công. Chúng tôi sẽ xem xét và phê duyệt trong vòng 24-48 giờ. Sau khi được phê duyệt, bạn có thể bắt đầu đăng tin tuyển dụng.'
                : 'Your company profile has been submitted successfully. We will review and approve within 24-48 hours. Once approved, you can start posting job listings.'}
            </p>
            <Button onClick={goToDashboard}>
              {language === 'vi' ? 'Về trang chủ' : 'Go to Dashboard'}
            </Button>
          </CompletionCard>
        </VerificationContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employer" key={language}>
      <VerificationContainer>
        <Header>
          <h1>{language === 'vi' ? 'Xác Thực Hồ Sơ Công Ty' : 'Company Verification'}</h1>
          <p>{language === 'vi'
            ? 'Hoàn tất 3 bước để xác thực công ty và bắt đầu đăng tin tuyển dụng'
            : 'Complete 3 steps to verify your company and start posting jobs'}</p>
        </Header>

        <StepperContainer>
          {steps.map((step, index) => (
            <Step
              key={step.id}
              $active={currentStep === index}
              $completed={completedSteps.includes(index)}
              $clickable={completedSteps.includes(index)}
              onClick={() => completedSteps.includes(index) && setCurrentStep(index)}
            >
              <div className="step-circle">
                {completedSteps.includes(index) ? (
                  <CheckCircle size={20} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="step-label">{step.label}</div>
            </Step>
          ))}
        </StepperContainer>

        <AnimatePresence mode="wait">
          {/* Step 1: Business License */}
          {currentStep === 0 && (
            <FormCard
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FormTitle>
                <div className="icon">
                  <FileText />
                </div>
                <h2>{language === 'vi' ? 'Giấy Phép Kinh Doanh' : 'Business License'}</h2>
              </FormTitle>

              <InfoBox>
                <AlertCircle />
                <div className="info-content">
                  <p><strong>{language === 'vi' ? 'Lưu ý:' : 'Note:'}</strong></p>
                  <p>{language === 'vi'
                    ? '• Tải lên bản scan rõ nét của Giấy phép ĐKKD hoặc Giấy chứng nhận đăng ký doanh nghiệp'
                    : '• Upload a clear scan of your Business Registration Certificate'}</p>
                  <p>{language === 'vi'
                    ? '• Định dạng: PDF (tối đa 5MB)'
                    : '• Format: PDF (max 5MB)'}</p>
                </div>
              </InfoBox>

              <FormGroup>
                <Label>{language === 'vi' ? 'Tải lên Giấy phép kinh doanh' : 'Upload Business License'} <span className="req">*</span></Label>
                <FileUploadArea
                  $hasFile={!!step1Data.businessLicense}
                  onClick={() => document.getElementById('businessLicenseFile').click()}
                >
                  <Upload className="upload-icon" />
                  <div className="upload-text">
                    {step1Data.businessLicense?.name
                      ? `✓ ${step1Data.businessLicense.name}`
                      : (language === 'vi' ? 'Nhấn để chọn file' : 'Click to select file')}
                  </div>
                  <div className="upload-hint">
                    {language === 'vi' ? 'PDF (tối đa 5MB)' : 'PDF (max 5MB)'}
                  </div>
                  <input
                    id="businessLicenseFile"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload('businessLicense', e.target.files[0], 0)}
                  />
                </FileUploadArea>
                <AnimatePresence>
                  {uploadSuccess === 'businessLicense' && (
                    <SuccessMessage
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <CheckCircle />
                      {language === 'vi' ? 'Tải file thành công!' : 'File uploaded successfully!'}
                    </SuccessMessage>
                  )}
                </AnimatePresence>
              </FormGroup>

              <ButtonGroup>
                <Button $variant="secondary" onClick={() => navigate('/employer/dashboard')}>
                  <ArrowLeft size={18} />
                  {language === 'vi' ? 'Về trang chủ' : 'Back to Dashboard'}
                </Button>
                <Button $variant="primary" onClick={handleNext}>
                  {language === 'vi' ? 'Tiếp theo' : 'Next'}
                  <ArrowRight size={18} />
                </Button>
              </ButtonGroup>
            </FormCard>
          )}

          {/* Step 2: Company Information */}
          {currentStep === 1 && (
            <FormCard
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FormTitle>
                <div className="icon">
                  <Building />
                </div>
                <h2>{language === 'vi' ? 'Thông Tin Doanh Nghiệp' : 'Company Information'}</h2>
              </FormTitle>

              <FormGrid>
                <FormGroup style={{ gridColumn: '1 / -1' }}>
                  <Label>{language === 'vi' ? 'Tên công ty' : 'Company Name'} <span className="req">*</span></Label>
                  <Input
                    type="text"
                    value={step2Data.companyName}
                    onChange={(e) => setStep2Data({ ...step2Data, companyName: e.target.value })}
                    placeholder={language === 'vi' ? 'Công ty TNHH ABC' : 'ABC Company Ltd.'}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{language === 'vi' ? 'Mã số thuế' : 'Tax Code'} <span className="req">*</span></Label>
                  <Input
                    type="text"
                    value={step2Data.taxCode}
                    onChange={(e) => setStep2Data({ ...step2Data, taxCode: e.target.value })}
                    placeholder="0123456789"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{language === 'vi' ? 'Năm thành lập' : 'Founded Year'}</Label>
                  <Input
                    type="number"
                    value={step2Data.foundedYear}
                    onChange={(e) => setStep2Data({ ...step2Data, foundedYear: e.target.value })}
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{language === 'vi' ? 'Lĩnh vực' : 'Industry'} <span className="req">*</span></Label>
                  <Select
                    value={step2Data.industry}
                    onChange={(e) => setStep2Data({ ...step2Data, industry: e.target.value })}
                    required
                  >
                    <option value="">{language === 'vi' ? '-- Chọn lĩnh vực --' : '-- Select industry --'}</option>
                    {[
                      { vi: 'F&B / Ẩm thực', en: 'F&B / Food & Beverage' },
                      { vi: 'Bán lẻ / Thương mại', en: 'Retail / Commerce' },
                      { vi: 'Công nghệ thông tin', en: 'Information Technology' },
                      { vi: 'Xây dựng / Bất động sản', en: 'Construction / Real Estate' },
                      { vi: 'Sản xuất / Công nghiệp', en: 'Manufacturing / Industry' },
                      { vi: 'Giáo dục / Đào tạo', en: 'Education / Training' },
                      { vi: 'Y tế / Dược phẩm', en: 'Healthcare / Pharmaceutical' },
                      { vi: 'Tài chính / Ngân hàng', en: 'Finance / Banking' },
                      { vi: 'Logistics / Vận tải', en: 'Logistics / Transport' },
                      { vi: 'Marketing / Quảng cáo', en: 'Marketing / Advertising' },
                      { vi: 'Du lịch / Khách sạn', en: 'Tourism / Hospitality' },
                      { vi: 'Nông nghiệp', en: 'Agriculture' },
                      { vi: 'Dịch vụ khác', en: 'Other Services' },
                    ].map((opt) => (
                      <option key={opt.vi} value={language === 'vi' ? opt.vi : opt.en}>
                        {language === 'vi' ? opt.vi : opt.en}
                      </option>
                    ))}
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>{language === 'vi' ? 'Quy mô công ty' : 'Company Size'} <span className="req">*</span></Label>
                  <Select
                    value={step2Data.companySize}
                    onChange={(e) => setStep2Data({ ...step2Data, companySize: e.target.value })}
                    required
                  >
                    <option value="">{language === 'vi' ? '-- Chọn quy mô --' : '-- Select size --'}</option>
                    <option value="1-50">{language === 'vi' ? '1 - 50 nhân viên' : '1 - 50 employees'}</option>
                    <option value="50-100">{language === 'vi' ? '50 - 100 nhân viên' : '50 - 100 employees'}</option>
                    <option value="100-499">{language === 'vi' ? '100 - 499 nhân viên' : '100 - 499 employees'}</option>
                    <option value="500+">{language === 'vi' ? '500+ nhân viên' : '500+ employees'}</option>
                  </Select>
                </FormGroup>

                <FormGroup style={{ gridColumn: '1 / -1' }}>
                  <Label>{language === 'vi' ? 'Website' : 'Website'}</Label>
                  <Input
                    type="url"
                    value={step2Data.website}
                    onChange={(e) => setStep2Data({ ...step2Data, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </FormGroup>

                <FormGroup style={{ gridColumn: '1 / -1' }}>
                  <Label>{language === 'vi' ? 'Fanpage (Nếu có)' : 'Fanpage (Optional)'}</Label>
                  <Input
                    type="url"
                    value={step2Data.fanpage}
                    onChange={(e) => setStep2Data({ ...step2Data, fanpage: e.target.value })}
                    placeholder="https://facebook.com/yourpage"
                  />
                </FormGroup>

                <FormGroup style={{ gridColumn: '1 / -1' }}>
                  <Label>{language === 'vi' ? 'Mô tả công ty' : 'Company Description'} <span className="req">*</span></Label>
                  <TextArea
                    value={step2Data.description}
                    onChange={(e) => setStep2Data({ ...step2Data, description: e.target.value })}
                    placeholder={language === 'vi'
                      ? 'Mô tả ngắn gọn về công ty, lĩnh vực hoạt động, sản phẩm/dịch vụ chính...'
                      : 'Brief description about your company, business field, main products/services...'}
                    rows={5}
                    required
                  />
                </FormGroup>
              </FormGrid>

              <ButtonGroup>
                <Button $variant="secondary" onClick={handleBack}>
                  <ArrowLeft size={18} />
                  {language === 'vi' ? 'Quay lại' : 'Back'}
                </Button>
                <Button $variant="primary" onClick={handleNext}>
                  {language === 'vi' ? 'Tiếp theo' : 'Next'}
                  <ArrowRight size={18} />
                </Button>
              </ButtonGroup>
            </FormCard>
          )}

          {/* Step 3: Contact Information */}
          {currentStep === 2 && (
            <FormCard
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FormTitle>
                <div className="icon">
                  <Phone />
                </div>
                <h2>{language === 'vi' ? 'Thông Tin Liên Hệ' : 'Contact Information'}</h2>
              </FormTitle>

              <FormGroup style={{ gridColumn: '1 / -1' }}>
                <Label>{language === 'vi' ? 'Địa chỉ trụ sở chính' : 'Head Office Address'} <span className="req">*</span></Label>
                <TextArea
                  value={step4Data.address}
                  onChange={(e) => setStep4Data({ ...step4Data, address: e.target.value })}
                  placeholder={language === 'vi'
                    ? '123 Đường ABC, Phường XYZ'
                    : '123 ABC Street, XYZ Ward'}
                  rows={3}
                  required
                />
              </FormGroup>

              <FormGrid>
                <FormGroup>
                  <Label>{language === 'vi' ? 'Số điện thoại' : 'Phone Number'} <span className="req">*</span></Label>
                  <Input
                    type="tel"
                    value={step4Data.phone}
                    onChange={(e) => setStep4Data({ ...step4Data, phone: e.target.value })}
                    placeholder="028 1234 5678"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{language === 'vi' ? 'Email liên hệ' : 'Contact Email'} <span className="req">*</span> <span style={{ fontWeight: 400, color: 'var(--color-text-light, #888)', fontSize: '0.85em', textTransform: 'none' }}>({language === 'vi' ? 'tối đa 3 email' : 'max 3 emails'})</span></Label>
                  {step4Data.emails.map((email, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: index < step4Data.emails.length - 1 ? '8px' : 0 }}>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const updated = [...step4Data.emails];
                          updated[index] = e.target.value;
                          setStep4Data({ ...step4Data, emails: updated });
                        }}
                        placeholder={index === 0 ? 'hr@company.com' : `email${index + 1}@company.com`}
                        required={index === 0}
                        style={{ flex: 1 }}
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = step4Data.emails.filter((_, i) => i !== index);
                            setStep4Data({ ...step4Data, emails: updated });
                          }}
                          style={{
                            padding: '0 12px',
                            border: '1px solid #fca5a5',
                            borderRadius: '8px',
                            background: '#fff',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '18px',
                            lineHeight: 1,
                            flexShrink: 0
                          }}
                          title={language === 'vi' ? 'Xóa email' : 'Remove email'}
                        >×</button>
                      )}
                    </div>
                  ))}
                  {step4Data.emails.length < 3 && (
                    <button
                      type="button"
                      onClick={() => setStep4Data({ ...step4Data, emails: [...step4Data.emails, ''] })}
                      style={{
                        marginTop: '8px',
                        padding: '6px 14px',
                        border: '1px dashed #6366f1',
                        borderRadius: '8px',
                        background: '#f5f3ff',
                        color: '#6366f1',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}
                    >
                      + {language === 'vi' ? 'Thêm email' : 'Add email'}
                    </button>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label>{language === 'vi' ? 'Người liên hệ khẩn cấp' : 'Emergency Contact'}</Label>
                  <Input
                    type="text"
                    value={step4Data.emergencyContact}
                    onChange={(e) => setStep4Data({ ...step4Data, emergencyContact: e.target.value })}
                    placeholder={language === 'vi' ? 'Nguyễn Văn B' : 'Jane Doe'}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{language === 'vi' ? 'SĐT khẩn cấp' : 'Emergency Phone'}</Label>
                  <Input
                    type="tel"
                    value={step4Data.emergencyPhone}
                    onChange={(e) => setStep4Data({ ...step4Data, emergencyPhone: e.target.value })}
                    placeholder="090 123 4567"
                  />
                </FormGroup>
              </FormGrid>

              <ButtonGroup>
                <Button $variant="secondary" onClick={handleBack}>
                  <ArrowLeft size={18} />
                  {language === 'vi' ? 'Quay lại' : 'Back'}
                </Button>
                <Button $variant="success" onClick={handleNext} disabled={submitting}>
                  <CheckCircle size={18} />
                  {submitting
                    ? (language === 'vi' ? 'Đang gửi...' : 'Submitting...')
                    : (language === 'vi' ? 'Hoàn tất & Gửi xác thực' : 'Complete & Submit')
                  }
                </Button>
              </ButtonGroup>
            </FormCard>
          )}
        </AnimatePresence>
      </VerificationContainer>
    </DashboardLayout>
  );
};

export default CompanyVerification;
