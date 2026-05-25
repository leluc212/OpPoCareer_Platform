import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Bell, 
  Settings,
  FileText,
  Star,
  CreditCard,
  CheckCircle,
  BarChart3,
  Package,
  MapPin,
  ShieldCheck,
  HelpCircle,
  Wallet,
  LogOut,
  UsersRound,
  User,
  Bookmark,
  Building2,
  Clock
} from 'lucide-react';

const SidebarContainer = styled.aside`
  width: 80px;
  background: ${props => props.theme.colors.white};
  border-right: 1px solid ${props => props.theme.colors.border};
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.04);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
  z-index: 100;
  
  &:hover {
    width: 260px;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
  }
`;

const Logo = styled.div`
  padding: 28px 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}05 0%, transparent 100%);
  position: relative;
  min-height: 88px;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 48px;
    height: 3px;
    background: linear-gradient(90deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
    border-radius: 3px 3px 0 0;
    transition: all 0.3s ease;
  }
  
  ${SidebarContainer}:hover &::after {
    width: 120px;
  }
  
  img {
    height: 36px;
    transition: all 0.3s ease;
    filter: drop-shadow(0 2px 8px ${props => props.theme.colors.primary}20);
  }
  
  ${SidebarContainer}:hover & img {
    height: 40px;
  }
`;

const LogoText = styled.h1`
  font-size: 22px;
  font-weight: 700;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  color: ${props => props.theme.colors.primary};
  letter-spacing: -0.2px;
  line-height: 1.4;
  white-space: nowrap;
  opacity: 0;
  max-height: 0;
  overflow: visible;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(-10px);
  font-feature-settings: "kern" 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding-top: 2px;
  
  ${SidebarContainer}:hover & {
    opacity: 1;
    max-height: 45px;
    transform: translateY(0);
  }
`;

const Nav = styled.nav`
  flex: 1;
  padding: 16px 10px;
  overflow-y: auto;
  overflow-x: hidden;
  
  ${SidebarContainer}:hover & {
    padding: 16px 12px;
  }
  
  /* Optimize scrolling - prevent auto-scroll */
  scroll-behavior: auto !important;
  overscroll-behavior: contain;
  scroll-snap-type: none;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 2px;
    
    &:hover {
      background: ${props => props.theme.colors.primary};
    }
  }
`;

const NavSection = styled.div`
  margin-bottom: 20px;
  padding-bottom: 16px;
  
  &:first-child {
    margin-top: 4px;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid transparent;
  }
  
  ${SidebarContainer}:hover &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.colors.border};
    margin-bottom: 24px;
    padding-bottom: 20px;
  }
`;

const NavSectionTitle = styled.p`
  font-size: 10px;
  font-weight: 700;
  color: ${props => props.theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 8px;
  padding: 0 12px;
  white-space: nowrap;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(-10px);
  
  ${SidebarContainer}:hover & {
    opacity: 0.6;
    max-height: 24px;
    margin-bottom: 12px;
    transform: translateX(0);
  }
`;

const NavLink = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: ${props => props.theme.borderRadius.lg};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  background: ${props => props.$active ? `linear-gradient(135deg, ${props.theme.colors.primary}, ${props.theme.colors.secondary})` : 'transparent'};
  font-weight: ${props => props.$active ? 600 : 500};
  font-size: 14px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 4px;
  position: relative;
  cursor: pointer;
  user-select: none;
  outline: none;
  justify-content: center;
  
  ${SidebarContainer}:hover & {
    justify-content: flex-start;
    padding: 12px 14px;
    margin-bottom: 6px;
  }
  
  /* Active indicator bar */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: ${props => props.$active ? '60%' : '0'};
    background: white;
    transition: height 0.25s ease;
    border-radius: 0 3px 3px 0;
    opacity: ${props => props.$active ? 1 : 0};
  }
  
  /* Hover indicator bar */
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    background: ${props => props.theme.colors.primary};
    transition: height 0.25s ease;
    border-radius: 0 3px 3px 0;
    opacity: 0;
  }
  
  &:focus {
    outline: none;
  }
  
  &:focus-visible {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }
  
  svg {
    width: 22px;
    height: 22px;
    min-width: 22px;
    stroke-width: 2;
    transition: all 0.25s ease;
  }
  
  span {
    white-space: nowrap;
    opacity: 0;
    max-width: 0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  ${SidebarContainer}:hover & span {
    opacity: 1;
    max-width: 180px;
  }
  
  &:hover {
    background: ${props => props.$active 
      ? `linear-gradient(135deg, ${props.theme.colors.primary}, ${props.theme.colors.secondary})` 
      : `${props.theme.colors.primary}10`};
    color: ${props => props.$active ? 'white' : props.theme.colors.primary};
    transform: ${props => props.$active ? 'none' : 'translateX(2px)'};
    
    &::after {
      height: ${props => props.$active ? '0' : '50%'};
      opacity: ${props => props.$active ? 0 : 1};
    }
    
    svg {
      transform: ${props => props.$active ? 'scale(1.05)' : 'scale(1.1)'};
    }
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const Sidebar = ({ role, onHoverChange }) => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);
  const isNavigatingRef = useRef(false);
  
  const handleMouseEnter = () => {
    if (onHoverChange) onHoverChange(true);
  };
  
  const handleMouseLeave = () => {
    if (onHoverChange) onHoverChange(false);
  };
  
  // Save scroll position to sessionStorage whenever it changes
  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;
    
    const handleScroll = () => {
      if (!isNavigatingRef.current) {
        sessionStorage.setItem('sidebarScrollPos', navElement.scrollTop.toString());
      }
    };
    
    navElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => navElement.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Restore scroll position from sessionStorage after navigation
  useLayoutEffect(() => {
    const savedScrollPos = sessionStorage.getItem('sidebarScrollPos');
    
    if (navRef.current && savedScrollPos !== null) {
      const scrollPos = parseInt(savedScrollPos, 10);
      
      // Set scroll immediately
      navRef.current.scrollTop = scrollPos;
      
      // Double check after a small delay
      const timeoutId = setTimeout(() => {
        if (navRef.current) {
          navRef.current.scrollTop = scrollPos;
        }
        isNavigatingRef.current = false;
      }, 10);
      
      return () => clearTimeout(timeoutId);
    }
    
    isNavigatingRef.current = false;
  }, [location.pathname]);
  
  const handleNavClick = (path, e) => {
    if (path === '#') {
      e?.preventDefault();
      return;
    }
    
    e?.preventDefault();
    isNavigatingRef.current = true;
    
    if (navRef.current) {
      sessionStorage.setItem('sidebarScrollPos', navRef.current.scrollTop.toString());
    }
    
    // special case for applications section
    if (path === '/employer/standard-jobs') {
      navigate(path, { state: { section: 'applications' } });
    } else {
      navigate(path);
    }
  };
  
  const candidateLinks = [
    { section: t.sidebar.main, items: [
      { to: '/candidate/dashboard', icon: LayoutDashboard, label: t.sidebar.dashboard },
      { to: '/candidate/jobs', icon: Briefcase, label: t.sidebar.findJobs },
    ]},
    { section: t.sidebar.communication, items: [
      { to: '/candidate/notifications', icon: Bell, label: t.sidebar.notifications },
    ]},
    { section: t.sidebar.account, items: [
      { to: '/candidate/profile', icon: Users, label: t.sidebar.myProfile },
    ]},
    { section: t.sidebar.utilities, items: [
      { to: '/candidate/wallet', icon: Wallet, label: t.sidebar.digitalWallet },
      { to: '/candidate/support', icon: HelpCircle, label: t.sidebar.support }
    ]}
  ];
  
  const employerLinks = [
    { section: t.sidebar.main, items: [
      { to: '/employer/dashboard', icon: LayoutDashboard, label: t.sidebar.dashboard },
      { to: '/employer/standard-jobs', icon: Briefcase, label: t.sidebar.applications },
      { to: '/employer/quick-jobs', icon: Clock, label: t.sidebar.userManagement || 'HR Management' },
    ]},
    { section: t.sidebar.communication, items: [
      { to: '/employer/notifications', icon: Bell, label: t.sidebar.notifications },
    ]},
    { section: t.sidebar.account, items: [
      { to: '/employer/profile', icon: Users, label: t.sidebar.companyProfile },
      { to: '/employer/subscription', icon: CreditCard, label: t.sidebar.subscription },
    ]},
    { section: t.sidebar.utilities, items: [
      { to: '/employer/analytics', icon: BarChart3, label: t.sidebar.reports || 'Analytics' },
      { to: '/employer/wallet', icon: Wallet, label: t.sidebar.digitalWallet },
      { to: '/employer/support', icon: HelpCircle, label: t.sidebar.support }
    ]}
  ];
  
  const adminLinks = [
    { section: t.sidebar.main, items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: t.sidebar.dashboard },
      { to: '/admin/candidates', icon: Users, label: language === 'vi' ? 'Ứng Viên' : 'Candidates' },
      { to: '/admin/employers', icon: Building2, label: language === 'vi' ? 'Nhà Tuyển Dụng' : 'Employers' },
      { to: '/admin/management', icon: ShieldCheck, label: language === 'vi' ? 'Quản Lý Admin' : 'Admin Management' },
    ]},
    { section: t.sidebar.platform || 'Management', items: [
      { to: '/admin/posts', icon: FileText, label: language === 'vi' ? 'Quản lý bài đăng' : 'Posts Management' },
      { to: '/admin/packages', icon: Package, label: t.sidebar.packages },
      { to: '/admin/reports', icon: BarChart3, label: t.sidebar.reports },
    ]},
    { section: t.sidebar.utilities || 'Utilities', items: [
      { to: '/admin/wallet', icon: Wallet, label: t.sidebar.digitalWallet },
      { to: '/admin/escrow', icon: ShieldCheck, label: language === 'vi' ? 'Ví Escrow' : 'Escrow Wallet' },
      { to: '/admin/notifications', icon: Bell, label: t.sidebar.notifications },
      { to: '/admin/profile', icon: User, label: t.sidebar.myProfile },
    ]}
  ];
  
  const links = role === 'candidate' ? candidateLinks 
    : role === 'employer' ? employerLinks 
    : adminLinks;
  
  return (
    <SidebarContainer 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Logo>
        <img src="/OpPoReview/images/logo.png" alt="Ốp Pờ" style={{ height: '60px' }} />
        <LogoText>Ốp Pờ</LogoText>
      </Logo>
      
      <Nav ref={navRef}>
        {links.map((section, idx) => (
          <NavSection key={idx}>
            <NavSectionTitle>{section.section}</NavSectionTitle>
            {section.items.map((link, linkIdx) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={linkIdx}
                  $active={location.pathname === link.to}
                  onClick={() => handleNavClick(link.to)}
                  onMouseDown={(e) => e.preventDefault()}
                  tabIndex={0}
                >
                  <Icon />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </NavSection>
        ))}
      </Nav>
    </SidebarContainer>
  );
};

export default Sidebar;

