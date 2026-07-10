import React, { createContext, useContext, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(10, 18, 40, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 20px;
`;

const ModalBox = styled(motion.div)`
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  box-shadow:
    0 24px 48px -8px rgba(14, 57, 149, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.04);
`;

const IconBand = styled.div`
  width: 100%;
  padding: 32px 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
`;

const IconCircle = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;

  background: ${({ $type }) =>
    $type === 'success' ? '#D1FAE5' :
    $type === 'error'   ? '#FEE2E2' :
    $type === 'warning' ? '#FEF3C7' :
                          '#EFF6FF'};

  svg {
    width: 30px;
    height: 30px;
    color: ${({ $type }) =>
      $type === 'success' ? '#059669' :
      $type === 'error'   ? '#DC2626' :
      $type === 'warning' ? '#D97706' :
                            '#1e40af'};
  }
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
  margin: 0 0 8px;
  line-height: 1.3;
`;

const Message = styled.p`
  font-size: 14.5px;
  color: #475569;
  text-align: center;
  line-height: 1.65;
  margin: 0;
  padding: 0 4px;
  white-space: pre-line;
`;

const Footer = styled.div`
  padding: 16px 24px 24px;
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const OkButton = styled(motion.button)`
  min-width: 120px;
  padding: 11px 28px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: box-shadow 0.2s;

  background: ${({ $type }) =>
    $type === 'success' ? 'linear-gradient(135deg, #059669, #10b981)' :
    $type === 'error'   ? 'linear-gradient(135deg, #dc2626, #ef4444)' :
    $type === 'warning' ? 'linear-gradient(135deg, #d97706, #f59e0b)' :
                          'linear-gradient(135deg, #1e40af, #2563eb)'};

  color: #ffffff;
  box-shadow: ${({ $type }) =>
    $type === 'success' ? '0 4px 14px rgba(5, 150, 105, 0.35)' :
    $type === 'error'   ? '0 4px 14px rgba(220, 38, 38, 0.35)' :
    $type === 'warning' ? '0 4px 14px rgba(217, 119, 6, 0.35)' :
                          '0 4px 14px rgba(30, 64, 175, 0.35)'};

  &:hover {
    box-shadow: ${({ $type }) =>
      $type === 'success' ? '0 6px 20px rgba(5, 150, 105, 0.5)' :
      $type === 'error'   ? '0 6px 20px rgba(220, 38, 38, 0.5)' :
      $type === 'warning' ? '0 6px 20px rgba(217, 119, 6, 0.5)' :
                            '0 6px 20px rgba(30, 64, 175, 0.5)'};
  }
`;

const CancelButton = styled.button`
  min-width: 100px;
  padding: 11px 24px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: #f8fafc;
  color: #475569;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1e293b;
  }
`;

const typeIcons = {
  success: <CheckCircle />,
  error:   <AlertCircle />,
  warning: <AlertTriangle />,
  info:    <Info />,
};

const typeTitles = {
  success: { vi: 'Thành công', en: 'Success' },
  error:   { vi: 'Lỗi',       en: 'Error'   },
  warning: { vi: 'Cảnh báo',  en: 'Warning' },
  info:    { vi: 'Thông báo', en: 'Notice'  },
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);

  const show = useCallback(({ message, type = 'info', title, okText, cancelText, onOk, onCancel }) => {
    return new Promise((resolve) => {
      setQueue(prev => [...prev, {
        id: Date.now() + Math.random(),
        message,
        type,
        title,
        okText,
        cancelText,
        onOk,
        onCancel,
        resolve,
      }]);
    });
  }, []);

  const close = useCallback((id, result) => {
    setQueue(prev => {
      const item = prev.find(q => q.id === id);
      if (item) {
        item.resolve(result);
        if (result === true && item.onOk) item.onOk();
        if (result === false && item.onCancel) item.onCancel();
      }
      return prev.filter(q => q.id !== id);
    });
  }, []);

  const current = queue[0] || null;

  return (
    <AlertContext.Provider value={{ show }}>
      {children}
      <AnimatePresence>
        {current && (
          <Overlay
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <ModalBox
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340, mass: 0.7 }}
              onClick={e => e.stopPropagation()}
            >
              <IconBand>
                <IconCircle $type={current.type}>
                  {typeIcons[current.type] || typeIcons.info}
                </IconCircle>
                <Title>
                  {current.title || typeTitles[current.type]?.vi || 'Thông báo'}
                </Title>
                <Message>{current.message}</Message>
              </IconBand>

              <Footer>
                {current.cancelText && (
                  <CancelButton onClick={() => close(current.id, false)}>
                    {current.cancelText}
                  </CancelButton>
                )}
                <OkButton
                  $type={current.type}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => close(current.id, true)}
                >
                  {current.okText || 'OK'}
                </OkButton>
              </Footer>
            </ModalBox>
          </Overlay>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used inside AlertProvider');

  const { show } = ctx;

  return {
    /** Simple info alert — replaces alert() */
    alert: (message, options = {}) =>
      show({ message, type: 'info', ...options }),

    success: (message, options = {}) =>
      show({ message, type: 'success', ...options }),

    error: (message, options = {}) =>
      show({ message, type: 'error', ...options }),

    warning: (message, options = {}) =>
      show({ message, type: 'warning', ...options }),

    /** Confirmation dialog — replaces confirm() */
    confirm: (message, options = {}) =>
      show({
        message,
        type: 'warning',
        okText: options.okText || 'Xác nhận',
        cancelText: options.cancelText || 'Hủy',
        ...options,
      }),
  };
};

export default AlertProvider;
