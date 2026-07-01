import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import jobPostService from '../../services/jobPostService';
import quickJobService from '../../services/quickJobService';
import candidateProfileService from '../../services/candidateProfileService';
import {
  Search, MapPin, Briefcase, Clock, Building2,
  Zap, Filter, ChevronRight, ChevronDown, X, DollarSign,
  Calendar, Users, Globe, FileText, LogIn, Bookmark, Sparkles
} from 'lucide-react';
import adminEmployerService from '../../services/adminEmployerService';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const PageWrapper = styled.div`
  min-height: calc(100vh - 56px);
`;

/* ─── Hero ─── */
const Hero = styled.div`
  padding: 48px 48px 40px;
  background: linear-gradient(135deg, #1a62ff 0%, #002e9d 100%);
  position: relative;
  text-align: center;
`;

const HeroBackground = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 70% 30%, rgba(255,255,255,0.07) 0%, transparent 60%);
    pointer-events: none;
  }
`;

const HeroTitle = styled.h1`
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-weight: 900;
  color: #fff;
  margin-bottom: 20px;
  position: relative; z-index: 1;
  letter-spacing: -0.5px;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 12px;
  max-width: 800px;
  margin: 0 auto;
  position: relative; z-index: 1;
  @media (max-width: 640px) { flex-direction: column; }
`;

const SearchBox = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  position: relative;
  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 0.95rem;
    color: #1e293b;
    background: transparent;
    &::placeholder { color: #94a3b8; }
  }
  svg { color: #94a3b8; flex-shrink: 0; }
`;

const SuggestionDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  max-height: 280px;
  overflow-y: auto;
  padding: 6px 0;
  text-align: left;
`;

const SuggestionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #1e293b;
  transition: all 0.2s ease;
  background: ${props => props.$isHotSearch ? 'linear-gradient(135deg, rgba(26, 98, 255, 0.06), rgba(26, 98, 255, 0.01))' : 'transparent'};
  border-left: 3px solid ${props => props.$isHotSearch ? '#1a62ff' : 'transparent'};
  
  &:hover {
    background: ${props => props.$isHotSearch ? 'linear-gradient(135deg, rgba(26, 98, 255, 0.1), rgba(26, 98, 255, 0.02))' : '#f8fafc'};
  }
  
  .label-text {
    font-weight: ${props => props.$isHotSearch ? '600' : 'normal'};
    color: ${props => props.$isHotSearch ? '#1a62ff' : 'inherit'};
  }
  
  .hot-badge {
    background: rgba(26, 98, 255, 0.1);
    color: #1a62ff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 9999px;
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
`;

const SearchBtn = styled.button`
  padding: 12px 24px;
  background: #fff;
  color: #1a62ff;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  &:hover { background: #f0f4ff; }
`;

const StatsRow = styled.div`
  display: flex;
  gap: 32px;
  margin-top: 20px;
  position: relative; z-index: 1;
  justify-content: center;
`;

const Stat = styled.div`
  color: rgba(255,255,255,0.85);
  .n { font-size: 1.3rem; font-weight: 800; display: block; }
  .l { font-size: 0.78rem; opacity: 0.7; }
`;

/* ─── Content ─── */
const Content = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px 80px;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const Sidebar = styled.div`
  @media (max-width: 768px) { display: none; }
`;

const FilterCard = styled.div`
  background: ${p => p.$isDark ? 'rgba(30,41,59,0.8)' : '#fff'};
  border: 1.5px solid ${p => p.$isDark ? 'rgba(75,85,99,0.3)' : '#e2e8f0'};
  border-radius: 14px;
  overflow: hidden;
  position: sticky;
  top: 80px;
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.3)' : '#f1f5f9'};
  span {
    font-size: 0.82rem;
    font-weight: 700;
    color: ${p => p.$isDark ? '#94a3b8' : '#64748b'};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 700;
    color: #ef4444;
    padding: 2px 6px;
    border-radius: 4px;
    &:hover { background: #fef2f2; }
  }
`;

const FilterSection = styled.div`
  border-bottom: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.2)' : '#f1f5f9'};
  &:last-child { border-bottom: none; }
`;

const FilterSectionHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${p => p.$isDark ? '#cbd5e1' : '#374151'};
  transition: background 0.15s;
  &:hover { background: ${p => p.$isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'}; }
  svg { opacity: 0.5; transition: transform 0.2s; transform: rotate(${p => p.$open ? '180deg' : '0deg'}); }
`;

const FilterBody = styled.div`
  padding: ${p => p.$open ? '4px 16px 10px' : '0'};
  max-height: ${p => p.$open ? '300px' : '0'};
  overflow: hidden;
  transition: max-height 0.2s ease, padding 0.2s ease;
`;

const FilterTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${p => p.$isDark ? '#94a3b8' : '#64748b'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

const FilterOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.83rem;
  color: ${p => p.$isDark ? '#cbd5e1' : '#475569'};
  cursor: pointer;
  padding: 3px 0;
  input { accent-color: #1a62ff; flex-shrink: 0; }
  &:hover { color: #1a62ff; }
`;

const RegisterCard = styled.div`
  background: ${p => p.$isDark ? 'rgba(30,41,59,0.8)' : '#fff'};
  border: 1.5px solid ${p => p.$isDark ? 'rgba(75,85,99,0.3)' : '#e2e8f0'};
  border-radius: 14px;
  padding: 16px;
  margin-top: 12px;
  text-align: center;
`;

/* ─── Job List ─── */
const JobList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const JobCard = styled.div`
  background: ${p => p.$quickBoosted ? (p.$isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : (p.$isDark ? 'rgba(30,41,59,0.8)' : '#fff')};
  border: ${p => p.$quickBoosted ? '2px solid #10b981' : (p.$isDark ? '1.5px solid rgba(75,85,99,0.3)' : '1.5px solid #e2e8f0')};
  border-radius: 14px;
  padding: 20px 22px;
  text-decoration: none;
  color: inherit;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  animation: ${fadeUp} 0.35s ease both;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  cursor: pointer;
  box-shadow: ${p => p.$quickBoosted ? '0 4px 20px rgba(16,185,129,0.15)' : 'none'};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(135deg, #10b981, #059669);
    opacity: ${p => p.$quickBoosted ? 1 : 0};
    transition: opacity 0.3s ease;
    border-radius: 14px 0 0 14px;
  }
  
  &:hover {
    border-color: ${p => p.$quickBoosted ? '#059669' : '#1a62ff'};
    box-shadow: ${p => p.$quickBoosted ? '0 12px 40px rgba(16,185,129,0.25)' : '0 6px 24px rgba(26,98,255,0.1)'};
    transform: translateY(-1px);
    
    &::before {
      opacity: 1;
    }
  }
`;

const LogoBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e0eaff, #c7d9ff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; }
`;

const JobInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const JobTitle = styled.div`
  font-size: 0.97rem;
  font-weight: 700;
  color: ${p => p.$isUrgent ? (p.$isDark ? '#e2e8f0' : '#1e293b') : '#1a62ff'};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Company = styled.div`
  font-size: 0.85rem;
  color: ${p => p.$isUrgent ? '#1a62ff' : (p.$isDark ? '#e2e8f0' : '#1e293b')};
  font-weight: 700;
  margin-bottom: 8px;
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Tag = styled.span`
  background: ${p => p.$isUrgent ? (p.$isDark ? 'rgba(26,98,255,0.15)' : '#f0f4ff') : 'transparent'};
  color: ${p => p.$isUrgent ? (p.$isDark ? '#93c5fd' : '#1a62ff') : (p.$isDark ? '#e2e8f0' : '#1e293b')};
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 0.78rem;
  font-weight: 700;
`;

const UrgentTag = styled(Tag)`
  background: #fef3c7;
  color: #92400e;
`;

const JobRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
`;

const Salary = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${p => p.$isDark ? '#e2e8f0' : '#1e293b'};
`;

const PostDate = styled.div`
  font-size: 0.78rem;
  color: ${p => p.$isDark ? '#64748b' : '#94a3b8'};
`;

const pulseBlink = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.97);
  }
`;

const ApplyBtn = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #1a62ff;

  ${props => props.$isHotSearch && css`
    animation: ${pulseBlink} 1.5s infinite ease-in-out;
  `}
`;

/* ─── Modal ─── */
const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalBox = styled(motion.div)`
  background: ${p => p.$isDark ? '#1e293b' : '#fff'};
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0,0,0,0.25);
  position: relative;
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, #1a62ff 0%, #002e9d 100%);
  padding: 28px 28px 24px;
  border-radius: 20px 20px 0 0;
  position: relative;
`;

const ModalClose = styled.button`
  position: absolute;
  top: 16px; right: 16px;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 8px;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #fff;
  &:hover { background: rgba(255,255,255,0.3); }
`;

const ModalTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 6px;
`;

const ModalCompany = styled.div`
  font-size: 0.95rem;
  color: rgba(255,255,255,0.85);
  font-weight: 600;
`;

const ModalBody = styled.div`
  padding: 24px 28px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: ${p => p.$isDark ? '#cbd5e1' : '#475569'};
  background: ${p => p.$isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc'};
  border-radius: 10px;
  padding: 10px 14px;
  svg { color: #1a62ff; flex-shrink: 0; }
  span { font-weight: 600; }
`;

const Section = styled.div`
  margin-bottom: 20px;
  h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: ${p => p.$isDark ? '#e2e8f0' : '#1e293b'};
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  p, div {
    font-size: 0.88rem;
    color: ${p => p.$isDark ? '#94a3b8' : '#64748b'};
    line-height: 1.7;
    white-space: pre-wrap;
  }
`;

const ModalFooter = styled.div`
  padding: 16px 28px 24px;
  display: flex;
  gap: 12px;
  border-top: 1px solid ${p => p.$isDark ? 'rgba(75,85,99,0.3)' : '#f1f5f9'};
`;

const ApplyNowBtn = styled(Link)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #1a62ff, #002e9d);
  color: #fff;
  border-radius: 12px;
  padding: 14px;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
`;

const LoginPrompt = styled.div`
  font-size: 0.82rem;
  color: ${p => p.$isDark ? '#64748b' : '#94a3b8'};
  text-align: center;
  margin-top: 8px;
  a { color: #1a62ff; font-weight: 600; text-decoration: none; }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${p => p.$isDark ? '#64748b' : '#94a3b8'};
  svg { margin-bottom: 12px; opacity: 0.4; }
`;

const SkeletonCard = styled.div`
  border-radius: 14px;
  height: 100px;
  background: linear-gradient(90deg,
    ${p => p.$isDark ? '#1e293b' : '#f1f5f9'} 25%,
    ${p => p.$isDark ? '#334155' : '#e2e8f0'} 50%,
    ${p => p.$isDark ? '#1e293b' : '#f1f5f9'} 75%
  );
  background-size: 800px 100%;
  @keyframes shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  animation: shimmer 1.5s infinite;
`;

const ResultCount = styled.div`
  font-size: 0.88rem;
  color: ${p => p.$isDark ? '#94a3b8' : '#64748b'};
  margin-bottom: 16px;
  font-weight: 500;
`;

const TabBar = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 2px solid ${p => p.$isDark ? 'rgba(75,85,99,0.3)' : '#e2e8f0'};
`;

const TabBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2.5px solid ${p => p.$active ? '#1a62ff' : 'transparent'};
  margin-bottom: -2px;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${p => p.$active ? '#1a62ff' : (p.$isDark ? '#94a3b8' : '#64748b')};
  cursor: pointer;
  transition: all 0.2s;
  &:hover { color: #1a62ff; }
  svg { width: 15px; height: 15px; }
`;

const SaveBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  color: ${p => p.$saved ? '#f59e0b' : (p.$isDark ? '#64748b' : '#94a3b8')};
  transition: all 0.2s;
  &:hover { color: #f59e0b; transform: scale(1.1); }
  svg {
    width: 18px; height: 18px;
    fill: ${p => p.$saved ? '#f59e0b' : 'none'};
  }
`;

/* ─── Component ─── */
const PublicJobListing = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initKeyword = location.state?.searchKeyword || '';
  const initLocation = location.state?.searchLocation || '';

  const [keyword, setKeyword] = useState(initKeyword);
  const [loc, setLoc] = useState(initLocation);
  const [jobs, setJobs] = useState([]);
  const [hotSearchEmployerIds, setHotSearchEmployerIds] = useState(new Set());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);
  const [employerLogos, setEmployerLogos] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'saved' ? 'saved' : 'all';
  });
  const [savedJobIds, setSavedJobIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('public_saved_jobs') || '[]'); } catch { return []; }
  });

  // Extended filter states
  const [selectedSalaryRanges, setSelectedSalaryRanges] = useState([]);
  const [selectedWorkTimes, setSelectedWorkTimes] = useState([]);
  const [selectedPostTimes, setSelectedPostTimes] = useState([]);


  // Collapsible filter sections
  const [openSections, setOpenSections] = useState({ workTime: true, postTime: true, salary: true });
  const toggleSection = (key) => setOpenSections(p => ({ ...p, [key]: !p[key] }));

  const toggleSalaryRange = (range) => {
    setSelectedSalaryRanges(prev =>
      prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    );
  };

  const toggleWorkTime = (time) => {
    setSelectedWorkTimes(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]);
  };

  const togglePostTime = (time) => {
    setSelectedPostTimes(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]);
  };




  // Sync tab với URL param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setActiveTab(params.get('tab') === 'saved' ? 'saved' : 'all');
  }, [location.search]);

  // If authenticated candidate, sync savedJobs from profile
  useEffect(() => {
    if (isAuthenticated && user?.role === 'candidate') {
      candidateProfileService.getMyProfile().then(profile => {
        if (profile && Array.isArray(profile.savedJobs)) {
          setSavedJobIds(profile.savedJobs);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, user?.role]);

  const handleToggleSave = async (e, job) => {
    e.stopPropagation();
    const id = job.idJob || job.jobID;
    if (!id) return;

    const isSaved = savedJobIds.includes(id);
    const next = isSaved ? savedJobIds.filter(x => x !== id) : [...savedJobIds, id];
    setSavedJobIds(next);

    if (isAuthenticated && user?.role === 'candidate') {
      try {
        await candidateProfileService.toggleSavedJob(id);
      } catch (_) {
        setSavedJobIds(savedJobIds); // rollback
      }
    } else {
      localStorage.setItem('public_saved_jobs', JSON.stringify(next));
    }
  };

  useEffect(() => {
    Promise.all([
      jobPostService.getAllActiveJobs().catch(() => []),
      quickJobService.getAllActiveQuickJobs ? quickJobService.getAllActiveQuickJobs().catch(() => []) : Promise.resolve([]),
      adminEmployerService.getAllEmployers().catch(() => [])
    ]).then(([standard, urgent, employers]) => {
      // Create a map of employer IDs to their logos
      const logoMap = (Array.isArray(employers) ? employers : []).reduce((acc, emp) => {
        if (emp.userId && emp.companyLogo) acc[emp.userId] = emp.companyLogo;
        return acc;
      }, {});
      setEmployerLogos(logoMap);

      const s = (Array.isArray(standard) ? standard : []).map(j => ({ ...j, _type: 'standard', companyLogo: logoMap[j.employerId] || null }));
      const u = (Array.isArray(urgent) ? urgent : []).map(j => ({ ...j, _type: 'urgent', companyLogo: logoMap[j.employerId] || null }));
      setJobs([...s, ...u].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
    }).finally(() => setLoading(false));
  }, []);

  // Load subscriptions to identify employers with active Hot Search package
  useEffect(() => {
    const loadHotSearchSubscriptions = async () => {
      try {
        const API_ENDPOINT = import.meta.env.VITE_PACKAGE_SUBSCRIPTIONS_API;
        if (!API_ENDPOINT) return;
        const response = await fetch(`${API_ENDPOINT}/subscriptions`);
        if (response.ok) {
          const data = await response.json();
          // Filter active and approved Hot Search packages
          const activeHotSearchEmployerIds = new Set(
            data
              .filter(sub => 
                sub.packageName === 'Hot Search' && 
                sub.status === 'active' && 
                sub.approvalStatus === 'approved'
              )
              .map(sub => sub.employerId)
          );
          setHotSearchEmployerIds(activeHotSearchEmployerIds);
          console.log('✅ Active Hot Search Employer IDs:', Array.from(activeHotSearchEmployerIds));
        }
      } catch (err) {
        console.error('Error loading hot search subscriptions:', err);
      }
    };

    loadHotSearchSubscriptions();
  }, []);

  // Click outside search input suggestion box handler
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // ── Helper: parse salary to a numeric value (thousands VND) ──
  const getSalaryValue = (jobOrSalary) => {
    const job = typeof jobOrSalary === 'object' && jobOrSalary !== null ? jobOrSalary : null;
    if (job && Number(job.hourlyRate) > 0) return Number(job.hourlyRate) / 1000;
    const salaryText = job ? (job.salary || '') : String(jobOrSalary || '');
    const numeric = parseInt(String(salaryText).replace(/[^\d]/g, ''), 10);
    if (!numeric) return 0;
    return numeric >= 1000 ? numeric / 1000 : numeric;
  };

  const isInSalaryRange = (job, range) => {
    const value = getSalaryValue(job);
    switch (range) {
      case '25k-30k': return value >= 25 && value < 30;
      case '30k-35k': return value >= 30 && value <= 35;
      case 'over-35k': return value > 35;
      default: return true;
    }
  };



  const matchesWorkTime = (job, selectedTimes) => {
    if (selectedTimes.length === 0) return true;
    
    let haystack = '';
    const parseHour = (value) => {
      const match = String(value || '').match(/(\d{1,2})/);
      return match ? parseInt(match[1], 10) : null;
    };
    
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

  const hasActiveFilters = selectedSalaryRanges.length > 0 || selectedWorkTimes.length > 0 || selectedPostTimes.length > 0;

  const clearAllFilters = () => {
    setSelectedSalaryRanges([]);
    setSelectedWorkTimes([]);
    setSelectedPostTimes([]);

  };

  // Compute search suggestions
  const suggestions = useMemo(() => {
    if (!keyword.trim()) return [];
    
    const kw = keyword.toLowerCase().trim();
    const matches = [];
    const seenLabels = new Set();
    
    jobs.forEach(job => {
      const isHot = hotSearchEmployerIds.has(job.employerId);
      
      // Check company name
      const companyName = job.company || '';
      if (companyName.toLowerCase().includes(kw)) {
        const label = companyName;
        const key = `company-${label}`;
        if (!seenLabels.has(key)) {
          seenLabels.add(key);
          matches.push({
            label: label,
            type: 'company',
            isHotSearch: isHot
          });
        }
      }
      
      // Check job title
      const jobTitle = job.title || '';
      if (jobTitle.toLowerCase().includes(kw)) {
        const label = jobTitle;
        const key = `title-${label}`;
        if (!seenLabels.has(key)) {
          seenLabels.add(key);
          matches.push({
            label: label,
            type: 'title',
            isHotSearch: isHot
          });
        }
      }
    });
    
    // Sort suggestions: Hot Search suggestions first!
    return matches.sort((a, b) => {
      if (a.isHotSearch && !b.isHotSearch) return -1;
      if (!a.isHotSearch && b.isHotSearch) return 1;
      return a.label.localeCompare(b.label);
    }).slice(0, 8);
  }, [keyword, jobs, hotSearchEmployerIds]);

  const filtered = useMemo(() => {
    const kw = keyword.toLowerCase();
    const lc = loc.toLowerCase();
    let result = jobs.filter(j => {
      const matchKw = !kw || (j.title || '').toLowerCase().includes(kw) || (j.companyName || j.employerName || '').toLowerCase().includes(kw);
      const matchLoc = !lc || (j.location || '').toLowerCase().includes(lc);
      const matchSal = selectedSalaryRanges.length === 0 || selectedSalaryRanges.some(r => isInSalaryRange(j, r));
      const matchTime = matchesWorkTime(j, selectedWorkTimes);
      const matchPostTime = (() => {
        if (selectedPostTimes.length === 0) return true;
        const maxHours = Math.max(...selectedPostTimes.map(t => t === '3d' ? 72 : t === '1w' ? 168 : t === '2w' ? 336 : 999999));
        const hoursAgo = j.createdAt ? (Date.now() - new Date(j.createdAt).getTime()) / (1000 * 60 * 60) : 999999;
        return hoursAgo <= maxHours;
      })();
      return matchKw && matchLoc && matchSal && matchTime && matchPostTime;
    });
    if (activeTab === 'saved') {
      result = result.filter(j => savedJobIds.includes(j.idJob || j.jobID));
    }
    
    // Sort Hot Search first, then quickBoost, then by date!
    return [...result].sort((a, b) => {
      const aHotSearch = hotSearchEmployerIds.has(a.employerId);
      const bHotSearch = hotSearchEmployerIds.has(b.employerId);
      if (aHotSearch && !bHotSearch) return -1;
      if (!aHotSearch && bHotSearch) return 1;

      const aBoost = !!a.quickBoost;
      const bBoost = !!b.quickBoost;
      if (aBoost && !bBoost) return -1;
      if (!aBoost && bBoost) return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [jobs, keyword, loc, selectedSalaryRanges, selectedWorkTimes, selectedPostTimes, activeTab, savedJobIds, hotSearchEmployerIds]);

  const handleSearch = () => {
    // just re-filter, state already updated
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const diff = Math.floor((Date.now() - date) / 86400000);
    if (diff === 0) return language === 'vi' ? 'Hôm nay' : 'Today';
    if (diff === 1) return language === 'vi' ? 'Hôm qua' : 'Yesterday';
    if (diff < 7) return language === 'vi' ? `${diff} ngày trước` : `${diff} days ago`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <PageWrapper>
      <Hero>
        <HeroBackground />
        <HeroTitle>
          {language === 'vi' ? 'Tìm Việc Làm Phù Hợp' : 'Find Your Perfect Job'}
        </HeroTitle>
        <SearchRow>
          <SearchBox ref={searchInputRef}>
            <Search size={18} />
            <input
              placeholder={language === 'vi' ? 'Vị trí, công ty...' : 'Job title, company...'}
              value={keyword}
              onChange={e => {
                setKeyword(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setShowSuggestions(false);
                  handleSearch();
                }
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <SuggestionDropdown>
                {suggestions.map((s, idx) => (
                  <SuggestionItem
                    key={idx}
                    $isHotSearch={s.isHotSearch}
                    onClick={() => {
                      setKeyword(s.label);
                      setShowSuggestions(false);
                      handleSearch();
                    }}
                  >
                    {s.type === 'company' ? <Building2 size={16} /> : <Briefcase size={16} />}
                    <span className="label-text">{s.label}</span>
                    {s.isHotSearch && (
                      <span className="hot-badge">
                        <Sparkles size={10} style={{ color: '#1a62ff', width: 10, height: 10 }} />
                        Hot
                      </span>
                    )}
                  </SuggestionItem>
                ))}
              </SuggestionDropdown>
            )}
          </SearchBox>
          <SearchBox style={{ flex: '0 0 200px' }}>
            <MapPin size={18} />
            <input
              placeholder={language === 'vi' ? 'Địa điểm' : 'Location'}
              value={loc}
              onChange={e => setLoc(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </SearchBox>
          <SearchBtn onClick={handleSearch}>
            <Search size={16} />
            {language === 'vi' ? 'Tìm' : 'Search'}
          </SearchBtn>
        </SearchRow>
        {!loading && (
          <StatsRow>
            <Stat>
              <span className="n">{jobs.length}</span>
              <span className="l">{language === 'vi' ? 'Việc làm' : 'Jobs'}</span>
            </Stat>
            <Stat>
              <span className="n">{jobs.filter(j => j._type === 'urgent').length}</span>
              <span className="l">{language === 'vi' ? 'Tuyển gấp' : 'Urgent'}</span>
            </Stat>
          </StatsRow>
        )}
      </Hero>

      <Content>
        {/* Sidebar */}
        <Sidebar>
          <FilterCard $isDark={isDarkMode}>
            <FilterHeader $isDark={isDarkMode}>
              <span><Filter size={12} />{language === 'vi' ? 'Bộ lọc' : 'Filters'}</span>
              {hasActiveFilters && (
                <button onClick={clearAllFilters}>{language === 'vi' ? 'Xóa' : 'Clear'}</button>
              )}
            </FilterHeader>

            {/* Work Time filter */}
            <FilterSection $isDark={isDarkMode}>
              <FilterSectionHeader $isDark={isDarkMode} $open={openSections.workTime} onClick={() => toggleSection('workTime')}>
                {language === 'vi' ? 'Thời gian làm việc' : 'Work Time'}
                <ChevronDown size={14} />
              </FilterSectionHeader>
              <FilterBody $open={openSections.workTime}>
                {[
                  { val: 'morning', label: language === 'vi' ? 'Buổi sáng (trước 12:00)' : 'Morning (< 12:00)' },
                  { val: 'afternoon', label: language === 'vi' ? 'Buổi chiều (12:00 – 18:00)' : 'Afternoon (12:00 - 18:00)' },
                  { val: 'evening', label: language === 'vi' ? 'Buổi tối (sau 18:00)' : 'Evening (> 18:00)' },
                  { val: 'weekend', label: language === 'vi' ? 'Cuối tuần (T7 & CN)' : 'Weekend (Sat & Sun)' },
                ].map(opt => (
                  <FilterOption key={opt.val} $isDark={isDarkMode}>
                    <input type="checkbox" 
                      checked={selectedWorkTimes.includes(opt.val)} 
                      onChange={() => toggleWorkTime(opt.val)} 
                    />
                    {opt.label}
                  </FilterOption>
                ))}
              </FilterBody>
            </FilterSection>

            {/* Post Time filter */}
            <FilterSection $isDark={isDarkMode}>
              <FilterSectionHeader $isDark={isDarkMode} $open={openSections.postTime} onClick={() => toggleSection('postTime')}>
                {language === 'vi' ? 'Mới đăng' : 'Date Posted'}
                <ChevronDown size={14} />
              </FilterSectionHeader>
              <FilterBody $open={openSections.postTime}>
                {[
                  { val: '3d', label: language === 'vi' ? 'Trong 3 ngày' : 'Within 3 days' },
                  { val: '1w', label: language === 'vi' ? 'Trong 1 tuần' : 'Within 1 week' },
                  { val: '2w', label: language === 'vi' ? 'Trong 2 tuần' : 'Within 2 weeks' }
                ].map(opt => (
                  <FilterOption key={opt.val} $isDark={isDarkMode}>
                    <input type="checkbox" 
                      checked={selectedPostTimes.includes(opt.val)} 
                      onChange={() => togglePostTime(opt.val)} 
                    />
                    {opt.label}
                  </FilterOption>
                ))}
              </FilterBody>
            </FilterSection>

            {/* Salary filter - matching logged in part-time hourly ranges */}
            <FilterSection $isDark={isDarkMode}>
              <FilterSectionHeader $isDark={isDarkMode} $open={openSections.salary} onClick={() => toggleSection('salary')}>
                {language === 'vi' ? 'Thu nhập/giờ' : 'Hourly Rate'}
                <ChevronDown size={14} />
              </FilterSectionHeader>
              <FilterBody $open={openSections.salary}>
                {[
                  { val: '25k-30k', label: language === 'vi' ? '25.000 – 30.000đ/giờ' : '25k – 30k/hr' },
                  { val: '30k-35k', label: language === 'vi' ? '30.000 – 35.000đ/giờ' : '30k – 35k/hr' },
                  { val: 'over-35k', label: language === 'vi' ? 'Trên 35.000đ/giờ' : 'Over 35k/hr' },
                ].map(opt => (
                  <FilterOption key={opt.val} $isDark={isDarkMode}>
                    <input type="checkbox" 
                      checked={selectedSalaryRanges.includes(opt.val)} 
                      onChange={() => toggleSalaryRange(opt.val)} 
                    />
                    {opt.label}
                  </FilterOption>
                ))}
              </FilterBody>
            </FilterSection>

          </FilterCard>

          <RegisterCard $isDark={isDarkMode}>
            <div style={{ fontSize: '0.82rem', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: 10 }}>
              {language === 'vi' ? 'Muốn ứng tuyển?' : 'Want to apply?'}
            </div>
            <Link
              to="/register/candidate"
              style={{
                display: 'block',
                background: '#1a62ff',
                color: '#fff',
                borderRadius: 8,
                padding: '9px 14px',
                fontWeight: 700,
                fontSize: '0.83rem',
                textDecoration: 'none',
              }}
            >
              {language === 'vi' ? 'Đăng ký ứng viên' : 'Register as Candidate'}
            </Link>
          </RegisterCard>
        </Sidebar>

        {/* Job List */}
        <div>
          {/* Tabs */}
          <TabBar $isDark={isDarkMode}>
            <TabBtn
              $active={activeTab === 'all'}
              $isDark={isDarkMode}
              onClick={() => navigate('/jobs', { replace: true })}
            >
              <Briefcase />
              {language === 'vi' ? 'Tất cả việc làm' : 'All Jobs'}
              <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>({jobs.length})</span>
            </TabBtn>
            <TabBtn
              $active={activeTab === 'saved'}
              $isDark={isDarkMode}
              onClick={() => navigate('/jobs?tab=saved', { replace: true })}
            >
              <Bookmark />
              {language === 'vi' ? 'Đã lưu' : 'Saved'}
              <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>({savedJobIds.length})</span>
            </TabBtn>
          </TabBar>

          {!loading && (
            <ResultCount $isDark={isDarkMode}>
              {language === 'vi'
                ? `Tìm thấy ${filtered.length} việc làm${keyword ? ` cho "${keyword}"` : ''}`
                : `Found ${filtered.length} jobs${keyword ? ` for "${keyword}"` : ''}`}
            </ResultCount>
          )}

          <JobList>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} $isDark={isDarkMode} />)
            ) : filtered.length === 0 ? (
              <EmptyState $isDark={isDarkMode}>
                {activeTab === 'saved' ? (
                  <>
                    <Bookmark size={40} />
                    <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>
                      {language === 'vi' ? 'Chưa có việc làm nào được lưu' : "You haven't saved any jobs yet"}
                    </p>
                    <p style={{ fontSize: '0.85rem' }}>
                      {language === 'vi' ? 'Nhấn icon 🔖 trên tin tuyển dụng để lưu lại' : 'Click the bookmark icon on a job to save it'}
                    </p>
                  </>
                ) : (
                  <>
                    <Briefcase size={40} />
                    <p>{language === 'vi' ? 'Không tìm thấy việc làm phù hợp' : 'No jobs found'}</p>
                  </>
                )}
              </EmptyState>
            ) : (
              filtered.map((job, i) => (
                <JobCard
                  key={job.idJob || job.jobID || i}
                  $isDark={isDarkMode}
                  $quickBoosted={job.quickBoost}
                  style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
                  onClick={() => setSelectedJob(job)}
                >
                  <LogoBox style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a62ff' }}>
                    {job.companyLogo
                      ? <img src={job.companyLogo} alt={job.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (job.companyName || job.employerName || 'C').charAt(0).toUpperCase()
                    }
                  </LogoBox>
                  <JobInfo>
                    <JobTitle $isDark={isDarkMode} $isUrgent={job._type === 'urgent' || job.quickBoost} style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{job.title}</span>
                      {job.isAiScreeningEnabled && (
                        <span style={{
                          background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                          color: '#6d28d9',
                          border: '1px solid #c084fc',
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          flexShrink: 0
                        }}>
                          <Sparkles size={10} style={{ color: '#7c3aed' }} />
                          {language === 'vi' ? 'Phỏng vấn AI' : 'AI Interview'}
                        </span>
                      )}
                    </JobTitle>
                    <Company $isDark={isDarkMode} $isUrgent={job._type === 'urgent' || job.quickBoost}>{job.companyName || job.employerName || 'Công ty'}</Company>
                    <Tags>
                      {(job._type === 'urgent' || job.quickBoost) && (
                        <UrgentTag><Zap size={10} style={{ display: 'inline' }} /> {language === 'vi' ? 'Tuyển gấp' : 'Urgent'}</UrgentTag>
                      )}
                      {job.location && <Tag $isDark={isDarkMode} $isUrgent={job._type === 'urgent' || job.quickBoost}><MapPin size={10} style={{ display: 'inline' }} /> {job.location}</Tag>}
                      {job.workHours && <Tag $isDark={isDarkMode} $isUrgent={job._type === 'urgent' || job.quickBoost}><Clock size={10} style={{ display: 'inline' }} /> {job.workHours}</Tag>}
                      {job.jobType && <Tag $isDark={isDarkMode} $isUrgent={job._type === 'urgent' || job.quickBoost}>{job.jobType}</Tag>}
                    </Tags>
                  </JobInfo>
                  <JobRight>
                    <SaveBtn
                      $saved={savedJobIds.includes(job.idJob || job.jobID)}
                      $isDark={isDarkMode}
                      onClick={e => handleToggleSave(e, job)}
                      title={language === 'vi' ? 'Lưu việc làm' : 'Save job'}
                    >
                      <Bookmark />
                    </SaveBtn>
                    <PostDate $isDark={isDarkMode}>{formatDate(job.createdAt)}</PostDate>
                    <ApplyBtn $isHotSearch={hotSearchEmployerIds.has(job.employerId)}>
                      {language === 'vi' ? 'Xem & Ứng tuyển' : 'View & Apply'}
                      <ChevronRight size={14} />
                    </ApplyBtn>
                  </JobRight>
                </JobCard>
              ))
            )}
          </JobList>
        </div>
      </Content>

      {/* Job Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedJob(null)}
          >
            <ModalBox
              $isDark={isDarkMode}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalClose onClick={() => setSelectedJob(null)}><X size={16} /></ModalClose>
                <ModalTitle>{selectedJob.title}</ModalTitle>
                <ModalCompany>{selectedJob.companyName || selectedJob.employerName || 'Công ty'}</ModalCompany>
              </ModalHeader>

              <ModalBody>
                <InfoGrid>
                  {selectedJob.location && (
                    <InfoItem $isDark={isDarkMode}><MapPin size={15} /><span>{selectedJob.location}</span></InfoItem>
                  )}
                  {selectedJob.salary && (
                    <InfoItem $isDark={isDarkMode}><DollarSign size={15} /><span>{typeof selectedJob.salary === 'number' ? selectedJob.salary.toLocaleString('vi-VN') + ' VNĐ' : selectedJob.salary}</span></InfoItem>
                  )}
                  {selectedJob.workHours && (
                    <InfoItem $isDark={isDarkMode}><Clock size={15} /><span>{selectedJob.workHours}</span></InfoItem>
                  )}
                  {selectedJob.workDays && (
                    <InfoItem $isDark={isDarkMode}><Calendar size={15} /><span>{selectedJob.workDays}</span></InfoItem>
                  )}
                  {selectedJob.jobType && (
                    <InfoItem $isDark={isDarkMode}><Briefcase size={15} /><span>{selectedJob.jobType}</span></InfoItem>
                  )}
                  {selectedJob._type === 'urgent' && (
                    <InfoItem $isDark={isDarkMode}><Zap size={15} /><span style={{ color: '#f59e0b' }}>{language === 'vi' ? 'Tuyển gấp' : 'Urgent Hiring'}</span></InfoItem>
                  )}
                </InfoGrid>

                {selectedJob.description && (
                  <Section $isDark={isDarkMode}>
                    <h3><FileText size={15} />{language === 'vi' ? 'Mô tả công việc' : 'Job Description'}</h3>
                    <div>{selectedJob.description}</div>
                  </Section>
                )}
                {selectedJob.requirements && (
                  <Section $isDark={isDarkMode}>
                    <h3><Users size={15} />{language === 'vi' ? 'Yêu cầu' : 'Requirements'}</h3>
                    <div>{selectedJob.requirements}</div>
                  </Section>
                )}
                {selectedJob.benefits && (
                  <Section $isDark={isDarkMode}>
                    <h3><Globe size={15} />{language === 'vi' ? 'Quyền lợi' : 'Benefits'}</h3>
                    <div>{selectedJob.benefits}</div>
                  </Section>
                )}
                {Array.isArray(selectedJob.customFields) && selectedJob.customFields
                  .filter(f => f && (f.label || f.value))
                  .map((field, idx) => (
                    <Section key={idx} $isDark={isDarkMode}>
                      <h3><FileText size={15} />{field.label}</h3>
                      <div>{field.value}</div>
                    </Section>
                  ))}
              </ModalBody>

              {selectedJob.isAiScreeningEnabled && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: '#f5f3ff',
                  border: '1px dashed #7c3aed',
                  borderRadius: '12px',
                  color: '#6d28d9',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  textAlign: 'left',
                  width: 'calc(100% - 56px)',
                  boxSizing: 'border-box',
                  margin: '0 28px 16px',
                }}>
                  <Sparkles size={16} style={{ flexShrink: 0 }} />
                  <span>
                    {language === 'vi' 
                      ? 'Lưu ý: Công việc này yêu cầu Phỏng vấn chọn lọc qua AI sau khi gửi CV.'
                      : 'Note: This job requires an AI screening interview after sending CV.'}
                  </span>
                </div>
              )}

              <ModalFooter $isDark={isDarkMode}>
                <ApplyNowBtn to={`/login?redirect=/candidate/jobs&role=candidate`}>
                  <LogIn size={18} />
                  {language === 'vi' ? 'Đăng nhập để ứng tuyển' : 'Login to Apply'}
                </ApplyNowBtn>
              </ModalFooter>
              <LoginPrompt $isDark={isDarkMode}>
                {language === 'vi' ? 'Chưa có tài khoản?' : "Don't have an account?"}{' '}
                <Link to="/register/candidate">{language === 'vi' ? 'Đăng ký miễn phí' : 'Register free'}</Link>
              </LoginPrompt>
            </ModalBox>
          </Overlay>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default PublicJobListing;
