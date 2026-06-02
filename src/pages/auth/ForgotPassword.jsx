import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/* ═══════════════════════════════════════════════════
   STYLED COMPONENTS
═══════════════════════════════════════════════════ */
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  padding: 24px;
  font-family: 'Inter', sans-serif;
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: 48px 40px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
`;

const BackButton = styled(Link)`
  position: absolute;
  top: 24px;
  left: 24px;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  transition: all 0.2s;
  
  &:hover {
    background: #e2e8f0;
    transform: translateX(-4px);
  }
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
`;

const Step = styled.div`
  width: ${props => props.$active ? '40px' : '12px'};
  height: 12px;
  border-radius: 6px;
  background: ${props => props.$active ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)' : '#e2e8f0'};
  transition: all 0.3s;
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  
  svg {
    width: 40px;
    height: 40px;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 12px;
  color: #1e293b;
`;

const Subtitle = styled.p`
  font-size: 15px;
  color: #64748b;
  text-align: center;
  margin-bottom: 32px;
  line-height: 1.6;
  
  strong {
    color: #2563eb;
    font-weight: 600;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #334155;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 16px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 2px solid ${props => props.$error ? '#ef4444' : '#e2e8f0'};
  border-radius: 12px;
  font-size: 15px;
  color: #1e293b;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  }
  
  &::placeholder {
    color: #cbd5e1;
  }
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 16px;
  color: #94a3b8;
  padding: 4px;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #2563eb;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ErrorText = styled.span`
  font-size: 13px;
  color: #ef4444;
  margin-top: -4px;
`;

const OTPInputs = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const OTPInput = styled.input`
  width: 56px;
  height: 64px;
  border: 2px solid ${props => props.$filled ? '#2563eb' : '#e2e8f0'};
  border-radius: 12px;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  color: #1e293b;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  }
`;

const ResendWrapper = styled.div`
  text-align: center;
  margin-top: 16px;
`;

const ResendText = styled.p`
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
`;

const ResendButton = styled.button`
  color: #2563eb;
  font-weight: 600;
  font-size: 14px;
  
  &:hover {
    text-decoration: underline;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Button = styled(motion.button)`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const SuccessIcon = styled(motion.div)`
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  
  svg {
    width: 48px;
    height: 48px;
  }
`;

/* ═══════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════ */
const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [normalizedEmail, setNormalizedEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Handle email submission
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    
    // Validate email
    if (!email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    try {
      // Import Auth functions from amplifyClient
      const { Auth } = await import('../../utils/amplifyClient');
      
      const normalizedEmail = email.trim().toLowerCase();
      setNormalizedEmail(normalizedEmail);
      console.log('Sending reset code to:', normalizedEmail);
      
      await Auth.resetPassword({ username: normalizedEmail });
      
      console.log('Reset code sent successfully');
      setErrors({});
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      console.error('Reset password error:', err);
      
      let errorMessage = '';
      if (err.name === 'UserNotFoundException' || err.message?.includes('User does not exist')) {
        errorMessage = 'Email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.';
      } else if (err.name === 'LimitExceededException' || err.message?.includes('Attempt limit exceeded')) {
        errorMessage = 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 15 phút.';
      } else if (err.name === 'InvalidParameterException') {
        errorMessage = 'Tài khoản này đăng ký bằng Google, không thể đặt lại mật khẩu theo cách này. Vui lòng đăng nhập bằng Google.';
      } else if (err.name === 'NotAuthorizedException') {
        errorMessage = 'Tài khoản này không được phép đặt lại mật khẩu. Vui lòng liên hệ quản trị viên.';
      } else {
        errorMessage = err.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.';
      }
      
      setErrors({ email: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification - verify code is complete before proceeding
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setErrors({ otp: 'Vui lòng nhập đầy đủ 6 chữ số' });
      return;
    }
    setErrors({});
    setStep(3);
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e, index) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    
    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (index + i < 6) {
        newOtp[index + i] = char;
      }
    });
    setOtp(newOtp);
    
    // Focus last filled input
    const lastIndex = Math.min(index + pastedData.length - 1, 5);
    otpRefs.current[lastIndex]?.focus();
  };

  // Handle OTP keydown
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle password reset (verify OTP and reset password)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    
    // Validate password
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu mới';
    } else if (password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ hoa';
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ thường';
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ số';
    } else if (!/[^a-zA-Z0-9]/.test(password)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%...)';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    try {
      // Import Auth functions from amplifyClient
      const { Auth } = await import('../../utils/amplifyClient');
      
      const otpValue = otp.join('');
      console.log('Confirming password reset for:', normalizedEmail);
      
      await Auth.confirmResetPassword({
        username: normalizedEmail,
        confirmationCode: otpValue,
        newPassword: password
      });
      
      console.log('Password reset successful');
      setErrors({});
      setStep(4);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      console.error('Confirm reset password error:', err);
      
      let errorMessage = '';
      let errorField = 'submit';
      
      if (err.name === 'CodeMismatchException' || err.message?.includes('Invalid verification code')) {
        errorMessage = 'Mã xác minh không đúng. Vui lòng quay lại bước trước và kiểm tra lại mã.';
        errorField = 'password';
      } else if (err.name === 'ExpiredCodeException' || err.message?.includes('expired')) {
        errorMessage = 'Mã xác minh đã hết hạn. Vui lòng quay lại và yêu cầu mã mới.';
        errorField = 'password';
      } else if (err.name === 'InvalidPasswordException') {
        errorMessage = 'Mật khẩu không đủ mạnh. Vui lòng thử mật khẩu khác.';
        errorField = 'password';
      } else if (err.name === 'LimitExceededException' || err.message?.includes('Attempt limit exceeded')) {
        errorMessage = 'Bạn đã thử quá nhiều lần. Vui lòng đợi và thử lại sau.';
        errorField = 'password';
      } else {
        errorMessage = err.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        errorField = 'password';
      }
      
      setErrors({ [errorField]: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    setLoading(true);
    try {
      const { Auth } = await import('../../utils/amplifyClient');
      
      console.log('Resending reset code to:', normalizedEmail);
      await Auth.resetPassword({ username: normalizedEmail });
      
      console.log('Reset code resent successfully');
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      setErrors({});
    } catch (err) {
      console.error('Resend code error:', err);
      
      let errorMessage = '';
      if (err.name === 'LimitExceededException' || err.message?.includes('Attempt limit exceeded')) {
        errorMessage = 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau.';
      } else {
        errorMessage = 'Không thể gửi lại mã. Vui lòng thử lại sau.';
      }
      
      setErrors({ otp: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Render based on step
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <IconWrapper>
              <Mail />
            </IconWrapper>
            <Title>Quên mật khẩu?</Title>
            <Subtitle>
              Nhập email của bạn để nhận mã xác minh đặt lại mật khẩu
            </Subtitle>
            <Form onSubmit={handleEmailSubmit}>
              <InputGroup>
                <Label>Email *</Label>
                <InputWrapper>
                  <InputIcon>
                    <Mail />
                  </InputIcon>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    $error={errors.email}
                    disabled={loading}
                  />
                </InputWrapper>
                {errors.email && <ErrorText>{errors.email}</ErrorText>}
              </InputGroup>
              <Button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? 'Đang gửi...' : 'Gửi mã xác minh'}
                {!loading && <ArrowRight />}
              </Button>
            </Form>
          </>
        );
      
      case 2:
        return (
          <>
            <IconWrapper>
              <Mail />
            </IconWrapper>
            <Title>Nhập mã xác minh</Title>
            <Subtitle>
              Nhập mã 6 chữ số đã được gửi đến <strong>{email}</strong>
            </Subtitle>
            <Form onSubmit={handleOtpSubmit}>
              <InputGroup>
                <OTPInputs>
                  {otp.map((digit, index) => (
                    <OTPInput
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onPaste={(e) => handleOtpPaste(e, index)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      $filled={!!digit}
                      disabled={loading}
                    />
                  ))}
                </OTPInputs>
                {errors.otp && <ErrorText style={{ textAlign: 'center', marginTop: '8px' }}>{errors.otp}</ErrorText>}
              </InputGroup>
              
              <ResendWrapper>
                <ResendText>Không nhận được mã?</ResendText>
                <ResendButton
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendTimer > 0 || loading}
                >
                  {resendTimer > 0
                    ? `Gửi lại sau ${resendTimer}s`
                    : 'Gửi lại mã'}
                </ResendButton>
              </ResendWrapper>
              
              <Button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? 'Đang xác minh...' : 'Xác minh'}
                {!loading && <ArrowRight />}
              </Button>
            </Form>
          </>
        );
      
      case 3:
        return (
          <>
            <IconWrapper>
              <Lock />
            </IconWrapper>
            <Title>Đặt mật khẩu mới</Title>
            <Subtitle>
              Nhập mật khẩu mới cho tài khoản <strong>{email}</strong>
            </Subtitle>
            <Form onSubmit={handlePasswordSubmit}>
              <InputGroup>
                <Label>Mật khẩu mới *</Label>
                <InputWrapper>
                  <InputIcon>
                    <Lock />
                  </InputIcon>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tối thiểu 8 ký tự, có hoa, thường, số, ký tự đặc biệt"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    $error={errors.password}
                    disabled={loading}
                  />
                  <TogglePasswordButton
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </TogglePasswordButton>
                </InputWrapper>
                {errors.password && <ErrorText>{errors.password}</ErrorText>}
              </InputGroup>
              
              <InputGroup>
                <Label>Xác nhận mật khẩu *</Label>
                <InputWrapper>
                  <InputIcon>
                    <Lock />
                  </InputIcon>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    $error={errors.confirmPassword}
                    disabled={loading}
                  />
                  <TogglePasswordButton
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </TogglePasswordButton>
                </InputWrapper>
                {errors.confirmPassword && <ErrorText>{errors.confirmPassword}</ErrorText>}
              </InputGroup>
              
              <Button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                {!loading && <CheckCircle />}
              </Button>
            </Form>
          </>
        );
      
      case 4:
        return (
          <>
            <SuccessIcon
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <CheckCircle />
            </SuccessIcon>
            <Title>Thành công!</Title>
            <Subtitle>
              Mật khẩu của bạn đã được đặt lại thành công. Bạn sẽ được chuyển đến trang đăng nhập...
            </Subtitle>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container>
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {step < 4 && (
          <BackButton to="/login">
            <ArrowLeft size={20} />
          </BackButton>
        )}
        
        {step < 4 && (
          <StepIndicator>
            <Step $active={step === 1} />
            <Step $active={step === 2} />
            <Step $active={step === 3} />
          </StepIndicator>
        )}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </Card>
    </Container>
  );
};

export default ForgotPassword;
