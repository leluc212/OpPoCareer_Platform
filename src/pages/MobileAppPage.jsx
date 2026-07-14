import React from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { Star, Download, Smartphone, Zap, Shield, Users, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { s3Images } from '../utils/s3Images';

const float = keyframes`
  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-14px)}
`;

const Wrapper = styled.div`
  min-height: 100vh;
  background: ${p => p.$isDark ? '#0f172a' : '#f8fafc'};
  font-family: 'Inter','Be Vietnam Pro',sans-serif;
`;

/* ── Header ── */
const Header = styled.header`
  background: linear-gradient(135deg,#1a62ff 0%,#002e9d 100%);
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(26,98,255,0.25);
`;
const HeaderLogo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
`;
const HeaderBack = styled(Link)`
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255,255,255,0.75);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
  &:hover { color: #fff; }
`;

/* ── Hero ── */
const Hero = styled.section`
  background: linear-gradient(135deg,#1a62ff 0%,#002e9d 100%);
  padding: 64px 32px 100px;
  text-align: center;
  position: relative;
  overflow: hidden;
  &::before {
    content:'';
    position:absolute;
    top:-80px;right:-80px;
    width:340px;height:340px;
    border-radius:50%;
    background:rgba(255,255,255,0.06);
  }
  &::after {
    content:'';
    position:absolute;
    bottom:-100px;left:-60px;
    width:280px;height:280px;
    border-radius:50%;
    background:rgba(255,255,255,0.04);
  }
`;
const HeroBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255,255,255,0.2);
  backdrop-filter: blur(8px);
`;
const HeroTitle = styled(motion.h1)`
  font-size: clamp(2rem,5vw,3.2rem);
  font-weight: 900;
  color: #fff;
  line-height: 1.15;
  max-width: 640px;
  margin: 0 auto 16px;
  letter-spacing: -0.5px;
  position: relative; z-index: 1;
`;
const HeroSub = styled(motion.p)`
  font-size: 1.05rem;
  color: rgba(255,255,255,0.78);
  max-width: 500px;
  margin: 0 auto 40px;
  line-height: 1.7;
  position: relative; z-index: 1;
`;
const StoreRow = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  position: relative; z-index: 1;
`;
const StoreBtn = styled.a`
  display: block;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); border-radius: 10px; }
  img { width: 150px; height: auto; object-fit: contain; border-radius: 10px; }
`;
const QRBox = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;
const QRLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: #1a62ff;
`;

/* ── Stats strip ── */
const StatsStrip = styled.div`
  background: linear-gradient(135deg,#1e40af,#1a62ff);
  padding: 20px 32px;
  display: flex;
  justify-content: center;
  gap: 48px;
  flex-wrap: wrap;
`;
const StripStat = styled.div`
  text-align: center;
  color: #fff;
`;
const StripValue = styled.div`
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.5px;
`;
const StripLabel = styled.div`
  font-size: 0.75rem;
  opacity: 0.75;
  margin-top: 2px;
`;

/* ── Features ── */
const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px;
`;
const SectionWrap = styled.section`
  padding: 64px 0;
`;
const SectionBadge = styled.span`
  display: inline-block;
  background: linear-gradient(135deg,#eff6ff,#dbeafe);
  color: #1a62ff;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: 20px;
  margin-bottom: 12px;
`;
const SectionTitle = styled.h2`
  font-size: clamp(1.4rem,3vw,2rem);
  font-weight: 900;
  color: ${p => p.$isDark ? '#f1f5f9' : '#0f172a'};
  margin-bottom: 10px;
  letter-spacing: -0.3px;
`;
const SectionDesc = styled.p`
  font-size: 0.95rem;
  color: ${p => p.$isDark ? '#94a3b8' : '#475569'};
  line-height: 1.8;
  max-width: 650px;
  margin-bottom: 40px;
`;
const FeatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 20px;
  @media(max-width:600px){ grid-template-columns:1fr; }
`;
const FeatCard = styled(motion.div)`
  background: ${p => p.$isDark ? 'rgba(30,41,59,0.9)' : '#fff'};
  border: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.3)' : '#e2e8f0'};
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
`;
const FeatIcon = styled.div`
  width: 48px; height: 48px;
  border-radius: 14px;
  background: ${p => p.$bg};
  color: ${p => p.$color};
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
`;
const FeatTitle = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: ${p => p.$isDark ? '#f1f5f9' : '#0f172a'};
  margin-bottom: 6px;
`;
const FeatDesc = styled.p`
  font-size: 0.85rem;
  color: ${p => p.$isDark ? '#94a3b8' : '#64748b'};
  line-height: 1.7;
`;

/* ── How-to ── */
const HowGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 24px;
  @media(max-width:680px){ grid-template-columns:1fr; }
`;
const StepCard = styled(motion.div)`
  text-align: center;
  padding: 28px 20px;
  background: ${p => p.$isDark ? 'rgba(30,41,59,0.9)' : '#fff'};
  border: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.3)' : '#e2e8f0'};
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
`;
const StepNum = styled.div`
  width: 44px; height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg,#1a62ff,#2563eb);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
`;
const StepTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${p => p.$isDark ? '#f1f5f9' : '#0f172a'};
  margin-bottom: 6px;
`;
const StepDesc = styled.p`
  font-size: 0.82rem;
  color: ${p => p.$isDark ? '#94a3b8' : '#64748b'};
  line-height: 1.7;
`;

/* ── CTA ── */
const CTASection = styled.section`
  background: linear-gradient(135deg,#1a62ff 0%,#002e9d 100%);
  padding: 64px 32px;
  text-align: center;
`;
const CTATitle = styled.h2`
  font-size: clamp(1.4rem,3vw,2.2rem);
  font-weight: 900;
  color: #fff;
  margin-bottom: 12px;
`;
const CTADesc = styled.p`
  font-size: 0.95rem;
  color: rgba(255,255,255,0.8);
  margin-bottom: 32px;
`;

/* ── Component ── */
const MobileAppPage = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const vi = language === 'vi';

  const features = [
    {
      icon: <Zap size={22}/>, bg: 'linear-gradient(135deg,#fef9c3,#fef08a)', color: '#ca8a04',
      title: vi ? 'Tìm việc ngay lập tức' : 'Find Jobs Instantly',
      desc: vi ? 'Nhận thông báo ngay khi có việc phù hợp. Ứng tuyển chỉ trong vài giây.' : 'Get notified instantly when matching jobs appear. Apply in seconds.',
    },
    {
      icon: <Shield size={22}/>, bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', color: '#16a34a',
      title: vi ? 'Hồ sơ được xác thực' : 'Verified Profiles',
      desc: vi ? 'Mọi ứng viên & doanh nghiệp đều qua quy trình xác thực CCCD & pháp lý.' : 'All candidates & businesses go through ID & legal verification.',
    },
    {
      icon: <Users size={22}/>, bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', color: '#1a62ff',
      title: vi ? 'Quản lý ứng tuyển' : 'Application Tracking',
      desc: vi ? 'Theo dõi trạng thái ứng tuyển, lịch phỏng vấn và nhận phản hồi trực tiếp.' : 'Track your application status, interviews, and receive direct feedback.',
    },
    {
      icon: <Smartphone size={22}/>, bg: 'linear-gradient(135deg,#fdf4ff,#ede9fe)', color: '#7c3aed',
      title: vi ? 'Giao diện thân thiện' : 'User-Friendly UI',
      desc: vi ? 'Thiết kế trực quan, dễ dùng. Tìm và nộp hồ sơ chỉ với vài thao tác.' : 'Intuitive design, easy to use. Find and apply with just a few taps.',
    },
  ];

  const steps = vi
    ? [
        { title: 'Tải ứng dụng', desc: 'Quét QR hoặc tải trên CH Play / App Store miễn phí.' },
        { title: 'Tạo hồ sơ', desc: 'Điền thông tin, xác thực CCCD để được ưu tiên trong kết quả tìm kiếm.' },
        { title: 'Kết nối & làm việc', desc: 'Ứng tuyển, nhận lời mời và bắt đầu công việc ngay hôm nay.' },
      ]
    : [
        { title: 'Download the app', desc: 'Scan QR or download on CH Play / App Store for free.' },
        { title: 'Create your profile', desc: 'Fill in your info and verify your ID to be prioritized in search results.' },
        { title: 'Connect & work', desc: 'Apply, receive offers, and start working today.' },
      ];

  return (
    <Wrapper $isDark={isDarkMode}>
      {/* Header */}
      <Header>
        <HeaderLogo to="/">
          <img src={s3Images.system.logo} alt="Ốp Pờ" style={{ height: 40, objectFit: 'contain' }} />
        </HeaderLogo>
      </Header>

      {/* Hero */}
      <Hero>
        <HeroBadge><Download size={13}/> {vi ? 'Tải Miễn Phí' : 'Free Download'}</HeroBadge>
        <HeroTitle
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {vi ? 'Ứng dụng Ốp Pờ\ntrên điện thoại' : 'Op Po App\non Your Phone'}
        </HeroTitle>
        <HeroSub
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {vi
            ? 'Tìm việc F&B nhanh nhất, kết nối với nhà tuyển dụng uy tín, quản lý hồ sơ và ứng tuyển ngay trên di động.'
            : 'Find F&B jobs fastest, connect with trusted employers, manage your profile, and apply directly from your phone.'}
        </HeroSub>
        <StoreRow
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <StoreBtn href="https://play.google.com" target="_blank" rel="noopener noreferrer">
            <img src={s3Images.system.chplay} alt="Google Play" />
          </StoreBtn>
          <StoreBtn href="https://apps.apple.com" target="_blank" rel="noopener noreferrer">
            <img src={s3Images.system.appstore} alt="App Store" />
          </StoreBtn>
          <QRBox>
            <svg viewBox="0 0 100 100" fill="none" width="80" height="80">
              <rect width="100" height="100" fill="white"/>
              <rect x="10" y="10" width="15" height="15" fill="black"/>
              <rect x="30" y="10" width="5" height="5" fill="black"/>
              <rect x="40" y="10" width="5" height="5" fill="black"/>
              <rect x="50" y="10" width="5" height="5" fill="black"/>
              <rect x="60" y="10" width="5" height="5" fill="black"/>
              <rect x="75" y="10" width="15" height="15" fill="black"/>
              <rect x="10" y="30" width="5" height="5" fill="black"/>
              <rect x="20" y="30" width="5" height="5" fill="black"/>
              <rect x="30" y="30" width="10" height="10" fill="black"/>
              <rect x="45" y="30" width="5" height="5" fill="black"/>
              <rect x="55" y="30" width="10" height="10" fill="black"/>
              <rect x="70" y="30" width="5" height="5" fill="black"/>
              <rect x="85" y="30" width="5" height="5" fill="black"/>
              <rect x="10" y="50" width="5" height="5" fill="black"/>
              <rect x="35" y="50" width="5" height="5" fill="black"/>
              <rect x="45" y="50" width="10" height="10" fill="black"/>
              <rect x="75" y="50" width="5" height="5" fill="black"/>
              <rect x="30" y="60" width="5" height="5" fill="black"/>
              <rect x="10" y="75" width="15" height="15" fill="black"/>
              <rect x="30" y="75" width="5" height="5" fill="black"/>
              <rect x="40" y="75" width="5" height="5" fill="black"/>
              <rect x="75" y="75" width="15" height="15" fill="black"/>
            </svg>
            <QRLabel>{vi ? 'Quét QR tải app' : 'Scan QR'}</QRLabel>
          </QRBox>
        </StoreRow>
      </Hero>

      {/* Stats strip */}
      <StatsStrip>
        {[
          { value: '5,000+', label: vi ? 'Ứng viên' : 'Candidates' },
          { value: '200+', label: vi ? 'Doanh nghiệp' : 'Companies' },
          { value: '4.8★', label: vi ? 'Đánh giá' : 'Rating' },
          { value: '24h', label: vi ? 'Tuyển gấp' : 'Urgent hiring' },
        ].map((s, i) => (
          <StripStat key={i}>
            <StripValue>{s.value}</StripValue>
            <StripLabel>{s.label}</StripLabel>
          </StripStat>
        ))}
      </StatsStrip>

      {/* Features */}
      <Container>
        <SectionWrap>
          <SectionBadge>{vi ? 'Tính năng nổi bật' : 'Key Features'}</SectionBadge>
          <SectionTitle $isDark={isDarkMode}>{vi ? 'Mọi thứ bạn cần trong một ứng dụng' : 'Everything you need in one app'}</SectionTitle>
          <SectionDesc $isDark={isDarkMode}>
            {vi
              ? 'Ốp Pờ cung cấp đầy đủ công cụ để ứng viên tìm việc và nhà tuyển dụng kết nối nhân sự F&B hiệu quả.'
              : 'Op Po provides all the tools for candidates to find jobs and employers to connect with F&B staff effectively.'}
          </SectionDesc>
          <FeatGrid>
            {features.map((f, i) => (
              <FeatCard
                key={i}
                $isDark={isDarkMode}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <FeatIcon $bg={f.bg} $color={f.color}>{f.icon}</FeatIcon>
                <FeatTitle $isDark={isDarkMode}>{f.title}</FeatTitle>
                <FeatDesc $isDark={isDarkMode}>{f.desc}</FeatDesc>
              </FeatCard>
            ))}
          </FeatGrid>
        </SectionWrap>

        {/* How to */}
        <SectionWrap style={{ borderTop: `1px solid ${isDarkMode ? 'rgba(75,85,99,0.25)' : '#e2e8f0'}` }}>
          <SectionBadge>{vi ? 'Cách bắt đầu' : 'How to Start'}</SectionBadge>
          <SectionTitle $isDark={isDarkMode}>{vi ? 'Chỉ 3 bước đơn giản' : 'Just 3 Simple Steps'}</SectionTitle>
          <SectionDesc $isDark={isDarkMode}>
            {vi ? 'Bắt đầu tìm việc F&B ngay hôm nay.' : 'Start finding F&B jobs today.'}
          </SectionDesc>
          <HowGrid>
            {steps.map((s, i) => (
              <StepCard
                key={i}
                $isDark={isDarkMode}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <StepNum>{i + 1}</StepNum>
                <StepTitle $isDark={isDarkMode}>{s.title}</StepTitle>
                <StepDesc $isDark={isDarkMode}>{s.desc}</StepDesc>
              </StepCard>
            ))}
          </HowGrid>
        </SectionWrap>
      </Container>

      {/* CTA */}
      <CTASection>
        <CTATitle>{vi ? 'Tải ngay — Hoàn toàn miễn phí' : 'Download Now — Completely Free'}</CTATitle>
        <CTADesc>
          {vi ? 'Hàng ngàn việc làm F&B đang chờ bạn.' : 'Thousands of F&B jobs are waiting for you.'}
        </CTADesc>
        <StoreRow initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <StoreBtn href="https://play.google.com" target="_blank" rel="noopener noreferrer">
            <img src={s3Images.system.chplay} alt="Google Play" />
          </StoreBtn>
          <StoreBtn href="https://apps.apple.com" target="_blank" rel="noopener noreferrer">
            <img src={s3Images.system.appstore} alt="App Store" />
          </StoreBtn>
        </StoreRow>
      </CTASection>
    </Wrapper>
  );
};

export default MobileAppPage;
