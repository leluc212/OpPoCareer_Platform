import React, { useMemo, useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import {
  Search, MapPin, Briefcase, Clock, TrendingUp,
  ChevronDown, Building2, Bookmark, Eye, ArrowUpRight, Filter,
  X, SlidersHorizontal, Grid, List, Sparkles, Zap, Navigation, Target,
  Power, XCircle, AlertCircle, CheckCircle, RotateCw
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';
import DynamicTranslate from '../../components/DynamicTranslate';
import candidateProfileService from '../../services/candidateProfileService';
import jobPostService from '../../services/jobPostService';
import quickJobService from '../../services/quickJobService';
import { fetchAuthSession } from 'aws-amplify/auth';
import { s3Images } from '../../utils/s3Images';

// Animations
const fadeIn = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const shimmer = `
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
`;

const Container = styled.div`
  ${fadeIn}
  animation: fadeIn 0.6s ease;
`;

const HeroSection = styled(motion.div)`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, #1e40af 100%);
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 32px 40px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: pulse 8s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.2); opacity: 0.5; }
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
`;

const HeroTitle = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: white;
  margin-bottom: 6px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const HeroSubtitle = styled.p`
  font-size: 14px;
  color: rgba(255,255,255,0.9);
  margin-bottom: 24px;
  font-weight: 500;
`;

const SearchContainer = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 8px;
  display: flex;
  gap: 8px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  border: 1px solid ${props => props.theme.colors.border};
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchInput = styled.div`
  flex: ${props => props.$narrow ? '0 0 220px' : '2'};
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.theme.colors.bgDark};
  
  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.theme.colors.textLight};
  }
  
  input {
    flex: 1;
    border: none;
    background: none;
    outline: none;
    font-size: 15px;
    color: ${props => props.theme.colors.text};
    
    &::placeholder {
      color: ${props => props.theme.colors.textLight};
    }
  }
`;

const SearchButton = styled(motion.button)`
  padding: 12px 24px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.lg};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const QuickFilters = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
`;

const FilterChip = styled(motion.button)`
  padding: 6px 14px;
  background: ${props => props.$active ? props.theme.colors.bgLight : 'rgba(255,255,255,0.2)'};
  color: ${props => props.$active ? props.theme.colors.primary : 'white'};
  border: 1px solid ${props => props.$active ? props.theme.colors.bgLight : 'rgba(255,255,255,0.3)'};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: ${props => props.theme.colors.bgLight};
    color: ${props => props.theme.colors.primary};
    transform: translateY(-2px);
  }
`;

// Category Tabs
const CategoryTabs = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const CategoryTab = styled(motion.button)`
  flex: 1;
  padding: 16px 24px;
  background: ${props => props.$active
    ? `linear-gradient(135deg, ${props.theme.colors.primary}, ${props.theme.colors.secondary})`
    : props.theme.colors.bgLight};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  border: 2px solid ${props => props.$active ? 'transparent' : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.xl};
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: ${props => props.$active ? `0 8px 24px ${props.theme.colors.primary}30` : '0 2px 8px rgba(0,0,0,0.04)'};
  
  svg {
    width: 22px;
    height: 22px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px ${props => props.$active
    ? `${props.theme.colors.primary}40`
    : 'rgba(0,0,0,0.08)'};
    border-color: ${props => props.$active ? 'transparent' : props.theme.colors.primary};
  }
`;

const StatusCard = styled(motion.div)`
  background: ${props => props.$active
    ? 'rgba(16, 185, 129, 0.2)'
    : 'rgba(255, 255, 255, 0.15)'};
  border: 2px solid ${props => props.$active
    ? 'rgba(16, 185, 129, 0.5)'
    : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 12px;
  padding: 12px 24px;
  color: white;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  height: 48px;
  display: flex;
  align-items: center;
  
  .status-content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    width: 100%;
    
    @media (max-width: 768px) {
      flex-direction: column;
      text-align: center;
      gap: 10px;
    }
    
    .status-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      
      @media (max-width: 768px) {
        flex-direction: column;
        gap: 8px;
      }
      
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        
        svg {
          width: 16px;
          height: 16px;
        }
      }
      
      .status-label {
        font-size: 14px;
        font-weight: 600;
        opacity: 0.95;
      }
      
      .status-desc {
        display: none;
      }
    }
    
    .status-icon {
      display: none;
    }
  }
`;

const LocationButton = styled(motion.button)`
  padding: 12px 24px;
  background: ${props => props.$active
    ? 'rgba(16, 185, 129, 0.2)'
    : 'rgba(255, 255, 255, 0.15)'};
  border: 2px solid ${props => props.$active
    ? 'rgba(16, 185, 129, 0.5)'
    : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  height: 48px;
  white-space: nowrap;
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(59, 130, 246, 0.2);
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
`;

const ToggleButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 8px 16px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  font-weight: 600;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const ApplyModalWrap = styled.div`
  padding: 32px 28px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  background: #eff6ff;
  border-radius: 16px;

  .apply-emoji {
    font-size: 52px;
    line-height: 1;
  }

  h3 {
    font-size: 20px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin: 0;
    letter-spacing: -0.2px;
  }

  .apply-desc {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    line-height: 1.65;
    margin: 0;
    max-width: 340px;

    strong {
      color: ${props => props.theme.colors.text};
      font-weight: 700;
    }
  }

  .apply-info-card {
    width: 100%;
    background: ${props => props.theme.colors.bgDark};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 12px;
    overflow: hidden;
    text-align: left;

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 11px 16px;

      &:not(:last-child) {
        border-bottom: 1px solid ${props => props.theme.colors.border};
      }

      .info-label {
        font-size: 13px;
        color: ${props => props.theme.colors.textLight};
      }

      .info-value {
        font-size: 13.5px;
        font-weight: 700;
        color: ${props => props.theme.colors.text};
        text-align: right;
        max-width: 60%;

        &.salary { color: #10b981; }
      }
    }
  }

  .apply-buttons {
    width: 100%;
    display: flex;
    gap: 10px;
    margin-top: 4px;

    button {
      flex: 1;
      padding: 12px 20px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .btn-cancel {
      background: ${props => props.theme.colors.bgDark};
      color: ${props => props.theme.colors.textLight};
      border: 1.5px solid ${props => props.theme.colors.border};

      &:hover {
        background: ${props => props.theme.colors.border};
        color: ${props => props.theme.colors.text};
      }
    }

    .btn-confirm {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      box-shadow: 0 4px 14px rgba(59,130,246,0.35);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(59,130,246,0.45);
      }

      &:active { transform: translateY(0); }
    }
  }
`;

const CVSelectionSection = styled.div`
  width: 100%;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
  text-align: left;
`;

const CVSelectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CVOption = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.$selected ? '#eff6ff' : '#f8fafc'};
  border: 2px solid ${props => props.$selected ? '#3b82f6' : '#e2e8f0'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const CVRadio = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.$selected ? '#3b82f6' : '#cbd5e1'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #3b82f6;
    opacity: ${props => props.$selected ? 1 : 0};
    transition: opacity 0.2s;
  }
`;

const CVOptionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CVOptionName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CVOptionDate = styled.div`
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
`;

const NoCVMessage = styled.div`
  text-align: center;
  padding: 16px;
  background: #fef3c7;
  border: 2px solid #fbbf24;
  border-radius: 8px;
  color: #92400e;
  font-size: 13px;
  line-height: 1.5;
  
  a {
    color: #3b82f6;
    text-decoration: underline;
    font-weight: 600;
    
    &:hover {
      color: #1e40af;
    }
  }
`;

const ConfirmationContent = styled.div`
  padding: 20px;
  
  .icon-wrapper {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: ${props => props.$isActive
    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)'
    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid ${props => props.$isActive ? '#FEE2E2' : '#D1FAE5'};
    
    svg {
      width: 32px;
      height: 32px;
      color: ${props => props.$isActive ? '#EF4444' : '#10B981'};
    }
  }
  
  h3 {
    font-size: 20px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    text-align: center;
    margin-bottom: 10px;
    letter-spacing: -0.3px;
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    text-align: center;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  
  .button-group {
    display: flex;
    gap: 10px;
    
    button {
      flex: 1;
      padding: 11px 20px;
      border-radius: ${props => props.theme.borderRadius.md};
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      
      &.confirm {
        background: ${props => props.$isActive
    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
    : 'linear-gradient(135deg, #10B981 0%, #059669 100%)'};
        color: white;
        box-shadow: ${props => props.$isActive
    ? '0 3px 10px rgba(239, 68, 68, 0.25)'
    : '0 3px 10px rgba(16, 185, 129, 0.25)'};
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: ${props => props.$isActive
    ? '0 6px 16px rgba(239, 68, 68, 0.3)'
    : '0 6px 16px rgba(16, 185, 129, 0.3)'};
        }
      }
      
      &.cancel {
        background: ${props => props.theme.colors.bgDark};
        color: ${props => props.theme.colors.text};
        border: 1px solid ${props => props.theme.colors.border};
        
        &:hover {
          background: ${props => props.theme.colors.border};
        }
      }
      
      &:active {
        transform: translateY(0);
      }
    }
  }
`;

const MainLayout = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 28px;
  align-items: start;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const FilterSidebar = styled(motion.aside)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 20px;
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  position: sticky;
  top: 100px;
  align-self: flex-start;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  
  @media (max-width: 1024px) {
    position: static;
    max-height: none;
    overflow: visible;
    margin-bottom: 24px;
  }
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid ${props => props.theme.colors.border};
  
  h3 {
    font-size: 18px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    display: flex;
    align-items: center;
    gap: 10px;
    
    svg {
      width: 22px;
      height: 22px;
      color: ${props => props.theme.colors.primary};
    }
  }
`;

const ClearButton = styled.button`
  padding: 6px 12px;
  background: transparent;
  color: ${props => props.theme.colors.error};
  border: 1px solid ${props => props.theme.colors.error};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.error};
    color: white;
  }
`;

const FilterSection = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FilterTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  cursor: pointer;
  user-select: none;
  
  h4 {
    font-size: 15px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
  }
  
  svg {
    width: 18px;
    height: 18px;
    color: ${props => props.theme.colors.textLight};
    transition: transform 0.2s ease;
    transform: ${props => props.$expanded ? 'rotate(180deg)' : 'rotate(0)'};
  }
`;

const FilterOptions = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FilterOption = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.bgDark};
  }
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: ${props => props.theme.colors.primary};
  }
  
  span {
    font-size: 14px;
    color: ${props => props.theme.colors.text};
    font-weight: 500;
  }
  
  small {
    margin-left: auto;
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 600;
  }
`;

const MainContent = styled.div``;

const ContentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
`;

const ResultsInfo = styled.div`
  h2 {
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;
  }
`;

const ViewControls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SortSelect = styled.select`
  padding: 10px 16px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.theme.colors.bgLight};
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}15;
  }
`;

const ViewToggle = styled.div`
  display: flex;
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 4px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const ViewButton = styled.button`
  padding: 8px 12px;
  background: ${props => props.$active ? props.theme.colors.bgDark : 'transparent'};
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  
  svg {
    width: 18px;
    height: 18px;
    color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.textLight};
  }
  
  &:hover svg {
    color: ${props => props.theme.colors.primary};
  }
`;

const ReloadButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${props => props.theme.colors.bgLight};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;


// Job Cards
const JobsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const BoostBannerWrap = styled(motion.div)`
  position: relative;
  margin-bottom: 24px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  cursor: pointer;
  height: 320px;
  background: #1a1a1a;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover img {
    transform: scale(1.02);
  }
`;

const BannerDots = styled.div`
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
`;

const BannerDot = styled.button`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: ${props => props.$active ? '#fff' : 'rgba(255, 255, 255, 0.4)'};
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.7);
    width: ${props => props.$active ? '8px' : '12px'};
  }
  
  ${props => props.$active && `
    width: 20px;
    background: #fff;
  `}
`;

const BoostTag = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
  z-index: 2;
`;

const JobCardWrapper = styled(motion.div)`
  background: ${props => props.$highlighted ? props.theme.colors.primary + '08' : props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.$highlighted ? props.theme.colors.primary : props.theme.colors.border};
  padding: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: ${props => props.$highlighted ? `0 0 20px ${props.theme.colors.primary}30` : 'none'};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
    opacity: ${props => props.$highlighted ? 1 : 0};
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 12px 40px rgba(0,0,0,0.08);
    transform: translateY(-4px);
    
    &::before {
      opacity: 1;
    }
  }

  /* Pulse animation for highlight */
  ${props => props.$highlighted && `
    animation: highlightPulse 2s ease-in-out;
    background: ${props.theme.colors.primary}15;
    border-color: ${props.theme.colors.primary};
    box-shadow: 0 0 0 4px ${props.theme.colors.primary}20;
    z-index: 10;
  `}
`;



const JobCardHeader = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
`;

const CompanyLogo = styled.div`
  width: 44px;
  height: 44px;
  border-radius: ${props => props.theme.borderRadius.md};
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.secondary}15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  flex-shrink: 0;
  border: 2px solid ${props => props.theme.colors.border};
`;

const JobInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const JobTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const CompanyName = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
  margin-bottom: 5px;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const JobMeta = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const JobCardBody = styled.div`
  margin-bottom: 12px;
`;

const JobTags = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
`;

const Tag = styled.span`
  padding: 4px 10px;
  background: ${props => props.theme.colors.bgLight};
  color: ${props => props.theme.colors.text};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 11px;
  font-weight: 600;
  border: 1px solid ${props => props.theme.colors.border};
`;

const JobSalary = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(135deg, ${props => props.theme.colors.success}10, ${props => props.theme.colors.success}05);
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.success}30;
  
  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.theme.colors.success};
  }
  
  span {
    font-size: 14px;
    font-weight: 700;
    color: ${props => props.theme.colors.success};
  }
`;

const JobCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const JobActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled(motion.button)`
  padding: 8px 14px;
  background: ${props => props.$primary
    ? `linear-gradient(135deg, ${props.theme.colors.primary}, ${props.theme.colors.secondary})`
    : props.theme.colors.bgLight};
  color: ${props => props.$primary ? 'white' : props.theme.colors.text};
  border: 1px solid ${props => props.$primary ? 'transparent' : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
  
  svg {
    width: 14px;
    height: 14px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.$primary
    ? `${props.theme.colors.primary}40`
    : 'rgba(0,0,0,0.08)'};
  }
`;

const SaveButton = styled(motion.button)`
  width: 34px;
  height: 34px;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.$saved ? props.theme.colors.warning + '15' : props.theme.colors.bgLight};
  color: ${props => props.$saved ? props.theme.colors.warning : props.theme.colors.textLight};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  svg {
    width: 16px;
    height: 16px;
    fill: ${props => props.$saved ? props.theme.colors.warning : 'none'};
  }
  
  &:hover {
    border-color: ${props => props.theme.colors.warning};
    color: ${props => props.theme.colors.warning};
    background: ${props => props.theme.colors.warning}15;
  }
`;

const JobPosted = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
  
  svg {
    width: 13px;
    height: 13px;
  }
`;

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

// Calculate work date for urgent jobs (1-2 days from now)
const getUrgentJobWorkDate = () => {
  const today = new Date();
  const daysToAdd = Math.floor(Math.random() * 2) + 1; // Random 1 or 2 days
  const workDate = new Date(today);
  workDate.setDate(today.getDate() + daysToAdd);

  const day = String(workDate.getDate()).padStart(2, '0');
  const month = String(workDate.getMonth() + 1).padStart(2, '0');
  const year = workDate.getFullYear();

  return `${day}/${month}/${year}`;
};

// Calculate work date for standard jobs (7-14 days from now)
const getStandardJobWorkDate = () => {
  const today = new Date();
  const daysToAdd = Math.floor(Math.random() * 8) + 7; // Random 7-14 days
  const workDate = new Date(today);
  workDate.setDate(today.getDate() + daysToAdd);

  const day = String(workDate.getDate()).padStart(2, '0');
  const month = String(workDate.getMonth() + 1).padStart(2, '0');
  const year = workDate.getFullYear();

  return `${day}/${month}/${year}`;
};

// Translate salary string based on language
const translateSalary = (salaryStr, language) => {
  if (language === 'vi') return salaryStr;
  return salaryStr
    .replace(/triệu VND/g, 'million VND')
    .replace(/\/ca/g, '/shift')
    .replace(/\/giờ/g, '/hr')
    .replace(/\/tiếng/g, '/hr')
    .replace(/Thỏa thuận/g, 'Negotiable');
};

/**
 * Format salary value from DynamoDB to display string.
 * Handles both cases:
 *   - Already formatted string: "28.000 VNĐ/giờ", "25000 VNĐ/h"  → return as-is
 *   - Raw number/string:        25000, "25000"                       → "25.000 VNĐ/giờ"
 * @param {string|number} raw - salary value from DB
 * @param {string} fallback - fallback text if falsy
 * @returns {string}
 */
const formatSalaryFromDB = (raw, fallback = 'Thỏa thuận') => {
  if (!raw && raw !== 0) return fallback;
  const str = String(raw).trim();
  if (str.includes('VNĐ') || str.includes('VND') || str.includes('đ')) return str;
  const num = parseInt(str.replace(/\D/g, ''), 10);
  if (isNaN(num) || num === 0) return fallback;
  // fallback already has language context from caller
  const isEn = fallback === 'Negotiable';
  return isEn ? `${num.toLocaleString('vi-VN')} VNĐ/hr` : `${num.toLocaleString('vi-VN')} VNĐ/giờ`;
};

// Calculate per-shift salary for jobs with hourly rate
const calculateShiftSalary = (job, language = 'vi') => {
  if (!job.salary.includes('VNĐ/giờ')) return translateSalary(job.salary, language);

  const rateMatch = job.salary.match(/([\d.]+)/);
  if (!rateMatch) return translateSalary(job.salary, language);
  const originalRate = parseInt(rateMatch[1].replace(/\./g, ''));
  const hourlyRate = Math.max(originalRate, 28050);

  let hours = 8;
  const timeMatch = job.type.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
  if (timeMatch) {
    const startH = parseInt(timeMatch[1]);
    const endH = parseInt(timeMatch[3]);
    hours = endH - startH;
    if (hours <= 0) hours += 24;
  }

  const totalSalary = hourlyRate * hours;
  const formatted = totalSalary.toLocaleString('vi-VN').replace(/,/g, '.');
  return `${formatted} VNĐ/${hours}h`;
};

// Translate location string based on language
const translateLocation = (locationStr, language) => {
  if (language === 'vi') return locationStr;
  if (!locationStr) return locationStr;
  return locationStr
    // Districts (must come before generic "Quận" replacement)
    .replace(/Quận 1/g, 'District 1')
    .replace(/Quận 2/g, 'District 2')
    .replace(/Quận 3/g, 'District 3')
    .replace(/Quận 4/g, 'District 4')
    .replace(/Quận 5/g, 'District 5')
    .replace(/Quận 6/g, 'District 6')
    .replace(/Quận 7/g, 'District 7')
    .replace(/Quận 8/g, 'District 8')
    .replace(/Quận 9/g, 'District 9')
    .replace(/Quận 10/g, 'District 10')
    .replace(/Quận 11/g, 'District 11')
    .replace(/Quận 12/g, 'District 12')
    .replace(/Quận/g, 'District')
    // Cities & provinces
    .replace(/TP\.HCM/g, 'HCMC')
    .replace(/TP HCM/g, 'HCMC')
    .replace(/Hà Nội/g, 'Hanoi')
    .replace(/Đà Nẵng/g, 'Da Nang')
    .replace(/Cần Thơ/g, 'Can Tho')
    // Districts of HCMC
    .replace(/Tân Bình/g, 'Tan Binh')
    .replace(/Tân Phú/g, 'Tan Phu')
    .replace(/Bình Tân/g, 'Binh Tan')
    .replace(/Bình Thạnh/g, 'Binh Thanh')
    .replace(/Phú Nhuận/g, 'Phu Nhuan')
    .replace(/Gò Vấp/g, 'Go Vap')
    .replace(/Thủ Đức/g, 'Thu Duc')
    .replace(/Hóc Môn/g, 'Hoc Mon')
    .replace(/Củ Chi/g, 'Cu Chi')
    .replace(/Bình Chánh/g, 'Binh Chanh')
    .replace(/Nhà Bè/g, 'Nha Be')
    .replace(/Cần Giờ/g, 'Can Gio')
    // Other
    .replace(/Toàn quốc/g, 'Nationwide')
    .replace(/Toàn/g, 'All');
};

// Translate time indicators
const translateTimePosted = (timeStr, language) => {
  if (language === 'vi') return timeStr;
  return timeStr
    .replace(/(\d+)\s*ngày trước/g, '$1 days ago')
    .replace(/(\d+)\s*giờ trước/g, '$1 hours ago')
    .replace(/(\d+)\s*phút trước/g, '$1 minutes ago')
    .replace(/1\s*days ago/g, '1 day ago')
    .replace(/1\s*hours ago/g, '1 hour ago');
};

// Format ISO date to readable format (for DynamoDB jobs)
const formatPostedDate = (isoDate, language) => {
  try {
    if (!isoDate) return '---';
    // Parse ISO date - DynamoDB stores in UTC
    const date = new Date(isoDate);
    const now = new Date();

    // Calculate difference in milliseconds
    let diffMs = now - date;
    
    // Handle small clock drifts
    if (diffMs < 0) diffMs = 0;
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    // Return relative time
    if (diffMinutes < 1) {
      return language === 'vi' ? 'Vừa xong' : 'Just now';
    } else if (diffMinutes < 60) {
      return language === 'vi' ? `${diffMinutes} phút trước` : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return language === 'vi' ? `${diffHours} giờ trước` : `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return language === 'vi' ? `${diffDays} ngày trước` : `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return language === 'vi' ? `${weeks} tuần trước` : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      // Format as date in local timezone
      return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return isoDate;
  }
};

// Parse time posted to hours for sorting (newer = smaller number)
const parseTimeToHours = (timeStr) => {
  // Handle undefined or null
  if (!timeStr) return 999999;

  // Handle ISO date format (from DynamoDB)
  if (timeStr.includes('T') && timeStr.includes('Z')) {
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours;
    } catch (e) {
      return 999999;
    }
  }

  // Handle text format (e.g., "2 giờ trước", "3 days ago")
  const match = String(timeStr).match(/(\d+)/);
  if (!match) return 999999; // Unknown time goes to end

  const num = parseInt(match[1]);

  // Convert to hours
  if (timeStr.includes('giờ') || timeStr.includes('hour')) {
    return num;
  } else if (timeStr.includes('ngày') || timeStr.includes('day')) {
    return num * 24;
  } else if (timeStr.includes('tuần') || timeStr.includes('week')) {
    return num * 24 * 7;
  } else if (timeStr.includes('tháng') || timeStr.includes('month')) {
    return num * 24 * 30;
  }

  return 999999; // Unknown format goes to end
};

// Translate job titles
const translateJobTitle = (titleStr, language) => {
  // Remove shift prefix (Ca Sáng -, Ca Chiều -, Ca Tối -, etc.) - more flexible pattern
  let cleanTitle = titleStr
    .replace(/^Ca\s+(Sáng|Chiều|Tối|Đêm|Trưa|Linh\s+Động)\s*-\s*/gi, '')
    .replace(/\s*-\s*Ca\s+(sáng|chiều|tối|đêm|trưa)/gi, '');

  // Remove Part-time and Full-time suffix
  cleanTitle = cleanTitle.replace(/\s*-\s*(Part-time|Full-time)\s*$/i, '');

  if (language === 'vi') return cleanTitle;

  const titleMap = {
    'Quản lý cửa hàng F&B': 'F&B Store Manager',
    'Nhân viên pha chế': 'Barista',
    'Nhân viên phục vụ nhà hàng': 'Restaurant Server',
    'Đầu bếp chính': 'Head Chef',
    'Thu ngân nhà hàng': 'Restaurant Cashier',
    'Nhân viên phục vụ': 'Service Staff',
    'Pha chế trà sữa': 'Bubble Tea Barista',
    'Quản lý bếp': 'Kitchen Manager',
    'Nhân viên chế biến thực phẩm': 'Food Processing Staff',
    'Nhân viên phục vụ bàn': 'Waiter/Waitress',
    'Barista': 'Barista',
    'Nhân viên bếp': 'Kitchen Staff',
    'Shift Supervisor': 'Shift Supervisor',
    'Nhân viên giao đồ ăn': 'Food Delivery',
    'Nhân viên bán hàng': 'Sales Staff',
    'Phục vụ nhà hàng': 'Restaurant Server',
    'Giao đồ ăn nhanh': 'Fast Food Delivery',
    'Nhân viên Café': 'Café Staff',
    'Phục vụ Quán ăn': 'Eatery Server',
    'Nhân viên bếp nóng': 'Hot Kitchen Staff',
    'Giao đồ ăn đêm': 'Night Food Delivery',
    'Phục vụ Trà sữa': 'Bubble Tea Server',
    'Thu ngân quán café': 'Café Cashier',
    'Bartender': 'Bartender',
    'Shipper đồ ăn': 'Food Delivery',
    'Nhân viên KFC': 'KFC Staff',
    'Lễ tân nhà hàng': 'Restaurant Receptionist',
    'Pha chế': 'Barista',
    'Thu ngân quán ăn': 'Eatery Cashier',
    'Nhân viên bếp sáng': 'Kitchen Staff',
    'Phục vụ Lẩu': 'Hot Pot Server',
    "Nhân viên McDonald's": "McDonald's Staff",
    'Pha chế Phúc Long': 'Phuc Long Barista',
    'Phục vụ Jollibee': 'Jollibee Staff',
    'Nhân viên Lotteria': 'Lotteria Staff',
    'Pha chế Katinat': 'Katinat Barista',
    'Phục vụ Pizza': 'Pizza Server',
    'Giao đồ ăn': 'Food Delivery',
    'Nhân viên bếp đêm': 'Kitchen Staff',
    'Thu ngân Highlands': 'Highlands Cashier',
    // JOBS_DATA titles (Title Case variants)
    'Nhân viên Phục Vụ Quán Cafe': 'Café Service Staff',
    'Nhân viên Pha Chế': 'Barista',
    'Nhân viên Phục Vụ': 'Service Staff',
    'Phụ bếp nhà hàng': 'Kitchen Helper',
    'Nhân viên phụ bếp': 'Kitchen Helper',
    'Nhân viên Thu Ngân Nhà Hàng': 'Restaurant Cashier',
    'Nhân viên Pha Chế Trà Sữa': 'Bubble Tea Barista',
    'Nhân viên bưng bê': 'Food Runner',
    'Nhân viên Thu Ngân Cửa Hàng': 'Store Cashier',
    'Nhân viên Pha Chế Phúc Long': 'Phuc Long Barista',
    'Nhân viên Phục Vụ Nhà Hàng': 'Restaurant Server',
    'Nhân viên Thu Ngân Quán Café': 'Café Cashier',
    'Nhân viên Thu Ngân': 'Cashier',
    'Nhân viên Phục Vụ Quán Ăn': 'Eatery Server',
    'Nhân viên Phục Vụ Trà Sữa': 'Bubble Tea Server',
    'Nhân viên Phục Vụ Lẩu': 'Hot Pot Server',
    'Nhân viên Phục Vụ Pizza': 'Pizza Server',
    'Nhân viên Pha Chế Katinat': 'Katinat Barista',
    'Nhân viên Thu Ngân Highlands': 'Highlands Cashier',
  };

  return titleMap[cleanTitle] || 
    Object.entries(titleMap).find(([k]) => k.toLowerCase() === cleanTitle.toLowerCase())?.[1] || 
    cleanTitle;
};

// Generate job description based on job title and company
const generateJobDescription = (job, language) => {
  const title = translateJobTitle(job.title, language).toLowerCase();
  const company = job.company;

  const descriptions = {
    'vi': {
      'pha chế': `• Pha chế các loại đồ uống theo tiêu chuẩn của ${company}\n• Tư vấn và giới thiệu menu cho khách hàng\n• Kiểm tra chất lượng nguyên liệu trước khi sử dụng\n• Vệ sinh và bảo quản máy móc, dụng cụ pha chế\n• Sắp xếp và trưng bày sản phẩm hấp dẫn\n\nYÊU CẦU:\n• Có kinh nghiệm pha chế từ 3-6 tháng trở lên (ưu tiên)\n• Thái độ nhiệt tình, thân thiện với khách hàng\n• Nhanh nhẹn, chịu được áp lực công việc cao điểm\n• Có tinh thần trách nhiệm và làm việc nhóm tốt\n• Chấp nhận làm việc theo ca, kể cả cuối tuần và lễ\n\nCHẾ ĐỘ PHÚC LỢI:\n• Được đào tạo kỹ năng pha chế chuyên nghiệp\n• Thưởng hiệu suất làm việc hàng tháng\n• Nghỉ phép có lương theo quy định\n• Được hưởng BHXH sau thời gian thử việc\n• Môi trường làm việc trẻ trung, năng động\n• Cơ hội thăng tiến lên vị trí quản lý`,
      'barista': `• Pha chế cà phê espresso, cappuccino, latte và các loại đồ uống đặc biệt\n• Tạo latte art và trang trí đồ uống đẹp mắt\n• Tư vấn khách hàng về hương vị và loại cà phê phù hợp\n• Kiểm soát chất lượng từng ly đồ uống\n• Vệ sinh máy pha, grinder và khu vực làm việc\n• Quản lý tồn kho nguyên liệu, báo cáo khi thiếu hàng\n\nYÊU CẦU:\n• Am hiểu về cà phê và các phương pháp pha chế\n• Có kỹ năng pha chế và tạo latte art cơ bản\n• Giao tiếp tốt, khéo léo trong xử lý tình huống\n• Ngoại hình ưa nhìn, tác phong chuyên nghiệp\n• Sẵn sàng học hỏi và cải thiện kỹ năng\n\nCHẾ ĐỘ PHÚC LỢI:\n• Được đào tạo bài bản về cà phê chuyên sâu\n• Tham gia các khóa học nâng cao kỹ năng\n• Thưởng theo doanh số và KPI cá nhân\n• Bảo hiểm tai nạn 24/7\n• Môi trường làm việc hiện đại, chuyên nghiệp\n• Cơ hội phát triển nghề nghiệp lâu dài tại ${company}`,
      'phục vụ': `• Đón tiếp và chào hỏi khách hàng thân thiện\n• Tư vấn menu, nhận order và ghi chép chính xác\n• Phục vụ đồ ăn, thức uống nhanh chóng và cẩn thận\n• Thu dọn bàn, vệ sinh khu vực phục vụ\n• Hỗ trợ thanh toán và tiễn khách\n• Xử lý các yêu cầu đặc biệt của khách hàng\n\nYÊU CẦU:\n• Nhanh nhẹn, lanh lợi, có sức khỏe tốt\n• Giao tiếp tốt, giọng nói rõ ràng\n• Nhiệt tình, vui vẻ, thái độ phục vụ tốt\n• Có tinh thần trách nhiệm cao\n• Ưu tiên có kinh nghiệm phục vụ nhà hàng/quán café\n\nCHẾ ĐỘ PHÚC LỢI:\n• Nhận tip trực tiếp từ khách hàng\n• Được ăn ca miễn phí tại cửa hàng\n• Làm việc theo ca linh hoạt, phù hợp sinh viên\n• Được hưởng BHXH, BHYT theo luật lao động\n• Môi trường làm việc thân thiện, đồng nghiệp hỗ trợ nhiệt tình\n• Có cơ hội trở thành nhân viên chính thức lâu dài`,
      'bếp': `• Chuẩn bị và sơ chế nguyên liệu theo quy trình\n• Chế biến món ăn theo công thức chuẩn của ${company}\n• Kiểm tra chất lượng món ăn trước khi ra khách\n• Đảm bảo vệ sinh an toàn thực phẩm\n• Hỗ trợ đầu bếp trong giờ cao điểm\n• Vệ sinh bếp và dụng cụ sau ca làm việc\n\nYÊU CẦU:\n• Có kinh nghiệm làm bếp từ 6 tháng trở lên\n• Biết chế biến các món ăn cơ bản\n• Chịu được nhiệt độ cao và áp lực công việc\n• Sức khỏe tốt, không bị dị ứng thực phẩm\n• Có tinh thần trách nhiệm và làm việc nhóm\n\nCHẾ ĐỘ PHÚC LỢI:\n• Được ăn 3 bữa/ngày tại nhà hàng\n• Đào tạo kỹ năng nấu ăn chuyên nghiệp\n• Trang bị đồng phục và dụng cụ bảo hộ đầy đủ\n• Thưởng theo hiệu suất làm việc\n• Môi trường bếp hiện đại, trang thiết bị đầy đủ\n• Cơ hội thăng tiến lên vị trí bếp trưởng`,
      'thu ngân': `• Thu tiền và xuất hóa đơn cho khách hàng\n• Kiểm tra và đối chiếu tiền cuối mỗi ca\n• Xử lý các hình thức thanh toán: tiền mặt, thẻ, ví điện tử\n• Hỗ trợ khách hàng về chương trình khuyến mãi\n• Báo cáo doanh thu và các vấn đề phát sinh\n• Bảo quản tiền mặt và chứng từ an toàn\n\nYÊU CẦU:\n• Trung thực, cẩn thận, tỉ mỉ trong công việc\n• Tính toán nhanh, sử dụng máy tính tiền thành thạo\n• Giao tiếp tốt, thái độ niềm nở với khách\n• Có khả năng làm việc độc lập\n• Ưu tiên có kinh nghiệm thu ngân\n\nCHẾ ĐỘ PHÚC LỢI:\n• Làm việc trong môi trường chuyên nghiệp\n• Được đào tạo sử dụng hệ thống POS hiện đại\n• Thưởng khi không sai sót tiền\n• Nghỉ phép có lương theo quy định\n• Được hưởng đầy đủ chế độ BHXH, BHYT\n• Cơ hội thăng tiến lên vị trí quản lý ca`,
      'bán hàng': `• Tư vấn và giới thiệu sản phẩm cho khách hàng\n• Chăm sóc khách hàng, giải đáp thắc mắc\n• Sắp xếp, trưng bày hàng hóa đẹp mắt\n• Kiểm kê tồn kho, báo cáo hàng cần nhập\n• Hỗ trợ thanh toán và đóng gói sản phẩm\n• Duy trì vệ sinh khu vực bán hàng\n\nYÊU CẦU:\n• Giao tiếp tốt, nhiệt tình với khách hàng\n• Ngoại hình ưa nhìn, tác phong chuyên nghiệp\n• Trung thực, có tinh thần trách nhiệm\n• Ham học hỏi, tiếp thu kiến thức sản phẩm\n• Ưu tiên có kinh nghiệm bán hàng\n\nCHẾ ĐỘ PHÚC LỢI:\n• Hoa hồng hấp dẫn theo doanh số\n• Thưởng khi đạt chỉ tiêu tháng\n• Được đào tạo kỹ năng bán hàng chuyên nghiệp\n• Môi trường làm việc năng động, trẻ trung\n• Cơ hội thăng tiến lên vị trí quản lý cửa hàng\n• Được hưởng các chế độ phúc lợi theo luật lao động`,
      'giao hàng': `• Nhận đơn hàng và kiểm tra thông tin giao hàng\n• Giao hàng đúng địa chỉ và đúng thời gian cam kết\n• Thu tiền và chuyển về quầy cuối ca\n• Báo cáo các vấn đề phát sinh trong quá trình giao hàng\n• Giữ gìn hàng hóa cẩn thận, tránh hư hỏng\n• Hỗ trợ đóng gói hàng khi cần thiết\n\nYÊU CẦU:\n• Có xe máy và giấy phép lái xe hợp lệ\n• Biết đường, am hiểu khu vực giao hàng\n• Chịu khó, trung thực, có trách nhiệm\n• Sức khỏe tốt, chịu được thời tiết\n• Giao tiếp tốt với khách hàng\n\nCHẾ ĐỘ PHÚC LỢI:\n• Thưởng theo số đơn giao thành công\n• Hỗ trợ xăng xe hàng tháng\n• Bảo hiểm tai nạn 24/7 cho shipper\n• Ca làm việc linh hoạt, phù hợp sinh viên\n• Môi trường làm việc tự do, năng động\n• Cơ hội kiếm thu nhập cao trong giờ cao điểm`,
      'default': `• Thực hiện các nhiệm vụ được giao theo quy trình\n• Hỗ trợ đồng nghiệp khi cần thiết\n• Đảm bảo chất lượng công việc đạt tiêu chuẩn\n• Báo cáo tiến độ và vấn đề phát sinh\n• Tham gia các hoạt động đào tạo nội bộ\n\nYÊU CẦU:\n• Có trách nhiệm và chăm chỉ trong công việc\n• Ham học hỏi, tiếp thu nhanh\n• Làm việc nhóm tốt, hỗ trợ đồng nghiệp\n• Thái độ tích cực, nhiệt tình\n• Sẵn sàng làm việc theo ca\n\nCHẾ ĐỘ PHÚC LỢI:\n• Được đào tạo kỹ năng nghề nghiệp\n• Môi trường làm việc thân thiện, chuyên nghiệp\n• Nghỉ phép có lương theo quy định\n• Được hưởng các chế độ BHXH theo luật\n• Cơ hội phát triển và thăng tiến\n• Tham gia các hoạt động team building định kỳ`
    },
    'en': {
      'barista': `• Prepare espresso, cappuccino, latte and specialty drinks\n• Create latte art and beautifully decorated beverages\n• Advise customers on flavors and suitable coffee types\n• Control quality of each drink\n• Clean machines, grinders and work area\n• Manage ingredient inventory, report shortages\n\nREQUIREMENTS:\n• Knowledge of coffee and brewing methods\n• Brewing skills and basic latte art\n• Good communication, tactful in handling situations\n• Professional appearance and demeanor\n• Willing to learn and improve skills\n\nBENEFITS:\n• Professional in-depth coffee training\n• Advanced skill development courses\n• Performance and KPI bonuses\n• 24/7 accident insurance\n• Modern, professional work environment\n• Long-term career development at ${company}`,
      'server': `• Greet and welcome customers friendly\n• Advise menu, take orders accurately\n• Serve food and drinks quickly and carefully\n• Clean tables and service areas\n• Assist with payment and see off customers\n• Handle special customer requests\n\nREQUIREMENTS:\n• Quick, agile, good health\n• Good communication, clear voice\n• Enthusiastic, cheerful, good service attitude\n• Highly responsible\n• Restaurant/café service experience preferred\n\nBENEFITS:\n• Receive tips directly from customers\n• Free meals during shifts\n• Flexible shifts, suitable for students\n• Social and health insurance as per law\n• Friendly environment, supportive colleagues\n• Opportunity for long-term employment`,
      'default': `• Perform assigned tasks according to procedures\n• Support colleagues when needed\n• Ensure work quality meets standards\n• Report progress and issues\n• Participate in internal training activities\n\nREQUIREMENTS:\n• Responsible and hardworking\n• Eager to learn, quick to absorb\n• Good teamwork, support colleagues\n• Positive attitude, enthusiastic\n• Willing to work shifts\n\nBENEFITS:\n• Professional skills training\n• Friendly, professional environment\n• Paid leave as regulated\n• Social insurance benefits as per law\n• Development and promotion opportunities\n• Regular team building activities`
    }
  };

  const langDescriptions = descriptions[language] || descriptions['vi'];
  for (const [key, desc] of Object.entries(langDescriptions)) {
    if (title.includes(key)) return desc;
  }
  return langDescriptions['default'];
};

// Translate tags
const translateTag = (tagStr, language) => {
  if (language === 'vi') return tagStr;

  const tagMap = {
    'Kế toán': 'Accounting',
    'Excel': 'Excel',
    'MISA': 'MISA',
    'Kinh doanh': 'Sales',
    'B2B': 'B2B',
    'Hoa hồng cao': 'High Commission',
    'Marketing': 'Marketing',
    'Facebook Ads': 'Facebook Ads',
    'SEO': 'SEO',
    'Nhân sự': 'HR',
    'Hành chính': 'Admin',
    'Office': 'Office',
    'Pha chế': 'Bartending',
    'Part-time': 'Part-time',
    'F&B': 'F&B',
    'Thu ngân': 'Cashier',
    'Bán lẻ': 'Retail',
    'Phục vụ': 'Service',
    'Coffee': 'Coffee',
    'Trà sữa': 'Bubble Tea',
    'Telesales': 'Telesales',
    'Gọi điện': 'Cold Calling',
    'Hoa hồng': 'Commission',
    'Văn phòng': 'Office Work',
    'Word/Excel': 'Word/Excel',
    'Giao tiếp': 'Communication',
    'Giáo viên': 'Teacher',
    'Tiếng Anh': 'English',
    'IELTS': 'IELTS',
    'Lễ tân': 'Receptionist',
    'Khách sạn': 'Hotel',
    'Ca đêm': 'Night Shift',
    'Bảo vệ': 'Security',
    'An ninh': 'Security',
    'Ca sáng': 'Morning Shift',
    'Kho vận': 'Warehouse',
    'Logistics': 'Logistics',
    'Ca chiều': 'Afternoon Shift',
    'Quản lý': 'Management',
    'Linh động': 'Flexible',
    'Giao hàng': 'Delivery',
    'Xe máy': 'Motorbike',
    'Bán hàng': 'Sales',
    'Cửa hàng': 'Store',
    'Nhà hàng': 'Restaurant',
    'Ca tối': 'Evening Shift',
    'Siêu thị': 'Supermarket',
    'Đầu bếp': 'Chef',
    'Bếp': 'Kitchen',
    'Pizza': 'Pizza',
    'Lẩu': 'Hot Pot',
    'Chế biến': 'Processing',
    'Fast food': 'Fast Food',
    'Quán ăn': 'Eatery',
    'Bartender': 'Bartender'
  };

  return tagMap[tagStr] || tagStr;
};

// Translate job type
const translateJobType = (typeStr, language) => {
  // If it's a shift job (contains "Ca"), return Part-time
  if (typeStr.includes('Ca ')) {
    return language === 'vi' ? 'Part-time' : 'Part-time';
  }

  // If already Part-time or Full-time, keep it
  if (typeStr.includes('Part-time') || typeStr.includes('Full-time')) {
    return typeStr;
  }

  // For English translation
  if (language === 'en') {
    return typeStr
      .replace(/Part-time/g, 'Part-time')
      .replace(/Full-time/g, 'Full-time');
  }

  return typeStr;
};


const JobListing = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const resultsRef = useRef(null);
  const viewedJobIdsRef = useRef(new Set());

  // ─── Quick job verification status ───────────────────────────────────────
  const [quickJobStatus, setQuickJobStatus] = React.useState(null); // null=loading, 'PENDING'|'SUBMITTED'|'APPROVED'
  React.useEffect(() => {
    let cancelled = false;
    import('../../services/candidateProfileService').then(({ default: svc }) => {
      svc.getMyProfile().then(p => {
        if (!cancelled) setQuickJobStatus(p?.verificationStatus || 'PENDING');
      }).catch(() => { if (!cancelled) setQuickJobStatus('PENDING'); });
    });
    return () => { cancelled = true; };
  }, []);
  const quickJobApproved = quickJobStatus === 'APPROVED';
  // ─────────────────────────────────────────────────────────────────────────
  const [savedJobs, setSavedJobs] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [jobCategory, setJobCategory] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'shift') return 'shift';
    if (tab === 'saved') return 'standard';
    if (tab === 'standard') return 'standard';
    
    const saved = localStorage.getItem('candidate_job_listing_category');
    return saved !== null ? saved : 'standard';
  }); // 'standard' or 'shift'
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [dynamoDBJobs, setDynamoDBJobs] = useState([]);
  const [quickJobs, setQuickJobs] = useState([]);
  const [isLoadingDynamoJobs, setIsLoadingDynamoJobs] = useState(true);
  const [isReloading, setIsReloading] = useState(false);

  // Load jobs from DynamoDB
  const loadDynamoDBJobs = async () => {
    try {
      setIsLoadingDynamoJobs(true);
      console.log('📥 Loading jobs from DynamoDB for candidate view...');
      const jobs = await jobPostService.getAllActiveJobs();
      console.log('✅ Loaded DynamoDB jobs:', jobs);

      // Transform DynamoDB jobs to match JOBS_DATA format
      const transformedJobs = jobs
        .filter(job => job && job.idJob && job.title && job.salary) // Filter out invalid jobs and jobs without salary
        .filter(job => job.status !== 'deleted') // Filter out deleted jobs
        .map(job => {
          try {
            // Use coordinates from job if available, otherwise use default HCM location
            const lat = job.latitude || job.lat || 10.7769;
            const lng = job.longitude || job.lng || 106.7009;
            
            console.log(`📍 DynamoDB Job: ${job.title} at ${job.location} - Coords: ${lat}, ${lng}`);
            
            return {
              id: `dynamo-${job.idJob}`,
              idJob: job.idJob,
              employerId: job.employerId,
              title: String(job.title || 'Untitled Job'),
              company: String(job.employerName || job.employerEmail || (language === 'vi' ? 'Công ty' : 'Company')),
              location: String(job.location || ''),
              lat: lat, // Add coordinates for location-based filtering
              lng: lng,
              salary: formatSalaryFromDB(job.salary, language === 'vi' ? 'Thỏa thuận' : 'Negotiable'),
              type: job.jobType === 'part-time' ? (language === 'vi' ? 'Bán thời gian' : 'Part-time') : (language === 'vi' ? 'Toàn thời gian' : 'Full-time'),
              category: String(job.category || 'standard'), // Use category from DynamoDB
              tags: job.tags ? String(job.tags).split(',').map(t => String(t).trim()).filter(t => t) : [],
              postedDate: String(job.createdAt || new Date().toISOString()),
              postedAt: formatPostedDate(job.createdAt || new Date().toISOString(), language), // Add formatted text
              applicants: parseInt(job.applicants) || 0,
              views: parseInt(job.views) || 0,
              description: String(job.description || ''),
              responsibilities: String(job.responsibilities || ''),
              requirements: String(job.requirements || ''),
              benefits: String(job.benefits || ''),
              workHours: String(job.workHours || ''),
              workDays: String(job.workDays || ''),
              status: String(job.status || 'active'),
              isFromDynamoDB: true // Flag to identify DynamoDB jobs
            };
          } catch (err) {
            console.error('Error transforming job:', job, err);
            return null;
          }
        })
        .filter(job => job !== null); // Remove failed transformations

      setDynamoDBJobs(transformedJobs);
      console.log('✅ Transformed DynamoDB jobs:', transformedJobs);
    } catch (error) {
      console.error('❌ Error loading DynamoDB jobs:', error);
      setDynamoDBJobs([]);
    } finally {
      setIsLoadingDynamoJobs(false);
    }
  };

  // Load quick jobs from PostQuickJob table
  const loadQuickJobs = async () => {
    try {
      console.log('📥 Loading quick jobs from PostQuickJob table...');
      const jobs = await quickJobService.getAllActiveQuickJobs();
      console.log('✅ Loaded quick jobs:', jobs);

      // Transform quick jobs to match JOBS_DATA format
      const transformedQuickJobs = jobs
        .filter(job => job && (job.jobID || job.idJob) && job.title)
        .filter(job => job.status !== 'deleted') // Filter out deleted jobs
        .map(job => {
          try {
            const jobId = job.jobID || job.idJob;
            const hourlyRate = parseInt(job.hourlyRate) || 0;
            const totalHours = parseFloat(job.totalHours) || 0;
            const totalSalary = parseInt(job.totalSalary) || (hourlyRate * totalHours);

            // Calculate candidate income (85% of totalSalary - 15% platform fee)
            const candidateIncome = Math.round(totalSalary * 0.85);

            // Map jobType from database to display format
            const jobType = job.jobType === 'part-time'
              ? 'Part-time'
              : job.jobType === 'full-time'
                ? 'Full-time'
                : job.jobType || 'Part-time';

            // Use coordinates from job if available, otherwise use default HCM location
            const lat = job.latitude || job.lat || 10.7769;
            const lng = job.longitude || job.lng || 106.7009;
            
            console.log(`📍 Quick Job: ${job.title} at ${job.location} - Coords: ${lat}, ${lng}`);

            return {
              id: `quick-${jobId}`,
              idJob: jobId,
              employerId: job.employerId,
              title: String(job.title || 'Untitled Job'),
              company: String(job.companyName || (language === 'vi' ? 'Công ty' : 'Company')),
              location: String(job.location || ''),
              lat: lat, // Add coordinates for location-based filtering
              lng: lng,
              salary: candidateIncome > 0
                ? `${candidateIncome.toLocaleString()} VNĐ/${totalHours}h`
                : `${Math.round(hourlyRate * 0.85).toLocaleString()} VNĐ/giờ`,
              type: jobType, // Use jobType from database
              category: 'shift', // Quick jobs are shift-based
              tags: [language === 'vi' ? 'Tuyển gấp' : 'Urgent', language === 'vi' ? 'Làm ngay' : 'Start Now'],
              postedDate: String(job.createdAt || new Date().toISOString()),
              postedAt: formatPostedDate(job.createdAt || new Date().toISOString(), language),
              applicants: parseInt(job.applicants) || 0,
              views: parseInt(job.views) || 0,
              description: String(job.description || ''),
              requirements: String(job.requirements || ''),
              workHours: job.startTime && job.endTime ? `${job.startTime} - ${job.endTime}` : '',
              workDate: job.workDate || '',
              status: String(job.status || 'active'),
              isQuickJob: true, // Flag to identify quick jobs
              urgent: true, // Mark as urgent to show red badge
              isUrgent: true
            };
          } catch (err) {
            console.error('Error transforming quick job:', job, err);
            return null;
          }
        })
        .filter(job => job !== null);

      setQuickJobs(transformedQuickJobs);
      console.log('✅ Transformed quick jobs:', transformedQuickJobs);
    } catch (error) {
      console.error('❌ Error loading quick jobs:', error);
      setQuickJobs([]);
    }
  };

  // Run on mount or language change
  useEffect(() => {
    loadDynamoDBJobs();
    loadQuickJobs();
  }, [language]);

  const handleReloadJobs = async () => {
    setIsReloading(true);
    await Promise.all([
      loadDynamoDBJobs(),
      loadQuickJobs()
    ]);
    setIsReloading(false);
  };

  // Merge DynamoDB jobs AND quick jobs
  const allJobs = useMemo(() => {
    return [...dynamoDBJobs, ...quickJobs];
  }, [dynamoDBJobs, quickJobs, language]);

  const [quickFilter, setQuickFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('list');
  const [expandedFilters, setExpandedFilters] = useState({
    jobType: true,
    salary: true,
    company: true
  });

  // Filter states
  const [selectedJobTypes, setSelectedJobTypes] = useState([]);
  const [selectedSalaryRanges, setSelectedSalaryRanges] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  // Location-based states
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showNearbyJobs, setShowNearbyJobs] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(3); // km - radius to find jobs near candidate
  const [showSavedJobsOnly, setShowSavedJobsOnly] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'saved') return true;
    if (tab === 'standard' || tab === 'shift') return false;

    const saved = localStorage.getItem('candidate_job_listing_saved_only');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Job search status states
  const [isAvailable, setIsAvailable] = useState(() => {
    const saved = localStorage.getItem('candidate_job_search_is_available');
    return saved !== null ? JSON.parse(saved) : false;
  }); // Load from localStorage, default false
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [applyModal, setApplyModal] = useState(null); // { job } or null
  const [selectedCV, setSelectedCV] = useState(null); // CV được chọn để ứng tuyển
  const [candidateCVList, setCandidateCVList] = useState([]); // Danh sách CV của ứng viên
  const [showCVSelectionModal, setShowCVSelectionModal] = useState(false); // Modal chọn CV
  const [detailModal, setDetailModal] = useState(null); // { job } or null
  const [jobDescriptionModal, setJobDescriptionModal] = useState(null); // { job } or null
  const [applySuccess, setApplySuccess] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(null);
  const [highlightedJobId, setHighlightedJobId] = useState(null);

  const banners = [
    { src: s3Images.banner.seoul, alt: "Seoul Vua Mì Cay" },
    { src: s3Images.banner.unnamed1, alt: "Banner" },
    { src: s3Images.banner.unnamed, alt: "Banner" }
  ];

  useEffect(() => {
    const bannerInterval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 7000);
    return () => clearInterval(bannerInterval);
  }, [banners.length]);

  const handleToggleAvailability = () => {
    setShowConfirmModal(true);
  };

  const confirmToggle = () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    localStorage.setItem('candidate_job_search_is_available', JSON.stringify(newStatus));
    setShowConfirmModal(false);

    // Khi BẬT trạng thái tìm việc → tự động bật "Tìm việc gần tôi"
    if (newStatus) {
      getUserLocation();
    } else {
      // Khi TẮT → tắt luôn nearby jobs
      setShowNearbyJobs(false);
      setUserLocation(null);
    }
  };

  // Automatically request location when job search status is active and user switches to shift tab
  useEffect(() => {
    if (isAvailable && jobCategory === 'shift' && !userLocation) {
      getUserLocation();
    }
  }, [isAvailable, jobCategory]);

  // Sync tab state with URL query param and localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      if (tab === 'shift') {
        setJobCategory('shift');
        localStorage.setItem('candidate_job_listing_category', 'shift');
        setShowSavedJobsOnly(false);
        localStorage.setItem('candidate_job_listing_saved_only', JSON.stringify(false));
      } else if (tab === 'saved') {
        setShowSavedJobsOnly(true);
        localStorage.setItem('candidate_job_listing_saved_only', JSON.stringify(true));
      } else if (tab === 'standard') {
        setJobCategory('standard');
        localStorage.setItem('candidate_job_listing_category', 'standard');
        setShowSavedJobsOnly(false);
        localStorage.setItem('candidate_job_listing_saved_only', JSON.stringify(false));
      }
    } else {
      // If no URL parameter, make sure URL reflects current state
      const currentTab = showSavedJobsOnly ? 'saved' : jobCategory;
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('tab', currentTab);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  }, [location.search, jobCategory, showSavedJobsOnly, navigate]);

  // Load saved jobs from candidate profile instead of localStorage
  useEffect(() => {
    if (candidateProfile && Array.isArray(candidateProfile.savedJobs)) {
      console.log('📥 Syncing saved jobs from DynamoDB profile:', candidateProfile.savedJobs);
      setSavedJobs(candidateProfile.savedJobs);
    }
  }, [candidateProfile]);

  // Fetch candidate profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await candidateProfileService.getMyProfile();
        setCandidateProfile(profile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  // Handle search from Navbar or LandingPage
  useEffect(() => {
    if (location.state?.searchKeyword !== undefined || location.state?.searchLocation !== undefined) {
      if (location.state?.searchKeyword) setSearchKeyword(location.state.searchKeyword);
      if (location.state?.searchLocation) setSelectedLocation(location.state.searchLocation);
      // Clear state so re-visiting doesn't re-apply old search
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle selected job from Dashboard
  useEffect(() => {
    if (allJobs.length > 0 && location.state?.selectedJobId) {
      const jobId = location.state.selectedJobId;
      console.log('🎯 Dashboard selectedJobId:', jobId);

      const job = allJobs.find(j =>
        j.id === jobId ||
        j.idJob === jobId ||
        j.id === `dynamo-${jobId}` ||
        j.id === `quick-${jobId}`
      );

      if (job) {
        console.log('✅ Found job for selectedJobId:', job.title);
        // Set category to match job's category so it shows up in the list (if not saved)
        if (!showSavedJobsOnly) {
          setJobCategory(job.category || 'standard');
        }

        // Highlight the job card
        setHighlightedJobId(job.id);

        // Clear highlight after 5 seconds
        setTimeout(() => {
          setHighlightedJobId(null);
        }, 5000);

        // Scroll to the specific job card
        setTimeout(() => {
          const element = document.getElementById(`job-card-${job.id}`);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          } else {
            scrollToResults();
          }
        }, 600);
      }

      // Clear state so re-visiting doesn't re-open the modal
      window.history.replaceState({ ...location.state, selectedJobId: undefined }, document.title);
    }
  }, [allJobs, location.state, showSavedJobsOnly]);

  // Scroll to results function
  const scrollToResults = () => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Auto scroll to results when searching
  useEffect(() => {
    if (searchKeyword || selectedLocation) {
      const timer = setTimeout(() => {
        scrollToResults();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [searchKeyword, selectedLocation]);

  // Auto scroll when filters change
  useEffect(() => {
    if (selectedJobTypes.length > 0 ||
      selectedSalaryRanges.length > 0 || selectedCompanies.length > 0) {
      scrollToResults();
    }
  }, [selectedJobTypes, selectedSalaryRanges, selectedCompanies]);

  // Reset nearby jobs when switching from shift to standard category
  useEffect(() => {
    if (jobCategory === 'standard') {
      setShowNearbyJobs(false);
    }
  }, [jobCategory]);

  // Get user's current location
  const getUserLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLoadingLocation(false);
          setShowNearbyJobs(true);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to a default location in Ho Chi Minh City (Ben Thanh Market)
          setUserLocation({
            lat: 10.7723,
            lng: 106.6981
          });
          setIsLoadingLocation(false);
          setShowNearbyJobs(true);
        }
      );
    } else {
      // Browser doesn't support geolocation, use default location
      setUserLocation({
        lat: 10.7723,
        lng: 106.6981
      });
      setIsLoadingLocation(false);
      setShowNearbyJobs(true);
    }
  };

  const handleSaveJob = async (jobId, e) => {
    e?.stopPropagation();

    // To provide immediate feedback, we update the local state first
    const isAlreadySaved = savedJobs.includes(jobId);
    setSavedJobs(prev =>
      isAlreadySaved
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );

    try {
      console.log(`💾 Syncing saved job state to database for: ${jobId}`);
      await candidateProfileService.toggleSavedJob(jobId);
      
      // Optionally update the whole profile state to stay in sync
      const updatedProfile = await candidateProfileService.getMyProfile();
      if (updatedProfile) setCandidateProfile(updatedProfile);
    } catch (error) {
      console.error('❌ Failed to sync saved job to database:', error);
      
      // Rollback local state on error
      setSavedJobs(prev =>
        isAlreadySaved
          ? [...prev, jobId]
          : prev.filter(id => id !== jobId)
      );
      
      setErrorModal({
        show: true,
        message: language === 'vi' 
          ? 'Không thể lưu công việc. Vui lòng đảm bảo bạn đã tạo hồ sơ cá nhân.' 
          : 'Could not save job. Please ensure you have created a profile.'
      });
    }
  };

  const recordJobView = async (job) => {
    if (!job || (!job.isFromDynamoDB && !job.isQuickJob)) return;

    const jobId = job.idJob || job.id;
    if (!jobId) return;

    if (viewedJobIdsRef.current.has(jobId)) return;
    viewedJobIdsRef.current.add(jobId);

    if (job.isFromDynamoDB) {
      setDynamoDBJobs(prev => prev.map(j =>
        j.idJob === job.idJob ? { ...j, views: (j.views || 0) + 1 } : j
      ));
    }

    if (job.isQuickJob) {
      setQuickJobs(prev => prev.map(j =>
        j.idJob === job.idJob ? { ...j, views: (j.views || 0) + 1 } : j
      ));
    }

    try {
      if (job.isQuickJob) {
        await quickJobService.incrementViews(job.idJob);
      } else {
        await jobPostService.incrementViews(job.idJob);
      }
    } catch (error) {
      console.error('Error incrementing job views:', error);
      viewedJobIdsRef.current.delete(jobId);
    }
  };

  const handleJobClick = (jobId) => {
    const job = allJobs.find(j => j.id === jobId);
    if (job) {
      recordJobView(job);
    }
  };

  const handleApplyJob = (job) => {
    if (!job) return;
    setApplyModal({ job });
  };

  const confirmApply = async () => {
    // Check if already submitting
    if (isSubmitting) {
      setErrorModal({
        show: true,
        message: 'Đang xử lý, vui lòng đợi...'
      });
      return;
    }

    try {
      // Get CV info from candidate profile
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub;

      if (!userId) {
        setErrorModal({
          show: true,
          message: 'Vui lòng đăng nhập để ứng tuyển'
        });
        return;
      }

      // Get CV list
      const { getCVInfo } = await import('../../services/cvUploadService');
      const cvData = await getCVInfo(userId);

      if (!cvData || !cvData.cvList || cvData.cvList.length === 0) {
        setErrorModal({
          show: true,
          message: 'Bạn chưa có CV. Vui lòng tải CV lên trong phần Hồ sơ trước khi ứng tuyển.'
        });
        return;
      }

      // Set CV list and show selection modal
      setCandidateCVList(cvData.cvList);
      setSelectedCV(null); // Reset selection
      setShowCVSelectionModal(true); // Show CV selection modal

    } catch (error) {
      console.error('Error loading CV:', error);
      setErrorModal({
        show: true,
        message: 'Không thể tải thông tin CV. Vui lòng thử lại.'
      });
    }
  };

  // Function to actually submit the application with selected CV
  const submitApplicationWithCV = async () => {
    if (!selectedCV) {
      setErrorModal({
        show: true,
        message: 'Vui lòng chọn CV để gửi'
      });
      return;
    }

    // Rate limiting: 30 seconds between applications
    const now = Date.now();
    const RATE_LIMIT_MS = 30 * 1000; // 30 seconds

    if (lastSubmitTime && (now - lastSubmitTime) < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000);
      setErrorModal({
        show: true,
        message: `Vui lòng đợi ${remainingSeconds} giây trước khi gửi CV tiếp theo`
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedCVData = candidateCVList.find(cv => cv.id === selectedCV);

      if (!selectedCVData) {
        throw new Error('CV không tồn tại');
      }

      const jobData = applyModal?.job;
      const isDatabaseJob = jobData?.isFromDynamoDB || jobData?.isQuickJob;
      if (!isDatabaseJob) {
        setIsSubmitting(false);
        setErrorModal({
          show: true,
          message: 'Chỉ hỗ trợ ứng tuyển cho công việc từ cơ sở dữ liệu.'
        });
        return;
      }

      // Submit application
      const applicationService = await import('../../services/applicationService');
      console.log('🔍 [Debug] Application Modal Job:', applyModal.job);
      console.log('🔍 [Debug] Candidate CV List:', candidateCVList);
      console.log('🔍 [Debug] Selected CV ID:', selectedCV);
      console.log('🔍 [Debug] Selected CV Data:', selectedCVData);

      const jobId = applyModal.job.idJob || applyModal.job.id;
      console.log('🔍 [Debug] Calculated Job ID:', jobId);

      if (!jobId) {
        setIsSubmitting(false);
        setErrorModal({
          show: true,
          message: language === 'vi' ? 'Không tìm thấy ID công việc' : 'Job ID not found'
        });
        return;
      }

      // Important: Support both cvUrl and cvS3Key (fallback if URL is missing)
      const finalCVUrl = selectedCVData.cvUrl || selectedCVData.cvS3Key;

      if (!selectedCVData || !finalCVUrl) {
         console.error('❌ [Debug] CV URL and S3 Key both missing!', selectedCVData);
         setIsSubmitting(false);
         setErrorModal({
           show: true,
           message: language === 'vi' ? 'Dữ liệu CV không hợp lệ. Vui lòng chọn lại CV.' : 'Invalid CV data. Please select your CV again.'
         });
         return;
      }

      console.log('📤 [Debug] Calling submitApplication with:', {
        jobId,
        cvUrl: finalCVUrl,
        cvFileName: selectedCVData.cvFileName || 'CV.pdf'
      });

      await applicationService.submitApplication(
        jobId,
        finalCVUrl,
        selectedCVData.cvFileName || 'CV.pdf'
      );

      try {
        const { createEmployerApplicationNotification } = await import('../../services/notificationService');
        const session = await fetchAuthSession();
        const candidateId = session.tokens?.idToken?.payload?.sub;
        const candidateEmail = session.tokens?.idToken?.payload?.email;
        const candidateName = candidateProfile?.fullName || candidateEmail || 'Ứng viên';
        const employerId = jobData?.employerId;

        if (employerId) {
          await createEmployerApplicationNotification({
            employerId,
            candidateId,
            candidateName,
            jobTitle: jobData?.title,
            companyName: jobData?.company,
            jobId,
            isQuickJob: jobData?.isQuickJob
          });
        } else {
          console.warn('⚠️ [JobListing] Missing employerId, skipping application notification');
        }
      } catch (notificationError) {
        console.error('❌ [JobListing] Failed to create application notification:', notificationError);
      }

      // Update last submit time
      setLastSubmitTime(now);

      // Close both modals
      setShowCVSelectionModal(false);
      setApplyModal(null);
      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 3000);
    } catch (error) {
      console.error('Error applying for job:', error);

      // Handle specific error codes from backend
      let errorMessage;

      // Consolidated error detection logic
      const isAlreadyApplied = error.errorCode === 'ALREADY_APPLIED' || 
                               error.statusCode === 409 || 
                               error.message.toLowerCase().includes('already applied') || 
                               error.message.includes('đã ứng tuyển') ||
                               error.message.includes('409');

      const isRateLimited = error.errorCode === 'RATE_LIMITED' || 
                            error.statusCode === 429 || 
                            error.message.includes('RATE_LIMITED') ||
                            error.message.includes('429');
      
      const isNoCV = error.statusCode === 404 || 
                     error.message.includes('No profile found') || 
                     error.message.includes('404');

      if (isAlreadyApplied) {
        errorMessage = language === 'vi' ? 'Bạn đã ứng tuyển công việc này rồi!' : 'You have already applied to this job!';
      } else if (isRateLimited) {
        errorMessage = language === 'vi' ? 'Bạn gửi CV quá nhanh! Vui lòng đợi 30 giây trước khi gửi tiếp.' : 'Sending too fast! Please wait 30 seconds.';
      } else if (isNoCV) {
        errorMessage = language === 'vi' ? 'Bạn chưa có CV. Vui lòng tải CV lên trong phần Hồ sơ trước khi ứng tuyển.' : 'No CV found. Please upload your CV in Profile first.';
      } else {
        // Fallback for demo jobs or generic errors
        const jobId = applyModal?.job?.idJob || applyModal?.job?.id;
        const isDemo = !applyModal?.job?.idJob || jobId?.toString().startsWith('mock') || jobId?.toString().startsWith('demo');
        
        if (isDemo) {
          errorMessage = language === 'vi' ? 'Không thể gửi, đây chỉ là công việc mẫu. Xin thông cảm ạ!' : 'Cannot submit, this is a demo job. Sorry!';
        } else {
          errorMessage = language === 'vi' ? (error.message || 'Có lỗi xảy ra khi nộp đơn. Vui lòng thử lại sau.') : (error.message || 'Error occurred. Please try again.');
        }
      }

      setErrorModal({
        show: true,
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFilter = (filterName) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Toggle filter handlers
  const toggleJobType = (type) => {
    setSelectedJobTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleSalaryRange = (range) => {
    setSelectedSalaryRanges(prev =>
      prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    );
  };

  const toggleCompany = (company) => {
    setSelectedCompanies(prev =>
      prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company]
    );
  };

  const clearAllFilters = () => {
    setSearchKeyword('');
    setSelectedLocation('');
    setSelectedJobTypes([]);
    setSelectedSalaryRanges([]);
    setSelectedCompanies([]);
    setQuickFilter('all');
  };

  // Helper functions for filtering
  const getSalaryValue = (salaryStr) => {
    const match = salaryStr.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
  };

  // Dynamic counts for filter options
  const filterCounts = useMemo(() => {
    // Base: category + keyword + location filters applied (same as filteredJobs before type/salary filters)
    let base = allJobs.filter(j => j.category === jobCategory);

    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase().trim();
      base = base.filter(j =>
        (j.title || '').toLowerCase().includes(kw) ||
        (j.company || '').toLowerCase().includes(kw) ||
        (j.tags || []).some(t => t.toLowerCase().includes(kw)) ||
        (j.location || '').toLowerCase().includes(kw)
      );
    }
    if (selectedLocation.trim()) {
      const loc = selectedLocation.toLowerCase().trim();
      base = base.filter(j => (j.location || '').toLowerCase().includes(loc));
    }

    const count = (fn) => base.filter(fn).length;
    return {
      fulltime: count(j => (j.type || '').toLowerCase().includes('full-time') || (j.type || '').toLowerCase().includes('toàn thời gian')),
      parttime: count(j => (j.type || '').toLowerCase().includes('part-time') || (j.type || '').toLowerCase().includes('bán thời gian')),
      morning: count(j => (j.type || '').toLowerCase().includes('sáng')),
      afternoon: count(j => (j.type || '').toLowerCase().includes('chiều')),
      night: count(j => (j.type || '').toLowerCase().includes('đêm')),
      hourly: count(j => (j.salary || '').toLowerCase().includes('giờ') || (j.salary || '').toLowerCase().includes('/h')),
      under25k: count(j => { const v = getSalaryValue(j.salary); return v > 0 && v < 25; }),
      '25to30k': count(j => { const v = getSalaryValue(j.salary); return v >= 25 && v < 30; }),
      '30to35k': count(j => { const v = getSalaryValue(j.salary); return v >= 30 && v <= 35; }),
      over35k: count(j => getSalaryValue(j.salary) > 35),
    };
  }, [allJobs, jobCategory, searchKeyword, selectedLocation]);

  const isInSalaryRange = (salary, range) => {
    const value = getSalaryValue(salary);
    switch (range) {
      case 'under-25k': return value > 0 && value < 25;
      case '25k-30k': return value >= 25 && value < 30;
      case '30k-35k': return value >= 30 && value <= 35;
      case 'over-35k': return value > 35;
      default: return true;
    }
  };

  // Get nearby jobs
  const nearbyJobs = useMemo(() => {
    if (!userLocation) return [];

    const jobsWithCoords = allJobs
      .filter(job => job.category === jobCategory)
      .filter(job => job.lat && job.lng); // Only include jobs with coordinates
    
    console.log(`📍 Jobs with coordinates in ${jobCategory}:`, jobsWithCoords.length);
    console.log(`📍 User location:`, userLocation);
    console.log(`📍 Nearby radius: ${nearbyRadius}km`);
    
    const nearby = jobsWithCoords
      .map(job => ({
        ...job,
        distance: calculateDistance(userLocation.lat, userLocation.lng, job.lat, job.lng)
      }))
      .filter(job => job.distance <= nearbyRadius)
      .sort((a, b) => a.distance - b.distance);
    
    console.log(`📍 Found ${nearby.length} jobs within ${nearbyRadius}km`);
    
    return nearby;
  }, [userLocation, jobCategory, nearbyRadius, allJobs]);

  // Advanced filtering with useMemo for performance
  const filteredJobs = useMemo(() => {
    let result = allJobs;

    // Filter by saved jobs only
    if (showSavedJobsOnly) {
      result = result.filter(job => savedJobs.includes(job.id));
      // Don't apply category filter for saved jobs
    } else {
      // For shift jobs
      if (jobCategory === 'shift') {
        // IMPORTANT: Only show shift jobs when work status is ON and location is enabled
        if (isAvailable && showNearbyJobs) {
          // Location enabled: only show jobs within radius (strict ≤3km)
          return nearbyJobs;
        }
        // If work status is OFF or location not enabled: hide all shift jobs
        return [];
      } else {
        result = result.filter(job => job.category === jobCategory);
      }
    }

    // Add distance if user location is available
    if (userLocation) {
      result = result.map(job => ({
        ...job,
        distance: calculateDistance(userLocation.lat, userLocation.lng, job.lat, job.lng)
      }));
    }

    // Search by keyword
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      result = result.filter(job =>
        (job.title || '').toLowerCase().includes(keyword) ||
        (job.company || '').toLowerCase().includes(keyword) ||
        (job.tags || []).some(tag => tag.toLowerCase().includes(keyword)) ||
        (job.location || '').toLowerCase().includes(keyword)
      );
    }

    // Filter by location
    if (selectedLocation.trim()) {
      const loc = selectedLocation.toLowerCase().trim();
      result = result.filter(job =>
        (job.location || '').toLowerCase().includes(loc)
      );
    }

    // Filter by job type
    if (selectedJobTypes.length > 0) {
      result = result.filter(job => {
        const t = (job.type || '').toLowerCase();
        return selectedJobTypes.some(type => {
          if (type === 'full-time') return t.includes('full-time') || t.includes('toàn thời gian');
          if (type === 'part-time') return t.includes('part-time') || t.includes('bán thời gian');
          return t.includes(type.toLowerCase());
        });
      });
    }

    // Filter by salary range
    if (selectedSalaryRanges.length > 0) {
      result = result.filter(job =>
        selectedSalaryRanges.some(range => isInSalaryRange(job.salary, range))
      );
    }

    // Filter by company
    if (selectedCompanies.length > 0) {
      result = result.filter(job =>
        selectedCompanies.includes(job.company)
      );
    }

    // Quick filters
    if (quickFilter === 'urgent') result = result.filter(job => job.urgent);
    if (quickFilter === 'featured') result = result.filter(job => job.featured);
    if (quickFilter === 'saved') result = result.filter(job => savedJobs.includes(job.id));

    // Sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'salary':
          return getSalaryValue(b.salary) - getSalaryValue(a.salary);
        case 'views':
          return b.views - a.views;
        case 'newest':
          // Sort by posted time (newer jobs first - smaller hours value = more recent)
          return parseTimeToHours(a.postedAt) - parseTimeToHours(b.postedAt);
        case 'relevant':
        default:
          return 0;
      }
    });

    return result;
  }, [jobCategory, searchKeyword, selectedLocation, selectedJobTypes,
    selectedSalaryRanges, selectedCompanies,
    quickFilter, savedJobs, sortBy, userLocation, showNearbyJobs, nearbyJobs, allJobs, showSavedJobsOnly]);

  const categoryJobs = allJobs.filter(job => job.category === jobCategory);

  // Calculate visible shift jobs count (only when work status + location are enabled)
  const visibleShiftJobsCount = useMemo(() => {
    if (isAvailable && showNearbyJobs) {
      return nearbyJobs.length;
    }
    return 0;
  }, [isAvailable, showNearbyJobs, nearbyJobs]);

  // ─── Verification gate: only blocks quick job apply (not the whole page) ─
  // verifStatus is used below when candidate tries to apply a quick job.
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout role="candidate" key={language}>
      <Container>
        {/* Hero Search Section */}
        <HeroSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <HeroContent>
            <HeroTitle>
              {showSavedJobsOnly
                ? (language === 'vi' ? 'Công việc đã lưu' : 'Saved Jobs')
                : jobCategory === 'standard'
                  ? (language === 'vi' ? 'Tìm công việc mơ ước của bạn ' : 'Find Your Dream Job ')
                  : (language === 'vi' ? 'Công việc Tuyển gấp ' : 'Shift Jobs - Hiring Now ')}
            </HeroTitle>
            <HeroSubtitle>
              {showSavedJobsOnly
                ? (language === 'vi'
                  ? `Bạn đang theo dõi ${filteredJobs.length} công việc đã lưu`
                  : `You are tracking ${filteredJobs.length} saved jobs`)
                : jobCategory === 'standard'
                  ? (language === 'vi'
                    ? `Hơn ${allJobs.filter(j => j.category === 'standard').length} công việc tiêu chuẩn đang chờ bạn khám phá`
                    : `Over ${allJobs.filter(j => j.category === 'standard').length} standard jobs waiting for you to explore`)
                  : (language === 'vi'
                    ? `${allJobs.filter(j => j.category === 'shift').length} công việc đang tuyển gấp, làm ngay hôm nay!`
                    : `${allJobs.filter(j => j.category === 'shift').length} shift jobs hiring urgently, start today!`)}
            </HeroSubtitle>

            <SearchContainer>
              <SearchInput>
                <Search />
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Tìm theo vị trí, công ty, kỹ năng...' : 'Search by position, company, skills...'}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      scrollToResults();
                    }
                  }}
                />
              </SearchInput>

              <SearchInput $narrow>
                <MapPin />
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Địa điểm' : 'Location'}
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      scrollToResults();
                    }
                  }}
                />
              </SearchInput>

              <SearchButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={scrollToResults}
              >
                <Search />
                {language === 'vi' ? 'Tìm kiếm' : 'Search'}
              </SearchButton>
            </SearchContainer>

            {/* Location-based search & Job Status - Only for shift jobs, not saved jobs */}
            {jobCategory === 'shift' && !showSavedJobsOnly && (
              <motion.div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {/* Job Search Status Toggle */}
                {!showSavedJobsOnly && (
                  <>
                    {/* Banner khi chưa được duyệt quick job */}
                    {jobCategory === 'shift' && !quickJobApproved && quickJobStatus !== null ? (
                      <div style={{
                        background: 'rgba(255,255,255,0.12)',
                        border: '1.5px solid rgba(255,255,255,0.25)',
                        borderRadius: 14,
                        padding: '14px 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 16, flexWrap: 'wrap'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                          </div>
                          <div>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
                              {quickJobStatus === 'SUBMITTED'
                                ? (language === 'vi' ? 'Yêu cầu đang chờ admin duyệt...' : 'Request pending admin review...')
                                : (language === 'vi' ? 'Để sử dụng công việc tuyển gấp' : 'To use quick jobs')}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
                              {quickJobStatus === 'SUBMITTED'
                                ? (language === 'vi' ? 'Thường mất 1–2 ngày làm việc.' : 'Usually 1–2 business days.')
                                : (language === 'vi' ? 'Nhấn vào đây để biết thêm chi tiết' : 'Click here to learn more')}
                            </div>
                          </div>
                        </div>
                        {quickJobStatus !== 'SUBMITTED' && (
                          <button
                            onClick={() => navigate('/candidate/quick-job-intro')}
                            style={{ padding: '9px 20px', background: 'white', color: '#1e40af', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                          >
                            {language === 'vi' ? 'Tìm hiểu ngay →' : 'Learn more →'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <StatusCard
                        $active={isAvailable}
                        as={motion.div}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="status-content">
                          <div className="status-info">
                            <div className="status-badge">
                              {isAvailable ? <CheckCircle /> : <XCircle />}
                              {isAvailable
                                ? (language === 'vi' ? 'Trạng thái tìm việc đang bật' : 'Job Search Active')
                                : (language === 'vi' ? 'Trạng thái tìm việc đang tắt' : 'Job Search Paused')}
                            </div>
                          </div>
                          <ToggleButton
                            onClick={handleToggleAvailability}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Power />
                            {isAvailable
                              ? (language === 'vi' ? 'Tắt' : 'Pause')
                              : (language === 'vi' ? 'Bật' : 'Activate')}
                          </ToggleButton>
                        </div>
                      </StatusCard>
                    )}
                  </>
                )}

                {/* Location button - Only show when job search is active AND quick job approved */}
                {isAvailable && quickJobApproved && (
                  <>
                    <LocationButton
                      $active={showNearbyJobs}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={getUserLocation}
                      disabled={isLoadingLocation}
                    >
                      {isLoadingLocation ? (
                        <>
                          <div className="spinner" />
                          {language === 'vi' ? 'Đang lấy vị trí...' : 'Getting location...'}
                        </>
                      ) : (
                        <>
                          <Navigation size={16} />
                          {showNearbyJobs
                            ? (language === 'vi' ? 'Vị trí đã bật' : 'Location Enabled')
                            : (language === 'vi' ? 'Tìm việc gần tôi' : 'Find Jobs Near Me')}
                        </>
                      )}
                    </LocationButton>

                    {showNearbyJobs && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        {language === 'vi'
                          ? `Tìm thấy ${nearbyJobs.length} việc làm trong bán kính ${nearbyRadius}km`
                          : `Found ${nearbyJobs.length} jobs within ${nearbyRadius}km radius`}
                      </motion.span>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </HeroContent>
        </HeroSection>

        {/* Category Tabs */}
        <CategoryTabs>
          <CategoryTab
            $active={jobCategory === 'standard' && !showSavedJobsOnly}
            onClick={() => {
              setJobCategory('standard');
              setQuickFilter('all');
              setShowSavedJobsOnly(false);
              navigate('/candidate/jobs?tab=standard');
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Briefcase />
            {language === 'vi' ? 'Công việc tiêu chuẩn' : 'Standard Jobs'}
            <span style={{ marginLeft: 'auto', fontSize: '14px', opacity: 0.9 }}>
              ({allJobs.filter(j => j.category === 'standard').length})
            </span>
          </CategoryTab>

          <CategoryTab
            $active={jobCategory === 'shift' && !showSavedJobsOnly}
            onClick={() => {
              setJobCategory('shift');
              setQuickFilter('all');
              setShowSavedJobsOnly(false);
              navigate('/candidate/jobs?tab=shift');
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap />
            {language === 'vi' ? 'Công việc Tuyển gấp' : 'Shift Jobs - Hiring Now'}
            <span style={{ marginLeft: 'auto', fontSize: '14px', opacity: 0.9 }}>
              ({visibleShiftJobsCount})
            </span>
          </CategoryTab>

          <CategoryTab
            $active={showSavedJobsOnly}
            onClick={() => {
              setShowSavedJobsOnly(true);
              navigate('/candidate/jobs?tab=saved');
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Bookmark />
            {language === 'vi' ? 'Công việc đã lưu' : 'Saved Jobs'}
            <span style={{ marginLeft: 'auto', fontSize: '14px', opacity: 0.9 }}>
              ({savedJobs.length})
            </span>
          </CategoryTab>
        </CategoryTabs>

        {/* Nearby Jobs Section - Hidden now, jobs shown in main list */}

        {/* Main Content with Filters */}
        <MainLayout>
          {/* Filter Sidebar */}
          <FilterSidebar
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FilterHeader>
              <h3>
                <SlidersHorizontal />
                {language === 'vi' ? 'Bộ lọc' : 'Filters'}
              </h3>
              <ClearButton onClick={clearAllFilters}>{language === 'vi' ? 'Xóa' : 'Clear'}</ClearButton>
            </FilterHeader>

            {jobCategory === 'standard' && (
              <FilterSection>
                <FilterTitle onClick={() => toggleFilter('jobType')} $expanded={expandedFilters.jobType}>
                  <h4>{language === 'vi' ? 'Loại hình công việc' : 'Job Type'}</h4>
                  <ChevronDown />
                </FilterTitle>
                {expandedFilters.jobType && (
                  <FilterOptions
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                  >
                    <FilterOption>
                      <input type="checkbox" id="fulltime"
                        checked={selectedJobTypes.includes('full-time')}
                        onChange={() => toggleJobType('full-time')} />
                      <span>{language === 'vi' ? 'Toàn thời gian' : 'Full-time'}</span>
                      <small>{filterCounts.fulltime}</small>
                    </FilterOption>
                    <FilterOption>
                      <input type="checkbox" id="parttime"
                        checked={selectedJobTypes.includes('part-time')}
                        onChange={() => toggleJobType('part-time')} />
                      <span>{language === 'vi' ? 'Bán thời gian' : 'Part-time'}</span>
                      <small>{filterCounts.parttime}</small>
                    </FilterOption>
                  </FilterOptions>
                )}
              </FilterSection>
            )}

            {jobCategory === 'shift' && (
              <FilterSection>
                <FilterTitle onClick={() => toggleFilter('jobType')} $expanded={expandedFilters.jobType}>
                  <h4>{language === 'vi' ? 'Loại ca làm việc' : 'Shift Type'}</h4>
                  <ChevronDown />
                </FilterTitle>
                {expandedFilters.jobType && (
                  <FilterOptions
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                  >
                    <FilterOption>
                      <input type="checkbox" id="morning"
                        checked={selectedJobTypes.includes('sáng')}
                        onChange={() => toggleJobType('sáng')} />
                      <span>{language === 'vi' ? '6h - 14h' : '6AM - 2PM'}</span>
                      <small>{filterCounts.morning}</small>
                    </FilterOption>
                    <FilterOption>
                      <input type="checkbox" id="afternoon"
                        checked={selectedJobTypes.includes('chiều')}
                        onChange={() => toggleJobType('chiều')} />
                      <span>{language === 'vi' ? '14h - 22h' : '2PM - 10PM'}</span>
                      <small>{filterCounts.afternoon}</small>
                    </FilterOption>
                    <FilterOption>
                      <input type="checkbox" id="night"
                        checked={selectedJobTypes.includes('đêm')}
                        onChange={() => toggleJobType('đêm')} />
                      <span>{language === 'vi' ? '22h - 6h' : '10PM - 6AM'}</span>
                      <small>{filterCounts.night}</small>
                    </FilterOption>
                  </FilterOptions>
                )}
              </FilterSection>
            )}

            <FilterSection>
              <FilterTitle onClick={() => toggleFilter('salary')} $expanded={expandedFilters.salary}>
                <h4>{language === 'vi' ? 'Thu nhập/giờ' : 'Hourly Rate'}</h4>
                <ChevronDown />
              </FilterTitle>
              {expandedFilters.salary && (
                <FilterOptions
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                >
                  <FilterOption>
                    <input type="checkbox" id="under-25k"
                      checked={selectedSalaryRanges.includes('under-25k')}
                      onChange={() => toggleSalaryRange('under-25k')} />
                    <span>{language === 'vi' ? 'Dưới 25.000đ/giờ' : 'Under 25k/hr'}</span>
                    <small>{filterCounts.under25k}</small>
                  </FilterOption>
                  <FilterOption>
                    <input type="checkbox" id="25k-30k"
                      checked={selectedSalaryRanges.includes('25k-30k')}
                      onChange={() => toggleSalaryRange('25k-30k')} />
                    <span>{language === 'vi' ? '25.000 – 30.000đ/giờ' : '25k – 30k/hr'}</span>
                    <small>{filterCounts['25to30k']}</small>
                  </FilterOption>
                  <FilterOption>
                    <input type="checkbox" id="30k-35k"
                      checked={selectedSalaryRanges.includes('30k-35k')}
                      onChange={() => toggleSalaryRange('30k-35k')} />
                    <span>{language === 'vi' ? '30.000 – 35.000đ/giờ' : '30k – 35k/hr'}</span>
                    <small>{filterCounts['30to35k']}</small>
                  </FilterOption>
                  <FilterOption>
                    <input type="checkbox" id="over-35k"
                      checked={selectedSalaryRanges.includes('over-35k')}
                      onChange={() => toggleSalaryRange('over-35k')} />
                    <span>{language === 'vi' ? 'Trên 35.000đ/giờ' : 'Over 35k/hr'}</span>
                    <small>{filterCounts.over35k}</small>
                  </FilterOption>
                </FilterOptions>
              )}
            </FilterSection>
          </FilterSidebar>

          {/* Jobs List */}
          <MainContent ref={resultsRef}>
            <ContentHeader>
              <ResultsInfo>
                <h2>
                  {showSavedJobsOnly
                    ? (language === 'vi' ? 'Công việc đã lưu' : 'Saved Jobs')
                    : jobCategory === 'standard'
                      ? (language === 'vi' ? 'Công việc tiêu chuẩn' : 'Standard Jobs')
                      : (language === 'vi' ? 'Công việc tuyển gấp' : 'Shift Jobs')}
                </h2>
                <p>{language === 'vi'
                  ? (showSavedJobsOnly
                    ? `Bạn đang theo dõi ${filteredJobs.length} công việc đã lưu`
                    : `Tìm thấy ${filteredJobs.length} công việc phù hợp`)
                  : (showSavedJobsOnly
                    ? `You are tracking ${filteredJobs.length} saved jobs`
                    : `Found ${filteredJobs.length} matching jobs`)}</p>
              </ResultsInfo>

              <ViewControls>
                <ReloadButton
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReloadJobs}
                  disabled={isReloading || isLoadingDynamoJobs}
                  title={language === 'vi' ? 'Làm mới danh sách công việc' : 'Reload job list'}
                >
                  <motion.div
                    animate={isReloading ? { rotate: 360 } : { rotate: 0 }}
                    transition={isReloading ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <RotateCw />
                  </motion.div>
                  {language === 'vi' ? 'Làm mới' : 'Reload'}
                </ReloadButton>

                <SortSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">{language === 'vi' ? 'Mới nhất' : 'Newest'}</option>
                  <option value="salary">{language === 'vi' ? 'Lương cao nhất' : 'Highest Salary'}</option>
                  <option value="relevant">{language === 'vi' ? 'Phù hợp nhất' : 'Most Relevant'}</option>
                </SortSelect>

                <ViewToggle>
                  <ViewButton
                    $active={viewMode === 'list'}
                    onClick={() => setViewMode('list')}
                  >
                    <List />
                  </ViewButton>
                  <ViewButton
                    $active={viewMode === 'grid'}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid />
                  </ViewButton>
                </ViewToggle>
              </ViewControls>
            </ContentHeader>

            {/* Banner Carousel */}
            <BoostBannerWrap
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              whileHover={{ y: -2 }}
            >
              <BoostTag>🔥Hot deal</BoostTag>
              <motion.img
                key={currentBannerIndex}
                initial={{ opacity: 0.8, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                src={banners[currentBannerIndex].src}
                alt={banners[currentBannerIndex].alt}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              <BannerDots>
                {banners.map((_, idx) => (
                  <BannerDot
                    key={idx}
                    $active={currentBannerIndex === idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentBannerIndex(idx);
                    }}
                  />
                ))}
              </BannerDots>
            </BoostBannerWrap>

            <JobsGrid>
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job, index) => (
                  <JobCardComponent
                    key={job.id}
                    job={job}
                    saved={savedJobs.includes(job.id)}
                    onSave={handleSaveJob}
                    onClick={handleJobClick}
                    onApply={handleApplyJob}
                    delay={index * 0.05}
                    showDistance={jobCategory === 'shift' && showNearbyJobs}
                    language={language}
                    isHighlighted={highlightedJobId === job.id}
                  />
                ))
              ) : isLoadingDynamoJobs ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', gridColumn: '1 / -1', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                    {language === 'vi' ? 'Đang tải công việc...' : 'Loading jobs...'}
                  </p>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '80px 20px',
                  gridColumn: '1 / -1',
                  color: '#6b7280'
                }}>
                  {showSavedJobsOnly ? (
                    <>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔖</div>
                      <p style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                        {language === 'vi' ? 'Bạn chưa lưu công việc nào' : "You haven't saved any jobs yet"}
                      </p>
                      <p style={{ fontSize: '15px', color: '#6b7280' }}>
                        {language === 'vi'
                          ? 'Nhấn vào biểu tượng lưu ở tin tuyển dụng mà bạn quan tâm để thêm vào danh sách.'
                          : 'Click the save icon on any job to add it here.'}
                      </p>
                    </>
                  ) : jobCategory === 'shift' && (!isAvailable || !showNearbyJobs) ? (
                    <>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                      <p style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                        {language === 'vi' ? 'Bật trạng thái làm việc và vị trí để tìm công việc' : 'Enable work status and location to see jobs'}
                      </p>
                      <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '20px' }}>
                        {language === 'vi'
                          ? !isAvailable 
                            ? 'Vui lòng bật trạng thái làm việc ở phía trên, sau đó nhấn "Tìm việc gần tôi" để tìm các công việc tuyển gấp trong bán kính 3km'
                            : 'Vui lòng nhấn nút "Tìm việc gần tôi" ở phía trên để tìm các công việc tuyển gấp trong bán kính 3km'
                          : !isAvailable
                            ? 'Please enable work status above, then click "Find Jobs Near Me" to see shift jobs within 3km radius'
                            : 'Click "Find Jobs Near Me" button above to see shift jobs within 3km radius'}
                      </p>
                    </>
                  ) : jobCategory === 'shift' && showNearbyJobs ? (
                    <>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                      <p style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                        {language === 'vi' ? 'Không tìm thấy công việc gần bạn' : 'No jobs found near you'}
                      </p>
                      <p style={{ fontSize: '15px', color: '#6b7280' }}>
                        {language === 'vi'
                          ? 'Không có công việc tuyển gấp trong bán kính 3km. Thử lại sau hoặc di chuyển đến khu vực khác.'
                          : 'No shift jobs within 3km radius. Try again later or move to another area.'}
                      </p>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                      <p style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                        {language === 'vi' ? 'Không tìm thấy công việc phù hợp' : 'No matching jobs found'}
                      </p>
                      <p style={{ fontSize: '15px', color: '#6b7280' }}>
                        {language === 'vi'
                          ? 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn'
                          : 'Try adjusting your filters or search keywords'}
                      </p>
                    </>
                  )}
                </div>
              )}
            </JobsGrid>
          </MainContent >
        </MainLayout >
      </Container >

      {/* Confirmation Modal */}
      < Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title=""
      >
        <ConfirmationContent $isActive={isAvailable}>
          <div className="icon-wrapper">
            {isAvailable ? <XCircle /> : <CheckCircle />}
          </div>
          <h3>
            {isAvailable
              ? (language === 'vi' ? 'Tắt tìm việc?' : 'Pause Job Search?')
              : (language === 'vi' ? 'Bật tìm việc?' : 'Activate Job Search?')}
          </h3>
          <p>
            {isAvailable
              ? (language === 'vi'
                ? 'Hồ sơ của bạn sẽ bị ẩn với nhà tuyển dụng và bạn sẽ không nhận được thông báo về cơ hội việc làm.'
                : 'Your profile will be hidden from employers and you will not receive job opportunity notifications.')
              : (language === 'vi'
                ? 'Hồ sơ của bạn sẽ hiển thị với nhà tuyển dụng và bạn sẽ nhận được thông báo về cơ hội việc làm phù hợp.'
                : 'Your profile will be visible to employers and you will receive notifications about suitable job opportunities.')}
          </p>
          <div className="button-group">
            <button className="cancel" onClick={() => setShowConfirmModal(false)}>
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button className="confirm" onClick={confirmToggle}>
              {isAvailable
                ? (language === 'vi' ? 'Tắt ngay' : 'Pause Now')
                : (language === 'vi' ? 'Bật ngay' : 'Activate Now')}
            </button>
          </div>
        </ConfirmationContent>
      </Modal >

      {/* Apply Confirmation Modal */}
      < Modal
        isOpen={!!applyModal}
        onClose={() => setApplyModal(null)}
        title=""
      >
        {applyModal && (
          <ApplyModalWrap onClick={e => e.stopPropagation()}>
            <div className="apply-emoji">📋</div>

            <h3>{language === 'vi' ? 'Xác nhận ứng tuyển' : 'Confirm Application'}</h3>

            <p className="apply-desc">
              {language === 'vi'
                ? <>Bạn muốn gửi CV ứng tuyển vào vị trí <strong><DynamicTranslate text={applyModal.job.title} showIndicator={false} /></strong> tại <strong><DynamicTranslate text={applyModal.job.company} showIndicator={false} /></strong>?</>
                : <>Send your CV for <strong><DynamicTranslate text={applyModal.job.title} showIndicator={false} /></strong> at <strong><DynamicTranslate text={applyModal.job.company} showIndicator={false} /></strong>?</>
              }
            </p>

            <div className="apply-info-card">
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Vị trí' : 'Position'}:</span>
                <span className="info-value"><DynamicTranslate text={applyModal.job.title} /></span>
              </div>
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Công ty' : 'Company'}:</span>
                <span className="info-value"><DynamicTranslate text={applyModal.job.company} /></span>
              </div>
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Địa điểm' : 'Location'}:</span>
                <span className="info-value"><DynamicTranslate text={applyModal.job.location} /></span>
              </div>
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Mức lương trung bình' : 'Average Salary'}:</span>
                <span className="info-value salary">{translateSalary(applyModal.job.category === 'shift' ? calculateShiftSalary(applyModal.job, language) : applyModal.job.salary, language)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Loại hình' : 'Type'}:</span>
                <span className="info-value">{translateJobType(applyModal.job.type, language)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Ngày đăng' : 'Posted'}:</span>
                <span className="info-value">
                  {applyModal.job.postedDate
                    ? formatPostedDate(applyModal.job.postedDate, language)
                    : applyModal.job.postedAt
                      ? translateTimePosted(applyModal.job.postedAt, language)
                      : '-'
                  }
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Ngày làm' : 'Work Date'}:</span>
                <span className="info-value">
                  {applyModal.job.workDate
                    ? (() => {
                      // Format workDate from YYYY-MM-DD to DD/MM/YYYY
                      try {
                        const [year, month, day] = applyModal.job.workDate.split('-');
                        return `${day}/${month}/${year}`;
                      } catch (e) {
                        return applyModal.job.workDate;
                      }
                    })()
                    : applyModal.job.workDays
                      ? applyModal.job.workDays
                      : applyModal.job.shiftDetails?.date
                        ? applyModal.job.shiftDetails.date
                        : (applyModal.job.urgent ? getUrgentJobWorkDate() : getStandardJobWorkDate())
                  }
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Thời gian' : 'Time'}:</span>
                <span className="info-value">
                  {applyModal.job.workHours || applyModal.job.shiftDetails?.time || applyModal.job.type?.match(/\((.*?)\)/)?.[1] || '-'}
                </span>
              </div>
            </div>

            <div className="apply-buttons" style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-cancel" onClick={() => setApplyModal(null)}>
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                className="btn-info"
                onClick={() => {
                  recordJobView(applyModal.job);
                  setJobDescriptionModal({ job: applyModal.job });
                }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
              >
                {language === 'vi' ? 'Xem mô tả' : 'View Description'}
              </button>
              <button className="btn-confirm" onClick={confirmApply}>
                {language === 'vi' ? 'Gửi CV ngay' : 'Send CV'}
              </button>
            </div>
          </ApplyModalWrap>
        )}
      </Modal >

      {/* Detail Modal */}
      < Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title=""
      >
        {detailModal && (
          <ApplyModalWrap onClick={e => e.stopPropagation()}>
            <div className="apply-emoji" style={{ fontSize: '40px' }}>💼</div>
            <h3><DynamicTranslate text={detailModal.job.title} /></h3>
            <p className="apply-desc" style={{ marginBottom: '10px' }}>
              <strong><DynamicTranslate text={detailModal.job.company} showIndicator={false} /></strong>
            </p>

            <div className="apply-info-card" style={{ marginBottom: '15px' }}>
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Địa điểm' : 'Location'}:</span>
                <span className="info-value"><DynamicTranslate text={detailModal.job.location} /></span>
              </div>
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Mức lương trung bình' : 'Average Salary'}:</span>
                <span className="info-value salary">{translateSalary(detailModal.job.category === 'shift' ? calculateShiftSalary(detailModal.job, language) : detailModal.job.salary, language)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Loại hình' : 'Type'}:</span>
                <span className="info-value">{detailModal.job.type}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Ngày đăng' : 'Posted at'}:</span>
                <span className="info-value">{detailModal.job.postedAt}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Ngày làm' : 'Date'}:</span>
                <span className="info-value">
                  {detailModal.job.shiftDetails?.date || (detailModal.job.urgent ? getUrgentJobWorkDate() : getStandardJobWorkDate())}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{language === 'vi' ? 'Thời gian' : 'Time'}:</span>
                <span className="info-value">
                  {detailModal.job.shiftDetails?.time || detailModal.job.type?.match(/\((.*?)\)/)?.[1] || '07:00 - 10:00'}
                </span>
              </div>
            </div>

            <div className="apply-buttons">
              <button className="btn-cancel" onClick={() => setDetailModal(null)}>
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
              <button className="btn-confirm" onClick={() => {
                setDetailModal(null);
                setApplyModal({ job: detailModal.job });
              }}>
                {language === 'vi' ? 'Ứng tuyển ngay' : 'Apply Now'}
              </button>
            </div>
          </ApplyModalWrap>
        )}
      </Modal >

      {/* Job Description Modal */}
      < Modal
        isOpen={!!jobDescriptionModal}
        onClose={() => setJobDescriptionModal(null)}
        title=""
      >
        {jobDescriptionModal && (
          <ApplyModalWrap onClick={e => e.stopPropagation()}>
            <div className="apply-emoji" style={{ fontSize: '40px' }}>📋</div>
            <h3>{language === 'vi' ? 'Mô tả công việc' : 'Job Description'}</h3>
            <p className="apply-desc" style={{ marginBottom: '10px' }}>
              <strong><DynamicTranslate text={jobDescriptionModal.job.title} showIndicator={false} /></strong> - <DynamicTranslate text={jobDescriptionModal.job.company} showIndicator={false} />
            </p>

            <div style={{ marginTop: '16px', padding: '24px', background: '#f3f4f6', borderRadius: '12px', border: '1px solid #e5e7eb', height: '300px', width: '100%', overflowY: 'auto' }}>
              <div style={{ fontSize: '15px', color: '#1f2937', lineHeight: '1.7', whiteSpace: 'pre-line', textAlign: 'left', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                {/* Mô tả công việc */}
                {jobDescriptionModal.job.description && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '10px', color: '#1e40af', letterSpacing: '0.5px' }}>
                      {language === 'vi' ? 'MÔ TẢ CÔNG VIỆC' : 'JOB DESCRIPTION'}
                    </div>
                    <DynamicTranslate text={jobDescriptionModal.job.description} as="div" style={{ color: '#4b5563', lineHeight: '1.8' }} />
                  </div>
                )}

                {/* Trách nhiệm */}
                {jobDescriptionModal.job.responsibilities && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '10px', color: '#1e40af', letterSpacing: '0.5px' }}>
                      {language === 'vi' ? 'TRÁCH NHIỆM' : 'RESPONSIBILITIES'}
                    </div>
                    <DynamicTranslate text={jobDescriptionModal.job.responsibilities} as="div" style={{ color: '#4b5563', lineHeight: '1.8' }} />
                  </div>
                )}

                {/* Yêu cầu */}
                {jobDescriptionModal.job.requirements && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '10px', color: '#1e40af', letterSpacing: '0.5px' }}>
                      {language === 'vi' ? 'YÊU CẦU' : 'REQUIREMENTS'}
                    </div>
                    <DynamicTranslate text={jobDescriptionModal.job.requirements} as="div" style={{ color: '#4b5563', lineHeight: '1.8' }} />
                  </div>
                )}


                {/* Fallback to generated description if no data */}
                {!jobDescriptionModal.job.description && !jobDescriptionModal.job.responsibilities &&
                  !jobDescriptionModal.job.requirements && !jobDescriptionModal.job.benefits && (
                    <div>
                      {/* MÔ TẢ header */}
                      <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '10px', color: '#1e40af', letterSpacing: '0.5px' }}>
                        {language === 'vi' ? 'MÔ TẢ' : 'DESCRIPTION'}
                      </div>
                      {(() => {
                        const lines = generateJobDescription(jobDescriptionModal.job, language).split('\n');
                        const benefitIdx = lines.findIndex(l => l.trim() === 'CHẾ ĐỘ PHÚC LỢI:' || l.trim() === 'BENEFITS:');
                        const visibleLines = benefitIdx >= 0 ? lines.slice(0, benefitIdx) : lines;
                        return visibleLines.map((line, index) => {
                          const isHeading = line.trim() === 'YÊU CẦU:' || line.trim() === 'REQUIREMENTS:';
                          if (isHeading) {
                            return <div key={index} style={{ fontWeight: '700', fontSize: '16px', marginTop: index > 0 ? '16px' : '0', marginBottom: '8px', color: '#1e40af', letterSpacing: '0.5px' }}>{line}</div>;
                          }
                          return <div key={index}>{line}</div>;
                        });
                      })()}
                    </div>
                  )}
              </div>
            </div>

            <div className="apply-buttons" style={{ marginTop: '16px' }}>
              <button className="btn-cancel" onClick={() => setJobDescriptionModal(null)} style={{ width: '100%' }}>
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </ApplyModalWrap>
        )}
      </Modal >

      {/* Apply Success Toast */}
      {
        applySuccess && (
          <div style={{
            position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
            background: '#10b981', color: 'white', padding: '14px 28px', borderRadius: '50px',
            fontWeight: '600', fontSize: '15px', zIndex: 9999,
            boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            {language === 'vi' ? 'Gửi CV thành công! Nhà tuyển dụng sẽ liên hệ sớm.' : 'CV sent! The employer will contact you soon.'}
          </div>
        )
      }

      {/* CV Selection Modal */}
      <Modal
        isOpen={showCVSelectionModal}
        onClose={() => setShowCVSelectionModal(false)}
        title=""
      >
        <ApplyModalWrap onClick={e => e.stopPropagation()}>
          <div className="apply-emoji">📄</div>
          <h3>{language === 'vi' ? 'Chọn CV để gửi' : 'Select CV to Send'}</h3>
          <p className="apply-desc">
            {language === 'vi'
              ? 'Chọn 1 trong các CV của bạn để gửi cho nhà tuyển dụng'
              : 'Select one of your CVs to send to the employer'
            }
          </p>

          <CVSelectionSection>
            {candidateCVList.length > 0 ? (
              candidateCVList.map(cv => (
                <CVOption
                  key={cv.id}
                  $selected={selectedCV === cv.id}
                  onClick={() => setSelectedCV(cv.id)}
                >
                  <CVRadio $selected={selectedCV === cv.id} />
                  <CVOptionInfo>
                    <CVOptionName>📄 {cv.cvFileName}</CVOptionName>
                    <CVOptionDate>
                      {language === 'vi' ? 'Tải lên: ' : 'Uploaded: '}
                      {new Date(cv.cvUploadDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </CVOptionDate>
                  </CVOptionInfo>
                </CVOption>
              ))
            ) : (
              <NoCVMessage>
                ⚠️ {language === 'vi'
                  ? <>Bạn chưa có CV nào. <a href="/candidate/profile">Tải lên CV</a> để ứng tuyển.</>
                  : <>You don't have any CV. <a href="/candidate/profile">Upload CV</a> to apply.</>
                }
              </NoCVMessage>
            )}
          </CVSelectionSection>

          <div className="apply-buttons">
            <button
              className="btn-cancel"
              onClick={() => setShowCVSelectionModal(false)}
            >
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              className="btn-confirm"
              onClick={submitApplicationWithCV}
              disabled={!selectedCV || isSubmitting}
              style={{
                opacity: !selectedCV || isSubmitting ? 0.5 : 1,
                cursor: !selectedCV || isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting
                ? (language === 'vi' ? 'Đang gửi...' : 'Sending...')
                : (language === 'vi' ? 'Gửi CV ngay' : 'Send CV Now')
              }
            </button>
          </div>
        </ApplyModalWrap>
      </Modal>

      {/* Error Modal */}
      {
        errorModal.show && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => {
              setErrorModal({ show: false, message: '' });
              setApplyModal(null); // Close apply modal when clicking backdrop
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '40px',
                maxWidth: '480px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                textAlign: 'center',
                animation: 'slideIn 0.3s ease-out'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '40px'
              }}>
                ⚠️
              </div>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '16px',
                lineHeight: '1.4'
              }}>
                {errorModal.message}
              </h3>
              <button
                onClick={() => {
                  setErrorModal({ show: false, message: '' });
                  setApplyModal(null); // Close apply modal when clicking button
                }}
                style={{
                  marginTop: '24px',
                  padding: '14px 40px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                {language === 'vi' ? 'Đã hiểu' : 'Got It'}
              </button>
            </div>
          </div>
        )
      }

    </DashboardLayout >
  );
};

// Add keyframe animation for loading spinner
const GlobalStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    0% {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes highlightPulse {
    0% { 
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
      transform: scale(1);
    }
    30% { 
      box-shadow: 0 0 0 20px rgba(59, 130, 246, 0);
      transform: scale(1.02);
    }
    50% { 
      transform: scale(1.02);
    }
    100% { 
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
      transform: scale(1);
    }
  }
`;

// Inject global styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = GlobalStyles;
  document.head.appendChild(styleSheet);
}

// Job Card Component
const JobCardComponent = ({ job, saved, onSave, onClick, onApply, delay = 0, showDistance = false, language, isHighlighted }) => {
  const getCompanyInitial = (company) => {
    return company.charAt(0).toUpperCase();
  };

  return (
    <JobCardWrapper
      id={`job-card-${job.id}`}
      $highlighted={isHighlighted}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick(job.id)}
    >
      <JobCardHeader>
        <CompanyLogo>
          {getCompanyInitial(job.company)}
        </CompanyLogo>
        <JobInfo>
          <JobTitle>
            <DynamicTranslate text={job.title} showIndicator={false} />
          </JobTitle>
          <CompanyName>
            <Building2 />
            <DynamicTranslate text={job.company} showIndicator={false} />
          </CompanyName>
          <JobMeta>
            <MetaItem>
              <MapPin />
              <DynamicTranslate text={job.location} showIndicator={false} />
            </MetaItem>
            {showDistance && job.distance !== undefined && (
              <MetaItem style={{ color: '#10b981', fontWeight: '600' }}>
                <Target size={16} />
                {job.distance < 1
                  ? `${(job.distance * 1000).toFixed(0)}m`
                  : `${job.distance.toFixed(1)}km`}
              </MetaItem>
            )}
            <MetaItem>
              <Briefcase />
              {translateJobType(job.type, language)}
            </MetaItem>
            <MetaItem>
              <Eye />
              {job.views} {language === 'vi' ? 'lượt xem' : 'views'}
            </MetaItem>
          </JobMeta>
        </JobInfo>
        {job.urgent && (
          <div style={{ marginLeft: 'auto', alignSelf: 'flex-start' }}>
            <StatusBadge status="urgent" size="sm">{language === 'vi' ? 'Tuyển gấp' : 'Urgent'}</StatusBadge>
          </div>
        )}
      </JobCardHeader>

      <JobCardBody>
        <JobTags>
          {job.tags.filter(tag => !tag.match(/^Ca\s+(sáng|chiều|tối|đêm|trưa)/i)).map((tag, idx) => (
            <Tag key={idx}><DynamicTranslate text={tag} showIndicator={false} /></Tag>
          ))}
        </JobTags>

        <JobSalary>
          <span style={{ fontWeight: '500' }}>{language === 'vi' ? 'Thu nhập:' : 'Income:'}</span>
          <span>{translateSalary(job.category === 'shift' ? calculateShiftSalary(job, language) : job.salary, language)}</span>
        </JobSalary>
      </JobCardBody>

      <JobCardFooter>
        <JobPosted>
          <Clock />
          {translateTimePosted(job.postedAt, language)}
        </JobPosted>

        <JobActions>
          <ActionButton
            $primary
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onApply(job);
            }}
          >
            {language === 'vi' ? 'Ứng tuyển ngay' : 'Apply Now'}
            <ArrowUpRight />
          </ActionButton>

          {job.category !== 'shift' && (
            <SaveButton
              $saved={saved}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => onSave(job.id, e)}
            >
              <Bookmark />
            </SaveButton>
          )}
        </JobActions>
      </JobCardFooter>
    </JobCardWrapper>
  );
};

export default JobListing;
