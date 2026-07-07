import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { imgUrl } from '../../utils/assetUrl';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';

import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import employerProfileService from '../../services/employerProfileService';
import { useCompanyProfileCompletion } from '../../hooks/useCompanyProfileCompletion';
import jobPostService from '../../services/jobPostService';
import quickJobService from '../../services/quickJobService';
import applicationService, { getJobApplications } from '../../services/applicationService';
import candidateProfileService from '../../services/candidateProfileService';
import experienceService from '../../services/experienceService';
import { getNotifications } from '../../services/notificationService';
import { formatRelativeTime } from '../../hooks/useRelativeTime';
import DynamicTranslate from '../../components/DynamicTranslate';
import Modal from '../../components/Modal';
import CompanyProfileSetupModal from '../../components/CompanyProfileSetupModal';
import { ProfileDetailModal } from './Applications';
import {
  Briefcase,
  Users,
  Eye,
  TrendingUp,
  Plus,
  FileText,
  Calendar,
  MessageSquare,
  BarChart3,
  Landmark,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Award,
  Zap,
  ArrowUpRight,
  Download,
  Sparkles,
  UserPlus,
  Settings,
  Bell,
  Building2
} from 'lucide-react';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
`;

const DashboardContainer = styled.div`
  animation: ${fadeIn} 0.5s ease-in;
`;

const WelcomeBanner = styled(motion.div)`
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #2563eb 70%, #1d4ed8 100%);
  background-size: cover;
  background-position: center;
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 40px;
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px ${props => props.theme.colors.primary}30;
`;

const WelcomeContent = styled.div`
  position: relative;
  z-index: 1;
  color: white;
  flex: 1;
  
  h1 {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 12px;
  }
  
  p {
    font-size: 16px;
    opacity: 0.95;
    margin-bottom: 24px;
    font-weight: 500;
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled(motion.button)`
  padding: 14px 28px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.$variant === 'primary' ? 'white' : 'rgba(255, 255, 255, 0.2)'};
  color: ${props => props.$variant === 'primary' ? props.theme.colors.primary : 'white'};
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid ${props => props.$variant === 'primary' ? 'white' : 'rgba(255, 255, 255, 0.3)'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const IllustrationContainer = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 240px;
    height: 240px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    border: 5px solid rgba(255,255,255,0.25);
    animation: ${float} 4s ease-in-out infinite;
    backdrop-filter: blur(4px);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
`;

const Section = styled(motion.section)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: 28px;
  border: 2px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.card};
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: ${props => props.theme.shadows.lg};
    border-color: ${props => props.theme.colors.primary}30;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid ${props => props.theme.colors.border};
  
  h2 {
    font-size: 20px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    display: flex;
    align-items: center;
    gap: 10px;
    
    svg {
      width: 24px;
      height: 24px;
      color: ${props => props.theme.colors.primary};
    }
  }
  
  a {
    color: ${props => props.theme.colors.primary};
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.3s ease;
    
    &:hover {
      gap: 8px;
    }
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const ApplicationCard = styled(motion.div)`
  padding: 24px;
  background: ${props => props.theme.colors.cardBg};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 16px;
  margin-bottom: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(30, 64, 175, 0.12);
  }
`;

const ApplicationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CandidateInfo = styled.div`
  flex: 1;
  
  h4 {
    font-size: 16px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 6px;
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;
  }
`;

const ViewProfileButton = styled.button`
  padding: 10px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  color: white;
  font-size: 13.5px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.2);

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ApplicationMeta = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  padding-top: 12px;
  border-top: 1px solid ${props => props.theme.colors.border};
  
  span {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s ease;
    
    svg {
      width: 15px;
      height: 15px;
    }

    &:hover {
      color: ${props => props.theme.colors.primary};
    }
  }
`;

// ─── Quick Profile Preview Modal ──────────────────────────
// (removed — using full ProfileDetailModal from Applications)

const ActivityFeed = styled.div``;

const ActivityItem = styled(motion.div)`
  display: flex;
  gap: 16px;
  padding: 16px;
  border-left: 3px solid ${props => props.$color || props.theme.colors.border};
  margin-bottom: 12px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: 0 ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md} 0;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.bgLight};
    transform: translateX(8px);
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

const ActivityIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.$color || props.theme.colors.primary}15;
  color: ${props => props.$color || props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ActivityContent = styled.div`
  flex: 1;
  
  h5 {
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
  }
  
  p {
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
  }
`;

const PerformanceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 32px;
`;

const PerformanceCard = styled(motion.div)`
  padding: 24px;
  background: ${props => props.theme.colors.bgLight};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.xl};
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${props => props.$color || props.theme.colors.primary};
    transform: translateY(-4px);
    box-shadow: 0 12px 40px ${props => props.$color || props.theme.colors.primary}20;
  }
`;

const PerformanceIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: ${props => props.$color || props.theme.colors.primary}15;
  border-radius: ${props => props.theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 32px;
    height: 32px;
    color: ${props => props.$color || props.theme.colors.primary};
  }
`;

const PerformanceValue = styled.div`
  font-size: 32px;
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  margin-bottom: 8px;
`;

const PerformanceLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 600;
`;

const EmployerDashboard = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employerProfile, setEmployerProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Load employer profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        setIsLoadingProfile(true);
        const profile = await employerProfileService.getMyProfile();
        setEmployerProfile(profile);
      } catch (error) {
        console.error('Error loading employer profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

  const { isProfileComplete, isLoading: isLoadingProfileCompletion } = useCompanyProfileCompletion();

  // Company profile setup modal — show once per login session if profile is incomplete
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    if (isLoadingProfileCompletion) return;
    if (isProfileComplete) return; // profile đủ rồi → không hiện

    // Dùng sessionStorage: chỉ hiện 1 lần/session (mất khi đóng tab hoặc logout)
    const sessionKey = `profileModalShown_${user?.email}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const t = setTimeout(() => setShowSetupModal(true), 600);
    return () => clearTimeout(t);
  }, [isLoadingProfileCompletion, isProfileComplete, user?.email]);

  const handleCloseSetupModal = () => {
    setShowSetupModal(false);
    // Đánh dấu đã hiện trong session này
    if (user?.email) {
      sessionStorage.setItem(`profileModalShown_${user.email}`, '1');
    }
  };

  const [dashboardStats, setDashboardStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    totalViews: 0,
    quickJobs: 0,
    applicationsList: []
  });
  const [monthComparisons, setMonthComparisons] = useState({
    jobsDiff: null,       // e.g. +3 or -1
    appsPct: null,        // e.g. +12% or -5%
    quickJobsThisMonth: null  // count this month
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [previewApp, setPreviewApp] = useState(null);
  const [previewCandidate, setPreviewCandidate] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleViewProfile = async (app) => {
    // Show modal immediately with basic info
    const basic = {
      id: app.id,
      candidateId: app.candidateId,
      candidate: app.candidate,
      candidateEmail: app.candidateEmail || app.candidate,
      email: app.candidateEmail || app.candidate,
      job: app.job,
      applied: app.applied,
      status: app.status,
      phone: app.phone || '-',
      location: app.location || '-',
      education: app.education || '-',
      experience: app.experience || '-',
      skills: app.skills || [],
      bio: app.bio || '-',
      cvUrl: app.cvUrl || '',
      cvFileName: app.cvFileName || '',
      workHistory: app.workHistory || [],
      reviews: app.reviews || [],
    };
    setPreviewCandidate(basic);

    // Fetch full profile from DB if candidateId available
    if (app.candidateId) {
      setPreviewLoading(true);
      try {
        const [profile, candidateApps, approvedExperiences] = await Promise.all([
          candidateProfileService.getProfile(app.candidateId),
          applicationService.getCandidateApplications(app.candidateId).catch(() => []),
          experienceService.getCandidateApprovedExperiences(app.candidateId).catch(() => [])
        ]);
        
        // Only fetch job details for completed applications (work history)
        const completedApps = candidateApps.filter(a => a.status === 'completed' || a.status === 'completed_pending_candidate');
        const neededJobIds = [...new Set(completedApps.map(a => a.jobId).filter(Boolean))];
        
        let finalAllJobs = [];
        if (neededJobIds.length > 0) {
          // Batch requests (max 3 concurrent) to avoid Lambda throttling
          for (let i = 0; i < neededJobIds.length; i += 3) {
            const batch = neededJobIds.slice(i, i + 3);
            const batchResults = await Promise.all(batch.map(async (id) => {
              try {
                if (/^\d+$/.test(id)) return null;
                if (id.startsWith('QJOB-')) {
                  return await quickJobService.getQuickJob(id).catch(() => null);
                }
                return await jobPostService.getJobPost(id).catch(() => null);
              } catch (e) {
                return null;
              }
            }));
            finalAllJobs.push(...batchResults.filter(Boolean));
          }
        }

        // Detailed work history (completed applications)
        const workHistory = candidateApps
          .filter(a => a.status === 'completed' || a.status === 'completed_pending_candidate')
          .map(a => {
            const job = finalAllJobs.find(j => (j.idJob || j.id || j.jobID) === a.jobId);
            return {
              id: a.applicationId || a.id,
              jobTitle: job?.title || a.jobTitle || '---',
              companyName: job?.employerName || job?.companyName || a.employerName || a.companyName || '---',
              completedAt: a.updatedAt || a.appliedAt || a.createdAt,
              employerRating: a.employerRating || null
            };
          })
          .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));

        // Reviews list
        const reviews = candidateApps
          .filter(a => a.employerRating && typeof a.employerRating.overall === 'number')
          .map(a => {
            const job = finalAllJobs.find(j => (j.idJob || j.id || j.jobID) === a.jobId);
            return {
              rating: a.employerRating.overall,
              comment: a.employerRating.comment || '',
              employerName: job?.employerName || job?.companyName || a.employerName || a.companyName || '---',
              position: job?.title || a.jobTitle || '---',
              date: new Date(a.employerConfirmedAt || a.updatedAt || a.appliedAt).toLocaleDateString('vi-VN')
            };
          });

        const experienceSummary = profile?.experience?.trim()
          ? profile.experience
          : approvedExperiences.length > 0
            ? approvedExperiences
                .slice(0, 3)
                .map(exp => {
                  const role = exp.jobTitle || 'Kinh nghiệm';
                  const company = exp.companyName ? ` tại ${exp.companyName}` : '';
                  const period = exp.isCurrent
                    ? ' (Hiện tại)'
                    : (exp.startMonth && exp.startYear)
                      ? ` (${exp.startMonth}/${exp.startYear}${exp.endMonth && exp.endYear ? ` - ${exp.endMonth}/${exp.endYear}` : ''})`
                      : '';
                  return `${role}${company}${period}`;
                })
                .join('; ')
            : (basic.experience || '');

        if (profile) {
          setPreviewCandidate(prevState => {
            if (!prevState) return prevState;
            return {
              ...prevState,
              ...profile,
              candidate: profile.fullName || prevState.candidate,
              candidateEmail: profile.email || prevState.candidateEmail,
              phone: profile.phone || prevState.phone,
              location: profile.location || prevState.location,
              education: profile.education || prevState.education,
              experience: experienceSummary,
              skills: profile.skills || prevState.skills,
              bio: profile.bio || prevState.bio,
              // Ưu tiên cvUrl từ application (đã được refresh) thay vì profile (có thể hết hạn)
              cvUrl: prevState.cvUrl || profile.cvUrl,
              cvFileName: prevState.cvFileName || profile.cvFileName,
              profileImage: profile.profileImage || prevState.profileImage,
              workHistory,
              reviews
            };
          });
        } else {
          setPreviewCandidate(prevState => {
            if (!prevState) return prevState;
            return {
              ...prevState,
              workHistory,
              reviews
            };
          });
        }
      } catch (err) {
        // Profile fetch failed silently - basic info already shown
      } finally {
        setPreviewLoading(false);
      }
    }
  };
  const [recentActivities, setRecentActivities] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    responseRate: '0%',
    avgHiringTime: '0 ngày',
    companyRating: '0/5',
    growth: '+0%'
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setIsLoadingStats(true);
      try {
        const [standardJobs, quickJobs] = await Promise.all([
          jobPostService.getMyJobPosts().catch(() => []),
          quickJobService.getMyQuickJobs().catch(() => [])
        ]);

        const allStandard = standardJobs || [];
        const allQuick = quickJobs || [];
        const allJobs = [...allStandard, ...allQuick];

        let totalViewsCount = 0;
        allJobs.forEach(job => {
          totalViewsCount += (job.views || 0);
        });

        // Fetch applications for ALL standard jobs - batched to avoid Lambda throttling
        const batchSize = 5;
        const appsResults = [];
        for (let i = 0; i < allStandard.length; i += batchSize) {
          const batch = allStandard.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(job => getJobApplications(job.idJob || job.id).catch(() => []))
          );
          appsResults.push(...batchResults);
        }
        const rawAllApplications = appsResults.flat();
        
        let allApplications = rawAllApplications.filter(app => {
          // Consider it valid if it has a name OR an email that isn't 'Unknown'
          const hasIdentify = app.fullName?.trim() || app.candidateName?.trim() || (app.candidateEmail && app.candidateEmail !== 'Unknown');
          // Only show actionable applications
          const isActive = !['accepted', 'rejected', 'completed'].includes(app.status);
          return hasIdentify && isActive;
        });
        
        setDashboardStats({
          totalJobs: allJobs.length,
          totalApplications: allApplications.length,
          totalViews: totalViewsCount,
          quickJobs: allQuick.length,
          applicationsList: allApplications
        });

        // ── Month-over-month comparisons ──────────────────────────────
        const now = new Date();
        const thisYear = now.getFullYear();
        const thisMonth = now.getMonth(); // 0-indexed
        const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

        const jobsThisMonth = allJobs.filter(j => {
          const d = new Date(j.createdAt || j.postedAt || 0);
          return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
        }).length;
        const jobsLastMonth = allJobs.filter(j => {
          const d = new Date(j.createdAt || j.postedAt || 0);
          return d.getFullYear() === lastYear && d.getMonth() === lastMonth;
        }).length;
        const jobsDiff = jobsThisMonth - jobsLastMonth;

        const appsThisMonth = rawAllApplications.filter(a => {
          const d = new Date(a.createdAt || 0);
          return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
        }).length;
        const appsLastMonth = rawAllApplications.filter(a => {
          const d = new Date(a.createdAt || 0);
          return d.getFullYear() === lastYear && d.getMonth() === lastMonth;
        }).length;
        const appsPct = appsLastMonth > 0
          ? Math.round(((appsThisMonth - appsLastMonth) / appsLastMonth) * 100)
          : (appsThisMonth > 0 ? 100 : 0);

        const quickJobsThisMonth = allQuick.filter(j => {
          const d = new Date(j.createdAt || j.postedAt || 0);
          return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
        }).length;

        setMonthComparisons({ jobsDiff, appsPct, quickJobsThisMonth });

        const sortedApps = [...allApplications].sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
        const recentAppsList = sortedApps.slice(0, 3).map(app => {
          const jobMatch = allStandard.find(j => (j.idJob || j.id) === app.jobId);
          return {
            id: app.applicationId || app.idApp || app.id || Math.random().toString(),
            candidateId: app.candidateId || app.userId || app.candidateUserId || '',
            candidate: app.fullName || app.candidateName || app.candidateEmail || (language === 'vi' ? 'Ứng viên' : 'Candidate'),
            candidateEmail: app.candidateEmail || '',
            job: jobMatch?.title || (language === 'vi' ? 'Công việc' : 'Job'),
            applied: new Date(app.createdAt || Date.now()).toLocaleDateString(),
            status: app.status || 'pending',
            avatar: (app.fullName || app.candidateName || app.candidateEmail || 'U')[0],
            jobId: app.jobId,
            phone: app.phone || '-',
            location: app.location || '-',
            education: app.education || '-',
            experience: app.experience || '-',
            skills: app.skills || [],
            bio: app.bio || '-',
            cvUrl: app.cvUrl || '',
            cvFileName: app.cvFileName || '',
            reviews: app.reviews || [],
          };
        });
        
        setRecentApplications(recentAppsList);

        // Fetch Recent Activities from Notifications
        try {
          const notifications = await getNotifications(user.userId || user.id, 'employer');
          const mappedActivities = notifications.slice(0, 10).map(notif => {
            let IconComp = Bell; // Fallback icon
            let iconColor = '#3b82f6'; // Fallback color
            const d = notif.data || {};

            // Build a rich, contextual title for each notification type
            let richTitle = '';
            switch (notif.type) {
              case 'application':
                IconComp = UserPlus;
                iconColor = '#3b82f6';
                if (language === 'vi') {
                  richTitle = d.candidateName
                    ? `${d.candidateName} ứng tuyển${d.jobTitle ? ` vào "${d.jobTitle}"` : ''}`
                    : notif.title;
                } else {
                  richTitle = d.candidateName
                    ? `${d.candidateName} applied${d.jobTitle ? ` to "${d.jobTitle}"` : ''}`
                    : notif.titleEn || notif.title;
                }
                break;
              case 'job_approved':
                IconComp = CheckCircle;
                iconColor = '#10b981';
                if (language === 'vi') {
                  richTitle = d.jobTitle ? `Bài đăng "${d.jobTitle}" đã được phê duyệt` : notif.title;
                } else {
                  richTitle = d.jobTitle ? `Post "${d.jobTitle}" was approved` : (notif.titleEn || notif.title);
                }
                break;
              case 'job_rejected':
                IconComp = Bell;
                iconColor = '#ef4444';
                if (language === 'vi') {
                  richTitle = d.jobTitle ? `Bài đăng "${d.jobTitle}" bị từ chối` : notif.title;
                } else {
                  richTitle = d.jobTitle ? `Post "${d.jobTitle}" was rejected` : (notif.titleEn || notif.title);
                }
                break;
              case 'ai_interview_complete':
                IconComp = Sparkles;
                iconColor = '#8B5CF6';
                if (language === 'vi') {
                  richTitle = d.candidateName
                    ? `${d.candidateName} đã hoàn thành phỏng vấn AI${d.jobTitle ? ` (${d.jobTitle})` : ''}`
                    : `Ứng viên hoàn thành phỏng vấn AI${d.jobTitle ? ` — ${d.jobTitle}` : ''}`;
                } else {
                  richTitle = d.candidateName
                    ? `${d.candidateName} completed AI interview${d.jobTitle ? ` (${d.jobTitle})` : ''}`
                    : `Candidate completed AI interview${d.jobTitle ? ` — ${d.jobTitle}` : ''}`;
                }
                break;
              case 'employer_cv_approved':
                IconComp = CheckCircle;
                iconColor = '#10b981';
                if (language === 'vi') {
                  richTitle = d.candidateName
                    ? `Hồ sơ của ${d.candidateName} đã được chấp nhận${d.jobTitle ? ` — ${d.jobTitle}` : ''}`
                    : notif.title;
                } else {
                  richTitle = d.candidateName
                    ? `${d.candidateName}'s CV accepted${d.jobTitle ? ` — ${d.jobTitle}` : ''}`
                    : (notif.titleEn || notif.title);
                }
                break;
              case 'employer_cv_rejected':
                IconComp = Bell;
                iconColor = '#ef4444';
                if (language === 'vi') {
                  richTitle = d.candidateName
                    ? `Hồ sơ của ${d.candidateName} bị từ chối${d.jobTitle ? ` — ${d.jobTitle}` : ''}`
                    : notif.title;
                } else {
                  richTitle = d.candidateName
                    ? `${d.candidateName}'s CV rejected${d.jobTitle ? ` — ${d.jobTitle}` : ''}`
                    : (notif.titleEn || notif.title);
                }
                break;
              case 'package_approved':
                IconComp = CheckCircle;
                iconColor = '#10b981';
                richTitle = language === 'vi' ? notif.title : (notif.titleEn || notif.title);
                break;
              case 'package_purchase_request':
                IconComp = Briefcase;
                iconColor = '#8B5CF6';
                richTitle = language === 'vi' ? notif.title : (notif.titleEn || notif.title);
                break;
              case 'success':
                IconComp = CheckCircle;
                iconColor = '#10b981';
                richTitle = language === 'vi' ? notif.title : (notif.titleEn || notif.title);
                break;
              case 'system':
                IconComp = Settings;
                iconColor = '#6b7280';
                richTitle = language === 'vi' ? notif.title : (notif.titleEn || notif.title);
                break;
              default:
                IconComp = Bell;
                iconColor = '#3b82f6';
                richTitle = language === 'vi' ? notif.title : (notif.titleEn || notif.title);
            }

            return {
              title: richTitle,
              time: formatRelativeTime(notif.createdAt, language),
              icon: IconComp,
              color: iconColor,
              actionUrl: notif.actionUrl || null
            };
          });
          setRecentActivities(mappedActivities);
        } catch (notifError) {
          console.error("Error fetching activities for dashboard:", notifError);
        }

        // Calculate Performance Metrics
        const totalApps = rawAllApplications.length;
        const respondedApps = rawAllApplications.filter(app => app.status && app.status !== 'pending').length;
        const responseRateVal = totalApps > 0 ? Math.round((respondedApps / totalApps) * 100) : 0;
        
        const acceptedApps = rawAllApplications.filter(app => app.status === 'accepted' || app.status === 'completed');
        
        // Calculate Avg Hiring Time (from creation to acceptance)
        let totalHiringDays = 0;
        let countForHiringTime = 0;
        
        acceptedApps.forEach(app => {
          if (app.createdAt && (app.updatedAt || app.acceptedAt)) {
            const start = new Date(app.createdAt);
            const end = new Date(app.updatedAt || app.acceptedAt);
            const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0) {
              totalHiringDays += diffDays;
              countForHiringTime++;
            }
          }
        });
        
        const avgHiringDays = countForHiringTime > 0 ? Math.round(totalHiringDays / countForHiringTime) : 0;

        setPerformanceMetrics({
          responseRate: `${responseRateVal}%`,
          avgHiringTime: language === 'vi' ? `${avgHiringDays || 0} ngày` : `${avgHiringDays || 0} days`,
          companyRating: employerProfile?.rating ? `${employerProfile.rating}/5` : '4.8/5', // Fallback to 4.8 if no rating
          growth: '+32%' // Hardcoded for now until we have historical comparisons
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, [user]);

  const activities = recentActivities.length > 0 ? recentActivities : [
    {
      title: language === 'vi' ? 'Chào mừng bạn quay lại!' : 'Welcome back!',
      time: language === 'vi' ? 'Vừa xong' : 'Just now',
      icon: Sparkles,
      color: '#F59E0B'
    }
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return language === 'vi' ? 'Chào buổi sáng' : 'Good morning';
    if (hour < 18) return language === 'vi' ? 'Chào buổi chiều' : 'Good afternoon';
    return language === 'vi' ? 'Chào buổi tối' : 'Good evening';
  };

  // Get company name from profile or fallback
  const getCompanyName = () => {
    if (employerProfile?.companyName) {
      return employerProfile.companyName;
    }
    return language === 'vi' ? 'Nhà tuyển dụng' : 'Employer';
  };

  // Get company logo from profile or fallback
  const getCompanyLogo = () => {
    if (employerProfile?.companyLogo) {
      return employerProfile.companyLogo;
    }
    return null; // no logo yet - show placeholder
  };

  // Get company banner from profile or null (no fallback to Katinat)
  const getCompanyBanner = () => {
    return employerProfile?.companyBanner || null;
  };

  return (
    <DashboardLayout role="employer" key={language}>
      <CompanyProfileSetupModal
        isOpen={showSetupModal}
        onClose={handleCloseSetupModal}
      />
      <DashboardContainer>
        {/* Welcome Banner */}
        <WelcomeBanner
          $bgUrl={getCompanyBanner()}
          style={getCompanyBanner()
            ? { background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('${getCompanyBanner()}') center/cover` }
            : { background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #2563eb 70%, #1d4ed8 100%)' }
          }
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <WelcomeContent>
            <h1>{getGreeting()}, {getCompanyName()}! 👋</h1>
            <p style={{ fontStyle: 'italic' }}>
              {language === 'vi' ? (
                <>
                  Hôm nay bạn có{' '}
                  <strong style={{ fontStyle: 'italic' }}>
                    {dashboardStats.applicationsList
                      ? dashboardStats.applicationsList.filter(app => new Date(app.createdAt || Date.now()).toDateString() === new Date().toDateString()).length
                      : 0} hồ sơ mới
                  </strong>{' '}đang chờ bạn xử lý
                </>
              ) : (
                <>
                  You have{' '}
                  <strong style={{ fontStyle: 'italic' }}>
                    {dashboardStats.applicationsList
                      ? dashboardStats.applicationsList.filter(app => new Date(app.createdAt || Date.now()).toDateString() === new Date().toDateString()).length
                      : 0} new applications
                  </strong>{' '}waiting for you
                </>
              )}
            </p>
            <QuickActions>
              <ActionButton
                $variant="primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/employer/quick-jobs')}
              >
                <Plus />
                {language === 'vi' ? 'Tuyển Gấp' : 'Quick Hiring'}
              </ActionButton>
              <ActionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/employer/profile')}
              >
                <FileText />
                {language === 'vi' ? 'Xem Hồ Sơ' : 'View Profile'}
              </ActionButton>
            </QuickActions>
          </WelcomeContent>
          <IllustrationContainer>
            {getCompanyLogo() ? (
              <img src={getCompanyLogo()} alt={getCompanyName()} />
            ) : (
              <div style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
                border: '4px solid rgba(255,255,255,0.4)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                animation: `${float._tag || 'float'} 4s ease-in-out infinite`,
                flexShrink: 0
              }}>
                <span style={{
                  fontSize: '64px',
                  fontWeight: '800',
                  color: 'white',
                  textShadow: '0 2px 12px rgba(0,0,0,0.3)',
                  lineHeight: 1,
                  userSelect: 'none'
                }}>
                  {(employerProfile?.companyName || getCompanyName() || 'C').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </IllustrationContainer>
        </WelcomeBanner>

        {/* Stats Overview */}
        <StatsGrid>
          <StatsCard
            title={language === 'vi' ? 'TỔNG TIN ĐĂNG' : 'TOTAL POSTS'}
            value={isLoadingStats ? "..." : dashboardStats.totalJobs.toString()}
            change={!isLoadingStats && monthComparisons.jobsDiff !== null
              ? `${monthComparisons.jobsDiff >= 0 ? '+' : ''}${monthComparisons.jobsDiff}`
              : undefined}
            changeText={language === 'vi' ? 'so với tháng trước' : 'vs last month'}
            icon={Briefcase}
            color="#1e40af"
            positive={!isLoadingStats && (monthComparisons.jobsDiff ?? 0) >= 0}
            onClick={() => navigate('/employer/standard-jobs', { state: { section: 'posts' } })}
          />
          <StatsCard
            title={language === 'vi' ? 'TỔNG HỔ SƠ ĐÃ NHẬN' : 'TOTAL APPLICATIONS RECEIVED'}
            value={isLoadingStats ? "..." : dashboardStats.totalApplications.toString()}
            change={!isLoadingStats && monthComparisons.appsPct !== null
              ? `${monthComparisons.appsPct >= 0 ? '+' : ''}${monthComparisons.appsPct}%`
              : undefined}
            changeText={language === 'vi' ? 'so với tháng trước' : 'vs last month'}
            icon={Users}
            color="#F59E0B"
            positive={!isLoadingStats && (monthComparisons.appsPct ?? 0) >= 0}
            onClick={() => navigate('/employer/standard-jobs', { state: { section: 'applications' } })}
          />
          <StatsCard
            title={language === 'vi' ? 'TỔNG TIN TUYỂN GẤP' : 'URGENT JOB POSTS'}
            value={isLoadingStats ? "..." : dashboardStats.quickJobs.toString()}
            change={!isLoadingStats && monthComparisons.quickJobsThisMonth !== null
              ? `+${monthComparisons.quickJobsThisMonth}`
              : undefined}
            changeText={language === 'vi' ? 'Trong tháng này' : 'This month'}
            icon={TrendingUp}
            color="#1e40af"
            positive
          />
          <StatsCard
            title={language === 'vi' ? 'LƯỢT XEM BÀI ĐĂNG' : 'JOB POST VIEWS'}
            value={isLoadingStats ? "..." : dashboardStats.totalViews.toString()}
            changeText={language === 'vi' ? 'Tổng lượt xem tất cả bài đăng' : 'Total views across all posts'}
            icon={Eye}
            color="#0ea5e9"
            positive
            onClick={() => navigate('/employer/standard-jobs', { state: { section: 'posts' } })}
          />
          <StatsCard
            title={language === 'vi' ? 'LƯỢT XEM HỒ SƠ CÔNG TY' : 'COMPANY PROFILE VIEWS'}
            value={isLoadingStats ? "..." : (employerProfile?.profileViews ?? 0).toString()}
            changeText={language === 'vi' ? 'Ứng viên đã xem hồ sơ của bạn' : 'Candidates viewed your profile'}
            icon={Building2}
            color="#8B5CF6"
            positive
            onClick={() => navigate('/employer/profile')}
          />
        </StatsGrid>

        {/* Main Content Grid */}
        <ContentGrid>
          {/* Recent Applications */}
          <Section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <SectionHeader>
              <h2>
                <Briefcase />
                {language === 'vi' ? 'Công việc tiêu chuẩn' : 'Standard Jobs'}
              </h2>
              <a onClick={() => navigate('/employer/standard-jobs', { state: { section: 'applications' } })} style={{ cursor: 'pointer' }}>
                {language === 'vi' ? 'Xem tất cả' : 'View all'}
                <ArrowUpRight />
              </a>
            </SectionHeader>

            {recentApplications.length > 0 ? (
              recentApplications.map((app, index) => (
                <ApplicationCard
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <ApplicationHeader>
                    <CandidateInfo>
                      <h4>{app.candidate === 'Ứng viên' ? (language === 'vi' ? 'Ứng viên' : 'Candidate') : app.candidate}</h4>
                      <p><DynamicTranslate text={app.job} showIndicator={false} /></p>
                    </CandidateInfo>
                    <ViewProfileButton onClick={() => handleViewProfile(app)}>
                      <Eye />
                      {language === 'vi' ? 'Xem hồ sơ' : 'View Profile'}
                    </ViewProfileButton>
                  </ApplicationHeader>
                  <ApplicationMeta>
                    <span>
                      <Clock />
                      {app.applied}
                    </span>
                  </ApplicationMeta>
                </ApplicationCard>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  textAlign: 'center', 
                  padding: '48px 20px', 
                  background: 'rgba(248, 250, 252, 0.5)', 
                  borderRadius: '20px', 
                  border: '2px dashed #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  background: '#f1f5f9', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '28px'
                }}>📋</div>
                <div>
                  <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    {language === 'vi' ? 'Chưa có ứng tuyển mới' : 'No new applications'}
                  </h4>
                  <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '300px', margin: '0 auto', lineHeight: 1.5 }}>
                    {language === 'vi' ? 'Hệ thống tự động lọc bỏ hồ sơ không hợp lệ. Các ứng tuyển mới sẽ xuất hiện tại đây.' : 'Invalid applications are automatically filtered. New applications will appear here.'}
                  </p>
                </div>
              </motion.div>
            )}

          </Section>

          {/* Activity Feed */}
          <Section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <SectionHeader>
              <h2>
                <Calendar />
                {language === 'vi' ? 'Hoạt Động Gần Đây' : 'Recent Activity'}
              </h2>
            </SectionHeader>

            <ActivityFeed>
              {activities.map((activity, index) => {
                const IconComponent = activity.icon;
                return (
                  <ActivityItem
                    key={index}
                    $color={activity.color}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    onClick={() => activity.actionUrl && navigate(activity.actionUrl)}
                    style={{ cursor: activity.actionUrl ? 'pointer' : 'default' }}
                  >
                    <ActivityIcon $color={activity.color}>
                      <IconComponent />
                    </ActivityIcon>
                    <ActivityContent>
                      <h5>{activity.title}</h5>
                      <p>{activity.time}</p>
                    </ActivityContent>
                  </ActivityItem>
                );
              })}
            </ActivityFeed>
          </Section>
        </ContentGrid>

        {/* Company Profile Setup Modal removed from dashboard - shown on job pages instead */}
      </DashboardContainer>

      {/* Full Profile Modal */}
      <Modal
        isOpen={!!previewCandidate}
        onClose={() => { setPreviewCandidate(null); setPreviewLoading(false); }}
        size="large"
        noPadding
      >
        {previewCandidate && (
          <ProfileDetailModal
            candidate={previewCandidate}
            onClose={() => { setPreviewCandidate(null); setPreviewLoading(false); }}
            isLoading={previewLoading}
          />
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default EmployerDashboard;

