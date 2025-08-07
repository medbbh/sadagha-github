import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/common/Loading';
import volunteerRequestApi from '../../api/endpoints/VolunteerRequestAPI';
import { myCampaigns } from '../../api/endpoints/CampaignAPI';

export default function CreateVolunteerRequest() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    campaign: '',
    required_skills: '',
    required_languages: '',
    min_age: '',
    max_age: '',
    required_locations_data: [],
    preferred_skills: '',
    preferred_languages: '',
    preferred_interests: '',
    preferred_locations_data: [],
    event_date: '',
    event_end_date: '',
    duration_hours: '',
    volunteers_needed: '',
    priority: 'medium',
    special_requirements: ''
  });

  const [newLocation, setNewLocation] = useState({ city: '', state: '', country: '' });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationModalType, setLocationModalType] = useState('required');

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const campaignsData = await myCampaigns();
        setCampaigns(campaignsData || []);
      } catch (err) {
        console.error('Failed to fetch campaigns:', err);
      }
    };

    fetchCampaigns();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addLocation = (type) => {
    if (!newLocation.city || !newLocation.state || !newLocation.country) {
      setError(t('organization.volunteerRequest.validation.locationFields'));
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

    if (!formData.title.trim()) errors.push(t('organization.volunteerRequest.validation.titleRequired'));
    if (!formData.description.trim()) errors.push(t('organization.volunteerRequest.validation.descriptionRequired'));
    if (!formData.event_date) errors.push(t('organization.volunteerRequest.validation.dateRequired'));
    if (!formData.duration_hours || formData.duration_hours <= 0) errors.push(t('organization.volunteerRequest.validation.durationPositive'));
    if (!formData.volunteers_needed || formData.volunteers_needed <= 0) errors.push(t('organization.volunteerRequest.validation.volunteersPositive'));

    if (formData.min_age && formData.max_age && parseInt(formData.min_age) > parseInt(formData.max_age)) {
      errors.push(t('organization.volunteerRequest.validation.ageRange'));
    }

    const eventDate = new Date(formData.event_date);
    const eventEndDate = formData.event_end_date ? new Date(formData.event_end_date) : null;
    
    if (eventDate <= new Date()) {
      errors.push(t('organization.volunteerRequest.validation.dateFuture'));
    }

    if (eventEndDate && eventEndDate <= eventDate) {
      errors.push(t('organization.volunteerRequest.validation.endDateAfter'));
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

    setLoading(true);
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

      await volunteerRequestApi.createVolunteerRequest(payload);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/organization/volunteers/requests', {
          state: { 
            message: t('organization.volunteerRequest.success.message'),
            type: 'success'
          }
        });
      }, 1500);

    } catch (err) {
      console.error('Failed to create volunteer request:', err);
      setError(err.message || t('organization.volunteerRequest.error.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('organization.volunteerRequest.success.title')}
          </h3>
          <p className="text-gray-600">
            {t('organization.volunteerRequest.success.message')}
          </p>
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
            onClick={() => navigate('/organization/volunteers/requests')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {t('organization.volunteerRequest.title')}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {t('organization.volunteerRequest.description')}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('organization.volunteerRequest.basicInfo')}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('organization.volunteerRequest.titleLabel')}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={t('organization.volunteerRequest.titlePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('organization.volunteerRequest.campaignLabel')}
              </label>
              <select
                value={formData.campaign}
                onChange={(e) => handleInputChange('campaign', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('organization.volunteerRequest.campaignLabel')}</option>
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
              {t('organization.volunteerRequest.descriptionLabel')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('organization.volunteerRequest.descriptionPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              required
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('organization.volunteerRequest.priorityLabel')}
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(t('organization.volunteerRequest.priorityOptions', { returnObjects: true })).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('organization.volunteerRequest.eventDetails')}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('organization.volunteerRequest.startDateLabel')}
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
                {t('organization.volunteerRequest.endDateLabel')}
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
                {t('organization.volunteerRequest.durationLabel')}
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={formData.duration_hours}
                onChange={(e) => handleInputChange('duration_hours', e.target.value)}
                placeholder={t('organization.volunteerRequest.durationPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('organization.volunteerRequest.volunteersLabel')}
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.volunteers_needed}
                onChange={(e) => handleInputChange('volunteers_needed', e.target.value)}
                placeholder={t('organization.volunteerRequest.volunteersPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Required Criteria */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {t('organization.volunteerRequest.requiredCriteria')}
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            {t('organization.volunteerRequest.requiredDescription')}
          </p>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('organization.volunteerRequest.requiredSkillsLabel')}
                </label>
                <input
                  type="text"
                  value={formData.required_skills}
                  onChange={(e) => handleInputChange('required_skills', e.target.value)}
                  placeholder={t('organization.volunteerRequest.requiredSkillsPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('organization.volunteerRequest.requiredLanguagesLabel')}
                </label>
                <input
                  type="text"
                  value={formData.required_languages}
                  onChange={(e) => handleInputChange('required_languages', e.target.value)}
                  placeholder={t('organization.volunteerRequest.requiredLanguagesPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('organization.volunteerRequest.minAgeLabel')}
                </label>
                <input
                  type="number"
                  min="16"
                  max="100"
                  value={formData.min_age}
                  onChange={(e) => handleInputChange('min_age', e.target.value)}
                  placeholder={t('organization.volunteerRequest.minAgePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('organization.volunteerRequest.maxAgeLabel')}
                </label>
                <input
                  type="number"
                  min="16"
                  max="100"
                  value={formData.max_age}
                  onChange={(e) => handleInputChange('max_age', e.target.value)}
                  placeholder={t('organization.volunteerRequest.maxAgePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Required Locations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  {t('organization.volunteerRequest.requiredLocationsLabel')}
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
                  <span>{t('organization.volunteerRequest.addLocation')}</span>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {t('organization.volunteerRequest.preferredCriteria')}
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            {t('organization.volunteerRequest.preferredDescription')}
          </p>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('organization.volunteerRequest.preferredSkillsLabel')}
                </label>
                <input
                  type="text"
                  value={formData.preferred_skills}
                  onChange={(e) => handleInputChange('preferred_skills', e.target.value)}
                  placeholder={t('organization.volunteerRequest.preferredSkillsPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('organization.volunteerRequest.preferredLanguagesLabel')}
                </label>
                <input
                  type="text"
                  value={formData.preferred_languages}
                  onChange={(e) => handleInputChange('preferred_languages', e.target.value)}
                  placeholder={t('organization.volunteerRequest.preferredLanguagesPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('organization.volunteerRequest.preferredInterestsLabel')}
              </label>
              <input
                type="text"
                value={formData.preferred_interests}
                onChange={(e) => handleInputChange('preferred_interests', e.target.value)}
                placeholder={t('organization.volunteerRequest.preferredInterestsPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Preferred Locations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  {t('organization.volunteerRequest.preferredLocationsLabel')}
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
                  <span>{t('organization.volunteerRequest.addLocation')}</span>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('organization.volunteerRequest.additionalInfo')}
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('organization.volunteerRequest.specialRequirementsLabel')}
            </label>
            <textarea
              value={formData.special_requirements}
              onChange={(e) => handleInputChange('special_requirements', e.target.value)}
              placeholder={t('organization.volunteerRequest.specialRequirementsPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 bg-white rounded-lg border border-gray-200 p-6">
          <button
            type="button"
            onClick={() => navigate('/organization/volunteers/requests')}
            disabled={loading}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t('organization.volunteerRequest.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('organization.volunteerRequest.creating')}</span>
              </>
            ) : (
              <span>{t('organization.volunteerRequest.createRequest')}</span>
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
                  {t('organization.volunteerRequest.locationModal.title', { 
                    type: locationModalType === 'required' 
                      ? t('organization.volunteerRequest.required') 
                      : t('organization.volunteerRequest.preferred')
                  })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('organization.volunteerRequest.locationModal.cityLabel')}
                  </label>
                  <input
                    type="text"
                    value={newLocation.city}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                    placeholder={t('organization.volunteerRequest.locationModal.cityPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('organization.volunteerRequest.locationModal.stateLabel')}
                  </label>
                  <input
                    type="text"
                    value={newLocation.state}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, state: e.target.value }))}
                    placeholder={t('organization.volunteerRequest.locationModal.statePlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('organization.volunteerRequest.locationModal.countryLabel')}
                  </label>
                  <input
                    type="text"
                    value={newLocation.country}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, country: e.target.value }))}
                    placeholder={t('organization.volunteerRequest.locationModal.countryPlaceholder')}
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
                  {t('organization.volunteerRequest.cancel')}
                </button>
                <button
                  onClick={() => addLocation(locationModalType)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('organization.volunteerRequest.locationModal.addLocation')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}