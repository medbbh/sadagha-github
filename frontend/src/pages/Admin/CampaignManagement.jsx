import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Target, Search, Filter, Eye, Star, StarOff, TrendingUp, Users, 
  DollarSign, Calendar, Flag, CheckCircle, XCircle, AlertTriangle,
  FileText, Play, Activity, BarChart3, Shield, Heart, Loader2
} from 'lucide-react';
import { campaignApi } from '../../api/endpoints/CampaignAdminAPI';

const CampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('all'); // all, featured, trending

  // Loading states for individual actions
  const [actionLoading, setActionLoading] = useState({});
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    featured: '',
    campaign_status: '',
    owner_role: '',
    is_verified_org: '',
    created_after: '',
    created_before: '',
    min_target: '',
    max_target: ''
  });

  // Debounced search
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounced effect for search
  useEffect(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    const timer = setTimeout(() => {
      fetchCampaigns();
    }, filters.search ? 500 : 0); // 500ms debounce for search, immediate for other filters
    
    setSearchDebounceTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentPage, filters, activeTab]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let params = {
        page: currentPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };

      // Handle different tabs
      if (activeTab === 'featured') {
        params.featured = 'true';
      } else if (activeTab === 'trending') {
        params.trending = 'true';
      }

      const response = await campaignApi.getCampaigns(params);
      setCampaigns(response.results || response);
      setTotalPages(Math.ceil(response.count / 20) || 1);
      setTotalCount(response.count || response.length);
    } catch (err) {
      setError(err.message);
      // Auto-dismiss error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, activeTab]);

  const fetchStats = async () => {
    try {
      const statsData = await campaignApi.getCampaignStats();
      console.log('Campaign Stats:', statsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleCampaignSelect = useCallback((campaignId) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedCampaigns.length === campaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(campaigns.map(campaign => campaign.id));
    }
  }, [selectedCampaigns.length, campaigns]);

  const handleToggleFeatured = useCallback(async (campaignId, isFeatured) => {
    const action = isFeatured ? 'remove from featured' : 'add to featured';
    if (!window.confirm(`Are you sure you want to ${action} this campaign?`)) {
      return;
    }
    
    try {
      setActionLoading(prev => ({ ...prev, [`featured_${campaignId}`]: true }));
      
      // Optimistic update
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, featured: !isFeatured }
          : campaign
      ));
      
      if (isFeatured) {
        await campaignApi.unsetFeatured(campaignId);
      } else {
        await campaignApi.setFeatured(campaignId);
      }
    } catch (err) {
      setError(err.message);
      // Revert optimistic update on error
      fetchCampaigns();
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(prev => ({ ...prev, [`featured_${campaignId}`]: false }));
    }
  }, [fetchCampaigns]);

  const handleBulkFeature = useCallback(async (action) => {
    const actionText = action === 'feature' ? 'feature' : 'unfeature';
    if (!window.confirm(`Are you sure you want to ${actionText} ${selectedCampaigns.length} campaign(s)?`)) {
      return;
    }
    
    try {
      setBulkActionLoading(true);
      await campaignApi.bulkFeature(selectedCampaigns, action);
      setSelectedCampaigns([]);
      fetchCampaigns();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedCampaigns, fetchCampaigns]);

  const handleModerateCampaign = useCallback(async (campaignId, action, reason = '') => {
    if (!window.confirm(`Are you sure you want to ${action} this campaign?`)) {
      return;
    }
    
    try {
      setActionLoading(prev => ({ ...prev, [`moderate_${campaignId}`]: true }));
      await campaignApi.moderateCampaign(campaignId, action, reason);
      fetchCampaigns();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(prev => ({ ...prev, [`moderate_${campaignId}`]: false }));
    }
  }, [fetchCampaigns]);

  const openCampaignDetails = useCallback(async (campaign) => {
    try {
      setActionLoading(prev => ({ ...prev, [`details_${campaign.id}`]: true }));
      const [campaignDetails, donations, files, analytics] = await Promise.all([
        campaignApi.getCampaign(campaign.id),
        campaignApi.getCampaignDonations(campaign.id, { limit: 10 }),
        campaignApi.getCampaignFiles(campaign.id),
        campaignApi.getCampaignAnalytics(campaign.id)
      ]);
      
      setSelectedCampaign({ 
        ...campaign, 
        details: campaignDetails,
        donations: donations.donations || [],
        files: files.files || [],
        analytics
      });
      setShowCampaignModal(true);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(prev => ({ ...prev, [`details_${campaign.id}`]: false }));
    }
  }, []);

  // Memoized color functions
  const getCampaignStatusColor = useMemo(() => (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'new': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getPerformanceColor = useMemo(() => (rating) => {
    switch (rating) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search campaigns"]');
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Ctrl/Cmd + A to select all visible campaigns
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        handleSelectAll();
      }
      
      // Escape to clear selection
      if (e.key === 'Escape' && selectedCampaigns.length > 0 && !e.target.matches('input, textarea, select')) {
        setSelectedCampaigns([]);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectAll, selectedCampaigns.length]);

  if (loading && campaigns.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Management</h1>
          <p className="text-gray-600">Monitor and manage all fundraising campaigns</p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow border">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Management</h1>
            <p className="text-gray-600">Monitor and manage all fundraising campaigns</p>
          </div>
          <div className="text-xs text-gray-500 text-right">
            <p>Shortcuts: Ctrl+K (search), Ctrl+A (select all), Esc (clear)</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview?.total_campaigns || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview?.active_campaigns || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Featured</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview?.featured_campaigns || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Raised</p>
              <p className="text-2xl font-bold text-gray-900">{stats.financial?.total_raised || '0'} MRU</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'all', name: 'All Campaigns', icon: Target },
              { id: 'featured', name: 'Featured', icon: Star },
              { id: 'trending', name: 'Trending', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search campaigns... (Ctrl+K to focus)"
              className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.target.blur();
                }
              }}
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.campaign_status}
            onChange={(e) => handleFilterChange('campaign_status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="new">New (No donations)</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.owner_role}
            onChange={(e) => handleFilterChange('owner_role', e.target.value)}
          >
            <option value="">All Owners</option>
            <option value="user">Individual</option>
            <option value="organization">Organization</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.is_verified_org}
            onChange={(e) => handleFilterChange('is_verified_org', e.target.value)}
          >
            <option value="">All Organizations</option>
            <option value="true">Verified Orgs</option>
            <option value="false">Unverified Orgs</option>
          </select>
          <input
            type="number"
            placeholder="Min target"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.min_target}
            onChange={(e) => handleFilterChange('min_target', e.target.value)}
          />
          <input
            type="number"
            placeholder="Max target"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.max_target}
            onChange={(e) => handleFilterChange('max_target', e.target.value)}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCampaigns.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedCampaigns.length} campaign{selectedCampaigns.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkFeature('feature')}
                disabled={bulkActionLoading}
                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {bulkActionLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Feature
              </button>
              <button
                onClick={() => handleBulkFeature('unfeature')}
                disabled={bulkActionLoading}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {bulkActionLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Unfeature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden relative">
        {loading && campaigns.length > 0 && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Updating...</span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.length === campaigns.length && campaigns.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.length === 0 && !loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Target className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
                      <p className="text-gray-500">
                        {Object.values(filters).some(v => v) || activeTab !== 'all'
                          ? 'Try adjusting your filters or changing tabs to see more results.'
                          : 'No campaigns have been created yet.'
                        }
                      </p>
                      {(Object.values(filters).some(v => v) || activeTab !== 'all') && (
                        <button
                          onClick={() => {
                            setFilters({
                              search: '',
                              category: '',
                              featured: '',
                              campaign_status: '',
                              owner_role: '',
                              is_verified_org: '',
                              created_after: '',
                              created_before: '',
                              min_target: '',
                              max_target: ''
                            });
                            setActiveTab('all');
                            setCurrentPage(1);
                          }}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCampaigns.includes(campaign.id)}
                      onChange={() => handleCampaignSelect(campaign.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                          {campaign.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {campaign.category_name}
                        </div>
                        {campaign.featured && (
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-500 mr-1" />
                            <span className="text-xs text-yellow-600">Featured</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{campaign.organization_name}</div>
                    <div className="text-sm text-gray-500">{campaign.owner_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {campaign.current_amount} / {campaign.target} MRU
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((campaign.current_amount / campaign.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round((campaign.current_amount / campaign.target) * 100)}% • {campaign.number_of_donors} donors
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(campaign.performance_rating)}`}>
                      {campaign.performance_rating}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {campaign.donation_count || 0} donations
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCampaignStatusColor(campaign.campaign_status)}`}>
                      {campaign.campaign_status}
                    </span>
                    {campaign.has_live_stream && (
                      <div className="flex items-center mt-1">
                        <Play className="h-3 w-3 text-red-500 mr-1" />
                        <span className="text-xs text-red-600">Live</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openCampaignDetails(campaign)}
                        disabled={actionLoading[`details_${campaign.id}`]}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="View Details"
                      >
                        {actionLoading[`details_${campaign.id}`] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleToggleFeatured(campaign.id, campaign.featured)}
                        disabled={actionLoading[`featured_${campaign.id}`]}
                        className={`${campaign.featured ? 'text-yellow-600 hover:text-yellow-900' : 'text-gray-400 hover:text-yellow-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={campaign.featured ? 'Remove from Featured' : 'Add to Featured'}
                      >
                        {actionLoading[`featured_${campaign.id}`] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : campaign.featured ? (
                          <Star className="h-4 w-4 fill-current" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleModerateCampaign(campaign.id, 'flag', 'Manual review')}
                        disabled={actionLoading[`moderate_${campaign.id}`]}
                        className="text-orange-600 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Flag for Review"
                      >
                        {actionLoading[`moderate_${campaign.id}`] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Flag className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 20, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Details Modal */}
      {showCampaignModal && selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          onClose={() => setShowCampaignModal(false)}
          onUpdate={() => {
            fetchCampaigns();
            setShowCampaignModal(false);
          }}
          onToggleFeatured={handleToggleFeatured}
          onModerate={handleModerateCampaign}
        />
      )}
    </div>
  );
};

// Campaign Details Modal Component
const CampaignDetailsModal = React.memo(({ campaign, onClose, onUpdate, onToggleFeatured, onModerate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [moderationAction, setModerationAction] = useState('');
  const [moderationReason, setModerationReason] = useState('');
  const [showModerationModal, setShowModerationModal] = useState(false);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showModerationModal) {
          setShowModerationModal(false);
          setModerationAction('');
          setModerationReason('');
        } else {
          onClose();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showModerationModal]);

  const handleModeration = async () => {
    try {
      await onModerate(campaign.id, moderationAction, moderationReason);
      setShowModerationModal(false);
      setModerationAction('');
      setModerationReason('');
      onUpdate();
    } catch (err) {
      console.error('Moderation failed:', err);
    }
  };

    // Helper functions for modal
  const getCampaignStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'new': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

    const getPerformanceColor = (rating) => {
    switch (rating) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Campaign Details</h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: Target },
                { id: 'donations', name: 'Donations', icon: DollarSign },
                { id: 'files', name: 'Files', icon: FileText },
                { id: 'analytics', name: 'Analytics', icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mb-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Campaign Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                    <p className="mt-1 text-sm text-gray-900">{campaign.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="mt-1 text-sm text-gray-900">{campaign.category_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Owner</label>
                    <p className="mt-1 text-sm text-gray-900">{campaign.organization_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCampaignStatusColor(campaign.campaign_status)}`}>
                      {campaign.campaign_status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target Amount</label>
                    <p className="mt-1 text-sm text-gray-900">{campaign.target} MRU</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Amount</label>
                    <p className="mt-1 text-sm text-gray-900">{campaign.current_amount} MRU</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Success Rate</label>
                    <p className="mt-1 text-sm text-gray-900">{campaign.success_rate || 0}%</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Number of Donors</label>
                    <p className="mt-1 text-sm text-gray-900">{campaign.number_of_donors}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created Date</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(campaign.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Performance Rating</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(campaign.performance_rating)}`}>
                      {campaign.performance_rating}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Progress</label>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-blue-600 h-4 rounded-full flex items-center justify-center text-xs text-white font-medium" 
                      style={{ width: `${Math.min((campaign.current_amount / campaign.target) * 100, 100)}%` }}
                    >
                      {Math.round((campaign.current_amount / campaign.target) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900 max-h-32 overflow-y-auto">
                    {campaign.description || 'No description provided'}
                  </p>
                </div>

                {/* Live Stream Info */}
                {campaign.has_live_stream && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Play className="h-5 w-5 text-red-500 mr-2" />
                      <h4 className="text-md font-medium text-red-800">Live Stream Active</h4>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Viewers: {campaign.live_viewer_count || 0}
                    </p>
                    {campaign.facebook_live_url && (
                      <a 
                        href={campaign.facebook_live_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-red-600 hover:underline"
                      >
                        View Live Stream
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'donations' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-800">{campaign.donation_count || 0}</h4>
                    <p className="text-sm text-blue-600">Total Donations</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-green-800">{campaign.avg_donation || 0} MRU</h4>
                    <p className="text-sm text-green-600">Average Donation</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-purple-800">{campaign.pending_donations || 0}</h4>
                    <p className="text-sm text-purple-600">Pending Donations</p>
                  </div>
                </div>

                {campaign.donations && campaign.donations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Anonymous</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {campaign.donations.map((donation) => (
                          <tr key={donation.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{donation.donor_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{donation.amount} MRU</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {new Date(donation.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {donation.is_anonymous ? 'Yes' : 'No'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No donations found</p>
                )}
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-900">Campaign Files</h4>
                  <span className="text-sm text-gray-500">
                    {campaign.files ? campaign.files.length : 0} files
                  </span>
                </div>

                {campaign.files && campaign.files.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaign.files.map((file) => (
                      <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-8 w-8 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(file.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No files uploaded</p>
                )}
              </div>
            )}

            {activeTab === 'analytics' && campaign.analytics && (
              <div className="space-y-6">
                {/* Donation Trends */}
                {campaign.analytics.donation_trends && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Donation Trends</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(campaign.analytics.donation_trends).map(([period, data]) => (
                        <div key={period} className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 capitalize">
                            {period.replace('_', ' ')}
                          </h5>
                          <p className="text-lg font-semibold text-gray-900">{data.count} donations</p>
                          <p className="text-sm text-gray-600">{data.total} MRU</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Days Active</label>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{campaign.days_active || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Failed Donations</label>
                    <p className="mt-1 text-2xl font-bold text-red-600">{campaign.failed_donations || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <div className="flex space-x-3">
              <button
                onClick={() => onToggleFeatured(campaign.id, campaign.featured)}
                className={`px-4 py-2 rounded ${
                  campaign.featured 
                    ? 'bg-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
              >
                {campaign.featured ? 'Remove Featured' : 'Set Featured'}
              </button>
              <button
                onClick={() => {
                  setModerationAction('flag');
                  setShowModerationModal(true);
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Flag Campaign
              </button>
              <button
                onClick={() => {
                  setModerationAction('suspend');
                  setShowModerationModal(true);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Suspend Campaign
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              autoFocus
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Moderation Modal */}
      {showModerationModal && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-60"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModerationModal(false);
              setModerationAction('');
              setModerationReason('');
            }
          }}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-[90vw]">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              {moderationAction === 'flag' ? 'Flag Campaign' : 'Suspend Campaign'}
            </h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (required)
              </label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Please provide a reason for this action..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModerationModal(false);
                  setModerationAction('');
                  setModerationReason('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleModeration}
                disabled={!moderationReason.trim()}
                className={`px-4 py-2 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${
                  moderationAction === 'flag'
                    ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
              >
                Confirm {moderationAction === 'flag' ? 'Flag' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CampaignManagement;