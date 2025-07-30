import React, { useState, useEffect, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building2, Target, DollarSign, Folder,
  LogOut, ChevronLeft, ChevronRight, Menu, X,
  BarChart3, Shield, Activity, TrendingUp
} from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext'; // Adjust the path as needed

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  // Get current page from URL
  const getCurrentPage = () => {
    const pathSegments = location.pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Handle nested routes and default to dashboard if empty
    if (!lastSegment || lastSegment === 'admin') {
      return 'dashboard';
    }
    return lastSegment;
  };

  // Persist sidebar state in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Analytics',
      path: '/admin/dashboard'
    },
    {
      id: 'users',
      name: 'User Management',
      icon: Users,
      description: 'Manage platform users',
      path: '/admin/users'
    },
    {
      id: 'organizations',
      name: 'Organizations',
      icon: Building2,
      description: 'Verify & manage orgs',
      path: '/admin/organizations'
    },
    {
      id: 'campaigns',
      name: 'Campaigns',
      icon: Target,
      description: 'Monitor fundraising',
      path: '/admin/campaigns'
    },
    {
      id: 'financial',
      name: 'Financial',
      icon: DollarSign,
      description: 'Transactions & revenue',
      path: '/admin/financial'
    },
    {
      id: 'categories',
      name: 'Categories',
      icon: Folder,
      description: 'Manage campaign types',
      path: '/admin/categories'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    // Don't close mobile menu here, let useEffect handle it on route change
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('admin-sidebar-collapsed'); // Clear sidebar state on logout
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback - still navigate to login even if logout fails
      localStorage.removeItem('admin-sidebar-collapsed');
      navigate('/login');
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const activePage = getCurrentPage();

  const Sidebar = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'justify-between'} p-4 border-b border-gray-200`}>
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900">Admin Panel</span>
          </div>
        )}
        
        {/* Desktop collapse button */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}

        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center p-3 rounded-lg text-left transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={isCollapsed && !isMobile ? item.name : ''}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-500'} flex-shrink-0`} />
              
              {(!isCollapsed || isMobile) && (
                <div className="ml-3 min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="text-xs text-gray-500 truncate">{item.description}</div>
                </div>
              )}

              {(!isCollapsed || isMobile) && isActive && (
                <div className="ml-2 h-2 w-2 bg-blue-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>


      {/* Bottom section */}
      <div className="p-4 border-t border-gray-200">
        {(!isCollapsed || isMobile) && (
          <div className="mb-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">A</span>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">Admin User</div>
                <div className="text-xs text-gray-500">admin@example.com</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200 ${
              isCollapsed && !isMobile ? 'justify-center' : ''
            }`}
            title={isCollapsed && !isMobile ? 'Logout' : ''}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {(!isCollapsed || isMobile) && <span className="ml-3 text-sm">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-gray-600 bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}>
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar isMobile={true} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Page title */}
              <div className="ml-10 lg:ml-0">
                <h1 className="text-xl font-semibold text-gray-900 capitalize">
                  {menuItems.find(item => item.id === activePage)?.name || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* User menu */}
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">A</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
