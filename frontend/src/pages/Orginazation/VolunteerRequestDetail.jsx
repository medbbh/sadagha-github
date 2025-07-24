import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Award, 
  Languages, 
  Heart,
  Building,
  Edit3,
  Trash2,
  UserPlus,
  Send,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  TrendingUp
} from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Loading from '../../components/common/Loading';
import volunteerRequestApi from '../../api/endpoints/VolunteerRequestAPI';

export default function VolunteerRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [request, setRequest] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from history state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch request details
  useEffect(() => {
    const fetchRequestDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch request details and invitations in parallel
        const [requestData, invitationsData] = await Promise.allSettled([
          volunteerRequestApi.fetchVolunteerRequestById(requestId),
          volunteerRequestApi.fetchRequestInvitations(requestId)
        ]);

        // Handle request data
        if (requestData.status === 'fulfilled') {
          setRequest(requestData.value);
        } else {
          throw new Error(requestData.reason?.message || 'Failed to fetch request details');
        }

        // Handle invitations data
        if (invitationsData.status === 'fulfilled') {
          setInvitations(invitationsData.value.invitations || []);
        } else {
          console.error('Failed to fetch invitations:', invitationsData.reason);
          setInvitations([]);
        }

      } catch (err) {
        console.error('Failed to fetch request details:', err);
        setError(err.message || 'Failed to load request details');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      await volunteerRequestApi.deleteVolunteerRequest(requestId);
      
      navigate('/organization/volunteers/requests', {
        state: { 
          message: 'Volunteer request deleted successfully',
          type: 'success'
        }
      });
    } catch (err) {
      console.error('Failed to delete request:', err);
      setError(err.message || 'Failed to delete request');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const getProgressPercentage = (accepted, needed) => {
    if (!needed || needed === 0) return 0;
    return Math.min((accepted / needed) * 100, 100);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/organization/volunteers/requests')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{request?.title}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request?.status)}`}>
                {volunteerRequestApi.formatRequestStatus(request?.status)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(request?.priority)}`}>
                {volunteerRequestApi.formatPriority(request?.priority)} Priority
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(`/organization/volunteers/requests/${requestId}/matches`)}
              disabled={request?.status === 'completed' || request?.status === 'cancelled'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Find Volunteers</span>
              <span className="sm:hidden">Find</span>
            </button>
            
            <div className="relative">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{request?.description}</p>
          </div>

          {/* Event Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Start Date</p>
                  <p className="text-gray-600">{formatDateTime(request?.event_date)}</p>
                </div>
              </div>

              {request?.event_end_date && (
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">End Date</p>
                    <p className="text-gray-600">{formatDateTime(request?.event_end_date)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Duration</p>
                  <p className="text-gray-600">{request?.duration_hours} hours</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Volunteers Needed</p>
                  <p className="text-gray-600">{request?.volunteers_needed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements & Preferences</h2>
            
            <div className="space-y-6">
              {/* Required Criteria */}
              {(request?.required_skills_list?.length > 0 || 
                request?.required_languages_list?.length > 0 || 
                request?.required_locations_data?.length > 0 ||
                request?.min_age || request?.max_age) && (
                <div>
                  <h3 className="text-md font-medium text-red-700 mb-3">Required (Must Have)</h3>
                  <div className="space-y-3">
                    {request?.required_skills_list?.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Award className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-gray-700">Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-6">
                          {request.required_skills_list.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {request?.required_languages_list?.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Languages className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-gray-700">Languages</span>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-6">
                          {request.required_languages_list.map((language, index) => (
                            <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded">
                              {language}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {request?.required_locations_data?.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-gray-700">Locations</span>
                        </div>
                        <div className="space-y-1 ml-6">
                          {request.required_locations_data.map((location, index) => (
                            <p key={index} className="text-sm text-red-800">
                              {location.city}, {location.state}, {location.country}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {(request?.min_age || request?.max_age) && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-gray-700">Age Range</span>
                        </div>
                        <p className="text-sm text-red-800 ml-6">
                          {request.min_age && request.max_age 
                            ? `${request.min_age} - ${request.max_age} years`
                            : request.min_age 
                            ? `${request.min_age}+ years`
                            : `Up to ${request.max_age} years`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preferred Criteria */}
              {(request?.preferred_skills_list?.length > 0 || 
                request?.preferred_languages_list?.length > 0 || 
                request?.preferred_interests_list?.length > 0 ||
                request?.preferred_locations_data?.length > 0) && (
                <div>
                  <h3 className="text-md font-medium text-blue-700 mb-3">Preferred (Nice to Have)</h3>
                  <div className="space-y-3">
                    {request?.preferred_skills_list?.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Award className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-6">
                          {request.preferred_skills_list.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {request?.preferred_languages_list?.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Languages className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Languages</span>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-6">
                          {request.preferred_languages_list.map((language, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                              {language}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {request?.preferred_interests_list?.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Heart className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Interests</span>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-6">
                          {request.preferred_interests_list.map((interest, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {request?.preferred_locations_data?.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Locations</span>
                        </div>
                        <div className="space-y-1 ml-6">
                          {request.preferred_locations_data.map((location, index) => (
                            <p key={index} className="text-sm text-blue-800">
                              {location.city}, {location.state}, {location.country}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Special Requirements */}
          {request?.special_requirements && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Requirements</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{request.special_requirements}</p>
            </div>
          )}

          {/* Recent Invitations */}
          {invitations.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Invitations</h2>
                <button
                  onClick={() => navigate(`/organization/volunteers/requests/${requestId}/invitations`)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View All</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {invitations.slice(0, 5).map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invitation.volunteer_name}</p>
                        <p className="text-sm text-gray-500">
                          {invitation.match_score}% match • {volunteerRequestApi.formatDateTime(invitation.invited_at)}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${volunteerRequestApi.getInvitationStatusColor(invitation.status)}`}>
                      {volunteerRequestApi.formatInvitationStatus(invitation.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Volunteers Found</span>
                  <span className="font-medium">
                    {request?.accepted_count || 0} / {request?.volunteers_needed}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(request?.accepted_count, request?.volunteers_needed)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-green-600">{request?.accepted_count || 0}</p>
                  <p className="text-sm text-gray-600">Accepted</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-yellow-600">{request?.pending_count || 0}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-1">Total Invitations Sent</p>
                <p className="text-xl font-semibold text-gray-900">{request?.total_invited || 0}</p>
              </div>
            </div>
          </div>

          {/* Campaign Info */}
          {request?.campaign_title && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign</h3>
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{request.campaign_title}</p>
                  <p className="text-sm text-gray-600">Related Campaign</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/organization/volunteers/requests/${requestId}/matches`)}
                disabled={request?.status === 'completed' || request?.status === 'cancelled'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Find More Volunteers</span>
              </button>

              <button
                onClick={() => navigate(`/organization/volunteers/requests/${requestId}/edit`)}
                disabled={request?.status === 'completed'}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Request</span>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Request</span>
              </button>
            </div>
          </div>

          {/* Meta Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Information</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Created:</span>
                <p className="font-medium">{volunteerRequestApi.formatDateTime(request?.created_at)}</p>
              </div>
              
              {request?.updated_at !== request?.created_at && (
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="font-medium">{volunteerRequestApi.formatDateTime(request?.updated_at)}</p>
                </div>
              )}

              <div>
                <span className="text-gray-600">Organization:</span>
                <p className="font-medium">{request?.organization_name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Request</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this volunteer request? All associated invitations will also be removed.
              </p>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}