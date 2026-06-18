import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { s3Images } from '../utils/s3Images';
import { ArrowLeft, FileText, Users, Lock, AlertTriangle, Scale, HelpCircle, Shield, CheckCircle } from 'lucide-react';

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

const CandidatePolicyPage = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const vi = language === 'vi';

  return (
    <Wrapper $isDark={isDarkMode}>
      <Header>
        <BackBtn onClick={() => navigate('/register/candidate')}>
          <ArrowLeft size={16} />
          {vi ? 'Quay lại đăng ký' : 'Back to registration'}
        </BackBtn>
        <Logo>
          <img src={s3Images.system.logo} alt="Ốp Pờ" style={{ height: 64, objectFit: 'contain', display: 'block', background: '#fff', borderRadius: '16px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }} onError={e => { e.target.style.display = 'none'; }} />
        </Logo>
        <HeaderTitle>
          {vi ? 'CHÍNH SÁCH 03: DÀNH CHO ỨNG VIÊN' : 'POLICY 03: FOR CANDIDATES'}
        </HeaderTitle>
        <HeaderMeta>
          <MetaTag>{vi ? 'Áp dụng: Ứng viên F&B' : 'Applies to: F&B Candidates'}</MetaTag>
          <MetaTag>{vi ? 'Nền tảng: Web & App' : 'Platform: Web & App'}</MetaTag>
          <MetaTag>{vi ? 'Phí: Miễn phí hoàn toàn' : 'Fee: Completely free'}</MetaTag>
        </HeaderMeta>
      </Header>

      <Container>
        <Card $isDark={isDarkMode}>
          <HighlightBox $isDark={isDarkMode}>
            {vi
              ? 'Ốp Pờ luôn đặt quyền lợi của ứng viên lên hàng đầu. Đọc kỹ để biết bạn được bảo vệ như thế nào nhé!'
              : 'Ốp Pờ always puts the interests of candidates first. Read carefully to know how you are protected!'}
          </HighlightBox>
        </Card>

        {/* 1. Đăng ký & hồ sơ cá nhân */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Users size={19} />
            {vi ? '1. Đăng ký & Hồ sơ cá nhân' : '1. Registration & Personal Profile'}
          </SectionTitle>

          <SubTitle $isDark={isDarkMode}>{vi ? '1.1 Điều kiện đăng ký' : '1.1 Registration Conditions'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Từ đủ 18 tuổi trở lên.' : 'Must be at least 18 years old.'}</li>
            <li>{vi ? 'Sử dụng số điện thoại hoặc email cá nhân thực để xác minh tài khoản.' : 'Use a real personal phone number or email to verify account.'}</li>
            <li>{vi ? 'Mỗi cá nhân chỉ được tạo một tài khoản ứng viên duy nhất.' : 'Each individual can only create one unique candidate account.'}</li>
          </UL>

          <SubTitle $isDark={isDarkMode}>{vi ? '1.2 Yêu cầu hồ sơ' : '1.2 Profile Requirements'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Bắt buộc: Ảnh đại diện rõ mặt (không đeo kính tối, không đội mũ che mặt), họ tên đầy đủ, số điện thoại liên hệ, khu vực làm việc mong muốn.' : 'Required: Clear face photo (no dark glasses, no hats covering face), full name, contact phone number, desired work area.'}</li>
            <li>{vi ? 'Khuyến khích bổ sung: Kinh nghiệm làm việc F&B (nếu có), kỹ năng đặc thù (pha chế, phục vụ, bếp...), lịch làm việc ưa thích.' : 'Encouraged: F&B work experience (if any), specific skills (bartending, serving, kitchen...), preferred work schedule.'}</li>
          </UL>
          <WarnBox $isDark={isDarkMode}>
            {vi
              ? 'Thông tin hồ sơ phải trung thực. Nếu phát hiện gian lận (khai kinh nghiệm giả, sử dụng ảnh người khác...), tài khoản sẽ bị khóa vĩnh viễn.'
              : 'Profile information must be truthful. If fraud is detected (false experience, using others\' photos...), the account will be permanently locked.'}
          </WarnBox>
        </Card>

        {/* 2. Quy trình ứng tuyển */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <CheckCircle size={19} />
            {vi ? '2. Quy trình ứng tuyển' : '2. Application Process'}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Ứng viên tìm kiếm tin phù hợp và bấm Ứng tuyển hoặc nhận được lời mời từ nhà tuyển dụng.' : 'Candidates search for suitable jobs and click Apply or receive invitations from employers.'}</li>
            <li>{vi ? 'Nhà tuyển dụng xem xét hồ sơ và xác nhận/từ chối trong thời hạn tin còn hiệu lực (job Gấp).' : 'Employers review profiles and confirm/reject within the post validity period (Urgent job).'}</li>
            <li>{vi ? 'Nếu được chấp nhận, ứng viên nhận thông báo qua app, SMS hoặc email kèm thông tin chi tiết về ca làm việc (job Gấp).' : 'If accepted, candidates receive notifications via app, SMS, or email with details of the shift (Urgent job).'}</li>
            <li>{vi ? 'Ứng viên xác nhận lại lịch làm việc trong thời gian quy định của job Gấp khi nhận thông báo.' : 'Candidates confirm the work schedule within the prescribed time for Urgent jobs upon notification.'}</li>
            <li>{vi ? 'Đến đúng giờ, đúng địa điểm và hoàn thành ca làm việc.' : 'Arrive on time, at the right location, and complete the shift.'}</li>
            <li>{vi ? 'Sau ca, đánh giá nhà tuyển dụng để giúp cộng đồng Ốp Pờ ngày càng tốt hơn.' : 'After the shift, rate the employer to help the Ốp Pờ community grow better.'}</li>
          </UL>
        </Card>

        {/* 3. Quyền lợi của ứng viên */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Shield size={19} />
            {vi ? '3. Quyền lợi của ứng viên' : '3. Candidate Benefits'}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Sử dụng toàn bộ tính năng nền tảng hoàn toàn miễn phí, không mất bất kỳ khoản phí nào.' : 'Use all platform features completely free, with no charges.'}</li>
            <li>{vi ? 'Được xem đầy đủ thông tin về công việc trước khi quyết định ứng tuyển: địa điểm, giờ giấc, mức lương, mô tả công việc.' : 'View full job information before deciding to apply: location, hours, salary, job description.'}</li>
            <li>{vi ? 'Được Ốp Pờ hỗ trợ hòa giải nếu xảy ra tranh chấp với nhà tuyển dụng về lương hoặc điều kiện làm việc.' : 'Receive mediation support from Ốp Pờ in case of disputes with employers over salary or working conditions.'}</li>
            <li>{vi ? 'Được bảo vệ thông tin cá nhân theo Chính sách Bảo mật của Ốp Pờ.' : 'Have personal information protected according to Ốp Pờ\'s Privacy Policy.'}</li>
            <li>{vi ? 'Được báo cáo nhà tuyển dụng vi phạm (không trả lương, môi trường không an toàn, v.v.) và nhận phản hồi trong vòng 48 giờ làm việc.' : 'Report violating employers (unpaid salary, unsafe environment, etc.) and receive feedback within 48 business hours.'}</li>
          </UL>
        </Card>

        {/* 4. Trách nhiệm của ứng viên */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Scale size={19} />
            {vi ? '4. Trách nhiệm của ứng viên' : '4. Candidate Responsibilities'}
          </SectionTitle>

          <SubTitle $isDark={isDarkMode}>{vi ? '4.1 Về lịch làm việc' : '4.1 Regarding Work Schedule'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Ứng viên phải xác nhận lịch làm việc trong thời gian quy định job Gấp sau khi nhận thông báo. Không xác nhận được xem là từ chối.' : 'Candidates must confirm the work schedule within the prescribed time for Urgent jobs after notification. Failure to confirm is considered a rejection.'}</li>
            <li>{vi ? 'Nếu cần hủy ca đã xác nhận, phải thông báo cho nhà tuyển dụng qua nền tảng và/hoặc trực tiếp trước ít nhất 30 phút.' : 'If you need to cancel a confirmed shift, you must notify the employer via the platform and/or directly at least 30 minutes in advance.'}</li>
            <li>{vi ? 'Trường hợp khẩn cấp (tai nạn, ốm bệnh), phải thông báo ngay lập tức và gửi bằng chứng trong vòng 24 giờ để được miễn trừ điểm phạt.' : 'In case of emergency (accident, illness), you must notify immediately and send evidence within 24 hours to be exempt from penalty points.'}</li>
          </UL>

          <SubTitle $isDark={isDarkMode}>{vi ? '4.2 Về thái độ & hành vi' : '4.2 Regarding Attitude & Behavior'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Đến đúng giờ, mặc trang phục phù hợp theo yêu cầu của nhà tuyển dụng.' : 'Arrive on time, wear suitable clothing as required by the employer.'}</li>
            <li>{vi ? 'Tôn trọng nhân viên, khách hàng và tài sản của nhà tuyển dụng trong suốt ca làm việc.' : 'Respect employees, customers, and employer property throughout the shift.'}</li>
            <li>{vi ? 'Không được tiết lộ thông tin nội bộ, quy trình vận hành của nhà tuyển dụng cho bên ngoài.' : 'Do not disclose internal information or operating procedures of the employer to outsiders.'}</li>
          </UL>
        </Card>

        <FooterBox $isDark={isDarkMode}>
          {vi
            ? 'Chính sách có hiệu lực ngay khi đăng ký tài khoản • Cập nhật tháng 6/2026'
            : 'Policy effective upon account registration • Updated June 2026'}
          <br />
          <Link to="/register/candidate">{vi ? 'Quay lại đăng ký' : 'Back to registration'}</Link>
          {' · '}
          <Link to="/login">{vi ? 'Đăng nhập' : 'Login'}</Link>
        </FooterBox>
      </Container>
    </Wrapper>
  );
};

export default CandidatePolicyPage;
