import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Eye, Trash2, Plus } from 'lucide-react';
import { uploadCV, getCVInfo, deleteCV } from '../services/cvUploadService';
import { useAuth } from '../context/AuthContext';
import { fetchAuthSession } from 'aws-amplify/auth';
import DeleteConfirmModal from './DeleteConfirmModal';
import { useLanguage } from '../context/LanguageContext';

const CVUploadContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
`;

const CreateCVLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #eff6ff;
  color: #1a62ff;
  border: 1px solid #1a62ff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #1a62ff;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(26, 98, 255, 0.15);
  }
`;

const UploadArea = styled.div`
  border: 2px dashed ${props => props.$isDragging ? '#3b82f6' : props.$isFull ? '#e2e8f0' : '#e2e8f0'};
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  background: ${props => props.$isDragging ? '#eff6ff' : props.$isFull ? '#f8fafc' : '#f8fafc'};
  cursor: pointer;
  transition: all 0.3s;
  opacity: ${props => props.$isFull ? 0.8 : 1};

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
    opacity: 1;
  }
`;

const UploadIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`;

const UploadText = styled.p`
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
`;

const UploadHint = styled.p`
  font-size: 12px;
  color: #94a3b8;
`;

const FileInput = styled.input`
  display: none;
`;

const CVPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s;
  
  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const FileIcon = styled.div`
  width: 52px;
  height: 52px;
  background: #3b82f6;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FileDate = styled.div`
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const IconButton = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid ${props => props.$variant === 'danger' ? '#fecaca' : '#e2e8f0'};
  background: ${props => props.$variant === 'danger' ? '#fef2f2' : '#f8fafc'};
  color: ${props => props.$variant === 'danger' ? '#dc2626' : '#475569'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 16px;

  &:hover {
    background: ${props => props.$variant === 'danger' ? '#fee2e2' : '#f1f5f9'};
    border-color: ${props => props.$variant === 'danger' ? '#fca5a5' : '#cbd5e1'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 12px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #3b82f6;
  width: ${props => props.progress}%;
  transition: width 0.3s;
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 12px;
`;

const SuccessMessage = styled.div`
  background: #d1fae5;
  color: #059669;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 12px;
`;

const CVUpload = () => {
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  const [userId, setUserId] = useState(null);
  const [cvList, setCvList] = useState([]); // Thay đổi từ cvInfo sang cvList (array)
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cvToDelete, setCvToDelete] = useState(null); // CV đang chọn để xóa
  const [loadingUserId, setLoadingUserId] = useState(true);
  const fileInputRef = React.useRef(null);

  const MAX_CV_COUNT = 3; // Giới hạn tối đa 3 CV

  // Get userId directly from Cognito token
  useEffect(() => {
    const getUserId = async () => {
      try {
        console.log('🔍 [CVUpload] Getting userId from Cognito...');
        const session = await fetchAuthSession();
        const userIdFromToken = session.tokens?.idToken?.payload?.sub;

        if (userIdFromToken) {
          console.log('✅ [CVUpload] UserId from Cognito:', userIdFromToken);
          setUserId(userIdFromToken);
        } else {
          console.warn('⚠️ [CVUpload] No userId in Cognito token');
        }
      } catch (error) {
        console.error('❌ [CVUpload] Error getting userId:', error);
      } finally {
        setLoadingUserId(false);
      }
    };

    if (!isLoading) {
      getUserId();
    }
  }, [isLoading]);

  const loadCVInfo = async () => {
    try {
      console.log('🔍 [CVUpload] loadCVInfo - userId:', userId);
      if (!userId) {
        console.warn('⚠️ [CVUpload] Cannot load CV info - no userId');
        return;
      }

      const data = await getCVInfo(userId);
      console.log('✅ [CVUpload] CV info loaded:', data);

      // Set CV list from API response
      if (data && data.cvList) {
        setCvList(data.cvList);
      } else {
        setCvList([]);
      }
    } catch (error) {
      console.error('❌ [CVUpload] Error loading CV info:', error);
      setCvList([]);
    }
  };

  useEffect(() => {
    if (userId) {
      console.log('✅ [CVUpload] UserId available, loading CV info...');
      loadCVInfo();
    }
  }, [userId]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setError('');
    setSuccess('');

    // Kiểm tra giới hạn số lượng CV
    if (cvList.length >= MAX_CV_COUNT) {
      setError(language === 'vi'
        ? `Bạn chỉ có thể tải lên tối đa ${MAX_CV_COUNT} CV. Vui lòng xóa CV cũ trước khi tải lên CV mới.`
        : `You can only upload a maximum of ${MAX_CV_COUNT} CVs. Please delete an old CV before uploading a new one.`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      console.log('📤 [CVUpload] Starting upload...');
      console.log('📤 [CVUpload] User ID:', userId);
      console.log('📤 [CVUpload] File:', file.name, file.type, file.size);

      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadCV(userId, file);

      console.log('✅ [CVUpload] Upload result:', result);

      clearInterval(progressInterval);
      setProgress(100);

      // Reload CV list to get updated data
      await loadCVInfo();

      setSuccess(language === 'vi' ? 'Upload CV thành công!' : 'CV uploaded successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('❌ [CVUpload] Upload error:', error);
      setError(error.message || (language === 'vi' ? 'Upload thất bại. Vui lòng thử lại.' : 'Upload failed. Please try again.'));
      setTimeout(() => setError(''), 2000);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setError('');

    try {
      if (!cvToDelete) return;

      // Log the full CV object for debugging
      console.log('🗑️ [CVUpload] CV to delete object:', cvToDelete);

      // Handle cases where the ID property might be named differently
      const cvId = cvToDelete.id || cvToDelete.cvId;
      console.log('🗑️ [CVUpload] Attempting to delete CV - userId:', userId, 'cvId:', cvId);

      // Delete specific CV by ID
      await deleteCV(userId, cvId);

      // Reload CV list
      await loadCVInfo();
      setCvToDelete(null);

      setSuccess(language === 'vi' ? 'Đã xóa CV thành công!' : 'CV deleted successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('❌ [CVUpload] Delete catch error:', error);
      setError(error.message || (language === 'vi' ? 'Xóa CV thất bại. Vui lòng thử lại.' : 'Failed to delete CV. Please try again.'));
      setTimeout(() => setError(''), 2000);
    }
  };

  const handleView = async (cv) => {
    try {
      setError('');

      // Mở CV trực tiếp bằng URL hiện có
      console.log('✅ [CVUpload] Opening CV in new tab...');
      console.log('CV URL:', cv.cvUrl);

      if (!cv.cvUrl) {
        throw new Error(language === 'vi' ? 'Không tìm thấy URL của CV.' : 'CV URL not found.');
      }

      const newWindow = window.open(cv.cvUrl, '_blank');

      // Fallback nếu popup bị block
      if (!newWindow) {
        setError(language === 'vi'
          ? 'Popup bị chặn. Vui lòng cho phép popup hoặc thử lại.'
          : 'Popup blocked. Please allow popups or try again.');
      }

    } catch (error) {
      console.error('❌ [CVUpload] Error viewing CV:', error);
      setError(error.message || (language === 'vi' ? 'Không thể mở CV. Vui lòng thử lại.' : 'Cannot open CV. Please try again.'));
    }
  };

  const openDeleteModal = (cv) => {
    setCvToDelete(cv);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <CVUploadContainer>
        <HeaderRow>
          <Title>
            📄 {language === 'vi' ? 'CV / Hồ Sơ' : 'CV / Resume'} ({cvList.length}/{MAX_CV_COUNT})
          </Title>
          <CreateCVLink to="/candidate/cv-templates">
            <Plus size={14} />
            {language === 'vi' ? 'Tạo CV theo style' : 'Create Styled CV'}
          </CreateCVLink>
        </HeaderRow>

        {loadingUserId ? (
          <UploadArea>
            <UploadIcon>⏳</UploadIcon>
            <UploadText>{language === 'vi' ? 'Đang tải thông tin người dùng...' : 'Loading user information...'}</UploadText>
          </UploadArea>
        ) : !userId ? (
          <UploadArea>
            <UploadIcon>⚠️</UploadIcon>
            <UploadText style={{ color: '#dc2626' }}>
              {language === 'vi'
                ? 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.'
                : 'You are not logged in. Please log in to continue.'}
            </UploadText>
          </UploadArea>
        ) : (
          <>
            {/* Hiển thị danh sách CV */}
            {cvList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {cvList.map((cv, index) => (
                  <CVPreview key={cv.id}>
                    <FileIcon>📄</FileIcon>
                    <FileInfo>
                      <FileName>{cv.cvFileName}</FileName>
                      <FileDate>{language === 'vi' ? 'Tải lên:' : 'Uploaded:'} {formatDate(cv.cvUploadDate)}</FileDate>
                    </FileInfo>
                    <ButtonGroup>
                      <IconButton onClick={() => handleView(cv)} title={language === 'vi' ? 'Xem CV' : 'View CV'}>
                        <Eye size={18} />
                      </IconButton>
                      <IconButton
                        $variant="danger"
                        onClick={() => openDeleteModal(cv)}
                        title={language === 'vi' ? 'Xóa CV' : 'Delete CV'}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </ButtonGroup>
                  </CVPreview>
                ))}
              </div>
            )}

            {/* Nút upload - Chỉ hiển thị khi chưa đủ 3 CV */}
            {cvList.length < MAX_CV_COUNT && (
              <UploadArea
                $isDragging={isDragging}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon>📁</UploadIcon>
                <UploadText>
                  {uploading
                    ? (language === 'vi' ? 'Đang tải lên...' : 'Uploading...')
                    : (language === 'vi' ? 'Kéo thả file CV vào đây hoặc click để chọn' : 'Drag and drop your CV here or click to select')}
                </UploadText>
                <UploadHint>
                  {language === 'vi'
                    ? `Hỗ trợ: PDF, DOC, DOCX (Tối đa 5MB) • Còn lại: ${MAX_CV_COUNT - cvList.length} CV`
                    : `Supported: PDF, DOC, DOCX (Max 5MB) • Remaining: ${MAX_CV_COUNT - cvList.length} CV`}
                </UploadHint>
              </UploadArea>
            )}

            <FileInput
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              disabled={uploading}
            />

            {uploading && (
              <ProgressBar>
                <ProgressFill progress={progress} />
              </ProgressBar>
            )}
          </>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </CVUploadContainer>

      {showDeleteModal && cvToDelete && (
        <DeleteConfirmModal
          title={language === 'vi' ? 'Xóa CV?' : 'Delete CV?'}
          message={language === 'vi'
            ? `Bạn có chắc muốn xóa "${cvToDelete.cvFileName}"? Hành động này không thể hoàn tác.`
            : `Are you sure you want to delete "${cvToDelete.cvFileName}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setCvToDelete(null);
          }}
        />
      )}
    </>
  );
};

export default CVUpload;
