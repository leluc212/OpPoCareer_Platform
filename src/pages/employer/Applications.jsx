import React, { useState, useMemo, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import TableFilter from '../../components/TableFilter';
import Modal from '../../components/Modal';
import { Eye, CheckCircle, Star, Mail, Phone, MapPin, Calendar, Award, Briefcase, FileText, Clock, Users, Newspaper, Edit, Trash2, TrendingUp, Plus, X, XCircle, Wallet, Banknote, AlertCircle, Save, Download, MessageSquare, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { initializeMultipleSampleCVs } from '../../utils/sampleCVGenerator';
import jobPostService from '../../services/jobPostService';
import applicationService from '../../services/applicationService';
import CVPreviewModal from '../../components/CVPreviewModal';
import DynamicTranslate from '../../components/DynamicTranslate';

/**
 * Format salary from DynamoDB — prevents double-appending VNĐ/h.
 * - Already has currency unit (VNĐ / VND / đ) → return as-is
 * - Raw number / numeric string → format as "X.XXX VNĐ/giờ"
 */
const formatSalaryFromDB = (raw, fallback = 'Thỏa thuận') => {
  if (!raw && raw !== 0) return fallback;
  const str = String(raw).trim();
  if (str.includes('VNĐ') || str.includes('VND') || str.includes('đ')) return str;
  const num = parseInt(str.replace(/\D/g, ''), 10);
  if (isNaN(num) || num === 0) return fallback;
  return `${num.toLocaleString('vi-VN')} VNĐ/giờ`;
};

// Mock job posts data
const getJobPosts = (language) => [
  {
    id: 1,
    title: language === 'vi' ? 'Cửa hàng trưởng' : 'Store Manager',
    location: language === 'vi' ? 'Quận 8, TP.HCM' : 'District 8, HCMC',
    salary: language === 'vi' ? '405.000 VNĐ' : '$27/day',
    type: language === 'vi' ? 'Bán thời gian' : 'Part-time',
    shift: '08:00 - 17:00',
    workDays: language === 'vi' ? '20/03/2026' : '03/20/2026',
    applicants: 12,
    views: 156,
    status: 'active',
    postedDate: language === 'vi' ? '5 ngày trước' : '5 days ago',
    deadline: language === 'vi' ? '15 ngày nữa' : '15 days left',
    description: language === 'vi'
      ? 'Chúng tôi đang tìm kiếm một Cửa hàng trưởng có kinh nghiệm để quản lý và điều hành cửa hàng. Bạn sẽ chịu trách nhiệm về doanh thu, quản lý nhân sự, đào tạo và phát triển đội ngũ, đồng thời đảm bảo chất lượng dịch vụ khách hàng.\n\nYêu cầu:\n• Kinh nghiệm tối thiểu 3 năm trong vị trí quản lý cửa hàng F&B\n• Kỹ năng lãnh đạo và quản lý đội ngũ xuất sắc\n• Khả năng phân tích số liệu doanh thu và lập kế hoạch kinh doanh\n• Kỹ năng giao tiếp và giải quyết vấn đề tốt\n• Ưu tiên ứng viên có kinh nghiệm trong chuỗi cà phê\n\nQuyền lợi:\n• Lương cơ bản: 15.000.000 VNĐ/tháng + thưởng KPI\n• Bảo hiểm xã hội đầy đủ\n• Thưởng theo doanh thu cửa hàng\n• Cơ hội thăng tiến rõ ràng'
      : 'We are looking for an experienced Store Manager to manage and operate the store. You will be responsible for revenue, staff management, training and development, while ensuring customer service quality.\n\nRequirements:\n• Minimum 3 years experience in F&B store management\n• Excellent leadership and team management skills\n• Ability to analyze revenue data and business planning\n• Good communication and problem-solving skills\n• Priority for candidates with coffee chain experience\n\nBenefits:\n• Base salary: $600/month + KPI bonus\n• Full social insurance\n• Bonus based on store revenue\n• Clear promotion opportunities'
  },
  {
    id: 2,
    title: language === 'vi' ? 'Nhân viên Pha Chế' : 'Barista',
    location: language === 'vi' ? 'Quận 1, TP.HCM' : 'District 1, HCMC',
    salary: language === 'vi' ? '280.000 VNĐ' : '$16/day',
    type: language === 'vi' ? 'Bán thời gian' : 'Part-time',
    shift: '07:00 - 15:00',
    workDays: language === 'vi' ? '18/03/2026' : '03/18/2026',
    applicants: 28,
    views: 342,
    status: 'active',
    postedDate: language === 'vi' ? '2 ngày trước' : '2 days ago',
    deadline: language === 'vi' ? '25 ngày nữa' : '25 days left',
    description: language === 'vi'
      ? 'Tìm kiếm nhân viên pha chế nhiệt tình, yêu thích cà phê để gia nhập đội ngũ. Công việc bao gồm pha chế các loại đồ uống, phục vụ khách hàng và duy trì vệ sinh khu vực làm việc.\n\nYêu cầu:\n• Ưu tiên có kinh nghiệm pha chế từ 1 năm trở lên\n• Chấp nhận fresher có đam mê\n• Nhiệt tình, thân thiện, chăm chỉ\n• Có thể làm việc theo ca\n\nQuyền lợi:\n• Lương: 8.000.000 VNĐ/tháng\n• Tips từ khách hàng\n• Được đào tạo kỹ năng pha chế chuyên nghiệp\n• Môi trường làm việc trẻ trung, năng động'
      : 'Looking for enthusiastic baristas who love coffee to join our team. Work includes preparing beverages, serving customers and maintaining workspace cleanliness.\n\nRequirements:\n• Priority for 1+ years barista experience\n• Accept passionate freshers\n• Enthusiastic, friendly, hardworking\n• Can work in shifts\n\nBenefits:\n• Salary: $320/month\n• Customer tips\n• Professional barista training\n• Young, dynamic work environment'
  },
  {
    id: 3,
    title: language === 'vi' ? 'Nhân viên Thu Ngân' : 'Cashier',
    location: language === 'vi' ? 'Quận 7, TP.HCM' : 'District 7, HCMC',
    salary: language === 'vi' ? '250.000 VNĐ' : '$10/day',
    type: language === 'vi' ? 'Bán thời gian' : 'Part-time',
    shift: '13:00 - 18:00',
    workDays: language === 'vi' ? '15/03/2026' : '03/15/2026',
    applicants: 15,
    views: 203,
    status: 'active',
    postedDate: language === 'vi' ? '1 tuần trước' : '1 week ago',
    deadline: language === 'vi' ? '20 ngày nữa' : '20 days left',
    description: language === 'vi'
      ? 'Tuyển thu ngân bán thời gian làm việc tại cửa hàng cà phê. Công việc chính là thu tiền, đối soát cuối ca và hỗ trợ các công việc khác khi cần.\n\nYêu cầu:\n• Trung thực, cẩn thận trong công việc\n• Có kỹ năng giao tiếp cơ bản\n• Có thể làm việc 4-6 giờ/ngày\n• Ưu tiên sinh viên, học sinh\n\nQuyền lợi:\n• Lương: 160.000 VNĐ\n• Linh hoạt thời gian làm việc\n• Môi trường thân thiện\n• Được hưởng đồ uống miễn phí trong ca'
      : 'Hiring part-time cashier to work at coffee shop. Main tasks include cash handling, end-of-shift reconciliation and other support when needed.\n\nRequirements:\n• Honest, careful in work\n• Basic communication skills\n• Can work 4-6 hours/day\n• Priority for students\n\nBenefits:\n• Salary: $2/hour\n• Flexible working hours\n• Friendly environment\n• Free drinks during shift'
  }
];

// Mock data generator (language-aware)
const getInitialApplications = (language) => [
  {
    id: 1,
    candidate: language === 'vi' ? 'Đỗ Hoàng Hiếu' : 'Do Hoang Hieu',
    job: language === 'vi' ? 'Cửa hàng trưởng' : 'Store Manager',
    applied: language === 'vi' ? '2 giờ trước' : '2 hours ago',
    status: 'pending',
    completed: false,
    marked: false,
    messagesDeleted: false,
    email: 'hieuseu@example.com',
    phone: '0123 456 789',
    location: language === 'vi' ? 'Quận 1, TP.HCM' : 'District 1, HCMC',
    experience: language === 'vi' ? '5 năm' : '5 years',
    education: language === 'vi' ? 'Đại học Kinh Tế' : 'University of Economics',
    skills: language === 'vi' ? ['Quản lý vận hành', 'Đào tạo nhân sự', 'Quản lý tồn kho', 'Pha chế', 'Chăm sóc khách hàng'] : ['Operations management', 'Staff training', 'Inventory management', 'Barista', 'Customer service'],
    bio: language === 'vi' ? 'Tôi có 5 năm kinh nghiệm quản lý các chuỗi F&B lớn. Làm việc với niềm đam mê và luôn muốn xây dựng văn hóa làm việc tích cực cho cửa hàng.' : 'I have 5 years of experience managing large F&B chains. Working with passion to build a positive store culture.',
    reviews: [
      { id: 1, employer: language === 'vi' ? 'Phúc Long Coffee & Tea' : 'Phuc Long Coffee & Tea', position: language === 'vi' ? 'Cửa hàng trưởng' : 'Store Manager', rating: 5, date: language === 'vi' ? 'Tháng 11/2024' : 'Nov 2024', comment: language === 'vi' ? 'Quản lý xuất sắc, luôn hoàn thành và vượt chỉ tiêu doanh thu. Thái độ làm việc rất chuyên nghiệp.' : 'Excellent manager, always exceeding revenue targets. Very professional attitude.' },
      { id: 2, employer: language === 'vi' ? 'The Coffee House' : 'The Coffee House', position: language === 'vi' ? 'Giám sát cửa hàng' : 'Store Supervisor', rating: 4, date: language === 'vi' ? 'Tháng 5/2023' : 'May 2023', comment: language === 'vi' ? 'Kỹ năng giải quyết tình huống tốt, training nhân viên hiệu quả. Cần hỗ trợ thêm về làm báo cáo.' : 'Good problem-solving skills, effective staff training. Needs some support with reporting.' },
    ]
  },
  {
    id: 2,
    candidate: language === 'vi' ? 'Phạm Lê Duy' : 'Duy san',
    job: language === 'vi' ? 'Nhân viên Thu Ngân' : 'Cashier',
    applied: language === 'vi' ? '5 giờ trước' : '5 hours ago',
    status: 'pending',
    completed: false,
    marked: false,
    messagesDeleted: false,
    email: 'duuyseu@example.com',
    phone: '0987 654 321',
    location: language === 'vi' ? 'Quận Bình Thạnh, TP.HCM' : 'Binh Thanh Dist., HCMC',
    experience: language === 'vi' ? '2 năm' : '2 years',
    education: language === 'vi' ? 'Cao đẳng Kinh tế' : 'College of Economics',
    skills: language === 'vi' ? ['Kế toán', 'Excel', 'Giao tiếp', 'Quản lý tiền mặt'] : ['Accounting', 'Excel', 'Communication', 'Cash handling'],
    bio: language === 'vi' ? 'Có kinh nghiệm làm việc tại các cửa hàng bán lẻ và nhà hàng. Cẩn thận, chính xác và trung thực.' : 'Experienced in retail and restaurant roles. Detail-oriented, accurate and honest.',
    reviews: [
      { id: 1, employer: language === 'vi' ? 'Siêu thị CoopMart' : 'CoopMart Supermarket', position: language === 'vi' ? 'Nhân viên Thu Ngân' : 'Cashier', rating: 4, date: language === 'vi' ? 'Tháng 8/2024' : 'Aug 2024', comment: language === 'vi' ? 'Cẩn thận, ít sai sót trong việc xử lý tiền mặt. Thái độ phục vụ tốt.' : 'Careful with cash handling, few errors. Good customer service attitude.' },
      { id: 2, employer: language === 'vi' ? 'Nhà hàng Hương Việt' : 'Huong Viet Restaurant', position: language === 'vi' ? 'Nhân viên Thu Ngân kiêm Lễ Tân' : 'Cashier & Receptionist', rating: 3, date: language === 'vi' ? 'Tháng 1/2023' : 'Jan 2023', comment: language === 'vi' ? 'Làm việc ổn định nhưng đôi khi cần nhắc nhở. Cần cải thiện tốc độ xử lý.' : 'Stable work but sometimes needs reminders. Speed of processing needs improvement.' },
    ]
  },
  {
    id: 3,
    candidate: 'Trần Phương Tuấn',
    job: language === 'vi' ? 'Nhân viên Pha Chế' : 'Barista',
    applied: language === 'vi' ? '1 ngày trước' : '1 day ago',
    status: 'approved',
    completed: false,
    marked: false,
    messagesDeleted: false,
    email: 'Trần Phương Tuấn@example.com',
    phone: '0909 123 456',
    location: language === 'vi' ? 'Quận 7, TP.HCM' : 'District 7, HCMC',
    experience: language === 'vi' ? '3 năm' : '3 years',
    education: language === 'vi' ? 'Trung cấp Ẩm thực' : 'Vocational Culinary School',
    skills: language === 'vi' ? ['Pha chế cà phê', 'Trà sữa', 'Cocktail', 'Latte Art', 'Phục vụ khách hàng'] : ['Coffee brewing', 'Bubble tea', 'Cocktail', 'Latte Art', 'Customer service'],
    bio: language === 'vi' ? 'Đam mê nghệ thuật pha chế và tạo ra những ly đồ uống hoàn hảo. Có chứng chỉ Barista quốc tế.' : 'Passionate about beverage crafting and creating perfect drinks. Holds an international Barista certificate.',
    reviews: [
      { id: 1, employer: language === 'vi' ? 'The Coffee House' : 'The Coffee House', position: language === 'vi' ? 'Barista chính' : 'Head Barista', rating: 5, date: language === 'vi' ? 'Tháng 9/2024' : 'Sep 2024', comment: language === 'vi' ? 'Tuyệt vời! Kỹ năng pha chế cực kỳ chuyên nghiệp, khách hàng rất hài lòng.' : 'Excellent! Extremely professional barista skills, customers loved the drinks.' },
      { id: 2, employer: language === 'vi' ? 'Highlands Coffee' : 'Highlands Coffee', position: 'Barista', rating: 5, date: language === 'vi' ? 'Tháng 3/2022' : 'Mar 2022', comment: language === 'vi' ? 'Nhân viên tốt bụng, nhanh nhẹn và luôn giữ vệ sinh khu vực làm việc sạch sẽ.' : 'Kind, agile and always kept the workspace clean.' },
    ]
  },
  {
    id: 4,
    candidate: 'Lê Tấn Lực',
    job: language === 'vi' ? 'Giám sát ca' : 'Shift Supervisor',
    applied: language === 'vi' ? '2 ngày trước' : '2 days ago',
    status: 'rejected',
    completed: false,
    marked: false,
    messagesDeleted: false,
    email: 'Lê Tấn Lựcseu@example.com',
    phone: '0901 234 567',
    location: language === 'vi' ? 'Quận Tân Bình, TP.HCM' : 'Tan Binh Dist., HCMC',
    experience: language === 'vi' ? '4 năm' : '4 years',
    education: language === 'vi' ? 'Cao đẳng Du lịch' : 'Tourism College',
    skills: language === 'vi' ? ['Quản lý ca', 'Giải quyết sự cố', 'Pha chế cà phê', 'Làm việc nhóm', 'Giao tiếp'] : ['Shift management', 'Problem solving', 'Coffee brewing', 'Teamwork', 'Communication'],
    bio: language === 'vi' ? 'Có kinh nghiệm giám sát ca tại nhiều cửa hàng cà phê lớn. Khả năng bao quát công việc, làm việc nhóm tốt và luôn đặt trải nghiệm khách hàng lên hàng đầu.' : 'Experienced in shift supervision at large coffee shops. Good teamwork and customer-first mindset.',
    reviews: [
      { id: 1, employer: language === 'vi' ? 'Highlands Coffee' : 'Highlands Coffee', position: language === 'vi' ? 'Trưởng ca' : 'Shift Leader', rating: 4, date: language === 'vi' ? 'Tháng 6/2024' : 'Jun 2024', comment: language === 'vi' ? 'Tác phong nhanh nhẹn, luôn hỗ trợ đồng nghiệp. Đôi khi hơi cứng nhắc trong giao tiếp với khách hàng.' : 'Agile and supportive of colleagues. Sometimes a bit rigid when communicating with customers.' },
    ]
  },
  {
    id: 5,
    candidate: 'Lê Minh Khang',
    job: language === 'vi' ? 'Nhân viên Phục Vụ' : 'Waiter/Server',
    applied: language === 'vi' ? '1 tuần trước' : '1 week ago',
    status: 'pending',
    completed: false,
    marked: false,
    messagesDeleted: false,
    email: 'Lê Minh Khangseu@example.com',
    phone: '0912 345 678',
    location: language === 'vi' ? 'Quận Gò Vấp, TP.HCM' : 'Go Vap Dist., HCMC',
    experience: language === 'vi' ? '1 năm' : '1 year',
    education: language === 'vi' ? 'Trung học phổ thông' : 'High School',
    skills: language === 'vi' ? ['Phục vụ bàn', 'Giao tiếp', 'Nhanh nhẹn', 'Làm việc nhóm'] : ['Table service', 'Communication', 'Fast-paced', 'Teamwork'],
    bio: language === 'vi' ? 'Nhiệt tình, vui vẻ và luôn sẵn sàng học hỏi. Có kinh nghiệm làm việc tại các nhà hàng buffet.' : 'Enthusiastic, friendly and eager to learn. Experienced in buffet restaurant service.',
    reviews: []
  },
];

const FILTER_OPTIONS = (language) => ([
  { value: 'today', label: language === 'vi' ? 'Hôm nay' : 'Today' },
  { value: 'week', label: language === 'vi' ? 'Tuần này' : 'This week' },
  { value: 'month', label: language === 'vi' ? 'Tháng này' : 'This month' },
]);

const ApplicationsContainer = styled(motion.div)`
`;

const PageHeader = styled.div`
  margin-bottom: 28px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
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

  svg {
    width: 22px;
    height: 22px;
    color: #1e40af;
  }
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

// --- Standard Jobs Section ---
const StandardJobsSection = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1.5px solid #E8EFFF;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  margin-bottom: 24px;
`;

const StandardJobsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StandardJobCard = styled(motion.button)`
  padding: 28px 24px;
  background: ${props => {
    const alpha = props.$active ? '20' : '08';
    return `linear-gradient(135deg, ${props.$color}${alpha} 0%, ${props.$color}05 100%)`;
  }};
  border: 2px solid ${props => props.$active ? props.$color : props.$color + '30'};
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${props => props.$color};
    transform: translateY(-4px);
    box-shadow: ${props => `0 12px 40px ${props.$color}25`};
    background: ${props => `linear-gradient(135deg, ${props.$color}25 0%, ${props.$color}10 100%)`};
  }
`;

const StandardJobIcon = styled.div`
  width: 64px;
  height: 64px;
  background: ${props => props.$color}20;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  ${StandardJobCard}:hover & {
    background: ${props => props.$color};
    
    svg {
      color: white;
    }
  }
  
  svg {
    width: 32px;
    height: 32px;
    color: ${props => props.$color};
    transition: color 0.3s ease;
  }
`;

const StandardJobLabel = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  text-align: center;
`;

const StandardJobDescription = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.theme.colors.textLight};
  text-align: center;
  line-height: 1.5;
`;

const EmptyState = styled(motion.div)`
  text-align: center;
  padding: 60px 20px;
  background: #ffffff;
  border-radius: 16px;
  border: 1.5px dashed #E2E8F0;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.05);

  .icon { font-size: 36px; margin-bottom: 12px; opacity: 0.5; }
  h3 { font-size: 18px; font-weight: 700; margin-bottom: 6px; color: ${props => props.theme.colors.text}; }
  p { font-size: 14px; color: ${props => props.theme.colors.textLight}; }
`;

// --- Job Posts Styles ---
const JobPostsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  align-items: stretch;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const JobPostCard = styled(motion.div)`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  
  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.13);
    transform: translateY(-4px);
  }
`;

const JobPostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex: 1;
`;

const JobPostTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 0;
  line-height: 1.3;
`;

const JobPostMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;
    
    svg {
      width: 16px;
      height: 16px;
      color: #1e40af;
      flex-shrink: 0;
    }
  }
`;

const JobPostStats = styled.div`
  display: flex;
  gap: 24px;
  padding: 20px;
  border-top: 1px solid #E8EFFF;
  border-bottom: 1px solid #E8EFFF;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  border-radius: 12px;
  
  .stat {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    flex: 1;
    
    .stat-value {
      font-size: 28px;
      font-weight: 800;
      color: #1e40af;
      line-height: 1;
    }
    
    .stat-label {
      font-size: 13px;
      color: ${props => props.theme.colors.textLight};
      font-weight: 600;
    }
  }
`;

const JobPostActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: auto;
`;

const JobPostButton = styled(motion.button)`
  flex: 1;
  padding: 12px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  white-space: nowrap;
  
  background: ${props => {
    if (props.$variant === 'primary') return 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)';
    if (props.$variant === 'danger') return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
    return 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)';
  }};
  
  color: ${props => props.$variant === 'primary' || props.$variant === 'danger' ? 'white' : '#1e40af'};
  border: 1.5px solid ${props => {
    if (props.$variant === 'primary') return '#1e40af';
    if (props.$variant === 'danger') return '#EF4444';
    return '#BFDBFE';
  }};
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => {
    if (props.$variant === 'primary') return '0 6px 16px rgba(30, 64, 175, 0.4)';
    if (props.$variant === 'danger') return '0 6px 16px rgba(239, 68, 68, 0.4)';
    return '0 6px 16px rgba(30, 64, 175, 0.2)';
  }};
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const JobStatusBadge = styled.div`
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  background: ${props => props.$status === 'active' ? '#D1FAE5' : '#F1F5F9'};
  color: ${props => props.$status === 'active' ? '#047857' : '#64748B'};
  border: 1.5px solid ${props => props.$status === 'active' ? '#10B981' : '#CBD5E1'};
  white-space: nowrap;
  letter-spacing: 0.3px;
`;

const JobTypeBadge = styled.div`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  background: ${props => props.$partTime ? '#FFF7ED' : '#EFF6FF'};
  color: ${props => props.$partTime ? '#C2410C' : '#1D4ED8'};
  border: 1.5px solid ${props => props.$partTime ? '#FDBA74' : '#BFDBFE'};
`;

// --- Section Header for Posts ---
const PostsSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 0;
  border-bottom: 2px solid #E8EFFF;
`;

const PostsSectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.theme.colors.primary};
  }
`;

const CreatePostButton = styled(motion.button)`
  padding: 12px 24px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  color: white;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// --- Card Grid ---
const CardGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AppCard = styled(motion.div)`
  background: #ffffff;
  border: 1.5px solid #E8EFFF;
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  /* left accent bar — always visible */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-radius: 16px 0 0 16px;
    background: ${props => {
    if (props.$status === 'approved') return '#10B981';
    if (props.$status === 'rejected') return '#EF4444';
    if (props.$status === 'completed') return '#1e40af';
    return '#F59E0B';
  }};
    opacity: 0.5;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: #1e40af;
    box-shadow: 0 12px 32px rgba(30, 64, 175, 0.15);
    transform: translateY(-4px);

    &::before {
      opacity: 1;
      width: 5px;
    }
  }
`;

const CandidateAvatar = styled.div`
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 12px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  color: #1e40af;
  transition: all 0.2s ease;

  ${AppCard}:hover & {
    background: #1e40af;
    color: white;
    border-color: #1e40af;
  }
`;

const CandidateInfo = styled.div`
  flex: 0 0 200px;
  min-width: 0;

  .name {
    font-size: 14.5px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 3px;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .position {
    font-size: 12.5px;
    color: ${props => props.theme.colors.textLight};
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const MetaChip = styled.div`
  flex: 0 0 130px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 12px;
  background: ${props => props.theme.colors.bgDark};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme.colors.textLight};
  white-space: nowrap;

  svg {
    width: 12px;
    height: 12px;
    color: #1e40af;
    opacity: 0.7;
    flex-shrink: 0;
  }
`;

const StatusCol = styled.div`
  flex: 0 0 120px;
  display: flex;
  justify-content: center;

  /* force badge to not wrap */
  span {
    white-space: nowrap;
  }
`;

const ActionsCol = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

const ActionButton = styled.button`
  padding: 8px 14px;
  border-radius: 9px;
  background: ${props =>
    props.$variant === 'success' ? '#10B981' :
      props.$variant === 'danger' ? '#EF4444' :
        props.$variant === 'warning' ? '#F59E0B' :
          '#1e40af'
  };
  color: white;
  font-size: 12.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;
  box-shadow: 0 2px 6px ${props =>
    props.$variant === 'success' ? 'rgba(16,185,129,0.22)' :
      props.$variant === 'danger' ? 'rgba(239,68,68,0.22)' :
        props.$variant === 'warning' ? 'rgba(245,158,11,0.22)' :
          'rgba(30,64,175,0.22)'
  };

  svg { width: 13px; height: 13px; }

  &:hover {
    filter: brightness(1.08);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${props =>
    props.$variant === 'success' ? 'rgba(16,185,129,0.32)' :
      props.$variant === 'danger' ? 'rgba(239,68,68,0.32)' :
        props.$variant === 'warning' ? 'rgba(245,158,11,0.32)' :
          'rgba(30,64,175,0.32)'
  };
  }

  &:active { transform: scale(0.97); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const MarkedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  background: #FEF3C7;
  color: #D97706;
  border: 1px solid #FCD34D;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  svg { width: 10px; height: 10px; }
`;

const ProfileHeader = styled.div`
  position: relative;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 45%, #1e40af 100%);
  padding: 36px 36px 48px;
  color: white;
  overflow: hidden;
  
  /* Decorative blobs */
  &::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -60px;
    width: 220px;
    height: 220px;
    background: radial-gradient(circle, rgba(96, 165, 250, 0.25) 0%, transparent 70%);
    border-radius: 50%;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -40px;
    left: 30%;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
    border-radius: 50%;
  }
`;

const ProfileAvatarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 1;
`;

const ProfileAvatar = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%);
  border: 2.5px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: white;
  letter-spacing: -1px;
  backdrop-filter: blur(8px);
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3);
`;

const ProfileHeaderInfo = styled.div`
  h2 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
  }
`;

const ProfileJobBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  
  svg {
    width: 14px;
    height: 14px;
    opacity: 0.8;
  }
`;

const ProfileContent = styled.div`
  padding: 0;
  margin-top: -16px;
  position: relative;
  z-index: 2;
`;

const ProfileInner = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: 16px 16px 0 0;
  padding: 28px 28px 8px;
`;

const ProfileSection = styled.div`
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  
  h3 {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 14px;
    color: ${props => props.theme.colors.textLight};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: ${props => props.theme.colors.border};
    }
    
    svg {
      width: 14px;
      height: 14px;
      color: ${props => props.theme.colors.primary};
    }
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

const InfoCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: ${props => props.theme.colors.bgDark};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.border};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary}30;
    background: #EFF6FF;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.08);
  }
`;

const InfoIconBox = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1e40af15, #3b82f620);
  border: 1px solid ${props => props.theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.theme.colors.primary};
  }
`;

const InfoItem = styled.div`
  flex: 1;
  min-width: 0;
  
  .label {
    font-size: 11px;
    font-weight: 600;
    color: ${props => props.theme.colors.textLight};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }
  
  .value {
    font-size: 14px;
    color: ${props => props.theme.colors.text};
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const SkillsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const SkillTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 7px 16px;
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  color: #1e40af;
  border: 1.5px solid #BFDBFE;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
    color: white;
    border-color: #1e40af;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
  }
`;

const BioText = styled.p`
  font-size: 14px;
  line-height: 1.7;
  color: ${props => props.theme.colors.textLight};
  background: ${props => props.theme.colors.bgDark};
  border-radius: 12px;
  padding: 16px;
  border: 1px solid ${props => props.theme.colors.border};
  border-left: 3px solid #1e40af;
  margin: 0;
`;

// --- Review styled components ---
const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ReviewCard = styled.div`
  background: ${props => props.theme.colors.bgDark};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 14px;
  padding: 16px 18px;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(30, 64, 175, 0.09);
    border-color: #BFDBFE;
  }
`;

const ReviewHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 12px;
`;

const ReviewEmployerInfo = styled.div`
  .employer-name {
    font-size: 14px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin-bottom: 2px;
  }
  .position-date {
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const StarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
`;

const StarIcon = styled.span`
  font-size: 16px;
  line-height: 1;
  color: ${props => props.$filled ? '#F59E0B' : '#E2E8F0'};
  filter: ${props => props.$filled ? 'drop-shadow(0 1px 2px rgba(245,158,11,0.4))' : 'none'};
`;

const RatingLabel = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #F59E0B;
  margin-left: 4px;
`;

const ReviewComment = styled.p`
  font-size: 13px;
  line-height: 1.6;
  color: ${props => props.theme.colors.textLight};
  margin: 0;
  font-style: italic;
`;

const EmptyReviews = styled.div`
  text-align: center;
  padding: 28px 16px;
  color: ${props => props.theme.colors.textLight};
  background: ${props => props.theme.colors.bgDark};
  border-radius: 12px;
  border: 1.5px dashed ${props => props.theme.colors.border};
  
  .icon { font-size: 28px; margin-bottom: 8px; }
  p { font-size: 13px; margin: 0; }
`;

// --- CV styled components ---
const CVCard = styled.div`
  background: white;
  border: 2px solid #E8EFFF;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 4px 16px rgba(30, 64, 175, 0.12);
    transform: translateY(-1px);
  }
`;

const CVIconBox = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  svg {
    width: 26px;
    height: 26px;
    color: white;
  }
`;

const CVInfo = styled.div`
  flex: 1;
  min-width: 0;

  .cv-name {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cv-meta {
    font-size: 12px;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const CVDownloadButton = styled(motion.button)`
  padding: 10px 18px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  color: white;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(30, 64, 175, 0.25);
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    box-shadow: 0 4px 14px rgba(30, 64, 175, 0.35);
    transform: translateY(-1px);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const EmptyCV = styled.div`
  text-align: center;
  padding: 32px 24px;
  background: #F8FAFC;
  border: 1.5px dashed #CBD5E1;
  border-radius: 14px;
  color: #64748b;

  .icon {
    font-size: 32px;
    margin-bottom: 10px;
    opacity: 0.5;
  }

  p {
    font-size: 13px;
    margin: 0;
    font-weight: 500;
  }
`;

const CVViewerContainer = styled.div`
  margin-top: 16px;
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid #E2E8F0;
  background: #F8FAFC;
`;

const CVViewerHeader = styled.div`
  padding: 12px 20px;
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 14px;

  button {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
`;

const CVViewerFrame = styled.iframe`
  width: 100%;
  height: 600px;
  border: none;
  background: white;
`;

const CVButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
`;

const CVViewButton = styled(motion.button)`
  flex: 1;
  padding: 12px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.25);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
    transform: translateY(-1px);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FeedbackSection = styled.div`
  margin-top: 24px;
  padding: 24px;
  background: #F8FAFC;
  border: 2px solid #E2E8F0;
  border-radius: 14px;
`;

const FeedbackHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;

  svg {
    width: 20px;
    height: 20px;
    color: #1e40af;
  }
`;

const FeedbackTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 14px;
  border: 2px solid #E2E8F0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #1e40af;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const FeedbackActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const FeedbackButton = styled(motion.button)`
  flex: 1;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  background: ${props =>
    props.$variant === 'approve' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' :
      props.$variant === 'reject' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' :
        'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)'
  };
  color: white;
  box-shadow: ${props =>
    props.$variant === 'approve' ? '0 3px 10px rgba(16, 185, 129, 0.25)' :
      props.$variant === 'reject' ? '0 3px 10px rgba(239, 68, 68, 0.25)' :
        '0 3px 10px rgba(30, 64, 175, 0.25)'
  };

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props =>
    props.$variant === 'approve' ? '0 4px 14px rgba(16, 185, 129, 0.35)' :
      props.$variant === 'reject' ? '0 4px 14px rgba(239, 68, 68, 0.35)' :
        '0 4px 14px rgba(30, 64, 175, 0.35)'
  };
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FeedbackMeta = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #E2E8F0;
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const OverallRatingBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  border: 1.5px solid #FCD34D;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  color: #92400E;
  margin-left: 8px;
`;

const HeaderRatingBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  padding: 5px 14px;
  background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(252,211,77,0.18));
  border: 1.5px solid rgba(252, 211, 77, 0.5);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  color: #FDE68A;
  backdrop-filter: blur(4px);
  
  .stars {
    display: flex;
    gap: 2px;
    align-items: center;
  }
  
  .star-char {
    font-size: 13px;
    line-height: 1;
  }
  
  .rating-text {
    margin-left: 2px;
    font-size: 13px;
    font-weight: 700;
  }
  
  .count-text {
    font-size: 11px;
    font-weight: 500;
    opacity: 0.8;
  }
`;

// Star rendering helper
const StarRating = ({ rating }) => (
  <StarRow>
    {[1, 2, 3, 4, 5].map(i => (
      <StarIcon key={i} $filled={i <= rating}>★</StarIcon>
    ))}
    <RatingLabel>{rating}/5</RatingLabel>
  </StarRow>
);

// Profile Detail Modal Component
const ProfileDetailModal = React.memo(({ candidate, onClose }) => {
  const { language } = useLanguage();
  const [showCVPreview, setShowCVPreview] = useState(false);

  const initials = candidate.candidate
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const avgRating = candidate.reviews && candidate.reviews.length > 0
    ? (candidate.reviews.reduce((s, r) => s + r.rating, 0) / candidate.reviews.length)
    : null;

  // Check if candidate has CV from S3
  const hasCV = candidate.cvUrl && candidate.cvUrl.trim() !== '';

  // State for feedback
  const [feedback, setFeedback] = useState(() => {
    const savedFeedback = localStorage.getItem(`feedback_${candidate.id}`);
    return savedFeedback ? JSON.parse(savedFeedback) : { note: '', date: null };
  });

  const handleCVView = () => {
    if (hasCV) {
      setShowCVPreview(true);
    }
  };

  const handleCVDownload = () => {
    if (!hasCV) return;

    // Open CV in new tab for download
    window.open(candidate.cvUrl, '_blank');
  };

  const handleSaveFeedback = () => {
    const updatedFeedback = {
      ...feedback,
      date: new Date().toISOString()
    };
    localStorage.setItem(`feedback_${candidate.id}`, JSON.stringify(updatedFeedback));
    setFeedback(updatedFeedback);
    alert(language === 'vi' ? 'Đã lưu ghi chú!' : 'Note saved!');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* COMMENTED OUT - Profile Header */}
      {/* <ProfileHeader>
        <ProfileAvatarRow>
          <ProfileAvatar>{initials}</ProfileAvatar>
          <ProfileHeaderInfo>
            <h2>{candidate.candidate}</h2>
            <ProfileJobBadge>
              <Briefcase />
              {language === 'vi' ? 'Ứng tuyển:' : 'Applied for:'} {candidate.job}
            </ProfileJobBadge>
            {avgRating !== null && (
              <HeaderRatingBadge>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} className="star-char" style={{ color: i <= Math.round(avgRating) ? '#FCD34D' : 'rgba(255,255,255,0.25)' }}>★</span>
                  ))}
                </div>
                <span className="rating-text">{avgRating.toFixed(1)}/5</span>
                <span className="count-text">({candidate.reviews.length} {language === 'vi' ? 'đánh giá' : 'reviews'})</span>
              </HeaderRatingBadge>
            )}
          </ProfileHeaderInfo>
        </ProfileAvatarRow>
      </ProfileHeader> */}

      <ProfileContent>
        <ProfileInner>
          {/* COMMENTED OUT - Contact Info */}
          {/* <ProfileSection>
            <h3><FileText /> {language === 'vi' ? 'Thông tin liên hệ' : 'Contact'}</h3>
            <InfoGrid>
              <InfoCard>
                <InfoIconBox><Mail /></InfoIconBox>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Email' : 'Email'}</div>
                  <div className="value">{candidate.email}</div>
                </InfoItem>
              </InfoCard>
              <InfoCard>
                <InfoIconBox><Phone /></InfoIconBox>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Điện thoại' : 'Phone'}</div>
                  <div className="value">{candidate.phone}</div>
                </InfoItem>
              </InfoCard>
              <InfoCard>
                <InfoIconBox><MapPin /></InfoIconBox>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Địa điểm' : 'Location'}</div>
                  <div className="value">{candidate.location}</div>
                </InfoItem>
              </InfoCard>
              <InfoCard>
                <InfoIconBox><Calendar /></InfoIconBox>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Thời gian ứng tuyển' : 'Applied'}</div>
                  <div className="value">{candidate.applied}</div>
                </InfoItem>
              </InfoCard>
            </InfoGrid>
          </ProfileSection> */}

          {/* COMMENTED OUT - Education & Experience */}
          {/* <ProfileSection>
            <h3><Award /> {language === 'vi' ? 'Học vấn & Kinh nghiệm' : 'Education & Experience'}</h3>
            <InfoGrid>
              <InfoCard>
                <InfoIconBox><Award /></InfoIconBox>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Trình độ học vấn' : 'Education'}</div>
                  <div className="value">{candidate.education}</div>
                </InfoItem>
              </InfoCard>
              <InfoCard>
                <InfoIconBox><Briefcase /></InfoIconBox>
                <InfoItem>
                  <div className="label">{language === 'vi' ? 'Kinh nghiệm' : 'Experience'}</div>
                  <div className="value">{candidate.experience}</div>
                </InfoItem>
              </InfoCard>
            </InfoGrid>
          </ProfileSection> */}

          {/* COMMENTED OUT - Skills */}
          {/* <ProfileSection>
            <h3><Star /> {language === 'vi' ? 'Kỹ năng' : 'Skills'}</h3>
            <SkillsWrap>
              {candidate.skills.map((skill, index) => (
                <SkillTag key={index}>{skill}</SkillTag>
              ))}
            </SkillsWrap>
          </ProfileSection> */}

          {/* COMMENTED OUT - Reviews */}
          {/* <ProfileSection>
            <h3><Star /> {language === 'vi' ? 'Lịch sử & Đánh giá' : 'History & Reviews'}</h3>
            {candidate.reviews && candidate.reviews.length > 0 ? (
              <ReviewList>
                {candidate.reviews.map(review => (
                  <ReviewCard key={review.id}>
                    <ReviewHeader>
                      <ReviewEmployerInfo>
                        <div className="employer-name">{review.employer}</div>
                        <div className="position-date">
                          <Briefcase size={11} />
                          {review.position}
                          <span>·</span>
                          <Calendar size={11} />
                          {review.date}
                        </div>
                      </ReviewEmployerInfo>
                      <StarRating rating={review.rating} />
                    </ReviewHeader>
                    <ReviewComment>"{review.comment}"</ReviewComment>
                  </ReviewCard>
                ))}
              </ReviewList>
            ) : (
              <EmptyReviews>
                <div className="icon">📋</div>
                <p>{language === 'vi' ? 'Chưa có đánh giá nào từ nhà tuyển dụng.' : 'No employer reviews yet.'}</p>
              </EmptyReviews>
            )}
          </ProfileSection> */}

          {/* COMMENTED OUT - Bio */}
          {/* <ProfileSection>
            <h3><FileText /> {language === 'vi' ? 'Giới thiệu bản thân' : 'About'}</h3>
            <BioText>{candidate.bio}</BioText>
          </ProfileSection> */}

          {/* ONLY SHOW CV SECTION */}
          <ProfileSection>
            <h3><FileText /> {language === 'vi' ? 'Hồ sơ CV' : 'CV Document'}</h3>
            {hasCV ? (
              <>
                <CVCard>
                  <CVIconBox>
                    <FileText />
                  </CVIconBox>
                  <CVInfo>
                    <div className="cv-name">{candidate.cvFileName || 'CV.pdf'}</div>
                    <div className="cv-meta">
                      <span>{language === 'vi' ? 'Từ ứng viên' : 'From candidate'}</span>
                      <span>•</span>
                      <span>{language === 'vi' ? 'Đã tải lên' : 'Uploaded'}</span>
                    </div>
                  </CVInfo>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <CVDownloadButton
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCVDownload}
                    >
                      <Eye />
                      {language === 'vi' ? 'Xem hồ sơ' : 'View CV'}
                    </CVDownloadButton>
                  </div>
                </CVCard>

                {showCVPreview && (
                  <CVPreviewModal
                    cvUrl={candidate.cvUrl}
                    fileName={candidate.cvFileName || 'CV.pdf'}
                    onClose={() => setShowCVPreview(false)}
                    onDownload={handleCVDownload}
                  />
                )}
              </>
            ) : (
              <EmptyCV>
                <div className="icon">📄</div>
                <p>{language === 'vi' ? 'Ứng viên chưa tải lên CV.' : 'Candidate has not uploaded CV yet.'}</p>
              </EmptyCV>
            )}
          </ProfileSection>
        </ProfileInner>
      </ProfileContent>
    </>
  );
});

ProfileDetailModal.displayName = 'ProfileDetailModal';

// Application Card Component
const ApplicationRow = React.memo(({
  app,
  onViewProfile,
  onCompleteJob,
  onMarkCandidate,
  onApprove,
  onReject,
  index = 0
}) => {
  const { language } = useLanguage();
  const initials = app.candidate
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const currentStatus = app.completed ? 'completed' : app.status;

  return (
    <AppCard
      $status={currentStatus}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2 }}
      layout
    >
      <CandidateAvatar>{initials}</CandidateAvatar>

      <CandidateInfo>
        <div className="name">
          {app.candidate}
          {app.marked && (
            <MarkedBadge><Star />{language === 'vi' ? 'Đã đánh dấu' : 'Marked'}</MarkedBadge>
          )}
        </div>
        <div className="position"><DynamicTranslate text={app.job} showIndicator={false} /></div>
      </CandidateInfo>

      <MetaChip><Clock />{app.applied}</MetaChip>

      <ActionsCol>
        <ActionButton onClick={() => onViewProfile(app)}>
          <Eye />{language === 'vi' ? 'Xem hồ sơ' : 'View'}
        </ActionButton>
      </ActionsCol>
    </AppCard>
  );
});

ApplicationRow.displayName = 'ApplicationRow';

// ─── Post Job Button ───────────────────────────────────────
const PostJobButton = styled(motion.button)`
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

  &:hover {
    background: #1e3a8a;
    box-shadow: 0 6px 18px rgba(30, 64, 175, 0.38);
    transform: translateY(-1px);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// ─── Wallet Verification Modal ─────────────────────────────
const WalletModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;
`;

const WalletModalContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  margin: auto;
  position: relative;
  z-index: 10000;
`;

const WalletModalIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;

  svg {
    width: 40px;
    height: 40px;
    color: #D97706;
  }
`;

const WalletModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  margin-bottom: 12px;
`;

const WalletModalMessage = styled.p`
  font-size: 15px;
  color: ${props => props.theme.colors.textLight};
  line-height: 1.6;
  margin-bottom: 32px;
`;

const WalletModalActions = styled.div`
  display: flex;
  gap: 12px;
`;

const WalletModalButton = styled(motion.button)`
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  background: ${props => props.$variant === 'primary' ? '#1e40af' : '#F1F5F9'};
  color: ${props => props.$variant === 'primary' ? 'white' : props.theme.colors.text};
  border: 1.5px solid ${props => props.$variant === 'primary' ? '#1e40af' : '#E2E8F0'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$variant === 'primary'
    ? '0 6px 20px rgba(30, 64, 175, 0.3)'
    : '0 4px 12px rgba(0, 0, 0, 0.1)'};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ─── Delete Confirmation Modal ─────────────────────────────
const DeleteModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;
`;

const DeleteModalContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  margin: auto;
  position: relative;
  z-index: 10000;
`;

const DeleteModalIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;

  svg {
    width: 40px;
    height: 40px;
    color: #EF4444;
  }
`;

const DeleteModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  margin-bottom: 12px;
`;

const DeleteModalMessage = styled.p`
  font-size: 15px;
  color: ${props => props.theme.colors.textLight};
  line-height: 1.6;
  margin-bottom: 8px;
`;

const DeleteModalJobTitle = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  background: #F8FAFC;
  padding: 12px 16px;
  border-radius: 12px;
  margin: 16px 0 24px;
  border: 2px solid #E2E8F0;
`;

const DeleteModalActions = styled.div`
  display: flex;
  gap: 12px;
`;

const DeleteModalButton = styled(motion.button)`
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid;

  ${props => props.$variant === 'danger' ? `
    background: #EF4444;
    color: white;
    border-color: #EF4444;
    &:hover:not(:disabled) {
      background: #DC2626;
      border-color: #DC2626;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
    }
  ` : `
    background: white;
    color: ${props.theme.colors.text};
    border-color: #E2E8F0;
    &:hover:not(:disabled) {
      background: #F8FAFC;
      border-color: #CBD5E1;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ─── Success Toast ─────────────────────────────────────────
const SuccessToast = styled(motion.div)`
  position: fixed;
  top: 24px;
  right: 24px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
  z-index: 1002;
  font-weight: 600;
  font-size: 15px;

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

const Applications = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('posts');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [applications, setApplications] = useState(() => getInitialApplications(language));
  const [realApplications, setRealApplications] = useState([]); // Real applications from DynamoDB
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [jobPosts, setJobPosts] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedJobView, setSelectedJobView] = useState(null);
  const [editJobId, setEditJobId] = useState(null);
  const [editJobData, setEditJobData] = useState(null);
  const [showCVModal, setShowCVModal] = useState(false);
  const [selectedCV, setSelectedCV] = useState(null);
  const [postTimeFilter, setPostTimeFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [postSearchTerm, setPostSearchTerm] = useState('');

  // Mock wallet connection status - in real app, get from user context or API
  const [isWalletConnected] = useState(() => {
    return localStorage.getItem('employer_wallet_connected') === 'true';
  });

  // Load job posts from DynamoDB
  useEffect(() => {
    const loadJobPosts = async () => {
      try {
        setIsLoadingJobs(true);
        console.log('📥 Loading job posts from DynamoDB...');

        // Get only employer's own jobs
        let jobs = await jobPostService.getMyJobPosts();
        console.log('✅ Loaded jobs:', jobs);

        // Transform DynamoDB data to match UI format
        const transformedJobs = jobs.map(job => ({
          id: job.idJob,
          idJob: job.idJob,
          title: job.title,
          location: job.location,
          salary: formatSalaryFromDB(job.salary, language === 'vi' ? 'Thỏa thuận' : 'Negotiable'),
          type: job.jobType === 'part-time' ? (language === 'vi' ? 'Bán thời gian' : 'Part-time') : (language === 'vi' ? 'Toàn thời gian' : 'Full-time'),
          shift: job.workHours,
          workDays: job.workDays,
          applicants: job.applicants || 0,
          views: job.views || 0,
          status: job.status,
          postedDate: formatDate(job.createdAt, language),
          _createdAt: job.createdAt,
          deadline: calculateDeadline(job.workDays, language),
          description: job.description,
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          benefits: job.benefits,
          tags: job.tags
        }));

        console.log('📦 Transformed jobs:', transformedJobs);
        setJobPosts(transformedJobs);
      } catch (error) {
        console.error('❌ Error loading job posts:', error);
        setJobPosts([]);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadJobPosts();
  }, [language]);

  // Helper function to format date
  const formatDate = (isoDate, lang) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return lang === 'vi' ? 'Hôm nay' : 'Today';
    if (diffDays === 1) return lang === 'vi' ? 'Hôm qua' : 'Yesterday';
    if (diffDays < 7) return lang === 'vi' ? `${diffDays} ngày trước` : `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return lang === 'vi' ? `${weeks} tuần trước` : `${weeks} weeks ago`;
    }
    return date.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US');
  };

  // Helper function to calculate deadline
  const calculateDeadline = (workDays, lang) => {
    const workDate = new Date(workDays);
    const now = new Date();
    const diffTime = workDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return lang === 'vi' ? 'Đã hết hạn' : 'Expired';
    if (diffDays === 0) return lang === 'vi' ? 'Hôm nay' : 'Today';
    if (diffDays === 1) return lang === 'vi' ? 'Ngày mai' : 'Tomorrow';
    return lang === 'vi' ? `${diffDays} ngày nữa` : `${diffDays} days left`;
  };

  useEffect(() => {
    setApplications(getInitialApplications(language));
  }, [language]);

  // Load real applications from DynamoDB when switching to applications tab
  useEffect(() => {
    const loadApplications = async () => {
      if (activeSection !== 'applications') return;

      try {
        setIsLoadingApplications(true);
        console.log('📥 Loading applications from DynamoDB...');

        // Get all applications for all employer's jobs
        const allApplications = [];

        for (const job of jobPosts) {
          try {
            const jobApplications = await applicationService.getJobApplications(job.idJob);
            allApplications.push(...jobApplications);
          } catch (error) {
            console.error(`Error loading applications for job ${job.idJob}:`, error);
          }
        }

        console.log('✅ Loaded applications:', allApplications);

        // Transform to UI format
        const transformedApplications = allApplications.map(app => ({
          id: app.applicationId,
          applicationId: app.applicationId,
          candidate: app.candidateEmail || 'Unknown',
          candidateId: app.candidateId,
          candidateEmail: app.candidateEmail,
          job: app.jobTitle || 'Unknown Position',
          jobId: app.jobId,
          applied: new Date(app.appliedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US'),
          status: app.status || 'pending',
          cvUrl: app.cvUrl,
          cvFileName: app.cvFilename || 'CV.pdf',
          email: app.candidateEmail,
          phone: '-',
          location: '-',
          education: '-',
          experience: '-',
          skills: [],
          bio: '-',
          reviews: [],
          marked: false
        }));

        setRealApplications(transformedApplications);
        console.log('✅ Transformed applications:', transformedApplications);
      } catch (error) {
        console.error('❌ Error loading applications:', error);
        setRealApplications([]);
      } finally {
        setIsLoadingApplications(false);
      }
    };

    if (jobPosts.length > 0) {
      loadApplications();
    }
  }, [activeSection, jobPosts, language]);

  // Comprehensive screenshot prevention
  useEffect(() => {
    let blurTimeout;

    const handleBlur = () => {
      const container = document.querySelector('[data-secure]');
      if (container) container.classList.add('blurred');
    };

    const handleFocus = () => {
      clearTimeout(blurTimeout);
      blurTimeout = setTimeout(() => {
        const container = document.querySelector('[data-secure]');
        if (container) container.classList.remove('blurred');
      }, 100);
    };

    const handleVisibilityChange = () => {
      document.hidden ? handleBlur() : handleFocus();
    };

    const handleKeyDown = (e) => {
      const shouldBlock =
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) ||
        (e.metaKey && e.shiftKey && e.key === 's') ||
        (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '5'));

      if (shouldBlock) {
        e.preventDefault();
        handleBlur();
        alert(language === 'vi'
          ? '🚫 Chụp màn hình bị vô hiệu hóa vì lý do bảo mật!'
          : '🚫 Screenshots are disabled for security reasons!');
        setTimeout(handleFocus, 2000);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(blurTimeout);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [language]);

  // Initialize sample CVs for demo
  useEffect(() => {
    const initCVs = async () => {
      try {
        await initializeMultipleSampleCVs();
      } catch (error) {
        console.error('Failed to initialize sample CVs:', error);
      }
    };
    initCVs();
  }, []);

  // Auto-open profile modal if candidateId is passed via navigation state
  useEffect(() => {
    if (location.state?.candidateId) {
      // Search in both mock and real applications
      const allApps = [...applications, ...realApplications];
      const candidate = allApps.find(app => app.id === location.state.candidateId);
      
      if (candidate) {
        // First switch to applications tab
        setActiveSection('applications');

        // Then open modal after a brief delay for smooth transition
        setTimeout(() => {
          setSelectedCandidate(candidate);
        }, 300);

        // Clear the state after opening to prevent re-opening on refresh
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        // For notification fallback - if no specific candidate ID, just show applications tab
        if (location.state?.fromNotifications) {
          setActiveSection('applications');
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    } else if (location.state?.fromNotifications) {
      // Just switch the tab if coming from notifications without specific candidate
      setActiveSection('applications');
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      // By default it starts on posts, which might be what they wanted but let's handle if it comes from notification and we want applications to be default
      if (location.state?.fromNotifications) {
          setActiveSection('applications');
          navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, applications, realApplications, navigate, location.pathname]);

  const filteredApplications = useMemo(() => {
    const applicationsToFilter = realApplications.length > 0 ? realApplications : applications;

    const toHours = (applied = '') => {
      const s = applied.toLowerCase();
      if (s.includes('phút') || s.includes('minute')) { const m = s.match(/(\d+)/); return m ? parseInt(m[1]) / 60 : 0; }
      if (s.includes('giờ') || s.includes('hour')) { const m = s.match(/(\d+)/); return m ? parseInt(m[1]) : 0; }
      if (s.includes('ngày') || s.includes('day')) { const m = s.match(/(\d+)/); return m ? parseInt(m[1]) * 24 : 24; }
      if (s.includes('tuần') || s.includes('week')) { const m = s.match(/(\d+)/); return m ? parseInt(m[1]) * 24 * 7 : 24 * 7; }
      if (s.includes('tháng') || s.includes('month')) { const m = s.match(/(\d+)/); return m ? parseInt(m[1]) * 24 * 30 : 24 * 30; }
      return 0;
    };

    return applicationsToFilter.filter(app => {
      // Search: tên ứng viên hoặc vị trí
      const matchesSearch = !searchTerm ||
        app.candidate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job.toLowerCase().includes(searchTerm.toLowerCase());

      // Time filter (single select)
      const hours = toHours(app.applied || app.appliedAt);
      const matchesTime =
        timeFilter === 'all' ? true :
          timeFilter === 'today' ? hours < 24 :
            timeFilter === 'week' ? hours < 24 * 7 :
              timeFilter === 'month' ? hours < 24 * 30 : true;

      // Status filter (single select)
      const matchesStatus =
        statusFilter === 'all' ? true :
          statusFilter === 'pending' ? app.status === 'pending' :
            statusFilter === 'approved' ? app.status === 'approved' :
              statusFilter === 'rejected' ? app.status === 'rejected' : true;

      return matchesSearch && matchesTime && matchesStatus;
    });
  }, [applications, realApplications, searchTerm, timeFilter, statusFilter]);

  const handleFilterToggle = useCallback(() => { }, []);

  const handleCompleteJob = useCallback((id) => {
    setApplications(prev => prev.map(app =>
      app.id === id
        ? { ...app, completed: true, status: 'completed', messagesDeleted: true }
        : app
    ));
  }, []);

  const handleMarkCandidate = useCallback((id) => {
    setApplications(prev => prev.map(app =>
      app.id === id ? { ...app, marked: !app.marked } : app
    ));
  }, []);

  const handleApproveApplication = useCallback((id) => {
    setApplications(prev => prev.map(app =>
      app.id === id ? { ...app, status: 'approved' } : app
    ));
  }, []);

  const handleRejectApplication = useCallback((id) => {
    setApplications(prev => prev.map(app =>
      app.id === id ? { ...app, status: 'rejected' } : app
    ));
  }, []);

  const handleViewProfile = useCallback((candidate) => {
    setSelectedCandidate(candidate);
  }, []);

  const handleCloseProfile = useCallback(() => {
    setSelectedCandidate(null);
  }, []);

  // Open delete confirmation modal
  const handleDeleteJob = (jobId) => {
    setDeleteJobId(jobId);
  };

  // Confirm and delete job post
  const confirmDeleteJob = async () => {
    if (!deleteJobId) return;

    setIsDeleting(true);

    try {
      // Find the job to get its idJob
      const job = jobPosts.find(j => j.id === deleteJobId);
      const jobId = job?.idJob || job?.id;

      console.log('🗑️ Deleting job:', jobId);

      // Delete from DynamoDB
      await jobPostService.deleteJobPost(jobId);

      // Remove job from state
      setJobPosts(prev => prev.filter(job => job.id !== deleteJobId));

      // Show success toast
      setSuccessMessage(language === 'vi' ? 'Đã xóa bài đăng thành công!' : 'Post deleted successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      console.log('✅ Job deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting job:', error);
      setSuccessMessage(language === 'vi' ? 'Lỗi khi xóa bài đăng!' : 'Error deleting post!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } finally {
      setIsDeleting(false);
      setDeleteJobId(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteJobId(null);
  };

  // Get job title for delete confirmation
  const jobToDelete = deleteJobId ? jobPosts.find(job => job.id === deleteJobId) : null;

  // Filter job posts by time and search
  const filteredJobPosts = useMemo(() => {
    const now = new Date();

    // Parse postedDate → Date object (handles both ISO timestamp and relative string)
    const toDate = (post) => {
      // Real data: has _createdAt ISO string
      if (post._createdAt) return new Date(post._createdAt);
      // Mock data: relative string like "5 ngày trước", "2 days ago"
      const s = (post.postedDate || '').toLowerCase();
      const m = s.match(/(\d+)/);
      const n = m ? parseInt(m[1]) : 1;
      if (s.includes('phút') || s.includes('minute')) return new Date(now - n * 60 * 1000);
      if (s.includes('giờ') || s.includes('hour')) return new Date(now - n * 3600 * 1000);
      if (s.includes('ngày') || s.includes('day')) return new Date(now - n * 86400 * 1000);
      if (s.includes('tuần') || s.includes('week')) return new Date(now - n * 7 * 86400 * 1000);
      if (s.includes('tháng') || s.includes('month')) return new Date(now - n * 30 * 86400 * 1000);
      return new Date(0);
    };

    return jobPosts.filter(post => {
      if (postSearchTerm) {
        const term = postSearchTerm.toLowerCase();
        if (!post.title?.toLowerCase().includes(term) && !post.location?.toLowerCase().includes(term)) return false;
      }
      if (postTimeFilter === 'all') return true;
      const diffDays = (now - toDate(post)) / (1000 * 60 * 60 * 24);
      if (postTimeFilter === 'today') return diffDays < 1;
      if (postTimeFilter === 'week') return diffDays < 7;
      if (postTimeFilter === 'month') return diffDays < 30;
      return true;
    });
  }, [jobPosts, postTimeFilter, postSearchTerm]);

  // View job details
  const handleViewJob = (jobId) => {
    const job = jobPosts.find(j => j.id === jobId);
    if (job) setSelectedJobView(job);
  };

  // Edit job
  const handleEditJob = (jobId) => {
    const job = jobPosts.find(j => j.id === jobId);
    if (job) {
      // Navigate to PostJob page with job data
      navigate('/employer/post-job', { state: { job } });
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditJobId(null);
    setEditJobData(null);
  };

  return (
    <DashboardLayout role="employer" key={language}>
      <ApplicationsContainer
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <PageHeader>
          <PageTitleGroup>
            <PageIconBox><Briefcase /></PageIconBox>
            <PageTitleText>
              <h1>{language === 'vi' ? 'Công việc tiêu chuẩn' : 'Standard Jobs'}</h1>
              <p>{language === 'vi' ? 'Quản lý bài đăng và hồ sơ cho công việc tiêu chuẩn (không bao gồm tuyển gấp)' : 'Manage posts and applications for standard jobs (excluding quick jobs)'}</p>
            </PageTitleText>
          </PageTitleGroup>
        </PageHeader>

        {/* Standard Jobs Section */}
        <StandardJobsSection>
          <StandardJobsGrid>
            <StandardJobCard
              $color="#10B981"
              $active={activeSection === 'posts'}
              onClick={() => setActiveSection('posts')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <StandardJobIcon $color="#10B981">
                <FileText />
              </StandardJobIcon>
              <StandardJobLabel>{language === 'vi' ? 'Quản lý bài đăng' : 'Post Management'}</StandardJobLabel>
              <StandardJobDescription>
                {language === 'vi' ? 'Quản lý các bài đăng tuyển dụng tiêu chuẩn' : 'Manage standard job postings'}
              </StandardJobDescription>
            </StandardJobCard>

            <StandardJobCard
              $color="#1e40af"
              $active={activeSection === 'applications'}
              onClick={() => setActiveSection('applications')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <StandardJobIcon $color="#1e40af">
                <Users />
              </StandardJobIcon>
              <StandardJobLabel>{language === 'vi' ? 'Hồ sơ ứng tuyển' : 'Applications'}</StandardJobLabel>
              <StandardJobDescription>
                {language === 'vi' ? 'Xem và quản lý hồ sơ ứng viên tiêu chuẩn' : 'View and manage standard job applications'}
              </StandardJobDescription>
            </StandardJobCard>
          </StandardJobsGrid>
        </StandardJobsSection>

        {/* Job Posts Section - Only visible when activeSection is 'posts' */}
        {activeSection === 'posts' && (
          <>
            <PostsSectionHeader>
              <PostsSectionTitle>
                <Newspaper />
                {language === 'vi' ? 'Các bài đăng tuyển dụng' : 'Job Postings'}
              </PostsSectionTitle>
              <CreatePostButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/employer/post-job')}
              >
                <Plus />
                {language === 'vi' ? 'Đăng bài mới' : 'Post New Job'}
              </CreatePostButton>
            </PostsSectionHeader>

            {/* Filter bar for job posts */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm theo tên việc, địa điểm...' : 'Search by title, location...'}
                value={postSearchTerm}
                onChange={e => setPostSearchTerm(e.target.value)}
                style={{
                  flex: 1, minWidth: '180px', padding: '8px 14px', borderRadius: '8px',
                  border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none',
                  background: '#f8fafc', color: '#1e293b'
                }}
              />
              {['all', 'today', 'week', 'month'].map(f => (
                <button
                  key={f}
                  onClick={() => setPostTimeFilter(f)}
                  style={{
                    padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                    border: '1.5px solid',
                    borderColor: postTimeFilter === f ? '#1e40af' : '#e2e8f0',
                    background: postTimeFilter === f ? '#1e40af' : '#f8fafc',
                    color: postTimeFilter === f ? '#fff' : '#64748b',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {f === 'all' ? (language === 'vi' ? 'Tất cả' : 'All')
                    : f === 'today' ? (language === 'vi' ? 'Hôm nay' : 'Today')
                      : f === 'week' ? (language === 'vi' ? 'Tuần này' : 'This week')
                        : (language === 'vi' ? 'Tháng này' : 'This month')}
                </button>
              ))}
            </div>

            {isLoadingJobs ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div style={{ fontSize: '14px' }}>{language === 'vi' ? 'Đang tải...' : 'Loading...'}</div>
              </div>
            ) : jobPosts.length === 0 ? (
              <EmptyState
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="icon">📋</div>
                <h3>{language === 'vi' ? 'Chưa có bài đăng nào' : 'No job posts yet'}</h3>
                <p>{language === 'vi' ? 'Bấm "Đăng bài mới" để tạo bài đăng tuyển dụng đầu tiên' : 'Click "Post New Job" to create your first job posting'}</p>
              </EmptyState>
            ) : filteredJobPosts.length === 0 ? (
              <EmptyState
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="icon">🔍</div>
                <h3>{language === 'vi' ? 'Không tìm thấy bài đăng phù hợp' : 'No matching posts found'}</h3>
                <p>{language === 'vi' ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm' : 'Try changing the filter or search term'}</p>
              </EmptyState>
            ) : (
              <JobPostsGrid>
                <AnimatePresence>
                  {filteredJobPosts.map((post, index) => (
                    <JobPostCard
                      key={post.id}
                      $status={post.status}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <JobPostHeader>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <JobPostTitle><DynamicTranslate text={post.title} showIndicator={false} /></JobPostTitle>
                            <JobStatusBadge $status={post.status}>
                              {post.status === 'active'
                                ? (language === 'vi' ? 'Đang tuyển' : 'Active')
                                : (language === 'vi' ? 'Đã đóng' : 'Closed')}
                            </JobStatusBadge>
                          </div>
                          <JobPostMeta>
                            <div className="meta-item">
                              <MapPin /> <DynamicTranslate text={post.location} showIndicator={false} />
                            </div>
                            <div className="meta-item">
                              <Wallet size={15} style={{ strokeWidth: 1.5 }} />{post.salary}
                            </div>
                            {post.shift && (
                              <div className="meta-item">
                                <Clock />{post.shift}
                              </div>
                            )}
                            {post.workDays && (
                              <div className="meta-item">
                                <Calendar />{language === 'vi' ? 'Ngày làm: ' : 'Work date: '}{post.workDays}
                              </div>
                            )}
                          </JobPostMeta>
                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <JobTypeBadge $partTime={post.type === 'Bán thời gian' || post.type === 'Part-time'}>
                              {(post.type === 'Bán thời gian' || post.type === 'Part-time') ? 'Part-time' : 'Full-time'}
                            </JobTypeBadge>
                            {post.postedDate && (
                              <span style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                fontSize: '12px', fontWeight: '600', color: '#1e40af',
                                background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                                borderRadius: '20px', padding: '4px 10px'
                              }}>
                                <Clock size={12} />
                                {language === 'vi' ? 'Đăng ' : 'Posted '}{post.postedDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </JobPostHeader>

                      <JobPostStats>
                        <div className="stat">
                          <div className="stat-value">{post.applicants}</div>
                          <div className="stat-label">{language === 'vi' ? 'Ứng viên' : 'Applicants'}</div>
                        </div>
                        <div className="stat">
                          <div className="stat-value">{post.views}</div>
                          <div className="stat-label">{language === 'vi' ? 'Lượt xem' : 'Views'}</div>
                        </div>
                      </JobPostStats>

                      <JobPostActions>
                        <JobPostButton
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleViewJob(post.id)}
                        >
                          <Eye />{language === 'vi' ? 'Xem mô tả' : 'View'}
                        </JobPostButton>
                        <JobPostButton
                          $variant="primary"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleEditJob(post.id)}
                        >
                          <Edit />{language === 'vi' ? 'Sửa' : 'Edit'}
                        </JobPostButton>
                        <JobPostButton
                          $variant="danger"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDeleteJob(post.id)}
                        >
                          <Trash2 />
                        </JobPostButton>
                      </JobPostActions>
                    </JobPostCard>
                  ))}
                </AnimatePresence>
              </JobPostsGrid>
            )}
          </>
        )}

        {activeSection === 'applications' && (
          <>
            {/* Filter bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm ứng viên, vị trí...' : 'Search candidate, position...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  flex: 1, minWidth: '180px', padding: '8px 14px', borderRadius: '8px',
                  border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none',
                  background: '#f8fafc', color: '#1e293b'
                }}
              />
              {['all', 'today', 'week', 'month'].map(f => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  style={{
                    padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                    border: '1.5px solid',
                    borderColor: timeFilter === f ? '#1e40af' : '#e2e8f0',
                    background: timeFilter === f ? '#1e40af' : '#f8fafc',
                    color: timeFilter === f ? '#fff' : '#64748b',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {f === 'all' ? (language === 'vi' ? 'Tất cả' : 'All')
                    : f === 'today' ? (language === 'vi' ? 'Hôm nay' : 'Today')
                      : f === 'week' ? (language === 'vi' ? 'Tuần này' : 'This week')
                        : (language === 'vi' ? 'Tháng này' : 'This month')}
                </button>
              ))}
            </div>

            {isLoadingApplications ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div style={{ fontSize: '14px' }}>{language === 'vi' ? 'Đang tải hồ sơ...' : 'Loading applications...'}</div>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  {language === 'vi' ? 'Chưa có hồ sơ ứng tuyển' : 'No applications yet'}
                </div>
                <div style={{ fontSize: '14px' }}>
                  {language === 'vi' ? 'Hồ sơ ứng tuyển sẽ hiển thị ở đây khi có ứng viên apply' : 'Applications will appear here when candidates apply'}
                </div>
              </div>
            ) : (
              <CardGrid>
                <AnimatePresence>
                  {filteredApplications.map((app, index) => (
                    <ApplicationRow
                      key={app.id}
                      app={app}
                      onViewProfile={handleViewProfile}
                      onCompleteJob={handleCompleteJob}
                      onMarkCandidate={handleMarkCandidate}
                      onApprove={handleApproveApplication}
                      onReject={handleRejectApplication}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </CardGrid>
            )}
          </>
        )}
      </ApplicationsContainer>

      {selectedCandidate && (
        <Modal
          isOpen={true}
          onClose={handleCloseProfile}
          size="large"
          noPadding={true}
        >
          <ProfileDetailModal
            candidate={selectedCandidate}
            onClose={handleCloseProfile}
          />
        </Modal>
      )}

      <AnimatePresence>
        {deleteJobId && jobToDelete && (
          <DeleteModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelDelete}
          >
            <DeleteModalContainer
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DeleteModalIcon>
                <AlertCircle />
              </DeleteModalIcon>
              <DeleteModalTitle>
                {language === 'vi' ? 'Xác nhận xóa bài đăng' : 'Confirm Delete Post'}
              </DeleteModalTitle>
              <DeleteModalMessage>
                {language === 'vi'
                  ? 'Bạn có chắc chắn muốn xóa bài đăng này? Hành động này không thể hoàn tác.'
                  : 'Are you sure you want to delete this post? This action cannot be undone.'}
              </DeleteModalMessage>
              <DeleteModalJobTitle>
                {jobToDelete.title}
              </DeleteModalJobTitle>
              <DeleteModalActions>
                <DeleteModalButton
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={cancelDelete}
                  disabled={isDeleting}
                >
                  <X />
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </DeleteModalButton>
                <DeleteModalButton
                  $variant="danger"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmDeleteJob}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Trash2 />
                      </motion.div>
                      {language === 'vi' ? 'Đang xóa...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <Trash2 />
                      {language === 'vi' ? 'Xóa bài đăng' : 'Delete Post'}
                    </>
                  )}
                </DeleteModalButton>
              </DeleteModalActions>
            </DeleteModalContainer>
          </DeleteModalOverlay>
        )}

        {showSuccessToast && (
          <SuccessToast
            initial={{ opacity: 0, y: -20, x: 100 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <CheckCircle />
            {successMessage}
          </SuccessToast>
        )}
      </AnimatePresence>

      {/* View Job Modal */}
      {selectedJobView && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedJobView(null)}
          title={language === 'vi' ? 'Chi tiết bài đăng' : 'Job Post Details'}
          size="large"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>
                {selectedJobView.title}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                  <MapPin size={16} />
                  <span>{selectedJobView.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                  <span style={{ fontWeight: '500' }}>{language === 'vi' ? 'Thu nhập trung bình:' : 'Income:'}</span>
                  <span>{selectedJobView.salary}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                  <Briefcase size={16} />
                  <span>{selectedJobView.type}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                  <Calendar size={16} />
                  <span>{language === 'vi' ? 'Hết hạn: ' : 'Deadline: '}{selectedJobView.deadline}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>
                  {selectedJobView.applicants}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {language === 'vi' ? 'Ứng viên' : 'Applicants'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>
                  {selectedJobView.views}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {language === 'vi' ? 'Lượt xem' : 'Views'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#10b981', background: '#d1fae5', padding: '4px 12px', borderRadius: '20px', display: 'inline-block', marginBottom: '4px' }}>
                  {selectedJobView.status === 'active' ? (language === 'vi' ? 'Đang tuyển' : 'Active') : (language === 'vi' ? 'Đóng' : 'Closed')}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {language === 'vi' ? 'Trạng thái' : 'Status'}
                </div>
              </div>
            </div>

            {selectedJobView.description && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} />
                  {language === 'vi' ? 'Mô tả công việc' : 'Job Description'}
                </h4>
                <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-line', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {selectedJobView.description}
                </div>
              </div>
            )}

            {selectedJobView.responsibilities && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={18} />
                  {language === 'vi' ? 'Trách nhiệm công việc' : 'Job Responsibilities'}
                </h4>
                <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-line', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {selectedJobView.responsibilities}
                </div>
              </div>
            )}

            {selectedJobView.requirements && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} />
                  {language === 'vi' ? 'Yêu cầu ứng viên' : 'Requirements'}
                </h4>
                <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-line', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {selectedJobView.requirements}
                </div>
              </div>
            )}

            {selectedJobView.benefits && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={18} />
                  {language === 'vi' ? 'Quyền lợi' : 'Benefits'}
                </h4>
                <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-line', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {selectedJobView.benefits}
                </div>
              </div>
            )}

            <div style={{ fontSize: '13px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              {language === 'vi' ? 'Đăng ' : 'Posted '}{selectedJobView.postedDate}
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Job Modal */}
      {editJobId && editJobData && (
        <Modal
          isOpen={true}
          onClose={handleCancelEdit}
          title={language === 'vi' ? 'Chỉnh sửa bài đăng' : 'Edit Job Post'}
          size="large"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                {language === 'vi' ? 'Tiêu đề' : 'Title'}
              </label>
              <input
                type="text"
                value={editJobData.title || ''}
                onChange={(e) => setEditJobData({ ...editJobData, title: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                  {language === 'vi' ? 'Địa điểm' : 'Location'}
                </label>
                <input
                  type="text"
                  value={editJobData.location || ''}
                  onChange={(e) => setEditJobData({ ...editJobData, location: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                  {language === 'vi' ? 'Mức lương trung bình' : 'Salary'}
                </label>
                <input
                  type="text"
                  value={editJobData.salary || ''}
                  onChange={(e) => setEditJobData({ ...editJobData, salary: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                  {language === 'vi' ? 'Loại hình' : 'Type'}
                </label>
                <input
                  type="text"
                  value={editJobData.type || ''}
                  onChange={(e) => setEditJobData({ ...editJobData, type: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                  {language === 'vi' ? 'Hết hạn' : 'Deadline'}
                </label>
                <input
                  type="text"
                  value={editJobData.deadline || ''}
                  onChange={(e) => setEditJobData({ ...editJobData, deadline: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                <FileText size={16} />
                {language === 'vi' ? 'Mô tả công việc & Phúc lợi' : 'Job Description & Benefits'}
              </label>
              <textarea
                value={editJobData.description || ''}
                onChange={(e) => setEditJobData({ ...editJobData, description: e.target.value })}
                placeholder={language === 'vi' ? 'Nhập mô tả công việc chi tiết, yêu cầu và quyền lợi...' : 'Enter detailed job description, requirements and benefits...'}
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  lineHeight: '1.6',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelEdit}
                style={{ padding: '12px 24px', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'white', color: '#334155', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveEdit}
                style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={16} />
                {language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}
              </motion.button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Applications;
