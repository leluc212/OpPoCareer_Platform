import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

/* ── Keyframes ── */
const gradShift = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const floatY = keyframes`
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-8px); }
`;
const pulse = keyframes`
  0%,100% { box-shadow: 0 0 0 0 rgba(14,57,149,0.3); }
  50%      { box-shadow: 0 0 0 12px rgba(14,57,149,0); }
`;

/* ── Styled ── */
const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(7, 25, 92, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const Modal = styled(motion.div)`
  background: #fff;
  border-radius: 28px;
  padding: 0;
  width: 100%;
  max-width: 900px;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 4px 6px rgba(0,0,0,0.04),
    0 20px 48px rgba(14,57,149,0.18),
    0 48px 80px rgba(14,57,149,0.12);
`;

const TopBanner = styled.div`
  background: linear-gradient(135deg, #07195c 0%, #0E3995 50%, #2563eb 100%);
  background-size: 200% 200%;
  animation: ${gradShift} 6s ease infinite;
  padding: 36px 36px 32px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
    background-size: 24px 24px;
  }
`;

const IllustrationWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  animation: ${floatY} 3s ease-in-out infinite;
  position: relative;
  z-index: 1;
`;

const EmojiCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  border: 2px solid rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38px;
  animation: ${pulse} 2.5s ease-in-out infinite;
`;

const BannerTitle = styled.h2`
  font-size: 28px;
  font-weight: 900;
  color: #fff;
  text-align: center;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
  position: relative;
  z-index: 1;
`;

const BannerSub = styled.p`
  font-size: 16px;
  color: rgba(255,255,255,0.72);
  text-align: center;
  line-height: 1.6;
  position: relative;
  z-index: 1;
`;

const Body = styled.div`
  padding: 28px 32px 32px;
`;

const BenefitList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
`;

const BenefitText = styled.div`
  flex: 1;
  .title {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2px;
  }
  .desc {
    font-size: 14px;
    color: #94a3b8;
    line-height: 1.5;
  }
`;

const BtnPrimary = styled(motion.button)`
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #07195c 0%, #0E3995 55%, #2563eb 100%);
  background-size: 200%;
  animation: ${gradShift} 5s ease infinite;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.2px;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.25s;
  flex: 1;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
    pointer-events: none;
  }
  &:hover { box-shadow: 0 8px 28px rgba(14,57,149,0.42); }
`;

const BtnSkip = styled.button`
  flex: 1;
  height: 52px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: transparent;
  color: #94a3b8;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.2s, color 0.2s;

  &:hover {
    border-color: #cbd5e1;
    color: #64748b;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.2s;
  line-height: 1;

  &:hover { background: rgba(255,255,255,0.25); }
`;

/* ── Config theo role ── */
const getConfig = (language) => ({
  candidate: {
    emoji: '👤',
    title: language === 'vi' ? 'Hoàn thiện hồ sơ ứng viên!' : 'Complete your candidate profile!',
    subtitle: language === 'vi'
      ? 'Hồ sơ đầy đủ giúp bạn được nhà tuyển dụng chú ý và tìm việc nhanh hơn.'
      : 'A complete profile helps employers notice you and find jobs faster.',
    profilePath: '/candidate/profile',
    benefits: [
      {
        icon: '🎯', bg: '#eff6ff',
        title: language === 'vi' ? 'Được gợi ý việc làm phù hợp' : 'Get matched job suggestions',
        desc: language === 'vi'
          ? 'AI sẽ gợi ý việc làm dựa trên kỹ năng và kinh nghiệm của bạn'
          : 'AI will suggest jobs based on your skills and experience',
      },
      {
        icon: '⚡', bg: '#fefce8',
        title: language === 'vi' ? 'Ứng tuyển nhanh hơn' : 'Apply faster',
        desc: language === 'vi'
          ? 'Nhà tuyển dụng xem hồ sơ và liên hệ trực tiếp với bạn'
          : 'Employers view your profile and contact you directly',
      },
      {
        icon: '📄', bg: '#f0fdf4',
        title: language === 'vi' ? 'Nổi bật trước nhà tuyển dụng' : 'Stand out to employers',
        desc: language === 'vi'
          ? 'Hồ sơ đầy đủ giúp bạn dễ được chú ý hơn'
          : 'A complete profile makes you easier to notice',
      },
    ],
    btnLabel: language === 'vi' ? 'Hoàn thiện hồ sơ ngay' : 'Complete profile now',
    skipLabel: language === 'vi' ? 'Bỏ qua, tôi sẽ làm sau' : 'Skip, I\'ll do it later',
  },
  employer: {
    emoji: '🏢',
    title: language === 'vi' ? 'Thiết lập hồ sơ công ty!' : 'Set up your company profile!',
    subtitle: language === 'vi'
      ? 'Hồ sơ công ty đầy đủ giúp ứng viên tin tưởng và dễ dàng tìm thấy bạn hơn.'
      : 'A complete company profile builds trust with candidates and makes you easier to find.',
    profilePath: '/employer/profile',
    benefits: [
      {
        icon: '🔍', bg: '#eff6ff',
        title: language === 'vi' ? 'Ứng viên tìm thấy dễ dàng hơn' : 'Candidates find you more easily',
        desc: language === 'vi'
          ? 'Hồ sơ đầy đủ giúp bạn nổi bật trong danh sách nhà tuyển dụng'
          : 'A complete profile helps you stand out in the employer list',
      },
      {
        icon: '💼', bg: '#fefce8',
        title: language === 'vi' ? 'Đăng tin tuyển dụng hiệu quả' : 'Post jobs effectively',
        desc: language === 'vi'
          ? 'Tên và logo công ty rõ ràng tạo ấn tượng tốt với ứng viên'
          : 'A clear company name and logo make a good impression on candidates',
      },
      {
        icon: '✅', bg: '#f0fdf4',
        title: language === 'vi' ? 'Tăng độ uy tín' : 'Build credibility',
        desc: language === 'vi'
          ? 'Xác minh thông tin công ty để được ứng viên tin tưởng hơn'
          : 'Verify your company information to gain more trust from candidates',
      },
    ],
    btnLabel: language === 'vi' ? 'Thiết lập hồ sơ công ty' : 'Set up company profile',
    skipLabel: language === 'vi' ? 'Bỏ qua, tôi sẽ làm sau' : 'Skip, I\'ll do it later',
  },
});

/**
 * ProfileSetupPrompt
 * Hiển thị modal lần đầu đăng nhập để nhắc user điền hồ sơ.
 * Dùng localStorage key `profilePrompted_<userId>` để chỉ hiện 1 lần.
 *
 * Props:
 *   role: 'candidate' | 'employer'
 *   userId: string (email hoặc sub)
 *   profileName: string (Tên hoặc tên công ty)
 *   profilePhone: string (Số điện thoại)
 */
const ProfileSetupPrompt = ({ role, userId, profileName, profilePhone }) => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const cfg = getConfig(language)[role];

  useEffect(() => {
    if (!userId || !cfg) return;

    // Xem thông tin đã đủ chưa (chỉ cần Tên và Số Điện Thoại)
    const nameStr = profileName || '';
    const phoneStr = profilePhone || '';
    const hasEnoughInfo = nameStr.trim().length > 0 && phoneStr.trim().length > 0;

    console.log('[ProfileSetupPrompt] Check:', { userId, role, nameStr, phoneStr, hasEnoughInfo });

    // Nếu ĐÃ đủ thông tin => không bao giờ hiện modal nữa
    if (hasEnoughInfo) {
      setShow(false);
      return;
    }

    // NẾU CHƯA ĐỦ THÔNG TIN:
    // Kiểm tra xem trong phiên làm việc hiện tại (sessionStorage) user đã bấm "Bỏ qua" hay chưa
    const key = `profilePrompted_${role}_${userId}`;
    const alreadySkippedThisSession = sessionStorage.getItem(key);

    console.log('[ProfileSetupPrompt] skipped this session?', alreadySkippedThisSession);

    if (!alreadySkippedThisSession) {
      // Hiện modal lên liền sau khi web vùa render xong giao diện
      const t = setTimeout(() => setShow(true), 200);
      return () => clearTimeout(t);
    }
  }, [userId, role, profileName, profilePhone, cfg]);

  const dismiss = () => {
    // Chỉ lưu vào sessionStorage thay vì localStorage
    // Nghĩa là: nếu tắt web mở lại thì bắt buộc sẽ bị nhắc tiêp
    const key = `profilePrompted_${role}_${userId}`;
    sessionStorage.setItem(key, '1');
    setShow(false);
  };

  const goProfile = () => {
    dismiss();
    navigate(cfg.profilePath);
  };

  if (!cfg) return null;

  return (
    <AnimatePresence>
      {show && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={dismiss}
        >
          <Modal
            initial={{ opacity: 0, scale: 0.88, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top banner */}
            <TopBanner>
              <CloseBtn onClick={dismiss}>✕</CloseBtn>
              <IllustrationWrap>
                <EmojiCircle>{cfg.emoji}</EmojiCircle>
              </IllustrationWrap>
              <BannerTitle>{cfg.title}</BannerTitle>
              <BannerSub>{cfg.subtitle}</BannerSub>
            </TopBanner>

            {/* Body */}
            <Body>
              <BenefitList>
                {cfg.benefits.map((b, i) => (
                  <BenefitItem key={i}>
                    <BenefitText>
                      <div className="title">{b.title}</div>
                      <div className="desc">{b.desc}</div>
                    </BenefitText>
                  </BenefitItem>
                ))}
              </BenefitList>

              <ButtonRow>
                <BtnSkip onClick={dismiss}>
                  {cfg.skipLabel}
                </BtnSkip>

                <BtnPrimary
                  onClick={goProfile}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {cfg.btnLabel}
                </BtnPrimary>
              </ButtonRow>
            </Body>
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default ProfileSetupPrompt;
