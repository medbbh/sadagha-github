// VolunteerDashboard.jsx - Updated to work with your existing system
import React, { useState, useEffect } from 'react';
import { 
  Bell,
  Calendar,
  Clock,
  MapPin,
  Users,
  Building,
  Check,
  X,
  MessageSquare,
  Filter,
  Search,
  Star,
  Award,
  Languages,
  Heart,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/common/Loading';
import volunteerRequestApi from '../../api/endpoints/VolunteerRequestAPI';
import { fetchMyVolunteerProfile } from '../../api/endpoints/VolunteerAPI';

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  
  const [invitations, setInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [responseModal, setResponseModal] = useState({ show: false, type: null });
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check if user has a profile
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await fetchMyVolunteerProfile();
        if (response.status === 404 || !response.data) {
          // No profile exists, redirect to your existing volunteer page
          navigate('/volunteer-page');
          return;
        }
        setVolunteerProfile(response.data || response);
      } catch (err) {
        if (err.response?.status === 404) {
          navigate('/volunteer-page');
          return;
        }
        console.error('Failed to fetch profile:', err);
      }
    };

    checkProfile();
  }, [navigate]);

  // Fetch dashboard data
  useEffect(() => {
    if (!volunteerProfile) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel
        const [invitationsData, notificationsData, unreadData] = await Promise.allSettled([
          volunteerRequestApi.fetchMyInvitations(),
          volunteerRequestApi.fetchVolunteerNotifications(),
          volunteerRequestApi.fetchUnreadNotificationCount()
        ]);

        // Handle invitations
        if (invitationsData.status === 'fulfilled') {
          setInvitations(invitationsData.value.invitations || []);
        }

        // Handle notifications
        if (notificationsData.status === 'fulfilled') {
          setNotifications(notificationsData.value.results || []);
        }

        // Handle unread count
        if (unreadData.status === 'fulfilled') {
          setUnreadCount(unreadData.value.unread_count || 0);
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [volunteerProfile]);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!volunteerProfile) return;

    let socket = null;

    const connectWebSocket = () => {
      try {
        socket = volunteerRequestApi.createNotificationWebSocket(
          (data) => {
            if (data.type === 'notification') {
              setNotifications(prev => [data.notification, ...prev]);
            } else if (data.type === 'unread_count') {
              setUnreadCount(data.count);
            }
          },
          (error) => console.error('WebSocket error:', error),
          (event) => console.log('WebSocket disconnected:', event)
        );
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [volunteerProfile]);

  // Filter invitations
  const filteredInvitations = invitations.filter(invitation => {
    if (statusFilter === 'all') return true;
    return invitation.status === statusFilter;
  });

  // Handle invitation response
  const handleInvitationResponse = async (invitationId, status) => {
    setResponding(true);
    setError(null);

    try {
      await volunteerRequestApi.respondToInvitation(invitationId, {
        status,
        response_message: responseMessage
      });

      // Update invitation in state
      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status, response_message: responseMessage }
            : inv
        )
      );

      setResponseModal({ show: false, type: null });
      setResponseMessage('');
      setSelectedInvitation(null);

    } catch (err) {
      console.error('Failed to respond to invitation:', err);
      setError(err.message || 'Failed to respond to invitation');
    } finally {
      setResponding(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'declined':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!volunteerProfile) {
    return null; // Will redirect to volunteer page
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {volunteerProfile?.full_name || 'Volunteer'}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your volunteer opportunities and invitations
              </p>
            </div>
            
            {/* Notification Badge */}
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              
              <button
                onClick={() => navigate('/volunteer-page')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>View Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invitations</p>
                <p className="text-2xl font-semibold text-gray-900">{invitations.length}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-yellow-600">
                  {invitations.filter(inv => inv.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-semibold text-green-600">
                  {invitations.filter(inv => inv.status === 'accepted').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Declined</p>
                <p className="text-2xl font-semibold text-red-600">
                  {invitations.filter(inv => inv.status === 'declined').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Invitations</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invitations List */}
        <div className="space-y-4">
          {filteredInvitations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {invitations.length === 0 ? 'No invitations yet' : 'No invitations match your filter'}
              </h3>
              <p className="text-gray-600 mb-6">
                {invitations.length === 0 
                  ? 'Organizations will send you invitations for volunteer opportunities that match your profile.'
                  : 'Try adjusting your filter to see more invitations.'
                }
              </p>
              {invitations.length === 0 && (
                <button
                  onClick={() => navigate('/volunteer-page')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Complete Your Profile
                </button>
              )}
            </div>
          ) : (
            filteredInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {invitation.request_title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Building className="w-4 h-4 mr-2" />
                        <span>{invitation.organization_name}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {getStatusIcon(invitation.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${volunteerRequestApi.getInvitationStatusColor(invitation.status)}`}>
                        {volunteerRequestApi.formatInvitationStatus(invitation.status)}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDateTime(invitation.event_date)}</span>
                    </div>
                    
                    {invitation.event_end_date && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Ends: {formatDateTime(invitation.event_end_date)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{invitation.duration_hours} hours</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {invitation.request_description}
                  </p>

                  {/* Personal Message */}
                  {invitation.message && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-1">Personal Message:</p>
                          <p className="text-sm text-blue-800">{invitation.message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Match Score */}
                  {invitation.match_score > 0 && (
                    <div className="flex items-center space-x-2 mb-4">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">
                        You're a <span className="font-medium text-gray-900">{invitation.match_score}% match</span> for this opportunity
                      </span>
                    </div>
                  )}

                  {/* Response Section */}
                  {invitation.response_message && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Your Response:</p>
                      <p className="text-sm text-gray-600">{invitation.response_message}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Invited {formatDateTime(invitation.invited_at)}
                      {invitation.responded_at && (
                        <span> • Responded {formatDateTime(invitation.responded_at)}</span>
                      )}
                    </div>
                    
                    {invitation.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedInvitation(invitation);
                            setResponseModal({ show: true, type: 'declined' });
                          }}
                          className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInvitation(invitation);
                            setResponseModal({ show: true, type: 'accepted' });
                          }}
                          className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Accept
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Response Modal */}
        {responseModal.show && selectedInvitation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {responseModal.type === 'accepted' ? 'Accept' : 'Decline'} Invitation
                  </h3>
                  <button
                    onClick={() => {
                      setResponseModal({ show: false, type: null });
                      setResponseMessage('');
                      setSelectedInvitation(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {responseModal.type === 'accepted' 
                    ? "You're about to accept this volunteer opportunity. The organization will be notified."
                    : "You're about to decline this volunteer opportunity. The organization will be notified."
                  }
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="font-medium text-gray-900">{selectedInvitation.request_title}</p>
                  <p className="text-sm text-gray-600">{selectedInvitation.organization_name}</p>
                  <p className="text-sm text-gray-600">{formatDateTime(selectedInvitation.event_date)}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {responseModal.type === 'accepted' ? 'Message to Organization (Optional)' : 'Reason for Declining (Optional)'}
                  </label>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder={
                      responseModal.type === 'accepted' 
                        ? "Let them know why you're excited to help..."
                        : "Let them know why you can't participate..."
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {responseMessage.length}/500 characters
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setResponseModal({ show: false, type: null });
                      setResponseMessage('');
                      setSelectedInvitation(null);
                    }}
                    disabled={responding}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleInvitationResponse(selectedInvitation.id, responseModal.type)}
                    disabled={responding}
                    className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2 ${
                      responseModal.type === 'accepted' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {responding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        {responseModal.type === 'accepted' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        <span>{responseModal.type === 'accepted' ? 'Accept' : 'Decline'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;