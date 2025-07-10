import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  FileText, 
  BarChart3, 
  Settings
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import Loading from "../../components/common/Loading";
import OrgNavbar from "../../components/layout/OrgNavbar";
import OrgFooter from "../../components/layout/OrgFooter";
import OrgSidebar from "../../components/layout/OrgSidebar";

export default function OrganizationLayout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: authLogout, user } = useAuth();

  const handleLogout = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message);
      } else {
        authLogout();
        navigate('/login');
      }
    } catch (err) {
      setError('An unexpected error occurred during logout');
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/organization',
      icon: Home,
      current: location.pathname === '/organization'
    },
    {
      name: 'Campaigns',
      href: '/organization/campaigns',
      icon: FileText,
      current: location.pathname.startsWith('/organization/campaigns')
    },
    {
      name: 'Analytics',
      href: '/organization/analytics',
      icon: BarChart3,
      current: location.pathname.startsWith('/organization/analytics')
    },
    {
      name: 'Settings',
      href: '/organization/settings',
      icon: Settings,
      current: location.pathname.startsWith('/organization/settings')
    }
  ];

  const currentPageName = navigationItems.find(item => item.current)?.name || 'Dashboard';
  const mainMargin = sidebarCollapsed ? 'lg:ml-24' : 'lg:ml-64';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900 bg-opacity-25 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <OrgSidebar
        navigationItems={navigationItems}
        sidebarOpen={sidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        onCloseSidebar={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={handleLogout}
        loading={loading}
      />

      {/* Main content wrapper */}
      <div className={`${mainMargin} transition-all duration-300 ease-in-out min-h-screen flex flex-col`}>
        {/* Navbar Component */}
        <OrgNavbar
          currentPageName={currentPageName}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Error display */}
        {error && (
          <div className="flex-shrink-0 mx-4 mt-4 sm:mx-6 lg:mx-8">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm">{error}</span>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800 ml-4"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content area - Flexible height */}
        <main className="flex-1">
          <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-full">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loading />
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>

        {/* Footer Component */}
        <OrgFooter 
          companyName="Fundraising Platform"
          year={2024}
        />
      </div>
    </div>
  );
}