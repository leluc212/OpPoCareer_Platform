import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { X } from 'lucide-react';

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(5, 15, 40, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const Card = styled(motion.div)`
  background: #fff;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
`;

const Header = styled.div`
  background: linear-gradient(150deg, #1e3a8a 0%, #2563eb 100%);
  padding: 40px 36px 34px;
  text-align: center;
  color: #fff;
  position: relative;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s;

  &:hover {
    background: rgba(255, 255, 255, 0.28);
  }
`;

const IconRing = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 26px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.4px;
  margin: 0 0 10px;
`;

const Sub = styled.p`
  font-size: 14px;
  line-height: 1.65;
  opacity: 0.85;
  margin: 0;
  max-width: 340px;
  margin-inline: auto;
`;

const Body = styled.div`
  padding: 24px 28px 28px;
`;

const BenefitList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
`;

const BenefitRow = styled.div`
  padding: 14px 16px;
  background: #f0f6ff;
  border-radius: 12px;
  border-left: 3px solid #2563eb;

  h4 {
    font-size: 14px;
    font-weight: 700;
    color: #1e3a8a;
    margin: 0 0 3px;
  }

  p {
    font-size: 13px;
    color: #475569;
    margin: 0;
    line-height: 1.55;
  }
`;

const BenefitNum = styled.div`
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BtnSkip = styled.button`
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  color: #94a3b8;
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s;

  &:hover {
    color: #475569;
  }
`;

const BtnPrimary = styled(motion.button)`
  flex: 1;
  padding: 13px 20px;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 6px 24px rgba(37, 99, 235, 0.42);
  }
`;

const BENEFITS_VI = [
  {
    title: 'Tăng độ hiển thị',
    desc: 'Giúp doanh nghiệp của bạn nổi bật hơn trên trang tìm kiếm của ứng viên.',
  },
  {
    title: 'Tuyển dụng hiệu quả',
    desc: 'Thu hút hồ sơ chất lượng nhờ thông tin và logo thương hiệu rõ ràng.',
  },
  {
    title: 'Xây dựng uy tín',
    desc: 'Xác minh danh tính giúp ứng viên an tâm ứng tuyển.',
  },
];

const BENEFITS_EN = [
  {
    title: 'Increase Visibility',
    desc: 'Help your business stand out on candidate search pages.',
  },
  {
    title: 'Recruit Effectively',
    desc: 'Attract quality applications with clear brand info and logo.',
  },
  {
    title: 'Build Credibility',
    desc: 'Identity verification helps candidates apply with confidence.',
  },
];

const CompanyProfileSetupModal = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isVi = language === 'vi';
  const benefits = isVi ? BENEFITS_VI : BENEFITS_EN;

  const handleSetupProfile = () => {
    onClose();
    navigate('/employer/profile');
  };

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
          <Card
            initial={{ opacity: 0, scale: 0.9, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Header>
              <CloseBtn onClick={onClose}><X size={15} /></CloseBtn>
              <IconRing>🏢</IconRing>
              <Title>{isVi ? 'LẬP HỒ SƠ CÔNG TY' : 'SET UP COMPANY PROFILE'}</Title>
              <Sub>
                {isVi
                  ? 'Hồ sơ hoàn thiện giúp tăng 80% cơ hội thu hút nhân tài và định vị thương hiệu tuyển dụng.'
                  : 'A complete profile boosts talent attraction by 80% and strengthens your employer brand.'}
              </Sub>
            </Header>

            <Body>
              <BenefitList>
                {benefits.map((b, i) => (
                  <BenefitRow key={i}>
                    <h4>{b.title}</h4>
                    <p>{b.desc}</p>
                  </BenefitRow>
                ))}
              </BenefitList>

              <Actions>
                <BtnSkip onClick={onClose}>
                  {isVi ? 'Bỏ qua lúc này' : 'Skip for now'}
                </BtnSkip>
                <BtnPrimary
                  onClick={handleSetupProfile}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isVi ? 'Hoàn thiện ngay' : 'Complete now'}
                </BtnPrimary>
              </Actions>
            </Body>
          </Card>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default CompanyProfileSetupModal;
