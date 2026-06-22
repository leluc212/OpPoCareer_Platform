import { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import {
  Image,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Star,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Save,
  RefreshCw,
  Info,
  ImageIcon,
  Globe,
  Calendar,
  ArrowUp,
  ArrowDown,
  Layers,
  MapPin
} from 'lucide-react';
import {
  getAllBanners,
  uploadBannerImage,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
  MAX_ACTIVE_BANNERS
} from '../../services/bannerService';

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

const PageContainer = styled.div`
  animation: ${fadeIn} 0.45s ease;
`;

const PageHeader = styled.div`
  margin-bottom: 32px;

  h1 {
    font-size: 30px;
    font-weight: 700;
    color: ${p => p.theme.colors.text};
    margin-bottom: 6px;
  }

  p {
    color: ${p => p.theme.colors.textLight};
    font-size: 15px;
  }
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 28px;
`;

const ActiveCount = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${p => p.theme.colors.bgLight};
  border: 1.5px solid ${p => p.theme.colors.border};
  border-radius: 12px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  color: ${p => p.theme.colors.text};

  .count {
    font-size: 20px;
    font-weight: 800;
    color: ${p => p.$full ? '#ef4444' : '#10b981'};
  }

  .cap {
    font-size: 13px;
    color: ${p => p.theme.colors.textLight};
    font-weight: 500;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 22px;
  background: linear-gradient(135deg, ${p => p.theme.colors.primary}, ${p => p.theme.colors.secondary || p.theme.colors.primary});
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { opacity: 0.9; transform: translateY(-1px); }
  &:active { transform: scale(0.98); }

  svg { width: 18px; height: 18px; }
`;

// ─── Grid of banner cards ─────────────────────────────────────────────────────

const BannerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
`;

const BannerCard = styled.div`
  background: ${p => p.theme.colors.bgLight};
  border-radius: 14px;
  border: 2px solid ${p => p.$active ? '#10b981' : p.theme.colors.border};
  overflow: hidden;
  transition: all 0.25s;
  position: relative;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  }
`;

const BannerImageWrap = styled.div`
  position: relative;
  height: 160px;
  background: ${p => p.theme.colors.bgDark};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const ActiveBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: #10b981;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.3px;

  svg { width: 12px; height: 12px; }
`;

const BannerActions = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;

  ${BannerCard}:hover & {
    opacity: 1;
  }
`;

const ActionBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s;
  backdrop-filter: blur(6px);

  background: ${p => p.$danger
    ? 'rgba(239,68,68,0.85)'
    : p.$edit
    ? 'rgba(59,130,246,0.85)'
    : 'rgba(255,255,255,0.85)'};
  color: ${p => (p.$danger || p.$edit) ? 'white' : '#374151'};

  &:hover { transform: scale(1.1); }

  svg { width: 14px; height: 14px; }
`;

const BannerCardBody = styled.div`
  padding: 14px 16px;
`;

const BannerTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BannerMeta = styled.div`
  font-size: 12px;
  color: ${p => p.theme.colors.textLight};
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;

  svg { width: 12px; height: 12px; flex-shrink: 0; }
`;

const BannerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1.5px solid ${p => p.$active ? '#10b981' : p.theme.colors.border};
  background: ${p => p.$active ? '#f0fdf4' : p.theme.colors.background || 'white'};
  color: ${p => p.$active ? '#059669' : p.theme.colors.textLight};
  font-size: 12px;
  font-weight: 600;
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  opacity: ${p => p.disabled ? 0.5 : 1};

  svg { width: 15px; height: 15px; }

  &:hover:not(:disabled) {
    border-color: ${p => p.$active ? '#10b981' : p.theme.colors.primary};
    color: ${p => p.$active ? '#059669' : p.theme.colors.primary};
  }
`;

const DateChip = styled.div`
  font-size: 11px;
  color: ${p => p.theme.colors.textLight};
  display: flex;
  align-items: center;
  gap: 4px;
  svg { width: 11px; height: 11px; }
`;

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 24px;
  color: ${p => p.theme.colors.textLight};

  svg {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    opacity: 0.35;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: ${p => p.theme.colors.text};
  }

  p { font-size: 14px; }
`;

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const SkeletonCard = styled.div`
  background: ${p => p.theme.colors.bgLight};
  border-radius: 14px;
  border: 2px solid ${p => p.theme.colors.border};
  overflow: hidden;

  .img-placeholder {
    height: 160px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 800px 100%;
    animation: ${shimmer} 1.4s infinite;
  }

  .body { padding: 14px 16px; }
  .line {
    height: 14px;
    border-radius: 6px;
    margin-bottom: 8px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 800px 100%;
    animation: ${shimmer} 1.4s infinite;
  }
  .line.short { width: 60%; }
`;

// ─── Modal ────────────────────────────────────────────────────────────────────

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalBox = styled(motion.div)`
  background: ${p => p.theme.colors.bgLight};
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 25px 60px rgba(0,0,0,0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${p => p.theme.colors.border};

  h2 {
    font-size: 19px;
    font-weight: 700;
    color: ${p => p.theme.colors.text};
  }
`;

const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: ${p => p.theme.colors.bgDark};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover { background: #fee2e2; color: #ef4444; }
  svg { width: 16px; height: 16px; }
`;

const ModalBody = styled.div`
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: ${p => p.theme.colors.text};
  }
`;

const InputField = styled.input`
  padding: 10px 14px;
  border: 1.5px solid ${p => p.theme.colors.border};
  border-radius: 9px;
  font-size: 14px;
  background: ${p => p.theme.colors.background || 'white'};
  color: ${p => p.theme.colors.text};
  outline: none;
  transition: border-color 0.2s;

  &:focus { border-color: ${p => p.theme.colors.primary}; }
  &::placeholder { color: ${p => p.theme.colors.textLight}; }
`;

const DropZone = styled.div`
  border: 2px dashed ${p => p.$dragging ? p.theme.colors.primary : p.theme.colors.border};
  border-radius: 10px;
  padding: 28px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${p => p.$dragging ? `${p.theme.colors.primary}08` : 'transparent'};

  &:hover {
    border-color: ${p => p.theme.colors.primary};
    background: ${p => `${p.theme.colors.primary}08`};
  }

  svg { width: 36px; height: 36px; color: ${p => p.theme.colors.primary}; margin: 0 auto 8px; }
  .hint { font-size: 13px; color: ${p => p.theme.colors.textLight}; margin-top: 4px; }
  .main-text { font-size: 14px; font-weight: 600; color: ${p => p.theme.colors.text}; }
`;

const PreviewImage = styled.div`
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 16/5;
  background: ${p => p.theme.colors.bgDark};

  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`;

const RemoveImageBtn = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(239,68,68,0.85);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  svg { width: 13px; height: 13px; }
`;

const UploadProgress = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: ${p => p.theme.colors.textLight};

  svg {
    width: 16px;
    height: 16px;
    animation: ${spin} 0.8s linear infinite;
    color: ${p => p.theme.colors.primary};
  }
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 16px 24px 20px;
  border-top: 1px solid ${p => p.theme.colors.border};
`;

const CancelBtn = styled.button`
  padding: 10px 20px;
  border: 1.5px solid ${p => p.theme.colors.border};
  border-radius: 9px;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: ${p => p.theme.colors.text};
  transition: all 0.2s;
  &:hover { background: ${p => p.theme.colors.bgDark}; }
`;

const SubmitBtn = styled.button`
  padding: 10px 22px;
  border: none;
  border-radius: 9px;
  background: linear-gradient(135deg, ${p => p.theme.colors.primary}, ${p => p.theme.colors.secondary || p.theme.colors.primary});
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  opacity: ${p => p.disabled ? 0.6 : 1};

  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { cursor: not-allowed; }

  svg {
    width: 15px;
    height: 15px;
    ${p => p.$loading && css`animation: ${spin} 0.8s linear infinite;`}
  }
`;

// ─── Toast ────────────────────────────────────────────────────────────────────

const ToastBar = styled(motion.div)`
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 2000;
  background: ${p => p.$type === 'error' ? '#ef4444' : '#10b981'};
  color: white;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 380px;

  svg { width: 18px; height: 18px; flex-shrink: 0; }
`;

// ─── Info Banner at top ───────────────────────────────────────────────────────

const InfoBar = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  color: #1e40af;
  margin-bottom: 24px;

  svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
  strong { font-weight: 700; }
`;

// ─── Delete confirm dialog ────────────────────────────────────────────────────

const ConfirmBox = styled(motion.div)`
  background: ${p => p.theme.colors.bgLight};
  border-radius: 14px;
  padding: 28px 28px 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 25px 60px rgba(0,0,0,0.2);
  text-align: center;

  svg.warn-icon {
    width: 48px;
    height: 48px;
    color: #f59e0b;
    margin: 0 auto 12px;
  }

  h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
  p { font-size: 14px; color: ${p => p.theme.colors.textLight}; margin-bottom: 20px; }
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const DangerBtn = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 9px;
  background: #ef4444;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #dc2626; }
`;

// ─── Section Label for Active/Inactive groups ─────────────────────────────────

const SectionLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: ${p => p.theme.colors.textLight};
  margin-bottom: 12px;
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 8px;

  &:first-of-type { margin-top: 0; }

  span {
    background: ${p => p.$active ? '#dcfce7' : p.theme.colors.bgDark};
    color: ${p => p.$active ? '#166534' : p.theme.colors.textLight};
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
  }
`;

// ─── Vietnam Regions for targeting ────────────────────────────────────────────

const VIETNAM_REGIONS = [
  'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng',
  'Bình Dương', 'Đồng Nai', 'Long An', 'Bà Rịa - Vũng Tàu',
  'Khánh Hòa', 'Thừa Thiên Huế', 'Quảng Nam', 'Lâm Đồng',
  'Bắc Ninh', 'Hưng Yên', 'Thanh Hóa', 'Nghệ An', 'Quảng Ninh',
  'Thái Nguyên', 'An Giang', 'Kiên Giang', 'Đắk Lắk', 'Gia Lai',
  'Tiền Giang', 'Bến Tre', 'Vĩnh Long', 'Tây Ninh', 'Bình Thuận',
  'Phú Thọ', 'Hà Tĩnh', 'Nam Định', 'Ninh Bình', 'Lào Cai',
];

// ─── Region Picker Styled Components ─────────────────────────────────────────

const RegionPickerWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RegionAllNote = styled.div`
  font-size: 12px;
  color: ${p => p.theme.colors.textLight};
  font-style: italic;
`;

const RegionChipsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
  padding: 4px 0;
`;

const RegionChip = styled.button`
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1.5px solid ${p => p.$selected ? p.theme.colors.primary : p.theme.colors.border};
  background: ${p => p.$selected ? `${p.theme.colors.primary}15` : 'transparent'};
  color: ${p => p.$selected ? p.theme.colors.primary : p.theme.colors.textLight};
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    border-color: ${p => p.theme.colors.primary};
    color: ${p => p.theme.colors.primary};
  }
`;

const SelectedRegionsBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${p => p.theme.colors.primary};
  font-weight: 600;
  margin-top: 2px;

  svg { width: 12px; height: 12px; }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const BannersManagement = () => {
  const { language } = useLanguage();
  const vi = language === 'vi';

  const [banners, setBanners]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editTarget, setEditTarget]   = useState(null); // null = new, or banner object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]             = useState(null);

  // Form state
  const [title, setTitle]         = useState('');
  const [linkUrl, setLinkUrl]     = useState('');
  const [targetRegions, setTargetRegions] = useState([]); // [] = all regions
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [dragging, setDragging]   = useState(false);

  const fileInputRef = useRef(null);
  const toastTimer   = useRef(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const activeBanners   = banners.filter(b => b.isActive);
  const inactiveBanners = banners.filter(b => !b.isActive);
  const isAtCap         = activeBanners.length >= MAX_ACTIVE_BANNERS;

  // ── load data ─────────────────────────────────────────────────────────────

  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllBanners();
      setBanners(data);
    } catch {
      showToast(vi ? 'Không thể tải dữ liệu banner' : 'Failed to load banners', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, vi]);

  useEffect(() => { loadBanners(); }, [loadBanners]);

  // ── modal helpers ─────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditTarget(null);
    setTitle('');
    setLinkUrl('');
    setTargetRegions([]);
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEditModal = (banner) => {
    setEditTarget(banner);
    setTitle(banner.title || '');
    setLinkUrl(banner.linkUrl || '');
    setTargetRegions(banner.targetRegions || []);
    setImageFile(null);
    setImagePreview(banner.imageUrl || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setImageFile(null);
    setImagePreview('');
    setTitle('');
    setLinkUrl('');
    setTargetRegions([]);
  };

  // ── file drop / select ────────────────────────────────────────────────────

  const handleFileSelect = (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      showToast(vi ? 'Chỉ chấp nhận JPG, PNG, WebP, GIF' : 'Only JPG, PNG, WebP, GIF accepted', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast(vi ? 'File không được vượt quá 10MB' : 'File must be under 10MB', 'error');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  // ── save banner ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!imagePreview && !imageFile) {
      showToast(vi ? 'Vui lòng chọn ảnh banner' : 'Please choose a banner image', 'error');
      return;
    }
    if (!title.trim()) {
      showToast(vi ? 'Vui lòng nhập tiêu đề banner' : 'Please enter a title', 'error');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = editTarget?.imageUrl || '';

      // Upload new image if user picked one
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadBannerImage(imageFile);
        setUploading(false);
      }

      const payload = {
        title: title.trim(),
        linkUrl: linkUrl.trim(),
        imageUrl,
        targetRegions,
        order: editTarget?.order || banners.length + 1
      };

      if (editTarget) {
        const updated = await updateBanner(editTarget.bannerId, payload);
        setBanners(prev => prev.map(b => b.bannerId === editTarget.bannerId ? { ...b, ...updated } : b));
        showToast(vi ? 'Đã cập nhật banner' : 'Banner updated');
      } else {
        const created = await createBanner(payload);
        setBanners(prev => [...prev, created]);
        showToast(vi ? 'Đã thêm banner mới' : 'Banner added');
      }

      closeModal();
    } catch (err) {
      showToast(err.message || (vi ? 'Có lỗi xảy ra' : 'Something went wrong'), 'error');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // ── toggle active ─────────────────────────────────────────────────────────

  const handleToggle = async (banner) => {
    const result = await toggleBannerActive(banner.bannerId, banners);
    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }
    setBanners(prev =>
      prev.map(b => b.bannerId === banner.bannerId ? { ...b, isActive: result.isActive } : b)
    );
    showToast(
      result.isActive
        ? (vi ? 'Banner đã được kích hoạt' : 'Banner activated')
        : (vi ? 'Banner đã tắt' : 'Banner deactivated')
    );
  };

  // ── delete ────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBanner(deleteTarget.bannerId);
      setBanners(prev => prev.filter(b => b.bannerId !== deleteTarget.bannerId));
      showToast(vi ? 'Đã xóa banner' : 'Banner deleted');
    } catch {
      showToast(vi ? 'Không thể xóa banner' : 'Could not delete banner', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── format date ───────────────────────────────────────────────────────────

  const fmtDate = (iso) => {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat(vi ? 'vi-VN' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
    } catch { return iso; }
  };

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout role="admin" showSearch={false}>
      <PageContainer>

        {/* ── Header ── */}
        <PageHeader>
          <h1>{vi ? '🖼️ Quản Lý Banner' : '🖼️ Banner Management'}</h1>
          <p>
            {vi
              ? `Đăng banner thoải mái, chọn tối đa ${MAX_ACTIVE_BANNERS} banner để hiển thị trên website.`
              : `Upload as many banners as you like, then choose up to ${MAX_ACTIVE_BANNERS} to show on the website.`}
          </p>
        </PageHeader>

        {/* ── Info bar ── */}
        <InfoBar>
          <Info />
          <div>
            <strong>{vi ? 'Cách hoạt động: ' : 'How it works: '}</strong>
            {vi
              ? `Tải lên bao nhiêu ảnh cũng được. Mỗi banner có nút bật/tắt. Chỉ tối đa ${MAX_ACTIVE_BANNERS} banner đang bật sẽ xuất hiện trên web. Khi đã đủ ${MAX_ACTIVE_BANNERS}, hãy tắt một banner trước khi bật cái mới.`
              : `Upload as many banners as you like. Each banner has an on/off toggle. Only up to ${MAX_ACTIVE_BANNERS} active banners will appear on the website. When the cap is reached, deactivate one before enabling another.`}
          </div>
        </InfoBar>

        {/* ── Top Bar ── */}
        <TopBar>
          <ActiveCount $full={isAtCap}>
            <Layers size={18} style={{ color: isAtCap ? '#ef4444' : '#10b981' }} />
            <span className="count">{activeBanners.length}</span>
            <span>/ {MAX_ACTIVE_BANNERS}</span>
            <span className="cap">{vi ? 'banner đang chạy' : 'banners active'}</span>
          </ActiveCount>

          <div style={{ display: 'flex', gap: 10 }}>
            <AddButton onClick={loadBanners} style={{ background: 'transparent', border: `1.5px solid`, borderColor: 'inherit', color: 'inherit' }}>
              <RefreshCw size={15} />
              {vi ? 'Tải lại' : 'Refresh'}
            </AddButton>
            <AddButton onClick={openAddModal}>
              <Plus size={18} />
              {vi ? 'Thêm Banner' : 'Add Banner'}
            </AddButton>
          </div>
        </TopBar>

        {/* ── Content ── */}
        {loading ? (
          <BannerGrid>
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i}>
                <div className="img-placeholder" />
                <div className="body">
                  <div className="line" />
                  <div className="line short" />
                </div>
              </SkeletonCard>
            ))}
          </BannerGrid>
        ) : banners.length === 0 ? (
          <EmptyState>
            <ImageIcon />
            <h3>{vi ? 'Chưa có banner nào' : 'No banners yet'}</h3>
            <p>{vi ? 'Nhấn "Thêm Banner" để tải ảnh lên và bắt đầu quản lý.' : 'Click "Add Banner" to upload images and get started.'}</p>
          </EmptyState>
        ) : (
          <>
            {/* Active banners */}
            {activeBanners.length > 0 && (
              <>
                <SectionLabel $active>
                  <CheckCircle size={14} />
                  {vi ? 'Đang hiển thị trên web' : 'Live on website'}
                  <span>{activeBanners.length}</span>
                </SectionLabel>
                <BannerGrid>
                  {activeBanners.map(banner => (
                    <BannerCardItem
                      key={banner.bannerId}
                      banner={banner}
                      onToggle={handleToggle}
                      onEdit={openEditModal}
                      onDelete={setDeleteTarget}
                      fmtDate={fmtDate}
                      isAtCap={isAtCap}
                      vi={vi}
                    />
                  ))}
                </BannerGrid>
              </>
            )}

            {/* Inactive banners */}
            {inactiveBanners.length > 0 && (
              <>
                <SectionLabel>
                  <EyeOff size={14} />
                  {vi ? 'Chưa kích hoạt' : 'Not active'}
                  <span>{inactiveBanners.length}</span>
                </SectionLabel>
                <BannerGrid>
                  {inactiveBanners.map(banner => (
                    <BannerCardItem
                      key={banner.bannerId}
                      banner={banner}
                      onToggle={handleToggle}
                      onEdit={openEditModal}
                      onDelete={setDeleteTarget}
                      fmtDate={fmtDate}
                      isAtCap={isAtCap}
                      vi={vi}
                    />
                  ))}
                </BannerGrid>
              </>
            )}
          </>
        )}

      </PageContainer>

      {/* ── Add / Edit Modal ── */}
      <AnimatePresence>
        {showModal && (
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && closeModal()}
          >
            <ModalBox
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <ModalHeader>
                <h2>
                  {editTarget
                    ? (vi ? '✏️ Chỉnh sửa banner' : '✏️ Edit banner')
                    : (vi ? '➕ Thêm banner mới' : '➕ Add new banner')}
                </h2>
                <CloseBtn onClick={closeModal}><X /></CloseBtn>
              </ModalHeader>

              <ModalBody>
                {/* Image upload */}
                <FormGroup>
                  <label>{vi ? 'Ảnh banner *' : 'Banner image *'}</label>
                  {imagePreview ? (
                    <PreviewImage>
                      <img src={imagePreview} alt="preview" />
                      <RemoveImageBtn onClick={() => { setImageFile(null); setImagePreview(''); }}>
                        <X />
                      </RemoveImageBtn>
                    </PreviewImage>
                  ) : (
                    <DropZone
                      $dragging={dragging}
                      onDragOver={e => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload />
                      <div className="main-text">
                        {vi ? 'Kéo thả hoặc click để chọn ảnh' : 'Drag & drop or click to select'}
                      </div>
                      <div className="hint">JPG, PNG, WebP, GIF · Tối đa 10MB</div>
                    </DropZone>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={e => handleFileSelect(e.target.files?.[0])}
                  />
                  {uploading && (
                    <UploadProgress>
                      <RefreshCw />
                      {vi ? 'Đang tải ảnh lên S3...' : 'Uploading to S3...'}
                    </UploadProgress>
                  )}
                </FormGroup>

                {/* Title */}
                <FormGroup>
                  <label>{vi ? 'Tiêu đề banner *' : 'Banner title *'}</label>
                  <InputField
                    type="text"
                    placeholder={vi ? 'Nhập tiêu đề...' : 'Enter title...'}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={120}
                  />
                </FormGroup>

                {/* Link URL */}
                <FormGroup>
                  <label>
                    <LinkIcon size={13} style={{ display: 'inline', marginRight: 4 }} />
                    {vi ? 'Đường dẫn khi nhấn (không bắt buộc)' : 'Click destination URL (optional)'}
                  </label>
                  <InputField
                    type="url"
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                  />
                </FormGroup>

                {/* Target Regions */}
                <FormGroup>
                  <label>
                    <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
                    {vi ? 'Khu vực hiển thị (không chọn = toàn quốc)' : 'Target regions (none = nationwide)'}
                  </label>
                  <RegionPickerWrap>
                    {targetRegions.length === 0 && (
                      <RegionAllNote>
                        {vi ? '🌍 Banner sẽ hiển thị cho tất cả khu vực' : '🌍 Banner will show for all regions'}
                      </RegionAllNote>
                    )}
                    {targetRegions.length > 0 && (
                      <SelectedRegionsBadge>
                        <MapPin />
                        {targetRegions.length} {vi ? 'khu vực được chọn' : 'regions selected'}
                        {' · '}
                        <span
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => setTargetRegions([])}
                        >
                          {vi ? 'Xóa tất cả' : 'Clear all'}
                        </span>
                      </SelectedRegionsBadge>
                    )}
                    <RegionChipsWrap>
                      {VIETNAM_REGIONS.map(region => (
                        <RegionChip
                          key={region}
                          type="button"
                          $selected={targetRegions.includes(region)}
                          onClick={() => {
                            setTargetRegions(prev =>
                              prev.includes(region)
                                ? prev.filter(r => r !== region)
                                : [...prev, region]
                            );
                          }}
                        >
                          {region}
                        </RegionChip>
                      ))}
                    </RegionChipsWrap>
                  </RegionPickerWrap>
                </FormGroup>
              </ModalBody>

              <ModalFooter>
                <CancelBtn onClick={closeModal}>{vi ? 'Hủy' : 'Cancel'}</CancelBtn>
                <SubmitBtn onClick={handleSave} disabled={saving || uploading} $loading={saving}>
                  <Save />
                  {saving
                    ? (vi ? 'Đang lưu...' : 'Saving...')
                    : (editTarget ? (vi ? 'Cập nhật' : 'Update') : (vi ? 'Thêm banner' : 'Add banner'))}
                </SubmitBtn>
              </ModalFooter>
            </ModalBox>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ── */}
      <AnimatePresence>
        {deleteTarget && (
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}
          >
            <ConfirmBox
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <AlertCircle className="warn-icon" />
              <h3>{vi ? 'Xóa banner?' : 'Delete banner?'}</h3>
              <p>
                {vi
                  ? `Bạn chắc chắn muốn xóa banner "${deleteTarget.title}"? Hành động này không thể hoàn tác.`
                  : `Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`}
              </p>
              <ConfirmActions>
                <CancelBtn onClick={() => setDeleteTarget(null)}>{vi ? 'Hủy' : 'Cancel'}</CancelBtn>
                <DangerBtn onClick={handleDeleteConfirm}>{vi ? 'Xóa' : 'Delete'}</DangerBtn>
              </ConfirmActions>
            </ConfirmBox>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <ToastBar
            $type={toast.type}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
          >
            {toast.type === 'error' ? <AlertCircle /> : <CheckCircle />}
            {toast.message}
          </ToastBar>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

// ─── Banner Card Item (extracted for clarity) ─────────────────────────────────

const BannerCardItem = ({ banner, onToggle, onEdit, onDelete, fmtDate, isAtCap, vi }) => (
  <BannerCard $active={banner.isActive}>
    <BannerImageWrap>
      {banner.imageUrl
        ? <img src={banner.imageUrl} alt={banner.title} onError={e => { e.target.style.display = 'none'; }} />
        : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            <ImageIcon size={36} />
          </div>
        )
      }

      {banner.isActive && (
        <ActiveBadge><CheckCircle /> {vi ? 'Đang chạy' : 'Live'}</ActiveBadge>
      )}

      <BannerActions>
        <ActionBtn $edit onClick={e => { e.stopPropagation(); onEdit(banner); }} title={vi ? 'Chỉnh sửa' : 'Edit'}>
          <Edit3 />
        </ActionBtn>
        <ActionBtn $danger onClick={e => { e.stopPropagation(); onDelete(banner); }} title={vi ? 'Xóa' : 'Delete'}>
          <Trash2 />
        </ActionBtn>
      </BannerActions>
    </BannerImageWrap>

    <BannerCardBody>
      <BannerTitle title={banner.title}>{banner.title || (vi ? '(Không có tiêu đề)' : '(No title)')}</BannerTitle>

      {banner.linkUrl && (
        <BannerMeta>
          <Globe />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {banner.linkUrl}
          </span>
        </BannerMeta>
      )}

      {banner.targetRegions && banner.targetRegions.length > 0 && (
        <BannerMeta>
          <MapPin />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {banner.targetRegions.slice(0, 3).join(', ')}
            {banner.targetRegions.length > 3 && ` +${banner.targetRegions.length - 3}`}
          </span>
        </BannerMeta>
      )}

      <BannerFooter>
        <ToggleButton
          $active={banner.isActive}
          disabled={!banner.isActive && isAtCap}
          onClick={() => onToggle(banner)}
          title={
            !banner.isActive && isAtCap
              ? (vi ? `Đã đủ ${MAX_ACTIVE_BANNERS} banner chạy` : `${MAX_ACTIVE_BANNERS} banners already active`)
              : undefined
          }
        >
          {banner.isActive ? <ToggleRight /> : <ToggleLeft />}
          {banner.isActive ? (vi ? 'Đang chạy' : 'Active') : (vi ? 'Đã tắt' : 'Off')}
        </ToggleButton>

        <DateChip>
          <Calendar />
          {fmtDate(banner.createdAt)}
        </DateChip>
      </BannerFooter>
    </BannerCardBody>
  </BannerCard>
);

export default BannersManagement;
