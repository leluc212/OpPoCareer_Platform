import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles, theme, darkTheme } from './styles/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from './context/ThemeContext';
import ScrollToTop from './components/ScrollToTop';
import FloatingSupportBar from './components/FloatingSupportBar';
import { AlertProvider } from './components/AlertModal';

// Fast core page imports
import LandingPage from './pages/auth/LandingPage';
import LoginPage from './pages/auth/LoginPage';

// Lazy Loaded Auth Pages
const RegisterRoleSelection = lazy(() => import('./pages/auth/RegisterRoleSelection'));
const CandidateRegister = lazy(() => import('./pages/auth/CandidateRegister'));
const EmployerRegister = lazy(() => import('./pages/auth/EmployerRegister'));
const OTPVerification = lazy(() => import('./pages/auth/OTPVerification'));
const PendingApproval = lazy(() => import('./pages/auth/PendingApproval'));
const DownloadApp = lazy(() => import('./pages/auth/DownloadApp'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const GoogleRoleSetupPage = lazy(() => import('./pages/auth/GoogleRoleSetupPage'));

// Other Pages
const TermsUrgentJobs = lazy(() => import('./pages/TermsUrgentJobs'));

// Lazy Loaded Candidate Pages
const CandidateDashboard = lazy(() => import('./pages/candidate/CandidateDashboard'));
const JobListing = lazy(() => import('./pages/candidate/JobListing'));
const CandidateProfile = lazy(() => import('./pages/candidate/CandidateProfile'));
const CandidateSettings = lazy(() => import('./pages/candidate/CandidateSettings'));
const CandidateNotifications = lazy(() => import('./pages/candidate/CandidateNotifications'));
const EmployerProfileView = lazy(() => import('./pages/candidate/EmployerProfileView'));
const EmployerDirectory = lazy(() => import('./pages/candidate/EmployerDirectory'));
const PublicJobListing = lazy(() => import('./pages/candidate/PublicJobListing'));
const AboutPage = lazy(() => import('./pages/auth/AboutPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TransactionTermsPage = lazy(() => import('./pages/TransactionTermsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const RegisterPolicyPage = lazy(() => import('./pages/RegisterPolicyPage'));
const CandidatePolicyPage = lazy(() => import('./pages/CandidatePolicyPage'));
const EmployerPolicyPage = lazy(() => import('./pages/EmployerPolicyPage'));
const CVTemplates = lazy(() => import('./pages/auth/CVTemplates'));
const MobileAppPage = lazy(() => import('./pages/MobileAppPage'));
const AIRecommendationsPage = lazy(() => import('./pages/AIRecommendationsPage'));
const Wallet = lazy(() => import('./pages/candidate/Wallet'));
const Availability = lazy(() => import('./pages/candidate/Availability'));
const CandidatePosts = lazy(() => import('./pages/candidate/CandidatePosts'));
const JobDetail = lazy(() => import('./pages/candidate/JobDetail'));
const ChangePassword = lazy(() => import('./pages/candidate/ChangePassword'));
const DeleteAccount = lazy(() => import('./pages/candidate/DeleteAccount'));
const CandidateKYC = lazy(() => import('./pages/candidate/CandidateKYC'));
const QuickJobIntroPage = lazy(() => import('./pages/candidate/QuickJobIntroPage'));
const CandidateTermsPage = lazy(() => import('./pages/candidate/CandidateTermsPage'));
const CandidatePrivacyPage = lazy(() => import('./pages/candidate/CandidatePrivacyPage'));

// Lazy Loaded Employer Pages
const EmployerDashboard = lazy(() => import('./pages/employer/EmployerDashboard'));
const EmployerTermsPage = lazy(() => import('./pages/employer/EmployerTermsPage'));
const EmployerPrivacyPage = lazy(() => import('./pages/employer/EmployerPrivacyPage'));
const PostJob = lazy(() => import('./pages/employer/PostJob'));
const PostQuickJob = lazy(() => import('./pages/employer/PostQuickJob'));
const CompanyVerification = lazy(() => import('./pages/employer/CompanyVerification'));
const JobManagement = lazy(() => import('./pages/employer/JobManagement'));
const Applications = lazy(() => import('./pages/employer/Applications'));
const EmployerProfile = lazy(() => import('./pages/employer/EmployerProfile'));
const CVViewer = lazy(() => import('./pages/employer/CVViewer'));
const EmployerNotifications = lazy(() => import('./pages/employer/EmployerNotifications'));
const Subscription = lazy(() => import('./pages/employer/Subscription'));
const HRManagement = lazy(() => import('./pages/employer/HRManagement'));
const EmployerSettings = lazy(() => import('./pages/employer/EmployerSettings'));
const Analytics = lazy(() => import('./pages/employer/Analytics'));
const EmployerWallet = lazy(() => import('./pages/employer/EmployerWallet'));

// Lazy Loaded Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CandidatesManagement = lazy(() => import('./pages/admin/CandidatesManagement'));
const CandidateDetail = lazy(() => import('./pages/admin/CandidateDetail'));
const EmployersManagement = lazy(() => import('./pages/admin/EmployersManagement'));
const EmployerDetail = lazy(() => import('./pages/admin/EmployerDetail'));
const PackagesManagement = lazy(() => import('./pages/admin/PackagesManagement'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminWallet = lazy(() => import('./pages/admin/AdminWallet'));
const PostsManagement = lazy(() => import('./pages/admin/PostsManagement'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const AdminManagement = lazy(() => import('./pages/admin/AdminManagement'));
const BannersManagement = lazy(() => import('./pages/admin/BannersManagement'));
const AdminChangeRequests = lazy(() => import('./pages/admin/AdminChangeRequests'));

const PageFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
    fontSize: '16px',
    color: '#1e40af',
    fontWeight: 600
  }}>
    <div>Đang tải...</div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const redirect = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If user has NO role yet, redirect to Google role setup
    if (!user?.role) {
      return <Navigate to="/auth/google-role-setup" replace />;
    }

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
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
        <Route path="/download" element={<DownloadApp />} />
        <Route path="/app" element={<MobileAppPage />} />
        <Route path="/ai-jobs" element={<AIRecommendationsPage />} />
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
        <Route path="/jobs/:jobId" element={<LandingPage><JobDetail standalone={false} /></LandingPage>} />
        <Route path="/about" element={<LandingPage><AboutPage /></LandingPage>} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-transaction" element={<TransactionTermsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/policy" element={<TermsOfServicePage />} />
        <Route path="/policyregister" element={<RegisterPolicyPage />} />
        <Route path="/cv-viewer" element={<CVViewer />} />
        <Route path="/policy/candidate" element={<CandidatePolicyPage />} />
        <Route path="/policy/employer" element={<EmployerPolicyPage />} />
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
        <Route path="/candidate/jobs/:jobId" element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <JobDetail />
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
        <Route path="/candidate/policy/terms" element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <CandidateTermsPage />
          </ProtectedRoute>
        } />
        <Route path="/candidate/policy/privacy" element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <CandidatePrivacyPage />
          </ProtectedRoute>
        } />

        {/* Employer Routes */}
        <Route path="/employer/dashboard" element={
          <ProtectedRoute allowedRoles={['employer']}>
            <EmployerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/employer/policy/terms" element={
          <ProtectedRoute allowedRoles={['employer']}>
            <EmployerTermsPage />
          </ProtectedRoute>
        } />
        <Route path="/employer/policy/privacy" element={
          <ProtectedRoute allowedRoles={['employer']}>
            <EmployerPrivacyPage />
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
        <Route path="/admin/banners" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <BannersManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/change-requests" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminChangeRequests />
          </ProtectedRoute>
        } />
        <Route path="/admin/experiences" element={<Navigate to="/admin/candidates?tab=experiences" replace />} />
        {/* Catch-all: redirect mọi URL không khớp về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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

  // Prefetch main auth and dashboard route chunks in background idle time for 0ms transition latency
  React.useEffect(() => {
    const prefetchKeyRoutes = () => {
      import('./pages/auth/RegisterRoleSelection');
      import('./pages/auth/CandidateRegister');
      import('./pages/auth/EmployerRegister');
      import('./pages/candidate/CandidateDashboard');
      import('./pages/employer/EmployerDashboard');
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(prefetchKeyRoutes, { timeout: 3000 });
      return () => window.cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(prefetchKeyRoutes, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : theme}>
      <GlobalStyles />
      <AlertProvider>
        <Router basename="/">
          <ScrollToTop />
          <AppRoutes />
          <FloatingSupportBar />
        </Router>
      </AlertProvider>
    </ThemeProvider>
  );
}

export default App;
