// pages/FacebookOAuthCallback.jsx
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function FacebookOAuthCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (code) {
      // Send success message to parent window
      window.opener?.postMessage({
        type: 'FACEBOOK_OAUTH_SUCCESS',
        code: code
      }, window.location.origin);
      
      // Close popup
      window.close();
    } else if (error) {
      // Send error message to parent window
      window.opener?.postMessage({
        type: 'FACEBOOK_OAUTH_ERROR',
        error: error,
        errorDescription: errorDescription
      }, window.location.origin);
      
      // Close popup
      window.close();
    }
  }, [searchParams]);

  const code = searchParams.get('code');
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        {code ? (
          <div className="space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Authorization Successful</h2>
            <p className="text-gray-600">
              Facebook authorization completed successfully. This window will close automatically.
            </p>
            <div className="animate-pulse text-sm text-gray-500">
              Closing window...
            </div>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Authorization Failed</h2>
            <p className="text-gray-600">
              {error === 'access_denied' 
                ? 'You cancelled the authorization process.'
                : 'An error occurred during Facebook authorization.'
              }
            </p>
            <div className="animate-pulse text-sm text-gray-500">
              Closing window...
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mx-auto"></div>
            <h2 className="text-xl font-semibold text-gray-900">Processing Authorization</h2>
            <p className="text-gray-600">
              Please wait while we process your Facebook authorization...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}