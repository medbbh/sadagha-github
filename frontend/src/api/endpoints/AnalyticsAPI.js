// api/endpoints/AnalyticsAPI.js
import api from '../axiosConfig';

// Fetch analytics overview data
export const fetchAnalyticsOverview = async (params = {}) => {
  try {
    const queryParams = {};
    
    if (params.period) queryParams.period = params.period;
    if (params.start_date) queryParams.start_date = params.start_date;
    if (params.end_date) queryParams.end_date = params.end_date;

    console.log('AnalyticsAPI: Fetching overview with params:', queryParams);
    
    const response = await api.get('/org/analytics/overview/', { params: queryParams });
    console.log('AnalyticsAPI: Overview response:', response);
    
    return response;
  } catch (error) {
    console.error('AnalyticsAPI: Failed to fetch analytics overview:', error);
    throw {
      message: error.message || 'Failed to fetch analytics overview',
      details: error.details,
      status: error.status,
      ...error
    };
  }
};

// Fetch campaign-specific analytics
export const fetchCampaignAnalytics = async (campaignId, params = {}) => {
  try {
    const queryParams = {
      campaign_id: campaignId,
      ...params
    };

    if (params.period) queryParams.period = params.period;
    if (params.start_date) queryParams.start_date = params.start_date;
    if (params.end_date) queryParams.end_date = params.end_date;

    console.log('AnalyticsAPI: Fetching campaign analytics with params:', queryParams);
    
    const response = await api.get('/org/analytics/campaign_details/', { params: queryParams });
    console.log('AnalyticsAPI: Campaign analytics response:', response);
    
    return response;
  } catch (error) {
    console.error('AnalyticsAPI: Failed to fetch campaign analytics:', error);
    throw {
      message: error.message || 'Failed to fetch campaign analytics',
      details: error.details,
      status: error.status,
      ...error
    };
  }
};

// Utility functions for analytics
export const formatCurrency = (amount, currency = 'MRU') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatDateForAPI = (date) => {
  if (!date) return null;
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return date;
};

export const calculateGrowthRate = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
};

export const getDateRange = (period) => {
  const end = new Date();
  let start = new Date();
  
  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }
  
  return {
    start: formatDateForAPI(start),
    end: formatDateForAPI(end)
  };
};

// Validate date ranges
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Both start and end dates are required' };
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (start >= end) {
    return { valid: false, error: 'Start date must be before end date' };
  }
  
  // Check if date range is not too large (e.g., max 2 years)
  const maxDays = 365 * 2;
  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  
  if (diffDays > maxDays) {
    return { valid: false, error: 'Date range cannot exceed 2 years' };
  }
  
  return { valid: true };
};

// Error handling wrapper
export const withErrorHandling = (apiCall) => {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (error) {
      console.error(`AnalyticsAPI Error in ${apiCall.name}:`, {
        message: error.message,
        details: error.details,
        status: error.status,
        args
      });
      
      // Enhance error message based on status
      let enhancedMessage = error.message;
      
      if (error.status === 404) {
        enhancedMessage = 'Analytics endpoint not found. Please check if the backend routes are configured correctly.';
      } else if (error.status === 403) {
        enhancedMessage = 'Permission denied. Please make sure you are logged in as an organization user.';
      } else if (error.status === 500) {
        enhancedMessage = 'Server error. Please check the backend logs and try again.';
      } else if (error.message && error.message.includes('<!doctype')) {
        enhancedMessage = 'Server returned HTML instead of JSON. Please check backend configuration.';
      }
      
      throw {
        message: enhancedMessage,
        status: error.status || 500,
        details: error.details || null,
        timestamp: new Date().toISOString()
      };
    }
  };
};

// Export all functions with error handling
export default {
  // Core analytics functions
  fetchAnalyticsOverview: withErrorHandling(fetchAnalyticsOverview),
  fetchCampaignAnalytics: withErrorHandling(fetchCampaignAnalytics),

  // Utility functions
  formatCurrency,
  formatDate,
  formatDateForAPI,
  calculateGrowthRate,
  getDateRange,
  validateDateRange
};