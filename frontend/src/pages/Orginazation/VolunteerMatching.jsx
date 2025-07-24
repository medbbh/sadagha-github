import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Users, 
  Star, 
  MapPin, 
  Phone,
  Mail,
  Calendar,
  Award,
  Languages,
  Heart,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Loading from '../../components/common/Loading';
import volunteerRequestApi from '../../api/endpoints/VolunteerRequestAPI';

export default function VolunteerMatching() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState(null);
  const [matchingVolunteers, setMatchingVolunteers] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minScore, setMinScore] = useState(0);
  const [invitationMessage, setInvitationMessage] = useState('');
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);

  // Fetch request details and matching volunteers
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch request details
        const requestData = await volunteerRequestApi.fetchVolunteerRequestById(requestId);
        setRequest(requestData);
        
        // Find matching volunteers
        setMatchingLoading(true);
        const matchesData = await volunteerRequestApi.findMatchingVolunteers(requestId, {
          limit: 50,
          min_score: minScore
        });
        setMatchingVolunteers(matchesData.volunteers || []);
        
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
        setMatchingLoading(false);
      }
    };

    if (requestId) {
      fetchData();
    }
  }, [requestId, minScore]);

  // Handle volunteer selection
  const toggleVolunteerSelection = (volunteerId) => {
    const newSelected = new Set(selectedVolunteers);
    if (newSelected.has(volunteerId)) {
      newSelected.delete(volunteerId);
    } else {
      newSelected.add(volunteerId);
    }
    setSelectedVolunteers(newSelected);
  };

  // Select all volunteers
  const selectAllVolunteers = () => {
    const allIds = matchingVolunteers.map(v => v.id);
    setSelectedVolunteers(new Set(allIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedVolunteers(new Set());
  };

  // Send invitations
  const handleSendInvitations = async () => {
    if (selectedVolunteers.size === 0) {
      setError('Please select at least one volunteer');
      return;
    }

    setSendingInvitations(true);
    setError(null);

    try {
      const volunteerIds = Array.from(selectedVolunteers);
      await volunteerRequestApi.sendBulkInvitations(requestId, {
        volunteer_ids: volunteerIds,
        message: invitationMessage
      });

      // Success - redirect back to request details
      navigate(`/organization/volunteers/requests/${requestId}`, {
        state: { 
          message: `Successfully sent invitations to ${volunteerIds.length} volunteers!`,
          type: 'success'
        }
      });
    } catch (err) {
      console.error('Failed to send invitations:', err);
      setError(err.message || 'Failed to send invitations');
    } finally {
      setSendingInvitations(false);
      setShowInvitationModal(false);
    }
  };

  const getMatchScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 60) return <Star className="w-4 h-4 text-blue-600" />;
    if (score >= 40) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const formatMatchDetails = (matchDetails) => {
    const details = [];
    
    if (matchDetails.required_matches?.skills) {
      details.push(`✓ Required skills: ${matchDetails.required_matches.skills.join(', ')}`);
    }
    if (matchDetails.required_matches?.languages) {
      details.push(`✓ Required languages: ${matchDetails.required_matches.languages.join(', ')}`);
    }
    if (matchDetails.required_matches?.location) {
      details.push(`✓ Location match`);
    }
    if (matchDetails.required_matches?.age) {
      details.push(`✓ Age requirement met`);
    }
    
    if (matchDetails.preferred_matches?.skills) {
      details.push(`+ Preferred skills: ${matchDetails.preferred_matches.skills.join(', ')}`);
    }
    if (matchDetails.preferred_matches?.languages) {
      details.push(`+ Preferred languages: ${matchDetails.preferred_matches.languages.join(', ')}`);
    }
    if (matchDetails.preferred_matches?.interests) {
      details.push(`+ Interests: ${matchDetails.preferred_matches.interests.join(', ')}`);
    }
    
    return details;
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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate(`/organization/volunteers/requests/${requestId}`)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Find Volunteers</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {request?.title}
            </p>
          </div>
        </div>

        {/* Request Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Volunteers Needed:</span>
              <span className="ml-2 font-medium">{request?.volunteers_needed}</span>
            </div>
            <div>
              <span className="text-gray-500">Already Found:</span>
              <span className="ml-2 font-medium text-green-600">{request?.accepted_count || 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Still Need:</span>
              <span className="ml-2 font-medium text-orange-600">
                {Math.max(0, (request?.volunteers_needed || 0) - (request?.accepted_count || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Selection Summary */}
        {selectedVolunteers.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedVolunteers.size} volunteer{selectedVolunteers.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearSelection}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowInvitationModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Invitations</span>
                </button>
              </div>
            </div>
          </div>
        )}
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

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Match Score
            </label>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={0}>All Matches (0%+)</option>
              <option value={40}>Good Matches (40%+)</option>
              <option value={60}>Great Matches (60%+)</option>
              <option value={80}>Perfect Matches (80%+)</option>
            </select>
          </div>
          
          <div className="flex items-end space-x-2">
            <button
              onClick={selectAllVolunteers}
              disabled={matchingVolunteers.length === 0}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              Select All
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {matchingLoading && (
        <div className="flex items-center justify-center h-32">
          <Loading />
        </div>
      )}

      {/* Volunteers List */}
      {!matchingLoading && (
        <div className="space-y-4">
          {matchingVolunteers.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matching volunteers found</h3>
              <p className="text-gray-600 mb-4">
                Try lowering the minimum match score or adjusting your request requirements.
              </p>
            </div>
          ) : (
            matchingVolunteers.map((volunteer) => (
              <div
                key={volunteer.id}
                className={`bg-white rounded-lg border-2 transition-all duration-200 ${
                  selectedVolunteers.has(volunteer.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start space-x-4">
                    {/* Selection Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={selectedVolunteers.has(volunteer.id)}
                        onChange={() => toggleVolunteerSelection(volunteer.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    {/* Volunteer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {volunteer.full_name}
                          </h3>
                          <p className="text-sm text-gray-600">{volunteer.profession}</p>
                        </div>
                        
                        {/* Match Score */}
                        <div className="flex items-center space-x-2">
                          {getMatchScoreIcon(volunteer.match_score)}
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${volunteerRequestApi.getMatchScoreColor(volunteer.match_score)}`}>
                            {volunteer.match_score}% match
                          </span>
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Age: {volunteer.age}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          <span className="truncate">{volunteer.email}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{volunteer.phone}</span>
                        </div>
                      </div>

                      {/* Skills */}
                      {volunteer.skills_list && volunteer.skills_list.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center mb-2">
                            <Award className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Skills</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {volunteer.skills_list.map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Languages */}
                      {volunteer.languages_list && volunteer.languages_list.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center mb-2">
                            <Languages className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Languages</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {volunteer.languages_list.map((language, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                              >
                                {language}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interests */}
                      {volunteer.interests_list && volunteer.interests_list.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center mb-2">
                            <Heart className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Interests</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {volunteer.interests_list.map((interest, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Match Details */}
                      {volunteer.match_details && (
                        <div className="border-t pt-4">
                          <div className="flex items-center mb-2">
                            <CheckCircle className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Match Details</span>
                          </div>
                          <div className="space-y-1">
                            {formatMatchDetails(volunteer.match_details).map((detail, index) => (
                              <p key={index} className="text-xs text-gray-600">
                                {detail}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Invitation Modal */}
      {showInvitationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Send Invitations</h3>
                <button
                  onClick={() => setShowInvitationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                You're about to send invitations to {selectedVolunteers.size} volunteers.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={invitationMessage}
                  onChange={(e) => setInvitationMessage(e.target.value)}
                  placeholder="Add a personal message to make your invitation more appealing..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {invitationMessage.length}/1000 characters
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowInvitationModal(false)}
                  disabled={sendingInvitations}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvitations}
                  disabled={sendingInvitations}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {sendingInvitations ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Invitations</span>
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