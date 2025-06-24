// api/campaignService.js
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const campaignService = {
  // Get all campaigns
  getCampaigns: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/campaigns/?${queryString}`);
  },

  // Get single campaign
  getCampaign: async (id) => {
    return api.get(`/campaigns/${id}/`);
  },

  // Create donation session
  createDonation: async (campaignId, donationData) => {
    return api.post(`/campaigns/${campaignId}/create_donation/`, donationData);
  },

  // Get campaign donations
  getCampaignDonations: async (campaignId) => {
    return api.get(`/campaigns/${campaignId}/donations/`);
  },

  // Get categories
  getCategories: async () => {
    return api.get('/campaigns/categories/');
  },

  // Create campaign (for authenticated users)
  createCampaign: async (formData) => {
    return api.post('/campaigns/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Update campaign
  updateCampaign: async (id, formData) => {
    return api.patch(`/campaigns/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get user's campaigns
  getMyCampaigns: async () => {
    return api.get('/campaigns/my_campaigns/');
  },

  // Get featured campaigns
  getFeaturedCampaigns: async () => {
    return api.get('/campaigns/featured/');
  },

  // Get multiple campaigns by IDs
  getCampaignsBatch: async (ids) => {
    return api.post('/campaigns/batch/', { ids });
  },
};

export default campaignService;