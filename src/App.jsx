import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles, theme, darkTheme } from './styles/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from './context/ThemeContext';
import ScrollToTop from './components/ScrollToTop';
import FloatingSupportBar from './components/FloatingSupportBar';

// Auth Pages
import LandingPage from './pages/auth/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterRoleSelection from './pages/auth/RegisterRoleSelection';
import CandidateRegister from './pages/auth/CandidateRegister';
import EmployerRegister from './pages/auth/EmployerRegister';
import OTPVerification from './pages/auth/OTPVerification';
import PendingApproval from './pages/auth/PendingApproval';
import DownloadApp from './pages/auth/DownloadApp';
import ForgotPassword from './pages/auth/ForgotPassword';
import GoogleRoleSetupPage from './pages/auth/GoogleRoleSetupPage';

// Other Pages
import TermsUrgentJobs from './pages/TermsUrgentJobs';

// Candidate Pages
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import JobListing from './pages/candidate/JobListing';

import CandidateProfile from './pages/candidate/CandidateProfile';
import CandidateSettings from './pages/candidate/CandidateSettings';
import CandidateNotifications from './pages/candidate/CandidateNotifications';
import EmployerProfileView from './pages/candidate/EmployerProfileView';
import EmployerDirectory from './pages/candidate/EmployerDirectory';
import PublicJobListing from './pages/candidate/PublicJobListing';
import AboutPage from './pages/auth/AboutPage';
import CVTemplates from './pages/auth/CVTemplates';
import Wallet from './pages/candidate/Wallet';
import Availability from './pages/candidate/Availability';
import CandidatePosts from './pages/candidate/CandidatePosts';
import ChangePassword from './pages/candidate/ChangePassword';
import DeleteAccount from './pages/candidate/DeleteAccount';
import CandidateKYC from './pages/candidate/CandidateKYC';
import QuickJobIntroPage from './pages/candidate/QuickJobIntroPage';

// Employer Pages
import EmployerDashboard from './pages/employer/EmployerDashboard';
import PostJob from './pages/employer/PostJob';
import PostQuickJob from './pages/employer/PostQuickJob';
import CompanyVerification from './pages/employer/CompanyVerification';
import JobManagement from './pages/employer/JobManagement';
import Applications from './pages/employer/Applications';
import EmployerProfile from './pages/employer/EmployerProfile';
import EmployerNotifications from './pages/employer/EmployerNotifications';
import Subscription from './pages/employer/Subscription';
import HRManagement from './pages/employer/HRManagement';
import EmployerSettings from './pages/employer/EmployerSettings';
import Analytics from './pages/employer/Analytics';
import EmployerWallet from './pages/employer/EmployerWallet';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CandidatesManagement from './pages/admin/CandidatesManagement';
import CandidateDetail from './pages/admin/CandidateDetail';
import EmployersManagement from './pages/admin/EmployersManagement';
import EmployerDetail from './pages/admin/EmployerDetail';
import PackagesManagement from './pages/admin/PackagesManagement';
import Reports from './pages/admin/Reports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminWallet from './pages/admin/AdminWallet';
import AdminEscrow from './pages/admin/AdminEscrow';
import PostsManagement from './pages/admin/PostsManagement';
import AdminSupport from './pages/admin/AdminSupport';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminProfile from './pages/admin/AdminProfile';
import AdminManagement from './pages/admin/AdminManagement';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    const redirect = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const dashboardPath = `/${user?.role === 'admin' ? 'admin' : user?.role === 'employer' ? 'employer' : 'candidate'}/dashboard`;
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        textAlign: 'center',
        padding: '24px'
      }}>
        <h2>Tài khoản đã đăng nhập ở vai trò khác</h2>
        <p>Tài khoản này hiện đang ở vai trò "{user?.role || 'chưa xác định'}" và không thể truy cập trang này.</p>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={() => window.location.href = dashboardPath}>Đi tới bảng điều khiển</button>
          <button onClick={async () => { await logout(); window.location.href = '/login'; }}>Đăng xuất</button>
        </div>
      </div>
    );
  }
  
  return children;
};

// Guest Route Component (redirects logged-in users away from public pages)
const GuestRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) {
    return null;
  }
  
  // If there is a pending Google login error, keep user on login page so modal can show
  try {
    const googleErr = localStorage.getItem('googleLoginError');
    if (googleErr) return children;
  } catch (e) { /* ignore */ }

  if (isAuthenticated && user?.role) {
    const dashboardPath = `/${user.role === 'admin' ? 'admin' : user.role === 'employer' ? 'employer' : 'candidate'}/dashboard`;
    return <Navigate to={dashboardPath} replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { isLoading } = useAuth();
  
  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#1e40af'
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
      <Route path="/download" element={<DownloadApp />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterRoleSelection /></GuestRoute>} />
      <Route path="/register/candidate" element={<GuestRoute><CandidateRegister /></GuestRoute>} />
      <Route path="/register/employer" element={<GuestRoute><EmployerRegister /></GuestRoute>} />
      <Route path="/verify-otp" element={<OTPVerification />} />
      <Route path="/auth/google-role-setup" element={
        <ProtectedRoute>
          <GoogleRoleSetupPage />
        </ProtectedRoute>
      } />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/terms-urgent-jobs" element={<TermsUrgentJobs />} />
      <Route path="/companies" element={<LandingPage><EmployerDirectory /></LandingPage>} />
      <Route path="/companies/:employerId" element={<LandingPage><EmployerProfileView /></LandingPage>} />
      <Route path="/jobs" element={<LandingPage><PublicJobListing /></LandingPage>} />
      <Route path="/about" element={<LandingPage><AboutPage /></LandingPage>} />
      <Route path="/cv-templates" element={<Navigate to="/candidate/cv-templates" replace />} />
      <Route path="/candidate/cv-templates" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <CVTemplates />
        </ProtectedRoute>
      } />
      
      {/* Candidate Routes */}
      <Route path="/candidate" element={<Navigate to="/candidate/dashboard" replace />} />
      <Route path="/candidate/dashboard" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <CandidateDashboard />
        </ProtectedRoute>
      } />
      <Route path="/candidate/jobs" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <JobListing />
        </ProtectedRoute>
      } />
      <Route path="/candidate/saved-jobs" element={<Navigate to="/candidate/jobs?tab=saved" replace />} />
      <Route path="/candidate/profile" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <CandidateProfile />
        </ProtectedRoute>
      } />
      <Route path="/candidate/notifications" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <CandidateNotifications />
        </ProtectedRoute>
      } />
      <Route path="/candidate/settings" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <CandidateSettings />
        </ProtectedRoute>
      } />
      <Route path="/candidate/employer/:employerId" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <EmployerProfileView />
        </ProtectedRoute>
      } />

      <Route path="/candidate/wallet" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <Wallet />
        </ProtectedRoute>
      } />

      <Route path="/candidate/availability" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <Availability />
        </ProtectedRoute>
      } />
      <Route path="/candidate/posts" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <CandidatePosts />
        </ProtectedRoute>
      } />
      <Route path="/candidate/change-password" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <ChangePassword />
        </ProtectedRoute>
      } />
      <Route path="/candidate/delete-account" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <DeleteAccount />
        </ProtectedRoute>
      } />
      <Route path="/candidate/kyc" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <CandidateKYC />
        </ProtectedRoute>
      } />
      <Route path="/candidate/quick-job-intro" element={
        <ProtectedRoute allowedRoles={['candidate']}>
          <QuickJobIntroPage />
        </ProtectedRoute>
      } />
      
      {/* Employer Routes */}
      <Route path="/employer/dashboard" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <EmployerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/employer/post-job" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <PostJob />
        </ProtectedRoute>
      } />
      <Route path="/employer/post-quick-job" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <PostQuickJob />
        </ProtectedRoute>
      } />
      <Route path="/employer/verification" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <CompanyVerification />
        </ProtectedRoute>
      } />
      {/* <Route path="/employer/jobs" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <JobManagement />
        </ProtectedRoute>
      } /> */}
      <Route path="/employer/standard-jobs" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <Applications />
        </ProtectedRoute>
      } />
      <Route path="/employer/profile" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <EmployerProfile />
        </ProtectedRoute>
      } />
      <Route path="/employer/notifications" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <EmployerNotifications />
        </ProtectedRoute>
      } />
      <Route path="/employer/subscription" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <Subscription />
        </ProtectedRoute>
      } />
      <Route path="/employer/quick-jobs" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <HRManagement />
        </ProtectedRoute>
      } />
      <Route path="/employer/settings" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <EmployerSettings />
        </ProtectedRoute>
      } />
      <Route path="/employer/analytics" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <Analytics />
        </ProtectedRoute>
      } />

      <Route path="/employer/wallet" element={
        <ProtectedRoute allowedRoles={['employer']}>
          <EmployerWallet />
        </ProtectedRoute>
      } />

      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/candidates" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <CandidatesManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/candidates/:id" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <CandidateDetail />
        </ProtectedRoute>
      } />
      <Route path="/admin/employers" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <EmployersManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/employers/:id" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <EmployerDetail />
        </ProtectedRoute>
      } />
      <Route path="/admin/packages" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <PackagesManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminSettings />
        </ProtectedRoute>
      } />
      <Route path="/admin/wallet" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminWallet />
        </ProtectedRoute>
      } />
      <Route path="/admin/escrow" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminEscrow />
        </ProtectedRoute>
      } />
      <Route path="/admin/posts" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <PostsManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/support" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminSupport />
        </ProtectedRoute>
      } />
      <Route path="/admin/notifications" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminNotifications />
        </ProtectedRoute>
      } />
      <Route path="/admin/profile" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminProfile />
        </ProtectedRoute>
      } />
      <Route path="/admin/management" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminManagement />
        </ProtectedRoute>
      } />

      {/* Catch-all: redirect mọi URL không khớp về trang chủ */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </LanguageProvider>
    </CustomThemeProvider>
  );
}

function ThemedApp() {
  const { isDarkMode } = useTheme();
  // Đọc BASE_URL từ Vite (vite.config.js base: '/') — local: '/', GitHub Pages: '/OpPoReview/'
  const basename = import.meta.env.BASE_URL || '/';

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : theme}>
      <GlobalStyles />
      <Router basename="/">
        <ScrollToTop />
        <AppRoutes />
        <FloatingSupportBar />
      </Router>
    </ThemeProvider>
  );
}

export default App;
