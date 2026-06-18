import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { s3Images } from '../utils/s3Images';
import {
  ArrowLeft, CreditCard, Wallet, Receipt,
  ShieldCheck, HelpCircle, Info, Landmark,
  Banknote, History, CheckCircle, AlertTriangle
} from 'lucide-react';

/* 
  Note: I'll use Wallet, Receipt, Info, Banknote, History, CheckCircle, AlertTriangle.
  Wait, I'll use standard names verified before: HelpCircle, AlertTriangle.
*/

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
     padding: 12px 14px;
     font-weight: 700;
     border-bottom: 1.5px solid ${p => p.$isDark ? 'rgba(26,98,255,0.2)' : '#dbeafe'};
  }
  
  td {
    padding: 12px 14px;
    border-bottom: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.2)' : '#f1f5f9'};
    color: ${p => p.$isDark ? '#94a3b8' : '#475569'};
    line-height: 1.6;
    vertical-align: middle;
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

const TermsUrgentJobs = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const vi = language === 'vi';

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
          {vi ? 'CHÍNH SÁCH 05: PHÍ & THANH TOÁN' : 'POLICY 05: FEES & PAYMENTS'}
        </HeaderTitle>
        <HeaderSub>
          {vi
            ? 'Áp dụng cho: Nhà tuyển dụng sử dụng dịch vụ trả phí'
            : 'Applies to: Employers using paid services'}
        </HeaderSub>
        <HeaderMeta>
          <MetaTag>{vi ? 'Cập nhật: 2025' : 'Updated: 2025'}</MetaTag>
          <MetaTag>{vi ? 'Mô hình: Freemium' : 'Model: Freemium'}</MetaTag>
        </HeaderMeta>
      </Header>

      <Container>
        <Card $isDark={isDarkMode}>
          <HighlightBox $isDark={isDarkMode}>
            {vi
              ? 'Ốp Pờ hoạt động theo mô hình freemium, ứng viên và nhà tuyển dụng đều được dùng miễn phí các tính năng cơ bản. Phí chỉ phát sinh khi bạn muốn tăng hiệu quả tuyển dụng.'
              : 'Ốp Pờ operates on a freemium model, candidates and employers get free basic features. Fees only apply when you want to increase recruitment efficiency.'}
          </HighlightBox>
        </Card>

        {/* 1. Bảng tổng quan phí dịch vụ */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Banknote size={19} />
            {vi ? '1. Bảng tổng quan phí dịch vụ' : '1. Service Fee Overview'}
          </SectionTitle>
          <TableWrapper $isDark={isDarkMode}>
            <Table $isDark={isDarkMode}>
              <thead>
                <tr>
                  <th>{vi ? 'Dịch vụ' : 'Service'}</th>
                  <th>{vi ? 'Đối tượng' : 'Target'}</th>
                  <th>{vi ? 'Mức phí' : 'Fee'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{vi ? 'Đăng ký tài khoản ứng viên' : 'Candidate registration'}</td>
                  <td>{vi ? 'Ứng viên' : 'Candidate'}</td>
                  <td><strong style={{color: '#10b981'}}>{vi ? 'Miễn phí' : 'Free'}</strong></td>
                </tr>
                <tr>
                  <td>{vi ? 'Đăng ký tài khoản nhà tuyển dụng' : 'Employer registration'}</td>
                  <td>{vi ? 'Nhà tuyển dụng' : 'Employer'}</td>
                  <td><strong style={{color: '#10b981'}}>{vi ? 'Miễn phí' : 'Free'}</strong></td>
                </tr>
                <tr>
                  <td>{vi ? 'Đăng tin tuyển dụng thông thường' : 'Standard job posting'}</td>
                  <td>{vi ? 'Nhà tuyển dụng' : 'Employer'}</td>
                  <td><strong style={{color: '#10b981'}}>{vi ? 'Miễn phí' : 'Free'}</strong></td>
                </tr>
                <tr>
                  <td>{vi ? 'Ứng tuyển vào bất kỳ vị trí nào' : 'Applying for any job'}</td>
                  <td>{vi ? 'Ứng viên' : 'Candidate'}</td>
                  <td><strong style={{color: '#10b981'}}>{vi ? 'Miễn phí' : 'Free'}</strong></td>
                </tr>
                <tr>
                  <td>{vi ? 'Đẩy tin lên Top trang chủ' : 'Boost post to Top'}</td>
                  <td>{vi ? 'Nhà tuyển dụng' : 'Employer'}</td>
                  <td>{vi ? 'Có phí (xem CS Quảng Cáo)' : 'Paid (see Ad Policy)'}</td>
                </tr>
                <tr>
                  <td>{vi ? 'Chạy quảng cáo tin tuyển dụng' : 'Run job advertising'}</td>
                  <td>{vi ? 'Nhà tuyển dụng' : 'Employer'}</td>
                  <td>{vi ? 'Có phí (xem CS Quảng Cáo)' : 'Paid (see Ad Policy)'}</td>
                </tr>
                <tr>
                  <td>{vi ? 'Tính năng Job Gấp' : 'Urgent Job feature'}</td>
                  <td>{vi ? 'Nhà tuyển dụng' : 'Employer'}</td>
                  <td>{vi ? 'xem Chính sách Job Gấp' : 'see Urgent Job Policy'}</td>
                </tr>
              </tbody>
            </Table>
          </TableWrapper>
        </Card>

        {/* 2. Phương thức thanh toán */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Landmark size={19} />
            {vi ? '2. Phương thức thanh toán được hỗ trợ' : '2. Supported Payment Methods'}
          </SectionTitle>

          <SubTitle $isDark={isDarkMode}>{vi ? '2.1 Thanh toán trực tuyến' : '2.1 Online Payment'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Ví điện tử: MoMo, VNPay' : 'E-wallets: MoMo, VNPay'}</li>
            <li>{vi ? 'Thẻ tín dụng/ghi nợ nội địa: Visa, Mastercard, JCB phát hành tại Việt Nam' : 'Domestic credit/debit: Visa, Mastercard, JCB issued in Vietnam'}</li>
            <li>{vi ? 'Thẻ quốc tế: Visa, Mastercard (có thể phát sinh phí chuyển đổi ngoại tệ)' : 'International cards: Visa, Mastercard (currency conversion fees may apply)'}</li>
          </UL>

          <SubTitle $isDark={isDarkMode}>{vi ? '2.2 Chuyển khoản ngân hàng' : '2.2 Bank Transfer'}</SubTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Áp dụng cho các gói dịch vụ có giá trị từ 10.000 VNĐ trở lên.' : 'Applies to service packages from 10,000 VND.'}</li>
            <li>{vi ? 'Thông tin tài khoản ngân hàng sẽ được cung cấp sau khi xác nhận đơn hàng.' : 'Bank account info provided after order confirmation.'}</li>
            <li>{vi ? 'Dịch vụ có hiệu lực trong vòng 30 phút sau khi xác nhận nhận tiền.' : 'Service starts within 30 mins after payment confirmation.'}</li>
          </UL>

          <SubTitle $isDark={isDarkMode}>{vi ? '2.3 Rút tiền tại Ốp Pờ' : '2.3 Withdrawal from Ốp Pờ'}</SubTitle>
          <HighlightBox $isDark={isDarkMode}>
            {vi
              ? 'Tiền sẽ được quyết toán vào Thứ Bảy hằng tuần. Yêu cầu rút tiền cần được gửi trước 23h59 ngày Thứ Sáu để đảm bảo nhận tiền đúng hẹn vào ngày hôm sau.'
              : 'Payments are settled every Saturday. Withdrawal requests must be sent before 11:59 PM Friday to ensure timely payment the next day.'}
          </HighlightBox>
        </Card>

        {/* 3. Hóa đơn & biên lai */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <Receipt size={19} />
            {vi ? '3. Hóa đơn & biên lai' : '3. Invoices & Receipts'}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Hóa đơn điện tử (VAT 10%) được xuất tự động sau mỗi giao dịch thành công.' : 'E-invoices (10% VAT) issued automatically after successful transaction.'}</li>
            <li>{vi ? 'Nhà tuyển dụng có thể tải lại lịch sử hóa đơn trong mục Quản lý thanh toán.' : 'Employers can download invoice history in Payment Management.'}</li>
            <li>{vi ? 'Cần hóa đơn đỏ cho doanh nghiệp? Vui lòng cập nhật thông tin trong phần liên hệ.' : 'Need business red invoice? Update info in contact section.'}</li>
          </UL>
        </Card>

        {/* 4. Bảo mật giao dịch */}
        <Card $isDark={isDarkMode}>
          <SectionTitle $isDark={isDarkMode}>
            <ShieldCheck size={19} />
            {vi ? '4. Bảo mật giao dịch' : '4. Transaction Security'}
          </SectionTitle>
          <UL $isDark={isDarkMode}>
            <li>{vi ? 'Ốp Pờ KHÔNG lưu trữ thông tin thẻ tín dụng/ghi nợ của người dùng trên hệ thống.' : 'Ốp Pờ does NOT store user credit/debit card information.'}</li>
            <li>{vi ? 'Giao dịch thất bại (đã trừ tiền): liên hệ hỗ trợ trong 24 giờ để được xử lý.' : 'Failed transaction (charged): contact support within 24h.'}</li>
          </UL>
        </Card>

        <FooterBox $isDark={isDarkMode}>
          <Link to="/login">{vi ? 'Đăng nhập' : 'Login'}</Link>
          {' · '}
          <Link to="/register">{vi ? 'Đăng ký' : 'Register'}</Link>
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

export default TermsUrgentJobs;
