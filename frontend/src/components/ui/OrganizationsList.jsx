import { Search, Building2, CheckCircle, MapPin, ExternalLink, Phone, Grid3X3, List, Users, Calendar } from 'lucide-react';import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { fetchOrganizations } from '../../api/endpoints/OrgAPI';
import SearchBar from '../../components/ui/SearchBar';
import Loading from '../../components/common/Loading';

export default function OrganizationsList() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setLoading(true);
        const data = await fetchOrganizations({ search: searchQuery });
        setOrganizations(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, [searchQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const navigateToOrganization = (orgId) => {
    navigate(`/organizations/${orgId}`);
  };

  // Use organizations directly without filtering
  const filteredOrganizations = organizations;

  const EmptyState = () => (
    <div className="text-center py-20">
      <div className="text-gray-300 mb-8">
        <Search className="h-24 w-24 mx-auto" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        {searchQuery ? t('organizations.noSearchResults') : t('organizations.noOrganizationsFound')}
      </h3>
      <p className="text-gray-600 max-w-md mx-auto text-lg leading-relaxed mb-6">
        {searchQuery 
          ? t('organizations.tryDifferentSearch')
          : t('organizations.noOrganizationsSubtext')
        }
      </p>
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {t('common.clearSearch')}
        </button>
      )}
    </div>
  );

  const ErrorState = () => (
    <div className="text-center py-20">
      <div className="text-red-400 mb-8">
        <div className="h-24 w-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">⚠️</span>
        </div>
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        {t('organizations.errorLoadingOrganizations')}
      </h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        {t('common.tryAgain')}
      </button>
    </div>
  );

  const OrganizationGridCard = ({ org }) => (
    <div
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer"
      onClick={() => navigateToOrganization(org.id)}
    >
      {/* Cover Image */}
      <div className="relative h-40 bg-gradient-to-r from-blue-50 to-blue-100 overflow-hidden">
        {org.cover_image_url ? (
          <img
            src={org.cover_image_url}
            alt={org.org_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-blue-300" />
          </div>
        )}
        
        {/* Verification Badge Overlay */}
        {org.is_verified && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              {t('organizations.verified')}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Profile Image and Name */}
        <div className={`flex items-center mb-3 `}>
          <div className="w-18 h-18 z-20 rounded-full overflow-hidden border-3 border-white -mt-8 shadow-sm bg-white flex-shrink-0">
            {org.profile_image_url ? (
              <img
                src={org.profile_image_url}
                alt={org.org_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
            )}
          </div>
          <div className={`min-w-0 ${isRTL ? 'mr-3' : 'ml-3'}`}>
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {org.org_name}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
          {org.description}
        </p>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {org.address && (
            <div className={`flex items-center text-xs text-gray-500 `}>
              <MapPin className={`w-3 h-3 ${isRTL ? 'ml-1.5' : 'mr-1.5'} flex-shrink-0`} />
              <span className="truncate">{org.address}</span>
            </div>
          )}
          {org.phone_number && (
            <div className={`flex items-center text-xs text-gray-500 `}>
              <Phone className={`w-3 h-3 ${isRTL ? 'ml-1.5' : 'mr-1.5'} flex-shrink-0`} />
              <span>{org.phone_number}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
          {t('organizations.viewDetails')}
        </button>
      </div>
    </div>
  );

  const OrganizationListCard = ({ org }) => (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer"
      onClick={() => navigateToOrganization(org.id)}
    >
      <div className={`flex items-start space-x-4 ${isRTL ? ' space-x-reverse' : ''}`}>
        {/* Profile Image */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 bg-white flex-shrink-0">
          {org.profile_image_url ? (
            <img
              src={org.profile_image_url}
              alt={org.org_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-blue-50 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-500" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`flex items-start justify-between `}>
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {org.org_name}
                </h3>
                {org.is_verified && (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-600 text-white ${isRTL ? 'mr-2' : 'ml-2'}`}>
                    <CheckCircle className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t('organizations.verified')}
                  </span>
                )}
              </div>
              <p className="text-gray-600 leading-relaxed mb-3">
                {org.description}
              </p>
              
              {/* Contact Details */}
              <div className={`flex flex-wrap gap-4 text-sm text-gray-500 `}>
                {org.address && (
                  <div className="flex items-center">
                    <MapPin className={`w-4 h-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                    <span>{org.address}</span>
                  </div>
                )}
                {org.phone_number && (
                  <div className="flex items-center">
                    <Phone className={`w-4 h-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                    <span>{org.phone_number}</span>
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center">
                    <ExternalLink className={`w-4 h-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                    <a 
                      href={org.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('organizations.website')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">
              {t('organizations.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              {t('organizations.subtitle')}
            </p>
            
            {/* Stats */}
            <div className="flex justify-center items-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {organizations.length}
                </div>
                <div className="text-gray-500">
                  {t('organizations.totalOrganizations')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white border-b border-gray-200 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder={t('organizations.searchPlaceholder')}
                  className="w-full"
                />
              </div>

              {/* View Toggle */}
              <div className={`flex items-center `}>
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-50 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            {!loading && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  {t('organizations.showingResults', { count: filteredOrganizations.length })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loading />
          </div>
        ) : error ? (
          <ErrorState />
        ) : filteredOrganizations.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Organizations Display */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredOrganizations.map((org) => (
                  <OrganizationGridCard key={org.id} org={org} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrganizations.map((org) => (
                  <OrganizationListCard key={org.id} org={org} />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {filteredOrganizations.length >= 12 && (
              <div className="text-center mt-12">
                <button className="bg-blue-600 text-white border border-blue-600 px-8 py-3 rounded-xl hover:bg-blue-700 hover:border-blue-700 transition-colors font-medium shadow-sm">
                  {t('common.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}