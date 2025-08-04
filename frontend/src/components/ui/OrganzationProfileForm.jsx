import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle, Upload, ExternalLink, AlertCircle, Phone, Building2, CreditCard, Camera } from 'lucide-react';
import Loading from '../../components/common/Loading';
import organizationApi from '../../api/endpoints/OrgAPI';
import ImageUpload from './ImageUpload';

export default function OrganizationProfileForm({ orgProfile = null, onSave = null, onProfileUpdate = null, loading: parentLoading = false }) {
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
        setError('Please upload a PDF document only');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
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
        throw new Error('Profile ID not found');
      }
      
      setSuccess(true);
      setDocumentFile(null); // Reset file input
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to update organization profile');
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
      
      setSuccess('Profile image updated successfully!');
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to upload profile image');
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
      
      setSuccess('Cover image updated successfully!');
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to upload cover image');
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
      
      setSuccess('Profile image deleted successfully!');
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to delete profile image');
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
      
      setSuccess('Cover image deleted successfully!');
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to delete cover image');
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">No organization profile found.</p>
          <div className="mt-4 text-sm text-gray-400">
            Debug: orgProfile = {JSON.stringify(!!orgProfile)}, parentLoading = {JSON.stringify(parentLoading)}, loading = {JSON.stringify(loading)}
          </div>
        </div>
      </div>
    );
  }

  const paymentSummary = getPaymentMethodsSummary();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Profile</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your organization's information, images, and verification documents
            </p>
          </div>
          {orgProfile && (
            <div className="flex items-center space-x-4">
              {/* Verification Status */}
              <div className="flex items-center space-x-2">
                {orgProfile.is_verified ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-600">
                    <XCircle className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">Pending Verification</span>
                  </div>
                )}
              </div>
              
              {/* Payment Methods Status */}
              {paymentSummary && (
                <div className="flex items-center space-x-2">
                  {paymentSummary.hasPaymentMethods ? (
                    <div className="flex items-center text-green-600">
                      <CreditCard className="w-5 h-5 mr-1" />
                      <span className="text-sm font-medium">
                        {paymentSummary.totalActive} Payment Method{paymentSummary.totalActive !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-600">
                      <AlertCircle className="w-5 h-5 mr-1" />
                      <span className="text-sm font-medium">No Payment Methods</span>
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
            {typeof success === 'string' ? success : 'Organization profile updated successfully!'}
          </div>
        )}
      </div>

      {/* Visual Assets Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Visual Assets
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Upload images that represent your organization
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cover Image */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3">Cover Image</h3>
              <p className="text-sm text-gray-600 mb-4">
                A wide banner image that appears at the top of your organization profile. 
                This creates the first impression for potential donors.
              </p>
              <ImageUpload
                currentImage={orgProfile?.cover_image_url}
                onImageUpload={handleCoverImageUpload}
                onImageDelete={handleCoverImageDelete}
                type="cover"
                loading={imageLoading.cover}
              />
              <p className="text-xs text-gray-500 mt-2">
                Recommended: 1200x400px • Accepted: JPEG, PNG, WebP • Max: 5MB
              </p>
            </div>
            
            {/* Profile Image */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3">Profile Image</h3>
              <p className="text-sm text-gray-600 mb-4">
                A circular logo or image that represents your organization. 
                This appears alongside your organization name across the platform.
              </p>
              <div className="flex items-start space-x-4">
                <ImageUpload
                  currentImage={orgProfile?.profile_image_url}
                  onImageUpload={handleProfileImageUpload}
                  onImageDelete={handleProfileImageDelete}
                  type="profile"
                  loading={imageLoading.profile}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">
                    Recommended: 400x400px • Accepted: JPEG, PNG, WebP • Max: 5MB
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
          <h2 className="text-lg font-semibold text-gray-900">Organization Information</h2>
          <p className="text-sm text-gray-600 mt-1">
            Basic details about your organization
          </p>
        </div>

        {/* Payment Methods Summary */}
        {paymentSummary && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Payment Methods Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-blue-700">
                  <strong>{paymentSummary.manualCount}</strong> Manual Payment{paymentSummary.manualCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center">
                <Building2 className="w-4 h-4 text-purple-600 mr-2" />
                <span className="text-blue-700">
                  <strong>{paymentSummary.nextpayCount}</strong> NextPay Payment{paymentSummary.nextpayCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-blue-700">
                  <strong>{paymentSummary.totalActive}</strong> Total Active
                </span>
              </div>
            </div>
            {!paymentSummary.hasPaymentMethods && (
              <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-sm text-orange-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Add payment methods to start receiving donations
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization Name */}
            <div className="md:col-span-2">
              <label htmlFor="org_name" className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                id="org_name"
                name="org_name"
                value={formData.org_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your organization name"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://www.yourorganization.com"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your organization's mission and goals"
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your organization's complete address"
            />
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Document {!orgProfile?.document_url && '*'}
            </label>
            
            {/* Current Document */}
            {orgProfile?.document_url && (
              <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current document uploaded</span>
                  <a 
                    href={orgProfile.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Document
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
                className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  {documentFile ? documentFile.name : 'Upload new PDF document (max 10MB)'}
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload official organization documents (registration, license, etc.)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || imageLoading.profile || imageLoading.cover}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
              )}
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Organization Preview Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Organization Preview</h2>
          <p className="text-sm text-gray-600 mt-1">See how your organization will appear to donors</p>
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
                  <p className="text-sm opacity-75">No cover image</p>
                </div>
              </div>
            )}
            
            {/* Profile Image Overlay */}
            <div className="absolute -bottom-8 left-6">
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
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900 mb-1">
                  {formData.org_name || 'Organization Name'}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {formData.description || 'Organization description will appear here...'}
                </p>
                
                {/* Quick Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {formData.phone_number && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {formData.phone_number}
                    </div>
                  )}
                  {formData.website && (
                    <div className="flex items-center">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      <a 
                        href={formData.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Verification Badge */}
              <div className="ml-4">
                {orgProfile?.is_verified ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Pending
                  </span>
                )}
              </div>
            </div>
            
            {/* Address Preview */}
            {formData.address && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Address:</strong> {formData.address}
                </p>
              </div>
            )}
            
            {/* Payment Methods Preview */}
            {paymentSummary && paymentSummary.hasPaymentMethods && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-700">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    {paymentSummary.totalActive} Payment Method{paymentSummary.totalActive !== 1 ? 's' : ''} Available
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Preview Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <p className="text-gray-600">This is how your organization will appear to potential donors</p>
            <div className="flex space-x-4 text-xs">
              {!orgProfile?.profile_image_url && (
                <span className="text-orange-600">• Add profile image</span>
              )}
              {!orgProfile?.cover_image_url && (
                <span className="text-orange-600">• Add cover image</span>
              )}
              {!paymentSummary?.hasPaymentMethods && (
                <span className="text-red-600">• Add payment methods</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}