import { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import TableFilter from '../../components/TableFilter';
import { useLanguage } from '../../context/LanguageContext';
import UrgentRecommendationsModal from '../../components/UrgentRecommendationsModal';
import { useNavigate, useLocation } from 'react-router-dom';
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
  RefreshCw,
  Zap,
  User,
  Award,
  Briefcase,
  FileText,
  Trash2,
  Lock,
  Unlock,
  Star,
  Package
} from 'lucide-react';
import adminEmployerService from '../../services/adminEmployerService';
import applicationService from '../../services/applicationService';
import {
  createQuickJobActivationApprovedNotification,
  createQuickJobActivationRejectedNotification,
  createQuickJobActivationDeactivatedNotification,
  createChangeRequestApprovedNotification,
  createChangeRequestRejectedNotification
} from '../../services/notificationService';

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
    if (props.$status === 'active') return '#dbeafe';
    if (props.$status === 'rejected' || props.$status === 'locked') return '#fee2e2';
    if (props.$status === 'pending' || props.$status === 'expiring') return '#fef3c7';
    if (props.$status === 'expired') return '#f3f4f6';
    return '#f3f4f6';
  }};
  color: ${props => {
    if (props.$status === 'approved') return '#15803d';
    if (props.$status === 'active') return '#1e40af';
    if (props.$status === 'rejected' || props.$status === 'locked') return '#dc2626';
    if (props.$status === 'pending' || props.$status === 'expiring') return '#ca8a04';
    if (props.$status === 'expired') return '#94a3b8';
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

const DeleteButton = styled(IconButton)`
  background: #fee2e2;
  color: #dc2626;
  &:hover {
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
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

const TabBadge = styled.span`
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 6px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MainTabsContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  border-bottom: 2px solid ${props => props.theme.colors.border || '#E2E8F0'};
  padding-bottom: 4px;
  flex-wrap: wrap;
`;

const MainTabButton = styled.button`
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: transparent;
  border: none;
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.textLight || '#64748B'};
  position: relative;
  transition: all 0.25s ease-in-out;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px 12px 0 0;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.bgLight || '#F8FAFC'};
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.$active ? `linear-gradient(90deg, ${props.theme.colors.primary} 0%, #3b82f6 100%)` : 'transparent'};
    border-radius: 4px;
    transition: all 0.25s ease-in-out;
  }
`;

const SubTabsContainer = styled.div`
  display: flex;
  gap: 8px;
  background: ${props => props.theme.colors.bgLight || '#F1F5F9'};
  padding: 6px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid ${props => props.theme.colors.border || '#E2E8F0'};
  width: fit-content;
  align-items: center;
  flex-wrap: wrap;
`;

const SubTabButton = styled.button`
  padding: 8px 18px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  background: ${props => props.$active ? 'white' : 'transparent'};
  border: none;
  border-radius: 8px;
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.textLight || '#64748B'};
  box-shadow: ${props => props.$active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'};
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const FormCard = styled.div`
  background: ${props => props.theme.colors.bgLight || 'white'};
  border: 1px solid ${props => props.theme.colors.border || '#E2E8F0'};
  border-radius: ${props => props.theme.borderRadius.lg || '12px'};
  padding: 32px;
  max-width: 600px;
  margin: 0 auto 24px;
  box-shadow: ${props => props.theme.shadows.sm || '0 4px 6px rgba(0,0,0,0.05)'};
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FormLabel = styled.label`
  font-size: 14.5px;
  font-weight: 700;
  color: ${props => props.theme.colors.text || '#1E293B'};
`;

const FormSelect = styled.select`
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border || '#CBD5E1'};
  background: white;
  font-size: 14.5px;
  color: ${props => props.theme.colors.text || '#1E293B'};
  outline: none;
  transition: all 0.2s;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
  }
`;

const SubmitButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: ${props => props.theme.colors.primary};
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.primary}30;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PackageBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 13px;
  font-weight: 600;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const DateText = styled.span`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  display: block;
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

/** Kiểm tra xem chuỗi có phải UUID không (tránh hiển thị ID thô lên UI) */
const isUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

const EmployersManagement = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('verifications');
  const [mainTab, setMainTab] = useState('verification');

  // Nếu được navigate từ AdminDashboard với state.activeTab, tự động chuyển tab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);

  useEffect(() => {
    if (['pending', 'approved', 'verifications'].includes(activeTab)) {
      setMainTab('verification');
    } else if (activeTab === 'all_employers') {
      setMainTab('all_employers');
    } else if (activeTab === 'change_requests') {
      setMainTab('change_requests');
    } else if (['quick_jobs', 'grant_package'].includes(activeTab)) {
      setMainTab('features');
    }
  }, [activeTab]);

  const itemsPerPage = 20;

  const [employers, setEmployers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedEmployerId, setSelectedEmployerId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    if (activeTab === 'grant_package' && packages.length === 0) {
      const loadPackages = async () => {
        setLoadingPackages(true);
        try {
          const { getPackageCatalog } = await import('../../services/packageCatalogService');
          const catalog = await getPackageCatalog();
          setPackages(catalog);
        } catch (err) {
          console.error('Error loading packages:', err);
        } finally {
          setLoadingPackages(false);
        }
      };
      loadPackages();
    }
  }, [activeTab, packages.length]);

  const selectedPackage = useMemo(() => {
    return packages.find(p => p.packageId === selectedPackageId);
  }, [packages, selectedPackageId]);

  // Reset duration when package changes
  useEffect(() => {
    setSelectedDuration('');
  }, [selectedPackageId]);

  const handleGrantPackage = async (e) => {
    e.preventDefault();
    if (!selectedEmployerId || !selectedPackageId || !selectedDuration) {
      showEmpToast('warning', language === 'vi' ? 'Vui lòng điền đầy đủ thông tin' : 'Please fill out all fields');
      return;
    }

    setGranting(true);
    try {
      const API_ENDPOINT = import.meta.env.VITE_PACKAGE_SUBSCRIPTIONS_API || 'https://u28w4m6yb7.execute-api.ap-southeast-1.amazonaws.com/prod';
      
      const targetEmp = employers.find(e => e.id === selectedEmployerId);
      const companyName = targetEmp?.companyName || 'Nhà tuyển dụng';

      const purchaseData = {
        employerId: selectedEmployerId,
        companyName: companyName,
        packageName: selectedPackage.packageName,
        duration: selectedDuration,
        paymentMethod: 'admin_granted'
      };

      console.log('📤 Admin granting package - Creating subscription:', purchaseData);

      const response = await fetch(`${API_ENDPOINT}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(purchaseData)
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const result = await response.json();
      const subscriptionId = result.data?.subscriptionId || result.subscriptionId;

      console.log('✅ Subscription created. Now activating:', subscriptionId);

      const approveResponse = await fetch(`${API_ENDPOINT}/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'active',
          approvalStatus: 'approved'
        })
      });

      if (!approveResponse.ok) {
        throw new Error('Failed to activate subscription');
      }

      const updatedSubscription = await approveResponse.json();
      const finalExpiryDate = updatedSubscription.expiryDate || updatedSubscription.data?.expiryDate;

      // Create notification for employer
      try {
        const { createPackageApprovedNotification } = await import('../../services/notificationService');
        await createPackageApprovedNotification({
          subscriptionId,
          packageName: selectedPackage.packageName,
          duration: selectedDuration,
          expiryDate: finalExpiryDate
        }, selectedEmployerId);
      } catch (notifyErr) {
        console.error('❌ Error sending notification:', notifyErr);
      }

      setGrantedPackageDetails({
        packageName: selectedPackage.packageName,
        companyName: employers.find(e => e.id === selectedEmployerId)?.companyName || selectedEmployerId,
        duration: selectedDuration,
        expiryDate: finalExpiryDate ? formatDateTime(finalExpiryDate) : ''
      });
      setShowGrantSuccessModal(true);
      setSelectedEmployerId('');
      setSelectedPackageId('');
      setSelectedDuration('');
      await loadPurchases();
    } catch (err) {
      console.error('Error granting package:', err);
      setGrantErrorModalMsg(err.message || 'Unknown error');
    } finally {
      setGranting(false);
    }
  };

  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [purchasesError, setPurchasesError] = useState(null);

  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('');
  const [purchaseFilters, setPurchaseFilters] = useState([]);
  const [purchaseCurrentPage, setPurchaseCurrentPage] = useState(1);
  const [packageTab, setPackageTab] = useState('pending');
  const [showPurchaseSuccessModal, setShowPurchaseSuccessModal] = useState(false);
  const [approvedPurchaseInfo, setApprovedPurchaseInfo] = useState(null);
  const [showPurchaseLockConfirm, setShowPurchaseLockConfirm] = useState(false);
  const [purchaseLockTarget, setPurchaseLockTarget] = useState(null);

  const loadPurchases = async () => {
    try {
      setLoadingPurchases(true);
      const API_ENDPOINT = import.meta.env.VITE_PACKAGE_SUBSCRIPTIONS_API || 'https://u28w4m6yb7.execute-api.ap-southeast-1.amazonaws.com/prod';
      const response = await fetch(`${API_ENDPOINT}/subscriptions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      
      const data = await response.json();
      
      const transformedData = data.map(item => ({
        id: item.subscriptionId,
        employer: item.companyName,
        package: item.packageName,
        purchaseDate: item.purchaseDate,
        purchaseDateTime: item.purchaseDateTime,
        expiryDate: item.expiryDate,
        expiryDateTime: item.expiryDateTime,
        status: item.status,
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price),
        duration: item.duration,
        approvalStatus: item.approvalStatus
      }));
      
      setPurchases(transformedData);
      setPurchasesError(null);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setPurchasesError(err.message);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const purchaseFilterOptions = [
    { value: 'Quick Boost', label: 'Quick Boost' },
    { value: 'Hot Search', label: 'Hot Search' },
    { value: 'Spotlight Banner', label: 'Spotlight Banner' },
    { value: 'Top Spotlight', label: 'Top Spotlight' },
    { value: 'active', label: language === 'vi' ? 'Đang hoạt động' : 'Active' },
    { value: 'locked', label: language === 'vi' ? 'Bị khóa' : 'Locked' },
    { value: 'expiring', label: language === 'vi' ? 'Sắp hết hạn' : 'Expiring' },
    { value: 'expired', label: language === 'vi' ? 'Đã hết hạn' : 'Expired' },
  ];

  const packageIcons = {
    'Quick Boost': Zap,
    'Hot Search': TrendingUp,
    'Spotlight Banner': Star,
    'Top Spotlight': Package
  };

  const packageColors = {
    'Quick Boost': '#3b82f6',
    'Hot Search': '#f59e0b',
    'Spotlight Banner': '#8b5cf6',
    'Top Spotlight': '#ef4444'
  };

  const filteredPurchases = useMemo(() => {
    const list = purchases.filter(purchase => {
      const matchesTab = packageTab === 'pending'
        ? (purchase.approvalStatus === 'pending' || purchase.status === 'pending')
        : (purchase.status === 'active' || purchase.status === 'expiring' || purchase.status === 'expired' || purchase.status === 'locked');
      
      const matchesSearch = purchaseSearchTerm === '' ||
        purchase.employer.toLowerCase().includes(purchaseSearchTerm.toLowerCase()) ||
        purchase.package.toLowerCase().includes(purchaseSearchTerm.toLowerCase());
      
      const matchesFilters = purchaseFilters.length === 0 ||
        purchaseFilters.includes(purchase.package) ||
        purchaseFilters.includes(purchase.status);
      
      return matchesTab && matchesSearch && matchesFilters;
    });

    const parseDate = (dateStr) => {
      if (!dateStr) return 0;
      if (dateStr.includes('T') || dateStr.includes('-')) {
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
      }
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        const parsed = new Date(`${year}-${month}-${day}`);
        return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
      }
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    };

    // Auto-sort purchases:
    // 1. Active packages (status !== 'expired') go first, Expired packages (status === 'expired') go last.
    // 2. Within each group, sort by purchaseDateTime or purchaseDate (newest first).
    return [...list].sort((a, b) => {
      const aExpired = a.status === 'expired';
      const bExpired = b.status === 'expired';
      
      if (!aExpired && bExpired) return -1;
      if (aExpired && !bExpired) return 1;
      
      const aTime = parseDate(a.purchaseDateTime || a.purchaseDate);
      const bTime = parseDate(b.purchaseDateTime || b.purchaseDate);
      return bTime - aTime;
    });
  }, [purchases, purchaseSearchTerm, purchaseFilters, packageTab]);

  const purchaseItemsPerPage = 10;
  const purchaseTotalPages = Math.ceil(filteredPurchases.length / purchaseItemsPerPage);
  const purchaseStartIndex = (purchaseCurrentPage - 1) * purchaseItemsPerPage;
  const purchaseEndIndex = purchaseStartIndex + purchaseItemsPerPage;
  const currentPurchases = filteredPurchases.slice(purchaseStartIndex, purchaseEndIndex);

  useMemo(() => {
    setPurchaseCurrentPage(1);
  }, [purchaseSearchTerm, purchaseFilters]);

  const handlePurchaseFilterToggle = (filterValue) => {
    setPurchaseFilters(prev =>
      prev.includes(filterValue)
        ? prev.filter(f => f !== filterValue)
        : [...prev, filterValue]
    );
  };

  const handleApprovePurchase = async (purchaseId) => {
    try {
      console.log('🔄 Approving purchase:', purchaseId);
      
      const API_ENDPOINT = import.meta.env.VITE_PACKAGE_SUBSCRIPTIONS_API || 'https://u28w4m6yb7.execute-api.ap-southeast-1.amazonaws.com/prod';
      
      const responseSub = await fetch(`${API_ENDPOINT}/subscriptions/${purchaseId}`);
      if (!responseSub.ok) {
        throw new Error('Failed to fetch subscription details');
      }
      const subscriptionData = await responseSub.json();
      
      let employerId = subscriptionData.employerId 
        || subscriptionData.data?.employerId
        || subscriptionData.userId
        || subscriptionData.data?.userId;
      
      if (!employerId) {
        throw new Error('Cannot find employerId in subscription data');
      }
      
      const response = await fetch(`${API_ENDPOINT}/subscriptions/${purchaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'active',
          approvalStatus: 'approved'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve subscription');
      }
      
      const updatedSubscription = await response.json();
      const purchase = purchases.find(p => p.id === purchaseId);
      
      if (!purchase) {
        throw new Error('Purchase not found in local state');
      }
      
      const finalExpiryDate = updatedSubscription.expiryDate || updatedSubscription.data?.expiryDate;
      const finalExpiryDateTime = updatedSubscription.expiryDateTime || updatedSubscription.data?.expiryDateTime;

      try {
        const { createPackageApprovedNotification } = await import('../../services/notificationService');
        await createPackageApprovedNotification({
          subscriptionId: purchaseId,
          packageName: purchase.package,
          duration: purchase.duration,
          expiryDate: finalExpiryDate
        }, employerId);
      } catch (notifyErr) {
        console.error('❌ Error sending notification:', notifyErr);
      }
      
      setApprovedPurchaseInfo({
        employer: purchase.employer,
        package: purchase.package,
        duration: purchase.duration,
        expiryDate: finalExpiryDate,
        expiryDateTime: finalExpiryDateTime
      });
      setShowPurchaseSuccessModal(true);
      
      setPurchases(prev => prev.map(p => 
        p.id === purchaseId 
          ? {
              ...p,
              status: updatedSubscription.status || updatedSubscription.data?.status || 'active',
              approvalStatus: updatedSubscription.approvalStatus || updatedSubscription.data?.approvalStatus || 'approved',
              purchaseDate: updatedSubscription.purchaseDate || updatedSubscription.data?.purchaseDate || p.purchaseDate,
              purchaseDateTime: updatedSubscription.purchaseDateTime || updatedSubscription.data?.purchaseDateTime || p.purchaseDateTime,
              expiryDate: finalExpiryDate || p.expiryDate,
              expiryDateTime: finalExpiryDateTime || p.expiryDateTime
            }
          : p
      ));
      
    } catch (error) {
      console.error('❌ Error approving subscription:', error);
      showEmpToast('error', 'Có lỗi xảy ra: ' + error.message);
    }
  };

  const handleLockPurchase = async (purchaseId) => {
    try {
      const API_ENDPOINT = import.meta.env.VITE_PACKAGE_SUBSCRIPTIONS_API || 'https://u28w4m6yb7.execute-api.ap-southeast-1.amazonaws.com/prod';
      const response = await fetch(`${API_ENDPOINT}/subscriptions/${purchaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'locked' })
      });

      if (!response.ok) {
        throw new Error('Failed to lock subscription');
      }

      const updatedSubscription = await response.json();

      setPurchases(prev => prev.map(p =>
        p.id === purchaseId
          ? {
              ...p,
              status: updatedSubscription.status || updatedSubscription.data?.status || 'locked'
            }
          : p
      ));
    } catch (error) {
      console.error('❌ Error locking subscription:', error);
      showEmpToast('error', 'Có lỗi xảy ra: ' + error.message);
    }
  };

  const handleUnlockPurchase = async (purchaseId) => {
    try {
      const API_ENDPOINT = import.meta.env.VITE_PACKAGE_SUBSCRIPTIONS_API || 'https://u28w4m6yb7.execute-api.ap-southeast-1.amazonaws.com/prod';
      const response = await fetch(`${API_ENDPOINT}/subscriptions/${purchaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'active' })
      });

      if (!response.ok) {
        throw new Error('Failed to unlock subscription');
      }

      const updatedSubscription = await response.json();

      setPurchases(prev => prev.map(p =>
        p.id === purchaseId
          ? {
              ...p,
              status: updatedSubscription.status || updatedSubscription.data?.status || 'active'
            }
          : p
      ));
    } catch (error) {
      console.error('❌ Error unlocking subscription:', error);
      showEmpToast('error', 'Có lỗi xảy ra: ' + error.message);
    }
  };

  const openPurchaseLockConfirm = (purchase) => {
    setPurchaseLockTarget(purchase);
    setShowPurchaseLockConfirm(true);
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showGrantSuccessModal, setShowGrantSuccessModal] = useState(false);
  const [grantedPackageDetails, setGrantedPackageDetails] = useState(null);
  const [grantErrorModalMsg, setGrantErrorModalMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [changeRequests, setChangeRequests] = useState([]);
  const [selectedChangeRequest, setSelectedChangeRequest] = useState(null);
  const [isProcessingChange, setIsProcessingChange] = useState(false);

  // AI Urgent recommendations
  const [showRecsModal, setShowRecsModal] = useState(false);
  const [activeRecommendations, setActiveRecommendations] = useState(null);
  const [recJobTitle, setRecJobTitle] = useState('');

  // Toast state — thay thế toàn bộ alert() / confirm() trong trang này
  const [empToast, setEmpToast] = useState(null); // { type: 'success'|'error'|'warning', message }
  const [empConfirm, setEmpConfirm] = useState(null); // { message, onConfirm }
  const showEmpToast = (type, message) => {
    setEmpToast({ type, message });
    setTimeout(() => setEmpToast(null), 3500);
  };
  const [selectedVerification, setSelectedVerification] = useState(null); // { employer, verificationData, submittedAt, status }
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [isProcessingVerification, setIsProcessingVerification] = useState(false);



  const loadChangeRequests = async () => {
    try {
      console.log('📥 Loading personnel change requests...');
      // Dùng listChangeRequests() thay vì getAllApplications() để lấy data đã được
      // enrich employerName + workerName từ backend (tránh hiện UUID thô).
      // listChangeRequests() gọi GET /applications/change-requests — đã filter sẵn.
      let pendingChanges = await applicationService.listChangeRequests();
      pendingChanges = (pendingChanges || []).filter(app => {
        // Loại cancelled
        const crStatus = app.changeRequestStatus || app.change_request_status ||
          (app.changeRequest && app.changeRequest.status) ||
          (app.change_request && app.change_request.status) ||
          (app.extraFields && (app.extraFields.changeRequestStatus || app.extraFields.change_request_status));
        const isCancelled = crStatus && String(crStatus).toLowerCase() === 'cancelled';
        return !isCancelled;
      });

      // Enhance with employer info if missing or needed
      const enhanced = pendingChanges.map(app => {
        const emp = employers.find(e => e.id === app.employerId);

        // Normalize changeRequest field (support various casing, nested payloads, and stringified payloads)
        let cr = app.changeRequest || app.change_request || app.change_request_payload || app.change_request?.payload || app.extraFields?.changeRequest || app.extraFields?.change_request || null;
        if (cr && typeof cr === 'string') {
          try {
            cr = JSON.parse(cr);
          } catch (e) {
            console.warn('Could not parse changeRequest string for app', app.applicationId, e.message);
          }
        }

        // If the structure is nested (e.g. { payload: '{...}' }) try to extract
        if (cr && typeof cr === 'object') {
          if (!cr.reason && (cr.payload || cr.data)) {
            let nested = cr.payload || cr.data;
            if (typeof nested === 'string') {
              try {
                nested = JSON.parse(nested);
              } catch (e) {
                nested = null;
              }
            }
            if (nested && typeof nested === 'object') cr = { ...nested, ...cr };
          }
        }

        // Pick reason from many possible keys used across backends/clients
        const reason = cr && (cr.reasonDetail || cr.reason || cr.message || cr.detail || cr.description || cr.reasonText || cr.note || cr.reason_code || cr.reasonCode || cr.messageText);
        const reasonCode = cr && (cr.reasonCode || cr.reason_code || cr.reasonCode || cr.type || cr.reasonType);
        const typeLabel = cr && (cr.typeLabel || cr.type_label || cr.reasonLabel || cr.reason_label || cr.typeName || cr.typeNameLabel);
        const requestedAt = cr && (cr.requestedAt || cr.requested_at || cr.time || cr.createdAt || cr.created_at);
        const urgency = cr && (cr.urgency || cr.priority || 'normal');

        const normalizedCR = cr
          ? {
            ...cr,
            reason: reason || '',
            reasonCode: reasonCode || '',
            typeLabel: typeLabel || cr.typeLabel || '',
            requestedAt: requestedAt || '',
            urgency: urgency
          }
          : null;

        // Fallback: if server returned null, try to load from localStorage (client saved on submit)
        let finalCR = normalizedCR;
        if (!finalCR) {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              const key = `cr_${app.applicationId}`;
              const raw = localStorage.getItem(key);
              if (raw) {
                const parsed = JSON.parse(raw);
                finalCR = {
                  ...parsed,
                  reason: parsed.reason || parsed.message || '',
                  typeLabel: parsed.typeLabel || parsed.type || '',
                  requestedAt: parsed.requestedAt || ''
                };
                console.log(`Loaded changeRequest from localStorage for ${app.applicationId}`);
              }
            }
          } catch (e) {
            console.warn('Error reading changeRequest from localStorage', e.message);
          }
        }

        // Xác định tên hiển thị cho employer — ưu tiên: companyName từ app/server > từ danh sách employers local > fallback
        const resolvedEmployerName =
          app.employerName ||          // field mới từ backend (sau khi sửa lambda)
          app.companyName ||           // field cũ có thể đã có tên
          emp?.companyName ||          // từ danh sách employers đã load
          '';
        const employerNameDisplay =
          resolvedEmployerName && !isUUID(resolvedEmployerName)
            ? resolvedEmployerName
            : (resolvedEmployerName ? '(Không xác định)' : '(Không xác định)');

        // Xác định tên hiển thị cho worker — ưu tiên: workerName từ server > candidateName có tên thật > fallback
        const resolvedWorkerName =
          app.workerName ||            // field mới từ backend
          app.candidateName ||         // field cũ có thể đã có tên
          '';
        const workerNameDisplay =
          resolvedWorkerName && !isUUID(resolvedWorkerName)
            ? resolvedWorkerName
            : '(Không xác định)';

        return {
          ...app,
          companyName: employerNameDisplay,
          employerName: employerNameDisplay,
          workerName: workerNameDisplay,
          candidateName: workerNameDisplay,
          companyLogo: app.companyLogo || emp?.companyLogo || '',
          changeRequest: finalCR,
          changeRequestStatus: app.changeRequestStatus || app.change_request_status || ''
        };
      });

      setChangeRequests(enhanced);
    } catch (e) {
      console.error('Error loading change requests:', e);
    }
  };

  const handleApproveChange = async (appId) => {
    try {
      setIsProcessingChange(true);

      const result = await applicationService.approveChangeRequest(appId);

      // Optimistically update status locally
      setChangeRequests(prev => prev.map(r => r.applicationId === appId ? { ...r, changeRequestStatus: 'approved' } : r));
      setSelectedChangeRequest(null);

      // Thông báo 3 bên
      const reqItem = changeRequests.find(r => r.applicationId === appId);
      if (reqItem) {
        const cr = reqItem.changeRequest || {};
        const jobTitle = result?.jobTitle || reqItem.jobTitle || '';
        const jobLocation = result?.jobLocation || reqItem.jobLocation || '';
        const originalEndTime = result?.originalEndTime || cr.originalEndTime || '--:--';
        const workDateDisplay = result?.workDateDisplay || reqItem.jobWorkDate || '';
        const reasonType = result?.reasonType || cr.reasonType || '';
        const reasonDetail = result?.reasonDetail || cr.reasonDetail || cr.reason || '';

        // Thông báo employer
        try {
          await createChangeRequestApprovedNotification({
            employerId: reqItem.employerId,
            companyName: reqItem.companyName,
            candidateName: reqItem.candidateName,
            changeRequestType: 'Thay thế nhân viên',
            applicationId: appId
          });
        } catch (notifErr) {
          console.warn('Failed to send employer approval notification:', notifErr.message);
        }

        // Thông báo worker cũ — finalAmount luôn = 0, không truyền endTimeDisplay/pro-rata
        const oldWorkerId = result?.oldWorkerId || reqItem.candidateId;
        if (oldWorkerId) {
          try {
            const { createWorkerReplacedNotification } = await import('../../services/notificationService');
            await createWorkerReplacedNotification({
              workerId: oldWorkerId,
              jobLocation,
              workDateDisplay,
              jobTitle,
              reasonType,
              reasonDetail
            });
          } catch (notifErr) {
            console.warn('Failed to send old worker notification:', notifErr.message);
          }
        }

        // Thông báo worker mới
        const newWorkerId = result?.newWorkerId || cr.newWorkerId;
        if (newWorkerId) {
          try {
            const { createNewWorkerAssignedNotification } = await import('../../services/notificationService');
            await createNewWorkerAssignedNotification({
              workerId: newWorkerId,
              jobTitle,
              jobLocation,
              originalEndTime
            });
          } catch (notifErr) {
            console.warn('Failed to send new worker notification:', notifErr.message);
          }
        }
      }

      try {
        await loadChangeRequests();
      } catch (e) {
        console.warn('Could not reload change requests after approve:', e.message);
      }

      showEmpToast('success', language === 'vi' ? 'Đã duyệt — ca làm việc đã được huỷ thành công' : 'Approved — shift has been successfully cancelled');
      
      if (result.recommendations) {
        setActiveRecommendations(result.recommendations);
        setRecJobTitle(result.jobTitle || (reqItem && reqItem.jobTitle) || 'Ca làm');
        setShowRecsModal(true);
      }
    } catch (err) {
      console.error('Error approving change request:', err);
      const msg = err.message || '';
      if (msg.includes('không có quyền') || msg.includes('403')) {
        showEmpToast('error', 'Bạn không có quyền thực hiện hành động này. Vui lòng đăng xuất và đăng nhập lại.');
      } else {
        showEmpToast('error', language === 'vi' ? `Lỗi khi duyệt yêu cầu: ${msg}` : `Error approving request: ${msg}`);
      }
    } finally {
      setIsProcessingChange(false);
    }
  };

  const handleRejectChange = async (appId) => {
    // Dùng empConfirm state thay vì window.confirm()
    setEmpConfirm({
      message: language === 'vi'
        ? 'Từ chối yêu cầu thay đổi? Worker hiện tại sẽ tiếp tục làm việc.'
        : 'Reject change request? The current worker will continue the shift.',
      onConfirm: async () => {
        setEmpConfirm(null);
        try {
          setIsProcessingChange(true);
          await applicationService.rejectChangeRequest(appId);

          setChangeRequests(prev => prev.map(r => r.applicationId === appId ? { ...r, changeRequestStatus: 'rejected' } : r));
          setSelectedChangeRequest(null);

          const reqItem = changeRequests.find(r => r.applicationId === appId);
          if (reqItem) {
            try {
              await createChangeRequestRejectedNotification({
                employerId: reqItem.employerId,
                companyName: reqItem.companyName,
                candidateName: reqItem.candidateName,
                changeRequestType: 'Thay thế nhân viên',
                applicationId: appId
              });
            } catch (notifErr) {
              console.warn('Failed to send rejection notification:', notifErr.message);
            }
          }

          try { await loadChangeRequests(); } catch (e) { /* ignore */ }

          showEmpToast('success', language === 'vi' ? 'Đã từ chối — worker hiện tại tiếp tục ca làm việc' : 'Rejected — current worker continues the shift');
        } catch (err) {
          console.error('Error rejecting change request:', err);
          showEmpToast('error', language === 'vi' ? 'Lỗi khi từ chối yêu cầu' : 'Error rejecting request');
        } finally {
          setIsProcessingChange(false);
        }
      }
    });
  };

  const handleDeleteChangeRequest = async (appId) => {
    setEmpConfirm({
      message: language === 'vi'
        ? 'Bạn có chắc chắn muốn xóa yêu cầu thay đổi này?'
        : 'Are you sure you want to delete this change request?',
      onConfirm: async () => {
        setEmpConfirm(null);
        try {
          setIsProcessingChange(true);
          await applicationService.updateApplicationStatus(appId, 'accepted', {
            changeRequestStatus: 'deleted'
          });

          setChangeRequests(prev => prev.filter(r => r.applicationId !== appId));
          setSelectedChangeRequest(null);

          showEmpToast('success', language === 'vi' ? 'Đã xóa yêu cầu thay đổi thành công' : 'Change request deleted successfully');
        } catch (err) {
          console.error('Error deleting change request:', err);
          showEmpToast('error', language === 'vi' ? 'Lỗi khi xóa yêu cầu' : 'Error deleting request');
        } finally {
          setIsProcessingChange(false);
        }
      }
    });
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
        quickJobStatus: item.quickJobStatus || 'not_requested',
        profileCompletion: item.profileCompletion || 0,
        createdAt: item.createdAt || '',
        updatedAt: item.updatedAt || '',
        verificationStatus: item.verificationStatus || null,
        verificationSubmittedAt: item.verificationSubmittedAt || null
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
    loadChangeRequests();
    loadPurchases();
  }, []);

  // Reload data when tabs change
  useEffect(() => {
    if (activeTab === 'change_requests') {
      loadChangeRequests();
    }
  }, [activeTab]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadEmployers(),
      loadChangeRequests(),
      loadPurchases()
    ]);
    setRefreshing(false);
  };

  const getStatusText = (status) => {
    if (status === 'approved') return language === 'vi' ? 'Đã duyệt' : 'Approved';
    if (status === 'rejected') return language === 'vi' ? 'Từ chối' : 'Rejected';
    if (status === 'pending') return language === 'vi' ? 'Chờ duyệt' : 'Pending';
    if (status === 'active') return language === 'vi' ? 'Đang hoạt động' : 'Active';
    if (status === 'locked') return language === 'vi' ? 'Bị khóa' : 'Locked';
    if (status === 'expiring') return language === 'vi' ? 'Sắp hết hạn' : 'Expiring';
    if (status === 'expired') return language === 'vi' ? 'Đã hết hạn' : 'Expired';
    return status;
  };

  const filterOptions = [
    { value: 'verified', label: language === 'vi' ? 'Đã xác minh' : 'Verified' },
    { value: 'active', label: language === 'vi' ? 'Đang hoạt động' : 'Active' },
  ];

  const handleApprove = async (employerId) => {
    try {
      console.log('✅ Approving employer:', employerId);

      // Call API to update in DynamoDB (also sets isVerified = true)
      await adminEmployerService.approveEmployer(employerId);

      // Update local state — reflect both approvalStatus and isVerified
      setEmployers(prev => prev.map(employer =>
        employer.id === employerId
          ? { ...employer, approvalStatus: 'approved', isVerified: true, verificationStatus: 'approved' }
          : employer
      ));

      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ Error approving employer:', error);
      showEmpToast('error', language === 'vi'
        ? `Lỗi khi duyệt nhà tuyển dụng: ${error.message}`
        : `Error approving employer: ${error.message}`
      );
    }
  };

  const handleUpdateQuickJobStatus = async (employerId, status) => {
    try {
      console.log(`⚡ Admin updating quick job status for ${employerId} to ${status}`);
      await adminEmployerService.updateQuickJobStatus(employerId, status);

      // Get the employer's company name from current state
      const targetEmployer = employers.find(e => e.id === employerId);
      const companyName = targetEmployer?.companyName || 'Nhà tuyển dụng';

      setEmployers(prev => prev.map(employer =>
        employer.id === employerId
          ? { ...employer, quickJobStatus: status }
          : employer
      ));

      // Send status change notification to Employer
      try {
        if (status === 'approved') {
          await createQuickJobActivationApprovedNotification(employerId, companyName);
          console.log(`✅ Approved notification sent to employer: ${companyName}`);
        } else if (status === 'rejected') {
          await createQuickJobActivationRejectedNotification(employerId, companyName);
          console.log(`✅ Rejected notification sent to employer: ${companyName}`);
        } else if (status === 'not_requested') {
          await createQuickJobActivationDeactivatedNotification(employerId, companyName);
          console.log(`✅ Deactivated notification sent to employer: ${companyName}`);
        }
      } catch (notifyErr) {
        console.error('❌ Error sending quick job status notification to employer:', notifyErr);
      }

    } catch (error) {
      console.error('❌ Error updating quick job status:', error);
      showEmpToast('error', language === 'vi' ? 'Không thể cập nhật trạng thái tuyển gấp' : 'Failed to update Urgent Job status');
    }
  };

  const handleViewVerification = async (employer) => {
    setLoadingVerification(true);
    setSelectedVerification({ employer, verificationData: null, submittedAt: null, status: null });
    try {
      const result = await adminEmployerService.getVerificationData(employer.id);
      if (result) {
        setSelectedVerification({ employer, verificationData: result.verificationData, submittedAt: result.submittedAt, status: result.status });
      } else {
        setSelectedVerification({ employer, verificationData: null, submittedAt: null, status: null });
      }
    } catch (e) {
      console.error('Error loading verification data:', e);
    } finally {
      setLoadingVerification(false);
    }
  };

  const handleAdminVerify = async (employerId, isVerified) => {
    setIsProcessingVerification(true);
    try {
      await adminEmployerService.updateVerificationStatus(employerId, isVerified);
      setEmployers(prev => prev.map(e => e.id === employerId ? { ...e, isVerified } : e));
      if (selectedVerification?.employer?.id === employerId) {
        setSelectedVerification(prev => ({ ...prev, employer: { ...prev.employer, isVerified }, status: isVerified ? 'approved' : 'rejected' }));
      }
    } catch (err) {
      showEmpToast('error', language === 'vi' ? `Lỗi: ${err.message}` : `Error: ${err.message}`);
    } finally {
      setIsProcessingVerification(false);
    }
  };

  const pendingQuickJobCount = useMemo(() => {
    return employers.filter(e => e.quickJobStatus === 'pending').length;
  }, [employers]);

  const pendingChangeCount = useMemo(() => {
    return changeRequests.filter(r => !r.changeRequestStatus || r.changeRequestStatus === 'pending').length;
  }, [changeRequests]);

  const pendingVerificationCount = useMemo(() => {
    return employers.filter(e => e.verificationStatus === 'pending' && !e.isVerified).length;
  }, [employers]);

  const filteredEmployers = useMemo(() => {
    return employers.filter(employer => {
      // Filter by tab
      let matchesTab = false;
      if (activeTab === 'pending') {
        matchesTab = (employer.approvalStatus === 'pending' || !employer.approvalStatus);
      } else if (activeTab === 'approved') {
        matchesTab = (employer.approvalStatus === 'approved');
      } else if (activeTab === 'quick_jobs') {
        // Show employers that have requested, approved or rejected status
        matchesTab = (employer.quickJobStatus && employer.quickJobStatus !== 'not_requested');
      } else if (activeTab === 'verifications') {
        // Show employers that have submitted verification (pending or already verified)
        matchesTab = !!(employer.verificationStatus || employer.isVerified);
      } else if (activeTab === 'all_employers') {
        matchesTab = true;
      }

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

  const filteredChangeRequests = useMemo(() => {
    return changeRequests
      .filter(req => {
        const matchesSearch = searchTerm === '' ||
          req.employerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.workerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.changeRequest?.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.changeRequest?.reasonDetail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.changeRequest?.reasonType?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      })
      // Mới nhất lên đầu — sort bổ sung ở FE để đảm bảo thứ tự dù data đến theo thứ tự bất kỳ
      .sort((a, b) => {
        const ta = a.updatedAt || a.createdAt || '';
        const tb = b.updatedAt || b.createdAt || '';
        return tb.localeCompare(ta);
      });
  }, [changeRequests, searchTerm]);

  // Pagination
  const totalPages = activeTab === 'change_requests'
    ? Math.ceil(filteredChangeRequests.length / itemsPerPage)
    : Math.ceil(filteredEmployers.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentEmployers = filteredEmployers.slice(startIndex, endIndex);
  const currentChangeRequests = filteredChangeRequests.slice(startIndex, endIndex);

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

            {/* Main Tabs Navigation */}
            <MainTabsContainer>
              <MainTabButton
                $active={mainTab === 'verification'}
                onClick={() => {
                  setMainTab('verification');
                  setActiveTab('verifications');
                }}
              >
                <Award size={20} />
                {language === 'vi' ? 'Xác thực nhà tuyển dụng' : 'Employer Verification'}
                {pendingVerificationCount > 0 && <TabBadge>{pendingVerificationCount}</TabBadge>}
              </MainTabButton>
              <MainTabButton
                $active={mainTab === 'all_employers'}
                onClick={() => {
                  setMainTab('all_employers');
                  setActiveTab('all_employers');
                }}
              >
                <Building2 size={20} />
                {language === 'vi' ? 'Danh sách nhà tuyển dụng' : 'Employers List'}
              </MainTabButton>
              <MainTabButton
                $active={mainTab === 'change_requests'}
                onClick={() => {
                  setMainTab('change_requests');
                  setActiveTab('change_requests');
                }}
              >
                <RefreshCw size={20} />
                {language === 'vi' ? 'Yêu cầu thay đổi ứng viên' : 'Change Candidate Requests'}
                {pendingChangeCount > 0 && <TabBadge>{pendingChangeCount}</TabBadge>}
              </MainTabButton>
              <MainTabButton
                $active={mainTab === 'features'}
                onClick={() => {
                  setMainTab('features');
                  setActiveTab('quick_jobs');
                }}
              >
                <Briefcase size={20} />
                {language === 'vi' ? 'Chức năng của Nhà tuyển dụng' : 'Employer Features'}
                {pendingQuickJobCount > 0 && (
                  <TabBadge>{pendingQuickJobCount}</TabBadge>
                )}
              </MainTabButton>
            </MainTabsContainer>

            {/* Sub-tabs Navigation */}
            {mainTab === 'verification' && (
              <SubTabsContainer>
                <SubTabButton
                  $active={activeTab === 'verifications'}
                  onClick={() => setActiveTab('verifications')}
                >
                  <FileText size={16} style={{ marginRight: '6px' }} />
                  {language === 'vi' ? 'Xác thực hồ sơ' : 'Profile Verifications'}
                  {pendingVerificationCount > 0 && <TabBadge style={{ padding: '1px 5px', fontSize: '10px', height: '15px', minWidth: '15px' }}>{pendingVerificationCount}</TabBadge>}
                </SubTabButton>
                <SubTabButton
                  $active={activeTab === 'pending'}
                  onClick={() => setActiveTab('pending')}
                >
                  <Clock size={16} style={{ marginRight: '6px' }} />
                  {language === 'vi' ? 'Chờ duyệt' : 'Pending Approval'}
                </SubTabButton>
                <SubTabButton
                  $active={activeTab === 'approved'}
                  onClick={() => setActiveTab('approved')}
                >
                  <CheckCircle size={16} style={{ marginRight: '6px' }} />
                  {language === 'vi' ? 'Đã duyệt' : 'Approved'}
                </SubTabButton>
              </SubTabsContainer>
            )}

            {mainTab === 'features' && (
              <SubTabsContainer>
                <SubTabButton
                  $active={activeTab === 'quick_jobs'}
                  onClick={() => setActiveTab('quick_jobs')}
                >
                  <Zap size={16} style={{ marginRight: '6px' }} />
                  {language === 'vi' ? 'Chức năng tuyển gấp' : 'Urgent Recruiting'}
                  {pendingQuickJobCount > 0 && (
                    <TabBadge style={{ padding: '1px 5px', fontSize: '10px', height: '15px', minWidth: '15px' }}>
                      {pendingQuickJobCount}
                    </TabBadge>
                  )}
                </SubTabButton>
                <SubTabButton
                  $active={activeTab === 'grant_package'}
                  onClick={() => setActiveTab('grant_package')}
                >
                  <Award size={16} style={{ marginRight: '6px' }} />
                  {language === 'vi' ? 'Cấp gói dịch vụ' : 'Grant Service Package'}
                </SubTabButton>
              </SubTabsContainer>
            )}

            {activeTab !== 'grant_package' && (
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
            )}

            {activeTab === 'grant_package' ? (
              <>
                <FormCard>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                    <Award size={24} color="#3b82f6" />
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                      {language === 'vi' ? 'Cấp Gói Dịch Vụ Cho Nhà Tuyển Dụng' : 'Grant Service Package to Employer'}
                    </h2>
                  </div>
                  
                  {loadingPackages ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: '#64748B' }}>
                      {language === 'vi' ? 'Đang tải thông tin gói...' : 'Loading packages...'}
                    </div>
                  ) : (
                    <form onSubmit={handleGrantPackage}>
                      <FormGroup>
                        <FormLabel>{language === 'vi' ? 'Chọn Nhà tuyển dụng' : 'Select Employer'}</FormLabel>
                        <FormSelect
                          value={selectedEmployerId}
                          onChange={(e) => setSelectedEmployerId(e.target.value)}
                          required
                        >
                          <option value="">-- {language === 'vi' ? 'Chọn Nhà tuyển dụng' : 'Select Employer'} --</option>
                          {employers
                            .filter(emp => emp.companyName && emp.companyName !== 'N/A')
                            .sort((a, b) => a.companyName.localeCompare(b.companyName))
                            .map(emp => (
                              <option key={emp.id} value={emp.id}>
                                {emp.companyName} ({emp.email})
                              </option>
                            ))
                          }
                        </FormSelect>
                      </FormGroup>

                      <FormGroup>
                        <FormLabel>{language === 'vi' ? 'Chọn Gói dịch vụ' : 'Select Package'}</FormLabel>
                        <FormSelect
                          value={selectedPackageId}
                          onChange={(e) => setSelectedPackageId(e.target.value)}
                          required
                        >
                          <option value="">-- {language === 'vi' ? 'Chọn Gói dịch vụ' : 'Select Package'} --</option>
                          {packages.map(pkg => (
                            <option key={pkg.packageId} value={pkg.packageId}>
                              {pkg.packageName}
                            </option>
                          ))}
                        </FormSelect>
                      </FormGroup>

                      <FormGroup>
                        <FormLabel>{language === 'vi' ? 'Chọn Thời hạn' : 'Select Duration'}</FormLabel>
                        <FormSelect
                          value={selectedDuration}
                          onChange={(e) => setSelectedDuration(e.target.value)}
                          required
                          disabled={!selectedPackage}
                        >
                          <option value="">-- {language === 'vi' ? 'Chọn Thời hạn' : 'Select Duration'} --</option>
                          {selectedPackage && selectedPackage.prices.map((priceOption, idx) => (
                            <option key={idx} value={priceOption.duration}>
                              {priceOption.duration} - {Number(priceOption.amount || 0).toLocaleString('vi-VN')} VNĐ
                            </option>
                          ))}
                        </FormSelect>
                      </FormGroup>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <SubmitButton type="submit" disabled={granting}>
                          {granting ? (
                            <>
                              <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                              {language === 'vi' ? 'Đang cấp gói...' : 'Granting...'}
                            </>
                          ) : (
                            <>
                              <Award size={16} />
                              {language === 'vi' ? 'Xác Nhận Cấp Gói' : 'Confirm Grant'}
                            </>
                          )}
                        </SubmitButton>
                      </div>
                    </form>
                  )}
                </FormCard>

                <div style={{ margin: '40px 0 24px', borderTop: '2px dashed #E2E8F0' }} />

                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    📋 {language === 'vi' ? 'Lịch Sử & Trạng Thái Mua Gói' : 'Package Subscriptions History'}
                  </h3>
                </div>

                <TabsContainer style={{ marginBottom: '16px' }}>
                  <Tab
                    $active={packageTab === 'pending'}
                    onClick={() => setPackageTab('pending')}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    <Clock size={16} style={{ marginRight: '6px' }} />
                    {language === 'vi' ? 'Chờ duyệt' : 'Pending Approval'}
                  </Tab>
                  <Tab
                    $active={packageTab === 'approved'}
                    onClick={() => setPackageTab('approved')}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    <CheckCircle size={16} style={{ marginRight: '6px' }} />
                    {language === 'vi' ? 'Đã duyệt' : 'Approved'}
                  </Tab>
                </TabsContainer>

                <div style={{ marginBottom: '16px' }}>
                  <TableFilter
                    searchValue={purchaseSearchTerm}
                    onSearchChange={setPurchaseSearchTerm}
                    filterOptions={purchaseFilterOptions}
                    activeFilters={purchaseFilters}
                    onFilterToggle={handlePurchaseFilterToggle}
                    searchPlaceholder={language === 'vi' ? 'Tìm kiếm nhà tuyển dụng hoặc gói...' : 'Search employer or package...'}
                  />
                </div>

                <TableWrapper>
                  {loadingPurchases ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748B' }}>
                      {language === 'vi' ? 'Đang tải danh sách...' : 'Loading subscriptions...'}
                    </div>
                  ) : (
                    <Table>
                      <thead>
                        <tr>
                          <th>{language === 'vi' ? 'Nhà tuyển dụng' : 'Employer'}</th>
                          <th>{language === 'vi' ? 'Gói dịch vụ' : 'Package'}</th>
                          <th>{language === 'vi' ? 'Thời gian mua' : 'Purchase Date'}</th>
                          <th>{language === 'vi' ? 'Hết hạn' : 'Expiry Date'}</th>
                          <th>{language === 'vi' ? 'Thời hạn' : 'Duration'}</th>
                          <th>{language === 'vi' ? 'Giá trị' : 'Price'}</th>
                          <th>{language === 'vi' ? 'Tình trạng' : 'Status'}</th>
                          <th>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPurchases.map((purchase) => {
                          const Icon = packageIcons[purchase.package] || Package;
                          return (
                            <tr key={purchase.id}>
                              <td style={{ fontWeight: 600 }}>{purchase.employer}</td>
                              <td>
                                <PackageBadge $color={packageColors[purchase.package] || '#6366f1'}>
                                  <Icon size={14} />
                                  {purchase.package}
                                </PackageBadge>
                              </td>
                              <td>
                                <DateText>
                                  <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                  {formatDateTime(purchase.purchaseDateTime || purchase.purchaseDate)}
                                </DateText>
                              </td>
                              <td>
                                <DateText>
                                  <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                  {formatDateTime(purchase.expiryDateTime || purchase.expiryDate)}
                                </DateText>
                              </td>
                              <td>
                                <span style={{ fontWeight: 600 }}>{purchase.duration}</span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                  {purchase.price.toLocaleString('vi-VN')} VND
                                </div>
                              </td>
                              <td>
                                {packageTab === 'pending' ? (
                                  <ApproveButton onClick={() => handleApprovePurchase(purchase.id)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                    <CheckCircle size={14} />
                                    {language === 'vi' ? 'Duyệt' : 'Approve'}
                                  </ApproveButton>
                                ) : (
                                  <StatusBadge $status={purchase.status}>
                                    {getStatusText(purchase.status)}
                                  </StatusBadge>
                                )}
                              </td>
                              <td>
                                <ActionButtons>
                                  <IconButton title={language === 'vi' ? 'Xem chi tiết' : 'View details'}>
                                    <Eye size={16} />
                                  </IconButton>
                                  {packageTab === 'approved' && purchase.status === 'active' && (
                                    <IconButton
                                      title={language === 'vi' ? 'Khóa dịch vụ' : 'Lock service'}
                                      onClick={() => openPurchaseLockConfirm(purchase)}
                                    >
                                      <Lock size={16} />
                                    </IconButton>
                                  )}
                                  {packageTab === 'approved' && purchase.status === 'locked' && (
                                    <IconButton
                                      title={language === 'vi' ? 'Mở khóa dịch vụ' : 'Unlock service'}
                                      onClick={() => handleUnlockPurchase(purchase.id)}
                                    >
                                      <Unlock size={16} />
                                    </IconButton>
                                  )}
                                </ActionButtons>
                              </td>
                            </tr>
                          );
                        })}
                        {currentPurchases.length === 0 && (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                              {language === 'vi' ? 'Không tìm thấy lượt đăng ký gói nào' : 'No subscriptions found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  )}
                </TableWrapper>

                {purchaseTotalPages > 1 && (
                  <PaginationContainer style={{ marginTop: '16px' }}>
                    <PaginationInfo>
                      {language === 'vi'
                        ? `Hiển thị ${purchaseStartIndex + 1}-${Math.min(purchaseEndIndex, filteredPurchases.length)} trong tổng số ${filteredPurchases.length} gói`
                        : `Showing ${purchaseStartIndex + 1}-${Math.min(purchaseEndIndex, filteredPurchases.length)} of ${filteredPurchases.length} packages`
                      }
                    </PaginationInfo>
                    <PaginationButtons>
                      <PageButton
                        onClick={() => setPurchaseCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={purchaseCurrentPage === 1}
                      >
                        {language === 'vi' ? 'Trước' : 'Previous'}
                      </PageButton>
                      
                      {[...Array(purchaseTotalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        if (
                          pageNumber === 1 ||
                          pageNumber === purchaseTotalPages ||
                          (pageNumber >= purchaseCurrentPage - 1 && pageNumber <= purchaseCurrentPage + 1)
                        ) {
                          return (
                            <PageButton
                              key={pageNumber}
                              $active={purchaseCurrentPage === pageNumber}
                              onClick={() => setPurchaseCurrentPage(pageNumber)}
                            >
                              {pageNumber}
                            </PageButton>
                          );
                        } else if (
                          pageNumber === purchaseCurrentPage - 2 ||
                          pageNumber === purchaseCurrentPage + 2
                        ) {
                          return <PageEllipsis key={pageNumber}>...</PageEllipsis>;
                        }
                        return null;
                      })}
                      
                      <PageButton
                        onClick={() => setPurchaseCurrentPage(prev => Math.min(purchaseTotalPages, prev + 1))}
                        disabled={purchaseCurrentPage === purchaseTotalPages}
                      >
                        {language === 'vi' ? 'Sau' : 'Next'}
                      </PageButton>
                    </PaginationButtons>
                  </PaginationContainer>
                )}
              </>
            ) : (
              <TableWrapper>
                {activeTab === 'quick_jobs' ? (
                <Table>
                  <thead>
                    <tr>
                      <th>{language === 'vi' ? 'Công ty' : 'Company'}</th>
                      <th>{language === 'vi' ? 'Liên hệ' : 'Contact'}</th>
                      <th>{language === 'vi' ? 'Ngành' : 'Industry'}</th>
                      <th>{language === 'vi' ? 'Quy mô' : 'Size'}</th>
                      <th>{language === 'vi' ? 'Trạng thái tuyển gấp' : 'Urgent Status'}</th>
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
                                  ID: {employer.id}
                                </CompanyMeta>
                              </CompanyDetails>
                            </CompanyInfo>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B' }}>
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
                            <StatusBadge $status={employer.quickJobStatus === 'approved' ? 'approved' : employer.quickJobStatus === 'pending' ? 'pending' : 'rejected'}>
                              {employer.quickJobStatus === 'approved' && <CheckCircle size={12} />}
                              {employer.quickJobStatus === 'pending' && <Clock size={12} />}
                              {employer.quickJobStatus === 'rejected' && <XCircle size={12} />}
                              {employer.quickJobStatus === 'approved' && (language === 'vi' ? 'Đã kích hoạt' : 'Activated')}
                              {employer.quickJobStatus === 'pending' && (language === 'vi' ? 'Chờ duyệt' : 'Pending')}
                              {employer.quickJobStatus === 'rejected' && (language === 'vi' ? 'Bị từ chối' : 'Rejected')}
                            </StatusBadge>
                          </td>
                          <td>
                            <ActionButtons>
                              {employer.quickJobStatus === 'pending' && (
                                <>
                                  <ApproveButton onClick={() => handleUpdateQuickJobStatus(employer.id, 'approved')}>
                                    <CheckCircle size={16} />
                                    {language === 'vi' ? 'Duyệt kích hoạt' : 'Approve'}
                                  </ApproveButton>
                                  <RejectButton onClick={() => handleUpdateQuickJobStatus(employer.id, 'rejected')}>
                                    <XCircle size={16} />
                                    {language === 'vi' ? 'Từ chối' : 'Reject'}
                                  </RejectButton>
                                </>
                              )}
                              {employer.quickJobStatus === 'approved' && (
                                <RejectButton onClick={() => handleUpdateQuickJobStatus(employer.id, 'not_requested')}>
                                  <XCircle size={16} />
                                  {language === 'vi' ? 'Hủy kích hoạt' : 'Deactivate'}
                                </RejectButton>
                              )}
                              {employer.quickJobStatus === 'rejected' && (
                                <ApproveButton onClick={() => handleUpdateQuickJobStatus(employer.id, 'approved')}>
                                  <CheckCircle size={16} />
                                  {language === 'vi' ? 'Kích hoạt' : 'Activate'}
                                </ApproveButton>
                              )}
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
                    {currentEmployers.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                          {language === 'vi' ? 'Không tìm thấy yêu cầu tuyển gấp nào' : 'No urgent job activation requests found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              ) : activeTab === 'change_requests' ? (
                <Table>
                  <thead>
                    <tr>
                      <th>{language === 'vi' ? 'Nhà tuyển dụng' : 'Employer'}</th>
                      <th>{language === 'vi' ? 'Nhân viên ứng tuyển' : 'Candidate'}</th>
                      <th>{language === 'vi' ? 'Loại thay đổi' : 'Change Type'}</th>
                      <th>{language === 'vi' ? 'Ngày gửi' : 'Requested At'}</th>
                      <th>{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                      <th>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentChangeRequests.map((req, index) => {
                      const colorScheme = getColorScheme(index);
                      const initials = getCompanyInitials(req.employerName || req.companyName);
                      const cr = req.changeRequest || {};

                      return (
                        <tr key={req.applicationId}>
                          <td>
                            <CompanyInfo>
                              <CompanyLogo $bgColor={colorScheme.bg} $color={colorScheme.color}>
                                {req.companyLogo ? (
                                  <img src={req.companyLogo} alt={req.employerName} />
                                ) : (
                                  initials
                                )}
                              </CompanyLogo>
                              <CompanyDetails>
                                <CompanyName>🏢 {req.employerName || req.companyName || '(Không xác định)'}</CompanyName>
                                <CompanyMeta>
                                  <Building2 size={12} />
                                  ID: {req.employerId}
                                </CompanyMeta>
                              </CompanyDetails>
                            </CompanyInfo>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>👤 {req.workerName || req.candidateName || '(Không xác định)'}</div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>Job ID: {req.jobId}</div>
                          </td>
                          <td>
                            {(() => {
                              // Map raw type → tiếng Việt — đồng nhất với AdminDashboard
                              const typeViMap = {
                                cancel_shift: 'Huỷ ca làm',
                                staff_replacement: 'Thay thế nhân viên',
                                change_worker: 'Thay đổi nhân viên',
                              };
                              const typeLabel =
                                typeViMap[cr.type] ||
                                cr.typeLabel ||
                                cr.type ||
                                '(Không xác định)';
                              // reasonLabel: ưu tiên reasonType (record mới) → typeLabel (record cũ dùng typeLabel làm lý do)
                              const reasonLabel = cr.reasonType || (cr.type ? '' : cr.typeLabel) || '';
                              const detailLabel = cr.reasonDetail || cr.reason || '';
                              const isUrgent = cr.urgency === 'urgent';
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: isUrgent ? '#EF4444' : '#F97316' }}>
                                    {(cr.type === 'staff_replacement' || cr.type === 'change_worker') ? <User size={14} /> : <Clock size={14} />}
                                    {typeLabel}
                                  </div>
                                  {reasonLabel && (
                                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span>↳</span> {reasonLabel}
                                    </div>
                                  )}
                                  {detailLabel && (
                                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', fontStyle: 'italic' }}>
                                      💬 "{detailLabel}"
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td>
                            {/* Ưu tiên cr.requestedAt; fallback req.updatedAt — đồng nhất với AdminDashboard */}
                            <div style={{ fontSize: '13px' }}>
                              {cr.requestedAt || (req.updatedAt ? new Date(req.updatedAt).toLocaleString('vi-VN') : 'N/A')}
                            </div>
                          </td>
                          <td>
                            {(() => {
                              // Normalize: backend trả cả 'APPROVED' lẫn 'approved'
                              const crStatus = String(req.changeRequestStatus || '').toLowerCase();
                              return (
                                <StatusBadge $status={
                                  crStatus === 'approved' ? 'approved' :
                                  crStatus === 'rejected' ? 'rejected' : 'pending'
                                }>
                                  {crStatus === 'approved' && <CheckCircle size={12} />}
                                  {crStatus === 'rejected' && <XCircle size={12} />}
                                  {crStatus !== 'approved' && crStatus !== 'rejected' && <Clock size={12} />}
                                  {crStatus === 'approved' && (language === 'vi' ? 'Đã duyệt' : 'Approved')}
                                  {crStatus === 'rejected' && (language === 'vi' ? 'Từ chối' : 'Rejected')}
                                  {crStatus !== 'approved' && crStatus !== 'rejected' && (language === 'vi' ? 'Chờ duyệt' : 'Pending')}
                                </StatusBadge>
                              );
                            })()}
                          </td>
                          <td>
                            <ActionButtons>
                              <IconButton
                                title={language === 'vi' ? 'Xem nội dung' : 'View content'}
                                onClick={() => setSelectedChangeRequest(req)}
                              >
                                <Eye size={16} />
                              </IconButton>
                              {(() => {
                                const crStatus = String(req.changeRequestStatus || '').toLowerCase();
                                const appStatus = String(req.status || '');
                                const isAlreadyProcessed =
                                  crStatus === 'approved' ||
                                  crStatus === 'rejected' ||
                                  appStatus === 'ĐÃ_BỊ_THAY_THẾ';
                                if (isAlreadyProcessed) return null;
                                return (
                                  <>
                                    <ApproveButton
                                      title={language === 'vi' ? 'Duyệt' : 'Approve'}
                                      onClick={() => handleApproveChange(req.applicationId)}
                                    >
                                      <CheckCircle size={16} />
                                    </ApproveButton>
                                    <RejectButton
                                      title={language === 'vi' ? 'Từ chối' : 'Reject'}
                                      onClick={() => handleRejectChange(req.applicationId)}
                                    >
                                      <XCircle size={16} />
                                    </RejectButton>
                                  </>
                                );
                              })()}
                              <DeleteButton
                                title={language === 'vi' ? 'Xóa' : 'Delete'}
                                onClick={() => handleDeleteChangeRequest(req.applicationId)}
                              >
                                <Trash2 size={16} />
                              </DeleteButton>
                            </ActionButtons>
                          </td>
                        </tr>
                      );
                    })}
                    {currentChangeRequests.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                          {language === 'vi' ? 'Không tìm thấy yêu cầu thay đổi nào' : 'No change requests found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              ) : activeTab === 'verifications' ? (
                <Table>
                  <thead>
                    <tr>
                      <th>{language === 'vi' ? 'Công ty' : 'Company'}</th>
                      <th>{language === 'vi' ? 'Liên hệ' : 'Contact'}</th>
                      <th>{language === 'vi' ? 'Ngày gửi' : 'Submitted At'}</th>
                      <th>{language === 'vi' ? 'Trạng thái xác thực' : 'Verification Status'}</th>
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
                                ) : initials}
                              </CompanyLogo>
                              <CompanyDetails>
                                <CompanyName>{employer.companyName}</CompanyName>
                                <CompanyMeta><Building2 size={12} />ID: {employer.id}</CompanyMeta>
                              </CompanyDetails>
                            </CompanyInfo>
                          </td>
                          <td>
                            <div style={{ fontSize: '13px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                <Mail size={12} />{employer.email}
                              </div>
                              {employer.phone !== 'N/A' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B' }}>
                                  <Phone size={12} />{employer.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} />
                              {employer.verificationSubmittedAt
                                ? new Date(employer.verificationSubmittedAt).toLocaleDateString('vi-VN')
                                : 'N/A'}
                            </div>
                          </td>
                          <td>
                            <VerifiedBadge $verified={employer.isVerified}>
                              {employer.isVerified ? <CheckCircle size={12} /> : <Clock size={12} />}
                              {employer.isVerified
                                ? (language === 'vi' ? 'Đã xác minh' : 'Verified')
                                : (language === 'vi' ? 'Chờ xác minh' : 'Pending')}
                            </VerifiedBadge>
                          </td>
                          <td>
                            <ActionButtons>
                              <IconButton
                                title={language === 'vi' ? 'Xem hồ sơ xác thực' : 'View verification docs'}
                                onClick={() => handleViewVerification(employer)}
                              >
                                <Eye size={16} />
                              </IconButton>
                              {!employer.isVerified && (
                                <ApproveButton onClick={() => handleAdminVerify(employer.id, true)}>
                                  <CheckCircle size={16} />
                                  {language === 'vi' ? 'Xác minh' : 'Verify'}
                                </ApproveButton>
                              )}
                              {employer.isVerified && (
                                <RejectButton onClick={() => handleAdminVerify(employer.id, false)}>
                                  <XCircle size={16} />
                                  {language === 'vi' ? 'Hủy xác minh' : 'Unverify'}
                                </RejectButton>
                              )}
                            </ActionButtons>
                          </td>
                        </tr>
                      );
                    })}
                    {currentEmployers.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                          {language === 'vi' ? 'Không có hồ sơ xác thực nào' : 'No verification submissions found'}
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
                              <IconButton
                                title={language === 'vi' ? 'Xem hồ sơ xác thực' : 'View verification docs'}
                                onClick={() => handleViewVerification(employer)}
                                style={{ color: '#2563EB' }}
                              >
                                <FileText size={16} />
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
            )}

            {activeTab !== 'grant_package' && (
              <PaginationContainer>
              <PaginationInfo>
                {activeTab === 'withdrawals' ? (
                  language === 'vi'
                    ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, filteredWithdrawRequests.length)} trong tổng số ${filteredWithdrawRequests.length} yêu cầu rút tiền`
                    : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredWithdrawRequests.length)} of ${filteredWithdrawRequests.length} withdrawal requests`
                ) : activeTab === 'quick_jobs' ? (
                  language === 'vi'
                    ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, filteredEmployers.length)} trong tổng số ${filteredEmployers.length} yêu cầu tuyển gấp`
                    : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredEmployers.length)} of ${filteredEmployers.length} urgent job requests`
                ) : activeTab === 'change_requests' ? (
                  language === 'vi'
                    ? `Hiển thị ${startIndex + 1}-${Math.min(endIndex, filteredChangeRequests.length)} trong tổng số ${filteredChangeRequests.length} yêu cầu thay đổi`
                    : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredChangeRequests.length)} of ${filteredChangeRequests.length} change requests`
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
            )}
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

      {/* Grant Success Modal */}
      {showGrantSuccessModal && grantedPackageDetails && (
        <ModalOverlay onClick={() => setShowGrantSuccessModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <ModalIcon>
              <CheckCircle />
            </ModalIcon>
            <ModalTitle style={{ marginBottom: '8px' }}>
              {language === 'vi' ? 'Cấp Gói Thành Công!' : 'Package Granted Successfully!'}
            </ModalTitle>
            <ModalMessage style={{ marginBottom: '16px' }}>
              {language === 'vi' 
                ? 'Gói dịch vụ đã được kích hoạt thành công cho doanh nghiệp.' 
                : 'The service package has been successfully activated for the employer.'}
            </ModalMessage>
            
            <div style={{ display: 'grid', gap: '12px', margin: '20px 0', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '14px', textAlign: 'left' }}>
              <div>
                <span style={{ color: '#64748B', fontWeight: 500 }}>{language === 'vi' ? 'Nhà tuyển dụng:' : 'Employer:'}</span>
                <span style={{ float: 'right', fontWeight: 700, color: '#1E293B' }}>{grantedPackageDetails.companyName}</span>
              </div>
              <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '8px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>{language === 'vi' ? 'Gói dịch vụ:' : 'Package:'}</span>
                <span style={{ float: 'right', fontWeight: 700, color: '#3B82F6' }}>{grantedPackageDetails.packageName}</span>
              </div>
              <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '8px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>{language === 'vi' ? 'Thời hạn:' : 'Duration:'}</span>
                <span style={{ float: 'right', fontWeight: 700, color: '#10B981' }}>{grantedPackageDetails.duration}</span>
              </div>
              {grantedPackageDetails.expiryDate && (
                <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>{language === 'vi' ? 'Hạn sử dụng:' : 'Expiration:'}</span>
                  <span style={{ float: 'right', fontWeight: 700, color: '#EF4444' }}>{grantedPackageDetails.expiryDate}</span>
                </div>
              )}
            </div>

            <ModalButton onClick={() => {
              setShowGrantSuccessModal(false);
              const isTopSpotlight = grantedPackageDetails.packageName?.toLowerCase()?.includes('top spotlight');
              if (isTopSpotlight) {
                navigate(`/admin/banners?type=top-spotlight&employer=${encodeURIComponent(grantedPackageDetails.companyName)}`);
              }
            }}>
              {grantedPackageDetails.packageName?.toLowerCase()?.includes('top spotlight')
                ? (language === 'vi' ? 'Đi tới Quản lý Banner' : 'Go to Banner Management')
                : (language === 'vi' ? 'Xác nhận' : 'Confirm')}
            </ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Grant Error Modal */}
      {grantErrorModalMsg && (
        <ModalOverlay onClick={() => setGrantErrorModalMsg('')}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalIcon style={{ background: '#fee2e2' }}>
              <XCircle style={{ color: '#dc2626' }} />
            </ModalIcon>
            <ModalTitle>
              {language === 'vi' ? 'Cấp gói thất bại!' : 'Failed to Grant Package!'}
            </ModalTitle>
            <ModalMessage style={{ color: '#dc2626', fontWeight: 500 }}>
              {grantErrorModalMsg}
            </ModalMessage>
            <ModalButton style={{ background: '#ef4444' }} onClick={() => setGrantErrorModalMsg('')}>
              {language === 'vi' ? 'Đóng' : 'Close'}
            </ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Change Request Detail Modal */}
      {selectedChangeRequest && (<ModalOverlay onClick={() => setSelectedChangeRequest(null)}>
        <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #FFEDD5' }}>
              <AlertCircle style={{ color: '#F97316' }} />
            </div>
            <div>
              <ModalTitle style={{ textAlign: 'left', margin: 0, fontSize: '20px' }}>
                {language === 'vi' ? 'Chi Tiết Yêu Cầu Thay Đổi' : 'Change Request Details'}
              </ModalTitle>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                {selectedChangeRequest.changeRequest?.requestedAt}
              </div>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1.5px solid #E2E8F0', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                  {language === 'vi' ? 'Nhà tuyển dụng' : 'Employer'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{selectedChangeRequest.employerName || selectedChangeRequest.companyName || '(Không xác định)'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                  {language === 'vi' ? 'Worker cũ (đang làm)' : 'Current Worker (working)'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#EF4444' }}>{selectedChangeRequest.workerName || selectedChangeRequest.candidateName || '(Không xác định)'}</div>
              </div>
              {/* Loại thay đổi */}
              {(selectedChangeRequest.changeRequest?.type || selectedChangeRequest.changeRequest?.typeLabel) && (
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    {language === 'vi' ? 'Loại thay đổi' : 'Change Type'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F97316' }}>
                    {(() => {
                      const typeViMap = { cancel_shift: 'Huỷ ca làm', staff_replacement: 'Thay thế nhân viên', change_worker: 'Thay đổi nhân viên' };
                      const cr = selectedChangeRequest.changeRequest;
                      return typeViMap[cr.type] || cr.typeLabel || cr.type || '(Không xác định)';
                    })()}
                  </div>
                </div>
              )}
              {selectedChangeRequest.changeRequest?.newWorkerName && (
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    {language === 'vi' ? 'Worker mới (đề xuất)' : 'New Worker (proposed)'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#10B981' }}>{selectedChangeRequest.changeRequest.newWorkerName}</div>
                </div>
              )}
              {selectedChangeRequest._jobStartTime && (
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    {language === 'vi' ? 'Giờ bắt đầu ca' : 'Shift Start Time'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    {selectedChangeRequest._jobStartTime} – {selectedChangeRequest._jobEndTime || '--:--'}
                  </div>
                </div>
              )}
              {selectedChangeRequest._jobTitle && (
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    {language === 'vi' ? 'Vị trí / Địa điểm' : 'Role / Location'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{selectedChangeRequest._jobTitle}</div>
                  {selectedChangeRequest._jobLocation && (
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{selectedChangeRequest._jobLocation}</div>
                  )}
                </div>
              )}
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                  {language === 'vi' ? 'Gửi lúc' : 'Submitted At'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#F97316' }}>
                  {selectedChangeRequest.changeRequest?.requestedAt || '--'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} />
              {language === 'vi' ? 'Lý do:' : 'Reason:'}
            </div>
            {(selectedChangeRequest.changeRequest?.reasonType || selectedChangeRequest.changeRequest?.typeLabel) && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '8px', padding: '5px 10px', fontSize: '12.5px', fontWeight: 700, color: '#C2410C', marginBottom: '8px' }}>
                <AlertCircle size={13} />
                {selectedChangeRequest.changeRequest.reasonType || selectedChangeRequest.changeRequest.typeLabel}
              </div>
            )}
            <div style={{ background: '#FAFAFA', border: '1.5px solid #F1F5F9', borderRadius: '12px', padding: '16px', fontSize: '14px', lineHeight: '1.6', color: '#1E293B', whiteSpace: 'pre-wrap' }}>
              {/* Bug 1 fix: field thực tế là reasonDetail, fallback về reason để tương thích bản cũ */}
              {selectedChangeRequest.changeRequest?.reasonDetail || selectedChangeRequest.changeRequest?.reason || (language === 'vi' ? 'Không có nội dung lý do' : 'No detailed reason provided')}
            </div>
          </div>

          {/* Cảnh báo cho admin */}
          <div style={{ background: '#FFF7ED', border: '1.5px solid #FFEDD5', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', fontSize: '13px', color: '#92400E', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={16} color="#F97316" style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              {language === 'vi'
                ? <>Nếu <strong>Duyệt</strong>: worker cũ kết thúc ca ngay lập tức, tiền công tính đến lúc này. Worker mới bắt đầu ca ngay.</>
                : <>If <strong>Approve</strong>: current worker shift ends immediately, wage calculated up to this point. New worker starts shift immediately.</>}
            </span>
          </div>

          {(() => {
            const crStatus = String(selectedChangeRequest.changeRequestStatus || '').toUpperCase();
            const isPending = selectedChangeRequest.status === 'pending_change';
            const isApproved = crStatus === 'APPROVED' || selectedChangeRequest.status === 'ĐÃ_BỊ_THAY_THẾ';
            const isRejected = crStatus === 'REJECTED';

            if (isPending && !isApproved && !isRejected) {
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <ModalButton
                    onClick={() => handleRejectChange(selectedChangeRequest.applicationId)}
                    style={{ background: '#ef4444' }}
                    disabled={isProcessingChange}
                  >
                    {isProcessingChange ? '...' : (language === 'vi' ? 'Từ chối' : 'Reject')}
                  </ModalButton>
                  <ModalButton
                    onClick={() => handleApproveChange(selectedChangeRequest.applicationId)}
                    disabled={isProcessingChange}
                  >
                    {isProcessingChange
                      ? (language === 'vi' ? 'Đang xử lý...' : 'Processing...')
                      : (language === 'vi' ? 'Duyệt' : 'Approve')}
                  </ModalButton>
                </div>
              );
            }

            return (
              <div style={{
                padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '8px',
                background: isApproved ? '#ECFDF5' : '#FEF2F2',
                color: isApproved ? '#065F46' : '#991B1B',
                border: `1.5px solid ${isApproved ? '#A7F3D0' : '#FECACA'}`
              }}>
                {isApproved ? '✅' : '❌'}
                {isApproved
                  ? (language === 'vi' ? 'Yêu cầu này đã được duyệt' : 'This request has been approved')
                  : (language === 'vi' ? 'Yêu cầu này đã bị từ chối' : 'This request has been rejected')}
              </div>
            );
          })()}

          <button
            onClick={() => setSelectedChangeRequest(null)}
            style={{ width: '100%', marginTop: '12px', background: 'none', border: 'none', color: '#64748B', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            {language === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </ModalContent>
      </ModalOverlay>
      )}

      {/* Verification Detail Modal */}
      {selectedVerification && (
        <ModalOverlay onClick={() => setSelectedVerification(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #BFDBFE', flexShrink: 0 }}>
                <FileText style={{ color: '#2563EB' }} />
              </div>
              <div style={{ flex: 1 }}>
                <ModalTitle style={{ textAlign: 'left', margin: 0, fontSize: '20px' }}>
                  {language === 'vi' ? 'Hồ Sơ Xác Thực Doanh Nghiệp' : 'Business Verification Docs'}
                </ModalTitle>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                  {selectedVerification.employer.companyName}
                  {selectedVerification.submittedAt && ` • ${new Date(selectedVerification.submittedAt).toLocaleDateString('vi-VN')}`}
                </div>
              </div>
              <VerifiedBadge $verified={selectedVerification.employer.isVerified}>
                {selectedVerification.employer.isVerified ? <CheckCircle size={12} /> : <Clock size={12} />}
                {selectedVerification.employer.isVerified
                  ? (language === 'vi' ? 'Đã xác minh' : 'Verified')
                  : (language === 'vi' ? 'Chờ xác minh' : 'Pending')}
              </VerifiedBadge>
            </div>

            {loadingVerification && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                {language === 'vi' ? 'Đang tải hồ sơ...' : 'Loading documents...'}
              </div>
            )}

            {!loadingVerification && !selectedVerification.verificationData && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                {language === 'vi' ? 'Nhà tuyển dụng chưa gửi hồ sơ xác thực.' : 'No verification submission found.'}
              </div>
            )}

            {!loadingVerification && selectedVerification.verificationData && (() => {
              const vd = selectedVerification.verificationData;
              const s1 = vd.step1 || {};
              const s2 = vd.step2 || {};
              const s3 = vd.step3 || {};
              const s4 = vd.step4 || {};
              const sectionStyle = { background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1.5px solid #E2E8F0', marginBottom: '16px' };
              const labelStyle = { fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' };
              const valueStyle = { fontSize: '14px', fontWeight: 600, color: '#1E293B' };
              const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };

              return (
                <>
                  {/* Step 1: Giấy phép kinh doanh */}
                  <div style={sectionStyle}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#2563EB', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} />
                      {language === 'vi' ? 'Bước 1: Giấy phép kinh doanh' : 'Step 1: Business License'}
                    </div>
                    <div style={gridStyle}>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Số giấy phép' : 'License Number'}</div>
                        <div style={valueStyle}>{s1.licenseNumber || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Cơ quan cấp' : 'Issuing Authority'}</div>
                        <div style={valueStyle}>{s1.issuingAuthority || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Ngày cấp' : 'Issue Date'}</div>
                        <div style={valueStyle}>{s1.issueDate || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Ngày hết hạn' : 'Expiry Date'}</div>
                        <div style={valueStyle}>{s1.expiryDate || 'N/A'}</div>
                      </div>
                    </div>
                    {s1.businessLicense?.data && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={labelStyle}>{language === 'vi' ? 'File giấy phép' : 'License File'}</div>
                        {s1.businessLicense.type === 'application/pdf' ? (
                          <a
                            href={s1.businessLicense.data}
                            download={s1.businessLicense.name || 'business-license.pdf'}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', padding: '8px 14px', background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '8px', color: '#2563EB', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}
                          >
                            <FileText size={14} /> {s1.businessLicense.name || 'business-license.pdf'}
                          </a>
                        ) : (
                          <img src={s1.businessLicense.data} alt="Business License" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', marginTop: '6px', border: '1px solid #E2E8F0' }} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step 2: Thông tin doanh nghiệp */}
                  <div style={sectionStyle}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#7C3AED', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} />
                      {language === 'vi' ? 'Bước 2: Thông tin doanh nghiệp' : 'Step 2: Company Information'}
                    </div>
                    <div style={gridStyle}>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Tên công ty (VI)' : 'Company Name (VI)'}</div>
                        <div style={valueStyle}>{s2.companyName || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Tên công ty (EN)' : 'Company Name (EN)'}</div>
                        <div style={valueStyle}>{s2.companyNameEn || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Mã số thuế' : 'Tax Code'}</div>
                        <div style={valueStyle}>{s2.taxCode || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Năm thành lập' : 'Founded Year'}</div>
                        <div style={valueStyle}>{s2.foundedYear || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Ngành' : 'Industry'}</div>
                        <div style={valueStyle}>{s2.industry || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Quy mô' : 'Company Size'}</div>
                        <div style={valueStyle}>{s2.companySize || 'N/A'}</div>
                      </div>
                      {s2.website && (
                        <div>
                          <div style={labelStyle}>Website</div>
                          <div style={valueStyle}><a href={s2.website} target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>{s2.website}</a></div>
                        </div>
                      )}
                      {s2.fanpage && (
                        <div>
                          <div style={labelStyle}>Fanpage</div>
                          <div style={valueStyle}><a href={s2.fanpage} target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>{s2.fanpage}</a></div>
                        </div>
                      )}
                    </div>
                    {s2.description && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={labelStyle}>{language === 'vi' ? 'Mô tả' : 'Description'}</div>
                        <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#475569', marginTop: '4px' }}>{s2.description}</div>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Người đại diện */}
                  <div style={sectionStyle}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} />
                      {language === 'vi' ? 'Bước 3: Người đại diện' : 'Step 3: Representative'}
                    </div>
                    <div style={gridStyle}>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Họ và tên' : 'Full Name'}</div>
                        <div style={valueStyle}>{s3.representativeName || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Chức vụ' : 'Position'}</div>
                        <div style={valueStyle}>{s3.position || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Số CMND/CCCD' : 'ID Number'}</div>
                        <div style={valueStyle}>{s3.idNumber || 'N/A'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {s3.idFrontImage?.data && (
                        <div>
                          <div style={labelStyle}>{language === 'vi' ? 'CMND mặt trước' : 'ID Front'}</div>
                          <img src={s3.idFrontImage.data} alt="ID Front" style={{ maxWidth: '200px', maxHeight: '130px', borderRadius: '8px', marginTop: '6px', border: '1px solid #E2E8F0', objectFit: 'cover' }} />
                        </div>
                      )}
                      {s3.idBackImage?.data && (
                        <div>
                          <div style={labelStyle}>{language === 'vi' ? 'CMND mặt sau' : 'ID Back'}</div>
                          <img src={s3.idBackImage.data} alt="ID Back" style={{ maxWidth: '200px', maxHeight: '130px', borderRadius: '8px', marginTop: '6px', border: '1px solid #E2E8F0', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                    {s3.authorizationLetter?.data && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={labelStyle}>{language === 'vi' ? 'Giấy uỷ quyền' : 'Authorization Letter'}</div>
                        <a
                          href={s3.authorizationLetter.data}
                          download={s3.authorizationLetter.name || 'authorization.pdf'}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', padding: '8px 14px', background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '8px', color: '#059669', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}
                        >
                          <FileText size={14} /> {s3.authorizationLetter.name || 'authorization.pdf'}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Step 4: Thông tin liên hệ */}
                  <div style={sectionStyle}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#EA580C', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} />
                      {language === 'vi' ? 'Bước 4: Thông tin liên hệ' : 'Step 4: Contact Information'}
                    </div>
                    <div style={gridStyle}>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Địa chỉ' : 'Address'}</div>
                        <div style={valueStyle}>{[s4.address, s4.ward, s4.district, s4.city].filter(Boolean).join(', ') || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>{language === 'vi' ? 'Điện thoại' : 'Phone'}</div>
                        <div style={valueStyle}>{s4.phone || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>Email</div>
                        <div style={valueStyle}>{(s4.emails || []).filter(Boolean).join(', ') || 'N/A'}</div>
                      </div>
                      {s4.emergencyContact && (
                        <div>
                          <div style={labelStyle}>{language === 'vi' ? 'Liên hệ khẩn cấp' : 'Emergency Contact'}</div>
                          <div style={valueStyle}>{s4.emergencyContact} {s4.emergencyPhone ? `• ${s4.emergencyPhone}` : ''}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              {!selectedVerification.employer.isVerified && selectedVerification.verificationData && (
                <ModalButton
                  onClick={() => handleAdminVerify(selectedVerification.employer.id, true)}
                  disabled={isProcessingVerification}
                  style={{ flex: 1 }}
                >
                  {isProcessingVerification ? '...' : (language === 'vi' ? '✓ Xác minh doanh nghiệp' : '✓ Verify Business')}
                </ModalButton>
              )}
              {selectedVerification.employer.isVerified && (
                <ModalButton
                  onClick={() => handleAdminVerify(selectedVerification.employer.id, false)}
                  disabled={isProcessingVerification}
                  style={{ flex: 1, background: '#ef4444' }}
                >
                  {isProcessingVerification ? '...' : (language === 'vi' ? 'Hủy xác minh' : 'Unverify')}
                </ModalButton>
              )}
              <button
                onClick={() => setSelectedVerification(null)}
                style={{ flex: 1, padding: '12px', background: 'none', border: '1.5px solid #E2E8F0', borderRadius: '8px', color: '#64748B', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Purchase Approval Success Modal */}
      {showPurchaseSuccessModal && approvedPurchaseInfo && (
        <ModalOverlay onClick={() => setShowPurchaseSuccessModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #A7F3D0' }}>
                <CheckCircle style={{ color: '#10B981' }} />
              </div>
              <div>
                <ModalTitle style={{ textAlign: 'left', margin: 0, fontSize: '20px' }}>
                  {language === 'vi' ? 'Duyệt Gói Thành Công!' : 'Package Approved Successfully!'}
                </ModalTitle>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                  {language === 'vi' ? 'Đã kích hoạt gói dịch vụ cho doanh nghiệp' : 'Service package activated successfully'}
                </div>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1.5px solid #E2E8F0', marginBottom: '24px', display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748B' }}>{language === 'vi' ? 'Nhà tuyển dụng' : 'Employer'}</span>
                <strong style={{ color: '#1E293B' }}>{approvedPurchaseInfo.employer}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748B' }}>{language === 'vi' ? 'Gói dịch vụ' : 'Package'}</span>
                <strong style={{ color: '#1E293B' }}>{approvedPurchaseInfo.package}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748B' }}>{language === 'vi' ? 'Thời hạn' : 'Duration'}</span>
                <strong style={{ color: '#1E293B' }}>{approvedPurchaseInfo.duration}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748B' }}>{language === 'vi' ? 'Hết hạn' : 'Expiry'}</span>
                <strong style={{ color: '#1E293B' }}>{formatDateTime(approvedPurchaseInfo.expiryDateTime || approvedPurchaseInfo.expiryDate)}</strong>
              </div>
            </div>

            <ModalButton onClick={() => {
              setShowPurchaseSuccessModal(false);
              const isTopSpotlight = approvedPurchaseInfo.package?.toLowerCase()?.includes('top spotlight');
              if (isTopSpotlight) {
                navigate(`/admin/banners?type=top-spotlight&employer=${encodeURIComponent(approvedPurchaseInfo.employer)}`);
              }
            }}>
              {approvedPurchaseInfo.package?.toLowerCase()?.includes('top spotlight')
                ? (language === 'vi' ? 'Đi tới Quản lý Banner' : 'Go to Banner Management')
                : (language === 'vi' ? 'Hoàn tất' : 'Done')}
            </ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Purchase Lock Confirm Modal */}
      {showPurchaseLockConfirm && purchaseLockTarget && (
        <ModalOverlay onClick={() => setShowPurchaseLockConfirm(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #FCA5A5' }}>
                <Lock style={{ color: '#EF4444' }} />
              </div>
              <div>
                <ModalTitle style={{ textAlign: 'left', margin: 0, fontSize: '20px' }}>
                  {language === 'vi' ? 'Xác Nhận Khóa Dịch Vụ?' : 'Confirm Lock Service?'}
                </ModalTitle>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                  {language === 'vi' ? 'Gói dịch vụ sẽ chuyển sang trạng thái bị khóa' : 'Package subscription will be locked'}
                </div>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1.5px solid #E2E8F0', marginBottom: '24px', display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748B' }}>{language === 'vi' ? 'Nhà tuyển dụng' : 'Employer'}</span>
                <strong style={{ color: '#1E293B' }}>{purchaseLockTarget.employer}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748B' }}>{language === 'vi' ? 'Gói dịch vụ' : 'Package'}</span>
                <strong style={{ color: '#1E293B' }}>{purchaseLockTarget.package}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowPurchaseLockConfirm(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  await handleLockPurchase(purchaseLockTarget.id);
                  setShowPurchaseLockConfirm(false);
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#EF4444', color: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                {language === 'vi' ? 'Khóa dịch vụ' : 'Lock service'}
              </button>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* ── Toast thông báo thay thế alert() ─────────────────────────────── */}
      {empToast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          padding: '14px 20px', borderRadius: '12px', maxWidth: '420px',
          background: empToast.type === 'success'
            ? 'linear-gradient(135deg, #10B981, #059669)'
            : empToast.type === 'warning'
              ? 'linear-gradient(135deg, #F59E0B, #D97706)'
              : 'linear-gradient(135deg, #EF4444, #DC2626)',
          color: 'white', fontWeight: '600', fontSize: '14px',
          display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          animation: 'slideInRight 0.25s ease',
        }}>
          <style>{`@keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
          {empToast.type === 'success'
            ? <CheckCircle size={18} style={{ flexShrink: 0 }} />
            : empToast.type === 'warning'
              ? <AlertCircle size={18} style={{ flexShrink: 0 }} />
              : <XCircle size={18} style={{ flexShrink: 0 }} />
          }
          <span style={{ flex: 1 }}>{empToast.message}</span>
          <button
            onClick={() => setEmpToast(null)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8, fontSize: '18px', lineHeight: 1, padding: '0 2px' }}
          >×</button>
        </div>
      )}

      {/* ── Confirm modal thay thế window.confirm() ───────────────────────── */}
      {empConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setEmpConfirm(null)}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px 32px',
            maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircle size={20} color="#D97706" />
              </div>
              <p style={{ fontSize: '15px', color: '#1E293B', fontWeight: '500', lineHeight: '1.6', margin: 0 }}>
                {empConfirm.message}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEmpConfirm(null)}
                style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                onClick={empConfirm.onConfirm}
                style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#EF4444', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
              >
                {language === 'vi' ? 'Xác nhận' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Urgent recommendations modal */}
      <UrgentRecommendationsModal
        isOpen={showRecsModal}
        onClose={() => setShowRecsModal(false)}
        recommendations={activeRecommendations}
        jobTitle={recJobTitle}
      />
    </DashboardLayout>
  );
};

export default EmployersManagement;
