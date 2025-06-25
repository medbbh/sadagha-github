// api/endpoints/donationAPI.js - Fixed for your axios config
import api from '../axiosConfig'; // Your axios instance

export const DonationService = {
  // Create donation session - Fixed for your axios interceptor
  createDonation: async (campaignId, donationData) => {
    try {
      console.log('DonationService: Making API call to:', `/campaigns/${campaignId}/create_donation/`);
      console.log('DonationService: Sending data:', donationData);
      
      // Your axios returns response.data directly due to the interceptor
      const data = await api.post(`/campaigns/${campaignId}/create_donation/`, donationData);
      
      console.log('DonationService: Response data (direct):', data);
      
      // Return in the expected format for your component
      return {
        data: data, // The actual response data
        status: 200 // We can assume 200 if no error was thrown
      };
      
    } catch (error) {
      console.error('DonationService: Error occurred:', error);
      
      // Your axios error interceptor transforms errors
      throw new Error(error.message || 'API call failed');
    }
  },

  // Get payment status
  getPaymentStatus: async (sessionId) => {
    try {
      const data = await api.get(`/campaigns/payment_status/`, {
        params: { session_id: sessionId }
      });
      
      return { data, status: 200 };
    } catch (error) {
      throw new Error(error.message || 'Failed to get payment status');
    }
  },

  // Get campaign donations
  getCampaignDonations: async (campaignId) => {
    try {
      const data = await api.get(`/campaigns/${campaignId}/donations/`);
      return { data, status: 200 };
    } catch (error) {
      throw new Error(error.message || 'Failed to get donations');
    }
  },

  // Health check
  checkPaymentServiceHealth: async () => {
    try {
      const data = await api.get('/campaigns/payment_health/');
      return data;
    } catch (error) {
      return { healthy: false };
    }
  }
};

export default DonationService;