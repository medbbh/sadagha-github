import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Clock, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function FeaturedCampaignsCarousel({ Campaigns = [], loading = false }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoPlayRef = useRef(null);

  // Ensure Campaigns is an array and has items
  const safeCampaigns = Array.isArray(Campaigns) ? Campaigns : [];

  const formatMoney = (amount) => {
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

  const calculateProgress = (current, target) => {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 1;
    return Math.min((currentNum / targetNum) * 100, 100);
  };

  const nextSlide = () => {
    if (safeCampaigns.length > 0) {
      setCurrentSlide((prev) => (prev === safeCampaigns.length - 1 ? 0 : prev + 1));
    }
  };

  const prevSlide = () => {
    if (safeCampaigns.length > 0) {
      setCurrentSlide((prev) => (prev === 0 ? safeCampaigns.length - 1 : prev - 1));
    }
  };

  useEffect(() => {
    if (safeCampaigns.length === 0) return;
    
    autoPlayRef.current = nextSlide;
    
    const play = () => {
      if (!isHovered) {
        autoPlayRef.current();
      }
    };
    
    const interval = setInterval(play, 5000);
    return () => clearInterval(interval);
  }, [isHovered, safeCampaigns.length]);

  // Reset current slide if it's out of bounds
  useEffect(() => {
    if (currentSlide >= safeCampaigns.length) {
      setCurrentSlide(0);
    }
  }, [safeCampaigns.length, currentSlide]);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className={`text-3xl font-bold text-[#3366CC] mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('featured.title')}
          </h2>
          <p className={`text-gray-600 mb-10 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('featured.loading')}
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </section>
    );
  }

  if (safeCampaigns.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className={`text-3xl font-bold text-[#3366CC] mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('featured.title')}
          </h2>
          <p className={`text-gray-600 mb-10 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('featured.noFeatured')}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className={`text-3xl font-bold text-[#3366CC] mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('featured.title')}
        </h2>
        <p className={`text-gray-600 mb-10 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('featured.subtitle')}
        </p>
        
        <div 
          className="relative overflow-hidden rounded-xl shadow-lg"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ 
              transform: isRTL 
                ? `translateX(${currentSlide * 100}%)` 
                : `translateX(-${currentSlide * 100}%)`
            }}
          >
            {safeCampaigns.map((campaign) => {
              const progress = calculateProgress(campaign.current_amount, campaign.target);
              const CampaignImage = campaign.files?.[0]?.url || '/api/placeholder/800/500';
              const donorCount = campaign.number_of_donors || 0;
              
              return (
                <div key={campaign.id} className="w-full flex-shrink-0">
                  <div className="relative h-96 md:h-[500px]">
                    <img 
                      src={CampaignImage}
                      alt={campaign.name || t('featured.untitledCampaign')} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/800/500';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className={`absolute bottom-0 p-6 md:p-10 text-white ${isRTL ? 'right-0 text-right' : 'left-0 text-left'}`}>
                      <span className="inline-block bg-[#FF9800] px-3 py-1 rounded text-sm font-medium mb-3">
                        {t('featured.featured')}
                      </span>
                      <h3 className="text-2xl md:text-4xl font-bold mb-4">
                        {campaign.name || t('featured.untitledCampaign')}
                      </h3>
                      
                      <div className="mb-4">
                        <div className="bg-white/30 rounded-full h-2 mb-2">
                          <div 
                            className="bg-[#4CAF50] h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${progress}%`,
                              transformOrigin: isRTL ? 'right' : 'left'
                            }}
                          ></div>
                        </div>
                        <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span>{formatMoney(campaign.current_amount)} {t('featured.raised')}</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className={`flex flex-wrap gap-4 text-sm mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Users className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} /> 
                          {donorCount.toLocaleString()} {donorCount === 1 ? t('featured.donor') : t('featured.donors')}
                        </div>
                      </div>
                      
                      <a 
                        href={`/campaign/${campaign.id}`}
                        className="inline-block mt-6 px-5 py-2 bg-[#3366CC] hover:bg-[#2855AA] rounded-lg transition-colors duration-300"
                      >
                        {t('featured.viewCampaign')}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Navigation arrows - only show if more than 1 campaign */}
          {safeCampaigns.length > 1 && (
            <>
              <button 
                onClick={isRTL ? nextSlide : prevSlide}
                className={`absolute top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors duration-300 text-[#3366CC] ${isRTL ? 'right-4' : 'left-4'}`}
                aria-label={t('featured.previousSlide')}
              >
                <ChevronLeft className={`h-6 w-6 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
              <button 
                onClick={isRTL ? prevSlide : nextSlide}
                className={`absolute top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors duration-300 text-[#3366CC] ${isRTL ? 'left-4' : 'right-4'}`}
                aria-label={t('featured.nextSlide')}
              >
                <ChevronRight className={`h-6 w-6 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Slide indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {safeCampaigns.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSlide === index ? 'w-8 bg-white' : 'bg-white/50'}`}
                    aria-label={`${t('featured.goToSlide')} ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}