import './App.css'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Signup from './pages/Auth/Signup'
import Login from './pages/Auth/Login'
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Layout from './pages/User/Layout';
import Home from './pages/User/Home';
import ConfirmRole from './components/ui/ConfirmRole';
import Unauthorized from './pages/Errors/Unauthorized';
import NotFound from './pages/Errors/NotFound';
import OrganizationLayout from './pages/Orginazation/OrganizationLayout';
import Loading from './components/common/Loading';
// import Campaigns from './pages/Orginazation/Campaigns/Campaigns';
import CampaignDetail from './components/ui/CampaignDetail';
import { useAuth } from './contexts/AuthContext';
import ExploreCampaigns from './pages/User/ExploreCampaigns';
import Categories from './pages/User/Categories';
import CampaignsList from './pages/Orginazation/Campaigns';
import CreateCampaignForm from './components/ui/CreateCampaignForm';
import CampaignDetails from './pages/Orginazation/CampaignDetails';
import OrganizationProfile from './pages/Orginazation/Profile/OrganizationProfile';
import DonationPaymentPage from './pages/User/DonationPaymentPage';
import DonationSuccessPage from './components/ui/DonationSuccessPage';
import FacebookOAuthCallback from './pages/FacebookOAuthCallback';
import UserProfilePage from './pages/User/UserProfilePage';
import OrganizationDashboard from './pages/Orginazation/Home/OrganizationDashboard';
import CampaignEdit from './pages/Orginazation/CampaignEdit';
import Analytics from './pages/Orginazation/Analytics';
import VolunteerRequestsList from './pages/Orginazation/VolunteerRequestsList';
import VolunteerDashboard from './pages/User/VolunteerDashboard';
import CreateVolunteerRequest from './pages/Orginazation/CreateVolunteerRequest';
import VolunteerRequestDetail from './pages/Orginazation/VolunteerRequestDetail';
import VolunteerMatching from './pages/Orginazation/VolunteerMatching';
import EditVolunteerRequest from './pages/Orginazation/EditVolunteerRequest';
import VolunteerInvitations from './pages/User/VolunteerInvitations';
import UserManagement from './pages/Admin/UserManagement';
import OrganizationManagement from './pages/Admin/OrganizationManagement';
import CampaignManagement from './pages/Admin/CampaignManagement';
import CategoryManagement from './pages/Admin/CategoryManagement';
import FinancialManagement from './pages/Admin/FinancialManagement';
import AdminLayout from './pages/Admin/AdminLayout';
import './i18n';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import HowItWorksPage from './pages/User/HowItWorksPage';
import OrganizationsList from './components/ui/OrganizationsList';
import OrganizationDetail from './components/ui/OrganizationDetail';
import InvitedVolunteers from './pages/Orginazation/InvitedVolunteers';
import PublicLayout from './pages/User/PublicLayout';
import VerifiedProtectedRoute from './components/VerifiedProtectedRoute';
// RoleBasedRedirect component to handle redirection based on user role
const RoleBasedRedirect = () => {
  const { user, loading, getUserRole, isFullyAuthenticated, needsRegistration } = useAuth();
  
  console.log('RoleBasedRedirect state:', { 
    user: !!user, 
    loading,
    userEmail: user?.email,
    role: getUserRole(),
    isFullyAuthenticated: isFullyAuthenticated(),
    needsRegistration: needsRegistration()
  });
  
  if (loading) {
    console.log('Showing loading: auth loading');
    return <Loading />;
  }
  
  if (!user) {
    console.log('No user, redirecting to login');
    return <Navigate to="/feed" replace />;
  }
  
  if (needsRegistration()) {
    console.log('User needs to complete registration');
    return <Navigate to="/confirm-role" replace />;
  }
  
  if (!isFullyAuthenticated()) {
    console.log('User not fully authenticated, showing loading');
    return <Loading />;
  }
  
  const role = getUserRole();
  console.log('User role determined:', role);
  
  if (role === 'organization') {
    console.log('Redirecting to organization dashboard');
    return <Navigate to="/organization" replace />;
  } else if (role === 'user') {
    console.log('Redirecting to user feed');
    return <Navigate to="/feed" replace />;
  }
  else if (role === 'admin') {
    console.log('Redirecting to admin dashboard');
    return <Navigate to="/admin" replace />;
  } else {
    console.log('No valid role, redirecting to confirm-role');
    return <Navigate to="/confirm-role" replace />;
  }
};

function App() {
  const { user, loading } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set document direction and language based on current language
    const setDocumentLanguage = (language) => {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    };

    // Set initial language
    setDocumentLanguage(i18n.language);

    // Listen for language changes
    i18n.on('languageChanged', setDocumentLanguage);

    // Cleanup
    return () => {
      i18n.off('languageChanged', setDocumentLanguage);
    };
  }, [i18n]);

  // Show loading screen while checking authentication
  if (loading) return <Loading />;

  return (
    <Routes>
      <Route path="/" element={<RoleBasedRedirect />} />

      {/* Public routes - redirect to home if already logged in */}
      <Route path="/signup" element={
        user ? <Navigate to="/" replace /> : <Signup />
      } />
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <Login />
      } />
      <Route path="/forgot-password" element={
        user ? <Navigate to="/" replace /> : <ForgotPassword />
      } />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/confirm-role" element={<ConfirmRole />} />
      <Route path="/unauthorized" element={<Unauthorized />} />


      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      } >

      <Route path="/admin/users" element={<UserManagement />} />
      <Route path="/admin/organizations" element={<OrganizationManagement />} />
      <Route path="/admin/campaigns" element={<CampaignManagement />} />
      <Route path="/admin/financial" element={<FinancialManagement />} />
      <Route path="/admin/categories" element={<CategoryManagement />} />
      </Route>
      

      
      {/* USER routes */}
      <Route element={<PublicLayout />}>
        <Route path="/feed" element={<Home />} />
        <Route path="/explore" element={<ExploreCampaigns />} />
        <Route path="/campaign/:campaignId" element={<CampaignDetail />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/organizations" element={<OrganizationsList />} />
        <Route path="/organizations/:id" element={<OrganizationDetail />} />
      </Route>

      <Route element={
        <ProtectedRoute allowedRoles={['user']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/campaign/:campaignId/donate/:donationAmount" element={<DonationPaymentPage />} />
        <Route path="/campaign/:campaignId/donation/success" element={<DonationSuccessPage />} />
        <Route path="/profile" element={<UserProfilePage />} />

    
        {/* <Route path="/volunteer" element={<VolunteerDashboard />} /> */}
        <Route path="/volunteer/invitations" element={<VolunteerInvitations />} />

        <Route path="/auth/facebook/callback" element={<FacebookOAuthCallback />} />

      </Route>

      {/* ORGANIZATION routes */}
      <Route element={
        <ProtectedRoute allowedRoles={['organization']}>
          <OrganizationLayout />
        </ProtectedRoute>
      }>
        <Route path="/organization" element={<OrganizationDashboard />} />
        <Route path="/organization/campaigns" element={<VerifiedProtectedRoute><CampaignsList /></VerifiedProtectedRoute>} />
        <Route path="/organization/campaigns/create" element={<VerifiedProtectedRoute><CreateCampaignForm /></VerifiedProtectedRoute>} />
        <Route path="/organization/campaigns/:campaignId" element={<VerifiedProtectedRoute><CampaignDetails /></VerifiedProtectedRoute>} />
        <Route path="/organization/campaigns/:campaignId/edit" element={<VerifiedProtectedRoute><CampaignEdit /></VerifiedProtectedRoute>} />
        <Route path="/organization/profile" element={<OrganizationProfile />} />
        <Route path="/organization/analytics" element={<VerifiedProtectedRoute><Analytics /></VerifiedProtectedRoute>} />

        <Route path="/organization/volunteers" element={<VerifiedProtectedRoute><VolunteerRequestsList /></VerifiedProtectedRoute>} />
        <Route path="/organization/volunteers/requests" element={<VerifiedProtectedRoute><VolunteerRequestsList /></VerifiedProtectedRoute>} />
        <Route path="/organization/volunteers/requests/create" element={<VerifiedProtectedRoute><CreateVolunteerRequest /></VerifiedProtectedRoute>} />
        <Route path="/organization/volunteers/requests/:requestId/edit" element={<VerifiedProtectedRoute><EditVolunteerRequest /></VerifiedProtectedRoute>} />
        <Route path="/organization/volunteers/requests/:requestId" element={<VerifiedProtectedRoute><VolunteerRequestDetail /></VerifiedProtectedRoute>} />
        <Route path="/organization/volunteers/requests/:requestId/invitations" element={<VerifiedProtectedRoute><InvitedVolunteers /></VerifiedProtectedRoute>} />

        <Route path="/organization/volunteers/requests/:requestId/matches" element={<VerifiedProtectedRoute><VolunteerMatching /></VerifiedProtectedRoute>} />     
      </Route>


      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App