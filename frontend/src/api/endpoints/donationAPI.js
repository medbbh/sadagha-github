// api/endpoints/donationAPI.js - Updated with user donation functions
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
  },

  // ============ NEW USER DONATION FUNCTIONS ============

  // Get user's donation history with filtering and pagination
  getUserDonations: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      if (params.campaign) queryParams.append('campaign', params.campaign);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.search) queryParams.append('search', params.search);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const data = await api.get(`/donations/my-donations/?${queryParams}`);
      return data; // Your axios returns data directly
    } catch (error) {
      console.error('DonationService: Error fetching user donations:', error);
      throw new Error(error.message || 'Failed to fetch donations');
    }
  },

  // Get donation summary for dashboard
  getDonationSummary: async () => {
    try {
      const data = await api.get('/donations/summary/');
      return data;
    } catch (error) {
      console.error('DonationService: Error fetching donation summary:', error);
      throw new Error(error.message || 'Failed to fetch donation summary');
    }
  },

};

// Export individual functions for convenience (keeping backward compatibility)
export const createDonation = DonationService.createDonation;
export const getPaymentStatus = DonationService.getPaymentStatus;
export const getCampaignDonations = DonationService.getCampaignDonations;
export const checkPaymentServiceHealth = DonationService.checkPaymentServiceHealth;

// Export new user donation functions
export const fetchUserDonations = DonationService.getUserDonations;
export const fetchDonationSummary = DonationService.getDonationSummary;

export default DonationService;