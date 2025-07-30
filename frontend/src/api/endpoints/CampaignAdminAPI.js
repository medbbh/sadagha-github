import { api } from '../axiosConfig';

const BASE_URL = '/admin/campaigns';

export const campaignApi = {
  // Get all campaigns with filters and pagination
  getCampaigns: (params = {}) => {
    return api.get(`${BASE_URL}/`, { params });
  },

  // Get single campaign details
  getCampaign: (campaignId) => {
    return api.get(`${BASE_URL}/${campaignId}/`);
  },

  // Update campaign
  updateCampaign: (campaignId, campaignData) => {
    return api.patch(`${BASE_URL}/${campaignId}/`, campaignData);
  },

  // Get campaign statistics
  getCampaignStats: () => {
    return api.get(`${BASE_URL}/stats/`);
  },

  // Get featured campaigns
  getFeaturedCampaigns: (params = {}) => {
    return api.get(`${BASE_URL}/featured_campaigns/`, { params });
  },

  // Set campaign as featured
  setFeatured: (campaignId, maxFeatured = 10) => {
    return api.post(`${BASE_URL}/${campaignId}/set_featured/`, { max_featured: maxFeatured });
  },

  // Remove campaign from featured
  unsetFeatured: (campaignId) => {
    return api.post(`${BASE_URL}/${campaignId}/unset_featured/`);
  },

  // Bulk feature/unfeature campaigns
  bulkFeature: (campaignIds, action = 'feature') => {
    return api.post(`${BASE_URL}/bulk_feature/`, {
      campaign_ids: campaignIds,
      action: action // 'feature' or 'unfeature'
    });
  },

  // Get campaign donations
  getCampaignDonations: (campaignId, params = {}) => {
    return api.get(`${BASE_URL}/${campaignId}/donations/`, { params });
  },

  // Get campaign files
  getCampaignFiles: (campaignId) => {
    return api.get(`${BASE_URL}/${campaignId}/files/`);
  },

  // Delete campaign file
  deleteCampaignFile: (campaignId, fileId) => {
    return api.delete(`${BASE_URL}/${campaignId}/delete_file/`, {
      data: { file_id: fileId }
    });
  },

  // Get campaign analytics
  getCampaignAnalytics: (campaignId) => {
    return api.get(`${BASE_URL}/${campaignId}/analytics/`);
  },

  // Get campaign activity log
  getCampaignActivityLog: (campaignId) => {
    return api.get(`${BASE_URL}/${campaignId}/activity_log/`);
  },

  // Get performance metrics
  getPerformanceMetrics: () => {
    return api.get(`${BASE_URL}/performance_metrics/`);
  },

  // Get suspicious campaigns
  getSuspiciousCampaigns: () => {
    return api.get(`${BASE_URL}/suspicious_campaigns/`);
  },

  // Get trending campaigns analysis
  getTrendingAnalysis: (days = 7) => {
    return api.get(`${BASE_URL}/trending_analysis/`, { params: { days } });
  },

  // Moderate campaign
  moderateCampaign: (campaignId, action, reason = '') => {
    return api.post(`${BASE_URL}/${campaignId}/moderate/`, {
      action, // 'approve', 'flag', 'suspend'
      reason
    });
  }
};