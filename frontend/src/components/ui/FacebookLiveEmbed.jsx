import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Video, Users, ExternalLink, RefreshCw } from 'lucide-react';
import { getCampaignLiveStatus, refreshCampaignLiveStatus } from '../../api/endpoints/FacebookLiveAPI';
import LiveStatusIndicator from './LiveStatusIndicator';

export default function FacebookLiveEmbed({ 
  campaign,
  showDonationOverlay = true,
  className = ''
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
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
      appId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
      autoplay: 'true',
      muted: 'false'
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '0 MRU';
    return `${parseInt(amount).toLocaleString()} MRU`;
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
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center space-x-3 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <Video className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('facebookLive.liveStream')}</h3>
            <LiveStatusIndicator
              campaignId={campaign.id}
              initialStatus={liveStatus}
              initialViewerCount={viewerCount}
              size="medium"
              showViewerCount={true}
              autoRefresh={false}
            />
          </div>
          
          <div className={`flex items-center space-x-2 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title={t('facebookLive.refreshStatus')}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <a
              href={campaign.facebook_live_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <ExternalLink className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t('facebookLive.openOnFacebook')}
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
              <div className={`absolute top-4 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur-sm ${isRTL ? 'left-4 text-right' : 'right-4 text-left'}`}>
                <div className="text-sm font-medium">{t('facebookLive.campaignProgress')}</div>
                <div className="text-lg font-bold">
                  {formatCurrency(campaign.current_amount)}
                </div>
                <div className="text-xs opacity-90">
                  {t('facebookLive.of')} {formatCurrency(campaign.target)} {t('facebookLive.goalText')}
                </div>
              </div>
            )}
          </div>
        ) : liveStatus === 'ended' ? (
          <div className="p-8 text-center bg-gray-50">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">{t('facebookLive.liveStreamEnded')}</h4>
            <p className="text-gray-600 mb-4">
              {t('facebookLive.liveStreamEndedDescription')}
            </p>
            <a
              href={campaign.facebook_live_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <ExternalLink className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('facebookLive.viewOnFacebook')}
            </a>
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">{t('facebookLive.streamNotActive')}</h4>
            <p className="text-gray-600 mb-4">
              {t('facebookLive.streamNotActiveDescription')}
            </p>
            <button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} ${refreshing ? 'animate-spin' : ''}`} />
              {t('facebookLive.checkStatus')}
            </button>
          </div>
        )}
      </div>

      {/* Live Stats */}
      {liveStatus === 'live' && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center space-x-4 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <span className={`flex items-center text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Users className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {viewerCount.toLocaleString()} {t('facebookLive.watching')}
              </span>
              <span className={`flex items-center text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Video className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {t('facebookLive.liveNow')}
              </span>
            </div>
            
            <div className="text-gray-500">
              {t('facebookLive.lastUpdated')} {new Date().toLocaleTimeString(i18n.language)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}