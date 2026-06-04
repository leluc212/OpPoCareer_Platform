import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, Star, Package, ArrowRight, LogIn, Eye, X,
  Plus, Trash2, ArrowLeft, Download, PlusCircle
} from 'lucide-react';
import candidateProfileService from '../../services/candidateProfileService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { s3Images } from '../../utils/s3Images';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const PageWrapper = styled.div`
  min-height: calc(100vh - 56px);
`;

const Hero = styled.div`
  padding: 60px 48px 48px;
  background: linear-gradient(135deg, #1a62ff 0%, #002e9d 100%);
  text-align: center;
`;

const HeroTitle = styled(motion.h1)`
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 900;
  color: #fff;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
`;

const HeroSub = styled(motion.p)`
  font-size: 1rem;
  color: rgba(255,255,255,0.82);
  margin-bottom: 0;
`;

const Content = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 48px 24px 80px;
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${p => p.$isDark ? '#e2e8f0' : '#1e293b'};
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  &::after {
    content: '';
    flex: 1;
    height: 2px;
    background: linear-gradient(90deg, #1a62ff33, transparent);
    border-radius: 2px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 48px;
`;

const CVCard = styled(motion.div)`
  background: ${p => p.$isDark ? 'rgba(30,41,59,0.8)' : '#fff'};
  border: 1.5px solid ${p => p.$isDark ? 'rgba(75,85,99,0.3)' : '#e2e8f0'};
  border-radius: 16px;
  overflow: hidden;
  animation: ${fadeUp} 0.4s ease both;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  &:hover {
    border-color: #1a62ff;
    box-shadow: 0 8px 32px rgba(26,98,255,0.12);
    transform: translateY(-2px);
  }
`;

const CVPreview = styled.div`
  height: 180px;
  background: ${p => p.$bg || 'linear-gradient(135deg, #f0f4ff, #e0eaff)'};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const CVMockup = styled.div`
  width: 110px;
  background: #fff;
  border-radius: 8px;
  padding: 12px 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  div {
    height: 6px;
    border-radius: 3px;
    margin-bottom: 5px;
    background: ${p => p.$color || '#1a62ff'};
    &:nth-child(2) { width: 70%; background: #e2e8f0; }
    &:nth-child(3) { width: 85%; background: #e2e8f0; }
    &:nth-child(4) { width: 60%; background: #e2e8f0; }
    &:nth-child(5) { width: 90%; background: #e2e8f0; margin-top: 8px; }
    &:nth-child(6) { width: 75%; background: #e2e8f0; }
  }
`;

const CVInfo = styled.div`
  padding: 16px 18px;
`;

const CVName = styled.div`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${p => p.$isDark ? '#e2e8f0' : '#1e293b'};
  margin-bottom: 4px;
`;

const CVDesc = styled.div`
  font-size: 0.82rem;
  color: ${p => p.$isDark ? '#94a3b8' : '#64748b'};
  margin-bottom: 14px;
  line-height: 1.5;
`;

const CVActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ViewBtn = styled.a`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px;
  border: 1.5px solid #1a62ff;
  border-radius: 10px;
  color: #1a62ff;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #eff6ff; }
`;

const UseBtn = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px;
  background: #1a62ff;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  &:hover { background: #002e9d; }
`;

const LoginNote = styled.div`
  text-align: center;
  padding: 32px;
  background: ${p => p.$isDark ? 'rgba(30,41,59,0.6)' : '#f8fafc'};
  border: 1.5px dashed ${p => p.$isDark ? 'rgba(75,85,99,0.4)' : '#cbd5e1'};
  border-radius: 16px;
  margin-top: 8px;
  p {
    font-size: 0.9rem;
    color: ${p => p.$isDark ? '#94a3b8' : '#64748b'};
    margin-bottom: 16px;
  }
`;

const LoginBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #1a62ff;
  color: #fff;
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  &:hover { background: #002e9d; }
`;

// ─── Logged In Candidate Header ───────────────────────────────
const LoggedInHeader = styled.header`
  padding: 0 40px;
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
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: ${props => props.$isDark
    ? '0 4px 24px rgba(0, 0, 0, 0.3)'
    : '0 4px 24px #a4ddf8'};
  height: 64px;

  @media (max-width: 768px) {
    padding: 0 16px;
    height: 56px;
  }
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: all 0.3s ease;
  img {
    height: 36px;
  }
  &:hover {
    transform: scale(1.05);
  }
`;

const BackToProfileBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: ${p => p.$isDark ? 'rgba(255,255,255,0.05)' : '#eff6ff'};
  color: ${p => p.$isDark ? '#cbd5e1' : '#1a62ff'};
  border: 1px solid ${p => p.$isDark ? '#475569' : '#1a62ff'};
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #1a62ff;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(26, 98, 255, 0.15);
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 12px;
  }
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

// ─── Preview Modal ────────────────────────────────────────────
const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalBox = styled(motion.div)`
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 32px 80px rgba(0,0,0,0.3);
  position: relative;
`;

const ModalClose = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
  &:hover { background: #e2e8f0; color: #1e293b; transform: scale(1.1); }
`;

const ModalHeader = styled.div`
  padding: 28px 28px 20px;
  border-bottom: 1px solid #f1f5f9;
  h2 { font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
  p  { font-size: 0.85rem; color: #64748b; }
`;

const CVPreviewFull = styled.div`
  padding: 28px;
`;

/* ── Simple template ── */
const SimpleCV = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  font-family: 'Segoe UI', sans-serif;
`;
const SimpleCVHeader = styled.div`
  background: ${p => p.$color || '#1a62ff'};
  padding: 28px 32px;
  color: #fff;
  h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 4px; }
  p  { font-size: 0.85rem; opacity: 0.85; }
`;
const SimpleCVBody = styled.div`
  padding: 24px 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
`;
const CVSection = styled.div`
  h3 {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: ${p => p.$color || '#1a62ff'};
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid ${p => p.$color || '#1a62ff'}33;
  }
`;
const CVItem = styled.div`
  margin-bottom: 12px;
  .title { font-size: 0.88rem; font-weight: 700; color: #1e293b; }
  .sub   { font-size: 0.8rem; color: #64748b; margin-top: 2px; }
  .desc  { font-size: 0.78rem; color: #94a3b8; margin-top: 4px; line-height: 1.5; }
`;
const SkillTag = styled.span`
  display: inline-block;
  background: ${p => p.$color || '#1a62ff'}15;
  color: ${p => p.$color || '#1a62ff'};
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 0.78rem;
  font-weight: 600;
  margin: 3px 3px 3px 0;
`;

/* ── Impressive template ── */
const ImpressiveCV = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  font-family: 'Segoe UI', sans-serif;
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 480px;
`;
const ImpressiveSidebar = styled.div`
  background: #7c3aed;
  padding: 28px 20px;
  color: #fff;
  .avatar {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: rgba(255,255,255,0.25);
    margin: 0 auto 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.8rem; font-weight: 800;
  }
  .name { font-size: 1rem; font-weight: 800; text-align: center; margin-bottom: 4px; }
  .role { font-size: 0.78rem; opacity: 0.8; text-align: center; margin-bottom: 20px; }
`;
const ImpressiveSideSection = styled.div`
  margin-bottom: 18px;
  h4 { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.7; margin-bottom: 8px; }
  p  { font-size: 0.78rem; opacity: 0.9; margin-bottom: 4px; }
`;
const SkillBar = styled.div`
  margin-bottom: 8px;
  .label { font-size: 0.75rem; margin-bottom: 3px; }
  .bar { height: 5px; background: rgba(255,255,255,0.2); border-radius: 3px; }
  .fill { height: 5px; background: #fff; border-radius: 3px; width: ${p => p.$pct}%; }
`;
const ImpressiveMain = styled.div`
  padding: 28px 24px;
  background: #fff;
`;

/* ── Modern template ── */
const ModernCV = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  font-family: 'Segoe UI', sans-serif;
`;
const ModernCVTop = styled.div`
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  padding: 28px 32px;
  display: flex;
  align-items: center;
  gap: 20px;
  border-bottom: 3px solid #16a34a;
  .avatar {
    width: 72px; height: 72px;
    border-radius: 16px;
    background: #16a34a;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.8rem; font-weight: 800; color: #fff;
    flex-shrink: 0;
  }
  h1 { font-size: 1.4rem; font-weight: 800; color: #14532d; margin-bottom: 4px; }
  p  { font-size: 0.85rem; color: #16a34a; font-weight: 600; }
`;
const ModernCVBody = styled.div`
  padding: 24px 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
`;
const ModernTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  margin: 3px 3px 3px 0;
`;

const ModalUseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 28px 28px;
  padding: 14px;
  background: #1a62ff;
  border: none;
  color: #fff;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  &:hover { background: #002e9d; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,98,255,0.3); }
`;

const GlobalPrintStyle = createGlobalStyle`
  /* Screen styling for CV preview paper */
  #cv-preview-paper {
    position: relative !important;
    width: 210mm !important;
    height: 297mm !important;
    box-sizing: border-box !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
    margin: 0 auto !important;
    background: white !important;
    overflow: hidden !important;
  }

  @media print {
    @page {
      size: A4;
      margin: 0;
    }
    body {
      background: white !important;
      color: black !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Hide standard app bars, sidebars, headers, footers, forms */
    nav, header, footer, 
    #landing-header, #landing-footer,
    .no-print, .form-panel, .top-bar, .editor-header {
      display: none !important;
    }

    /* Make sure parents are visible but unstyled */
    #root, .editor-container, .preview-panel {
      display: block !important;
      height: auto !important;
      min-height: auto !important;
      padding: 0 !important;
      margin: 0 !important;
      background: white !important;
      border: none !important;
      box-shadow: none !important;
    }
    
    /* Format preview paper to fit exactly on A4 print page */
    #cv-preview-paper {
      position: relative !important;
      width: 210mm !important;
      height: 297mm !important;
      box-sizing: border-box !important;
      border: none !important;
      box-shadow: none !important;
      margin: 0 auto !important;
      padding: 0 !important; /* Borderless, edge-to-edge layout */
      background: white !important;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
    }
  }
`;

const EditorContainer = styled.div`
  display: grid;
  grid-template-columns: 480px 1fr;
  height: calc(100vh - 56px);
  background: ${p => p.$isDark ? '#0f172a' : '#f8fafc'};
  color: ${p => p.$isDark ? '#cbd5e1' : '#1e293b'};
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    height: auto;
  }
`;

const FormPanel = styled.div`
  padding: 24px;
  overflow-y: auto;
  background: ${p => p.$isDark ? '#1e293b' : '#ffffff'};
  border-right: 1px solid ${p => p.$isDark ? '#334155' : '#e2e8f0'};
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100vh - 120px);
`;

const PreviewPanel = styled.div`
  padding: 32px;
  overflow: auto;
  background: ${p => p.$isDark ? '#0f172a' : '#f1f5f9'};
  display: flex;
  justify-content: center;
  align-items: flex-start;
  height: calc(100vh - 120px);
`;

const PreviewPaper = styled.div`
  width: 210mm;
  min-height: 297mm;
  background: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  border: 1px solid #cbd5e1;
  padding: 20mm;
  box-sizing: border-box;
  color: #1e293b;
  text-align: left;
  
  @media (max-width: 768px) {
    width: 100%;
    min-height: auto;
    padding: 8mm;
  }
`;

const SectionBox = styled.div`
  background: ${p => p.$isDark ? '#0f172a' : '#f8fafc'};
  border: 1px solid ${p => p.$isDark ? '#334155' : '#e2e8f0'};
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 12px;
`;

const SectionHeaderTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${p => p.$isDark ? '#e2e8f0' : '#1e293b'};
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FormField = styled.div`
  margin-bottom: 12px;
  label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: ${p => p.$isDark ? '#94a3b8' : '#475569'};
    margin-bottom: 4px;
    text-align: left;
  }
  input, textarea {
    width: 100%;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid ${p => p.$isDark ? '#475569' : '#cbd5e1'};
    background: ${p => p.$isDark ? '#1e293b' : '#ffffff'};
    color: ${p => p.$isDark ? '#f8fafc' : '#1e293b'};
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.2s;
    &:focus {
      border-color: #1a62ff;
    }
  }
  textarea {
    resize: vertical;
    min-height: 80px;
  }
`;

const ItemBox = styled.div`
  border-left: 3px solid #1a62ff;
  padding-left: 12px;
  margin-bottom: 16px;
  position: relative;
`;

const DeleteBtn = styled.button`
  background: transparent;
  color: #ef4444;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 8px;
  &:hover {
    color: #dc2626;
  }
`;

const AddBtn = styled.button`
  background: #eff6ff;
  color: #1a62ff;
  border: 1px dashed #1a62ff;
  border-radius: 8px;
  padding: 8px 16px;
  width: 100%;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.2s;
  &:hover {
    background: #dbeafe;
  }
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: ${p => p.$isDark ? '#1e293b' : '#ffffff'};
  border-bottom: 1px solid ${p => p.$isDark ? '#334155' : '#e2e8f0'};
`;

const BackBtn = styled.button`
  background: transparent;
  border: none;
  color: ${p => p.$isDark ? '#94a3b8' : '#64748b'};
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover {
    color: #1a62ff;
  }
`;

const StyleSelector = styled.div`
  display: flex;
  background: ${p => p.$isDark ? '#0f172a' : '#f1f5f9'};
  padding: 4px;
  border-radius: 8px;
  gap: 4px;
`;

const StyleOption = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: ${p => p.$active ? (p.$isDark ? '#1e293b' : '#ffffff') : 'transparent'};
  color: ${p => p.$active ? '#1a62ff' : (p.$isDark ? '#94a3b8' : '#64748b')};
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
`;

const PrintBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #1a62ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(26,98,255,0.2);
  transition: background 0.2s;
  &:hover {
    background: #002e9d;
  }
`;

const SkillsInputWrapper = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  input {
    flex: 1;
  }
`;

const SkillBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eff6ff;
  color: #1a62ff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  margin: 3px 3px 3px 0;
  button {
    background: transparent;
    border: none;
    color: #ef4444;
    cursor: pointer;
    font-size: 0.7rem;
    padding: 0 2px;
    display: flex;
    align-items: center;
  }
`;

const CVTemplates = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const vi = language === 'vi';
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(null);
  
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const simpleTemplates = [
    {
      name: vi ? 'Mẫu CV Đơn giản' : 'Simple CV Template',
      desc: vi ? 'Thiết kế tối giản, chuyên nghiệp. Phù hợp mọi ngành nghề.' : 'Minimalist, professional design. Suitable for all industries.',
      bg: 'linear-gradient(135deg, #f0f4ff, #dbeafe)',
      color: '#1a62ff',
    },
    {
      name: vi ? 'Mẫu CV Ấn tượng' : 'Impressive CV Template',
      desc: vi ? 'Thiết kế nổi bật, sáng tạo. Gây ấn tượng với nhà tuyển dụng.' : 'Bold, creative design. Make a strong impression on employers.',
      bg: 'linear-gradient(135deg, #fdf4ff, #ede9fe)',
      color: '#7c3aed',
    },
    {
      name: vi ? 'Mẫu CV Hiện đại' : 'Modern CV Template',
      desc: vi ? 'Phong cách hiện đại, trẻ trung. Phù hợp ngành công nghệ, marketing.' : 'Modern, youthful style. Great for tech and marketing roles.',
      bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      color: '#16a34a',
    },
  ];

  const aiTemplates = [
    { name: vi ? 'Nhân viên pha chế' : 'Barista' },
    { name: vi ? 'Lập trình viên' : 'Developer' },
    { name: vi ? 'Nhân viên kế toán' : 'Accountant' },
    { name: vi ? 'Chuyên viên marketing' : 'Marketing Specialist' },
  ];

  const defaultCVData = {
    fullName: vi ? 'Nguyễn Văn An' : 'John Doe',
    title: vi ? 'Nhân viên kinh doanh' : 'Sales Executive',
    email: 'nguyenvanan@email.com',
    phone: '0901 234 567',
    address: vi ? 'Quận 1, TP. Hồ Chí Minh' : 'District 1, HCMC',
    website: 'linkedin.com/in/nguyenvanan',
    avatar: null,
    objective: vi 
      ? 'Tìm kiếm vị trí kinh doanh để phát huy kỹ năng giao tiếp và đóng góp vào sự phát triển bền vững của công ty.'
      : 'Seeking a sales position to leverage communication skills and contribute to sustainable company growth.',
    skills: ['Microsoft Office', 'CRM Software', vi ? 'Đàm phán' : 'Negotiation', vi ? 'Thuyết trình' : 'Presentation', 'English B2', vi ? 'Làm việc nhóm' : 'Teamwork'],
    languages: [vi ? 'Tiếng Việt (Bản ngữ)' : 'Vietnamese (Native)', vi ? 'Tiếng Anh (B2)' : 'English (B2)'],
    experiences: [
      {
        company: 'ABC Corp',
        role: vi ? 'Nhân viên kinh doanh' : 'Sales Executive',
        duration: vi ? '2022 – Hiện tại' : '2022 - Present',
        description: vi ? 'Phát triển khách hàng mới, đạt 120% KPI hàng quý.' : 'Developed new clients, achieved 120% quarterly KPI.'
      },
      {
        company: 'XYZ Ltd',
        role: vi ? 'Thực tập sinh kinh doanh' : 'Sales Intern',
        duration: '2021 – 2022',
        description: vi ? 'Hỗ trợ đội ngũ kinh doanh, xử lý đơn hàng và chăm sóc khách hàng.' : 'Supported sales team, processed orders and handled customer care.'
      }
    ],
    educations: [
      {
        school: vi ? 'Đại học Kinh tế TP.HCM' : 'University of Economics HCMC',
        degree: vi ? 'Cử nhân Quản trị Kinh doanh' : 'Bachelor of Business Administration',
        duration: '2018 – 2022',
        description: vi ? 'GPA: 3.2/4.0. Đạt học bổng sinh viên giỏi năm 2020.' : 'GPA: 3.2/4.0. Earned merit scholarship in 2020.'
      }
    ],
    customSections: [
      {
        id: 'projects',
        title: vi ? 'Dự án nổi bật' : 'Key Projects',
        items: [
          {
            title: vi ? 'Hệ thống Quản lý Bán hàng' : 'Sales Management System',
            subtitle: 'ABC Corp',
            duration: '2023',
            description: vi ? 'Tối ưu hóa quy trình theo dõi đơn hàng và doanh số bán hàng hàng tháng.' : 'Optimized processing workflows for tracking orders and monthly sales.'
          }
        ]
      }
    ]
  };

  const [cvData, setCvData] = useState(defaultCVData);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await candidateProfileService.getMyProfile();
        if (profile) {
          setCvData(prev => ({
            ...prev,
            fullName: profile.fullName || prev.fullName,
            email: profile.email || prev.email,
            phone: profile.phone || prev.phone,
            address: profile.location || prev.address,
            title: profile.title || prev.title,
            objective: profile.bio || prev.objective,
            avatar: profile.profileImage || prev.avatar,
            skills: (profile.skills && profile.skills.length > 0) ? profile.skills : prev.skills
          }));
        }
      } catch (err) {
        console.warn('Could not load candidate profile to autofill CV:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleBasicChange = (field, val) => {
    setCvData(prev => ({ ...prev, [field]: val }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCvData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setCvData(prev => ({ ...prev, avatar: null }));
  };

  const handleExperienceChange = (index, field, val) => {
    setCvData(prev => {
      const list = [...prev.experiences];
      list[index] = { ...list[index], [field]: val };
      return { ...prev, experiences: list };
    });
  };

  const addExperience = () => {
    setCvData(prev => ({
      ...prev,
      experiences: [...prev.experiences, { company: '', role: '', duration: '', description: '' }]
    }));
  };

  const removeExperience = (index) => {
    setCvData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };

  const handleEducationChange = (index, field, val) => {
    setCvData(prev => {
      const list = [...prev.educations];
      list[index] = { ...list[index], [field]: val };
      return { ...prev, educations: list };
    });
  };

  const addEducation = () => {
    setCvData(prev => ({
      ...prev,
      educations: [...prev.educations, { school: '', degree: '', duration: '', description: '' }]
    }));
  };

  const removeEducation = (index) => {
    setCvData(prev => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index)
    }));
  };

  const addSkill = (skill) => {
    if (!skill.trim()) return;
    setCvData(prev => {
      if (prev.skills.includes(skill.trim())) return prev;
      return { ...prev, skills: [...prev.skills, skill.trim()] };
    });
  };

  const removeSkill = (index) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addLanguage = (lang) => {
    if (!lang.trim()) return;
    setCvData(prev => {
      if (prev.languages.includes(lang.trim())) return prev;
      return { ...prev, languages: [...prev.languages, lang.trim()] };
    });
  };

  const removeLanguage = (index) => {
    setCvData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const addCustomSection = () => {
    setCvData(prev => ({
      ...prev,
      customSections: [
        ...prev.customSections,
        {
          id: `custom_${Date.now()}`,
          title: vi ? 'Mục mới' : 'New Section',
          items: [{ title: '', subtitle: '', duration: '', description: '' }]
        }
      ]
    }));
  };

  const removeCustomSection = (id) => {
    setCvData(prev => ({
      ...prev,
      customSections: prev.customSections.filter(s => s.id !== id)
    }));
  };

  const handleCustomSectionTitleChange = (id, newTitle) => {
    setCvData(prev => ({
      ...prev,
      customSections: prev.customSections.map(s => s.id === id ? { ...s, title: newTitle } : s)
    }));
  };

  const addCustomSectionItem = (sectionId) => {
    setCvData(prev => ({
      ...prev,
      customSections: prev.customSections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          items: [...s.items, { title: '', subtitle: '', duration: '', description: '' }]
        };
      })
    }));
  };

  const removeCustomSectionItem = (sectionId, itemIndex) => {
    setCvData(prev => ({
      ...prev,
      customSections: prev.customSections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          items: s.items.filter((_, i) => i !== itemIndex)
        };
      })
    }));
  };

  const handleCustomSectionItemChange = (sectionId, itemIndex, field, val) => {
    setCvData(prev => ({
      ...prev,
      customSections: prev.customSections.map(s => {
        if (s.id !== sectionId) return s;
        const newItems = [...s.items];
        newItems[itemIndex] = { ...newItems[itemIndex], [field]: val };
        return { ...s, items: newItems };
      })
    }));
  };

  const handleDownloadPDF = async () => {
    try {
      const element = document.getElementById('cv-preview-paper');
      if (!element) {
        alert(vi ? 'Không tìm thấy khung CV để tải xuống.' : 'CV preview container not found.');
        return;
      }

      console.log('Generating PDF...');

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 dimensions: 210mm x 297mm
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      
      const fileName = cvData.fullName 
        ? `CV_${cvData.fullName.replace(/\s+/g, '_')}.pdf`
        : 'CV.pdf';
        
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(vi ? 'Có lỗi xảy ra khi tải xuống PDF. Vui lòng thử lại.' : 'Failed to download PDF. Please try again.');
    }
  };

  const handleDownloadJPG = async () => {
    try {
      const element = document.getElementById('cv-preview-paper');
      if (!element) {
        alert(vi ? 'Không tìm thấy khung CV để tải xuống.' : 'CV preview container not found.');
        return;
      }

      console.log('Generating JPG...');

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const link = document.createElement('a');
      link.href = imgData;
      
      const fileName = cvData.fullName 
        ? `CV_${cvData.fullName.replace(/\s+/g, '_')}.jpg`
        : 'CV.jpg';
        
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating JPG:', error);
      alert(vi ? 'Có lỗi xảy ra khi tải xuống JPG. Vui lòng thử lại.' : 'Failed to download JPG. Please try again.');
    }
  };

  const startEditing = (index) => {
    setSelectedStyleIndex(index);
    setIsEditing(true);
    setPreviewIndex(null);
  };

  const handleUseTemplate = (index) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/candidate/cv-templates&role=candidate');
      return;
    }
    startEditing(index);
  };

  const handlePreviewTemplate = (index) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/candidate/cv-templates&role=candidate');
      return;
    }
    setPreviewIndex(index);
  };

  const renderPreview = (index, data = cvData) => {
    if (index === 0) return (
      <SimpleCV id="cv-preview-paper">
        <SimpleCVHeader $color="#1a62ff" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {data.avatar && (
            <img 
              src={data.avatar} 
              alt="Avatar" 
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid rgba(255,255,255,0.35)', flexShrink: 0 }} 
            />
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{data.fullName}</h1>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', opacity: 0.9 }}>
              {data.title} {data.title && '·'} {data.email} {data.email && '·'} {data.phone}
            </p>
            {data.address && <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', opacity: 0.85 }}>📍 {data.address}</p>}
            {data.website && <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', opacity: 0.85 }}>🔗 {data.website}</p>}
          </div>
        </SimpleCVHeader>
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {data.objective && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 18px', borderLeft: '4px solid #1a62ff' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#1a62ff', marginBottom: 6 }}>
                {vi ? 'Mục tiêu nghề nghiệp' : 'Career Objective'}
              </div>
              <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                {data.objective}
              </p>
            </div>
          )}

          {data.experiences && data.experiences.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                {vi ? 'Kinh nghiệm làm việc' : 'Work Experience'}
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>
              {data.experiences.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a62ff', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{item.role}</div>
                    <div style={{ fontSize: '0.78rem', color: '#1a62ff', fontWeight: 600, marginBottom: 3 }}>
                      {item.company} {item.duration && `· ${item.duration}`}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.educations && data.educations.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                {vi ? 'Học vấn' : 'Education'}
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>
              {data.educations.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a62ff', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{item.degree}</div>
                    <div style={{ fontSize: '0.78rem', color: '#1a62ff', fontWeight: 600, marginBottom: 3 }}>
                      {item.school} {item.duration && `· ${item.duration}`}
                    </div>
                    {item.description && <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{item.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.skills && data.skills.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                {vi ? 'Kỹ năng' : 'Skills'}
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {data.skills.map(s => (
                  <SkillTag key={s} $color="#1a62ff">{s}</SkillTag>
                ))}
              </div>
            </div>
          )}

          {data.languages && data.languages.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                {vi ? 'Ngôn ngữ' : 'Languages'}
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {data.languages.map(l => (
                  <SkillTag key={l} $color="#64748b" style={{ background: '#f1f5f9', color: '#475569' }}>{l}</SkillTag>
                ))}
              </div>
            </div>
          )}

          {data.customSections && data.customSections.map(sec => sec.items && sec.items.length > 0 && (
            <div key={sec.id}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                {sec.title}
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>
              {sec.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a62ff', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{item.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#1a62ff', fontWeight: 600, marginBottom: 3 }}>
                      {item.subtitle} {item.duration && `· ${item.duration}`}
                    </div>
                    {item.description && <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{item.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </SimpleCV>
    );

    if (index === 1) return (
      <ImpressiveCV id="cv-preview-paper">
        <ImpressiveSidebar style={{ background: '#7c3aed' }}>
          {data.avatar ? (
            <img 
              src={data.avatar} 
              alt="Avatar" 
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)', display: 'block', margin: '0 auto 14px' }} 
            />
          ) : (
            <div className="avatar">{data.fullName ? data.fullName.charAt(0).toUpperCase() : 'C'}</div>
          )}
          <div className="name" style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 10 }}>{data.fullName}</div>
          <div className="role" style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: 20 }}>{data.title}</div>
          
          <ImpressiveSideSection>
            <h4>{vi ? 'Liên hệ' : 'Contact'}</h4>
            {data.phone && <p>📞 {data.phone}</p>}
            {data.email && <p>✉️ {data.email}</p>}
            {data.address && <p>📍 {data.address}</p>}
            {data.website && <p style={{ wordBreak: 'break-all' }}>🔗 {data.website}</p>}
          </ImpressiveSideSection>
          
          {data.skills && data.skills.length > 0 && (
            <ImpressiveSideSection>
              <h4>{vi ? 'Kỹ năng' : 'Skills'}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {data.skills.map(s => (
                  <span key={s} style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 4, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600 }}>{s}</span>
                ))}
              </div>
            </ImpressiveSideSection>
          )}

          {data.languages && data.languages.length > 0 && (
            <ImpressiveSideSection>
              <h4>{vi ? 'Ngôn ngữ' : 'Languages'}</h4>
              {data.languages.map(l => (
                <p key={l} style={{ fontSize: '0.75rem', opacity: 0.95 }}>• {l}</p>
              ))}
            </ImpressiveSideSection>
          )}
        </ImpressiveSidebar>
        
        <ImpressiveMain>
          {data.objective && (
            <CVSection $color="#7c3aed">
              <h3>{vi ? 'Mục tiêu nghề nghiệp' : 'About Me'}</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
                {data.objective}
              </p>
            </CVSection>
          )}

          {data.experiences && data.experiences.length > 0 && (
            <CVSection $color="#7c3aed">
              <h3>{vi ? 'Kinh nghiệm làm việc' : 'Experience'}</h3>
              {data.experiences.map((item, i) => (
                <CVItem key={i}>
                  <div className="title" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{item.role}</div>
                  <div className="sub" style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600 }}>
                    {item.company} {item.duration && `· ${item.duration}`}
                  </div>
                  <div className="desc" style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{item.description}</div>
                </CVItem>
              ))}
            </CVSection>
          )}

          {data.educations && data.educations.length > 0 && (
            <CVSection $color="#7c3aed">
              <h3>{vi ? 'Học vấn' : 'Education'}</h3>
              {data.educations.map((item, i) => (
                <CVItem key={i}>
                  <div className="title" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{item.degree}</div>
                  <div className="sub" style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600 }}>
                    {item.school} {item.duration && `· ${item.duration}`}
                  </div>
                  {item.description && <div className="desc" style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{item.description}</div>}
                </CVItem>
              ))}
            </CVSection>
          )}

          {data.customSections && data.customSections.map(sec => sec.items && sec.items.length > 0 && (
            <CVSection key={sec.id} $color="#7c3aed">
              <h3>{sec.title}</h3>
              {sec.items.map((item, i) => (
                <CVItem key={i}>
                  <div className="title" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{item.title}</div>
                  <div className="sub" style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600 }}>
                    {item.subtitle} {item.duration && `· ${item.duration}`}
                  </div>
                  {item.description && <div className="desc" style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{item.description}</div>}
                </CVItem>
              ))}
            </CVSection>
          ))}
        </ImpressiveMain>
      </ImpressiveCV>
    );

    if (index === 2) return (
      <ModernCV id="cv-preview-paper">
        <ModernCVTop style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderBottom: '3px solid #16a34a' }}>
          {data.avatar ? (
            <img 
              src={data.avatar} 
              alt="Avatar" 
              style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', border: '2px solid #16a34a', flexShrink: 0 }} 
            />
          ) : (
            <div className="avatar" style={{ background: '#16a34a', color: '#fff' }}>
              {data.fullName ? data.fullName.charAt(0).toUpperCase() : 'C'}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#14532d' }}>{data.fullName}</h1>
            <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#16a34a', fontWeight: 600 }}>{data.title}</p>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
              {data.phone && <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 500 }}>📞 {data.phone}</span>}
              {data.email && <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 500 }}>✉️ {data.email}</span>}
              {data.address && <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 500 }}>📍 {data.address}</span>}
              {data.website && <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 500 }}>🔗 {data.website}</span>}
            </div>
          </div>
        </ModernCVTop>

        {data.skills && data.skills.length > 0 && (
          <div style={{ background: '#16a34a', padding: '10px 32px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {data.skills.map(s => (
              <span key={s} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: '0.72rem', fontWeight: 700 }}>{s}</span>
            ))}
          </div>
        )}

        <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 24 }}>
          <div>
            {data.objective && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#16a34a', marginBottom: 10, borderBottom: '2px solid #dcfce7', paddingBottom: 6 }}>
                  {vi ? 'Mục tiêu nghề nghiệp' : 'Career Objective'}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  {data.objective}
                </p>
              </div>
            )}

            {data.experiences && data.experiences.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#16a34a', marginBottom: 12, borderBottom: '2px solid #dcfce7', paddingBottom: 6 }}>
                  {vi ? 'Kinh nghiệm làm việc' : 'Experience'}
                </div>
                {data.experiences.map((item, i) => (
                  <div key={i} style={{ marginBottom: 14, paddingLeft: 12, borderLeft: '3px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{item.role}</div>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginBottom: 3 }}>
                      {item.company} {item.duration && `· ${item.duration}`}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{item.description}</div>
                  </div>
                ))}
              </div>
            )}

            {data.customSections && data.customSections.map(sec => sec.items && sec.items.length > 0 && (
              <div key={sec.id} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#16a34a', marginBottom: 12, borderBottom: '2px solid #dcfce7', paddingBottom: 6 }}>
                  {sec.title}
                </div>
                {sec.items.map((item, i) => (
                  <div key={i} style={{ marginBottom: 14, paddingLeft: 12, borderLeft: '3px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginBottom: 3 }}>
                      {item.subtitle} {item.duration && `· ${item.duration}`}
                    </div>
                    {item.description && <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{item.description}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div>
            {data.educations && data.educations.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#16a34a', marginBottom: 12, borderBottom: '2px solid #dcfce7', paddingBottom: 6 }}>
                  {vi ? 'Học vấn' : 'Education'}
                </div>
                {data.educations.map((item, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{item.degree}</div>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>{item.school}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.duration}</div>
                    {item.description && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>{item.description}</div>}
                  </div>
                ))}
              </div>
            )}

            {data.languages && data.languages.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#16a34a', marginBottom: 12, borderBottom: '2px solid #dcfce7', paddingBottom: 6 }}>
                  {vi ? 'Ngôn ngữ' : 'Languages'}
                </div>
                {data.languages.map(l => (
                  <ModernTag key={l} style={{ display: 'flex', marginBottom: 4 }}>{l}</ModernTag>
                ))}
              </div>
            )}
          </div>
        </div>
      </ModernCV>
    );
  };

  if (isEditing) {
    return (
      <PageWrapper>
        <GlobalPrintStyle />
        <EditorHeader className="editor-header">
          <BackBtn $isDark={isDarkMode} onClick={() => setIsEditing(false)}>
            <ArrowLeft size={16} />
            {vi ? 'Quay lại danh sách' : 'Back to List'}
          </BackBtn>
          
          <StyleSelector $isDark={isDarkMode}>
            {simpleTemplates.map((t, idx) => (
              <StyleOption 
                key={idx} 
                $active={selectedStyleIndex === idx} 
                $isDark={isDarkMode}
                onClick={() => setSelectedStyleIndex(idx)}
              >
                {vi ? t.name.replace('Mẫu CV ', '') : t.name.replace(' Template', '')}
              </StyleOption>
            ))}
          </StyleSelector>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <PrintBtn onClick={handleDownloadPDF} style={{ background: '#10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
              <Download size={16} />
              {vi ? 'Tải xuống PDF' : 'Download PDF'}
            </PrintBtn>
            <PrintBtn onClick={handleDownloadJPG} style={{ background: '#3b82f6', boxShadow: '0 4px 12px rgba(59,130,246,0.2)' }}>
              <Download size={16} />
              {vi ? 'Tải xuống JPG' : 'Download JPG'}
            </PrintBtn>
          </div>
        </EditorHeader>
        
        <EditorContainer className="editor-container" $isDark={isDarkMode}>
          <FormPanel className="form-panel" $isDark={isDarkMode}>
            <SectionBox $isDark={isDarkMode}>
              <SectionHeaderTitle $isDark={isDarkMode}>
                {vi ? 'Thông tin cá nhân' : 'Personal Info'}
              </SectionHeaderTitle>
              <FormField $isDark={isDarkMode}>
                <label>{vi ? 'Ảnh đại diện CV' : 'CV Avatar'}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                  {cvData.avatar ? (
                    <img 
                      src={cvData.avatar} 
                      alt="Avatar Preview" 
                      style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1a62ff' }} 
                    />
                  ) : (
                    <div style={{ 
                      width: 64, 
                      height: 64, 
                      borderRadius: '50%', 
                      background: isDarkMode ? '#334155' : '#e2e8f0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: isDarkMode ? '#94a3b8' : '#64748b'
                    }}>
                      {vi ? 'Chưa có ảnh' : 'No Image'}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input 
                      type="file" 
                      id="cv-avatar-upload" 
                      accept="image/*" 
                      onChange={handleAvatarChange} 
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="cv-avatar-upload"
                      style={{ 
                        display: 'inline-block',
                        padding: '6px 12px',
                        background: '#eff6ff',
                        color: '#1a62ff',
                        border: '1px solid #1a62ff',
                        borderRadius: 8,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textAlign: 'center',
                        cursor: 'pointer',
                        margin: 0
                      }}
                    >
                      {vi ? 'Tải ảnh lên' : 'Upload photo'}
                    </label>
                    {cvData.avatar && (
                      <button 
                        type="button"
                        onClick={removeAvatar}
                        style={{ 
                          background: 'transparent',
                          color: '#ef4444',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textAlign: 'left',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {vi ? 'Xóa ảnh' : 'Remove photo'}
                      </button>
                    )}
                  </div>
                </div>
              </FormField>
              <FormField $isDark={isDarkMode}>
                <label>{vi ? 'Họ và tên' : 'Full Name'}</label>
                <input 
                  type="text" 
                  value={cvData.fullName} 
                  onChange={e => handleBasicChange('fullName', e.target.value)} 
                />
              </FormField>
              <FormField $isDark={isDarkMode}>
                <label>{vi ? 'Vị trí ứng tuyển' : 'Job Title'}</label>
                <input 
                  type="text" 
                  value={cvData.title} 
                  onChange={e => handleBasicChange('title', e.target.value)} 
                />
              </FormField>
              <FormField $isDark={isDarkMode}>
                <label>Email</label>
                <input 
                  type="email" 
                  value={cvData.email} 
                  onChange={e => handleBasicChange('email', e.target.value)} 
                />
              </FormField>
              <FormField $isDark={isDarkMode}>
                <label>{vi ? 'Số điện thoại' : 'Phone'}</label>
                <input 
                  type="text" 
                  value={cvData.phone} 
                  onChange={e => handleBasicChange('phone', e.target.value)} 
                />
              </FormField>
              <FormField $isDark={isDarkMode}>
                <label>{vi ? 'Địa chỉ' : 'Address'}</label>
                <input 
                  type="text" 
                  value={cvData.address} 
                  onChange={e => handleBasicChange('address', e.target.value)} 
                />
              </FormField>
              <FormField $isDark={isDarkMode}>
                <label>Website / LinkedIn</label>
                <input 
                  type="text" 
                  value={cvData.website} 
                  onChange={e => handleBasicChange('website', e.target.value)} 
                />
              </FormField>
            </SectionBox>

            <SectionBox $isDark={isDarkMode}>
              <SectionHeaderTitle $isDark={isDarkMode}>
                {vi ? 'Mục tiêu nghề nghiệp' : 'Career Objective'}
              </SectionHeaderTitle>
              <FormField $isDark={isDarkMode}>
                <textarea 
                  value={cvData.objective} 
                  onChange={e => handleBasicChange('objective', e.target.value)} 
                />
              </FormField>
            </SectionBox>

            <SectionBox $isDark={isDarkMode}>
              <SectionHeaderTitle $isDark={isDarkMode}>
                {vi ? 'Kinh nghiệm làm việc' : 'Work Experience'}
              </SectionHeaderTitle>
              {cvData.experiences.map((exp, idx) => (
                <ItemBox key={idx}>
                  <FormField $isDark={isDarkMode}>
                    <label>{vi ? 'Công ty' : 'Company'}</label>
                    <input 
                      type="text" 
                      value={exp.company} 
                      onChange={e => handleExperienceChange(idx, 'company', e.target.value)} 
                    />
                  </FormField>
                  <FormField $isDark={isDarkMode}>
                    <label>{vi ? 'Chức danh' : 'Role'}</label>
                    <input 
                      type="text" 
                      value={exp.role} 
                      onChange={e => handleExperienceChange(idx, 'role', e.target.value)} 
                    />
                  </FormField>
                  <FormField $isDark={isDarkMode}>
                    <label>{vi ? 'Thời gian' : 'Duration'}</label>
                    <input 
                      type="text" 
                      value={exp.duration} 
                      placeholder="e.g. 2022 - Present"
                      onChange={e => handleExperienceChange(idx, 'duration', e.target.value)} 
                    />
                  </FormField>
                  <FormField $isDark={isDarkMode}>
                    <label>{vi ? 'Mô tả công việc' : 'Description'}</label>
                    <textarea 
                      value={exp.description} 
                      onChange={e => handleExperienceChange(idx, 'description', e.target.value)} 
                    />
                  </FormField>
                  <DeleteBtn onClick={() => removeExperience(idx)}>
                    <Trash2 size={12} />
                    {vi ? 'Xóa mục này' : 'Remove Item'}
                  </DeleteBtn>
                </ItemBox>
              ))}
              <AddBtn onClick={addExperience}>
                <PlusCircle size={14} />
                {vi ? 'Thêm kinh nghiệm' : 'Add Experience'}
              </AddBtn>
            </SectionBox>

            <SectionBox $isDark={isDarkMode}>
              <SectionHeaderTitle $isDark={isDarkMode}>
                {vi ? 'Học vấn' : 'Education'}
              </SectionHeaderTitle>
              {cvData.educations.map((edu, idx) => (
                <ItemBox key={idx}>
                  <FormField $isDark={isDarkMode}>
                    <label>{vi ? 'Trường học' : 'School'}</label>
                    <input 
                      type="text" 
                      value={edu.school} 
                      onChange={e => handleEducationChange(idx, 'school', e.target.value)} 
                    />
                  </FormField>
                  <FormField $isDark={isDarkMode}>
                    <label>{vi ? 'Bằng cấp / Ngành học' : 'Degree / Major'}</label>
                    <input 
                      type="text" 
                      value={edu.degree} 
                      onChange={e => handleEducationChange(idx, 'degree', e.target.value)} 
                    />
                  </FormField>
                  <FormField $isDark={isDarkMode}>
                    <label>{vi ? 'Thời gian' : 'Duration'}</label>
                    <input 
                      type="text" 
                      value={edu.duration} 
                      placeholder="e.g. 2018 - 2022"
                      onChange={e => handleEducationChange(idx, 'duration', e.target.value)} 
                    />
                  </FormField>
                  <FormField $isDark={isDarkMode}>
                    <label>{vi ? 'Mô tả học vấn (tùy chọn)' : 'Description (optional)'}</label>
                    <textarea 
                      value={edu.description} 
                      onChange={e => handleEducationChange(idx, 'description', e.target.value)} 
                    />
                  </FormField>
                  <DeleteBtn onClick={() => removeEducation(idx)}>
                    <Trash2 size={12} />
                    {vi ? 'Xóa mục này' : 'Remove Item'}
                  </DeleteBtn>
                </ItemBox>
              ))}
              <AddBtn onClick={addEducation}>
                <PlusCircle size={14} />
                {vi ? 'Thêm học vấn' : 'Add Education'}
              </AddBtn>
            </SectionBox>

            <SectionBox $isDark={isDarkMode}>
              <SectionHeaderTitle $isDark={isDarkMode}>
                {vi ? 'Kỹ năng chuyên môn' : 'Skills'}
              </SectionHeaderTitle>
              <SkillsInputWrapper>
                <input 
                  type="text" 
                  placeholder={vi ? 'Nhập kỹ năng mới...' : 'Enter new skill...'} 
                  value={newSkill} 
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(newSkill);
                      setNewSkill('');
                    }
                  }}
                />
                <PrintBtn style={{ boxShadow: 'none' }} onClick={() => {
                  addSkill(newSkill);
                  setNewSkill('');
                }}>
                  {vi ? 'Thêm' : 'Add'}
                </PrintBtn>
              </SkillsInputWrapper>
              <div style={{ marginTop: 10 }}>
                {cvData.skills.map((skill, idx) => (
                  <SkillBadge key={idx}>
                    {skill}
                    <button onClick={() => removeSkill(idx)}>&times;</button>
                  </SkillBadge>
                ))}
              </div>
            </SectionBox>

            <SectionBox $isDark={isDarkMode}>
              <SectionHeaderTitle $isDark={isDarkMode}>
                {vi ? 'Ngôn ngữ' : 'Languages'}
              </SectionHeaderTitle>
              <SkillsInputWrapper>
                <input 
                  type="text" 
                  placeholder={vi ? 'Nhập ngôn ngữ...' : 'Enter language...'} 
                  value={newLanguage} 
                  onChange={e => setNewLanguage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLanguage(newLanguage);
                      setNewLanguage('');
                    }
                  }}
                />
                <PrintBtn style={{ boxShadow: 'none' }} onClick={() => {
                  addLanguage(newLanguage);
                  setNewLanguage('');
                }}>
                  {vi ? 'Thêm' : 'Add'}
                </PrintBtn>
              </SkillsInputWrapper>
              <div style={{ marginTop: 10 }}>
                {cvData.languages.map((lang, idx) => (
                  <SkillBadge key={idx} style={{ background: '#f1f5f9', color: '#475569' }}>
                    {lang}
                    <button onClick={() => removeLanguage(idx)}>&times;</button>
                  </SkillBadge>
                ))}
              </div>
            </SectionBox>

            {cvData.customSections.map((sec) => (
              <SectionBox key={sec.id} $isDark={isDarkMode}>
                <SectionHeaderTitle $isDark={isDarkMode}>
                  <input 
                    type="text" 
                    value={sec.title} 
                    style={{ 
                      fontSize: '0.95rem', 
                      fontWeight: 700, 
                      border: 'none', 
                      borderBottom: '1px dashed #cbd5e1', 
                      background: 'transparent', 
                      color: isDarkMode ? '#e2e8f0' : '#1e293b', 
                      outline: 'none',
                      padding: '2px 4px',
                      width: '60%'
                    }}
                    onChange={e => handleCustomSectionTitleChange(sec.id, e.target.value)} 
                  />
                  <DeleteBtn style={{ marginTop: 0 }} onClick={() => removeCustomSection(sec.id)}>
                    <Trash2 size={12} />
                    {vi ? 'Xóa mục lớn' : 'Delete Section'}
                  </DeleteBtn>
                </SectionHeaderTitle>
                
                {sec.items.map((item, idx) => (
                  <ItemBox key={idx}>
                    <FormField $isDark={isDarkMode}>
                      <label>{vi ? 'Tiêu đề' : 'Title'}</label>
                      <input 
                        type="text" 
                        value={item.title} 
                        onChange={e => handleCustomSectionItemChange(sec.id, idx, 'title', e.target.value)} 
                      />
                    </FormField>
                    <FormField $isDark={isDarkMode}>
                      <label>{vi ? 'Tiêu đề phụ / Tổ chức' : 'Subtitle'}</label>
                      <input 
                        type="text" 
                        value={item.subtitle} 
                        onChange={e => handleCustomSectionItemChange(sec.id, idx, 'subtitle', e.target.value)} 
                      />
                    </FormField>
                    <FormField $isDark={isDarkMode}>
                      <label>{vi ? 'Thời gian' : 'Duration'}</label>
                      <input 
                        type="text" 
                        value={item.duration} 
                        onChange={e => handleCustomSectionItemChange(sec.id, idx, 'duration', e.target.value)} 
                      />
                    </FormField>
                    <FormField $isDark={isDarkMode}>
                      <label>{vi ? 'Mô tả chi tiết' : 'Description'}</label>
                      <textarea 
                        value={item.description} 
                        onChange={e => handleCustomSectionItemChange(sec.id, idx, 'description', e.target.value)} 
                      />
                    </FormField>
                    <DeleteBtn onClick={() => removeCustomSectionItem(sec.id, idx)}>
                      <Trash2 size={12} />
                      {vi ? 'Xóa dòng này' : 'Remove Item'}
                    </DeleteBtn>
                  </ItemBox>
                ))}
                
                <AddBtn onClick={() => addCustomSectionItem(sec.id)}>
                  <PlusCircle size={14} />
                  {vi ? 'Thêm dòng mới' : 'Add New Item'}
                </AddBtn>
              </SectionBox>
            ))}

            <AddBtn 
              style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#16a34a', borderStyle: 'solid', marginTop: 10 }} 
              onClick={addCustomSection}
            >
              <PlusCircle size={14} />
              {vi ? 'Thêm mục mới (tùy chọn)' : 'Add Custom Section'}
            </AddBtn>
          </FormPanel>
          
          <PreviewPanel className="preview-panel" $isDark={isDarkMode}>
            {renderPreview(selectedStyleIndex, cvData)}
          </PreviewPanel>
        </EditorContainer>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <LoggedInHeader $isDark={isDarkMode}>
        <NavLeft>
          <Logo to="/">
            <img src={s3Images.system.logo} alt="Ốp Pờ" />
          </Logo>
          <BackToProfileBtn to="/candidate/profile" $isDark={isDarkMode}>
            <ArrowLeft size={14} />
            {vi ? 'Quay lại Hồ sơ' : 'Back to Profile'}
          </BackToProfileBtn>
        </NavLeft>
        <UserProfile>
          {cvData.avatar ? (
            <img 
              src={cvData.avatar} 
              alt="Avatar" 
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #1a62ff' }} 
            />
          ) : (
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#1a62ff',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '14px'
            }}>
              {cvData.fullName ? cvData.fullName.charAt(0).toUpperCase() : 'C'}
            </div>
          )}
          <span style={{ fontSize: '14.5px', fontWeight: 700, color: isDarkMode ? '#cbd5e1' : '#475569' }}>
            {cvData.fullName}
          </span>
        </UserProfile>
      </LoggedInHeader>

      <Hero style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <HeroTitle initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {vi ? 'Mẫu CV Chuyên Nghiệp' : 'Professional CV Templates'}
        </HeroTitle>
        <HeroSub initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          {vi ? 'Khám phá các mẫu CV đẹp, chuyên nghiệp. Tạo và tùy chỉnh CV của riêng bạn.' : 'Explore beautiful, professional CV templates. Create and customize your own CV.'}
        </HeroSub>
      </Hero>

      <Content>
        <SectionTitle $isDark={isDarkMode}>
          <Package size={18} color="#1a62ff" />
          {vi ? 'Mẫu CV theo style' : 'CV Templates by Style'}
        </SectionTitle>
        {!isAuthenticated && (
          <div style={{ 
            background: isDarkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2', 
            border: '1px solid #fca5a5', 
            borderRadius: 12, 
            padding: '12px 18px', 
            marginBottom: 20,
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textAlign: 'left'
          }}>
            <span>⚠️</span>
            {vi ? 'Bạn cần đăng nhập để xem trước và thiết kế mẫu CV của mình.' : 'You need to log in to preview and design your CV.'}
          </div>
        )}
        <Grid>
          {simpleTemplates.map((t, i) => (
            <CVCard key={i} $isDark={isDarkMode} style={{ animationDelay: `${i * 0.08}s` }}>
              <CVPreview $bg={t.bg}>
                <CVMockup $color={t.color}>
                  <div /><div /><div /><div /><div /><div />
                </CVMockup>
              </CVPreview>
              <CVInfo>
                <CVName $isDark={isDarkMode}>{t.name}</CVName>
                <CVDesc $isDark={isDarkMode}>{t.desc}</CVDesc>
                <CVActions>
                  <ViewBtn onClick={() => handlePreviewTemplate(i)}>
                    <Eye size={14} />{vi ? 'Xem trước' : 'Preview'}
                  </ViewBtn>
                  <UseBtn onClick={() => handleUseTemplate(i)}>
                    <LogIn size={14} />{vi ? 'Dùng mẫu này' : 'Use Template'}
                  </UseBtn>
                </CVActions>
              </CVInfo>
            </CVCard>
          ))}
        </Grid>

        <SectionTitle $isDark={isDarkMode}>
          <Star size={18} color="#1a62ff" />
          {vi ? 'Tạo CV bằng AI' : 'Create CV with AI'}
        </SectionTitle>
        <LoginNote $isDark={isDarkMode}>
          <p>
            {vi
              ? 'Tính năng tạo CV bằng AI yêu cầu đăng nhập. Đăng nhập để tạo CV chuyên nghiệp chỉ trong vài phút với sự hỗ trợ của AI.'
              : 'AI CV creation requires login. Sign in to create a professional CV in minutes with AI assistance.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            {aiTemplates.map((t, i) => (
              <span key={i} style={{
                background: isDarkMode ? 'rgba(26,98,255,0.15)' : '#eff6ff',
                color: '#1a62ff',
                borderRadius: 8,
                padding: '4px 12px',
                fontSize: '0.85rem',
                fontWeight: 600
              }}>
                {t.name}
              </span>
            ))}
          </div>
          <LoginBtn to="/login?redirect=/candidate/profile&role=candidate">
            <LogIn size={16} />
            {vi ? 'Đăng nhập để tạo CV bằng AI' : 'Login to Create AI CV'}
          </LoginBtn>
        </LoginNote>
      </Content>

      <AnimatePresence>
        {previewIndex !== null && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewIndex(null)}
          >
            <ModalBox
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              onClick={e => e.stopPropagation()}
            >
              <ModalClose onClick={() => setPreviewIndex(null)}>
                <X size={18} />
              </ModalClose>
              <ModalHeader>
                <h2>{simpleTemplates[previewIndex]?.name}</h2>
                <p>{simpleTemplates[previewIndex]?.desc}</p>
              </ModalHeader>
              <CVPreviewFull>
                {renderPreview(previewIndex, defaultCVData)}
              </CVPreviewFull>
              <ModalUseBtn onClick={() => handleUseTemplate(previewIndex)}>
                <LogIn size={16} />
                {vi ? 'Dùng mẫu này' : 'Use This Template'}
              </ModalUseBtn>
            </ModalBox>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default CVTemplates;
