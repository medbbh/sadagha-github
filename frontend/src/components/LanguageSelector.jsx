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
   className="flex items-center space-x-1 sm:space-x-2 rounded-lg text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5 transition-colors duration-200 min-w-0 p-1 sm:p-2"
   aria-expanded={isOpen}
   aria-haspopup="listbox"
 >
   <Globe className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
   <span className="hidden xs:inline text-xs sm:text-sm truncate max-w-[60px] sm:max-w-none">{currentLanguage.name}</span>
   <ChevronDown className={`h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
 </button>

 {isOpen && (
   <>
     {/* Mobile/Small screens - Full width dropdown */}
     <div className="sm:hidden fixed inset-x-4 top-auto mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-60 overflow-y-auto">
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
           <span className="text-lg flex-shrink-0">{language.flag}</span>
           <span className="flex-1 truncate">{language.name}</span>
           {i18n.language === language.code && (
             <span className="text-[#3366CC] flex-shrink-0">✓</span>
           )}
         </button>
       ))}
     </div>

     {/* Desktop/Tablet - Positioned dropdown */}
     <div className={`hidden sm:block absolute top-full mt-2 w-40 md:w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-60 overflow-y-auto ${
       isRTL ? 'left-0' : 'right-0'
     }`}>
       {languages.map((language) => (
         <button
           key={language.code}
           onClick={() => handleLanguageChange(language.code)}
           className={`w-full text-left px-3 md:px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center space-x-2 md:space-x-3 transition-colors duration-200 ${
             i18n.language === language.code 
               ? 'bg-[#3366CC]/5 text-[#3366CC] font-medium' 
               : 'text-gray-700'
           }`}
           role="option"
           aria-selected={i18n.language === language.code}
         >
           <span className="text-sm md:text-base flex-shrink-0">{language.flag}</span>
           <span className="flex-1 truncate">{language.name}</span>
           {i18n.language === language.code && (
             <span className="text-[#3366CC] text-xs flex-shrink-0">✓</span>
           )}
         </button>
       ))}
     </div>
   </>
 )}
</div>
  );
}