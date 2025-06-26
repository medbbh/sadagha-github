// components/LiveStatusIndicator.jsx
import React, { useState, useEffect } from 'react';
import { Video, Users, Wifi, WifiOff } from 'lucide-react';
import { getCampaignLiveStatus } from '../../api/endpoints/FacebookLiveAPI';

export default function LiveStatusIndicator({ 
  campaignId, 
  initialStatus = 'none',
  initialViewerCount = 0,
  size = 'small', // 'small', 'medium', 'large'
  showViewerCount = true,
  autoRefresh = true
}) {
  const [liveStatus, setLiveStatus] = useState(initialStatus);
  const [viewerCount, setViewerCount] = useState(initialViewerCount);
  const [loading, setLoading] = useState(false);

  // Auto-refresh live status
  useEffect(() => {
    if (!autoRefresh || !campaignId) return;

    const refreshStatus = async () => {
      try {
        setLoading(true);
        const status = await getCampaignLiveStatus(campaignId);
        setLiveStatus(status.live_status);
        setViewerCount(status.live_viewer_count);
      } catch (error) {
        console.error('Failed to refresh live status:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    refreshStatus();

    // Set up interval for live campaigns
    if (liveStatus === 'live') {
      const interval = setInterval(refreshStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [campaignId, autoRefresh, liveStatus]);

  // Don't render if no live stream
  if (liveStatus === 'none') return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'large':
        return {
          container: 'px-4 py-2',
          text: 'text-base',
          icon: 'w-5 h-5'
        };
      case 'medium':
        return {
          container: 'px-3 py-1.5',
          text: 'text-sm',
          icon: 'w-4 h-4'
        };
      default: // small
        return {
          container: 'px-2 py-1',
          text: 'text-xs',
          icon: 'w-3 h-3'
        };
    }
  };

  const getStatusConfig = () => {
    switch (liveStatus) {
      case 'live':
        return {
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          icon: Video,
          label: 'LIVE',
          pulse: true
        };
      case 'ended':
        return {
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          icon: WifiOff,
          label: 'ENDED',
          pulse: false
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();
  const sizeClasses = getSizeClasses();

  if (!statusConfig) return null;

  const IconComponent = statusConfig.icon;

  return (
    <div className={`
      inline-flex items-center rounded-full font-medium
      ${statusConfig.bgColor} ${statusConfig.textColor} ${sizeClasses.container} ${sizeClasses.text}
      ${statusConfig.pulse ? 'animate-pulse' : ''}
      ${loading ? 'opacity-75' : ''}
    `}>
      <IconComponent className={`${sizeClasses.icon} mr-1`} />
      <span>{statusConfig.label}</span>
      
      {showViewerCount && liveStatus === 'live' && viewerCount > 0 && (
        <>
          <span className="mx-1">•</span>
          <Users className={`${sizeClasses.icon} mr-1`} />
          <span>{viewerCount.toLocaleString()}</span>
        </>
      )}
    </div>
  );
}