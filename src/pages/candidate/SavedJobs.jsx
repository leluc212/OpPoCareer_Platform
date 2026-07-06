import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { Bookmark, MapPin, Briefcase, Clock, Building2, Eye, ArrowUpRight, Star, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';

const SavedJobsContainer = styled.div`
  animation: fadeIn 0.6s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
    color: ${props => props.theme.colors.text};
  }
  
  p {
    color: ${props => props.theme.colors.textLight};
    font-size: 15px;
  }
`;

const JobsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const JobCardWrapper = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  padding: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
    opacity: 0;
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

const RemoveButton = styled(motion.button)`
  width: 34px;
  height: 34px;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.bgLight};
  color: ${props => props.theme.colors.danger};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  &:hover {
    border-color: ${props => props.theme.colors.danger};
    background: ${props => props.theme.colors.danger}15;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  grid-column: 1 / -1;
  
  .icon {
    font-size: 64px;
    margin-bottom: 16px;
  }
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }
  
  p {
    font-size: 15px;
    color: ${props => props.theme.colors.textLight};
    margin-bottom: 24px;
  }
  
  button {
    padding: 12px 24px;
    background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
    color: white;
    border: none;
    border-radius: ${props => props.theme.borderRadius.lg};
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px ${props => props.theme.colors.primary}40;
    }
  }
`;

const SavedJobs = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);

  // Load saved jobs from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    setSavedJobs(saved);
  }, []);

  const handleRemoveJob = (jobId, e) => {
    e.stopPropagation();
    const updated = savedJobs.filter(job => job.id !== jobId);
    setSavedJobs(updated);
    localStorage.setItem('savedJobs', JSON.stringify(updated));
  };

  const handleJobClick = (jobId) => {
    // Disabled: Don't show modal when clicking on job card
    // Only show modal when clicking "Apply" button
  };

  const getCompanyInitial = (company) => {
    return company.charAt(0).toUpperCase();
  };

  return (
    <DashboardLayout role="candidate" showSearch={false} key={language}>
      <SavedJobsContainer>
        <PageHeader>
          <h1>{language === 'vi' ? 'Công việc đã lưu' : 'Saved Jobs'}</h1>
          <p>
            {language === 'vi' 
              ? `${savedJobs.length} công việc đã lưu` 
              : `${savedJobs.length} saved jobs`}
          </p>
        </PageHeader>

        <JobsGrid>
          {savedJobs.length > 0 ? (
            savedJobs.map((job, index) => (
              <JobCardWrapper
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => handleJobClick(job.id)}
              >
                <JobCardHeader>
                  <CompanyLogo>
                    {getCompanyInitial(job.company)}
                  </CompanyLogo>
                  <JobInfo>
                    <JobTitle>
                      {job.title}
                      {(job.urgent || job.isQuickJob) ? (
                        <StatusBadge status="urgent" size="sm">{language === 'vi' ? 'Tuyển gấp' : 'Urgent'}</StatusBadge>
                      ) : (
                        <StatusBadge status="active" size="sm">{language === 'vi' ? 'Tiêu chuẩn' : 'Standard'}</StatusBadge>
                      )}
                      {job.featured && <Star size={18} fill="#F59E0B" color="#F59E0B" />}
                    </JobTitle>
                    <CompanyName>
                      <Building2 />
                      {job.company}
                    </CompanyName>
                    <JobMeta>
                      <MetaItem>
                        <MapPin />
                        {job.location}
                      </MetaItem>
                      <MetaItem>
                        <Briefcase />
                        {job.type}
                      </MetaItem>
                    </JobMeta>
                  </JobInfo>
                </JobCardHeader>

                <JobCardBody>
                  <JobTags>
                    {job.tags?.map((tag, idx) => (
                      <Tag key={idx}>{tag}</Tag>
                    ))}
                  </JobTags>
                  
                  <JobSalary>
                    <span style={{ fontWeight: '500' }}>{language === 'vi' ? 'Thu nhập:' : 'Income:'}</span>
                    <span>{job.salary}</span>
                  </JobSalary>
                </JobCardBody>

                <JobCardFooter>
                  <JobPosted>
                    <Clock />
                    {job.postedAt}
                  </JobPosted>
                  
                  <JobActions>
                    <ActionButton
                      $primary
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJobClick(job.id);
                      }}
                    >
                      {language === 'vi' ? 'Ứng tuyển' : 'Apply'}
                      <ArrowUpRight />
                    </ActionButton>
                    
                    <RemoveButton
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleRemoveJob(job.id, e)}
                    >
                      <Trash2 />
                    </RemoveButton>
                  </JobActions>
                </JobCardFooter>
              </JobCardWrapper>
            ))
          ) : (
            <EmptyState>
              <div className="icon">🔖</div>
              <h3>{language === 'vi' ? 'Chưa có công việc đã lưu' : 'No saved jobs yet'}</h3>
              <p>
                {language === 'vi' 
                  ? 'Lưu các công việc yêu thích để xem lại sau'
                  : 'Save your favorite jobs to view them later'}
              </p>
              <button onClick={() => navigate('/candidate/jobs')}>
                {language === 'vi' ? 'Tìm việc ngay' : 'Find Jobs'}
              </button>
            </EmptyState>
          )}
        </JobsGrid>
      </SavedJobsContainer>
    </DashboardLayout>
  );
};

export default SavedJobs;
