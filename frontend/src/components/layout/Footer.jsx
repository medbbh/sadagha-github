import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <footer className="bg-white border-t border-gray-200 mt-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className={`flex items-center gap-2 mb-4 ${isRTL ? '' : ''}`}>
              <img src="/logo.png" alt="صدقة" className="h-14" />
            </div>
            <p className={`text-gray-600 text-sm leading-relaxed mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('footer.description', 'A bridge of giving that connects generous hearts with those in need through verified and transparent charity campaigns.')}
            </p>
            <div className="flex gap-3">
              <a href="#" aria-label="Facebook" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-[#3366CC] hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" aria-label="Twitter" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-[#3366CC] hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-[#3366CC] hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className={`text-sm font-semibold text-[#3366CC] mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('footer.explore', 'Explore')}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="/explore" className={`text-gray-600 hover:text-[#3366CC] text-sm transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('footer.browseCampaigns', 'Browse Campaigns')}
                </a>
              </li>
              <li>
                <a href="/categories" className={`text-gray-600 hover:text-[#3366CC] text-sm transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('footer.categories', 'Categories')}
                </a>
              </li>
              <li>
                <a href="/organizations" className={`text-gray-600 hover:text-[#3366CC] text-sm transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('footer.organizations', 'Organizations')}
                </a>
              </li>
              <li>
                <a href="/how-it-works" className={`text-gray-600 hover:text-[#3366CC] text-sm transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('footer.howItWorks', 'How It Works')}
                </a>
              </li>
              <li>
                <a href="/profile?tab=volunteer" className={`text-gray-600 hover:text-[#3366CC] text-sm transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('footer.volunteer', 'Volunteer')}
                </a>
              </li>
            </ul>
          </div>

          {/* Support & Account */}
          <div>
            <h4 className={`text-sm font-semibold text-[#3366CC] mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('footer.support', 'Support')}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="/about" className={`text-gray-600 hover:text-[#3366CC] text-sm transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('footer.aboutUs', 'About Us')}
                </a>
              </li>
              <li>
                <a href="/contact" className={`text-gray-600 hover:text-[#3366CC] text-sm transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('footer.contact', 'Contact')}
                </a>
              </li>
              <li>
                <a href="/faq" className={`text-gray-600 hover:text-[#3366CC] text-sm transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('footer.faq', 'FAQ')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className={`flex flex-col md:flex-row justify-between items-center gap-4 ${isRTL ? 'md:' : ''}`}>
            <p className={`text-gray-500 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
              &copy; {new Date().getFullYear()} صدقة (SADA9A). {t('footer.copyright', 'All rights reserved.')}
            </p>
            <div className={`flex items-center gap-2 text-sm ${isRTL ? '' : ''}`}>
              <svg className="w-4 h-4 text-[#4CAF50]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              <span className="text-gray-600">{t('footer.verifiedSecure', 'Verified & Secure')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}