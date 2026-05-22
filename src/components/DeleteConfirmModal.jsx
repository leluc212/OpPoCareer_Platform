import React from 'react';
import styled from 'styled-components';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  padding: 28px;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;

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

const IconWrapper = styled.div`
  width: 56px;
  height: 56px;
  background: #fef2f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  
  svg {
    color: #dc2626;
  }
`;

const Title = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
  margin-bottom: 12px;
`;

const Message = styled.p`
  font-size: 15px;
  color: #64748b;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 24px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled.button`
  flex: 1;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  &.cancel {
    background: #f1f5f9;
    color: #475569;
    
    &:hover {
      background: #e2e8f0;
    }
  }
  
  &.confirm {
    background: #dc2626;
    color: white;
    
    &:hover {
      background: #b91c1c;
    }
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const DeleteConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  const { language } = useLanguage();

  return (
    <Overlay onClick={onCancel}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <IconWrapper>
          <AlertTriangle size={28} />
        </IconWrapper>
        <Title>{title}</Title>
        <Message>{message}</Message>
        <ButtonGroup>
          <Button className="cancel" onClick={onCancel}>
            {language === 'vi' ? 'Hủy' : 'Cancel'}
          </Button>
          <Button className="confirm" onClick={onConfirm}>
            {language === 'vi' ? 'Xóa' : 'Delete'}
          </Button>
        </ButtonGroup>
      </Modal>
    </Overlay>
  );
};

export default DeleteConfirmModal;
