import { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import TableFilter from '../../components/TableFilter';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import adminEmployerService from '../../services/adminEmployerService';
import { getWithdrawalRequests, updateWithdrawalStatus } from '../../services/packageCatalogService';

const PageContainer = styled.div``;

const PageHeader = styled.div`
  margin-bottom: 32px;
  
  h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  p {
    color: ${props => props.theme.colors.textLight};
    font-size: 16px;
  }
`;

const FilterSection = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterWrapper = styled.div`
  flex: 1;
`;

const RefreshButton = styled.button`
  padding: 12px 24px;
  border: 2px solid ${props => props.theme.colors.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.$loading ? props.theme.colors.bgLight : props.theme.colors.primary};
  color: ${props => props.$loading ? props.theme.colors.text : 'white'};
  font-size: 14px;
  font-weight: 600;
  cursor: ${props => props.$loading ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  
  svg {
    animation: ${props => props.$loading ? 'spin 1s linear infinite' : 'none'};
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatBox = styled.div`
  background: ${props => props.theme.colors.bgLight};
  padding: 20px;
  border-radius: ${props => props.theme.borderRadius.lg};
  border-left: 4px solid ${props => props.$color || props.theme.colors.primary};
  box-shadow: ${props => props.theme.shadows.sm};
  
  h3 {
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    margin-bottom: 8px;
    font-weight: 500;
    text-transform: uppercase;
  }
  
  p {
    font-size: 28px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }
`;

const TableWrapper = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.sm};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    padding: 16px;
    background: ${props => props.theme.colors.bgDark};
    font-weight: 600;
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    border-bottom: 2px solid ${props => props.theme.colors.border};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  td {
    padding: 16px;
    border-bottom: 1px solid ${props => props.theme.colors.border};
    font-size: 14px;
  }
  
  tbody tr:last-child td {
    border-bottom: none;
  }
  
  tbody tr {
    transition: all 0.2s;
    
    &:hover {
      background: ${props => props.theme.colors.bgDark};
    }
  }
`;

const CompanyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CompanyLogo = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.$bgColor || '#e0e7ff'};
  color: ${props => props.$color || '#4338ca'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CompanyDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const CompanyName = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: ${props => props.theme.colors.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CompanyMeta = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    if (props.$status === 'approved') return '#dcfce7';
    if (props.$status === 'rejected') return '#fee2e2';
    if (props.$status === 'pending') return '#fef3c7';
    return '#f3f4f6';
  }};
  color: ${props => {
    if (props.$status === 'approved') return '#15803d';
    if (props.$status === 'rejected') return '#dc2626';
    if (props.$status === 'pending') return '#ca8a04';
    return '#6b7280';
  }};
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const VerifiedBadge = styled.span`
  padding: 4px 12px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$verified ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.$verified ? '#15803d' : '#dc2626'};
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  padding: 8px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  background: #e0e7ff;
  color: #4338ca;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 20px;
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 2px solid ${props => props.theme.colors.border};
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
`;

const PaginationInfo = styled.div`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const PageButton = styled.button`
  padding: 8px 12px;
  border: 2px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.bgDark};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 40px;
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 13px;
    min-width: 36px;
  }
  
  &:hover:not(:disabled) {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageEllipsis = styled.span`
  color: ${props => props.theme.colors.textLight};
  font-weight: 600;
  padding: 0 4px;
`;

const ApproveButton = styled.button`
  padding: 6px 16px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  background: #10b981;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const RejectButton = styled(ApproveButton)`
  background: #ef4444;
  &:hover {
    background: #dc2626;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid ${props => props.theme.colors.border};
`;

const Tab = styled.button`
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.textLight};
  background: ${props => props.$active ? props.theme.colors.bgLight : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.bgLight};
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
  
  @keyframes slideUp {
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

const ModalIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #dcfce7;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  
  svg {
    color: #15803d;
    width: 32px;
    height: 32px;
  }
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
  margin-bottom: 12px;
`;

const ModalMessage = styled.p`
  font-size: 15px;
  color: #64748b;
  text-align: center;
  margin-bottom: 24px;
  line-height: 1.6;
`;

const ModalButton = styled.button`
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #10b981;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const EmployersManagement = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'approved' or 'withdrawals'
  const itemsPerPage = 20;

  const [employers, setEmployers] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadWithdrawRequests = async () => {
    try {
      const data = await getWithdrawalRequests();
      const mapped = (data || []).map(item => ({
        ...item,
        id: item.requestId || item.id
      }));
      setWithdrawRequests(mapped);
    } catch (e) {
      console.error('Error loading withdraw requests:', e);
      try {
        const stored = localStorage.getItem('admin_withdraw_requests');
        if (stored) {
          setWithdrawRequests(JSON.parse(stored));
        }
      } catch (_) {}
    }
  };

  const handleApproveWithdrawal = async (requestId) => {
    try {
      await updateWithdrawalStatus(requestId, 'approved');
      setWithdrawRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, status: 'approved' } : req
        )
      );
      try {
        const stored = JSON.parse(localStorage.getItem('admin_withdraw_requests') || '[]');
        const updated = stored.map(req => req.id === requestId ? { ...req, status: 'approved' } : req);
        localStorage.setItem('admin_withdraw_requests', JSON.stringify(updated));
      } catch (_) {}
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      alert(language === 'vi' ? 'Không thể duyệt yêu cầu rút tiền' : 'Failed to approve withdrawal');
    }
  };

  const handleRejectWithdrawal = async (requestId) => {
    try {
      await updateWithdrawalStatus(requestId, 'rejected');
      setWithdrawRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, status: 'rejected' } : req
        )
      );
      try {
        const stored = JSON.parse(localStorage.getItem('admin_withdraw_requests') || '[]');
        const updated = stored.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req);
        localStorage.setItem('admin_withdraw_requests', JSON.stringify(updated));
      } catch (_) {}
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
      alert(language === 'vi' ? 'Không thể từ chối yêu cầu rút tiền' : 'Failed to reject withdrawal');
    }
  };

  // Load employers from DynamoDB via API
  const loadEmployers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 Fetching employer profiles from DynamoDB...');
      const data = await adminEmployerService.getAllEmployers();
      
      // Transform data to match component structure
      const transformedData = data.map(item => ({
        id: item.userId,
        companyName: item.companyName || 'N/A',
        email: item.email || 'N/A',
        phone: item.phone || 'N/A',
        address: item.address || 'N/A',
        industry: item.industry || 'N/A',
        companySize: item.companySize || 'N/A',
        foundedYear: item.foundedYear || 'N/A',
        website: item.website || '',
        companyLogo: item.companyLogo || '',
        description: item.description || '',
        isVerified: item.isVerified || false,
        isActive: item.isActive !== false,
        approvalStatus: item.approvalStatus || 'pending',
        profileCompletion: item.profileCompletion || 0,
        createdAt: item.createdAt || '',
        updatedAt: item.updatedAt || ''
      }));
      
      setEmployers(transformedData);
      console.log(`✅ Loaded ${transformedData.length} employer profiles`);
    } catch (err) {
      console.error('❌ Error loading employers:', err);
      setError(err.message || 'Failed to load employer data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadEmployers();
    loadWithdrawRequests();
  }, []);

  // Reload withdraw requests when tab changes to withdrawals
  useEffect(() => {
    if (activeTab === 'withdrawals') {
      loadWithdrawRequests();
    }
  }, [activeTab]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmployers();
    loadWithdrawRequests();
  };

  const getStatusText = (status) => {
    if (status === 'approved') return language === 'vi' ? 'Đã duyệt' : 'Approved';
    if (status === 'rejected') return language === 'vi' ? 'Từ chối' : 'Rejected';
    if (status === 'pending') return language === 'vi' ? 'Chờ duyệt' : 'Pending';
    return status;
  };

  const filterOptions = [
    { value: 'verified', label: language === 'vi' ? 'Đã xác minh' : 'Verified' },
    { value: 'active', label: language === 'vi' ? 'Đang hoạt động' : 'Active' },
  ];

  const handleApprove = async (employerId) => {
    try {
      console.log('✅ Approving employer:', employerId);
      
      // Call API to update in DynamoDB
      await adminEmployerService.approveEmployer(employerId);
      
      // Update local state
      setEmployers(prev => prev.map(employer => 
        employer.id === employerId 
          ? { ...employer, approvalStatus: 'approved' }
          : employer
      ));
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ Error approving employer:', error);
      alert(language === 'vi' 
        ? `Lỗi khi duyệt nhà tuyển dụng: ${error.message}`
        : `Error approving employer: ${error.message}`
      );
    }
  };

  const filteredEmployers = useMemo(() => {
    return employers.filter(employer => {
      // Filter by tab
      const matchesTab = activeTab === 'pending' 
        ? (employer.approvalStatus === 'pending' || !employer.approvalStatus)
        : (employer.approvalStatus === 'approved');
      
      const matchesSearch = searchTerm === '' || 
        employer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employer.industry.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilters = filters.length === 0 || 
        (filters.includes('verified') && employer.isVerified) ||
        (filters.includes('active') && employer.isActive);
      
      return matchesTab && matchesSearch && matchesFilters;
    });
  }, [employers, searchTerm, filters, activeTab]);

  const filteredWithdrawRequests = useMemo(() => {
    return withdrawRequests.filter(req => {
      const matchesSearch = searchTerm === '' || 
        req.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.accountNumber.includes(searchTerm);
      return matchesSearch;
    });
  }, [withdrawRequests, searchTerm]);

  // Pagination
  const totalPages = activeTab === 'withdrawals'
    ? Math.ceil(filteredWithdrawRequests.length / itemsPerPage)
    : Math.ceil(filteredEmployers.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  const currentEmployers = filteredEmployers.slice(startIndex, endIndex);
  const currentWithdrawRequests = filteredWithdrawRequests.slice(startIndex, endIndex);

  // Reset to page 1 when search, filters or tab change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, activeTab]);

  const handleFilterToggle = (filterValue) => {
    setFilters(prev => 
      prev.includes(filterValue) 
        ? prev.filter(f => f !== filterValue)
        : [...prev, filterValue]
    );
  };

  const stats = {
    total: employers.length,
    approved: employers.filter(e => e.approvalStatus === 'approved').length,
    pending: employers.filter(e => e.approvalStatus === 'pending').length,
    verified: employers.filter(e => e.isVerified).length,
  };

  const getCompanyInitials = (name) => {
    if (!name || name === 'N/A') return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getColorScheme = (index) => {
    const schemes = [
      { bg: '#e0e7ff', color: '#4338ca' },
      { bg: '#fef3c7', color: '#ca8a04' },
      { bg: '#dcfce7', color: '#15803d' },
      { bg: '#fee2e2', color: '#dc2626' },
      { bg: '#f3e8ff', color: '#7c3aed' },
    ];
    return schemes[index % schemes.length];
  };

  return (
    <DashboardLayout role="admin">
      <PageContainer>
        <PageHeader>
          <h1>{language === 'vi' ? 'Quản Lý Nhà Tuyển Dụng' : 'Employer Management'}</h1>
          <p>{language === 'vi' ? 'Quản lý thông tin và trạng thái của tất cả nhà tuyển dụng' : 'Manage information and status of all employers'}</p>
        </PageHeader>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>
              {language === 'vi' ? 'Đang tải dữ liệu...' : 'Loading data...'}
            </div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              {language === 'vi' ? 'Lỗi tải dữ liệu' : 'Error loading data'}
            </div>
            <div style={{ fontSize: '14px' }}>{error}</div>
          </div>
        )}

        {!loading && !error && (
          <>
            <StatsRow>
              <StatBox $color="#1e40af">
                <h3>{language === 'vi' ? 'Tổng nhà tuyển dụng' : 'Total Employers'}</h3>
                <p>{stats.total}</p>
              </StatBox>
              <StatBox $color="#10b981">
                <h3>{language === 'vi' ? 'Đã duyệt' : 'Approved'}</h3>
                <p>{stats.approved}</p>
              </StatBox>
              <StatBox $color="#f59e0b">
                <h3>{language === 'vi' ? 'Chờ duyệt' : 'Pending'}</h3>
                <p>{stats.pending}</p>
              </StatBox>
              <StatBox $color="#8b5cf6">
                <h3>{language === 'vi' ? 'Đã xác minh' : 'Verified'}</h3>
                <p>{stats.verified}</p>
              </StatBox>
            </StatsRow>

            <TabsContainer>
              <Tab 
                $active={activeTab === 'pending'}
                onClick={() => setActiveTab('pending')}
              >
                <Clock size={18} style={{ marginRight: '8px' }} />
                {language === 'vi' ? 'Chờ duyệt' : 'Pending Approval'}
              </Tab>
              <Tab 
                $active={activeTab === 'approved'}
                onClick={() => setActiveTab('approved')}
              >
                <CheckCircle size={18} style={{ marginRight: '8px' }} />
                {language === 'vi' ? 'Đã duyệt' : 'Approved'}
              </Tab>
              <Tab 
                $active={activeTab === 'withdrawals'}
                onClick={() => setActiveTab('withdrawals')}
              >
                <TrendingUp size={18} style={{ marginRight: '8px' }} />
                {language === 'vi' ? 'Yêu cầu rút tiền' : 'Withdrawal Requests'}
              </Tab>
            </TabsContainer>

            <FilterSection>
              <FilterWrapper>
                <TableFilter 
                  searchValue={searchTerm}
                  onSearchChange={setSearchTerm}
                  filterOptions={filterOptions}
                  activeFilters={filters}
                  onFilterToggle={handleFilterToggle}
                  searchPlaceholder={language === 'vi' ? 'Tìm kiếm công ty, email, ngành...' : 'Search company, email, industry...'}
                />
              </FilterWrapper>
              <RefreshButton onClick={handleRefresh} disabled={refreshing} $loading={refreshing}>
                <RefreshCw size={18} />
                {refreshing 
                  ? (language === 'vi' ? 'Đang tải...' : 'Loading...') 
                  : (language === 'vi' ? 'Làm mới' : 'Refresh')
                }
              </RefreshButton>
            </FilterSection>

            <TableWrapper>
              {activeTab === 'withdrawals' ? (
                <Table>
                  <thead>
                    <tr>
                      <th>{language === 'vi' ? 'Nhà tuyển dụng' : 'Employer'}</th>
                      <th>{language === 'vi' ? 'Số tiền rút' : 'Withdraw Amount'}</th>
                      <th>{language === 'vi' ? 'Thông tin thụ hưởng' : 'Beneficiary Details'}</th>
                      <th>{language === 'vi' ? 'Ngày yêu cầu' : 'Requested Date'}</th>
                      <th>{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                      <th>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentWithdrawRequests.map((req, index) => {
                      const colorScheme = getColorScheme(index);
                      const initials = getCompanyInitials(req.companyName);
                      
                      return (
                        <tr key={req.id}>
                          <td>
                            <CompanyInfo>
                              <CompanyLogo $bgColor={colorScheme.bg} $color={colorScheme.color}>
                                {req.companyLogo ? (
                                  <img src={req.companyLogo} alt={req.companyName} />
                                ) : (
                                  initials
                                )}
                              </CompanyLogo>
                              <CompanyDetails>
                                <CompanyName>{req.companyName}</CompanyName>
                                <CompanyMeta>
                                  <Building2 size={12} />
                                  ID: {req.employerId}
                                </CompanyMeta>
                              </CompanyDetails>
                            </CompanyInfo>
                          </td>
                          <td>
                            <span style={{ fontWeight: 800, color: '#b45309', fontSize: '15px' }}>
                              -{req.amount.toLocaleString('vi-VN')} VND
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                              <div><strong>NH:</strong> {req.bankName}</div>
                              <div><strong>STK:</strong> {req.accountNumber}</div>
                              <div style={{ textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>
                                <strong>Tên:</strong> {req.accountName}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} />
                              {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </td>
                          <td>
                            <StatusBadge $status={req.status}>
                              {req.status === 'approved' && <CheckCircle size={12} />}
                              {req.status === 'pending' && <Clock size={12} />}
                              {req.status === 'rejected' && <XCircle size={12} />}
                              {getStatusText(req.status)}
                            </StatusBadge>
                          </td>
                          <td>
                            {req.status === 'pending' ? (
                              <ActionButtons>
                                <ApproveButton onClick={() => handleApproveWithdrawal(req.id)}>
                                  <CheckCircle size={16} />
                                  {language === 'vi' ? 'Duyệt' : 'Approve'}
                                </ApproveButton>
                                <RejectButton onClick={() => handleRejectWithdrawal(req.id)}>
                                  <XCircle size={16} />
                                  {language === 'vi' ? 'Từ chối' : 'Reject'}
                                </RejectButton>
                              </ActionButtons>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                                {language === 'vi' ? 'Đã xử lý' : 'Processed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {currentWithdrawRequests.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                          {language === 'vi' ? 'Không tìm thấy yêu cầu rút tiền nào' : 'No withdrawal requests found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th>{language === 'vi' ? 'Công ty' : 'Company'}</th>
                      <th>{language === 'vi' ? 'Liên hệ' : 'Contact'}</th>
                      <th>{language === 'vi' ? 'Ngành' : 'Industry'}</th>
                      <th>{language === 'vi' ? 'Quy mô' : 'Size'}</th>
                      <th>{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                      <th>{language === 'vi' ? 'Xác minh' : 'Verified'}</th>
                      <th>{language === 'vi' ? 'Ngày tham gia' : 'Joined'}</th>
                      <th>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEmployers.map((employer, index) => {
                      const colorScheme = getColorScheme(index);
                      const initials = getCompanyInitials(employer.companyName);
                      
                      return (
                        <tr key={employer.id}>
                          <td>
                            <CompanyInfo>
                              <CompanyLogo $bgColor={colorScheme.bg} $color={colorScheme.color}>
                                {employer.companyLogo ? (
                                  <img src={employer.companyLogo} alt={employer.companyName} />
                                ) : (
                                  initials
                                )}
                              </CompanyLogo>
                              <CompanyDetails>
                                <CompanyName>{employer.companyName}</CompanyName>
                                <CompanyMeta>
                                  <Building2 size={12} />
                                  {employer.foundedYear !== 'N/A' ? `Thành lập ${employer.foundedYear}` : 'Chưa cập nhật'}
                                </CompanyMeta>
                              </CompanyDetails>
                            </CompanyInfo>
                          </td>
                          <td>
                            <div style={{ fontSize: '13px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                <Mail size={12} />
                                {employer.email}
                              </div>
                              {employer.phone !== 'N/A' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B' }}>
                                  <Phone size={12} />
                                  {employer.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{employer.industry}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Users size={14} />
                              {employer.companySize}
                            </div>
                          </td>
                          <td>
                            {activeTab === 'pending' ? (
                              <ApproveButton onClick={() => handleApprove(employer.id)}>
                                <CheckCircle size={16} />
                                {language === 'vi' ? 'Duyệt' : 'Approve'}
                              </ApproveButton>
                            ) : (
                              <StatusBadge $status={employer.approvalStatus}>
                                {employer.approvalStatus === 'approved' && <CheckCircle size={12} />}
                                {employer.approvalStatus === 'pending' && <Clock size={12} />}
                                {employer.approvalStatus === 'rejected' && <XCircle size={12} />}
                                {getStatusText(employer.approvalStatus)}
                              </StatusBadge>
                            )}
                          </td>
                          <td>
                            <VerifiedBadge $verified={employer.isVerified}>
                              {employer.isVerified ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {employer.isVerified 
                                ? (language === 'vi' ? 'Đã xác minh' : 'Verified')
                                : (language === 'vi' ? 'Chưa xác minh' : 'Not Verified')
                              }
                            </VerifiedBadge>
                          </td>
                          <td>
                            <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} />
                              {employer.createdAt ? new Date(employer.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </div>
                          </td>
                          <td>
                            <ActionButtons>
                              <IconButton 
                                title={language === 'vi' ? 'Xem chi tiết' : 'View details'}
                                onClick={() => navigate(`/admin/employers/${employer.id}`)}
                              >
                                <Eye size={16} />
                              </IconButton>
                            </ActionButtons>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </TableWrapper>

            <PaginationContainer>
              <PaginationInfo>
                {activeTab === 'withdrawals' ? (
                  language === 'vi' 
                    ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, filteredWithdrawRequests.length)} trong tổng số ${filteredWithdrawRequests.length} yêu cầu rút tiền`
                    : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredWithdrawRequests.length)} of ${filteredWithdrawRequests.length} withdrawal requests`
                ) : (
                  language === 'vi' 
                    ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, filteredEmployers.length)} trong tổng số ${filteredEmployers.length} nhà tuyển dụng`
                    : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredEmployers.length)} of ${filteredEmployers.length} employers`
                )}
              </PaginationInfo>
              <PaginationButtons>
                <PageButton 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  {language === 'vi' ? 'Trước' : 'Previous'}
                </PageButton>
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <PageButton
                        key={pageNumber}
                        $active={currentPage === pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </PageButton>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <PageEllipsis key={pageNumber}>...</PageEllipsis>;
                  }
                  return null;
                })}
                
                <PageButton 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  {language === 'vi' ? 'Sau' : 'Next'}
                </PageButton>
              </PaginationButtons>
            </PaginationContainer>
          </>
        )}
      </PageContainer>

      {/* Success Modal */}
      {showSuccessModal && (
        <ModalOverlay onClick={() => setShowSuccessModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalIcon>
              <CheckCircle />
            </ModalIcon>
            <ModalTitle>
              {language === 'vi' ? 'Duyệt thành công!' : 'Approved Successfully!'}
            </ModalTitle>
            <ModalMessage>
              {language === 'vi' 
                ? 'Nhà tuyển dụng đã được duyệt thành công. Họ có thể bắt đầu sử dụng các tính năng của hệ thống.'
                : 'The employer has been approved successfully. They can now start using the system features.'
              }
            </ModalMessage>
            <ModalButton onClick={() => setShowSuccessModal(false)}>
              {language === 'vi' ? 'Đóng' : 'Close'}
            </ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </DashboardLayout>
  );
};

export default EmployersManagement;
