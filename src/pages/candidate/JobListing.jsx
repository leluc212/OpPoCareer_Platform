import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import InterviewAvatarStage from '../../components/InterviewAvatarStage';
import {
  Search, MapPin, Briefcase, Clock, TrendingUp,
  ChevronDown, Building2, Bookmark, Eye, ArrowUpRight, Filter,
  X, SlidersHorizontal, Grid, List, Sparkles, Zap, Navigation, Target,
  Power, XCircle, AlertCircle, CheckCircle, RotateCw,
  Volume2, VolumeX, Mic, MicOff, ChevronRight, Calendar
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
import { getActiveBanners } from '../../services/bannerService';
import { getAuthHeaders } from '../../services/authHeaders';
import { requestInterviewMedia } from '../../services/interviewMediaService';
import * as applicationService from '../../services/applicationService';
import adminEmployerService from '../../services/adminEmployerService';

const CV_AI_API_BASE_URL =
  (import.meta.env.VITE_CV_AI_API_URL || '/api-cv-ai').replace(/\/$/, '');


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

const AiScreeningModalHeader = styled.div`
  background: linear-gradient(145deg, #3b0764 0%, #5b21b6 45%, #7c3aed 100%);
  padding: 28px 24px 32px;
  color: white;
  border-radius: 24px 24px 0 0;
  position: relative;
  overflow: hidden;
  text-align: center;

  /* Decorative blobs */
  &::before {
    content: '';
    position: absolute;
    top: -30px;
    right: -30px;
    width: 120px;
    height: 120px;
    background: rgba(255, 255, 255, 0.07);
    border-radius: 50%;
    pointer-events: none;
  }
  &::after {
    content: '';
    position: absolute;
    bottom: -20px;
    left: -20px;
    width: 90px;
    height: 90px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    pointer-events: none;
  }

  .sparkles-container {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.18);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 14px;
    border: 1.5px solid rgba(255, 255, 255, 0.3);
    color: #f5d0fe;
    backdrop-filter: blur(4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 1;
  }

  h2 {
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 6px 0;
    color: white;
    letter-spacing: -0.3px;
    position: relative;
    z-index: 1;
  }

  p {
    font-size: 13px;
    color: rgba(243, 232, 255, 0.85);
    margin: 0;
    font-weight: 500;
    position: relative;
    z-index: 1;
  }
`;

const AiScreeningContent = styled.div`
  padding: 28px 24px;
  text-align: center;
  max-height: 520px;
  overflow-y: auto;
  font-family: inherit;
  background: #f8f7ff;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #ddd6fe;
    border-radius: 99px;
  }
`;

const ScoreCircleWrap = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
  margin: 4px auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 4px 16px ${props => props.$color}33);

  .score-label {
    text-align: center;
    h4 {
      font-size: 40px;
      font-weight: 900;
      margin: 0;
      color: ${props => props.$color};
      line-height: 1;
      letter-spacing: -1px;
    }
    span {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
`;

const ResultBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  border-radius: 99px;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  background: ${props => props.$bgColor};
  color: ${props => props.$color};
  border: 1.5px solid ${props => props.$color}55;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px ${props => props.$color}22;
`;

const DetailCard = styled.div`
  background: white;
  border: 1.5px solid #ede9fe;
  border-left: 4px solid ${props => props.$iconColor || '#7c3aed'};
  border-radius: 14px;
  padding: 16px 18px;
  text-align: left;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(109, 40, 217, 0.06);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(109, 40, 217, 0.1);
  }

  h4 {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 10px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    
    svg {
      color: ${props => props.$iconColor || '#7c3aed'};
      flex-shrink: 0;
    }
  }

  p {
    font-size: 13.5px;
    color: #4b5563;
    line-height: 1.7;
    margin: 0;
  }

  ul {
    margin: 0;
    padding-left: 18px;
    font-size: 13.5px;
    color: #4b5563;
    line-height: 1.8;

    li {
      margin-bottom: 2px;
    }
  }
`;

const ChatArea = styled.div`
  height: 320px;
  overflow-y: auto;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
`;

const ChatBubble = styled.div`
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  align-self: ${props => props.$isMe ? 'flex-end' : 'flex-start'};
  background: ${props => props.$isMe ? 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)' : '#e2e8f0'};
  color: ${props => props.$isMe ? 'white' : '#1e293b'};
  border-bottom-right-radius: ${props => props.$isMe ? '2px' : '12px'};
  border-bottom-left-radius: ${props => props.$isMe ? '12px' : '2px'};
  animation: slideIn 0.2s ease-out;

  .time {
    display: block;
    font-size: 10px;
    color: ${props => props.$isMe ? 'rgba(255,255,255,0.7)' : '#64748b'};
    margin-top: 4px;
    text-align: right;
  }
`;

const ChatInputBar = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  input {
    flex: 1;
    padding: 12px 16px;
    border: 1.5px solid #cbd5e1;
    border-radius: 12px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: #7c3aed;
    }
  }

  button {
    padding: 12px 18px;
    background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14.5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.95;
    }
    
    &:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }
  }
`;

// Voice-only Interview UI
const voicePulseRing = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.5); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
`;

const voiceWave = keyframes`
  0%, 100% { height: 8px; }
  50% { height: 28px; }
`;

const VoiceInterviewArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  min-height: 340px;
  gap: 24px;
`;

const VoiceAvatarCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${props => props.$isSpeaking
    ? 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #a78bfa 100%)'
    : props.$isListening
      ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
      : 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background 0.4s ease;
  box-shadow: ${props => props.$isSpeaking
    ? '0 0 40px rgba(124, 58, 237, 0.4)'
    : props.$isListening
      ? '0 0 40px rgba(239, 68, 68, 0.4)'
      : '0 0 20px rgba(0,0,0,0.08)'};

  svg {
    color: white;
    z-index: 2;
  }

  &::before, &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid ${props => props.$isSpeaking
    ? 'rgba(124, 58, 237, 0.5)'
    : props.$isListening
      ? 'rgba(239, 68, 68, 0.5)'
      : 'transparent'};
    animation: ${props => (props.$isSpeaking || props.$isListening)
    ? css`${voicePulseRing} 2s ease-out infinite`
    : 'none'};
  }

  &::after {
    animation-delay: 0.6s;
  }
`;

const InterviewAvatarVideoFrame = styled.div`
  width: min(240px, 76vw);
  aspect-ratio: 3 / 4;
  border-radius: 22px;
  overflow: hidden;
  position: relative;
  background: #0f172a;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.24);
  outline: ${props => props.$isListening ? '3px solid rgba(239, 68, 68, 0.42)' : '1px solid rgba(148, 163, 184, 0.35)'};
  transition: outline-color 0.2s ease, box-shadow 0.2s ease;

  video {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    background: #0f172a;
  }

  @media (max-width: 480px) {
    width: min(210px, 72vw);
    border-radius: 18px;
  }
`;

const VoiceStatusText = styled.div`
  text-align: center;

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 6px 0;
  }

  p {
    font-size: 13.5px;
    color: #64748b;
    margin: 0;
    font-weight: 500;
  }
`;

const VoiceWaveformBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;

  span {
    display: inline-block;
    width: 4px;
    border-radius: 4px;
    background: ${props => props.$color || '#7c3aed'};
    animation: ${props => props.$active ? css`${voiceWave} 0.8s ease-in-out infinite` : 'none'};
    height: 8px;
    transition: height 0.2s;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.1s; }
    &:nth-child(3) { animation-delay: 0.2s; }
    &:nth-child(4) { animation-delay: 0.3s; }
    &:nth-child(5) { animation-delay: 0.15s; }
    &:nth-child(6) { animation-delay: 0.25s; }
    &:nth-child(7) { animation-delay: 0.05s; }
  }
`;

const VoiceMicMainButton = styled.button`
  && {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: none;
    background: ${props => props.$isListening
    ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
    : 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)'};
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: ${props => props.$isListening
    ? '0 8px 30px rgba(239, 68, 68, 0.4)'
    : '0 8px 30px rgba(124, 58, 237, 0.3)'};
    animation: ${props => props.$isListening ? css`${pulse} 1.5s infinite ease-in-out` : 'none'};

    &:hover:not(:disabled) {
      transform: scale(1.08);
      box-shadow: ${props => props.$isListening
    ? '0 12px 40px rgba(239, 68, 68, 0.5)'
    : '0 12px 40px rgba(124, 58, 237, 0.4)'};
    }

    &:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
      opacity: 0.6;
      box-shadow: none;
    }
  }
`;

const VoiceQuestionCounter = styled.div`
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { transform: scale(1.08); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;

const MicButton = styled.button`
  && {
    padding: 12px;
    background: ${props => props.$isListening ? '#ef4444' : '#e2e8f0'};
    color: ${props => props.$isListening ? 'white' : '#475569'};
    border: none;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    animation: ${props => props.$isListening ? css`${pulse} 1.5s infinite ease-in-out` : 'none'};
    width: 46px;
    height: 46px;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      background: ${props => props.$isListening ? '#dc2626' : '#cbd5e1'};
      transform: scale(1.04);
    }
    
    &:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
      opacity: 0.6;
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

const AiBadge = styled.span`
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #6d28d9;
  border: 1px solid #c084fc;
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 6px rgba(109, 40, 217, 0.1);
  margin-left: 6px;
  flex-shrink: 0;
  
  svg {
    width: 12px;
    height: 12px;
    color: #7c3aed;
  }
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
const formatSalaryFromDB = (raw, fallback = 'Thỏa thuận', unit = 'hour') => {
  if (!raw && raw !== 0) return fallback;
  const str = String(raw).trim();
  if (str.includes('VNĐ') || str.includes('VND') || str.includes('đ')) return str;
  const num = parseInt(str.replace(/\D/g, ''), 10);
  if (isNaN(num) || num === 0) return fallback;
  // fallback already has language context from caller
  const isEn = fallback === 'Negotiable';
  if (unit === 'month') {
    return isEn ? `${num.toLocaleString('vi-VN')} VNĐ/month` : `${num.toLocaleString('vi-VN')} VNĐ/tháng`;
  }
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
};

// Translate time indicators
const translateTimePosted = (timeStr, language) => {
  if (language === 'vi') return timeStr;
  return timeStr
    .replace(/(\d+)\s*ngày trước/g, '1 days ago')
    .replace(/(\d+)\s*giờ trước/g, '1 hours ago')
    .replace(/(\d+)\s*phút trước/g, '1 minutes ago')
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

  const match = String(timeStr).match(/(\d+)/);
  if (!match) return 999999;

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

  // Remove Part-time suffix
  cleanTitle = cleanTitle.replace(/\s*-\s*(Part-time)\s*$/i, '');

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

  // If already Part-time, keep it
  if (typeStr.includes('Part-time')) {
    return typeStr;
  }

  // For English translation
  if (language === 'en') {
    return typeStr
      .replace(/Part-time/g, 'Part-time');
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

    return 'standard';
  }); // 'standard' or 'shift'
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [dynamoDBJobs, setDynamoDBJobs] = useState([]);
  const [quickJobs, setQuickJobs] = useState([]);
  const [isLoadingDynamoJobs, setIsLoadingDynamoJobs] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [employerLogos, setEmployerLogos] = useState({});

  useEffect(() => {
    let cancelled = false;
    adminEmployerService.getAllEmployers()
      .then(employers => {
        if (cancelled) return;
        const logos = employers.reduce((acc, emp) => {
          if (emp.userId && emp.companyLogo) acc[emp.userId] = emp.companyLogo;
          return acc;
        }, {});
        setEmployerLogos(logos);
      })
      .catch(err => console.error('Error fetching employer logos:', err));
    return () => { cancelled = true; };
  }, []);

  // AI Screening & Interview states
  const [pendingApplication, setPendingApplication] = useState(null);
  const [showAiScreeningModal, setShowAiScreeningModal] = useState(false);
  const [aiScreeningJob, setAiScreeningJob] = useState(null);
  const [aiScreeningCvName, setAiScreeningCvName] = useState('');
  const [aiScreeningStep, setAiScreeningStep] = useState('screening'); // 'screening' | 'interview'
  const [aiScreeningLoading, setAiScreeningLoading] = useState(false);
  const [aiScreeningScore, setAiScreeningScore] = useState(0);
  const [aiScreeningResult, setAiScreeningResult] = useState('review'); // 'pass' | 'review' | 'fail'
  const [aiScreeningStrengths, setAiScreeningStrengths] = useState([]);
  const [aiScreeningWeaknesses, setAiScreeningWeaknesses] = useState([]);
  const [aiScreeningReason, setAiScreeningReason] = useState('');
  const [aiScreeningError, setAiScreeningError] = useState('');
  const [isAiMockMode, setIsAiMockMode] = useState(false);
  const [showAiRulesModal, setShowAiRulesModal] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarningOverlay, setShowTabWarningOverlay] = useState(false);

  // Interview states
  const [interviewSessionId, setInterviewSessionId] = useState(null);
  const [interviewMessages, setInterviewMessages] = useState([]);
  const [interviewSending, setInterviewSending] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);
  const [interviewReport, setInterviewReport] = useState(null);
  const [interviewInputText, setInterviewInputText] = useState('');
  const [interviewQuestionCount, setInterviewQuestionCount] = useState(0);
  const [interviewMediaByTurn, setInterviewMediaByTurn] = useState({});

  // Voice Interaction states & refs
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const autoSendTimerRef = useRef(null);
  const isExitingFullscreenRef = useRef(false);

  const speakVietnamese = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Clean text from emojis
    const cleanText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'vi-VN';

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes('vi-VN') || v.lang === 'vi');
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Wrap speak in setTimeout to work around Chrome SpeechSynthesis bugs after cancel()
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  }, []);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'vi'
        ? 'Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng dùng Google Chrome, Safari hoặc Microsoft Edge.'
        : 'Your browser does not support speech recognition. Please use Google Chrome, Safari, or Microsoft Edge.');
      return;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'vi-VN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let accumulatedText = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          accumulatedText += event.results[i][0].transcript + ' ';
        }
      }
      if (accumulatedText.trim()) {
        const text = accumulatedText.trim();
        setInterviewInputText(prev => {
          const current = prev.trim();
          return current ? `${current} ${text}` : text;
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.error('Recognition start error:', err);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const playInterviewQuestion = useCallback(async (questionText, turnIndex, sessionId = interviewSessionId) => {
    const trimmedQuestion = String(questionText || '').trim();
    if (!trimmedQuestion) return null;

    if (!sessionId || sessionId === 'mock-session-id') {
      speakVietnamese(trimmedQuestion);
      return null;
    }

    setInterviewMediaByTurn(prev => ({
      ...prev,
      [turnIndex]: {
        ...(prev[turnIndex] || {}),
        status: 'loading',
        provider: 'sadtalker',
        videoUrl: null,
        audioUrl: null,
      },
    }));

    const media = await requestInterviewMedia({
      sessionId,
      questionText: trimmedQuestion,
      turnIndex,
      language,
      voice: language === 'vi' ? 'vi-VN' : 'en-US',
    });

    setInterviewMediaByTurn(prev => ({
      ...prev,
      [turnIndex]: media,
    }));

    if (!(media?.status === 'ready' && media?.videoUrl)) {
      speakVietnamese(trimmedQuestion);
    }

    return media;
  }, [interviewSessionId, language, speakVietnamese]);

  // Exit fullscreen helper
  const exitFullscreenMode = () => {
    try {
      isExitingFullscreenRef.current = true;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (document.webkitFullscreenElement) {
        document.webkitExitFullscreen();
      } else if (document.msFullscreenElement) {
        document.msExitFullscreen();
      }
      // Reset flag after a short delay to allow event to fire
      setTimeout(() => { isExitingFullscreenRef.current = false; }, 500);
    } catch (e) {
      isExitingFullscreenRef.current = false;
      console.warn('Exit fullscreen error:', e);
    }
  };

  const handleDisqualifyCandidate = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setIsSpeaking(false);

    // Ban for 3 days (Disabled for testing)
    // const banDuration = 3 * 24 * 60 * 60 * 1000; // 3 days in ms
    // localStorage.setItem('ai_interview_ban_until', String(Date.now() + banDuration));

    // Exit fullscreen
    exitFullscreenMode();

    // Close modals
    setShowAiScreeningModal(false);
    setShowTabWarningOverlay(false);
    setPendingApplication(null);

    // Show ban error modal (updated message to show ban is disabled)
    setErrorModal({
      show: true,
      message: language === 'vi'
        ? 'Bạn đã bị huỷ phỏng vấn do chuyển tab/thoát màn hình lần thứ 2! (Tính năng khóa 3 ngày đã được tắt để dễ test)'
        : 'Your interview has been cancelled due to tab switching! (3-day ban disabled for testing)'
    });
  };

  // Visibility and Anti-cheat Monitoring Hook
  useEffect(() => {
    if (!showAiScreeningModal || aiScreeningStep !== 'interview' || interviewFinished) {
      setTabSwitchCount(0);
      setShowTabWarningOverlay(false);
      return;
    }

    const handleViolation = () => {
      // Avoid double triggering while warning overlay is active
      if (showTabWarningOverlay) return;

      setTabSwitchCount(prev => {
        const nextCount = prev + 1;
        if (nextCount === 1) {
          setShowTabWarningOverlay(true);
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
        } else if (nextCount >= 2) {
          handleDisqualifyCandidate();
        }
        return nextCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleViolation();
      }
    };

    const handleWindowBlur = () => {
      handleViolation();
    };

    const handlePreventCopyPaste = (e) => {
      e.preventDefault();
      alert(language === 'vi'
        ? '⚠️ Tính năng sao chép/dán bị vô hiệu hóa trong lúc phỏng vấn!'
        : '⚠️ Copy and paste is disabled during the interview!');
    };

    const handlePreventRightClick = (e) => {
      e.preventDefault();
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ''; // Standard confirmation popup
    };

    // Block browser back button during interview
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      // Push state again to prevent navigation
      window.history.pushState(null, '', window.location.href);
      handleViolation();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('copy', handlePreventCopyPaste);
    document.addEventListener('paste', handlePreventCopyPaste);
    document.addEventListener('contextmenu', handlePreventRightClick);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Detect fullscreen exit (Escape key) as violation
    const handleFullscreenChange = () => {
      // Skip if we're programmatically exiting fullscreen (e.g., interview ended)
      if (isExitingFullscreenRef.current) return;
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        handleViolation();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('copy', handlePreventCopyPaste);
      document.removeEventListener('paste', handlePreventCopyPaste);
      document.removeEventListener('contextmenu', handlePreventRightClick);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [showAiScreeningModal, aiScreeningStep, interviewFinished, language, showTabWarningOverlay]);

  // Clean up speech on close
  useEffect(() => {
    if (!showAiScreeningModal) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setIsSpeaking(false);
      if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
    }
  }, [showAiScreeningModal]);

  const chatEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const uploadInterviewAudio = async (audioBlob) => {
    try {
      console.log('🎙️ Requesting presigned URL for interview audio...');

      const headers = await getAuthHeaders();
      // 1. Ask the backend for a presigned PUT URL (small JSON request).
      const presignResp = await fetch(`${CV_AI_API_BASE_URL}/api/v1/interview/audio-upload-url`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: interviewSessionId || 'sess_mock',
          content_type: 'audio/webm'
        })
      });

      if (!presignResp.ok) {
        throw new Error(`Presign server error: ${presignResp.status}`);
      }

      const presign = await presignResp.json();
      if (!presign.upload_url || !presign.s3_key) {
        throw new Error('Invalid presign response');
      }

      // 2. Upload the audio directly to S3 using the presigned PUT URL.
      //    This bypasses the API Gateway/Lambda payload size limit, so long
      //    interviews upload reliably. No auth headers here — the URL is signed.
      const putResp = await fetch(presign.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': presign.content_type || 'audio/webm' },
        body: audioBlob
      });

      if (!putResp.ok) {
        throw new Error(`S3 upload error: ${putResp.status}`);
      }

      console.log('✅ Audio uploaded directly to S3:', presign.s3_key);
      return { url: presign.url, s3_key: presign.s3_key };
    } catch (err) {
      console.error('❌ Error uploading audio:', err);
      return null;
    }
  };

  const startAudioRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('⚠️ getUserMedia not supported in this browser');
        return;
      }

      console.log('🎙️ Requesting microphone stream...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let options = { mimeType: 'audio/webm', audioBitsPerSecond: 32000 };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/ogg', audioBitsPerSecond: 32000 };
      }

      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      console.log('🎙️ Continuous interview audio recording started');
    } catch (err) {
      console.warn('⚠️ Could not start audio recording:', err);
    }
  };

  const stopAudioRecordingAndUpload = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      return new Promise((resolve) => {
        mediaRecorderRef.current.onstop = async () => {
          console.log('🎙️ Stopped recording audio');

          try {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          } catch (e) {
            console.error('Error stopping tracks:', e);
          }

          if (audioChunksRef.current.length === 0) {
            console.warn('⚠️ No audio chunks recorded');
            resolve(null);
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('🎙️ Interview audio blob created, size:', audioBlob.size);

          try {
            const uploadResult = await uploadInterviewAudio(audioBlob);
            resolve(uploadResult);
          } catch (err) {
            console.error('Error in onstop upload:', err);
            resolve(null);
          }
        };

        mediaRecorderRef.current.stop();
      });
    }
    return null;
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [interviewMessages]);

  const getResultInfo = () => {
    switch (aiScreeningResult.toLowerCase()) {
      case 'pass':
        return {
          color: '#10b981',
          bgColor: '#d1fae5',
          text: language === 'vi' ? 'Đạt yêu cầu' : 'Qualified'
        };
      case 'fail':
        return {
          color: '#ef4444',
          bgColor: '#fee2e2',
          text: language === 'vi' ? 'Chưa phù hợp' : 'Unsuitable'
        };
      case 'review':
      default:
        return {
          color: '#f59e0b',
          bgColor: '#fef3c7',
          text: language === 'vi' ? 'Cần xem xét thêm' : 'Under Review'
        };
    }
  };

  const { color: resultColor, bgColor: resultBgColor, text: resultText } = getResultInfo();

  const getCvText = (job) => {
    return `
Họ tên: ${candidateProfile?.fullName || 'Ứng viên'}
Vị trí mong muốn: ${job?.title || ''}
Kinh nghiệm làm việc: ${candidateProfile?.experience || 'Đã có kinh nghiệm làm việc ở vị trí tương đương.'}
Học vấn: ${candidateProfile?.education || 'Chưa cập nhật'}
Kỹ năng: ${candidateProfile?.skills && candidateProfile.skills.length > 0 ? candidateProfile.skills.join(', ') : 'Nhanh nhẹn, chăm chỉ, có trách nhiệm'}
Giới thiệu bản thân: ${candidateProfile?.bio || 'Chưa cập nhật'}
`.trim();
  };

  const runAiScreening = async (job, cvFileName, cvUrl = null, cvS3Key = null) => {
    setAiScreeningLoading(true);
    setAiScreeningError('');
    setAiScreeningScore(0);
    setAiScreeningResult('review');
    setAiScreeningStrengths([]);
    setAiScreeningWeaknesses([]);
    setAiScreeningReason('');

    let finalScore = 0;
    let finalResult = 'review';
    let finalStrengths = [];
    let finalWeaknesses = [];
    let finalReason = '';

    try {
      const cvText = getCvText(job);

      const jdText = `
Tiêu đề công việc: ${job.title}
Mô tả công việc: ${job.description}
Yêu cầu: ${job.requirements || "Có kinh nghiệm tương đương."}
Nhiệm vụ: ${job.responsibilities || "Hoàn thành các công việc được giao."}
`;

      const headers = await getAuthHeaders();
      const response = await fetch(`${CV_AI_API_BASE_URL}/api/v1/cv/screen`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          job_description: jdText,
          cv_text: cvText,
          cv_url: cvUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }

      const data = await response.json();
      finalScore = data.score || 0;
      finalResult = data.result || 'review';
      finalStrengths = data.strengths || [];
      finalWeaknesses = data.weaknesses || [];
      finalReason = data.reason || '';

      setAiScreeningScore(finalScore);
      setAiScreeningResult(finalResult);
      setAiScreeningStrengths(finalStrengths);
      setAiScreeningWeaknesses(finalWeaknesses);
      setAiScreeningReason(finalReason);
      setIsAiMockMode(false);

      // Send notification to candidate if CV passed round 1
      if ((data.result || 'review') === 'pass') {
        try {
          const { createCandidateAiScreeningPassedNotification } = await import('../../services/notificationService');
          const { fetchAuthSession } = await import('aws-amplify/auth');
          const session = await fetchAuthSession();
          const candidateId = session.tokens?.idToken?.payload?.sub;
          if (candidateId) {
            await createCandidateAiScreeningPassedNotification({
              candidateId,
              jobTitle: job.title,
              companyName: job.company,
              jobId: job.idJob || job.jobID || job.id,
              score: data.score
            });
          }
        } catch (notifErr) {
          console.error('Failed to send AI screening notification:', notifErr);
        }
      }
    } catch (e) {
      console.warn("Connection to FastAPI AI server failed. Falling back to frontend mock AI screening.", e);

      // Simulate network delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 1500));

      finalScore = Math.floor(Math.random() * 20) + 75; // Score between 75 and 94
      finalResult = 'pass';

      const isVi = language === 'vi';
      finalStrengths = [
        isVi ? `Có kỹ năng phù hợp với vị trí ${job.title}` : `Possesses suitable skills for the ${job.title} role`,
        isVi ? "Kinh nghiệm làm việc thực tế tốt" : "Good hands-on working experience",
        isVi ? "Thái độ tích cực, sẵn sàng làm việc" : "Positive attitude and ready to work"
      ];
      finalWeaknesses = [
        isVi ? "Cần thích nghi thêm với quy trình vận hành nội bộ" : "Needs to adapt to internal operating procedures"
      ];
      finalReason = isVi
        ? `Hồ sơ rất ấn tượng. Ứng viên có đầy đủ kiến thức nền tảng và các kỹ năng cần thiết cho công việc ${job.title} tại ${job.company}. Đề xuất tiến hành phỏng vấn trực tiếp.`
        : `Very impressive profile. The candidate has the necessary foundation and skills for the ${job.title} position at ${job.company}. Recommended to proceed to live interview.`;

      setAiScreeningScore(finalScore);
      setAiScreeningResult(finalResult);
      setAiScreeningStrengths(finalStrengths);
      setAiScreeningWeaknesses(finalWeaknesses);
      setAiScreeningReason(finalReason);
      setIsAiMockMode(true);
    }

    // Submit the application only if the candidate PASSED Round 1 (AI CV screening).
    // If the AI marks the CV as 'fail', do NOT create the application or notify the
    // employer — the CV must not be sent.
    if (finalResult === 'fail') {
      console.log('🚫 CV failed AI Round 1 screening — application not submitted, employer not notified.');
      setAiScreeningLoading(false);
      return;
    }

    // Submit the application immediately in pending status
    try {
      const extraFields = {
        aiScreeningScore: finalScore,
        aiScreeningResult: finalResult,
        aiScreeningReason: finalReason,
        aiScreeningStrengths: finalStrengths,
        aiScreeningWeaknesses: finalWeaknesses
      };

      console.log('📤 Submitting CV screening application to database...');
      const submittedApp = await applicationService.submitApplication(
        job.idJob || job.id,
        cvUrl,
        cvFileName,
        cvS3Key,
        extraFields
      );

      if (submittedApp) {
        const appData = submittedApp.application || submittedApp;
        const appId = submittedApp.applicationId || appData.applicationId;

        // Add to candidateApplications state
        setCandidateApplications(prev => [...prev, appData]);
        // Update the pendingApplication's applicationId
        setPendingApplication(prev => prev ? { ...prev, applicationId: appId } : null);
        console.log('✅ Application saved to DynamoDB with ID:', appId);

        // Send in-app notification to Employer about the new application
        try {
          const { createEmployerApplicationNotification } = await import('../../services/notificationService');
          const session = await fetchAuthSession();
          const candidateId = session.tokens?.idToken?.payload?.sub;
          const candidateEmail = session.tokens?.idToken?.payload?.email;
          const candidateName = candidateProfile?.fullName || candidateEmail || 'Ứng viên';
          const employerId = job?.employerId;

          if (employerId) {
            await createEmployerApplicationNotification({
              employerId,
              candidateId,
              candidateName,
              jobTitle: job?.title,
              companyName: job?.company,
              jobId: job?.idJob || job?.id,
              isQuickJob: false
            });
            console.log('✅ Sent application in-app notification to employer:', employerId);
          }
        } catch (notifErr) {
          console.error('❌ Failed to send application notification:', notifErr);
        }
      }
    } catch (submitErr) {
      console.error('❌ Failed to submit CV screening application to DB:', submitErr);
      setAiScreeningError(language === 'vi' ? 'Không thể lưu hồ sơ vào cơ sở dữ liệu. Vui lòng thử lại.' : 'Failed to save application to database. Please try again.');
    } finally {
      setAiScreeningLoading(false);
    }
  };

  const startInterviewSession = async (job, cvUrl = null) => {
    setAiScreeningLoading(true);
    setAiScreeningError('');
    setInterviewFinished(false);
    setInterviewReport(null);
    setInterviewMessages([]);
    setInterviewSessionId(null);
    setInterviewQuestionCount(1);
    setInterviewMediaByTurn({});

    try {
      if (isAiMockMode) {
        throw new Error("Local offline/demo mode");
      }

      const cvText = getCvText(job);

      const jdText = `
Tiêu đề công việc: ${job.title}
Mô tả công việc: ${job.description}
Yêu cầu: ${job.requirements || "Có kinh nghiệm tương đương."}
`;

      const headers = await getAuthHeaders();
      const response = await fetch(`${CV_AI_API_BASE_URL}/api/v1/interview/start`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          job_title: job.title,
          job_description: jdText,
          cv_text: cvText,
          cv_url: cvUrl,
          custom_questions: job.customQuestions || []
        })
      });

      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }

      const data = await response.json();
      setInterviewSessionId(data.session_id);
      const initialQuestion = data.question || "Chào bạn, hãy bắt đầu buổi phỏng vấn.";
      setInterviewMessages([{
        text: initialQuestion,
        isMe: false,
        time: new Date().toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
      playInterviewQuestion(initialQuestion, 1, data.session_id);
      startAudioRecording();
    } catch (e) {
      console.warn("Connection to FastAPI AI server failed. Falling back to frontend mock AI interview.", e);

      await new Promise(resolve => setTimeout(resolve, 1000));

      setInterviewSessionId("mock-session-id");
      const initialQuestion = language === 'vi'
        ? `Chào bạn, tôi là AI Interviewer. Cảm ơn bạn đã ứng tuyển vào vị trí ${job.title}. Bạn có thể tự giới thiệu ngắn gọn về bản thân và kinh nghiệm làm việc liên quan được không?`
        : `Hello, I'm the AI Interviewer. Thank you for applying for the ${job.title} role. Could you briefly introduce yourself and share your relevant work experience?`;

      setInterviewMessages([{
        text: initialQuestion,
        isMe: false,
        time: new Date().toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
      speakVietnamese(initialQuestion);
    } finally {
      setAiScreeningLoading(false);
    }
  };

  const getLatestAiQuestion = () => {
    if (!interviewMessages || interviewMessages.length === 0) return '';
    for (let i = interviewMessages.length - 1; i >= 0; i--) {
      if (!interviewMessages[i].isMe) {
        return interviewMessages[i].text;
      }
    }
    return '';
  };

  const handleReplayAiQuestion = () => {
    const questionText = getLatestAiQuestion();
    if (questionText) {
      speakVietnamese(questionText);
    }
  };

  const handleSendInterviewAnswer = async (textOverride = '') => {
    const text = (typeof textOverride === 'string' && textOverride.trim())
      ? textOverride.trim()
      : interviewInputText.trim();
    if (!text || interviewSending || !interviewSessionId) return;

    if (isListening) {
      stopListening();
    }

    // Stop any ongoing AI speaking
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    setInterviewInputText('');
    setInterviewSending(true);

    const timeStr = new Date().toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    setInterviewMessages(prev => [...prev, { text, isMe: true, time: timeStr }]);

    try {
      if (interviewSessionId === "mock-session-id") {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const nextTimeStr = new Date().toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });

        const isVi = language === 'vi';

        if (interviewQuestionCount === 1) {
          const nextQuestion = isVi
            ? "Cảm ơn bạn. Bạn có thể chia sẻ thêm về cách bạn giải quyết một tình huống khách hàng phàn nàn hoặc gặp khó khăn khi làm việc nhóm không?"
            : "Thank you. Could you share how you handle a customer complaint or a difficult situation when working in a team?";

          setInterviewMessages(prev => [...prev, {
            text: nextQuestion,
            isMe: false,
            time: nextTimeStr
          }]);
          setInterviewQuestionCount(2);
          speakVietnamese(nextQuestion);
        } else if (interviewQuestionCount === 2) {
          const nextQuestion = isVi
            ? "Tuyệt vời. Cuối cùng, bạn có mong muốn gì về mức lương hoặc chế độ đãi ngộ, và bạn có thể bắt đầu đi làm từ khi nào?"
            : "Great. Lastly, what are your expectations regarding salary or benefits, and when would you be available to start?";

          setInterviewMessages(prev => [...prev, {
            text: nextQuestion,
            isMe: false,
            time: nextTimeStr
          }]);
          setInterviewQuestionCount(3);
          speakVietnamese(nextQuestion);
        } else {
          setInterviewFinished(true);
          exitFullscreenMode();
          const score = Math.floor(Math.random() * 15) + 75; // Score 75-89
          const report = {
            total_score: score,
            recommend_to_employer: true,
            past_experience_score: score + (Math.random() > 0.5 ? 2 : -2),
            situation_handling_score: score + (Math.random() > 0.5 ? 3 : -3),
            operations_score: score + (Math.random() > 0.5 ? 1 : -1),
            custom_questions_score: score,
            reason: isVi
              ? `Ứng viên trả lời tự tin, mạch lạc. Có thái độ dịch vụ tốt, phù hợp với yêu cầu công việc tại ${aiScreeningJob?.company || 'công ty'}.`
              : `The candidate answered confidently and coherently. Shows good customer service attitude, matching the requirements of ${aiScreeningJob?.company || 'company'}.`,
            strengths: [
              isVi ? "Thái độ phục vụ khách hàng tốt" : "Good customer service mindset",
              isVi ? "Giao tiếp rõ ràng, tự tin" : "Clear and confident communication"
            ],
            weaknesses: [
              isVi ? "Cần làm quen với môi trường mới" : "Needs to adapt to a new environment"
            ]
          };

          setInterviewReport(report);
          let audioUploadResult = null;
          if (interviewSessionId !== "mock-session-id") {
            try {
              audioUploadResult = await stopAudioRecordingAndUpload();
            } catch (err) {
              console.error(err);
            }
          }
          submitDeferredApplication(report, audioUploadResult);

          const endingText = isVi
            ? "Cảm ơn bạn đã tham gia buổi phỏng vấn. Hệ thống đang tổng hợp kết quả của bạn..."
            : "Thank you for participating in the interview. The system is compiling your results...";
          setInterviewMessages(prev => [...prev, {
            text: endingText,
            isMe: false,
            time: nextTimeStr
          }]);
          speakVietnamese(endingText);
        }
        setInterviewSending(false);
        return;
      }

      const headers = await getAuthHeaders();
      const response = await fetch(`${CV_AI_API_BASE_URL}/api/v1/interview/respond`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: interviewSessionId,
          answer: text
        })
      });

      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }

      const data = await response.json();
      const nextTimeStr = new Date().toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      const finished = data.finished || false;

      if (finished) {
        setInterviewFinished(true);
        exitFullscreenMode();
        setInterviewReport(data.report);
        let audioUploadResult = null;
        try {
          audioUploadResult = await stopAudioRecordingAndUpload();
        } catch (err) {
          console.error(err);
        }
        submitDeferredApplication(data.report, audioUploadResult);
        const endingText = language === 'vi'
          ? "Cảm ơn bạn đã tham gia buổi phỏng vấn. Hệ thống đang tổng hợp kết quả của bạn..."
          : "Thank you for participating in the interview. The system is compiling your results...";
        setInterviewMessages(prev => [...prev, {
          text: endingText,
          isMe: false,
          time: nextTimeStr
        }]);
        speakVietnamese(endingText);
      } else {
        const nextQuestion = data.question || "";
        const nextTurnIndex = interviewQuestionCount + 1;
        setInterviewMessages(prev => [...prev, {
          text: nextQuestion,
          isMe: false,
          time: nextTimeStr
        }]);
        setInterviewQuestionCount(nextTurnIndex);
        playInterviewQuestion(nextQuestion, nextTurnIndex, interviewSessionId);
      }
    } catch (e) {
      console.error("Error sending AI interview answer:", e);
      setInterviewMessages(prev => [...prev, {
        text: language === 'vi'
          ? "⚠️ Lỗi: Không thể gửi câu trả lời đến AI. Vui lòng thử lại."
          : "⚠️ Error: Could not send your answer to the AI. Please try again.",
        isMe: false,
        time: timeStr
      }]);
    } finally {
      setInterviewSending(false);
    }
  };

  // Load jobs from DynamoDB
  const loadDynamoDBJobs = async () => {
    try {
      setIsLoadingDynamoJobs(true);
      console.log('📥 Loading jobs from DynamoDB for candidate view...');
      const jobs = await jobPostService.getAllActiveJobs();
      console.log('✅ Loaded DynamoDB jobs:', jobs);

      // Transform DynamoDB jobs to match JOBS_DATA format
      // Today's date (calendar date only, no time component)
      const todayOnly = new Date();
      todayOnly.setHours(0, 0, 0, 0);

      const transformedJobs = jobs
        .filter(job => job && job.idJob && job.title && job.salary) // Filter out invalid jobs and jobs without salary
        .filter(job => job.status !== 'deleted') // Filter out deleted jobs
        .filter(job => {
          // Hide jobs whose workDays (application deadline) has already passed
          if (!job.workDays) return true; // No deadline set → always show
          const deadline = new Date(job.workDays);
          deadline.setHours(0, 0, 0, 0);
          return deadline > todayOnly; // Hide on and after the work date
        })
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
              salary: formatSalaryFromDB(job.salary, language === 'vi' ? 'Thỏa thuận' : 'Negotiable', job.salaryUnit),
              type: (language === 'vi' ? 'Bán thời gian' : 'Part-time'),
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
              customFields: Array.isArray(job.customFields) ? job.customFields : [],
              workHours: String(job.workHours || ''),
              workDays: String(job.workDays || ''),
              status: String(job.status || 'active'),
              companyLogo: employerLogos[job.employerId] || null,
              isAiScreeningEnabled: !!job.isAiScreeningEnabled,
              customQuestions: job.customQuestions || [],
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

  // Whenever employerLogos updates, we must also update the logo on jobs
  useEffect(() => {
    if (Object.keys(employerLogos).length > 0) {
      setDynamoDBJobs(prev => prev.map(job => ({ ...job, companyLogo: employerLogos[job.employerId] || job.companyLogo })));
      setQuickJobs(prev => prev.map(job => ({ ...job, companyLogo: employerLogos[job.employerId] || job.companyLogo })));
    }
  }, [employerLogos]);

  // Load quick jobs from PostQuickJob table
  const loadQuickJobs = async () => {
    try {
      console.log('📥 Loading quick jobs from PostQuickJob table...');
      const jobs = await quickJobService.getAllActiveQuickJobs();
      console.log('✅ Loaded quick jobs:', jobs);

      // Transform quick jobs to match JOBS_DATA format
      const todayOnly = new Date();
      todayOnly.setHours(0, 0, 0, 0);

      const transformedQuickJobs = jobs
        .filter(job => job && (job.jobID || job.idJob) && job.title)
        .filter(job => job.status !== 'deleted') // Filter out deleted jobs
        .filter(job => {
          // Hide quick jobs whose workDate has already passed
          if (!job.workDate) return true; // No work date set → always show
          const workDay = new Date(job.workDate);
          workDay.setHours(0, 0, 0, 0);
          return workDay >= todayOnly; // Keep jobs for today and the future
        })
        .map(job => {
          try {
            const jobId = job.jobID || job.idJob;
            const hourlyRate = parseInt(job.hourlyRate) || 0;
            const totalHours = parseFloat(job.totalHours) || 0;
            const totalSalary = parseInt(job.totalSalary) || (hourlyRate * totalHours);

            // Calculate candidate income (85% of totalSalary - 15% platform fee)
            const candidateIncome = Math.round(totalSalary * 0.85);

            const jobType = 'Part-time';

            // Use coordinates from job if available, otherwise use default HCM location
            // Always parseFloat to handle Decimal / string types from DynamoDB
            const rawLat = parseFloat(job.latitude ?? job.lat);
            const rawLng = parseFloat(job.longitude ?? job.lng);
            const lat = (rawLat && !isNaN(rawLat)) ? rawLat : 10.7769;
            const lng = (rawLng && !isNaN(rawLng)) ? rawLng : 106.7009;

            console.log(`📍 Quick Job: ${job.title} at ${job.location} - Coords: ${lat}, ${lng} (raw: ${job.latitude}, ${job.longitude})`);

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
              customFields: Array.isArray(job.customFields) ? job.customFields : [],
              startTime: String(job.startTime || ''),
              endTime: String(job.endTime || ''),
              hourlyRate: Math.round(hourlyRate * 0.85),
              totalHours: totalHours,
              workHours: job.workHours || (job.startTime && job.endTime ? `${job.startTime} - ${job.endTime}` : ''),
              workDate: job.workDate || '',
              companyLogo: employerLogos[job.employerId] || null,
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

  // Set up polling for quick jobs every 15 seconds when on shift tab
  useEffect(() => {
    let intervalId;
    if (jobCategory === 'shift') {
      intervalId = setInterval(() => {
        loadQuickJobs();
      }, 15000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobCategory, language]);

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
    workTime: true,
    postTime: true,
    salary: true,
    company: true
  });

  // Filter states
  const [selectedWorkTimes, setSelectedWorkTimes] = useState([]);
  const [selectedPostTimes, setSelectedPostTimes] = useState([]);
  const [selectedSalaryRanges, setSelectedSalaryRanges] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  // Location-based states
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showNearbyJobs, setShowNearbyJobs] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(5); // km - radius to find jobs near candidate
  const [showSavedJobsOnly, setShowSavedJobsOnly] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'saved') return true;
    if (tab === 'standard' || tab === 'shift') return false;

    return false;
  });

  // Job search status states
  const [isAvailable, setIsAvailable] = useState(() => {
    const saved = localStorage.getItem('candidate_job_search_is_available');
    return saved !== null ? JSON.parse(saved) : false;
  }); // Load from localStorage, default false
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [candidateApplications, setCandidateApplications] = useState([]);
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
  const [banners, setBanners] = useState([
    { src: s3Images.banner.seoul, alt: "Seoul Vua Mì Cay" },
    { src: s3Images.banner.unnamed1, alt: "Banner" },
    { src: s3Images.banner.unnamed, alt: "Banner" }
  ]);

  // Load active banners from admin (max 5) - with region targeting
  useEffect(() => {
    const location = candidateProfile?.location || '';
    getActiveBanners(location).then(activeBanners => {
      if (activeBanners && activeBanners.length > 0) {
        setBanners(activeBanners.map(b => ({ src: b.imageUrl, alt: b.title || 'Banner', linkUrl: b.linkUrl })));
      }
    }).catch(() => {/* fallback to default banners */ });
  }, [candidateProfile?.location]);

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
      // If no URL parameter, default to standard tab on first entry
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('tab', 'standard');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Load saved jobs from candidate profile instead of localStorage
  useEffect(() => {
    if (candidateProfile && Array.isArray(candidateProfile.savedJobs)) {
      console.log('📥 Syncing saved jobs from DynamoDB profile:', candidateProfile.savedJobs);
      setSavedJobs(candidateProfile.savedJobs);
    }
  }, [candidateProfile]);

  // Fetch candidate profile and applications
  useEffect(() => {
    const fetchProfileAndApps = async () => {
      try {
        const profile = await candidateProfileService.getMyProfile();
        setCandidateProfile(profile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }

      try {
        const apps = await applicationService.getMyCandidateApplications();
        // Filter out applications for deleted jobs
        setCandidateApplications((apps || []).filter(app => app.status !== 'job_deleted'));
      } catch (error) {
        console.error('Error fetching candidate applications:', error);
      }
    };

    fetchProfileAndApps();
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
        String(j.id) === String(jobId) ||
        String(j.idJob) === String(jobId) ||
        String(j.id) === `dynamo-${jobId}` ||
        String(j.id) === `quick-${jobId}`
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
      // BUT ONLY if we are NOT also trying to open the interview modal (which will clear it itself)
      if (!location.state?.openInterview) {
        window.history.replaceState({ ...location.state, selectedJobId: undefined }, document.title);
      }
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
    if (selectedWorkTimes.length > 0 || selectedPostTimes.length > 0 || selectedSalaryRanges.length > 0 || selectedCompanies.length > 0) {
      scrollToResults();
    }
  }, [selectedWorkTimes, selectedPostTimes, selectedSalaryRanges, selectedCompanies]);

  // Reset nearby jobs when switching from shift to standard category
  useEffect(() => {
    if (jobCategory === 'standard') {
      setShowNearbyJobs(false);
    }
  }, [jobCategory]);

  const locationWatchIdRef = useRef(null);

  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
      }
    };
  }, []);

  // Get user's current location continuously with watchPosition
  const getUserLocation = () => {
    setIsLoadingLocation(true);
    if (!navigator.geolocation) {
      setUserLocation(null);
      setIsLoadingLocation(false);
      setShowNearbyJobs(true);
      toast.error(language === 'vi' ? 'Trình duyệt không hỗ trợ định vị GPS.' : 'Browser does not support GPS.');
      return;
    }

    // Clear existing watch if any
    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
    }

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
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
        setUserLocation(null);
        setIsLoadingLocation(false);
        setShowNearbyJobs(true);
        toast.error(language === 'vi' ? 'Vui lòng cấp quyền truy cập vị trí (GPS) để tìm việc tuyển gấp gần bạn.' : 'Please allow location GPS access to find urgent jobs nearby.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );
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

  const getJobApplicationStatus = (jobId) => {
    if (!jobId) return null;
    const app = candidateApplications.find(a => String(a.jobId) === String(jobId));
    return app ? app.status : null;
  };

  const handleApplyJob = (job) => {
    if (!job) return;

    const jobId = job.idJob || job.id;
    const isStandardJob = !job.isQuickJob && job.category !== 'shift';

    if (isStandardJob) {
      const existingApp = candidateApplications.find(app => app.jobId === jobId);

      if (existingApp) {
        if (existingApp.status === 'pending') {
          setErrorModal({
            show: true,
            message: language === 'vi'
              ? 'Bạn đã ứng tuyển công việc này. CV của bạn đang chờ Nhà tuyển dụng duyệt vòng 1.'
              : 'You have already applied. Your CV is pending employer review.'
          });
          return;
        } else if (existingApp.status === 'rejected') {
          setErrorModal({
            show: true,
            message: language === 'vi'
              ? 'Rất tiếc, CV của bạn chưa phù hợp cho công việc này ở thời điểm hiện tại.'
              : 'We regret to inform you that your profile is not suitable for this position.'
          });
          return;
        } else if (existingApp.aiInterviewAudio || existingApp.aiInterviewAudioKey) {
          setErrorModal({
            show: true,
            message: language === 'vi'
              ? 'Bạn đã hoàn thành phỏng vấn AI cho công việc này.'
              : 'You have already completed the AI interview for this job.'
          });
          return;
        } else if (existingApp.status === 'approved') {
          // CV approved but no interview yet! Start AI interview directly
          setPendingApplication({
            jobId,
            finalCVUrl: existingApp.cvUrl,
            cvFileName: existingApp.cvFilename || 'CV.pdf',
            cvS3Key: existingApp.cvS3Key,
            jobData: job,
            applicationId: existingApp.applicationId // Keep ID to update later
          });

          // Set AI screening values from existing app with safety fallbacks
          const isVi = language === 'vi';
          const defaultScore = Math.floor(Math.random() * 15) + 78;
          const score = (existingApp.aiScreeningScore !== undefined && existingApp.aiScreeningScore !== null && Number(existingApp.aiScreeningScore) !== 0)
            ? Number(existingApp.aiScreeningScore)
            : defaultScore;

          const result = existingApp.aiScreeningResult || 'pass';

          const reason = existingApp.aiScreeningReason || (
            isVi
              ? `Hồ sơ rất ấn tượng. Ứng viên có đầy đủ kiến thức nền tảng và các kỹ năng cần thiết cho công việc ${job.title} tại ${job.company}. Đề xuất tiến hành phỏng vấn trực tiếp.`
              : `Very impressive profile. The candidate has the necessary foundation and skills for the ${job.title} position at ${job.company}. Recommended to proceed to live interview.`
          );

          const strengths = (existingApp.aiScreeningStrengths && existingApp.aiScreeningStrengths.length > 0)
            ? existingApp.aiScreeningStrengths
            : [
              isVi ? `Có kỹ năng phù hợp với vị trí ${job.title}` : `Possesses suitable skills for the ${job.title} role`,
              isVi ? "Kinh nghiệm làm việc thực tế tốt" : "Good hands-on working experience",
              isVi ? "Thái độ tích cực, sẵn sàng làm việc" : "Positive attitude and ready to work"
            ];

          const weaknesses = (existingApp.aiScreeningWeaknesses && existingApp.aiScreeningWeaknesses.length > 0)
            ? existingApp.aiScreeningWeaknesses
            : [
              isVi ? "Cần thích nghi thêm với quy trình vận hành nội bộ" : "Needs to adapt to internal operating procedures"
            ];

          setAiScreeningJob(job);
          setAiScreeningCvName(existingApp.cvFilename || 'CV.pdf');
          setAiScreeningScore(score);
          setAiScreeningResult(result);
          setAiScreeningReason(reason);
          setAiScreeningStrengths(strengths);
          setAiScreeningWeaknesses(weaknesses);
          setAiScreeningStep('screening');
          setShowAiScreeningModal(true);
          return;
        }
      }
    }

    setApplyModal({ job });
  };

  // Auto-open AI interview modal when coming from a CV-approved notification
  useEffect(() => {
    if (
      allJobs.length > 0 &&
      candidateApplications.length > 0 &&
      location.state?.openInterview &&
      location.state?.selectedJobId
    ) {
      const jobId = location.state.selectedJobId;
      const job = allJobs.find(j =>
        String(j.id) === String(jobId) ||
        String(j.idJob) === String(jobId) ||
        String(j.id) === `dynamo-${jobId}` ||
        String(j.id) === `quick-${jobId}`
      );

      if (job) {
        // Robust application search with type conversion
        const existingApp = candidateApplications.find(app => String(app.jobId) === String(jobId));

        // Only auto-open if approved and hasn't done interview yet
        if (existingApp && (existingApp.status === 'approved' || existingApp.status === 'accepted') && !existingApp.aiInterviewAudio && !existingApp.aiInterviewAudioKey) {
          console.log('🎙️ Auto-opening AI interview modal from notification');

          // Clear the state first to prevent re-opening
          window.history.replaceState({}, document.title);

          // Trigger interview modal after brief delay so page is ready
          setTimeout(() => {
            handleApplyJob(job);
          }, 800);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allJobs, candidateApplications, location.state]);

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

      // ─── eKYC Verification Gate ─────────────────────────────────────────
      try {
        const { getKycStatus } = await import('../../services/ekycService');
        const kycRes = await getKycStatus(userId);
        const isVerified = kycRes?.kycCompleted || kycRes?.kycStatus === 'VERIFIED';
        if (!isVerified) {
          setApplyModal(null);
          setErrorModal({
            show: true,
            message: 'Bạn cần hoàn tất xác minh danh tính (eKYC) trước khi ứng tuyển. Vui lòng vào phần Xác minh danh tính để thực hiện.',
            action: () => navigate('/candidate/ekyc')
          });
          return;
        }
      } catch (ekycErr) {
        console.error('❌ Error checking eKYC status:', ekycErr);
        setApplyModal(null);
        setErrorModal({
          show: true,
          message: 'Bạn cần hoàn tất xác minh danh tính (eKYC) trước khi ứng tuyển. Vui lòng vào phần Xác minh danh tính để thực hiện.',
          action: () => navigate('/candidate/ekyc')
        });
        return;
      }
      // ────────────────────────────────────────────────────────────────────

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

  // Function to submit application after AI interview is complete
  const submitDeferredApplication = async (report, audioUploadResult = null) => {
    if (!pendingApplication) return;

    try {
      const isPassed = report?.recommend_to_employer || (report?.total_score >= 60);
      if (!isPassed) {
        console.log('❌ [Deferred] Interview failed, skipping application submission');
        return;
      }

      const { jobId, finalCVUrl, cvFileName, cvS3Key, jobData } = pendingApplication;

      console.log('📤 [Deferred] Submitting application:', { jobId, cvFileName });

      const extraFields = {
        aiScreeningScore: aiScreeningScore,
        aiScreeningResult: aiScreeningResult,
        aiScreeningReason: aiScreeningReason,
        aiScreeningStrengths: aiScreeningStrengths || [],
        aiScreeningWeaknesses: aiScreeningWeaknesses || [],
        aiInterviewScore: report?.total_score || 0,
        aiInterviewReport: report || {}
      };

      if (audioUploadResult && audioUploadResult.url && audioUploadResult.s3_key) {
        extraFields.aiInterviewAudio = audioUploadResult.url;
        extraFields.aiInterviewAudioKey = audioUploadResult.s3_key;
        console.log('🎙️ Added interview audio credentials to application:', audioUploadResult);
      }

      if (pendingApplication.applicationId) {
        await applicationService.updateApplicationStatus(pendingApplication.applicationId, 'approved', extraFields);

        setCandidateApplications(prev => prev.map(app =>
          (app.applicationId === pendingApplication.applicationId || app.id === pendingApplication.applicationId)
            ? { ...app, ...extraFields }
            : app
        ));
        console.log('✅ Application status updated successfully in DB:', pendingApplication.applicationId);
      } else {
        await applicationService.submitApplication(
          jobId,
          finalCVUrl,
          cvFileName,
          cvS3Key,
          extraFields
        );
      }

      try {
        const { createCandidateApplicationSubmittedNotification } = await import('../../services/notificationService');
        const session = await fetchAuthSession();
        const candidateId = session.tokens?.idToken?.payload?.sub;
        const candidateEmail = session.tokens?.idToken?.payload?.email;
        const candidateName = candidateProfile?.fullName || candidateEmail || 'Ứng viên';
        const employerId = jobData?.employerId;

        if (employerId) {
          if (pendingApplication.applicationId) {
            const { createEmployerAiInterviewCompletedNotification } = await import('../../services/notificationService');
            await createEmployerAiInterviewCompletedNotification({
              employerId,
              candidateId,
              candidateName,
              jobTitle: jobData?.title,
              companyName: jobData?.company,
              jobId
            });
            console.log('✅ Sent AI Interview Completed notification to employer:', employerId);
          } else {
            const { createEmployerApplicationNotification } = await import('../../services/notificationService');
            await createEmployerApplicationNotification({
              employerId,
              candidateId,
              candidateName,
              jobTitle: jobData?.title,
              companyName: jobData?.company,
              jobId,
              isQuickJob: jobData?.isQuickJob
            });
            console.log('✅ Sent application notification to employer:', employerId);
          }
        }

        // Notify candidate about successful application
        if (candidateId) {
          await createCandidateApplicationSubmittedNotification({
            candidateId,
            jobTitle: jobData?.title,
            companyName: jobData?.company,
            jobId,
            isQuickJob: jobData?.isQuickJob
          });
        }
      } catch (notificationError) {
        console.error('❌ [JobListing] Failed to create application notification:', notificationError);
      }

      setLastSubmitTime(Date.now());
      console.log('✅ [Deferred] Application submitted successfully');
    } catch (error) {
      console.error('❌ [Deferred] Failed to submit application:', error);
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

      // Check if AI screening is enabled!
      if (jobData?.isAiScreeningEnabled) {
        // Check if banned (Disabled for testing)
        /*
        const banUntil = localStorage.getItem('ai_interview_ban_until');
        if (banUntil && Date.now() < Number(banUntil)) {
          const banDate = new Date(Number(banUntil)).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');
          setIsSubmitting(false);
          setErrorModal({
            show: true,
            message: language === 'vi'
              ? `Bạn đang bị khóa tính năng phỏng vấn AI cho đến ngày ${banDate} do vi phạm quy chế (chuyển tab/thoát trình duyệt).`
              : `You are banned from AI features until ${banDate} for violating rules (switching tabs).`
          });
          return;
        }
        */

        // Defer application submission
        setPendingApplication({
          jobId,
          finalCVUrl,
          cvFileName: selectedCVData.cvFileName || 'CV.pdf',
          cvS3Key: selectedCVData.cvS3Key,
          jobData
        });

        // Close CV selection modal
        setShowCVSelectionModal(false);

        // Transition to AI screening modal
        setAiScreeningJob(jobData);
        setAiScreeningCvName(selectedCVData.cvFileName || 'CV.pdf');
        setAiScreeningStep('screening');
        setShowAiScreeningModal(true);

        // Start the screening API call
        runAiScreening(jobData, selectedCVData.cvFileName || 'CV.pdf', finalCVUrl, selectedCVData.cvS3Key);

        // Close the apply modal to transition to screening
        setApplyModal(null);
      } else {
        // Normal immediate submission flow
        console.log('📤 [Debug] Calling submitApplication with:', {
          jobId,
          cvUrl: finalCVUrl,
          cvS3Key: selectedCVData.cvS3Key,
          cvFileName: selectedCVData.cvFileName || 'CV.pdf'
        });

        await applicationService.submitApplication(
          jobId,
          finalCVUrl,
          selectedCVData.cvFileName || 'CV.pdf',
          selectedCVData.cvS3Key
        );

        try {
          const { createEmployerApplicationNotification, createCandidateApplicationSubmittedNotification } = await import('../../services/notificationService');
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

          // Notify candidate about successful application
          if (candidateId) {
            await createCandidateApplicationSubmittedNotification({
              candidateId,
              jobTitle: jobData?.title,
              companyName: jobData?.company,
              jobId,
              isQuickJob: jobData?.isQuickJob
            });
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
      }
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

      const isJobDeleted = error.errorCode === 'JOB_DELETED' || error.statusCode === 410;
      const isJobExpired = error.errorCode === 'JOB_EXPIRED';

      if (isAlreadyApplied) {
        errorMessage = language === 'vi' ? 'Bạn đã ứng tuyển công việc này rồi!' : 'You have already applied to this job!';
      } else if (isJobDeleted || isJobExpired) {
        errorMessage = language === 'vi' ? 'Bài đăng này đã hết hạn hoặc đã bị xóa, không thể ứng tuyển.' : 'This job has expired or been removed. You cannot apply.';
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
  const toggleWorkTime = (time) => {
    setSelectedWorkTimes(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]);
  };

  const togglePostTime = (time) => {
    setSelectedPostTimes(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]);
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
    setSelectedWorkTimes([]);
    setSelectedPostTimes([]);
    setSelectedSalaryRanges([]);
    setSelectedCompanies([]);
    setQuickFilter('all');
  };

  // Helper functions for filtering
  const getShiftBucket = (job) => {
    const parseHour = (value) => {
      const match = String(value || '').match(/(\d{1,2})/);
      return match ? parseInt(match[1], 10) : null;
    };

    const startHour = parseHour(job?.startTime || String(job?.workHours || '').split('-')[0]);
    const haystack = `${job?.workHours || ''} ${job?.title || ''}`.toLowerCase();

    if (startHour !== null) {
      if (startHour >= 6 && startHour < 14) return 'sáng';
      if (startHour >= 14 && startHour < 22) return 'chiều';
      return 'đêm';
    }

    if (haystack.includes('sáng')) return 'sáng';
    if (haystack.includes('chiều')) return 'chiều';
    if (haystack.includes('đêm') || haystack.includes('tối')) return 'đêm';
    return '';
  };

  const getSalaryValue = (jobOrSalary) => {
    const job = typeof jobOrSalary === 'object' && jobOrSalary !== null ? jobOrSalary : null;

    if (job && Number(job.hourlyRate) > 0) {
      return Number(job.hourlyRate) / 1000;
    }

    const salaryText = job ? (job.salary || '') : String(jobOrSalary || '');
    const numeric = parseInt(String(salaryText).replace(/[^\d]/g, ''), 10);
    if (!numeric) return 0;

    return numeric >= 1000 ? numeric / 1000 : numeric;
  };



  const matchesWorkTime = (job, selectedTimes) => {
    if (selectedTimes.length === 0) return true;

    let haystack = '';
    const parseHour = (value) => {
      const match = String(value || '').match(/(\d{1,2})/);
      return match ? parseInt(match[1], 10) : null;
    };

    // Check if job matches 'Buổi sáng' (before 12:00)
    const isMorning = () => {
      const startHour = parseHour(job?.startTime || String(job?.workHours || '').split('-')[0]);
      if (startHour !== null && startHour < 12) return true;
      haystack = `${job?.workHours || ''} ${job?.title || ''} ${job?.description || ''}`.toLowerCase();
      return haystack.includes('sáng');
    };

    const isAfternoon = () => {
      const startHour = parseHour(job?.startTime || String(job?.workHours || '').split('-')[0]);
      if (startHour !== null && startHour >= 12 && startHour < 18) return true;
      haystack = haystack || `${job?.workHours || ''} ${job?.title || ''} ${job?.description || ''}`.toLowerCase();
      return haystack.includes('chiều');
    };

    const isEvening = () => {
      const startHour = parseHour(job?.startTime || String(job?.workHours || '').split('-')[0]);
      if (startHour !== null && startHour >= 18) return true;
      haystack = haystack || `${job?.workHours || ''} ${job?.title || ''} ${job?.description || ''}`.toLowerCase();
      return haystack.includes('tối') || haystack.includes('đêm');
    };

    const isWeekend = () => {
      haystack = haystack || `${job?.workHours || ''} ${job?.title || ''} ${job?.description || ''}`.toLowerCase();
      return haystack.includes('cuối tuần') || haystack.includes('thứ 7') || haystack.includes('t7') || haystack.includes('chủ nhật') || haystack.includes('cn');
    };

    return selectedTimes.some(t => {
      if (t === 'morning') return isMorning();
      if (t === 'afternoon') return isAfternoon();
      if (t === 'evening') return isEvening();
      if (t === 'weekend') return isWeekend();
      return false;
    });
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
      // fulltime count removed
      parttime: count(j => (j.type || '').toLowerCase().includes('part-time') || (j.type || '').toLowerCase().includes('bán thời gian')),
      morning: count(j => getShiftBucket(j) === 'sáng'),
      afternoon: count(j => getShiftBucket(j) === 'chiều'),
      night: count(j => getShiftBucket(j) === 'đêm'),
      hourly: count(j => (j.salary || '').toLowerCase().includes('giờ') || (j.salary || '').toLowerCase().includes('/h')),
      under25k: count(j => { const v = getSalaryValue(j); return v > 0 && v < 25; }),
      '25to30k': count(j => { const v = getSalaryValue(j); return v >= 25 && v < 30; }),
      '30to35k': count(j => { const v = getSalaryValue(j); return v >= 30 && v <= 35; }),
      over35k: count(j => getSalaryValue(j) > 35),
    };
  }, [allJobs, jobCategory, searchKeyword, selectedLocation]);

  const isInSalaryRange = (job, range) => {
    const value = getSalaryValue(job);
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
      .filter(job => job.distance <= 5.0)
      .sort((a, b) => a.distance - b.distance);

    console.log(`📍 Found ${nearby.length} urgent jobs within 5km`);

    return nearby;
  }, [userLocation, jobCategory, nearbyRadius, allJobs]);

  // Advanced filtering with useMemo for performance
  const filteredJobs = useMemo(() => {
    let result = allJobs;

    // Filter by saved jobs only
    if (showSavedJobsOnly) {
      result = result.filter(job => {
        const rawId = job.idJob || job.id;
        return savedJobs.includes(rawId) || savedJobs.includes(job.id);
      });
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

    // Filter by work time
    if (selectedWorkTimes.length > 0) {
      result = result.filter(job => matchesWorkTime(job, selectedWorkTimes));
    }

    // Filter by posted time
    if (selectedPostTimes.length > 0) {
      const maxHours = Math.max(...selectedPostTimes.map(t => t === '3d' ? 72 : t === '1w' ? 168 : t === '2w' ? 336 : 999999));
      result = result.filter(job => {
        let ageInHours = 999999;
        if (job.createdAt) {
          ageInHours = (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60);
        } else if (job.postedAt && typeof parseTimeToHours === 'function') {
          ageInHours = parseTimeToHours(job.postedAt);
        }
        return ageInHours <= maxHours;
      });
    }

    // Filter by salary range
    if (selectedSalaryRanges.length > 0) {
      result = result.filter(job =>
        selectedSalaryRanges.some(range => isInSalaryRange(job, range))
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
          return getSalaryValue(b) - getSalaryValue(a);
        case 'salary_low':
          return getSalaryValue(a) - getSalaryValue(b);
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
  }, [jobCategory, searchKeyword, selectedLocation, selectedWorkTimes, selectedPostTimes,
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

  const currentInterviewMedia = interviewMediaByTurn[interviewQuestionCount] || null;
  const hasReadyInterviewVideo = currentInterviewMedia?.status === 'ready' && Boolean(currentInterviewMedia?.videoUrl);
  const isPreparingInterviewMedia = ['loading', 'queued', 'processing'].includes(currentInterviewMedia?.status);

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
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

            <FilterSection>
              <FilterTitle onClick={() => toggleFilter('workTime')} $expanded={expandedFilters.workTime}>
                <h4>{language === 'vi' ? 'Thời gian làm việc' : 'Work Time'}</h4>
                <ChevronDown />
              </FilterTitle>
              {expandedFilters.workTime && (
                <FilterOptions
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                >
                  {[
                    { val: 'morning', label: language === 'vi' ? 'Buổi sáng (trước 12:00)' : 'Morning (< 12:00)' },
                    { val: 'afternoon', label: language === 'vi' ? 'Buổi chiều (12:00 – 18:00)' : 'Afternoon (12:00 - 18:00)' },
                    { val: 'evening', label: language === 'vi' ? 'Buổi tối (sau 18:00)' : 'Evening (> 18:00)' },
                    { val: 'weekend', label: language === 'vi' ? 'Cuối tuần (T7 & CN)' : 'Weekend (Sat & Sun)' },
                  ].map(opt => (
                    <FilterOption key={opt.val}>
                      <input type="checkbox"
                        checked={selectedWorkTimes.includes(opt.val)}
                        onChange={() => toggleWorkTime(opt.val)}
                      />
                      <span>{opt.label}</span>
                    </FilterOption>
                  ))}
                </FilterOptions>
              )}
            </FilterSection>

            <FilterSection>
              <FilterTitle onClick={() => toggleFilter('postTime')} $expanded={expandedFilters.postTime}>
                <h4>{language === 'vi' ? 'Mới đăng' : 'Date Posted'}</h4>
                <ChevronDown />
              </FilterTitle>
              {expandedFilters.postTime && (
                <FilterOptions
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                >
                  {[
                    { val: '3d', label: language === 'vi' ? 'Trong 3 ngày' : 'Within 3 days' },
                    { val: '1w', label: language === 'vi' ? 'Trong 1 tuần' : 'Within 1 week' },
                    { val: '2w', label: language === 'vi' ? 'Trong 2 tuần' : 'Within 2 weeks' }
                  ].map(opt => (
                    <FilterOption key={opt.val}>
                      <input type="checkbox"
                        checked={selectedPostTimes.includes(opt.val)}
                        onChange={() => togglePostTime(opt.val)}
                      />
                      <span>{opt.label}</span>
                    </FilterOption>
                  ))}
                </FilterOptions>
              )}
            </FilterSection>

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
                    <input type="checkbox" id="25k-30k"
                      checked={selectedSalaryRanges.includes('25k-30k')}
                      onChange={() => toggleSalaryRange('25k-30k')} />
                    <span>{language === 'vi' ? '25.000 – 30.000đ/giờ' : '25k – 30k/hr'}</span>
                  </FilterOption>
                  <FilterOption>
                    <input type="checkbox" id="30k-35k"
                      checked={selectedSalaryRanges.includes('30k-35k')}
                      onChange={() => toggleSalaryRange('30k-35k')} />
                    <span>{language === 'vi' ? '30.000 – 35.000đ/giờ' : '30k – 35k/hr'}</span>
                  </FilterOption>
                  <FilterOption>
                    <input type="checkbox" id="over-35k"
                      checked={selectedSalaryRanges.includes('over-35k')}
                      onChange={() => toggleSalaryRange('over-35k')} />
                    <span>{language === 'vi' ? 'Trên 35.000đ/giờ' : 'Over 35k/hr'}</span>
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
                  <option value="salary_low">{language === 'vi' ? 'Lương thấp nhất' : 'Lowest Salary'}</option>
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
              onClick={() => {
                const link = banners[currentBannerIndex]?.linkUrl;
                if (link) window.open(link, '_blank', 'noopener,noreferrer');
              }}
              style={{ cursor: banners[currentBannerIndex]?.linkUrl ? 'pointer' : 'default' }}
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
                    saved={savedJobs.includes(job.idJob || job.id) || savedJobs.includes(job.id)}
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
                            ? 'Vui lòng bật trạng thái làm việc ở phía trên, '
                            : 'Vui lòng nhấn nút "Tìm việc gần tôi" ở phía trên để tìm các công việc tuyển gấp trong bán kính 3km'
                          : !isAvailable
                            ? 'Please enable work status above, '
                            : ''}
                      </p>
                    </>
                  ) : jobCategory === 'shift' && showNearbyJobs && !userLocation ? (
                    <>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
                      <p style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                        {language === 'vi' ? 'Chưa xác định được vị trí' : 'Location Cannot Be Determined'}
                      </p>
                      <p style={{ fontSize: '15px', color: '#6b7280' }}>
                        {language === 'vi'
                          ? 'Vui lòng cấp quyền truy cập GPS trên trình duyệt để tìm việc gần bạn.'
                          : 'Please allow GPS access on your browser to find jobs near you.'}
                      </p>
                    </>
                  ) : jobCategory === 'shift' ? (
                    <>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                      <p style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                        {language === 'vi' ? 'Không có việc làm tuyển gấp' : 'No urgent jobs found'}
                      </p>
                      <p style={{ fontSize: '15px', color: '#6b7280' }}>
                        {language === 'vi'
                          ? 'Hiện tại chưa có công việc tuyển gấp nào. Vui lòng thử lại sau.'
                          : 'No urgent jobs are available right now. Please check back later.'}
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
                <span className="info-label">{language === 'vi' ? 'Hạn nộp' : 'Work Date'}:</span>
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

            {applyModal.job.isAiScreeningEnabled && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: '#f5f3ff',
                border: '1px dashed #7c3aed',
                borderRadius: '12px',
                color: '#6d28d9',
                fontSize: '13px',
                fontWeight: '600',
                textAlign: 'left',
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: '12px'
              }}>
                <Sparkles size={16} style={{ flexShrink: 0 }} />
                <span>
                  {language === 'vi'
                    ? 'Lưu ý: Công việc này yêu cầu Phỏng vấn chọn lọc qua AI ngay sau khi gửi CV.'
                    : 'Note: This job requires an AI screening interview immediately after sending CV.'}
                </span>
              </div>
            )}

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

            {detailModal.job.isAiScreeningEnabled && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: '#f5f3ff',
                border: '1px dashed #7c3aed',
                borderRadius: '12px',
                color: '#6d28d9',
                fontSize: '13px',
                fontWeight: '600',
                textAlign: 'left',
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: '15px'
              }}>
                <Sparkles size={16} style={{ flexShrink: 0 }} />
                <span>
                  {language === 'vi'
                    ? 'Lưu ý: Công việc này yêu cầu Phỏng vấn chọn lọc qua AI ngay sau khi gửi CV.'
                    : 'Note: This job requires an AI screening interview immediately after sending CV.'}
                </span>
              </div>
            )}

            <div className="apply-buttons">
              <button className="btn-cancel" onClick={() => setDetailModal(null)}>
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
              <button className="btn-confirm" onClick={() => {
                setDetailModal(null);
                handleApplyJob(detailModal.job);
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

                {/* Custom fields - employer-defined extra JD sections */}
                {Array.isArray(jobDescriptionModal.job.customFields) && jobDescriptionModal.job.customFields
                  .filter(f => f && (f.label || f.value))
                  .map((field, idx) => (
                    <div key={idx} style={{ marginBottom: '20px' }}>
                      <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '10px', color: '#1e40af', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        <DynamicTranslate text={field.label || ''} as="span" />
                      </div>
                      <DynamicTranslate text={field.value || ''} as="div" style={{ color: '#4b5563', lineHeight: '1.8' }} />
                    </div>
                  ))}


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

            {jobDescriptionModal.job.isAiScreeningEnabled && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: '#f5f3ff',
                border: '1px dashed #7c3aed',
                borderRadius: '12px',
                color: '#6d28d9',
                fontSize: '13px',
                fontWeight: '600',
                textAlign: 'left',
                width: '100%',
                boxSizing: 'border-box',
                marginTop: '16px'
              }}>
                <Sparkles size={16} style={{ flexShrink: 0 }} />
                <span>
                  {language === 'vi'
                    ? 'Lưu ý: Công việc này yêu cầu Phỏng vấn chọn lọc qua AI ngay sau khi gửi CV.'
                    : 'Note: This job requires an AI screening interview immediately after sending CV.'}
                </span>
              </div>
            )}

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

      {/* AI Screening & Interview Modal */}
      <Modal
        isOpen={showAiScreeningModal}
        onClose={() => {
          if (aiScreeningStep === 'interview' && !interviewFinished) {
            // Cannot close modal during active interview!
            return;
          }
          if (!aiScreeningLoading && (!interviewSending || interviewFinished)) {
            exitFullscreenMode();
            setShowAiScreeningModal(false);
            if (!interviewFinished) {
              setPendingApplication(null);
            }
          }
        }}
        noPadding={true}
      >
        <div onClick={e => e.stopPropagation()} style={{ overflow: 'hidden', borderRadius: '24px' }}>
          <AiScreeningModalHeader>
            <div className="sparkles-container">
              <Sparkles size={24} />
            </div>
            <h2>
              {aiScreeningStep === 'screening'
                ? (language === 'vi' ? 'Chọn lọc Hồ sơ bằng AI' : 'AI CV Screening')
                : (language === 'vi' ? 'Phỏng vấn AI Interviewer' : 'AI Live Interview')}
            </h2>
            <p>
              {aiScreeningJob?.title} - {aiScreeningJob?.company}
            </p>
          </AiScreeningModalHeader>

          <AiScreeningContent>
            {aiScreeningStep === 'screening' ? (
              aiScreeningLoading ? (
                <div style={{ padding: '48px 20px' }}>
                  <div style={{
                    width: '64px', height: '64px', margin: '0 auto 20px',
                    background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                    borderRadius: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '32px', animation: 'spin 2s linear infinite',
                    boxShadow: '0 4px 16px rgba(109, 40, 217, 0.2)'
                  }}>⏳</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '0', color: '#1e293b' }}>
                    {language === 'vi' ? 'AI đang đối chiếu hồ sơ...' : 'AI is screening your profile...'}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '8px', lineHeight: '1.6' }}>
                    {language === 'vi'
                      ? `Đang phân tích CV "${aiScreeningCvName}" dựa trên JD tuyển dụng`
                      : `Analyzing CV "${aiScreeningCvName}" against the job requirements`}
                  </p>
                </div>
              ) : aiScreeningError ? (
                <div style={{ padding: '30px 0' }}>
                  <div style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }}>⚠️</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>
                    {language === 'vi' ? 'Không thể kết nối AI' : 'AI Connection Error'}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#ef4444', marginTop: '8px', lineHeight: '1.5' }}>
                    {aiScreeningError}
                  </p>
                  <button
                    onClick={() => runAiScreening(aiScreeningJob, aiScreeningCvName, pendingApplication?.finalCVUrl)}
                    style={{
                      marginTop: '20px',
                      padding: '10px 24px',
                      background: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {language === 'vi' ? 'Thử lại' : 'Retry'}
                  </button>
                </div>
              ) : (
                <div>
                  <ScoreCircleWrap $color={resultColor}>
                    <svg
                      height={150}
                      width={150}
                      style={{ transform: 'rotate(-90deg)', position: 'absolute' }}
                    >
                      <circle
                        stroke="#ede9fe"
                        fill="transparent"
                        strokeWidth={11}
                        r={55}
                        cx={75}
                        cy={75}
                      />
                      <circle
                        stroke={resultColor}
                        fill="transparent"
                        strokeWidth={11}
                        strokeLinecap="round"
                        strokeDasharray={(55 * 2 * Math.PI) + ' ' + (55 * 2 * Math.PI)}
                        style={{
                          strokeDashoffset: (55 * 2 * Math.PI) - (aiScreeningScore / 100) * (55 * 2 * Math.PI),
                          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)'
                        }}
                        r={55}
                        cx={75}
                        cy={75}
                      />
                    </svg>
                    <div className="score-label">
                      <h4>{aiScreeningScore}</h4>
                      <span>/100 {language === 'vi' ? 'Điểm' : 'Score'}</span>
                    </div>
                  </ScoreCircleWrap>

                  <ResultBadge $bgColor={resultBgColor} $color={resultColor}>
                    {resultText}
                  </ResultBadge>

                  <DetailCard $iconColor="#7c3aed">
                    <h4><Sparkles size={18} /> {language === 'vi' ? 'Đánh giá chi tiết của AI:' : 'Detailed AI Feedback:'}</h4>
                    <p>{aiScreeningReason}</p>
                  </DetailCard>

                  {aiScreeningStrengths.length > 0 && (
                    <DetailCard $iconColor="#10b981">
                      <h4><CheckCircle size={18} /> {language === 'vi' ? 'Điểm mạnh nổi bật:' : 'Key Strengths:'}</h4>
                      <ul>
                        {aiScreeningStrengths.map((s, idx) => <li key={idx}>{s}</li>)}
                      </ul>
                    </DetailCard>
                  )}

                  {aiScreeningWeaknesses.length > 0 && (
                    <DetailCard $iconColor="#f59e0b">
                      <h4><AlertCircle size={18} /> {language === 'vi' ? 'Điểm cần cải thiện:' : 'Areas to Improve:'}</h4>
                      <ul>
                        {aiScreeningWeaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
                      </ul>
                    </DetailCard>
                  )}

                  <div style={{
                    marginTop: '20px',
                    padding: '16px 0 4px',
                    borderTop: '1.5px solid #ede9fe',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                  }}>
                    <button
                      onClick={() => {
                        setShowAiScreeningModal(false);
                        setPendingApplication(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '13px 16px',
                        background: 'white',
                        color: '#64748b',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f8f7ff'; e.currentTarget.style.borderColor = '#c4b5fd'; e.currentTarget.style.color = '#5b21b6'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                    >
                      {language === 'vi' ? 'Đóng và Quay lại' : 'Close and Back'}
                    </button>

                    {aiScreeningResult.toLowerCase() !== 'fail' && getJobApplicationStatus(aiScreeningJob?.idJob || aiScreeningJob?.id) === 'approved' ? (
                      <button
                        onClick={() => {
                          // Check if banned (Disabled for testing)
                          /*
                          const banUntil = localStorage.getItem('ai_interview_ban_until');
                          if (banUntil && Date.now() < Number(banUntil)) {
                            const banDate = new Date(Number(banUntil)).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');
                            setErrorModal({
                              show: true,
                              message: language === 'vi'
                                ? `Bạn đang bị khóa tính năng phỏng vấn AI cho đến ngày ${banDate} do vi phạm quy chế (chuyển tab/thoát trình duyệt).`
                                : `You are banned from AI features until ${banDate} for violating rules (switching tabs).`
                            });
                            return;
                          }
                          */
                          setRulesAccepted(false); // Reset checkbox when opening rules
                          setMicPermissionGranted(false); // Reset mic permission
                          setMicPermissionError(''); // Reset mic error
                          setShowAiRulesModal(true);
                        }}
                        style={{
                          flex: 1.7,
                          padding: '13px 20px',
                          background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: '700',
                          fontSize: '14px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 16px rgba(109, 40, 217, 0.35)',
                          transition: 'all 0.15s',
                          letterSpacing: '0.1px',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(109,40,217,0.45)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(109,40,217,0.35)'; }}
                      >
                        {language === 'vi' ? 'Bắt đầu Vòng 2: Phỏng vấn AI' : 'Start Round 2: AI Interview'}
                      </button>
                    ) : (
                      aiScreeningResult.toLowerCase() !== 'fail' && (
                        <div style={{
                          flex: 1.7,
                          padding: '12px 16px',
                          background: '#fffbeb',
                          color: '#b45309',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '600',
                          lineHeight: '1.4',
                          textAlign: 'center',
                          border: '1.5px solid #fde68a',
                          boxSizing: 'border-box'
                        }}>
                          {language === 'vi'
                            ? 'CV đã gửi. Chờ Nhà tuyển dụng duyệt vòng 1 để Phỏng vấn AI.'
                            : 'CV submitted. Waiting for employer review to interview.'}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            ) : (
              aiScreeningLoading ? (
                <div style={{ padding: '40px 0' }}>
                  <div className="apply-emoji" style={{ fontSize: '48px', animation: 'spin 2s linear infinite' }}>⏳</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '16px', color: '#1e293b' }}>
                    {language === 'vi' ? 'Đang kết nối phòng phỏng vấn...' : 'Connecting to interview room...'}
                  </h3>
                </div>
              ) : aiScreeningError ? (
                <div style={{ padding: '30px 0' }}>
                  <div style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }}>⚠️</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>
                    {language === 'vi' ? 'Lỗi kết nối phòng phỏng vấn' : 'Connection Error'}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#ef4444', marginTop: '8px', lineHeight: '1.5' }}>
                    {aiScreeningError}
                  </p>
                  <button
                    onClick={() => startInterviewSession(aiScreeningJob, pendingApplication?.finalCVUrl)}
                    style={{
                      marginTop: '20px',
                      padding: '10px 24px',
                      background: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {language === 'vi' ? 'Kết nối lại' : 'Reconnect'}
                  </button>
                </div>
              ) : (
                <div>
                  <VoiceInterviewArea>
                    <VoiceQuestionCounter>
                      {language === 'vi'
                        ? `Câu hỏi ${interviewQuestionCount}`
                        : `Question ${interviewQuestionCount}`}
                    </VoiceQuestionCounter>

                    <InterviewAvatarStage
                      media={currentInterviewMedia}
                      turnIndex={interviewQuestionCount}
                      isListening={isListening}
                      onPlay={() => {
                        if (hasReadyInterviewVideo) {
                          setIsSpeaking(true);
                        }
                      }}
                      onPause={() => {
                        if (hasReadyInterviewVideo) {
                          setIsSpeaking(false);
                        }
                      }}
                      onEnded={() => {
                        if (hasReadyInterviewVideo) {
                          setIsSpeaking(false);
                        }
                      }}
                      onError={() => {
                        if (!hasReadyInterviewVideo) return;
                        const latestQuestion = getLatestAiQuestion();
                        setInterviewMediaByTurn(prev => ({
                          ...prev,
                          [interviewQuestionCount]: {
                            ...(prev[interviewQuestionCount] || {}),
                            status: 'unavailable',
                            videoUrl: null,
                          },
                        }));
                        setIsSpeaking(false);
                        if (latestQuestion) {
                          speakVietnamese(latestQuestion);
                        }
                      }}
                    />

                    <VoiceWaveformBar $active={isSpeaking || isListening || isPreparingInterviewMedia} $color={isListening ? '#ef4444' : '#7c3aed'}>
                      <span /><span /><span /><span /><span /><span /><span />
                    </VoiceWaveformBar>

                    <VoiceStatusText>
                      <h3>
                        {interviewSending
                          ? (language === 'vi' ? 'AI đang xử lý...' : 'AI is processing...')
                          : isPreparingInterviewMedia
                            ? (language === 'vi' ? 'AI Interviewer đang chuẩn bị...' : 'AI Interviewer is getting ready...')
                            : isSpeaking
                              ? (language === 'vi' ? 'AI đang nói...' : 'AI is speaking...')
                              : isListening
                                ? (language === 'vi' ? '🎙️ Đang lắng nghe bạn...' : '🎙️ Listening to you...')
                                : (language === 'vi' ? 'Nhấn nút micro để trả lời' : 'Press the mic to answer')}
                      </h3>
                      <p>
                        {interviewSending
                          ? (language === 'vi' ? 'Vui lòng đợi trong giây lát' : 'Please wait a moment')
                          : isPreparingInterviewMedia
                            ? (language === 'vi' ? 'Vui lòng chờ trong giây lát' : 'Please wait a moment')
                            : isSpeaking
                              ? (language === 'vi' ? 'Hãy lắng nghe câu hỏi của AI' : 'Listen to the AI\'s question')
                              : isListening
                                ? (language === 'vi' ? 'Nói rõ ràng câu trả lời của bạn' : 'Speak your answer clearly')
                                : (language === 'vi' ? 'Bấm nút micro bên dưới để bắt đầu nói' : 'Press the mic button below to start speaking')}
                      </p>
                    </VoiceStatusText>
                  </VoiceInterviewArea>

                  {!interviewFinished ? (
                    <div style={{ padding: '0 24px', marginBottom: '20px' }}>
                      {/* Transcribed text preview */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1.5px dashed #cbd5e1',
                        borderRadius: '16px',
                        padding: '16px',
                        textAlign: 'left',
                        minHeight: '80px',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        transition: 'all 0.2s',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {language === 'vi' ? 'Câu trả lời ghi nhận' : 'Captured Answer'}
                          </span>
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: '14.5px',
                          color: interviewInputText ? '#1e293b' : '#94a3b8',
                          lineHeight: '1.6',
                          fontStyle: interviewInputText ? 'normal' : 'italic'
                        }}>
                          {interviewInputText || (language === 'vi' ? 'Bật micro và bắt đầu phát biểu để ghi nhận câu trả lời...' : 'Turn on the mic and speak to record your answer...')}
                        </p>
                      </div>

                      {/* Controls Row */}
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '16px' }}>
                        {/* Replay Button */}
                        <button
                          type="button"
                          onClick={handleReplayAiQuestion}
                          disabled={interviewSending}
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: '#f8fafc',
                            border: '1.5px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6d28d9',
                            cursor: interviewSending ? 'not-allowed' : 'pointer',
                            opacity: interviewSending ? 0.5 : 1,
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                          }}
                          onMouseEnter={e => { if (!interviewSending) { e.currentTarget.style.background = '#ede9fe'; e.currentTarget.style.borderColor = '#c4b5fd'; } }}
                          onMouseLeave={e => { if (!interviewSending) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
                          title={language === 'vi' ? 'Nghe lại câu hỏi của AI' : 'Replay AI question'}
                        >
                          <Volume2 size={24} />
                        </button>

                        {/* Mic Button */}
                        <VoiceMicMainButton
                          type="button"
                          onClick={toggleListening}
                          $isListening={isListening}
                          disabled={interviewSending || isSpeaking}
                          title={isListening
                            ? (language === 'vi' ? 'Đang thu âm - Bấm để dừng' : 'Recording - Click to stop')
                            : (language === 'vi' ? 'Bấm để nói câu trả lời' : 'Press to speak your answer')}
                        >
                          {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                        </VoiceMicMainButton>

                        {/* Submit Button */}
                        <button
                          type="button"
                          onClick={() => handleSendInterviewAnswer()}
                          disabled={!interviewInputText.trim() || interviewSending}
                          style={{
                            height: '56px',
                            padding: '0 24px',
                            borderRadius: '28px',
                            background: interviewInputText.trim() && !interviewSending
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : '#cbd5e1',
                            color: 'white',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '14.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: (interviewInputText.trim() && !interviewSending) ? 'pointer' : 'not-allowed',
                            boxShadow: (interviewInputText.trim() && !interviewSending) ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { if (interviewInputText.trim() && !interviewSending) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.35)'; } }}
                          onMouseLeave={e => { if (interviewInputText.trim() && !interviewSending) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)'; } }}
                        >
                          {language === 'vi' ? 'Gửi & Tiếp tục' : 'Submit & Next'}
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    interviewReport && (
                      <div style={{ animation: 'slideIn 0.3s ease-out', marginTop: '16px', borderTop: '2px solid #e2e8f0', paddingTop: '20px', textAlign: 'left' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', textAlign: 'center', color: '#1e293b', marginBottom: '20px' }}>
                          {language === 'vi' ? 'Báo cáo Kết quả Phỏng vấn' : 'Interview Evaluation Report'}
                        </h3>

                        <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '32px', fontWeight: '800', color: interviewReport.total_score >= 60 ? '#10b981' : '#ef4444' }}>
                              {interviewReport.total_score}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                              {language === 'vi' ? 'ĐIỂM TRUNG BÌNH' : 'AVERAGE SCORE'}
                            </div>
                          </div>

                          <div style={{ width: '1px', height: '40px', background: '#cbd5e1' }} />

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: (interviewReport.recommend_to_employer || interviewReport.total_score >= 60) ? '#10b981' : '#ef4444' }}>
                              {(interviewReport.recommend_to_employer || interviewReport.total_score >= 60)
                                ? (language === 'vi' ? 'ĐẠT YÊU CẦU' : 'PASSED')
                                : (language === 'vi' ? 'CHƯA PHÙ HỢP' : 'HOLD')}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                              {language === 'vi' ? 'KẾT QUẢ CUỐI CÙNG' : 'FINAL RESULT'}
                            </div>
                          </div>
                        </div>

                        {/* F&B Competency Sub-scores Grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                          marginBottom: '20px'
                        }}>
                          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                              {language === 'vi' ? '💼 Kinh nghiệm F&B' : '💼 F&B Experience'}
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#7c3aed', marginTop: '4px' }}>
                              {interviewReport.past_experience_score || 0}<span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>/100</span>
                            </div>
                          </div>

                          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                              {language === 'vi' ? '🛠️ Xử lý Tình huống' : '🛠️ Situation Handling'}
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#7c3aed', marginTop: '4px' }}>
                              {interviewReport.situation_handling_score || 0}<span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>/100</span>
                            </div>
                          </div>

                          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                              {language === 'vi' ? '⚙️ Quy trình Vận hành' : '⚙️ Operations'}
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#7c3aed', marginTop: '4px' }}>
                              {interviewReport.operations_score || 0}<span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>/100</span>
                            </div>
                          </div>

                          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                              {language === 'vi' ? '❓ Câu hỏi từ Employer' : '❓ Employer Custom'}
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#7c3aed', marginTop: '4px' }}>
                              {interviewReport.custom_questions_score || 0}<span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>/100</span>
                            </div>
                          </div>
                        </div>

                        <DetailCard $iconColor="#7c3aed">
                          <h4><Sparkles size={18} /> {language === 'vi' ? 'Nhận xét tổng quan của AI:' : 'AI Overview Summary:'}</h4>
                          <p>{interviewReport.reason}</p>
                        </DetailCard>

                        {interviewReport.strengths && interviewReport.strengths.length > 0 && (
                          <DetailCard $iconColor="#10b981">
                            <h4><CheckCircle size={18} /> {language === 'vi' ? 'Điểm mạnh chính:' : 'Key Strengths:'}</h4>
                            <ul>
                              {interviewReport.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                            </ul>
                          </DetailCard>
                        )}

                        {interviewReport.weaknesses && interviewReport.weaknesses.length > 0 && (
                          <DetailCard $iconColor="#f59e0b">
                            <h4><AlertCircle size={18} /> {language === 'vi' ? 'Điểm cần cải thiện:' : 'Areas to Improve:'}</h4>
                            <ul>
                              {interviewReport.weaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
                            </ul>
                          </DetailCard>
                        )}

                        {(interviewReport.recommend_to_employer || interviewReport.total_score >= 60) ? (
                          <div style={{ marginTop: '18px', padding: '14px 16px', background: '#ecfdf5', border: '1.5px solid #6ee7b7', borderRadius: '12px', color: '#065f46', fontSize: '13.5px', fontWeight: '600', lineHeight: '1.5', textAlign: 'center' }}>
                            {language === 'vi'
                              ? '🎉 Chúc mừng! Bạn đã vượt qua vòng phỏng vấn. Hồ sơ của bạn đã được gửi đến nhà tuyển dụng. Vui lòng chờ nhà tuyển dụng phản hồi.'
                              : '🎉 Congratulations! You passed the interview. Your application has been sent to the employer. Please wait for the employer to respond.'}
                          </div>
                        ) : (
                          <div style={{ marginTop: '18px', padding: '14px 16px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '12px', color: '#991b1b', fontSize: '13.5px', fontWeight: '600', lineHeight: '1.5', textAlign: 'center' }}>
                            {language === 'vi'
                              ? 'Rất tiếc, kết quả phỏng vấn chưa đạt yêu cầu nên hồ sơ chưa được gửi đến nhà tuyển dụng.'
                              : 'Unfortunately, your interview result did not meet the requirement, so your application was not sent to the employer.'}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            exitFullscreenMode();
                            setShowAiScreeningModal(false);
                            const isPassed = interviewReport?.recommend_to_employer || (interviewReport?.total_score >= 60);
                            if (isPassed) {
                              setApplySuccess(true);
                              setTimeout(() => setApplySuccess(false), 3000);
                            }
                            setPendingApplication(null);
                          }}
                          style={{
                            width: '100%',
                            marginTop: '16px',
                            padding: '14px',
                            background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '15px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                          }}
                        >
                          {language === 'vi' ? 'Hoàn tất và Quay lại' : 'Finish and Back'}
                        </button>
                      </div>
                    )
                  )}
                </div>
              )
            )}
          </AiScreeningContent>
        </div>
      </Modal>

      {/* AI Rules Modal */}
      <Modal
        isOpen={showAiRulesModal}
        onClose={() => setShowAiRulesModal(false)}
        title=""
      >
        <ApplyModalWrap onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
          <div className="apply-emoji" style={{ fontSize: '40px' }}>⚖️</div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>
            {language === 'vi' ? 'Quy chế Phỏng vấn AI bắt buộc' : 'Mandatory AI Interview Rules'}
          </h3>
          <p className="apply-desc" style={{ marginBottom: '16px', color: '#475569' }}>
            {language === 'vi'
              ? 'Vui lòng đọc kỹ và cam kết tuân thủ các quy tắc dưới đây để đảm bảo tính minh bạch và công bằng:'
              : 'Please read carefully and commit to complying with the rules below to ensure fairness and integrity:'}
          </p>

          <div style={{
            textAlign: 'left',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            maxHeight: '260px',
            overflowY: 'auto',
            fontSize: '13.5px',
            lineHeight: '1.6',
            color: '#334155'
          }}>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
              <span style={{ color: '#ef4444' }}>🚫</span>
              <div>
                <strong>{language === 'vi' ? 'Không tự ý thoát' : 'No Early Exit'}:</strong>{' '}
                {language === 'vi' ? 'Buổi phỏng vấn phải diễn ra liên tục. Bạn không được đóng cửa sổ phỏng vấn nửa chừng.' : 'The interview must run continuously. You must not close the window mid-way.'}
              </div>
            </div>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
              <span style={{ color: '#ef4444' }}>⚠️</span>
              <div>
                <strong>{language === 'vi' ? 'Cấm chuyển Tab (Tab Switching)' : 'Tab Switch Restriction'}:</strong>{' '}
                {language === 'vi' ? 'Chuyển tab hoặc rời khỏi trang lần 1 sẽ bị cảnh cáo. Chuyển tab lần 2 sẽ ngưng phỏng vấn ngay lập tức (đã bỏ tính năng khóa 3 ngày để dễ test).' : 'Switching tabs or minimizing the browser once will trigger a warning. The 2nd time will cancel the interview immediately (3-day ban disabled for testing).'}
              </div>
            </div>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
              <span style={{ color: '#ef4444' }}>🤖</span>
              <div>
                <strong>{language === 'vi' ? 'Cấm sử dụng công cụ hỗ trợ' : 'No External AI Support'}:</strong>{' '}
                {language === 'vi' ? 'Nghiêm cấm sử dụng AI khác (ChatGPT, tool đọc giọng nói...) hoặc sao chép văn bản bên ngoài. Mọi câu trả lời phải là tiếng nói trực tiếp của bạn.' : 'Strictly forbidden to use external AI or voice-gen tools. All answers must be spoken live by you.'}
              </div>
            </div>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
              <span style={{ color: '#ef4444' }}>🔄</span>
              <div>
                <strong>{language === 'vi' ? 'Không tải lại trang (F5)' : 'No Page Reload (F5)'}:</strong>{' '}
                {language === 'vi' ? 'Không bấm F5 hoặc tải lại trang web trong suốt phiên làm việc.' : 'Do not hit F5 or reload the webpage during the session.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: '#ef4444' }}>🔒</span>
              <div>
                <strong>{language === 'vi' ? 'Khóa tính năng Sao chép/Dán' : 'Copy/Paste Disabled'}:</strong>{' '}
                {language === 'vi' ? 'Tính năng sao chép và dán bị vô hiệu hóa hoàn toàn trong suốt buổi phỏng vấn.' : 'Copying and pasting is completely disabled during the interview.'}
              </div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <span style={{ color: '#2563eb' }}>🎤</span>
              <div>
                <strong>{language === 'vi' ? 'Yêu cầu cấp quyền Micro' : 'Microphone Permission Required'}:</strong>{' '}
                {language === 'vi' ? 'Bạn cần cấp quyền sử dụng micro trước khi phỏng vấn. Phỏng vấn sẽ chạy toàn màn hình (fullscreen) để đảm bảo tính công bằng.' : 'You must grant microphone permission before starting. The interview will run in fullscreen mode to ensure fairness.'}
              </div>
            </div>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13.5px',
            fontWeight: '600',
            color: '#1e40af',
            marginBottom: '12px'
          }}>
            <input
              type="checkbox"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>
              {language === 'vi'
                ? 'Tôi đã đọc hiểu và cam kết tuân thủ quy chế phỏng vấn'
                : 'I have read, understood, and commit to the rules'}
            </span>
          </label>

          {/* Mic Permission Request Section */}
          <div style={{
            padding: '12px 16px',
            background: micPermissionGranted ? '#f0fdf4' : '#fefce8',
            border: `1.5px solid ${micPermissionGranted ? '#86efac' : '#fde047'}`,
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: micPermissionGranted ? '#166534' : '#92400e', marginBottom: '2px' }}>
                {micPermissionGranted
                  ? (language === 'vi' ? 'Đã cấp quyền Micro thành công!' : 'Microphone permission granted!')
                  : (language === 'vi' ? 'Cần cấp quyền Micro để bắt đầu' : 'Microphone permission required')}
              </div>
              {!micPermissionGranted && (
                <div style={{ fontSize: '12px', color: '#78716c' }}>
                  {language === 'vi' ? 'Nhấn nút bên phải để cấp quyền' : 'Click button to grant permission'}
                </div>
              )}
              {micPermissionError && (
                <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                  {micPermissionError}
                </div>
              )}
            </div>
            {!micPermissionGranted && (
              <button
                onClick={async () => {
                  setMicPermissionError('');
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    // Stop tracks immediately - just testing permission
                    stream.getTracks().forEach(track => track.stop());
                    setMicPermissionGranted(true);
                  } catch (err) {
                    console.error('Mic permission error:', err);
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                      setMicPermissionError(language === 'vi'
                        ? 'Bạn đã từ chối quyền micro. Vui lòng vào Cài đặt trình duyệt để bật lại.'
                        : 'You denied microphone access. Please enable it in browser settings.');
                    } else {
                      setMicPermissionError(language === 'vi'
                        ? 'Không tìm thấy micro. Vui lòng kiểm tra thiết bị.'
                        : 'No microphone found. Please check your device.');
                    }
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                }}
              >
                {language === 'vi' ? 'Cấp quyền' : 'Grant'}
              </button>
            )}
          </div>

          <div className="apply-buttons">
            <button
              className="btn-cancel"
              onClick={() => setShowAiRulesModal(false)}
              style={{ flex: 1 }}
            >
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              onClick={async () => {
                if (!rulesAccepted || !micPermissionGranted) return;
                setShowAiRulesModal(false);

                // Request fullscreen mode
                try {
                  const elem = document.documentElement;
                  if (elem.requestFullscreen) {
                    await elem.requestFullscreen();
                  } else if (elem.webkitRequestFullscreen) {
                    await elem.webkitRequestFullscreen();
                  } else if (elem.msRequestFullscreen) {
                    await elem.msRequestFullscreen();
                  }
                } catch (fsErr) {
                  console.warn('Fullscreen request failed:', fsErr);
                }

                setAiScreeningStep('interview');
                startInterviewSession(aiScreeningJob, pendingApplication?.finalCVUrl);
              }}
              disabled={!rulesAccepted || !micPermissionGranted}
              style={{
                flex: 1.5,
                padding: '14px 20px',
                background: (rulesAccepted && micPermissionGranted) ? 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)' : '#cbd5e1',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: (rulesAccepted && micPermissionGranted) ? 'pointer' : 'not-allowed',
                boxShadow: (rulesAccepted && micPermissionGranted) ? '0 4px 14px rgba(124, 58, 237, 0.3)' : 'none'
              }}
            >
              {language === 'vi' ? 'Bắt đầu ngay' : 'Start Now'}
            </button>
          </div>
        </ApplyModalWrap>
      </Modal>

      {/* Tab Warning Modal */}
      <Modal
        isOpen={showTabWarningOverlay}
        onClose={() => { }}
        title=""
      >
        <ApplyModalWrap onClick={e => e.stopPropagation()} style={{ border: '2px solid #ef4444' }}>
          <div className="apply-emoji" style={{ fontSize: '40px' }}>🚨</div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444', marginBottom: '12px' }}>
            {language === 'vi' ? 'CẢNH BÁO VI PHẠM!' : 'VIOLATION WARNING!'}
          </h3>
          <p style={{ fontSize: '14.5px', color: '#334155', lineHeight: '1.6', marginBottom: '20px', textAlign: 'center' }}>
            {language === 'vi'
              ? 'Hệ thống phát hiện bạn vừa chuyển tab hoặc rời khỏi trang phỏng vấn (Lần 1).'
              : 'The system detected you switched tabs or left the interview page (1st Time).'}
            <br />
            <strong style={{ color: '#ef4444', marginTop: '10px', display: 'block' }}>
              {language === 'vi'
                ? 'NẾU TIẾP TỤC VI PHẠM LẦN NỮA, BUỔI PHỎNG VẤN SẼ BỊ HỦY NGAY LẬP TỨC VÀ BẠN SẼ BỊ CẤM PHỎNG VẤN TRONG 3 NGÀY!'
                : 'IF YOU VIOLATE AGAIN, THE INTERVIEW WILL BE CANCELLED IMMEDIATELY AND YOU WILL BE BANNED FOR 3 DAYS!'}
            </strong>
          </p>
          <button
            onClick={() => {
              setShowTabWarningOverlay(false);
              if (interviewMessages.length > 0) {
                const lastMsg = interviewMessages[interviewMessages.length - 1];
                if (!lastMsg.isMe) {
                  speakVietnamese(lastMsg.text);
                }
              }
            }}
            style={{
              width: '100%',
              padding: '14px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {language === 'vi' ? 'Tôi đã hiểu và tiếp tục phỏng vấn' : 'I Understand and Resume Interview'}
          </button>
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
                  const action = errorModal.action;
                  setErrorModal({ show: false, message: '' });
                  setApplyModal(null);
                  if (action) action();
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
                {errorModal.action
                  ? (language === 'vi' ? 'Xác minh ngay' : 'Verify Now')
                  : (language === 'vi' ? 'Đã hiểu' : 'Got It')
                }
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
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.company}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
            />
          ) : (
            getCompanyInitial(job.company)
          )}
        </CompanyLogo>
        <JobInfo>
          <JobTitle>
            <DynamicTranslate text={job.title} showIndicator={false} />
            {job.isAiScreeningEnabled && (
              <AiBadge title={language === 'vi' ? 'Công việc này yêu cầu phỏng vấn chọn lọc qua AI' : 'This job requires an AI screening interview'}>
                <Sparkles />
                {language === 'vi' ? 'Phỏng vấn AI' : 'AI Interview'}
              </AiBadge>
            )}
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

        {(job.workDate || job.workDays) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary, #6B7280)' }}>
            <Calendar size={13} style={{ flexShrink: 0 }} />
            <span>
              {language === 'vi' ? 'Hạn nộp:' : 'Deadline:'}
              {' '}
              {job.workDate
                ? (() => {
                    try {
                      const [year, month, day] = job.workDate.split('-');
                      return `${day}/${month}/${year}`;
                    } catch (e) {
                      return job.workDate;
                    }
                  })()
                : job.workDays}
            </span>
          </div>
        )}
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
              onClick={(e) => onSave(job.idJob || job.id, e)}
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
