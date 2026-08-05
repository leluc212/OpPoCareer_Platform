import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContainer = styled(motion.div)`
  position: fixed;
  top: 24px;
  right: 24px;
  /* Always stay above modal overlays so errors are visible to the user. */
  z-index: 110000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;

  @media (max-width: 768px) {
    top: 16px;
    right: 16px;
    left: 16px;
  }
`;

const ToastItem = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 320px;
  max-width: 480px;
  pointer-events: auto;
  border-left: 4px solid ${props => {
    switch (props.$type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
      default: return '#6B7280';
    }
  }};

  @media (max-width: 768px) {
    min-width: auto;
    max-width: 100%;
  }
`;

const IconWrapper = styled.div`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => {
    switch (props.$type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
      default: return '#6B7280';
    }
  }};
`;

const Content = styled.div`
  flex: 1;
  
  .title {
    font-size: 14px;
    font-weight: 600;
    color: #1F2937;
    margin-bottom: 2px;
  }
  
  .message {
    font-size: 13px;
    color: #6B7280;
    line-height: 1.4;
  }
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #9CA3AF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: #F3F4F6;
    color: #6B7280;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const getIcon = (type) => {
  switch (type) {
    case 'success': return CheckCircle;
    case 'error': return XCircle;
    case 'warning': return AlertCircle;
    case 'info': return Info;
    default: return Info;
  }
};

const Toast = ({ toasts, removeToast }) => {
  return (
    <ToastContainer>
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = getIcon(toast.type);
          
          return (
            <ToastItem
              key={toast.id}
              $type={toast.type}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <IconWrapper $type={toast.type}>
                <Icon />
              </IconWrapper>
              <Content>
                {toast.title && <div className="title">{toast.title}</div>}
                <div className="message">{toast.message}</div>
              </Content>
              <CloseButton onClick={() => removeToast(toast.id)}>
                <X />
              </CloseButton>
            </ToastItem>
          );
        })}
      </AnimatePresence>
    </ToastContainer>
  );
};

export default Toast;
