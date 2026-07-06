import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  UserPlus,
  ShieldCheck,
  MessageSquare,
  Headset,
  X,
  Send,
  Phone,
  Mail,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  PenSquare,
  ImagePlus,
  Trash2,
  Bookmark
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import candidateProfileService from '../services/candidateProfileService';
import feedbackService from '../services/feedbackService';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';

// Animations
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(50px) translateY(-50%);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(-50%);
  }
`;

const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(30, 64, 175, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(30, 64, 175, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(30, 64, 175, 0);
  }
`;

// Styled Components
const FloatContainer = styled.div`
  position: fixed;
  right: 24px;
  top: 55%;
  transform: translateY(-50%);
  z-index: 990;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
  animation: ${slideIn} 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @media (max-width: 768px) {
    right: 12px;
    gap: 10px;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  right: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%) translateX(10px);
  background: ${props => props.theme.colors.textDark};
  color: ${props => props.theme.colors.bgLight};
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  box-shadow: ${props => props.theme.shadows.md};
  transition: all 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: transparent transparent transparent ${props => props.theme.colors.textDark};
  }
`;

const CircularBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${props => props.theme.colors.bgLight};
  border: 1px solid ${props => props.theme.colors.border}80;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  svg {
    width: 20px;
    height: 20px;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: scale(1.08) translateY(-2px);
    background: ${props => props.theme.colors.bgLight};
    color: ${props => props.theme.colors.primary};
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.15);
    border-color: ${props => props.theme.colors.primary}40;

    svg {
      transform: scale(1.1);
    }

    ${Tooltip} {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
  }

  &:active {
    transform: scale(0.95);
  }
`;

const PulseCircularBtn = styled(CircularBtn)`
  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    top: 0;
    left: 0;
    z-index: -1;
    animation: ${pulseGlow} 2s infinite;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  background: ${props => props.theme.colors.primary};
  color: white;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${props => props.theme.colors.bgLight};
  padding: 0 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const CapsuleContainer = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border: 1px solid ${props => props.theme.colors.border}80;
  border-radius: 20px;
  width: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme.colors.primary}20;
  }
`;

const CapsuleBtn = styled.button`
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  cursor: pointer;
  color: ${props => props.theme.colors.primary};
  transition: all 0.2s ease;
  position: relative;

  svg {
    width: 18px;
    height: 18px;
    transition: transform 0.2s ease;
  }

  span {
    font-size: 9.5px;
    font-weight: 600;
    color: ${props => props.theme.colors.primary};
  }

  &:hover {
    svg {
      transform: scale(1.1);
    }
    
    ${Tooltip} {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Divider = styled.div`
  width: 20px;
  height: 1px;
  background: ${props => props.theme.colors.border};
  margin: 8px 0;
`;

// Modal Styled Components
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border}80;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: ${props => props.theme.colors.textDark};
  }
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textLight};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.border}60;
    color: ${props => props.theme.colors.textDark};
    transform: rotate(90deg);
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }
`;

const CategoryGrid = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
`;

const CategoryCard = styled.button`
  flex: 1;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid ${props => props.$selected ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.$selected ? props.theme.colors.primary + '08' : 'transparent'};
  color: ${props => props.$selected ? props.theme.colors.primary : props.theme.colors.text};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: ${props => props.$selected ? `0 0 12px ${props.theme.colors.primary}15` : 'none'};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.primary}04;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.border};
  background: transparent;
  color: ${props => props.theme.colors.textDark};
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}15;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.border};
  background: transparent;
  color: ${props => props.theme.colors.textDark};
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}15;
  }
`;

const ImageUploadArea = styled.div`
  border: 1.5px dashed ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.primary}05;
  }

  input[type='file'] {
    display: none;
  }
`;

const ImageUploadLabel = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: ${props => props.theme.colors.textLight};
  font-size: 13px;
  font-weight: 500;
  padding: 4px 0;

  svg {
    color: ${props => props.theme.colors.primary};
  }
`;

const ImagePreviewGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const ImagePreviewItem = styled.div`
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${props => props.theme.colors.border};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RemoveImageBtn = styled.button`
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;

  svg {
    width: 10px;
    height: 10px;
  }
`;

const SubmitBtn = styled.button`
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  background: ${props => props.theme.colors.primary};
  color: white;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px ${props => props.theme.colors.primary}20;

  &:hover {
    background: ${props => props.theme.colors.primary}dd;
    box-shadow: 0 6px 16px ${props => props.theme.colors.primary}35;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.textLight};
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`;

// FAQ Accordion
const FAQContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FAQItem = styled.div`
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary}40;
  }
`;

const FAQHeader = styled.button`
  width: 100%;
  padding: 16px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  text-align: left;

  span {
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.colors.textDark};
  }

  svg {
    color: ${props => props.theme.colors.textLight};
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }
`;

const FAQAnswer = styled(motion.div)`
  overflow: hidden;
`;

const FAQAnswerInner = styled.div`
  padding: 0 16px 16px 16px;
  font-size: 13.5px;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.5;
`;

// Contact Support Wrapper
const ContactSupportSection = styled.div`
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid ${props => props.theme.colors.border}80;
  display: flex;
  flex-direction: column;
  gap: 12px;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.colors.textDark};
  }
`;

const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.theme.colors.border}20;
  border: 1px solid ${props => props.theme.colors.border}60;
  border-radius: 12px;

  .info {
    display: flex;
    align-items: center;
    gap: 10px;
    color: ${props => props.theme.colors.textDark};
    font-size: 13.5px;
    font-weight: 500;

    svg {
      color: ${props => props.theme.colors.primary};
      width: 18px;
      height: 18px;
    }
  }
`;

const CopyButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.textLight};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.border}80;
    color: ${props => props.theme.colors.primary};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// Referral Modal Styled Components
const ReferralCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}0f 0%, ${props => props.theme.colors.primary}02 100%);
  border: 2px dashed ${props => props.theme.colors.primary}40;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  .icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: ${props => props.theme.colors.primary}15;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.colors.primary};

    svg {
      width: 24px;
      height: 24px;
    }
  }

  p {
    font-size: 13.5px;
    color: ${props => props.theme.colors.textSecondary};
    line-height: 1.5;
  }
`;

const CodeBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: ${props => props.theme.colors.bgLight};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 8px;

  span {
    font-family: 'Courier New', Courier, monospace;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 1px;
    color: ${props => props.theme.colors.textDark};
  }
`;

export default function FloatingSupportBar() {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toasts, removeToast, success, error: toastError } = useToast();

  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [kycCompleted, setKycCompleted] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'feedback', 'support', 'referral', or null
  const [feedbackCategory, setFeedbackCategory] = useState('bug');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [copiedText, setCopiedText] = useState(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [feedbackImages, setFeedbackImages] = useState([]); // [{file, preview, base64}]
  const fileInputRef = useRef(null);

  // Fetch initial saved jobs count and eKYC status if candidate
  useEffect(() => {
    const fetchProfileData = async () => {
      if (isAuthenticated && user?.role === 'candidate') {
        try {
          const profile = await candidateProfileService.getMyProfile();
          if (profile) {
            if (Array.isArray(profile.savedJobs)) {
              setSavedJobsCount(profile.savedJobs.length);
            }
            if (profile.kycCompleted || profile.kycStatus === 'VERIFIED') {
              setKycCompleted(true);
            }
          }
        } catch (err) {
          console.error('Error fetching candidate profile data:', err);
        }
      }
    };

    fetchProfileData();
  }, [isAuthenticated, user]);

  // Listen to the custom event for saved jobs toggled
  useEffect(() => {
    const handleSavedJobsChanged = (e) => {
      if (e.detail && Array.isArray(e.detail.savedJobs)) {
        setSavedJobsCount(e.detail.savedJobs.length);
      }
    };

    window.addEventListener('savedJobsChanged', handleSavedJobsChanged);
    return () => {
      window.removeEventListener('savedJobsChanged', handleSavedJobsChanged);
    };
  }, []);

  const handleShortcutClick = (type) => {
    if (type === 'find-jobs') {
      if (isAuthenticated && user?.role === 'candidate') {
        navigate('/candidate/jobs');
      } else {
        navigate('/jobs');
      }
      return;
    }

    if (!isAuthenticated) {
      toastError(
        language === 'vi'
          ? 'Vui lòng đăng nhập để thực hiện chức năng này'
          : 'Please sign in to access this feature'
      );
      const redirect = location.pathname + location.search;
      setTimeout(() => {
        navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
      }, 1000);
      return;
    }

    if (type === 'referral') {
      setActiveModal('referral');
    } else if (type === 'kyc') {
      if (user?.role === 'candidate') {
        if (kycCompleted) {
          success(
            language === 'vi'
              ? 'Tài khoản của bạn đã được xác thực eKYC thành công!'
              : 'Your account has already been eKYC verified!'
          );
          return;
        }
        navigate('/candidate/kyc');
      } else if (user?.role === 'employer') {
        navigate('/employer/verification');
      }
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    success(
      language === 'vi'
        ? 'Đã sao chép thành công!'
        : 'Copied successfully!'
    );
    setTimeout(() => setCopiedText(null), 2000);
  };

  const MAX_IMAGES = 5;
  const MAX_SIZE_MB = 5;

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remaining = MAX_IMAGES - feedbackImages.length;
    const toProcess = files.slice(0, remaining);

    toProcess.forEach(file => {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toastError(
          language === 'vi'
            ? `Ảnh "${file.name}" vượt quá ${MAX_SIZE_MB}MB`
            : `Image "${file.name}" exceeds ${MAX_SIZE_MB}MB`
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result; // data:image/...;base64,...
        setFeedbackImages(prev => [
          ...prev,
          { name: file.name, preview: base64, base64 }
        ]);
      };
      reader.readAsDataURL(file);
    });

    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setFeedbackImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;

    if (!isAuthenticated && !guestEmail.trim()) {
      toastError(
        language === 'vi'
          ? 'Vui lòng nhập email của bạn'
          : 'Please enter your email'
      );
      return;
    }

    if (!isAuthenticated && !/\S+@\S+\.\S+/.test(guestEmail)) {
      toastError(
        language === 'vi'
          ? 'Email không hợp lệ'
          : 'Invalid email address'
      );
      return;
    }

    setIsSubmittingFeedback(true);
    
    try {
      const userContext = isAuthenticated ? user : {
        userId: 'anonymous-guest',
        name: language === 'vi' ? 'Khách vãng lai' : 'Anonymous Guest',
        email: guestEmail,
        role: 'guest'
      };

      // Store feedback to DynamoDB
      await feedbackService.submitFeedback(feedbackCategory, feedbackComment, userContext, feedbackImages.map(img => img.base64));
      
      success(
        feedbackCategory === 'bug'
          ? (language === 'vi'
              ? 'Báo lỗi đã được gửi! Chúng tôi sẽ xem xét và xử lý sớm nhất.'
              : 'Bug report submitted! We will review and fix it as soon as possible.')
          : (language === 'vi'
              ? 'Cảm ơn góp ý của bạn! Chúng tôi sẽ phản hồi sớm nhất.'
              : 'Thank you for your feedback! We will get back to you soon.')
      );
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toastError(
        language === 'vi'
          ? 'Đã xảy ra lỗi khi gửi góp ý. Vui lòng thử lại.'
          : 'An error occurred while sending feedback. Please try again.'
      );
    } finally {
      setIsSubmittingFeedback(false);
      setFeedbackComment('');
      setGuestEmail('');
      setFeedbackImages([]);
      setActiveModal(null);
    }
  };

  const faqs = language === 'vi' ? [
    {
      q: 'Làm thế nào để ứng tuyển công việc?',
      a: 'Để ứng tuyển, bạn cần hoàn thiện hồ sơ và tìm kiếm ca làm việc phù hợp. Sau đó, bấm "Ứng tuyển ngay", đính kèm CV và nhấn xác nhận để hoàn tất.'
    },
    {
      q: 'Xác thực KYC để làm gì?',
      a: 'Xác thực danh tính (KYC) giúp bảo vệ quyền lợi lao động của bạn, tăng độ uy tín cho hồ sơ, và là điều kiện bắt buộc để có thể nhận và rút tiền thù lao an toàn.'
    },
    {
      q: 'Ví điện tử hoạt động như thế nào?',
      a: 'Ví điện tử là nơi nhận và quản lý thu nhập từ các công việc đã hoàn thành. Để rút tiền, bạn chỉ cần liên kết tài khoản ngân hàng và thực hiện giao dịch bất cứ lúc nào.'
    },
    {
      q: 'Đánh giá từ nhà tuyển dụng được cập nhật như thế nào?',
      a: 'Ngay khi nhà tuyển dụng hoàn tất đánh giá sau ca làm, bạn sẽ nhận được thông báo và điểm sao trung bình sẽ tự động cập nhật trong hồ sơ của bạn.'
    }
  ] : [
    {
      q: 'How do I apply for a job?',
      a: 'To apply, complete your profile and search for a suitable shift. Then click "Apply Now", attach your CV, and confirm to finish.'
    },
    {
      q: 'Why should I verify my identity (KYC)?',
      a: 'Identity verification (KYC) protects your labor rights, boosts your profile credibility, and is required to receive and withdraw your earnings safely.'
    },
    {
      q: 'How does the E-wallet work?',
      a: 'The E-wallet is where you receive and manage income from completed jobs. To withdraw, simply link your bank account and make a transaction at any time.'
    },
    {
      q: 'How are employer reviews updated?',
      a: 'As soon as an employer completes their review after a shift, you will receive a notification and your average star rating will automatically update on your profile.'
    }
  ];

  const referralCode = `OPPO-${user?.userId?.substring(0, 8).toUpperCase() || 'REFERRAL'}`;
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  // Don't render KYC or Saved Jobs if user is admin
  const isCandidate = user?.role === 'candidate' || !isAuthenticated;
  const isEmployer = user?.role === 'employer';
  const isAdmin = user?.role === 'admin';

  // Hide on login/register/forgot-password/otp pages
  const hideOnPaths = ['/login', '/register', '/verify-otp', '/forgot-password', '/pending-approval', '/auth/google-role-setup'];
  const shouldHide = hideOnPaths.some(path => location.pathname.includes(path));

  if (shouldHide || isAdmin) return null;

  return (
    <>
      <FloatContainer>
        {/* Find Jobs Circular Button */}
        {isCandidate && !isAdmin && (
          <CircularBtn onClick={() => handleShortcutClick('find-jobs')}>
            <Briefcase />
            <Tooltip>
              {language === 'vi' ? 'Tìm việc' : 'Find Jobs'}
            </Tooltip>
          </CircularBtn>
        )}

        {/* Post Standard Job - Employer Only */}
        {isEmployer && (
          <CircularBtn onClick={() => navigate('/employer/post-job')}>
            <PenSquare />
            <Tooltip>
              {language === 'vi' ? 'Đăng tin tuyển dụng' : 'Post a Job'}
            </Tooltip>
          </CircularBtn>
        )}

        {/* KYC / Verification Status Circular Button */}
        {!isAdmin && !(user?.role === 'candidate' && kycCompleted) && (
          <PulseCircularBtn onClick={() => handleShortcutClick('kyc')}>
            <ShieldCheck />
            <Tooltip>
              {isEmployer
                ? (language === 'vi' ? 'Xác thực hồ sơ công ty' : 'Company Verification')
                : (language === 'vi' ? 'Xác thực danh tính (KYC)' : 'KYC Verification')}
            </Tooltip>
          </PulseCircularBtn>
        )}

        {/* Feedback & Support Capsule Container */}
        <CapsuleContainer>
          {/* Góp ý */}
          <CapsuleBtn onClick={() => setActiveModal('feedback')}>
            <MessageSquare />
            <span>{language === 'vi' ? 'Góp ý' : 'Feedback'}</span>
            <Tooltip>
              {language === 'vi' ? 'Góp ý ý tưởng' : 'Send Feedback'}
            </Tooltip>
          </CapsuleBtn>

          <Divider />

          {/* Hỗ trợ */}
          <CapsuleBtn onClick={() => setActiveModal('support')}>
            <Headset />
            <span>{language === 'vi' ? 'Hỗ trợ' : 'Support'}</span>
            <Tooltip>
              {language === 'vi' ? 'Trung tâm hỗ trợ' : 'Help Center'}
            </Tooltip>
          </CapsuleBtn>

          {/* Saved Jobs - candidates only */}
          {isCandidate && isAuthenticated && (
            <>
              <Divider />
              <CapsuleBtn
                onClick={() => {
                  navigate('/candidate/jobs?tab=saved');
                }}
                style={{ position: 'relative' }}
              >
                <Bookmark />
                <span>{language === 'vi' ? 'Đã lưu' : 'Saved'}</span>

                <Tooltip>
                  {language === 'vi' ? 'Công việc đã lưu' : 'Saved Jobs'}
                </Tooltip>
              </CapsuleBtn>
            </>
          )}
        </CapsuleContainer>
      </FloatContainer>

      {/* TOAST SYSTEM */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* MODALS */}
      <AnimatePresence>
        {/* Feedback Modal */}
        {activeModal === 'feedback' && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveModal(null)}
          >
            <ModalContent
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={e => e.stopPropagation()}
            >
              <ModalHeader>
                <h3>{language === 'vi' ? 'Gửi góp ý hỗ trợ' : 'Send Feedback & Suggestion'}</h3>
                <CloseBtn onClick={() => setActiveModal(null)}>
                  <X />
                </CloseBtn>
              </ModalHeader>
              <ModalBody>
                <form onSubmit={handleFeedbackSubmit}>
                  <FormGroup>
                    <label>{language === 'vi' ? 'Phân loại' : 'Category'}</label>
                    <CategoryGrid>
                      <CategoryCard
                        type="button"
                        $type="bug"
                        $selected={feedbackCategory === 'bug'}
                        onClick={() => setFeedbackCategory('bug')}
                      >
                        {language === 'vi' ? 'Báo lỗi' : 'Report Bug'}
                      </CategoryCard>
                      <CategoryCard
                        type="button"
                        $type="suggestion"
                        $selected={feedbackCategory === 'suggestion'}
                        onClick={() => setFeedbackCategory('suggestion')}
                      >
                        {language === 'vi' ? 'Góp ý' : 'Suggestion'}
                      </CategoryCard>
                    </CategoryGrid>
                  </FormGroup>

                  {!isAuthenticated && (
                    <FormGroup>
                      <label>{language === 'vi' ? 'Email của bạn' : 'Your Email'}</label>
                      <Input
                        type="email"
                        value={guestEmail}
                        onChange={e => setGuestEmail(e.target.value)}
                        placeholder={
                          language === 'vi'
                            ? 'Vui lòng nhập email để chúng tôi phản hồi...'
                            : 'Please enter your email for our response...'
                        }
                        required
                      />
                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-light, #64748b)' }}>
                          {language === 'vi' ? 'Hoặc góp ý trực tiếp qua' : 'Or contact us directly via'}
                        </span>
                        <a
                          href="https://facebook.com/oppo.nentangtuyendung/"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#1e40af', fontWeight: 600, textDecoration: 'none' }}
                        >
                          Facebook
                        </a>

                      </div>
                    </FormGroup>
                  )}

                  <FormGroup>
                    <label>
                      {language === 'vi'
                        ? (feedbackCategory === 'bug' ? 'Nội dung báo lỗi' : 'Nội dung góp ý')
                        : (feedbackCategory === 'bug' ? 'Bug Description' : 'Comments & Details')
                      } <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <TextArea
                      value={feedbackComment}
                      onChange={e => setFeedbackComment(e.target.value)}
                      placeholder={
                        language === 'vi'
                          ? (feedbackCategory === 'bug'
                            ? 'Mô tả chi tiết lỗi bạn gặp phải, bước tái hiện lỗi...'
                            : 'Vui lòng mô tả chi tiết ý kiến để chúng tôi cải thiện hệ thống...')
                          : (feedbackCategory === 'bug'
                            ? 'Describe the bug in detail, steps to reproduce...'
                            : 'Please describe your suggestion to help us improve the platform...')
                      }
                      required
                    />
                  </FormGroup>

                  {/* Image Upload */}
                  <FormGroup>
                    <label>
                      {language === 'vi' ? 'Đính kèm ảnh' : 'Attach images'} <span style={{ color: '#ef4444' }}>*</span>
                      <span style={{ fontWeight: 400, fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>
                        ({language === 'vi' ? `tối thiểu 1, tối đa ${MAX_IMAGES} ảnh` : `min 1, max ${MAX_IMAGES} images`})
                      </span>
                    </label>
                    <ImageUploadArea>
                      <ImageUploadLabel htmlFor="feedback-image-input">
                        <ImagePlus size={18} />
                        {feedbackImages.length < MAX_IMAGES
                          ? (language === 'vi' ? 'Chọn ảnh' : 'Select images')
                          : (language === 'vi' ? `Đã đạt tối đa ${MAX_IMAGES} ảnh` : `Max ${MAX_IMAGES} images reached`)}
                      </ImageUploadLabel>
                      <input
                        id="feedback-image-input"
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={feedbackImages.length >= MAX_IMAGES}
                        onChange={handleImageSelect}
                        ref={fileInputRef}
                      />
                    </ImageUploadArea>
                    {feedbackImages.length > 0 && (
                      <ImagePreviewGrid>
                        {feedbackImages.map((img, idx) => (
                          <ImagePreviewItem key={idx}>
                            <img src={img.preview} alt={img.name} />
                            <RemoveImageBtn type="button" onClick={() => handleRemoveImage(idx)}>
                              <X />
                            </RemoveImageBtn>
                          </ImagePreviewItem>
                        ))}
                      </ImagePreviewGrid>
                    )}
                  </FormGroup>

                  <SubmitBtn type="submit" disabled={isSubmittingFeedback || !feedbackComment.trim() || feedbackImages.length === 0}>
                    <Send size={18} />
                    {isSubmittingFeedback
                      ? (language === 'vi' ? 'Đang gửi...' : 'Sending...')
                      : (language === 'vi' ? 'Gửi góp ý' : 'Submit Feedback')}
                  </SubmitBtn>
                </form>
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Support Center Modal */}
        {activeModal === 'support' && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveModal(null)}
          >
            <ModalContent
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={e => e.stopPropagation()}
            >
              <ModalHeader>
                <h3>{language === 'vi' ? 'Trung tâm trợ giúp (FAQs)' : 'Help Center & FAQs'}</h3>
                <CloseBtn onClick={() => setActiveModal(null)}>
                  <X />
                </CloseBtn>
              </ModalHeader>
              <ModalBody>
                <FAQContainer>
                  {faqs.map((faq, index) => {
                    const isOpen = expandedFAQ === index;
                    return (
                      <FAQItem key={index}>
                        <FAQHeader onClick={() => setExpandedFAQ(isOpen ? null : index)}>
                          <span>{faq.q}</span>
                          {isOpen ? <ChevronUp /> : <ChevronDown />}
                        </FAQHeader>
                        <FAQAnswer
                          initial={false}
                          animate={{ height: isOpen ? 'auto' : 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                          <FAQAnswerInner>{faq.a}</FAQAnswerInner>
                        </FAQAnswer>
                      </FAQItem>
                    );
                  })}
                </FAQContainer>

                <ContactSupportSection>
                  <h4>{language === 'vi' ? 'Liên hệ hỗ trợ trực tiếp' : 'Direct Support Contact'}</h4>
                  <ContactGrid>
                    <ContactItem>
                      <div className="info">
                        <Phone />
                        <span>
                          {language === 'vi'
                            ? 'Hotline kĩ thuật: 0379 784 509'
                            : 'Technical Hotline: 0379 784 509'}
                        </span>
                      </div>
                      <CopyButton onClick={() => handleCopy('0379 784 509', 'phone_tech')}>
                        {copiedText === 'phone_tech' ? <Check style={{ color: '#1e40af' }} /> : <Copy />}
                      </CopyButton>
                    </ContactItem>
                    <ContactItem>
                      <div className="info">
                        <Phone />
                        <span>
                          {language === 'vi'
                            ? 'Hotline hỗ trợ khách hàng: 0563 518 922'
                            : 'Customer Support Hotline: 0563 518 922'}
                        </span>
                      </div>
                      <CopyButton onClick={() => handleCopy('0563 518 922', 'phone_cs')}>
                        {copiedText === 'phone_cs' ? <Check style={{ color: '#1e40af' }} /> : <Copy />}
                      </CopyButton>
                    </ContactItem>
                    <ContactItem>
                      <div className="info">
                        <Mail />
                        <span>Email: oppohiringplatform@gmail.com</span>
                      </div>
                      <CopyButton onClick={() => handleCopy('oppohiringplatform@gmail.com', 'email')}>
                        {copiedText === 'email' ? <Check style={{ color: '#1e40af' }} /> : <Copy />}
                      </CopyButton>
                    </ContactItem>
                    <ContactItem>
                      <div className="info">
                        <Clock />
                        <span>
                          {language === 'vi'
                            ? 'Giờ làm việc: 8:00 - 17:00 (T2 - T7)'
                            : 'Working Hours: 8:00 AM - 5:00 PM (Mon - Sat)'}
                        </span>
                      </div>
                    </ContactItem>
                  </ContactGrid>
                </ContactSupportSection>
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}

      </AnimatePresence>
    </>
  );
}
