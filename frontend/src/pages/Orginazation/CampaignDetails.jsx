import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  DollarSign, 
  Target,
  Users,
  Calendar,
  Eye,
  Clock,
  BarChart3,
  Settings,
  AlertCircle
} from 'lucide-react';

import { fetchCampaignById } from '../../api/endpoints/CampaignAPI';
import { fetchCategoryById } from '../../api/endpoints/CategoryAPI';
import orgDashboardApi from '../../api/endpoints/OrgAPI';
import CampaignCarousel from '../../components/ui/CampaignCarousel';
import ShareButton from '../../components/ui/ShareButton';

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState(null);
  const [campaignCategory, setCampaignCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    } else {
      setError('Campaign ID is missing from URL');
    }
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading campaign with ID:', campaignId);
      
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }
      
      const data = await fetchCampaignById(campaignId);
      setCampaign(data);
      
      // Fetch category details if campaign has a category
      if (data.category) {
        try {
          const categoryId = typeof data.category === 'object' ? data.category.id : data.category;
          const categoryData = await fetchCategoryById(categoryId);
          setCampaignCategory(categoryData);
        } catch (categoryError) {
          console.warn('Failed to load category details:', categoryError);
          if (typeof data.category === 'object') {
            setCampaignCategory(data.category);
          }
        }
      }
    } catch (err) {
      console.error('Load campaign error:', err);
      setError(err.message || 'Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `${orgDashboardApi.formatNumber(amount)} MRU`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProgressPercentage = () => {
    if (!campaign) return 0;
    return Math.min((parseFloat(campaign.current_amount) / parseFloat(campaign.target)) * 100, 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="h-80 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Campaign</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => loadCampaign()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/organization/campaigns')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Campaign Not Found</h2>
        <p className="text-gray-500 mb-4">The campaign you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/organization/campaigns')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Campaigns
        </button>
      </div>
    );
  }

  const progress = getProgressPercentage();
  const daysActive = Math.floor((new Date() - new Date(campaign.created_at)) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/organization/campaigns')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Campaign Details</h1>
              <p className="text-slate-600 mt-1">View and manage your fundraising campaign</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.open(`/campaign/${campaign.id}`, '_blank')}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button
              onClick={() => navigate(`/organization/campaigns/${campaignId}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Campaign
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Campaign Visual and Details (2/3 width) */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Campaign Carousel */}
            <CampaignCarousel 
              files={campaign.files} 
              isEditing={false}
            />
            
            {/* Campaign Content */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{campaign.name}</h1>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full">
                      {campaignCategory?.name || campaign.category?.name || 'Uncategorized'}
                    </span>
                    {campaign.featured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                    <span className="text-slate-500 text-sm">
                      Created {formatDate(campaign.created_at)} • {daysActive} days active
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <ShareButton 
                    campaign={campaign}
                    variant="button-only"
                    showMetaTags={false}
                    className="p-2 text-slate-500 hover:text-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Progress Section */}
              <div className="mb-6 bg-slate-50 rounded-lg p-4">
                <div className="flex justify-between mb-3">
                  <span className="text-lg font-semibold text-slate-900">
                    {formatCurrency(campaign.current_amount)} raised
                  </span>
                  <span className="text-slate-600">
                    {progress.toFixed(1)}% of {formatCurrency(campaign.target)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm text-slate-600">
                  <span>{progress.toFixed(1)}% funded</span>
                  <span>{orgDashboardApi.formatNumber(campaign.number_of_donors)} donors</span>
                </div>
              </div>

              {/* Campaign Story */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-3">Campaign Story</h2>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {campaign.description || "No description provided yet."}
                </p>
              </div>

              {/* Facebook Live Section */}
              {campaign.facebook_live_url && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-900 mb-3">Facebook Live</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Eye className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Live Stream Available</p>
                        <p className="text-sm text-blue-700">
                          {campaign.live_status === 'live' ? 'Currently Live' : 'Stream Available'}
                          {campaign.live_viewer_count > 0 && ` • ${campaign.live_viewer_count} viewers`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <a
                        href={campaign.facebook_live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Watch Live Stream
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Created</p>
                      <p className="font-medium">{formatDate(campaign.created_at)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Target</p>
                      <p className="font-medium">{formatCurrency(campaign.target)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Donors</p>
                      <p className="font-medium">{orgDashboardApi.formatNumber(campaign.number_of_donors)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (1/3 width) */}
        <div className="lg:w-1/3 space-y-6">
          {/* Campaign Performance */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Summary</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Raised</p>
                    <p className="font-semibold text-slate-900">{formatCurrency(campaign.current_amount)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Donors</p>
                    <p className="font-semibold text-slate-900">{orgDashboardApi.formatNumber(campaign.number_of_donors)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Progress</p>
                    <p className="font-semibold text-slate-900">{progress.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <Calendar className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Days Active</p>
                    <p className="font-semibold text-slate-900">{daysActive}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/organization/campaigns/${campaignId}/edit`)}
                className="w-full flex items-center space-x-3 p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Edit Campaign</p>
                  <p className="text-sm text-blue-700">Update details, images, and story</p>
                </div>
              </button>

              <button
                onClick={() => navigate(`/organization/campaigns/${campaignId}/analytics`)}
                className="w-full flex items-center space-x-3 p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">View Analytics</p>
                  <p className="text-sm text-slate-600">See detailed performance metrics</p>
                </div>
              </button>

              <button
                onClick={() => navigate(`/organization/campaigns/${campaignId}/donations`)}
                className="w-full flex items-center space-x-3 p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">View Supporters</p>
                  <p className="text-sm text-slate-600">See who has contributed</p>
                </div>
              </button>

              <button
                onClick={() => navigate(`/organization/campaigns/${campaignId}/settings`)}
                className="w-full flex items-center space-x-3 p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">Campaign Settings</p>
                  <p className="text-sm text-slate-600">Manage campaign preferences</p>
                </div>
              </button>
            </div>
          </div>

          {/* Share Campaign */}
          <ShareButton 
            campaign={campaign}
            variant="compact"
            showPreview={false}
            showMetaTags={true}
          />

          {/* Campaign Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Campaign Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <p className="text-slate-900">{campaignCategory?.name || campaign.category?.name || 'Uncategorized'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Updated</label>
                <p className="text-slate-900">{formatDate(campaign.updated_at)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                  {campaign.featured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Facebook Live Status */}
              {campaign.has_facebook_live && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Live Stream</label>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      campaign.is_live 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.is_live ? 'Live Now' : 'Available'}
                    </span>
                    {campaign.live_viewer_count > 0 && (
                      <span className="text-xs text-slate-600">
                        {campaign.live_viewer_count} viewers
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}