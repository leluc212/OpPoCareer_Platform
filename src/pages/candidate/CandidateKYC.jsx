/**
 * CandidateKYC.jsx — Xác minh eKYC qua Didit
 *
 * Luồng Didit (khác VNPT):
 *   1. Nhấn "Bắt đầu xác minh" → gọi POST /ekyc/session → nhận redirect_url
 *   2. Redirect user đến trang Didit (verification.didit.me)
 *   3. Didit gửi webhook về POST /ekyc/webhook/didit khi hoàn tất
 *   4. User quay về app, app poll /ekyc/status/{userId} để kiểm tra kết quả
 *
 * [VNPT_LEGACY] Code luồng cũ VNPT (upload ảnh 2 bước) đã được comment lại
 * trong CandidateKYC.VNPT_LEGACY.jsx để rollback nếu cần.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/FormElements';
import {
  CheckCircle, Shield, Loader, ExternalLink, RefreshCw,
  AlertCircle, Clock, XCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { createVerificationSession, getKycStatus } from '../../services/ekycService';
import { useAuth } from '../../context/AuthContext';

// ─── Animations ───────────────────────────────────────────────────────────────
const spin   = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const float  = keyframes`0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); }`;
const bounce = keyframes`0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); }`;

// ─── Styled Components ────────────────────────────────────────────────────────
const Container = styled.div`
  width: 100%;
  max-width: min(640px, 100%);
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
  h1 { font-size: clamp(20px,3.5vw,28px); font-weight: 800; margin-bottom: 8px;
       color: ${p => p.theme.colors.text}; letter-spacing: -0.5px; }
  p  { font-size: clamp(13px,1.5vw,15px); color: ${p => p.theme.colors.textLight};
       max-width: 480px; margin: 0 auto; line-height: 1.6; }
`;

const Card = styled(motion.div)`
  background: ${p => p.theme.colors.bgLight};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: clamp(14px,2vw,22px);
  padding: clamp(24px,4vw,40px);
  box-shadow: 0 6px 28px rgba(0,0,0,.07);
  position: relative; overflow: hidden;
  &::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0;
    height: 4px; background: ${p => p.theme.colors.primary};
  }
`;

const StatusCard = styled(Card)`
  &::before { background: ${p => p.$color || p.theme.colors.primary}; }
`;

const StepList = styled.ul`
  list-style: none; padding: 0; margin: 0 0 28px;
  li {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 10px 0; border-bottom: 1px solid ${p => p.theme.colors.borderLight};
    &:last-child { border-bottom: none; }
    .num {
      min-width: 26px; height: 26px; border-radius: 50%;
      background: ${p => p.theme.colors.primary}; color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 800; flex-shrink: 0;
    }
    .text {
      font-size: 14px; color: ${p => p.theme.colors.text}; line-height: 1.5;
      padding-top: 3px;
    }
  }
`;

const InfoBox = styled.div`
  background: ${p => p.theme.colors.primary}08;
  border: 2px solid ${p => p.theme.colors.primary}30;
  border-left: 5px solid ${p => p.theme.colors.primary};
  padding: 12px 16px;
  border-radius: 12px; margin-bottom: 24px;
  display: flex; gap: 10px;
  svg { width: 18px; height: 18px; color: ${p => p.theme.colors.primary}; flex-shrink: 0; margin-top: 1px; }
  p { font-size: 13px; color: ${p => p.theme.colors.text}; line-height: 1.6; margin: 0; }
`;

const PollStatus = styled.div`
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 16px; background: ${p => p.theme.colors.bgDark};
  border-radius: 12px; margin: 20px 0; font-size: 14px;
  color: ${p => p.theme.colors.textLight};
  .spin { animation: ${spin} 1s linear infinite; }
`;

const CompletionCard = styled(motion.div)`
  background: ${p => p.theme.colors.success};
  border-radius: clamp(16px,2.5vw,24px);
  padding: clamp(40px,7vw,60px) clamp(20px,5vw,48px);
  text-align: center; color: white;
  box-shadow: 0 16px 48px rgba(16,185,129,.28);
  .success-icon {
    width: clamp(60px,8vw,84px); height: clamp(60px,8vw,84px);
    margin: 0 auto clamp(18px,3vw,26px); background: rgba(255,255,255,.2);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 12px 32px rgba(0,0,0,.15);
    animation: ${bounce} 2s ease-in-out infinite;
    svg { width: 48px; height: 48px; }
  }
  h2 { font-size: clamp(20px,3.5vw,28px); font-weight: 900; margin-bottom: 12px; }
  p  { font-size: clamp(13px,1.5vw,15px); opacity: .94; margin-bottom: clamp(22px,4vw,28px);
       line-height: 1.7; }
  button { background: white; color: ${p => p.theme.colors.success}; font-weight: 800;
    padding: 12px 32px; border-radius: 12px; font-size: 15px; cursor: pointer;
    box-shadow: 0 6px 20px rgba(0,0,0,.14);
    transition: all .3s ease; &:hover { transform: translateY(-3px); } }
`;

const LoadingOverlay = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0,0,0,.55);
  backdrop-filter: blur(4px); display: flex; flex-direction: column;
  align-items: center; justify-content: center; z-index: 9999; gap: 20px;
  .spinner { animation: ${spin} .9s linear infinite; color: white; }
  p { color: white; font-size: 16px; font-weight: 600; }
`;

// ─── Poll interval (ms) ───────────────────────────────────────────────────────
const POLL_INTERVAL_MS  = 5000;  // kiểm tra mỗi 5 giây
const POLL_MAX_ATTEMPTS = 60;    // tối đa 5 phút

// ─── Component ────────────────────────────────────────────────────────────────
const CandidateKYC = () => {
  const { language }      = useLanguage();
  const navigate          = useNavigate();
  const [searchParams]    = useSearchParams();
  const { user }          = useAuth();
  const pollRef           = useRef(null);
  const pollCountRef      = useRef(0);

  const [phase, setPhase]         = useState('idle');   // idle | creating | redirect | polling | done | failed
  const [loading, setLoading]     = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError]         = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [pollCount, setPollCount] = useState(0);

  const t = (vi, en) => language === 'vi' ? vi : en;

  // ─── Kiểm tra trạng thái KYC khi load trang ──────────────────────────────
  useEffect(() => {
    if (!user?.userId) { setLoading(false); return; }

    const check = async () => {
      try {
        setLoadingMsg(t('Đang kiểm tra trạng thái xác thực…', 'Checking verification status…'));
        const res = await getKycStatus(user.userId);
        if (res?.kycCompleted || res?.kycStatus === 'VERIFIED') {
          setPhase('done');
        } else {
          // Kiểm tra xem user vừa quay về từ Didit chưa (có ?status=completed trong URL)
          const urlStatus = searchParams.get('status');
          if (urlStatus === 'completed' || urlStatus === 'approved') {
            // Bắt đầu poll để chờ webhook update DynamoDB
            setPhase('polling');
            startPolling();
          }
        }
      } catch (err) {
        console.error('[CandidateKYC] Lỗi kiểm tra KYC status:', err);
      } finally {
        setLoading(false);
        setLoadingMsg('');
      }
    };

    check();
    return () => stopPolling();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Polling sau khi user quay về từ Didit ────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollRef.current) return; // đã đang poll
    pollCountRef.current = 0;

    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      setPollCount(c => c + 1);

      if (pollCountRef.current > POLL_MAX_ATTEMPTS) {
        stopPolling();
        setError(t(
          'Chưa nhận được kết quả xác minh. Vui lòng kiểm tra lại sau vài phút.',
          'Verification result not received yet. Please check again in a few minutes.'
        ));
        setPhase('idle');
        return;
      }

      try {
        const res = await getKycStatus(user.userId);
        if (res?.kycCompleted || res?.kycStatus === 'VERIFIED') {
          stopPolling();
          setPhase('done');
        } else if (res?.kycStatus === 'FAILED') {
          stopPolling();
          setPhase('failed');
          setError(t(
            'Xác minh không thành công. Vui lòng thử lại.',
            'Verification failed. Please try again.'
          ));
        }
      } catch (e) {
        console.error('[CandidateKYC] Poll error:', e);
      }
    }, POLL_INTERVAL_MS);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ─── Tạo session Didit và redirect ───────────────────────────────────────
  const handleStartVerification = async () => {
    if (!user?.userId) {
      setError(t('Cần đăng nhập để xác minh', 'Please log in first'));
      return;
    }
    setError('');
    setPhase('creating');
    setLoading(true);
    setLoadingMsg(t('Đang tạo phiên xác minh…', 'Creating verification session…'));

    try {
      // callbackUrl: trang user quay về sau khi hoàn tất trên Didit
      const callbackUrl = `${window.location.origin}/candidate/kyc?status=completed`;
      const result      = await createVerificationSession(callbackUrl);

      if (!result.success || !result.redirect_url) {
        throw new Error(result.errorMsg || t('Không lấy được link xác minh', 'Could not get verification link'));
      }

      setRedirectUrl(result.redirect_url);
      setPhase('redirect');
    } catch (err) {
      setError(err.message || t('Lỗi tạo phiên xác minh. Vui lòng thử lại.', 'Error creating session. Please try again.'));
      setPhase('idle');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const handleRedirectToDidit = () => {
    if (redirectUrl) {
      setPhase('polling');
      startPolling();
      // Mở trong tab mới để user quay về app dễ hơn
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleManualCheck = async () => {
    if (!user?.userId) return;
    setLoading(true);
    setLoadingMsg(t('Đang kiểm tra kết quả…', 'Checking result…'));
    try {
      const res = await getKycStatus(user.userId);
      if (res?.kycCompleted || res?.kycStatus === 'VERIFIED') {
        stopPolling();
        setPhase('done');
      } else if (res?.kycStatus === 'FAILED') {
        stopPolling();
        setPhase('failed');
        setError(t('Xác minh không thành công. Vui lòng thử lại.', 'Verification failed. Please try again.'));
      } else {
        setError(t(
          'Chưa có kết quả. Didit cần vài phút để xử lý. Vui lòng thử lại sau.',
          'No result yet. Didit needs a few minutes. Please try again shortly.'
        ));
      }
    } catch (e) {
      setError(e.message || t('Lỗi kiểm tra. Vui lòng thử lại.', 'Check error. Please try again.'));
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  // ─── Done screen ──────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <DashboardLayout role="candidate">
        <Container>
          <CompletionCard
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="success-icon"><CheckCircle /></div>
            <h2>{t('🎉 Xác Minh Danh Tính Hoàn Tất!', '🎉 Identity Verification Complete!')}</h2>
            <p>{t(
              'Danh tính của bạn đã được xác minh thành công qua Didit. Tài khoản đã được cập nhật, bạn có thể bắt đầu ứng tuyển.',
              'Your identity has been verified successfully via Didit. Your account is updated and you can start applying.'
            )}</p>
            <button onClick={() => navigate('/candidate/profile')}>
              {t('Về Hồ Sơ', 'Go to Profile')}
            </button>
          </CompletionCard>
        </Container>
      </DashboardLayout>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
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

      <Container>
        <Header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="header-icon"><Shield /></div>
          <h1>{t('Xác Minh Danh Tính', 'Identity Verification')}</h1>
          <p>{t(
            'Xác minh CCCD để bắt đầu ứng tuyển việc làm trên OpPo',
            'Verify your ID to start applying for jobs on OpPo'
          )}</p>
        </Header>

        {/* Thông báo lỗi */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                background: '#fee2e2', border: '2px solid #ef444450', borderRadius: 12,
                padding: '12px 18px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 10,
                color: '#b91c1c', fontSize: 14, fontWeight: 600,
              }}
            >
              <XCircle size={18} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ Giai đoạn IDLE: giới thiệu và bắt đầu ══ */}
        {(phase === 'idle' || phase === 'failed') && (
          <Card
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <InfoBox>
              <AlertCircle />
              <p>{t(
                'Quy trình xác minh được thực hiện qua nền tảng Didit — đảm bảo an toàn và bảo mật. Bạn sẽ được chuyển đến trang Didit để hoàn tất xác minh CCCD và nhận diện khuôn mặt.',
                'The verification process is handled by Didit — a secure identity verification platform. You will be redirected to Didit to complete ID and face verification.'
              )}</p>
            </InfoBox>

            <StepList>
              <li>
                <div className="num">1</div>
                <div className="text">{t('Nhấn "Bắt đầu xác minh" — hệ thống tạo phiên xác minh bảo mật', 'Click "Start Verification" — system creates a secure session')}</div>
              </li>
              <li>
                <div className="num">2</div>
                <div className="text">{t('Bạn sẽ được chuyển đến trang Didit để chụp CCCD và selfie', 'You will be redirected to Didit to capture your ID and selfie')}</div>
              </li>
              <li>
                <div className="num">3</div>
                <div className="text">{t('Quay lại Ốp Pờ — kết quả xác minh sẽ được cập nhật tự động', 'Return to Op Po — verification result will be updated automatically')}</div>
              </li>
            </StepList>

            <Button
              $variant="primary"
              onClick={handleStartVerification}
              disabled={loading}
              style={{ width: '100%', minHeight: 50, fontSize: 16, fontWeight: 700 }}
            >
              <Shield size={18} style={{ marginRight: 8 }} />
              {t('Bắt Đầu Xác Minh Danh Tính', 'Start Identity Verification')}
            </Button>
          </Card>
        )}

        {/* ══ Giai đoạn REDIRECT: chờ user nhấn nút ══ */}
        {phase === 'redirect' && (
          <StatusCard
            $color="#1e40af"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#EFF6FF', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ExternalLink size={28} color="#1e40af" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                {t('Phiên xác minh đã sẵn sàng', 'Verification session ready')}
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                {t(
                  'Nhấn nút bên dưới để mở trang xác minh Didit trong tab mới. Sau khi hoàn tất, quay lại trang này.',
                  'Click the button below to open the Didit verification page in a new tab. Come back here after completion.'
                )}
              </p>
            </div>

            <Button
              $variant="primary"
              onClick={handleRedirectToDidit}
              style={{ width: '100%', minHeight: 50, fontSize: 15, fontWeight: 700, marginBottom: 12 }}
            >
              <ExternalLink size={18} style={{ marginRight: 8 }} />
              {t('Mở Trang Xác Minh Didit', 'Open Didit Verification Page')}
            </Button>

            <button
              onClick={() => { setPhase('idle'); setRedirectUrl(''); }}
              style={{
                width: '100%', padding: '10px', background: 'none',
                border: '2px solid #e2e8f0', borderRadius: 10,
                fontSize: 13, color: '#64748b', cursor: 'pointer', fontWeight: 600,
              }}
            >
              {t('Huỷ', 'Cancel')}
            </button>
          </StatusCard>
        )}

        {/* ══ Giai đoạn POLLING: chờ kết quả webhook ══ */}
        {phase === 'polling' && (
          <StatusCard
            $color="#f59e0b"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#fef3c7', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Clock size={28} color="#d97706" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                {t('Đang chờ kết quả xác minh', 'Waiting for verification result')}
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                {t(
                  'Nếu bạn đã hoàn tất xác minh trên Didit, hệ thống sẽ tự động cập nhật trong vài phút.',
                  'If you have completed verification on Didit, the system will auto-update in a few minutes.'
                )}
              </p>
            </div>

            <PollStatus>
              <RefreshCw size={18} className="spin" />
              {t(
                `Đang kiểm tra kết quả… (${pollCount}/${POLL_MAX_ATTEMPTS})`,
                `Checking result… (${pollCount}/${POLL_MAX_ATTEMPTS})`
              )}
            </PollStatus>

            <Button
              $variant="secondary"
              onClick={handleManualCheck}
              disabled={loading}
              style={{ width: '100%', marginBottom: 10 }}
            >
              <RefreshCw size={16} style={{ marginRight: 6 }} />
              {t('Kiểm tra ngay', 'Check now')}
            </Button>

            {redirectUrl && (
              <button
                onClick={() => window.open(redirectUrl, '_blank', 'noopener,noreferrer')}
                style={{
                  width: '100%', padding: '10px', background: 'none',
                  border: '2px solid #e2e8f0', borderRadius: 10,
                  fontSize: 13, color: '#64748b', cursor: 'pointer', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <ExternalLink size={14} />
                {t('Mở lại trang Didit', 'Reopen Didit page')}
              </button>
            )}
          </StatusCard>
        )}

      </Container>
    </DashboardLayout>
  );
};

export default CandidateKYC;
