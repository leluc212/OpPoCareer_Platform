import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CardWrapper = styled(motion.div)`
  background: linear-gradient(135deg, ${props => props.$color || props.theme.colors.primary}08 0%, ${props => props.$color || props.theme.colors.primary}03 100%);
  border-radius: 16px;
  padding: 20px 24px;
  border: 1.5px solid ${props => props.$color || props.theme.colors.primary}20;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 20px;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${props => props.$color || props.theme.colors.primary};
    transition: width 0.3s ease;
  }
  
  &:hover {
    transform: translateX(4px);
    box-shadow: 0 8px 24px ${props => props.$color ? `${props.$color}25` : 'rgba(0, 0, 0, 0.1)'};
    border-color: ${props => props.$color || props.theme.colors.primary}40;
    
    &::before {
      width: 6px;
    }
  }
`;

const IconWrapper = styled(motion.div)`
  width: 56px;
  height: 56px;
  min-width: 56px;
  border-radius: 14px;
  background: ${props => props.$color || props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 16px ${props => props.$color ? `${props.$color}40` : `${props.theme.colors.primary}40`};
  transition: all 0.3s ease;
  
  svg {
    width: 26px;
    height: 26px;
  }
  
  ${CardWrapper}:hover & {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 6px 20px ${props => props.$color ? `${props.$color}50` : `${props.theme.colors.primary}50`};
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CardTitle = styled.h3`
  font-size: 12px;
  font-weight: 700;
  color: ${props => props.theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0;
`;

const ValueRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
`;

const CardValue = styled(motion.div)`
  font-size: 32px;
  font-weight: 900;
  color: ${props => props.theme.colors.text};
  line-height: 1;
  letter-spacing: -0.5px;
`;

const ChangeIndicator = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${props => props.$positive ? props.theme.colors.success : props.theme.colors.error};
  font-weight: 700;
  font-size: 13px;
  padding: 4px 10px;
  background: ${props => props.$positive ? `${props.theme.colors.success}12` : `${props.theme.colors.error}12`};
  border-radius: 20px;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const ChangeText = styled.span`
  color: ${props => props.theme.colors.textLight};
  font-size: 12px;
  font-weight: 500;
`;

const StatsCard = ({ title, value, change, changeText, icon: Icon, color, positive = true, onClick }) => {
  return (
    <CardWrapper
      $color={color}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {Icon && (
        <IconWrapper 
          $color={color}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.3 }}
        >
          <Icon />
        </IconWrapper>
      )}
      
      <ContentWrapper>
        <CardTitle>{title}</CardTitle>
        
        <ValueRow>
          <CardValue
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {value}
          </CardValue>
          
          {change && (
            <ChangeIndicator 
              $positive={positive}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {positive ? <TrendingUp /> : <TrendingDown />}
              <span>{change}</span>
            </ChangeIndicator>
          )}
        </ValueRow>
        
        {changeText && (
          <ChangeText>{changeText}</ChangeText>
        )}
      </ContentWrapper>
    </CardWrapper>
  );
};

export default StatsCard;
