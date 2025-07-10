import React, { useState, useEffect } from 'react';
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
        setError(err.message || 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

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
    return new Date(dateString).toLocaleDateString('en-US', {
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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Campaigns</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Manage and track your fundraising campaigns
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button 
            onClick={() => navigate('/organization/campaigns/create')}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm sm:text-base">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Campaign</span>
              <span className="sm:hidden">Create</span>
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
          >
            <option value="created_at">Newest First</option>
            <option value="name">Name A-Z</option>
            <option value="raised_amount">Highest Raised</option>
            <option value="target">Highest Target</option>
          </select>
        </div>
      </div>

      {/* Campaigns Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600 text-sm sm:text-base">
          Showing {sortedCampaigns.length} of {campaigns.length} campaigns
        </p>
      </div>

      {/* Campaigns Grid */}
      {sortedCampaigns.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match your filters'}
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {campaigns.length === 0 
              ? 'Create your first campaign to start raising funds for your cause.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {campaigns.length === 0 && (
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
              Create Your First Campaign
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
                    <span className="text-sm">No image</span>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 flex flex-col flex-grow">
                {/* Header */}
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 line-clamp-2 min-h-[3rem] sm:min-h-[3.5rem]">
                    {campaign.name || 'Untitled Campaign'}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 min-h-[4rem] flex-shrink-0">
                  {campaign.description || 'No description available'}
                </p>

                {/* Progress */}
                <div className="mb-4 flex-shrink-0">
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">
                      {calculateProgress(campaign.current_amount, campaign.target).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress(campaign.current_amount, campaign.target)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm mt-2 text-gray-600">
                    <span className="truncate mr-2">${orgDashboardApi.formatNumber(campaign.current_amount || 0)} raised</span>
                    <span className="text-right flex-shrink-0">Goal: ${orgDashboardApi.formatNumber(campaign.target || 0)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-4 flex-shrink-0">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{orgDashboardApi.formatNumber(campaign.number_of_donors || 0)} donors</span>
                    </span>
                  </div>
                  <span className="flex items-center flex-shrink-0">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">{formatDate(campaign.created_at)}</span>
                    <span className="sm:hidden">{new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </span>
                </div>

                {/* Actions - Always at bottom */}
                <div className="flex items-center space-x-2 mt-auto">
                  <button
                    onClick={() => navigate(`/organization/campaigns/${campaign.id}`)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>View</span>
                  </button>

                  <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors">
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