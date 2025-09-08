import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
  User
} from 'lucide-react';

export default function OrgSidebar({
  navigationItems = [],
  sidebarOpen,
  sidebarCollapsed,
  onCloseSidebar,
  onToggleCollapse,
  user,
  onLogout,
  loading = false,
  isRTL = false,
  className = ''
}) {
  const { t } = useTranslation();

  const sidebarWidth = sidebarCollapsed ? 'w-24' : 'w-64';
  const sidebarPosition = isRTL ? 'right-0' : 'left-0';
  const translateClass = isRTL
    ? (sidebarOpen ? 'translate-x-0' : 'translate-x-full')
    : (sidebarOpen ? 'translate-x-0' : '-translate-x-full');

  return (
    <div className={`fixed inset-y-0 ${sidebarPosition} z-40 ${sidebarWidth} bg-white shadow-sm border-${isRTL ? 'l' : 'r'} border-slate-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${translateClass} ${className}`}>
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className={`flex items-center ${isRTL ? 'justify-start' : 'justify-between'} h-16 px-3 border-b border-slate-100 flex-shrink-0 bg-slate-800`}>
          {!sidebarCollapsed && (
            <Link to="/organization" className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-white">
                <span className="font-medium text-base">{t('organization.sidebar.organization')}</span>
                <p className="text-xs text-slate-300">{t('organization.sidebar.dashboard')}</p>
              </div>
            </Link>
          )}

          {sidebarCollapsed && (
            <Link to="/organization" className="flex items-center justify-center w-full">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-700" />
              </div>
            </Link>
          )}

          {/* Mobile close button */}
          {!sidebarCollapsed && (
            <button
              onClick={onCloseSidebar}
              className={`lg:hidden text-slate-300 hover:text-white p-1 ${isRTL ? 'mr-auto' : 'ml-auto'}`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation - Scrollable area */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.disabled ? "#" : item.href}   // fallback so it doesn't navigate
              onClick={(e) => {
                if (item.disabled) {
                  e.preventDefault(); // block navigation
                } else {
                  onCloseSidebar();
                }
              }}
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 
    ${item.disabled
                  ? "text-slate-400 cursor-not-allowed bg-gray-50"
                  : item.current
                    ? `bg-slate-100 text-slate-900 border-${isRTL ? "r" : "l"}-3 border-slate-600`
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }
  `}
              title={sidebarCollapsed ? item.name : ""}
            >
              <item.icon
                className={`h-5 w-5 transition-colors 
      ${item.disabled
                    ? "text-slate-300"
                    : item.current
                      ? "text-slate-700"
                      : "text-slate-400 group-hover:text-slate-600"
                  }
      ${sidebarCollapsed ? "" : isRTL ? "ml-3" : "mr-3"}
    `}
              />
              {!sidebarCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>

          ))}
        </nav>

        {/* User info and logout - Fixed at bottom */}
        <div className="border-t border-slate-100 p-3 flex-shrink-0 bg-slate-50">
          {!sidebarCollapsed ? (
            <>
              <Link to={'/organization/profile'} className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 transition-colors mb-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user?.user_metadata.full_name || t('organization.sidebar.user')}
                  </p>
                  <p className="text-xs text-slate-500">{t('organization.sidebar.administrator')}</p>
                </div>
              </Link>

              <button
                onClick={onLogout}
                disabled={loading}
                className={`flex items-center w-full px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 `}
              >
                <LogOut className={`h-4 w-4 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                {loading ? t('organization.sidebar.signingOut') : t('organization.sidebar.signOut')}
              </button>
            </>
          ) : (
            <div className="space-y-3 flex flex-col items-center">
              <Link to={'/organization/profile'} className="flex items-center justify-center p-2.5 rounded-lg hover:bg-slate-100 transition-colors" title={t('organization.sidebar.profile')}>
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              </Link>

              <button
                onClick={onLogout}
                disabled={loading}
                className="flex items-center justify-center w-full p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                title={t('organization.sidebar.signOut')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop collapse button - positioned on the right edge, middle of sidebar */}
      <button
        onClick={onToggleCollapse}
        className={`hidden lg:flex items-center justify-center absolute top-1/2 -translate-y-1/2 ${isRTL ? '-left-3.5' : '-right-3.5'} w-7 h-7 bg-white border-2 border-slate-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-400 z-50`}
        title={sidebarCollapsed ? t('organization.sidebar.expandSidebar') : t('organization.sidebar.collapseSidebar')}
      >
        {isRTL ? (
          <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''
            }`} />
        ) : (
          <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''
            }`} />
        )}
      </button>
    </div>
  );
}