import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  ArrowRight,
  Upload, 
  X, 
  DollarSign, 
  FileText, 
  Image as ImageIcon,
  Target,
  AlertCircle,
  CheckCircle,
  Tag,
  Video
} from 'lucide-react';
import { createCampaign } from '../../api/endpoints/CampaignAPI';
import { fetchCategories } from '../../api/endpoints/CategoryAPI';
import FacebookLiveInput from './FacebookLiveInput';
import FacebookOAuth from './FacebookOAuth';

export default function CreateCampaignForm() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target: '',
    category: '',
    files: [],
    facebook_live_url: '',
  });

  const [showFacebookOAuth, setShowFacebookOAuth] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await fetchCategories();
        setCategories(categoriesData.results || categoriesData);
        console.log('Fetched categories:', categoriesData.results || categoriesData);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    
    loadCategories();
  }, []);

  const handleFacebookLiveUrlChange = (url) => {
    setFormData((prev) => ({
      ...prev,
      facebook_live_url: url,
    }));
    
    if (url && !facebookConnected) {
      setShowFacebookOAuth(true);
    }
  };

  const handleFacebookOAuthSuccess = (result) => {
    setFacebookConnected(true);
    setShowFacebookOAuth(false);
    console.log('Facebook connected successfully:', result);
  };

  const handleFacebookOAuthError = (error) => {
    console.error('Facebook OAuth error:', error);
    setError(t('organization.createCampaign.facebookConnectionError'));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    console.log('Files selected:', files);
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

    console.log('Form data being sent:', formData);
    
    if (!formData.category) {
      setError(t('organization.createCampaign.validation.categoryRequired'));
      setSubmitting(false);
      return;
    }

    if (!formData.files || formData.files.length === 0) {
      setError(t('organization.createCampaign.validation.imageRequired'));
      setSubmitting(false);
      return;
    }

    const validFiles = formData.files.filter(file => file instanceof File);
    if (validFiles.length === 0) {
      setError(t('organization.createCampaign.validation.validImageRequired'));
      setSubmitting(false);
      return;
    }
  
    try {
      const validFormData = {
        ...formData,
        files: validFiles
      };
      
      await createCampaign(validFormData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/organization/campaigns');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError(error.message || t('organization.createCampaign.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
          <button
            onClick={() => navigate('/organization/campaigns')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-2xl font-semibold text-gray-900">
              {t('organization.createCampaign.title')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('organization.createCampaign.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className={`flex items-center `}>
            <CheckCircle className={`w-5 h-5 text-green-600 ${isRTL ? 'ml-3' : 'mr-3'}`} />
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <p className="text-green-800 font-medium">
                {t('organization.createCampaign.successMessage')}
              </p>
              <p className="text-green-600 text-sm">
                {t('organization.createCampaign.redirectingMessage')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className={`flex items-center `}>
            <AlertCircle className={`w-5 h-5 text-red-600 ${isRTL ? 'ml-3' : 'mr-3'}`} />
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <p className="text-red-800 font-medium">
                {t('organization.createCampaign.errorTitle')}
              </p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center `}>
            <FileText className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('organization.createCampaign.campaignDetails')}
          </h2>
          
          <div className="space-y-4">
            {/* Campaign Name */}
            <div>
              <label htmlFor="name" className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('organization.createCampaign.fields.campaignName')} *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('organization.createCampaign.placeholders.campaignName')}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isRTL ? 'text-right' : 'text-left'}`}
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('organization.createCampaign.fields.category')} *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isRTL ? 'text-right' : 'text-left'}`}
                required
              >
                <option value="">{t('organization.createCampaign.placeholders.selectCategory')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className={`text-xs text-red-500 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('organization.createCampaign.noCategoriesAvailable')}
                </p>
              )}
              {formData.category && (
                <p className={`text-xs text-green-600 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('organization.createCampaign.selectedCategoryId', { id: formData.category })}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('organization.createCampaign.fields.description')} *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('organization.createCampaign.placeholders.description')}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isRTL ? 'text-right' : 'text-left'}`}
                rows="5"
                required
              />
              <p className={`text-xs text-gray-500 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('organization.createCampaign.characterCount', { count: formData.description.length, max: 500 })}
              </p>
            </div>
          </div>
        </div>

        {/* Funding Goal */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center `}>
            <Target className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('organization.createCampaign.fundingGoal')}
          </h2>
          
          <div>
            <label htmlFor="target" className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('organization.createCampaign.fields.targetAmount')} *
            </label>
            <div className="relative">
              <DollarSign className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
              <input
                type="number"
                id="target"
                name="target"
                value={formData.target}
                onChange={handleChange}
                placeholder="0"
                className={`w-full ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                min="1"
                step="0.01"
                required
              />
            </div>
            {formData.target && (
              <p className={`text-sm text-gray-600 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('organization.createCampaign.goalPreview', { amount: formatCurrency(formData.target) })}
              </p>
            )}
          </div>
        </div>

        {/* Campaign Images */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center `}>
            <ImageIcon className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('organization.createCampaign.campaignImages')} *
          </h2>
          
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('organization.createCampaign.uploadImages')}
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
                  } `}
                >
                  <Upload className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'} ${
                    formData.files.length === 0 ? 'text-red-400' : 'text-green-400'
                  }`} />
                  <span className={`text-sm ${
                    formData.files.length === 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formData.files.length === 0 
                      ? t('organization.createCampaign.clickToUpload')
                      : t('organization.createCampaign.imagesSelected', { count: formData.files.length })
                    }
                  </span>
                </label>
              </div>
              <p className={`text-xs text-gray-500 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('organization.createCampaign.supportedFormats')}
              </p>
            </div>

            {/* Selected Files */}
            {formData.files.length > 0 && (
              <div>
                <p className={`text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('organization.createCampaign.selectedImages', { count: formData.files.length })}
                </p>
                <div className="space-y-2">
                  {formData.files.map((file, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg `}>
                      <div className={`flex items-center `}>
                        <ImageIcon className={`w-4 h-4 text-gray-400 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className={`text-xs text-gray-500 ${isRTL ? 'mr-2' : 'ml-2'}`}>
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

        {/* Facebook Live Integration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center `}>
            <Video className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('organization.createCampaign.facebookLiveIntegration')}
          </h2>
          
          <div className="space-y-4">
            <FacebookLiveInput
              value={formData.facebook_live_url}
              onChange={handleFacebookLiveUrlChange}
              campaignId={null}
              required={false}
              isRTL={isRTL}
            />
            
            {showFacebookOAuth && formData.facebook_live_url && (
              <div className="mt-4">
                <FacebookOAuth
                  campaignId={null}
                  onSuccess={handleFacebookOAuthSuccess}
                  onError={handleFacebookOAuthError}
                  isRTL={isRTL}
                />
              </div>
            )}
            
            {facebookConnected && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className={`flex items-center `}>
                  <CheckCircle className={`w-4 h-4 text-green-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  <span className={`text-green-800 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('organization.createCampaign.facebookConnected')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className={`flex flex-col sm:flex-row gap-3 ${isRTL ? 'sm:justify-start' : 'sm:justify-end'}`}>
            <button
              type="button"
              onClick={() => navigate('/organization/campaigns')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('organization.createCampaign.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center `}
            >
              {submitting ? (
                <>
                  <div className={`animate-spin rounded-full h-4 w-4 border-t-2 border-white ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
                  {t('organization.createCampaign.creatingCampaign')}
                </>
              ) : (
                t('organization.createCampaign.createCampaign')
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}