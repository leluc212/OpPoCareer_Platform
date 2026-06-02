/**
 * CandidateKYC.jsx — Xác minh eKYC ứng viên
 *
 * Luồng 2 bước:
 *   0. CCCD — upload ảnh → gọi /ekyc/ocr → ứng viên xác nhận
 *   1. Selfie — webcam → gọi /ekyc/verify-face → VERIFIED → update DynamoDB
 */
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { Button, Input, FormGroup, Label } from '../../components/FormElements';
import {
  CheckCircle, Upload, CreditCard, Camera,
  ArrowRight, ArrowLeft, AlertCircle, Shield,
  Loader, XCircle, Eye, RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ocrCCCD, verifyFace } from '../../services/ekycService';

// ─── Styled Components ────────────────────────────────────────────────────────

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const float = keyframes`0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); }`;
const pulse = keyframes`
  0%,100% { transform: scale(1); box-shadow: 0 8px 24px rgba(30,64,175,.35); }
  50%      { transform: scale(1.05); box-shadow: 0 12px 32px rgba(30,64,175,.45); }
`;
const ripple = keyframes`
  0%   { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.2); opacity: 0; }
`;
const bounce = keyframes`0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); }`;

const VerificationContainer = styled.div`
  width: 100%;
  max-width: min(900px, 100%);
  margin: 0 auto;
  padding: 0 clamp(12px, 3vw, 24px);
  box-sizing: border-box;
`;

const Header = styled(motion.div)`
  text-align: center;
  margin-bottom: clamp(28px, 5vw, 48px);
  .header-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: clamp(52px, 7vw, 72px);
    height: clamp(52px, 7vw, 72px);
    background: ${p => p.theme.colors.primary};
    border-radius: 18px;
    margin-bottom: 16px;
    box-shadow: 0 8px 24px rgba(30,64,175,.25);
    animation: ${float} 3s ease-in-out infinite;
    svg { width: clamp(24px,3.5vw,36px); height: clamp(24px,3.5vw,36px); color: white; }
  }
  h1 { font-size: clamp(20px,3.5vw,32px); font-weight: 800; margin-bottom: 10px;
       color: ${p => p.theme.colors.text}; letter-spacing: -0.5px; }
  p  { font-size: clamp(13px,1.6vw,16px); color: ${p => p.theme.colors.textLight};
       max-width: 560px; margin: 0 auto; line-height: 1.65; }
`;

const StepperContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: clamp(28px,5vw,48px);
  position: relative;
  padding: 0 clamp(8px,2vw,20px);
  &::before {
    content: '';
    position: absolute;
    top: clamp(18px,2.5vw,28px);
    left: 12%; right: 12%;
    height: 3px;
    background: ${p => p.theme.colors.borderLight};
    z-index: 0;
    border-radius: 10px;
  }
`;

const ProgressLine = styled(motion.div)`
  position: absolute;
  top: clamp(18px,2.5vw,28px);
  left: 12%;
  height: 3px;
  background: ${p => p.theme.colors.primary};
  z-index: 0;
  border-radius: 10px;
  box-shadow: 0 0 16px rgba(30,64,175,.4);
`;

const Step = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex: 1;
  position: relative;
  z-index: 1;
  cursor: ${p => p.$clickable ? 'pointer' : 'default'};
  transition: transform .3s ease;
  &:hover { transform: ${p => p.$clickable ? 'translateY(-4px)' : 'none'}; }
  .step-circle {
    width: clamp(36px,4.5vw,52px);
    height: clamp(36px,4.5vw,52px);
    border-radius: 50%;
    background: ${p => p.$completed ? p.theme.colors.success : p.$active ? p.theme.colors.primary : p.theme.colors.bgLight};
    border: 2.5px solid ${p => p.$completed ? p.theme.colors.success : p.$active ? p.theme.colors.primary : p.theme.colors.border};
    display: flex; align-items: center; justify-content: center;
    color: ${p => (p.$completed || p.$active) ? 'white' : p.theme.colors.textLight};
    font-weight: 800;
    font-size: clamp(13px,1.5vw,17px);
    transition: all .4s cubic-bezier(.4,0,.2,1);
    box-shadow: ${p => (p.$completed || p.$active)
      ? `0 8px 24px ${p.$active ? 'rgba(30,64,175,.35)' : 'rgba(16,185,129,.35)'}`
      : '0 2px 8px rgba(0,0,0,.05)'};
    svg { width: clamp(16px,2vw,24px); height: clamp(16px,2vw,24px); }
    ${p => p.$active && css`animation: ${pulse} 2s ease-in-out infinite;`}
  }
  .step-label {
    font-size: clamp(10px,1.2vw,13px);
    font-weight: 700;
    color: ${p => p.$completed ? p.theme.colors.success : p.$active ? p.theme.colors.primary : p.theme.colors.textLight};
    text-align: center;
    transition: all .3s ease;
    max-width: clamp(60px,10vw,100px);
    line-height: 1.3;
    @media (max-width: 480px) { display: none; }
  }
`;

const FormCard = styled(motion.div)`
  background: ${p => p.theme.colors.bgLight};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: clamp(14px,2vw,22px);
  padding: clamp(20px,4vw,40px) clamp(16px,4vw,40px);
  box-shadow: 0 6px 28px rgba(0,0,0,.07);
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: ${p => p.theme.colors.primary};
  }
`;

const FormTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
  padding-bottom: 28px;
  border-bottom: 2px solid ${p => p.theme.colors.borderLight};
  .icon {
    width: clamp(40px,5vw,52px); height: clamp(40px,5vw,52px);
    border-radius: 14px;
    background: ${p => p.theme.colors.primary};
    display: flex; align-items: center; justify-content: center;
    color: white;
    box-shadow: 0 6px 18px rgba(30,64,175,.25);
    flex-shrink: 0;
    svg { width: clamp(20px,2.5vw,26px); height: clamp(20px,2.5vw,26px); }
  }
  h2 { font-size: clamp(16px,2.5vw,22px); font-weight: 800; color: ${p => p.theme.colors.text}; letter-spacing: -0.3px; }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(14px,2.5vw,24px);
  margin-bottom: clamp(14px,2.5vw,24px);
  @media (max-width: 640px) { grid-template-columns: 1fr; }
  .full-width { grid-column: 1 / -1; }
`;

const FileUploadArea = styled.div`
  border: 3px dashed ${p => p.$hasFile ? p.theme.colors.success : p.theme.colors.border};
  border-radius: 20px;
  padding: clamp(16px,3vw,28px) clamp(12px,2.5vw,20px);
  text-align: center;
  cursor: pointer;
  transition: all .4s cubic-bezier(.4,0,.2,1);
  background: ${p => p.$hasFile ? p.theme.colors.success + '08' : p.theme.colors.bgDark};
  position: relative;
  overflow: hidden;
  &:hover {
    border-color: ${p => p.theme.colors.primary};
    background: ${p => p.theme.colors.primary}0a;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(30,64,175,.13);
    .upload-icon { transform: scale(1.08) translateY(-3px); }
  }
  &:active { transform: translateY(0); }
  .upload-icon {
    width: clamp(32px,4vw,44px); height: clamp(32px,4vw,44px);
    margin: 0 auto clamp(8px,1.5vw,14px);
    color: ${p => p.$hasFile ? p.theme.colors.success : p.theme.colors.primary};
    transition: all .3s ease;
  }
  .upload-text { font-size: clamp(12px,1.4vw,15px); font-weight: 700;
                 color: ${p => p.$hasFile ? p.theme.colors.success : p.theme.colors.text}; margin-bottom: 6px; }
  .upload-hint { font-size: clamp(11px,1.2vw,13px); color: ${p => p.theme.colors.textLight}; font-weight: 500; }
  img { max-width: 100%; max-height: clamp(100px,15vw,160px); object-fit: contain;
        margin-top: 12px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,.09); }
  input[type="file"] { display: none; }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: clamp(10px,2vw,16px);
  margin-top: clamp(20px,3.5vw,36px);
  button {
    flex: 1;
    min-height: clamp(42px,5vw,50px);
    font-size: clamp(13px,1.5vw,15px);
    font-weight: 700;
    border-radius: 12px;
    transition: all .3s cubic-bezier(.4,0,.2,1);
    &:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(0,0,0,.14); }
  }
  @media (max-width: 480px) { flex-direction: column; }
`;

const InfoBox = styled(motion.div)`
  background: ${p => p.$variant === 'warn' ? '#fef3c7' : p.theme.colors.primary + '08'};
  border: 2px solid ${p => p.$variant === 'warn' ? '#f59e0b40' : p.theme.colors.primary + '30'};
  border-left: 5px solid ${p => p.$variant === 'warn' ? '#f59e0b' : p.theme.colors.primary};
  padding: clamp(12px,2vw,18px) clamp(14px,2.5vw,22px);
  border-radius: 14px;
  margin-bottom: clamp(18px,3vw,28px);
  display: flex;
  gap: 12px;
  svg { width: 20px; height: 20px; color: ${p => p.$variant === 'warn' ? '#f59e0b' : p.theme.colors.primary};
        flex-shrink: 0; margin-top: 2px; }
  .info-content {
    flex: 1;
    p { font-size: clamp(12px,1.3vw,14px); color: ${p => p.theme.colors.text};
        line-height: 1.65; margin-bottom: 6px; &:last-child { margin-bottom: 0; } }
    strong { font-weight: 700; color: ${p => p.$variant === 'warn' ? '#b45309' : p.theme.colors.primary}; }
  }
`;

const CompletionCard = styled(motion.div)`
  background: ${p => p.theme.colors.success};
  border-radius: clamp(16px,2.5vw,24px);
  padding: clamp(40px,7vw,64px) clamp(20px,5vw,48px);
  text-align: center;
  color: white;
  box-shadow: 0 16px 48px rgba(16,185,129,.28);
  position: relative;
  overflow: hidden;
  .success-icon {
    width: clamp(64px,9vw,88px); height: clamp(64px,9vw,88px);
    margin: 0 auto clamp(20px,3vw,28px);
    background: rgba(255,255,255,.2);
    backdrop-filter: blur(10px);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 12px 32px rgba(0,0,0,.15);
    animation: ${bounce} 2s ease-in-out infinite;
    svg { width: 52px; height: 52px; }
  }
  h2 { font-size: clamp(20px,3.5vw,32px); font-weight: 900; margin-bottom: 16px; letter-spacing: -0.5px; }
  p  { font-size: clamp(13px,1.6vw,16px); opacity: .94; margin-bottom: clamp(24px,4vw,36px);
       line-height: 1.7; max-width: 480px; margin-left: auto; margin-right: auto; }
  button {
    background: white; color: ${p => p.theme.colors.success}; font-weight: 800;
    padding: clamp(12px,1.5vw,15px) clamp(24px,4vw,36px); border-radius: 12px;
    font-size: clamp(13px,1.5vw,15px); box-shadow: 0 6px 20px rgba(0,0,0,.14);
    transition: all .3s ease;
    &:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,.18); }
  }
`;

const VideoWrapper = styled.div`
  width: 100%;
  max-width: min(420px, 100%);
  margin: 0 auto;
  border-radius: clamp(14px,2vw,20px);
  overflow: hidden;
  background: #1a1a2e;
  aspect-ratio: 4/3;
  position: relative;
  box-shadow: 0 10px 32px rgba(0,0,0,.18);
  border: 3px solid ${p => p.theme.colors.border};
  video, img { width: 100%; height: 100%; object-fit: cover; }
`;

// Loading overlay
const LoadingOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  gap: 20px;
  .spinner { animation: ${spin} .9s linear infinite; color: white; }
  p { color: white; font-size: 16px; font-weight: 600; }
`;

// OCR result card
const OcrResultCard = styled(motion.div)`
  background: ${p => p.theme.colors.bgDark};
  border: 2px solid ${p => p.theme.colors.success}50;
  border-radius: 16px;
  padding: clamp(16px,3vw,28px);
  margin: clamp(16px,3vw,24px) 0;
  .ocr-title {
    font-size: 13px; font-weight: 700; color: ${p => p.theme.colors.success};
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .ocr-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
    @media (max-width: 560px) { grid-template-columns: 1fr; }
  }
  .ocr-field { display: flex; flex-direction: column; gap: 4px; }
  .ocr-label { font-size: 11px; font-weight: 700; color: ${p => p.theme.colors.textLight};
               text-transform: uppercase; letter-spacing: 0.4px; }
  .ocr-value { font-size: 14px; font-weight: 600; color: ${p => p.theme.colors.text}; }
  .ocr-full  { grid-column: 1 / -1; }
`;

// Face result card
const FaceResultCard = styled(motion.div)`
  background: ${p => p.$success ? p.theme.colors.success + '10' : '#fee2e210'};
  border: 2px solid ${p => p.$success ? p.theme.colors.success + '60' : '#ef444460'};
  border-radius: 16px;
  padding: clamp(16px,3vw,24px);
  margin-top: 20px;
  text-align: center;
  .result-icon { margin-bottom: 12px; }
  .similarity-bar-wrap { width: 100%; max-width: 300px; margin: 16px auto 0;
    background: ${p => p.theme.colors.border}; border-radius: 99px; height: 10px; overflow: hidden; }
  .similarity-bar { height: 100%; border-radius: 99px;
    background: ${p => p.$success ? p.theme.colors.success : '#ef4444'};
    transition: width 1s ease; }
  h3 { font-size: 18px; font-weight: 800;
       color: ${p => p.$success ? p.theme.colors.success : '#ef4444'}; margin-bottom: 8px; }
  p  { font-size: 14px; color: ${p => p.theme.colors.textLight}; }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const CandidateKYC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null); // giữ stream để stop đúng cách

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');

  // Step 0 — OCR CCCD
  const [idData, setIdData] = useState({
    idFrontImage: null,
    idBackImage:  null,
    ocrResult:    null,
    ocrConfirmed: false,
    frontHash:    null,  // lưu hash để dùng lại cho face verify
  });

  // Step 1 — Face
  const [faceData, setFaceData] = useState({
    facePhoto:    null,
    verifyResult: null,
  });

  const t = (vi, en) => language === 'vi' ? vi : en;

  const steps = [
    { id: 0, label: t('Xác minh CCCD', 'ID Card'), icon: CreditCard },
    { id: 1, label: t('Khuôn mặt',     'Face'),    icon: Camera },
  ];

  const getProgress = () => (completedSteps.length / steps.length) * 100;

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const markComplete = (step) => {
    setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step]);
  };

  const handleFileUpload = useCallback((field, file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError(t('Ảnh không được vượt quá 10MB', 'Image must be under 10MB'));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setIdData(prev => ({ ...prev, [field]: reader.result, ocrResult: null, ocrConfirmed: false }));
      setError('');
    };
    reader.readAsDataURL(file);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const constraints = {
        video: {
          facingMode: 'user',
          width:  { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setError(t(
        'Không thể truy cập camera. Kiểm tra quyền trình duyệt và thử lại.',
        'Cannot access camera. Check browser permissions and try again.'
      ));
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.srcObject) {
      setError(t('Vui lòng bật camera trước', 'Please start the camera first'));
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 960;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const photo = canvas.toDataURL('image/jpeg', 0.9);
    setFaceData({ facePhoto: photo, verifyResult: null });
    stopCamera();
    setError('');
  }, [stopCamera]);

  // ─── Step actions ─────────────────────────────────────────────────────────────

  // Step 0: gọi OCR API
  const runOcr = async () => {
    if (!idData.idFrontImage) {
      setError(t('Vui lòng upload ảnh mặt trước CCCD', 'Please upload the front side of your ID card'));
      return;
    }
    setError('');
    setLoading(true);
    setLoadingMsg(t('Đang đọc thông tin CCCD…', 'Reading ID card information…'));
    try {
      const result = await ocrCCCD(idData.idFrontImage, idData.idBackImage);
      if (!result.success) throw new Error(result.errorMsg || 'OCR thất bại');
      setIdData(prev => ({
        ...prev,
        ocrResult:    result.object,
        ocrConfirmed: false,
        frontHash:    result.front_hash || null,  // lưu hash để dùng lại
      }));
    } catch (err) {
      setError(err.message || t('OCR thất bại. Vui lòng thử lại.', 'OCR failed. Please try again.'));
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  // Step 1: gọi Face Verify API → update DynamoDB nếu VERIFIED
  const runFaceVerify = async () => {
    if (!faceData.facePhoto) {
      setError(t('Vui lòng chụp ảnh selfie trước', 'Please capture a selfie first'));
      return;
    }
    setError('');
    setLoading(true);
    setLoadingMsg(t('Đang xác minh khuôn mặt…', 'Verifying face…'));
    try {
      const result = await verifyFace(
        faceData.facePhoto,
        idData.idFrontImage,
        idData.frontHash  // tái dùng hash từ bước OCR
      );
      setFaceData(prev => ({ ...prev, verifyResult: result }));

      if (result.kycStatus === 'VERIFIED') {
        markComplete(1);
        setTimeout(() => {
          markComplete(0);
          setCurrentStep(2); // màn hình hoàn tất
        }, 2500);
      }
    } catch (err) {
      setError(err.message || t('Xác minh khuôn mặt thất bại.', 'Face verification failed.'));
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  // ─── Navigation ───────────────────────────────────────────────────────────────
  const handleNext = () => {
    setError('');

    // Step 0 — CCCD
    if (currentStep === 0) {
      if (!idData.ocrResult) {
        setError(t('Vui lòng upload ảnh CCCD và nhấn "Đọc thông tin"', 'Please upload ID images and click "Read Info"'));
        return;
      }
      if (!idData.ocrConfirmed) {
        setError(t('Vui lòng xác nhận thông tin CCCD bên dưới', 'Please confirm the ID information below'));
        return;
      }
      markComplete(0);
      setCurrentStep(1);
      return;
    }

    // Step 1 — Face
    if (currentStep === 1) {
      runFaceVerify();
      return;
    }
  };

  const handleBack = () => {
    setError('');
    stopCamera();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/candidate/profile');
    }
  };

  // ─── Completion screen ────────────────────────────────────────────────────────
  if (currentStep === 2) {
    return (
      <DashboardLayout role="candidate">
        <VerificationContainer>
          <CompletionCard initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="success-icon"><CheckCircle /></div>
            <h2>{t('🎉 Xác Minh eKYC Hoàn Tất!', '🎉 eKYC Verification Complete!')}</h2>
            <p>{t(
              'Danh tính của bạn đã được xác minh thành công qua VNPT eKYC. Tài khoản đã được cập nhật, bạn có thể bắt đầu ứng tuyển.',
              'Your identity has been successfully verified via VNPT eKYC. Your account is now verified and you can start applying for jobs.'
            )}</p>
            <Button onClick={() => navigate('/candidate/profile')}>
              {t('Về Hồ Sơ', 'Go to Profile')}
            </Button>
          </CompletionCard>
        </VerificationContainer>
      </DashboardLayout>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout role="candidate">
      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <LoadingOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader size={52} className="spinner" />
            <p>{loadingMsg}</p>
          </LoadingOverlay>
        )}
      </AnimatePresence>

      <VerificationContainer>
        <Header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="header-icon"><Shield /></div>
          <h1>{t('Xác Minh eKYC', 'eKYC Verification')}</h1>
          <p>{t(
            'Hoàn tất 4 bước để xác minh danh tính và bắt đầu ứng tuyển công việc',
            'Complete 4 steps to verify your identity and start applying for jobs'
          )}</p>
        </Header>

        {/* Stepper */}
        <StepperContainer>
          <ProgressLine
            initial={{ width: 0 }}
            animate={{ width: `${getProgress()}%` }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
          {steps.map((step, index) => (
            <Step
              key={step.id}
              $active={currentStep === index}
              $completed={completedSteps.includes(index)}
              $clickable={completedSteps.includes(index)}
              onClick={() => completedSteps.includes(index) && setCurrentStep(index)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={completedSteps.includes(index) ? { scale: 1.05 } : {}}
            >
              <motion.div
                className="step-circle"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.2, type: 'spring' }}
              >
                {completedSteps.includes(index) ? <CheckCircle size={24} /> : <span>{index + 1}</span>}
              </motion.div>
              <div className="step-label">{step.label}</div>
            </Step>
          ))}
        </StepperContainer>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: '#fee2e2', border: '2px solid #ef444450', borderRadius: 12,
                padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center',
                gap: 10, color: '#b91c1c', fontSize: 14, fontWeight: 600,
              }}
            >
              <XCircle size={18} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* ── Step 0: OCR CCCD ── */}
          {currentStep === 0 && (
            <FormCard key="step0"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
            >
              <FormTitle>
                <div className="icon"><CreditCard /></div>
                <h2>{t('Xác Minh CCCD / CMND', 'ID Card Verification')}</h2>
              </FormTitle>

              <InfoBox initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <AlertCircle />
                <div className="info-content">
                  <p><strong>{t('Lưu ý:', 'Note:')}</strong></p>
                  <p>{t('• Chụp rõ nét cả 2 mặt CCCD, không bị mờ, lóa, che khuất', '• Capture both sides clearly, without blur or obstruction')}</p>
                  <p>{t('• Định dạng: JPG, PNG (tối đa 10MB mỗi ảnh)', '• Format: JPG, PNG (max 10MB each)')}</p>
                  <p>{t('• Ảnh sẽ được nén và không lưu trữ công khai (Nghị định 13/2023)', '• Images are compressed and not stored publicly (Decree 13/2023)')}</p>
                </div>
              </InfoBox>

              <FormGrid>
                {/* Front image */}
                <FormGroup>
                  <Label>{t('Ảnh mặt trước CCCD', 'ID Front Image')} *</Label>
                  <FileUploadArea $hasFile={!!idData.idFrontImage}
                    onClick={() => document.getElementById('idFrontFile').click()}>
                    <Upload className="upload-icon" />
                    <div className="upload-text">
                      {idData.idFrontImage
                        ? t('✓ Đã tải ảnh mặt trước', '✓ Front image uploaded')
                        : t('Nhấn để chọn ảnh mặt trước', 'Click to upload front image')}
                    </div>
                    <div className="upload-hint">JPG, PNG (max 10MB)</div>
                    {idData.idFrontImage && <img src={idData.idFrontImage} alt="ID Front" />}
                    <input id="idFrontFile" type="file" accept="image/*"
                      onChange={e => handleFileUpload('idFrontImage', e.target.files[0])} />
                  </FileUploadArea>
                </FormGroup>

                {/* Back image */}
                <FormGroup>
                  <Label>{t('Ảnh mặt sau CCCD', 'ID Back Image')}</Label>
                  <FileUploadArea $hasFile={!!idData.idBackImage}
                    onClick={() => document.getElementById('idBackFile').click()}>
                    <Upload className="upload-icon" />
                    <div className="upload-text">
                      {idData.idBackImage
                        ? t('✓ Đã tải ảnh mặt sau', '✓ Back image uploaded')
                        : t('Nhấn để chọn ảnh mặt sau (tuỳ chọn)', 'Click to upload back image (optional)')}
                    </div>
                    <div className="upload-hint">JPG, PNG (max 10MB)</div>
                    {idData.idBackImage && <img src={idData.idBackImage} alt="ID Back" />}
                    <input id="idBackFile" type="file" accept="image/*"
                      onChange={e => handleFileUpload('idBackImage', e.target.files[0])} />
                  </FileUploadArea>
                </FormGroup>
              </FormGrid>

              {/* Nút Đọc thông tin */}
              {!idData.ocrResult && (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <Button $variant="primary" onClick={runOcr} disabled={!idData.idFrontImage || loading}>
                    <Eye size={18} />
                    {loading ? t('Đang đọc…', 'Reading…') : t('Đọc thông tin CCCD', 'Read ID Card Info')}
                  </Button>
                </div>
              )}

              {/* OCR result */}
              <AnimatePresence>
                {idData.ocrResult && (
                  <OcrResultCard
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }}
                  >
                    <div className="ocr-title"><CheckCircle size={16} />{t('Thông tin đọc từ CCCD', 'ID Card Information')}</div>
                    <div className="ocr-grid">
                      <div className="ocr-field"><span className="ocr-label">{t('Số CCCD', 'ID Number')}</span><span className="ocr-value">{idData.ocrResult.id}</span></div>
                      <div className="ocr-field"><span className="ocr-label">{t('Ngày sinh', 'Date of Birth')}</span><span className="ocr-value">{idData.ocrResult.dob}</span></div>
                      <div className="ocr-field ocr-full"><span className="ocr-label">{t('Họ tên', 'Full Name')}</span><span className="ocr-value">{idData.ocrResult.name}</span></div>
                      <div className="ocr-field"><span className="ocr-label">{t('Giới tính', 'Sex')}</span><span className="ocr-value">{idData.ocrResult.sex}</span></div>
                      <div className="ocr-field"><span className="ocr-label">{t('Quốc tịch', 'Nationality')}</span><span className="ocr-value">{idData.ocrResult.nationality}</span></div>
                      <div className="ocr-field ocr-full"><span className="ocr-label">{t('Nguyên quán', 'Hometown')}</span><span className="ocr-value">{idData.ocrResult.home}</span></div>
                      <div className="ocr-field ocr-full"><span className="ocr-label">{t('Địa chỉ thường trú', 'Permanent Address')}</span><span className="ocr-value">{idData.ocrResult.address}</span></div>
                      <div className="ocr-field"><span className="ocr-label">{t('Ngày cấp', 'Issue Date')}</span><span className="ocr-value">{idData.ocrResult.issue_date}</span></div>
                      <div className="ocr-field"><span className="ocr-label">{t('Nơi cấp', 'Issue Place')}</span><span className="ocr-value">{idData.ocrResult.issue_place}</span></div>
                    </div>

                    {/* Confirm / Re-scan */}
                    <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {!idData.ocrConfirmed ? (
                        <Button $variant="primary" onClick={() => { setIdData(p => ({ ...p, ocrConfirmed: true })); setError(''); }}>
                          <CheckCircle size={16} />{t('Thông tin đúng, xác nhận', 'Confirm — info is correct')}
                        </Button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 700, fontSize: 14 }}>
                          <CheckCircle size={18} />{t('Đã xác nhận thông tin', 'Information confirmed')}
                        </div>
                      )}
                      <Button $variant="secondary" onClick={() => setIdData(p => ({ ...p, ocrResult: null, ocrConfirmed: false }))}>
                        <RefreshCw size={16} />{t('Quét lại', 'Re-scan')}
                      </Button>
                    </div>
                  </OcrResultCard>
                )}
              </AnimatePresence>

              <ButtonGroup>
                <Button $variant="secondary" onClick={handleBack}><ArrowLeft size={18} />{t('Quay lại', 'Back')}</Button>
                <Button $variant="primary" onClick={handleNext} disabled={!idData.ocrConfirmed}>
                  {t('Tiếp theo', 'Next')}<ArrowRight size={18} />
                </Button>
              </ButtonGroup>
            </FormCard>
          )}

          {/* ── Step 1: Face Verification ── */}
          {currentStep === 1 && (
            <FormCard key="step1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
            >
              <FormTitle>
                <div className="icon"><Camera /></div>
                <h2>{t('Xác Minh Khuôn Mặt', 'Face Verification')}</h2>
              </FormTitle>

              <InfoBox initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <AlertCircle />
                <div className="info-content">
                  <p><strong>{t('Hướng dẫn:', 'Instructions:')}</strong></p>
                  <p>{t('• Đảm bảo ánh sáng đầy đủ, khuôn mặt rõ ràng', '• Ensure good lighting and clear face visibility')}</p>
                  <p>{t('• Nhìn thẳng vào camera, không đeo kính râm hoặc khẩu trang', '• Look directly at camera, no sunglasses or mask')}</p>
                  <p>{t('• Khuôn mặt sẽ được so sánh với ảnh trên CCCD (similarity ≥ 85%)', '• Face compared with ID card photo (similarity ≥ 85%)')}</p>
                </div>
              </InfoBox>

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                {!faceData.facePhoto ? (
                  <>
                    <VideoWrapper>
                      <video ref={videoRef} autoPlay playsInline muted />
                    </VideoWrapper>
                    <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Button $variant="secondary" onClick={startCamera}>
                        <Camera size={18} />{t('Bật Camera', 'Start Camera')}
                      </Button>
                      <Button $variant="primary" onClick={capturePhoto}>
                        <CheckCircle size={18} />{t('Chụp Ảnh', 'Capture Photo')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <VideoWrapper>
                      <img src={faceData.facePhoto} alt={t('Ảnh selfie', 'Selfie')} />
                    </VideoWrapper>
                    <div style={{ marginTop: 16 }}>
                      <Button $variant="secondary"
                        onClick={() => { setFaceData({ facePhoto: null, verifyResult: null }); setError(''); }}>
                        <Camera size={18} />{t('Chụp lại', 'Retake')}
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Face verify result */}
              <AnimatePresence>
                {faceData.verifyResult && (
                  <FaceResultCard
                    $success={faceData.verifyResult.kycStatus === 'VERIFIED'}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                  >
                    {faceData.verifyResult.kycStatus === 'VERIFIED' ? (
                      <>
                        <div className="result-icon"><CheckCircle size={48} color="#10b981" /></div>
                        <h3>{t('✅ Xác minh thành công!', '✅ Verification Successful!')}</h3>
                        <p>{t(
                          `Độ tương đồng: ${faceData.verifyResult.object?.similarity?.toFixed(1)}% — Đang chuyển trang…`,
                          `Similarity: ${faceData.verifyResult.object?.similarity?.toFixed(1)}% — Redirecting…`
                        )}</p>
                        <div className="similarity-bar-wrap">
                          <div className="similarity-bar" style={{ width: `${faceData.verifyResult.object?.similarity || 0}%` }} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="result-icon"><XCircle size={48} color="#ef4444" /></div>
                        <h3>{t('❌ Xác minh thất bại', '❌ Verification Failed')}</h3>
                        <p>{t(
                          `Độ tương đồng: ${faceData.verifyResult.object?.similarity?.toFixed(1)}% (cần ≥ 85%). Vui lòng chụp lại.`,
                          `Similarity: ${faceData.verifyResult.object?.similarity?.toFixed(1)}% (need ≥ 85%). Please retake.`
                        )}</p>
                        <div className="similarity-bar-wrap">
                          <div className="similarity-bar" style={{ width: `${faceData.verifyResult.object?.similarity || 0}%` }} />
                        </div>
                      </>
                    )}
                  </FaceResultCard>
                )}
              </AnimatePresence>

              <ButtonGroup>
                <Button $variant="secondary" onClick={handleBack} disabled={loading}>
                  <ArrowLeft size={18} />{t('Quay lại', 'Back')}
                </Button>
                <Button $variant="primary" onClick={handleNext}
                  disabled={!faceData.facePhoto || loading || faceData.verifyResult?.kycStatus === 'VERIFIED'}>
                  <Shield size={18} />
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
