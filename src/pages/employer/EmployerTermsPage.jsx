import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { s3Images } from '../../utils/s3Images';
import { ArrowLeft, FileText, Users, AlertTriangle, Scale, Shield } from 'lucide-react';

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

const BackBtn = styled.button`
  position: absolute;
  top: 20px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.85);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.2s;
  &:hover { color: #fff; }
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

const HeaderSub = styled.p`
  font-size: 0.88rem;
  color: rgba(255,255,255,0.75);
  margin-bottom: 12px;
`;

const HeaderMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 10px;
`;

const MetaTag = styled.span`
  background: rgba(255,255,255,0.18);
  color: rgba(255,255,255,0.92);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.78rem;
  font-weight: 600;
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

  @media (max-width: 640px) {
    padding: 20px 18px;
  }
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
  svg { flex-shrink: 0; }
`;

const SubTitle = styled.h3`
  font-size: 0.92rem;
  font-weight: 700;
  color: ${p => p.$isDark ? '#e2e8f0' : '#1e293b'};
  margin: 14px 0 6px;
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

const HighlightBox = styled.div`
  background: ${p => p.$isDark ? 'rgba(26,98,255,0.1)' : '#eff6ff'};
  border-left: 4px solid #1a62ff;
  border-radius: 0 10px 10px 0;
  padding: 12px 16px;
  margin: 12px 0;
  font-size: 0.88rem;
  color: ${p => p.$isDark ? '#93c5fd' : '#1e40af'};
  font-weight: 500;
  line-height: 1.7;
`;

const WarnBox = styled.div`
  background: ${p => p.$isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'};
  border-left: 4px solid #ef4444;
  border-radius: 0 10px 10px 0;
  padding: 12px 16px;
  margin: 12px 0;
  font-size: 0.88rem;
  color: ${p => p.$isDark ? '#fca5a5' : '#991b1b'};
  font-weight: 500;
  line-height: 1.7;
`;

const FooterBox = styled.div`
  text-align: center;
  font-size: 0.8rem;
  color: ${p => p.$isDark ? '#475569' : '#94a3b8'};
  margin-top: 32px;
  line-height: 1.7;
  a { color: #1a62ff; text-decoration: none; font-weight: 600; }
`;

const EmployerTermsPage = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const vi = language === 'vi';

  return (
    <Wrapper $isDark={isDarkMode}>
      <Header>
        <BackBtn onClick={() => navigate('/employer/settings')}>
          <ArrowLeft size={16} />
          {vi ? 'Quay lại cài đặt' : 'Back to settings'}
        </BackBtn>
        <Logo>
          <img src={s3Images.system.logo} alt="Ốp Pờ" style={{ height: 64, objectFit: 'contain', display: 'block', background: '#fff', borderRadius: '16px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }} onError={e => { e.target.style.display = 'none'; }} />
        </Logo>
        <HeaderTitle>
          {vi ? 'CHÍNH SÁCH 01: ĐIỀU KHOẢN SỬ DỤNG CHUNG' : 'POLICY 01: GENERAL TERMS OF USE'}
        </HeaderTitle>
        <HeaderSub>
          {vi
            ? 'Áp dụng cho: Tất cả người dùng (Ứng viên & Nhà tuyển dụng)'
            : 'Applies to: All users (Candidates & Employers)'}
        </HeaderSub>
        <HeaderMeta>
          <MetaTag>{vi ? 'Nền tảng: Web & App' : 'Platform: Web & App'}</MetaTag>
          <MetaTag>{vi ? 'Hiệu lực: Ngay khi đăng ký' : 'Effective: Upon registration'}</MetaTag>
        </HeaderMeta>
      </Header>

      <Container>
        <Card $isDark={isDarkMode}>
          <HighlightBox $isDark={isDarkMode}>
            {vi
              ? 'Khi đăng ký và sử dụng Ốp Pờ, bạn đồng ý tuân thủ toàn bộ các điều khoản dưới đây. Vui lòng đọc kỹ trước khi bắt đầu nhé!'
              : 'By registering and using Ốp Pờ, you agree to comply with all the terms below. Please read carefully before getting started!'}
          </HighlightBox>
        </Card>

        {/* 1. Phạm vi áp dụng */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <FileText size={19} />
            {vi ? '1. Phạm vi áp dụng' : '1. Scope of Application'}
          </SectionTitle>
          <P $isDark={isDarkMode}>
            {vi
              ? 'Điều khoản này áp dụng cho tất cả người dùng truy cập và sử dụng nền tảng Ốp Pờ, bao gồm:'
              : 'These terms apply to all users who access and use the Ốp Pờ platform, including:'}
          </P>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Ứng viên tìm kiếm việc làm thời vụ trong ngành F&B' : 'Candidates looking for part-time jobs in the F&B industry'}</li>
            <li>{vi ? 'Nhà tuyển dụng đăng tin và tuyển nhân sự thời vụ' : 'Employers posting jobs and hiring part-time staff'}</li>
            <li>{vi ? 'Người dùng khách (chưa đăng ký) chỉ xem nội dung công khai' : 'Guest users (unregistered) viewing public content only'}</li>
          </UL>
        </Card>

        {/* 2. Điều kiện sử dụng */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Users size={19} />
            {vi ? '2. Điều kiện sử dụng' : '2. Conditions of Use'}
          </SectionTitle>

          <SubTitle $isDark={isDarkMode}>{vi ? '2.1 Về độ tuổi' : '2.1 Age Requirements'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Ứng viên: Từ đủ 18 tuổi trở lên.' : 'Candidates: Must be at least 18 years old.'}</li>
            <li>{vi ? 'Nhà tuyển dụng: Phải đủ 18 tuổi trở lên hoặc là đại diện hợp pháp của tổ chức/doanh nghiệp.' : 'Employers: Must be at least 18 years old or a legal representative of an organization/business.'}</li>
          </UL>

          <SubTitle $isDark={isDarkMode}>{vi ? '2.2 Về tài khoản' : '2.2 Account Rules'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Mỗi cá nhân hoặc doanh nghiệp chỉ được tạo và duy trì một (01) tài khoản hoạt động trên hệ thống.' : 'Each individual or business may only create and maintain one (01) active account on the system.'}</li>
            <li>{vi ? 'Việc tạo nhiều tài khoản nhằm mục đích gian lận, lách quy định hoặc thao túng hệ thống là hành vi vi phạm nghiêm trọng.' : 'Creating multiple accounts for fraud, circumventing regulations, or manipulating the system is a serious violation.'}</li>
            <li>{vi ? 'Thông tin đăng ký phải trung thực, đầy đủ và được cập nhật kịp thời khi có thay đổi.' : 'Registration information must be truthful, complete, and updated promptly when changes occur.'}</li>
          </UL>

          <SubTitle $isDark={isDarkMode}>{vi ? '2.3 Về bảo mật tài khoản' : '2.3 Account Security'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Người dùng có trách nhiệm bảo mật thông tin đăng nhập (tên tài khoản, mật khẩu).' : 'Users are responsible for securing their login credentials (username, password).'}</li>
            <li>{vi ? 'Mọi hành động phát sinh từ tài khoản đều thuộc trách nhiệm của chủ tài khoản, trừ trường hợp báo mất/bị xâm nhập kịp thời với Ốp Pờ.' : 'All actions arising from the account are the responsibility of the account holder, unless timely reported as lost/compromised to Ốp Pờ.'}</li>
            <li>{vi ? 'Nếu phát hiện tài khoản bị truy cập trái phép, hãy liên hệ ngay với bộ phận hỗ trợ qua email hoặc hotline.' : 'If you detect unauthorized access to your account, contact support immediately via email or hotline.'}</li>
          </UL>
        </Card>

        {/* 3. Quyền & trách nhiệm của người dùng */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Scale size={19} />
            {vi ? '3. Quyền & trách nhiệm của người dùng' : '3. User Rights & Responsibilities'}
          </SectionTitle>

          <SubTitle $isDark={isDarkMode}>{vi ? '3.1 Quyền của người dùng' : '3.1 User Rights'}</SubTitle>
          <P $isDark={isDarkMode}>{vi ? 'Người dùng có quyền:' : 'Users have the right to:'}</P>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Sử dụng đầy đủ tính năng của nền tảng theo đúng mục đích được thiết kế.' : 'Use all platform features as designed.'}</li>
            <li>{vi ? 'Báo cáo nội dung vi phạm, hành vi gian lận hoặc người dùng có dấu hiệu lừa đảo.' : 'Report violating content, fraudulent behavior, or suspicious users.'}</li>
            <li>{vi ? 'Yêu cầu hỗ trợ, giải thích và khiếu nại khi không đồng ý với quyết định xử lý từ Ốp Pờ.' : 'Request support, clarification, and appeal decisions made by Ốp Pờ.'}</li>
            <li>{vi ? 'Yêu cầu xóa tài khoản và toàn bộ dữ liệu cá nhân theo quy định bảo mật.' : 'Request deletion of account and all personal data per privacy regulations.'}</li>
          </UL>

          <SubTitle $isDark={isDarkMode}>{vi ? '3.2 Trách nhiệm và nghĩa vụ của người dùng' : '3.2 User Responsibilities'}</SubTitle>
          <WarnBox $isDark={isDarkMode}>
            <UL $isDark={isDarkMode} style={{ color: 'inherit', paddingLeft: 16, margin: 0 }}>
              <li>{vi ? 'Sử dụng nền tảng cho mục đích bất hợp pháp, gian lận hoặc gây hại đến người dùng khác.' : 'Use the platform for illegal purposes, fraud, or harm to other users.'}</li>
              <li>{vi ? 'Đăng tải thông tin sai lệch, thông tin mang tính kỳ thị, phân biệt đối xử.' : 'Post false, discriminatory, or offensive information.'}</li>
              <li>{vi ? 'Sao chép, phân phối hoặc khai thác dữ liệu từ nền tảng vì mục đích thương mại khi chưa được sự đồng ý bằng văn bản từ Ốp Pờ.' : 'Copy, distribute, or exploit platform data for commercial purposes without written consent from Ốp Pờ.'}</li>
              <li>{vi ? 'Can thiệp vào hệ thống kỹ thuật, cố tình làm chậm hoặc phá hoại hoạt động của nền tảng.' : 'Interfere with technical systems or intentionally disrupt platform operations.'}</li>
            </UL>
          </WarnBox>
        </Card>

        {/* 4. Quyền của Ốp Pờ */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Shield size={19} />
            {vi ? '4. Quyền của Ốp Pờ' : "4. Ốp Pờ's Rights"}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Điều chỉnh, bổ sung hoặc thay đổi điều khoản sử dụng bất kỳ lúc nào. Người dùng sẽ được thông báo trước ít nhất 03 ngày qua email hoặc thông báo trong app.' : 'Adjust, supplement, or change terms of use at any time. Users will be notified at least 03 days in advance via email or in-app notification.'}</li>
            <li>{vi ? 'Từ chối duyệt, ẩn hoặc gỡ bỏ nội dung không đáp ứng tiêu chuẩn cộng đồng mà không cần báo trước.' : 'Refuse to approve, hide, or remove content that does not meet community standards without prior notice.'}</li>
            <li>{vi ? 'Tạm khóa hoặc xóa tài khoản vi phạm theo quy trình xử lý được nêu trong Chính sách Vi phạm.' : 'Temporarily lock or delete violating accounts per the Violation Policy process.'}</li>
            <li>{vi ? 'Thu thập và sử dụng dữ liệu người dùng theo Chính sách Bảo mật đã công bố.' : 'Collect and use user data per the published Privacy Policy.'}</li>
          </UL>
        </Card>

        {/* 5. Giới hạn trách nhiệm */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <AlertTriangle size={19} />
            {vi ? '5. Giới hạn trách nhiệm' : '5. Limitation of Liability'}
          </SectionTitle>
          <P $isDark={isDarkMode}>
            {vi
              ? 'Ốp Pờ là nền tảng kết nối trung gian giữa ứng viên và nhà tuyển dụng. Chúng tôi KHÔNG chịu trách nhiệm pháp lý thay thế cho:'
              : 'Ốp Pờ is an intermediary connecting platform between candidates and employers. We are NOT legally responsible for:'}
          </P>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Thỏa thuận lao động, mức lương, điều kiện làm việc giữa hai bên.' : 'Labor agreements, wages, and working conditions between parties.'}</li>
            <li>{vi ? 'Tranh chấp phát sinh ngoài phạm vi nền tảng hoặc sau khi kết thúc ca làm việc.' : 'Disputes arising outside the platform or after the end of a work shift.'}</li>
            <li>{vi ? 'Thiệt hại gián tiếp do sự cố kỹ thuật, mất kết nối internet hoặc các trường hợp bất khả kháng.' : 'Indirect damages due to technical failures, internet disconnection, or force majeure.'}</li>
          </UL>
        </Card>

        <FooterBox $isDark={isDarkMode}>
          {vi
            ? 'Nếu có thắc mắc, vui lòng liên hệ hỗ trợ Ốp Pờ qua email hoặc chat trực tiếp trên app.'
            : 'If you have any questions, please contact Ốp Pờ support via email or in-app chat.'}
        </FooterBox>
      </Container>
    </Wrapper>
  );
};

export default EmployerTermsPage;
