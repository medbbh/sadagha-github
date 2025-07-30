import { api } from '../axiosConfig';

const BASE_URL = '/admin/organizations';

export const organizationApi = {
  // Get all organizations with filters and pagination
  getOrganizations: (params = {}) => {
    return api.get(`${BASE_URL}/`, { params });
  },

  // Get single organization details
  getOrganization: (orgId) => {
    return api.get(`${BASE_URL}/${orgId}/`);
  },

  // Update organization
  updateOrganization: (orgId, orgData) => {
    return api.patch(`${BASE_URL}/${orgId}/`, orgData);
  },

  // Get organization statistics
  getOrganizationStats: () => {
    return api.get(`${BASE_URL}/stats/`);
  },

  // Get verification queue
  getVerificationQueue: (params = {}) => {
    return api.get(`${BASE_URL}/verification_queue/`, { params });
  },

  // Verify organization
  verifyOrganization: (orgId, notes = '') => {
    return api.post(`${BASE_URL}/${orgId}/verify/`, { notes });
  },

  // Reject verification
  rejectVerification: (orgId, reason) => {
    return api.post(`${BASE_URL}/${orgId}/reject_verification/`, { reason });
  },

  // Revoke verification
  revokeVerification: (orgId, reason) => {
    return api.post(`${BASE_URL}/${orgId}/revoke_verification/`, { reason });
  },

  // Get organization payment methods
  getPaymentMethods: (orgId) => {
    return api.get(`${BASE_URL}/${orgId}/payment_methods/`);
  },

  // Get organization campaigns
  getOrganizationCampaigns: (orgId, params = {}) => {
    return api.get(`${BASE_URL}/${orgId}/campaigns/`, { params });
  },

  // Get financial analytics for organization
  getFinancialAnalytics: (orgId) => {
    return api.get(`${BASE_URL}/${orgId}/financial_analytics/`);
  },

  // Get activity log
  getActivityLog: (orgId) => {
    return api.get(`${BASE_URL}/${orgId}/activity_log/`);
  },

  // Bulk verify organizations
  bulkVerify: (organizationIds, notes = '') => {
    return api.post(`${BASE_URL}/bulk_verify/`, {
      organization_ids: organizationIds,
      notes
    });
  },

  // Get performance metrics
  getPerformanceMetrics: () => {
    return api.get(`${BASE_URL}/performance_metrics/`);
  },

  // Get suspicious organizations
  getSuspiciousOrganizations: () => {
    return api.get(`${BASE_URL}/suspicious_organizations/`);
  }
};