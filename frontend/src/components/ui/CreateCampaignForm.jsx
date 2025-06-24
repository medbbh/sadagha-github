import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  DollarSign, 
  FileText, 
  Image as ImageIcon,
  Target,
  AlertCircle,
  CheckCircle,
  Tag
} from 'lucide-react';
import { createCampaign } from '../../api/endpoints/CampaignAPI';
import { fetchCategories } from '../../api/endpoints/CategoryAPI';

export default function CreateCampaignForm() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target: '',
    category: '',  // Add category field
    files: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await fetchCategories();
        setCategories(categoriesData.results || categoriesData); // Handle both results and direct array
        console.log('Fetched categories:', categoriesData.results || categoriesData);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    
    loadCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    console.log('Files selected:', files); // Debug log
    setFormData((prev) => ({
      ...prev,
      files: files,
    }));
  };

  const removeFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    // Debug: Log form data before sending
    console.log('Form data being sent:', formData);
    console.log('Category selected:', formData.category);
    console.log('Files selected:', formData.files);
    
    // Validation: Make sure category is selected
    if (!formData.category) {
      setError('Please select a category for your campaign');
      setSubmitting(false);
      return;
    }

    // Validation: Make sure at least one file is uploaded
    if (!formData.files || formData.files.length === 0) {
      setError('Please upload at least one image for your campaign');
      setSubmitting(false);
      return;
    }

    // Validation: Check if files are valid File objects
    const validFiles = formData.files.filter(file => file instanceof File);
    if (validFiles.length === 0) {
      setError('Please select valid image files');
      setSubmitting(false);
      return;
    }
  
    try {
      // Update form data with only valid files
      const validFormData = {
        ...formData,
        files: validFiles
      };
      
      await createCampaign(validFormData);
      setSuccess(true);
      
      // Redirect to campaigns list after 2 seconds
      setTimeout(() => {
        navigate('/organization/campaigns');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError(error.message || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/organization/campaigns')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create New Campaign</h1>
            <p className="text-gray-600 mt-1">
              Set up your fundraising campaign to start collecting donations
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <p className="text-green-800 font-medium">Campaign created successfully!</p>
              <p className="text-green-600 text-sm">Redirecting to campaigns list...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="text-red-800 font-medium">Error creating campaign</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Campaign Details
          </h2>
          
          <div className="space-y-4">
            {/* Campaign Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter a compelling campaign title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  No categories available. Please contact support.
                </p>
              )}
              {formData.category && (
                <p className="text-xs text-green-600 mt-1">
                  Selected category ID: {formData.category}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell your story. Explain what you're raising money for and why it matters..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="5"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>
          </div>
        </div>

        {/* Funding Goal */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Funding Goal
          </h2>
          
          <div>
            <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                id="target"
                name="target"
                value={formData.target}
                onChange={handleChange}
                placeholder="0"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                step="0.01"
                required
              />
            </div>
            {formData.target && (
              <p className="text-sm text-gray-600 mt-1">
                Goal: {formatCurrency(formData.target)}
              </p>
            )}
          </div>
        </div>

        {/* Campaign Images */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ImageIcon className="w-5 h-5 mr-2" />
            Campaign Images *
          </h2>
          
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images (Required - At least 1 image)
              </label>
              <div className="relative">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="sr-only"
                  id="file-upload"
                  accept="image/*"
                  required
                />
                <label
                  htmlFor="file-upload"
                  className={`flex items-center justify-center w-full px-6 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    formData.files.length === 0 
                      ? 'border-red-300 hover:border-red-400 hover:bg-red-50' 
                      : 'border-green-300 hover:border-green-400 hover:bg-green-50'
                  }`}
                >
                  <Upload className={`w-5 h-5 mr-2 ${
                    formData.files.length === 0 ? 'text-red-400' : 'text-green-400'
                  }`} />
                  <span className={`text-sm ${
                    formData.files.length === 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formData.files.length === 0 
                      ? 'Click to upload images (Required)' 
                      : `${formData.files.length} image(s) selected`
                    }
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, GIF (Max 5MB each) - At least 1 image required
              </p>
            </div>

            {/* Selected Files */}
            {formData.files.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Selected Images ({formData.files.length})
                </p>
                <div className="space-y-2">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <ImageIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/organization/campaigns')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                  Creating Campaign...
                </>
              ) : (
                'Create Campaign'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}