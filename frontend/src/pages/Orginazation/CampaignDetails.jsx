import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  X, 
  Upload, 
  DollarSign, 
  Target,
  Users,
  Calendar,
  Tag,
  FileText,
  Image,
  Trash2,
  CheckCircle,
  AlertCircle,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Share2
} from 'lucide-react';

// Import your actual API functions
import { fetchCampaignById, updateCampaign } from '../../api/endpoints/CampaignAPI';
import { fetchCategories, fetchCategoryById } from '../../api/endpoints/CategoryAPI';
import CampaignCarousel from '../../components/ui/CampaignCarousel';

export default function CampaignDetailsPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState(null);
  const [categories, setCategories] = useState([]);
  const [campaignCategory, setCampaignCategory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    target: '',
    featured: false,
    newFiles: [],
    filesToDelete: []
  });

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
      loadCategories();
    } else {
      setError('Campaign ID is missing from URL');
    }
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading campaign with ID:', campaignId);
      
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }
      
      const data = await fetchCampaignById(campaignId);
      
      setCampaign(data);
      
      // Fetch category details if campaign has a category
      if (data.category) {
        try {
          const categoryId = typeof data.category === 'object' ? data.category.id : data.category;
          const categoryData = await fetchCategoryById(categoryId);
          setCampaignCategory(categoryData);
        } catch (categoryError) {
          console.warn('Failed to load category details:', categoryError);
          // Set fallback category data if it's an object
          if (typeof data.category === 'object') {
            setCampaignCategory(data.category);
          }
        }
      }
      
      setFormData({
        name: data.name,
        description: data.description,
        category: data.category?.id || data.category,
        target: data.target,
        featured: data.featured,
        newFiles: [],
        filesToDelete: []
      });
    } catch (err) {
      console.error('Load campaign error:', err);
      setError(err.message || 'Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data.results || data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      newFiles: [...prev.newFiles, ...files]
    }));
  };

  const removeNewFile = (index) => {
    setFormData(prev => ({
      ...prev,
      newFiles: prev.newFiles.filter((_, i) => i !== index)
    }));
  };

  const markFileForDeletion = (fileUrl, fileName) => {
    setFormData(prev => ({
      ...prev,
      filesToDelete: [...prev.filesToDelete, { url: fileUrl, name: fileName }]
    }));
  };

  const unmarkFileForDeletion = (fileUrl) => {
    setFormData(prev => ({
      ...prev,
      filesToDelete: prev.filesToDelete.filter(f => f.url !== fileUrl)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      if (!campaignId && !campaign?.id) {
        throw new Error('Campaign ID is missing');
      }
      
      const actualCampaignId = campaignId || campaign?.id;
      
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('category', formData.category);
      payload.append('target', formData.target);
      payload.append('featured', formData.featured);
      
      // Add new files with file_* pattern
      formData.newFiles.forEach((file, index) => {
        payload.append(`file_${index}`, file);
      });
      
      // Add files to delete (using file URLs based on your backend)
      formData.filesToDelete.forEach(file => {
        payload.append('files_to_delete', file.url);
      });
      
      await updateCampaign({ id: actualCampaignId, data: payload });
      setSuccess(true);
      setIsEditing(false);
      
      // Reload campaign data
      await loadCampaign();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return `${parseFloat(amount).toLocaleString()} MRU`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProgressPercentage = () => {
    if (!campaign) return 0;
    return Math.min((parseFloat(campaign.current_amount) / parseFloat(campaign.target)) * 100, 100);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="h-80 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Campaign</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => loadCampaign()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/organization/campaigns')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Campaign Not Found</h2>
          <p className="text-gray-500 mb-4">The campaign you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/organization/campaigns')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  const progress = getProgressPercentage();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/organization/campaigns')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {isEditing ? 'Edit Campaign' : 'Campaign Details'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditing ? 'Update your campaign information and settings' : 'View and manage your fundraising campaign'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => window.open(`/campaigns/${campaign.id}`, '_blank')}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Campaign
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: campaign.name,
                      description: campaign.description,
                      category: campaign.category?.id || campaign.category,
                      target: campaign.target,
                      featured: campaign.featured,
                      newFiles: [],
                      filesToDelete: []
                    });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-green-800 font-medium">Campaign updated successfully!</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Campaign Visual and Details (2/3 width) */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Campaign Carousel */}
            <CampaignCarousel 
              files={campaign.files} 
              isEditing={isEditing}
              formData={formData}
              onFileChange={handleFileChange}
              onMarkForDeletion={markFileForDeletion}
              onUnmarkForDeletion={unmarkFileForDeletion}
              onRemoveNewFile={removeNewFile}
            />
            
            {/* Campaign Content */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="text-2xl md:text-3xl font-bold text-gray-900 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Campaign name"
                      />
                      <div className="flex items-center space-x-4">
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full border-0 focus:ring-2 focus:ring-blue-500"
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="featured"
                            checked={formData.featured}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-blue-600 mr-2"
                          />
                          <span className="text-sm text-gray-700">Featured</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{campaign.name}</h1>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full">
                          {campaignCategory?.name || campaign.category?.name || 'Uncategorized'}
                        </span>
                        {campaign.featured && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full">
                            Featured
                          </span>
                        )}
                        <span className="text-gray-500 text-sm">
                          Created {formatDate(campaign.created_at)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <button className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-blue-500 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress Section */}
              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Raised: {formatCurrency(campaign.current_amount)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Goal: {isEditing ? (
                      <input
                        type="number"
                        name="target"
                        value={formData.target}
                        onChange={handleInputChange}
                        className="inline-block w-24 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        step="0.01"
                        min="1"
                      />
                    ) : (
                      formatCurrency(campaign.target)
                    )} MRU
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>{progress.toFixed(1)}% funded</span>
                  <span>{campaign.number_of_donors} donors</span>
                </div>
              </div>

              {/* Campaign Story */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Our Story</h2>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="6"
                    placeholder="Tell your campaign story..."
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-line">
                    {campaign.description || "No description provided yet."}
                  </p>
                )}
              </div>

              {/* Campaign Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="font-medium">{formatDate(campaign.created_at)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Target</p>
                      <p className="font-medium">{formatCurrency(campaign.target)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Donors</p>
                      <p className="font-medium">{campaign.number_of_donors}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Meta Info (1/3 width) */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                <p className="text-gray-900">{campaign.owner?.name || campaign.owner || 'Organization'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-gray-900">{campaignCategory?.name || campaign.category?.name || 'Uncategorized'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-gray-900">{formatDate(campaign.updated_at)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                  {campaign.featured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}