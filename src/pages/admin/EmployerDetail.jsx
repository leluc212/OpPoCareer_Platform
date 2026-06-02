import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Edit,
  Building2,
  Users,
  Briefcase,
  DollarSign,
  Zap,
  Clock,
  RefreshCw
} from 'lucide-react';
import adminEmployerService from '../../services/adminEmployerService';
import { 
  createQuickJobActivationApprovedNotification, 
  createQuickJobActivationRejectedNotification, 
  createQuickJobActivationDeactivatedNotification 
} from '../../services/notificationService';


const PageContainer = styled.div`
  animation: fadeIn 0.5s ease-in;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${props => props.theme.colors.bgDark};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 24px;
  
  &:hover {
    background: ${props => props.theme.colors.border};
    transform: translateX(-4px);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 32px;
  margin-bottom: 24px;
  color: white;
  box-shadow: ${props => props.theme.shadows.card};
`;

const EmployerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const EmployerLogo = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 16px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: 700;
  color: #1e40af;
  border: 4px solid rgba(255, 255, 255, 0.3);
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  .edit-icon {
    position: absolute;
    bottom: -8px;
    right: -8px;
    width: 32px;
    height: 32px;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    
    svg {
      width: 16px;
      height: 16px;
      color: white;
    }
  }
`;

const EmployerInfo = styled.div`
  flex: 1;
  
  h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  .id {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 12px;
  }
  
  .contact {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    
    @media (max-width: 768px) {
      justify-content: center;
    }
    
    .item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 20px;
  text-align: center;
  
  .icon {
    width: 40px;
    height: 40px;
    margin: 0 auto 12px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
  
  .label {
    font-size: 13px;
    opacity: 0.9;
    margin-bottom: 8px;
  }
  
  .value {
    font-size: 28px;
    font-weight: 700;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid ${props => props.theme.colors.border};
  overflow-x: auto;
  padding-bottom: 2px;
`;

const Tab = styled.button`
  padding: 12px 24px;
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  border-radius: ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md} 0 0;
  
  &:hover {
    background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.bgDark};
  }
`;

const ContentSection = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 24px;
  border: 2px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.card};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  .label {
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    margin-bottom: 6px;
    font-weight: 500;
  }
  
  .value {
    font-size: 16px;
    color: ${props => props.theme.colors.text};
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    width: 22px;
    height: 22px;
    color: ${props => props.theme.colors.primary};
  }
`;

const ActionButtonsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ActionButton = styled.button`
  padding: 14px 20px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  background: ${props => {
    if (props.$variant === 'success') return '#10b981';
    if (props.$variant === 'danger') return '#ef4444';
    if (props.$variant === 'warning') return '#f59e0b';
    return props.theme.colors.primary;
  }};
  
  color: white;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const VerificationCard = styled.div`
  background: ${props => props.$verified ? '#dcfce7' : '#fef3c7'};
  border-left: 4px solid ${props => props.$verified ? '#10b981' : '#f59e0b'};
  padding: 16px;
  border-radius: ${props => props.theme.borderRadius.md};
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => props.$verified ? '#10b981' : '#f59e0b'};
  }
  
  .content {
    flex: 1;
    
    .title {
      font-weight: 600;
      font-size: 15px;
      color: ${props => props.$verified ? '#15803d' : '#92400e'};
      margin-bottom: 4px;
    }
    
    .desc {
      font-size: 13px;
      color: ${props => props.$verified ? '#166534' : '#78350f'};
    }
  }
`;

const ViolationCard = styled.div`
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 16px;
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: 12px;
  
  .date {
    font-size: 12px;
    color: #92400e;
    margin-bottom: 6px;
    font-weight: 600;
  }
  
  .content {
    font-size: 14px;
    color: #78350f;
    font-weight: 500;
  }
`;

const JobCard = styled.div`
  background: ${props => props.theme.colors.bgDark};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateX(4px);
  }
  
  .title {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }
  
  .meta {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    
    .item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
`;

const EmployerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('info');
  const [employer, setEmployer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingQuickJob, setUpdatingQuickJob] = useState(false);

  const employersData = {
    1: {
      id: 1,
      name: 'Katinat chi nhánh quận 8',
      email: 'hr@katinat.com',
      phone: '028 1234 5678',
      address: 'Quận 8, TP.HCM',
      website: 'www.katinat.com',
      verified: true,
      approvalStatus: 'approved',
      joined: '2026-03-06',
      totalJobs: 45,
      activeJobs: 12,
      totalApplications: 234,
      totalRevenue: '15,500,000',
      violations: [],
      companySize: '50-100 nhân viên',
      industry: 'F&B - Cafe',
      quickJobStatus: 'not_requested'
    },
    2: {
      id: 2,
      name: 'The Coffee House chi nhánh Bình Thạnh',
      email: 'recruit@thecoffeehouse.com',
      phone: '028 9876 5432',
      address: 'Bình Thạnh, TP.HCM',
      website: 'www.thecoffeehouse.com',
      verified: true,
      approvalStatus: 'approved',
      joined: '2026-03-05',
      totalJobs: 38,
      activeJobs: 8,
      totalApplications: 189,
      totalRevenue: '12,800,000',
      violations: [],
      companySize: '100-200 nhân viên',
      industry: 'F&B - Cafe',
      quickJobStatus: 'not_requested'
    },
    3: {
      id: 3,
      name: 'D coffee',
      email: 'hr@dcoffee.com',
      phone: '028 5555 6666',
      address: 'Quận 1, TP.HCM',
      website: 'www.dcoffee.vn',
      verified: false,
      approvalStatus: 'pending',
      joined: '2026-03-04',
      totalJobs: 15,
      activeJobs: 5,
      totalApplications: 67,
      totalRevenue: '4,200,000',
      violations: [
        { date: '10/3', content: 'Không thanh toán đúng hạn cho ứng viên' }
      ],
      companySize: '10-50 nhân viên',
      industry: 'F&B - Cafe',
      quickJobStatus: 'not_requested'
    },
    4: {
      id: 4,
      name: 'Quán lẩu 88',
      email: 'jobs@quanlau88.com',
      phone: '028 7777 8888',
      address: 'Quận 8, TP.HCM',
      website: 'www.quanlau88.com',
      verified: false,
      approvalStatus: 'pending',
      joined: '2026-03-03',
      totalJobs: 22,
      activeJobs: 6,
      totalApplications: 98,
      totalRevenue: '6,500,000',
      violations: [],
      companySize: '10-50 nhân viên',
      industry: 'F&B - Nhà hàng',
      quickJobStatus: 'not_requested'
    },
    5: {
      id: 5,
      name: 'Nhà hàng cưới Victory',
      email: 'careers@victoryvn.com',
      phone: '028 3333 4444',
      address: 'Quận 7, TP.HCM',
      website: 'www.victoryvn.com',
      verified: true,
      approvalStatus: 'approved',
      joined: '2026-03-02',
      totalJobs: 52,
      activeJobs: 15,
      totalApplications: 312,
      totalRevenue: '22,400,000',
      violations: [],
      companySize: '200+ nhân viên',
      industry: 'F&B - Nhà hàng tiệc cưới',
      quickJobStatus: 'not_requested'
    }
  };

  useEffect(() => {
    const fetchEmployer = async () => {
      try {
        setLoading(true);
        const data = await adminEmployerService.getAllEmployers();
        const found = data.find(e => e.id === id || e.userId === id);
        if (found) {
          setEmployer({
            id: found.id || found.userId,
            name: found.companyName || 'N/A',
            email: found.email || 'N/A',
            phone: found.phone || 'N/A',
            address: found.address || 'N/A',
            website: found.website || '',
            verified: found.isVerified || false,
            approvalStatus: found.approvalStatus || 'pending',
            joined: found.createdAt ? new Date(found.createdAt).toLocaleDateString('vi-VN') : 'N/A',
            totalJobs: 0,
            activeJobs: 0,
            totalApplications: 0,
            totalRevenue: '0',
            violations: [],
            companySize: found.companySize || 'N/A',
            industry: found.industry || 'N/A',
            quickJobStatus: found.quickJobStatus || 'not_requested'
          });
        } else {
          setEmployer(employersData[id] || employersData[1]);
        }
      } catch (err) {
        console.error('Error fetching employer:', err);
        setEmployer(employersData[id] || employersData[1]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployer();
  }, [id]);

  const handleUpdateQuickJobStatus = async (status) => {
    try {
      setUpdatingQuickJob(true);
      await adminEmployerService.updateQuickJobStatus(id, status);
      setEmployer(prev => ({ ...prev, quickJobStatus: status }));

      // Send status change notification to Employer
      try {
        const companyName = employer?.name || 'Nhà tuyển dụng';
        if (status === 'approved') {
          await createQuickJobActivationApprovedNotification(id, companyName);
          console.log(`✅ Approved notification sent to employer: ${companyName}`);
        } else if (status === 'rejected') {
          await createQuickJobActivationRejectedNotification(id, companyName);
          console.log(`✅ Rejected notification sent to employer: ${companyName}`);
        } else if (status === 'not_requested') {
          await createQuickJobActivationDeactivatedNotification(id, companyName);
          console.log(`✅ Deactivated notification sent to employer: ${companyName}`);
        }
      } catch (notifyErr) {
        console.error('❌ Error sending quick job status notification to employer:', notifyErr);
      }

      alert(language === 'vi' ? 'Cập nhật trạng thái thành công!' : 'Status updated successfully!');
    } catch (err) {
      console.error('Error updating quick job status:', err);
      alert(language === 'vi' ? 'Lỗi khi cập nhật trạng thái' : 'Error updating status');
    } finally {
      setUpdatingQuickJob(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin" key={language}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '16px' }}>
          <RefreshCw size={36} style={{ color: '#1e40af', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e40af' }}>
            {language === 'vi' ? 'Đang tải thông tin...' : 'Loading details...'}
          </span>
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout role="admin" key={language}>
      <PageContainer>
        <BackButton onClick={() => navigate('/admin/employers')}>
          <ArrowLeft />
          {language === 'vi' ? 'Quay lại' : 'Back'}
        </BackButton>

        <HeaderSection>
          <EmployerHeader>
            <EmployerLogo>
              <Building2 size={48} />
              <div className="edit-icon">
                <Edit />
              </div>
            </EmployerLogo>
            <EmployerInfo>
              <h1>{employer.name}</h1>
              <div className="id">ID: NTD{employer.id.toString().padStart(4, '0')}</div>
              <div className="contact">
                <div className="item">
                  <Mail />
                  {employer.email}
                </div>
                <div className="item">
                  <Phone />
                  {employer.phone}
                </div>
                <div className="item">
                  <MapPin />
                  {employer.address}
                </div>
                <div className="item">
                  <Calendar />
                  {employer.joined}
                </div>
              </div>
            </EmployerInfo>
          </EmployerHeader>

          <StatsRow>
            <StatCard>
              <div className="icon">
                <Briefcase />
              </div>
              <div className="label">{language === 'vi' ? 'Tổng tin đăng' : 'Total Jobs'}</div>
              <div className="value">{employer.totalJobs}</div>
            </StatCard>
            <StatCard>
              <div className="icon">
                <Briefcase />
              </div>
              <div className="label">{language === 'vi' ? 'Tin đang tuyển' : 'Active Jobs'}</div>
              <div className="value">{employer.activeJobs}</div>
            </StatCard>
            <StatCard>
              <div className="icon">
                <Users />
              </div>
              <div className="label">{language === 'vi' ? 'Lượt ứng tuyển' : 'Applications'}</div>
              <div className="value">{employer.totalApplications}</div>
            </StatCard>
            <StatCard>
              <div className="icon">
                <DollarSign />
              </div>
              <div className="label">{language === 'vi' ? 'Lợi nhuận thu được' : 'Profit Earned'}</div>
              <div className="value">{employer.totalRevenue}</div>
            </StatCard>
          </StatsRow>
        </HeaderSection>

        <TabsContainer>
          <Tab $active={activeTab === 'info'} onClick={() => setActiveTab('info')}>
            {language === 'vi' ? 'Thông tin công ty' : 'Company Info'}
          </Tab>
          <Tab $active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')}>
            {language === 'vi' ? 'Tin đăng tuyển' : 'Job Posts'}
          </Tab>
          <Tab $active={activeTab === 'applications'} onClick={() => setActiveTab('applications')}>
            {language === 'vi' ? 'Ứng tuyển' : 'Applications'}
          </Tab>
          <Tab $active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')}>
            {language === 'vi' ? 'Lợi nhuận thu được' : 'Profit Earned'}
          </Tab>
          <Tab $active={activeTab === 'violations'} onClick={() => setActiveTab('violations')}>
            {language === 'vi' ? 'Vi phạm' : 'Violations'}
          </Tab>
        </TabsContainer>

        <ContentSection>
          {activeTab === 'info' && (
            <>
              <SectionTitle>{language === 'vi' ? 'Thông tin chi tiết' : 'Detailed Information'}</SectionTitle>
              <InfoGrid>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Tên công ty:' : 'Company Name:'}</div>
                  <div className="value">{employer.name}</div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Ngành nghề:' : 'Industry:'}</div>
                  <div className="value">{employer.industry}</div>
                </InfoItem>
                <InfoItem>
                  <div className="label">Email:</div>
                  <div className="value">
                    <Mail size={16} />
                    {employer.email}
                  </div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Điện thoại:' : 'Phone:'}</div>
                  <div className="value">
                    <Phone size={16} />
                    {employer.phone}
                  </div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Địa chỉ:' : 'Address:'}</div>
                  <div className="value">
                    <MapPin size={16} />
                    {employer.address}
                  </div>
                </InfoItem>
                <InfoItem>
                  <div className="label">Website:</div>
                  <div className="value">{employer.website}</div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Quy mô:' : 'Company Size:'}</div>
                  <div className="value">{employer.companySize}</div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Ngày tham gia:' : 'Join Date:'}</div>
                  <div className="value">
                    <Calendar size={16} />
                    {employer.joined}
                  </div>
                </InfoItem>
              </InfoGrid>

              <SectionTitle style={{ marginTop: '32px' }}>
                {language === 'vi' ? 'Xác minh công ty' : 'Company Verification'}
              </SectionTitle>
              <VerificationCard $verified={employer.verified}>
                {employer.verified ? <Shield /> : <AlertTriangle />}
                <div className="content">
                  <div className="title">
                    {employer.verified 
                      ? (language === 'vi' ? 'Đã xác thực công ty' : 'Company Verified')
                      : (language === 'vi' ? 'Chưa xác thực công ty' : 'Company Not Verified')
                    }
                  </div>
                  <div className="desc">
                    {language === 'vi' ? 'Giấy phép kinh doanh & Thông tin pháp lý' : 'Business License & Legal Info'}
                  </div>
                </div>
                {employer.verified ? <CheckCircle size={20} /> : <XCircle size={20} />}
              </VerificationCard>

              <SectionTitle style={{ marginTop: '32px' }}>
                {language === 'vi' ? 'Trạng thái Công việc tuyển gấp' : 'Urgent Jobs Status'}
              </SectionTitle>
              <VerificationCard $verified={employer.quickJobStatus === 'approved'}>
                {employer.quickJobStatus === 'approved' ? <Shield /> : <AlertTriangle />}
                <div className="content">
                  <div className="title">
                    {employer.quickJobStatus === 'approved' && (language === 'vi' ? 'Đã kích hoạt tuyển gấp' : 'Urgent Jobs Activated')}
                    {employer.quickJobStatus === 'pending' && (language === 'vi' ? 'Đang chờ duyệt kích hoạt' : 'Pending Activation Approval')}
                    {employer.quickJobStatus === 'rejected' && (language === 'vi' ? 'Bị từ chối kích hoạt' : 'Activation Rejected')}
                    {(employer.quickJobStatus === 'not_requested' || !employer.quickJobStatus) && (language === 'vi' ? 'Chưa đăng ký kích hoạt' : 'Not Requested')}
                  </div>
                  <div className="desc">
                    {language === 'vi' 
                      ? 'Quyền tạo và quản lý bài đăng tuyển dụng realtime' 
                      : 'Permission to create and manage realtime job posts'}
                  </div>
                </div>
                {employer.quickJobStatus === 'approved' && <CheckCircle size={20} />}
                {employer.quickJobStatus === 'pending' && <Clock size={20} />}
                {employer.quickJobStatus === 'rejected' && <XCircle size={20} />}
              </VerificationCard>

              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                {employer.quickJobStatus === 'pending' && (
                  <>
                    <ActionButton $variant="success" onClick={() => handleUpdateQuickJobStatus('approved')} disabled={updatingQuickJob}>
                      <CheckCircle /> {language === 'vi' ? 'Duyệt kích hoạt' : 'Approve Activation'}
                    </ActionButton>
                    <ActionButton $variant="danger" onClick={() => handleUpdateQuickJobStatus('rejected')} disabled={updatingQuickJob}>
                      <XCircle /> {language === 'vi' ? 'Từ chối' : 'Reject'}
                    </ActionButton>
                  </>
                )}
                {employer.quickJobStatus === 'approved' && (
                  <ActionButton $variant="danger" onClick={() => handleUpdateQuickJobStatus('not_requested')} disabled={updatingQuickJob}>
                    <XCircle /> {language === 'vi' ? 'Hủy kích hoạt' : 'Deactivate'}
                  </ActionButton>
                )}
                {(employer.quickJobStatus === 'rejected' || employer.quickJobStatus === 'not_requested' || !employer.quickJobStatus) && (
                  <ActionButton onClick={() => handleUpdateQuickJobStatus('approved')} disabled={updatingQuickJob}>
                    <CheckCircle /> {language === 'vi' ? 'Kích hoạt trực tiếp' : 'Activate Directly'}
                  </ActionButton>
                )}
              </div>
            </>

          )}

          {activeTab === 'jobs' && (
            <>
              <SectionTitle>{language === 'vi' ? 'Tin đăng tuyển' : 'Job Posts'}</SectionTitle>
              <JobCard>
                <div className="title">Nhân viên phục vụ - Part-time</div>
                <div className="meta">
                  <div className="item">
                    <Calendar size={14} />
                    Đăng: 15/03/2026
                  </div>
                  <div className="item">
                    <Users size={14} />
                    23 ứng tuyển
                  </div>
                  <div className="item">
                    <CheckCircle size={14} />
                    Đang tuyển
                  </div>
                </div>
              </JobCard>
              <JobCard>
                <div className="title">Pha chế - Ca tối</div>
                <div className="meta">
                  <div className="item">
                    <Calendar size={14} />
                    Đăng: 12/03/2026
                  </div>
                  <div className="item">
                    <Users size={14} />
                    18 ứng tuyển
                  </div>
                  <div className="item">
                    <CheckCircle size={14} />
                    Đang tuyển
                  </div>
                </div>
              </JobCard>
            </>
          )}

          {activeTab === 'revenue' && (
            <>
              <SectionTitle>{language === 'vi' ? 'Lợi nhuận thu được' : 'Profit Earned'}</SectionTitle>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', marginBottom: '24px' }}>
                {employer.totalRevenue} VND
              </div>
              <InfoGrid>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Tổng lợi nhuận thu được:' : 'Total Profit Earned:'}</div>
                  <div className="value">{employer.totalRevenue} VND</div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Số tin đã đăng:' : 'Total Posts:'}</div>
                  <div className="value">{employer.totalJobs}</div>
                </InfoItem>
              </InfoGrid>
            </>
          )}

          {activeTab === 'violations' && (
            <>
              <SectionTitle>
                <AlertTriangle />
                {language === 'vi' ? 'Vi phạm' : 'Violations'}
              </SectionTitle>
              {employer.violations.length > 0 ? (
                employer.violations.map((violation, index) => (
                  <ViolationCard key={index}>
                    <div className="date">{language === 'vi' ? 'Ngày' : 'Date'}: {violation.date}</div>
                    <div className="content">{violation.content}</div>
                  </ViolationCard>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <CheckCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>
                    {language === 'vi' ? 'Không có vi phạm' : 'No violations'}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'applications' && (
            <>
              <SectionTitle>{language === 'vi' ? 'Thống kê ứng tuyển' : 'Application Statistics'}</SectionTitle>
              <InfoGrid>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Tổng lượt ứng tuyển:' : 'Total Applications:'}</div>
                  <div className="value">{employer.totalApplications}</div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Tin đang tuyển:' : 'Active Jobs:'}</div>
                  <div className="value">{employer.activeJobs}</div>
                </InfoItem>
              </InfoGrid>
            </>
          )}
        </ContentSection>
      </PageContainer>
    </DashboardLayout>
  );
};

export default EmployerDetail;
