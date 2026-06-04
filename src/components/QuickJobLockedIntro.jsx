/**
 * QuickJobLockedIntro.jsx
 * Hiện khi candidate chưa verified vào tab "Công việc Tuyển gấp"
 * Design match chính xác trang HRManagement employer
 */
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Shield, Wallet, UsersRound, CheckCircle,
  TrendingUp, AlertCircle, Clock, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ─── Animations ───────────────────────────────────────────
const floatY = keyframes`0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}`;

// ─── Wrapper ──────────────────────────────────────────────
const Wrap = styled(motion.div)`
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  padding: 0 4px 48px;
  font-family: inherit;
`;

// ─── Hero ──────────────────────────────────────────────────
const Hero = styled.div`
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 55%, #2563eb 100%);
  border-radius: 18px;
  padding: 36px 40px 40px;
  margin-bottom: 36px;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -70px; right: -70px;
    width: 260px; height: 260px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    pointer-events: none;
  }
  &::after {
    content: '';
    position: absolute;
    bottom: -50px; left: 22%;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
    pointer-events: none;
  }
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 100px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
  svg { width: 12px; height: 12px; }
`;

const HeroTitle = styled.h1`
  font-size: 32px;
  font-weight: 900;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
  line-height: 1.15;
  position: relative;
  z-index: 1;
`;

const HeroDesc = styled.p`
  font-size: 14px;
  opacity: 0.88;
  line-height: 1.75;
  max-width: 520px;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
`;

const HeroBtn = styled.button`
  padding: 12px 28px;
  background: white;
  color: #1e40af;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
  svg { width: 15px; height: 15px; }
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
`;

const PendingTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  position: relative;
  z-index: 1;
  svg { width: 15px; height: 15px; }
`;

// ─── Section ──────────────────────────────────────────────
const SectionLabel = styled.div`
  margin-bottom: 20px;
  h2 {
    font-size: 19px;
    font-weight: 800;
    color: ${p => p.theme.colors.text};
    margin-bottom: 4px;
    letter-spacing: -0.3px;
  }
  p {
    font-size: 13px;
    color: ${p => p.theme.colors.textLight};
  }
`;

// ─── 3-col feature cards ───────────────────────────────────
const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 40px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled(motion.div)`
  background: ${p => p.theme.colors.bgLight};
  border: 1.5px solid ${p => p.theme.colors.border};
  border-radius: 16px;
  padding: 24px 22px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 28px rgba(30,64,175,0.1);
    border-color: #BFDBFE;
  }
`;

const CardIconWrap = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: ${p => p.$bg};
  border: 1.5px solid ${p => p.$border};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  animation: ${floatY} ${p => p.$dur || '4s'} ease-in-out infinite;
  svg { width: 22px; height: 22px; color: ${p => p.$color}; }
`;

const CardTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  margin-bottom: 8px;
`;

const CardText = styled.div`
  font-size: 13px;
  color: ${p => p.theme.colors.textLight};
  line-height: 1.65;
`;

// ─── Steps 4-col ──────────────────────────────────────────
const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 40px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StepCard = styled(motion.div)`
  background: ${p => p.theme.colors.bgLight};
  border: 1.5px solid ${p => p.theme.colors.border};
  border-radius: 14px;
  padding: 20px 16px 18px;
`;

const StepNum = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #1e40af;
  color: white;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
`;

const StepTitle = styled.div`
  font-size: 13.5px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  margin-bottom: 6px;
`;

const StepDesc = styled.div`
  font-size: 12px;
  color: ${p => p.theme.colors.textLight};
  line-height: 1.6;
`;

// ─── FAQ ──────────────────────────────────────────────────
const FaqWrap = styled.div`
  background: ${p => p.theme.colors.bgLight};
  border: 1.5px solid ${p => p.theme.colors.border};
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
`;

const FaqRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid ${p => p.theme.colors.border};

  &:last-child { border-bottom: none; }

  svg {
    width: 18px;
    height: 18px;
    color: #1e40af;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .q {
    font-size: 14px;
    font-weight: 700;
    color: ${p => p.theme.colors.text};
    margin-bottom: 5px;
  }
  .a {
    font-size: 13px;
    color: ${p => p.theme.colors.textLight};
    line-height: 1.65;
  }
`;

// ─── CTA bottom ───────────────────────────────────────────
const CtaBox = styled(motion.div)`
  border-top: 3px solid;
  border-image: linear-gradient(90deg, #1e40af, #10b981) 1;
  background: ${p => p.theme.colors.bgLight};
  border-radius: 0 0 16px 16px;
  padding: 36px 32px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);

  h3 {
    font-size: 18px;
    font-weight: 800;
    color: ${p => p.theme.colors.text};
    margin-bottom: 8px;
  }
  p {
    font-size: 13px;
    color: ${p => p.theme.colors.textLight};
    line-height: 1.65;
    margin-bottom: 22px;
    max-width: 460px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const CtaBtn = styled.button`
  padding: 14px 32px;
  background: #1e40af;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 6px 20px rgba(30,64,175,0.3);
  transition: all 0.2s ease;
  svg { width: 16px; height: 16px; }
  &:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 10px 28px rgba(30,64,175,0.38); }
`;

// ─── Component ────────────────────────────────────────────
const QuickJobLockedIntro = ({ verifStatus }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const vi = language === 'vi';
  const submitted = verifStatus === 'SUBMITTED';

  const t = (v, e) => vi ? v : e;

  const features = [
    {
      icon: Zap,
      color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', dur: '4s',
      title: t('Nổi bật & Đẩy tin', 'Highlighted & Boosted'),
      text: t(
        'Bài đăng của bạn sẽ có biểu tượng "Tuyển gấp" nổi bật và hiển thị ở vị trí ưu tiên trên trang chủ của ứng viên.',
        'Your posts will feature a prominent "Urgent" badge displayed at the top of the candidate feed.'
      ),
    },
    {
      icon: UsersRound,
      color: '#16a34a', bg: '#dcfce7', border: '#86efac', dur: '4.5s',
      title: t('Tiếp cận Real-time', 'Real-time Matching'),
      text: t(
        'Hệ thống tự động gửi thông báo đẩy (push) đến điện thoại của ứng viên phù hợp trong phạm vi lân cận ngay khi tạo tin.',
        'The system instantly sends push notifications to nearby matching candidates as soon as a job is posted.'
      ),
    },
    {
      icon: Wallet,
      color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', dur: '3.8s',
      title: t('Ký quỹ an toàn', 'Secure Escrow'),
      text: t(
        'Lương được giữ an toàn qua tài khoản ký quỹ (Escrow) và tự động giải ngân cho ứng viên ngay sau khi hoàn thành công việc.',
        'Funds are securely held in escrow and automatically released to the worker once the shift is completed.'
      ),
    },
  ];

  const steps = [
    {
      title: t('Gửi yêu cầu kích hoạt', 'Request Activation'),
      desc: t('Đăng ký sử dụng tính năng và chờ hệ thống kiểm duyệt hồ sơ doanh nghiệp của bạn.', 'Submit an activation request and wait for the system to verify your profile.'),
    },
    {
      title: t('Ký quỹ tin đăng', 'Escrow Shift Pay'),
      desc: t('Nạp tiền lương tương ứng vào ví điện tử Ốp Pờ. Hệ thống sẽ ký quỹ để đảm bảo quyền lợi ứng viên.', 'Deposit the shift salary into your Op Po wallet. The system holds it in escrow to protect candidates.'),
    },
    {
      title: t('Chat Real-time', 'Real-time Chat'),
      desc: t('Ứng viên sẽ nhận việc tức thì. Bạn có thể chat realtime để trao đổi và hướng dẫn công việc.', 'Candidates accept instantly. Chat in real-time to coordinate the shift details.'),
    },
    {
      title: t('Xác nhận & Thanh toán', 'Complete & Pay'),
      desc: t('Xác nhận công việc hoàn thành. Hệ thống sẽ tự động chuyển khoản từ tài khoản ký quỹ vào ví của ứng viên.', 'Confirm job completion. The system auto-releases escrowed funds to the worker\'s wallet.'),
    },
  ];

  const faqs = [
    {
      icon: AlertCircle,
      q: t('Mức lương sàn tuyển gấp là bao nhiêu?', 'What is the minimum hourly rate?'),
      a: t(
        'Để đảm bảo thu hút ứng viên trong thời gian ngắn, lương của Công việc tuyển gấp phải cao hơn mức lương tối thiểu vùng.',
        'To attract workers quickly, the urgent hourly wage must be higher than the regional minimum wage.'
      ),
    },
    {
      icon: TrendingUp,
      q: t('Phí hoa hồng dịch vụ là bao nhiêu?', 'What is the service fee?'),
      a: t(
        'Hệ thống thu phí dịch vụ 15% tính trên tổng lương ca làm việc khi bài đăng được hoàn thành thành công.',
        'The system charges a 15% commission fee based on the total shift salary upon successful completion.'
      ),
    },
    {
      icon: CheckCircle,
      q: t('Chính sách hoàn tiền ký quỹ ra sao?', 'What is the refund policy?'),
      a: t(
        'Nếu ca làm việc không diễn ra hoặc chưa có ứng viên phù hợp (sau lần Yêu cầu thay đổi ứng viên đầu tiên) chúng tôi sẽ giữ 15% phí sàn, 85% số tiền đã ký quỹ sẽ được hoàn trả lại ví của bạn.',
        'If the shift does not proceed or no suitable candidate is found (after the first replacement request), we retain 15% as a platform fee and refund 85% to your wallet.'
      ),
    },
  ];

  return (
    <Wrap
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Hero ── */}
      <Hero>
        <Badge><Zap />{t('TÍNH NĂNG ĐẶC BIỆT', 'PREMIUM FEATURE')}</Badge>
        <HeroTitle>{t('Dịch vụ tuyển gấp', 'Quick Job Service')}</HeroTitle>
        <HeroDesc>
          {t(
            'Giải pháp tuyển dụng tức thì tối ưu. Tìm kiếm nhân sự chất lượng cao và lấp đầy ca làm trống chỉ trong vài giờ thay vì nhiều ngày.',
            'The ultimate real-time hiring solution. Match with high-quality workers and fill empty shifts within hours instead of days.'
          )}
        </HeroDesc>
        {submitted ? (
          <PendingTag>
            <Clock />{t('Yêu cầu xác minh đang chờ admin duyệt...', 'Verification request pending admin review...')}
          </PendingTag>
        ) : null}
      </Hero>

      {/* ── Feature cards ── */}
      <SectionLabel>
        <h2>{t('Công việc tuyển gấp là gì?', 'What is a quick job?')}</h2>
        <p>{t('Các ưu điểm vượt trội của tính năng tuyển gấp', 'Key benefits of the quick job feature')}</p>
      </SectionLabel>

      <CardsGrid>
        {features.map((f, i) => (
          <FeatureCard
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 + 0.1 }}
          >
            <CardIconWrap $bg={f.bg} $border={f.border} $color={f.color} $dur={f.dur}>
              <f.icon />
            </CardIconWrap>
            <CardTitle>{f.title}</CardTitle>
            <CardText>{f.text}</CardText>
          </FeatureCard>
        ))}
      </CardsGrid>

      {/* ── Steps ── */}
      <SectionLabel>
        <h2>{t('Cách thức hoạt động', 'How it works')}</h2>
        <p>{t('Quy trình tuyển dụng tinh gọn và nhanh chóng qua 4 bước', 'A streamlined 4-step process')}</p>
      </SectionLabel>

      <StepsGrid>
        {steps.map((s, i) => (
          <StepCard
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 + 0.15 }}
          >
            <StepNum>{i + 1}</StepNum>
            <StepTitle>{s.title}</StepTitle>
            <StepDesc>{s.desc}</StepDesc>
          </StepCard>
        ))}
      </StepsGrid>

      {/* ── FAQ ── */}
      <SectionLabel>
        <h2>{t('Các thông tin quan trọng', 'Important details')}</h2>
        <p>{t('Quy định và chính sách hoạt động của công việc tuyển gấp', 'Urgent jobs policies and terms')}</p>
      </SectionLabel>

      <FaqWrap>
        {faqs.map((f, i) => (
          <FaqRow key={i}>
            <f.icon />
            <div>
              <div className="q">{f.q}</div>
              <div className="a">{f.a}</div>
            </div>
          </FaqRow>
        ))}
      </FaqWrap>

      {/* ── CTA ── */}
      <CtaBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3>{t('Bắt đầu sử dụng Công việc tuyển gấp', 'Start using Quick Jobs')}</h3>
        <p>
          {t(
            'Kích hoạt tính năng ngay hôm nay để lấp đầy ca làm việc của bạn trong lịch trình bận rộn.',
            'Activate the feature today and fill your schedule with extra earning opportunities.'
          )}
        </p>
        {submitted ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 10, color: '#92400e', fontSize: 13, fontWeight: 700 }}>
            <Clock size={16} />{t('Đang chờ admin xét duyệt...', 'Waiting for admin review...')}
          </div>
        ) : (
          <CtaBtn onClick={() => navigate('/candidate/kyc')}>
            <Shield />
            {t('Gửi yêu cầu kích hoạt Công việc tuyển gấp', 'Submit Quick Job activation request')}
          </CtaBtn>
        )}
      </CtaBox>
    </Wrap>
  );
};

export default QuickJobLockedIntro;
