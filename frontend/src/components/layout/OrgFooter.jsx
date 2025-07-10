import React from 'react';
import { Link } from 'react-router-dom';

export default function OrgFooter({ 
  companyName = 'Fundraising Platform',
  year = new Date().getFullYear(),
  className = '' 
}) {
  return (
    <footer className={`flex-shrink-0 bg-white border-t border-slate-200 mt-auto ${className}`}>
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 max-w-7xl mx-auto">
          <p>&copy; {year} {companyName}. All rights reserved.</p>
          <div className="flex space-x-6 mt-2 sm:mt-0">
            <Link to="/help" className="hover:text-slate-700 transition-colors">
              Help
            </Link>
            <Link to="/privacy" className="hover:text-slate-700 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-slate-700 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}