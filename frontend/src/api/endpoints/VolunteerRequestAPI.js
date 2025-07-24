// api/endpoints/VolunteerRequestAPI.js
import api from '../axiosConfig';

// ===== VOLUNTEER REQUEST MANAGEMENT =====

// Fetch volunteer requests (organizations see their own, volunteers see public/invited)
export const fetchVolunteerRequests = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.campaign) queryParams.append('campaign', params.campaign);

    const url = `/volunteers/requests/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    console.log('Volunteer requests response:', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch volunteer requests:', error);
    throw {
      message: error.message || 'Failed to fetch volunteer requests',
      details: error.details,
      ...error
    };
  }
};

// Fetch specific volunteer request by ID
export const fetchVolunteerRequestById = async (id) => {
  try {
    const response = await api.get(`/volunteers/requests/${id}/`);
    console.log('Volunteer request by ID response:', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch volunteer request by ID:', error);
    throw {
      message: error.message || 'Failed to fetch volunteer request',
      details: error.details,
      ...error
    };
  }
};

// Create volunteer request (organizations only)
export const createVolunteerRequest = async (requestData) => {
  try {
    const payload = {
      title: requestData.title,
      description: requestData.description,
      campaign: requestData.campaign || null,
      
      // Required criteria
      required_skills: requestData.required_skills || '',
      required_languages: requestData.required_languages || '',
      min_age: requestData.min_age || null,
      max_age: requestData.max_age || null,
      required_locations_data: requestData.required_locations_data || [],
      
      // Preferred criteria
      preferred_skills: requestData.preferred_skills || '',
      preferred_languages: requestData.preferred_languages || '',
      preferred_interests: requestData.preferred_interests || '',
      preferred_locations_data: requestData.preferred_locations_data || [],
      
      // Event details
      event_date: requestData.event_date,
      event_end_date: requestData.event_end_date || null,
      duration_hours: requestData.duration_hours,
      volunteers_needed: requestData.volunteers_needed,
      
      priority: requestData.priority || 'medium',
      special_requirements: requestData.special_requirements || ''
    };

    const response = await api.post('/volunteers/requests/', payload);
    console.log('Volunteer request created:', response);
    return response;
  } catch (error) {
    console.error('Error creating volunteer request:', error);
    throw {
      message: error.message || 'Failed to create volunteer request',
      details: error.details,
      ...error
    };
  }
};

// Update volunteer request (organizations only)
export const updateVolunteerRequest = async (id, requestData) => {
  try {
    const payload = {
      title: requestData.title,
      description: requestData.description,
      campaign: requestData.campaign || null,
      
      // Required criteria
      required_skills: requestData.required_skills || '',
      required_languages: requestData.required_languages || '',
      min_age: requestData.min_age || null,
      max_age: requestData.max_age || null,
      required_locations_data: requestData.required_locations_data || [],
      
      // Preferred criteria
      preferred_skills: requestData.preferred_skills || '',
      preferred_languages: requestData.preferred_languages || '',
      preferred_interests: requestData.preferred_interests || '',
      preferred_locations_data: requestData.preferred_locations_data || [],
      
      // Event details
      event_date: requestData.event_date,
      event_end_date: requestData.event_end_date || null,
      duration_hours: requestData.duration_hours,
      volunteers_needed: requestData.volunteers_needed,
      
      priority: requestData.priority || 'medium',
      status: requestData.status,
      special_requirements: requestData.special_requirements || ''
    };

    const response = await api.put(`/volunteers/requests/${id}/`, payload);
    console.log('Volunteer request updated:', response);
    return response;
  } catch (error) {
    console.error('Error updating volunteer request:', error);
    throw {
      message: error.message || 'Failed to update volunteer request',
      details: error.details,
      ...error
    };
  }
};

// Delete volunteer request (organizations only)
export const deleteVolunteerRequest = async (id) => {
  try {
    const response = await api.delete(`/volunteers/requests/${id}/`);
    console.log('Volunteer request deleted:', response);
    return response;
  } catch (error) {
    console.error('Error deleting volunteer request:', error);
    throw {
      message: error.message || 'Failed to delete volunteer request',
      details: error.details,
      ...error
    };
  }
};

// ===== VOLUNTEER MATCHING =====

// Find matching volunteers for a request (organizations only)
export const findMatchingVolunteers = async (requestId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.min_score) queryParams.append('min_score', params.min_score);

    const url = `/volunteers/requests/${requestId}/matches/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    console.log('Matching volunteers response:', response);
    return response;
  } catch (error) {
    console.error('Failed to find matching volunteers:', error);
    throw {
      message: error.message || 'Failed to find matching volunteers',
      details: error.details,
      ...error
    };
  }
};

// ===== VOLUNTEER INVITATIONS =====

// Send bulk invitations to volunteers (organizations only)
export const sendBulkInvitations = async (requestId, invitationData) => {
  try {
    const payload = {
      volunteer_ids: invitationData.volunteer_ids,
      message: invitationData.message || ''
    };

    const response = await api.post(`/volunteers/requests/${requestId}/invite_volunteers/`, payload);
    console.log('Bulk invitations sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending bulk invitations:', error);
    throw {
      message: error.message || 'Failed to send invitations',
      details: error.details,
      ...error
    };
  }
};

// Get invitations for a request (organizations only)
export const fetchRequestInvitations = async (requestId, status = null) => {
  try {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);

    const url = `/volunteers/requests/${requestId}/invitations/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    console.log('Request invitations response:', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch request invitations:', error);
    throw {
      message: error.message || 'Failed to fetch invitations',
      details: error.details,
      ...error
    };
  }
};

// Get volunteer's invitations (volunteers only)
export const fetchMyInvitations = async (status = null) => {
  try {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);

    const url = `/volunteers/invitations/my_invitations/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    console.log('My invitations response:', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch my invitations:', error);
    throw {
      message: error.message || 'Failed to fetch invitations',
      details: error.details,
      ...error
    };
  }
};

// Respond to invitation (volunteers only)
export const respondToInvitation = async (invitationId, responseData) => {
  try {
    const payload = {
      status: responseData.status, // 'accepted' or 'declined'
      response_message: responseData.response_message || ''
    };

    const response = await api.post(`/volunteers/invitations/${invitationId}/respond/`, payload);
    console.log('Invitation response:', response);
    return response;
  } catch (error) {
    console.error('Error responding to invitation:', error);
    throw {
      message: error.message || 'Failed to respond to invitation',
      details: error.details,
      ...error
    };
  }
};

// ===== NOTIFICATIONS =====

// Fetch volunteer notifications (volunteers only)
export const fetchVolunteerNotifications = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.is_read !== undefined) queryParams.append('is_read', params.is_read);
    if (params.notification_type) queryParams.append('notification_type', params.notification_type);

    const url = `/volunteers/notifications/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    console.log('Volunteer notifications response:', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch volunteer notifications:', error);
    throw {
      message: error.message || 'Failed to fetch notifications',
      details: error.details,
      ...error
    };
  }
};

// Get unread notification count (volunteers only)
export const fetchUnreadNotificationCount = async () => {
  try {
    const response = await api.get('/volunteers/notifications/unread_count/');
    console.log('Unread notification count response:', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch unread notification count:', error);
    throw {
      message: error.message || 'Failed to fetch notification count',
      details: error.details,
      ...error
    };
  }
};

// Mark notifications as read (volunteers only)
export const markNotificationsAsRead = async (notificationIds) => {
  try {
    const payload = {
      notification_ids: notificationIds
    };

    const response = await api.post('/volunteers/notifications/mark_read/', payload);
    console.log('Notifications marked as read:', response);
    return response;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw {
      message: error.message || 'Failed to mark notifications as read',
      details: error.details,
      ...error
    };
  }
};

// Mark all notifications as read (volunteers only)
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.post('/volunteers/notifications/mark_all_read/');
    console.log('All notifications marked as read:', response);
    return response;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw {
      message: error.message || 'Failed to mark all notifications as read',
      details: error.details,
      ...error
    };
  }
};

// ===== WEBSOCKET CONNECTION =====

// WebSocket connection for real-time notifications (volunteers only)
export const createNotificationWebSocket = (onMessage, onError, onClose) => {
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/volunteers/notifications/`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = (event) => {
      console.log('WebSocket connected:', event);
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };
    
    socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event);
      if (onClose) onClose(event);
      
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        createNotificationWebSocket(onMessage, onError, onClose);
      }, 3000);
    };
    
    return socket;
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
    throw {
      message: 'Failed to establish real-time connection',
      details: error,
      ...error
    };
  }
};

// ===== UTILITY FUNCTIONS =====

// Format volunteer request status
export const formatRequestStatus = (status) => {
  const statusMap = {
    'open': 'Open',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status;
};

// Format invitation status
export const formatInvitationStatus = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'accepted': 'Accepted',
    'declined': 'Declined',
    'expired': 'Expired'
  };
  return statusMap[status] || status;
};

// Format priority level
export const formatPriority = (priority) => {
  const priorityMap = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'urgent': 'Urgent'
  };
  return priorityMap[priority] || priority;
};

// Get priority color class
export const getPriorityColor = (priority) => {
  const colorMap = {
    'low': 'text-gray-600 bg-gray-100',
    'medium': 'text-blue-600 bg-blue-100',
    'high': 'text-orange-600 bg-orange-100',
    'urgent': 'text-red-600 bg-red-100'
  };
  return colorMap[priority] || 'text-gray-600 bg-gray-100';
};

// Get status color class
export const getStatusColor = (status) => {
  const colorMap = {
    'open': 'text-green-600 bg-green-100',
    'in_progress': 'text-blue-600 bg-blue-100',
    'completed': 'text-gray-600 bg-gray-100',
    'cancelled': 'text-red-600 bg-red-100'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-100';
};

// Get invitation status color class
export const getInvitationStatusColor = (status) => {
  const colorMap = {
    'pending': 'text-yellow-600 bg-yellow-100',
    'accepted': 'text-green-600 bg-green-100',
    'declined': 'text-red-600 bg-red-100',
    'expired': 'text-gray-600 bg-gray-100'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-100';
};

// Calculate match score color
export const getMatchScoreColor = (score) => {
  if (score >= 80) return 'text-green-600 bg-green-100';
  if (score >= 60) return 'text-blue-600 bg-blue-100';
  if (score >= 40) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

// Format date for display
export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Error handling wrapper (matching your pattern)
export const withErrorHandling = (apiCall) => {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (error) {
      console.error(`API Error in ${apiCall.name}:`, {
        message: error.message,
        details: error.details,
        status: error.status,
        args
      });
      
      throw {
        message: error.message || 'An unexpected error occurred',
        status: error.status || error.response?.status || 500,
        details: error.details || null,
        timestamp: new Date().toISOString()
      };
    }
  };
};

// Export all functions with error handling
export default {
  // Volunteer Request Management
  fetchVolunteerRequests: withErrorHandling(fetchVolunteerRequests),
  fetchVolunteerRequestById: withErrorHandling(fetchVolunteerRequestById),
  createVolunteerRequest: withErrorHandling(createVolunteerRequest),
  updateVolunteerRequest: withErrorHandling(updateVolunteerRequest),
  deleteVolunteerRequest: withErrorHandling(deleteVolunteerRequest),
  
  // Volunteer Matching
  findMatchingVolunteers: withErrorHandling(findMatchingVolunteers),
  
  // Invitations
  sendBulkInvitations: withErrorHandling(sendBulkInvitations),
  fetchRequestInvitations: withErrorHandling(fetchRequestInvitations),
  fetchMyInvitations: withErrorHandling(fetchMyInvitations),
  respondToInvitation: withErrorHandling(respondToInvitation),
  
  // Notifications
  fetchVolunteerNotifications: withErrorHandling(fetchVolunteerNotifications),
  fetchUnreadNotificationCount: withErrorHandling(fetchUnreadNotificationCount),
  markNotificationsAsRead: withErrorHandling(markNotificationsAsRead),
  markAllNotificationsAsRead: withErrorHandling(markAllNotificationsAsRead),
  
  // WebSocket
  createNotificationWebSocket,
  
  // Utilities
  formatRequestStatus,
  formatInvitationStatus,
  formatPriority,
  getPriorityColor,
  getStatusColor,
  getInvitationStatusColor,
  getMatchScoreColor,
  formatDateTime
};