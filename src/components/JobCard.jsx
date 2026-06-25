import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Clock, Bookmark } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';


// Translate salary string based on language
const translateSalary = (salaryStr, language) => {
  if (language === 'vi') return salaryStr;
  return salaryStr
    .replace(/triệu VND/g, 'million VND')
    .replace(/\/ca/g, '/shift')
    .replace(/\/giờ/g, '/hr')
    .replace(/Thỏa thuận/g, 'Negotiable');
};

// Translate location string based on language
const translateLocation = (locationStr, language) => {
  if (language === 'vi') return locationStr;
  if (!locationStr) return locationStr;
  return locationStr
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
    .replace(/TP\.HCM/g, 'HCMC')
    .replace(/TP HCM/g, 'HCMC')
    .replace(/Hà Nội/g, 'Hanoi')
    .replace(/Đà Nẵng/g, 'Da Nang')
    .replace(/Cần Thơ/g, 'Can Tho')
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
    .replace(/Toàn quốc/g, 'Nationwide')
    .replace(/Toàn/g, 'All');
};

// Translate job titles
const translateJobTitle = (titleVi, language) => {
  if (language === 'vi') return titleVi;
  const titleMap = {
    'Nhân viên Bán Hàng': 'Sales Staff',
    'Nhân viên Văn Phòng': 'Office Staff',
    'Nhân viên Phục Vụ': 'Service Staff'
  };
  return titleMap[titleVi] || titleVi;
};

// Translate job type
const translateJobType = (typeVi, language) => {
  if (language === 'vi') return typeVi;
  const typeMap = {

    'Bán thời gian': 'Part-time',
    'Hợp đồng': 'Contract',
    'Thực tập': 'Internship'
  };
  return typeMap[typeVi] || typeVi;
};

// Translate job tags
const translateTag = (tagVi, language) => {
  if (language === 'vi') return tagVi;
  const tagMap = {
    'Bán hàng': 'Sales',
    'Giao tiếp': 'Communication',
    'Nhiệt tình': 'Enthusiastic',
    'Văn phòng': 'Office',
    'Word/Excel': 'Word/Excel',
    'Hành chính': 'Admin',
    'Phục vụ': 'Service',
    'F&B': 'F&B',
    'Ca làm linh động': 'Flexible Shifts'
  };
  return tagMap[tagVi] || tagVi;
};

// Translate time posted
const translatePostedAt = (timeStr, language) => {
  if (language === 'vi') return timeStr;
  return timeStr
    .replace(/ngày trước/g, 'days ago')
    .replace(/giờ trước/g, 'hours ago')
    .replace(/tuần trước/g, 'weeks ago')
    .replace(/tháng trước/g, 'months ago');
};

const CardWrapper = styled(motion.div)`
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.xl};
  border: 2px solid ${props => props.theme.colors.border};
  padding: 32px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.theme.shadows.card};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: ${props => props.theme.colors.primary};
    opacity: 0;
    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.theme.colors.primary};
    opacity: 0;
    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 0;
  }
  
  & > * {
    position: relative;
    z-index: 1;
  }
  
  &:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: 
      0 24px 60px ${props => props.theme.colors.primary}25,
      0 0 0 1px ${props => props.theme.colors.primary}30;
    border-color: ${props => props.theme.colors.primary}40;
    
    &::before {
      opacity: 1;
    }
    
    &::after {
      opacity: 0.05;
    }
  }
  
  &:active {
    transform: translateY(-10px) scale(1.01);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
`;

const CompanyLogo = styled(motion.div)`
  width: 72px;
  height: 72px;
  border-radius: ${props => props.theme.borderRadius.xl};
  background: ${props => props.$hasImage ? 'white' : props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 28px;
  flex-shrink: 0;
  box-shadow: 
    0 8px 24px ${props => props.theme.colors.primary}40,
    0 0 0 4px ${props => props.theme.colors.primary}15;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  ${CardWrapper}:hover & {
    transform: rotate(-5deg) scale(1.1);
    box-shadow: 
      0 12px 32px ${props => props.theme.colors.primary}50,
      0 0 0 6px ${props => props.theme.colors.primary}20;
  }
`;

const CardContent = styled.div`
  flex: 1;
  margin-left: 20px;
`;

const JobTitle = styled.h3`
  font-size: 22px;
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  margin-bottom: 8px;
  line-height: 1.3;
  letter-spacing: -0.5px;
  transition: color 0.3s ease;
  
  ${CardWrapper}:hover & {
    color: ${props => props.theme.colors.primary};
  }
`;

const CompanyName = styled.p`
  font-size: 16px;
  color: ${props => props.theme.colors.textLight};
  margin-bottom: 16px;
  font-weight: 600;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
`;

const Tag = styled(motion.span)`
  padding: 8px 16px;
  background: ${props => props.theme.colors.primary}12;
  color: ${props => props.theme.colors.primary};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 13px;
  font-weight: 700;
  border: 2px solid ${props => props.theme.colors.primary}25;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: ${props => props.theme.colors.primary}20;
    border-color: ${props => props.theme.colors.primary}50;
    transform: scale(1.05);
  }
`;

const JobDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid ${props => props.theme.colors.border};
`;

const DetailItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 600;
  transition: all 0.3s ease;
  
  svg {
    width: 18px;
    height: 18px;
    color: ${props => props.theme.colors.primary};
  }
  
  &:hover {
    color: ${props => props.theme.colors.text};
    transform: translateX(4px);
  }
`;

const BookmarkButton = styled(motion.button)`
  width: 48px;
  height: 48px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.$saved ? props.theme.colors.primary : `${props.theme.colors.bgDark}`};
  color: ${props => props.$saved ? 'white' : props.theme.colors.textLight};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  box-shadow: ${props => props.$saved ? `0 4px 12px ${props.theme.colors.primary}40` : 'none'};
  border: 2px solid ${props => props.$saved ? 'transparent' : props.theme.colors.border};
  
  &:hover {
    background: ${props => props.theme.colors.primary};
    color: white;
    transform: scale(1.15) rotate(10deg);
    box-shadow: 0 8px 20px ${props => props.theme.colors.primary}50;
    border-color: transparent;
  }
  
  &:active {
    transform: scale(1.05) rotate(5deg);
  }
  
  svg {
    width: 22px;
    height: 22px;
  }
`;

const JobCard = ({ job, onClick, onSave, saved = false }) => {
  const { language } = useLanguage();

  const handleSaveClick = (e) => {
    e.stopPropagation();
    onSave && onSave(job.id);
  };

  return (
    <CardWrapper
      onClick={() => onClick && onClick(job.id)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <CardHeader>
        <div style={{ display: 'flex', flex: 1 }}>
          <CompanyLogo
            $hasImage={false}
            whileHover={{ rotate: -10, scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            {job.company ? job.company.charAt(0).toUpperCase() : '?'}
          </CompanyLogo>
          <CardContent>
            <JobTitle>{translateJobTitle(job.title, language)}</JobTitle>
            <CompanyName>{job.company}</CompanyName>
            <TagsContainer>
              {job.tags && job.tags.map((tag, index) => (
                <Tag
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {translateTag(tag, language)}
                </Tag>
              ))}
            </TagsContainer>
          </CardContent>
        </div>
        <BookmarkButton
          onClick={handleSaveClick}
          $saved={saved}
          whileHover={{ scale: 1.15, rotate: 10 }}
          whileTap={{ scale: 1.05 }}
        >
          <Bookmark fill={saved ? 'white' : 'none'} />
        </BookmarkButton>
      </CardHeader>

      <JobDetails>
        <DetailItem whileHover={{ x: 4 }}>
          <MapPin />
          <span>{translateLocation(job.location, language)}</span>
        </DetailItem>
        <DetailItem whileHover={{ x: 4 }}>
          <span style={{ fontWeight: '500' }}>{language === 'vi' ? 'Thu nhập trung bình:' : 'Income:'}</span>
          <span>{translateSalary(job.salary, language)}</span>
        </DetailItem>
        {job.shift && (
          <DetailItem whileHover={{ x: 4 }}>
            <Clock />
            <span>{job.shift}</span>
          </DetailItem>
        )}
        <DetailItem whileHover={{ x: 4 }}>
          <Clock />
          <span>{translatePostedAt(job.postedAt, language)}</span>
        </DetailItem>
      </JobDetails>
    </CardWrapper>
  );
};

export default JobCard;
