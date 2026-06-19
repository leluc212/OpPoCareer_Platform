import React, { useState, useEffect } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import Toast from '../../components/Toast';
import AddressInput from '../../components/AddressInput';
import { useToast } from '../../hooks/useToast';
import { Input, TextArea, Button, Label, FormGroup } from '../../components/FormElements';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Users, 
  FileText, 
  Upload,
  Camera,
  Save,
  Edit3,
  Check,
  X,
  ShieldCheck,
  File,
  Trash2,
  Download,
  Eye,
  Plus,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import employerProfileService from '../../services/employerProfileService';
import jobPostService from '../../services/jobPostService';
import { getJobApplications } from '../../services/applicationService';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const GlobalSpinStyle = createGlobalStyle`
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ProfileContainer = styled.div`
  animation: ${fadeIn} 0.5s ease-in;
`;

const PageHeader = styled.div`
  margin-bottom: 28px;
  display: flex;
  align-items: flex-start;
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
  flex-shrink: 0;

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

const ProfileContent = styled.div`
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const SidePanel = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CompanyLogoCard = styled.div`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: all 0.22s ease;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.13);
    border-color: #BFDBFE;
  }
`;
const LogoUploadArea = styled.div`
  width: 160px;
  height: 160px;
  margin: 0 auto 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, #1e40af 0%, #1e40af 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(30, 64, 175, 0.3);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UploadButton = styled(motion.label)`
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.1);
  transition: all 0.22s ease;
  
  &:hover {
    transform: scale(1.05);
    background: #DBEAFE;
    border-color: #93C5FD;
  }
  
  svg {
    width: 20px;
    height: 20px;
    color: #1e40af;
  }
  
  input {
    display: none;
  }
`;

const DeleteLogoButton = styled(motion.button)`
  position: absolute;
  bottom: 8px;
  left: 8px;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #FEF2F2;
  color: #EF4444;
  border: 1.5px solid #FECACA;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
  transition: all 0.22s ease;
  
  &:hover {
    transform: scale(1.05);
    background: #FEE2E2;
    border-color: #FCA5A5;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;
const CompanyName = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 8px;
`;

const CompanyType = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
`;

const StatsCard = styled.div`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: all 0.22s ease;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.13);
    border-color: #BFDBFE;
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const VerifyActionCard = styled(motion.div)`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: all 0.22s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.13);
    border-color: #BFDBFE;
  }

  .icon-wrapper {
    width: 48px;
    height: 48px;
    background: #EFF6FF;
    color: #1e40af;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    
    svg {
      width: 24px;
      height: 24px;
    }
  }
  
  h4 {
    font-size: 16px;
    font-weight: 700;
    color: #1E293B;
    margin: 0;
  }
  
  p {
    font-size: 13.5px;
    color: #64748B;
    margin: 0;
    line-height: 1.5;
  }
  
  button {
    width: 100%;
    padding: 12px;
    background: #EFF6FF;
    color: #1e40af;
    border: 1.5px solid #BFDBFE;
    border-radius: 10px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 4px;
    
    &:hover {
      background: #1e40af;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
    }
  }
`;
const StatItem = styled.div`
  text-align: center;
  padding: 16px;
  background: #EFF6FF;
  border: 1.5px solid transparent;
  border-radius: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #ffffff;
    border-color: #BFDBFE;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.08);
  }
  
  .value {
    font-size: 24px;
    font-weight: 800;
    color: #1e40af;
    display: block;
    margin-bottom: 4px;
    transition: color 0.3s ease;
  }
  
  .label {
    font-size: 12px;
    color: #475569;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color 0.3s ease;
  }
`;

const MainPanel = styled(motion.div)`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: all 0.22s ease;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.13);
    border-color: #BFDBFE;
  }
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    width: 22px;
    height: 22px;
    color: #1e40af;
    background: #EFF6FF;
    padding: 6px;
    border-radius: 8px;
    width: 34px;
    height: 34px;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.$columns || '1fr'};
  gap: 20px;
  margin-bottom: 24px;
`;
const InputWrapper = styled.div`
  position: relative;
  
  svg.input-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: #1e40af;
    opacity: 0.7;
    pointer-events: none;
    transition: all 0.2s ease;
  }
  
  input, textarea {
    padding-left: 46px;
    border-radius: 12px;
    border: 1.5px solid #E8EFFF;
    background: #ffffff;
    transition: all 0.2s ease;
    
    &:focus {
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
  
  &:focus-within svg.input-icon {
    opacity: 1;
    color: #3B82F6;
  }
`;

const SaveButton = styled(motion.button)`
  padding: 14px 32px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e40af 0%, #1e40af 100%);
  color: white;
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  box-shadow: 0 8px 24px rgba(30, 64, 175, 0.35);
  transition: all 0.3s ease;
  cursor: pointer;
  margin-top: 24px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(30, 64, 175, 0.45);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const MapContainer = styled.div`
  margin-top: 8px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  iframe {
    display: block;
    width: 100%;
  }
`;

const MapInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  color: #6b7280;
  
  svg {
    color: #10b981;
    flex-shrink: 0;
  }
  
  span {
    flex: 1;
    font-weight: 500;
  }
`;

const DocumentsSection = styled.div`
  margin-top: 32px;
  padding-top: 32px;
  border-top: 2px solid #E8EFFF;
`;

const DocumentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 20px;
`;
const VerificationDocumentCard = styled(motion.div)`
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border: 2px solid #93C5FD;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3B82F6 0%, #10B981 100%);
  }
  
  &:hover {
    border-color: #3B82F6;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
    transform: translateY(-4px);
  }
  
  .verified-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 4px;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    
    svg {
      width: 12px;
      height: 12px;
    }
  }
`;

const DocumentCard = styled(motion.div)`
  background: #ffffff;
  border: 2px solid #E8EFFF;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 4px 16px rgba(30, 64, 175, 0.1);
    transform: translateY(-2px);
  }
`;

const DocumentHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;
const DocumentIconBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border: 1.5px solid #BFDBFE;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 22px;
    height: 22px;
    color: #1e40af;
  }
`;

const DocumentInfo = styled.div`
  flex: 1;
  min-width: 0;
  
  .doc-name {
    font-size: 14px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
    word-break: break-word;
  }
  
  .doc-date {
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
  }
`;

const DocumentActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const DocumentButton = styled.button`
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1.5px solid;
  
  ${props => props.$variant === 'danger' ? `
    background: #FEE2E2;
    border-color: #FCA5A5;
    color: #DC2626;
    
    &:hover {
      background: #FEF2F2;
      border-color: #EF4444;
    }
  ` : `
    background: #EFF6FF;
    border-color: #BFDBFE;
    color: #1e40af;
    
    &:hover {
      background: #DBEAFE;
      border-color: #93C5FD;
    }
  `}
  
  svg {
    width: 14px;
    height: 14px;
  }
`;
const DocumentUploadButton = styled(motion.button)`
  padding: 12px 24px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  transition: all 0.2s ease;
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  &:hover {
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
  }
`;

const EmptyDocuments = styled.div`
  text-align: center;
  padding: 48px 20px;
  background: #F8FAFC;
  border-radius: 12px;
  border: 2px dashed #E2E8F0;
  
  .icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  h3 {
    font-size: 16px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
  }
`;

const InfoBox = styled.div`
  padding: 16px;
  border-radius: 12px;
  border: 2px solid #E8EFFF;
  background: #F8FAFC;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .info-content {
    flex: 1;
    
    p {
      font-size: 14px;
      line-height: 1.6;
      color: ${props => props.theme.colors.text};
      margin: 0;
    }
  }
`;
const EmployerProfile = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    website: '',
    industry: '',
    companySize: '',
    foundedYear: '',
    description: '',
    taxCode: '',
    businessLicense: ''
  });
  
  const [originalFormData, setOriginalFormData] = useState({});
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyVideo, setCompanyVideo] = useState('');
  const [companyImages, setCompanyImages] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLockedFields, setIsLockedFields] = useState({
    taxCode: false,
    businessLicense: false
  });
  const [documents, setDocuments] = useState([]);
  const [verificationDocuments, setVerificationDocuments] = useState([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [profileStats, setProfileStats] = useState({
    totalJobs: 0,
    totalApplicants: 0,
    totalHired: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      // Wait for user to be authenticated
      if (!user) {
        console.log('⏳ Waiting for user authentication...');
        return;
      }
      
      // Prevent multiple loads
      if (isLoadingProfile) {
        return;
      }
      
      try {
        setIsLoadingProfile(true);
        console.log('🔄 Loading employer profile for user:', user.username);
        
        let profile = null;
        
        // Load from API only - no localStorage fallback
        try {
          profile = await employerProfileService.getMyProfile();
          if (profile) {
            console.log('✅ Employer profile loaded from API');
            setIsOfflineMode(false);
          }
        } catch (apiError) {
          console.error('❌ API failed:', apiError.message);
          setIsOfflineMode(true);
        }
        
        if (profile) {
          const profileData = {
            companyName: profile.companyName || '',
            email: profile.email || '',
            phone: profile.phone || '',
            address: profile.address || '',
            latitude: profile.latitude || '',
            longitude: profile.longitude || '',
            website: profile.website || '',
            industry: profile.industry || '',
            companySize: profile.companySize || '',
            foundedYear: profile.foundedYear || '',
            description: profile.description || '',
            taxCode: profile.taxCode || '',
            businessLicense: profile.businessLicense || ''
          };
          
          setFormData(profileData);
          setOriginalFormData(profileData);
          setCompanyLogo(profile.companyLogo || '');
          setCompanyVideo(profile.companyVideo || '');
          setCompanyImages(profile.companyImages || []);
          
          // Set locked fields
          setIsLockedFields({
            taxCode: !!profile.taxCode,
            businessLicense: !!profile.businessLicense
          });
          
          console.log('✅ Employer profile loaded successfully');
        } else {
          console.log('ℹ️ No employer profile found - new user');
          
          // Set empty data for new employers - they will fill it themselves
          const emptyData = {
            companyName: '',
            email: user?.attributes?.email || '',
            phone: '',
            address: '',
            latitude: '',
            longitude: '',
            website: '',
            industry: '',
            companySize: '',
            foundedYear: '',
            description: '',
            taxCode: '',
            businessLicense: ''
          };
          
          setFormData(emptyData);
          setOriginalFormData(emptyData);
          
          // Auto-enable editing mode for new users
          setIsEditing(true);
          
          // Show welcome message for new users
          setTimeout(() => {
            toast.info(language === 'vi' 
              ? '👋 Chào mừng! Vui lòng điền thông tin công ty của bạn để bắt đầu.' 
              : '👋 Welcome! Please fill in your company information to get started.');
          }, 500);
        }
      } catch (error) {
        console.error('❌ Error loading employer profile:', error);
        
        // Don't show error toast for authentication issues
        if (!error.message.includes('not authenticated') && 
            !error.message.includes('Forbidden') &&
            !error.message.includes('Cannot connect to API')) {
          toast.error(language === 'vi' ? 'Không thể tải hồ sơ công ty' : 'Failed to load company profile');
        }
      } finally {
        setIsLoadingProfile(false);
        setHasLoadedOnce(true);
      }
    };
    
    // Only load once when user is available
    if (user && !isLoadingProfile) {
      loadProfile();
    }
    
    // Load verification documents from DB
    const loadVerificationDocs = async () => {
      if (verificationDocuments.length > 0) return;
      try {
        const verif = await employerProfileService.getVerificationStatus(user.username);
        if (!verif) return;

        const parsed = verif.verificationData || verif;
        const submittedAt = verif.submittedAt || parsed.submittedAt;
        const uploadDate = submittedAt
          ? new Date(submittedAt).toLocaleDateString('vi-VN')
          : 'N/A';

        const docs = [];

        if (parsed.step1?.businessLicense) {
          docs.push({
            id: 'business-license',
            name: language === 'vi' ? 'Giấy phép kinh doanh' : 'Business License',
            type: 'verification',
            uploadDate,
            fileData: parsed.step1.businessLicense,
            metadata: {
              [language === 'vi' ? 'Số GP' : 'License No']: parsed.step1.licenseNumber,
              [language === 'vi' ? 'Ngày cấp' : 'Issue Date']: parsed.step1.issueDate,
              [language === 'vi' ? 'Hết hạn' : 'Expiry']: parsed.step1.expiryDate
            }
          });
        }

        if (parsed.step3?.idFrontImage) {
          docs.push({
            id: 'id-front',
            name: language === 'vi' ? 'CCCD/CMND mặt trước' : 'ID Card (Front)',
            type: 'verification',
            uploadDate,
            fileData: parsed.step3.idFrontImage,
            metadata: {
              [language === 'vi' ? 'Họ tên' : 'Name']: parsed.step3.representativeName,
              [language === 'vi' ? 'Số CCCD' : 'ID No']: parsed.step3.idNumber
            }
          });
        }

        if (parsed.step3?.idBackImage) {
          docs.push({
            id: 'id-back',
            name: language === 'vi' ? 'CCCD/CMND mặt sau' : 'ID Card (Back)',
            type: 'verification',
            uploadDate,
            fileData: parsed.step3.idBackImage,
            metadata: {
              [language === 'vi' ? 'Họ tên' : 'Name']: parsed.step3.representativeName,
              [language === 'vi' ? 'Số CCCD' : 'ID No']: parsed.step3.idNumber
            }
          });
        }

        if (parsed.step3?.authorizationLetter) {
          docs.push({
            id: 'authorization-letter',
            name: language === 'vi' ? 'Giấy ủy quyền' : 'Authorization Letter',
            type: 'verification',
            uploadDate,
            fileData: parsed.step3.authorizationLetter
          });
        }

        if (docs.length > 0) setVerificationDocuments(docs);
      } catch (e) {
        console.error('Error loading verification documents from DB:', e);
      }
    };
    loadVerificationDocs();
  }, [user?.username]); // Only depend on user.username to prevent infinite loops

  // Load stats from real data
  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      try {
        setIsLoadingStats(true);
        const jobs = await jobPostService.getMyJobPosts();
        const totalJobs = jobs.length;
        const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicants || 0), 0);

        // Count accepted applications across all jobs
        let totalHired = 0;
        await Promise.all(
          jobs.map(async (job) => {
            try {
              const apps = await getJobApplications(job.idJob);
              totalHired += apps.filter(a => a.status === 'accepted').length;
            } catch {
              // ignore per-job errors
            }
          })
        );

        setProfileStats({ totalJobs, totalApplicants, totalHired });
      } catch (err) {
        console.error('❌ Error loading profile stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };
    loadStats();
  }, [user]);
  
  // Handle save profile
  const handleSave = async () => {
    try {
      setIsLoadingProfile(true);
      
      // Validate required field: description
      if (!formData.description?.trim()) {
        toast.error(language === 'vi' ? 'Vui lòng nhập mô tả công ty (bắt buộc)' : 'Please enter company description (required)');
        setIsLoadingProfile(false);
        return;
      }
      
      // Check if taxCode or businessLicense are being set for the first time
      const newLockedFields = { ...isLockedFields };
      
      if (formData.taxCode && formData.taxCode.trim() && !isLockedFields.taxCode) {
        newLockedFields.taxCode = true;
      }
      
      if (formData.businessLicense && formData.businessLicense.trim() && !isLockedFields.businessLicense) {
        newLockedFields.businessLicense = true;
      }
      
      // Save locked state
      if (newLockedFields.taxCode !== isLockedFields.taxCode || newLockedFields.businessLicense !== isLockedFields.businessLicense) {
        setIsLockedFields(newLockedFields);
      }
      
      // Prepare data for saving
      const profileData = {
        ...formData,
        companyLogo,
        companyVideo,
        companyImages
      };
      
      // Try to save to DynamoDB first, fallback to localStorage if API fails
      try {
        const existingProfile = await employerProfileService.getMyProfile();
        
        let savedProfile;
        if (existingProfile) {
          // Update existing profile
          savedProfile = await employerProfileService.updateProfile(profileData);
          console.log('✅ Employer profile updated');
        } else {
          // Create new profile
          savedProfile = await employerProfileService.createProfile(profileData);
          console.log('✅ Employer profile created');
        }
        
        if (savedProfile) {
          setOriginalFormData({
            companyName: savedProfile.companyName || '',
            email: savedProfile.email || '',
            phone: savedProfile.phone || '',
            address: savedProfile.address || '',
            latitude: savedProfile.latitude || '',
            longitude: savedProfile.longitude || '',
            website: savedProfile.website || '',
            industry: savedProfile.industry || '',
            companySize: savedProfile.companySize || '',
            foundedYear: savedProfile.foundedYear || '',
            description: savedProfile.description || '',
            taxCode: savedProfile.taxCode || '',
            businessLicense: savedProfile.businessLicense || ''
          });
          setCompanyVideo(savedProfile.companyVideo || '');
          setCompanyImages(savedProfile.companyImages || []);
        }
        
        setIsEditing(false);
        toast.success(language === 'vi' ? 'Đã cập nhật hồ sơ công ty thành công!' : 'Company profile updated successfully!');
        
      } catch (apiError) {
        console.error('❌ API Error saving profile:', apiError);
        toast.error(language === 'vi' ? 'Lỗi khi lưu hồ sơ. Vui lòng thử lại.' : 'Error saving profile. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Error in handleSave:', error);
      toast.error(language === 'vi' ? 'Có lỗi xảy ra khi lưu hồ sơ' : 'An error occurred while saving profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };
  
  // Calculate profile completion
  const calculateProfileCompletion = (data) => {
    let completion = 0;
    
    // Basic info (35% total - 7% each)
    if (data.companyName?.trim()) completion += 7;
    if (data.email?.trim()) completion += 7;
    if (data.phone?.trim()) completion += 7;
    if (data.address?.trim()) completion += 7;
    if (data.latitude?.trim() && data.longitude?.trim()) completion += 7; // GPS location
    
    // Business info (30% total - 10% each)
    if (data.industry?.trim()) completion += 10;
    if (data.companySize?.trim()) completion += 10;
    if (data.description?.trim()) completion += 10;
    
    // Company logo (15%)
    if (data.companyLogo) completion += 15;
    
    // Website (5%)
    if (data.website?.trim()) completion += 5;
    
    // Legal documents (20% - 10% each)
    if (data.taxCode?.trim()) completion += 10;
    if (data.businessLicense?.trim()) completion += 10;
    
    return completion;
  };
  
  // Handle cancel editing
  const handleCancel = () => {
    setFormData(originalFormData);
    setIsEditing(false);
  };
  
  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate GPS coordinates
    if (name === 'latitude') {
      const lat = parseFloat(value);
      if (value && (isNaN(lat) || lat < -90 || lat > 90)) {
        toast.error(language === 'vi' ? 'Vĩ độ phải từ -90 đến 90' : 'Latitude must be between -90 and 90');
        return;
      }
    }
    
    if (name === 'longitude') {
      const lng = parseFloat(value);
      if (value && (isNaN(lng) || lng < -180 || lng > 180)) {
        toast.error(language === 'vi' ? 'Kinh độ phải từ -180 đến 180' : 'Longitude must be between -180 and 180');
        return;
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle address change from AddressInput component
  const handleAddressChange = (address) => {
    setFormData(prev => ({
      ...prev,
      address: address
    }));
  };

  // Handle coordinates change from AddressInput component
  const handleCoordinatesChange = (coordinates) => {
    if (coordinates) {
      setFormData(prev => ({
        ...prev,
        latitude: coordinates.lat.toFixed(6),
        longitude: coordinates.lng.toFixed(6)
      }));
      console.log('✅ GPS coordinates updated:', coordinates);
      toast.success(language === 'vi' ? 'Đã cập nhật tọa độ GPS từ địa chỉ!' : 'GPS coordinates updated from address!');
    }
  };

  // Get current GPS location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(language === 'vi' ? 'Trình duyệt không hỗ trợ định vị GPS' : 'Browser does not support GPS location');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData({
          ...formData,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6)
        });
        setIsGettingLocation(false);
        toast.success(language === 'vi' ? 'Đã lấy vị trí GPS thành công!' : 'GPS location retrieved successfully!');
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = language === 'vi' ? 'Không thể lấy vị trí GPS' : 'Unable to get GPS location';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = language === 'vi' ? 'Bạn đã từ chối quyền truy cập vị trí' : 'Location access denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = language === 'vi' ? 'Thông tin vị trí không khả dụng' : 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = language === 'vi' ? 'Hết thời gian chờ lấy vị trí' : 'Location request timeout';
            break;
        }
        
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };
  
  // Handle logo upload
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(language === 'vi' ? 'Kích thước file không được vượt quá 5MB' : 'File size must not exceed 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = e.target.result;
        setCompanyLogo(logoData);
        // Save to localStorage immediately for offline access
        localStorage.setItem('companyLogo', logoData);
        console.log('✅ Company logo saved to localStorage');
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle delete logo
  const handleDeleteLogo = () => {
    setCompanyLogo('');
    // Remove from localStorage
    localStorage.removeItem('companyLogo');
    console.log('✅ Company logo removed from localStorage');
  };

  // Handle company images upload
  const handleCompanyImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remaining = 5 - companyImages.length;
    if (remaining <= 0) {
      toast.error(language === 'vi' ? 'Tối đa 5 hình ảnh công ty' : 'Maximum 5 company images allowed');
      return;
    }

    const filesToProcess = files.slice(0, remaining);
    filesToProcess.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(language === 'vi' ? `File "${file.name}" vượt quá 5MB` : `File "${file.name}" exceeds 5MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCompanyImages(prev => [...prev, { id: Date.now() + Math.random(), data: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle delete company image
  const handleDeleteCompanyImage = (id) => {
    setCompanyImages(prev => prev.filter(img => img.id !== id));
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newDocuments = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      uploadDate: new Date().toLocaleDateString('vi-VN'),
      size: (file.size / 1024).toFixed(2) + ' KB'
    }));
    
    const updated = [...documents, ...newDocuments];
    setDocuments(updated);
    localStorage.setItem('companyDocuments', JSON.stringify(updated));
  };

  const handleDeleteDocument = (docId) => {
    const updated = documents.filter(doc => doc.id !== docId);
    setDocuments(updated);
    localStorage.setItem('companyDocuments', JSON.stringify(updated));
  };

  const handleViewVerificationDocument = (doc) => {
    if (doc.fileData) {
      // Open the image/document in a new window
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${doc.name}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  display: flex; 
                  flex-direction: column;
                  align-items: center; 
                  justify-content: center; 
                  background: #1e293b;
                  font-family: system-ui, -apple-system, sans-serif;
                }
                img { 
                  max-width: 100%; 
                  height: auto; 
                  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                  border-radius: 8px;
                }
                .info {
                  background: white;
                  padding: 16px 24px;
                  border-radius: 8px;
                  margin-bottom: 16px;
                  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                }
                .info h2 {
                  margin: 0 0 12px 0;
                  color: #1e293b;
                  font-size: 20px;
                }
                .info p {
                  margin: 4px 0;
                  color: #64748b;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="info">
                <h2>${doc.name}</h2>
                <p><strong>${language === 'vi' ? 'Ngày tải lên' : 'Upload Date'}:</strong> ${doc.uploadDate}</p>
                ${doc.metadata ? Object.entries(doc.metadata).map(([key, value]) => 
                  value ? `<p><strong>${key}:</strong> ${value}</p>` : ''
                ).join('') : ''}
              </div>
              <img src="${doc.fileData}" alt="${doc.name}" />
            </body>
          </html>
        `);
      }
    }
  };
  return (
    <DashboardLayout role="employer" key={language}>
      <ProfileContainer>
        {!user || !hasLoadedOnce ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #E8EFFF', 
              borderTop: '4px solid #1e40af', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
            <p style={{ color: '#6B7280', fontSize: '16px' }}>
              {!user ? 
                (language === 'vi' ? 'Đang xác thực...' : 'Authenticating...') :
                (language === 'vi' ? 'Đang tải hồ sơ...' : 'Loading profile...')
              }
            </p>
          </div>
        ) : (
          <>
            <PageHeader>
              {isOfflineMode && (
                <div style={{
                  position: 'absolute',
                  top: '-40px',
                  left: '0',
                  right: '0',
                  background: '#FEF3C7',
                  color: '#92400E',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'center',
                  border: '1px solid #FCD34D',
                  marginBottom: '16px'
                }}>
                  ⚠️ {language === 'vi' ? 'Chế độ offline - Dữ liệu được lưu cục bộ' : 'Offline mode - Data saved locally'}
                </div>
              )}
              <PageTitleGroup>
                <PageIconBox>
                  <Building2 />
                </PageIconBox>
                <PageTitleText>
                  <h1>{language === 'vi' ? 'Hồ Sơ Công Ty' : 'Company Profile'}</h1>
                  <p>{language === 'vi' ? 'Quản lý thông tin công ty' : 'Manage your company information'}</p>
                </PageTitleText>
              </PageTitleGroup>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isEditing ? handleCancel : () => setIsEditing(true)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: isEditing ? '#6B7280' : '#1e40af',
                  color: 'white',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: isEditing ? 'none' : '0 4px 12px rgba(30, 64, 175, 0.2)'
                }}
              >
                <Edit3 size={18} />
                {isEditing ? (language === 'vi' ? 'Hủy' : 'Cancel') : (language === 'vi' ? 'Chỉnh Sửa' : 'Edit')}
              </motion.button>
            </PageHeader>

        <ProfileContent>
          <SidePanel
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CompanyLogoCard>
              <LogoUploadArea>
                {companyLogo ? (
                  <img src={companyLogo} alt="Company Logo" />
                ) : (
                  <Building2 size={64} color="white" />
                )}
                {companyLogo && isEditing && (
                  <DeleteLogoButton
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteLogo}
                  >
                    <X />
                  </DeleteLogoButton>
                )}
                {isEditing && (
                  <UploadButton
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Camera />
                    <input type="file" accept="image/*" onChange={handleLogoUpload} />
                  </UploadButton>
                )}
              </LogoUploadArea>
              <CompanyName>{formData.companyName || (language === 'vi' ? 'Chưa cập nhật tên công ty' : 'Company name not set')}</CompanyName>
              <CompanyType>{formData.industry || (language === 'vi' ? 'Chưa cập nhật lĩnh vực' : 'Industry not set')}</CompanyType>
            </CompanyLogoCard>
            <StatsCard>
              <StatGrid>
                <StatItem>
                  <span className="value">{isLoadingStats ? '...' : profileStats.totalJobs}</span>
                  <span className="label">{language === 'vi' ? 'Tin tuyển dụng' : 'Job posts'}</span>
                </StatItem>
                <StatItem>
                  <span className="value">{isLoadingStats ? '...' : profileStats.totalApplicants}</span>
                  <span className="label">{language === 'vi' ? 'Ứng viên' : 'Candidates'}</span>
                </StatItem>
                <StatItem>
                  <span className="value">{isLoadingStats ? '...' : profileStats.totalHired}</span>
                  <span className="label">{language === 'vi' ? 'Đã tuyển' : 'Hired'}</span>
                </StatItem>
                <StatItem>
                  <span className="value">—</span>
                  <span className="label">{language === 'vi' ? 'Đánh giá' : 'Rating'}</span>
                </StatItem>
              </StatGrid>
            </StatsCard>

            <VerifyActionCard>
              <div className="icon-wrapper">
                <ShieldCheck />
              </div>
              <h4>{language === 'vi' ? 'Xác Thực Doanh Nghiệp' : 'Verify Company'}</h4>
              <p>{language === 'vi' ? 'Xác thực hồ sơ để tăng mức độ uy tín và thu hút ứng viên.' : 'Verify your profile to increase trust and attract more candidates.'}</p>
              <button type="button" onClick={() => navigate('/employer/verification')}>
                {language === 'vi' ? 'Đi tới Xác thực ngay' : 'Go to Verify Now'}
              </button>
            </VerifyActionCard>
          </SidePanel>

          <MainPanel
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <form onSubmit={(e) => e.preventDefault()}>
              <SectionTitle>
                <Building2 />
                {language === 'vi' ? 'Thông Tin Công Ty' : 'Company Information'}
              </SectionTitle>

              <FormRow $columns="1fr">
                <FormGroup>
                  <Label htmlFor="companyName">{language === 'vi' ? 'Tên công ty' : 'Company name'}</Label>
                  <InputWrapper>
                    <Building2 className="input-icon" />
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder={language === 'vi' ? 'Ví dụ: Công ty TNHH ABC' : 'e.g., ABC Company Ltd'}
                      disabled={!isEditing}
                    />
                  </InputWrapper>
                </FormGroup>
              </FormRow>

              <FormRow $columns="1fr 1fr">
                <FormGroup>
                  <Label htmlFor="email">Email</Label>
                  <InputWrapper>
                    <Mail className="input-icon" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@company.com"
                      disabled={!isEditing}
                    />
                  </InputWrapper>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="phone">{language === 'vi' ? 'Số điện thoại' : 'Phone number'}</Label>
                  <InputWrapper>
                    <Phone className="input-icon" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={language === 'vi' ? 'Ví dụ: 028 1234 5678' : 'e.g., 028 1234 5678'}
                      disabled={!isEditing}
                    />
                  </InputWrapper>
                </FormGroup>
              </FormRow>
              <FormRow $columns="1fr">
                <FormGroup>
                  <Label htmlFor="address">{language === 'vi' ? 'Địa chỉ' : 'Address'}</Label>
                  <AddressInput
                    value={formData.address}
                    onChange={handleAddressChange}
                    onCoordinatesChange={handleCoordinatesChange}
                    placeholder={language === 'vi' ? 'Ví dụ: số 47 đường 5B, Long Bình, Thủ Đức' : 'e.g., 47 5B Street, Long Binh, Thu Duc'}
                    disabled={!isEditing}
                    showCoordinates={true}
                  />
                </FormGroup>
              </FormRow>

              <FormRow $columns="1fr">
                <FormGroup>
                  <Label>{language === 'vi' ? 'Vị trí GPS công ty' : 'Company GPS Location'}</Label>
                  <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems: 'start' }}>
                    {/* Left side - Button and info */}
                    <div>
                      <Button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={!isEditing || isGettingLocation}
                        style={{
                          background: isGettingLocation ? '#6b7280' : '#10b981',
                          border: 'none',
                          color: 'white',
                          padding: '12px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: isEditing && !isGettingLocation ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          width: '100%'
                        }}
                      >
                        <MapPin size={16} />
                        {isGettingLocation 
                          ? (language === 'vi' ? 'Đang lấy vị trí...' : 'Getting location...') 
                          : (language === 'vi' ? 'Lấy vị trí hiện tại' : 'Get Current Location')
                        }
                      </Button>
                      {formData.latitude && formData.longitude && (
                        <div style={{
                          marginTop: '12px',
                          padding: '10px 12px',
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#0369a1'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <MapPin size={14} />
                            <strong>{language === 'vi' ? 'Đã lưu vị trí:' : 'Location saved:'}</strong>
                          </div>
                          <div style={{ fontSize: '12px', paddingLeft: '20px' }}>
                            {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                          </div>
                        </div>
                      )}
                      {isEditing && !formData.latitude && (
                        <div style={{ 
                          marginTop: '12px', 
                          fontSize: '12px', 
                          color: '#6b7280',
                          fontStyle: 'italic',
                          lineHeight: '1.5'
                        }}>
                          💡 {language === 'vi' 
                            ? 'Click nút trên để tự động lấy vị trí GPS của bạn' 
                            : 'Click the button above to automatically get your GPS location'}
                        </div>
                      )}
                    </div>

                    {/* Right side - Map */}
                    {formData.latitude && formData.longitude && (
                      <MapContainer style={{ height: '200px' }}>
                        <iframe
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(formData.longitude) - 0.005},${parseFloat(formData.latitude) - 0.005},${parseFloat(formData.longitude) + 0.005},${parseFloat(formData.latitude) + 0.005}&layer=mapnik&marker=${formData.latitude},${formData.longitude}`}
                          width="100%"
                          height="200"
                          frameBorder="0"
                          style={{ borderRadius: '12px 12px 0 0', border: 'none' }}
                          title={language === 'vi' ? 'Vị trí công ty' : 'Company Location'}
                        />
                        <MapInfo>
                          <MapPin size={14} />
                          <span style={{ fontSize: '12px' }}>
                            {language === 'vi' ? 'Vị trí công ty' : 'Company Location'}
                          </span>
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${formData.latitude}&mlon=${formData.longitude}&zoom=16`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#3b82f6',
                              textDecoration: 'none',
                              fontSize: '12px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginLeft: 'auto'
                            }}
                          >
                            {language === 'vi' ? 'Mở bản đồ lớn' : 'Open Full Map'} ↗
                          </a>
                        </MapInfo>
                      </MapContainer>
                    )}
                  </div>
                </FormGroup>
              </FormRow>

              <FormRow $columns="1fr">
                <FormGroup>
                  <Label htmlFor="website">Website</Label>
                  <InputWrapper>
                    <Globe className="input-icon" />
                    <Input
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder={language === 'vi' ? 'Ví dụ: https://congty.vn' : 'e.g., https://company.com'}
                      disabled={!isEditing}
                    />
                  </InputWrapper>
                </FormGroup>
              </FormRow>

              <FormRow $columns="1fr 1fr 1fr">
                <FormGroup>
                  <Label htmlFor="industry">{language === 'vi' ? 'Lĩnh vực' : 'Industry'}</Label>
                  <InputWrapper>
                    <FileText className="input-icon" />
                    <Input
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder={language === 'vi' ? 'Ví dụ: F&B, Công nghệ, Bán lẻ' : 'e.g., F&B, Technology, Retail'}
                      disabled={!isEditing}
                    />
                  </InputWrapper>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="companySize">{language === 'vi' ? 'Quy mô' : 'Company size'}</Label>
                  <InputWrapper>
                    <Users className="input-icon" />
                    <Input
                      id="companySize"
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      placeholder={language === 'vi' ? 'Ví dụ: 1-10, 11-50, 51-200 nhân viên' : 'e.g., 1-10, 11-50, 51-200 employees'}
                      disabled={!isEditing}
                    />
                  </InputWrapper>
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="foundedYear">{language === 'vi' ? 'Năm thành lập' : 'Founded Year'}</Label>
                  <InputWrapper>
                    <FileText className="input-icon" />
                    <Input
                      id="foundedYear"
                      name="foundedYear"
                      value={formData.foundedYear}
                      onChange={handleChange}
                      placeholder={language === 'vi' ? 'Ví dụ: 2020' : 'e.g., 2020'}
                      disabled={!isEditing}
                    />
                  </InputWrapper>
                </FormGroup>
              </FormRow>
              <FormRow $columns="1fr 1fr">
                <FormGroup>
                  <Label htmlFor="taxCode">{language === 'vi' ? 'Mã số thuế' : 'Tax Code'}</Label>
                  <InputWrapper>
                    <FileText className="input-icon" />
                    <Input
                      id="taxCode"
                      name="taxCode"
                      value={formData.taxCode}
                      onChange={handleChange}
                      placeholder={language === 'vi' ? 'Mã số thuế công ty' : 'Company tax code'}
                      disabled={!isEditing || isLockedFields.taxCode}
                      style={{
                        backgroundColor: isLockedFields.taxCode ? '#F3F4F6' : undefined,
                        cursor: isLockedFields.taxCode ? 'not-allowed' : undefined
                      }}
                    />
                  </InputWrapper>
                  {isLockedFields.taxCode && (
                    <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                      {language === 'vi' ? 'Mã số thuế đã được khóa sau lần đầu thiết lập' : 'Tax code is locked after first setup'}
                    </p>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="businessLicense">{language === 'vi' ? 'Số giấy phép kinh doanh' : 'Business License Number'}</Label>
                  <InputWrapper>
                    <FileText className="input-icon" />
                    <Input
                      id="businessLicense"
                      name="businessLicense"
                      value={formData.businessLicense}
                      onChange={handleChange}
                      placeholder={language === 'vi' ? 'Số giấy phép kinh doanh' : 'Business license number'}
                      disabled={!isEditing || isLockedFields.businessLicense}
                      style={{
                        backgroundColor: isLockedFields.businessLicense ? '#F3F4F6' : undefined,
                        cursor: isLockedFields.businessLicense ? 'not-allowed' : undefined
                      }}
                    />
                  </InputWrapper>
                  {isLockedFields.businessLicense && (
                    <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                      {language === 'vi' ? 'Số giấy phép đã được khóa sau lần đầu thiết lập' : 'Business license is locked after first setup'}
                    </p>
                  )}
                </FormGroup>
              </FormRow>

              <FormRow $columns="1fr">
                <FormGroup>
                  <Label htmlFor="description">
                    {language === 'vi' ? 'Mô tả công ty' : 'Company description'}
                    <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>
                  </Label>
                  <TextArea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={language === 'vi' ? 'Mô tả về công ty, sản phẩm/dịch vụ, văn hóa làm việc...' : 'Describe your company, products/services, work culture...'}
                    rows={5}
                    disabled={!isEditing}
                    style={{
                      borderColor: isEditing && !formData.description?.trim() ? '#FCA5A5' : undefined
                    }}
                  />
                  {isEditing && !formData.description?.trim() && (
                    <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} />
                      {language === 'vi' ? 'Mô tả công ty là bắt buộc' : 'Company description is required'}
                    </p>
                  )}
                </FormGroup>
              </FormRow>

              {/* Company Video */}
              <FormRow $columns="1fr">
                <FormGroup>
                  <Label htmlFor="companyVideo">
                    {language === 'vi' ? 'Video giới thiệu công ty' : 'Company intro video'}
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '400', marginLeft: '8px' }}>
                      ({language === 'vi' ? 'không bắt buộc' : 'optional'})
                    </span>
                  </Label>
                  <InputWrapper>
                    <Globe className="input-icon" />
                    <Input
                      id="companyVideo"
                      name="companyVideo"
                      value={companyVideo}
                      onChange={(e) => setCompanyVideo(e.target.value)}
                      placeholder={language === 'vi' ? 'Dán link YouTube hoặc URL video...' : 'Paste YouTube link or video URL...'}
                      disabled={!isEditing}
                    />
                  </InputWrapper>
                  {companyVideo && (
                    <div style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #E8EFFF' }}>
                      <iframe
                        src={companyVideo.includes('youtube.com/watch?v=')
                          ? companyVideo.replace('watch?v=', 'embed/')
                          : companyVideo.includes('youtu.be/')
                            ? `https://www.youtube.com/embed/${companyVideo.split('youtu.be/')[1]?.split('?')[0]}`
                            : companyVideo}
                        width="100%"
                        height="220"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={language === 'vi' ? 'Video công ty' : 'Company video'}
                        style={{ display: 'block' }}
                      />
                    </div>
                  )}
                </FormGroup>
              </FormRow>

              {/* Company Images */}
              <FormRow $columns="1fr">
                <FormGroup>
                  <Label>
                    {language === 'vi' ? 'Hình ảnh công ty' : 'Company images'}
                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '400', marginLeft: '8px' }}>
                      ({language === 'vi' ? `không bắt buộc • tối đa 5 ảnh` : `optional • max 5 images`})
                    </span>
                  </Label>
                  {companyImages.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      {companyImages.map(img => (
                        <div key={img.id} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #E8EFFF', aspectRatio: '4/3' }}>
                          <img
                            src={img.data}
                            alt={img.name}
                            onClick={() => setLightboxImage(img.data)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
                          />
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCompanyImage(img.id)}
                              style={{
                                position: 'absolute', top: '6px', right: '6px',
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: 'rgba(239,68,68,0.9)', border: 'none',
                                color: 'white', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', padding: 0
                              }}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {isEditing && companyImages.length < 5 && (
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 16px', borderRadius: '10px',
                      border: '1.5px dashed #BFDBFE', background: '#EFF6FF',
                      color: '#1e40af', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                      width: 'fit-content'
                    }}>
                      <Upload size={16} />
                      {language === 'vi' ? `Tải ảnh lên (${companyImages.length}/5)` : `Upload images (${companyImages.length}/5)`}
                      <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleCompanyImagesUpload} />
                    </label>
                  )}
                  {!isEditing && companyImages.length === 0 && (
                    <p style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>
                      {language === 'vi' ? 'Chưa có hình ảnh công ty' : 'No company images yet'}
                    </p>
                  )}
                </FormGroup>
              </FormRow>

              {isEditing && (
                <SaveButton
                  type="button"
                  onClick={handleSave}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoadingProfile}
                >
                  <Save />
                  {isLoadingProfile ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes')}
                </SaveButton>
              )}
              {/* Documents Section - Combined Verification & Regular Documents */}
              <DocumentsSection>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <SectionTitle style={{ marginBottom: 0 }}>
                    <File />
                    {language === 'vi' ? 'Hồ Sơ & Tài Liệu' : 'Documents & Files'}
                  </SectionTitle>
                  <label htmlFor="doc-upload" style={{ cursor: 'pointer' }}>
                    <input
                      id="doc-upload"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleDocumentUpload}
                      style={{ display: 'none' }}
                    />
                    <DocumentUploadButton
                      as={motion.span}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus />
                      {language === 'vi' ? 'Tải lên tài liệu' : 'Upload Documents'}
                    </DocumentUploadButton>
                  </label>
                </div>

                {verificationDocuments.length === 0 && documents.length === 0 ? (
                  <EmptyDocuments>
                    <div className="icon">📄</div>
                    <h3>{language === 'vi' ? 'Chưa có tài liệu nào' : 'No documents yet'}</h3>
                    <p>{language === 'vi' ? 'Tải lên hồ sơ công ty, giấy phép kinh doanh và các tài liệu liên quan' : 'Upload company profile, business license and related documents'}</p>
                  </EmptyDocuments>
                ) : (
                  <>
                    <DocumentsGrid>
                      {/* Verification Documents */}
                      {verificationDocuments.map((doc) => (
                        <VerificationDocumentCard
                          key={doc.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <div className="verified-badge">
                            <ShieldCheck />
                            {language === 'vi' ? 'Xác thực' : 'Verified'}
                          </div>
                          <DocumentHeader>
                            <DocumentIconBox style={{ 
                              background: 'linear-gradient(135deg, #3B82F6 0%, #1e40af 100%)',
                              borderColor: '#1e40af'
                            }}>
                              <FileText style={{ color: 'white' }} />
                            </DocumentIconBox>
                            <DocumentInfo>
                              <div className="doc-name">{doc.name}</div>
                              <div className="doc-date" style={{ color: '#1e40af', fontWeight: 600 }}>
                                {language === 'vi' ? 'Tải lên: ' : 'Uploaded: '}{doc.uploadDate}
                              </div>
                              {doc.metadata && (
                                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                                  {Object.entries(doc.metadata).slice(0, 2).map(([key, value]) => 
                                    value ? <div key={key}>{key}: {value}</div> : null
                                  )}
                                </div>
                              )}
                            </DocumentInfo>
                          </DocumentHeader>
                          <DocumentActions>
                            <DocumentButton 
                              onClick={() => handleViewVerificationDocument(doc)}
                              style={{ 
                                background: 'linear-gradient(135deg, #3B82F6 0%, #1e40af 100%)',
                                color: 'white',
                                borderColor: '#1e40af'
                              }}
                            >
                              <Eye />
                              {language === 'vi' ? 'Xem' : 'View'}
                            </DocumentButton>
                          </DocumentActions>
                        </VerificationDocumentCard>
                      ))}
                      {/* Regular Documents */}
                      {documents.map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <DocumentHeader>
                            <DocumentIconBox>
                              <File />
                            </DocumentIconBox>
                            <DocumentInfo>
                              <div className="doc-name">{doc.name}</div>
                              <div className="doc-date">{language === 'vi' ? 'Tải lên: ' : 'Uploaded: '}{doc.uploadDate}</div>
                            </DocumentInfo>
                          </DocumentHeader>
                          <DocumentActions>
                            <DocumentButton>
                              <Eye />
                              {language === 'vi' ? 'Xem' : 'View'}
                            </DocumentButton>
                            <DocumentButton $variant="danger" onClick={() => handleDeleteDocument(doc.id)}>
                              <Trash2 />
                              {language === 'vi' ? 'Xóa' : 'Delete'}
                            </DocumentButton>
                          </DocumentActions>
                        </DocumentCard>
                      ))}
                    </DocumentsGrid>

                    {verificationDocuments.length > 0 && (
                      <InfoBox style={{ marginTop: '20px', background: '#EFF6FF', borderColor: '#3B82F6' }}>
                        <AlertCircle style={{ color: '#3B82F6' }} />
                        <div className="info-content">
                          <p>
                            {language === 'vi' 
                              ? 'Các tài liệu xác thực này đã được gửi đến OpPo để xem xét. Bạn không thể chỉnh sửa hoặc xóa các tài liệu này. Nếu cần cập nhật, vui lòng liên hệ bộ phận hỗ trợ.'
                              : 'These verification documents have been submitted to OpPo for review. You cannot edit or delete these documents. If you need to update them, please contact support.'}
                          </p>
                        </div>
                      </InfoBox>
                    )}
                  </>
                )}
              </DocumentsSection>
            </form>
          </MainPanel>
        </ProfileContent>
        </>
        )}
      </ProfileContainer>
      <GlobalSpinStyle />
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', cursor: 'zoom-out'
          }}
        >
          <button
            onClick={() => setLightboxImage(null)}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: '50%', width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white'
            }}
          >
            <X size={20} />
          </button>
          <img
            src={lightboxImage}
            alt="full"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              cursor: 'default',
              imageRendering: 'auto',
            }}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployerProfile;