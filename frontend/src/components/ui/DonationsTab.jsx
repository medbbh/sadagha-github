import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ExternalLink, Calendar, Filter, Search, 
  RefreshCw, ChevronLeft, ChevronRight, AlertCircle, CheckCircle,
  Clock, XCircle
} from 'lucide-react';
import { fetchUserDonations, fetchDonationSummary } from '../../api/endpoints/donationAPI';

const DonationsTab = ({ profileData }) => {
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
      setError(err.message || 'Failed to load donations');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'MRU') => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' ' + currency;
  };

  // Show loading only if both stats and donations are loading
  if ((loading && donations.length === 0) || (statsLoading && !statistics.total_donated)) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Donation History</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading donations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Donation History</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Donations</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => loadDonations(currentPage)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (donations.length === 0 && !loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Donation History</h2>
        </div>
        
        {/* Still show stats even if no donations in current filter */}
        {statistics.total_donated > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg p-6 border border-green-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-700">
                  {statsLoading ? '...' : formatCurrency(statistics.total_donated || 0)}
                </div>
                <div className="text-sm text-green-600">Total Donated</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-700">
                  {statsLoading ? '...' : (statistics.total_donations || 0)}
                </div>
                <div className="text-sm text-blue-600">Total Donations</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-700">
                  {statsLoading ? '...' : (statistics.campaigns_supported || 0)}
                </div>
                <div className="text-sm text-purple-600">Campaigns Supported</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <DollarSign className="text-blue-600 w-10 h-10" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {statistics.total_donated > 0 ? 'No donations found' : 'No Donations Yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {statistics.total_donated > 0 
              ? 'Try adjusting your filters to see more donations.'
              : 'Start making a difference by supporting campaigns that matter to you.'
            }
          </p>
          <button
            onClick={() => window.location.href = '/campaigns'}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explore Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Donation History</h2>
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
            Refresh
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
            <DollarSign className="w-5 h-5" />
            <span className="font-semibold">
              Total: {statsLoading ? '...' : formatCurrency(statistics.total_donated || 0)}
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
              <div className="text-sm text-green-600">Total Donated</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700">
                {statsLoading ? '...' : (statistics.total_donations || 0)}
              </div>
              <div className="text-sm text-blue-600">Total Donations</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-700">
                {statsLoading ? '...' : (statistics.campaigns_supported || 0)}
              </div>
              <div className="text-sm text-purple-600">Campaigns Supported</div>
            </div>
          </div>
        </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="-amount">Highest Amount</option>
              <option value="amount">Lowest Amount</option>
              <option value="campaign__name">Campaign A-Z</option>
              <option value="-campaign__name">Campaign Z-A</option>
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
                        <span>Payment: {donation.payment_method}</span>
                      )}
                      {donation.is_anonymous && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          Anonymous
                        </span>
                      )}
                    </div>
                    
                    {donation.message && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                        <strong>Message:</strong> {donation.message}
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
            Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total_count)} of {pagination.total_count} donations
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDonations(currentPage - 1)}
              disabled={!pagination.has_previous || loading}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {currentPage} of {pagination.total_pages}
            </span>
            
            <button
              onClick={() => loadDonations(currentPage + 1)}
              disabled={!pagination.has_next || loading}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsTab;