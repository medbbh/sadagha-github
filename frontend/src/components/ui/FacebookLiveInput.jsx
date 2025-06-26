// components/FacebookLiveInput.jsx
import React, { useState } from 'react';
import { Video, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

export default function FacebookLiveInput({ 
  value, 
  onChange, 
  campaignId, 
  showOAuth = false,
  required = false 
}) {
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
        message: 'Please enter a valid Facebook Live URL'
      };
    }

    return { valid: true, message: 'Valid Facebook Live URL format' };
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
        <p className={`text-xs mt-1 ${
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Facebook Live URL {required && '*'}
        </label>
        
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Video className="w-4 h-4 text-gray-400" />
          </div>
          
          <input
            type="url"
            value={value || ''}
            onChange={handleUrlChange}
            placeholder="https://facebook.com/your-page/live/123456789"
            className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              validationResult === null 
                ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                : validationResult.valid
                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                : 'border-red-300 focus:ring-red-500 focus:border-red-500'
            }`}
            required={required}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getValidationIcon()}
          </div>
        </div>
        
        {getValidationMessage()}
        
        <div className="text-xs text-gray-500 mt-1">
          <p>Supported Facebook Live URL formats:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>facebook.com/page/live/123456789</li>
            <li>facebook.com/page/videos/123456789</li>
            <li>facebook.com/watch/?v=123456789</li>
            <li>fb.watch/abcd123</li>
          </ul>
        </div>
      </div>

      {/* Help Section */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How to get your Facebook Live URL:</h4>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>Start a live stream on your Facebook page</li>
          <li>Copy the URL from your browser or the "Share" button</li>
          <li>Paste the URL here to connect it to your campaign</li>
        </ol>
        
        <div className="mt-3">
          <a
            href="https://www.facebook.com/help/167417030499767"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Learn how to go live on Facebook
          </a>
        </div>
      </div>
    </div>
  );
}