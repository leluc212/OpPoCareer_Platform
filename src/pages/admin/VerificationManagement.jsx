import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ShieldCheck, Search, Filter, Eye, Check, X, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import employerProfileService from '../../services/employerProfileService';
import VerificationApprovalModal from '../../components/VerificationApprovalModal';

const Container = styled.div`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const PageTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PageIconBox = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 15px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 22px;
    height: 22px;
    color: #1e40af;
  }
`;

const PageTitleText = styled.div`
  h1 {
    font-size: 26px;
    font-weight: 800;
    color: ${props => props.theme.colors.text};
    letter-spacing: -0.5px;
    line-height: 1.2;
    margin-bottom: 4px;
  }
  
  p {
    color: ${props => props.theme.colors.textLight};
    font-size: 13.5px;
    font-weight: 500;
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  flex: 1;
  min-width: 300px;
  position: relative;
  
  svg {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: #64748B;
  }
  
  input {
    width: 100%;
    padding: 12px 16px 12px 46px;
    border: 1.5px solid #E8EFFF;
    border-radius: 12px;
    font-size: 14px;
    transition: all 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
`;

const FilterButton = styled.button`
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1.5px solid;
  
  ${props => props.$active ? `
    background: #1e40af;
    color: white;
    border-color: #1e40af;
  ` : `
    background: white;
    color: #64748B;
    border-color: #E8EFFF;
    
    &:hover {
      background: #F8FAFC;
      border-color: #BFDBFE;
    }
  `}
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  padding: 20px;
  background: white;
  border: 1.5px solid #E8EFFF;
  border-radius: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.1);
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 800;
    color: ${props => props.$color || '#1e40af'};
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 13px;
    color: #64748B;
    font-weight: 600;
  }
`;

const TableContainer = styled.div`
  background: white;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Thead = styled.thead`
  background: #F8FAFC;
  border-bottom: 2px solid #E8EFFF;
`;

const Th = styled.th`
  padding: 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Tbody = styled.tbody``;

const Tr = styled.tr`
  border-bottom: 1px solid #F1F5F9;
  transition: all 0.2s ease;
  
  &:hover {
    background: #F8FAFC;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const Td = styled.td`
  padding: 16px;
  font-size: 14px;
  color: #1E293B;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  
  ${props => {
    switch (props.$status) {
      case 'pending':
        return `
          background: #FEF3C7;
          color: #92400E;
          border: 1.5px solid #FCD34D;
        `;
      case 'approved':
        return `
          background: #D1FAE5;
          color: #065F46;
          border: 1.5px solid #34D399;
        `;
      case 'rejected':
        return `
          background: #FEE2E2;
          color: #991B1B;
          border: 1.5px solid #FCA5A5;
        `;
      default:
        return `
          background: #F3F4F6;
          color: #6B7280;
          border: 1.5px solid #E5E7EB;
        `;
    }
  }}
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1.5px solid;
  background: #EFF6FF;
  color: #1e40af;
  border-color: #BFDBFE;
  
  &:hover {
    background: #DBEAFE;
    border-color: #93C5FD;
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const EmptyState = styled.div`
  padding: 60px 20px;
  text-align: center;
  
  .icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  h3 {
    font-size: 18px;
    font-weight: 700;
    color: #1E293B;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 14px;
    color: #64748B;
  }
`;

const VerificationManagement = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with API call
  useEffect(() => {
    loadVerificationRequests();
  }, []);

  const loadVerificationRequests = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call to load verification requests
      setVerificationRequests([]);
      setFilteredRequests([]);
    } catch (error) {
      console.error('Error loading verification requests:', error);
      toast.error(language === 'vi' ? 'Không thể tải danh sách xác thực' : 'Failed to load verification requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter requests
  useEffect(() => {
    let filtered = verificationRequests;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req => 
        req.companyName?.toLowerCase().includes(query) ||
        req.taxCode?.toLowerCase().includes(query) ||
        req.userId?.toLowerCase().includes(query)
      );
    }
    
    setFilteredRequests(filtered);
  }, [verificationRequests, statusFilter, searchQuery]);

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleApprove = async (approvalData) => {
    try {
      await employerProfileService.approveVerification(selectedRequest.userId, {
        approvedBy: user.username,
        notes: approvalData.notes
      });
      
      toast.success(language === 'vi' ? 'Đã phê duyệt hồ sơ thành công!' : 'Verification approved successfully!');
      
      // Update local state
      setVerificationRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, status: 'approved', approvedAt: new Date().toISOString() }
            : req
        )
      );
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error(language === 'vi' ? 'Không thể phê duyệt hồ sơ' : 'Failed to approve verification');
    }
  };

  const handleReject = async (rejectionData) => {
    try {
      await employerProfileService.rejectVerification(selectedRequest.userId, {
        rejectedBy: user.username,
        reason: rejectionData.reason
      });
      
      toast.success(language === 'vi' ? 'Đã từ chối hồ sơ' : 'Verification rejected');
      
      // Update local state
      setVerificationRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, status: 'rejected', rejectedAt: new Date().toISOString() }
            : req
        )
      );
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error(language === 'vi' ? 'Không thể từ chối hồ sơ' : 'Failed to reject verification');
    }
  };

  const stats = {
    total: verificationRequests.length,
    pending: verificationRequests.filter(r => r.status === 'pending').length,
    approved: verificationRequests.filter(r => r.status === 'approved').length,
    rejected: verificationRequests.filter(r => r.status === 'rejected').length
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock />;
      case 'approved': return <Check />;
      case 'rejected': return <X />;
      default: return <AlertCircle />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return language === 'vi' ? 'Chờ duyệt' : 'Pending';
      case 'approved': return language === 'vi' ? 'Đã duyệt' : 'Approved';
      case 'rejected': return language === 'vi' ? 'Từ chối' : 'Rejected';
      default: return status;
    }
  };

  return (
    <Container>
      <PageHeader>
        <PageTitleGroup>
          <PageIconBox>
            <ShieldCheck />
          </PageIconBox>
          <PageTitleText>
            <h1>{language === 'vi' ? 'Quản Lý Xác Thực' : 'Verification Management'}</h1>
            <p>{language === 'vi' ? 'Phê duyệt hồ sơ công ty' : 'Approve company verifications'}</p>
          </PageTitleText>
        </PageTitleGroup>
      </PageHeader>

      <StatsGrid>
        <StatCard $color="#1e40af">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">{language === 'vi' ? 'Tổng số' : 'Total'}</div>
        </StatCard>
        <StatCard $color="#F59E0B">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">{language === 'vi' ? 'Chờ duyệt' : 'Pending'}</div>
        </StatCard>
        <StatCard $color="#10B981">
          <div className="stat-value">{stats.approved}</div>
          <div className="stat-label">{language === 'vi' ? 'Đã duyệt' : 'Approved'}</div>
        </StatCard>
        <StatCard $color="#EF4444">
          <div className="stat-value">{stats.rejected}</div>
          <div className="stat-label">{language === 'vi' ? 'Từ chối' : 'Rejected'}</div>
        </StatCard>
      </StatsGrid>

      <FilterBar>
        <SearchBox>
          <Search />
          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm kiếm theo tên công ty, mã số thuế...' : 'Search by company name, tax code...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchBox>
        <FilterButton 
          $active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        >
          {language === 'vi' ? 'Tất cả' : 'All'}
        </FilterButton>
        <FilterButton 
          $active={statusFilter === 'pending'}
          onClick={() => setStatusFilter('pending')}
        >
          <Clock />
          {language === 'vi' ? 'Chờ duyệt' : 'Pending'}
        </FilterButton>
        <FilterButton 
          $active={statusFilter === 'approved'}
          onClick={() => setStatusFilter('approved')}
        >
          <Check />
          {language === 'vi' ? 'Đã duyệt' : 'Approved'}
        </FilterButton>
        <FilterButton 
          $active={statusFilter === 'rejected'}
          onClick={() => setStatusFilter('rejected')}
        >
          <X />
          {language === 'vi' ? 'Từ chối' : 'Rejected'}
        </FilterButton>
      </FilterBar>

      <TableContainer>
        {isLoading ? (
          <EmptyState>
            <div className="icon">⏳</div>
            <h3>{language === 'vi' ? 'Đang tải...' : 'Loading...'}</h3>
          </EmptyState>
        ) : filteredRequests.length === 0 ? (
          <EmptyState>
            <div className="icon">📋</div>
            <h3>{language === 'vi' ? 'Không có yêu cầu nào' : 'No requests found'}</h3>
            <p>{language === 'vi' ? 'Chưa có yêu cầu xác thực nào' : 'No verification requests yet'}</p>
          </EmptyState>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>{language === 'vi' ? 'Công ty' : 'Company'}</Th>
                <Th>{language === 'vi' ? 'Mã số thuế' : 'Tax Code'}</Th>
                <Th>{language === 'vi' ? 'Ngày gửi' : 'Submitted'}</Th>
                <Th>{language === 'vi' ? 'Trạng thái' : 'Status'}</Th>
                <Th>{language === 'vi' ? 'Thao tác' : 'Actions'}</Th>
              </tr>
            </Thead>
            <Tbody>
              {filteredRequests.map((request) => (
                <Tr key={request.id}>
                  <Td>{request.companyName || 'N/A'}</Td>
                  <Td>{request.taxCode || 'N/A'}</Td>
                  <Td>
                    {request.submittedAt 
                      ? new Date(request.submittedAt).toLocaleDateString('vi-VN')
                      : 'N/A'}
                  </Td>
                  <Td>
                    <StatusBadge $status={request.status}>
                      {getStatusIcon(request.status)}
                      {getStatusText(request.status)}
                    </StatusBadge>
                  </Td>
                  <Td>
                    <ActionButton onClick={() => handleViewRequest(request)}>
                      <Eye />
                      {language === 'vi' ? 'Xem chi tiết' : 'View Details'}
                    </ActionButton>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </TableContainer>

      {selectedRequest && (
        <VerificationApprovalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          verificationData={selectedRequest.verificationData}
          employerProfile={selectedRequest.employerProfile}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </Container>
  );
};

export default VerificationManagement;
