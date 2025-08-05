import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe } from 'lucide-react';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇲🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  const isRTL = i18n.language === 'ar';

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
    
    // Update document direction for Arabic
    document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = langCode;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-lg text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5 transition-colors duration-200 min-w-0"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="h-4 w-4 flex-shrink-0" />
        {/* <span className="hidden sm:inline flex-shrink-0">{currentLanguage.flag}</span> */}
        <span className="md:inline text-sm truncate">{currentLanguage.name}</span>
        <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Mobile/Small screens - Full width dropdown */}
          <div className="sm:hidden absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 mx-4">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-200 ${
                  i18n.language === language.code 
                    ? 'bg-[#3366CC]/5 text-[#3366CC] font-medium' 
                    : 'text-gray-700'
                }`}
                role="option"
                aria-selected={i18n.language === language.code}
              >
                <span className="text-lg">{language.flag}</span>
                <span>{language.name}</span>
                {i18n.language === language.code && (
                  <span className="ml-auto text-[#3366CC]">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Desktop/Tablet - Positioned dropdown */}
          <div className={`hidden sm:block absolute top-full mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 ${
            isRTL ? 'left-0' : 'right-0'
          }`}>
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-200 ${
                  i18n.language === language.code 
                    ? 'bg-[#3366CC]/5 text-[#3366CC] font-medium' 
                    : 'text-gray-700'
                }`}
                role="option"
                aria-selected={i18n.language === language.code}
              >
                <span className="text-base">{language.flag}</span>
                <span className="flex-1">{language.name}</span>
                {i18n.language === language.code && (
                  <span className="text-[#3366CC] text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}