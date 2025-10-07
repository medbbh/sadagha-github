import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Target, Heart, Video } from 'lucide-react';
import { addToFavorites, getFavoriteCampaigns, isFavoriteCampaign, removeFromFavorites } from '../../api/endpoints/CampaignAPI';
import LiveStatusIndicator from './LiveStatusIndicator';

export default function CampaignCard({ data, viewMode = 'grid', className = '', showActions = true }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const campaigns = Array.isArray(data) ? data : [data];
  
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') {
      return 'MRU 0';
    }
    const numValue = parseFloat(amount);
    if (isNaN(numValue)) {
      return 'MRU 0';
    }
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue) + ' MRU';
  };

  const getFacebookLiveEmbedUrl = (facebookUrl) => {
    if (!facebookUrl) return null;
    
    // Extract video ID and create embed URL
    const videoIdMatch = facebookUrl.match(/\/videos\/(\d+)/);
    if (videoIdMatch) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(facebookUrl)}&width=500&show_text=false&appId=YOUR_FACEBOOK_APP_ID`;
    }
    return null;
  };

  const calculateProgress = (current, target) => {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 1;
    return Math.min((currentNum / targetNum) * 100, 100);
  };

  // Initialize favorites state
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const favoriteCampaigns = await getFavoriteCampaigns();
        setFavorites(Array.isArray(favoriteCampaigns) ? favoriteCampaigns : []);
      } catch (error) {
        console.error('Failed to load favorites:', error);
        setFavorites([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFavorites();
  }, []);

  // Helper function to check if campaign is favorite (synchronous)
  const isCampaignFavorite = (campaignId) => {
    return favorites.includes(campaignId);
  };

  const handleFavoriteToggle = async (campaignId) => {
    try {
      // Optimistic update - immediately update UI
      const isCurrentlyFavorite = isCampaignFavorite(campaignId);
      const optimisticFavorites = isCurrentlyFavorite
        ? favorites.filter(id => id !== campaignId)
        : [...favorites, campaignId];
      
      setFavorites(optimisticFavorites);
      
      // Then sync with backend
      let updatedFavorites;
      if (isCurrentlyFavorite) {
        updatedFavorites = await removeFromFavorites(campaignId);
      } else {
        updatedFavorites = await addToFavorites(campaignId);
      }
      
      // Ensure backend response is in sync
      if (Array.isArray(updatedFavorites)) {
        setFavorites(updatedFavorites);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert optimistic update on error
      const revertedFavorites = await getFavoriteCampaigns();
      setFavorites(Array.isArray(revertedFavorites) ? revertedFavorites : []);
    }
  };

  const renderCampaign = (campaign) => {
    const progress = calculateProgress(campaign.current_amount, campaign.target);
    const imageUrl = campaign.files?.[0]?.url || '/api/placeholder/400/240';
    const isFavorite = isCampaignFavorite(campaign.id);
    const donorCount = campaign.number_of_donors || 0;
    
    if (viewMode === 'list') {
      return (
        <div key={campaign.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 ${className}`}>
          <div className={`flex flex-col md:flex-row h-full `}>
            {/* Image Section */}
            <div className="relative w-full md:w-72 lg:w-80 md:h-auto flex-shrink-0 overflow-hidden">
              <img 
                src={imageUrl} 
                loading="lazy"
                alt={campaign.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/api/placeholder/400/240';
                }}
              />
              {campaign.featured && (
                <span className={`absolute top-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium ${isRTL ? 'end-3' : 'start-3'}`}>
                  {t('campaignCard.featured')}
                </span>
              )}
              <LiveStatusIndicator
                campaignId={campaign.id}
                initialStatus={campaign.live_status}
                initialViewerCount={campaign.live_viewer_count}
                size="small"
                showViewerCount={true}
                autoRefresh={true}
              />
              {showActions && (
                <div className={`absolute top-3 flex space-x-2 ${isRTL ? 'start-3 space-x-reverse' : 'end-3'}`}>
                  <button 
                    className="p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors" 
                    onClick={() => handleFavoriteToggle(campaign.id)}
                    disabled={isLoading}
                  >
                    {isFavorite ? (
                      <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                    ) : (
                      <Heart className="w-4 h-4 text-gray-600" />
                    )}
                  </button>

                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                <div className={`flex flex-col lg:flex-row lg:justify-between lg:items-start mb-3`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                        {campaign.category_name || campaign.category || t('campaignCard.general')}
                      </span>
                    </div>
                    <h3 className={`text-lg md:text-xl font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight `}>
                      {campaign.name}
                    </h3>
                  </div>
                  <div className={`mt-2 lg:mt-0 flex-shrink-0 ${isRTL ? 'text-start lg:me-4' : 'text-end lg:ms-4'}`}>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(campaign.current_amount)}</p>
                    <p className="text-sm text-gray-500">{t('campaignCard.of')} {formatCurrency(campaign.target)}</p>
                  </div>
                </div>
                
                <p className={`text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed `}>
                  {campaign.description}
                </p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className={`flex justify-between text-sm text-gray-600 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span>{progress.toFixed(1)}% {t('campaignCard.funded')}</span>
                    <span className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Users className={`w-3 h-3 ${isRTL ? 'ms-1' : 'me-1'}`} />
                      {donorCount} {donorCount === 1 ? t('campaignCard.donor') : t('campaignCard.donors')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${progress}%`,
                        transformOrigin: isRTL ? 'right' : 'left'
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-auto ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                <span className="text-sm text-gray-500 flex-shrink-0">
                  {t('campaignCard.created')} {new Date(campaign.created_at).toLocaleDateString()}
                </span>
                <div className={`flex gap-2 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Link
                    to={`/campaign/${campaign.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    {t('campaignCard.viewDetails')}
                  </Link>
                  {campaign.has_facebook_live && campaign.live_status === 'live' && (
                    <a
                      href={campaign.facebook_live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <Video className={`w-3 h-3 ${isRTL ? 'ms-1' : 'me-1'}`} />
                      {t('campaignCard.watchLive')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Grid view
    return (
      <div key={campaign.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group ${className}`}>
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={imageUrl} 
            loading="lazy"
            alt={campaign.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = '/api/placeholder/400/240';
            }}
          />
          
          {/* Badges and Actions */}
          <div className={`absolute top-3 flex items-center gap-2 ${isRTL ? 'end-3' : 'start-3'}`}>
            {campaign.featured && (
              <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                {t('campaignCard.featured')}
              </span>
            )}
            <LiveStatusIndicator
              campaignId={campaign.id}
              initialStatus={campaign.live_status}
              initialViewerCount={campaign.live_viewer_count}
              size="small"
              showViewerCount={true}
              autoRefresh={true}
            />
          </div>
          
          {showActions && (
            <div className={`absolute top-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? 'start-3 space-x-reverse' : 'end-3'}`}>
              <button 
                className="p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                onClick={() => handleFavoriteToggle(campaign.id)}
                disabled={isLoading}
              >
                {isFavorite ? (
                  <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                ) : (
                  <Heart className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-3">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
              {campaign.category_name || campaign.category || t('campaignCard.general')}
            </span>
            <h3 className={`text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight `}>
              {campaign.name}
            </h3>
          </div>
          
          {/* Description */}
          <p className={`text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed `}>
            {campaign.description}
          </p>
          
          {/* Progress Section */}
          <div className="mb-4">
            <div className={`flex justify-between text-sm text-gray-600 mb-1`}>
              <span>{formatCurrency(campaign.current_amount)} {t('campaignCard.raised')}</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ 
                  width: `${progress}%`,
                  transformOrigin: isRTL ? 'right' : 'left'
                }}
              />
            </div>
            <div className={`flex justify-between text-xs text-gray-500 `}>
              <span className={`flex items-center `}>
                <Target className={`w-3 h-3 `} />
                {t('campaignCard.goal')} {formatCurrency(campaign.target)}
              </span>
              <span className={`flex items-center `}>
                <Users className={`w-3 h-3 `} />
                {donorCount} {donorCount === 1 ? t('campaignCard.donor') : t('campaignCard.donors')}
              </span>
            </div>
          </div>
          
          {/* Footer */}
          <div className={`flex justify-between items-center `}>
            <span className="text-xs text-gray-500">
              {new Date(campaign.created_at).toLocaleDateString()}
            </span>
            <div className={`flex gap-2 `}>
              <Link
                to={`/campaign/${campaign.id}`}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                {t('campaignCard.viewDetails')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Show loading state if favorites are still loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">{t('campaignCard.loading')}</div>
      </div>
    );
  }

  // Render container with campaigns
  if (Array.isArray(data)) {
    return (
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
        : "space-y-6"
      }>
        {campaigns.map(renderCampaign)}
      </div>
    );
  }

  // Single campaign
  return renderCampaign(data);
}