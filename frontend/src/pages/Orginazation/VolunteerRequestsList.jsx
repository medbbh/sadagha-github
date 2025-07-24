import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Users, 
  Calendar,
  Clock,
  MapPin,
  Edit3,
  Trash2,
  MoreVertical,
  UserCheck,
  Send,
  AlertCircle,
  Target
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import volunteerRequestApi from '../../api/endpoints/VolunteerRequestAPI';
import { useNavigate } from 'react-router-dom';

export default function VolunteerRequestsList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  const navigate = useNavigate();

  // Fetch volunteer requests
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = {};
        if (statusFilter !== 'all') params.status = statusFilter;
        if (priorityFilter !== 'all') params.priority = priorityFilter;
        
        const response = await volunteerRequestApi.fetchVolunteerRequests(params);
        console.log('API Response:', response);
        
        // Handle different response structures
        let requestsData = [];
        if (Array.isArray(response)) {
          requestsData = response;
        } else if (response && Array.isArray(response.data)) {
          requestsData = response.data;
        } else if (response && Array.isArray(response.results)) {
          requestsData = response.results;
        } else if (response && response.data && Array.isArray(response.data.results)) {
          requestsData = response.data.results;
        } else {
          console.warn('Unexpected API response structure:', response);
          requestsData = [];
        }
        
        setRequests(requestsData);
        console.log('Processed requests data:', requestsData);
      } catch (err) {
        console.error('Failed to fetch volunteer requests:', err);
        setError(err.message || 'Failed to load volunteer requests');
        setRequests([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [statusFilter, priorityFilter]);

  // Filter and search requests
  const filteredRequests = Array.isArray(requests) ? requests.filter(request => {
    const matchesSearch = request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title?.localeCompare(b.title) || 0;
      case 'event_date':
        return new Date(a.event_date || 0) - new Date(b.event_date || 0);
      case 'volunteers_needed':
        return (b.volunteers_needed || 0) - (a.volunteers_needed || 0);
      case 'accepted_count':
        return (b.accepted_count || 0) - (a.accepted_count || 0);
      case 'created_at':
      default:
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressPercentage = (accepted, needed) => {
    if (!needed || needed === 0) return 0;
    return Math.min((accepted / needed) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Volunteer Requests</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Create and manage volunteer opportunities for your campaigns
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button 
              onClick={() => navigate('/organization/volunteers/requests/create')}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Request</span>
              <span className="sm:hidden">Create</span>
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

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search volunteer requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            >
              <option value="created_at">Newest First</option>
              <option value="title">Title A-Z</option>
              <option value="event_date">Event Date</option>
              <option value="volunteers_needed">Most Volunteers Needed</option>
              <option value="accepted_count">Most Accepted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600 text-sm sm:text-base">
          Showing {sortedRequests.length} of {Array.isArray(requests) ? requests.length : 0} requests
        </p>
      </div>

      {/* Requests Grid */}
      {sortedRequests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {Array.isArray(requests) && requests.length === 0 ? 'No volunteer requests yet' : 'No requests match your filters'}
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {Array.isArray(requests) && requests.length === 0
              ? 'Create your first volunteer request to start finding volunteers.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {Array.isArray(requests) && requests.length === 0 && (
            <button 
              onClick={() => navigate('/organization/volunteers/requests/create')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Create Your First Request
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {sortedRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="p-4 sm:p-6 flex flex-col flex-grow">
                {/* Header with status and priority */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 line-clamp-2">
                      {request.title || 'Untitled Request'}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end space-y-1 ml-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${volunteerRequestApi.getStatusColor(request.status)}`}>
                      {volunteerRequestApi.formatRequestStatus(request.status)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${volunteerRequestApi.getPriorityColor(request.priority)}`}>
                      {volunteerRequestApi.formatPriority(request.priority)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 min-h-[4rem] flex-shrink-0">
                  {request.description || 'No description available'}
                </p>

                {/* Event Details */}
                <div className="space-y-2 mb-4 flex-shrink-0">
                  <div className="flex items-center text-xs sm:text-sm text-gray-500">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {formatDate(request.event_date)}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs sm:text-sm text-gray-500">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {request.duration_hours} hours
                    </span>
                  </div>

                  {request.required_locations_data && request.required_locations_data.length > 0 && (
                    <div className="flex items-center text-xs sm:text-sm text-gray-500">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {request.required_locations_data[0]?.city || 'Location specified'}
                        {request.required_locations_data.length > 1 && ` +${request.required_locations_data.length - 1}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Volunteer Progress */}
                <div className="mb-4 flex-shrink-0">
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span className="text-gray-600">Volunteers</span>
                    <span className="font-medium">
                      {request.accepted_count || 0} / {request.volunteers_needed}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(request.accepted_count, request.volunteers_needed)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1 text-gray-500">
                    <span>{request.accepted_count || 0} accepted</span>
                    <span>{request.pending_count || 0} pending</span>
                  </div>
                </div>

                {/* Skills & Requirements Preview */}
                {(request.required_skills_list?.length > 0 || request.preferred_skills_list?.length > 0) && (
                  <div className="mb-4 flex-shrink-0">
                    <p className="text-xs text-gray-500 mb-1">Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {request.required_skills_list?.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                      {request.preferred_skills_list?.slice(0, 2).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                      {(request.required_skills_list?.length + request.preferred_skills_list?.length) > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{(request.required_skills_list?.length + request.preferred_skills_list?.length) - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Campaign Link */}
                {request.campaign_title && (
                  <div className="mb-4 flex-shrink-0">
                    <p className="text-xs text-gray-500">Campaign:</p>
                    <p className="text-sm text-blue-600 font-medium truncate">
                      {request.campaign_title}
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-4 flex-shrink-0">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{request.total_invited || 0} invited</span>
                    </span>
                  </div>
                  <span className="flex items-center flex-shrink-0">
                    <span className="hidden sm:inline">{formatDate(request.created_at)}</span>
                    <span className="sm:hidden">{formatDateShort(request.created_at)}</span>
                  </span>
                </div>

                {/* Actions - Always at bottom */}
                <div className="flex items-center space-x-2 mt-auto">
                  <button
                    onClick={() => navigate(`/organization/volunteers/requests/${request.id}`)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => navigate(`/organization/volunteers/requests/${request.id}/matches`)}
                    disabled={request.status === 'completed' || request.status === 'cancelled'}
                    className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Find</span>
                  </button>

                  <div className="relative">
                    <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors">
                      <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {/* Urgent Indicator */}
                {request.priority === 'urgent' && (
                  <div className="absolute top-2 right-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats Summary */}
      {Array.isArray(requests) && requests.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600">
                {requests.filter(r => r.status === 'open').length}
              </div>
              <div className="text-sm text-gray-600">Open Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">
                {requests.reduce((sum, r) => sum + (r.accepted_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Volunteers Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-yellow-600">
                {requests.reduce((sum, r) => sum + (r.pending_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Pending Responses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-purple-600">
                {requests.reduce((sum, r) => sum + (r.total_invited || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Invitations</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}