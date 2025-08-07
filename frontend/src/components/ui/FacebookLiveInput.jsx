import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Video, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

export default function FacebookLiveInput({ 
  value, 
  onChange, 
  campaignId, 
  showOAuth = false,
  required = false,
  isRTL = false 
}) {
  const { t } = useTranslation();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Validate Facebook Live URL format
  const validateFacebookUrl = (url) => {
    if (!url) return { valid: true, message: '' };

    const facebookPatterns = [
      /facebook\.com\/[^/]+\/videos\/\d+/,
      /facebook\.com\/[^/]+\/live\/\d+/,
      /facebook\.com\/watch\/\?v=\d+/,
      /fb\.watch\/[a-zA-Z0-9]+/,
      /facebook\.com\/videos\/\d+/
    ];

    const isValidFormat = facebookPatterns.some(pattern => pattern.test(url));
    
    if (!isValidFormat) {
      return {
        valid: false,
        message: t('organization.facebookLive.invalidUrlMessage')
      };
    }

    return { 
      valid: true, 
      message: t('organization.facebookLive.validUrlMessage')
    };
  };

  const handleUrlChange = async (e) => {
    const newUrl = e.target.value;
    onChange(newUrl);

    if (newUrl) {
      setIsValidating(true);
      
      // Simulate validation delay
      setTimeout(() => {
        const result = validateFacebookUrl(newUrl);
        setValidationResult(result);
        setIsValidating(false);
      }, 500);
    } else {
      setValidationResult(null);
      setIsValidating(false);
    }
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-500" />;
    }
    if (validationResult?.valid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (validationResult && !validationResult.valid) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getValidationMessage = () => {
    if (validationResult?.message) {
      return (
        <p className={`text-xs mt-1 ${isRTL ? 'text-right' : 'text-left'} ${
          validationResult.valid ? 'text-green-600' : 'text-red-600'
        }`}>
          {validationResult.message}
        </p>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Facebook Live URL Input */}
      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('organization.facebookLive.facebookLiveUrl')} {required && '*'}
        </label>
        
        <div className="relative">
          <div className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2`}>
            <Video className="w-4 h-4 text-gray-400" />
          </div>
          
          <input
            type="url"
            value={value || ''}
            onChange={handleUrlChange}
            placeholder={t('organization.facebookLive.urlPlaceholder')}
            className={`w-full ${isRTL ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'} py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              validationResult === null 
                ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                : validationResult.valid
                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                : 'border-red-300 focus:ring-red-500 focus:border-red-500'
            }`}
            required={required}
          />
          
          <div className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2`}>
            {getValidationIcon()}
          </div>
        </div>
        
        {getValidationMessage()}
        
        <div className={`text-xs text-gray-500 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          <p>{t('organization.facebookLive.supportedFormats')}</p>
          <ul className={`list-disc mt-1 space-y-1 ${isRTL ? 'list-inside text-right' : 'list-inside text-left'}`}>
            <li>facebook.com/page/live/123456789</li>
            <li>facebook.com/page/videos/123456789</li>
            <li>facebook.com/watch/?v=123456789</li>
            <li>fb.watch/abcd123</li>
          </ul>
        </div>
      </div>

      {/* Help Section */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className={`text-sm font-medium text-blue-900 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('organization.facebookLive.howToGetUrl')}
        </h4>
        <ol className={`text-xs text-blue-700 space-y-1 ${isRTL ? 'list-decimal list-inside text-right' : 'list-decimal list-inside text-left'}`}>
          <li>{t('organization.facebookLive.step1')}</li>
          <li>{t('organization.facebookLive.step2')}</li>
          <li>{t('organization.facebookLive.step3')}</li>
        </ol>
        
        <div className="mt-3">
          <a
            href="https://www.facebook.com/help/167417030499767"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center text-xs text-blue-600 hover:text-blue-800 `}
          >
            <ExternalLink className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
            {t('organization.facebookLive.learnMore')}
          </a>
        </div>
      </div>
    </div>
  );
}