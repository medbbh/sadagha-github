import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchOrganizationById, fetchOrganizationCampaigns } from '../../api/endpoints/OrgAPI';
import CampaignCard from '../../components/ui/CampaignCard';
import Loading from '../../components/common/Loading';
import { ChevronLeft, Building2, ExternalLink, Phone, CheckCircle, XCircle, MapPin, Globe } from 'lucide-react';

export default function OrganizationDetail() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { id } = useParams();
  const navigate = useNavigate();

  const [organization, setOrganization] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const orgData = await fetchOrganizationById(id);
        setOrganization(orgData.organization);
        
        const campaignsData = await fetchOrganizationCampaigns(id);
        console.log('Fetched campaigns:', campaignsData);
        setCampaigns(campaignsData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const ErrorState = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center py-12 px-4">
        <div className="text-red-400 mb-4">
          <div className="h-16 w-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('organizations.errorLoadingOrganization')}
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/organizations')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {t('organizations.backToList')}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return <ErrorState />;
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12 px-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('organizations.organizationNotFound')}
          </h3>
          <button
            onClick={() => navigate('/organizations')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {t('organizations.backToList')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/organizations')}
            className={`flex items-center text-gray-600 hover:text-gray-900 transition-colors `}
          >
            <ChevronLeft className={`h-5 w-5 ${isRTL ? 'ml-1' : 'mr-1'}`} />
            <span className="font-medium">{t('organizations.backToOrganizations')}</span>
          </button>
        </div>
      </div>

      {/* Full-width Organization Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="relative">
          {/* Cover Image */}
          <div className="relative h-64 sm:h-80 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
            {organization.cover_image_url ? (
              <img
                src={organization.cover_image_url}
                alt={`${organization.org_name} cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-purple-600/90 to-indigo-700/90">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white">
                    <Building2 className="w-16 h-16 mx-auto mb-4 opacity-60" />
                    <p className="text-lg opacity-75 font-medium">
                      {organization.org_name}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
          
          {/* Organization Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`flex items-end pb-6 pt-16 `}>
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                    {organization.profile_image_url ? (
                      <img
                        src={organization.profile_image_url}
                        alt={`${organization.org_name} profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Organization Details */}
                <div className={`flex-1 ${isRTL ? 'mr-6' : 'ml-6'} text-white`}>
                  <div className={`flex items-center justify-between `}>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                        {organization.org_name}
                      </h1>
                      
                      {/* Verification Badge */}
                      {organization.is_verified ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/90 text-white backdrop-blur-sm">
                          <CheckCircle className={`w-4 h-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                          {t('organizations.verified')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/90 text-white backdrop-blur-sm">
                          <XCircle className={`w-4 h-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                          {t('organizations.pending')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Details Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('organizations.aboutOrganization')}
            </h2>
            
            {/* Description */}
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                {organization.description}
              </p>
            </div>
            
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Details */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {t('organizations.contactInformation')}
                </h3>
                
                <div className={`flex items-center text-gray-600 mb-3 `}>
                  <Phone className={`w-5 h-5 text-gray-400 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  <span>{organization.phone_number}</span>
                </div>
                
                <div className={`flex items-center text-gray-600 mb-3 `}>
                  <Globe className={`w-5 h-5 text-gray-400 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  <a 
                    href={organization.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {organization.website}
                  </a>
                </div>
                
                <div className={`flex items-start text-gray-600 `}>
                  <MapPin className={`w-5 h-5 text-gray-400 mt-0.5 ${isRTL ? 'ml-3' : 'mr-3'} flex-shrink-0`} />
                  <span className="leading-relaxed">{organization.address}</span>
                </div>
              </div>
              
              {/* Statistics or Additional Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {t('organizations.organizationStats')}
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {campaigns.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('organizations.activeCampaigns')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('organizations.campaigns')} ({campaigns.length})
            </h2>
            <p className="text-gray-600 mt-1">
              {t('organizations.campaignsSubtext')}
            </p>
          </div>
          
          <div className="p-6">
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('organizations.noCampaigns')}
                </h3>
                <p className="text-gray-600">
                  {t('organizations.noCampaignsDescription')}
                </p>
              </div>
            ) : (
              <CampaignCard 
                data={campaigns} 
                viewMode="grid" 
                showActions={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}