import React from 'react';
import { Menu, Bell, User, HelpCircle } from 'lucide-react';

export default function OrgNavbar({ 
  currentPageName = 'Dashboard', 
  onMenuClick, 
  className = '' 
}) {
  return (
    <div className={`flex-shrink-0 bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20 ${className}`}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-50"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        <div className="flex-1 lg:flex lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 lg:text-xl">
              {currentPageName}
            </h1>
            <p className="text-sm text-slate-600 hidden sm:block">
              Manage your fundraising activities
            </p>
          </div>
          
          {/* Top bar actions */}
          <div className="flex items-center space-x-1">
            {/* Help button */}
            <button 
              className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-50 transition-colors" 
              title="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            
            {/* Notifications */}
            <button 
              className="relative text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-50 transition-colors" 
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full"></span>
            </button>
            
            {/* User menu button (for mobile) */}
            <div className="lg:hidden">
              <button className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}