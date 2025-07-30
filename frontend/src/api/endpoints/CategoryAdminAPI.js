import { api } from '../axiosConfig';

const BASE_URL = '/admin/categories';

export const categoryApi = {
  // Get all categories with filters and pagination
  getCategories: (params = {}) => {
    return api.get(`${BASE_URL}/`, { params });
  },

  // Get single category details
  getCategory: (categoryId) => {
    return api.get(`${BASE_URL}/${categoryId}/`);
  },

  // Create new category
  createCategory: (categoryData) => {
    return api.post(`${BASE_URL}/`, categoryData);
  },

  // Update category
  updateCategory: (categoryId, categoryData) => {
    return api.patch(`${BASE_URL}/${categoryId}/`, categoryData);
  },

  // Delete category
  deleteCategory: (categoryId) => {
    return api.delete(`${BASE_URL}/${categoryId}/`);
  },

  // Get category statistics
  getCategoryStats: () => {
    return api.get(`${BASE_URL}/stats/`);
  },

  // Get campaigns in category
  getCategoryCampaigns: (categoryId, params = {}) => {
    return api.get(`${BASE_URL}/${categoryId}/campaigns/`, { params });
  }
};