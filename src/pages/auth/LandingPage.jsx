import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion, useInView } from 'framer-motion';
import { Search, MapPin, Briefcase, Building2, Users, TrendingUp, ArrowRight, Sparkles, Globe, ChevronDown, Bookmark, FileText, ThumbsUp, Star, Upload, BookOpen, Edit3, Folder, Package, Heart, UserPlus, Shield, MessageCircle, Headphones, Moon, Sun, Clock, Mail, Send, Award, Zap, Target, Calendar, Download } from 'lucide-react';
import { Button } from '../../components/FormElements';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import UnderDevelopmentModal from '../../components/UnderDevelopmentModal';

const LandingContainer = styled.div`
  min-height: 80vh;
  background: ${props => props.$isDark ? '#0F172A' : '#e3e7e9'};
  position: relative;
  overflow-x: hidden;
  transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &::before {
    content: 'OP PO';
    position: absolute;
    top: 56%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 550px;
    font-weight: 900;
    line-height: 1;
    color: transparent;
    background: linear-gradient(
      135deg,
      ${props => props.$isDark ? '#1e40af' : '#1a62ff'} 0%,
      ${props => props.$isDark ? '#1e40af' : '#1a62ff'} 20%,
      ${props => props.$isDark ? '#1e40af' : '#002e9d'} 20%,
      ${props => props.$isDark ? '#1e40af' : '#002e9d'} 40%,
      ${props => props.$isDark ? '#1e40af' : '#1a62ff'} 40%,
      ${props => props.$isDark ? '#1e40af' : '#1a62ff'} 60%,
      ${props => props.$isDark ? '#1e40af' : '#002e9d'} 60%,
      ${props => props.$isDark ? '#1e40af' : '#002e9d'} 80%,
      ${props => props.$isDark ? '#1e40af' : '#1a62ff'} 80%,
      ${props => props.$isDark ? '#1e40af' : '#1a62ff'} 100%
    );
    background-size: 300px 300px;
    -webkit-background-clip: text;
    background-clip: text;
    opacity: ${props => props.$isDark ? '0.04' : '0.08'};
    pointer-events: none;
    z-index: 0;
    white-space: nowrap;
    transition: opacity 0.4s ease;
  }
`;

const ScrollContainer = styled.div`
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  
  /* Smooth scrolling with momentum */
  scroll-padding-top: 0;
  overscroll-behavior: contain;
  will-change: scroll-position;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(147, 197, 253, 0.5);
    border-radius: 4px;
    transition: background 0.3s ease;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(147, 197, 253, 0.7);
  }
`;

const Header = styled(motion.header)`
  padding: 0 90px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.$isDark
    ? 'rgba(30, 41, 59, 0.85)'
    : 'rgba(255, 255, 255, 0.85)'};
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid ${props => props.$isDark
    ? 'rgba(75, 85, 99, 0.6)'
    : 'rgba(146, 217, 248, 0.6)'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.$isDark
    ? '0 4px 24px rgba(0, 0, 0, 0.3)'
    : '0 4px 24px #a4ddf8'};
  min-height: 56px;
  
  @media (max-width: 1024px) {
    padding: 0 40px;
    min-height: 52px;
  }
  
  @media (max-width: 768px) {
    padding: 0 16px;
    min-height: 48px;
  }
`;

const Logo = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 14px;
  font-weight: 700;
  color: #002e9d;
  text-decoration: none;
  letter-spacing: -0.3px;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 4px 0;
  
  img {
    height: 45px;
    width: auto;
    object-fit: contain;
    filter: none;
    mix-blend-mode: normal;
  }
  
  span {
    line-height: 1;
    margin-top: 2px;
  }
  
  &:hover {
    transform: scale(1.05);
    color: #002e9d;
  }
  
  @media (max-width: 1024px) {
    font-size: 13px;
    gap: 2px;
    
    img {
      height: 42px;
    }
  }
  
  @media (max-width: 768px) {
    font-size: 12px;
    gap: 1px;
    
    img {
      height: 38px;
    }
  }
  
  @media (max-width: 480px) {
    font-size: 11px;
    
    img {
      height: 35px;
    }
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 40px;
  
  @media (max-width: 1024px) {
    gap: 20px;
  }
  
  @media (max-width: 768px) {
    gap: 0;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  
  @media (max-width: 1024px) {
    gap: 10px;
  }
  
  @media (max-width: 768px) {
    gap: 8px;
  }
  
  @media (max-width: 480px) {
    gap: 6px;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  
  a {
    color: ${props => props.$isDark ? '#e2e8f0' : '#000000'};
    font-weight: 700;
    font-size: 15px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      color: #0EA5E9;
      transform: translateY(-2px);
    }
  }
  
  @media (max-width: 1024px) {
    gap: 4px;
    
    a {
      font-size: 14px;
    }
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLinkItem = styled(Link)`
  color: #000000;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    color: #0EA5E9;
    background: rgba(14, 165, 233, 0.05);
  }
  
  @media (max-width: 1024px) {
    font-size: 14px;
    padding: 7px 10px;
  }
  
  @media (max-width: 768px) {
    font-size: 13px;
    padding: 6px 8px;
  }
`;

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.$isDark ? '#e2e8f0' : '#000000'};
  font-weight: 700;
  font-size: 15px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    color: #0EA5E9;
    background: ${props => props.$isDark
    ? 'rgba(14, 165, 233, 0.1)'
    : 'rgba(14, 165, 233, 0.05)'};
  }
  
  svg {
    width: 16px;
    height: 16px;
    transition: transform 0.3s;
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
  
  @media (max-width: 1024px) {
    font-size: 14px;
    padding: 7px 10px;
    gap: 5px;
    
    svg {
      width: 15px;
      height: 15px;
    }
  }
  
  @media (max-width: 768px) {
    font-size: 13px;
    padding: 6px 8px;
    gap: 4px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: ${props => props.$isDark ? 'rgba(30, 41, 59, 0.98)' : 'white'};
  border-radius: 12px;
  box-shadow: ${props => props.$isDark
    ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.2)'
    : '0 8px 32px rgba(147, 197, 253, 0.25), 0 4px 16px rgba(0, 0, 0, 0.1)'};
  padding: 8px;
  min-width: 220px;
  z-index: 1000;
  border: 1px solid ${props => props.$isDark
    ? 'rgba(75, 85, 99, 0.5)'
    : 'rgba(147, 197, 253, 0.3)'};
  backdrop-filter: blur(20px);
  transition: background 0.3s ease;
`;

const LargeDropdownMenu = styled(motion.div)`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: ${props => props.$isDark ? 'rgba(30, 41, 59, 0.98)' : 'white'};
  border-radius: 16px;
  box-shadow: ${props => props.$isDark
    ? '0 12px 48px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3)'
    : '0 12px 48px rgba(147, 197, 253, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1)'};
  padding: 16px;
  min-width: 800px;
  z-index: 1000;
  border: 1px solid ${props => props.$isDark
    ? 'rgba(75, 85, 99, 0.5)'
    : 'rgba(147, 197, 253, 0.3)'};
  display: flex;
  gap: 20px;
  backdrop-filter: blur(20px);

  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 0;
    right: 0;
    height: 8px;
  }
  transition: background 0.3s ease;
  
  @media (max-width: 1024px) {
    min-width: 600px;
    padding: 12px;
    gap: 16px;
  }
  
  @media (max-width: 768px) {
    min-width: 90vw;
    left: 50%;
    transform: translateX(-50%);
    flex-direction: column;
  }
`;

const DropdownSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DropdownSectionTitle = styled.h3`
  font-size: 12px;
  font-weight: 700;
  color: ${props => props.$isDark ? '#94A3B8' : '#94A3B8'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  padding: 0 8px;
`;

const GreenSectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 700;
  color: #002e9d;
  margin-bottom: 6px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const CVTemplateItem = styled(motion(Link))`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  color: ${props => props.$isDark ? '#cbd5e1' : '#475569'};
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  &:hover {
    background: rgba(14, 165, 233, 0.1);
    color: #0EA5E9;
    transform: translateX(2px);
  }
  
  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.$isDark ? '#94A3B8' : '#64748B'};
  }
  
  &:hover svg {
    color: #0EA5E9;
  }
`;

const DropdownLeftColumn = styled.div`
  flex-shrink: 0;
  width: 200px;
  border-right: 1px solid ${props => props.$isDark
    ? 'rgba(75, 85, 99, 0.3)'
    : 'rgba(0, 0, 0, 0.06)'};
  padding-right: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DropdownRightColumn = styled.div`
  flex: 1;
`;

const JobCategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-top: 6px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DropdownItem = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 6px 15px;
  color: ${props => props.$isDark ? '#e2e8f0' : '#0F172A'};
  text-decoration: none;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 6px;
  
  &:hover {
    background: rgba(14, 165, 233, 0.1);
    color: #0EA5E9;
    transform: translateX(4px);
  }
  
  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: ${props => props.$isDark ? '#94A3B8' : '#64748B'};
  }
  
  &:hover svg {
    color: #0EA5E9;
  }
`;

const JobCategoryItem = styled(Link)`
  display: block;
  padding: 7px 12px;
  color: ${props => props.$isDark ? '#cbd5e1' : '#475569'};
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: rgba(14, 165, 233, 0.1);
    color: #0EA5E9;
    transform: translateX(2px);
  }
`;

const ProBadge = styled.span`
  background: linear-gradient(135deg, #FFA500, #FF8C00);
  color: white;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const LanguageToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: ${props => props.$isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  border: 2px solid ${props => props.$isDark ? 'rgba(75, 85, 99, 0.4)' : 'rgba(147, 197, 253, 0.4)'};
  border-radius: 10px;
  color: ${props => props.$isDark ? '#e2e8f0' : '#000000'};
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(15px);
  box-shadow: 0 4px 16px rgba(147, 197, 253, 0.2);
  
  @media (max-width: 1024px) {
    padding: 8px 14px;
    font-size: 13px;
    gap: 5px;
  }
  
  @media (max-width: 768px) {
    padding: 7px 12px;
    font-size: 12px;
    gap: 4px;
    border-radius: 8px;
  }
  
  @media (max-width: 480px) {
    padding: 6px 10px;
    font-size: 11px;
    gap: 3px;
    border-width: 1.5px;
  }
  &:hover {
    background: ${props => props.$isDark ? 'rgba(30, 41, 59, 1)' : 'rgba(255, 255, 255, 1)'};
    border-color: #0EA5E9;
    color: #0EA5E9;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.3);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const HeroSection = styled(motion.section)`
  width: 100%;
  padding: 40px 50px 80px;
  text-align: center;
  position: relative;
  min-height: 100vh;
  height: 900px;
  display: flex;
  align-items: top;
  justify-content: center;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  overflow: hidden;

  @media (max-width: 1024px) {
    padding: 40px 40px 60px;
  }

  @media (max-width: 768px) {
    padding: 35px 20px 40px;
    height: auto;
    min-height: auto;
  }

  @media (max-width: 480px) {
    padding: 30px 16px 30px;
  }
`;

const AnimatedBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: ${props => props.$isDark ? '#0f172a' : '#002e9d'};
  transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &::after {
    content: '';
    position: absolute;
    top: -100%;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${props => props.$isDark
    ? `linear-gradient(
          to bottom,
          rgba(30, 64, 175, 0) 0%,
          rgba(30, 64, 175, 0.2) 50%,
          rgba(30, 64, 175, 0) 100%
        )`
    : `linear-gradient(
          to bottom,
          rgba(26, 98, 255, 0) 0%,
          rgba(26, 98, 255, 0.3) 50%,
          rgba(26, 98, 255, 0) 100%
        )`};
    animation: moveDown 8s ease-in-out infinite;
    transition: background 0.4s ease;
    z-index: 2;
  }
  
  @keyframes moveDown {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(200%);
    }
    100% {
      transform: translateY(0);
    }
  }
  
  @keyframes gradientShift {
    0%, 100% {
      transform: translate(0, 0) scale(1);
      opacity: 0.3;
    }
    50% {
      transform: translate(-5%, -5%) scale(1.05);
      opacity: 0.25;
    }
  }
  
  @keyframes glowPulse {
    0%, 100% {
      opacity: 0.4;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(20px, -20px);
    }
  }
`;

const GradientGlow = styled(motion.div)`
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(147, 197, 253, 0.25) 0%, rgba(251, 207, 232, 0.2) 30%, transparent 70%);
  filter: blur(60px);
  animation: glowPulse 8s ease-in-out infinite;
  pointer-events: none;
  will-change: transform, opacity;
  z-index: 1;
`;

const GradientBlob = styled(motion.div)`
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  will-change: transform;
`;

const GridPattern = styled.div`
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(30, 64, 175, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30, 64, 175, 0.03) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 75%);
  opacity: 0.5;
  z-index: 0;
`;

const GlassmorphismLayer = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.05) 50%, 
    rgba(255, 255, 255, 0.1) 100%);
  backdrop-filter: blur(1px);
  z-index: 3;
  pointer-events: none;
`;

const NoiseTexture = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.03;
  z-index: 2;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 200px 200px;
`;

const AuroraLayer = styled(motion.div)`
  position: absolute;
  inset: -20%;
  background: 
    radial-gradient(circle at 25% 25%, rgba(147, 197, 253, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(251, 207, 232, 0.25) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(253, 242, 248, 0.2) 0%, transparent 60%);
  filter: blur(100px);
  opacity: 0.7;
  animation: auroraDrift 25s ease-in-out infinite alternate;
  will-change: transform;
  z-index: 0;

  @keyframes auroraDrift {
    0% {
      transform: rotate(-2deg) scale(1) translate(0, 0);
    }
    100% {
      transform: rotate(2deg) scale(1.08) translate(-3%, -2%);
    }
  }
`;

const StarLayer = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
`;

const Particle = styled(motion.span)`
  position: absolute;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, rgba(30, 64, 175, 0.4) 0%, rgba(30, 64, 175, 0.2) 50%, transparent 70%);
  border-radius: 50%;
  opacity: 0.8;
  box-shadow: 0 0 10px rgba(30, 64, 175, 0.3);
`;

const WavePattern = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 400px;
  overflow: hidden;
  
  svg {
    position: absolute;
    width: 100%;
    height: 100%;
  }
`;

const FloatingIcon = styled(motion.div)`
  position: absolute;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  
  svg {
    width: 20px;
    height: 20px;
    color: rgba(255, 255, 255, 0.8);
  }
`;

const GeometricShape = styled(motion.div)`
  position: absolute;
  border: 2px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
  background: rgba(255, 255, 255, 0.05);
`;

const CircuitPattern = styled(motion.div)`
  position: absolute;
  width: 200px;
  height: 200px;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    background: rgba(147, 197, 253, 0.2);
  }
  
  &::before {
    width: 2px;
    height: 60%;
    left: 50%;
    top: 0;
  }
  
  &::after {
    width: 60%;
    height: 2px;
    top: 50%;
    left: 0;
  }
`;

const DottedCircle = styled(motion.div)`
  position: absolute;
  width: 80px;
  height: 80px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 50%;
`;

const ConnectionLine = styled(motion.div)`
  position: absolute;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(147, 197, 253, 0.3) 50%, 
    transparent 100%
  );
  height: 2px;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 6px;
    height: 6px;
    background: rgba(147, 197, 253, 0.6);
    border-radius: 50%;
    top: 50%;
    transform: translateY(-50%);
    box-shadow: 0 0 10px rgba(147, 197, 253, 0.8);
  }
  
  &::before {
    left: 0;
  }
  
  &::after {
    right: 0;
  }
`;

const SmallFloatingDot = styled(motion.div)`
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(147, 197, 253, 0.6);
`;

const CornerPattern = styled(motion.div)`
  position: absolute;
  width: 200px;
  height: 200px;
  opacity: 0.15;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    background: rgba(147, 197, 253, 0.3);
    border-radius: 2px;
  }
`;

const TopLeftPattern = styled(CornerPattern)`
  top: 0;
  left: 0;
  
  &::before {
    width: 3px;
    height: 100px;
    top: 0;
    left: 20px;
  }
  
  &::after {
    width: 100px;
    height: 3px;
    top: 20px;
    left: 0;
  }
`;

const BottomRightPattern = styled(CornerPattern)`
  bottom: 0;
  right: 0;
  
  &::before {
    width: 3px;
    height: 100px;
    bottom: 0;
    right: 20px;
  }
  
  &::after {
    width: 100px;
    height: 3px;
    bottom: 20px;
    right: 0;
  }
`;

const MiniSquare = styled(motion.div)`
  position: absolute;
  width: 12px;
  height: 12px;
  background: rgba(147, 197, 253, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2px;
`;

const FloatingShape = styled(motion.div)`
  position: absolute;
  background: ${props => props.gradient || 'linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(30, 64, 175, 0.2))'};
  opacity: ${props => props.opacity || 0.15};
  border-radius: ${props => props.rounded ? '50%' : '40%'};
  filter: blur(${props => props.blur || '80'}px);
  z-index: 1;
  will-change: transform, opacity;
  animation: ${props => props.float ? 'float 20s ease-in-out infinite' : 'none'};
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 10;
  margin-top: 80px;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  
  @media (max-width: 768px) {
    margin-top: 0;
  }
`;

const HeroTitle = styled(motion.h1)`
  font-size: 56px;
  font-weight: 900;
  line-height: 1.2;
  margin-bottom: 20px;
  color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  letter-spacing: -2px;
  white-space: nowrap;
  
  span {
    animation: blink 1s infinite;
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  @media (max-width: 1200px) {
    font-size: 48px;
    white-space: normal;
  }
  
  @media (max-width: 1024px) {
    font-size: 42px;
    letter-spacing: -1.5px;
  }
  
  @media (max-width: 768px) {
    font-size: 32px;
    white-space: normal;
    letter-spacing: -1px;
  }
  
  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 20px;
  color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  margin-bottom: 40px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  font-weight: 600;
  opacity: 0.9;
  
  span {
    animation: blink 1s infinite;
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  @media (max-width: 1024px) {
    font-size: 18px;
    margin-bottom: 40px;
  }
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 20px;
  }
  
  @media (max-width: 480px) {
    font-size: 14px;
    margin-bottom: 16px;
  }
`;

const SearchContainer = styled(motion.div)`
  max-width: 800px;
  margin: 0 auto 40px;
  
  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
  
  @media (max-width: 480px) {
    margin-bottom: 14px;
  }
  background: ${props => props.$isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)'};
  backdrop-filter: blur(30px);
  border: 2px solid ${props => props.$isDark ? 'rgba(75, 85, 99, 0.4)' : 'rgba(147, 197, 253, 0.4)'};
  padding: 0;
  border-radius: 16px;
  box-shadow: ${props => props.$isDark
    ? '0 12px 48px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.5)'
    : '0 12px 48px rgba(147, 197, 253, 0.25), 0 4px 16px rgba(251, 207, 232, 0.2)'};
  display: flex;
  gap: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  &:hover {
    box-shadow: ${props => props.$isDark
    ? '0 16px 64px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.25)'
    : '0 16px 64px rgba(147, 197, 253, 0.3), 0 8px 24px rgba(251, 207, 232, 0.25)'};
    border-color: #0EA5E9;
    transform: translateY(-3px);
  }
  
  button {
    border-radius: 0 14px 14px 0;
    padding: 16px 32px;
    flex-shrink: 0;
  }
  
  @media (max-width: 1024px) {
    max-width: 90%;
    
    button {
      padding: 14px 24px;
    }
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    max-width: 90%;
    
    button {
      border-radius: 0 0 14px 14px;
      width: 100%;
      padding: 14px 24px;
    }
  }
  
  @media (max-width: 480px) {
    max-width: 95%;
    border-radius: 12px;
    
    button {
      border-radius: 0 0 10px 10px;
      padding: 12px 20px;
      font-size: 14px;
    }
  }
`;

const SearchInput = styled.div`
  flex: ${props => props.$wide ? '6' : '0.4'};
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: ${props => props.$isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)'};
  border-radius: 0;
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  
  &:first-of-type {
    border-radius: 12px 0 0 12px;
    
    &::after {
      content: '';
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 1px;
      height: 24px;
      background: ${props => props.$isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(100, 116, 139, 0.3)'};
    }
  }
  
  &:focus-within {
    background: ${props => props.$isDark ? 'rgba(15, 23, 42, 1)' : 'rgba(255, 255, 255, 1)'};
    z-index: 1;
  }
  
  svg {
    width: 20px;
    height: 20px;
    color: #0EA5E9;
    flex-shrink: 0;
  }
  
  input {
    flex: 1;
    border: none;
    background: none;
    font-size: 15px;
    color: ${props => props.$isDark ? '#f1f5f9' : '#0F172A'};
    font-weight: 500;
    
    &::placeholder {
      color: ${props => props.$isDark ? '#94a3b8' : '#64748B'};
      font-weight: 500;
    }
    
    &:focus {
      outline: none;
    }
  }
  
  @media (max-width: 1024px) {
    padding: 12px 16px;
    
    input {
      font-size: 14px;
    }
  }
  
  @media (max-width: 768px) {
    flex: 1;
    
    &:first-of-type {
      border-radius: 12px 12px 0 0;
      
      &::after {
        display: none;
      }
    }
    
    &:nth-of-type(2) {
      border-top: 1px solid ${props => props.$isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(100, 116, 139, 0.3)'};
    }
  }
  
  @media (max-width: 480px) {
    padding: 10px 14px;
    gap: 8px;
    
    svg {
      width: 18px;
      height: 18px;
    }
    
    input {
      font-size: 13px;
    }
  }
`;

const BannerContainer = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 20px;
  margin: 10px 0 0;
  width: 100%;
  max-width: 1200px;
  padding: 0;
  
  @media (max-width: 1024px) {
    gap: 16px;
  }
  
  @media (max-width: 968px) {
    flex-direction: column;
    gap: 20px;
    width: 100%;
  }
  
  @media (max-width: 768px) {
    margin-top: 16px;
  }
  
  @media (max-width: 480px) {
    gap: 12px;
    margin-top: 12px;
  }
`;

const StatsCard = styled(motion.div)`
  background: linear-gradient(135deg, #4a68a8 0%, #5b7fc4 100%);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 380px;
  max-width: 420px;
  height: 300px;
  align-self: flex-start;
  
  @media (max-width: 1024px) {
    min-width: 320px;
    max-width: 380px;
    padding: 18px 20px;
  }
  
  @media (max-width: 968px) {
    width: 100%;
    min-width: auto;
    max-width: none;
    height: auto;
  }
  
  @media (max-width: 480px) {
    padding: 16px 18px;
    border-radius: 12px;
  }
`;

const StatsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  white-space: nowrap;
  
  svg {
    width: 17px;
    height: 17px;
    flex-shrink: 0;
  }
  
  @media (max-width: 768px) {
    font-size: 12px;
    gap: 6px;
    
    svg {
      width: 15px;
      height: 15px;
    }
  }
  
  @media (max-width: 480px) {
    font-size: 11px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 7px 0;
`;

const StatItem = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1.5;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  
  @media (max-width: 768px) {
    font-size: 11px;
  }
  
  @media (max-width: 480px) {
    font-size: 10px;
  }
`;

const StatValue = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  color: white;
  font-size: 20px;
  font-weight: 700;
  white-space: nowrap;
  
  svg {
    width: 17px;
    height: 17px;
    color: #a3f7a3;
    flex-shrink: 0;
  }
  
  @media (max-width: 768px) {
    font-size: 18px;
    gap: 5px;
    
    svg {
      width: 15px;
      height: 15px;
    }
  }
  
  @media (max-width: 480px) {
    font-size: 16px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const BannerWrapper = styled(motion.div)`
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 20px;
  justify-content: flex-end;
  align-items: flex-start;
  
  @media (max-width: 968px) {
    flex-direction: column;
    justify-content: center;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MascotImage = styled.img`
  display: none; /* Temporarily hidden */
  width: auto;
  height: 350px;
  object-fit: contain;
  mix-blend-mode: multiply;
  filter: contrast(1.1) brightness(1.05);
  flex-shrink: 0;
  
  @media (max-width: 968px) {
    height: 350px;
  }
`;

const MainBanner = styled(motion.img)`
  width: auto;
  max-width: 500px;
  height: auto;
  max-height: 300px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55), 0 8px 24px rgba(147, 197, 253, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
  object-fit: contain;
  
  @media (max-width: 968px) {
    width: 100%;
    max-width: 1000px;
    height: auto;
  }
`;

const SecondaryBanner = styled(motion.img)`
  width: auto;
  max-width: 600px;
  height: auto;
  max-height: 450px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55), 0 8px 24px rgba(147, 197, 253, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
  object-fit: contain;
  
  @media (max-width: 968px) {
    width: 100%;
    max-width: 1000px;
    height: auto;
  }
`;

const CTAButtons = styled(motion.div)`
  display: flex;
  gap: 16px;
  justify-content: center;
`;

const CompaniesSection = styled.section`
  max-width: 1440px;
  margin: 0 auto;
  padding: 100px 80px;
  text-align: center;
  position: relative;
  
  @media (max-width: 1024px) {
    padding: 80px 40px;
  }
  
  @media (max-width: 768px) {
    padding: 60px 20px;
  }
  
  @media (max-width: 480px) {
    padding: 40px 16px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$isDark ? '#94A3B8' : '#64748B'};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    font-size: 11px;
    letter-spacing: 0.8px;
    margin-bottom: 12px;
  }
  
  @media (max-width: 480px) {
    font-size: 10px;
    letter-spacing: 0.6px;
  }
`;

const LogosGrid = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 64px;
  flex-wrap: wrap;
  
  @media (max-width: 1024px) {
    gap: 48px;
  }
  
  @media (max-width: 768px) {
    gap: 32px;
  }
  
  @media (max-width: 480px) {
    gap: 24px;
  }
`;

const CompanyLogo = styled(motion.div)`
  width: 200px;
  height: 100px;
  background: ${props => props.$isDark ? 'rgba(30, 41, 59, 0.95)' : '#FFFFFF'};
  border: 1px solid ${props => props.$isDark
    ? 'rgba(75, 85, 99, 0.4)'
    : 'rgba(147, 197, 253, 0.2)'};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 24px;
  color: ${props => props.$isDark ? '#94A3B8' : '#64748B'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.$isDark
    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
    : '0 2px 8px rgba(147, 197, 253, 0.1)'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$isDark
    ? '0 4px 16px rgba(30, 64, 175, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)'
    : '0 4px 16px rgba(147, 197, 253, 0.2), 0 2px 8px rgba(251, 207, 232, 0.15)'};
    border-color: #0EA5E9;
    color: #0EA5E9;
  }
`;

const CategoriesSection = styled.section`
  max-width: 1440px;
  margin: 0 auto;
  padding: 120px 80px;
  position: relative;
  
  @media (max-width: 1024px) {
    padding: 80px 40px;
  }
  
  @media (max-width: 768px) {
    padding: 60px 20px;
  }
  
  @media (max-width: 480px) {
    padding: 40px 16px;
  }
`;

const CategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-top: 48px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-top: 32px;
  }
  
  @media (max-width: 480px) {
    gap: 12px;
    margin-top: 24px;
  }
`;

const CategoryCard = styled(motion.div)`
  background: ${props => props.$isDark ? 'rgba(30, 41, 59, 0.95)' : '#FFFFFF'};
  padding: 32px 24px;
  border-radius: 16px;
  border: 1px solid ${props => props.$isDark
    ? 'rgba(75, 85, 99, 0.4)'
    : 'rgba(0, 0, 0, 0.06)'};
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  @media (max-width: 1024px) {
    padding: 28px 20px;
  }
  
  @media (max-width: 768px) {
    padding: 24px 18px;
    border-radius: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 20px 16px;
    border-radius: 10px;
  }
  box-shadow: ${props => props.$isDark
    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
    : '0 2px 8px rgba(0, 0, 0, 0.04)'};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.$isDark
    ? '0 8px 24px rgba(0, 0, 0, 0.4)'
    : '0 8px 24px rgba(0, 0, 0, 0.08)'};
    border-color: ${props => props.$isDark
    ? 'rgba(30, 64, 175, 0.4)'
    : 'rgba(30, 64, 175, 0.2)'};
  }
`;

const CategoryIcon = styled.div`
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #1e40af, #1e40af);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  svg {
    width: 28px;
    height: 28px;
  }
  
  ${CategoryCard}:hover & {
    transform: scale(1.1);
  }
`;

const CategoryTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${props => props.$isDark ? '#f1f5f9' : '#0F172A'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${CategoryCard}:hover & {
    color: #1e40af;
  }
  
  @media (max-width: 1024px) {
    font-size: 17px;
  }
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 6px;
  }
  
  @media (max-width: 480px) {
    font-size: 15px;
  }
`;

const CategoryCount = styled.p`
  font-size: 14px;
  color: ${props => props.$isDark ? '#94A3B8' : '#64748B'};
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
  
  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const TechBannerSection = styled(motion.section)`
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1420 100%);
  padding: 80px 60px;
  position: relative;
  overflow: hidden;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(30, 64, 175, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.12) 0%, transparent 50%);
    pointer-events: none;
    transition: opacity 0.4s ease;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(30, 64, 175, 0.08) 0%, transparent 70%);
    filter: blur(60px);
    animation: pulse 8s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
  }
  
  @media (max-width: 768px) {
    padding: 60px 20px;
    min-height: 50vh;
  }
`;

const TechBannerContent = styled.div`
  max-width: 1200px;
  width: 100%;
  position: relative;
  z-index: 2;
`;

const TechBannerImage = styled(motion.img)`
  width: 100%;
  height: auto;
  border-radius: 20px;
  box-shadow: 
    0 25px 80px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(30, 64, 175, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(30, 64, 175, 0.2);
  filter: brightness(1.05) contrast(1.1);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 
      0 35px 100px rgba(0, 0, 0, 0.6),
      0 0 60px rgba(30, 64, 175, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    filter: brightness(1.1) contrast(1.15);
  }
  
  @media (max-width: 768px) {
    border-radius: 12px;
  }
`;

const CTASection = styled.section`
  max-width: 1440px;
  margin: 0 auto;
  padding: 100px 80px;
  display: none;
`;

const CTACard = styled(motion.div)`
  background: ${props => props.$isDark
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)'
    : 'linear-gradient(135deg, #dceaf9 0%, #ffffffb3 100%)'};
  border: 1px solid ${props => props.$isDark
    ? 'rgba(75, 85, 99, 0.4)'
    : 'rgba(0, 0, 0, 0.06)'};
  padding: 80px 60px;
  border-radius: 24px;
  text-align: center;
  position: relative;
  box-shadow: ${props => props.$isDark
    ? '0 4px 24px rgba(0, 0, 0, 0.3)'
    : '0 4px 24px rgba(0, 0, 0, 0.04)'};
`;

const CTATitle = styled.h2`
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  color: ${props => props.$isDark ? '#f1f5f9' : '#0F172A'};
  letter-spacing: -1px;
  
  @media (max-width: 1024px) {
    font-size: 40px;
  }
  
  @media (max-width: 768px) {
    font-size: 32px;
    margin-bottom: 12px;
  }
  
  @media (max-width: 480px) {
    font-size: 28px;
    letter-spacing: -0.5px;
  }
`;

const CTAText = styled.p`
  font-size: 18px;
  color: ${props => props.$isDark ? '#94A3B8' : '#64748B'};
  margin-bottom: 32px;
  font-weight: 400;
  
  @media (max-width: 1024px) {
    font-size: 17px;
  }
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 24px;
  }
  
  @media (max-width: 480px) {
    font-size: 14px;
    margin-bottom: 20px;
  }
`;

const DownloadAppSection = styled(motion.section)`
  padding: 60px 90px;
  background: ${props => props.$isDark
    ? '#0c4a6e'
    : '#EFF6FF'};
  max-width: 1440px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  align-items: center;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  
  @media (max-width: 1024px) {
    padding: 50px 40px;
  }
  
  @media (max-width: 768px) {
    padding: 40px 20px;
    height: auto;
    min-height: 100vh;
  }
  
  @media (max-width: 480px) {
    padding: 30px 16px;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.$isDark
    ? 'radial-gradient(circle at 20% 50%, rgba(14, 165, 233, 0.15) 0%, transparent 50%)'
    : 'radial-gradient(circle at 80% 50%, rgba(14, 165, 233, 0.08) 0%, transparent 50%)'};
    pointer-events: none;
    z-index: 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: ${props => props.$isDark
    ? 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)'
    : 'radial-gradient(rgba(14, 165, 233, 0.04) 1px, transparent 1px)'};
    background-size: 20px 20px;
    pointer-events: none;
    opacity: 0.5;
    z-index: 0;
  }
`;

const DownloadAppContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
  width: 100%;
  position: relative;
  z-index: 1;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
`;

const DownloadAppLeft = styled.div`
  flex: 1;
  max-width: 600px;
`;

const DownloadAppTitle = styled(motion.h2)`
  font-size: 44px;
  font-weight: 900;
  color: ${props => props.$isDark ? '#ffffff' : '#0c4a6e'};
  margin-bottom: 12px;
  line-height: 1.1;
  transition: color 0.4s ease;
  
  @media (max-width: 1024px) {
    font-size: 38px;
  }
  
  @media (max-width: 768px) {
    font-size: 32px;
    text-align: center;
  }
  
  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

const DownloadAppSubtitle = styled(motion.p)`
  font-size: 18px;
  color: ${props => props.$isDark ? '#cbd5e1' : '#0369a1'};
  margin-bottom: 32px;
  font-weight: 500;
  transition: color 0.4s ease;
  
  @media (max-width: 1024px) {
    font-size: 17px;
  }
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 24px;
    text-align: center;
  }
  
  @media (max-width: 480px) {
    font-size: 14px;
    margin-bottom: 20px;
  }
`;

const DownloadOptions = styled.div`
  display: flex;
  gap: 30px;
  align-items: center;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 24px;
    align-items: center;
  }
`;

const QRCodeSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const QRCode = styled.div`
  width: 120px;
  height: 120px;
  background: ${props => props.$isDark ? '#1e293b' : 'white'};
  border: 2px solid ${props => props.$isDark
    ? 'rgba(14, 165, 233, 0.3)'
    : 'rgba(14, 165, 233, 0.2)'};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${props => props.$isDark
    ? '0 4px 16px rgba(0, 0, 0, 0.5)'
    : '0 4px 16px rgba(14, 165, 233, 0.12)'};
  padding: 10px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

const QRText = styled.p`
  font-size: 13px;
  color: ${props => props.$isDark ? '#cbd5e1' : '#0369a1'};
  font-weight: 500;
  transition: color 0.4s ease;
`;

const StoreButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StoreButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0;
  background: transparent;
  border-radius: 10px;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
  
  img {
    display: block;
  }
`;

const StoreButtonText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const StoreButtonLabel = styled.span`
  font-size: 11px;
  color: white;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StoreButtonName = styled.span`
  font-size: 18px;
  color: white;
  font-weight: 700;
`;

const DownloadAppStats = styled.div`
  display: flex;
  gap: 60px;
  align-items: flex-start;
  justify-content: center;
  margin-top: 16px;
  
  @media (max-width: 1024px) {
    gap: 40px;
  }
  
  @media (max-width: 768px) {
    justify-content: center;
    flex-wrap: wrap;
    gap: 30px;
  }
  
  @media (max-width: 480px) {
    gap: 24px;
  }
`;

const DownloadAppStatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  align-items: center;
  text-align: center;
`;

const DownloadAppStatValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const DownloadAppStatStars = styled.div`
  display: flex;
  gap: 4px;
  color: #FFB800;
`;

const DownloadAppStatNumber = styled.span`
  font-size: 32px;
  font-weight: 900;
  color: #FFB800;
  line-height: 1;
`;

const DownloadAppStatLabel = styled.span`
  font-size: 14px;
  color: ${props => props.$isDark ? '#cbd5e1' : '#0369a1'};
  font-weight: 600;
`;

const DownloadAppRight = styled(motion.div)`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const PhoneMockup = styled.div`
  width: 280px;
  height: 560px;
  background: #1f2937;
  border-radius: 32px;
  padding: 10px;
  box-shadow: 
    0 40px 80px rgba(0, 0, 0, 0.25),
    0 16px 32px rgba(0, 0, 0, 0.15),
    inset 0 0 0 2px rgba(255, 255, 255, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 24px;
    background: #1f2937;
    border-radius: 0 0 16px 16px;
    z-index: 10;
  }
  
  @media (max-width: 768px) {
    width: 240px;
    height: 480px;
  }
`;

const PhoneScreen = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #002e9d 0%, #0EA5E9 100%);
  border-radius: 26px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const AppPreview = styled.div`
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  padding: 45px 16px 16px;
  gap: 12px;
`;

const AppSearchBar = styled.div`
  background: #f3f4f6;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  color: #1f2937;
  font-weight: 600;
  min-height: 33px;
  
  span {
    color: #1f2937;
    font-weight: 600;
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
`;

const AppServiceCard = styled.div`
  background: linear-gradient(135deg, #002e9d 0%, #0EA5E9 100%);
  padding: 18px;
  border-radius: 14px;
  color: white;
  
  h3 {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 6px;
  }
  
  p {
    font-size: 12px;
    opacity: 0.9;
  }
`;

const Footer = styled(motion.footer)`
  background: ${props => props.$isDark ? '#0F172A' : '#ffffff'};
  border-top: 1px solid ${props => props.$isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(0, 0, 0, 0.06)'};
  padding: 80px 80px 20px;
  max-width: 1440px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  scroll-snap-align: end;
  scroll-snap-stop: always;
  transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  @media (max-width: 1024px) { padding: 70px 40px 20px; }
  @media (max-width: 768px) { padding: 60px 20px 20px; height: auto; min-height: 100vh; }
  @media (max-width: 480px) { padding: 50px 16px 20px; }
`;

const FooterMain = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  flex: 1;
  @media (max-width: 1024px) { flex-direction: column; }
`;

const FooterLeft = styled.div`
  flex: 0 0 280px;
  .logo-area {
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
    .logo-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        text-decoration: none;
        img { height: 65px; }
        span { font-size: 15px; font-weight: 700; color: #002e9d; letter-spacing: -0.3px; line-height: 1; margin-top: 2px;}
    }
    p { font-size: 13px; font-weight: 600; color: ${props => props.$isDark ? '#e2e8f0' : '#1e40af'}; line-height: 1.4; margin-top: 4px; }
  }
  .contact-info {
    margin-bottom: 16px;
    h4 { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: ${props => props.$isDark ? '#F1F5F9' : '#0F172A'}; }
    p { font-size: 13px; color: ${props => props.$isDark ? '#94A3B8' : '#475569'}; margin-bottom: 4px; }
  }
  .app-download {
    h4 { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: ${props => props.$isDark ? '#F1F5F9' : '#0F172A'}; }
    .badges {
      display: flex; gap: 8px;
      img { height: 32px; border-radius: 6px; cursor: pointer; border: 1px solid ${props => props.$isDark ? '#334155' : '#e2e8f0'}; }
    }
  }
`;

const FooterLinksWrap = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); gap: 20px; }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const FooterLinkCol = styled.div`
  h4 { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: ${props => props.$isDark ? '#F1F5F9' : '#0F172A'}; }
  a {
    display: block; font-size: 13px; color: ${props => props.$isDark ? '#94A3B8' : '#475569'};
    margin-bottom: 8px; text-decoration: none; transition: color 0.2s;
    &:hover { color: #1e40af; }
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid ${props => props.$isDark ? '#334155' : '#e2e8f0'};
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  @media (max-width: 768px) { flex-direction: column; gap: 20px; }
`;

const CompanyDetails = styled.div`
  flex: 1;
  h3 { font-size: 15px; font-weight: 700; color: ${props => props.$isDark ? '#F1F5F9' : '#0F172A'}; margin-bottom: 12px; }
  p {
    font-size: 12px; color: ${props => props.$isDark ? '#94A3B8' : '#475569'}; margin-bottom: 4px; display: flex; align-items: flex-start; gap: 6px; line-height: 1.4;
    span { color: #10b981; font-weight: bold; padding-top: 1px; }
  }
  .ecosystem {
    margin-top: 16px;
    h4 { font-size: 13px; font-weight: 600; color: ${props => props.$isDark ? '#F1F5F9' : '#0F172A'}; margin-bottom: 8px; }
    .badges {
      display: flex; gap: 8px; flex-wrap: wrap;
      .badge {
        display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 6px; color: white; font-size: 11px; font-weight: 600; text-align: left; line-height: 1.3; max-width: 220px;
        &.blue { background: #1e40af; }
        &.green { background: #10b981; }
        &.orange { background: #f59e0b; }
      }
    }
  }
`;

const QrCodeArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
  img { height: 100px; width: 100px; border-radius: 8px; padding: 4px; background: white; border: 1px solid #e2e8f0; object-fit: contain; }
  p { font-size: 12px; color: #1e40af; margin-top: 6px; font-weight: 600; text-align: center; }
  @media (max-width: 768px) { align-items: flex-start; }
`;

const Copyright = styled.div`
  text-align: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid ${props => props.$isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(0, 0, 0, 0.06)'};
  color: ${props => props.$isDark ? '#64748B' : '#94A3B8'};
  font-size: 13px;
`;

const StickyColumn = styled.div`
  position: fixed;
  right: 20px;
  top: 550px;
  transform: translateY(-50%);
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

const StickyIconButton = styled(motion.a)`
  width: 46px;
  height: 46px;
  background: ${props => props.$isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  backdrop-filter: blur(20px);
  border: 2px solid ${props => props.$isDark ? 'rgba(75, 85, 99, 0.4)' : 'rgba(147, 197, 253, 0.4)'};
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #0EA5E9;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.$isDark
    ? '0 4px 16px rgba(0, 0, 0, 0.3)'
    : '0 4px 16px rgba(147, 197, 253, 0.15)'};
  text-decoration: none;
  position: relative;
  
  &:hover {
    background: ${props => props.$isDark ? 'rgba(30, 41, 59, 1)' : 'rgba(255, 255, 255, 1)'};
    border-color: #0EA5E9;
    transform: translateX(-8px) scale(1.05);
    box-shadow: 0 8px 24px rgba(14, 165, 233, 0.3);
    
    &::after {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  &::after {
    content: attr(data-tooltip);
    position: absolute;
    right: calc(100% + 16px);
    background: rgba(15, 23, 42, 0.95);
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    opacity: 0;
    transform: translateX(10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #EF4444, #DC2626);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  border: 2px solid white;
  min-width: 18px;
  text-align: center;
`;

const SectionHeading = styled(motion.div)`
  text-align: center;
  margin-bottom: 48px;
  
  h2 {
    font-size: 48px;
    font-weight: 700;
    color: #0F172A;
    margin-bottom: 12px;
    letter-spacing: -1px;
    line-height: 1.2;
    
    @media (max-width: 1024px) {
      font-size: 40px;
    }
    
    @media (max-width: 768px) {
      font-size: 32px;
    }
    
    @media (max-width: 480px) {
      font-size: 28px;
    }
  }
  
  p {
    font-size: 18px;
    color: #64748B;
    font-weight: 400;
    
    @media (max-width: 768px) {
      font-size: 16px;
    }
    
    @media (max-width: 480px) {
      font-size: 14px;
    }
  }
`;

const CompanyBannerSection = styled(motion.section)`
  background: ${props => props.$isDark
    ? '#1e293b'
    : '#E0F2FE'};
  padding: 60px 0;
  position: relative;
  overflow: hidden;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  @media (max-width: 1024px) {
    padding: 50px 0;
    height: auto;
    min-height: 80vh;
  }
  
  @media (max-width: 768px) {
    padding: 40px 0;
    height: auto;
    min-height: 60vh;
  }
  
  @media (max-width: 480px) {
    padding: 30px 0;
    min-height: 50vh;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 30% 40%, rgba(125, 211, 252, 0.3) 0%, transparent 60%),
      radial-gradient(circle at 70% 60%, rgba(147, 197, 253, 0.25) 0%, transparent 60%);
    pointer-events: none;
    transition: opacity 0.4s ease;
  }
`;

const CompanyBannerContent = styled.div`
  width: 100%;
  position: relative;
  z-index: 1;
`;

const CompanyBannerTitle = styled(motion.h2)`
  text-align: center;
  font-size: 62px;
  font-weight: 900;
  color: ${props => props.$isDark ? '#f1f5f9' : '#0c4a6e'};
  margin-bottom: 52px;
  line-height: 1.2;
  letter-spacing: -1.5px;
  transition: color 0.4s ease;
  padding: 0 120px;
  
  @media (max-width: 768px) {
    font-size: 34px;
    margin-bottom: 32px;
    padding: 0 24px;
    letter-spacing: -0.5px;
  }
`;

const LogoCarouselWrapper = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
`;

const logoScroll = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

const LogoCarousel = styled.div`
  display: flex;
  gap: 60px;
  align-items: center;
  width: max-content;
  animation: ${logoScroll} 30s linear infinite;
`;

const BannerCompanyLogo = styled.div`
  background: ${props => props.$isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  padding: 28px 52px;
  border-radius: 20px;
  box-shadow: ${props => props.$isDark
    ? '0 6px 20px rgba(0, 0, 0, 0.3)'
    : '0 6px 20px rgba(14, 165, 233, 0.15)'};
  border: 2px solid ${props => props.$isDark
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(14, 165, 233, 0.2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 280px;
  height: 130px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: translateY(-6px) scale(1.05);
    box-shadow: ${props => props.$isDark
    ? '0 12px 32px rgba(0, 0, 0, 0.4)'
    : '0 12px 32px rgba(14, 165, 233, 0.25)'};
    border-color: ${props => props.$isDark
    ? 'rgba(148, 163, 184, 0.4)'
    : 'rgba(14, 165, 233, 0.4)'};
  }
  
  img {
    max-width: 220px;
    max-height: 90px;
    object-fit: contain;
    filter: ${props => props.$isDark ? 'brightness(1.1)' : 'brightness(1)'};
    transition: filter 0.3s ease;
  }
  
  &:hover img {
    filter: ${props => props.$isDark ? 'brightness(1.2)' : 'brightness(0.95)'};
  }
  
  span {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
`;

const particleConfigs = [
  { top: '8%', left: '15%', duration: 16, delay: 0 },
  { top: '22%', left: '78%', duration: 19, delay: 1.2 },
  { top: '35%', left: '42%', duration: 18, delay: 0.8 },
  { top: '48%', left: '68%', duration: 21, delay: 1.8 },
  { top: '62%', left: '25%', duration: 17, delay: 2.4 },
  { top: '75%', left: '55%', duration: 20, delay: 1.5 },
  { top: '18%', left: '88%', duration: 22, delay: 0.5 },
  { top: '85%', left: '12%', duration: 19, delay: 2.1 },
  { top: '42%', left: '8%', duration: 18, delay: 1.1 },
  { top: '68%', left: '82%', duration: 20, delay: 2.8 },
];

const companyLogos = [
  { name: 'TRUNG NGUYÊN', logo: '/OpPoReview/images/trungnguyen.jpg' },
  { name: 'KATINAT', logo: '/OpPoReview/images/katinat.png' },
  { name: 'BAMOS COFFEE', logo: '/OpPoReview/images/bamos.png' },
  { name: 'STARBUCK', logo: '/OpPoReview/images/starbuck.png' },
  { name: 'PHUC LONG', logo: '/OpPoReview/images/phuclong.jpg' },
  { name: 'THE COFFEE HOUSE', logo: '/OpPoReview/images/coffeehouse.jpg' },
  { name: 'HỒNG TRÀ NGÔ GIA', logo: '/OpPoReview/images/ngogia.png' },
  { name: 'SUNCHA', logo: '/OpPoReview/images/suncha.jpg' },
  { name: 'HIGHLANDS', logo: '/OpPoReview/images/highlands.jpg' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [titleText, setTitleText] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [phoneSearchText, setPhoneSearchText] = useState('');
  const [showPhoneApp, setShowPhoneApp] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const jobDropdownRef = useRef(null);
  const companyDropdownRef = useRef(null);
  const jobDropdownTimer = useRef(null);
  const companyDropdownTimer = useRef(null);
  const scrollContainerRef = useRef(null);
  const heroRef = useRef(null);
  const companyRef = useRef(null);
  const downloadRef = useRef(null);

  // Removed scroll-linked parallax transforms to improve scroll performance
  // Now using only whileInView animations which work better with scroll-snap

  const fullTitle = language === 'vi' ? 'Tìm việc & Tuyển Dụng Nhanh Hơn' : 'Find Jobs & Hire Faster';
  const fullSubtitle = language === 'vi' ? 'Kết nối Ứng viên với cơ hội. Nền tảng tuyển dụng hiện đại.' : 'Connect talent with opportunity. The modern recruitment platform.';
  const phoneSearchFullText = 'Ốp Pờ';

  const toggleLanguage = () => {
    changeLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const scrollToDownload = () => {
    downloadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Auto start downloading after app shows
  useEffect(() => {
    if (showPhoneApp) {
      setTimeout(() => {
        setIsDownloading(true);
      }, 800);
    }
  }, [showPhoneApp]);

  // Reset animation after complete cycle
  useEffect(() => {
    if (isDownloading) {
      const resetTimer = setTimeout(() => {
        // Reset all states
        setPhoneSearchText('');
        setShowPhoneApp(false);
        setIsDownloading(false);
        // Trigger new animation cycle
        setAnimationKey(prev => prev + 1);
      }, 4000); // Wait 4 seconds then reset

      return () => clearTimeout(resetTimer);
    }
  }, [isDownloading]);

  // Typewriter effect for phone search
  useEffect(() => {
    let phoneIndex = 0;
    const phoneInterval = setInterval(() => {
      if (phoneIndex <= phoneSearchFullText.length) {
        setPhoneSearchText(phoneSearchFullText.substring(0, phoneIndex));
        phoneIndex++;
      } else {
        clearInterval(phoneInterval);
        // Show app after typing is done
        setTimeout(() => {
          setShowPhoneApp(true);
        }, 300);
      }
    }, 150);

    return () => {
      clearInterval(phoneInterval);
    };
  }, [animationKey]);

  // Typewriter effect - re-run when language changes
  useEffect(() => {
    // Reset states when language changes
    setTitleText('');
    setSubtitleText('');
    setShowCursor(true);

    let titleIndex = 0;
    let subtitleIndex = 0;
    let subtitleInterval;

    // Type title first
    const titleInterval = setInterval(() => {
      if (titleIndex < fullTitle.length) {
        setTitleText(fullTitle.substring(0, titleIndex + 1));
        titleIndex++;
      } else {
        clearInterval(titleInterval);
        // Start subtitle after title is done
        subtitleInterval = setInterval(() => {
          if (subtitleIndex < fullSubtitle.length) {
            setSubtitleText(fullSubtitle.substring(0, subtitleIndex + 1));
            subtitleIndex++;
          } else {
            clearInterval(subtitleInterval);
            setShowCursor(false);
          }
        }, 50);
      }
    }, 80);

    return () => {
      clearInterval(titleInterval);
      if (subtitleInterval) clearInterval(subtitleInterval);
    };
  }, [language]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(event.target)) {
        setIsJobDropdownOpen(false);
      }
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
        setIsCompanyDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <LandingContainer $isDark={isDarkMode}>
      <Header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        $isDark={isDarkMode}
      >
        <LeftSection>
          <Logo to="/">
            <img src="/OpPoReview/images/logo.png" alt="Ốp Pờ" style={{ height: '42px', marginRight: '5px' }} />

          </Logo>
          <NavLinks $isDark={isDarkMode}>
            <DropdownContainer
              ref={jobDropdownRef}
              onMouseEnter={() => { clearTimeout(jobDropdownTimer.current); setIsJobDropdownOpen(true); }}
              onMouseLeave={() => { jobDropdownTimer.current = setTimeout(() => setIsJobDropdownOpen(false), 200); }}
            >
              <DropdownButton
                $isOpen={isJobDropdownOpen}
                $isDark={isDarkMode}
              >
                {language === 'vi' ? 'Việc làm' : 'Jobs'}
                <ChevronDown />
              </DropdownButton>
              {isJobDropdownOpen && (
                <LargeDropdownMenu
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  $isDark={isDarkMode}
                >
                  <DropdownLeftColumn $isDark={isDarkMode}>
                    <DropdownSection>
                      <GreenSectionTitle>
                        {language === 'vi' ? 'Việc làm' : 'Jobs'}
                        <ArrowRight />
                      </GreenSectionTitle>
                      <CVTemplateItem to="/candidate/jobs" $isDark={isDarkMode}>
                        <Search />
                        {language === 'vi' ? 'Tìm việc làm' : 'Find Jobs'}
                      </CVTemplateItem>
                      <CVTemplateItem to="/candidate/jobs?tab=saved" $isDark={isDarkMode}>
                        <Bookmark />
                        {language === 'vi' ? 'Việc làm đã lưu' : 'Saved Jobs'}
                      </CVTemplateItem>
                      <CVTemplateItem to="/candidate/applications" $isDark={isDarkMode}>
                        <FileText />
                        {language === 'vi' ? 'Việc làm đã ứng tuyển' : 'Applied Jobs'}
                      </CVTemplateItem>
                      <CVTemplateItem to="/candidate/jobs?recommended=true" $isDark={isDarkMode}>
                        <ThumbsUp />
                        {language === 'vi' ? 'Việc làm phù hợp' : 'Recommended Jobs'}
                      </CVTemplateItem>
                    </DropdownSection>

                    <DropdownSection>
                      <GreenSectionTitle>
                        {language === 'vi' ? 'Nhà tuyển dụng' : 'Employers'}
                        <ArrowRight />
                      </GreenSectionTitle>
                      <CVTemplateItem to="/companies" $isDark={isDarkMode}>
                        <Building2 />
                        {language === 'vi' ? 'Danh sách nhà tuyển dụng' : 'Employer Directory'}
                      </CVTemplateItem>
                      <CVTemplateItem to="/companies/top-companies" $isDark={isDarkMode}>
                        <Star />
                        {language === 'vi' ? 'Nhà tuyển dụng' : 'Top Employers'}
                      </CVTemplateItem>
                    </DropdownSection>
                  </DropdownLeftColumn>

                  <DropdownRightColumn>
                    <GreenSectionTitle>
                      {language === 'vi' ? 'Việc làm theo vị trí' : 'Jobs by Position'}
                      <ArrowRight />
                    </GreenSectionTitle>
                    <JobCategoriesGrid>
                      <JobCategoryItem to="/candidate/jobs?category=sales" $isDark={isDarkMode}>{language === 'vi' ? 'Nhân viên pha chế' : 'Barista'}</JobCategoryItem>
                      <JobCategoryItem to="/candidate/jobs?category=labor" $isDark={isDarkMode}>{language === 'vi' ? 'Nhân viên thu ngân' : 'Cashier'}</JobCategoryItem>
                      <JobCategoryItem to="/candidate/jobs?category=accountant" $isDark={isDarkMode}>{language === 'vi' ? 'Nhân viên phụ bếp' : 'Kitchen Assistant'}</JobCategoryItem>
                      <JobCategoryItem to="/candidate/jobs?type=senior" $isDark={isDarkMode}>{language === 'vi' ? 'Nhân viên phục vụ' : 'Service Staff'}</JobCategoryItem>
                      <JobCategoryItem to="/candidate/jobs?category=marketing" $isDark={isDarkMode}>{language === 'vi' ? 'Nhân viên kho' : 'Warehouse Staff'}</JobCategoryItem>
                      <JobCategoryItem to="/candidate/jobs?category=engineer" $isDark={isDarkMode}>{language === 'vi' ? 'Nhân viên kỹ thuật' : 'Technical Staff'}</JobCategoryItem>
                    </JobCategoriesGrid>
                  </DropdownRightColumn>
                </LargeDropdownMenu>
              )}
            </DropdownContainer>

            <DropdownContainer
              ref={companyDropdownRef}
              onMouseEnter={() => { companyDropdownTimer.current = setTimeout(() => setIsCompanyDropdownOpen(true), 300); }}
              onMouseLeave={() => { clearTimeout(companyDropdownTimer.current); setIsCompanyDropdownOpen(false); }}
            >
              <DropdownButton
                $isOpen={isCompanyDropdownOpen}
                $isDark={isDarkMode}
              >
                {language === 'vi' ? 'Tạo CV' : 'Create CV'}
                <ChevronDown />
              </DropdownButton>
              {isCompanyDropdownOpen && (
                <LargeDropdownMenu
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <DropdownLeftColumn>
                    <DropdownSection>
                      <GreenSectionTitle>
                        {language === 'vi' ? 'Mẫu CV theo style' : 'CV Templates by Style'}
                        <ArrowRight />
                      </GreenSectionTitle>
                      <CVTemplateItem onClick={() => setIsDevModalOpen(true)}>
                        <Package />
                        {language === 'vi' ? 'Mẫu CV Đơn giản' : 'Simple CV Template'}
                      </CVTemplateItem>
                      <CVTemplateItem onClick={() => setIsDevModalOpen(true)}>
                        <Star />
                        {language === 'vi' ? 'Mẫu CV Ấn tượng' : 'Impressive CV Template'}
                      </CVTemplateItem>
                    </DropdownSection>

                    <DropdownSection>
                      <GreenSectionTitle>
                        {language === 'vi' ? 'Tạo CV bằng AI' : 'Create CV with AI'}
                        <ArrowRight />
                      </GreenSectionTitle>
                      <CVTemplateItem onClick={() => setIsDevModalOpen(true)}>
                        <Briefcase />
                        {language === 'vi' ? 'Nhân viên pha chế' : 'Barista'}
                      </CVTemplateItem>
                      <CVTemplateItem onClick={() => setIsDevModalOpen(true)}>
                        <Briefcase />
                        {language === 'vi' ? 'Lập trình viên' : 'Developer'}
                      </CVTemplateItem>
                      <CVTemplateItem onClick={() => setIsDevModalOpen(true)}>
                        <Briefcase />
                        {language === 'vi' ? 'Nhân viên kế toán' : 'Accountant'}
                      </CVTemplateItem>
                      <CVTemplateItem onClick={() => setIsDevModalOpen(true)}>
                        <Briefcase />
                        {language === 'vi' ? 'Chuyên viên marketing' : 'Marketing Specialist'}
                      </CVTemplateItem>
                    </DropdownSection>
                  </DropdownLeftColumn>

                  <DropdownRightColumn>
                    <DropdownSection>
                      <DropdownItem onClick={() => setIsDevModalOpen(true)}>
                        <Folder />
                        {language === 'vi' ? 'Quản lý CV' : 'Manage CVs'}
                      </DropdownItem>
                      <DropdownItem onClick={() => setIsDevModalOpen(true)}>
                        <Upload />
                        {language === 'vi' ? 'Tải CV lên' : 'Upload CV'}
                      </DropdownItem>
                      <DropdownItem onClick={() => setIsDevModalOpen(true)}>
                        <Edit3 />
                        {language === 'vi' ? 'Quản lý Cover Letter' : 'Manage Cover Letters'}
                      </DropdownItem>
                      <DropdownItem onClick={() => setIsDevModalOpen(true)}>
                        <FileText />
                        {language === 'vi' ? 'Mẫu Cover Letter' : 'Cover Letter Templates'}
                      </DropdownItem>
                    </DropdownSection>
                  </DropdownRightColumn>
                </LargeDropdownMenu>
              )}
            </DropdownContainer>

            <NavLinkItem to="/login?redirect=/employer/quick-jobs&role=employer">
              {language === 'vi' ? 'Đăng tuyển' : 'Post a Job'}
            </NavLinkItem>
          </NavLinks>
        </LeftSection>

        <RightSection>
          <LanguageToggle onClick={scrollToDownload} $isDark={isDarkMode}>
            <Download />
            {language === 'vi' ? 'Tải ứng dụng' : 'Download App'}
          </LanguageToggle>
          <LanguageToggle onClick={toggleLanguage} $isDark={isDarkMode}>
            <Globe />
            {language === 'vi' ? 'VI' : 'EN'}
          </LanguageToggle>
          <Button as={Link} to="/login" $variant="primary" $size="small">
            {t.nav.login}
          </Button>
          <Button as={Link} to="/register" $variant="primary" $size="small">
            {t.nav.signUp}
          </Button>
        </RightSection>
      </Header>

      <ScrollContainer ref={scrollContainerRef}>
        <HeroSection
          ref={heroRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <AnimatedBackground $isDark={isDarkMode}>
            {/* Aurora ambient light layer */}
            <AuroraLayer />

            {/* Grid pattern */}
            <GridPattern />

            {/* Noise texture for premium feel */}
            <NoiseTexture />

            {/* Central gradient glow behind hero text */}
            <GradientGlow
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />

            {/* Large gradient blobs - premium floating shapes */}
            <GradientBlob
              rounded
              opacity={0.25}
              blur={100}
              animate={{
                x: [0, 80, 0],
                y: [0, -60, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                width: '600px',
                height: '600px',
                top: '5%',
                left: '-5%',
                background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(30, 64, 175, 0.2))',
              }}
            />

            <GradientBlob
              rounded
              opacity={0.2}
              blur={120}
              animate={{
                x: [0, -70, 0],
                y: [0, 80, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 26,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                width: '700px',
                height: '700px',
                top: '40%',
                right: '-10%',
                background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.25), rgba(30, 64, 175, 0.15))',
              }}
            />

            <GradientBlob
              rounded
              opacity={0.18}
              blur={90}
              animate={{
                x: [0, 50, 0],
                y: [0, -50, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                width: '500px',
                height: '500px',
                bottom: '5%',
                left: '25%',
                background: 'linear-gradient(135deg, rgba(147, 197, 253, 0.3), rgba(96, 165, 250, 0.2))',
              }}
            />

            {/* Smaller accent blobs */}
            <GradientBlob
              rounded
              opacity={0.22}
              blur={70}
              float
              style={{
                width: '350px',
                height: '350px',
                top: '15%',
                right: '20%',
                background: 'radial-gradient(circle, rgba(30, 64, 175, 0.3), rgba(30, 64, 175, 0.15))',
              }}
            />

            <GradientBlob
              rounded
              opacity={0.2}
              blur={80}
              float
              style={{
                width: '400px',
                height: '400px',
                bottom: '15%',
                right: '35%',
                background: 'radial-gradient(circle, rgba(96, 165, 250, 0.28), rgba(30, 64, 175, 0.12))',
              }}
            />

            {/* Floating particles */}
            {particleConfigs.map((particle, index) => (
              <Particle
                key={`particle-${index}`}
                style={{
                  top: particle.top,
                  left: particle.left,
                }}
                animate={{
                  y: [0, -20, 0],
                  x: [0, 15, 0],
                  opacity: [0.3, 0.8, 0.4],
                  scale: [1, 1.4, 1],
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: particle.delay,
                }}
              />
            ))}

            {/* Corner Patterns */}
            <TopLeftPattern
              animate={{
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <BottomRightPattern
              animate={{
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />

            {/* Decorative Wave Patterns */}
            <WavePattern
              style={{ bottom: 0, left: 0 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 0.4, y: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
            >
              <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
                <path
                  fill="rgba(147, 197, 253, 0.1)"
                  d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                ></path>
              </svg>
            </WavePattern>

            <WavePattern
              style={{ top: 0, right: 0 }}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 0.3, y: 0 }}
              transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
            >
              <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
                <path
                  fill="rgba(96, 165, 250, 0.1)"
                  d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,229.3C960,213,1056,171,1152,165.3C1248,160,1344,192,1392,208L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
                ></path>
              </svg>
            </WavePattern>

            {/* Floating Icons */}
            <FloatingIcon
              style={{ top: '15%', left: '8%' }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Clock />
            </FloatingIcon>

            <FloatingIcon
              style={{ top: '25%', right: '12%' }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              <Mail />
            </FloatingIcon>

            <FloatingIcon
              style={{ bottom: '30%', left: '10%' }}
              animate={{
                y: [0, -25, 0],
                rotate: [0, 10, 0],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            >
              <Send />
            </FloatingIcon>

            <FloatingIcon
              style={{ bottom: '20%', right: '15%' }}
              animate={{
                y: [0, -18, 0],
                rotate: [0, -8, 0],
              }}
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5,
              }}
            >
              <Award />
            </FloatingIcon>

            <FloatingIcon
              style={{ top: '40%', right: '8%' }}
              animate={{
                y: [0, -22, 0],
                rotate: [0, 12, 0],
              }}
              transition={{
                duration: 4.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.8,
              }}
            >
              <Zap />
            </FloatingIcon>

            <FloatingIcon
              style={{ top: '60%', left: '12%' }}
              animate={{
                y: [0, -16, 0],
                rotate: [0, -6, 0],
              }}
              transition={{
                duration: 5.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.2,
              }}
            >
              <Target />
            </FloatingIcon>

            {/* Geometric Shapes */}
            <GeometricShape
              style={{
                top: '20%',
                left: '5%',
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                transform: 'rotate(15deg)',
              }}
              animate={{
                rotate: [15, 25, 15],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <GeometricShape
              style={{
                bottom: '25%',
                right: '8%',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />

            <GeometricShape
              style={{
                top: '35%',
                right: '18%',
                width: '50px',
                height: '50px',
                transform: 'rotate(45deg)',
              }}
              animate={{
                rotate: [45, 60, 45],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Mini Squares */}
            <MiniSquare
              style={{ top: '28%', left: '22%' }}
              animate={{
                rotate: [0, 90, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <MiniSquare
              style={{ top: '48%', right: '25%' }}
              animate={{
                rotate: [0, -90, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />

            <MiniSquare
              style={{ bottom: '32%', left: '20%' }}
              animate={{
                rotate: [0, 180, 0],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />

            <MiniSquare
              style={{ top: '65%', right: '30%' }}
              animate={{
                rotate: [0, 90, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 6.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5,
              }}
            />

            {/* Dotted Circles */}
            <DottedCircle
              style={{
                top: '12%',
                right: '20%',
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }}
            />

            <DottedCircle
              style={{
                bottom: '15%',
                left: '18%',
              }}
              animate={{
                rotate: [0, -360],
                scale: [1, 1.15, 1],
              }}
              transition={{
                rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              }}
            />

            {/* Connection Lines */}
            <ConnectionLine
              style={{
                top: '18%',
                left: '10%',
                width: '150px',
                transform: 'rotate(-15deg)',
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <ConnectionLine
              style={{
                top: '45%',
                right: '12%',
                width: '120px',
                transform: 'rotate(25deg)',
              }}
              animate={{
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />

            <ConnectionLine
              style={{
                bottom: '28%',
                left: '15%',
                width: '180px',
                transform: 'rotate(10deg)',
              }}
              animate={{
                opacity: [0.25, 0.55, 0.25],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />

            {/* Small Floating Dots */}
            <SmallFloatingDot
              style={{ top: '22%', left: '25%' }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <SmallFloatingDot
              style={{ top: '55%', right: '22%' }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />

            <SmallFloatingDot
              style={{ bottom: '35%', left: '28%' }}
              animate={{
                y: [0, -12, 0],
                opacity: [0.35, 0.75, 0.35],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.7,
              }}
            />

            <SmallFloatingDot
              style={{ top: '38%', left: '18%' }}
              animate={{
                y: [0, -18, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5,
              }}
            />

            <SmallFloatingDot
              style={{ bottom: '40%', right: '18%' }}
              animate={{
                y: [0, -16, 0],
                opacity: [0.4, 0.75, 0.4],
              }}
              transition={{
                duration: 3.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
            />

            {/* Circuit Patterns */}
            <CircuitPattern
              style={{
                top: '30%',
                left: '15%',
              }}
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <CircuitPattern
              style={{
                bottom: '35%',
                right: '25%',
              }}
              animate={{
                opacity: [0.15, 0.35, 0.15],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5,
              }}
            />

            {/* Glassmorphism overlay */}
            <GlassmorphismLayer />
          </AnimatedBackground>

          <HeroContent>
            <HeroTitle
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {titleText}
              {showCursor && titleText.length < fullTitle.length && <span style={{ opacity: 0.7 }}>|</span>}
            </HeroTitle>

            <HeroSubtitle
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {subtitleText}
              {showCursor && subtitleText.length > 0 && subtitleText.length < fullSubtitle.length && <span style={{ opacity: 0.7 }}>|</span>}
            </HeroSubtitle>

            <SearchContainer
              $isDark={isDarkMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <SearchInput $isDark={isDarkMode} $wide>
                <Search />
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Vị trí công việc hoặc công ty' : 'Job title or company'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/candidate/jobs', { state: { searchKeyword: searchTerm, searchLocation: location } })}
                />
              </SearchInput>

              <SearchInput $isDark={isDarkMode}>
                <MapPin />
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Địa điểm' : 'Location'}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/candidate/jobs', { state: { searchKeyword: searchTerm, searchLocation: location } })}
                />
              </SearchInput>

              <Button $variant="primary" onClick={() => navigate('/candidate/jobs', {
                state: { searchKeyword: searchTerm, searchLocation: location }
              })}>
                {language === 'vi' ? 'Tìm việc' : 'Search Jobs'}
              </Button>
            </SearchContainer>

            <BannerContainer>
              <StatsCard
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <StatsHeader>
                  <Calendar />
                  {language === 'vi' ? `Thị trường làm việc hôm nay ${new Date().toLocaleDateString('vi-VN')}` : `Today's Job Market ${new Date().toLocaleDateString('en-US')}`}
                </StatsHeader>

                <StatsRow>
                  <StatItem
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    <StatLabel>{language === 'vi' ? 'Việc làm đang tuyển' : 'Active Jobs'}</StatLabel>
                    <StatValue>
                      100,000
                      <TrendingUp />
                    </StatValue>
                  </StatItem>

                  <StatItem
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  >
                    <StatLabel>{language === 'vi' ? 'Việc làm gấp hôm nay' : 'Urgent Jobs Today'}</StatLabel>
                    <StatValue>
                      50
                      <TrendingUp />
                    </StatValue>
                  </StatItem>
                </StatsRow>

                <StatsRow>
                  <StatItem
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                  >
                    <StatLabel>{language === 'vi' ? 'Số lượng ứng viên' : 'Candidates'}</StatLabel>
                    <StatValue>
                      2,345
                      <Users />
                    </StatValue>
                  </StatItem>

                  <StatItem
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.4 }}
                  >
                    <StatLabel>{language === 'vi' ? 'Số lượng nhà tuyển dụng' : 'Employers'}</StatLabel>
                    <StatValue>
                      42
                      <Building2 />
                    </StatValue>
                  </StatItem>
                </StatsRow>
              </StatsCard>

              <BannerWrapper
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <SecondaryBanner
                  src="/OpPoReview/images/phache.png"
                  alt="Phache"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.7 }}
                />
                <MainBanner
                  src="/OpPoReview/images/poster.png"
                  alt="Poster"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.9 }}
                />
              </BannerWrapper>
            </BannerContainer>
          </HeroContent>
        </HeroSection>

        <CompanyBannerSection
          $isDark={isDarkMode}
          ref={companyRef}
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <CompanyBannerContent>
            <CompanyBannerTitle
              $isDark={isDarkMode}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {language === 'vi' ? (
                <>Những ứng viên mà nhà tuyển dụng<br />đang tìm kiếm –{' '}</>
              ) : (
                <>The candidates employers<br />are looking for –{' '}</>
              )}
              <span style={{
                background: 'linear-gradient(90deg, #0284c7, #1d4ed8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>{language === 'vi' ? 'có thể chính là bạn.' : 'could be you.'}</span>
            </CompanyBannerTitle>

            <LogoCarouselWrapper $isDark={isDarkMode}>
              <LogoCarousel>
                {[...companyLogos, ...companyLogos].map((company, index) => (
                  <BannerCompanyLogo $isDark={isDarkMode} key={`${company.name}-${index}`}>
                    <img
                      src={company.logo}
                      alt={company.name}
                      style={{ display: 'block' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'inline-block';
                      }}
                    />
                    <span style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      color: isDarkMode ? '#f1f5f9' : '#0c4a6e',
                      whiteSpace: 'nowrap',
                      display: 'none',
                      letterSpacing: '0.5px'
                    }}>
                      {company.name}
                    </span>
                  </BannerCompanyLogo>
                ))}
              </LogoCarousel>
            </LogoCarouselWrapper>
          </CompanyBannerContent>
        </CompanyBannerSection>

        <TechBannerSection
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <TechBannerContent>
            <TechBannerImage
              src="/OpPoReview/images/lemoments.png"
              alt="Le Moments Technology"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
          </TechBannerContent>
        </TechBannerSection>

        <CTASection>
          <CTACard
            $isDark={isDarkMode}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <CTATitle $isDark={isDarkMode}>{language === 'vi' ? 'Sẵn Sàng Tuyển Ứng viên Hàng Đầu?' : 'Ready to Hire Top Talent?'}</CTATitle>
            <CTAText $isDark={isDarkMode}>
              {language === 'vi' ? 'Đăng công việc và kết nối với ứng viên chất lượng ngay hôm nay' : 'Post your jobs and connect with qualified candidates today'}
            </CTAText>
            <Button
              as={Link}
              to="/register/employer"
              $variant="secondary"
              $size="large"
              style={{
                background: 'white',
                color: '#1e40af',
                position: 'relative',
                zIndex: 2,
                fontWeight: 700,
                boxShadow: '0 8px 32px rgba(255, 255, 255, 0.2)'
              }}
            >
              {language === 'vi' ? 'Bắt Đầu Miễn Phí' : 'Get Started - It\'s Free'}
              <ArrowRight />
            </Button>
          </CTACard>
        </CTASection>

        <DownloadAppSection
          ref={downloadRef}
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <DownloadAppContainer>
            <DownloadAppLeft>
              <DownloadAppTitle
                $isDark={isDarkMode}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {language === 'vi' ? 'Tải ứng dụng' : 'Download the App'}
              </DownloadAppTitle>

              <DownloadAppSubtitle
                $isDark={isDarkMode}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {language === 'vi' ? 'để trải nghiệm các dịch vụ của chúng tôi' : 'to experience our services'}
              </DownloadAppSubtitle>

              <DownloadOptions>
                <QRCodeSection>
                  <QRCode $isDark={isDarkMode}>
                    <svg viewBox="0 0 100 100" fill="none">
                      <rect width="100" height="100" fill="white" />
                      <rect x="10" y="10" width="15" height="15" fill="black" />
                      <rect x="30" y="10" width="5" height="5" fill="black" />
                      <rect x="40" y="10" width="5" height="5" fill="black" />
                      <rect x="50" y="10" width="5" height="5" fill="black" />
                      <rect x="60" y="10" width="5" height="5" fill="black" />
                      <rect x="75" y="10" width="15" height="15" fill="black" />
                      <rect x="10" y="30" width="5" height="5" fill="black" />
                      <rect x="20" y="30" width="5" height="5" fill="black" />
                      <rect x="30" y="30" width="10" height="10" fill="black" />
                      <rect x="45" y="30" width="5" height="5" fill="black" />
                      <rect x="55" y="30" width="10" height="10" fill="black" />
                      <rect x="70" y="30" width="5" height="5" fill="black" />
                      <rect x="85" y="30" width="5" height="5" fill="black" />
                      <rect x="10" y="40" width="5" height="5" fill="black" />
                      <rect x="20" y="40" width="5" height="5" fill="black" />
                      <rect x="75" y="40" width="5" height="5" fill="black" />
                      <rect x="85" y="40" width="5" height="5" fill="black" />
                      <rect x="10" y="50" width="5" height="5" fill="black" />
                      <rect x="20" y="50" width="5" height="5" fill="black" />
                      <rect x="35" y="50" width="5" height="5" fill="black" />
                      <rect x="45" y="50" width="10" height="10" fill="black" />
                      <rect x="60" y="50" width="5" height="5" fill="black" />
                      <rect x="75" y="50" width="5" height="5" fill="black" />
                      <rect x="85" y="50" width="5" height="5" fill="black" />
                      <rect x="30" y="60" width="5" height="5" fill="black" />
                      <rect x="40" y="60" width="5" height="5" fill="black" />
                      <rect x="60" y="60" width="10" height="10" fill="black" />
                      <rect x="10" y="75" width="15" height="15" fill="black" />
                      <rect x="30" y="75" width="5" height="5" fill="black" />
                      <rect x="40" y="75" width="5" height="5" fill="black" />
                      <rect x="50" y="75" width="5" height="5" fill="black" />
                      <rect x="60" y="75" width="5" height="5" fill="black" />
                      <rect x="75" y="75" width="15" height="15" fill="black" />
                    </svg>
                  </QRCode>
                  <QRText $isDark={isDarkMode}>{language === 'vi' ? 'Quét mã QR' : 'Scan QR Code'}</QRText>

                  <DownloadAppStats>
                    <DownloadAppStatItem>
                      <DownloadAppStatValue>
                        <DownloadAppStatStars>
                          <Star fill="#FFB800" strokeWidth={0} size={20} />
                          <Star fill="#FFB800" strokeWidth={0} size={20} />
                          <Star fill="#FFB800" strokeWidth={0} size={20} />
                          <Star fill="#FFB800" strokeWidth={0} size={20} />
                          <Star fill="#FFB800" strokeWidth={0} size={20} />
                        </DownloadAppStatStars>
                      </DownloadAppStatValue>
                      <DownloadAppStatLabel $isDark={isDarkMode}>{language === 'vi' ? 'Đánh giá ứng dụng' : 'App Rating'}</DownloadAppStatLabel>
                    </DownloadAppStatItem>
                  </DownloadAppStats>
                </QRCodeSection>

                <StoreButtons>
                  <StoreButton href="https://apps.apple.com" target="_blank">
                    <img
                      src="/OpPoReview/images/appstore1.jpg"
                      alt="App Store"
                      style={{
                        width: '120px',
                        height: 'auto',
                        objectFit: 'contain'
                      }}
                    />
                  </StoreButton>

                  <StoreButton href="https://play.google.com" target="_blank">
                    <img
                      src="/OpPoReview/images/chplay.jpg"
                      alt="Google Play"
                      style={{
                        width: '120px',
                        height: 'auto',
                        objectFit: 'contain'
                      }}
                    />
                  </StoreButton>
                </StoreButtons>
              </DownloadOptions>
            </DownloadAppLeft>

            <DownloadAppRight
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <PhoneMockup>
                <PhoneScreen>
                  <AppPreview>
                    <AppSearchBar>
                      {phoneSearchText}
                      {phoneSearchText.length < phoneSearchFullText.length && <span style={{ animation: 'blink 1s infinite' }}>|</span>}
                    </AppSearchBar>
                    {showPhoneApp && (
                      <motion.div
                        style={{
                          background: 'white',
                          borderRadius: '12px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          marginTop: '12px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        {/* Top Section: Logo + Info */}
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                          {/* Logo */}
                          <motion.div
                            style={{
                              width: '56px',
                              height: '56px',
                              background: 'linear-gradient(135deg, #ffffff 0%, #ded4d46a 100%)',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              padding: '6px',
                              flexShrink: 0
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                          >
                            <img
                              src="/OpPoReview/images/logo.png"
                              alt="Ốp Pờ"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                              }}
                            />
                          </motion.div>

                          {/* App Info */}
                          <motion.div
                            style={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              minWidth: 0
                            }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                          >
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '700',
                              color: '#1f2937',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              Ốp Pờ
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#6b7280',
                              fontWeight: '500',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {language === 'vi' ? 'Ứng dụng tuyển dụng' : 'Recruitment App'}
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: '#9ca3af',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {language === 'vi' ? 'Đã tải xuống - Giáo dục' : 'Downloaded - Education'}
                            </div>
                            {/* Star Rating */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              marginTop: '2px'
                            }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  fill="#FFB800"
                                  strokeWidth={0}
                                  size={10}
                                  style={{ color: '#FFB800' }}
                                />
                              ))}
                            </div>
                          </motion.div>
                        </div>

                        {/* Download Button / Loading Spinner */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          {!isDownloading ? (
                            <motion.div
                              style={{
                                padding: '8px 32px',
                                background: '#1e40af',
                                color: 'white',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                            >
                              {language === 'vi' ? 'Tải về' : 'Download'}
                            </motion.div>
                          ) : (
                            <motion.div
                              style={{
                                width: '24px',
                                height: '24px',
                                position: 'relative'
                              }}
                            >
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                style={{ transform: 'rotate(90deg) scaleX(-1)' }}
                              >
                                {/* Background circle */}
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="2"
                                />
                                {/* Progress circle */}
                                <motion.circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  fill="none"
                                  stroke="#1e40af"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{
                                    duration: 5,
                                    ease: "linear",
                                    repeat: Infinity
                                  }}
                                />
                              </svg>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AppPreview>
                </PhoneScreen>
              </PhoneMockup>
            </DownloadAppRight>
          </DownloadAppContainer>
        </DownloadAppSection>

        <Footer
          $isDark={isDarkMode}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <FooterMain>
            <FooterLeft $isDark={isDarkMode}>
              <div className="logo-area">
                <Link to="/OpPoReview/" className="logo-link">
                  <img src="/OpPoReview/images/logo.png" alt="Ốp Pờ Logo" />
                </Link>
                <p>{language === 'vi' ? 'Bạn vừa bị đuổi - Đã có Ốp Pờ lo' : 'Just got fired? Ốp Pờ has you covered'}</p>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', border: '1px solid #10b981', padding: '4px 8px', borderRadius: '4px' }}>{language === 'vi' ? '✓ Được bảo vệ' : '✓ Protected'}</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6366f1', border: '1px solid #6366f1', padding: '4px 8px', borderRadius: '4px' }}>Google For Startups</span>
                </div>
              </div>
              <div className="contact-info">
                <h4>{language === 'vi' ? 'Liên hệ' : 'Contact'}</h4>
                <p>{language === 'vi' ? 'Hotline hệ thống:' : 'System Hotline:'} <strong>0379 784 509</strong></p>
                <p>{language === 'vi' ? 'Hỗ trợ khách hàng:' : 'Customer Support:'} <strong>0563 518 922</strong></p>
                <p>Email: oppohiringplatform@gmail.com</p>
              </div>

            </FooterLeft>

            <FooterLinksWrap>
              <FooterLinkCol $isDark={isDarkMode}>
                <h4>{language === 'vi' ? 'Về Ốp Pờ' : 'About Ốp Pờ'}</h4>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Giới thiệu' : 'About Us'}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Góc báo chí' : 'Press'}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Tuyển dụng' : 'Careers'}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Liên hệ' : 'Contact'}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Hỏi đáp' : 'FAQ'}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Chính sách bảo mật' : 'Privacy Policy'}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Điều khoản dịch vụ' : 'Terms of Service'}</a>
              </FooterLinkCol>

              <FooterLinkCol $isDark={isDarkMode}>
                <h4>{language === 'vi' ? 'Hồ sơ và CV' : 'Profile & CV'}</h4>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Quản lý CV của bạn' : 'Manage Your CV'}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Hướng dẫn viết CV' : 'CV Writing Guide'}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Review CV' : 'CV Review'}</a>
                <h4 style={{ marginTop: '24px' }}>{language === 'vi' ? 'Khám phá' : 'Explore'}</h4>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Ứng dụng di động Ốp Pờ' : 'Ốp Pờ Mobile App'}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'AI đề xuất công việc phù hợp' : 'AI Job Recommendations'}</a>
              </FooterLinkCol>

              <FooterLinkCol $isDark={isDarkMode}>
                <h4>{language === 'vi' ? 'Tìm việc nhanh - uy tín' : 'Find Jobs Fast'}</h4>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Việc làm tốt nhất' : 'Best Jobs'}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Việc làm lương cao' : 'High Salary Jobs'}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Việc làm quản lý' : 'Management Jobs'}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Việc làm bán thời gian' : 'Part-time Jobs'}</a>
              </FooterLinkCol>

              <FooterLinkCol $isDark={isDarkMode}>
                <h4>{language === 'vi' ? 'Quy tắc chung' : 'General Rules'}</h4>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Điều kiện giao dịch chung' : 'General Terms'}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsDevModalOpen(true); }}>{language === 'vi' ? 'Giá dịch vụ & Cách thanh toán' : 'Pricing & Payment'}</a>
              </FooterLinkCol>
            </FooterLinksWrap>
          </FooterMain>

          <FooterBottom $isDark={isDarkMode}>
            <CompanyDetails $isDark={isDarkMode}>
              <h3>{language === 'vi' ? 'Công ty Cổ phần Ốp Pờ Việt Nam' : 'Ốp Pờ Vietnam JSC'}</h3>
              <p><span>📄</span> {language === 'vi' ? 'Giấy phép đăng ký kinh doanh số: 0123456789 cấp ngày 21/02/2026, thay đổi lần thứ 1 ngày 03/03/2026 tại Sở Tài chính Thành phố Hồ Chí Minh' : 'Business Registration No: 0123456789 issued 21/02/2026, amended 03/03/2026 at Ho Chi Minh City Department of Finance'}</p>
              <p><span>📄</span> {language === 'vi' ? 'Giấy phép hoạt động dịch vụ việc làm số: 123456789/GP-LĐTBXH' : 'Employment Service License No: 123456789/GP-LDTBXH'}</p>
              <p><span>📍</span> {language === 'vi' ? 'Trụ sở chính: Đại học FPT, Khu Công nghệ cao, Quận 9, TP Thủ Đức, TP HCM' : 'Headquarters: FPT University, Hi-Tech Park, District 9, Thu Duc City, HCMC'}</p>

            </CompanyDetails>

            <QrCodeArea>
              <img src="/OpPoReview/images/qrcode.png" alt="QR Code" onError={(e) => { e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://leluc212.github.io/OpPoReview/' }} />
              <p>leluc212.github.io/OpPoReview</p>
            </QrCodeArea>
          </FooterBottom>

          <Copyright $isDark={isDarkMode}>
            © {new Date().getFullYear()} Ốp Pờ Vietnam JSC. {language === 'vi' ? 'Toàn bộ quyền được bảo lưu.' : 'All rights reserved.'}
          </Copyright>
        </Footer>
      </ScrollContainer>

      <UnderDevelopmentModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
      />
    </LandingContainer>
  );
};

export default LandingPage;


