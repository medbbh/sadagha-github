// api/endpoints/FacebookLiveAPI.js
import api from '../axiosConfig';

// Get Facebook OAuth URL
export const getFacebookOAuthUrl = async () => {
  try {
    const response = await api.get('campaigns/facebook/oauth-url/');
    return response;
  } catch (error) {
    console.error('Failed to get Facebook OAuth URL:', error);
    throw error;
  }
};

// Handle Facebook OAuth callback
export const handleFacebookOAuthCallback = async (code, campaignId) => {
  try {
    const response = await api.post('campaigns/facebook/oauth-callback/', {
      code,
      campaign_id: campaignId
    });
    return response;
  } catch (error) {
    console.error('Failed to handle Facebook OAuth callback:', error);
    throw error;
  }
};

// Get user's Facebook Live videos
export const getUserFacebookLiveVideos = async (accessToken) => {
  try {
    const response = await api.get('campaigns/facebook/live-videos/', {
      params: { access_token: accessToken }
    });
    return response;
  } catch (error) {
    console.error('Failed to get Facebook Live videos:', error);
    throw error;
  }
};

// Get campaign live status (public endpoint)
export const getCampaignLiveStatus = async (campaignId) => {
  try {
    const response = await api.get(`/campaigns/${campaignId}/live-status/`);
    return response;
  } catch (error) {
    console.error('Failed to get campaign live status:', error);
    throw error;
  }
};

// Update campaign live status (owner only)
export const updateCampaignLiveStatus = async (campaignId) => {
  try {
    const response = await api.post(`/campaigns/${campaignId}/update-live-status/`);
    return response;
  } catch (error) {
    console.error('Failed to update campaign live status:', error);
    throw error;
  }
};

// Refresh live status using campaign endpoint
export const refreshCampaignLiveStatus = async (campaignId) => {
  try {
    const response = await api.post(`/campaigns/${campaignId}/refresh_live_status/`);
    return response;
  } catch (error) {
    console.error('Failed to refresh campaign live status:', error);
    throw error;
  }
};