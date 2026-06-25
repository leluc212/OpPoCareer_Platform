import { useState } from 'react';
import styled from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import { 
  HelpCircle, 
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Clock,
  Send
} from 'lucide-react';
import { Input, TextArea, Label, Button } from '../../components/FormElements';

const PageContainer = styled.div`
  padding: 2rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.95rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div``;

const Sidebar = styled.div``;

const Section = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  padding: 2rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FAQList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FAQItem = styled.div`
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
`;

const FAQQuestion = styled.button`
  width: 100%;
  padding: 1rem 1.5rem;
  background: ${props => props.$isOpen ? props.theme.colors.bgDark : props.theme.colors.bgLight};
  border: none;
  text-align: left;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.colors.bgDark};
  }
`;

const FAQAnswer = styled.div`
  padding: 1rem 1.5rem;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.6;
  border-top: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.bgLight};
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const ContactCard = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const ContactTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 1rem;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.textSecondary};

  &:hover {
    background: ${props => props.theme.colors.background};
  }
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => `${props.theme.colors.primary}15`};
  color: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ContactInfo = styled.div`
  flex: 1;
`;

const ContactLabel = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 0.25rem;
`;

const ContactValue = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const AdminSupport = () => {
  const { language } = useLanguage();
  const [openFAQ, setOpenFAQ] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const faqs = [
    {
      id: 1,
      question: language === 'vi' ? 'Làm sao để quản lý quyền truy cập của admin?' : 'How to manage admin access permissions?',
      answer: language === 'vi' ? 'Bạn có thể quản lý quyền truy cập trong phần Cài Đặt > Phân Quyền. Tại đây, bạn có thể tạo các vai trò khác nhau và gán quyền cụ thể cho từng vai trò.' : 'You can manage access permissions in Settings > Permissions. Here you can create different roles and assign specific permissions to each role.'
    },
    {
      id: 2,
      question: language === 'vi' ? 'Cách xử lý khi phát hiện tài khoản vi phạm?' : 'How to handle accounts that violate policies?',
      answer: language === 'vi' ? 'Khi phát hiện tài khoản vi phạm, bạn có thể: 1) Cảnh cáo người dùng, 2) Tạm khóa tài khoản, 3) Khóa vĩnh viễn. Nên lưu lại bằng chứng vi phạm trước khi thực hiện các hành động này.' : 'When detecting a violation, you can: 1) Warn the user, 2) Temporarily suspend account, 3) Permanently ban. Save evidence of violations before taking these actions.'
    },
    {
      id: 3,
      question: language === 'vi' ? 'Làm thế nào để xuất báo cáo dữ liệu?' : 'How to export data reports?',
      answer: language === 'vi' ? 'Vào phần Báo Cáo > Chọn loại báo cáo cần xuất > Chọn khoảng thời gian > Nhấn nút "Xuất báo cáo". Hệ thống hỗ trợ xuất dưới dạng Excel, PDF, và CSV.' : 'Go to Reports > Select report type > Choose time period > Click "Export report". The system supports Excel, PDF, and CSV formats.'
    },
    {
      id: 4,
      question: language === 'vi' ? 'Quy trình phê duyệt nhà tuyển dụng mới?' : 'What is the new employer approval process?',
      answer: language === 'vi' ? 'Quy trình gồm 3 bước: 1) Kiểm tra thông tin công ty, 2) Xác minh giấy tờ pháp lý, 3) Phê duyệt hoặc từ chối. Mỗi bước đều cần ghi chú lý do rõ ràng.' : 'The process has 3 steps: 1) Verify company information, 2) Validate legal documents, 3) Approve or reject. Each step requires clear notes.'
    },
    {
      id: 5,
      question: language === 'vi' ? 'Cách xử lý sự cố kỹ thuật nghiêm trọng?' : 'How to handle critical technical issues?',
      answer: language === 'vi' ? 'Trong trường hợp khẩn cấp, vui lòng liên hệ ngay với bộ phận kỹ thuật qua hotline: 0909 123 456 hoặc email: tech-oppohiringplatform@gmail.com. Mô tả chi tiết sự cố và các bước đã thực hiện.' : 'In emergencies, please contact technical support immediately via hotline: 0909 123 456 or email: tech-oppohiringplatform@gmail.com. Describe the issue and steps taken in detail.'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Support ticket submitted:', formData);
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <DashboardLayout role="admin" key={language}>
      <PageContainer>
        <PageHeader>
          <Title>{language === 'vi' ? 'Trung Tâm Hỗ Trợ' : 'Support Center'}</Title>
          <Subtitle>{language === 'vi' ? 'Liên hệ hỗ trợ' : 'Support contact'}</Subtitle>
        </PageHeader>

        <Grid>
          <MainContent>
            

            <Section>
              <SectionTitle>
                <Send size={24} />
                {language === 'vi' ? 'Gửi Yêu Cầu Hỗ Trợ' : 'Submit Support Request'}
              </SectionTitle>
              <form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>{language === 'vi' ? 'Họ và tên' : 'Full Name'}</Label>
                  <Input 
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={language === 'vi' ? 'Nhập họ và tên của bạn' : 'Enter your full name'}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="admin@example.com"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{language === 'vi' ? 'Chủ đề' : 'Subject'}</Label>
                  <Input 
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder={language === 'vi' ? 'Vấn đề cần hỗ trợ' : 'Issue requiring support'}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{language === 'vi' ? 'Nội dung chi tiết' : 'Detailed Description'}</Label>
                  <TextArea 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={language === 'vi' ? 'Mô tả chi tiết vấn đề của bạn...' : 'Describe your issue in detail...'}
                    rows={6}
                    required
                  />
                </FormGroup>

                <Button type="submit" $variant="primary">
                  <Send size={18} />
                  {language === 'vi' ? 'Gửi yêu cầu' : 'Submit Request'}
                </Button>
              </form>
            </Section>
          </MainContent>

          <Sidebar>
            <ContactCard>
              <ContactTitle>{language === 'vi' ? 'Thông Tin Liên Hệ' : 'Contact Information'}</ContactTitle>
              
              <ContactItem>
                <IconWrapper>
                  <Mail size={20} />
                </IconWrapper>
                <ContactInfo>
                  <ContactLabel>{language === 'vi' ? 'Email hỗ trợ' : 'Support email'}</ContactLabel>
                  <ContactValue>admin-oppohiringplatform@gmail.com</ContactValue>
                </ContactInfo>
              </ContactItem>

              <ContactItem>
                <IconWrapper>
                  <Phone size={20} />
                </IconWrapper>
                <ContactInfo>
                  <ContactLabel>Hotline</ContactLabel>
                  <ContactValue>0909 123 456</ContactValue>
                </ContactInfo>
              </ContactItem>

              <ContactItem>
                <IconWrapper>
                  <Clock size={20} />
                </IconWrapper>
                <ContactInfo>
                  <ContactLabel>{language === 'vi' ? 'Giờ làm việc' : 'Working hours'}</ContactLabel>
                  <ContactValue>{language === 'vi' ? 'Hỗ trợ 24/7' : '24/7 Support'}</ContactValue>
                </ContactInfo>
              </ContactItem>
            </ContactCard>

            <ContactCard>
              <ContactTitle>{language === 'vi' ? 'Hỗ Trợ Khẩn Cấp' : 'Emergency Support'}</ContactTitle>
              <ContactItem>
                <IconWrapper style={{ background: '#fee2e2', color: '#dc2626' }}>
                  <Phone size={20} />
                </IconWrapper>
                <ContactInfo>
                  <ContactLabel>{language === 'vi' ? 'Hotline khẩn cấp' : 'Emergency hotline'}</ContactLabel>
                  <ContactValue style={{ color: '#dc2626' }}>1900 8888</ContactValue>
                </ContactInfo>
              </ContactItem>
            </ContactCard>
          </Sidebar>
        </Grid>
      </PageContainer>
    </DashboardLayout>
  );
};

export default AdminSupport;
