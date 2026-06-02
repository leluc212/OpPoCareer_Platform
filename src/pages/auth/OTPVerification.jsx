import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '../../components/FormElements';
import { CheckCircle, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/* ── Animations ── */
const gradMove = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const floatUp = keyframes`
  0%,100% { transform: translateY(0) rotate(-1deg); }
  50%      { transform: translateY(-18px) rotate(2deg); }
`;
const twinkle = keyframes`
  0%,100% { opacity: 0.2; transform: scale(1); }
  50%      { opacity: 1; transform: scale(1.3); }
`;

/* ── Shell ── */
const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  background: #f8faff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  color-scheme: light;
  position: relative;
`;

/* ── Left Panel ── */
const LeftPanel = styled.div`
  width: 48%;
  height: 100vh;
  position: fixed;
  left: 0; top: 0;
  background: linear-gradient(150deg, #07195c 0%, #0E3995 40%, #1648c8 75%, #2563eb 100%);
  background-size: 220% 220%;
  animation: ${gradMove} 10s ease infinite;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 48px;
  overflow: hidden;
  @media (max-width: 960px) { display: none; }
`;

const DotGrid = styled.div`
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
`;

const StarDot = styled.div`
  position: absolute;
  width: ${p => p.$s || 4}px; height: ${p => p.$s || 4}px;
  border-radius: 50%; background: #fff;
  top: ${p => p.$top}; left: ${p => p.$left};
  animation: ${twinkle} ${p => p.$dur || 3}s ease-in-out infinite;
  animation-delay: ${p => p.$d || 0}s;
`;

const Orb = styled.div`
  position: absolute; border-radius: 50%;
  background: radial-gradient(circle, ${p => p.$c} 0%, transparent 70%);
  width: ${p => p.$s}px; height: ${p => p.$s}px;
  top: ${p => p.$top || 'auto'}; left: ${p => p.$left || 'auto'};
  right: ${p => p.$right || 'auto'}; bottom: ${p => p.$bottom || 'auto'};
  animation: ${floatUp} ${p => p.$dur || 12}s ease-in-out infinite;
  animation-delay: ${p => p.$d || 0}s;
  pointer-events: none; filter: blur(${p => p.$blur || 0}px);
`;

const LeftContent = styled.div`
  position: relative; z-index: 2; text-align: center;
`;

const LeftIconBox = styled(motion.div)`
  width: 96px; height: 96px;
  background: rgba(255,255,255,0.15);
  border: 2px solid rgba(255,255,255,0.25);
  border-radius: 28px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 28px;
  backdrop-filter: blur(8px);
  svg { width: 48px; height: 48px; color: #fff; }
`;

const LeftTitle = styled.h1`
  font-size: clamp(26px, 2.8vw, 36px);
  font-weight: 900;
  color: #fff;
  letter-spacing: -1px;
  margin-bottom: 14px;
  line-height: 1.2;
`;

const LeftSub = styled.p`
  font-size: 15px;
  color: rgba(255,255,255,0.7);
  line-height: 1.7;
  max-width: 320px;
  margin: 0 auto 36px;
`;

const StepList = styled.div`
  display: flex; flex-direction: column; gap: 14px; text-align: left; max-width: 300px; margin: 0 auto;
`;

const StepItem = styled.div`
  display: flex; align-items: center; gap: 14px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 14px; padding: 12px 16px;
  backdrop-filter: blur(6px);
`;

const StepNum = styled.div`
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 1.5px solid rgba(255,255,255,0.35);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; color: #fff; flex-shrink: 0;
`;

const StepText = styled.div`
  font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; line-height: 1.4;
  strong { color: #fff; display: block; font-weight: 700; }
`;

/* ── Right Panel ── */
const RightPanel = styled.div`
  flex: 1;
  margin-left: 48%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  position: relative;
  min-height: 100vh;

  &::before {
    content: '';
    position: fixed; inset: 0;
    background:
      radial-gradient(ellipse at 15% 85%, rgba(14,57,149,0.07) 0%, transparent 50%),
      radial-gradient(ellipse at 82% 5%,  rgba(59,130,246,0.06) 0%, transparent 45%);
    pointer-events: none; z-index: 0;
  }

  @media (max-width: 960px) {
    margin-left: 0;
    background: linear-gradient(145deg, #07195c 0%, #0E3995 100%);
    &::before { display: none; }
  }
`;

/* ── Card ── */
const Card = styled(motion.div)`
  background: #fff;
  border-radius: 28px;
  padding: 48px 44px 40px;
  width: 100%;
  max-width: 460px;
  position: relative;
  z-index: 1;
  box-shadow:
    0 1px 3px rgba(0,0,0,0.04),
    0 8px 24px rgba(14,57,149,0.09),
    0 28px 56px rgba(14,57,149,0.11);

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 30px; right: 30px; height: 3px;
    background: linear-gradient(90deg, #0E3995, #3b82f6, #60a5fa, #38bdf8);
    background-size: 200%;
    animation: ${gradMove} 4s ease infinite;
    border-radius: 0 0 6px 6px;
  }
`;

/* ── Back button ── */
const BackBtn = styled.button`
  position: absolute;
  top: 18px; left: 18px;
  display: flex; align-items: center; gap: 6px;
  background: #f1f5f9; border: none; border-radius: 10px;
  padding: 7px 14px; font-size: 13px; font-weight: 600;
  color: #64748b; cursor: pointer; transition: all 0.2s;
  font-family: inherit;
  &:hover { background: #e2e8f0; color: #0E3995; transform: translateX(-2px); }
  svg { width: 15px; height: 15px; }
`;

/* ── Logo row ── */
const LogoRow = styled.div`
  display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 18px;
`;
const LogoImg = styled.img`height: 36px; object-fit: contain;`;
const LogoTxt = styled.span`font-size: 20px; font-weight: 800; color: #0E3995; letter-spacing: -0.4px;`;

/* ── Icon box ── */
const IconWrapper = styled.div`
  width: 72px; height: 72px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #0E3995 0%, #2563eb 100%);
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center; color: white;
  svg { width: 36px; height: 36px; }
`;

const Title = styled.h1`
  font-size: 22px; font-weight: 800; margin-bottom: 8px;
  color: #0f172a; text-align: center; letter-spacing: -0.4px;
`;

const Subtitle = styled.p`
  font-size: 14px; color: #94a3b8; margin-bottom: 32px; text-align: center; line-height: 1.65;
  strong { color: #0E3995; font-weight: 700; display: block; margin-top: 2px; font-size: 14.5px; }
`;

/* ── OTP inputs ── */
const OTPInputs = styled.div`
  display: flex; gap: 12px; justify-content: center; margin-bottom: 24px;
`;

const OTPInput = styled.input`
  width: 52px; height: 58px;
  border: 2px solid ${p => p.$filled ? '#0E3995' : '#eaeff4'};
  border-radius: 14px;
  font-size: 22px; font-weight: 700; text-align: center;
  color: #0f172a; background: ${p => p.$filled ? '#eff6ff' : '#fafbfc'};
  outline: none; transition: all 0.18s; font-family: inherit;
  &:focus {
    border-color: #0E3995;
    box-shadow: 0 0 0 3px rgba(14,57,149,0.1);
    background: #eff6ff;
  }
`;

/* ── Messages ── */
const ErrorText = styled.p`
  color: #ef4444; font-size: 13px; font-weight: 500;
  margin-bottom: 14px; padding: 10px 14px;
  background: #fef2f2; border-radius: 10px; border: 1px solid #fecaca;
  text-align: center;
`;

const SuccessText = styled.p`
  color: #16a34a; font-size: 13px; font-weight: 500;
  margin-bottom: 14px; padding: 10px 14px;
  background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0;
  text-align: center;
`;

/* ── Resend ── */
const ResendLink = styled.button`
  background: none; border: none;
  color: ${p => p.disabled ? '#cbd5e1' : '#0E3995'};
  font-weight: 600; text-decoration: ${p => p.disabled ? 'none' : 'underline'};
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  font-size: 14px; font-family: inherit;
  display: block; margin: 0 auto 22px;
  &:hover:not(:disabled) { opacity: 0.75; }
`;

const CountdownText = styled.p`
  color: #94a3b8; font-size: 13.5px; text-align: center; margin-bottom: 22px;
  span { color: #0E3995; font-weight: 700; }
`;

/* ── Submit ── */
const SubmitBtn = styled(motion.button)`
  width: 100%; height: 50px; border: none; border-radius: 13px;
  background: ${p => p.$disabled
    ? '#e2e8f0'
    : 'linear-gradient(135deg, #07195c 0%, #0E3995 55%, #2563eb 100%)'};
  background-size: 200%;
  animation: ${p => !p.$disabled ? css`${gradMove} 6s ease infinite` : 'none'};
  color: ${p => p.$disabled ? '#94a3b8' : '#fff'};
  font-size: 14.5px; font-weight: 700; font-family: inherit;
  cursor: ${p => p.$disabled ? 'not-allowed' : 'pointer'};
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-bottom: 0; position: relative; overflow: hidden;
  transition: box-shadow 0.25s;

  &::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
    pointer-events: none;
  }
  &:hover:not([disabled]) { box-shadow: 0 8px 28px rgba(14,57,149,0.45); }
`;

/* ════════════════════════════════════
   COMPONENT
════════════════════════════════════ */
const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, role, password, fromRegistration } = location.state || {
    email: 'user@example.com',
    role: 'candidate',
    fromRegistration: false
  };

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleOTPChange = (index, value) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = ['', '', '', '', '', ''];
      digits.forEach((d, i) => { newOtp[i] = d; });
      setOtp(newOtp);
      const next = Math.min(digits.length, 5);
      document.getElementById(`otp-${next}`)?.focus();
      return;
    }
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrorMsg('');
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setErrorMsg('');
    const code = otp.join('');
    try {
      const { Auth } = await import('../../utils/amplifyClient');
      await Auth.confirmSignUp({ username: email, confirmationCode: code });
      setSuccessMsg('Xác thực thành công! Đang chuyển hướng...');
      setTimeout(() => navigate(role === 'employer' ? '/login?role=employer' : '/login?role=candidate'), 1500);
    } catch (err) {
      let msg = 'Xác thực thất bại. Vui lòng thử lại.';
      if (err.name === 'CodeMismatchException' || err.message?.includes('Invalid code'))
        msg = 'Mã xác thực không đúng. Vui lòng kiểm tra lại.';
      else if (err.name === 'ExpiredCodeException' || err.message?.includes('expired'))
        msg = 'Mã xác thực đã hết hạn. Vui lòng gửi lại mã mới.';
      else if (err.name === 'NotAuthorizedException') {
        msg = 'Tài khoản đã được xác thực. Vui lòng đăng nhập.';
        setTimeout(() => navigate(role === 'employer' ? '/login?role=employer' : '/login?role=candidate'), 1500);
      }
      setErrorMsg(msg);
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      const { Auth } = await import('../../utils/amplifyClient');
      await Auth.resendSignUpCode({ username: email });
      setSuccessMsg('Mã xác thực đã được gửi lại!');
      setErrorMsg('');
      setOtp(['', '', '', '', '', '']);
      setCanResend(false);
      setCountdown(60);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Không thể gửi lại mã: ' + (err.message || 'Vui lòng thử lại'));
    }
  };

  const handleBack = () => {
    navigate(
      role === 'employer' ? '/register/employer' : '/register/candidate',
      { state: { prefill: { email, ...(location.state?.formData || {}) } } }
    );
  };

  const isComplete = otp.join('').length === 6;

  const steps = [
    { num: 1, title: 'Tạo tài khoản', desc: 'Điền thông tin đăng ký' },
    { num: 2, title: 'Xác thực email', desc: 'Nhập mã OTP được gửi đến email' },
    { num: 3, title: 'Hoàn tất', desc: 'Đăng nhập và bắt đầu sử dụng' },
  ];

  return (
    <Shell>
      {/* ── LEFT ── */}
      <LeftPanel>
        <DotGrid />
        <Orb $s={400} $c="rgba(99,179,237,0.15)" $top="-80px" $right="-80px" $dur={14} $blur={20} />
        <Orb $s={300} $c="rgba(255,255,255,0.08)" $bottom="-60px" $left="-60px" $dur={10} $d={2} $blur={16} />
        <StarDot $s={3} $top="18%" $left="12%" $dur={2.5} />
        <StarDot $s={4} $top="35%" $left="80%" $dur={3.2} $d={0.8} />
        <StarDot $s={3} $top="72%" $left="25%" $dur={2.8} $d={1.2} />
        <StarDot $s={5} $top="55%" $left="65%" $dur={4} $d={0.5} />

        <LeftContent>
          <LeftIconBox
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
          >
            <ShieldCheck />
          </LeftIconBox>

          <LeftTitle>Xác Thực Email</LeftTitle>
          <LeftSub>
            Chỉ còn một bước nữa để hoàn tất đăng ký tài khoản của bạn.
          </LeftSub>

          <StepList>
            {steps.map((s, i) => (
              <StepItem key={i} style={s.num === 2 ? { background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)' } : {}}>
                <StepNum style={s.num === 2 ? { background: '#fff', color: '#0E3995' } : {}}>
                  {s.num === 1 ? '✓' : s.num}
                </StepNum>
                <StepText>
                  <strong>{s.title}</strong>
                  {s.desc}
                </StepText>
              </StepItem>
            ))}
          </StepList>
        </LeftContent>
      </LeftPanel>

      {/* ── RIGHT ── */}
      <RightPanel>
        <Card
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <BackBtn onClick={handleBack}>
            <ArrowLeft />
            Quay lại
          </BackBtn>

          <div style={{ marginTop: 28 }}>
            <LogoRow>
              <LogoImg src="/images/logo.png" alt="logo" onError={e => { e.target.style.display = 'none'; }} />
              <LogoTxt>Ốp Pờ</LogoTxt>
            </LogoRow>

            <IconWrapper>
              <CheckCircle />
            </IconWrapper>

            <Title>Xác Thực Email Của Bạn</Title>
            <Subtitle>
              Chúng tôi đã gửi mã 6 chữ số đến<br />
              <strong>{email}</strong>
            </Subtitle>

            <OTPInputs>
              {otp.map((digit, index) => (
                <OTPInput
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  value={digit}
                  onChange={e => handleOTPChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  $filled={!!digit}
                  autoFocus={index === 0}
                />
              ))}
            </OTPInputs>

            {errorMsg && <ErrorText>{errorMsg}</ErrorText>}
            {successMsg && <SuccessText>{successMsg}</SuccessText>}

            {canResend ? (
              <ResendLink onClick={handleResend}>
                Không nhận được mã? Gửi lại
              </ResendLink>
            ) : (
              <CountdownText>
                Gửi lại mã sau <span>{countdown}s</span>
              </CountdownText>
            )}

            <SubmitBtn
              $disabled={!isComplete || isVerifying}
              disabled={!isComplete || isVerifying}
              onClick={handleVerify}
              whileTap={isComplete && !isVerifying ? { scale: 0.98 } : {}}
            >
              {isVerifying ? 'Đang xác thực...' : 'Xác Thực Email'}
            </SubmitBtn>
          </div>
        </Card>
      </RightPanel>
    </Shell>
  );
};

export default OTPVerification;
