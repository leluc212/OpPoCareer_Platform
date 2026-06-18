import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { s3Images } from '../utils/s3Images';
import {
  ArrowLeft, Shield, Share2, UserCheck, Lock,
  HelpCircle, Eye, Database, ListChecks, Mail,
  AlertOctagon, AlertTriangle, Info, MessageSquare, Flag
} from 'lucide-react';

const Wrapper = styled.div`
  min-height: 100vh;
  background: ${p => p.$isDark ? '#0f172a' : '#f8fafc'};
  color: ${p => p.$isDark ? '#e2e8f0' : '#1e293b'};
`;

const Header = styled.div`
  background: linear-gradient(135deg, #1a62ff 0%, #002e9d 100%);
  padding: 40px 24px 64px;
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
  font-size: clamp(1.1rem, 2.5vw, 1.7rem);
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

const SuccessBox = styled.div`
  background: ${p => p.$isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4'};
  border-left: 4px solid #10b981;
  border-radius: 0 10px 10px 0;
  padding: 12px 16px;
  margin: 12px 0;
  font-size: 0.88rem;
  color: ${p => p.$isDark ? '#6ee7b7' : '#065f46'};
  font-weight: 500;
  line-height: 1.7;
`;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 24px;
  flex-wrap: wrap;
`;

const Tab = styled.button`
  padding: 9px 20px;
  border-radius: 20px;
  border: 1.5px solid ${p => p.$active ? '#fff' : 'rgba(255,255,255,0.35)'};
  background: ${p => p.$active ? '#fff' : 'rgba(255,255,255,0.12)'};
  color: ${p => p.$active ? '#1a62ff' : 'rgba(255,255,255,0.85)'};
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover { background: ${p => p.$active ? '#fff' : 'rgba(255,255,255,0.22)'}; }
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

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  margin: 16px 0;
  border-radius: 12px;
  border: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.3)' : '#e2e8f0'};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  text-align: left;
  
  th {
     background: ${p => p.$isDark ? 'rgba(26,98,255,0.15)' : '#eff6ff'};
     color: ${p => p.$isDark ? '#e2e8f0' : '#1e293b'};
     padding: 12px 16px;
     font-weight: 700;
     border-bottom: 1.5px solid ${p => p.$isDark ? 'rgba(26,98,255,0.2)' : '#dbeafe'};
  }
  
  td {
    padding: 12px 16px;
    border-bottom: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.2)' : '#f1f5f9'};
    color: ${p => p.$isDark ? '#94a3b8' : '#475569'};
    line-height: 1.6;
    vertical-align: top;
  }

  tr:last-child td { border-bottom: none; }
`;

const LevelCard = styled.div`
  background: ${p => p.$bg};
  border-left: 5px solid ${p => p.$color};
  padding: 16px;
  border-radius: 0 12px 12px 0;
  margin-bottom: 16px;

  .lvl-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    font-weight: 800;
    color: ${p => p.$color};
    margin-bottom: 8px;
  }
  .lvl-desc {
    font-size: 0.85rem;
    color: ${p => p.$isDark ? '#cbd5e1' : '#334155'};
    line-height: 1.7;
  }
`;

const FooterBox = styled.div`
  text-align: center;
  font-size: 0.8rem;
  color: ${p => p.$isDark ? '#475569' : '#94a3b8'};
  margin-top: 32px;
  line-height: 1.7;
  a { color: #1a62ff; text-decoration: none; font-weight: 600; }
  .slogan {
     margin-top: 14px;
     font-size: 0.75rem;
     font-weight: 700;
     color: #1a62ff;
     text-transform: uppercase;
     letter-spacing: 0.5px;
  }
`;

const RegisterPolicyPage = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const vi = language === 'vi';
  const [tab, setTab] = useState('privacy');

  return (
    <Wrapper $isDark={isDarkMode}>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          {vi ? 'Quay lại' : 'Back'}
        </BackBtn>
        <Logo>
          <img src={s3Images.system.logo} alt="Ốp Pờ" style={{ height: 64, objectFit: 'contain', display: 'block', background: '#fff', borderRadius: '16px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }} onError={e => { e.target.style.display = 'none'; }} />
        </Logo>
        <HeaderTitle>
          {tab === 'privacy'
            ? (vi ? 'CHÍNH SÁCH 02: BẢO MẬT & DỮ LIỆU CÁ NHÂN' : 'POLICY 02: PRIVACY & PERSONAL DATA')
            : (vi ? 'CHÍNH SÁCH 09: VI PHẠM & XỬ LÝ TÀI KHOẢN' : 'POLICY 09: VIOLATION & ACCOUNT HANDLING')
          }
        </HeaderTitle>
        <HeaderMeta>
          <MetaTag>{vi ? 'Áp dụng: Tất cả người dùng' : 'Applies to: All users'}</MetaTag>
          <MetaTag>{vi ? 'Nền tảng: Web & App' : 'Platform: Web & App'}</MetaTag>
        </HeaderMeta>

        <TabRow>
          <Tab $active={tab === 'general'} onClick={() => setTab('general')}>
            <ListChecks size={13} />
            {vi ? '01 · Chung' : '01 · General'}
          </Tab>
          <Tab $active={tab === 'privacy'} onClick={() => setTab('privacy')}>
            <Shield size={13} />
            {vi ? '02 · Bảo Mật' : '02 · Privacy'}
          </Tab>
          <Tab $active={tab === 'candidate'} onClick={() => setTab('candidate')}>
            <Users size={13} />
            {vi ? '03 · Ứng Viên' : '03 · Candidate'}
          </Tab>
          <Tab $active={tab === 'employer'} onClick={() => setTab('employer')}>
            <Users size={13} />
            {vi ? '04 · Nhà Tuyển Dụng' : '04 · Employer'}
          </Tab>
          <Tab $active={tab === 'fees'} onClick={() => setTab('fees')}>
            <Scale size={13} />
            {vi ? '05/06 · Phí & Hoa Hồng' : '05/06 · Fees & Comms'}
          </Tab>
          <Tab $active={tab === 'ads'} onClick={() => setTab('ads')}>
            <Flag size={13} />
            {vi ? '07 · Quảng Cáo' : '07 · Ads'}
          </Tab>
          <Tab $active={tab === 'cancellation'} onClick={() => setTab('cancellation')}>
            <AlertTriangle size={13} />
            {vi ? '08 · Hủy & Tranh Chấp' : '08 · Disputes'}
          </Tab>
          <Tab $active={tab === 'violation'} onClick={() => setTab('violation')}>
            <AlertOctagon size={13} />
            {vi ? '09 · Vi Phạm' : '09 · Violation'}
          </Tab>
        </TabRow>
      </Header>

      <Container>

        {/* 01 — ĐIỀU KHOẢN CHUNG */}
        {tab === 'general' && (
          <>
            <Card $isDark={isDarkMode}>
              <HighlightBox $isDark={isDarkMode}>
                {vi
                  ? 'Khi đăng ký và sử dụng Ốp Pờ, bạn đồng ý tuân thủ toàn bộ các điều khoản dưới đây. Vui lòng đọc kỹ trước khi bắt đầu nhé!'
                  : 'By registering and using Ốp Pờ, you agree to comply with all the terms below. Please read carefully before starting!'}
              </HighlightBox>
            </Card>

            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <ListChecks size={19} />
                {vi ? '1. Phạm vi áp dụng' : '1. Scope of Application'}
              </SectionTitle>
              <P $isDark={isDarkMode}>
                {vi 
                  ? 'Điều khoản này áp dụng cho tất cả người dùng truy cập và sử dụng nền tảng Ốp Pờ, bao gồm:' 
                  : 'These terms apply to all users accessing and using the Ốp Pờ platform, including:'}
              </P>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Ứng viên tìm kiếm việc làm thời vụ trong ngành F&B.' : 'Candidates seeking seasonal F&B jobs.'}</li>
                <li>{vi ? 'Nhà tuyển dụng đăng tin và tuyển nhân sự thời vụ.' : 'Employers posting jobs and hiring seasonal staff.'}</li>
                <li>{vi ? 'Người dùng khách (chưa đăng ký) chỉ xem nội dung công khai.' : 'Guest users (unregistered) viewing public content only.'}</li>
              </UL>
            </Card>

            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <UserCheck size={19} />
                {vi ? '2. Điều kiện sử dụng' : '2. Conditions of Use'}
              </SectionTitle>
              <SubTitle $isDark={isDarkMode}>{vi ? '2.1 Về độ tuổi' : '2.1 Age Requirements'}</SubTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Ứng viên: Từ đủ 18 tuổi trở lên.' : 'Candidates: 18 years and older.'}</li>
                <li>{vi ? 'Nhà tuyển dụng: Phải đủ 18 tuổi trở lên hoặc là đại diện hợp pháp của tổ chức/doanh nghiệp.' : 'Employers: 18+ or legal representative.'}</li>
              </UL>
              <SubTitle $isDark={isDarkMode}>{vi ? '2.2 Về tài khoản' : '2.2 Account Rules'}</SubTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Mỗi cá nhân hoặc doanh nghiệp chỉ được tạo và duy trì một (01) tài khoản hoạt động.' : 'One active account per individual/business.'}</li>
                <li>{vi ? 'Việc tạo nhiều tài khoản nhằm mục đích gian lận là hành vi vi phạm nghiêm trọng.' : 'Fraudulent multiple accounts are a serious violation.'}</li>
                <li>{vi ? 'Thông tin đăng ký phải trung thực, đầy đủ và được cập nhật kịp thời.' : 'Info must be honest, complete, and updated.'}</li>
              </UL>
              <SubTitle $isDark={isDarkMode}>{vi ? '2.3 Về bảo mật tài khoản' : '2.3 Account Security'}</SubTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Người dùng có trách nhiệm bảo mật thông tin đăng nhập.' : 'Users are responsible for login security.'}</li>
                <li>{vi ? 'Mọi hành động phát sinh từ tài khoản đều thuộc trách nhiệm của chủ tài khoản.' : 'Account holder is responsible for all account actions.'}</li>
              </UL>
            </Card>

            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <Scale size={19} />
                {vi ? '3. Quyền & trách nhiệm của người dùng' : '3. User Rights & Responsibilities'}
              </SectionTitle>
              <SubTitle $isDark={isDarkMode}>{vi ? '3.1 Quyền của người dùng' : '3.1 User Rights'}</SubTitle>
              <P $isDark={isDarkMode}>{vi ? 'Người dùng có quyền:' : 'Users have the right to:'}</P>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Sử dụng đầy đủ tính năng của nền tảng theo đúng mục đích được thiết kế.' : 'Use all platform features as designed.'}</li>
                <li>{vi ? 'Báo cáo nội dung vi phạm, hành vi gian lận hoặc người dùng có dấu hiệu lừa đảo.' : 'Report violating content, fraud, or suspicious users.'}</li>
                <li>{vi ? 'Yêu cầu hỗ trợ, giải thích và khiếu nại khi không đồng ý với quyết định xử lý từ Ốp Pờ.' : 'Request support, clarification, and appeal decisions.'}</li>
                <li>{vi ? 'Yêu cầu xóa tài khoản và toàn bộ dữ liệu cá nhân theo quy định bảo mật.' : 'Request deletion of account and personal data.'}</li>
              </UL>
              <SubTitle $isDark={isDarkMode}>{vi ? '3.2 Trách nhiệm và nghĩa vụ của người dùng' : '3.2 User Responsibilities'}</SubTitle>
              <WarnBox $isDark={isDarkMode}>
                <UL $isDark={isDarkMode} style={{ margin: 0, color: 'inherit' }}>
                  <li>{vi ? 'Không sử dụng nền tảng cho mục đích bất hợp pháp, gian lận hoặc gây hại đến người dùng khác.' : 'No illegal, fraudulent, or harmful use.'}</li>
                  <li>{vi ? 'Không đăng tải thông tin sai lệch, thông tin mang tính kỳ thị, phân biệt đối xử.' : 'No false or discriminatory information.'}</li>
                  <li>{vi ? 'Không sao chép, phân phối hoặc khai thác dữ liệu vì mục đích thương mại khi chưa được đồng ý.' : 'No unauthorized commercial data exploitation.'}</li>
                  <li>{vi ? 'Không can thiệp vào hệ thống kỹ thuật, cố tình làm chậm hoặc phá hoại hoạt động.' : 'No technical interference or disruption.'}</li>
                </UL>
              </WarnBox>
            </Card>

            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                < Shield size={19} />
                {vi ? '4. Quyền của Ốp Pờ' : "4. Ốp Pờ's Rights"}
              </SectionTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Điều chỉnh, bổ sung hoặc thay đổi điều khoản (thông báo trước ít nhất 03 ngày qua email hoặc app).' : 'Modify terms (at least 3 days notice via email/app).'}</li>
                <li>{vi ? 'Từ chối duyệt, ẩn hoặc gỡ bỏ nội dung không đáp ứng tiêu chuẩn cộng đồng mà không cần báo trước.' : 'Refuse, hide, or remove non-standard content without notice.'}</li>
                <li>{vi ? 'Tạm khóa hoặc xóa tài khoản vi phạm theo quy trình xử lý được nêu trong Chính sách Vi phạm.' : 'Temporarily lock or delete violating accounts per policy.'}</li>
                <li>{vi ? 'Thu thập và sử dụng dữ liệu người dùng theo Chính sách Bảo mật đã công bố.' : 'Collect and use user data per published Privacy Policy.'}</li>
              </UL>
            </Card>

            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <AlertTriangle size={19} />
                {vi ? '5. Giới hạn trách nhiệm' : '5. Limitation of Liability'}
              </SectionTitle>
              <P $isDark={isDarkMode}>
                {vi 
                  ? 'Ốp Pờ là nền tảng kết nối trung gian giữa ứng viên và nhà tuyển dụng. Chúng tôi KHÔNG chịu trách nhiệm pháp lý thay thế cho:' 
                  : 'Ốp Pờ is a connecting platform. We are NOT legally responsible for:'}
              </P>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Thỏa thuận lao động, mức lương, điều kiện làm việc giữa hai bên.' : 'Labor agreements, wages, work conditions.'}</li>
                <li>{vi ? 'Tranh chấp phát sinh ngoài phạm vi nền tảng hoặc sau khi kết thúc ca làm việc.' : 'Disputes outside the platform or after shifts.'}</li>
                <li>{vi ? 'Thiệt hại do sự cố kỹ thuật, mất kết nối internet hoặc các trường hợp bất khả kháng.' : 'Damages from tech failures, internet issues, or force majeure.'}</li>
              </UL>
            </Card>
          </>
        )}

        {/* 02 — BẢO MẬT & DỮ LIỆU */}
        {tab === 'privacy' && (
          <>
            <Card $isDark={isDarkMode}>
              <HighlightBox $isDark={isDarkMode}>
                {vi
                  ? 'Ốp Pờ hiểu rằng thông tin cá nhân của bạn rất quan trọng. Chúng mình cam kết bảo vệ dữ liệu của bạn một cách minh bạch và có trách nhiệm.'
                  : 'Ốp Pờ understands that your personal information is very important. We are committed to protecting your data transparently and responsibly.'}
              </HighlightBox>
            </Card>

            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <Database size={19} />
                {vi ? '1. Dữ liệu thu thập' : '1. Collected Data'}
              </SectionTitle>
              <SubTitle $isDark={isDarkMode}>{vi ? '1.1 Thông tin cung cấp trực tiếp' : '1.1 Information provided directly'}</SubTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Thông tin cá nhân cơ bản: họ tên, ngày sinh, giới tính, số điện thoại, địa chỉ email, CCCD.' : 'Basic info: full name, DOB, gender, phone, email, identity.'}</li>
                <li>{vi ? 'Thông tin nghề nghiệp: kinh nghiệm, kỹ năng, lịch sử công việc, CV/hồ sơ cá nhân.' : 'Professional: experience, skills, history, CV.'}</li>
                <li>{vi ? 'Thông tin doanh nghiệp (NTD): tên công ty, địa chỉ, mã số thuế, GPKD, thông tin đại diện pháp lý.' : 'Business: name, address, tax ID, license, rep info.'}</li>
                <li>{vi ? 'Nội dung trao đổi: tin nhắn, phản hồi, đánh giá trên nền tảng.' : 'Communications: messages, feedback, ratings.'}</li>
              </UL>
              <SubTitle $isDark={isDarkMode}>{vi ? '1.2 Dữ liệu tự động thu thập' : '1.2 Automatically collected data'}</SubTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Địa chỉ IP, loại thiết bị, hệ điều hành, phiên bản trình duyệt/app.' : 'IP, device, OS, browser version.'}</li>
                <li>{vi ? 'Lịch sử hoạt động: tìm kiếm, xem tin, thao tác ứng tuyển, thời gian truy cập.' : 'Activity: searches, views, applications, timing.'}</li>
                <li>{vi ? 'Dữ liệu vị trí (nếu được cho phép) để gợi ý tin phù hợp gần bạn.' : 'Location (if permitted) for nearby suggestions.'}</li>
              </UL>
            </Card>

            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <ListChecks size={19} />
                {vi ? '2. Mục đích sử dụng dữ liệu' : '2. Purpose of Data Use'}
              </SectionTitle>
              <TableWrapper $isDark={isDarkMode}>
                <Table $isDark={isDarkMode}>
                  <thead>
                    <tr>
                      <th>{vi ? 'Mục đích' : 'Purpose'}</th>
                      <th>{vi ? 'Chi tiết' : 'Details'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{vi ? 'Kết nối việc làm' : 'Job matching'}</td>
                      <td>{vi ? 'Kết nối ứng viên với nhà tuyển dụng phù hợp dựa trên kỹ năng, kinh nghiệm, vị trí địa lý' : 'Matching based on skills, experience, and location'}</td>
                    </tr>
                    <tr>
                      <td>{vi ? 'Cải thiện sản phẩm' : 'Product Improvement'}</td>
                      <td>{vi ? 'Phân tích hành vi người dùng để tối ưu tính năng và trải nghiệm nền tảng' : 'Analyze user behavior to optimize features and experience'}</td>
                    </tr>
                    <tr>
                      <td>{vi ? 'Thông báo & liên lạc' : 'Notifications & contact'}</td>
                      <td>{vi ? 'Gửi thông báo việc làm mới, cập nhật ứng tuyển, nhắc lịch tìm việc' : 'Send job alerts, application updates, and reminders'}</td>
                    </tr>
                    <tr>
                      <td>{vi ? 'Bảo mật hệ thống' : 'System security'}</td>
                      <td>{vi ? 'Phát hiện và ngăn chặn hành vi gian lận, lạm dụng nền tảng' : 'Detect and prevent fraud and abuse'}</td>
                    </tr>
                    <tr>
                      <td>{vi ? 'Tuân thủ pháp luật' : 'Legal Compliance'}</td>
                      <td>{vi ? 'Lưu trữ thông tin theo yêu cầu của cơ quan nhà nước có thẩm quyền' : 'Store information as required by competent state authorities'}</td>
                    </tr>
                  </tbody>
                </Table>
              </TableWrapper>
            </Card>

            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <Share2 size={19} />
                {vi ? '3. Chia sẻ dữ liệu' : '3. Data Sharing'}
              </SectionTitle>
              <P $isDark={isDarkMode}>{vi ? 'Ốp Pờ KHÔNG bán, trao đổi hoặc chia sẻ thông tin cá nhân của bạn vì mục đích thương mại. Chúng mình chỉ chia sẻ dữ liệu trong các trường hợp sau:' : 'Ốp Pờ does NOT sell or trade personal data for commercial purposes. We only share data in the following cases:'}</P>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Với nhà tuyển dụng: Thông tin hồ sơ được chia sẻ khi bạn chủ động ứng tuyển.' : 'With employers: Shared upon active application.'}</li>
                <li>{vi ? 'Với đối tác kỹ thuật: Các nhà cung cấp dịch vụ cloud, thanh toán, analytics được ràng buộc bởi hợp đồng bảo mật chặt chẽ.' : 'With technical partners: Cloud, payment, and analytics providers bound by strict confidentiality agreements.'}</li>
                <li>{vi ? 'Theo yêu cầu pháp lý: Khi có yêu cầu từ cơ quan nhà nước có thẩm quyền theo quy định pháp luật Việt Nam.' : 'Legal: Regulatory requests under Vietnamese law.'}</li>
              </UL>
            </Card>

            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <UserCheck size={19} />
                {vi ? '4. Quyền của người dùng với dữ liệu' : '4. User rights to data'}
              </SectionTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Quyền truy cập: Bạn có thể xem toàn bộ dữ liệu cá nhân mà Ốp Pờ đang lưu trữ về bạn.' : 'Access: View all personal data Ốp Pờ stores about you.'}</li>
                <li>{vi ? 'Quyền chỉnh sửa: Cập nhật hoặc sửa thông tin sai lệch trực tiếp trong phần Cài đặt tài khoản.' : 'Rectification: Update or fix info in Account Settings.'}</li>
                <li>{vi ? 'Quyền xóa: Yêu cầu xóa tài khoản và toàn bộ dữ liệu. Chúng mình sẽ xử lý trong vòng 30 ngày.' : 'Erasure: Request account and data deletion within 30 days.'}</li>
                <li>{vi ? 'Quyền từ chối: Hủy đăng ký nhận email marketing bất kỳ lúc nào bằng link Unsubscribe trong email.' : 'Object: Unsubscribe from marketing anytime via link.'}</li>
                <li>{vi ? 'Quyền di chuyển dữ liệu: Yêu cầu xuất dữ liệu cá nhân dưới định dạng có thể đọc được.' : 'Data Portability: Request data export in a readable format.'}</li>
              </UL>
            </Card>

            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <Lock size={19} />
                {vi ? '5. Cam kết bảo mật kỹ thuật' : '5. Technical security commitment'}
              </SectionTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Toàn bộ dữ liệu được mã hóa (HTTPS/TLS) trong quá trình truyền tải và lưu trữ.' : 'All data encrypted (HTTPS/TLS) during transmission and storage.'}</li>
                <li>{vi ? 'Hệ thống được kiểm tra bảo mật định kỳ và có cơ chế phát hiện xâm nhập tự động.' : 'Regular security audits and automated intrusion detection.'}</li>
                <li>{vi ? 'Ốp Pờ KHÔNG lưu trữ thông tin thẻ tín dụng/ghi nợ mọi giao dịch được xử lý qua cổng thanh toán bên thứ ba đạt chuẩn PCI-DSS.' : 'Ốp Pờ does NOT store credit/debit card info; transactions processed via PCI-DSS compliant third-party gateways.'}</li>
                <li>{vi ? 'Trong trường hợp xảy ra sự cố rò rỉ dữ liệu, Ốp Pờ cam kết thông báo đến người dùng bị ảnh hưởng trong vòng 72 giờ.' : 'Notification to affected users within 72 hours in case of data breach.'}</li>
              </UL>
            </Card>
          </>
        )}

        {/* 03 — DÀNH CHO ỨNG VIÊN */}
        {tab === 'candidate' && (
          <>
            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <Users size={19} />
                {vi ? '1. Đồ hồ sơ & Ứng tuyển' : '1. Profile & Application'}
              </SectionTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Đăng ký tài khoản hoàn toàn MIỄN PHÍ.' : 'Registration is completely FREE.'}</li>
                <li>{vi ? 'Mỗi cá nhân chỉ được một tài khoản duy nhất.' : 'Only one account per person.'}</li>
                <li>{vi ? 'Hồ sơ phải trung thực, ảnh rõ mặt.' : 'Honest profile, clear photo.'}</li>
              </UL>
            </Card>
            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <CheckCircle size={19} />
                {vi ? '2. Quyền lợi' : '2. Benefits'}
              </SectionTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Xem đầy đủ lương, địa điểm, mô tả trước khi ứng tuyển.' : 'View full salary, location, description.'}</li>
                <li>{vi ? 'Được Ốp Pờ hỗ trợ hòa giải tranh chấp lương.' : 'Mediation support for wage disputes.'}</li>
              </UL>
            </Card>
          </>
        )}

        {/* 04 — DÀNH CHO NHÀ TUYỂN DỤNG */}
        {tab === 'employer' && (
          <>
            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <Users size={19} />
                {vi ? '1. Đăng ký & Xét duyệt' : '1. registration & Approval'}
              </SectionTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'DN/Hộ kinh doanh khớp với giấy tờ pháp lý.' : 'Matching business legal docs.'}</li>
                <li>{vi ? 'Hồ sơ được duyệt trong 24h làm việc.' : 'Approval within 24 business hours.'}</li>
              </UL>
            </Card>
            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <FileText size={19} />
                {vi ? '2. Đăng tin tuyển dụng' : '2. Job Posting'}
              </SectionTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Đăng tin thường Miễn phí không giới hạn.' : 'Unlimited free regular posts.'}</li>
                <li>{vi ? 'Không đăng tin giả, yêu cầu nộp cọc/phí.' : 'No fake jobs or deposit requests.'}</li>
              </UL>
            </Card>
          </>
        )}

        {/* 05/06 — PHÍ & HOA HỒNG */}
        {tab === 'fees' && (
          <>
            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <Scale size={19} />
                {vi ? '1. Bảng phí dịch vụ' : '1. Service Fee Table'}
              </SectionTitle>
              <TableWrapper $isDark={isDarkMode}>
                <Table $isDark={isDarkMode}>
                  <thead>
                    <tr>
                      <th>{vi ? 'Dịch vụ' : 'Service'}</th>
                      <th>{vi ? 'Mức phí' : 'Fee'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>{vi ? 'Đăng ký tài khoản' : 'Account Registration'}</td><td>{vi ? 'Miễn phí' : 'Free'}</td></tr>
                    <tr><td>{vi ? 'Đăng tin thông thường' : 'Regular Posting'}</td><td>{vi ? 'Miễn phí' : 'Free'}</td></tr>
                    <tr><td>{vi ? 'Job Gấp (Hoa hồng)' : 'Urgent Job (Comms)'}</td><td>15%</td></tr>
                  </tbody>
                </Table>
              </TableWrapper>
            </Card>
            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <Lock size={19} />
                {vi ? '2. Hoa hồng Job Gấp' : '2. Urgent Job commission'}
              </SectionTitle>
              <HighlightBox $isDark={isDarkMode}>
                {vi ? 'Phí hoa hồng 15% được tính trên tổng lương ca và KHÔNG hoàn lại một khi đã đăng tin.' : '15% fee on total shift wages, non-refundable once posted.'}
              </HighlightBox>
            </Card>
          </>
        )}

        {/* 07 — QUẢNG CÁO */}
        {tab === 'ads' && (
          <>
            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <Flag size={19} />
                {vi ? 'Hình thức quảng cáo' : 'Ad Types'}
              </SectionTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Tin Nổi Bật: Top danh sách top trang chủ.' : 'Featured: Top of list.'}</li>
                <li>{vi ? 'Banner Trang Chủ: Tăng nhận diện thương hiệu.' : 'Home Banner: Brand awareness.'}</li>
                <li>{vi ? 'Quảng cáo Target: Theo khu vực và kỹ năng.' : 'Targeted Ads: Area/Skills.'}</li>
              </UL>
            </Card>
          </>
        )}

        {/* 08 — HỦY & TRANH CHẤP */}
        {tab === 'cancellation' && (
          <>
            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <AlertTriangle size={19} />
                {vi ? '1. Chính sách hủy ca' : '1. Cancellation Policy'}
              </SectionTitle>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Ứng viên hủy sau 5h: Trừ điểm uy tín nặng.' : 'Cancel <5h: Severe penalty.'}</li>
                <li>{vi ? 'NTD hủy Job Gấp: Chỉ hoàn 85% lương (giữ 15% hoa hồng).' : 'NTD cancel Urgent Job: Only 85% wage refund.'}</li>
              </UL>
            </Card>
            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <Scale size={19} />
                {vi ? '2. Giải quyết tranh chấp' : '2. Dispute Resolution'}
              </SectionTitle>
              <P $isDark={isDarkMode}>{vi ? 'Báo cáo tranh chấp trực tiếp qua app kèm bằng chứng.' : 'Report disputes via app with evidence.'}</P>
              <HighlightBox $isDark={isDarkMode}>{vi ? 'Ốp Pờ phản hồi và đề xuất hòa giải trong 4-24h.' : 'Response and mediation within 4-24h.'}</HighlightBox>
            </Card>
          </>
        )}

        {/* 09 — VI PHẠM & XỬ LÝ */}
        {tab === 'violation' && (
          <>
            <Card $isDark={isDarkMode}>
              <HighlightBox $isDark={isDarkMode}>
                {vi
                  ? 'Ốp Pờ xây dựng cộng đồng tuyển dụng dựa trên sự tin tưởng. Chúng mình cam kết xử lý nghiêm mọi hành vi gian lận hoặc gây hại để bảo vệ tất cả người dùng.'
                  : 'Ốp Pờ builds a recruitment community based on trust. We commit to handling all fraud or harmful behavior strictly to protect all users.'}
              </HighlightBox>
            </Card>

            {/* 1. Phân loại vi phạm */}
            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <AlertOctagon size={19} />
                {vi ? '1. Phân loại vi phạm' : '1. Violation Classification'}
              </SectionTitle>

              <LevelCard $isDark={isDarkMode} $color="#ef4444" $bg={isDarkMode ? 'rgba(239,68,68,0.12)' : '#fff1f2'}>
                <div className="lvl-title">
                  <AlertOctagon size={18} />
                  {vi ? 'Vi phạm Cấp độ 1 - Nghiêm trọng (Khóa vĩnh viễn)' : 'Level 1 - Critical (Permanent Ban)'}
                </div>
                <UL $isDark={isDarkMode} style={{ margin: 0 }}>
                  <li>{vi ? 'Đăng tin giả, lừa đảo ứng viên; yêu cầu ứng viên nộp tiền cọc/phí dưới mọi hình thức.' : 'Fake jobs; requiring deposits/fees in any form.'}</li>
                  <li>{vi ? 'Quấy rối, hành vi bạo lực hoặc đe dọa người dùng.' : 'Harassment, violence, or threats.'}</li>
                  <li>{vi ? 'Tạo nhiều tài khoản giả để thao túng điểm uy tín/đánh giá.' : 'Fake accounts to manipulate reputation/ratings.'}</li>
                  <li>{vi ? 'Nội dung vi phạm pháp luật: bạo lực, khiêu dâm, phân biệt đối xử.' : 'Illegal content: violence, porn, discrimination.'}</li>
                </UL>
              </LevelCard>

              <LevelCard $isDark={isDarkMode} $color="#f59e0b" $bg={isDarkMode ? 'rgba(245,158,11,0.12)' : '#fffbeb'}>
                <div className="lvl-title">
                  <AlertTriangle size={18} />
                  {vi ? 'Vi phạm Cấp độ 2 - Trung bình (Tạm khóa 7 ngày)' : 'Level 2 - Medium (7-day Ban)'}
                </div>
                <UL $isDark={isDarkMode} style={{ margin: 0 }}>
                  <li>{vi ? 'Thông tin tuyển dụng sai lệch (lương thực tế thấp hơn, địa chỉ sai...).' : 'Misleading info (lower pay, wrong address...).'}</li>
                  <li>{vi ? 'Không phản hồi ứng viên sau khi match; hủy ca muộn nhiều lần.' : 'No response after match; frequent late cancellations.'}</li>
                  <li>{vi ? 'Đánh giá sai sự thật với mục đích phá hoại.' : 'Malicious false ratings/reviews.'}</li>
                </UL>
              </LevelCard>

              <LevelCard $isDark={isDarkMode} $color="#10b981" $bg={isDarkMode ? 'rgba(16,185,129,0.12)' : '#f0fdf4'}>
                <div className="lvl-title">
                  <Info size={18} />
                  {vi ? 'Vi phạm Cấp độ 3 - Nhẹ (Nhắc nhở)' : 'Level 3 - Low (Reminder)'}
                </div>
                <UL $isDark={isDarkMode} style={{ margin: 0 }}>
                  <li>{vi ? 'Hồ sơ thiếu thông tin; ảnh đại diện không đạt chuẩn.' : 'Incomplete profile; standard-less profile photo.'}</li>
                  <li>{vi ? 'Nội dung tin tuyển dụng chưa đầy đủ; không cập nhật trạng thái tin.' : 'Incomplete job content; no status updates.'}</li>
                  <li>{vi ? 'Hủy ca muộn lần đầu (chưa đến mức cảnh cáo).' : 'First-time late cancellation.'}</li>
                </UL>
              </LevelCard>
            </Card>

            {/* 2. Quy trình xử lý */}
            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <ListChecks size={19} />
                {vi ? '2. Quy trình xử lý vi phạm' : '2. Violation Handling Process'}
              </SectionTitle>
              <TableWrapper $isDark={isDarkMode}>
                <Table $isDark={isDarkMode}>
                  <thead>
                    <tr>
                      <th>{vi ? 'Bước' : 'Step'}</th>
                      <th>{vi ? 'Hành động' : 'Action'}</th>
                      <th>{vi ? 'Thời gian' : 'Time'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>{vi ? 'Tiếp nhận báo cáo/Hệ thống phát hiện' : 'Report received / System detection'}</td>
                      <td>{vi ? 'Ngay lập tức' : 'Immediate'}</td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td>{vi ? 'Xác minh và xem xét bằng chứng' : 'Verification and evidence review'}</td>
                      <td>{vi ? 'Trong 24 giờ' : 'Within 24h'}</td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td>{vi ? 'Ra quyết định và thông báo' : 'Decision and Notification'}</td>
                      <td>{vi ? 'Trong 48 giờ' : 'Within 48h'}</td>
                    </tr>
                    <tr>
                      <td>4</td>
                      <td>{vi ? 'Thực thi quyết định' : 'Execution'}</td>
                      <td>{vi ? 'Tức thì' : 'Immediate'}</td>
                    </tr>
                  </tbody>
                </Table>
              </TableWrapper>
            </Card>

            {/* 3. Khiếu nại */}
            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <MessageSquare size={19} />
                {vi ? '3. Khiếu nại quyết định xử lý' : '3. Appeal Process'}
              </SectionTitle>
              <P $isDark={isDarkMode}>{vi ? 'Bạn có quyền khiếu nại trong 5 ngày làm việc qua email hỗ trợ.' : 'You can appeal within 5 business days via support email.'}</P>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Tiêu đề: Khiếu nại xử lý tài khoản – [Tên tài khoản] – [Ngày quyết định].' : 'Subject: Account Appeal – [Name] – [Date].'}</li>
                <li>{vi ? 'Đính kèm bằng chứng phản bác (ảnh, tin nhắn, video...).' : 'Attach counter-evidence (screenshots, messages...).'}</li>
                <li>{vi ? 'Ốp Pờ phản hồi trong vòng 3 ngày làm việc.' : 'Response within 3 business days.'}</li>
              </UL>
              <HighlightBox $isDark={isDarkMode}>{vi ? 'Quyết định sau khiếu nại là quyết định cuối cùng.' : 'Decisions after appeal are final.'}</HighlightBox>
            </Card>

            {/* 4. Báo cáo */}
            <Card $isDark={isDarkMode}>
              <SectionTitle $isDark={isDarkMode}>
                <Flag size={19} />
                {vi ? '4. Báo cáo vi phạm' : '4. Reporting Violations'}
              </SectionTitle>
              <P $isDark={isDarkMode}>{vi ? 'Hãy giúp cộng đồng an toàn hơn bằng cách:' : 'Help keep the community safe by:'}</P>
              <UL $isDark={isDarkMode}>
                <li>{vi ? 'Nhấn nút Báo cáo trực tiếp trên tin, hồ sơ hoặc tin nhắn.' : 'Click Report directly on post, profile, or message.'}</li>
                <li>{vi ? 'Mô tả sự việc và đính kèm bằng chứng nếu có.' : 'Describe and attach evidence if any.'}</li>
              </UL>
              <SuccessBox $isDark={isDarkMode}>{vi ? 'Thông tin báo cáo được bảo mật danh tính tuyệt đối.' : 'Reporter identity is strictly confidential.'}</SuccessBox>
            </Card>
          </>
        )}

        <FooterBox $isDark={isDarkMode}>
          {vi
            ? 'Tài liệu có hiệu lực kề từ ngày ban hành • Cập nhật tháng 6/2026'
            : 'Document effective from issue date • Updated June 2026'}
          <br />
          <Link to="/register">{vi ? 'Đăng ký ngay' : 'Register now'}</Link>
          {' · '}
          <Link to="/policy">{vi ? 'Điều khoản chung' : 'General Terms'}</Link>

          <div className="slogan">
            {vi ? 'ỐP PỜ - BẠN VỪA BỊ ĐUỔI & ĐÃ CÓ ỐP PỜ LO' : 'ỐP PỜ - JUST GOT FIRED? ỐP PỜ GOT YOU'}
          </div>
        </FooterBox>
      </Container>
    </Wrapper>
  );
};

export default RegisterPolicyPage;
