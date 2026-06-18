import React from 'react';

import styled from 'styled-components';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { s3Images } from '../utils/s3Images';
import { Scale, CreditCard, AlertCircle, HelpCircle } from 'lucide-react';

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

const TransactionTermsPage = () => {
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
          {vi ? 'ĐIỀU KIỆN GIAO DỊCH CHUNG' : 'GENERAL TERMS OF TRANSACTION'}
        </HeaderTitle>
      </Header>

      <Container>
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <CreditCard size={19} />
            {vi ? '1. Phương thức thanh toán' : '1. Payment Methods'}
          </SectionTitle>
          <P $isDark={isDarkMode}>
            {vi
              ? 'Chúng tôi hỗ trợ các phương thức thanh toán qua thẻ ngân hàng, ví điện tử và chuyển khoản.'
              : 'We support payment methods via bank cards, e-wallets, and bank transfers.'}
          </P>
        </Card>

        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Scale size={19} />
            {vi ? '2. Phí dịch vụ & Hoa hồng' : '2. Service Fees & Commission'}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Phí niêm yết có thể thay đổi tùy theo loại dịch vụ.' : 'Listing fees may vary depending on the service type.'}</li>
            <li>{vi ? 'Hoa hồng được tính dựa trên giá trị giao dịch thành công.' : 'Commission is calculated based on the successful transaction value.'}</li>
          </UL>
        </Card>

        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <AlertCircle size={19} />
            {vi ? '3. Chính sách hoàn tiền' : '3. Refund Policy'}
          </SectionTitle>
          <P $isDark={isDarkMode}>
            {vi
              ? 'Yêu cầu hoàn tiền phải được thực hiện trong vòng 48 giờ kể từ khi giao dịch phát sinh sự cố.'
              : 'Refund requests must be made within 48 hours of the transaction issue.'}
          </P>
        </Card>

        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <HelpCircle size={19} />
            {vi ? '4. Tranh chấp giao dịch' : '4. Transaction Disputes'}
          </SectionTitle>
          <P $isDark={isDarkMode}>
            {vi
              ? 'Mọi tranh chấp sẽ được giải quyết thông qua thương lượng hoặc sự can thiệp của Ốp Pờ.'
              : 'Any disputes will be resolved through negotiation or Ốp Pờ\'s intervention.'}
          </P>
        </Card>
      </Container>
    </Wrapper>
  );
};

export default TransactionTermsPage;
