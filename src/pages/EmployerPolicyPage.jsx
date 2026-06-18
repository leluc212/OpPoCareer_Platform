import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { s3Images } from '../utils/s3Images';
import { ArrowLeft, Building2, Briefcase, CheckCircle, Scale, Shield, HelpCircle } from 'lucide-react';

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

const EmployerPolicyPage = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const vi = language === 'vi';

  return (
    <Wrapper $isDark={isDarkMode}>
      <Header>
        <BackBtn onClick={() => navigate('/register/employer')}>
          <ArrowLeft size={16} />
          {vi ? 'Quay lại đăng ký' : 'Back to registration'}
        </BackBtn>
        <Logo>
          <img src={s3Images.system.logo} alt="Ốp Pờ" style={{ height: 64, objectFit: 'contain', display: 'block', background: '#fff', borderRadius: '16px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }} onError={e => { e.target.style.display = 'none'; }} />
        </Logo>
        <HeaderTitle>
          {vi ? 'CHÍNH SÁCH 04: DÀNH CHO NHÀ TUYỂN DỤNG' : 'POLICY 04: FOR EMPLOYERS'}
        </HeaderTitle>
        <HeaderMeta>
          <MetaTag>{vi ? 'Áp dụng: Doanh nghiệp F&B' : 'Applies to: F&B Businesses'}</MetaTag>
          <MetaTag>{vi ? 'Nền tảng: Web & App' : 'Platform: Web & App'}</MetaTag>
          <MetaTag>{vi ? 'Phí đăng ký: Miễn phí' : 'Registration Fee: Free'}</MetaTag>
        </HeaderMeta>
      </Header>

      <Container>
        <Card $isDark={isDarkMode}>
          <HighlightBox $isDark={isDarkMode}>
            {vi
              ? 'Ốp Pờ giúp bạn tìm đúng người, đúng ca, đúng lúc. Dưới đây là những điều bạn cần biết để sử dụng nền tảng hiệu quả nhất.'
              : 'Ốp Pờ helps you find the right person, the right shift, at the right time. Here is what you need to know to use the platform most effectively.'}
          </HighlightBox>
        </Card>

        {/* 1. Đăng ký tài khoản nhà tuyển dụng */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Building2 size={19} />
            {vi ? '1. Đăng ký tài khoản nhà tuyển dụng' : '1. Employer Account Registration'}
          </SectionTitle>

          <SubTitle $isDark={isDarkMode}>{vi ? '1.1 Thông tin cần thiết khi đăng ký' : '1.1 Required Information'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Tên doanh nghiệp hoặc hộ kinh doanh (phải khớp với giấy tờ đăng ký kinh doanh).' : 'Business name or household business name (must match business registration documents).'}</li>
            <li>{vi ? 'Địa chỉ cơ sở kinh doanh chính xác.' : 'Accurate business address.'}</li>
            <li>{vi ? 'Mã số thuế (với doanh nghiệp) hoặc CMND/CCCD của chủ hộ kinh doanh (với hộ cá thể).' : 'Tax identification number (for businesses) or ID/Citizen ID of the household business owner (for individuals).'}</li>
            <li>{vi ? 'Số điện thoại và email liên hệ chính thức.' : 'Official contact phone number and email.'}</li>
            <li>{vi ? 'Tên và thông tin người đại diện quản lý tài khoản.' : 'Name and information of the account representative.'}</li>
          </UL>

          <SubTitle $isDark={isDarkMode}>{vi ? '1.2 Quy trình xét duyệt' : '1.2 Review Process'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Sau khi đăng ký, hồ sơ nhà tuyển dụng sẽ được Ốp Pờ xem xét và phê duyệt trong vòng 24 giờ làm việc (không tính thứ 7, CN và ngày lễ).' : 'After registration, employer profiles will be reviewed and approved by Ốp Pờ within 24 business hours (excluding Saturdays, Sundays, and holidays).'}</li>
            <li>{vi ? 'Ốp Pờ có thể yêu cầu bổ sung giấy tờ xác minh nếu cần thiết.' : 'Ốp Pờ may request additional verification documents if necessary.'}</li>
            <li>{vi ? 'Tài khoản bị từ chối sẽ được thông báo lý do và có thể nộp lại sau khi bổ sung đầy đủ.' : 'Rejected accounts will be notified of the reason and can reapply after providing full information.'}</li>
          </UL>
        </Card>

        {/* 2. Đăng tin tuyển dụng */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Briefcase size={19} />
            {vi ? '2. Đăng tin tuyển dụng' : '2. Job Posting'}
          </SectionTitle>
          <SubTitle $isDark={isDarkMode}>{vi ? '2.1 Miễn phí không giới hạn' : '2.1 Unlimited Free Postings'}</SubTitle>
          <P $isDark={isDarkMode}>{vi ? 'Nhà tuyển dụng được đăng tin tuyển dụng thông thường hoàn toàn miễn phí, không giới hạn số lượng tin cùng lúc.' : 'Employers can post regular jobs completely free, with no limit on the number of concurrent postings.'}</P>

          <SubTitle $isDark={isDarkMode}>{vi ? '2.2 Thông tin bắt buộc trong tin tuyển dụng' : '2.2 Mandatory Information'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Tên vị trí tuyển dụng cụ thể (ví dụ: Phục vụ, Thu ngân, Pha chế, Bếp...).' : 'Specific job title (e.g., Server, Cashier, Bartender, Cook...).'}</li>
            <li>{vi ? 'Số lượng nhân sự cần tuyển.' : 'Number of staff needed.'}</li>
            <li>{vi ? 'Thời gian làm việc: ngày, giờ bắt đầu và kết thúc ca.' : 'Working time: date, start time, and end time of the shift.'}</li>
            <li>{vi ? 'Địa điểm làm việc chính xác (địa chỉ đầy đủ).' : 'Accurate work location (full address).'}</li>
            <li>{vi ? 'Mức lương hoặc khoảng lương cụ thể (bắt buộc: không được ghi “thỏa thuận” mà không kèm mức tham khảo).' : 'Specific salary or salary range (mandatory: "negotiable" is not allowed without a reference rate).'}</li>
            <li>{vi ? 'Mô tả công việc và yêu cầu cơ bản (trang phục, kinh nghiệm, độ tuổi nếu có).' : 'Job description and basic requirements (dress code, experience, age if applicable).'}</li>
          </UL>

          <SubTitle $isDark={isDarkMode}>{vi ? '2.3 Điều cấm trong nội dung tin' : '2.3 Content Prohibitions'}</SubTitle>
          <WarnBox $isDark={isDarkMode}>
            <UL $isDark={isDarkMode} style={{ color: 'inherit', paddingLeft: 16, margin: 0 }}>
              <li>{vi ? 'Đăng tin không có nhu cầu tuyển dụng thực sự (tin mồi, lấy thông tin ứng viên).' : 'Posting jobs without actual hiring needs (bait postings, collecting candidate data).'}</li>
              <li>{vi ? 'Thông tin lương, công việc, địa điểm sai lệch so với thực tế.' : 'False salary, job, or location information.'}</li>
              <li>{vi ? 'Yêu cầu ứng viên nộp tiền cọc, phí gia nhập hoặc bất kỳ khoản phí nào.' : 'Requiring candidates to pay deposits, join fees, or any other charges.'}</li>
              <li>{vi ? 'Ngôn ngữ phân biệt đối xử về giới tính, ngoại hình, sắc tộc, tôn giáo.' : 'Discriminatory language regarding gender, appearance, ethnicity, or religion.'}</li>
            </UL>
          </WarnBox>
        </Card>

        {/* 3. Quy trình tuyển dụng trên nền tảng */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <CheckCircle size={19} />
            {vi ? '3. Quy trình tuyển dụng trên nền tảng' : '3. Recruitment Process'}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Đăng tin → hệ thống tự động gợi ý ứng viên phù hợp.' : 'Post job → system automatically suggests suitable candidates.'}</li>
            <li>{vi ? 'Nhà tuyển dụng xem xét hồ sơ → Xác nhận hoặc Từ chối ứng viên.' : 'Employers review profiles → Confirm or Reject candidates.'}</li>
            <li>{vi ? 'Ứng viên được thông báo và xác nhận lịch làm việc.' : 'Candidates are notified and confirm the work schedule.'}</li>
            <li>{vi ? 'Nhà tuyển dụng nhận danh sách nhân sự đã xác nhận ca.' : 'Employers receive the list of staff who have confirmed the shift.'}</li>
            <li>{vi ? 'Sau ca, đánh giá ứng viên (chất lượng, thái độ, đúng giờ).' : 'After the shift, rate the candidate (quality, attitude, punctuality).'}</li>
            <li>{vi ? 'Thanh toán lương trực tiếp cho ứng viên theo thỏa thuận.' : 'Pay salary directly to candidates as agreed.'}</li>
          </UL>
        </Card>

        {/* 4. Quyền lợi của nhà tuyển dụng */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Scale size={19} />
            {vi ? '4. Quyền lợi của nhà tuyển dụng' : '4. Employer Benefits'}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Tiếp cận kho hồ sơ ứng viên F&B đã được xác minh thông tin cơ bản.' : 'Access a pool of F&B candidate profiles with verified basic information.'}</li>
            <li>{vi ? 'Lọc ứng viên theo kỹ năng, kinh nghiệm, khu vực, điểm uy tín và lịch rảnh.' : 'Filter candidates by skills, experience, location, reputation points, and availability.'}</li>
            <li>{vi ? 'Quản lý toàn bộ quy trình tuyển dụng trực quan trên dashboard.' : 'Manage the entire recruitment process visually on the dashboard.'}</li>
            <li>{vi ? 'Đánh giá và lưu danh sách ứng viên tin cậy để tái sử dụng cho lần sau.' : 'Rate and save a list of trusted candidates for future recruitment.'}</li>
            <li>{vi ? 'Được hỗ trợ hòa giải từ Ốp Pờ nếu xảy ra sự cố với ứng viên.' : 'Receive mediation support from Ốp Pờ if issues arise with candidates.'}</li>
          </UL>
        </Card>

        {/* 5. Trách nhiệm của nhà tuyển dụng */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Shield size={19} />
            {vi ? '5. Trách nhiệm của nhà tuyển dụng' : '5. Employer Responsibilities'}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Đảm bảo môi trường làm việc an toàn, phù hợp với quy định lao động Việt Nam.' : 'Ensure a safe working environment compliant with Vietnamese labor regulations.'}</li>
            <li>{vi ? 'Trả lương đúng mức đã cam kết trong tin tuyển dụng và đúng hạn (cuối ca hoặc theo thỏa thuận).' : 'Pay salary correctly as committed in the job posting and on time (end of shift or as agreed).'}</li>
            <li>{vi ? 'Có mặt hoặc cử người đại diện tiếp nhận ứng viên đúng giờ đã hẹn.' : 'Be present or appoint a representative to receive candidates at the scheduled time.'}</li>
            <li>{vi ? 'Thông báo hủy hoặc thay đổi ca làm việc sớm nhất có thể (tối thiểu 4 tiếng trước ca).' : 'Notify of cancellation or change of shift as early as possible (at least 4 hours before the shift).'}</li>
            <li>{vi ? 'Không thu tiền, tài sản hoặc thông tin nhạy cảm từ ứng viên ngoài phạm vi công việc.' : 'Do not collect money, assets, or sensitive information from candidates outside the scope of work.'}</li>
          </UL>
        </Card>

        <FooterBox $isDark={isDarkMode}>
          {vi
            ? 'Chính sách có hiệu lực ngay khi đăng ký tài khoản • Cập nhật tháng 6/2026'
            : 'Policy effective upon account registration • Updated June 2026'}
          <br />
          <Link to="/register/employer">{vi ? 'Quay lại đăng ký' : 'Back to registration'}</Link>
          {' · '}
          <Link to="/login">{vi ? 'Đăng nhập' : 'Login'}</Link>
        </FooterBox>
      </Container>
    </Wrapper>
  );
};

export default EmployerPolicyPage;
