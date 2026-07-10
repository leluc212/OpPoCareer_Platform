import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 18, 40, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;
`;

const ModalContainer = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: 24px;
  width: 100%;
  max-width: ${props => props.$size === 'large' ? '1000px' : props.$size === 'xlarge' ? '1200px' : '560px'};
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 32px 64px -12px rgba(14, 57, 149, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 8px 24px rgba(0, 0, 0, 0.18);
  margin: auto;
  position: relative;
  z-index: 10000;
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const CloseButton = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: ${props => props.theme.colors.bgDark};
  color: ${props => props.theme.colors.textLight};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 1.5px solid ${props => props.theme.colors.border};
  
  &:hover {
    background: #FEE2E2;
    color: #EF4444;
    border-color: #FCA5A5;
    transform: rotate(90deg) scale(1.1);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const ModalBody = styled.div`
  padding: ${props => props.$noPadding ? '0' : '24px'};
  overflow-y: auto;
  flex: 1;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.primary}60;
  }
`;

const ModalFooter = styled.div`
  padding: 20px 24px;
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const Modal = ({ isOpen, onClose, title, children, footer, size = 'medium', noPadding = false }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <ModalContainer
            $size={size}
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <ModalHeader>
                <ModalTitle>{title}</ModalTitle>
                <CloseButton onClick={onClose}>
                  <X />
                </CloseButton>
              </ModalHeader>
            )}
            
            <ModalBody $noPadding={noPadding}>{children}</ModalBody>
            
            {footer && <ModalFooter>{footer}</ModalFooter>}
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default Modal;
