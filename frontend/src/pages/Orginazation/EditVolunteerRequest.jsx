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
  AlertCircle,
  Plus,
  X,
  Save
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Loading from '../../components/common/Loading';
import volunteerRequestApi from '../../api/endpoints/VolunteerRequestAPI';
import { myCampaigns } from '../../api/endpoints/CampaignAPI';

export default function EditVolunteerRequest() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    campaign: '',
    
    // Required criteria
    required_skills: '',
    required_languages: '',
    min_age: '',
    max_age: '',
    required_locations_data: [],
    
    // Preferred criteria
    preferred_skills: '',
    preferred_languages: '',
    preferred_interests: '',
    preferred_locations_data: [],
    
    // Event details
    event_date: '',
    event_end_date: '',
    duration_hours: '',
    volunteers_needed: '',
    
    priority: 'medium',
    status: 'open',
    special_requirements: ''
  });

  const [newLocation, setNewLocation] = useState({ city: '', state: '', country: '' });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationModalType, setLocationModalType] = useState('required'); // 'required' or 'preferred'

  // Fetch existing request data and campaigns
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch campaigns and request data in parallel
        const [campaignsData, requestData] = await Promise.allSettled([
          myCampaigns(),
          volunteerRequestApi.fetchVolunteerRequestById(requestId)
        ]);

        // Handle campaigns
        if (campaignsData.status === 'fulfilled') {
          setCampaigns(campaignsData.value || []);
        }

        // Handle request data
        if (requestData.status === 'fulfilled') {
          const request = requestData.value;
          
          // Convert date strings to datetime-local format
          const formatDateForInput = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm format
          };

          setFormData({
            title: request.title || '',
            description: request.description || '',
            campaign: request.campaign || '',
            
            // Required criteria
            required_skills: request.required_skills || '',
            required_languages: request.required_languages || '',
            min_age: request.min_age || '',
            max_age: request.max_age || '',
            required_locations_data: request.required_locations_data || [],
            
            // Preferred criteria
            preferred_skills: request.preferred_skills || '',
            preferred_languages: request.preferred_languages || '',
            preferred_interests: request.preferred_interests || '',
            preferred_locations_data: request.preferred_locations_data || [],
            
            // Event details
            event_date: formatDateForInput(request.event_date),
            event_end_date: formatDateForInput(request.event_end_date),
            duration_hours: request.duration_hours || '',
            volunteers_needed: request.volunteers_needed || '',
            
            priority: request.priority || 'medium',
            status: request.status || 'open',
            special_requirements: request.special_requirements || ''
          });
        } else {
          throw new Error(requestData.reason?.message || 'Failed to fetch request details');
        }

      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Failed to load request data');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchData();
    }
  }, [requestId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addLocation = (type) => {
    if (!newLocation.city || !newLocation.state || !newLocation.country) {
      setError('Please fill in all location fields (City, State, Country)');
      return;
    }

    const locationField = type === 'required' ? 'required_locations_data' : 'preferred_locations_data';
    
    setFormData(prev => ({
      ...prev,
      [locationField]: [...prev[locationField], { ...newLocation }]
    }));

    setNewLocation({ city: '', state: '', country: '' });
    setShowLocationModal(false);
    setError(null);
  };

  const removeLocation = (type, index) => {
    const locationField = type === 'required' ? 'required_locations_data' : 'preferred_locations_data';
    
    setFormData(prev => ({
      ...prev,
      [locationField]: prev[locationField].filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.title.trim()) errors.push('Title is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.event_date) errors.push('Event date is required');
    if (!formData.duration_hours || formData.duration_hours <= 0) errors.push('Duration must be greater than 0');
    if (!formData.volunteers_needed || formData.volunteers_needed <= 0) errors.push('Number of volunteers must be greater than 0');

    // Validate age range
    if (formData.min_age && formData.max_age && parseInt(formData.min_age) > parseInt(formData.max_age)) {
      errors.push('Minimum age cannot be greater than maximum age');
    }

    // Validate event dates
    const eventDate = new Date(formData.event_date);
    const eventEndDate = formData.event_end_date ? new Date(formData.event_end_date) : null;
    
    if (eventDate <= new Date()) {
      errors.push('Event date must be in the future');
    }

    if (eventEndDate && eventEndDate <= eventDate) {
      errors.push('Event end date must be after event start date');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        campaign: formData.campaign || null,
        min_age: formData.min_age ? parseInt(formData.min_age) : null,
        max_age: formData.max_age ? parseInt(formData.max_age) : null,
        duration_hours: parseInt(formData.duration_hours),
        volunteers_needed: parseInt(formData.volunteers_needed),
      };

      await volunteerRequestApi.updateVolunteerRequest(requestId, payload);
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/organization/volunteers/requests/${requestId}`, {
          state: { 
            message: 'Volunteer request updated successfully!',
            type: 'success'
          }
        });
      }, 1500);

    } catch (err) {
      console.error('Failed to update volunteer request:', err);
      setError(err.message || 'Failed to update volunteer request');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Updated!</h3>
          <p className="text-gray-600">Redirecting to request details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate(`/organization/volunteers/requests/${requestId}`)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Edit Volunteer Request</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Update your volunteer opportunity details
            </p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Beach Cleanup Volunteers Needed"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign (Optional)
              </label>
              <select
                value={formData.campaign}
                onChange={(e) => handleInputChange('campaign', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a campaign</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the volunteer opportunity, what volunteers will do, and why it's important..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.event_date}
                onChange={(e) => handleInputChange('event_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event End Date & Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.event_end_date}
                onChange={(e) => handleInputChange('event_end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (Hours) *
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={formData.duration_hours}
                onChange={(e) => handleInputChange('duration_hours', e.target.value)}
                placeholder="e.g., 4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volunteers Needed *
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.volunteers_needed}
                onChange={(e) => handleInputChange('volunteers_needed', e.target.value)}
                placeholder="e.g., 25"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Required Criteria */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Required Criteria</h2>
          <p className="text-gray-600 text-sm mb-4">Volunteers must meet ALL of these requirements to be considered</p>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.required_skills}
                  onChange={(e) => handleInputChange('required_skills', e.target.value)}
                  placeholder="e.g., teamwork, physical fitness, leadership"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Languages (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.required_languages}
                  onChange={(e) => handleInputChange('required_languages', e.target.value)}
                  placeholder="e.g., English, Spanish"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Age
                </label>
                <input
                  type="number"
                  min="16"
                  max="100"
                  value={formData.min_age}
                  onChange={(e) => handleInputChange('min_age', e.target.value)}
                  placeholder="e.g., 18"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Age
                </label>
                <input
                  type="number"
                  min="16"
                  max="100"
                  value={formData.max_age}
                  onChange={(e) => handleInputChange('max_age', e.target.value)}
                  placeholder="e.g., 65"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Required Locations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Required Locations
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setLocationModalType('required');
                    setShowLocationModal(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Location</span>
                </button>
              </div>
              
              <div className="space-y-2">
                {formData.required_locations_data.map((location, index) => (
                  <div key={index} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-800">
                        {location.city}, {location.state}, {location.country}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLocation('required', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preferred Criteria */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Preferred Criteria</h2>
          <p className="text-gray-600 text-sm mb-4">Nice to have - volunteers with these will be ranked higher</p>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.preferred_skills}
                  onChange={(e) => handleInputChange('preferred_skills', e.target.value)}
                  placeholder="e.g., environmental awareness, communication"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Languages (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.preferred_languages}
                  onChange={(e) => handleInputChange('preferred_languages', e.target.value)}
                  placeholder="e.g., French, Arabic"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Interests (comma-separated)
              </label>
              <input
                type="text"
                value={formData.preferred_interests}
                onChange={(e) => handleInputChange('preferred_interests', e.target.value)}
                placeholder="e.g., environment, education, community service"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Preferred Locations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Preferred Locations
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setLocationModalType('preferred');
                    setShowLocationModal(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Location</span>
                </button>
              </div>
              
              <div className="space-y-2">
                {formData.preferred_locations_data.map((location, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        {location.city}, {location.state}, {location.country}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLocation('preferred', index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Special Requirements */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requirements or Notes
            </label>
            <textarea
              value={formData.special_requirements}
              onChange={(e) => handleInputChange('special_requirements', e.target.value)}
              placeholder="Any additional requirements, what to bring, meeting location, etc..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 bg-white rounded-lg border border-gray-200 p-6">
          <button
            type="button"
            onClick={() => navigate(`/organization/volunteers/requests/${requestId}`)}
            disabled={saving}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Update Request</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Add {locationModalType === 'required' ? 'Required' : 'Preferred'} Location
                </h3>
                <button
                  onClick={() => {
                    setShowLocationModal(false);
                    setNewLocation({ city: '', state: '', country: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={newLocation.city}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g., Miami"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State/Province *</label>
                  <input
                    type="text"
                    value={newLocation.state}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="e.g., FL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <input
                    type="text"
                    value={newLocation.country}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="e.g., USA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowLocationModal(false);
                    setNewLocation({ city: '', state: '', country: '' });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addLocation(locationModalType)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}