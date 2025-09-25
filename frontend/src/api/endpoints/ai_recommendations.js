import api from '../axiosConfig';


// Get campaign-based recommendations
export const getCampaignRecommendations = async (campaignId) => {
  try {
    const response = await api.get(`/campaigns/similar/${campaignId}/`);
    return response;
  } catch (error) {
    console.error("Error fetching campaign recommendations:", error);
    throw error;
  }
};

// Get user-based recommendations
export const getUserRecommendations = async (userId) => {
  try {
    const response = await api.get(`/campaigns/user/${userId}/`);
    return response;
  } catch (error) {
    console.error("Error fetching user recommendations:", error);
    throw error;
  }
};
