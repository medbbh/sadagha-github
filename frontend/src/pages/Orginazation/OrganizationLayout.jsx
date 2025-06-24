import React, { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  User,
  HelpCircle
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import Loading from "../../components/common/Loading";

export default function OrganizationLayout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
            <Link to="/organization" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ORG</span>
              </div>
              <span className="font-semibold text-gray-900">Dashboard</span>
            </Link>
            
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation - Scrollable area */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto min-h-0">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  item.current
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${
                  item.current ? 'text-blue-600' : 'text-gray-400'
                }`} />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User info and logout - Fixed at bottom */}
          <div className="border-t border-gray-200 p-4 flex-shrink-0">
            <Link to={'/organization/profile'} className="flex items-center space-x-3 mb-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'Organization User'}
                </p>
                <p className="text-xs text-gray-500">Organization Account</p>
              </div>
            </div>
            </Link>
            
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <LogOut className="mr-3 h-4 w-4" />
              {loading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top navigation bar - Fixed */}
        <div className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page title - you can make this dynamic */}
            <div className="flex-1 lg:flex lg:items-center lg:justify-between">
              <h1 className="text-lg font-semibold text-gray-900 lg:text-xl">
                {navigationItems.find(item => item.current)?.name || 'Dashboard'}
              </h1>
              
              {/* Top bar actions */}
              <div className="flex items-center space-x-4">
                {/* Help button */}
                <button className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
                  <HelpCircle className="w-5 h-5" />
                </button>
                
                {/* Notifications */}
                <button className="relative text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                {/* User menu button (for mobile) */}
                <div className="lg:hidden">
                  <button className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
                    <User className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="flex-shrink-0 mx-4 mt-4 sm:mx-6 lg:mx-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content area - Scrollable */}
        <main className="flex-1 overflow-auto min-h-0">
          <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {loading ? <Loading /> : <Outlet />}
          </div>
        </main>

        {/* Footer - Fixed */}
        <footer className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 max-w-7xl mx-auto">
            <p>&copy; 2024 Your Fundraising Platform. All rights reserved.</p>
            <div className="flex space-x-4 mt-2 sm:mt-0">
              <Link to="/help" className="hover:text-gray-700">Help</Link>
              <Link to="/privacy" className="hover:text-gray-700">Privacy</Link>
              <Link to="/terms" className="hover:text-gray-700">Terms</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}