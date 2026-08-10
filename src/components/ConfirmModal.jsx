import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, HelpCircle, CheckCircle, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const ModalContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 440px;
  width: 90%;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
  position: relative;
  border: 1px solid #f1f5f9;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: #475569;
  }
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  
  svg {
    width: 32px;
    height: 32px;
  }

  &.warning {
    background: #fffbeb;
    svg {
      color: #d97706;
    }
  }

  &.danger {
    background: #fef2f2;
    svg {
      color: #dc2626;
    }
  }

  &.info {
    background: #eff6ff;
    svg {
      color: #2563eb;
    }
  }

  &.success {
    background: #f0fdf4;
    svg {
      color: #16a34a;
    }
  }
`;

const Title = styled.h3`
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
`;

const Message = styled.p`
  font-size: 15px;
  color: #475569;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 28px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const ModalButton = styled(motion.button)`
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  
  &.cancel {
    background: #f1f5f9;
    color: #475569;
    
    &:hover {
      background: #e2e8f0;
    }
  }
  
  &.confirm-warning {
    background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
    color: white;
    box-shadow: 0 4px 14px rgba(217, 119, 6, 0.3);
    
    &:hover {
      box-shadow: 0 6px 20px rgba(217, 119, 6, 0.4);
    }
  }

  &.confirm-danger {
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
    color: white;
    box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
    
    &:hover {
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
    }
  }

  &.confirm-info {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: white;
    box-shadow: 0 4px 14px rgba(30, 64, 175, 0.3);
    
    &:hover {
      box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4);
    }
  }

  &.confirm-success {
    background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
    color: white;
    box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3);
    
    &:hover {
      box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none !important;
  }
`;

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  confirmText, 
  cancelText, 
  onConfirm, 
  onCancel, 
  type = 'warning', 
  isLoading = false,
  children
}) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle />;
      case 'success':
        return <CheckCircle />;
      case 'info':
        return <Info />;
      case 'warning':
      default:
        return <HelpCircle />;
    }
  };

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={isLoading ? null : onCancel}
      >
        <ModalContainer
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
        >
          {!isLoading && (
            <CloseButton onClick={onCancel}>
              <X size={18} />
            </CloseButton>
          )}
          
          <IconWrapper className={type}>
            {getIcon()}
          </IconWrapper>
          
          <Title>{title}</Title>
          <Message>{message}</Message>
          {children}
          
          <ButtonGroup>
            <ModalButton 
              className="cancel" 
              onClick={onCancel}
              disabled={isLoading}
              whileTap={{ scale: 0.97 }}
            >
              {cancelText || (language === 'vi' ? 'Hủy bỏ' : 'Cancel')}
            </ModalButton>
            <ModalButton 
              className={`confirm-${type}`} 
              onClick={onConfirm}
              disabled={isLoading}
              whileTap={{ scale: 0.97 }}
            >
              {confirmText || (language === 'vi' ? 'Xác nhận' : 'Confirm')}
            </ModalButton>
          </ButtonGroup>
        </ModalContainer>
      </Overlay>
    </AnimatePresence>
  );
};

export default ConfirmModal;
