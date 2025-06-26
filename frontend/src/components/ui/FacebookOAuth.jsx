// components/FacebookOAuth.jsx
import React, { useState, useEffect } from 'react';
import { getFacebookOAuthUrl, handleFacebookOAuthCallback } from '../../api/endpoints/FacebookLiveAPI';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export default function FacebookOAuth({ campaignId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [oauthUrl, setOauthUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Get OAuth URL on component mount
  useEffect(() => {
    const loadOAuthUrl = async () => {
      try {
        const response = await getFacebookOAuthUrl();
        setOauthUrl(response.oauth_url);
      } catch (err) {
        setError('Failed to load Facebook OAuth URL');
        console.error('OAuth URL error:', err);
      }
    };

    loadOAuthUrl();
  }, []);

  // Listen for OAuth callback from popup
  useEffect(() => {
    const handleMessage = async (event) => {
      // Ensure message is from Facebook OAuth
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'FACEBOOK_OAUTH_SUCCESS') {
        setLoading(true);
        setError(null);
        
        try {
          const result = await handleFacebookOAuthCallback(event.data.code, campaignId);
          setSuccess(true);
          if (onSuccess) onSuccess(result);
        } catch (err) {
          setError(err.message || 'Failed to connect Facebook account');
          if (onError) onError(err);
        } finally {
          setLoading(false);
        }
      } else if (event.data.type === 'FACEBOOK_OAUTH_ERROR') {
        setError('Facebook authorization was cancelled or failed');
        if (onError) onError(new Error('OAuth cancelled'));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [campaignId, onSuccess, onError]);

  const handleFacebookLogin = () => {
    if (!oauthUrl) {
      setError('OAuth URL not available');
      return;
    }

    // Open popup for Facebook OAuth
    const popup = window.open(
      oauthUrl,
      'facebook-oauth',
      'width=600,height=600,scrollbars=yes,resizable=yes'
    );

    // Monitor popup
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        // If popup was closed without success, it was likely cancelled
        if (!success && !loading) {
          setError('Authorization was cancelled');
        }
      }
    }, 1000);
  };

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-800 font-medium">
            Facebook account connected successfully!
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Connect Facebook Account</h3>
        <p className="text-blue-700 text-sm mb-4">
          Connect your Facebook account to enable live streaming features for this campaign.
        </p>
        
        <button
          onClick={handleFacebookLogin}
          disabled={loading || !oauthUrl}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
              Connecting...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect Facebook
            </>
          )}
        </button>
      </div>
    </div>
  );
}