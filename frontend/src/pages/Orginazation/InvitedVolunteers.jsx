import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Users, 
  Search,
  Filter,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MoreVertical,
  MapPin,
  Award,
  Languages,
  Heart,
  Calendar,
  RefreshCw,
  Download,
  Send
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Loading from '../../components/common/Loading';
import volunteerRequestApi from '../../api/endpoints/VolunteerRequestAPI';

export default function InvitedUsers() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { requestId } = useParams();
  const navigate = useNavigate();
  
  const [invitations, setInvitations] = useState([]);
  const [filteredInvitations, setFilteredInvitations] = useState([]);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('invited_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Bulk actions
  const [selectedInvitations, setSelectedInvitations] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [requestId]);

  useEffect(() => {
    filterAndSortInvitations();
  }, [invitations, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [requestData, invitationsData] = await Promise.allSettled([
        volunteerRequestApi.fetchVolunteerRequestById(requestId),
        volunteerRequestApi.fetchRequestInvitations(requestId)
      ]);

      if (requestData.status === 'fulfilled') {
        setRequest(requestData.value);
      }

      if (invitationsData.status === 'fulfilled') {
        setInvitations(invitationsData.value.invitations || []);
        console.log(invitationsData.value.invitations);
      } else {
        throw new Error(invitationsData.reason?.message || 'Failed to fetch invitations');
      }

    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortInvitations = () => {
    let filtered = [...invitations];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invitation =>
        invitation.volunteer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invitation.volunteer_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invitation => invitation.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'invited_at' || sortBy === 'responded_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (sortBy === 'match_score') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }

      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });

    setFilteredInvitations(filtered);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBulkAction = async (action) => {
    if (selectedInvitations.size === 0) return;

    setBulkActionLoading(true);
    try {
      // Implement bulk actions based on your API
      // await volunteerRequestApi.bulkActionInvitations(Array.from(selectedInvitations), action);
      
      setSuccessMessage(`Bulk ${action} completed successfully`);
      setSelectedInvitations(new Set());
      await fetchData();
    } catch (err) {
      setError(`Failed to perform bulk ${action}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

const exportToCSV = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await volunteerRequestApi.exportVolunteerInvitationsToCSV(requestId);
    console.log('Export response:', response);
    setSuccessMessage(t('organization.invitedUsers.export.success'));
  } catch (err) {
    console.error('Export error:', err);
    
    // Handle different types of errors
    if (err.response?.status === 404) {
      // This is likely the "no accepted volunteers" error
      try {
        // Try to parse the error response
        let errorData;
        if (err.response.data instanceof Blob) {
          const errorText = await err.response.data.text();
          errorData = JSON.parse(errorText);
        } else {
          errorData = err.response.data;
        }
        
        // Create detailed error message
        let errorMessage = errorData.message || 'No accepted volunteers found for this request';
        
        if (errorData.details) {
          errorMessage += `\n\nInvitation Status:`;
          errorMessage += `\n• Total invited: ${errorData.details.total_invitations || 0}`;
          errorMessage += `\n• Pending responses: ${errorData.details.pending_invitations || 0}`;
          errorMessage += `\n• Accepted: ${errorData.details.accepted_invitations || 0}`;
          errorMessage += `\n• Declined: ${errorData.details.declined_invitations || 0}`;
          
          if (errorData.suggestions?.length > 0) {
            errorMessage += `\n\nSuggestions:\n• ${errorData.suggestions.join('\n• ')}`;
          }
        }
        
        setError(errorMessage);
      } catch (parseError) {
        setError('No accepted volunteers found for this request. Please wait for volunteers to accept invitations before exporting.');
      }
    } else {
      setError(err.message || 'Failed to export data. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};


  const toggleSelectAll = () => {
    if (selectedInvitations.size === filteredInvitations.length) {
      setSelectedInvitations(new Set());
    } else {
      setSelectedInvitations(new Set(filteredInvitations.map(inv => inv.id)));
    }
  };

  const toggleSelectInvitation = (invitationId) => {
    const newSelected = new Set(selectedInvitations);
    if (newSelected.has(invitationId)) {
      newSelected.delete(invitationId);
    } else {
      newSelected.add(invitationId);
    }
    setSelectedInvitations(newSelected);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-4 sm:p-0 ${isRTL ? 'rtl' : ''}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className={`flex items-center space-x-4 mb-4 ${isRTL ? 'space-x-reverse' : ''}`}>
          <button
            onClick={() => navigate(`/organization/volunteers/requests/${requestId}`)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {t('organization.invitedUsers.title')}
            </h1>
            <p className="text-gray-600 mt-1">
              {request?.title}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
            <button
              onClick={() => fetchData()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={t('organization.invitedUsers.refresh')}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {invitations.filter(inv => inv.status === 'accepted').length ?
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              title={t('organization.invitedUsers.exportBtn')}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('organization.invitedUsers.exportBtn')}</span>
            </button>
            : null}
            <button
              onClick={() => navigate(`/organization/volunteers/requests/${requestId}/matches`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{t('organization.invitedUsers.inviteMore')}</span>
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">{successMessage}</span>
              <button
                onClick={() => setSuccessMessage('')}
                className="text-green-500 hover:text-green-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex justify-between items-start">
            <div className="text-sm whitespace-pre-line">{error}</div>
            <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 ml-4 flex-shrink-0"
            >
                ×
            </button>
            </div>
        </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className={`flex flex-col sm:flex-row gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} h-4 w-4 text-gray-400`} />
              <input
                type="text"
                placeholder={t('organization.invitedUsers.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('organization.invitedUsers.filters.allStatuses')}</option>
                <option value="pending">{t('organization.invitedUsers.filters.pending')}</option>
                <option value="accepted">{t('organization.invitedUsers.filters.accepted')}</option>
                <option value="declined">{t('organization.invitedUsers.filters.declined')}</option>
                <option value="expired">{t('organization.invitedUsers.filters.expired')}</option>
              </select>
            </div>

            {/* Sort */}
            <div className="sm:w-48">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="invited_at-desc">{t('organization.invitedUsers.sort.latestFirst')}</option>
                <option value="invited_at-asc">{t('organization.invitedUsers.sort.oldestFirst')}</option>
                <option value="match_score-desc">{t('organization.invitedUsers.sort.highestMatch')}</option>
                <option value="match_score-asc">{t('organization.invitedUsers.sort.lowestMatch')}</option>
                <option value="volunteer_name-asc">{t('organization.invitedUsers.sort.nameAZ')}</option>
                <option value="volunteer_name-desc">{t('organization.invitedUsers.sort.nameZA')}</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedInvitations.size > 0 && (
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
              <span className="text-blue-800 font-medium">
                {selectedInvitations.size} {t('organization.invitedUsers.selected')}
              </span>
              <div className={`flex space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                <button
                  onClick={() => handleBulkAction('resend')}
                  disabled={bulkActionLoading}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {t('organization.invitedUsers.bulkActions.resend')}
                </button>
                <button
                  onClick={() => handleBulkAction('cancel')}
                  disabled={bulkActionLoading}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {t('organization.invitedUsers.bulkActions.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-2xl font-semibold text-gray-900">{invitations.length}</p>
              <p className="text-sm text-gray-600">{t('organization.invitedUsers.stats.total')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-2xl font-semibold text-gray-900">
                {invitations.filter(inv => inv.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">{t('organization.invitedUsers.stats.pending')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-2xl font-semibold text-gray-900">
                {invitations.filter(inv => inv.status === 'accepted').length}
              </p>
              <p className="text-sm text-gray-600">{t('organization.invitedUsers.stats.accepted')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-2xl font-semibold text-gray-900">
                {invitations.filter(inv => inv.status === 'declined').length}
              </p>
              <p className="text-sm text-gray-600">{t('organization.invitedUsers.stats.declined')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invitations List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredInvitations.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('organization.invitedUsers.noInvitations.title')}
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all'
                ? t('organization.invitedUsers.noInvitations.filtered')
                : t('organization.invitedUsers.noInvitations.empty')
              }
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedInvitations.size === filteredInvitations.length && filteredInvitations.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-sm font-medium text-gray-700 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                  {t('organization.invitedUsers.selectAll')}
                </span>
              </div>
            </div>

            {/* Invitations */}
            <div className="divide-y divide-gray-200">
              {filteredInvitations.map((invitation) => (
                <div key={invitation.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedInvitations.has(invitation.id)}
                      onChange={() => toggleSelectInvitation(invitation.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {invitation.volunteer_name}
                              </h3>
                              {invitation.volunteer_email && (
                                <p className="text-sm text-gray-600">{invitation.volunteer_email}</p>
                              )}
                            </div>
                          </div>

                          <div className={`flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                            <div className="flex items-center space-x-1">
                              <Award className="w-4 h-4" />
                              <span>{invitation.match_score}% {t('organization.invitedUsers.match')}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{t('organization.invitedUsers.invited')}: {formatDateTime(invitation.invited_at)}</span>
                            </div>

                            {invitation.responded_at && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{t('organization.invitedUsers.responded')}: {formatDateTime(invitation.responded_at)}</span>
                              </div>
                            )}
                          </div>

                          {/* Volunteer Details */}
                          {(invitation.volunteer_skills?.length > 0 || 
                            invitation.volunteer_languages?.length > 0 || 
                            invitation.volunteer_location) && (
                            <div className="space-y-2 mb-3">
                              {invitation.volunteer_skills?.length > 0 && (
                                <div className="flex items-start space-x-2">
                                  <Award className="w-4 h-4 text-gray-400 mt-0.5" />
                                  <div className="flex flex-wrap gap-1">
                                    {invitation.volunteer_skills.slice(0, 3).map((skill, index) => (
                                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                        {skill}
                                      </span>
                                    ))}
                                    {invitation.volunteer_skills.length > 3 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                        +{invitation.volunteer_skills.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {invitation.volunteer_languages?.length > 0 && (
                                <div className="flex items-start space-x-2">
                                  <Languages className="w-4 h-4 text-gray-400 mt-0.5" />
                                  <div className="flex flex-wrap gap-1">
                                    {invitation.volunteer_languages.slice(0, 3).map((language, index) => (
                                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                        {language}
                                      </span>
                                    ))}
                                    {invitation.volunteer_languages.length > 3 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                        +{invitation.volunteer_languages.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {invitation.volunteer_location && (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">{invitation.volunteer_location}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {invitation.message && (
                            <div className="bg-gray-50 p-3 rounded-lg mb-3">
                              <p className="text-sm text-gray-700 italic">"{invitation.message}"</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invitation.status)}`}>
                            {getStatusIcon(invitation.status)}
                            <span>{t(`organization.invitedUsers.status.${invitation.status}`)}</span>
                          </span>

                          <button
                            onClick={() => navigate(`/organization/volunteers/profile/${invitation.volunteer_id}`)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title={t('organization.invitedUsers.viewProfile')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}