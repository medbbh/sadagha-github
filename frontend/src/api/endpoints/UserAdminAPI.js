import { api } from '../axiosConfig';

const BASE_URL = '/admin/users';

export const userApi = {
  // Get all users with filters and pagination
  getUsers: (params = {}) => {
    return api.get(`${BASE_URL}/`, { params });
  },

  // Get single user details
  getUser: (userId) => {
    return api.get(`${BASE_URL}/${userId}/`);
  },

  // Create new user
  createUser: (userData) => {
    return api.post(`${BASE_URL}/`, userData);
  },

  // Update user
  updateUser: (userId, userData) => {
    return api.patch(`${BASE_URL}/${userId}/`, userData);
  },

  // Delete/Deactivate user
  deleteUser: (userId) => {
    return api.delete(`${BASE_URL}/${userId}/`);
  },

  // Get user statistics
  getUserStats: () => {
    return api.get(`${BASE_URL}/stats/`);
  },

  // Get user activity
  getUserActivity: (userId) => {
    return api.get(`${BASE_URL}/${userId}/activity/`);
  },

  // Toggle user active status
  toggleUserActive: (userId) => {
    return api.post(`${BASE_URL}/${userId}/toggle_active/`);
  },

  // Change user role
  changeUserRole: (userId, role) => {
    return api.post(`${BASE_URL}/${userId}/change_role/`, { role });
  },

  // Get comprehensive profile data
  getUserProfile: (userId) => {
    return api.get(`${BASE_URL}/${userId}/profile_data/`);
  },

  // Bulk actions
  bulkActions: (action, userIds, metadata = {}) => {
    return api.post(`${BASE_URL}/bulk_actions/`, {
      action,
      user_ids: userIds,
      metadata
    });
  },

  // Get recent activity
  getRecentActivity: (days = 7, limit = 50) => {
    return api.get(`${BASE_URL}/recent_activity/`, {
      params: { days, limit }
    });
  },

  // Get suspicious activity
  getSuspiciousActivity: () => {
    return api.get(`${BASE_URL}/suspicious_activity/`);
  }
};