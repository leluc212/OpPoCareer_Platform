import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { s3Images } from '../utils/s3Images';
import { Users, Briefcase, Building2, Star, Phone, Mail, MapPin, Facebook, Send, TrendingUp, Award, Zap, Shield, Music } from 'lucide-react';

/* ─── Animations ─── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}`;

/* ─── Layout ─── */
const Wrapper = styled.div`
  min-height: 100vh;
  background: ${p => p.$isDark ? '#0f172a' : '#f8fafc'};
  color: ${p => p.$isDark ? '#e2e8f0' : '#1e293b'};
  font-family: 'Inter', 'Be Vietnam Pro', sans-serif;
`;

/* ─── NavBar ─── */
const Nav = styled.nav`
  background: linear-gradient(135deg, #1a62ff 0%, #002e9d 100%);
  padding: 0 32px;
  display: flex;
  align-items: center;
  gap: 32px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;
const NavItem = styled.button`
  background: none;
  border: none;
  color: ${p => p.$active ? '#fff' : 'rgba(255,255,255,0.6)'};
  font-size: 0.875rem;
  font-weight: ${p => p.$active ? 700 : 500};
  padding: 16px 4px;
  border-bottom: 2px solid ${p => p.$active ? '#fff' : 'transparent'};
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
  &:hover { color: #fff; }
`;

/* ─── Hero ─── */
const HeroSection = styled.section`
  background: linear-gradient(135deg, #1a62ff 0%, #002e9d 100%);
  padding: 64px 32px 80px;
  text-align: center;
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
  }
  &::after {
    content: '';
    position: absolute;
    bottom: -80px; left: -80px;
    width: 350px; height: 350px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
  }
`;
const HeroLogo = styled.div`
  display: flex; align-items: center; justify-content: center;
  gap: 12px; margin-bottom: 24px;
`;
const HeroTitle = styled.h1`
  font-size: clamp(1.6rem, 4vw, 2.6rem);
  font-weight: 900;
  color: #fff;
  max-width: 700px;
  margin: 0 auto 16px;
  line-height: 1.25;
  letter-spacing: -0.5px;
  position: relative; z-index: 1;
`;
const HeroSub = styled.p`
  font-size: 1rem;
  color: rgba(255,255,255,0.78);
  max-width: 560px;
  margin: 0 auto;
  line-height: 1.7;
  position: relative; z-index: 1;
`;

/* ─── Section commons ─── */
const Section = styled.section`
  max-width: 960px;
  margin: 0 auto;
  padding: 64px 24px;
`;
const SectionBadge = styled.span`
  display: inline-block;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #1a62ff;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: 20px;
  margin-bottom: 14px;
`;
const SectionTitle = styled.h2`
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 900;
  color: ${p => p.$isDark ? '#f1f5f9' : '#0f172a'};
  margin-bottom: 12px;
  letter-spacing: -0.3px;
`;
const SectionDesc = styled.p`
  font-size: 0.95rem;
  color: ${p => p.$isDark ? '#94a3b8' : '#475569'};
  line-height: 1.8;
  max-width: 700px;
`;

/* ─── About Section ─── */
const AboutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  @media(max-width:680px){ grid-template-columns:1fr; }
`;
const AboutImageBox = styled.div`
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  padding: 32px;
  display: flex; align-items: center; justify-content: center;
  min-height: 260px;
  box-shadow: 0 12px 40px rgba(26,98,255,0.12);
`;
const AboutFeatList = styled.ul`
  list-style: none;
  padding: 0; margin: 20px 0 0;
  display: flex; flex-direction: column; gap: 12px;
`;
const AboutFeatItem = styled.li`
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 0.9rem;
  color: ${p => p.$isDark ? '#cbd5e1' : '#334155'};
  line-height: 1.6;
`;
const FeatDot = styled.span`
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #1a62ff;
  margin-top: 6px;
  flex-shrink: 0;
`;

/* ─── Stats Section ─── */
const StatsBg = styled.div`
  background: ${p => p.$isDark ? 'rgba(30,41,59,0.6)' : '#eff6ff'};
  border-top: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.2)' : '#dbeafe'};
  border-bottom: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.2)' : '#dbeafe'};
`;
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  text-align: center;
  @media(max-width:680px){ grid-template-columns: repeat(2,1fr); }
`;
const StatCard = styled.div`
  padding: 32px 16px;
  animation: ${fadeUp} 0.5s ease both;
  animation-delay: ${p => p.$i * 0.1}s;
`;
const StatIcon = styled.div`
  width: 52px; height: 52px;
  border-radius: 14px;
  background: ${p => p.$bg};
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
  color: ${p => p.$color};
`;
const StatValue = styled.div`
  font-size: 2.2rem;
  font-weight: 900;
  color: ${p => p.$isDark ? '#f1f5f9' : '#0f172a'};
  letter-spacing: -1px;
  line-height: 1;
`;
const StatLabel = styled.div`
  font-size: 0.82rem;
  color: ${p => p.$isDark ? '#64748b' : '#64748b'};
  margin-top: 6px;
  font-weight: 500;
`;

/* ─── Timeline ─── */
const TimelineWrap = styled.div`
  position: relative;
  padding-left: 32px;
  &::before {
    content: '';
    position: absolute;
    left: 8px; top: 0; bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, #1a62ff, #60a5fa, transparent);
  }
`;
const TimelineItem = styled.div`
  position: relative;
  margin-bottom: 36px;
  animation: ${fadeUp} 0.5s ease both;
  animation-delay: ${p => p.$i * 0.1}s;
  &::before {
    content: '';
    position: absolute;
    left: -28px; top: 6px;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: #1a62ff;
    border: 3px solid ${p => p.$isDark ? '#0f172a' : '#f8fafc'};
    box-shadow: 0 0 0 3px rgba(26,98,255,0.2);
  }
`;
const TimelineYear = styled.span`
  display: inline-block;
  background: linear-gradient(135deg, #1a62ff, #2563eb);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 6px;
`;
const TimelineTitle = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: ${p => p.$isDark ? '#f1f5f9' : '#0f172a'};
  margin-bottom: 4px;
`;
const TimelineDesc = styled.p`
  font-size: 0.875rem;
  color: ${p => p.$isDark ? '#94a3b8' : '#475569'};
  line-height: 1.7;
`;

/* ─── Contact Section ─── */
const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media(max-width:600px){ grid-template-columns:1fr; }
`;
const ContactCard = styled.a`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: ${p => p.$isDark ? 'rgba(30,41,59,0.95)' : '#fff'};
  border: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.3)' : '#e2e8f0'};
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s, transform 0.2s;
  cursor: ${p => p.href ? 'pointer' : 'default'};
  &:hover {
    box-shadow: ${p => p.href ? '0 8px 32px rgba(26,98,255,0.15)' : undefined};
    transform: ${p => p.href ? 'translateY(-2px)' : 'none'};
  }
`;
const IconBox = styled.div`
  width: 46px; height: 46px;
  border-radius: 12px;
  background: ${p => p.$bg};
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: ${p => p.$color};
`;
const ContactLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${p => p.$isDark ? '#64748b' : '#94a3b8'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 3px;
`;
const ContactValue = styled.div`
  font-size: 0.92rem;
  font-weight: 700;
  color: ${p => p.$isDark ? '#e2e8f0' : '#1e293b'};
`;
const ContactNote = styled.div`
  font-size: 0.78rem;
  color: ${p => p.$isDark ? '#64748b' : '#94a3b8'};
  margin-top: 2px;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.25)' : '#e2e8f0'};
  margin: 0;
`;

/* ─── Component ─── */
const SECTIONS = ['intro', 'about', 'stats', 'timeline', 'contact'];
const LABELS_VI = ['Giới thiệu', 'Về chúng tôi', 'Những con số', 'Chặng đường phát triển', 'Liên hệ hợp tác'];
const LABELS_EN = ['Introduction', 'About Us', 'Numbers', 'Our Journey', 'Contact'];

const ContactPage = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const vi = language === 'vi';
  const [active, setActive] = useState('intro');

  const scrollTo = (id) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const stats = [
    { icon: <Users size={24} />, bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', color: '#1a62ff', value: '5,000+', label: vi ? 'Ứng viên đăng ký' : 'Registered Candidates' },
    { icon: <Building2 size={24} />, bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', color: '#16a34a', value: '200+', label: vi ? 'Doanh nghiệp đối tác' : 'Partner Companies' },
    { icon: <Briefcase size={24} />, bg: 'linear-gradient(135deg,#fff7ed,#fed7aa)', color: '#ea580c', value: '10K+', label: vi ? 'Việc làm đã đăng' : 'Jobs Posted' },
    { icon: <Star size={24} />, bg: 'linear-gradient(135deg,#fdf4ff,#ede9fe)', color: '#7c3aed', value: '4.8★', label: vi ? 'Đánh giá trung bình' : 'Average Rating' },
  ];

  const timeline = vi ? [
    { year: '2023', title: 'Thành lập Ốp Pờ', desc: 'Ra mắt nền tảng kết nối nhân sự F&B đầu tiên tại Việt Nam chuyên biệt cho ngành thực phẩm & đồ uống.' },
    { year: '2024', title: 'Mở rộng tính năng & đối tác', desc: 'Tích hợp AI gợi ý việc làm, xác thực doanh nghiệp và ra mắt tính năng tuyển gấp 24h. Onboard hơn 100 doanh nghiệp F&B.' },
    { year: '2025', title: 'Tăng trưởng mạnh mẽ', desc: 'Đạt 5,000+ ứng viên đăng ký, hơn 200 doanh nghiệp đối tác và được gia nhập chương trình Google for Startups.' },
    { year: '2026', title: 'Hướng tới nền tảng hàng đầu', desc: 'Phát triển ứng dụng di động, mở rộng ra các thành phố lớn và hướng tới vị trí nền tảng nhân sự F&B số 1 Việt Nam.' },
  ] : [
    { year: '2023', title: 'OpPo Founded', desc: 'Launched Vietnam\'s first F&B-specialized HR platform connecting businesses with skilled, verified part-time staff.' },
    { year: '2024', title: 'Feature & Partner Expansion', desc: 'Integrated AI job matching, business verification, and 24h urgent hiring. Onboarded 100+ F&B companies.' },
    { year: '2025', title: 'Strong Growth', desc: 'Reached 5,000+ candidates, 200+ partner companies, and joined the Google for Startups program.' },
    { year: '2026', title: 'Towards Market Leader', desc: 'Launching mobile app, expanding to major cities, aiming to be Vietnam\'s #1 F&B HR platform.' },
  ];

  return (
    <Wrapper $isDark={isDarkMode}>
      {/* Sticky Nav */}
      <Nav>
        {SECTIONS.map((s, i) => (
          <NavItem key={s} $active={active === s} onClick={() => scrollTo(s)}>
            {vi ? LABELS_VI[i] : LABELS_EN[i]}
          </NavItem>
        ))}
      </Nav>

      {/* 1. Hero / Intro */}
      <HeroSection id="intro">
        <HeroLogo>
          <img src={s3Images.system.logo} alt="Ốp Pờ" style={{ height: 56, objectFit: 'contain' }} />
        </HeroLogo>
        <HeroTitle>
          {vi ? 'Nền tảng F&B Tuyển dụng hàng đầu Việt Nam' : 'Vietnam\'s Leading F&B Recruitment Platform'}
        </HeroTitle>
        <HeroSub>
          {vi
            ? 'Ốp Pờ kết nối doanh nghiệp F&B với đội ngũ nhân sự bán thời gian đã được xác thực và có kỹ năng — nhanh chóng, an toàn, hiệu quả.'
            : 'OpPo connects F&B businesses with verified, skilled part-time staff — quickly, safely, and efficiently.'}
        </HeroSub>
      </HeroSection>

      {/* 2. About Us */}
      <Section id="about">
        <SectionBadge>{vi ? 'Về chúng tôi' : 'About Us'}</SectionBadge>
        <AboutGrid>
          <div>
            <SectionTitle $isDark={isDarkMode}>
              {vi ? 'Chúng tôi là ai?' : 'Who Are We?'}
            </SectionTitle>
            <SectionDesc $isDark={isDarkMode}>
              {vi
                ? 'Ốp Pờ là nền tảng công nghệ tuyển dụng chuyên biệt dành cho ngành F&B (Nhà hàng, Café, Khách sạn, Tiệc cưới...). Chúng tôi giải quyết bài toán nhân sự biến động — nơi thiếu hụt nhân viên có thể xảy ra bất kỳ lúc nào.'
                : 'OpPo is a recruitment technology platform specialized for the F&B industry (Restaurants, Cafes, Hotels, Events...). We solve the volatile staffing problem — where staff shortages can happen at any time.'}
            </SectionDesc>
            <AboutFeatList>
              {(vi ? [
                'Xác thực nhân sự 100% qua CCCD/hồ sơ pháp lý',
                'AI gợi ý ứng viên phù hợp theo vị trí & địa điểm',
                'Tuyển gấp 24h — lấp đầy vị trí trống ngay hôm nay',
                'Được bảo vệ bởi Google for Startups',
              ] : [
                '100% staff verified via national ID & legal documents',
                'AI-powered candidate matching by role & location',
                'Urgent hiring 24h — fill vacancies today',
                'Backed by Google for Startups',
              ]).map((f, i) => (
                <AboutFeatItem key={i} $isDark={isDarkMode}>
                  <FeatDot />
                  {f}
                </AboutFeatItem>
              ))}
            </AboutFeatList>
          </div>
          <AboutImageBox>
            <img
              src={s3Images.system.logo}
              alt="Ốp Pờ Platform"
              style={{ maxWidth: '180px', objectFit: 'contain', opacity: 0.9 }}
            />
          </AboutImageBox>
        </AboutGrid>
      </Section>

      <Divider $isDark={isDarkMode} />

      {/* 3. Stats */}
      <StatsBg $isDark={isDarkMode} id="stats">
        <Section style={{ padding: '48px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <SectionBadge>{vi ? 'Những con số' : 'Numbers'}</SectionBadge>
            <SectionTitle $isDark={isDarkMode} style={{ textAlign: 'center' }}>
              {vi ? 'Ốp Pờ trong những con số' : 'OpPo by the Numbers'}
            </SectionTitle>
          </div>
          <StatsGrid>
            {stats.map((s, i) => (
              <StatCard key={i} $i={i}>
                <StatIcon $bg={s.bg} $color={s.color}>{s.icon}</StatIcon>
                <StatValue $isDark={isDarkMode}>{s.value}</StatValue>
                <StatLabel $isDark={isDarkMode}>{s.label}</StatLabel>
              </StatCard>
            ))}
          </StatsGrid>
        </Section>
      </StatsBg>

      <Divider $isDark={isDarkMode} />

      {/* 4. Timeline */}
      <Section id="timeline">
        <SectionBadge>{vi ? 'Chặng đường phát triển' : 'Our Journey'}</SectionBadge>
        <SectionTitle $isDark={isDarkMode} style={{ marginBottom: 36 }}>
          {vi ? 'Hành trình xây dựng Ốp Pờ' : 'Building OpPo'}
        </SectionTitle>
        <TimelineWrap>
          {timeline.map((t, i) => (
            <TimelineItem key={i} $i={i} $isDark={isDarkMode}>
              <TimelineYear>{t.year}</TimelineYear>
              <TimelineTitle $isDark={isDarkMode}>{t.title}</TimelineTitle>
              <TimelineDesc $isDark={isDarkMode}>{t.desc}</TimelineDesc>
            </TimelineItem>
          ))}
        </TimelineWrap>
      </Section>

      <Divider $isDark={isDarkMode} />

      {/* 5. Contact */}
      <Section id="contact">
        <SectionBadge>{vi ? 'Liên hệ hợp tác' : 'Contact'}</SectionBadge>
        <SectionTitle $isDark={isDarkMode} style={{ marginBottom: 8 }}>
          {vi ? 'Liên hệ & Hợp tác' : 'Get in Touch'}
        </SectionTitle>
        <SectionDesc $isDark={isDarkMode} style={{ marginBottom: 28 }}>
          {vi
            ? 'Liên hệ với chúng tôi để hợp tác, tư vấn hoặc hỗ trợ kỹ thuật.'
            : 'Contact us for partnerships, consulting, or technical support.'}
        </SectionDesc>
        <ContactGrid>
          <ContactCard as="div" $isDark={isDarkMode}>
            <IconBox $bg="linear-gradient(135deg,#eff6ff,#dbeafe)" $color="#1a62ff">
              <Phone size={22} />
            </IconBox>
            <div>
              <ContactLabel $isDark={isDarkMode}>{vi ? 'Hotline hệ thống' : 'System Hotline'}</ContactLabel>
              <ContactValue $isDark={isDarkMode}>0379 784 509</ContactValue>
              <ContactNote $isDark={isDarkMode}>{vi ? 'Hỗ trợ 8:00 – 22:00' : 'Support 8:00 – 22:00'}</ContactNote>
            </div>
          </ContactCard>

          <ContactCard as="div" $isDark={isDarkMode}>
            <IconBox $bg="linear-gradient(135deg,#f0fdf4,#dcfce7)" $color="#16a34a">
              <Phone size={22} />
            </IconBox>
            <div>
              <ContactLabel $isDark={isDarkMode}>{vi ? 'Hỗ trợ khách hàng' : 'Customer Support'}</ContactLabel>
              <ContactValue $isDark={isDarkMode}>0563 518 922</ContactValue>
              <ContactNote $isDark={isDarkMode}>{vi ? 'Hỗ trợ 8:00 – 22:00' : 'Support 8:00 – 22:00'}</ContactNote>
            </div>
          </ContactCard>

          <ContactCard href="mailto:oppohiringplatform@gmail.com" $isDark={isDarkMode}>
            <IconBox $bg="linear-gradient(135deg,#fff7ed,#fed7aa)" $color="#ea580c">
              <Mail size={22} />
            </IconBox>
            <div>
              <ContactLabel $isDark={isDarkMode}>Email</ContactLabel>
              <ContactValue $isDark={isDarkMode}>oppohiringplatform@gmail.com</ContactValue>
              <ContactNote $isDark={isDarkMode}>{vi ? 'Phản hồi trong 24h' : 'Reply within 24h'}</ContactNote>
            </div>
          </ContactCard>

          <ContactCard
            href="https://facebook.com/oppo.nentangtuyendung/"
            target="_blank"
            rel="noopener noreferrer"
            $isDark={isDarkMode}
          >
            <IconBox $bg="linear-gradient(135deg,#eff6ff,#bfdbfe)" $color="#2563eb">
              <Facebook size={22} />
            </IconBox>
            <div>
              <ContactLabel $isDark={isDarkMode}>Facebook Fanpage</ContactLabel>
              <ContactValue $isDark={isDarkMode}>oppo.nentangtuyendung</ContactValue>
              <ContactNote $isDark={isDarkMode}>{vi ? 'Nhắn tin qua Fanpage' : 'Message via Fanpage'}</ContactNote>
            </div>
          </ContactCard>

          <ContactCard
            href="https://www.tiktok.com/@oppo.career?is_from_webapp=1&sender_device=pc"
            target="_blank"
            rel="noopener noreferrer"
            $isDark={isDarkMode}
          >
            <IconBox $bg="linear-gradient(135deg,#fdf4ff,#ede9fe)" $color="#7c3aed">
              <Music size={22} />
            </IconBox>
            <div>
              <ContactLabel $isDark={isDarkMode}>TikTok</ContactLabel>
              <ContactValue $isDark={isDarkMode}>@oppo.career</ContactValue>
              <ContactNote $isDark={isDarkMode}>{vi ? 'Theo dõi chúng tôi trên TikTok' : 'Follow us on TikTok'}</ContactNote>
            </div>
          </ContactCard>

          <ContactCard as="div" $isDark={isDarkMode} style={{ gridColumn: '1 / -1' }}>
            <IconBox $bg="linear-gradient(135deg,#fdf4ff,#ede9fe)" $color="#7c3aed">
              <MapPin size={22} />
            </IconBox>
            <div>
              <ContactLabel $isDark={isDarkMode}>{vi ? 'Trụ sở chính' : 'Headquarters'}</ContactLabel>
              <ContactValue $isDark={isDarkMode}>
                {vi
                  ? 'Đại học FPT, Khu Công nghệ cao, Quận 9, TP Thủ Đức, TP HCM'
                  : 'FPT University, Hi-Tech Park, District 9, Thu Duc City, HCMC'}
              </ContactValue>
            </div>
          </ContactCard>
        </ContactGrid>
      </Section>
    </Wrapper>
  );
};

export default ContactPage;
