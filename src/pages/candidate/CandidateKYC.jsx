/**
 * CandidateKYC.jsx — Xác minh eKYC
 *
 * Luồng 2 bước:
 *   Bước 0 — CCCD: upload mặt trước + mặt sau → gọi OCR → hiển thị kết quả → ứng viên xác nhận
 *   Bước 1 — Selfie: chụp ảnh → gọi face verify → VERIFIED → done
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/FormElements';
import {
  CheckCircle, Upload, CreditCard, Camera, RotateCcw,
  ArrowRight, ArrowLeft, AlertCircle, Shield, Loader, XCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ocrCCCD, verifyFace, getKycStatus } from '../../services/ekycService';
import { useAuth } from '../../context/AuthContext';
import candidateProfileService from '../../services/candidateProfileService';

// ─── Animations ───────────────────────────────────────────────────────────────
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const float = keyframes`0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); }`;
const pulse = keyframes`
  0%,100% { transform: scale(1); box-shadow: 0 8px 24px rgba(30,64,175,.35); }
  50%      { transform: scale(1.05); box-shadow: 0 12px 32px rgba(30,64,175,.45); }
`;
const bounce = keyframes`0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); }`;

// ─── Styled Components ────────────────────────────────────────────────────────
const VerificationContainer = styled.div`
  width: 100%;
  max-width: min(860px, 100%);
  margin: 0 auto;
  padding: 0 clamp(12px, 3vw, 24px);
  box-sizing: border-box;
`;

const Header = styled(motion.div)`
  text-align: center;
  margin-bottom: clamp(28px, 5vw, 44px);
  .header-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: clamp(52px,7vw,68px); height: clamp(52px,7vw,68px);
    background: ${p => p.theme.colors.primary}; border-radius: 18px;
    margin-bottom: 14px; box-shadow: 0 8px 24px rgba(30,64,175,.25);
    animation: ${float} 3s ease-in-out infinite;
    svg { width: clamp(24px,3.5vw,32px); height: clamp(24px,3.5vw,32px); color: white; }
  }
  h1 { font-size: clamp(20px,3.5vw,30px); font-weight: 800; margin-bottom: 8px;
       color: ${p => p.theme.colors.text}; letter-spacing: -0.5px; }
  p  { font-size: clamp(13px,1.5vw,15px); color: ${p => p.theme.colors.textLight};
       max-width: 520px; margin: 0 auto; line-height: 1.6; }
`;

const StepperContainer = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: clamp(28px,5vw,44px); position: relative;
  padding: 0 clamp(8px,2vw,20px);
  &::before {
    content: ''; position: absolute;
    top: clamp(18px,2.5vw,26px); left: 12%; right: 12%;
    height: 3px; background: ${p => p.theme.colors.borderLight};
    z-index: 0; border-radius: 10px;
  }
`;

const ProgressLine = styled(motion.div)`
  position: absolute; top: clamp(18px,2.5vw,26px); left: 12%;
  height: 3px; background: ${p => p.theme.colors.primary};
  z-index: 0; border-radius: 10px; box-shadow: 0 0 16px rgba(30,64,175,.4);
`;

const Step = styled(motion.div)`
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  flex: 1; position: relative; z-index: 1;
  cursor: ${p => p.$clickable ? 'pointer' : 'default'};
  transition: transform .3s ease;
  &:hover { transform: ${p => p.$clickable ? 'translateY(-4px)' : 'none'}; }
  .step-circle {
    width: clamp(36px,4.5vw,50px); height: clamp(36px,4.5vw,50px);
    border-radius: 50%;
    background: ${p => p.$completed ? p.theme.colors.success : p.$active ? p.theme.colors.primary : p.theme.colors.bgLight};
    border: 2.5px solid ${p => p.$completed ? p.theme.colors.success : p.$active ? p.theme.colors.primary : p.theme.colors.border};
    display: flex; align-items: center; justify-content: center;
    color: ${p => (p.$completed || p.$active) ? 'white' : p.theme.colors.textLight};
    font-weight: 800; font-size: clamp(13px,1.5vw,16px);
    transition: all .4s cubic-bezier(.4,0,.2,1);
    box-shadow: ${p => (p.$completed || p.$active)
    ? `0 8px 24px ${p.$active ? 'rgba(30,64,175,.35)' : 'rgba(16,185,129,.35)'}`
    : '0 2px 8px rgba(0,0,0,.05)'};
    svg { width: clamp(16px,2vw,22px); height: clamp(16px,2vw,22px); }
    ${p => p.$active && css`animation: ${pulse} 2s ease-in-out infinite;`}
  }
  .step-label {
    font-size: clamp(10px,1.2vw,13px); font-weight: 700;
    color: ${p => p.$completed ? p.theme.colors.success : p.$active ? p.theme.colors.primary : p.theme.colors.textLight};
    text-align: center; transition: all .3s ease;
    max-width: clamp(60px,10vw,100px); line-height: 1.3;
    @media (max-width: 480px) { display: none; }
  }
`;

const FormCard = styled(motion.div)`
  background: ${p => p.theme.colors.bgLight};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: clamp(14px,2vw,22px);
  padding: clamp(20px,4vw,38px) clamp(16px,4vw,38px);
  box-shadow: 0 6px 28px rgba(0,0,0,.07);
  position: relative; overflow: hidden;
  &::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0;
    height: 4px; background: ${p => p.theme.colors.primary};
  }
`;

const FormTitle = styled.div`
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 32px; padding-bottom: 24px;
  border-bottom: 2px solid ${p => p.theme.colors.borderLight};
  .icon {
    width: clamp(40px,5vw,50px); height: clamp(40px,5vw,50px); border-radius: 14px;
    background: ${p => p.theme.colors.primary}; display: flex; align-items: center;
    justify-content: center; color: white; box-shadow: 0 6px 18px rgba(30,64,175,.25);
    flex-shrink: 0; svg { width: clamp(18px,2.2vw,24px); height: clamp(18px,2.2vw,24px); }
  }
  h2 { font-size: clamp(15px,2.2vw,20px); font-weight: 800;
       color: ${p => p.theme.colors.text}; letter-spacing: -0.3px; }
  p  { font-size: clamp(11px,1.2vw,13px); color: ${p => p.theme.colors.textLight}; margin-top: 2px; }
`;

const UploadGrid = styled.div`
  display: grid;
  grid-template-columns: ${p => p.$single ? '1fr' : 'repeat(2,1fr)'};
  gap: clamp(14px,2.5vw,24px);
  margin-bottom: clamp(14px,2.5vw,24px);
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const UploadBox = styled.div`
  border: 3px dashed ${p => p.$hasFile ? p.theme.colors.success : p.theme.colors.border};
  border-radius: 18px; padding: clamp(20px,3.5vw,32px) clamp(14px,2.5vw,20px);
  text-align: center; cursor: pointer;
  transition: all .4s cubic-bezier(.4,0,.2,1);
  background: ${p => p.$hasFile ? p.theme.colors.success + '08' : p.theme.colors.bgDark};
  position: relative; overflow: hidden;
  &:hover {
    border-color: ${p => p.theme.colors.primary};
    background: ${p => p.theme.colors.primary}0a;
    transform: translateY(-2px); box-shadow: 0 10px 20px rgba(30,64,175,.12);
  }
  .icon { width: clamp(30px,4vw,42px); height: clamp(30px,4vw,42px);
           margin: 0 auto clamp(8px,1.5vw,12px);
           color: ${p => p.$hasFile ? p.theme.colors.success : p.theme.colors.primary};
           transition: all .3s ease; }
  .label { font-size: clamp(12px,1.4vw,14px); font-weight: 700;
            color: ${p => p.$hasFile ? p.theme.colors.success : p.theme.colors.text}; margin-bottom: 4px; }
  .hint  { font-size: clamp(10px,1.1vw,12px); color: ${p => p.theme.colors.textLight}; }
  img    { max-width: 100%; max-height: clamp(100px,15vw,150px); object-fit: contain;
           margin-top: 10px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,.09); }
  input  { display: none; }
`;

const OrDivider = styled.div`
  display: flex; align-items: center; gap: 12px;
  margin: clamp(14px,2vw,20px) 0;
  color: ${p => p.theme.colors.textLight}; font-size: 12px; font-weight: 600;
  &::before, &::after { content: ''; flex: 1; height: 1px;
    background: ${p => p.theme.colors.borderLight}; }
`;

const CameraSection = styled.div`
  margin-bottom: clamp(14px,2vw,20px);
  video, img.preview {
    width: 100%; border-radius: 14px; aspect-ratio: 4/3; object-fit: cover;
    background: ${p => p.theme.colors.bgDark}; display: block;
    box-shadow: 0 6px 20px rgba(0,0,0,.1);
  }
  .cam-actions { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
`;

const InfoBox = styled(motion.div)`
  background: ${p => p.theme.colors.primary}08;
  border: 2px solid ${p => p.theme.colors.primary}30;
  border-left: 5px solid ${p => p.theme.colors.primary};
  padding: clamp(12px,2vw,16px) clamp(14px,2.5vw,20px);
  border-radius: 14px; margin-bottom: clamp(18px,3vw,26px);
  display: flex; gap: 12px;
  svg { width: 18px; height: 18px; color: ${p => p.theme.colors.primary}; flex-shrink: 0; margin-top: 2px; }
  .content { flex: 1;
    p { font-size: clamp(12px,1.3vw,13px); color: ${p => p.theme.colors.text};
        line-height: 1.6; margin-bottom: 4px; &:last-child { margin: 0; } }
    strong { font-weight: 700; color: ${p => p.theme.colors.primary}; }
  }
`;

const ButtonGroup = styled.div`
  display: flex; gap: clamp(10px,2vw,16px); margin-top: clamp(20px,3.5vw,32px);
  button { flex: 1; min-height: clamp(42px,5vw,50px); font-size: clamp(13px,1.5vw,15px);
           font-weight: 700; border-radius: 12px;
           transition: all .3s cubic-bezier(.4,0,.2,1);
           &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(0,0,0,.14); } }
  @media (max-width: 480px) { flex-direction: column; }
`;

const FaceResultCard = styled(motion.div)`
  background: ${p => p.$success ? p.theme.colors.success + '10' : '#fee2e210'};
  border: 2px solid ${p => p.$success ? p.theme.colors.success + '60' : '#ef444460'};
  border-radius: 16px; padding: clamp(16px,3vw,24px); margin-top: 20px; text-align: center;
  h3 { font-size: 18px; font-weight: 800;
       color: ${p => p.$success ? p.theme.colors.success : '#ef4444'}; margin-bottom: 8px; }
  p  { font-size: 14px; color: ${p => p.theme.colors.textLight}; }
  .bar-wrap { width: 100%; max-width: 280px; margin: 12px auto 0;
    background: ${p => p.theme.colors.border}; border-radius: 99px; height: 8px; overflow: hidden; }
  .bar { height: 100%; border-radius: 99px;
    background: ${p => p.$success ? p.theme.colors.success : '#ef4444'}; transition: width 1s ease; }
`;

const CompletionCard = styled(motion.div)`
  background: ${p => p.theme.colors.success}; border-radius: clamp(16px,2.5vw,24px);
  padding: clamp(40px,7vw,60px) clamp(20px,5vw,48px); text-align: center; color: white;
  box-shadow: 0 16px 48px rgba(16,185,129,.28);
  .success-icon {
    width: clamp(60px,8vw,84px); height: clamp(60px,8vw,84px);
    margin: 0 auto clamp(18px,3vw,26px); background: rgba(255,255,255,.2);
    backdrop-filter: blur(10px); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 12px 32px rgba(0,0,0,.15);
    animation: ${bounce} 2s ease-in-out infinite;
    svg { width: 48px; height: 48px; }
  }
  h2 { font-size: clamp(20px,3.5vw,30px); font-weight: 900; margin-bottom: 14px; letter-spacing: -0.5px; }
  p  { font-size: clamp(13px,1.6vw,15px); opacity: .94; margin-bottom: clamp(22px,4vw,32px);
       line-height: 1.7; max-width: 440px; margin-left: auto; margin-right: auto; }
  button { background: white; color: ${p => p.theme.colors.success}; font-weight: 800;
    padding: clamp(12px,1.5vw,15px) clamp(24px,4vw,36px); border-radius: 12px;
    font-size: clamp(13px,1.5vw,15px); box-shadow: 0 6px 20px rgba(0,0,0,.14);
    transition: all .3s ease; &:hover { transform: translateY(-3px); } }
`;

const OcrResultCard = styled(motion.div)`
  background: ${p => p.theme.colors.bgDark};
  border: 2px solid ${p => p.theme.colors.success}50;
  border-radius: 16px;
  padding: clamp(16px,3vw,24px);
  margin: clamp(16px,2.5vw,22px) 0 0;
  .ocr-title {
    font-size: 12px; font-weight: 700; color: ${p => p.theme.colors.success};
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px;
    display: flex; align-items: center; gap: 8px;
  }
  .ocr-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
    @media (max-width: 560px) { grid-template-columns: 1fr; }
  }
  .ocr-field { display: flex; flex-direction: column; gap: 3px; }
  .ocr-label { font-size: 11px; font-weight: 700; color: ${p => p.theme.colors.textLight};
               text-transform: uppercase; letter-spacing: 0.4px; }
  .ocr-value { font-size: 14px; font-weight: 600; color: ${p => p.theme.colors.text}; }
  .ocr-full  { grid-column: 1 / -1; }
`;

const LoadingOverlay = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0,0,0,.55);
  backdrop-filter: blur(4px); display: flex; flex-direction: column;
  align-items: center; justify-content: center; z-index: 9999; gap: 20px;
  .spinner { animation: ${spin} .9s linear infinite; color: white; }
  p { color: white; font-size: 16px; font-weight: 600; }
`;

// ─── Component ────────────────────────────────────────────────────────────────
const CandidateKYC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Bước 0 = CCCD, Bước 1 = Selfie, Bước 2 = Done
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(language === 'vi' ? 'Đang kiểm tra trạng thái xác thực...' : 'Checking verification status...');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const checkVerificationStatus = async () => {
      if (!user?.userId) return;
      try {
        const res = await getKycStatus(user.userId);
        if (active) {
          if (res && (res.kycCompleted || res.kycStatus === 'VERIFIED')) {
            navigate('/candidate/profile', { replace: true });
          } else {
            setLoading(false);
            setLoadingMsg('');
          }
        }
      } catch (err) {
        console.error('Error checking KYC status:', err);
        if (active) {
          setLoading(false);
          setLoadingMsg('');
        }
      }
    };

    checkVerificationStatus();

    return () => {
      active = false;
    };
  }, [user, navigate, language]);

  // CCCD images & OCR
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);  // kết quả từ VNPT
  const [frontHash, setFrontHash] = useState(null);  // hash để tái dùng cho face verify
  const [frontToken, setFrontToken] = useState(null);  // transaction token từ OCR
  const [ocrConfirmed, setOcrConfirmed] = useState(false); // ứng viên đã bấm xác nhận

  // Selfie & face result
  const [selfieImg, setSelfieImg] = useState(null);
  const [faceResult, setFaceResult] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);

  const t = (vi, en) => language === 'vi' ? vi : en;

  const steps = [
    { id: 0, label: t('Xác minh CCCD', 'ID Card'), icon: CreditCard },
    { id: 1, label: t('Khuôn mặt', 'Selfie'), icon: Camera },
  ];

  const getProgress = () => (completedSteps.length / steps.length) * 100;
  const markComplete = (s) => setCompletedSteps(p => p.includes(s) ? p : [...p, s]);

  // ─── Camera ──────────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(tr => tr.stop()); streamRef.current = null; }
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraOn(true);
    } catch {
      setError(t('Không thể mở camera. Kiểm tra quyền trình duyệt.', 'Cannot access camera. Check browser permissions.'));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video?.srcObject) { setError(t('Vui lòng bật camera trước', 'Please start camera first')); return; }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 960;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();
    setSelfieImg(dataUrl);
    setFaceResult(null);
    setError('');
  }, [stopCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Upload helpers ───────────────────────────────────────────────────────────
  const handleIdUpload = useCallback((field, file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError(t('Ảnh tối đa 10MB', 'Max 10MB')); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      // Reset OCR khi đổi ảnh
      setOcrResult(null); setOcrConfirmed(false); setFrontHash(null); setFrontToken(null); setError('');
      if (field === 'front') setFrontImage(reader.result);
      else setBackImage(reader.result);
    };
    reader.readAsDataURL(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Bước 0: gọi OCR ─────────────────────────────────────────────────────────
  const handleSendOcr = async () => {
    if (!frontImage) { setError(t('Vui lòng tải ảnh mặt trước CCCD', 'Please upload the ID front image')); return; }
    setError('');
    setLoading(true);
    setLoadingMsg(t('Đang đọc thông tin CCCD…', 'Reading ID card information…'));
    try {
      const result = await ocrCCCD(frontImage, backImage);
      if (!result.success) throw new Error(result.errorMsg || 'OCR thất bại');
      setOcrResult(result.object);
      setFrontHash(result.front_hash || null);
      setFrontToken(result.front_token || null);
    } catch (err) {
      setError(err.message || t('Không đọc được CCCD. Vui lòng thử ảnh rõ hơn.', 'Could not read ID. Please try a clearer image.'));
    } finally {
      setLoading(false); setLoadingMsg('');
    }
  };

  // ─── Bước 1: face verify — dùng front_hash + front_token từ OCR, KHÔNG gửi lại ảnh CCCD ──────────────────────────────────────────────────────────────
  const handleFaceVerify = async () => {
    if (!selfieImg) { setError(t('Vui lòng chụp ảnh selfie', 'Please take a selfie')); return; }
    setError('');
    setLoading(true);
    setLoadingMsg(t('Đang xác minh khuôn mặt…', 'Verifying face…'));
    try {
      const faceRes = await verifyFace(selfieImg, frontHash, frontToken);
      setFaceResult(faceRes);
      if (faceRes?.kycStatus === 'VERIFIED') {
        try {
          await candidateProfileService.updateProfile({
            cccd: ocrResult?.id || '',
            fullName: ocrResult?.name || '',
            dateOfBirth: ocrResult?.dob || ''
          });
        } catch (dbErr) {
          console.error('Failed to update profile fields:', dbErr);
        }
        markComplete(1);
        setTimeout(() => { markComplete(0); setCurrentStep(2); }, 2000);
      } else {
        const sim = faceRes?.object?.similarity?.toFixed(1);
        setError(t(
          `Xác minh thất bại. Độ tương đồng: ${sim ?? '–'}% (cần ≥ 85%). Vui lòng chụp lại.`,
          `Verification failed. Similarity: ${sim ?? '–'}% (need ≥ 85%). Please retake.`
        ));
      }
    } catch (err) {
      setError(err.message || t('Xác minh thất bại. Vui lòng thử lại.', 'Verification failed. Please try again.'));
    } finally {
      setLoading(false); setLoadingMsg('');
    }
  };

  // ─── Navigation ──────────────────────────────────────────────────────────────
  const handleNext = () => {
    setError('');
    if (currentStep === 0) {
      if (!ocrConfirmed) { setError(t('Vui lòng xác nhận thông tin CCCD trước', 'Please confirm your ID information first')); return; }
      markComplete(0);
      stopCamera();
      setCurrentStep(1);
    } else if (currentStep === 1) {
      handleFaceVerify();
    }
  };

  const handleBack = () => {
    setError(''); stopCamera();
    if (currentStep > 0) setCurrentStep(s => s - 1);
    else navigate('/candidate/profile');
  };

  // ─── Done screen ──────────────────────────────────────────────────────────────
  if (currentStep === 2) {
    return (
      <DashboardLayout role="candidate">
        <VerificationContainer>
          <CompletionCard initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="success-icon"><CheckCircle /></div>
            <h2>{t('🎉 Xác Minh eKYC Hoàn Tất!', '🎉 eKYC Verification Complete!')}</h2>
            <p>{t(
              'Danh tính của bạn đã được xác minh thành công qua VNPT eKYC. Tài khoản đã được cập nhật, bạn có thể bắt đầu ứng tuyển.',
              'Your identity has been verified successfully via VNPT eKYC. Your account is now updated and you can start applying.'
            )}</p>
            <Button onClick={() => navigate('/candidate/profile')}>{t('Về Hồ Sơ', 'Go to Profile')}</Button>
          </CompletionCard>
        </VerificationContainer>
      </DashboardLayout>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout role="candidate">
      <AnimatePresence>
        {loading && (
          <LoadingOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader size={52} className="spinner" />
            <p>{loadingMsg}</p>
          </LoadingOverlay>
        )}
      </AnimatePresence>

      <VerificationContainer>
        {/* Header */}
        <Header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="header-icon"><Shield /></div>
          <h1>{t('Xác Minh eKYC', 'eKYC Verification')}</h1>
          <p>{t('Hoàn tất 2 bước để xác minh danh tính và bắt đầu ứng tuyển', 'Complete 2 steps to verify your identity and start applying')}</p>
        </Header>

        {/* Stepper */}
        <StepperContainer>
          <ProgressLine
            initial={{ width: 0 }}
            animate={{ width: `${getProgress()}%` }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
          {steps.map((s, i) => (
            <Step key={s.id} $active={currentStep === i} $completed={completedSteps.includes(i)}
              $clickable={completedSteps.includes(i)}
              onClick={() => completedSteps.includes(i) && setCurrentStep(i)}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <motion.div className="step-circle" initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.1 + 0.2, type: 'spring' }}>
                {completedSteps.includes(i) ? <CheckCircle /> : <span>{i + 1}</span>}
              </motion.div>
              <div className="step-label">{s.label}</div>
            </Step>
          ))}
        </StepperContainer>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{
                background: '#fee2e2', border: '2px solid #ef444450', borderRadius: 12,
                padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center',
                gap: 10, color: '#b91c1c', fontSize: 14, fontWeight: 600
              }}>
              <XCircle size={18} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* ═══ BƯỚC 0: CCCD ═══ */}
          {currentStep === 0 && (
            <FormCard key="step-cccd"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }}>

              <FormTitle>
                <div className="icon"><CreditCard /></div>
                <div>
                  <h2>{t('Xác Minh CCCD / CMND', 'ID Card Verification')}</h2>
                  <p>{t('Upload ảnh 2 mặt, sau đó gửi để đọc thông tin', 'Upload both sides, then submit to extract info')}</p>
                </div>
              </FormTitle>

              <InfoBox initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <AlertCircle />
                <div className="content">
                  <p>{t('• Ảnh rõ nét, đủ sáng, không bị mờ hoặc chói sáng', '• Clear, well-lit images without blur or glare')}</p>
                  <p>{t('• Định dạng JPG, PNG — tối đa 10MB mỗi ảnh', '• JPG, PNG format — max 10MB each')}</p>
                </div>
              </InfoBox>

              {/* Upload 2 ảnh */}
              <UploadGrid>
                {/* Mặt trước */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'inherit' }}>
                    {t('Mặt trước *', 'Front side *')}
                  </div>
                  <UploadBox $hasFile={!!frontImage}
                    onClick={() => { setOcrResult(null); setOcrConfirmed(false); document.getElementById('id-front').click(); }}>
                    {frontImage ? (
                      <><CheckCircle className="icon" /><div className="label">{t('✓ Đã tải', '✓ Uploaded')}</div><img src={frontImage} alt="front" /></>
                    ) : (
                      <><Upload className="icon" /><div className="label">{t('Tải ảnh mặt trước', 'Upload front')}</div><div className="hint">JPG, PNG (max 10MB)</div></>
                    )}
                    <input id="id-front" type="file" accept="image/*"
                      onChange={e => handleIdUpload('front', e.target.files[0])} />
                  </UploadBox>
                </div>

                {/* Mặt sau */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'inherit' }}>
                    {t('Mặt sau (tuỳ chọn)', 'Back side (optional)')}
                  </div>
                  <UploadBox $hasFile={!!backImage}
                    onClick={() => { setOcrResult(null); setOcrConfirmed(false); document.getElementById('id-back').click(); }}>
                    {backImage ? (
                      <><CheckCircle className="icon" /><div className="label">{t('✓ Đã tải', '✓ Uploaded')}</div><img src={backImage} alt="back" /></>
                    ) : (
                      <><Upload className="icon" /><div className="label">{t('Tải ảnh mặt sau', 'Upload back')}</div><div className="hint">JPG, PNG (max 10MB)</div></>
                    )}
                    <input id="id-back" type="file" accept="image/*"
                      onChange={e => handleIdUpload('back', e.target.files[0])} />
                  </UploadBox>
                </div>
              </UploadGrid>

              {/* Nút Gửi OCR — chỉ hiện khi có ảnh và chưa OCR */}
              {frontImage && !ocrResult && (
                <Button $variant="primary" onClick={handleSendOcr} disabled={loading}
                  style={{ width: '100%', marginBottom: 8 }}>
                  <Shield size={16} style={{ marginRight: 6 }} />
                  {t('Gửi Đọc Thông Tin CCCD', 'Submit for ID Extraction')}
                </Button>
              )}

              {/* Kết quả OCR — hiển thị để ứng viên kiểm tra */}
              <AnimatePresence>
                {ocrResult && (
                  <OcrResultCard
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}
                  >
                    <div className="ocr-title"><CheckCircle size={14} />{t('Thông tin đọc từ CCCD — vui lòng kiểm tra', 'Extracted info — please verify')}</div>
                    <div className="ocr-grid">
                      <div className="ocr-field"><span className="ocr-label">{t('Số CCCD', 'ID Number')}</span><span className="ocr-value">{ocrResult.id || '–'}</span></div>
                      <div className="ocr-field"><span className="ocr-label">{t('Ngày sinh', 'Date of Birth')}</span><span className="ocr-value">{ocrResult.dob || '–'}</span></div>
                      <div className="ocr-field ocr-full"><span className="ocr-label">{t('Họ tên', 'Full Name')}</span><span className="ocr-value">{ocrResult.name || '–'}</span></div>
                      <div className="ocr-field"><span className="ocr-label">{t('Giới tính', 'Sex')}</span><span className="ocr-value">{ocrResult.sex || '–'}</span></div>
                      <div className="ocr-field"><span className="ocr-label">{t('Quốc tịch', 'Nationality')}</span><span className="ocr-value">{ocrResult.nationality || '–'}</span></div>
                      <div className="ocr-field ocr-full"><span className="ocr-label">{t('Địa chỉ thường trú', 'Address')}</span><span className="ocr-value">{ocrResult.address || '–'}</span></div>
                      <div className="ocr-field"><span className="ocr-label">{t('Ngày cấp', 'Issue Date')}</span><span className="ocr-value">{ocrResult.issue_date || '–'}</span></div>
                      <div className="ocr-field"><span className="ocr-label">{t('Nơi cấp', 'Issue Place')}</span><span className="ocr-value">{ocrResult.issue_place || '–'}</span></div>
                    </div>

                    {/* Xác nhận / Đọc lại */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                      <Button $variant="secondary" onClick={() => { setOcrResult(null); setFrontHash(null); setFrontToken(null); }}
                        style={{ flex: 1 }}>
                        <RotateCcw size={14} style={{ marginRight: 6 }} />
                        {t('Đọc lại', 'Re-extract')}
                      </Button>
                      <Button $variant="primary"
                        onClick={() => setOcrConfirmed(true)}
                        disabled={ocrConfirmed}
                        style={{ flex: 1, background: ocrConfirmed ? undefined : undefined }}>
                        <CheckCircle size={14} style={{ marginRight: 6 }} />
                        {ocrConfirmed ? t('✓ Đã xác nhận', '✓ Confirmed') : t('Thông tin đúng, Tiếp tục', 'Info correct, Continue')}
                      </Button>
                    </div>
                  </OcrResultCard>
                )}
              </AnimatePresence>

              <ButtonGroup>
                <Button $variant="secondary" onClick={handleBack} disabled={loading}>
                  <ArrowLeft size={16} style={{ marginRight: 6 }} />{t('Quay lại', 'Back')}
                </Button>
                <Button $variant="primary" onClick={handleNext} disabled={!ocrConfirmed || loading}>
                  {t('Tiếp theo', 'Next')}<ArrowRight size={16} style={{ marginLeft: 6 }} />
                </Button>
              </ButtonGroup>
            </FormCard>
          )}

          {/* ═══ BƯỚC 1: SELFIE ═══ */}
          {currentStep === 1 && (
            <FormCard key="step-selfie"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }}>

              <FormTitle>
                <div className="icon"><Camera /></div>
                <div>
                  <h2>{t('Xác Minh Khuôn Mặt', 'Face Verification')}</h2>
                  <p>{t('Chụp selfie để so khớp với ảnh trên CCCD', 'Take a selfie to match with your ID photo')}</p>
                </div>
              </FormTitle>

              <InfoBox initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <AlertCircle />
                <div className="content">
                  <p>{t('• Nhìn thẳng vào camera, đủ sáng, không đeo kính râm hoặc khẩu trang', '• Look directly at camera, good lighting, no sunglasses or mask')}</p>
                  <p>{t('• Khuôn mặt sẽ được so sánh với ảnh CCCD (độ khớp ≥ 85%)', '• Face compared with ID card photo (similarity ≥ 85%)')}</p>
                </div>
              </InfoBox>

              {/* Camera / selfie preview */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {!selfieImg ? (
                  <>
                    <CameraSection>
                      <video ref={videoRef} autoPlay playsInline muted />
                    </CameraSection>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                      {!cameraOn ? (
                        <Button $variant="secondary" onClick={startCamera}>
                          <Camera size={16} style={{ marginRight: 6 }} />{t('Bật Camera', 'Start Camera')}
                        </Button>
                      ) : (
                        <>
                          <Button $variant="primary" onClick={capturePhoto}>
                            <Camera size={16} style={{ marginRight: 6 }} />{t('Chụp Ảnh', 'Capture')}
                          </Button>
                          <Button $variant="secondary" onClick={stopCamera}>{t('Huỷ', 'Cancel')}</Button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <img src={selfieImg} alt="selfie"
                      style={{
                        width: '100%', maxWidth: 360, borderRadius: 14, objectFit: 'cover',
                        aspectRatio: '4/3', boxShadow: '0 6px 20px rgba(0,0,0,.1)'
                      }} />
                    <div style={{ marginTop: 10 }}>
                      <Button $variant="secondary"
                        onClick={() => { setSelfieImg(null); setFaceResult(null); setError(''); }}>
                        <RotateCcw size={14} style={{ marginRight: 6 }} />{t('Chụp lại', 'Retake')}
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Face result */}
              <AnimatePresence>
                {faceResult && !loading && (
                  <FaceResultCard $success={faceResult.kycStatus === 'VERIFIED'}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}>
                    {faceResult.kycStatus === 'VERIFIED' ? (
                      <>
                        <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 8px', display: 'block' }} />
                        <h3>{t('✅ Xác minh thành công!', '✅ Verification successful!')}</h3>
                        <p>{t('Đang chuyển trang…', 'Redirecting…')}</p>
                      </>
                    ) : (
                      <>
                        <XCircle size={40} color="#ef4444" style={{ margin: '0 auto 8px', display: 'block' }} />
                        <h3>{t('❌ Xác minh thất bại', '❌ Verification failed')}</h3>
                        <p>{t(`Độ tương đồng: ${faceResult.object?.similarity?.toFixed(1) ?? '–'}%`, `Similarity: ${faceResult.object?.similarity?.toFixed(1) ?? '–'}%`)}</p>
                        <div className="bar-wrap">
                          <div className="bar" style={{ width: `${faceResult.object?.similarity || 0}%` }} />
                        </div>
                      </>
                    )}
                  </FaceResultCard>
                )}
              </AnimatePresence>

              <ButtonGroup>
                <Button $variant="secondary" onClick={handleBack} disabled={loading}>
                  <ArrowLeft size={16} style={{ marginRight: 6 }} />{t('Quay lại', 'Back')}
                </Button>
                <Button $variant="primary" onClick={handleNext}
                  disabled={!selfieImg || loading || faceResult?.kycStatus === 'VERIFIED'}>
                  <Shield size={16} style={{ marginRight: 6 }} />
                  {loading ? t('Đang xác minh…', 'Verifying…') : t('Hoàn Tất Xác Minh', 'Complete Verification')}
                </Button>
              </ButtonGroup>
            </FormCard>
          )}

        </AnimatePresence>
      </VerificationContainer>
    </DashboardLayout>
  );
};

export default CandidateKYC;
