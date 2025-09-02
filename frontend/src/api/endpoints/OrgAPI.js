import api from '../axiosConfig';

// Organization Profile Management
export const fetchOrgProfile = async () => {
  try {
    const response = await api.get('org/organization-profile/');
    return response;
  } catch (error) {
    console.error('Failed to fetch organization profile:', error);
    throw {
      message: error.message || 'Failed to fetch organization profile',
      details: error.details,
      ...error
    };
  }
};

export const updateOrgProfile = async (profileId, formData) => {
  try {
    const response = await api.put(`org/organization-profile/${profileId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error('Failed to update organization profile:', error);
    throw {
      message: error.message || 'Failed to update organization profile',
      details: error.details,
      ...error
    };
  }
};

// NextRemitly Payment Configuration
export const fetchPaymentMethods = async (orgId) => {
  try {
    const response = await api.get(`org/organization-profile/${orgId}/payment_methods/`);
    return response;
  } catch (error) {
    console.error('Failed to fetch payment configuration:', error);
    throw {
      message: error.message || 'Failed to fetch payment configuration',
      details: error.details,
      ...error
    };
  }
};

export const setupNextRemitly = async (orgId, apiKey) => {
  try {
    const response = await api.post(`org/organization-profile/${orgId}/setup_nextremitly/`, {
      nextremitly_api_key: apiKey
    });
    return response;
  } catch (error) {
    console.error('Failed to setup NextRemitly:', error);
    throw {
      message: error.message || 'Failed to setup NextRemitly payments',
      details: error.details,
      ...error
    };
  }
};

export const testPaymentConnection = async (orgId) => {
  try {
    const response = await api.post(`org/organization-profile/${orgId}/test_payment_connection/`);
    return response;
  } catch (error) {
    console.error('Failed to test payment connection:', error);
    throw {
      message: error.message || 'Failed to test payment connection',
      details: error.details,
      ...error
    };
  }
};

export const disablePayments = async (orgId) => {
  try {
    const response = await api.post(`org/organization-profile/${orgId}/disable_payments/`);
    return response;
  } catch (error) {
    console.error('Failed to disable payments:', error);
    throw {
      message: error.message || 'Failed to disable payments',
      details: error.details,
      ...error
    };
  }
};

// Dashboard Statistics
export const fetchOrgStatistics = async (period = '30d') => {
  try {
    const response = await api.get('/org/dashboard/statistics/', {
      params: { period }
    });
    return response;
  } catch (error) {
    console.error('Failed to fetch organization statistics:', error);
    throw {
      message: error.message || 'Failed to fetch organization statistics',
      details: error.details,
      status: error.response?.status,
      ...error
    };
  }
};

export const fetchPaymentSummary = async () => {
  try {
    const response = await api.get('/org/dashboard/payment_summary/');
    return response;
  } catch (error) {
    console.error('Failed to fetch payment summary:', error);
    throw {
      message: error.message || 'Failed to fetch payment summary',
      details: error.details,
      status: error.response?.status,
      ...error
    };
  }
};

export const fetchDashboardOverview = async () => {
  try {
    const response = await api.get('/org/dashboard/overview/');
    return response;
  } catch (error) {
    console.error('Failed to fetch dashboard overview:', error);
    throw {
      message: error.message || 'Failed to fetch dashboard overview',
      details: error.details,
      status: error.response?.status,
      ...error
    };
  }
};

// Analytics Data
export const fetchOrgAnalytics = async (period = '30d') => {
  try {
    const response = await api.get('/org/analytics/overview/', {
      params: { period }
    });
    return response;
  } catch (error) {
    console.error('Failed to fetch organization analytics:', error);
    throw {
      message: error.message || 'Failed to fetch organization analytics',
      details: error.details,
      ...error
    };
  }
};

// Organization Profile Image Management
export const uploadProfileImage = async (profileId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post(`org/organization-profile/${profileId}/upload_profile_image/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error('Failed to upload profile image:', error);
    throw {
      message: error.message || 'Failed to upload profile image',
      details: error.details,
      ...error
    };
  }
};

export const uploadCoverImage = async (profileId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post(`org/organization-profile/${profileId}/upload_cover_image/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error('Failed to upload cover image:', error);
    throw {
      message: error.message || 'Failed to upload cover image',
      details: error.details,
      ...error
    };
  }
};

export const deleteProfileImage = async (profileId) => {
  try {
    const response = await api.delete(`org/organization-profile/${profileId}/delete_profile_image/`);
    return response;
  } catch (error) {
    console.error('Failed to delete profile image:', error);
    throw {
      message: error.message || 'Failed to delete profile image',
      details: error.details,
      ...error
    };
  }
};

export const deleteCoverImage = async (profileId) => {
  try {
    const response = await api.delete(`org/organization-profile/${profileId}/delete_cover_image/`);
    return response;
  } catch (error) {
    console.error('Failed to delete cover image:', error);
    throw {
      message: error.message || 'Failed to delete cover image',
      details: error.details,
      ...error
    };
  }
};

// Organization Document Management
export const uploadOrgDocument = async (profileId, documentFile) => {
  try {
    const formData = new FormData();
    formData.append('document', documentFile);

    const response = await api.patch(`org/organization-profile/${profileId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error('Failed to upload organization document:', error);
    throw {
      message: error.message || 'Failed to upload organization document',
      details: error.details,
      ...error
    };
  }
};

// Public Organization Access
export const fetchOrganizations = async (params = {}) => {
  try {
    const response = await api.get('/org/public-organizations', { params });
    return response;
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    throw error;
  }
};

export const fetchOrganizationById = async (id) => {
  try {
    const response = await api.get(`/org/public-organizations/${id}/`);
    return response;
  } catch (error) {
    console.error('Failed to fetch organization:', error);
    throw error;
  }
};

export const fetchOrganizationCampaigns = async (orgId) => {
  try {
    const response = await api.get(`/org/public-organizations/${orgId}/`);
    return response.campaigns || [];
  } catch (error) {
    console.error('Failed to fetch organization campaigns:', error);
    throw error;
  }
};

// Combined Dashboard Data Fetch
export const fetchFullDashboardData = async (period = '30d') => {
  try {
    const [
      profileData, 
      statisticsData, 
      overviewData, 
      paymentSummary,
      analyticsData
    ] = await Promise.allSettled([
      fetchOrgProfile(),
      fetchOrgStatistics(period),
      fetchDashboardOverview(),
      fetchPaymentSummary(),
      fetchOrgAnalytics(period)
    ]);

    // Process results, handling any failures gracefully
    const result = {
      profile: profileData.status === 'fulfilled' ? profileData.value : null,
      statistics: statisticsData.status === 'fulfilled' ? statisticsData.value : null,
      overview: overviewData.status === 'fulfilled' ? overviewData.value : null,
      paymentSummary: paymentSummary.status === 'fulfilled' ? paymentSummary.value : null,
      analytics: analyticsData.status === 'fulfilled' ? analyticsData.value : null,
      errors: []
    };

    // Collect any errors
    const promises = [profileData, statisticsData, overviewData, paymentSummary, analyticsData];
    const names = ['profile', 'statistics', 'overview', 'paymentSummary', 'analytics'];
    
    promises.forEach((promise, index) => {
      if (promise.status === 'rejected') {
        result.errors.push({
          endpoint: names[index],
          error: promise.reason
        });
      }
    });

    return result;
  } catch (error) {
    console.error('Failed to fetch full dashboard data:', error);
    throw {
      message: error.message || 'Failed to fetch dashboard data',
      details: error.details,
      ...error
    };
  }
};

// Payment Management Operations
export const paymentOperations = {
  // NextRemitly Operations
  nextremitly: {
    async setup(orgId, apiKey) {
      if (!apiKey || apiKey.trim().length < 10) {
        throw new Error('API key must be at least 10 characters long');
      }
      
      return await setupNextRemitly(orgId, apiKey.trim());
    },

    async test(orgId) {
      return await testPaymentConnection(orgId);
    },

    async disable(orgId) {
      return await disablePayments(orgId);
    },

    async getStatus(orgId) {
      return await fetchPaymentMethods(orgId);
    }
  }
};

// Helper Functions
export const downloadExportedFile = (data, filename, type = 'text/csv') => {
  try {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download file:', error);
    throw new Error('Failed to download file');
  }
};

export const formatCurrency = (amount, currency = 'MRU') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
};

export const calculatePercentage = (current, target) => {
  if (!target || target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

export const formatDateForAPI = (date) => {
  if (!date) return null;
  return date instanceof Date ? date.toISOString().split('T')[0] : date;
};

// NextRemitly API Key Validation
export const validateNextRemitlyApiKey = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') return false;
  
  // Basic validation - adjust based on NextRemitly's actual key format
  const cleaned = apiKey.trim();
  
  // Check minimum length
  if (cleaned.length < 10) return false;
  
  // Check if it looks like a valid API key (alphanumeric with possible special chars)
  const apiKeyPattern = /^[A-Za-z0-9_\-\.]+$/;
  return apiKeyPattern.test(cleaned);
};

export const formatApiKeyDisplay = (apiKey) => {
  if (!apiKey) return '';
  
  // Show only first 4 and last 4 characters
  if (apiKey.length <= 8) return apiKey;
  
  const start = apiKey.substring(0, 4);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}${'*'.repeat(Math.max(4, apiKey.length - 8))}${end}`;
};

// Error Handling Wrapper
export const withErrorHandling = (apiCall) => {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (error) {
      // Enhanced error logging
      console.error(`API Error in ${apiCall.name}:`, {
        message: error.message,
        details: error.details,
        status: error.status,
        args
      });
      
      // Re-throw with consistent error format
      throw {
        message: error.message || 'An unexpected error occurred',
        status: error.status || error.response?.status || 500,
        details: error.details || null,
        timestamp: new Date().toISOString()
      };
    }
  };
};

// Export all functions with error handling
export default {
  // Profile Management
  fetchOrgProfile: withErrorHandling(fetchOrgProfile),
  updateOrgProfile: withErrorHandling(updateOrgProfile),
  
  // NextRemitly Payment Management
  fetchPaymentMethods: withErrorHandling(fetchPaymentMethods),
  setupNextRemitly: withErrorHandling(setupNextRemitly),
  testPaymentConnection: withErrorHandling(testPaymentConnection),
  disablePayments: withErrorHandling(disablePayments),
  
  // Image Management
  uploadProfileImage: withErrorHandling(uploadProfileImage),
  uploadCoverImage: withErrorHandling(uploadCoverImage),
  deleteProfileImage: withErrorHandling(deleteProfileImage),
  deleteCoverImage: withErrorHandling(deleteCoverImage),
  
  // Dashboard Data
  fetchOrgStatistics: withErrorHandling(fetchOrgStatistics),
  fetchPaymentSummary: withErrorHandling(fetchPaymentSummary),
  fetchDashboardOverview: withErrorHandling(fetchDashboardOverview),
  fetchFullDashboardData: withErrorHandling(fetchFullDashboardData),
  
  // Analytics
  fetchOrgAnalytics: withErrorHandling(fetchOrgAnalytics),
  
  // Document Management
  uploadOrgDocument: withErrorHandling(uploadOrgDocument),
  
  // Public Organization Access
  fetchOrganizations: withErrorHandling(fetchOrganizations),
  fetchOrganizationById: withErrorHandling(fetchOrganizationById),
  fetchOrganizationCampaigns: withErrorHandling(fetchOrganizationCampaigns),
  
  // Utilities
  downloadExportedFile,
  formatCurrency,
  formatNumber,
  calculatePercentage,
  formatDateForAPI,
  validateNextRemitlyApiKey,
  formatApiKeyDisplay,
  
  // Payment Operations
  paymentOperations
};