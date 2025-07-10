import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Upload, 
  Trash2, 
  AlertCircle,
  Eye,
  Info,
  DollarSign,
  FileText,
  Image,
  Globe,
  Tag
} from 'lucide-react';

import { fetchCampaignById, updateCampaign } from '../../api/endpoints/CampaignAPI';
import { fetchCategories } from '../../api/endpoints/CategoryAPI';

export default function CampaignEdit() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target: '',
    category: '',
    facebook_live_url: ''
  });
  
  const [newFiles, setNewFiles] = useState([]);
  
  // Form validation
  const [fieldErrors, setFieldErrors] = useState({});

  const [filesToDelete, setFilesToDelete] = useState([]);


  useEffect(() => {
    if (campaignId) {
      loadCampaign();
      loadCategories();
    }
  }, [campaignId]);

  // Track unsaved changes
  useEffect(() => {
    if (campaign) {
      const hasChanges = 
        formData.name !== campaign.name ||
        formData.description !== (campaign.description || '') ||
        formData.target !== campaign.target ||
        formData.category !== (campaign.category?.id || campaign.category || '') ||
        formData.facebook_live_url !== (campaign.facebook_live_url || '') ||
        newFiles.length > 0 ||
        filesToDelete.length > 0;
      
      setUnsavedChanges(hasChanges);
    }
  }, [formData, newFiles, filesToDelete, campaign]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchCampaignById(campaignId);
      setCampaign(data);
      
      // Debug: Log the campaign data and files
      console.log('Campaign data:', data);
      console.log('Campaign files:', data.files);
      
      // Initialize form data
      setFormData({
        name: data.name || '',
        description: data.description || '',
        target: data.target || '',
        category: data.category?.id || data.category || '',
        facebook_live_url: data.facebook_live_url || ''
      });
      
    } catch (err) {
      console.error('Load campaign error:', err);
      setError(err.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await fetchCategories();
      const categoriesArray = Array.isArray(categoriesData) 
        ? categoriesData 
        : categoriesData.results || categoriesData.data || [];
      setCategories(categoriesArray);
    } catch (err) {
      console.warn('Failed to load categories:', err);
      setCategories([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles(prev => [...prev, ...files]);
  };

  const handleFileRemove = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };


  const handleExistingFileDelete = (fileId) => {
    console.log('Deleting file ID:', fileId);
    // Find the file object to get its URL
    const fileToDelete = campaign.files.find(f => f.id === fileId);
    if (fileToDelete) {
      console.log('Found file to delete:', fileToDelete);
      setFilesToDelete(prev => {
        const newArray = [...prev, fileToDelete.url]; // Store URL, not ID
        console.log('New filesToDelete array:', newArray);
        return newArray;
      });
    }
  };

  const handleExistingFileRestore = (fileId) => {
    console.log('Restoring file ID:', fileId);
    // Find the file object to get its URL
    const fileToRestore = campaign.files.find(f => f.id === fileId);
    if (fileToRestore) {
      console.log('Found file to restore:', fileToRestore);
      setFilesToDelete(prev => {
        const newArray = prev.filter(url => url !== fileToRestore.url); // Remove URL
        console.log('New filesToDelete array after restore:', newArray);
        return newArray;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Campaign name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Campaign description is required';
    }
    
    if (!formData.target || parseFloat(formData.target) <= 0) {
      errors.target = 'Target amount must be greater than 0';
    }
    
    if (!formData.category) {
      errors.category = 'Please select a category';
    }
    
    if (formData.facebook_live_url && !isValidUrl(formData.facebook_live_url)) {
      errors.facebook_live_url = 'Please enter a valid URL';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      setSaveError(null);

      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('target', formData.target);
      payload.append('category', formData.category);
      
      if (formData.facebook_live_url) {
        payload.append('facebook_live_url', formData.facebook_live_url);
      }

      // Add new files
      newFiles.forEach((file, index) => {
        payload.append(`file_${index}`, file);
      });

      // Add files to delete - send as separate form fields
      if (filesToDelete.length > 0) {
        filesToDelete.forEach(fileUrl => {
          payload.append('files_to_delete', fileUrl);
        });
      }

      await updateCampaign({
        id: campaignId,
        data: payload
      });

      // Navigate back to campaign detail
      navigate(`/organization/campaigns/${campaignId}`);
      
    } catch (err) {
      console.error('Save error:', err);
      setSaveError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (unsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(`/organization/campaigns/${campaignId}`);
      }
    } else {
      navigate(`/organization/campaigns/${campaignId}`);
    }
  };

  const formatCurrency = (amount) => {
    return `${parseFloat(amount).toLocaleString()} MRU`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Campaign</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/organization/campaigns')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Edit Campaign</h1>
              <p className="text-slate-600 mt-1">Make changes to your fundraising campaign</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.open(`/campaign/${campaignId}`, '_blank')}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving || !unsavedChanges}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        
        {/* Unsaved changes indicator */}
        {unsavedChanges && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
            <Info className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 text-sm">You have unsaved changes</span>
          </div>
        )}
      </div>

      {/* Save Error Alert */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <span className="text-red-800">{saveError}</span>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          {/* Campaign Name */}
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 mr-2" />
              Campaign Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.name ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
              }`}
              placeholder="Enter a compelling campaign name"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          {/* Target Amount */}
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
              <DollarSign className="w-4 h-4 mr-2" />
              Target Amount (MRU) *
            </label>
            <input
              type="number"
              value={formData.target}
              onChange={(e) => handleInputChange('target', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.target ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
              }`}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            {fieldErrors.target && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.target}</p>
            )}
            {formData.target && (
              <p className="mt-1 text-sm text-slate-600">
                Target: {formatCurrency(formData.target)}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
              <Tag className="w-4 h-4 mr-2" />
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.category ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
              }`}
            >
              <option value="">Select a category</option>
              {Array.isArray(categories) && categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>
            )}
          </div>

          {/* Campaign Description */}
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 mr-2" />
              Campaign Story *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32 ${
                fieldErrors.description ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
              }`}
              placeholder="Tell your story... Why is this campaign important? What will the funds be used for?"
              rows="6"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
            )}
            <p className="mt-1 text-sm text-slate-500">
              {formData.description.length} characters
            </p>
          </div>

          {/* Facebook Live URL */}
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
              <Globe className="w-4 h-4 mr-2" />
              Facebook Live URL (Optional)
            </label>
            <input
              type="url"
              value={formData.facebook_live_url}
              onChange={(e) => handleInputChange('facebook_live_url', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.facebook_live_url ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
              }`}
              placeholder="https://facebook.com/..."
            />
            {fieldErrors.facebook_live_url && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.facebook_live_url}</p>
            )}
          </div>

          {/* Current Files */}
          {campaign?.files && campaign.files.length > 0 && (
            <div>
              <label className="flex items-center text-sm font-medium text-slate-700 mb-4">
                <Image className="w-4 h-4 mr-2" />
                Current Files
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {campaign.files.map((file, index) => {
                  // Check if this file's URL is marked for deletion
                  const isMarkedForDeletion = filesToDelete.includes(file.url);
                  console.log(`File ${file.id} (${file.url}) marked for deletion:`, isMarkedForDeletion);
                  console.log(`filesToDelete array:`, filesToDelete);
                  
                  return (
                    <div 
                      key={file.id || index} 
                      className={`border-2 rounded-lg overflow-hidden bg-white ${
                        isMarkedForDeletion
                          ? 'border-red-300 opacity-50' 
                          : 'border-slate-200'
                      }`}
                    >
                    {/* Simple Image Container - No Overlays */}
                    <div className="h-32 bg-gray-100">
                      <img
                        src={file.url}
                        alt={file.name || `Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* File Info and Actions - Below Image */}
                    <div className="p-2">
                      <p className="text-xs text-slate-600 truncate font-medium mb-2">{file.name}</p>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => window.open(file.url, '_blank')}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          View
                        </button>
                        
                        {isMarkedForDeletion ? (
                          <button
                            onClick={() => handleExistingFileRestore(file.id)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleExistingFileDelete(file.id)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                )}
              </div>
            </div>
          )}

          {/* Add New Files */}
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
              <Upload className="w-4 h-4 mr-2" />
              Add New Files
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">
                Drag and drop files here, or click to select
              </p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileAdd}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </label>
            </div>
            
            {/* New Files Preview */}
            {newFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">New Files to Upload:</h4>
                <div className="space-y-2">
                  {newFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Image className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{file.name}</p>
                          <p className="text-xs text-slate-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFileRemove(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              * Required fields
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !unsavedChanges}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
