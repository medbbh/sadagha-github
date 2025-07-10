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
import VolunteerPage from './pages/User/VolunteerPage';
import UserProfilePage from './pages/User/UserProfilePage';
import OrganizationDashboard from './pages/Orginazation/Home/OrganizationDashboard';
import CampaignEdit from './pages/Orginazation/CampaignEdit';
import Analytics from './pages/Orginazation/Analytics';

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
    return <Navigate to="/login" replace />;
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
  } else {
    console.log('No valid role, redirecting to confirm-role');
    return <Navigate to="/confirm-role" replace />;
  }
};

function App() {
  const { user, loading } = useAuth();

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

      {/* USER routes */}
      <Route element={
        <ProtectedRoute allowedRoles={['user']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/feed" element={<Home />} />
        <Route path="/explore" element={<ExploreCampaigns />} />
        <Route path="/campaign/:campaignId" element={<CampaignDetail />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/campaign/:campaignId/donate/:donationAmount" element={<DonationPaymentPage />} />
        <Route path="/campaign/:campaignId/donation/success" element={<DonationSuccessPage />} />
        <Route path="/volunteer" element={<VolunteerPage />} />
        <Route path="/profile" element={<UserProfilePage />} />

        <Route path="/auth/facebook/callback" element={<FacebookOAuthCallback />} />


     </Route>

      {/* ORGANIZATION routes */}
      <Route element={
        <ProtectedRoute allowedRoles={['organization']}>
          <OrganizationLayout />
        </ProtectedRoute>
      }>
        <Route path="/organization" element={<OrganizationDashboard />} />
        <Route path="/organization/campaigns" element={<CampaignsList />} />
        <Route path="/organization/campaigns/create" element={<CreateCampaignForm />} />
        <Route path="/organization/campaigns/:campaignId" element={<CampaignDetails />} />
        <Route path="/organization/campaigns/:campaignId/edit" element={<CampaignEdit />} />
        <Route path="/organization/profile" element={<OrganizationProfile />} />
        <Route path="/organization/analytics" element={<Analytics />} />
        R
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App