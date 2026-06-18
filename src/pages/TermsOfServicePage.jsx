import React from 'react';

import styled from 'styled-components';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { s3Images } from '../utils/s3Images';
import { FileText, Shield, AlertTriangle, Scale } from 'lucide-react';

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

const TermsOfServicePage = () => {
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
          {vi ? 'ĐIỀU KHOẢN DỊCH VỤ' : 'TERMS OF SERVICE'}
        </HeaderTitle>
      </Header>

      <Container>
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <FileText size={19} />
            {vi ? '1. Chấp nhận các điều khoản' : '1. Acceptance of Terms'}
          </SectionTitle>
          <P $isDark={isDarkMode}>
            {vi
              ? 'Bằng việc truy cập và sử dụng nền tảng Ốp Pờ, bạn đồng ý tuân theo các điều khoản và điều kiện này.'
              : 'By accessing and using the Ốp Pờ platform, you agree to abide by these terms and conditions.'}
          </P>
        </Card>

        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Shield size={19} />
            {vi ? '2. Trách nhiệm của người dùng' : '2. User Responsibilities'}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Cung cấp thông tin chính xác và trung thực.' : 'Provide accurate and truthful information.'}</li>
            <li>{vi ? 'Bảo mật tài khoản và mật khẩu của mình.' : 'Keep your account and password secure.'}</li>
            <li>{vi ? 'Không sử dụng nền tảng cho mục đích bất hợp pháp.' : 'Do not use the platform for illegal purposes.'}</li>
          </UL>
        </Card>

        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <AlertTriangle size={19} />
            {vi ? '3. Giới hạn trách nhiệm' : '3. Limitation of Liability'}
          </SectionTitle>
          <P $isDark={isDarkMode}>
            {vi
              ? 'Ốp Pờ không chịu trách nhiệm cho bất kỳ tổn thất trực tiếp hoặc gián tiếp nào phát sinh từ việc sử dụng dịch vụ.'
              : 'Ốp Pờ is not liable for any direct or indirect losses arising from the use of the service.'}
          </P>
        </Card>

        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Scale size={19} />
            {vi ? '4. Thay đổi điều khoản' : '4. Changes to Terms'}
          </SectionTitle>
          <P $isDark={isDarkMode}>
            {vi
              ? 'Chúng tôi có quyền cập nhật các điều khoản này bất kỳ lúc nào mà không cần báo trước.'
              : 'We reserve the right to update these terms at any time without prior notice.'}
          </P>
        </Card>
      </Container>
    </Wrapper>
  );
};

export default TermsOfServicePage;
