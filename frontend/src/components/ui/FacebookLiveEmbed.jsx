// components/FacebookLiveEmbed.jsx
import React, { useState, useEffect } from 'react';
import { Video, Users, ExternalLink, RefreshCw } from 'lucide-react';
import { getCampaignLiveStatus, refreshCampaignLiveStatus } from '../../api/endpoints/FacebookLiveAPI';
import LiveStatusIndicator from './LiveStatusIndicator';

export default function FacebookLiveEmbed({ 
  campaign,
  showDonationOverlay = true,
  className = ''
}) {
  const [liveStatus, setLiveStatus] = useState(campaign?.live_status || 'none');
  const [viewerCount, setViewerCount] = useState(campaign?.live_viewer_count || 0);
  const [refreshing, setRefreshing] = useState(false);

  // Generate Facebook embed URL
  const getEmbedUrl = () => {
    if (!campaign?.facebook_live_url) return null;
    
    const baseUrl = 'https://www.facebook.com/plugins/video.php';
    const params = new URLSearchParams({
      href: campaign.facebook_live_url,
      width: '560',
      show_text: 'false',
      appId: import.meta.env.VITE_FACEBOOK_APP_ID || '', // Add your Facebook App ID to env
      autoplay: 'true',
      muted: 'false'
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Refresh live status
  const handleRefreshStatus = async () => {
    if (!campaign?.id) return;
    
    try {
      setRefreshing(true);
      const status = await getCampaignLiveStatus(campaign.id);
      setLiveStatus(status.live_status);
      setViewerCount(status.live_viewer_count);
    } catch (error) {
      console.error('Failed to refresh live status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh when live
  useEffect(() => {
    if (liveStatus !== 'live') return;

    const interval = setInterval(handleRefreshStatus, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [liveStatus, campaign?.id]);

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
            <h3 className="text-lg font-semibold text-gray-900">Live Stream</h3>
            <LiveStatusIndicator
              campaignId={campaign.id}
              initialStatus={liveStatus}
              initialViewerCount={viewerCount}
              size="medium"
              showViewerCount={true}
              autoRefresh={false} // We handle refresh manually
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
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
        {liveStatus === 'live' && embedUrl ? (
          <div className="relative pb-[56.25%] h-0"> {/* 16:9 aspect ratio */}
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              title="Facebook Live Stream"
            />
            
            {/* Donation Overlay */}
            {showDonationOverlay && (
              <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
                <div className="text-sm font-medium">Campaign Progress</div>
                <div className="text-lg font-bold">
                  {new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: 'USD',
                    minimumFractionDigits: 0 
                  }).format(campaign.current_amount || 0)}
                </div>
                <div className="text-xs opacity-90">
                  of {new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: 'USD',
                    minimumFractionDigits: 0 
                  }).format(campaign.target || 0)} goal
                </div>
              </div>
            )}
          </div>
        ) : liveStatus === 'ended' ? (
          <div className="p-8 text-center bg-gray-50">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Live Stream Ended</h4>
            <p className="text-gray-600 mb-4">
              This live stream has ended. Check back later for future streams!
            </p>
            <a
              href={campaign.facebook_live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Facebook
            </a>
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Stream Not Active</h4>
            <p className="text-gray-600 mb-4">
              The live stream is not currently active. Follow the campaign for updates!
            </p>
            <button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Check Status
            </button>
          </div>
        )}
      </div>

      {/* Live Stats */}
      {liveStatus === 'live' && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="flex items-center text-gray-600">
                <Users className="w-4 h-4 mr-1" />
                {viewerCount.toLocaleString()} watching
              </span>
              <span className="flex items-center text-gray-600">
                <Video className="w-4 h-4 mr-1" />
                Live now
              </span>
            </div>
            
            <div className="text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}