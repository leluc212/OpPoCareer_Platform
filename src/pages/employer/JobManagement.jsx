import React, { useState, useMemo, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import TableFilter from '../../components/TableFilter';
import { Edit, Trash2, Users, Clock, TrendingUp, Eye, BarChart3, Plus, Calendar, MapPin, DollarSign } from 'lucide-react';
import { Button } from '../../components/FormElements';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import DynamicTranslate from '../../components/DynamicTranslate';
import jobPostService from '../../services/jobPostService';

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

const JobManagementContainer = styled(motion.div)``;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  gap: 16px;
`;

const PageTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PageIconBox = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 15px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg { width: 22px; height: 22px; color: #1e40af; }
`;

const PageTitleText = styled.div`
  h1 {
    font-size: 26px;
    font-weight: 800;
    color: ${props => props.theme.colors.text};
    letter-spacing: -0.5px;
    line-height: 1.2;
    margin-bottom: 4px;
  }
  p {
    color: ${props => props.theme.colors.textLight};
    font-size: 13.5px;
    font-weight: 500;
  }
`;

const CountBadge = styled.div`
  align-self: flex-start;
  padding: 6px 16px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  color: #1e40af;
  white-space: nowrap;
`;

const CreateButton = styled(motion.button)`
  padding: 10px 18px;
  border-radius: 10px;
  background: #1e40af;
  color: white;
  font-weight: 700;
  font-size: 13.5px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(30, 64, 175, 0.28);
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    filter: brightness(1.08);
    box-shadow: 0 6px 18px rgba(30, 64, 175, 0.38);
    transform: translateY(-1px);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const JobGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const JobCard = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: 20px;
  border: 2px solid ${props => props.theme.colors.border};
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: ${props => {
      if (props.$status === 'recruiting') return 'linear-gradient(90deg, #10B981 0%, #059669 100%)';
      if (props.$status === 'displayed') return 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)';
      if (props.$status === 'expired') return 'linear-gradient(90deg, #94A3B8 0%, #64748B 100%)';
      return 'linear-gradient(90deg, #94A3B8 0%, #64748B 100%)';
    }};
  }
  
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 48px rgba(30, 64, 175, 0.2);
    border-color: ${props => props.theme.colors.primary}40;
  }
`;

const CardContent = styled.div`
  padding: 24px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
`;

const JobInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const JobTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 12px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
  
  ${JobCard}:hover & {
    color: ${props => props.theme.colors.primary};
  }
`;

const JobMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
  
  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.theme.colors.primary};
    opacity: 0.7;
  }
  
  strong {
    color: ${props => props.theme.colors.text};
    font-weight: 700;
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 20px 0;
  padding: 16px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: 14px;
`;

const StatBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: 10px;
  border: 1.5px solid ${props => props.theme.colors.border};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.$color || props.theme.colors.primary};
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  & > * {
    position: relative;
    z-index: 1;
  }
  
  &:hover {
    border-color: ${props => props.$color || props.theme.colors.primary};
    transform: translateY(-3px);
    box-shadow: 0 4px 12px ${props => props.$color ? `${props.$color}20` : 'rgba(0, 0, 0, 0.1)'};
    
    &::before {
      opacity: 0.05;
    }
    
    svg {
      transform: scale(1.15);
    }
  }
  
  svg {
    width: 22px;
    height: 22px;
    color: ${props => props.$color || props.theme.colors.primary};
    transition: transform 0.3s ease;
  }
  
  .value {
    font-size: 24px;
    font-weight: 900;
    color: ${props => props.theme.colors.text};
    display: block;
    line-height: 1;
    letter-spacing: -0.5px;
  }
  
  .label {
    font-size: 11px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
  }
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 2px solid ${props => props.theme.colors.bgDark};
`;

const IDLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 600;
  
  strong {
    color: ${props => props.theme.colors.text};
    font-weight: 700;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled(motion.button)`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: ${props => {
    if (props.$variant === 'danger') return props.theme.colors.error + '10';
    if (props.$variant === 'primary') return props.theme.colors.primary + '10';
    return props.theme.colors.bgDark;
  }};
  color: ${props => {
    if (props.$variant === 'danger') return props.theme.colors.error;
    if (props.$variant === 'primary') return props.theme.colors.primary;
    return props.theme.colors.text;
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: ${props => {
      if (props.$variant === 'danger') return props.theme.colors.error;
      if (props.$variant === 'primary') return props.theme.colors.primary;
      return props.theme.colors.primary;
    }};
    color: white;
    border-color: ${props => {
      if (props.$variant === 'danger') return props.theme.colors.error;
      if (props.$variant === 'primary') return props.theme.colors.primary;
      return props.theme.colors.primary;
    }};
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 4px 12px ${props => {
      if (props.$variant === 'danger') return props.theme.colors.error + '40';
      if (props.$variant === 'primary') return props.theme.colors.primary + '40';
      return 'rgba(0, 0, 0, 0.15)';
    }};
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const EmptyState = styled(motion.div)`
  text-align: center;
  padding: 80px 20px;
  background: ${props => props.theme.colors.bgLight};
  border-radius: 20px;
  border: 2px dashed ${props => props.theme.colors.border};
  
  svg {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
    color: ${props => props.theme.colors.primary};
    opacity: 0.4;
  }
  
  h3 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 10px;
    color: ${props => props.theme.colors.text};
  }
  
  p {
    font-size: 15px;
    color: ${props => props.theme.colors.textLight};
    margin-bottom: 24px;
  }
`;

const StatusBadgeWrapper = styled.div`
  .status-badge {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
`;

const JobManagement = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState([]);

  const [jobs, setJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  // Refresh jobs when component mounts
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoadingJobs(true);
      try {
        const data = await jobPostService.getMyJobPosts();
        
        // Transform job fields to match what UI expects
        const formattedJobs = data.map(job => {
          let jobLocation = job.location;
          try {
            if (typeof jobLocation === 'string' && jobLocation.includes('{')) {
              const locObj = JSON.parse(jobLocation);
              jobLocation = locObj.address || locObj.city || jobLocation;
            }
          } catch(e) {}

          let timePosted = new Date(job.createdAt || Date.now());
          
          return {
            id: job.idJob || job.id,
            title: job.title || 'Vị trí công việc',
            applicants: job.applicants || 0,
            status: job.status === 'active' ? 'recruiting' : (job.status || 'recruiting'),
            posted: timePosted.toLocaleDateString(),
            views: job.views || 0,
            responseRate: job.responseRate || 0,
            location: jobLocation,
            jobType: job.jobType || 'full-time',
            department: job.jobType === 'part-time' ? 'Bán thời gian' : 'Toàn thời gian'
          };
        });

        // Ensure new jobs created via app appear first
        const sortedJobs = formattedJobs.sort((a,b) => {
          return new Date(b.posted) - new Date(a.posted);
        });

        setJobs(sortedJobs);
      } catch (error) {
        console.error("Failed to load jobs", error);
        setJobs([]);
      } finally {
        setIsLoadingJobs(false);
      }
    };
    fetchJobs();
  }, [language]);

  const filterOptions = [
    { value: 'recruiting', label: language === 'vi' ? 'Đang tuyển dụng' : 'Recruiting' },
    { value: 'displayed', label: language === 'vi' ? 'Hiển thị' : 'Displayed' },
    { value: 'expired', label: language === 'vi' ? 'Hết hạn' : 'Expired' },
  ];

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = searchTerm === '' || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilters.length === 0 || 
        statusFilters.includes(job.status);
      
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchTerm, statusFilters]);

  const handleFilterToggle = (filterValue) => {
    setStatusFilters(prev => 
      prev.includes(filterValue) 
        ? prev.filter(f => f !== filterValue)
        : [...prev, filterValue]
    );
  };

  const handleEdit = (jobId) => {
    // Find the job to edit
    const jobToEdit = jobs.find(job => job.id === jobId);
    if (jobToEdit) {
      // Navigate to post job page with job data
      navigate('/employer/post-job', { state: { job: jobToEdit } });
    }
  };

  const handleDelete = async (jobId) => {
    const confirmDelete = window.confirm(
      language === 'vi' 
        ? 'Bạn có chắc chắn muốn xóa tin tuyển dụng này?' 
        : 'Are you sure you want to delete this job posting?'
    );
    
    if (!confirmDelete) return;

    try {
      await jobPostService.deleteJobPost(jobId);
      
      // Update state by filtering out the deleted job
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      
      console.log('✅ Job deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete job:', error);
      alert(
        language === 'vi' 
          ? 'Xóa tin tuyển dụng thất bại. Vui lòng thử lại.' 
          : 'Failed to delete job posting. Please try again.'
      );
    }
  };

  return (
    <DashboardLayout role="employer" key={language}>
      <JobManagementContainer
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <PageHeader>
          <PageTitleGroup>
            <PageIconBox><BarChart3 /></PageIconBox>
            <PageTitleText>
              <h1>{language === 'vi' ? 'Quản Lý Tin Tuyển Dụng' : 'Job Management'}</h1>
              <p>{language === 'vi' ? 'Quản lý và theo dõi các tin tuyển dụng' : 'Manage and track your job postings'}</p>
            </PageTitleText>
          </PageTitleGroup>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CountBadge>{filteredJobs.length} {language === 'vi' ? 'tin đăng' : 'jobs'}</CountBadge>
            <CreateButton
              as={Link}
              to="/employer/post-job"
              whileTap={{ scale: 0.97 }}
            >
              <Plus />
              {language === 'vi' ? 'Đăng Tin Mới' : 'Post New Job'}
            </CreateButton>
          </div>
        </PageHeader>

        <TableFilter 
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filterOptions={filterOptions}
          activeFilters={statusFilters}
          onFilterToggle={handleFilterToggle}
          searchPlaceholder={language === 'vi' ? 'Tìm kiếm việc làm...' : 'Search jobs...'}
        />

        {isLoadingJobs ? (
          <EmptyState>
             <p>{language === 'vi' ? 'Đang tải dữ liệu...' : 'Loading jobs...'}</p>
          </EmptyState>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <BarChart3 />
            <h3>{language === 'vi' ? 'Không tìm thấy tin tuyển dụng' : 'No Jobs Found'}</h3>
            <p>{language === 'vi' ? 'Thử điều chỉnh bộ lọc hoặc tạo tin tuyển dụng mới' : 'Try adjusting filters or create a new job posting'}</p>
            <CreateButton
              as={Link}
              to="/employer/post-job"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus />
              {language === 'vi' ? 'Đăng Tin Mới' : 'Post New Job'}
            </CreateButton>
          </EmptyState>
        ) : (
          <JobGrid>
            {filteredJobs.map((job, index) => (
              <JobCard
                key={job.id}
                $status={job.status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                whileHover={{ y: -6 }}
              >
                <CardContent>
                  <CardHeader>
                    <JobInfo>
                      <JobTitle><DynamicTranslate text={job.title} showIndicator={false} /></JobTitle>
                      <JobMeta>
                        <MetaItem>
                          <Clock />
                          {job.posted}
                        </MetaItem>
                        {job.location && (
                          <MetaItem>
                            <MapPin />
                            <DynamicTranslate text={job.location} showIndicator={false} />
                          </MetaItem>
                        )}
                        {job.department && (
                          <MetaItem>
                            {job.department}
                          </MetaItem>
                        )}
                      </JobMeta>
                    </JobInfo>
                    <StatusBadgeWrapper>
                      <StatusBadge status={job.status} />
                    </StatusBadgeWrapper>
                  </CardHeader>

                  <StatsRow>
                    <StatBox $color="#1e40af">
                      <Users />
                      <span className="value">{job.applicants}</span>
                      <span className="label">{language === 'vi' ? 'Ứng viên' : 'Applicants'}</span>
                    </StatBox>
                    <StatBox $color="#10B981">
                      <Eye />
                      <span className="value">{job.views}</span>
                      <span className="label">{language === 'vi' ? 'Lượt xem' : 'Views'}</span>
                    </StatBox>
                    <StatBox $color="#F59E0B">
                      <TrendingUp />
                      <span className="value">{job.responseRate}%</span>
                      <span className="label">{language === 'vi' ? 'Phản hồi' : 'Response'}</span>
                    </StatBox>
                  </StatsRow>

                  <CardFooter>
                    <IDLabel>
                      <strong>ID:</strong> #{job.id}
                    </IDLabel>
                    <ActionButtons>
                      <IconButton
                        $variant="primary"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(job.id)}
                        title={language === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        $variant="danger"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(job.id)}
                        title={language === 'vi' ? 'Xóa' : 'Delete'}
                      >
                        <Trash2 />
                      </IconButton>
                    </ActionButtons>
                  </CardFooter>
                </CardContent>
              </JobCard>
            ))}
          </JobGrid>
        )}
      </JobManagementContainer>
    </DashboardLayout>
  );
};

export default JobManagement;
