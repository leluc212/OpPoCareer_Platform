import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import DashboardLayout from '../../components/DashboardLayout';
import JobCard from '../../components/JobCard';
import { Button } from '../../components/FormElements';
import { 
  MapPin, Users, Building2, Globe, Calendar, ArrowLeft, UserPlus, Share2,
  Briefcase, Award, TrendingUp, CheckCircle 
} from 'lucide-react';

const ProfileContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
  margin-bottom: 24px;
  background: none;
  transition: color ${props => props.theme.transitions.fast};
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ProfileHeader = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 40px;
  margin-bottom: 32px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const HeaderTop = styled.div`
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
`;

const CompanyLogo = styled.div`
  width: 120px;
  height: 120px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.theme.colors.gradientPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 48px;
  flex-shrink: 0;
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const CompanyName = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const VerifiedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.theme.colors.successBg};
  color: ${props => props.theme.colors.success};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 14px;
  font-weight: 600;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const CompanyTagline = styled.p`
  font-size: 18px;
  color: ${props => props.theme.colors.textLight};
  margin-bottom: 24px;
`;

const CompanyMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.colors.textLight};
  font-size: 15px;
  
  svg {
    width: 18px;
    height: 18px;
    color: ${props => props.theme.colors.primary};
  }
  
  strong {
    color: ${props => props.theme.colors.text};
    font-weight: 600;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding-top: 32px;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const StatCard = styled.div`
  text-align: center;
  padding: 20px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: ${props => props.theme.borderRadius.md};
  
  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: ${props => props.theme.colors.primary};
    margin-bottom: 8px;
  }
  
  .stat-label {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
  }
`;

const ContentSection = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
`;

const MainContent = styled.div``;

const Sidebar = styled.div``;

const Card = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 32px;
  margin-bottom: 24px;
  border: 1px solid ${props => props.theme.colors.border};
  
  h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;
    color: ${props => props.theme.colors.text};
  }
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
    color: ${props => props.theme.colors.text};
  }
  
  p {
    color: ${props => props.theme.colors.textLight};
    line-height: 1.8;
    margin-bottom: 12px;
  }
`;

const BenefitsList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: ${props => props.theme.borderRadius.md};
  
  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.theme.colors.success};
    flex-shrink: 0;
  }
  
  span {
    color: ${props => props.theme.colors.text};
    font-size: 14px;
    font-weight: 500;
  }
`;

const InfoItem = styled.div`
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  
  .label {
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    margin-bottom: 4px;
  }
  
  .value {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
  }
`;

const JobsGrid = styled.div`
  display: grid;
  gap: 20px;
`;

const EmployerProfileView = () => {
  const { employerId } = useParams();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock data - in real app, fetch from API
  const employer = {
    id: employerId,
    name: 'FPT Software',
    tagline: 'Leading Software Development Company in Vietnam',
    logo: 'F',
    verified: true,
    industry: 'Information Technology',
    location: 'Thành phố Hồ Chí Minh, Việt Nam',
    size: '10,000+ employees',
    founded: '1999',
    website: 'https://fptsoftware.com',
    description: 'FPT Software is a global technology and IT services provider headquartered in Vietnam, with over 30,000 employees in 83 offices across 29 countries. We deliver world-class services in Smart factory, Digital platforms, RPA, AI, IoT, Embedded Systems, Cloud, AR/VR, Mobile App, Application Development, Application Management, BPO, Quality Assurance & Testing and more.',
    stats: {
      openJobs: 45,
      employees: '10,000+',
      locations: 83,
      founded: 1999
    },
    benefits: [
      'Competitive Salary',
      'Health Insurance',
      'Remote Work',
      'Flexible Hours',
      'Career Growth',
      'Training Programs',
      'Annual Bonus',
      'Team Building'
    ],
    culture: 'At FPT Software, we believe in innovation, collaboration, and continuous learning. Our diverse and inclusive workplace empowers employees to reach their full potential.',
    contact: {
      email: 'careers@fpt.com',
      phone: '+84 28 7300 8800',
      address: 'Lot I-1, Saigon Hi-Tech Park, District 9, HCMC'
    }
  };

  const jobs = [
    {
      id: 1,
      title: 'Senior React Developer',
      location: 'TP.HCM',
      type: 'Part-time',
      salary: '120 - 150 triệu VND',
      postedAt: '2 days ago',
      applicants: 45
    },
    {
      id: 2,
      title: 'Backend Engineer (Node.js)',
      location: 'Quận 1, TP.HCM',
      type: 'Part-time',
      salary: '100 - 130 triệu VND',
      postedAt: '1 week ago',
      applicants: 32
    }
  ];

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    alert(isFollowing ? 'Unfollowed employer' : 'Following employer!');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Profile link copied to clipboard!');
  };

  return (
    <DashboardLayout role="employee">
      <ProfileContainer>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeft />
          Back
        </BackButton>

        <ProfileHeader>
          <HeaderTop>
            <CompanyLogo>{employer.logo}</CompanyLogo>
            <HeaderContent>
              <CompanyName>
                {employer.name}
                {employer.verified && (
                  <VerifiedBadge>
                    <CheckCircle />
                    Verified
                  </VerifiedBadge>
                )}
              </CompanyName>
              <CompanyTagline>{employer.tagline}</CompanyTagline>
              <CompanyMeta>
                <MetaItem>
                  <Building2 />
                  <span><strong>{employer.industry}</strong></span>
                </MetaItem>
                <MetaItem>
                  <MapPin />
                  <span>{employer.location}</span>
                </MetaItem>
                <MetaItem>
                  <Users />
                  <span>{employer.size}</span>
                </MetaItem>
                <MetaItem>
                  <Calendar />
                  <span>Founded {employer.founded}</span>
                </MetaItem>
                <MetaItem>
                  <Globe />
                  <a href={employer.website} target="_blank" rel="noopener noreferrer" 
                     style={{ color: 'inherit', textDecoration: 'underline' }}>
                    Website
                  </a>
                </MetaItem>
              </CompanyMeta>
              <ActionButtons>
                <Button 
                  $variant={isFollowing ? 'ghost' : 'primary'} 
                  onClick={handleFollow}
                >
                  <UserPlus style={{ width: '18px', height: '18px' }} />
                  {isFollowing ? 'Following' : 'Follow Company'}
                </Button>
                <Button $variant="secondary" onClick={handleShare}>
                  <Share2 style={{ width: '18px', height: '18px' }} />
                  Share
                </Button>
              </ActionButtons>
            </HeaderContent>
          </HeaderTop>

          <StatsGrid>
            <StatCard>
              <div className="stat-value">{employer.stats.openJobs}</div>
              <div className="stat-label">Open Positions</div>
            </StatCard>
            <StatCard>
              <div className="stat-value">{employer.stats.employees}</div>
              <div className="stat-label">Employees</div>
            </StatCard>
            <StatCard>
              <div className="stat-value">{employer.stats.locations}</div>
              <div className="stat-label">Office Locations</div>
            </StatCard>
            <StatCard>
              <div className="stat-value">{new Date().getFullYear() - employer.stats.founded}</div>
              <div className="stat-label">Years in Business</div>
            </StatCard>
          </StatsGrid>
        </ProfileHeader>

        <ContentSection>
          <MainContent>
            <Card>
              <h2>About {employer.name}</h2>
              <p>{employer.description}</p>
            </Card>

            <Card>
              <h2>Company Culture</h2>
              <p>{employer.culture}</p>
            </Card>

            <Card>
              <h2>Benefits & Perks</h2>
              <BenefitsList>
                {employer.benefits.map((benefit, index) => (
                  <BenefitItem key={index}>
                    <CheckCircle />
                    <span>{benefit}</span>
                  </BenefitItem>
                ))}
              </BenefitsList>
            </Card>

            <Card>
              <h2>Open Positions ({jobs.length})</h2>
              <JobsGrid>
                {jobs.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={{...job, company: employer.name}} 
                  />
                ))}
              </JobsGrid>
            </Card>
          </MainContent>

          <Sidebar>
            <Card>
              <h3>Contact Information</h3>
              <InfoItem>
                <div className="label">Email</div>
                <div className="value">{employer.contact.email}</div>
              </InfoItem>
              <InfoItem>
                <div className="label">Phone</div>
                <div className="value">{employer.contact.phone}</div>
              </InfoItem>
              <InfoItem>
                <div className="label">Address</div>
                <div className="value">{employer.contact.address}</div>
              </InfoItem>
            </Card>

            <Card>
              <h3>Quick Links</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button $variant="secondary" $fullWidth onClick={() => navigate('/employee/jobs')}>
                  <Briefcase style={{ width: '18px', height: '18px' }} />
                  View All Jobs
                </Button>
                <Button $variant="secondary" $fullWidth>
                  <Globe style={{ width: '18px', height: '18px' }} />
                  Visit Website
                </Button>
              </div>
            </Card>
          </Sidebar>
        </ContentSection>
      </ProfileContainer>
    </DashboardLayout>
  );
};

export default EmployerProfileView;
