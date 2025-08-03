import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  DollarSign, ExternalLink, Calendar, Filter, Search, 
  RefreshCw, ChevronLeft, ChevronRight, AlertCircle, CheckCircle,
  Clock, XCircle
} from 'lucide-react';
import { fetchUserDonations, fetchDonationSummary } from '../../api/endpoints/donationAPI';

const DonationsTab = ({ profileData }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({});
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('-created_at');
  const [currentPage, setCurrentPage] = useState(1);

  // Format numbers - always use Latin numerals even for Arabic
  const formatNumber = (num) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale).format(num || 0);
  };

  // Format date with proper locale
  const formatDate = (dateString) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'MRU') => {
    return formatNumber(amount) + ' ' + currency;
  };

  // Load donation summary (fast) - separate from donations list
  const loadDonationSummary = async () => {
    try {
      setStatsLoading(true);
      const summaryData = await fetchDonationSummary();
      setStatistics(summaryData.summary);
      console.log('Donation Summary:', summaryData.summary);
    } catch (err) {
      console.error('Error loading donation summary:', err);
      // Don't set error state for summary failure, just log it
    } finally {
      setStatsLoading(false);
    }
  };

  // Load donations (separate from summary for better performance)
  const loadDonations = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: 10,
        sort: sortBy
      };
      
      if (searchTerm) params.search = searchTerm;
      
      const response = await fetchUserDonations(params);
      
      setDonations(response.donations);
      setPagination(response.pagination);
      setCurrentPage(page);
      
    } catch (err) {
      setError(err.message || t('donationsTab.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Initial load - load summary first (fast), then donations
  useEffect(() => {
    loadDonationSummary(); // Load stats immediately
    loadDonations(1); // Load donations
  }, []);

  // Reload only donations when filters change (not summary)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDonations(1);
    }, 500); // Debounce search
    
    return () => clearTimeout(timer);
  }, [searchTerm, sortBy]);

  const handleViewCampaign = (campaignId) => {
    window.open(`/campaigns/${campaignId}`, '_blank');
  };

  // Get sort options with translations
  const getSortOptions = () => [
    { value: '-created_at', label: t('donationsTab.sortOptions.newestFirst') },
    { value: 'created_at', label: t('donationsTab.sortOptions.oldestFirst') },
    { value: '-amount', label: t('donationsTab.sortOptions.highestAmount') },
    { value: 'amount', label: t('donationsTab.sortOptions.lowestAmount') },
    { value: 'campaign__name', label: t('donationsTab.sortOptions.campaignAZ') },
    { value: '-campaign__name', label: t('donationsTab.sortOptions.campaignZA') }
  ];

  // Show loading only if both stats and donations are loading
  if ((loading && donations.length === 0) || (statsLoading && !statistics.total_donated)) {
    return (
      <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{t('donationsTab.title')}</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ms-2 text-gray-600">{t('donationsTab.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{t('donationsTab.title')}</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">{t('donationsTab.errors.errorLoadingTitle')}</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => loadDonations(currentPage)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('donationsTab.actions.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  if (donations.length === 0 && !loading) {
    return (
      <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{t('donationsTab.title')}</h2>
        </div>
        
        {/* Still show stats even if no donations in current filter */}
        {statistics.total_donated > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg p-6 border border-green-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-700">
                  {statsLoading ? '...' : formatCurrency(statistics.total_donated || 0)}
                </div>
                <div className="text-sm text-green-600">{t('donationsTab.stats.totalDonated')}</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-700">
                  {statsLoading ? '...' : formatNumber(statistics.total_donations || 0)}
                </div>
                <div className="text-sm text-blue-600">{t('donationsTab.stats.totalDonations')}</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-700">
                  {statsLoading ? '...' : formatNumber(statistics.campaigns_supported || 0)}
                </div>
                <div className="text-sm text-purple-600">{t('donationsTab.stats.campaignsSupported')}</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <DollarSign className="text-blue-600 w-10 h-10" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {statistics.total_donated > 0 ? t('donationsTab.empty.noDonationsFound') : t('donationsTab.empty.noDonationsYet')}
          </h3>
          <p className="text-gray-600 mb-6">
            {statistics.total_donated > 0 
              ? t('donationsTab.empty.adjustFilters')
              : t('donationsTab.empty.startDonating')
            }
          </p>
          <button
            onClick={() => window.location.href = '/campaigns'}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('donationsTab.actions.exploreCampaigns')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('donationsTab.title')}</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              loadDonationSummary();
              loadDonations(currentPage);
            }}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('donationsTab.actions.refresh')}
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
            <DollarSign className="w-5 h-5" />
            <span className="font-semibold">
              {t('donationsTab.totalDisplay')}: {statsLoading ? '...' : formatCurrency(statistics.total_donated || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Stats - now using donation summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg p-6 border border-green-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-700">
              {statsLoading ? '...' : formatCurrency(statistics.total_donated || 0)}
            </div>
            <div className="text-sm text-green-600">{t('donationsTab.stats.totalDonated')}</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-700">
              {statsLoading ? '...' : formatNumber(statistics.total_donations || 0)}
            </div>
            <div className="text-sm text-blue-600">{t('donationsTab.stats.totalDonations')}</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-700">
              {statsLoading ? '...' : formatNumber(statistics.campaigns_supported || 0)}
            </div>
            <div className="text-sm text-purple-600">{t('donationsTab.stats.campaignsSupported')}</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute start-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('donationsTab.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('donationsTab.sortBy')}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {getSortOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Donation List */}
      <div className="space-y-4">
        {donations.map((donation) => (
          <div key={donation.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{donation.campaign_name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">{formatCurrency(donation.amount, donation.currency)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(donation.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {donation.payment_method && (
                        <span>{t('donationsTab.donation.payment')}: {donation.payment_method}</span>
                      )}
                      {donation.is_anonymous && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {t('donationsTab.donation.anonymous')}
                        </span>
                      )}
                    </div>
                    
                    {donation.message && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                        <strong>{t('donationsTab.donation.message')}:</strong> {donation.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {t('donationsTab.pagination.showing', {
              start: formatNumber((currentPage - 1) * pagination.limit + 1),
              end: formatNumber(Math.min(currentPage * pagination.limit, pagination.total_count)),
              total: formatNumber(pagination.total_count)
            })}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDonations(currentPage - 1)}
              disabled={!pagination.has_previous || loading}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('donationsTab.pagination.previous')}
            </button>
            
            <span className="px-4 py-2 text-sm text-gray-600">
              {t('donationsTab.pagination.pageOf', {
                current: formatNumber(currentPage),
                total: formatNumber(pagination.total_pages)
              })}
            </span>
            
            <button
              onClick={() => loadDonations(currentPage + 1)}
              disabled={!pagination.has_next || loading}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('donationsTab.pagination.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsTab;