import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { Button, Input, TextArea, Select, FormGroup, Label } from '../../components/FormElements';
import { Save, ArrowLeft, AlertCircle, Briefcase, Clock, ClipboardList, Plus, Trash2, Sparkles, Loader2, UploadCloud, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import jobPostService from '../../services/jobPostService';
import employerProfileService from '../../services/employerProfileService';
import { fetchAuthSession } from 'aws-amplify/auth';
import cvAiService from '../../services/cvAiService';

// Days of week options for work-hour slots. `key` is the stable token persisted
// into the workHours string; vi/en are the display labels.
const WORK_DAY_OPTIONS = [
  { key: 'T2', vi: 'T2', en: 'Mon' },
  { key: 'T3', vi: 'T3', en: 'Tue' },
  { key: 'T4', vi: 'T4', en: 'Wed' },
  { key: 'T5', vi: 'T5', en: 'Thu' },
  { key: 'T6', vi: 'T6', en: 'Fri' },
  { key: 'T7', vi: 'T7', en: 'Sat' },
  { key: 'CN', vi: 'CN', en: 'Sun' },
];

// Keyframe animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PostJobContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  animation: ${fadeIn} 0.4s ease-out;
`;

const PageLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 28px;
  align-items: start;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const JdUploadCard = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%);
  border: 2px dashed #bfdbfe;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 28px;
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.08);
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 12px 30px -5px rgba(59, 130, 246, 0.15);
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: #f1f5f9;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
  }
`;

const TabButton = styled.button`
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  border: 1.5px solid ${props => props.$active ? '#3b82f6' : '#e2e8f0'};
  background: ${props => props.$active ? '#3b82f6' : '#ffffff'};
  color: ${props => props.$active ? '#ffffff' : '#475569'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active ? '#2563eb' : '#f8fafc'};
  }
`;

const FileUploadArea = styled.div`
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  padding: 28px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }
  
  input {
    display: none;
  }

  svg {
    width: 40px;
    height: 40px;
    color: #94a3b8;
    margin-bottom: 8px;
  }
`;

const SidebarCard = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 24px;
  border: 1px solid ${props => props.theme.colors.border};
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  
  @media (max-width: 1024px) {
    position: static;
  }
`;

const SidebarTitle = styled.h3`
  font-size: 15px;
  font-weight: 750;
  color: ${props => props.theme.colors.text};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ChecklistItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid ${props => props.theme.colors.border}22;
  font-size: 13.5px;
  color: ${props => props.$warning ? '#dc2626' : props.$filled ? '#059669' : '#64748b'};
  font-weight: ${props => (props.$warning || props.$filled) ? '600' : '500'};
  
  .label-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;


const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
  margin-bottom: 24px;
  background: none;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
    transform: translateX(-4px);
  }
  
  svg {
    width: 20px;
    height: 20px;
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: translateX(-2px);
  }
`;

const FormCard = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 40px;
  border: 1px solid ${props => props.theme.colors.border};
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.5s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #1e40af 0%, #2563eb 100%);
  }
  
  @media (max-width: 768px) {
    padding: 32px 24px;
    border-radius: 16px;
  }
`;

const FormHeader = styled.div`
  margin-bottom: 32px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  
  .icon-box {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 2px solid #BFDBFE;
    
    svg {
      width: 28px;
      height: 28px;
      color: #1e40af;
    }
  }
  
  .header-text {
    flex: 1;
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      color: ${props => props.theme.colors.text};
      
      @media (max-width: 768px) {
        font-size: 24px;
      }
    }
    
    p {
      color: ${props => props.theme.colors.textLight};
      font-size: 15px;
      line-height: 1.6;
    }
  }
`;

const SectionLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  svg {
    width: 16px;
    height: 16px;
    color: #1e40af;
    flex-shrink: 0;
  }
`;

const SubmitButton = styled(Button)`
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  border: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(30, 64, 175, 0.3);
  }
`;

const InfoBox = styled.div`
  background: #EFF6FF;
  border: 2px solid #BFDBFE;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
  animation: ${fadeIn} 0.7s ease-out;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.1);
  }
  
  svg {
    width: 20px;
    height: 20px;
    color: #1e40af;
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .info-content {
    flex: 1;
    
    .info-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 4px;
    }
    
    .info-text {
      font-size: 13px;
      color: #1e3a8a;
      line-height: 1.6;
    }
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.$columns || '1fr'};
  gap: 20px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const WorkHoursRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const WorkHoursActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 42px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid ${props => props.$danger ? '#fecaca' : '#bfdbfe'};
  background: ${props => props.$danger ? '#fff1f2' : '#eff6ff'};
  color: ${props => props.$danger ? '#dc2626' : '#1e40af'};
  font-size: 13px;
  font-weight: 700;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(30, 64, 175, 0.12);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 32px;
  border-top: 2px solid ${props => props.theme.colors.border};
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SpinningLoader = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const AiButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: white;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  margin-bottom: 12px;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const VerificationWarning = styled.div`
  background: #FEF3C7;
  border: 2px solid #FCD34D;
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 32px;
  color: #92400E;
  display: flex;
  align-items: start;
  gap: 16px;
  
  svg {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    color: #D97706;
  }
  
  .content {
    flex: 1;
    
    h3 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #78350F;
    }
    
    p {
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 16px;
      color: #92400E;
    }
    
    button {
      background: #1e40af;
      color: white;
      font-weight: 700;
      padding: 10px 20px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      
      &:hover {
        background: #1e3a8a;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
      }
    }
  }
`;

const VerificationModalContent = styled.div`
  text-align: center;
  padding: 32px 24px;
  
  .icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    border-radius: 50%;
    background: #FEF3C7;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D97706;
    border: 3px solid #FCD34D;
    
    svg {
      width: 40px;
      height: 40px;
    }
  }
  
  h3 {
    font-size: 24px;
    font-weight: 800;
    margin-bottom: 16px;
    color: #1E293B;
  }
  
  p {
    font-size: 15px;
    color: #64748B;
    line-height: 1.7;
    margin-bottom: 28px;
  }
  
  .button-group {
    display: flex;
    gap: 12px;
    justify-content: center;
    
    button {
      flex: 1;
      max-width: 200px;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
      }
    }
  }
`;

const AnimatedFormGroup = styled(FormGroup)`
  animation: ${fadeIn} 0.3s ease-out;
  margin-bottom: 20px;
`;

const PostJob = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const editingJob = location.state?.job; // Get job data if editing
  const isEditing = !!editingJob;

  const createWorkHourSlot = (isNew = true) => ({ startTime: '', endTime: '', days: [], isNew });
  const parseWorkHours = (workHours) => {
    const normalized = String(workHours || '')
      .split(/\s*(?:\||\n)\s*/)
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        let days = [];
        let timeStr = part;
        const atIdx = part.indexOf('@');
        if (atIdx !== -1) {
          days = part.slice(0, atIdx).split(',').map(d => d.trim()).filter(Boolean);
          timeStr = part.slice(atIdx + 1).trim();
        }
        const [startTime = '', endTime = ''] = timeStr.split('-').map(t => t.trim());
        return startTime && endTime ? { startTime, endTime, days, isNew: false } : null;
      })
      .filter(Boolean)
      .slice(0, 5);

    return normalized.length > 0 ? normalized : [createWorkHourSlot(false)];
  };
  const serializeWorkHours = (slots) => slots
    .filter(slot => slot.startTime && slot.endTime)
    .map(slot => {
      const time = `${slot.startTime} - ${slot.endTime}`;
      return slot.days && slot.days.length > 0 ? `${slot.days.join(',')} @ ${time}` : time;
    })
    .join(' | ');

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [workHoursList, setWorkHoursList] = useState([createWorkHourSlot(false)]);
  const [loadingAi, setLoadingAi] = useState(false);

  const [showJdParser, setShowJdParser] = useState(false);
  const [jdActiveTab, setJdActiveTab] = useState('file');
  const [jdText, setJdText] = useState('');
  const [parsingJd, setParsingJd] = useState(false);
  const [fieldWarnings, setFieldWarnings] = useState([]);


  const [formData, setFormData] = useState({
    title: '',
    location: '',
    jobType: 'part-time',
    workDays: '',
    workHours: '',
    salary: '',
    salaryUnit: 'hour',
    tags: '',
    description: '',
    requirements: '',
    benefits: '',
    isAiScreeningEnabled: false,
    customQuestions: '',
    customFields: []
  });

  // Check verification status on mount — fetch real isVerified from API
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const profile = await employerProfileService.getMyProfile();
        if (profile && profile.isVerified === true) {
          setVerificationStatus('approved');
        } else {
          // Check if pending (submitted but not yet approved)
          const verificationData = profile?.verificationStatus || null;
          if (verificationData === 'pending') {
            setVerificationStatus('pending');
          } else {
            setVerificationStatus('not_started');
          }
          if (!isEditing) {
            setShowVerificationModal(true);
          }
        }
      } catch (err) {
        console.error('Error checking verification status:', err);
        // Fallback: block access
        setVerificationStatus('not_started');
        if (!isEditing) setShowVerificationModal(true);
      }
    };
    checkVerification();
  }, [isEditing]);

  // Pre-fill form if editing
  useEffect(() => {
    if (editingJob) {
      const parsedWorkHours = parseWorkHours(editingJob.workHours || `${editingJob.startTime || ''} - ${editingJob.endTime || ''}`);
      setWorkHoursList(parsedWorkHours);
      setFormData({
        title: editingJob.title || '',
        location: editingJob.location || '',
        jobType: editingJob.jobType || 'part-time',
        workDays: editingJob.workDays || '',
        workHours: editingJob.workHours || serializeWorkHours(parsedWorkHours),
        salary: editingJob.salary || '',
        salaryUnit: editingJob.salaryUnit || 'hour',
        tags: editingJob.tags || '',
        description: editingJob.description || '',
        requirements: editingJob.requirements || '',
        benefits: editingJob.benefits || '',
        isAiScreeningEnabled: editingJob.isAiScreeningEnabled || false,
        customQuestions: editingJob.customQuestions ? editingJob.customQuestions.join('\n') : '',
        customFields: Array.isArray(editingJob.customFields) ? editingJob.customFields : []
      });
    }
  }, [editingJob]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      workHours: serializeWorkHours(workHoursList)
    }));
  }, [workHoursList]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Clear warning for this field if any
    setFieldWarnings(prev => prev.filter(w => w !== name));

    // Update formData
    setFormData(prev => {
      const val = type === 'checkbox' ? checked : value;
      const updated = { ...prev, [name]: val };
      return updated;
    });
  };

  const runJdParsing = async (payload) => {
    setParsingJd(true);
    try {
      const result = await cvAiService.parseJd({
        ...payload,
        language: language
      });

      if (result) {
        setFormData(prev => ({
          ...prev,
          title: result.title || prev.title,
          location: result.location || prev.location,
          salary: result.salary || prev.salary,
          salaryUnit: result.salaryUnit || prev.salaryUnit || 'hour',
          tags: Array.isArray(result.tags) ? result.tags.join(', ') : (result.tags || prev.tags),
          description: result.description || prev.description,
          requirements: result.requirements || prev.requirements,
          benefits: result.benefits || prev.benefits,
          workDays: result.workDays || prev.workDays,
        }));

        if (Array.isArray(result.workHoursList) && result.workHoursList.length > 0) {
          setWorkHoursList(result.workHoursList.map((slot, index) => ({
            startTime: slot.startTime || '',
            endTime: slot.endTime || '',
            days: slot.days || [],
            isNew: index > 0
          })));
        }

        setFieldWarnings(result.warnings || []);

        alert(language === 'vi'
          ? 'AI đã tự động phân bổ và điền thông tin vào biểu mẫu thành công!'
          : 'AI has successfully extracted and filled the form!');

        setShowJdParser(false);
      }
    } catch (error) {
      console.error('Error parsing JD:', error);
      alert(error.message || (language === 'vi' ? 'Có lỗi xảy ra khi phân tích JD.' : 'Error parsing JD.'));
    } finally {
      setParsingJd(false);
    }
  };

  const handlePdfFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert(language === 'vi' ? 'Vui lòng chọn file PDF!' : 'Please select a PDF file!');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert(language === 'vi' ? 'Dung lượng file không được vượt quá 2MB!' : 'File size must not exceed 2MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result.split(',')[1];
      await runJdParsing({ fileContent: base64Str, fileType: 'application/pdf' });
    };
    reader.readAsDataURL(file);
  };


  // Custom fields (employer-defined extra JD sections)
  const handleAddCustomField = () => {
    setFormData(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), { label: '', value: '' }]
    }));
  };

  const handleRemoveCustomField = (index) => {
    setFormData(prev => ({
      ...prev,
      customFields: (prev.customFields || []).filter((_, i) => i !== index)
    }));
  };

  const handleCustomFieldChange = (index, key, value) => {
    setFormData(prev => ({
      ...prev,
      customFields: (prev.customFields || []).map((field, i) => (
        i === index ? { ...field, [key]: value } : field
      ))
    }));
  };

  const handleWorkHourChange = (index, field, value) => {
    setWorkHoursList(prev => prev.map((slot, slotIndex) => (
      slotIndex === index ? { ...slot, [field]: value } : slot
    )));
  };

  const toggleWorkHourDay = (index, dayKey) => {
    setWorkHoursList(prev => prev.map((slot, slotIndex) => {
      if (slotIndex !== index) return slot;
      const days = slot.days || [];
      const nextDays = days.includes(dayKey)
        ? days.filter(d => d !== dayKey)
        : [...days, dayKey];
      // Keep canonical week order (T2 -> CN)
      const ordered = WORK_DAY_OPTIONS.map(o => o.key).filter(k => nextDays.includes(k));
      return { ...slot, days: ordered };
    }));
  };

  const addWorkHour = () => {
    setWorkHoursList(prev => {
      if (prev.length >= 5) return prev;
      return [...prev, createWorkHourSlot()];
    });
  };

  const removeWorkHour = (index) => {
    setWorkHoursList(prev => {
      if (prev.length === 1) return prev;
      const next = prev.filter((_, slotIndex) => slotIndex !== index);
      return next.length > 0 ? next : [createWorkHourSlot()];
    });
  };

  const handleGenerateJdWithAi = async () => {
    if (!formData.title.trim()) return;

    setLoadingAi(true);
    try {
      const result = await cvAiService.suggestJd({
        title: formData.title,
        location: formData.location,
        jobType: formData.jobType,
        workDays: formData.workDays,
        workHours: formData.workHours,
        salary: formData.salary,
        tags: formData.tags,
        language: language
      });

      if (result) {
        setFormData(prev => ({
          ...prev,
          description: result.description || prev.description,
          responsibilities: result.responsibilities || prev.responsibilities,
          requirements: result.requirements || prev.requirements,
          benefits: result.benefits || prev.benefits
        }));
      }
    } catch (error) {
      console.error('Error generating JD with AI:', error);
      alert(error.message || (language === 'vi'
        ? 'Không thể tạo JD tự động. Vui lòng thử lại.'
        : 'Failed to generate JD. Please try again.'));
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Require salary
    if (!String(formData.salary).trim()) {
      alert(language === 'vi'
        ? 'Vui lòng nhập mức lương.'
        : 'Please enter the salary.');
      return;
    }

    // Validate work date is not in the past
    if (formData.workDays) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.workDays < today) {
        alert(language === 'vi'
          ? 'Ngày làm việc không được ở trong quá khứ.'
          : 'Work date cannot be in the past.');
        return;
      }
    }

    // Block new job posting if not verified
    if (!isEditing && verificationStatus !== 'approved') {
      setShowVerificationModal(true);
      return;
    }

    console.log('🔥🔥🔥 SUBMIT BUTTON CLICKED');
    console.log('📦 Form data:', formData);
    console.log('📝 Is editing:', isEditing);
    console.log('📝 Editing job:', editingJob);

    try {
      const customQuestionsArray = formData.customQuestions
        ? formData.customQuestions.split('\n').map(q => q.trim()).filter(q => q.length > 0)
        : [];

      // Tạo payload sạch để loại bỏ customQuestions kiểu string cũ
      const sanitizedCustomFields = (formData.customFields || [])
        .map(f => ({ label: (f.label || '').trim(), value: (f.value || '').trim() }))
        .filter(f => f.label.length > 0 || f.value.length > 0);

      const cleanFormData = {
        ...formData,
        customQuestions: customQuestionsArray,
        customFields: sanitizedCustomFields
      };

      if (isEditing) {
        // Update existing job in DynamoDB
        const jobId = editingJob.idJob || editingJob.id;
        console.log('🔄 Updating job with ID:', jobId);

        if (!jobId) {
          throw new Error('Job ID not found');
        }

        await jobPostService.updateJobPost(jobId, cleanFormData);
        console.log('✅ Job post updated successfully');
      } else {
        // Get authenticated user info
        const session = await fetchAuthSession();
        let employerId = 'anonymous';
        let employerEmail = 'anonymous@example.com';
        let employerName = language === 'vi' ? 'Công ty' : 'Company';

        if (session && session.tokens) {
          const idTokenPayload = session.tokens.idToken?.payload;
          employerId = idTokenPayload?.sub || 'anonymous';
          employerEmail = idTokenPayload?.email || 'anonymous@example.com';

          // Try to get company name from EmployerProfile
          try {
            const profile = await employerProfileService.getMyProfile();
            if (profile && profile.companyName) {
              employerName = profile.companyName;
              console.log('✅ Got company name from profile:', employerName);
            } else {
              // Fallback to email username
              employerName = employerEmail.split('@')[0];
              console.log('⚠️ No company name in profile, using email username');
            }
          } catch (error) {
            console.warn('⚠️ Could not load employer profile:', error);
            employerName = employerEmail.split('@')[0];
          }

          console.log('✅ User authenticated:', { employerId, employerEmail, employerName });
        } else {
          console.warn('⚠️ No authentication session - using anonymous');
        }

        // Generate job ID
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomStr = '';
        for (let i = 0; i < 5; i++) {
          randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const jobId = `JOB-${year}${month}${day}-${randomStr}`;

        const payload = {
          idJob: jobId,
          employerId: employerId,
          employerEmail: employerEmail,
          employerName: employerName,
          ...cleanFormData,
          // Require admin moderation for standard jobs
          status: 'pending',
          applicants: 0,
          views: 0,
          responseRate: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        console.log('📤 Sending request with employer info:', payload);

        // Use direct API (CORS is fixed)
        const apiUrl = 'https://dlidp35x33.execute-api.ap-southeast-1.amazonaws.com/prod/jobs';

        console.log('🔗 API URL:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          mode: 'cors'
        });

        console.log('📥 Response status:', response.status);

        const result = await response.json();
        console.log('📥 Response data:', result);

        if (response.ok) {
          console.log('✅ Job post created successfully with ID:', result.data.idJob);
        } else {
          throw new Error('API request failed: ' + response.status);
        }
      }

      // Navigate back to standard jobs page
      navigate('/employer/standard-jobs');
    } catch (error) {
      console.error('❌ Error saving job post:', error);
      alert(language === 'vi'
        ? 'Có lỗi xảy ra khi lưu tin tuyển dụng. Vui lòng thử lại.'
        : 'Error saving job post. Please try again.');
    }
  };

  return (
    <DashboardLayout role="employer" showSearch={false} key={language}>
      <PostJobContainer>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeft /> {language === 'vi' ? 'Quay lại' : 'Back'}
        </BackButton>

        {/* Verification Warning */}
        {verificationStatus !== 'approved' && !isEditing && (
          <VerificationWarning>
            <AlertCircle />
            <div className="content">
              <h3>{language === 'vi' ? '⚠️ Yêu cầu xác thực hồ sơ công ty' : '⚠️ Company Verification Required'}</h3>
              <p>
                {language === 'vi'
                  ? 'Bạn cần hoàn tất xác thực hồ sơ công ty trước khi đăng tin tuyển dụng. Quá trình xác thực bao gồm 4 bước: Giấy phép kinh doanh, Thông tin doanh nghiệp, Người đại diện, và Thông tin liên hệ.'
                  : 'You need to complete company verification before posting jobs. The verification process includes 4 steps: Business License, Company Information, Representative, and Contact Information.'}
              </p>
              {verificationStatus === 'pending' ? (
                <p style={{ fontWeight: '600', marginBottom: 0 }}>
                  {language === 'vi'
                    ? '✓ Hồ sơ đang được xem xét. Chúng tôi sẽ phê duyệt trong vòng 24-48 giờ.'
                    : '✓ Your profile is under review. We will approve within 24-48 hours.'}
                </p>
              ) : (
                <button onClick={() => navigate('/employer/verification')}>
                  {language === 'vi' ? 'Bắt đầu xác thực ngay' : 'Start Verification Now'}
                </button>
              )}
            </div>
          </VerificationWarning>
        )}

        {/* JD Auto-Fill Activator Banner / Button */}
        {!isEditing && (
          <div style={{ marginBottom: '24px' }}>
            {!showJdParser ? (
              <Button
                type="button"
                $variant="secondary"
                onClick={() => setShowJdParser(true)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  border: '1.5px solid #bfdbfe',
                  color: '#1e40af',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '16px',
                  borderRadius: '12px'
                }}
              >
                <Sparkles size={18} />
                {language === 'vi'
                  ? 'Đăng bài nhanh chóng từ JD đã có sẵn'
                  : 'Quickly post from available JD'}
              </Button>
            ) : (
              <JdUploadCard>
                <button type="button" className="close-btn" onClick={() => setShowJdParser(false)}>
                  <X size={16} />
                </button>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a8a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#2563eb" />
                  {language === 'vi'
                    ? 'Đăng bài nhanh chóng từ JD đã có sẵn'
                    : 'Quickly post from available JD'}
                </h3>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <TabButton
                    type="button"
                    $active={jdActiveTab === 'file'}
                    onClick={() => setJdActiveTab('file')}
                  >
                    {language === 'vi' ? 'Tải tệp PDF sẵn có' : 'Upload existing PDF'}
                  </TabButton>
                  <TabButton
                    type="button"
                    $active={jdActiveTab === 'text'}
                    onClick={() => setJdActiveTab('text')}
                  >
                    {language === 'vi' ? 'Dán văn bản JD' : 'Paste JD Text'}
                  </TabButton>
                </div>

                {parsingJd ? (
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontWeight: '600', color: '#1e3a8a', fontSize: '14px' }}>
                      {language === 'vi'
                        ? 'AI đang đọc nội dung JD và tự động điền các trường biểu mẫu...'
                        : 'AI is reading JD content and filling form fields...'}
                    </span>
                  </div>
                ) : (
                  <>
                    {jdActiveTab === 'file' ? (
                      <FileUploadArea onClick={() => document.getElementById('jd-pdf-upload').click()}>
                        <UploadCloud />
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                          {language === 'vi' ? 'Kéo & thả file PDF JD vào đây hoặc Click để chọn file' : 'Drag & drop PDF JD file here or click to select'}
                        </h4>
                        <p style={{ fontSize: '12px', color: '#64748b' }}>
                          {language === 'vi' ? 'Chấp nhận file .pdf có kích thước dưới 2MB' : 'Supports .pdf files under 2MB'}
                        </p>
                        <input
                          id="jd-pdf-upload"
                          type="file"
                          accept=".pdf"
                          onChange={handlePdfFileSelect}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </FileUploadArea>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <TextArea
                          value={jdText}
                          onChange={(e) => setJdText(e.target.value)}
                          placeholder={language === 'vi'
                            ? 'Dán nội dung mô tả công việc (JD) của bạn vào đây...'
                            : 'Paste your job description (JD) text here...'}
                          rows={6}
                        />
                        <Button
                          type="button"
                          $variant="primary"
                          disabled={!jdText.trim()}
                          onClick={() => runJdParsing({ text: jdText })}
                        >
                          <Sparkles size={14} />
                          {language === 'vi' ? 'Phân tích & Tự động điền' : 'Analyze & Autofill'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </JdUploadCard>
            )}
          </div>
        )}

        <PageLayout>
          {/* Main Form Content */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FormCard>
              <FormHeader>
                <div className="icon-box">
                  <Briefcase />
                </div>
                <div className="header-text">
                  <h1>{isEditing
                    ? (language === 'vi' ? 'Chỉnh Sửa Tin Tuyển Dụng' : 'Edit Job Posting')
                    : (language === 'vi' ? 'Đăng Bài Tiêu Chuẩn' : 'Post New Job')}
                  </h1>
                  <p>{isEditing
                    ? (language === 'vi' ? 'Cập nhật thông tin tin tuyển dụng' : 'Update job posting details')
                    : (language === 'vi' ? 'Điền thông tin để tạo tin tuyển dụng' : 'Fill in the details to create a job posting')}
                  </p>
                </div>
              </FormHeader>

              <InfoBox>
                <Clock />
                <div className="info-content">
                  <div className="info-title">{language === 'vi' ? 'Lưu ý về bài đăng' : 'Posting Guidelines'}</div>
                  <div className="info-text">
                    {language === 'vi'
                      ? 'Bài đăng sẽ được hiển thị đến hết thời hạn nộp hồ sơ. Phù hợp cho các vị trí cần tuyển dụng lâu dài.'
                      : 'Posts will be prioritized ultil end of application deadline. Suitable for long-term recruitment positions.'}
                  </div>
                </div>
              </InfoBox>

              <form onSubmit={handleSubmit}>
                <FormRow $columns="1fr 1fr">
                  <FormGroup>
                    <Label>{language === 'vi' ? 'Tiêu đề công việc - Vị trí công việc *' : 'Job Title - Position *'}</Label>
                    <Input name="title" placeholder={language === 'vi' ? 'Nhân viên pha chế' : 'e.g., Waiter'} value={formData.title} onChange={handleChange} required />
                    {fieldWarnings.includes('title') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy tiêu đề phù hợp, vui lòng điền tay.' : 'AI did not find job title, please input manually.'}
                      </small>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label>{language === 'vi' ? 'Địa điểm *' : 'Location *'}</Label>
                    <Input
                      name="location"
                      placeholder={language === 'vi' ? 'Quận 1' : 'e.g., District 1'}
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                    {fieldWarnings.includes('location') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy địa điểm làm việc, vui lòng điền tay.' : 'AI did not find location, please input manually.'}
                      </small>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label>{language === 'vi' ? 'Thời hạn nộp hồ sơ *' : 'Application Deadline *'}</Label>
                    <Input
                      name="workDays"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      placeholder={language === 'vi' ? 'Chọn thời hạn' : 'Select deadline'}
                      value={formData.workDays}
                      onChange={handleChange}
                      required
                    />
                    {fieldWarnings.includes('workDays') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy thời hạn phù hợp, vui lòng điền tay.' : 'AI did not find deadline, please input manually.'}
                      </small>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label>{language === 'vi' ? 'Khung giờ làm việc *' : 'Working Hours *'}</Label>
                    {fieldWarnings.includes('workHours') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy khung giờ làm việc phù hợp, vui lòng điền tay.' : 'AI did not find working hours, please input manually.'}
                      </small>
                    )}
                    <div style={{ marginTop: '4px' }}>
                      {workHoursList.map((slot, index) => (
                        <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                          <WorkHoursRow style={{ marginBottom: 0 }}>
                            <div>
                              <Label style={{ fontSize: '13px', marginBottom: '8px' }}>{language === 'vi' ? 'Từ' : 'From'}</Label>
                              <Input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => handleWorkHourChange(index, 'startTime', e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <Label style={{ fontSize: '13px', marginBottom: '8px' }}>{language === 'vi' ? 'Đến' : 'To'}</Label>
                              <Input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => handleWorkHourChange(index, 'endTime', e.target.value)}
                                required
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <WorkHoursActionButton
                                type="button"
                                onClick={addWorkHour}
                                disabled={workHoursList.length >= 5}
                                title={language === 'vi' ? 'Thêm khung giờ' : 'Add time slot'}
                              >
                                <Plus />
                              </WorkHoursActionButton>
                              {slot.isNew && (
                                <WorkHoursActionButton
                                  type="button"
                                  $danger
                                  onClick={() => removeWorkHour(index)}
                                  title={language === 'vi' ? 'Xóa khung giờ' : 'Remove time slot'}
                                >
                                  <Trash2 />
                                </WorkHoursActionButton>
                              )}
                            </div>
                          </WorkHoursRow>
                          <div style={{ marginTop: '12px' }}>
                            <Label style={{ fontSize: '13px', marginBottom: '8px' }}>{language === 'vi' ? 'Thứ' : 'Days'}</Label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {WORK_DAY_OPTIONS.map(opt => {
                                const active = (slot.days || []).includes(opt.key);
                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => toggleWorkHourDay(index, opt.key)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      border: `1px solid ${active ? '#1e40af' : '#cbd5e1'}`,
                                      background: active ? '#1e40af' : '#ffffff',
                                      color: active ? '#ffffff' : '#475569',
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    {language === 'vi' ? opt.vi : opt.en}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </FormGroup>

                  <FormGroup>
                    <Label>{language === 'vi' ? 'Mức lương *' : 'Salary *'}</Label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          name="salary"
                          type="number"
                          min="0"
                          placeholder={language === 'vi' ? 'Ví dụ: 25000' : 'e.g., 25000'}
                          value={formData.salary}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <Select
                        name="salaryUnit"
                        value={formData.salaryUnit}
                        onChange={handleChange}
                        style={{ maxWidth: '160px' }}
                      >
                        <option value="hour">{language === 'vi' ? 'VNĐ/giờ' : 'VND/hour'}</option>
                        <option value="month">{language === 'vi' ? 'VNĐ/tháng' : 'VND/month'}</option>
                      </Select>
                    </div>
                    {fieldWarnings.includes('salary') && (
                      <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                        ⚠️ {language === 'vi' ? 'AI không tìm thấy mức lương phù hợp, vui lòng điền tay.' : 'AI did not find salary, please input manually.'}
                      </small>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label>{language === 'vi' ? 'Đặc điểm' : 'Tags'}</Label>
                    <Input
                      name="tags"
                      placeholder={language === 'vi' ? 'Pha chế, F&B, Coffee (phân cách bằng dấu phẩy)' : 'Barista, F&B, Coffee (comma separated)'}
                      value={formData.tags}
                      onChange={handleChange}
                    />
                    <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
                      {language === 'vi'
                        ? 'Nhập các đặc điểm và phân cách bằng dấu phẩy. Ví dụ: Pha chế, F&B, Coffee'
                        : 'Enter tags separated by commas. Example: Barista, F&B, Coffee'}
                    </p>
                  </FormGroup>
                </FormRow>

                {/* AI Screening & Custom Interview Questions */}
                <FormRow $columns="1fr">
                  <FormGroup style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F5F3FF', padding: '18px', borderRadius: '12px', border: '2px solid #DDD6FE', transition: 'all 0.3s ease' }}>
                      <input
                        type="checkbox"
                        id="isAiScreeningEnabled"
                        name="isAiScreeningEnabled"
                        checked={formData.isAiScreeningEnabled}
                        onChange={handleChange}
                        style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#8b5cf6' }}
                      />
                      <label htmlFor="isAiScreeningEnabled" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1 }}>
                        <span style={{ fontWeight: '700', fontSize: '15px', color: '#4C1D95', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sparkles size={16} color="#8b5cf6" />
                          {language === 'vi' ? 'Chọn lọc ứng viên qua AI (Vòng 1 Sàng lọc CV & Vòng 2 Phỏng vấn)' : 'Screen Candidates with AI (Round 1 CV & Round 2 Interview)'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6D28D9', marginTop: '4px', fontWeight: '500' }}>
                          {language === 'vi'
                            ? 'Kích hoạt tự động phân tích CV khi ứng tuyển và mở khóa phòng phỏng vấn chat trực tuyến với AI.'
                            : 'Enable auto-analysis of candidate CVs and unlock the live chat interview simulator with AI.'}
                        </span>
                      </label>
                    </div>
                  </FormGroup>

                  {formData.isAiScreeningEnabled && (
                    <AnimatedFormGroup>
                      <Label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#4C1D95' }}>
                        <ClipboardList size={16} color="#8b5cf6" />
                        {language === 'vi' ? 'Câu hỏi phỏng vấn riêng từ bạn dành cho AI học (Mỗi câu hỏi một dòng) *' : 'Custom Interview Questions for AI to Learn (One question per line) *'}
                      </Label>
                      <TextArea
                        name="customQuestions"
                        placeholder={language === 'vi'
                          ? "Ví dụ:\nBạn có sẵn sàng tăng ca hoặc làm ca đêm khi cửa hàng đông khách không?\nBạn đã có chứng chỉ pha chế chuyên nghiệp nào chưa?"
                          : "Example:\nAre you willing to work overtime or night shifts if the store gets busy?\nDo you have any professional barista certifications?"}
                        value={formData.customQuestions}
                        onChange={handleChange}
                        rows={4}
                        style={{ border: '1px solid #C084FC', focusBorderColor: '#8B5CF6' }}
                      />
                      <p style={{ fontSize: '12px', color: '#7C3AED', marginTop: '6px', fontWeight: '500' }}>
                        {language === 'vi'
                          ? 'AI Interviewer sẽ học các câu hỏi này và đưa vào cuộc phỏng vấn trực tiếp với Candidate ở Vòng 2.'
                          : 'The AI Interviewer will learn these questions and include them in the live interview with candidates.'}
                      </p>
                    </AnimatedFormGroup>
                  )}
                </FormRow>

                <FormGroup style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <SectionLabel style={{ marginBottom: 0 }}>
                      <span>{language === 'vi' ? 'Mô tả công việc *' : 'Job Description *'}</span>
                    </SectionLabel>
                    {formData.title && (
                      <AiButton
                        type="button"
                        onClick={handleGenerateJdWithAi}
                        disabled={loadingAi}
                        style={{ marginBottom: 0 }}
                      >
                        {loadingAi ? (
                          <>
                            <SpinningLoader size={14} />
                            {language === 'vi' ? 'Đang tạo JD...' : 'Generating JD...'}
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            {language === 'vi' ? 'Tạo nhanh JD với AI' : 'Quickly generate JD with AI'}
                          </>
                        )}
                      </AiButton>
                    )}
                  </div>
                  <TextArea name="description" placeholder={language === 'vi' ? 'Mô tả vị trí công việc...' : 'Describe the position...'} value={formData.description} onChange={handleChange} required />
                  {fieldWarnings.includes('description') && (
                    <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                      ⚠️ {language === 'vi' ? 'AI không thể tạo mô tả công việc, vui lòng nhập tay.' : 'AI did not generate description, please input manually.'}
                    </small>
                  )}
                </FormGroup>

                <FormGroup>
                  <SectionLabel>
                    <span>{language === 'vi' ? 'Yêu cầu' : 'Requirements'}</span>
                  </SectionLabel>
                  <TextArea name="requirements" placeholder={language === 'vi' ? 'Liệt kê yêu cầu và trình độ...' : 'List requirements and qualifications...'} value={formData.requirements} onChange={handleChange} />
                  {fieldWarnings.includes('requirements') && (
                    <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                      ⚠️ {language === 'vi' ? 'AI không thể tạo yêu cầu công việc, vui lòng nhập tay.' : 'AI did not generate requirements, please input manually.'}
                    </small>
                  )}
                </FormGroup>

                <FormGroup>
                  <SectionLabel>
                    <span>{language === 'vi' ? 'Quyền lợi' : 'Benefits'}</span>
                  </SectionLabel>
                  <TextArea name="benefits" placeholder={language === 'vi' ? 'Liệt kê quyền lợi và phúc lợi...' : 'List benefits and perks...'} value={formData.benefits} onChange={handleChange} />
                  {fieldWarnings.includes('benefits') && (
                    <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                      ⚠️ {language === 'vi' ? 'AI không thể tạo quyền lợi, vui lòng nhập tay.' : 'AI did not generate benefits, please input manually.'}
                    </small>
                  )}
                </FormGroup>

                {/* Custom fields - employer-defined extra JD sections */}
                {(formData.customFields || []).map((field, index) => (
                  <FormGroup key={index}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleCustomFieldChange(index, 'label', e.target.value)}
                        placeholder={language === 'vi' ? 'Tên mục (vd: Địa điểm làm việc)...' : 'Field title (e.g. Work location)...'}
                        style={{
                          flex: 1,
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#1E293B',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          padding: '10px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(index)}
                        title={language === 'vi' ? 'Xóa mục này' : 'Remove this field'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '38px',
                          height: '38px',
                          flexShrink: 0,
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <TextArea
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                      placeholder={language === 'vi' ? 'Nội dung mục này...' : 'Content for this field...'}
                    />
                  </FormGroup>
                ))}

                <FormGroup>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      background: '#EFF6FF',
                      color: '#1e40af',
                      border: '1px dashed #93C5FD',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={18} />
                    {language === 'vi' ? 'Thêm mục tùy chỉnh' : 'Add custom field'}
                  </button>
                </FormGroup>

                <FormActions>
                  <Button type="button" $variant="secondary" onClick={() => navigate('/employer/dashboard')}>
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </Button>
                  <SubmitButton type="submit" $variant="primary" $size="large">
                    <Save /> {isEditing
                      ? (language === 'vi' ? 'Cập Nhật' : 'Update Job')
                      : (language === 'vi' ? 'Đăng Tin' : 'Post Job')}
                  </SubmitButton>
                </FormActions>
              </form>
            </FormCard>
          </div>

          {/* Checklist Sidebar */}
          <SidebarCard>
            <SidebarTitle>
              <ClipboardList size={18} color="#1e40af" />
              {language === 'vi' ? 'Tiến độ điền tin' : 'Filling Progress'}
            </SidebarTitle>

            <ChecklistItem $filled={!!formData.title.trim()} $warning={fieldWarnings.includes('title')}>
              <div className="label-group">
                {fieldWarnings.includes('title') ? <AlertTriangle color="#dc2626" /> : !!formData.title.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Thông tin cơ bản' : 'Basic info'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={!!formData.location.trim()} $warning={fieldWarnings.includes('location')}>
              <div className="label-group">
                {fieldWarnings.includes('location') ? <AlertTriangle color="#dc2626" /> : !!formData.location.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Địa điểm làm việc' : 'Location'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={!!formData.workDays.trim()} $warning={fieldWarnings.includes('workDays')}>
              <div className="label-group">
                {fieldWarnings.includes('workDays') ? <AlertTriangle color="#dc2626" /> : !!formData.workDays.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Thời hạn nộp hồ sơ' : 'Deadline'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={workHoursList.some(s => s.startTime && s.endTime)} $warning={fieldWarnings.includes('workHours')}>
              <div className="label-group">
                {fieldWarnings.includes('workHours') ? <AlertTriangle color="#dc2626" /> : workHoursList.some(s => s.startTime && s.endTime) ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Khung giờ làm việc' : 'Working hours'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={!!formData.salary.trim()} $warning={fieldWarnings.includes('salary')}>
              <div className="label-group">
                {fieldWarnings.includes('salary') ? <AlertTriangle color="#dc2626" /> : !!formData.salary.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Mức lương' : 'Salary'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={!!formData.description.trim()} $warning={fieldWarnings.includes('description')}>
              <div className="label-group">
                {fieldWarnings.includes('description') ? <AlertTriangle color="#dc2626" /> : !!formData.description.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Mô tả công việc' : 'Job description'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={!!formData.requirements.trim()} $warning={fieldWarnings.includes('requirements')}>
              <div className="label-group">
                {fieldWarnings.includes('requirements') ? <AlertTriangle color="#dc2626" /> : !!formData.requirements.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Yêu cầu công việc' : 'Requirements'}</span>
              </div>
            </ChecklistItem>

            <ChecklistItem $filled={!!formData.benefits.trim()} $warning={fieldWarnings.includes('benefits')}>
              <div className="label-group">
                {fieldWarnings.includes('benefits') ? <AlertTriangle color="#dc2626" /> : !!formData.benefits.trim() ? <CheckCircle2 color="#059669" /> : <Clock color="#64748b" />}
                <span>{language === 'vi' ? 'Quyền lợi ứng viên' : 'Benefits'}</span>
              </div>
            </ChecklistItem>
          </SidebarCard>
        </PageLayout>
      </PostJobContainer>

      {/* Verification Required Modal */}
      <Modal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          if (verificationStatus !== 'approved') {
            navigate('/employer/dashboard');
          }
        }}
        title={language === 'vi' ? 'Xác Thực Hồ Sơ Công Ty' : 'Company Verification'}
        size="medium"
      >
        <VerificationModalContent>
          <div className="icon">
            <AlertCircle />
          </div>
          <h3>{language === 'vi' ? 'Yêu cầu xác thực hồ sơ' : 'Verification Required'}</h3>
          <p>
            {verificationStatus === 'pending'
              ? (language === 'vi'
                ? 'Hồ sơ công ty của bạn đang được xem xét. Vui lòng chờ phê duyệt trước khi đăng tin tuyển dụng. Thời gian xử lý: 24-48 giờ.'
                : 'Your company profile is under review. Please wait for approval before posting jobs. Processing time: 24-48 hours.')
              : (language === 'vi'
                ? 'Để đăng tin tuyển dụng, bạn cần hoàn tất 4 bước xác thực hồ sơ công ty: Giấy phép kinh doanh, Thông tin doanh nghiệp, Người đại diện và Thông tin liên hệ.'
                : 'To post jobs, you need to complete 4 steps of company verification: Business License, Company Information, Representative, and Contact Information.')}
          </p>
          <div className="button-group">
            <Button
              $variant="secondary"
              onClick={() => {
                setShowVerificationModal(false);
                navigate('/employer/dashboard');
              }}
            >
              {language === 'vi' ? 'Để sau' : 'Later'}
            </Button>
            {verificationStatus !== 'pending' && (
              <Button
                $variant="primary"
                onClick={() => navigate('/employer/verification')}
              >
                {language === 'vi' ? 'Xác thực ngay' : 'Verify Now'}
              </Button>
            )}
          </div>
        </VerificationModalContent>
      </Modal>
    </DashboardLayout>
  );
};

export default PostJob;

