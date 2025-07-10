// api/organizationDashboardApi.js - Updated for Simple Payment System
import api from '../axiosConfig';

// Organization Profile Management
export const fetchOrgProfile = async () => {
  try {
    const response = await api.get('/org/organization-profile/');
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
    const response = await api.put(`/org/organization-profile/${profileId}/`, formData, {
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

// Get organization payment methods summary
export const fetchPaymentMethods = async (orgId) => {
  try {
    const response = await api.get(`/org/organization-profile/${orgId}/payment_methods/`);
    return response;
  } catch (error) {
    console.error('Failed to fetch payment methods:', error);
    throw {
      message: error.message || 'Failed to fetch payment methods',
      details: error.details,
      ...error
    };
  }
};

// Manual Payment Management
export const fetchManualPayments = async () => {
  try {
    const response = await api.get('/org/manual-payments/');
    return response;
  } catch (error) {
    console.error('Failed to fetch manual payments:', error);
    throw {
      message: error.message || 'Failed to fetch manual payments',
      details: error.details,
      ...error
    };
  }
};

export const createManualPayment = async (paymentData) => {
  try {
    const response = await api.post('/org/manual-payments/', paymentData);
    return response;
  } catch (error) {
    console.error('Failed to create manual payment:', error);
    throw {
      message: error.message || 'Failed to create manual payment',
      details: error.details,
      ...error
    };
  }
};

export const updateManualPayment = async (paymentId, paymentData) => {
  try {
    const response = await api.patch(`/org/manual-payments/${paymentId}/`, paymentData);
    return response;
  } catch (error) {
    console.error('Failed to update manual payment:', error);
    throw {
      message: error.message || 'Failed to update manual payment',
      details: error.details,
      ...error
    };
  }
};

export const deleteManualPayment = async (paymentId) => {
  try {
    const response = await api.delete(`/org/manual-payments/${paymentId}/`);
    return response;
  } catch (error) {
    console.error('Failed to delete manual payment:', error);
    throw {
      message: error.message || 'Failed to delete manual payment',
      details: error.details,
      ...error
    };
  }
};

export const toggleManualPaymentActive = async (paymentId) => {
  try {
    const response = await api.post(`/org/manual-payments/${paymentId}/toggle_active/`);
    return response;
  } catch (error) {
    console.error('Failed to toggle manual payment status:', error);
    throw {
      message: error.message || 'Failed to toggle manual payment status',
      details: error.details,
      ...error
    };
  }
};

// NextPay Payment Management
export const fetchNextPayPayments = async () => {
  try {
    const response = await api.get('/org/nextpay-payments/');
    return response;
  } catch (error) {
    console.error('Failed to fetch NextPay payments:', error);
    throw {
      message: error.message || 'Failed to fetch NextPay payments',
      details: error.details,
      ...error
    };
  }
};

export const createNextPayPayment = async (paymentData) => {
  try {
    const response = await api.post('/org/nextpay-payments/', paymentData);
    return response;
  } catch (error) {
    console.error('Failed to create NextPay payment:', error);
    throw {
      message: error.message || 'Failed to create NextPay payment',
      details: error.details,
      ...error
    };
  }
};

export const updateNextPayPayment = async (paymentId, paymentData) => {
  try {
    const response = await api.patch(`/org/nextpay-payments/${paymentId}/`, paymentData);
    return response;
  } catch (error) {
    console.error('Failed to update NextPay payment:', error);
    throw {
      message: error.message || 'Failed to update NextPay payment',
      details: error.details,
      ...error
    };
  }
};

export const deleteNextPayPayment = async (paymentId) => {
  try {
    const response = await api.delete(`/org/nextpay-payments/${paymentId}/`);
    return response;
  } catch (error) {
    console.error('Failed to delete NextPay payment:', error);
    throw {
      message: error.message || 'Failed to delete NextPay payment',
      details: error.details,
      ...error
    };
  }
};

export const toggleNextPayPaymentActive = async (paymentId) => {
  try {
    const response = await api.post(`/org/nextpay-payments/${paymentId}/toggle_active/`);
    return response;
  } catch (error) {
    console.error('Failed to toggle NextPay payment status:', error);
    throw {
      message: error.message || 'Failed to toggle NextPay payment status',
      details: error.details,
      ...error
    };
  }
};

export const verifyNextPayPayment = async (paymentId) => {
  try {
    const response = await api.post(`/org/nextpay-payments/${paymentId}/verify/`);
    return response;
  } catch (error) {
    console.error('Failed to verify NextPay payment:', error);
    throw {
      message: error.message || 'Failed to verify NextPay payment',
      details: error.details,
      ...error
    };
  }
};

// Wallet Provider Management
export const fetchWalletProviders = async () => {
  try {
    const response = await api.get('/org/wallet-providers/');
    return response;
  } catch (error) {
    console.error('Failed to fetch wallet providers:', error);
    throw {
      message: error.message || 'Failed to fetch wallet providers',
      details: error.details,
      ...error
    };
  }
};

// UPDATED: Dashboard Statistics - Correct endpoint URL
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

// UPDATED: Dashboard Payment Summary - Correct endpoint URL
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

// UPDATED: Dashboard Overview Data - Correct endpoint URL
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

// Analytics Data (keeping for future campaign integration)
export const fetchOrgAnalytics = async (campaignId = null, startDate = null, endDate = null) => {
  try {
    const params = {};
    if (campaignId) params.campaign_id = campaignId;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get('/org/analytics/', { params });
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

// Organization Profile Document Management
export const uploadOrgDocument = async (profileId, documentFile) => {
  try {
    const formData = new FormData();
    formData.append('document', documentFile);

    const response = await api.patch(`/org/organization-profile/${profileId}/`, formData, {
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

// Verification Management
export const requestVerification = async (profileId) => {
  try {
    const response = await api.post(`/org/organization-profile/${profileId}/verify/`);
    return response;
  } catch (error) {
    console.error('Failed to request verification:', error);
    throw {
      message: error.message || 'Failed to request verification',
      details: error.details,
      ...error
    };
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

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
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

// Payment Validation Helper Functions
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  const cleaned = phoneNumber.toString().replace(/\s/g, '');
  return /^\d{8,12}$/.test(cleaned); // 8-12 digits
};

export const validateCommercialNumber = (commercialNumber) => {
  if (!commercialNumber) return false;
  const cleaned = commercialNumber.toString().replace(/\s/g, '');
  return /^\d{6,20}$/.test(cleaned); // 6-20 digits
};

export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  const cleaned = phoneNumber.toString().replace(/\s/g, '');
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{4})(\d{4})/g, '$1 $2');
  }
  return phoneNumber;
};

// UPDATED: Combined Dashboard Data Fetch - Using correct endpoints
export const fetchFullDashboardData = async (period = '30d') => {
  try {
    const [
      profileData, 
      statisticsData, 
      overviewData, 
      paymentSummary, 
      manualPayments,
      nextpayPayments,
      walletProviders
    ] = await Promise.allSettled([
      fetchOrgProfile(),
      fetchOrgStatistics(period),
      fetchDashboardOverview(),
      fetchPaymentSummary(),
      fetchManualPayments(),
      fetchNextPayPayments(),
      fetchWalletProviders()
    ]);

    // Process results, handling any failures gracefully
    const result = {
      profile: profileData.status === 'fulfilled' ? profileData.value : null,
      statistics: statisticsData.status === 'fulfilled' ? statisticsData.value : null,
      overview: overviewData.status === 'fulfilled' ? overviewData.value : null,
      paymentSummary: paymentSummary.status === 'fulfilled' ? paymentSummary.value : null,
      manualPayments: manualPayments.status === 'fulfilled' ? manualPayments.value : null,
      nextpayPayments: nextpayPayments.status === 'fulfilled' ? nextpayPayments.value : null,
      walletProviders: walletProviders.status === 'fulfilled' ? walletProviders.value : null,
      errors: []
    };

    // Collect any errors
    const promises = [profileData, statisticsData, overviewData, paymentSummary, manualPayments, nextpayPayments, walletProviders];
    const names = ['profile', 'statistics', 'overview', 'paymentSummary', 'manualPayments', 'nextpayPayments', 'walletProviders'];
    
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

// Payment Management Operations Helper
export const paymentOperations = {
  // Manual Payment Operations
  manual: {
    async create(paymentData) {
      if (!validatePhoneNumber(paymentData.phone_number)) {
        throw new Error('Invalid phone number format (8-12 digits required)');
      }
      
      if (!paymentData.wallet_provider_id) {
        throw new Error('Wallet provider must be selected');
      }
      
      return await createManualPayment(paymentData);
    },

    async update(paymentId, paymentData) {
      if (paymentData.phone_number && !validatePhoneNumber(paymentData.phone_number)) {
        throw new Error('Invalid phone number format (8-12 digits required)');
      }
      
      return await updateManualPayment(paymentId, paymentData);
    },

    async getActive() {
      const response = await fetchManualPayments();
      return response.data.filter(payment => payment.is_active);
    }
  },

  // NextPay Payment Operations
  nextpay: {
    async create(paymentData) {
      if (!validateCommercialNumber(paymentData.commercial_number)) {
        throw new Error('Invalid commercial number format (6-20 digits required)');
      }
      
      if (!paymentData.wallet_provider_id) {
        throw new Error('Wallet provider must be selected');
      }
      
      return await createNextPayPayment(paymentData);
    },

    async update(paymentId, paymentData) {
      if (paymentData.commercial_number && !validateCommercialNumber(paymentData.commercial_number)) {
        throw new Error('Invalid commercial number format (6-20 digits required)');
      }
      
      return await updateNextPayPayment(paymentId, paymentData);
    },

    async getActive() {
      const response = await fetchNextPayPayments();
      return response.data.filter(payment => payment.is_active);
    },

    async getVerified() {
      const response = await fetchNextPayPayments();
      return response.data.filter(payment => payment.verified_at && payment.is_active);
    }
  }
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
  fetchPaymentMethods: withErrorHandling(fetchPaymentMethods),
  
  // Manual Payment Management
  fetchManualPayments: withErrorHandling(fetchManualPayments),
  createManualPayment: withErrorHandling(createManualPayment),
  updateManualPayment: withErrorHandling(updateManualPayment),
  deleteManualPayment: withErrorHandling(deleteManualPayment),
  toggleManualPaymentActive: withErrorHandling(toggleManualPaymentActive),
  
  // NextPay Payment Management
  fetchNextPayPayments: withErrorHandling(fetchNextPayPayments),
  createNextPayPayment: withErrorHandling(createNextPayPayment),
  updateNextPayPayment: withErrorHandling(updateNextPayPayment),
  deleteNextPayPayment: withErrorHandling(deleteNextPayPayment),
  toggleNextPayPaymentActive: withErrorHandling(toggleNextPayPaymentActive),
  verifyNextPayPayment: withErrorHandling(verifyNextPayPayment),
  
  // Wallet Providers
  fetchWalletProviders: withErrorHandling(fetchWalletProviders),
  
  // Dashboard Data - UPDATED ENDPOINTS
  fetchOrgStatistics: withErrorHandling(fetchOrgStatistics),
  fetchPaymentSummary: withErrorHandling(fetchPaymentSummary),
  fetchDashboardOverview: withErrorHandling(fetchDashboardOverview),
  fetchFullDashboardData: withErrorHandling(fetchFullDashboardData),
  
  // Analytics
  fetchOrgAnalytics: withErrorHandling(fetchOrgAnalytics),
  
  // Document Management
  uploadOrgDocument: withErrorHandling(uploadOrgDocument),
  
  // Verification
  requestVerification: withErrorHandling(requestVerification),
  
  // Utilities
  downloadExportedFile,
  formatCurrency,
  formatNumber,
  calculatePercentage,
  formatDateForAPI,
  formatPhoneNumber,
  validatePhoneNumber,
  validateCommercialNumber,
  
  // Payment Operations
  paymentOperations
};