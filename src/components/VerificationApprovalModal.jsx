import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, FileText, User, Calendar, Building2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import employerProfileService from '../services/employerProfileService';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const ModalContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  padding: 28px 32px;
  border-bottom: 2px solid #E8EFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border-radius: 20px 20px 0 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const IconBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e40af 0%, #1e40af 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 24px;
    height: 24px;
    color: white;
  }
`;

const HeaderText = styled.div`
  h2 {
    font-size: 22px;
    font-weight: 800;
    color: #1E293B;
    margin: 0 0 4px 0;
  }
  
  p {
    font-size: 14px;
    color: #64748B;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: white;
  border: 1.5px solid #E8EFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #FEE2E2;
    border-color: #FCA5A5;
    
    svg {
      color: #DC2626;
    }
  }
  
  svg {
    width: 20px;
    height: 20px;
    color: #64748B;
  }
`;

const ModalBody = styled.div`
  padding: 32px;
`;

const Section = styled.div`
  margin-bottom: 28px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1E293B;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 18px;
    height: 18px;
    color: #1e40af;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  padding: 16px;
  background: #F8FAFC;
  border: 1.5px solid #E8EFFF;
  border-radius: 12px;
  
  .label {
    font-size: 12px;
    font-weight: 600;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  
  .value {
    font-size: 15px;
    font-weight: 600;
    color: #1E293B;
    word-break: break-word;
  }
`;

const DocumentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const DocumentCard = styled.div`
  padding: 16px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #DBEAFE;
    border-color: #93C5FD;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.15);
  }
  
  .doc-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    svg {
      width: 20px;
      height: 20px;
      color: #1e40af;
    }
  }
  
  .doc-info {
    flex: 1;
    min-width: 0;
    
    .doc-name {
      font-size: 14px;
      font-weight: 600;
      color: #1E293B;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .doc-date {
      font-size: 12px;
      color: #64748B;
    }
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid #E8EFFF;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: #94A3B8;
  }
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
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
    width: 14px;
    height: 14px;
  }
`;

const ModalFooter = styled.div`
  padding: 24px 32px;
  border-top: 2px solid #E8EFFF;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: #F8FAFC;
  border-radius: 0 0 20px 20px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1.5px solid;
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  ${props => {
    if (props.$variant === 'approve') {
      return `
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        color: white;
        border-color: #10B981;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        
        &:hover {
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
          transform: translateY(-2px);
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
      `;
    } else if (props.$variant === 'reject') {
      return `
        background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
        color: white;
        border-color: #EF4444;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
        
        &:hover {
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35);
          transform: translateY(-2px);
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
      `;
    } else {
      return `
        background: white;
        color: #64748B;
        border-color: #E8EFFF;
        
        &:hover {
          background: #F8FAFC;
          border-color: #BFDBFE;
        }
      `;
    }
  }}
`;

const VerificationApprovalModal = ({ 
  isOpen, 
  onClose, 
  verificationData, 
  employerProfile,
  onApprove, 
  onReject 
}) => {
  const { language } = useLanguage();
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove({ notes });
      onClose();
    } catch (error) {
      console.error('Error approving:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      alert(language === 'vi' ? 'Vui lòng nhập lý do từ chối' : 'Please enter rejection reason');
      return;
    }
    
    setIsProcessing(true);
    try {
      await onReject({ reason });
      onClose();
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDocument = async (doc) => {
    if (doc.fileData) {
      let dataUrl;
      if (typeof doc.fileData === 'string') {
        dataUrl = doc.fileData;
      } else if (typeof doc.fileData === 'object') {
        dataUrl = doc.fileData.data || doc.fileData.url || doc.fileData.fileData;
      }

      if (!dataUrl) {
        alert(language === 'vi' ? 'Không thể xem tài liệu này.' : 'Cannot view this document.');
        return;
      }

      try {
        if (dataUrl.startsWith('http')) {
          // S3 URL - need presigned URL
          const userId = employerProfile?.userId || employerProfile?.id;
          if (userId) {
            const viewUrl = await employerProfileService.getVerificationViewUrl(userId, dataUrl);
            window.open(viewUrl, '_blank');
          } else {
            window.open(dataUrl, '_blank');
          }
        } else if (dataUrl.startsWith('data:application/pdf')) {
          const base64 = dataUrl.split(',')[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const pdfBlob = new Blob([bytes], { type: 'application/pdf' });
          const pdfUrl = URL.createObjectURL(pdfBlob);
          window.open(pdfUrl, '_blank');
        } else {
          window.open(dataUrl, '_blank');
        }
      } catch (err) {
        console.error('Error opening document:', err);
        // Fallback: try opening directly
        window.open(dataUrl, '_blank');
      }
    }
  };

  if (!isOpen || !verificationData) return null;

  const documents = [];
  
  // Business License
  if (verificationData.step1?.businessLicense) {
    documents.push({
      id: 'business-license',
      name: language === 'vi' ? 'Giấy phép kinh doanh' : 'Business License',
      uploadDate: verificationData.submittedAt ? new Date(verificationData.submittedAt).toLocaleDateString('vi-VN') : 'N/A',
      fileData: verificationData.step1.businessLicense
    });
  }
  
  // ID Front
  if (verificationData.step3?.idFrontImage) {
    documents.push({
      id: 'id-front',
      name: language === 'vi' ? 'CCCD/CMND mặt trước' : 'ID Card (Front)',
      uploadDate: verificationData.submittedAt ? new Date(verificationData.submittedAt).toLocaleDateString('vi-VN') : 'N/A',
      fileData: verificationData.step3.idFrontImage
    });
  }
  
  // ID Back
  if (verificationData.step3?.idBackImage) {
    documents.push({
      id: 'id-back',
      name: language === 'vi' ? 'CCCD/CMND mặt sau' : 'ID Card (Back)',
      uploadDate: verificationData.submittedAt ? new Date(verificationData.submittedAt).toLocaleDateString('vi-VN') : 'N/A',
      fileData: verificationData.step3.idBackImage
    });
  }
  
  // Authorization Letter
  if (verificationData.step3?.authorizationLetter) {
    documents.push({
      id: 'authorization-letter',
      name: language === 'vi' ? 'Giấy ủy quyền' : 'Authorization Letter',
      uploadDate: verificationData.submittedAt ? new Date(verificationData.submittedAt).toLocaleDateString('vi-VN') : 'N/A',
      fileData: verificationData.step3.authorizationLetter
    });
  }

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <ModalContainer
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHeader>
            <HeaderLeft>
              <IconBox>
                <Building2 />
              </IconBox>
              <HeaderText>
                <h2>{language === 'vi' ? 'Xác Thực Hồ Sơ Công Ty' : 'Company Verification'}</h2>
                <p>{employerProfile?.companyName || (language === 'vi' ? 'Đang xem xét' : 'Under Review')}</p>
              </HeaderText>
            </HeaderLeft>
            <CloseButton onClick={onClose}>
              <X />
            </CloseButton>
          </ModalHeader>

          <ModalBody>
            {/* Company Info */}
            <Section>
              <SectionTitle>
                <Building2 />
                {language === 'vi' ? 'Thông Tin Công Ty' : 'Company Information'}
              </SectionTitle>
              <InfoGrid>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Tên công ty' : 'Company Name'}</div>
                  <div className="value">{employerProfile?.companyName || 'N/A'}</div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Mã số thuế' : 'Tax Code'}</div>
                  <div className="value">{employerProfile?.taxCode || verificationData.step1?.taxCode || 'N/A'}</div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Số GPKD' : 'Business License'}</div>
                  <div className="value">{employerProfile?.businessLicense || verificationData.step1?.licenseNumber || 'N/A'}</div>
                </InfoItem>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Lĩnh vực' : 'Industry'}</div>
                  <div className="value">{employerProfile?.industry || 'N/A'}</div>
                </InfoItem>
              </InfoGrid>
            </Section>

            {/* Representative Info */}
            {verificationData.step3 && (
              <Section>
                <SectionTitle>
                  <User />
                  {language === 'vi' ? 'Người Đại Diện' : 'Representative'}
                </SectionTitle>
                <InfoGrid>
                  <InfoItem>
                    <div className="label">{language === 'vi' ? 'Họ và tên' : 'Full Name'}</div>
                    <div className="value">{verificationData.step3.representativeName || 'N/A'}</div>
                  </InfoItem>
                  <InfoItem>
                    <div className="label">{language === 'vi' ? 'Số CCCD/CMND' : 'ID Number'}</div>
                    <div className="value">{verificationData.step3.idNumber || 'N/A'}</div>
                  </InfoItem>
                  <InfoItem>
                    <div className="label">{language === 'vi' ? 'Chức vụ' : 'Position'}</div>
                    <div className="value">{verificationData.step3.position || 'N/A'}</div>
                  </InfoItem>
                  <InfoItem>
                    <div className="label">{language === 'vi' ? 'Ngày gửi' : 'Submitted Date'}</div>
                    <div className="value">
                      {verificationData.submittedAt 
                        ? new Date(verificationData.submittedAt).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </div>
                  </InfoItem>
                </InfoGrid>
              </Section>
            )}

            {/* Documents */}
            <Section>
              <SectionTitle>
                <FileText />
                {language === 'vi' ? 'Tài Liệu Xác Thực' : 'Verification Documents'}
              </SectionTitle>
              <DocumentsGrid>
                {documents.map((doc) => (
                  <DocumentCard key={doc.id} onClick={() => handleViewDocument(doc)}>
                    <div className="doc-icon">
                      <FileText />
                    </div>
                    <div className="doc-info">
                      <div className="doc-name">{doc.name}</div>
                      <div className="doc-date">{doc.uploadDate}</div>
                    </div>
                  </DocumentCard>
                ))}
              </DocumentsGrid>
            </Section>

            {/* Notes/Reason */}
            <Section>
              <SectionTitle>
                <AlertCircle />
                {language === 'vi' ? 'Ghi Chú / Lý Do' : 'Notes / Reason'}
              </SectionTitle>
              <TextArea
                placeholder={language === 'vi' 
                  ? 'Nhập ghi chú phê duyệt hoặc lý do từ chối...' 
                  : 'Enter approval notes or rejection reason...'}
                value={notes || reason}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setReason(e.target.value);
                }}
              />
            </Section>
          </ModalBody>

          <ModalFooter>
            <Button onClick={onClose}>
              <X />
              {language === 'vi' ? 'Đóng' : 'Close'}
            </Button>
            <Button 
              $variant="reject" 
              onClick={handleReject}
              disabled={isProcessing}
            >
              <X />
              {isProcessing ? (language === 'vi' ? 'Đang xử lý...' : 'Processing...') : (language === 'vi' ? 'Từ Chối' : 'Reject')}
            </Button>
            <Button 
              $variant="approve" 
              onClick={handleApprove}
              disabled={isProcessing}
            >
              <Check />
              {isProcessing ? (language === 'vi' ? 'Đang xử lý...' : 'Processing...') : (language === 'vi' ? 'Phê Duyệt' : 'Approve')}
            </Button>
          </ModalFooter>
        </ModalContainer>
      </Overlay>
    </AnimatePresence>
  );
};

export default VerificationApprovalModal;
