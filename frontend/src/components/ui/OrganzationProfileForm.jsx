import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle, Upload, ExternalLink, AlertCircle, Phone, Building2, CreditCard, Camera } from 'lucide-react';
import Loading from '../../components/common/Loading';
import organizationApi from '../../api/endpoints/OrgAPI';
import ImageUpload from './ImageUpload';

export default function OrganizationProfileForm({ orgProfile = null, onSave = null, onProfileUpdate = null, loading: parentLoading = false }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [imageLoading, setImageLoading] = useState({ profile: false, cover: false });
  const [formData, setFormData] = useState({
    org_name: '',
    description: '',
    address: '',
    phone_number: '',
    website: '',
    document_url: ''
  });

  // Initialize form data when orgProfile changes
  useEffect(() => {
    if (orgProfile) {
      console.log('Initializing form with orgProfile:', orgProfile);
      setFormData({
        org_name: orgProfile.org_name || '',
        description: orgProfile.description || '',
        address: orgProfile.address || '',
        phone_number: orgProfile.phone_number || '',
        website: orgProfile.website || '',
        document_url: orgProfile.document_url || ''
      });
    }
  }, [orgProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PDF only for organization documents)
      if (file.type !== 'application/pdf') {
        setError(t('organization.organizationProfileForm.uploadPdfOnly'));
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(t('organization.organizationProfileForm.fileSizeLimit'));
        return;
      }
      
      setDocumentFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add document file if selected
      if (documentFile) {
        formDataToSend.append('document', documentFile);
      }
      
      console.log('Submitting organization profile:', formData);
      
      // Call the onSave callback if provided (for custom handling)
      if (onSave) {
        await onSave(formDataToSend);
      } else if (orgProfile?.id) {
        // Update existing profile
        const response = await organizationApi.updateOrgProfile(orgProfile.id, formDataToSend);
        if (onProfileUpdate) {
          onProfileUpdate(response);
        }
      } else {
        // This shouldn't happen in normal flow since profile is auto-created
        console.error('No profile ID available for update');
        throw new Error(t('organization.organizationProfileForm.profileIdNotFound'));
      }
      
      setSuccess(true);
      setDocumentFile(null); // Reset file input
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err.message || t('organization.organizationProfileForm.profileUpdateFailed'));
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle profile image upload
  const handleProfileImageUpload = async (imageFile) => {
    if (!orgProfile?.id) return;
    
    setImageLoading(prev => ({ ...prev, profile: true }));
    setError(null);
    
    try {
      const response = await organizationApi.uploadProfileImage(orgProfile.id, imageFile);
      
      // Update the profile data
      if (onProfileUpdate) {
        onProfileUpdate({
          ...orgProfile,
          profile_image_url: response.profile_image_url
        });
      }
      
      setSuccess(t('organization.organizationProfileForm.profileImageUpdatedSuccess'));
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err.message || t('organization.organizationProfileForm.profileImageUploadFailed'));
    } finally {
      setImageLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // Handle cover image upload
  const handleCoverImageUpload = async (imageFile) => {
    if (!orgProfile?.id) return;
    
    setImageLoading(prev => ({ ...prev, cover: true }));
    setError(null);
    
    try {
      const response = await organizationApi.uploadCoverImage(orgProfile.id, imageFile);
      
      // Update the profile data
      if (onProfileUpdate) {
        onProfileUpdate({
          ...orgProfile,
          cover_image_url: response.cover_image_url
        });
      }
      
      setSuccess(t('organization.organizationProfileForm.coverImageUpdatedSuccess'));
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err.message || t('organization.organizationProfileForm.coverImageUploadFailed'));
    } finally {
      setImageLoading(prev => ({ ...prev, cover: false }));
    }
  };

  // Handle profile image delete
  const handleProfileImageDelete = async () => {
    if (!orgProfile?.id) return;
    
    setImageLoading(prev => ({ ...prev, profile: true }));
    setError(null);
    
    try {
      await organizationApi.deleteProfileImage(orgProfile.id);
      
      // Update the profile data
      if (onProfileUpdate) {
        onProfileUpdate({
          ...orgProfile,
          profile_image_url: '',
          profile_image_path: ''
        });
      }
      
      setSuccess(t('organization.organizationProfileForm.profileImageDeletedSuccess'));
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err.message || t('organization.organizationProfileForm.profileImageDeleteFailed'));
    } finally {
      setImageLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // Handle cover image delete
  const handleCoverImageDelete = async () => {
    if (!orgProfile?.id) return;
    
    setImageLoading(prev => ({ ...prev, cover: true }));
    setError(null);
    
    try {
      await organizationApi.deleteCoverImage(orgProfile.id);
      
      // Update the profile data
      if (onProfileUpdate) {
        onProfileUpdate({
          ...orgProfile,
          cover_image_url: '',
          cover_image_path: ''
        });
      }
      
      setSuccess(t('organization.organizationProfileForm.coverImageDeletedSuccess'));
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err.message || t('organization.organizationProfileForm.coverImageDeleteFailed'));
    } finally {
      setImageLoading(prev => ({ ...prev, cover: false }));
    }
  };

  // Calculate payment methods summary
  const getPaymentMethodsSummary = () => {
    if (!orgProfile) return null;
    
    const manualCount = orgProfile.manual_payments?.filter(p => p.is_active).length || 0;
    const nextpayCount = orgProfile.nextpay_payments?.filter(p => p.is_active).length || 0;
    const totalActive = manualCount + nextpayCount;
    
    return {
      manualCount,
      nextpayCount,
      totalActive,
      hasPaymentMethods: totalActive > 0
    };
  };

  if (parentLoading || (loading && !orgProfile)) {
    return <Loading />;
  }

  if (!orgProfile && !parentLoading && !loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="text-center py-8">
          <p className="text-gray-500">{t('organization.organizationProfileForm.noProfileFound')}</p>
          <div className="mt-4 text-sm text-gray-400">
            Debug: orgProfile = {JSON.stringify(!!orgProfile)}, parentLoading = {JSON.stringify(parentLoading)}, loading = {JSON.stringify(loading)}
          </div>
        </div>
      </div>
    );
  }

  const paymentSummary = getPaymentMethodsSummary();

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className={`flex items-center justify-between `}>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('organization.organizationProfileForm.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {t('organization.organizationProfileForm.subtitle')}
            </p>
          </div>
          {orgProfile && (
            <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
              {/* Verification Status */}
              <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                {orgProfile.is_verified ? (
                  <div className={`flex items-center text-green-600 `}>
                    <CheckCircle className={`w-5 h-5 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    <span className="text-sm font-medium">{t('organization.organizationProfileForm.verified')}</span>
                  </div>
                ) : (
                  <div className={`flex items-center text-yellow-600 `}>
                    <XCircle className={`w-5 h-5 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    <span className="text-sm font-medium">{t('organization.organizationProfileForm.pendingVerification')}</span>
                  </div>
                )}
              </div>
              
              {/* Payment Methods Status */}
              {paymentSummary && (
                <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                  {paymentSummary.hasPaymentMethods ? (
                    <div className={`flex items-center text-green-600 `}>
                      <CreditCard className={`w-5 h-5 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      <span className="text-sm font-medium">
                        {paymentSummary.totalActive} {paymentSummary.totalActive !== 1 ? t('organization.organizationProfileForm.paymentMethodsPlural') : t('organization.organizationProfileForm.paymentMethods')}
                      </span>
                    </div>
                  ) : (
                    <div className={`flex items-center text-orange-600 `}>
                      <AlertCircle className={`w-5 h-5 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      <span className="text-sm font-medium">{t('organization.organizationProfileForm.noPaymentMethods')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Global Error/Success Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded text-sm">
            {typeof success === 'string' ? success : t('organization.organizationProfileForm.profileUpdatedSuccess')}
          </div>
        )}
      </div>

      {/* Visual Assets Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className={`text-lg font-semibold text-gray-900 flex items-center `}>
            <Camera className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('organization.organizationProfileForm.visualAssets')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('organization.organizationProfileForm.visualAssetsDescription')}
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cover Image */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3">{t('organization.organizationProfileForm.coverImage')}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('organization.organizationProfileForm.coverImageDescription')}
              </p>
              <ImageUpload
                currentImage={orgProfile?.cover_image_url}
                onImageUpload={handleCoverImageUpload}
                onImageDelete={handleCoverImageDelete}
                type="cover"
                loading={imageLoading.cover}
              />
              <p className="text-xs text-gray-500 mt-2">
                {t('organization.organizationProfileForm.coverImageSpecs')}
              </p>
            </div>
            
            {/* Profile Image */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3">{t('organization.organizationProfileForm.profileImage')}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('organization.organizationProfileForm.profileImageDescription')}
              </p>
              <div className={`flex items-start space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
                <ImageUpload
                  currentImage={orgProfile?.profile_image_url}
                  onImageUpload={handleProfileImageUpload}
                  onImageDelete={handleProfileImageDelete}
                  type="profile"
                  loading={imageLoading.profile}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">
                    {t('organization.organizationProfileForm.profileImageSpecs')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Information Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6 border-b border-gray-200 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('organization.organizationProfileForm.organizationInformation')}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('organization.organizationProfileForm.organizationInformationDescription')}
          </p>
        </div>

        {/* Payment Methods Summary */}
        {paymentSummary && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className={`text-sm font-medium text-blue-900 mb-2 flex items-center `}>
              <CreditCard className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('organization.organizationProfileForm.paymentMethodsSummary')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className={`flex items-center `}>
                <Phone className={`w-4 h-4 text-blue-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="text-blue-700">
                  <strong>{paymentSummary.manualCount}</strong> {paymentSummary.manualCount !== 1 ? t('organization.organizationProfileForm.manualPaymentsPlural') : t('organization.organizationProfileForm.manualPayments')}
                </span>
              </div>
              <div className={`flex items-center `}>
                <Building2 className={`w-4 h-4 text-purple-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="text-blue-700">
                  <strong>{paymentSummary.nextpayCount}</strong> {paymentSummary.nextpayCount !== 1 ? t('organization.organizationProfileForm.nextpayPaymentsPlural') : t('organization.organizationProfileForm.nextpayPayments')}
                </span>
              </div>
              <div className={`flex items-center `}>
                <CreditCard className={`w-4 h-4 text-green-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="text-blue-700">
                  <strong>{paymentSummary.totalActive}</strong> {t('organization.organizationProfileForm.totalActive')}
                </span>
              </div>
            </div>
            {!paymentSummary.hasPaymentMethods && (
              <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-sm text-orange-800">
                <AlertCircle className={`w-4 h-4 inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('organization.organizationProfileForm.addPaymentMethodsWarning')}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization Name */}
            <div className="md:col-span-2">
              <label htmlFor="org_name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('organization.organizationProfileForm.organizationName')} *
              </label>
              <input
                type="text"
                id="org_name"
                name="org_name"
                value={formData.org_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('organization.organizationProfileForm.organizationNamePlaceholder')}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                {t('organization.organizationProfileForm.phoneNumber')} *
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('organization.organizationProfileForm.phoneNumberPlaceholder')}
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                {t('organization.organizationProfileForm.website')}
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('organization.organizationProfileForm.websitePlaceholder')}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              {t('organization.organizationProfileForm.description')} *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('organization.organizationProfileForm.descriptionPlaceholder')}
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              {t('organization.organizationProfileForm.address')} *
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('organization.organizationProfileForm.addressPlaceholder')}
            />
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('organization.organizationProfileForm.organizationDocument')} {!orgProfile?.document_url && '*'}
            </label>
            
            {/* Current Document */}
            {orgProfile?.document_url && (
              <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className={`flex items-center justify-between `}>
                  <span className="text-sm text-gray-600">{t('organization.organizationProfileForm.currentDocumentUploaded')}</span>
                  <a 
                    href={orgProfile.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center text-blue-600 hover:text-blue-700 text-sm `}
                  >
                    <ExternalLink className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t('organization.organizationProfileForm.viewDocument')}
                  </a>
                </div>
              </div>
            )}
            
            {/* File Upload */}
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="sr-only"
                id="document-upload"
              />
              <label
                htmlFor="document-upload"
                className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors `}
              >
                <Upload className={`w-5 h-5 text-gray-400 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="text-sm text-gray-600">
                  {documentFile ? documentFile.name : t('organization.organizationProfileForm.uploadPdfDocument')}
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('organization.organizationProfileForm.uploadOfficialDocuments')}
            </p>
          </div>

          {/* Submit Button */}
          <div className={`flex justify-end space-x-3 pt-4 border-t border-gray-200 ${isRTL ? ' space-x-reverse' : ''}`}>
            <button
              type="submit"
              disabled={loading || imageLoading.profile || imageLoading.cover}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center `}
            >
              {loading && (
                <div className={`animate-spin rounded-full h-4 w-4 border-t-2 border-white ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
              )}
              {loading ? t('organization.organizationProfileForm.saving') : t('organization.organizationProfileForm.saveProfile')}
            </button>
          </div>
        </form>
      </div>

      {/* Organization Preview Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('organization.organizationProfileForm.organizationPreview')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('organization.organizationProfileForm.organizationPreviewDescription')}</p>
        </div>
        
        {/* Preview Card */}
        <div className="relative">
          {/* Cover Image Preview */}
          <div className="relative h-40 bg-gradient-to-r from-blue-500 to-purple-600">
            {orgProfile?.cover_image_url ? (
              <img
                src={orgProfile.cover_image_url}
                alt="Organization cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">{t('organization.organizationProfileForm.noCoverImage')}</p>
                </div>
              </div>
            )}
            
            {/* Profile Image Overlay */}
            <div className={`absolute -bottom-8 ${isRTL ? 'right-6' : 'left-6'}`}>
              <div className="w-16 h-16 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                {orgProfile?.profile_image_url ? (
                  <img
                    src={orgProfile.profile_image_url}
                    alt="Organization profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Organization Info */}
          <div className="pt-12 pb-6 px-6">
            <div className={`flex items-start justify-between `}>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900 mb-1">
                  {formData.org_name || t('organization.organizationProfileForm.organizationNamePreview')}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {formData.description || t('organization.organizationProfileForm.organizationDescriptionPreview')}
                </p>
                
                {/* Quick Info */}
                <div className={`flex flex-wrap gap-4 text-sm text-gray-500 `}>
                  {formData.phone_number && (
                    <div className={`flex items-center `}>
                      <Phone className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {formData.phone_number}
                    </div>
                  )}
                  {formData.website && (
                    <div className={`flex items-center `}>
                      <ExternalLink className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      <a 
                        href={formData.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {t('organization.organizationProfileForm.website')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Verification Badge */}
              <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                {orgProfile?.is_verified ? (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 `}>
                    <CheckCircle className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t('organization.organizationProfileForm.verified')}
                  </span>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 `}>
                    <XCircle className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t('organization.organizationProfileForm.pending')}
                  </span>
                )}
              </div>
            </div>
            
            {/* Address Preview */}
            {formData.address && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>{t('organization.organizationProfileForm.addressLabel')}</strong> {formData.address}
                </p>
              </div>
            )}
            
            {/* Payment Methods Preview */}
            {paymentSummary && paymentSummary.hasPaymentMethods && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className={`flex items-center text-green-700 `}>
                  <CreditCard className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  <span className="text-sm font-medium">
                    {paymentSummary.totalActive} {t('organization.organizationProfileForm.paymentMethodsAvailable')} {paymentSummary.totalActive !== 1 ? t('organization.organizationProfileForm.paymentMethodsPlural') : t('organization.organizationProfileForm.paymentMethods')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Preview Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className={`flex justify-between items-center text-sm `}>
            <p className="text-gray-600">{t('organization.organizationProfileForm.previewDescription')}</p>
            <div className={`flex space-x-4 text-xs ${isRTL ? 'space-x-reverse' : ''}`}>
              {!orgProfile?.profile_image_url && (
                <span className="text-orange-600">{t('organization.organizationProfileForm.addProfileImage')}</span>
              )}
              {!orgProfile?.cover_image_url && (
                <span className="text-orange-600">{t('organization.organizationProfileForm.addCoverImage')}</span>
              )}
              {!paymentSummary?.hasPaymentMethods && (
                <span className="text-red-600">{t('organization.organizationProfileForm.addPaymentMethods')}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}