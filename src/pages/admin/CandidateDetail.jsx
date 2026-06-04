import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import candidateProfileService from '../../services/candidateProfileService';
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
  Loader2,
  BadgeCheck,
  Clock,
  Send
} from 'lucide-react';

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

const CandidateHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const CandidateAvatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: 700;
  color: white;
  border: 4px solid rgba(255, 255, 255, 0.3);
  position: relative;
  
  .edit-icon {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 32px;
    height: 32px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    
    svg {
      width: 16px;
      height: 16px;
      color: #1e40af;
    }
  }
`;

const CandidateInfo = styled.div`
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
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  
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

const WorkAreaTags = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  padding: 6px 12px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  
  svg {
    width: 14px;
    height: 14px;
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

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 16px;
  color: ${props => props.theme.colors.primary};
`;

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('info');
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifNote, setVerifNote] = useState('');
  const [verifLoading, setVerifLoading] = useState(false);

  const vi = language === 'vi';

  useEffect(() => {
    const fetchCandidate = async () => {
      setLoading(true);
      try {
        console.log('📡 Fetching profile for ID:', id);
        const allCandidates = await candidateProfileService.getAllCandidates();
        const found = allCandidates.find(c => (c.userId || c.id) === id);
        
        if (found) {
          setCandidate({
            id: found.userId || found.id,
            name: found.fullName || (found.email ? found.email.split('@')[0] : 'Unknown Candidate'),
            email: found.email || 'No email provided',
            phone: found.phone || 'No phone',
            dob: found.dateOfBirth || (vi ? 'Chưa cập nhật' : 'Not updated'),
            gender: found.gender || (vi ? 'Chưa xác định' : 'Unknown'),
            address: found.location || (vi ? 'Chưa cập nhật' : 'Not updated'),
            ekycVerified: found.kycCompleted || found.ekycStatus === 'verified' || false,
            approvalStatus: (found.kycCompleted || found.ekycStatus === 'verified') ? 'approved' : 'pending',
            joined: found.createdAt ? new Date(found.createdAt).toLocaleDateString('vi-VN') : 'N/A',
            jobsCompleted: found.jobsCompleted || 0,
            rating: found.rating || 5.0,
            totalEarned: found.totalEarned || '0',
            violations: found.violations || [],
            workAreas: found.workAreas || [],
            // Verification fields
            verificationStatus: found.verificationStatus || 'PENDING',
            verificationSubmittedAt: found.verificationSubmittedAt || '',
            verificationApprovedAt: found.verificationApprovedAt || '',
            verificationRejectedAt: found.verificationRejectedAt || '',
            verificationNote: found.verificationNote || '',
            profileCompletion: found.profileCompletion || 0,
          });
          setVerifNote(found.verificationNote || '');
        }
      } catch (error) {
        console.error('❌ Error fetching candidate details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [id, language]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = async () => {
    setVerifLoading(true);
    try {
      await candidateProfileService.approveVerification(candidate.id, verifNote);
      setCandidate(prev => ({ ...prev, verificationStatus: 'APPROVED', verificationApprovedAt: new Date().toISOString() }));
      alert(vi ? '✅ Đã phê duyệt xác minh ứng viên.' : '✅ Candidate verification approved.');
    } catch (e) {
      alert(vi ? 'Lỗi khi duyệt. Vui lòng thử lại.' : 'Error approving. Please try again.');
    } finally {
      setVerifLoading(false);
    }
  };

  const handleReject = async () => {
    if (!verifNote.trim()) {
      alert(vi ? 'Vui lòng nhập lý do từ chối.' : 'Please enter a rejection reason.');
      return;
    }
    setVerifLoading(true);
    try {
      await candidateProfileService.rejectVerification(candidate.id, verifNote);
      setCandidate(prev => ({ ...prev, verificationStatus: 'REJECTED', verificationRejectedAt: new Date().toISOString(), verificationNote: verifNote }));
      alert(vi ? '❌ Đã từ chối yêu cầu xác minh.' : '❌ Verification request rejected.');
    } catch (e) {
      alert(vi ? 'Lỗi khi từ chối. Vui lòng thử lại.' : 'Error rejecting. Please try again.');
    } finally {
      setVerifLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <LoadingContainer>
          <Loader2 className="animate-spin" size={48} />
          <p>{language === 'vi' ? 'Đang tải dữ liệu ứng viên...' : 'Loading candidate data...'}</p>
        </LoadingContainer>
      </DashboardLayout>
    );
  }

  if (!candidate) {
    return (
      <DashboardLayout role="admin">
        <PageContainer>
          <BackButton onClick={() => navigate('/admin/candidates')}>
            <ArrowLeft />
            {language === 'vi' ? 'Quay lại danh sách' : 'Back to list'}
          </BackButton>
          <VerificationCard $verified={false}>
            <AlertTriangle />
            <div className="content">
              <div className="title">{language === 'vi' ? 'Không tìm thấy ứng viên' : 'Candidate not found'}</div>
              <div className="desc">{language === 'vi' ? 'ID ứng viên không hợp lệ hoặc đã bị xóa.' : 'Invalid candidate ID or record deleted.'}</div>
            </div>
          </VerificationCard>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" key={language}>
      <PageContainer>
        <BackButton onClick={() => navigate('/admin/candidates')}>
          <ArrowLeft />
          {language === 'vi' ? 'Quay lại' : 'Back'}
        </BackButton>

        <HeaderSection>
          <CandidateHeader>
            <CandidateAvatar>
              {candidate.name.charAt(0)}
              <div className="edit-icon">
                <Edit />
              </div>
            </CandidateAvatar>
            <CandidateInfo>
              <h1>{candidate.name}</h1>
              <div className="id">ID: {candidate.id}</div>
              <div className="contact">
                <div className="item">
                  <Mail />
                  {candidate.email}
                </div>
                <div className="item">
                  <Phone />
                  {candidate.phone}
                </div>
                <div className="item">
                  <MapPin />
                  {candidate.address}
                </div>
                <div className="item">
                  <Calendar />
                  {candidate.joined}
                </div>
              </div>
            </CandidateInfo>
          </CandidateHeader>

          <StatsRow>
            <StatCard>
              <div className="label">{language === 'vi' ? 'Công việc Tuyển gấp đã làm' : 'Urgent Jobs Completed'}</div>
              <div className="value">{candidate.jobsCompleted}</div>
            </StatCard>
            <StatCard>
              <div className="label">{language === 'vi' ? 'Trust score' : 'Trust Score'}</div>
              <div className="value">{candidate.rating} / 5</div>
            </StatCard>
          </StatsRow>
        </HeaderSection>

        <TabsContainer>
          <Tab $active={activeTab === 'info'} onClick={() => setActiveTab('info')}>
            {language === 'vi' ? 'Thông tin cá nhân' : 'Personal Info'}
          </Tab>
          <Tab $active={activeTab === 'career'} onClick={() => setActiveTab('career')}>
            {language === 'vi' ? 'Lịch sử việc làm' : 'Career History'}
          </Tab>
          <Tab $active={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>
            {language === 'vi' ? 'Hoạt động Công việc Tuyển gấp' : 'Urgent Job Activity'}
          </Tab>
          <Tab $active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>
            {language === 'vi' ? 'Đánh giá' : 'Reviews'}
          </Tab>
          <Tab $active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')}>
            {language === 'vi' ? 'Ví ứng viên' : 'Wallet'}
          </Tab>
          <Tab $active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
            {language === 'vi' ? 'Lịch sử vi phạm' : 'Violation History'}
          </Tab>
          <Tab $active={activeTab === 'verification'} onClick={() => setActiveTab('verification')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BadgeCheck size={15} />
            {language === 'vi' ? 'Xác minh' : 'Verification'}
            {candidate?.verificationStatus === 'SUBMITTED' && (
              <span style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, marginLeft: 2 }}>!</span>
            )}
          </Tab>
        </TabsContainer>

        <ContentSection>
          {activeTab === 'info' && (
            <>
              <SectionTitle>{language === 'vi' ? 'Thông tin chi tiết' : 'Detailed Information'}</SectionTitle>
              <InfoGrid>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Họ và tên:' : 'Full Name:'}</div>
                  <div className="value">{candidate.name}</div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Ngày sinh:' : 'Date of Birth:'}</div>
                  <div className="value">{candidate.dob}</div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Giới tính:' : 'Gender:'}</div>
                  <div className="value">{candidate.gender}</div>
                </InfoItem>
                <InfoItem>
                  <div className="label">Email:</div>
                  <div className="value">
                    <Mail size={16} />
                    {candidate.email}
                  </div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Điện thoại:' : 'Phone:'}</div>
                  <div className="value">
                    <Phone size={16} />
                    {candidate.phone}
                  </div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Địa chỉ:' : 'Address:'}</div>
                  <div className="value">
                    <MapPin size={16} />
                    {candidate.address}
                  </div>
                </InfoItem>
              </InfoGrid>

              <SectionTitle style={{ marginTop: '32px' }}>
                {language === 'vi' ? 'Khu vực có thể làm việc:' : 'Work Areas:'}
              </SectionTitle>
              <WorkAreaTags>
                {candidate.workAreas.length > 0 ? (
                  candidate.workAreas.map((area, index) => (
                    <Tag key={index}>
                      <MapPin size={14} />
                      {area}
                    </Tag>
                  ))
                ) : (
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {language === 'vi' ? 'Chưa cập nhật' : 'Not updated'}
                  </div>
                )}
              </WorkAreaTags>

              <SectionTitle style={{ marginTop: '32px' }}>
                {language === 'vi' ? 'Xác minh hồ sơ' : 'Profile Verification'}
              </SectionTitle>
              <VerificationCard $verified={candidate.ekycVerified}>
                {candidate.ekycVerified ? <Shield /> : <AlertTriangle />}
                <div className="content">
                  <div className="title">
                    {candidate.ekycVerified 
                      ? (language === 'vi' ? 'Đã xác minh hồ sơ' : 'Profile Verified')
                      : (language === 'vi' ? 'Chưa xác minh hồ sơ' : 'Profile Not Verified')
                    }
                  </div>
                  <div className="desc">
                    {language === 'vi' ? 'eKYC - 4 bước xác thực' : 'eKYC - 4-step verification'}
                  </div>
                </div>
                {candidate.ekycVerified ? <CheckCircle size={20} /> : <XCircle size={20} />}
              </VerificationCard>
            </>
          )}

          {activeTab === 'wallet' && (
            <>
              <SectionTitle>{language === 'vi' ? 'Ví ứng viên' : 'Candidate Wallet'}</SectionTitle>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', marginBottom: '24px' }}>
                {new Intl.NumberFormat('vi-VN').format(candidate.totalEarned)} VND
              </div>
              <InfoGrid>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Số dư hiện tại:' : 'Current Balance:'}</div>
                  <div className="value">{new Intl.NumberFormat('vi-VN').format(candidate.totalEarned)} VND</div>
                </InfoItem>
              </InfoGrid>
            </>
          )}

          {activeTab === 'activity' && (
            <>
              <SectionTitle>{language === 'vi' ? 'Hoạt động Công việc Tuyển gấp' : 'Urgent Job Activity'}</SectionTitle>
              <InfoGrid>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Job đã hoàn thành:' : 'Jobs Completed:'}</div>
                  <div className="value">{candidate.jobsCompleted}</div>
                </InfoItem>
                <InfoItem>
                  <div className="label">Rating:</div>
                  <div className="value">{candidate.rating} / 5</div>
                </InfoItem>
              </InfoGrid>
            </>
          )}

          {activeTab === 'reviews' && (
            <>
              <SectionTitle>{language === 'vi' ? 'Đánh giá từ nhà tuyển dụng' : 'Employer Reviews'}</SectionTitle>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {language === 'vi' ? 'Chưa có đánh giá nào' : 'No reviews yet'}
              </div>
            </>
          )}

          {activeTab === 'career' && (
            <>
              <SectionTitle>{language === 'vi' ? 'Lịch sử việc làm' : 'Career history'}</SectionTitle>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {language === 'vi' ? 'Chưa có thông tin nghề nghiệp' : 'No career information yet'}
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <>
              <SectionTitle>
                <AlertTriangle />
                {language === 'vi' ? 'Lịch sử vi phạm' : 'Violation History'}
              </SectionTitle>
              {candidate.violations.length > 0 ? (
                candidate.violations.map((violation, index) => (
                  <ViolationCard key={index}>
                    <div className="date">{violation.date}</div>
                    <div className="content">{violation.content}</div>
                  </ViolationCard>
                ))
              ) : (
                <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                  {language === 'vi' ? '✓ Không có vi phạm nào' : '✓ No violations'}
                </div>
              )}
            </>
          )}

          {activeTab === 'verification' && (
            <>
              <SectionTitle>
                <BadgeCheck />
                {vi ? 'Xác Minh Ứng Viên' : 'Candidate Verification'}
              </SectionTitle>

              {/* Status card */}
              <div style={{
                padding: '20px', borderRadius: 12, marginBottom: 20,
                background: ({APPROVED:'#dcfce7',SUBMITTED:'#fef3c7',REJECTED:'#fee2e2',PENDING:'#f3f4f6'})[candidate.verificationStatus] || '#f3f4f6',
                border: `2px solid ${({APPROVED:'#86efac',SUBMITTED:'#fcd34d',REJECTED:'#fca5a5',PENDING:'#e5e7eb'})[candidate.verificationStatus] || '#e5e7eb'}`,
                display: 'flex', alignItems: 'center', gap: 14
              }}>
                {candidate.verificationStatus === 'APPROVED' && <BadgeCheck size={28} style={{color:'#10b981',flexShrink:0}}/>}
                {candidate.verificationStatus === 'SUBMITTED' && <Clock size={28} style={{color:'#d97706',flexShrink:0}}/>}
                {candidate.verificationStatus === 'REJECTED' && <XCircle size={28} style={{color:'#ef4444',flexShrink:0}}/>}
                {candidate.verificationStatus === 'PENDING' && <Shield size={28} style={{color:'#6b7280',flexShrink:0}}/>}
                <div>
                  <div style={{fontWeight:700,fontSize:15}}>
                    {({
                      APPROVED: vi ? 'Đã được phê duyệt' : 'Approved',
                      SUBMITTED: vi ? 'Đang chờ xét duyệt' : 'Pending review',
                      REJECTED: vi ? 'Đã bị từ chối' : 'Rejected',
                      PENDING: vi ? 'Chưa gửi yêu cầu' : 'Not submitted',
                    })[candidate.verificationStatus]}
                  </div>
                  {candidate.verificationSubmittedAt && (
                    <div style={{fontSize:12,color:'#64748b',marginTop:3}}>
                      {vi ? 'Gửi lúc: ' : 'Submitted: '}{new Date(candidate.verificationSubmittedAt).toLocaleString('vi-VN')}
                    </div>
                  )}
                  {candidate.verificationApprovedAt && (
                    <div style={{fontSize:12,color:'#15803d',marginTop:3}}>
                      {vi ? 'Duyệt lúc: ' : 'Approved: '}{new Date(candidate.verificationApprovedAt).toLocaleString('vi-VN')}
                    </div>
                  )}
                  {candidate.verificationRejectedAt && (
                    <div style={{fontSize:12,color:'#dc2626',marginTop:3}}>
                      {vi ? 'Từ chối lúc: ' : 'Rejected: '}{new Date(candidate.verificationRejectedAt).toLocaleString('vi-VN')}
                    </div>
                  )}
                </div>
              </div>

              {/* eKYC status */}
              <InfoGrid style={{marginBottom:20}}>
                <InfoItem>
                  <div className="label">{vi ? 'eKYC (CCCD + khuôn mặt)' : 'eKYC (ID + Face)'}</div>
                  <div className="value">
                    {candidate.ekycVerified
                      ? <><CheckCircle size={16} style={{color:'#10b981'}}/> {vi ? 'Đã xác minh' : 'Verified'}</>
                      : <><XCircle size={16} style={{color:'#ef4444'}}/> {vi ? 'Chưa xác minh' : 'Not verified'}</>
                    }
                  </div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{vi ? 'Hoàn thiện hồ sơ' : 'Profile completion'}</div>
                  <div className="value">
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{flex:1,height:8,background:'#e5e7eb',borderRadius:4,overflow:'hidden',minWidth:80}}>
                        <div style={{height:'100%',width:`${candidate.profileCompletion}%`,background:candidate.profileCompletion>=60?'#10b981':'#f59e0b',borderRadius:4}} />
                      </div>
                      <span style={{fontWeight:800,color:candidate.profileCompletion>=60?'#10b981':'#f59e0b'}}>{candidate.profileCompletion}%</span>
                    </div>
                  </div>
                </InfoItem>
              </InfoGrid>

              {/* Admin note */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,color:'#64748b',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  {vi ? 'Ghi chú (bắt buộc khi từ chối)' : 'Admin note (required when rejecting)'}
                </div>
                <textarea
                  value={verifNote}
                  onChange={e => setVerifNote(e.target.value)}
                  placeholder={vi ? 'Nhập ghi chú cho ứng viên...' : 'Enter a note for the candidate...'}
                  style={{width:'100%',padding:'10px 14px',border:'2px solid #e2e8f0',borderRadius:10,fontSize:14,fontFamily:'inherit',resize:'vertical',minHeight:80,boxSizing:'border-box'}}
                />
              </div>

              {/* Action buttons */}
              {candidate.verificationStatus === 'SUBMITTED' && (
                <div style={{display:'flex',gap:12}}>
                  <button
                    onClick={handleApprove}
                    disabled={verifLoading}
                    style={{flex:1,padding:'12px',background:'#10b981',color:'white',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:verifLoading?0.6:1}}
                  >
                    <CheckCircle size={16}/>{verifLoading ? (vi?'Đang xử lý...':'Processing...') : (vi?'Phê duyệt':'Approve')}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={verifLoading}
                    style={{flex:1,padding:'12px',background:'#ef4444',color:'white',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:verifLoading?0.6:1}}
                  >
                    <XCircle size={16}/>{verifLoading ? (vi?'Đang xử lý...':'Processing...') : (vi?'Từ chối':'Reject')}
                  </button>
                </div>
              )}
              {candidate.verificationStatus === 'APPROVED' && (
                <div style={{padding:'12px 16px',background:'#dcfce7',border:'2px solid #86efac',borderRadius:10,color:'#15803d',fontWeight:700,fontSize:14,display:'flex',alignItems:'center',gap:8}}>
                  <BadgeCheck size={18}/>{vi?'Ứng viên này đã được xác minh và có thể sử dụng đầy đủ tính năng.':'This candidate is verified and can use all features.'}
                </div>
              )}
              {candidate.verificationStatus === 'PENDING' && (
                <div style={{padding:'12px 16px',background:'#f3f4f6',border:'2px solid #e5e7eb',borderRadius:10,color:'#6b7280',fontWeight:600,fontSize:14,display:'flex',alignItems:'center',gap:8}}>
                  <Shield size={18}/>{vi?'Ứng viên chưa gửi yêu cầu xác minh.':'Candidate has not submitted a verification request.'}
                </div>
              )}
            </>
          )}
        </ContentSection>
      </PageContainer>
    </DashboardLayout>
  );
};

export default CandidateDetail;
