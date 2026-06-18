import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { s3Images } from '../../utils/s3Images';
import { ArrowLeft, Database, ListChecks, Share2, UserCheck, Lock } from 'lucide-react';

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

const TableWrapper = styled.div`
  overflow-x: auto;
  margin: 12px 0;
  border-radius: 12px;
  border: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.4)' : '#e2e8f0'};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  
  th, td {
    padding: 12px 14px;
    text-align: left;
    border-bottom: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.4)' : '#f1f5f9'};
    line-height: 1.6;
  }

  th {
    background: ${p => p.$isDark ? 'rgba(26,98,255,0.1)' : '#f8fafc'};
    color: ${p => p.$isDark ? '#1a62ff' : '#1e40af'};
    font-weight: 700;
  }

  tr:last-child td { border-bottom: none; }
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

const FooterBox = styled.div`
  text-align: center;
  font-size: 0.8rem;
  color: ${p => p.$isDark ? '#475569' : '#94a3b8'};
  margin-top: 32px;
  line-height: 1.7;
`;

const EmployerPrivacyPage = () => {
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
          {vi ? 'CHÍNH SÁCH BẢO MẬT & DỮ LIỆU CÁ NHÂN' : 'PRIVACY & PERSONAL DATA POLICY'}
        </HeaderTitle>
        <HeaderMeta>
          <MetaTag>{vi ? 'Dành cho: Nhà tuyển dụng' : 'For: Employers'}</MetaTag>
          <MetaTag>{vi ? 'Tuân thủ: Nghị định 13/2023/NĐ-CP' : 'Compliance: Decree 13/2023/ND-CP'}</MetaTag>
        </HeaderMeta>
      </Header>

      <Container>
        <Card $isDark={isDarkMode}>
          <HighlightBox $isDark={isDarkMode}>
             {vi 
               ? 'Ốp Pờ cam kết bảo vệ dữ liệu của Nhà tuyển dụng một cách minh bạch và an toàn tuyệt đối theo tiêu chuẩn pháp luật hiện hành.'
               : 'Ốp Pờ is committed to protecting Employer data transparently and securely according to current legal standards.'}
          </HighlightBox>
        </Card>

        {/* 1. Dữ liệu thu thập */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Database size={19} />
            {vi ? '1. Dữ liệu thu thập' : '1. Collected Data'}
          </SectionTitle>
          <SubTitle $isDark={isDarkMode}>{vi ? '1.1 Thông tin doanh nghiệp' : '1.1 Business context'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Tên công ty/hộ kinh doanh, mã số thuế, địa chỉ trụ sở, website.' : 'Company name, tax ID, headquarters address, website.'}</li>
            <li>{vi ? 'Thông tin người đại diện: họ tên, số điện thoại, email, CCCD.' : 'Representative info: full name, phone, email, ID.'}</li>
            <li>{vi ? 'Giấy phép kinh doanh và các chứng từ pháp lý khác phục vụ xác thực.' : 'Business license and other legal documents for verification.'}</li>
          </UL>
          <SubTitle $isDark={isDarkMode}>{vi ? '1.2 Dữ liệu hoạt động' : '1.2 Activity data'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Lịch sử đăng tin, quản lý ca làm việc, tương tác với ứng viên.' : 'Posting history, shift management, interaction with candidates.'}</li>
            <li>{vi ? 'Thông tin thanh toán và lịch sử giao dịch nạp xu/mua gói cước.' : 'Payment info and transaction history for coins/packages.'}</li>
          </UL>
        </Card>

        {/* 2. Mục đích sử dụng dữ liệu */}
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
                  <td>{vi ? 'Xác thực tài khoản' : 'Account verification'}</td>
                  <td>{vi ? 'Đảm bảo Nhà tuyển dụng có thật và hoạt động hợp pháp' : 'Ensure legitimate business operations'}</td>
                </tr>
                <tr>
                  <td>{vi ? 'Cải thiện sản phẩm' : 'Product Improvement'}</td>
                  <td>{vi ? 'Phân tích hành vi người dùng để tối ưu tính năng và trải nghiệm nền tảng' : 'Analyze user behavior to optimize features and experience'}</td>
                </tr>
                <tr>
                  <td>{vi ? 'Vận hành dịch vụ' : 'Service operation'}</td>
                  <td>{vi ? 'Hỗ trợ đăng tin, tìm kiếm và gợi ý ứng viên phù hợp' : 'Support posting, search, and matching'}</td>
                </tr>
                <tr>
                   <td>{vi ? 'Xử lý thanh toán' : 'Payment processing'}</td>
                   <td>{vi ? 'Thực hiện các giao dịch nạp tiền và xuất hóa đơn dịch vụ' : 'Execute top-ups and issue service invoices'}</td>
                </tr>
                <tr>
                   <td>{vi ? 'Tuân thủ pháp luật' : 'Legal Compliance'}</td>
                   <td>{vi ? 'Lưu trữ thông tin theo yêu cầu của cơ quan nhà nước có thẩm quyền' : 'Store information as required by competent state authorities'}</td>
                </tr>
              </tbody>
            </Table>
          </TableWrapper>
        </Card>

        {/* 3. Chia sẻ dữ liệu */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Share2 size={19} />
            {vi ? '3. Chia sẻ dữ liệu' : '3. Data sharing'}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Với ứng viên: Thông tin liên hệ công sở được hiển thị trong tin tuyển dụng.' : 'With candidates: Business contact info displayed in job posts.'}</li>
            <li>{vi ? 'Với đối tác kỹ thuật: Các nhà cung cấp dịch vụ cloud, thanh toán, analytics được ràng buộc bởi hợp đồng bảo mật chặt chẽ.' : 'With technical partners: Cloud, payment, and analytics providers bound by strict confidentiality agreements.'}</li>
            <li>{vi ? 'Theo yêu cầu pháp lý: Khi có yêu cầu từ cơ quan nhà nước có thẩm quyền theo quy định pháp luật Việt Nam.' : 'Legal: Regulatory requests under Vietnamese law.'}</li>
          </UL>
        </Card>

        {/* 4. Quyền của người dùng */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <UserCheck size={19} />
            {vi ? '4. Quyền của người dùng đối với dữ liệu' : "4. User rights to data"}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Quyền truy cập: Bạn có thể xem toàn bộ dữ liệu cá nhân mà Ốp Pờ đang lưu trữ về bạn.' : 'Access: View all personal data Ốp Pờ stores about you.'}</li>
            <li>{vi ? 'Quyền chỉnh sửa: Cập nhật hoặc sửa thông tin sai lệch trực tiếp trong phần Cài đặt tài khoản.' : 'Rectification: Update or fix info in Account Settings.'}</li>
            <li>{vi ? 'Quyền xóa: Yêu cầu xóa tài khoản và toàn bộ dữ liệu. Chúng mình sẽ xử lý trong vòng 30 ngày.' : 'Erasure: Request account and data deletion within 30 days.'}</li>
            <li>{vi ? 'Quyền từ chối: Hủy đăng ký nhận email marketing bất kỳ lúc nào bằng link Unsubscribe trong email.' : 'Object: Unsubscribe from marketing anytime via link.'}</li>
            <li>{vi ? 'Quyền di chuyển dữ liệu: Yêu cầu xuất dữ liệu cá nhân dưới định dạng có thể đọc được.' : 'Data Portability: Request data export in a readable format.'}</li>
          </UL>
        </Card>

        {/* 5. Cam kết bảo mật */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Lock size={19} />
            {vi ? '5. Cam kết bảo mật kỹ thuật' : '5. Technical security commitment'}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Dữ liệu doanh nghiệp được lưu trữ trên hạ tầng điện toán đám mây bảo mật cao.' : 'Business data stored on highly secure cloud infrastructure.'}</li>
            <li>{vi ? 'Mã hóa thông tin nhạy cảm và kiểm soát truy cập nghiêm ngặt.' : 'Encryption of sensitive info and strict access control.'}</li>
            <li>{vi ? 'Ốp Pờ KHÔNG lưu trữ thông tin thẻ tín dụng/ghi nợ mọi giao dịch được xử lý qua cổng thanh toán bên thứ ba đạt chuẩn PCI-DSS.' : 'Ốp Pờ does NOT store credit/debit card info; transactions processed via PCI-DSS compliant third-party gateways.'}</li>
            <li>{vi ? 'Hệ thống được kiểm tra bảo mật định kỳ và có cơ chế phát hiện xâm nhập tự động.' : 'Regular security audits and automated intrusion detection.'}</li>
            <li>{vi ? 'Trong trường hợp xảy ra sự cố rò rỉ dữ liệu, Ốp Pờ cam kết thông báo đến người dùng bị ảnh hưởng trong vòng 72 giờ.' : 'Notification to affected users within 72 hours in case of data breach.'}</li>
          </UL>
        </Card>

        <FooterBox $isDark={isDarkMode}>
          {vi
            ? 'Tài liệu dành cho Nhà tuyển dụng • Cập nhật tháng 6/2026'
            : 'For Employers • Updated June 2026'}
        </FooterBox>
      </Container>
    </Wrapper>
  );
};

export default EmployerPrivacyPage;
