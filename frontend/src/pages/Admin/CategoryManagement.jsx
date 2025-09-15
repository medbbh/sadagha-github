import React, { useState, useEffect } from 'react';
import { 
  Folder, Search, Plus, Edit, Trash2, Eye, TrendingUp, 
  Target, DollarSign, Users, Calendar, BarChart3, Activity
} from 'lucide-react';
import { categoryApi } from '../../api/endpoints/CategoryAdminAPI';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCampaignsModal, setShowCampaignsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryCampaigns, setCategoryCampaigns] = useState([]);
  const [stats, setStats] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = {
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };
      
      const response = await categoryApi.getCategories(params);
      
      setCategories(response.results || response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await categoryApi.getCategoryStats();
      console.log('Fetched stats:', statsData); // Debug log
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const openCreateModal = () => {
    setFormData({ name: '', description: '' });
    setIsEditing(false);
    setShowCategoryModal(true);
  };

  const openEditModal = (category) => {
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setSelectedCategory(category);
    setIsEditing(true);
    setShowCategoryModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting form data:', formData); // Debug log
      if (isEditing) {
        await categoryApi.updateCategory(selectedCategory.id, formData);
      } else {
        await categoryApi.createCategory(formData);
      }
      setShowCategoryModal(false);
      fetchCategories();
      fetchStats();
    } catch (err) {
      console.error('Form submission error:', err); // Debug log
      setError(err.message);
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await categoryApi.deleteCategory(categoryId);
        fetchCategories();
        fetchStats();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const openCampaignsModal = async (category) => {
    try {
      setSelectedCategory(category);
      const response = await categoryApi.getCategoryCampaigns(category.id);
      console.log('Fetched campaigns for category:', response); // Debug log
      setCategoryCampaigns(response.results || []);
      setShowCampaignsModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const getCampaignStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'new': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Management</h1>
          <p className="text-gray-600">Manage campaign categories and their performance</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Folder className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search categories..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow border hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Folder className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">Category</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => openCampaignsModal(category)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="View Campaigns"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(category)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="Edit Category"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Delete Category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {category.description || 'No description provided'}
              </p>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{category.campaign_count || 0}</p>
                  <p className="text-xs text-gray-500">Campaigns</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{category.active_campaigns || 0}</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{category.total_raised || 0}</p>
                  <p className="text-xs text-gray-500">MRU Raised</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-900">
                    {new Date(category.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-500">Updated:</span>
                  <span className="text-gray-900">
                    {new Date(category.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {categories.length === 0 && !loading && (
        <div className="text-center py-12">
          <Folder className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new category.</p>
          <div className="mt-6">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </button>
          </div>
        </div>
      )}

      {/* Category Create/Edit Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? 'Edit Category' : 'Create Category'}
                </h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter category name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter category description (optional)"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {isEditing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Campaigns Modal */}
      {showCampaignsModal && selectedCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Campaigns in "{selectedCategory.name}"
                </h3>
                <button
                  onClick={() => setShowCampaignsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Category Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-800">{selectedCategory.campaign_count || 0}</h4>
                  <p className="text-sm text-blue-600">Total Campaigns</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-green-800">{selectedCategory.active_campaigns || 0}</h4>
                  <p className="text-sm text-green-600">Active Campaigns</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-800">{selectedCategory.total_raised || 0} MRU</h4>
                  <p className="text-sm text-purple-600">Total Raised</p>
                </div>
              </div>

              {/* Campaigns Table */}
              {categoryCampaigns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Campaign
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Owner
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Target
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Raised
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Success Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categoryCampaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                            {campaign.featured && (
                              <div className="flex items-center">
                                <TrendingUp className="h-3 w-3 text-yellow-500 mr-1" />
                                <span className="text-xs text-yellow-600">Featured</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {campaign.owner_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {campaign.target} MRU
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {campaign.current_amount} MRU
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {campaign.success_rate}%
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCampaignStatusColor(campaign.status)}`}>
                              {campaign.status || 'active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(campaign.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No campaigns found in this category yet.
                  </p>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowCampaignsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;