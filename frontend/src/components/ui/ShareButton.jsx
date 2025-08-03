import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Share2, 
  Copy, 
  ExternalLink 
} from 'lucide-react';

// Simple meta tags utility for React 19
const setMetaTags = (metaData) => {
  if (typeof document === 'undefined') return;
  
  // Set page title
  document.title = metaData.title;
  
  // Remove existing meta tags
  const existingMetas = document.querySelectorAll('meta[data-share-meta]');
  existingMetas.forEach(meta => meta.remove());
  
  // Add new meta tags
  const metaTags = [
    { property: 'og:title', content: metaData.title },
    { property: 'og:description', content: metaData.description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: metaData.url },
    { property: 'og:image', content: metaData.image },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: metaData.title },
    { name: 'twitter:description', content: metaData.description },
    { name: 'twitter:image', content: metaData.image },
  ];
  
  metaTags.forEach(tag => {
    if (tag.content) {
      const meta = document.createElement('meta');
      if (tag.property) meta.setAttribute('property', tag.property);
      if (tag.name) meta.setAttribute('name', tag.name);
      meta.setAttribute('content', tag.content);
      meta.setAttribute('data-share-meta', 'true');
      document.head.appendChild(meta);
    }
  });
};

const ShareButton = ({ 
  campaign,
  variant = 'full', // 'full', 'compact', 'button-only'
  showPreview = true,
  showMetaTags = true,
  className = '',
  customText = null,
  customUrl = null,
  platforms = ['facebook', 'twitter', 'whatsapp'] // New prop to control which platforms to show 
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [copied, setCopied] = useState(false);
  const [facebookNotification, setFacebookNotification] = useState(false);

  // Format numbers - always use Latin numerals even for Arabic
  const formatNumber = (num) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale).format(num || 0);
  };

  // Generate share data
  const getShareData = () => {
    const baseUrl = customUrl || `${window.location.origin}/campaigns/${campaign.id}`;
    const defaultText = t('share.defaultText', {
      campaignName: campaign.name,
      currentAmount: formatNumber(campaign.current_amount),
      target: formatNumber(campaign.target),
      donorCount: formatNumber(campaign.number_of_donors)
    });
    
    return {
      title: t('share.title', { campaignName: campaign.name }),
      description: t('share.description', {
        currentAmount: formatNumber(campaign.current_amount),
        target: formatNumber(campaign.target),
        donorCount: formatNumber(campaign.number_of_donors),
        campaignDescription: campaign.description?.substring(0, 100)
      }),
      text: customText || defaultText,
      url: baseUrl,
      image: campaign.files?.[0]?.url,
      hashtags: t('share.hashtags', { returnObjects: true }).join(',')
    };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnPlatform = (platform) => {
    const shareData = getShareData();
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}&hashtags=${shareData.hashtags}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareData.text} ${shareData.url}`)}`,
    };
    
    // For Facebook, also copy suggested text to clipboard
    if (platform === 'facebook') {
      copyToClipboard(shareData.text);
      setFacebookNotification(true);
      setTimeout(() => setFacebookNotification(false), 4000);
    }
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const shareData = getShareData();

  // Set meta tags when component mounts (only for full variant on public pages)
  useEffect(() => {
    if (showMetaTags && variant === 'full') {
      setMetaTags(shareData);
    }
    
    // Cleanup on unmount
    return () => {
      if (showMetaTags && variant === 'full') {
        const existingMetas = document.querySelectorAll('meta[data-share-meta]');
        existingMetas.forEach(meta => meta.remove());
      }
    };
  }, [showMetaTags, variant, campaign, i18n.language]);

  // Button Only Variant
  if (variant === 'button-only') {
    return (
      <button
        onClick={() => copyToClipboard(shareData.url)}
        className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 text-slate-600 hover:text-blue-600 transition-colors ${className}`}
        title={t('share.shareTitle')}
      >
        {copied ? <Copy className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
        <span>{copied ? t('share.copied') : t('share.share')}</span>
      </button>
    );
  }

  // Compact Variant
  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-lg border border-slate-200 p-4 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <h4 className="font-medium text-slate-900 mb-3">{t('share.shareThisCampaign')}</h4>
        
        {/* Facebook notification */}
        {facebookNotification && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            📋 {t('share.facebookNotification')}
          </div>
        )}
        
        {/* Quick share buttons */}
        <div className={`flex flex-wrap gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {platforms.includes('facebook') && (
            <button
              onClick={() => shareOnPlatform('facebook')}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition-colors"
            >
              {t('share.facebook')}
            </button>
          )}
          {platforms.includes('twitter') && (
            <button
              onClick={() => shareOnPlatform('twitter')}
              className="bg-slate-900 text-white px-3 py-1.5 rounded text-xs hover:bg-slate-800 transition-colors"
            >
              {t('share.twitter')}
            </button>
          )}
          {platforms.includes('whatsapp') && (
            <button
              onClick={() => shareOnPlatform('whatsapp')}
              className="bg-green-500 text-white px-3 py-1.5 rounded text-xs hover:bg-green-600 transition-colors"
            >
              {t('share.whatsapp')}
            </button>
          )}
          <button
            onClick={() => copyToClipboard(shareData.url)}
            className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded text-xs hover:bg-slate-200 transition-colors"
          >
            {copied ? t('share.copied') : t('share.copyLink')}
          </button>
        </div>
      </div>
    );
  }

  // Full Variant (Default)
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('share.shareThisCampaign')}</h3>
      
      <div className="space-y-4">
        {/* Facebook notification */}
        {facebookNotification && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              📋 <strong>{t('share.facebookNotificationFull')}</strong>
            </p>
          </div>
        )}

        {/* Share Preview */}
        {showPreview && (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <p className="text-xs text-slate-600 mb-3">{t('share.socialMediaPreview')}:</p>
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                {shareData.image && (
                  <img 
                    src={shareData.image} 
                    alt={t('share.campaignPreviewAlt')} 
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm line-clamp-2">
                    {shareData.title}
                  </p>
                  <p className="text-slate-600 text-xs mt-1">
                    {t('share.previewStats', {
                      currentAmount: formatNumber(campaign.current_amount),
                      target: formatNumber(campaign.target),
                      donorCount: formatNumber(campaign.number_of_donors)
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social Share Buttons */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">{t('share.shareDirectlyOn')}:</p>
          
          {/* Primary platforms */}
          <div className="grid grid-cols-2 gap-2">
            {platforms.includes('facebook') && (
              <button
                onClick={() => shareOnPlatform('facebook')}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors relative group"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>{t('share.facebook')}</span>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  {t('share.facebookTooltip')}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </button>
            )}
            
            {platforms.includes('twitter') && (
              <button
                onClick={() => shareOnPlatform('twitter')}
                className="flex items-center justify-center space-x-2 bg-slate-900 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span>{t('share.twitter')}</span>
              </button>
            )}
          </div>

          {/* WhatsApp button */}
          {platforms.includes('whatsapp') && (
            <button
              onClick={() => shareOnPlatform('whatsapp')}
              className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span>{t('share.whatsapp')}</span>
            </button>
          )}
        </div>

        {/* Copy URL Section */}
        <div className="border-t border-slate-200 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">{t('share.orCopyLink')}:</p>
          <div className={`flex items-center space-x-2 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <input
              type="text"
              value={shareData.url}
              readOnly
              className="flex-1 text-sm bg-white border border-slate-200 rounded px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => copyToClipboard(shareData.url)}
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              title={t('share.copyLink')}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Pro tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            💡 <strong>{t('share.proTip')}</strong> {t('share.proTipText')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareButton;