import React from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Target, Zap, Search, Bell, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { s3Images } from '../utils/s3Images';

const shine = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
`;

const Wrapper = styled.div`
  min-height: 100vh;
  background: ${p => p.$isDark ? '#0f172a' : '#f8fafc'};
  color: ${p => p.$isDark ? '#e2e8f0' : '#1e293b'};
  font-family: 'Inter', 'Be Vietnam Pro', sans-serif;
  overflow-x: hidden;
`;

/* ── Header ── */
const Header = styled.header`
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.25);
`;

const HeaderLogo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
`;

/* ── Hero ── */
const Hero = styled.section`
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  padding: 80px 32px 120px;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -100px;
    right: -100px;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    filter: blur(60px);
  }
`;

const HeroBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 8px 20px;
  border-radius: 30px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const HeroTitle = styled(motion.h1)`
  font-size: clamp(2.2rem, 6vw, 3.8rem);
  font-weight: 900;
  color: #fff;
  line-height: 1.1;
  max-width: 850px;
  margin: 0 auto 20px;
  letter-spacing: -1px;
  
  span {
    background: linear-gradient(90deg, #fff, #c7d2fe, #fff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ${shine} 4s linear infinite;
  }
`;

const HeroSub = styled(motion.p)`
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.85);
  max-width: 600px;
  margin: 0 auto 40px;
  line-height: 1.7;
`;

/* ── AI Features ── */
const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
`;

const Section = styled.section`
  padding: 100px 0;
`;

const SectionHeading = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

const Badge = styled.span`
  color: #6366f1;
  font-weight: 800;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: block;
  margin-bottom: 12px;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 900;
  color: ${p => p.$isDark ? '#f1f5f9' : '#1e293b'};
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled(motion.div)`
  background: ${p => p.$isDark ? 'rgba(30, 41, 59, 0.5)' : '#fff'};
  border: 1px solid ${p => p.$isDark ? 'rgba(99, 102, 241, 0.2)' : '#e5e7eb'};
  padding: 40px;
  border-radius: 24px;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-10px);
    border-color: #6366f1;
    box-shadow: 0 20px 40px rgba(99, 102, 241, 0.1);
  }
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  background: ${p => p.$bg};
  color: #fff;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 16px;
  color: ${p => p.$isDark ? '#f1f5f9' : '#1e293b'};
`;

const CardDesc = styled.p`
  font-size: 1rem;
  line-height: 1.7;
  color: ${p => p.$isDark ? '#94a3b8' : '#64748b'};
`;

/* ── Comparison ── */
const ComparisonSection = styled.section`
  background: ${p => p.$isDark ? 'rgba(15, 23, 42, 0.8)' : '#f1f5f9'};
  padding: 100px 0;
  border-radius: 60px;
  margin: 0 24px;
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  
  @media (max-width: 850px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

/* ── CTA ── */
const CTA = styled.section`
  padding: 120px 0;
  text-align: center;
`;

const MainButton = styled(Link)`
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #fff;
  padding: 18px 48px;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 800;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 15px 40px rgba(99, 102, 241, 0.4);
  }
`;

const AIRecommendationsPage = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const vi = language === 'vi';

  return (
    <Wrapper $isDark={isDarkMode}>
      <Header>
        <HeaderLogo to="/">
          <img src={s3Images.system.logo} alt="Ốp Pờ" style={{ height: 40, objectFit: 'contain' }} />
        </HeaderLogo>
      </Header>

      <Hero>
        <HeroBadge>
          <Sparkles size={16} />
          {vi ? 'Công nghệ AI độc quyền' : 'Exclusive AI Technology'}
        </HeroBadge>
        <HeroTitle
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {vi ? (
            <>Tìm việc nhanh hơn với <span>Trí tuệ nhân tạo</span></>
          ) : (
            <>Find Jobs Faster with <span>Artificial Intelligence</span></>
          )}
        </HeroTitle>
        <HeroSub
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {vi 
            ? 'Công nghệ AI của Ốp Pờ phân tích kỹ năng và mong muốn của bạn để đưa ra những gợi ý việc làm chính xác đến 99%.' 
            : 'Op Po AI analyzes your skills and preferences to provide job recommendations with up to 99% accuracy.'}
        </HeroSub>
        
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Brain size={120} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto' }} />
        </motion.div>
      </Hero>

      <Container>
        <Section>
          <SectionHeading>
            <Badge>{vi ? 'Tại sao chọn Ốp Pờ AI?' : 'Why Op Po AI?'}</Badge>
            <SectionTitle $isDark={isDarkMode}>
              {vi ? 'Sức mạnh của đề xuất thông minh' : 'The Power of Smart Recommendations'}
            </SectionTitle>
          </SectionHeading>

          <FeatureGrid>
            <FeatureCard 
              $isDark={isDarkMode}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <IconWrapper $bg="linear-gradient(135deg, #6366f1, #818cf8)">
                <Target size={30} />
              </IconWrapper>
              <CardTitle $isDark={isDarkMode}>{vi ? 'Độ chính xác tuyệt đối' : 'Absolute Precision'}</CardTitle>
              <CardDesc $isDark={isDarkMode}>
                {vi 
                  ? 'AI phân tích hơn 50 tiêu chí khác nhau từ hồ sơ của bạn để lọc ra những công việc thực sự phù hợp.' 
                  : 'AI analyzes 50+ different criteria from your profile to filter out jobs that truly fit you.'}
              </CardDesc>
            </FeatureCard>

            <FeatureCard 
              $isDark={isDarkMode}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <IconWrapper $bg="linear-gradient(135deg, #ec4899, #f472b6)">
                <Zap size={30} />
              </IconWrapper>
              <CardTitle $isDark={isDarkMode}>{vi ? 'Tốc độ tức thì' : 'Instant Speed'}</CardTitle>
              <CardDesc $isDark={isDarkMode}>
                {vi 
                  ? 'Không còn phải tìm kiếm thủ công. Hệ thống tự động gửi thông báo ngay khi có việc làm mới phù hợp.' 
                  : 'No more manual searching. The system automatically notifies you as soon as a matching job is posted.'}
              </CardDesc>
            </FeatureCard>

            <FeatureCard 
              $isDark={isDarkMode}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <IconWrapper $bg="linear-gradient(135deg, #10b981, #34d399)">
                <Bell size={30} />
              </IconWrapper>
              <CardTitle $isDark={isDarkMode}>{vi ? 'Cá nhân hóa tối đa' : 'Maximum Personalization'}</CardTitle>
              <CardDesc $isDark={isDarkMode}>
                {vi 
                  ? 'Càng sử dụng nhiều, AI càng hiểu bạn hơn. Đề xuất sẽ ngày càng sát với sở thích và sự nghiệp của bạn.' 
                  : 'The more you use it, the better AI understands you. Recommendations will align closer with your career paths.'}
              </CardDesc>
            </FeatureCard>
          </FeatureGrid>
        </Section>
      </Container>

      <ComparisonSection $isDark={isDarkMode}>
        <Container>
          <ComparisonGrid>
            <div>
              <SectionHeading style={{ textAlign: 'left', marginBottom: 32 }}>
                <Badge>{vi ? 'So sánh hiệu quả' : 'Efficiency Comparison'}</Badge>
                <SectionTitle $isDark={isDarkMode}>
                  {vi ? 'Khác biệt hoàn toàn so với tìm kiếm truyền thống' : 'A Total Difference from Traditional Search'}
                </SectionTitle>
              </SectionHeading>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  vi ? 'Tiết kiệm 80% thời gian tìm kiếm' : 'Save 80% search time',
                  vi ? 'Tăng 3 lần tỷ lệ được mời phỏng vấn' : '3x higher interview invitation rate',
                  vi ? 'Chỉ nhận việc làm trong phạm vi gần bạn' : 'Only receive jobs near your location',
                  vi ? 'Loại bỏ hoàn toàn tin rác, tin ảo' : 'Eliminate spam and fake jobs'
                ].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CheckCircle size={20} color="#10b981" />
                    <span style={{ fontWeight: 600 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <motion.div
              style={{ position: 'relative' }}
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 10, repeat: Infinity }}
            >
              <img 
                src={s3Images.system.logo} 
                alt="AI Analysis" 
                style={{ width: '100%', maxWidth: 400, opacity: 0.2 }} 
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '4rem',
                fontWeight: 900,
                color: '#6366f1'
              }}>
                99%
              </div>
            </motion.div>
          </ComparisonGrid>
        </Container>
      </ComparisonSection>

      <CTA>
        <Container>
          <HeroTitle $isDark={isDarkMode} style={{ color: isDarkMode ? '#fff' : '#1e293b', fontSize: '2.5rem' }}>
            {vi ? 'Sẵn sàng trải nghiệm AI đỉnh cao?' : 'Ready to Experience Top-Tier AI?'}
          </HeroTitle>
          <HeroSub style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
            {vi 
              ? 'Tạo tài khoản và cập nhật hồ sơ ngay hôm nay để AI bắt đầu tìm kiếm cơ hội cho bạn.' 
              : 'Create an account and update your profile today to let AI start finding opportunities for you.'}
          </HeroSub>
          <MainButton to="/register/candidate">
            {vi ? 'Bắt đầu ngay' : 'Get Started Now'}
            <ArrowRight size={20} />
          </MainButton>
        </Container>
      </CTA>
    </Wrapper>
  );
};

export default AIRecommendationsPage;
