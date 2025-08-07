import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function OrgFooter({ 
  companyName = 'Fundraising Platform',
  year = new Date().getFullYear(),
  isRTL = false,
  className = '' 
}) {
  const { t } = useTranslation();

  return (
    <footer className={`flex-shrink-0 bg-white border-t border-slate-200 mt-auto ${className}`}>
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 max-w-7xl mx-auto `}>
          <p className={isRTL ? 'text-right' : 'text-left'}>
            {t('organization.footer.copyright', { year, companyName })}
          </p>
          <div className={`flex space-x-6 mt-2 sm:mt-0 ${isRTL ? 'space-x-reverse' : ''}`}>
            <Link to="/help" className="hover:text-slate-700 transition-colors">
              {t('organization.footer.help')}
            </Link>
            <Link to="/privacy" className="hover:text-slate-700 transition-colors">
              {t('organization.footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-slate-700 transition-colors">
              {t('organization.footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}