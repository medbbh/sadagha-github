import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Bell, User, HelpCircle } from 'lucide-react';
import LanguageSelector from '../LanguageSelector'; // Adjust path as needed

export default function OrgNavbar({ 
  currentPageName = 'Dashboard', 
  onMenuClick, 
  isRTL = false,
  className = '' 
}) {
  const { t } = useTranslation();

  return (
    <div className={`flex-shrink-0 bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20 ${className}`}>
      <div className={`flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 `}>
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-50"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        <div className={`flex-1 lg:flex lg:items-center lg:justify-between `}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-lg font-semibold text-slate-900 lg:text-xl">
              {currentPageName}
            </h1>
            <p className="text-sm text-slate-600 hidden sm:block">
              {t('organization.navbar.subtitle')}
            </p>
          </div>
          
          {/* Top bar actions */}
          <div className={`flex items-center space-x-1 ${isRTL ? 'space-x-reverse' : ''}`}>
            {/* Language Selector */}
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
            
            {/* Help button */}
            <button 
              className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-50 transition-colors" 
              title={t('organization.navbar.help')}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            
            {/* Notifications */}
            <button 
              className="relative text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-50 transition-colors" 
              title={t('organization.navbar.notifications')}
            >
              <Bell className="w-5 h-5" />
              <span className={`absolute ${isRTL ? 'left-1.5' : 'right-1.5'} top-1.5 w-2 h-2 bg-red-400 rounded-full`}></span>
            </button>
            
            {/* User menu button (for mobile) */}
            <div className="lg:hidden">
              <button 
                className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                title={t('organization.navbar.userMenu')}
              >
                <User className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Language Selector */}
            <div className="sm:hidden">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}