// components/FacebookLiveEmbedSimple.jsx
import React, { useState } from 'react';
import { Video, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';

export default function FacebookLiveEmbedSimple({ 
  campaign,
  showDonationOverlay = true,
  className = ''
}) {
  const [embedError, setEmbedError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generate Facebook embed URL with real-time parameters
  const getEmbedUrl = () => {
    if (!campaign?.facebook_live_url) return null;
    
    const baseUrl = 'https://www.facebook.com/plugins/video.php';
    const params = new URLSearchParams({
      href: campaign.facebook_live_url,
      width: '560',
      height: '315',
      show_text: 'false',
      autoplay: 'true',  // Enable autoplay for live streams
      muted: 'false',
      allowfullscreen: 'true',
      // Add cache-busting parameter
      t: Date.now()
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount) return '0 MRU';
    return `${parseInt(amount).toLocaleString()} MRU`;
  };

  // Calculate progress percentage
  const getProgress = () => {
    if (!campaign?.target || !campaign?.current_amount) return 0;
    return Math.min((campaign.current_amount / campaign.target) * 100, 100);
  };

  // Don't render if no Facebook Live URL
  if (!campaign?.facebook_live_url) return null;

  const embedUrl = getEmbedUrl();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Video className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Facebook Live Stream</h3>
            
            {/* Connection Status */}
            {campaign.facebook_video_id && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Connected
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.location.reload()}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Refresh page"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <a
              href={campaign.facebook_live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Open on Facebook
            </a>
          </div>
        </div>
      </div>

      {/* Video Embed */}
      <div className="relative">
        {embedUrl && !embedError ? (
          <div className="relative pb-[56.25%] h-0"> {/* 16:9 aspect ratio */}
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              title="Facebook Live Stream"
              onError={() => setEmbedError(true)}
              onLoad={() => setIsLoading(false)}
            />
            
            {/* Donation Progress Overlay */}
            {showDonationOverlay && (
              <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
                <div className="text-sm font-medium">Campaign Progress</div>
                <div className="text-lg font-bold">
                  {formatCurrency(campaign.current_amount)}
                </div>
                <div className="text-xs opacity-90">
                  of {formatCurrency(campaign.target)} goal
                </div>
                <div className="w-20 bg-gray-600 rounded-full h-1 mt-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${getProgress()}%` }}
                  />
                </div>
              </div>
            )}

            {/* Live Indicator (if video ID exists, assume it could be live) */}
            {campaign.facebook_video_id && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
                ● LIVE
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50">
            <div className="space-y-4">
              {embedError && (
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
              )}
              
              <Video className="w-12 h-12 text-gray-400 mx-auto" />
              
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {embedError ? 'Embed Not Available' : 'Facebook Live Stream'}
                </h4>
                <p className="text-gray-600 mb-4">
                  {embedError 
                    ? 'The video embed is not available. You can still watch on Facebook.'
                    : 'Click below to watch the live stream on Facebook.'
                  }
                </p>
                <a
                  href={campaign.facebook_live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Watch on Facebook
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center text-gray-600">
              <Video className="w-4 h-4 mr-1" />
              Facebook Live Connected
            </span>
            {campaign.facebook_video_id && (
              <span className="text-gray-500 text-xs">
                Video ID: {campaign.facebook_video_id}
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            {campaign.facebook_video_id ? 'Stream available' : 'External link only'}
          </div>
        </div>
        
        {/* Status Message */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Video className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-800 font-medium">Facebook Live Integration Active</p>
              <p className="text-blue-600 text-xs mt-1">
                This campaign is connected to a Facebook Live stream. 
                {campaign.facebook_video_id 
                  ? ' The stream will appear above when live.'
                  : ' Click "Open on Facebook" to watch.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}