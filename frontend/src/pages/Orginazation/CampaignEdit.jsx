import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  ArrowRight,
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
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
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
      loadCategories();
    } else {
      setError(t('organization.campaignEdit.campaignIdMissing'));
    }
  }, [campaignId, t]);

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
  }, [formData, newFiles, filesToDelete, campaign, t]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchCampaignById(campaignId);
      setCampaign(data);
      
      setFormData({
        name: data.name || '',
        description: data.description || '',
        target: data.target || '',
        category: data.category?.id || data.category || '',
        facebook_live_url: data.facebook_live_url || ''
      });
      
    } catch (err) {
      console.error('Load campaign error:', err);
      setError(err.message || t('organization.campaignEdit.failedToLoad'));
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
    const fileToDelete = campaign.files.find(f => f.id === fileId);
    if (fileToDelete) {
      setFilesToDelete(prev => [...prev, fileToDelete.url]);
    }
  };

  const handleExistingFileRestore = (fileId) => {
    const fileToRestore = campaign.files.find(f => f.id === fileId);
    if (fileToRestore) {
      setFilesToDelete(prev => prev.filter(url => url !== fileToRestore.url));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = t('organization.campaignEdit.errors.nameRequired');
    }
    
    if (!formData.description.trim()) {
      errors.description = t('organization.campaignEdit.errors.descriptionRequired');
    }
    
    if (!formData.target || parseFloat(formData.target) <= 0) {
      errors.target = t('organization.campaignEdit.errors.targetInvalid');
    }
    
    if (!formData.category) {
      errors.category = t('organization.campaignEdit.errors.categoryRequired');
    }
    
    if (formData.facebook_live_url && !isValidUrl(formData.facebook_live_url)) {
      errors.facebook_live_url = t('organization.campaignEdit.errors.urlInvalid');
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

      newFiles.forEach((file, index) => {
        payload.append(`file_${index}`, file);
      });

      if (filesToDelete.length > 0) {
        filesToDelete.forEach(fileUrl => {
          payload.append('files_to_delete', fileUrl);
        });
      }

      await updateCampaign({
        id: campaignId,
        data: payload
      });

      navigate(`/organization/campaigns/${campaignId}`);
      
    } catch (err) {
      console.error('Save error:', err);
      setSaveError(err.message || t('organization.campaignEdit.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (unsavedChanges) {
      if (window.confirm(t('organization.campaignEdit.unsavedChangesConfirm'))) {
        navigate(`/organization/campaigns/${campaignId}`);
      }
    } else {
      navigate(`/organization/campaigns/${campaignId}`);
    }
  };

  const formatCurrency = (amount) => {
    return `${parseFloat(amount).toLocaleString()} ${t('campaignEdit.currency')}`;
  };

  if (loading) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className={`bg-red-50 border border-red-200 rounded-xl p-6 text-center ${isRTL ? 'rtl' : 'ltr'}`}>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            {t('organization.campaignEdit.errorLoading')}
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/organization/campaigns')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('organization.campaignEdit.backToCampaigns')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
            <button
              onClick={handleCancel}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </button>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className="text-2xl font-semibold text-slate-900">
                {t('organization.campaignEdit.title')}
              </h1>
              <p className="text-slate-600 mt-1">
                {t('organization.campaignEdit.subtitle')}
              </p>
            </div>
          </div>
          
          <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
            <button
              onClick={() => window.open(`/campaign/${campaignId}`, '_blank')}
              className={`px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center`}
            >
              <Eye className={`w-4 h-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {t('organization.campaignEdit.preview')}
            </button>
            
            <button
              onClick={handleCancel}
              disabled={saving}
              className={`px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center`}
            >
              <X className={`w-4 h-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {t('organization.campaignEdit.cancel')}
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving || !unsavedChanges}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Save className={`w-4 h-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {saving ? t('organization.campaignEdit.saving') : t('organization.campaignEdit.saveChanges')}
            </button>
          </div>
        </div>
        
        {/* Unsaved changes indicator */}
        {unsavedChanges && (
          <div className={`mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center ${isRTL ? 'campaignEdit.' : ''}`}>
            <Info className={`w-5 h-5 text-yellow-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            <span className="text-yellow-800 text-sm">
              {t('organization.campaignEdit.unsavedChanges')}
            </span>
          </div>
        )}
      </div>

      {/* Save Error Alert */}
      {saveError && (
        <div className={`bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center ${isRTL ? 'campaignEdit.' : ''}`}>
          <AlertCircle className={`w-5 h-5 text-red-500 ${isRTL ? 'ml-3' : 'mr-3'}`} />
          <span className="text-red-800">{saveError}</span>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          {/* Campaign Name */}
          <div>
            <label className={`flex items-center text-sm font-medium text-slate-700 mb-2 ${isRTL ? 'campaignEdit.' : ''}`}>
              <FileText className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('organization.campaignEdit.fields.name')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.name ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
              }`}
              placeholder={t('organization.campaignEdit.placeholders.name')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            {fieldErrors.name && (
              <p className={`mt-1 text-sm text-red-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Target Amount */}
          <div>
            <label className={`flex items-center text-sm font-medium text-slate-700 mb-2 ${isRTL ? 'campaignEdit.' : ''}`}>
              <DollarSign className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('organization.campaignEdit.fields.target')} *
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
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            {fieldErrors.target && (
              <p className={`mt-1 text-sm text-red-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {fieldErrors.target}
              </p>
            )}
            {formData.target && (
              <p className={`mt-1 text-sm text-slate-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('organization.campaignEdit.targetDisplay', { amount: formatCurrency(formData.target) })}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className={`flex items-center text-sm font-medium text-slate-700 mb-2 ${isRTL ? 'campaignEdit.' : ''}`}>
              <Tag className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('organization.campaignEdit.fields.category')} *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.category ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
              }`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="">{t('organization.campaignEdit.selectCategory')}</option>
              {Array.isArray(categories) && categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className={`mt-1 text-sm text-red-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {fieldErrors.category}
              </p>
            )}
          </div>

          {/* Campaign Description */}
          <div>
            <label className={`flex items-center text-sm font-medium text-slate-700 mb-2 ${isRTL ? 'campaignEdit.' : ''}`}>
              <FileText className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('organization.campaignEdit.fields.description')} *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32 ${
                fieldErrors.description ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
              }`}
              placeholder={t('organization.campaignEdit.placeholders.description')}
              rows="6"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            {fieldErrors.description && (
              <p className={`mt-1 text-sm text-red-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {fieldErrors.description}
              </p>
            )}
            <p className={`mt-1 text-sm text-slate-500 ${isRTL ? 'text-right' : 'text-left'}`}>
              {formData.description.length} {t('organization.campaignEdit.characters')}
            </p>
          </div>

          {/* Facebook Live URL */}
          <div>
            <label className={`flex items-center text-sm font-medium text-slate-700 mb-2 ${isRTL ? 'campaignEdit.' : ''}`}>
              <Globe className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('organization.campaignEdit.fields.facebookLiveUrl')}
            </label>
            <input
              type="url"
              value={formData.facebook_live_url}
              onChange={(e) => handleInputChange('facebook_live_url', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.facebook_live_url ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
              }`}
              placeholder={t('organization.campaignEdit.placeholders.facebookLiveUrl')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            {fieldErrors.facebook_live_url && (
              <p className={`mt-1 text-sm text-red-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {fieldErrors.facebook_live_url}
              </p>
            )}
          </div>

          {/* Current Files */}
          {campaign?.files && campaign.files.length > 0 && (
            <div>
              <label className={`flex items-center text-sm font-medium text-slate-700 mb-4 ${isRTL ? 'campaignEdit.' : ''}`}>
                <Image className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('organization.campaignEdit.currentFiles')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {campaign.files.map((file, index) => {
                  const isMarkedForDeletion = filesToDelete.includes(file.url);
                  
                  return (
                    <div 
                      key={file.id || index} 
                      className={`border-2 rounded-lg overflow-hidden bg-white ${
                        isMarkedForDeletion
                          ? 'border-red-300 opacity-50' 
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="h-32 bg-gray-100">
                        <img
                          src={file.url}
                          alt={file.name || `${t('organization.campaignEdit.image')} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="p-2">
                        <p className="text-xs text-slate-600 truncate font-medium mb-2">{file.name}</p>
                        
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => window.open(file.url, '_blank')}
                            className="text-xs text-blue-500 hover:underline"
                          >
                            {t('organization.campaignEdit.view')}
                          </button>
                          
                          {isMarkedForDeletion ? (
                            <button
                              onClick={() => handleExistingFileRestore(file.id)}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              {t('organization.campaignEdit.restore')}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleExistingFileDelete(file.id)}
                              className={`text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center ${isRTL ? 'campaignEdit.' : ''}`}
                            >
                              <Trash2 className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                              {t('organization.campaignEdit.delete')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add New Files */}
          <div>
            <label className={`flex items-center text-sm font-medium text-slate-700 mb-2 ${isRTL ? 'campaignEdit.' : ''}`}>
              <Upload className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('organization.campaignEdit.addFiles')}
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">
                {t('organization.campaignEdit.fileUploadPrompt')}
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
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center ${isRTL ? 'campaignEdit.' : ''}`}
              >
                <Upload className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('organization.campaignEdit.chooseFiles')}
              </label>
            </div>
            
            {/* New Files Preview */}
            {newFiles.length > 0 && (
              <div className="mt-4">
                <h4 className={`text-sm font-medium text-slate-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('organization.campaignEdit.newFilesToUpload')}
                </h4>
                <div className="space-y-2">
                  {newFiles.map((file, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 bg-slate-50 rounded-lg ${isRTL ? 'campaignEdit.' : ''}`}>
                      <div className={`flex items-center ${isRTL ? 'campaignEdit.' : ''}`}>
                        <div className={`w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center ${isRTL ? 'ml-3' : 'mr-3'}`}>
                          <Image className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
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
            <p className={`text-sm text-slate-600 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('organization.campaignEdit.requiredFieldsNote')}
            </p>
            <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
              <button
                onClick={handleCancel}
                disabled={saving}
                className={`px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center ${isRTL ? 'campaignEdit.' : ''}`}
              >
                <X className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('organization.campaignEdit.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !unsavedChanges}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed ${isRTL ? 'campaignEdit.' : ''}`}
              >
                <Save className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {saving ? t('organization.campaignEdit.saving') : t('organization.campaignEdit.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}