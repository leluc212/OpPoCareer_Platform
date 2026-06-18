import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
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
  overflow: hidden;
  text-align: center;
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
  background: ${p => p.$isDark ? 'rgba(30,41,59,0.8)' : '#fff'};
  border: 1.5px solid ${p => p.$isDark ? 'rgba(75,85,99,0.3)' : '#e2e8f0'};
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
  &:hover {
    border-color: #1a62ff;
    box-shadow: 0 6px 24px rgba(26,98,255,0.1);
    transform: translateY(-1px);
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
  color: ${p => p.$isDark ? '#e2e8f0' : '#1e293b'};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Company = styled.div`
  font-size: 0.85rem;
  color: #1a62ff;
  font-weight: 600;
  margin-bottom: 8px;
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Tag = styled.span`
  background: ${p => p.$isDark ? 'rgba(26,98,255,0.15)' : '#f0f4ff'};
  color: ${p => p.$isDark ? '#93c5fd' : '#1a62ff'};
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 0.78rem;
  font-weight: 600;
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

const ApplyBtn = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #1a62ff;
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
  const [loading, setLoading] = useState(true);
  const [jobType, setJobType] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'saved' ? 'saved' : 'all';
  });
  const [savedJobIds, setSavedJobIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('public_saved_jobs') || '[]'); } catch { return []; }
  });

  // Extended filter states
  const [selectedSalary, setSelectedSalary] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [selectedLocations, setSelectedLocations] = useState([]);

  // Collapsible filter sections
  const [openSections, setOpenSections] = useState({ type: true, salary: false, date: false, location: false });
  const toggleSection = (key) => setOpenSections(p => ({ ...p, [key]: !p[key] }));

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
      quickJobService.getAllActiveQuickJobs ? quickJobService.getAllActiveQuickJobs().catch(() => []) : Promise.resolve([])
    ]).then(([standard, urgent]) => {
      const s = (Array.isArray(standard) ? standard : []).map(j => ({ ...j, _type: 'standard' }));
      const u = (Array.isArray(urgent) ? urgent : []).map(j => ({ ...j, _type: 'urgent' }));
      setJobs([...s, ...u].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
    }).finally(() => setLoading(false));
  }, []);

  // ── Helper: parse salary to a numeric value (thousands VND) ──
  const parseSalary = (s) => {
    if (!s) return 0;
    const str = String(s).replace(/\./g, '').replace(/,/g, '');
    const nums = str.match(/\d+/g);
    if (!nums) return 0;
    return Math.max(...nums.map(Number));
  };

  const matchSalary = (job, range) => {
    if (!range) return true;
    const sal = String(job.salary || '').toLowerCase();
    if (range === 'negotiable') return sal.includes('thỏa thuận') || sal.includes('negotiable') || !job.salary;
    const v = parseSalary(job.salary);
    // Detect if salary is hourly (contains /giờ or /h) vs monthly
    const isHourly = sal.includes('giờ') || sal.includes('/h');
    // Normalize to monthly rough estimate for comparison
    const monthly = isHourly ? v * 8 * 26 : v; // 8h/day * 26 days
    switch (range) {
      case 'under-5m': return monthly > 0 && monthly < 5000000;
      case '5m-10m': return monthly >= 5000000 && monthly < 10000000;
      case '10m-20m': return monthly >= 10000000 && monthly <= 20000000;
      case 'over-20m': return monthly > 20000000;
      default: return true;
    }
  };

  const matchDate = (job, range) => {
    if (!range) return true;
    const d = job.createdAt;
    if (!d) return true;
    const diff = (Date.now() - new Date(d).getTime()) / 3600000; // hours
    switch (range) {
      case 'today': return diff <= 24;
      case '3days': return diff <= 72;
      case '7days': return diff <= 168;
      case '30days': return diff <= 720;
      default: return true;
    }
  };

  // Top cities extracted from jobs
  const topCities = useMemo(() => {
    const counts = {};
    jobs.forEach(j => {
      const city = (j.location || '').split(',').pop().trim();
      if (city) counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c, n]) => ({ city: c, count: n }));
  }, [jobs]);

  // Top companies from jobs
  const topCompanies = useMemo(() => {
    const counts = {};
    jobs.forEach(j => {
      const name = j.companyName || j.employerName;
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));
  }, [jobs]);

  const hasActiveFilters = jobType !== 'all' || selectedSalary || selectedDateRange || selectedLocations.length > 0;

  const clearAllFilters = () => {
    setJobType('all');
    setSelectedSalary('');
    setSelectedDateRange('');
    setSelectedLocations([]);
  };

  const toggleLocation = (city) => setSelectedLocations(prev =>
    prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
  );

  const filtered = useMemo(() => {
    const kw = keyword.toLowerCase();
    const lc = loc.toLowerCase();
    let result = jobs.filter(j => {
      const matchKw = !kw || (j.title || '').toLowerCase().includes(kw) || (j.companyName || j.employerName || '').toLowerCase().includes(kw);
      const matchLoc = !lc || (j.location || '').toLowerCase().includes(lc);
      const matchType = jobType === 'all' || j._type === jobType;
      const matchSal = matchSalary(j, selectedSalary);
      const matchDt = matchDate(j, selectedDateRange);
      const matchCo = true;
      const matchCity = selectedLocations.length === 0 || selectedLocations.some(city => (j.location || '').includes(city));
      return matchKw && matchLoc && matchType && matchSal && matchDt && matchCo && matchCity;
    });
    if (activeTab === 'saved') {
      result = result.filter(j => savedJobIds.includes(j.idJob || j.jobID));
    }
    return result;
  }, [jobs, keyword, loc, jobType, selectedSalary, selectedDateRange, selectedLocations, activeTab, savedJobIds]);

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
        <HeroTitle>
          {language === 'vi' ? 'Tìm Việc Làm Phù Hợp' : 'Find Your Perfect Job'}
        </HeroTitle>
        <SearchRow>
          <SearchBox>
            <Search size={18} />
            <input
              placeholder={language === 'vi' ? 'Vị trí, công ty...' : 'Job title, company...'}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
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

            {/* Job type */}
            <FilterSection $isDark={isDarkMode}>
              <FilterSectionHeader $isDark={isDarkMode} $open={openSections.type} onClick={() => toggleSection('type')}>
                {language === 'vi' ? 'Loại việc' : 'Job Type'}
                <ChevronDown size={14} />
              </FilterSectionHeader>
              <FilterBody $open={openSections.type}>
                {[
                  { val: 'all', label: language === 'vi' ? 'Tất cả' : 'All' },
                  { val: 'standard', label: language === 'vi' ? 'Tiêu chuẩn' : 'Standard' },
                  { val: 'urgent', label: language === 'vi' ? 'Tuyển gấp' : 'Urgent' },
                ].map(opt => (
                  <FilterOption key={opt.val} $isDark={isDarkMode}>
                    <input type="radio" name="jobType" checked={jobType === opt.val} onChange={() => setJobType(opt.val)} />
                    {opt.label}
                  </FilterOption>
                ))}
              </FilterBody>
            </FilterSection>

            {/* Salary */}
            <FilterSection $isDark={isDarkMode}>
              <FilterSectionHeader $isDark={isDarkMode} $open={openSections.salary} onClick={() => toggleSection('salary')}>
                {language === 'vi' ? 'Mức lương' : 'Salary'}
                <ChevronDown size={14} />
              </FilterSectionHeader>
              <FilterBody $open={openSections.salary}>
                {[
                  { val: '', label: language === 'vi' ? 'Tất cả' : 'All' },
                  { val: 'under-5m', label: language === 'vi' ? 'Dưới 5 triệu' : 'Under 5M' },
                  { val: '5m-10m', label: '5 – 10 triệu' },
                  { val: '10m-20m', label: '10 – 20 triệu' },
                  { val: 'over-20m', label: language === 'vi' ? 'Trên 20 triệu' : 'Over 20M' },
                  { val: 'negotiable', label: language === 'vi' ? 'Thỏa thuận' : 'Negotiable' },
                ].map(opt => (
                  <FilterOption key={opt.val || 'all-sal'} $isDark={isDarkMode}>
                    <input type="radio" name="salary" checked={selectedSalary === opt.val} onChange={() => setSelectedSalary(opt.val)} />
                    {opt.label}
                  </FilterOption>
                ))}
              </FilterBody>
            </FilterSection>

            {/* Date posted */}
            <FilterSection $isDark={isDarkMode}>
              <FilterSectionHeader $isDark={isDarkMode} $open={openSections.date} onClick={() => toggleSection('date')}>
                {language === 'vi' ? 'Ngày đăng' : 'Date Posted'}
                <ChevronDown size={14} />
              </FilterSectionHeader>
              <FilterBody $open={openSections.date}>
                {[
                  { val: '', label: language === 'vi' ? 'Tất cả' : 'All time' },
                  { val: 'today', label: language === 'vi' ? 'Hôm nay' : 'Today' },
                  { val: '3days', label: language === 'vi' ? '3 ngày qua' : 'Last 3 days' },
                  { val: '7days', label: language === 'vi' ? '7 ngày qua' : 'Last 7 days' },
                  { val: '30days', label: language === 'vi' ? '30 ngày qua' : 'Last 30 days' },
                ].map(opt => (
                  <FilterOption key={opt.val || 'all-date'} $isDark={isDarkMode}>
                    <input type="radio" name="dateRange" checked={selectedDateRange === opt.val} onChange={() => setSelectedDateRange(opt.val)} />
                    {opt.label}
                  </FilterOption>
                ))}
              </FilterBody>
            </FilterSection>

            {/* Location */}
            {topCities.length > 0 && (
              <FilterSection $isDark={isDarkMode}>
                <FilterSectionHeader $isDark={isDarkMode} $open={openSections.location} onClick={() => toggleSection('location')}>
                  {language === 'vi' ? 'Địa điểm' : 'Location'}
                  <ChevronDown size={14} />
                </FilterSectionHeader>
                <FilterBody $open={openSections.location}>
                  {topCities.map(({ city, count }) => (
                    <FilterOption key={city} $isDark={isDarkMode}>
                      <input type="checkbox" checked={selectedLocations.includes(city)} onChange={() => toggleLocation(city)} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{city}</span>
                      <span style={{ fontSize: '0.72rem', opacity: 0.4 }}>{count}</span>
                    </FilterOption>
                  ))}
                </FilterBody>
              </FilterSection>
            )}

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
                  style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
                  onClick={() => setSelectedJob(job)}
                >
                  <LogoBox>
                    {job.companyLogo
                      ? <img src={job.companyLogo} alt={job.companyName} />
                      : <Building2 size={22} color="#1a62ff" />
                    }
                  </LogoBox>
                  <JobInfo>
                    <JobTitle $isDark={isDarkMode} style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
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
                    <Company>{job.companyName || job.employerName || 'Công ty'}</Company>
                    <Tags>
                      {job._type === 'urgent' && (
                        <UrgentTag><Zap size={10} style={{ display: 'inline' }} /> {language === 'vi' ? 'Tuyển gấp' : 'Urgent'}</UrgentTag>
                      )}
                      {job.location && <Tag $isDark={isDarkMode}><MapPin size={10} style={{ display: 'inline' }} /> {job.location}</Tag>}
                      {job.workHours && <Tag $isDark={isDarkMode}><Clock size={10} style={{ display: 'inline' }} /> {job.workHours}</Tag>}
                      {job.jobType && <Tag $isDark={isDarkMode}>{job.jobType}</Tag>}
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
                    <ApplyBtn>
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
