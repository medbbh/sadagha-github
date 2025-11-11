import { api } from '../axiosConfig';

const BASE_URL = '/admin/actions';

export const adminActionApi = {
  // Get all admin actions with filters and pagination
  getActions: (params = {}) => {
    return api.get(`${BASE_URL}/`, { params });
  },

  // Get single action details
  getAction: (actionId) => {
    return api.get(`${BASE_URL}/${actionId}/`);
  },

  // Get dashboard statistics
  getStatistics: () => {
    return api.get(`${BASE_URL}/statistics/`);
  },

  // Get recent actions (last 20)
  getRecentActions: () => {
    return api.get(`${BASE_URL}/recent/`);
  },

  // Get filter options for dropdowns
  getFilterOptions: () => {
    return api.get(`${BASE_URL}/filter_options/`);
  },

  // Export actions to CSV
  exportToCSV: (params = {}) => {
    return api.get(`${BASE_URL}/export/`, {
      params,
      responseType: 'blob', // Important for file download
    });
  },

  // Helper method to download exported CSV
  downloadCSV: async (params = {}, filename = 'admin_actions.csv') => {
    try {
      const response = await adminActionApi.exportToCSV(params);
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading CSV:', error);
      return { success: false, error };
    }
  },

  // Advanced filtering helpers
  filters: {
    // Filter by action type
    byActionType: (actionType, additionalParams = {}) => {
      return adminActionApi.getActions({
        action_type: actionType,
        ...additionalParams
      });
    },

    // Filter by target model
    byTargetModel: (targetModel, additionalParams = {}) => {
      return adminActionApi.getActions({
        target_model: targetModel,
        ...additionalParams
      });
    },

    // Filter by admin user
    byAdminUser: (adminUserId, additionalParams = {}) => {
      return adminActionApi.getActions({
        admin_user: adminUserId,
        ...additionalParams
      });
    },

    // Filter by date range
    byDateRange: (startDate, endDate, additionalParams = {}) => {
      return adminActionApi.getActions({
        timestamp__gte: startDate,
        timestamp__lte: endDate,
        ...additionalParams
      });
    },

    // Filter by today
    byToday: (additionalParams = {}) => {
      const today = new Date().toISOString().split('T')[0];
      return adminActionApi.getActions({
        timestamp__date: today,
        ...additionalParams
      });
    },

    // Search in actions
    search: (searchTerm, additionalParams = {}) => {
      return adminActionApi.getActions({
        search: searchTerm,
        ...additionalParams
      });
    },

    // Filter by target (model + id)
    byTarget: (targetModel, targetId, additionalParams = {}) => {
      return adminActionApi.getActions({
        target_model: targetModel,
        target_id: targetId,
        ...additionalParams
      });
    }
  }
};