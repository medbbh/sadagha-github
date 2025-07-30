import { api } from '../axiosConfig';

const BASE_URL = '/admin/financial';

export const financialApi = {
  // Get all donations/transactions with filters and pagination
  getDonations: (params = {}) => {
    return api.get(`${BASE_URL}/`, { params });
  },

  // Get single donation/transaction details
  getDonation: (donationId) => {
    return api.get(`${BASE_URL}/${donationId}/`);
  },

  // Get financial dashboard statistics
  getDashboardStats: () => {
    return api.get(`${BASE_URL}/dashboard_stats/`);
  },

  // Real-time transaction monitoring
  getTransactionMonitoring: (params = {}) => {
    return api.get(`${BASE_URL}/transaction_monitoring/`, { params });
  },

  // Get payment analytics
  getPaymentAnalytics: () => {
    return api.get(`${BASE_URL}/payment_analytics/`);
  },

  // Get revenue analytics
  getRevenueAnalytics: (days = 30) => {
    return api.get(`${BASE_URL}/revenue_analytics/`, { params: { days } });
  },

  // Fraud detection and suspicious transactions
  getFraudDetection: () => {
    return api.get(`${BASE_URL}/fraud_detection/`);
  },

  // Get donation trends
  getDonationTrends: (days = 30) => {
    return api.get(`${BASE_URL}/donation_trends/`, { params: { days } });
  },

  // Get failed transactions analysis
  getFailedTransactions: (days = 7) => {
    return api.get(`${BASE_URL}/failed_transactions/`, { params: { days } });
  },

  // Monitor large donations
  getLargeDonations: (params = {}) => {
    return api.get(`${BASE_URL}/large_donations/`, { params });
  },

  // Get donor analytics
  getDonorAnalytics: () => {
    return api.get(`${BASE_URL}/donor_analytics/`);
  },

  // Get webhook logs for debugging
  getWebhookLogs: (params = {}) => {
    return api.get(`${BASE_URL}/webhook_logs/`, { params });
  },

  // Get refund analysis
  getRefundAnalysis: (days = 30) => {
    return api.get(`${BASE_URL}/refund_analysis/`, { params: { days } });
  },

  // Get currency breakdown
  getCurrencyBreakdown: (days = 30) => {
    return api.get(`${BASE_URL}/currency_breakdown/`, { params: { days } });
  },

  // Get detailed transaction information
  getTransactionDetails: (donationId) => {
    return api.get(`${BASE_URL}/${donationId}/transaction_details/`);
  },

  // Flag transaction for manual review
  flagTransaction: (donationId, reason) => {
    return api.post(`${BASE_URL}/flag_transaction/`, {
      donation_id: donationId,
      reason
    });
  },

};