import React from 'react';

import styled from 'styled-components';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { s3Images } from '../utils/s3Images';
import { Shield, Database, Lock, Eye } from 'lucide-react';

const Wrapper = styled.div`
  min-height: 100vh;
  background: ${p => p.$isDark ? '#0f172a' : '#f8fafc'};
  color: ${p => p.$isDark ? '#e2e8f0' : '#1e293b'};
`;

const Header = styled.div`
  background: linear-gradient(135deg, #1a62ff 0%, #002e9d 100%);
  padding: 40px 24px 56px;
  text-align: center;
  position: relative;
`;


const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 14px;
`;

const HeaderTitle = styled.h1`
  font-size: clamp(1.3rem, 3vw, 1.9rem);
  font-weight: 900;
  color: #fff;
  margin-bottom: 8px;
  letter-spacing: -0.3px;
`;

const Container = styled.div`
  max-width: 860px;
  margin: -28px auto 0;
  padding: 0 24px 80px;
  position: relative;
  z-index: 1;
`;

const Card = styled.div`
  background: ${p => p.$isDark ? 'rgba(30,41,59,0.95)' : '#fff'};
  border: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.3)' : '#e2e8f0'};
  border-radius: 16px;
  padding: 28px 32px;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.07);
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.05rem;
  font-weight: 800;
  color: #1a62ff;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 2px solid ${p => p.$isDark ? 'rgba(26,98,255,0.2)' : '#eff6ff'};
`;

const P = styled.p`
  font-size: 0.88rem;
  line-height: 1.85;
  color: ${p => p.$isDark ? '#94a3b8' : '#475569'};
  margin-bottom: 8px;
`;

const UL = styled.ul`
  padding-left: 18px;
  margin: 6px 0 10px;
  li {
    font-size: 0.88rem;
    line-height: 1.85;
    color: ${p => p.$isDark ? '#94a3b8' : '#475569'};
    margin-bottom: 3px;
  }
`;

const PrivacyPolicyPage = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const vi = language === 'vi';

  return (
    <Wrapper $isDark={isDarkMode}>
      <Header>
        <Logo>
          <img src={s3Images.system.logo} alt="Ốp Pờ" style={{ height: 64, objectFit: 'contain', display: 'block', background: '#fff', borderRadius: '16px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }} />
        </Logo>
        <HeaderTitle>
          {vi ? 'CHÍNH SÁCH BẢO MẬT' : 'PRIVACY POLICY'}
        </HeaderTitle>
      </Header>

      <Container>
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Database size={19} />
            {vi ? '1. Dữ liệu chúng tôi thu thập' : '1. Data We Collect'}
          </SectionTitle>
          <P $isDark={isDarkMode}>
            {vi
              ? 'Chúng tôi thu thập các thông tin bạn cung cấp khi đăng ký tài khoản, bao gồm họ tên, email, và số điện thoại.'
              : 'We collect information you provide when registering an account, including full name, email, and phone number.'}
          </P>
        </Card>

        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Eye size={19} />
            {vi ? '2. Cách chúng tôi sử dụng dữ liệu' : '2. How We Use Your Data'}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Để cung cấp và duy trì dịch vụ của chúng tôi.' : 'To provide and maintain our service.'}</li>
            <li>{vi ? 'Để thông báo cho bạn về các thay đổi.' : 'To notify you about changes.'}</li>
            <li>{vi ? 'Để cung cấp hỗ trợ khách hàng.' : 'To provide customer support.'}</li>
          </UL>
        </Card>

        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Lock size={19} />
            {vi ? '3. Bảo mật dữ liệu' : '3. Security of Data'}
          </SectionTitle>
          <P $isDark={isDarkMode}>
            {vi
              ? 'Bảo mật dữ liệu của bạn rất quan trọng với chúng tôi, nhưng không có phương pháp truyền tải qua Internet nào là an toàn 100%.'
              : 'The security of your data is important to us, but no method of transmission over the Internet is 100% secure.'}
          </P>
        </Card>

        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Shield size={19} />
            {vi ? '4. Quyền của bạn' : '4. Your Rights'}
          </SectionTitle>
          <P $isDark={isDarkMode}>
            {vi
              ? 'Bạn có quyền truy cập, cập nhật hoặc xóa thông tin cá nhân mà chúng tôi có về bạn.'
              : 'You have the right to access, update, or delete the personal information we have about you.'}
          </P>
        </Card>
      </Container>
    </Wrapper>
  );
};

export default PrivacyPolicyPage;
