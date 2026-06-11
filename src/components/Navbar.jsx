import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Bell, Search, LogOut, User, Users, Briefcase, DollarSign, AlertCircle, Settings, Eye, CheckCircle, Star, UserPlus, History, Building2, Tag as TagIcon, Package, Zap, XCircle, MessageSquare, Send, Trash2, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import candidateProfileService from '../services/candidateProfileService';
import employerProfileService from '../services/employerProfileService';
import jobPostService from '../services/jobPostService';
import { getNotifications, markAsRead, markAllAsRead, createChatMessageNotification } from '../services/notificationService';
import RelativeTime from './RelativeTime';
import { s3Images } from '../utils/s3Images';
import { getIdToken } from '../services/authHeaders';

const NavbarContainer = styled.nav`
  height: 80px;
  background: ${props => props.theme.colors.bgLight};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  background: ${props => props.theme.colors.bgLight}98;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
  overflow: visible;
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 28px;
  flex: 1;
  overflow: visible;
`;

const SearchBar = styled.div`
  position: relative;
  max-width: 500px;
  width: 100%;
  overflow: visible;
  
  input {
    width: 100%;
    padding: 14px 20px 14px 52px;
    border: 2px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.full};
    background: ${props => props.theme.colors.bgLight};
    color: ${props => props.theme.colors.text};
    font-size: 15px;
    font-weight: 500;
    transition: all ${props => props.theme.transitions.normal};
    
    &:focus {
      border-color: ${props => props.theme.colors.primary};
      box-shadow: 0 0 0 4px ${props => props.theme.colors.primary}15, 0 8px 16px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }
    
    &::placeholder {
      color: ${props => props.theme.colors.textLight};
    }
  }
  
  > svg {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: ${props => props.theme.colors.primary};
    opacity: 0.7;
    cursor: pointer;
    transition: all ${props => props.theme.transitions.normal};
    
    &:hover {
      color: ${props => props.theme.colors.primary};
      opacity: 1;
      transform: translateY(-50%) scale(1.1);
    }
  }
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SearchSuggestionDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.bgLight};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: 0 12px 40px rgba(0,0,0,0.18);
  z-index: 9999;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px 0;
  animation: slideDown 0.15s ease-out;

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 2px;
  }
`;

const SearchSuggestionItem = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: ${props => props.theme.colors.text};
  transition: background 0.15s;

  &:hover {
    background: ${props => props.theme.colors.bgDark};
    color: ${props => props.theme.colors.primary};
  }

  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.theme.colors.textLight};
    flex-shrink: 0;
  }

  .sub {
    font-size: 11px;
    color: ${props => props.theme.colors.textLight};
    margin-left: auto;
  }
`;

const SearchSuggestionHeader = styled.div`
  padding: 4px 16px 6px;
  font-size: 10px;
  font-weight: 800;
  color: ${props => props.theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const IconButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.theme.colors.bgDark};
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all ${props => props.theme.transitions.normal};
  border: 2px solid transparent;
  
  &:hover {
    background: ${props => props.theme.colors.gradientPrimary};
    color: white;
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => props.theme.colors.primary};
  }
  
  svg {
    width: 22px;
    height: 22px;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: #e41e3f;
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${props => props.theme.colors.bgLight};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  line-height: 1;
`;

const NotificationDropdown = styled.div`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 400px;
  max-height: 600px;
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  z-index: 1000;
  animation: slideDown 0.2s ease-out;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ChatDropdown = styled.div`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 320px;
  max-height: 400px;
  background: ${props => props.theme.colors.bgLight};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideDown 0.2s ease-out;
`;

const ChatDropdownHeader = styled.div`
  padding: 12px 16px;
  font-weight: 700;
  font-size: 15px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text};
`;

const ChatDropdownList = styled.div`
  overflow-y: auto;
  flex: 1;
  max-height: 340px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 3px;
  }
`;

const DeleteChatButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.textLight};
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
  
  &:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
`;

const ChatDropdownItem = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  transition: background 0.2s;
  
  &:hover {
    background: ${props => props.theme.colors.bgDark};
    
    ${DeleteChatButton} {
      opacity: 1;
    }
  }
  &:last-child {
    border-bottom: none;
  }
`;

const ChatDropdownAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme.colors.gradientPrimary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  text-transform: uppercase;
`;

const ChatDropdownInfo = styled.div`
  flex: 1;
  min-width: 0;
  
  .name {
    font-weight: 600;
    font-size: 13.5px;
    color: ${props => props.theme.colors.text};
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .job {
    font-size: 11.5px;
    color: ${props => props.theme.colors.textLight};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const EmptyChats = styled.div`
  padding: 24px;
  text-align: center;
  color: ${props => props.theme.colors.textLight};
  font-size: 13px;
`;

const FloatingChatWindow = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 340px;
  height: 420px;
  background: ${props => props.theme.colors.bgLight};
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  animation: slideUp 0.25s ease-out;
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const FloatingChatHeader = styled.div`
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  padding: 12px 16px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .title-group {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  
  h4 {
    margin: 0;
    font-size: 14.5px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  p {
    margin: 0;
    font-size: 11px;
    opacity: 0.9;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .status-dot {
    width: 6px;
    height: 6px;
    background: #4ade80;
    border-radius: 50%;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    opacity: 0.8;
    padding: 4px;
    display: flex;
    align-items: center;
    
    &:hover {
      opacity: 1;
    }
  }
`;

const FloatingChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: ${props => props.theme.colors.bgDark}80;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 2px;
  }
`;

const FloatingChatMsg = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$mine ? 'flex-end' : 'flex-start'};
  
  .bubble {
    max-width: 80%;
    padding: 8px 12px;
    border-radius: ${props => props.$mine ? '14px 14px 2px 14px' : '14px 14px 14px 2px'};
    background: ${props => props.$mine ? 'linear-gradient(135deg, #1e40af, #3b82f6)' : props.theme.colors.bgLight};
    color: ${props => props.$mine ? 'white' : props.theme.colors.text};
    border: ${props => props.$mine ? 'none' : `1px solid ${props.theme.colors.border}`};
    font-size: 13px;
    line-height: 1.4;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  
  .time {
    font-size: 10px;
    color: ${props => props.theme.colors.textLight};
    margin-top: 3px;
    padding: 0 4px;
  }
`;

const FloatingChatInputRow = styled.div`
  padding: 10px 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  background: ${props => props.theme.colors.bgLight};
  border-top: 1px solid ${props => props.theme.colors.border};
  
  input {
    flex: 1;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 20px;
    padding: 8px 14px;
    font-size: 13px;
    background: ${props => props.theme.colors.bgDark};
    color: ${props => props.theme.colors.text};
    outline: none;
    
    &:focus {
      border-color: #3b82f6;
    }
  }
  
  button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: opacity 0.2s;
    
    &:hover {
      opacity: 0.9;
    }
  }
`;

const ModalBackdrop = styled.div`
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
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ConfirmModal = styled.div`
  background: ${props => props.theme.colors.bgLight};
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  border: 1px solid ${props => props.theme.colors.border};
  text-align: center;
  animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  @keyframes scaleUp {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  .icon-wrapper {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    
    svg {
      width: 28px;
      height: 28px;
    }
  }
  
  h3 {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }
  
  p {
    margin: 0 0 24px;
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};
    line-height: 1.5;
  }
`;

const ConfirmButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  
  button {
    flex: 1;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .cancel-btn {
    background: ${props => props.theme.colors.bgDark};
    border: 1px solid ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.text};
    
    &:hover {
      background: ${props => props.theme.colors.border};
    }
  }
  
  .delete-btn {
    background: #ef4444;
    border: none;
    color: white;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
    
    &:hover {
      background: #dc2626;
      transform: translateY(-1px);
    }
  }
`;

const NotificationHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    font-size: 20px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }
  
  button {
    color: ${props => props.theme.colors.primary};
    font-size: 14px;
    font-weight: 600;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    
    &:hover {
      background: ${props => props.theme.colors.bgDark};
    }
  }
`;

const NotificationTabs = styled.div`
  display: flex;
  padding: 8px 12px;
  gap: 8px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const NotificationTab = styled.button`
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.bgDark};
  }
`;

const NotificationList = styled.div`
  max-height: 480px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.bgDark};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 4px;
    
    &:hover {
      background: ${props => props.theme.colors.textLight};
    }
  }
`;

const NotificationItem = styled.div`
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.$unread ? props.theme.colors.bgDark : 'transparent'};
  
  &:hover {
    background: ${props => props.theme.colors.bgDark};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const NotificationIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${props => props.$color || props.theme.colors.primary}15;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => props.$color || props.theme.colors.primary};
  }
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
  
  .title {
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
  }
  
  .message {
    font-size: 13px;
    color: ${props => props.theme.colors.textLight};
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .time {
    font-size: 12px;
    color: ${props => props.theme.colors.primary};
    margin-top: 4px;
    font-weight: 600;
  }
`;

const NotificationDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary};
  flex-shrink: 0;
  margin-top: 4px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme.colors.gradientPrimary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  text-transform: uppercase;
  box-shadow: ${props => props.theme.shadows.sm};
  transition: all ${props => props.theme.transitions.normal};
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 20px;
  margin-left: 12px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.theme.colors.bgDark};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.normal};
  border: 2px solid transparent;
  
  &:hover {
    background: ${props => props.theme.colors.gradientPrimary};
    color: white;
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.intense};
    border-color: ${props => props.theme.colors.primary};
    
    ${Avatar} {
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
    }
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  
  span:first-child {
    font-size: 14px;
    font-weight: 500;
  }
  
  span:last-child {
    font-size: 12px;
    color: ${props => props.theme.colors.textLight};
  }
`;

const Navbar = ({ showSearch = true }) => {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState(() => JSON.parse(localStorage.getItem('jobSearchHistory') || '[]'));
  const [allJobTitles, setAllJobTitles] = useState([]);
  const searchBarRef = useRef(null);
  const [companyLogo, setCompanyLogo] = useState(() => localStorage.getItem('companyLogo') || s3Images.system.katinatlogo);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationTab, setNotificationTab] = useState('all');
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [employerProfile, setEmployerProfile] = useState(null);
  const notificationRef = useRef(null);

  // Candidate Chat state
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const [candidateChats, setCandidateChats] = useState([]);
  const [employerChats, setEmployerChats] = useState([]);
  const [activeChatApp, setActiveChatApp] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const resolvedJobsRef = useRef({});
  const [deleteConfirmAppId, setDeleteConfirmAppId] = useState(null);

  // Load job titles for suggestions
  useEffect(() => {
    if (user?.role !== 'candidate') return;
    jobPostService.getAllActiveJobs().then(jobs => {
      const titles = [];
      const companies = [];
      const seen = new Set();
      jobs.forEach(j => {
        if (j.title && !seen.has(j.title)) { titles.push({ label: j.title, type: 'job' }); seen.add(j.title); }
        if (j.employerName && !seen.has(j.employerName)) { companies.push({ label: j.employerName, type: 'company' }); seen.add(j.employerName); }
      });
      setAllJobTitles([...titles, ...companies]);
    }).catch(() => { });
  }, [user]);

  // Generate suggestions when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      const history = JSON.parse(localStorage.getItem('jobSearchHistory') || '[]');
      setSearchHistory(history);
      setSearchSuggestions(history.slice(0, 6).map(h => ({ label: h, type: 'history' })));
      return;
    }
    const q = searchQuery.toLowerCase();
    const matched = allJobTitles.filter(s => s.label.toLowerCase().includes(q)).slice(0, 7);
    setSearchSuggestions(matched);
  }, [searchQuery, allJobTitles]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Get notifications from service
  const [realNotifications, setRealNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [acknowledgedChatCountBell, setAcknowledgedChatCountBell] = useState(0);
  const [acknowledgedChatCountMessage, setAcknowledgedChatCountMessage] = useState(0);

  // Reset acknowledged counts when a new message actually arrives (unread count changes)
  useEffect(() => {
    setAcknowledgedChatCountBell(0);
    setAcknowledgedChatCountMessage(0);
  }, [unreadChatCount]);

  useEffect(() => {
    let intervalId = null;
    const POLL_INTERVAL_NORMAL = 30000;
    const POLL_INTERVAL_ERROR = 60000;

    const loadNotifications = async () => {
      const token = await getIdToken().catch(() => null);
      if (!token) return;

      let effectiveUser = user;
      if (!effectiveUser) {
        try {
          const storedUser = localStorage.getItem('user');
          effectiveUser = storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
          console.error('❌ [Navbar] Failed to parse stored user:', error);
        }
      }

      if (!effectiveUser) return;

      try {
        let userId;

        if (effectiveUser.role === 'admin') {
          userId = 'admin';
        } else {
          userId = effectiveUser.userId || effectiveUser.id;

          if (!userId || userId.includes('@')) {
            try {
              const { fetchAuthSession } = await import('aws-amplify/auth');
              const session = await fetchAuthSession();
              if (session && session.tokens) {
                const uuidFromToken = session.tokens.idToken.payload.sub;
                userId = uuidFromToken;
                const updatedUser = { ...effectiveUser, userId: uuidFromToken };
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }
            } catch (cognitoError) {
              console.error('❌ [Navbar] Failed to get UUID from Cognito:', cognitoError);
            }
          }
        }

        if (!userId || !effectiveUser.role) return;

        const notifs = await getNotifications(userId, effectiveUser.role);
        setRealNotifications(notifs || []);
        setUnreadCount((notifs || []).filter(n => !n.read).length);

        // Reset to normal interval on success
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') loadNotifications();
          }, POLL_INTERVAL_NORMAL);
        }
      } catch (error) {
        // Slow down polling on error to avoid hammering a degraded service
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') loadNotifications();
          }, POLL_INTERVAL_ERROR);
        }
      }
    };

    loadNotifications();

    intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') loadNotifications();
    }, POLL_INTERVAL_NORMAL);

    const handleUserLogin = () => setTimeout(loadNotifications, 500);

    window.addEventListener('userLoggedIn', handleUserLogin);
    window.addEventListener('visibilitychange', loadNotifications);
    window.addEventListener('focus', loadNotifications);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('userLoggedIn', handleUserLogin);
      window.removeEventListener('visibilitychange', loadNotifications);
      window.removeEventListener('focus', loadNotifications);
    };
  }, [user]);

  // Use only real notifications from API
  const notifications = realNotifications;
  const filteredNotifications = notifications;

  useEffect(() => {
    const handleLogoChange = () => {
      setCompanyLogo(localStorage.getItem('companyLogo') || s3Images.system.katinatlogo);
    };
    window.addEventListener('logoChanged', handleLogoChange);
    return () => window.removeEventListener('logoChanged', handleLogoChange);
  }, []);

  // Fetch candidate profile if user is a candidate
  useEffect(() => {
    const fetchCandidateProfile = async () => {
      if (user?.role === 'candidate') {
        try {
          const profile = await candidateProfileService.getOrCreateProfile(user);
          setCandidateProfile(profile);
        } catch (error) {
          console.error('Error fetching candidate profile:', error);
        }
      }
    };

    fetchCandidateProfile();
  }, [user]);

  // Fetch employer profile if user is an employer
  useEffect(() => {
    const fetchEmployerProfile = async () => {
      if (user?.role === 'employer') {
        try {
          const profile = await employerProfileService.getMyProfile();
          setEmployerProfile(profile);
        } catch (error) {
          console.error('Error fetching employer profile:', error);
        }
      }
    };

    fetchEmployerProfile();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Close chat dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setShowChatDropdown(false);
      }
    };

    if (showChatDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatDropdown]);

  // Load candidate chats (accepted and completed applications)
  useEffect(() => {
    if (user?.role !== 'candidate') return;

    const loadCandidateChats = async () => {
      try {
        const token = await getIdToken().catch(() => null);
        if (!token) return;

        const { default: applicationService } = await import('../services/applicationService');
        const apps = await applicationService.getMyCandidateApplications();
        console.log('📥 [Navbar Chat] Raw applications:', apps);
        // Filter applications where status is 'accepted' or 'completed'
        const validChats = (apps || []).filter(app => app.status === 'accepted' || app.status === 'completed');

        // Filter out locally deleted chats
        const deletedChatIds = JSON.parse(localStorage.getItem('deleted_chats') || '[]');
        const filteredValidChats = validChats.filter(app => !deletedChatIds.includes(app.applicationId));

        // Fetch company logo and name for each chat dynamically
        const enrichedChats = (await Promise.all(
          filteredValidChats.map(async (app) => {
            try {
              let job = null;
              if (app.jobId) {
                // Check localStorage 404 cache first
                const notFoundCache = JSON.parse(localStorage.getItem('jobs_not_found') || '[]');
                if (notFoundCache.includes(app.jobId)) {
                  return null; // job đã biết là không tồn tại, bỏ qua
                }

                if (resolvedJobsRef.current[app.jobId] !== undefined) {
                  const cached = resolvedJobsRef.current[app.jobId];
                  if (cached === 'not_found') return null;
                  job = cached;
                } else {
                  if (app.jobId.startsWith('QJOB-')) {
                    const { default: quickJobService } = await import('../services/quickJobService');
                    job = await quickJobService.getQuickJob(app.jobId).catch(() => null);
                  } else if (app.jobId.startsWith('JOB-')) {
                    job = await jobPostService.getJobPost(app.jobId).catch(() => null);
                  }
                  if (!job) {
                    // Lưu vào cache để không gọi lại
                    resolvedJobsRef.current[app.jobId] = 'not_found';
                    const cache = JSON.parse(localStorage.getItem('jobs_not_found') || '[]');
                    if (!cache.includes(app.jobId)) {
                      localStorage.setItem('jobs_not_found', JSON.stringify([...cache, app.jobId]));
                    }
                    return null;
                  }
                  resolvedJobsRef.current[app.jobId] = job;
                }
              }

              // Search realNotifications for a matching notification by jobId
              const matchingNotif = (realNotifications || []).find(
                (notif) => notif.data?.jobId === app.jobId
              );

              const companyName = job
                ? (job.employerName || job.companyName)
                : (matchingNotif?.data?.companyName || app.employerName || app.companyName || 'Công ty');

              const jobTitle = job
                ? job.title
                : (matchingNotif?.data?.jobTitle || app.jobTitle || 'Công việc');

              let logo = job?.companyLogo;
              if (!logo && companyName && companyName.toLowerCase().includes('katinat')) {
                logo = s3Images.system.katinatlogo;
              }
              if (!logo) {
                logo = s3Images.system.katinatlogo; // default fallback
              }

              return {
                ...app,
                employerName: companyName,
                companyLogo: logo,
                jobTitle: jobTitle
              };
            } catch (err) {
              console.error(`Error resolving job details for chat:`, err);
            }

            // Fallback for catch block
            const matchingNotif = (realNotifications || []).find(
              (notif) => notif.data?.jobId === app.jobId
            );
            const fallbackCompanyName = matchingNotif?.data?.companyName || app.employerName || app.companyName || 'Công ty';
            let logo = s3Images.system.katinatlogo;
            if (fallbackCompanyName.toLowerCase().includes('katinat')) {
              logo = s3Images.system.katinatlogo;
            }

            return {
              ...app,
              employerName: fallbackCompanyName,
              companyLogo: logo,
              jobTitle: matchingNotif?.data?.jobTitle || app.jobTitle || 'Công việc'
            };
          })
        )).filter(Boolean);
        setCandidateChats(enrichedChats);

        // Tính unread từ DB data + local storage data
        let unreadTotal = 0;
        enrichedChats.forEach(app => {
          let messages = app.chatMessages || [];
          
          // Check local storage for potentially newer messages
          const savedMessages = localStorage.getItem(`chat_${app.applicationId}`);
          if (savedMessages) {
            try {
              const localMsgs = JSON.parse(savedMessages);
              if (localMsgs.length > messages.length) {
                messages = localMsgs;
              }
            } catch (e) {}
          }

          if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.sender === 'me') {
              const lastReadId = localStorage.getItem(`chat_read_${app.applicationId}`);
              if (lastReadId !== String(lastMsg.id)) {
                unreadTotal++;
              }
            }
          }
        });
        setUnreadChatCount(unreadTotal);
      } catch (error) {
        console.error('Error loading candidate chats:', error);
      }
    };

    loadCandidateChats();
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadCandidateChats();
      }
    }, 3000);

    const handleFocus = () => loadCandidateChats();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user, realNotifications]);

  // --- NEW: Load Employer Chats & Count ---
  useEffect(() => {
    if (user?.role !== 'employer') {
      setUnreadChatCount(0);
      return;
    }

    const loadEmployerChats = async () => {
      try {
        const token = await getIdToken().catch(() => null);
        if (!token) return;

        const { default: quickJobService } = await import('../services/quickJobService');
        const { default: applicationService } = await import('../services/applicationService');

        const jobs = await quickJobService.getMyQuickJobs().catch(() => []);
        let unreadTotal = 0;
        const allChats = [];

        for (const job of jobs) {
          const apps = await applicationService.getJobApplications(job.idJob || job.id).catch(() => []);
          apps.forEach(app => {
            if (app.status === 'accepted' || app.status === 'completed') {
              allChats.push({
                ...app,
                jobTitle: job.title || app.jobTitle
              });
              
              let messages = app.chatMessages || [];
              const savedMessages = localStorage.getItem(`chat_${app.applicationId}`);
              if (savedMessages) {
                try {
                  const localMsgs = JSON.parse(savedMessages);
                  if (localMsgs.length > messages.length) messages = localMsgs;
                } catch (e) {}
              }

              if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                if (lastMsg && lastMsg.sender === 'them') {
                  const lastReadId = localStorage.getItem(`chat_read_employer_${app.applicationId}`);
                  if (lastReadId !== String(lastMsg.id)) {
                    unreadTotal++;
                  }
                }
              }
            }
          });
        }
        
        console.log(`[Navbar] Employer unread chats: ${unreadTotal}, Total active chats: ${allChats.length}`);
        setUnreadChatCount(unreadTotal);
        setEmployerChats(allChats);
      } catch (error) {
        console.error('Error loading employer chats for navbar:', error);
      }
    };

    loadEmployerChats();
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadEmployerChats();
      }
    }, 3000);

    const handleFocus = () => loadEmployerChats();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user, realNotifications]);

  // Load chat messages when activeChatApp changes
  useEffect(() => {
    if (activeChatApp) {
      // Ưu tiên dùng dữ liệu từ DB (chatMessages đã được load cùng với application)
      const dbMessages = activeChatApp.chatMessages;
      if (dbMessages && Array.isArray(dbMessages) && dbMessages.length > 0) {
        setChatMessages(dbMessages);
        const lastMsg = dbMessages[dbMessages.length - 1];
        if (lastMsg) {
          localStorage.setItem(`chat_read_${activeChatApp.applicationId}`, String(lastMsg.id));
        }
      } else {
        // Chưa có tin nhắn nào → tạo lời chào mặc định rồi lưu lên DB
        const companyName = activeChatApp.employerName || activeChatApp.companyName || 'Nhà tuyển dụng';
        const greetingMessage = {
          id: Date.now(),
          sender: 'me',
          text: language === 'vi'
            ? `Xin chào! ${companyName} đã duyệt CV ứng tuyển công việc tuyển gấp của bạn. Bạn có thể liên hệ với chúng tôi qua đây nhé! 😊`
            : `Hello! ${companyName} has approved your urgent job application. You can contact us here! 😊`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
        const initMsgs = [greetingMessage];
        setChatMessages(initMsgs);
        import('../services/applicationService').then(({ default: applicationService }) => {
          applicationService.updateApplicationStatus(
            activeChatApp.applicationId,
            activeChatApp.status,
            { chatMessages: initMsgs }
          ).catch(err => console.error('Failed to init chat in DB:', err));
        });
      }
    }
  }, [activeChatApp?.applicationId, language]);

  // Sync active chat messages in real time — poll DB trực tiếp
  useEffect(() => {
    if (!activeChatApp) return;

    const syncMessages = async () => {
      try {
        const { default: applicationService } = await import('../services/applicationService');
        const apps = await applicationService.getMyCandidateApplications().catch(() => null);
        if (!apps) return;
        const fresh = apps.find(a => a.applicationId === activeChatApp.applicationId);
        if (!fresh) return;
        const msgs = fresh.chatMessages;
        if (msgs && Array.isArray(msgs)) {
          setChatMessages(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(msgs)) {
              const lastMsg = msgs[msgs.length - 1];
              if (lastMsg) {
                localStorage.setItem(`chat_read_${activeChatApp.applicationId}`, String(lastMsg.id));
              }
              return msgs;
            }
            return prev;
          });
        }
      } catch (e) {
        // silent
      }
    };

    const interval = setInterval(syncMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChatApp?.applicationId]);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeChatApp) {
      scrollToBottom();
    }
  }, [chatMessages, activeChatApp]);

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !activeChatApp || activeChatApp.status === 'completed') return;

    const newMessage = {
      id: Date.now(),
      sender: 'them', // Candidate is 'them' on the shared storage
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...chatMessages, newMessage];
    setChatMessages(updated);
    setChatInput('');

    // Lưu thẳng lên DB, không qua localStorage
    import('../services/applicationService').then(({ default: applicationService }) => {
      applicationService.updateApplicationStatus(
        activeChatApp.applicationId,
        activeChatApp.status,
        { chatMessages: updated }
      ).then(() => {
      // Send notification to employer
      if (activeChatApp?.employerId) {
        const senderName = user?.name || user?.email || 'Ứng viên';
        createChatMessageNotification({
          recipientId: activeChatApp.employerId,
          recipientRole: 'employer',
          senderId: user?.userId || user?.id || 'candidate',
          senderName: senderName,
          messageText: newMessage.text,
          applicationId: activeChatApp.applicationId,
          jobTitle: activeChatApp.jobTitle
        }).catch(err => console.error('Failed to send employer message notification:', err));
      }
    }).catch(err => console.error('Failed to sync candidate message to DB:', err));
    });
  };

  const handleDeleteChat = (applicationId, event) => {
    event.stopPropagation(); // prevent opening the chat window
    setDeleteConfirmAppId(applicationId);
  };

  const executeDeleteChat = () => {
    if (!deleteConfirmAppId) return;
    const applicationId = deleteConfirmAppId;
    try {
      const deletedChats = JSON.parse(localStorage.getItem('deleted_chats') || '[]');
      if (!deletedChats.includes(applicationId)) {
        deletedChats.push(applicationId);
        localStorage.setItem('deleted_chats', JSON.stringify(deletedChats));
      }

      // Update local state immediately
      setCandidateChats(prev => prev.filter(chat => chat.applicationId !== applicationId));

      // Close active chat if it was the one deleted
      if (activeChatApp && activeChatApp.applicationId === applicationId) {
        setActiveChatApp(null);
      }
    } catch (e) {
      console.error('Error deleting chat:', e);
    } finally {
      setDeleteConfirmAppId(null);
    }
  };

  const getRoleTranslation = (role) => {
    if (role === 'candidate') return t.login.roleCandidate;
    if (role === 'employer') return t.login.roleEmployer;
    if (role === 'admin') return t.login.roleAdmin;
    return role;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleNotifications = (e) => {
    e.stopPropagation();
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    
    // When opening notifications, mark as read immediately to clear the badge
    if (nextState) {
      setUnreadCount(0);
      setAcknowledgedChatCountBell(unreadChatCount); // "Dismiss" current chat count only from bell
      try {
        const effectiveUser = user || JSON.parse(localStorage.getItem('user') || '{}');
        const userId = effectiveUser.role === 'admin' ? 'admin' : (effectiveUser.userId || effectiveUser.id || effectiveUser.email);
        if (userId) {
          markAllAsRead(userId, effectiveUser.role).catch(() => {});
        }
      } catch (err) {}
    }
  };

  const handleNotificationItemClick = async () => {
    setShowNotifications(false);

    // Mark all as read and reset badge immediately, then re-fetch from DB
    try {
      const effectiveUser = user || JSON.parse(localStorage.getItem('user') || '{}');
      const userId = effectiveUser.role === 'admin' ? 'admin' : (effectiveUser.userId || effectiveUser.id || effectiveUser.email);
      if (userId) {
        // Optimistic update
        setUnreadCount(0);
        setRealNotifications(prev => prev.map(n => ({ ...n, read: true })));
        // Persist to DB
        await markAllAsRead(userId, effectiveUser.role);
        // Re-fetch from DB to confirm
        const freshNotifs = await getNotifications(userId, effectiveUser.role);
        setRealNotifications(freshNotifs || []);
        setUnreadCount((freshNotifs || []).filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Error marking all as read on view all:', err);
    }

    if (user?.role === 'candidate') {
      navigate('/candidate/notifications');
    } else if (user?.role === 'employer') {
      navigate('/employer/notifications');
    } else if (user?.role === 'admin') {
      navigate('/admin/notifications');
    }
  };

  const handleSettingsClick = () => {
    if (user?.role === 'candidate') {
      navigate('/candidate/settings');
    } else if (user?.role === 'employer') {
      navigate('/employer/settings');
    } else if (user?.role === 'admin') {
      navigate('/admin/settings');
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const history = JSON.parse(localStorage.getItem('jobSearchHistory') || '[]');
      const updated = [searchQuery.trim(), ...history.filter(h => h !== searchQuery.trim())].slice(0, 5);
      localStorage.setItem('jobSearchHistory', JSON.stringify(updated));
      setShowSearchSuggestions(false);
      navigate('/candidate/jobs', { state: { searchKeyword: searchQuery } });
    }
  };

  const handleSearchIconClick = () => {
    if (searchQuery.trim()) {
      const history = JSON.parse(localStorage.getItem('jobSearchHistory') || '[]');
      const updated = [searchQuery.trim(), ...history.filter(h => h !== searchQuery.trim())].slice(0, 5);
      localStorage.setItem('jobSearchHistory', JSON.stringify(updated));
      setShowSearchSuggestions(false);
      navigate('/candidate/jobs', { state: { searchKeyword: searchQuery } });
    }
  };

  const handleProfileClick = () => {
    if (user?.role === 'candidate') {
      navigate('/candidate/profile');
    } else if (user?.role === 'employer') {
      navigate('/employer/profile');
    } else if (user?.role === 'admin') {
      navigate('/admin/profile');
    }
  };

  return (
    <>
      <NavbarContainer>
        <NavLeft>
          {showSearch && (
            <SearchBar ref={searchBarRef}>
              <Search onClick={handleSearchIconClick} style={{ cursor: 'pointer' }} />
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm việc, công ty...' : 'Search jobs, companies...'}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearchSuggestions(true); }}
                onFocus={() => setShowSearchSuggestions(true)}
                onKeyPress={handleSearch}
              />
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <SearchSuggestionDropdown>
                  {!searchQuery.trim() && searchSuggestions.some(s => s.type === 'history') && (
                    <SearchSuggestionHeader>{language === 'vi' ? 'Tìm kiếm gần đây' : 'Recent Searches'}</SearchSuggestionHeader>
                  )}
                  {searchQuery.trim() && (
                    <SearchSuggestionHeader>{language === 'vi' ? 'Gợi ý' : 'Suggestions'}</SearchSuggestionHeader>
                  )}
                  {searchSuggestions.map((s, i) => (
                    <SearchSuggestionItem
                      key={i}
                      onMouseDown={() => {
                        setSearchQuery(s.label);
                        setShowSearchSuggestions(false);
                        const history = JSON.parse(localStorage.getItem('jobSearchHistory') || '[]');
                        const updated = [s.label, ...history.filter(h => h !== s.label)].slice(0, 5);
                        localStorage.setItem('jobSearchHistory', JSON.stringify(updated));
                        navigate('/candidate/jobs', { state: { searchKeyword: s.label } });
                      }}
                    >
                      {s.type === 'history' ? <History /> : s.type === 'company' ? <Building2 /> : <Search />}
                      <span>{s.label}</span>
                      {s.type === 'company' && <span className="sub">{language === 'vi' ? 'Công ty' : 'Company'}</span>}
                    </SearchSuggestionItem>
                  ))}
                </SearchSuggestionDropdown>
              )}
            </SearchBar>
          )}
        </NavLeft>

        <NavRight>
           {user?.role === 'candidate' && (
            <div style={{ position: 'relative' }} ref={chatRef}>
              <IconButton 
                onClick={() => {
                  const nextDropdownState = !showChatDropdown;
                  setShowChatDropdown(nextDropdownState);
                  if (nextDropdownState) {
                    setAcknowledgedChatCountMessage(unreadChatCount); // Clear message badge only
                  }
                }}
                title={language === 'vi' ? 'Trò chuyện' : 'Chat'}
              >
                <MessageSquare />
                {(unreadChatCount - acknowledgedChatCountMessage) > 0 && <Badge>{unreadChatCount - acknowledgedChatCountMessage}</Badge>}
              </IconButton>

              {showChatDropdown && (
                <ChatDropdown>
                  <ChatDropdownHeader>
                    {language === 'vi' ? 'Trò chuyện' : 'Conversations'}
                  </ChatDropdownHeader>
                  <ChatDropdownList>
                    {user?.role === 'candidate' ? (
                      candidateChats.length > 0 ? (
                        candidateChats.map((chat) => (
                          <ChatDropdownItem
                            key={chat.applicationId}
                            onClick={() => {
                              setActiveChatApp(chat);
                              setShowChatDropdown(false);
                              // Mark as read immediately
                              const msgs = chat.chatMessages || [];
                              if (msgs.length > 0) {
                                const lastMsg = msgs[msgs.length - 1];
                                const lastReadId = localStorage.getItem(`chat_read_${chat.applicationId}`);
                                if (lastReadId !== String(lastMsg.id)) {
                                  localStorage.setItem(`chat_read_${chat.applicationId}`, String(lastMsg.id));
                                  setUnreadChatCount(prev => Math.max(0, prev - 1));
                                }
                              }
                            }}
                          >
                            <ChatDropdownAvatar>
                              {chat.companyLogo ? (
                                <img src={chat.companyLogo} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                (chat.employerName || chat.companyName || 'C').charAt(0)
                              )}
                            </ChatDropdownAvatar>
                            <ChatDropdownInfo>
                              <div className="name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {chat.employerName || chat.companyName || 'Công ty'}
                                {chat.status === 'completed' && <span style={{ fontSize: '11px' }} title={language === 'vi' ? 'Công việc đã hoàn thành' : 'Job completed'}>🔒</span>}
                              </div>
                              <div className="job">{chat.jobTitle || chat.position || 'Công việc'}</div>
                            </ChatDropdownInfo>
                            {(() => {
                              const msgs = chat.chatMessages || [];
                              if (msgs.length > 0) {
                                const lastMsg = msgs[msgs.length - 1];
                                if (lastMsg && lastMsg.sender !== 'candidate') {
                                  const lastReadId = localStorage.getItem(`chat_read_${chat.applicationId}`);
                                  if (lastReadId !== String(lastMsg.id)) {
                                    return <NotificationDot style={{ marginTop: 0 }} />;
                                  }
                                }
                              }
                              return null;
                            })()}
                            <DeleteChatButton
                              onClick={(e) => handleDeleteChat(chat.applicationId, e)}
                              title={language === 'vi' ? 'Xóa cuộc trò chuyện' : 'Delete conversation'}
                            >
                              <Trash2 size={16} />
                            </DeleteChatButton>
                          </ChatDropdownItem>
                        ))
                      ) : (
                        <EmptyChats>
                          {language === 'vi'
                            ? 'Chưa có cuộc trò chuyện nào. (Nhà tuyển dụng cần phê duyệt CV của bạn trước)'
                            : 'No conversations yet. (Employer needs to approve your CV first)'}
                        </EmptyChats>
                      )
                    ) : (
                      employerChats.length > 0 ? (
                        employerChats.map((chat) => (
                          <ChatDropdownItem
                            key={chat.applicationId}
                            onClick={() => {
                              navigate('/employer/quick-jobs', { state: { activeApplicationId: chat.applicationId, activeSection: 'hr' } });
                              setShowChatDropdown(false);
                              
                              // Mark as read immediately
                              const msgs = chat.chatMessages || [];
                              if (msgs.length > 0) {
                                const lastMsg = msgs[msgs.length - 1];
                                const lastReadId = localStorage.getItem(`chat_read_employer_${chat.applicationId}`);
                                if (lastReadId !== String(lastMsg.id)) {
                                  localStorage.setItem(`chat_read_employer_${chat.applicationId}`, String(lastMsg.id));
                                  setUnreadChatCount(prev => Math.max(0, prev - 1));
                                }
                              }
                            }}
                          >
                            <ChatDropdownAvatar>
                              {(chat.candidateName || 'U').charAt(0)}
                            </ChatDropdownAvatar>
                            <ChatDropdownInfo>
                              <div className="name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {chat.candidateName || 'Ứng viên'}
                                {chat.status === 'completed' && <span style={{ fontSize: '11px' }} title={language === 'vi' ? 'Công việc đã hoàn thành' : 'Job completed'}>🔒</span>}
                              </div>
                              <div className="job">{chat.jobTitle || 'Công việc'}</div>
                            </ChatDropdownInfo>
                          </ChatDropdownItem>
                        ))
                      ) : (
                        <EmptyChats>
                          {language === 'vi'
                            ? 'Chưa có cuộc trò chuyện nào.'
                            : 'No conversations yet.'}
                        </EmptyChats>
                      )
                    )}
                  </ChatDropdownList>
                </ChatDropdown>
              )}
            </div>
          )}

          <div style={{ position: 'relative' }} ref={notificationRef}>
            <IconButton onClick={toggleNotifications}>
              <Bell />
              {(unreadCount + Math.max(0, unreadChatCount - acknowledgedChatCountBell)) > 0 && (
                <Badge>
                  {(unreadCount + Math.max(0, unreadChatCount - acknowledgedChatCountBell)) > 99 
                    ? '99+' 
                    : (unreadCount + Math.max(0, unreadChatCount - acknowledgedChatCountBell))}
                </Badge>
              )}
            </IconButton>

            {showNotifications && (
              <NotificationDropdown>
                <NotificationHeader>
                  <h3>{language === 'vi' ? 'Thông báo' : 'Notifications'}</h3>
                  <button onClick={handleNotificationItemClick}>{language === 'vi' ? 'Xem tất cả' : 'View all'}</button>
                </NotificationHeader>

                <NotificationTabs>
                  <NotificationTab
                    $active={notificationTab === 'all'}
                    onClick={() => setNotificationTab('all')}
                  >
                    {language === 'vi' ? 'Tất cả' : 'All'}
                  </NotificationTab>
                  <NotificationTab
                    $active={notificationTab === 'unread'}
                    onClick={() => setNotificationTab('unread')}
                  >
                    {language === 'vi' ? 'Chưa đọc' : 'Unread'}
                  </NotificationTab>
                </NotificationTabs>

                <NotificationList>
                  {filteredNotifications
                    .filter(n => notificationTab === 'all' || !n.read)
                    .map((notification) => {
                      // Check if this is a real notification from service or static one
                      const isRealNotification = !!notification.notificationId;

                      // Get icon based on notification type or icon name
                      let Icon = Bell;
                      const type = notification.type;
                      const iconName = notification.icon;

                      if (type) {
                        switch (type) {
                          case 'package_purchase_request':
                            Icon = Package;
                            break;
                          case 'package_approved':
                            Icon = CheckCircle;
                            break;
                          case 'employers':
                            Icon = Building2;
                            break;
                          case 'posts':
                            Icon = AlertCircle;
                            break;
                          case 'payments':
                          case 'candidate_withdrawal_request':
                          case 'withdrawal_request':
                            Icon = DollarSign;
                            break;
                          case 'urgent':
                            Icon = AlertCircle;
                            break;
                          case 'success':
                          case 'CV_ACCEPTED':
                          case 'withdrawal_approved':
                          case 'quick_job_activation_approved':
                          case 'job_approved':
                            Icon = CheckCircle;
                            break;
                          case 'system':
                          case 'CV_REJECTED':
                          case 'withdrawal_rejected':
                          case 'quick_job_activation_rejected':
                          case 'quick_job_activation_deactivated':
                          case 'job_rejected':
                            Icon = AlertCircle;
                            break;
                          case 'quick_job_activation_request':
                            Icon = Zap;
                            break;
                          case 'chat_message':
                            Icon = MessageSquare;
                            break;
                          default:
                            Icon = Bell;
                        }
                      } else if (iconName && typeof iconName === 'string') {
                        switch (iconName.toLowerCase()) {
                          case 'check-circle':
                            Icon = CheckCircle;
                            break;
                          case 'alert-circle':
                            Icon = AlertCircle;
                            break;
                          case 'bell':
                            Icon = Bell;
                            break;
                          case 'dollar-sign':
                            Icon = DollarSign;
                            break;
                          case 'briefcase':
                            Icon = Briefcase;
                            break;
                          case 'message-square':
                            Icon = MessageSquare;
                            break;
                          case 'package':
                            Icon = Package;
                            break;
                          case 'zap':
                            Icon = Zap;
                            break;
                          case 'x-circle':
                            Icon = XCircle;
                            break;
                          case 'user-plus':
                            Icon = UserPlus;
                            break;
                          case 'building':
                          case 'building2':
                            Icon = Building2;
                            break;
                          default:
                            Icon = Bell;
                        }
                      } else if (iconName && typeof iconName !== 'string') {
                        Icon = iconName;
                      }

                      return (
                        <NotificationItem
                          key={isRealNotification ? notification.notificationId : notification.id}
                          $unread={isRealNotification ? !notification.read : notification.unread}
                          onClick={async () => {
                            if (isRealNotification) {
                              try {
                                await markAsRead(notification.notificationId);
                                setRealNotifications(prev => prev.map(n =>
                                  n.notificationId === notification.notificationId ? { ...n, read: true } : n
                                ));
                                if (notification.actionUrl) {
                                  navigate(notification.actionUrl);
                                }
                              } catch (error) {
                                console.error('Error marking notification as read:', error);
                              }
                            }
                            handleNotificationItemClick();
                          }}
                        >
                          <NotificationIcon $color={notification.color}>
                            <Icon />
                          </NotificationIcon>
                          <NotificationContent>
                            <div className="title">
                              {isRealNotification
                                ? (language === 'vi' ? notification.title : notification.titleEn)
                                : notification.title}
                            </div>
                            <div className="message">
                              {isRealNotification
                                ? (language === 'vi' ? notification.message : notification.messageEn)
                                : notification.message}
                              {notification.jobTitle && (
                                <span> — {notification.jobTitle}</span>
                              )}
                            </div>
                            <div className="time">
                              {isRealNotification
                                ? <RelativeTime timestamp={notification.createdAt} language={language} />
                                : notification.time}
                            </div>
                          </NotificationContent>
                          {(isRealNotification ? !notification.read : notification.unread) && <NotificationDot />}
                        </NotificationItem>
                      );
                    })}
                </NotificationList>
              </NotificationDropdown>
            )}
          </div>

          <IconButton onClick={handleSettingsClick} title={language === 'vi' ? 'Cài đặt' : 'Settings'}>
            <Settings />
          </IconButton>

          <UserMenu onClick={handleProfileClick}>
            <Avatar>
              {user?.role === 'employer' ? (
                employerProfile?.companyLogo ? (
                  <img src={employerProfile.companyLogo} alt="Company Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <img src={companyLogo} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                )
              ) : user?.role === 'candidate' && candidateProfile?.profileImage ? (
                <img src={candidateProfile.profileImage} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                (candidateProfile?.fullName?.charAt(0) || user?.name?.charAt(0) || 'U').toUpperCase()
              )}
            </Avatar>
            <UserInfo>
              <span>{user?.role === 'employer' ? (employerProfile?.companyName || (language === 'vi' ? 'Chưa cập nhật tên công ty' : 'Company name not updated')) : (candidateProfile?.fullName || user?.name || 'User')}</span>
              <span>{getRoleTranslation(user?.role) || 'Role'}</span>
            </UserInfo>
          </UserMenu>

          <IconButton onClick={() => navigate('/')} title={language === 'vi' ? 'Trở về trang chủ' : 'Return to Home'}>
            <Home />
          </IconButton>
        </NavRight>
      </NavbarContainer>

      {activeChatApp && (
        <FloatingChatWindow>
          <FloatingChatHeader>
            <div className="title-group">
              <ChatDropdownAvatar style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                {activeChatApp.companyLogo ? (
                  <img src={activeChatApp.companyLogo} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  (activeChatApp.employerName || activeChatApp.companyName || 'C').charAt(0)
                )}
              </ChatDropdownAvatar>
              <div>
                <h4>{activeChatApp.employerName || activeChatApp.companyName}</h4>
                <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {activeChatApp.status === 'completed' ? (
                    <>
                      <span className="status-dot" style={{ backgroundColor: '#64748b' }} />
                      {language === 'vi' ? 'Đã hoàn thành' : 'Completed'}
                    </>
                  ) : (
                    <>
                      <span className="status-dot" style={{ backgroundColor: '#4ade80' }} />
                      {language === 'vi' ? 'Đang hoạt động' : 'Active'}
                    </>
                  )}
                </p>
              </div>
            </div>
            <button className="close-btn" onClick={() => setActiveChatApp(null)}>
              <XCircle size={18} />
            </button>
          </FloatingChatHeader>
          <FloatingChatMessages>
            {chatMessages.map((msg) => (
              <FloatingChatMsg key={msg.id} $mine={msg.sender === 'them'}>
                <div className="bubble">{msg.text}</div>
                <span className="time">{msg.time}</span>
              </FloatingChatMsg>
            ))}
            <div ref={messagesEndRef} />
          </FloatingChatMessages>
          {activeChatApp.status === 'completed' ? (
            <div style={{
              padding: '14px 16px',
              textAlign: 'center',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              color: '#64748b',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              🔒 {language === 'vi' ? 'Cuộc trò chuyện đã khóa (Công việc hoàn thành)' : 'Chat locked (Job completed)'}
            </div>
          ) : (
            <FloatingChatInputRow>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Nhắn tin...' : 'Type a message...'}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
              />
              <button onClick={handleSendChatMessage}>
                <Send size={16} />
              </button>
            </FloatingChatInputRow>
          )}
        </FloatingChatWindow>
      )}
      {deleteConfirmAppId && (
        <ModalBackdrop onClick={() => setDeleteConfirmAppId(null)}>
          <ConfirmModal onClick={(e) => e.stopPropagation()}>
            <div className="icon-wrapper">
              <Trash2 />
            </div>
            <h3>{language === 'vi' ? 'Xóa cuộc trò chuyện' : 'Delete conversation'}</h3>
            <p>
              {language === 'vi'
                ? 'Bạn có chắc chắn muốn xóa cuộc trò chuyện này không?'
                : 'Are you sure you want to delete this conversation?'}
            </p>
            <ConfirmButtonGroup>
              <button className="cancel-btn" onClick={() => setDeleteConfirmAppId(null)}>
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button className="delete-btn" onClick={executeDeleteChat}>
                {language === 'vi' ? 'Xóa' : 'Delete'}
              </button>
            </ConfirmButtonGroup>
          </ConfirmModal>
        </ModalBackdrop>
      )}
    </>
  );
};

export default Navbar;

