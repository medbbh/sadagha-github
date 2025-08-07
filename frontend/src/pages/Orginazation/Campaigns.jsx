import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Users, 
  DollarSign,
  Calendar,
  Edit3,
  Share2,
  MoreVertical,
  TrendingUp,
  Pause,
  Play
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import { myCampaigns } from '../../api/endpoints/CampaignAPI';
import orgDashboardApi from '../../api/endpoints/OrgAPI';
import { useNavigate } from 'react-router-dom';

export default function CampaignsList() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');

  const navigate = useNavigate();

  // Fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const campaignsData = await myCampaigns();
        setCampaigns(campaignsData);
        console.log('Fetched campaigns:', campaignsData);
      } catch (err) {
        console.error('Failed to fetch campaigns:', err);
        setError(err.message || t('organization.campaigns.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [t]);

  // Filter and search campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Sort campaigns
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name?.localeCompare(b.name) || 0;
      case 'raised_amount':
        return (b.current_amount || 0) - (a.current_amount || 0);
      case 'target':
        return (b.target || 0) - (a.target || 0);
      case 'created_at':
      default:
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
  });

  const calculateProgress = (raised, target) => {
    if (!target || target === 0) return 0;
    return Math.min((raised / target) * 100, 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className={`space-y-4 sm:space-y-6 p-4 sm:p-0 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {t('organization.campaigns.myCampaigns')}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {t('organization.campaigns.manageAndTrack')}
            </p>
          </div>
          
          <div className={`flex items-center space-x-3 mt-4 sm:mt-0 ${isRTL ? 'space-x-reverse' : ''}`}>
            <button 
              onClick={() => navigate('/organization/campaigns/create')}
              className={`bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm sm:text-base ${isRTL ? 'space-x-reverse' : ''}`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('organization.campaigns.createCampaign')}</span>
              <span className="sm:hidden">{t('organization.campaigns.create')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
            <input
              type="text"
              placeholder={t('organization.campaigns.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <option value="created_at">{t('organization.campaigns.sort.newestFirst')}</option>
            <option value="name">{t('organization.campaigns.sort.nameAZ')}</option>
            <option value="raised_amount">{t('organization.campaigns.sort.highestRaised')}</option>
            <option value="target">{t('organization.campaigns.sort.highestTarget')}</option>
          </select>
        </div>
      </div>

      {/* Campaigns Count */}
      <div className="flex items-center justify-between">
        <p className={`text-gray-600 text-sm sm:text-base ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('organization.campaigns.showingCount', { 
            showing: sortedCampaigns.length, 
            total: campaigns.length 
          })}
        </p>
      </div>

      {/* Campaigns Grid */}
      {sortedCampaigns.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {campaigns.length === 0 
              ? t('organization.campaigns.noCampaignsYet') 
              : t('organization.campaigns.noMatchingCampaigns')
            }
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {campaigns.length === 0 
              ? t('organization.campaigns.createFirstDescription')
              : t('organization.campaigns.adjustFiltersDescription')
            }
          </p>
          {campaigns.length === 0 && (
            <button 
              onClick={() => navigate('/organization/campaigns/create')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              {t('organization.campaigns.createFirstCampaign')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {sortedCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow flex flex-col h-full">
              {/* Campaign Image */}
              <div className="h-48 bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {campaign.files && campaign.files[0]?.url ? (
                  <img 
                    src={campaign.files[0].url} 
                    alt={campaign.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm">{t('organization.campaigns.noImage')}</span>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 flex flex-col flex-grow">
                {/* Header */}
                <div className={`mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 line-clamp-2 min-h-[3rem] sm:min-h-[3.5rem]">
                    {campaign.name || t('organization.campaigns.untitledCampaign')}
                  </h3>
                </div>

                {/* Description */}
                <p className={`text-gray-600 text-sm mb-4 line-clamp-3 min-h-[4rem] flex-shrink-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {campaign.description || t('organization.campaigns.noDescription')}
                </p>

                {/* Progress */}
                <div className="mb-4 flex-shrink-0">
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span className="text-gray-600">{t('organization.campaigns.progress')}</span>
                    <span className="font-medium">
                      {calculateProgress(campaign.current_amount, campaign.target).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ${isRTL ? 'origin-right' : 'origin-left'}`}
                      style={{ width: `${calculateProgress(campaign.current_amount, campaign.target)}%` }}
                    />
                  </div>
                  <div className={`flex justify-between text-xs sm:text-sm mt-2 text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className={`truncate ${isRTL ? 'ml-2' : 'mr-2'}`}>
                      {t('organization.campaigns.raised', { amount: orgDashboardApi.formatNumber(campaign.current_amount || 0) })}
                    </span>
                    <span className={`flex-shrink-0 ${isRTL ? 'text-left' : 'text-right'}`}>
                      {t('organization.campaigns.goal', { amount: orgDashboardApi.formatNumber(campaign.target || 0) })}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className={`flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-4 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                    <span className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Users className={`w-3 h-3 sm:w-4 sm:h-4 ${isRTL ? 'ml-1' : 'mr-1'} flex-shrink-0`} />
                      <span className="truncate">
                        {t('organization.campaigns.donors', { count: orgDashboardApi.formatNumber(campaign.number_of_donors || 0) })}
                      </span>
                    </span>
                  </div>
                  <span className={`flex items-center flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Calendar className={`w-3 h-3 sm:w-4 sm:h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    <span className="hidden sm:inline">{formatDate(campaign.created_at)}</span>
                    <span className="sm:hidden">
                      {new Date(campaign.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </span>
                </div>

                {/* Actions - Always at bottom */}
                <div className={`flex items-center space-x-2 mt-auto ${isRTL ? 'space-x-reverse' : ''}`}>
                  <button
                    onClick={() => navigate(`/organization/campaigns/${campaign.id}`)}
                    className={`flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1 ${isRTL ? 'space-x-reverse' : ''}`}
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{t('organization.campaigns.view')}</span>
                  </button>

                  <button 
                    title={t('organization.campaigns.share')}
                    className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}