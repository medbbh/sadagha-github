import React from 'react';
import { Heart, Users, User, Star, Clock, Edit, ToggleLeft, ToggleRight, Phone, MapPin, Globe, Shield } from 'lucide-react';
import Loading from '../../components/common/Loading';
import VolunteerForm from '../../components/ui/VolunteerForm';

const VolunteerTab = ({ 
  volunteerProfile, 
  volunteerLoading, 
  showVolunteerForm, 
  setShowVolunteerForm,
  volunteerSuccess,
  volunteerError,
  handleVolunteerFormSuccess,
  handleVolunteerEdit,
  handleVolunteerCancelEdit,
  handleVolunteerToggleStatus
}) => {
  const formatList = (str) => {
    if (!str) return [];
    return str.split(',').map(item => item.trim()).filter(item => item);
  };

  const getLocationNames = (locationsData) => {
    if (!locationsData || !Array.isArray(locationsData)) return [];
    return locationsData.map(loc => loc.name || loc.id);
  };

  if (volunteerLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading />
      </div>
    );
  }

  if (showVolunteerForm) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {volunteerProfile ? 'Edit Volunteer Profile' : 'Create Volunteer Profile'}
          </h2>
          {volunteerProfile && (
            <button
              onClick={handleVolunteerCancelEdit}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
        <VolunteerForm 
          onSuccess={handleVolunteerFormSuccess} 
          profile={volunteerProfile} 
        />
      </div>
    );
  }

  if (!volunteerProfile) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Volunteer Information</h2>
        </div>

        {/* Welcome Section */}
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="text-blue-600 w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Make a Difference?
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of volunteers in Mauritania who are helping their communities through SADA9A. 
            Create your volunteer profile to get matched with opportunities that fit your skills and availability.
          </p>
          <button
            onClick={() => setShowVolunteerForm(true)}
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Users className="w-5 h-5 mr-2" />
            Create Volunteer Profile
          </button>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Get Matched</h4>
            <p className="text-gray-600 text-sm">
              Organizations will find you based on your skills and availability
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Make Impact</h4>
            <p className="text-gray-600 text-sm">
              Use your skills to help causes you care about in your community
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Flexible Schedule</h4>
            <p className="text-gray-600 text-sm">
              Volunteer when it works for you with our flexible scheduling system
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Display volunteer profile in consistent style
  const skillsList = formatList(volunteerProfile.skills);
  const interestsList = formatList(volunteerProfile.interests);
  const languagesList = formatList(volunteerProfile.languages);
  const locationNames = getLocationNames(volunteerProfile.available_locations_data);

  return (
    <div className="space-y-8">
      {/* Success/Error Messages */}
      {volunteerSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
          <div>
            <h3 className="text-green-800 font-medium">Volunteer Profile Updated!</h3>
            <p className="text-green-700 text-sm">Your volunteer information has been saved successfully.</p>
          </div>
        </div>
      )}

      {volunteerError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-xs">!</span>
          </div>
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700 text-sm">{volunteerError}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Volunteer Information</h2>
        <div className="flex gap-3">
          <button
            onClick={handleVolunteerToggleStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              volunteerProfile.is_active 
                ? 'bg-red-100 hover:bg-red-200 text-red-700'
                : 'bg-green-100 hover:bg-green-200 text-green-700'
            }`}
          >
            {volunteerProfile.is_active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
            {volunteerProfile.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={handleVolunteerEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          volunteerProfile.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${volunteerProfile.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium">{volunteerProfile.is_active ? 'Active' : 'Inactive'}</span>
        </div>
        <span className="text-gray-500 text-sm">
          Member since {new Date(volunteerProfile.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={volunteerProfile.phone}
              disabled
              className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
          <input
            type="text"
            value={`${volunteerProfile.age} years`}
            disabled
            className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg"
          />
        </div>

        {volunteerProfile.profession && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profession</label>
            <input
              type="text"
              value={volunteerProfile.profession}
              disabled
              className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Motivation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Motivation</label>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-700">{volunteerProfile.motivation}</p>
        </div>
      </div>

      {/* Skills and Interests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Skills ({skillsList.length})</label>
          <div className="flex flex-wrap gap-2">
            {skillsList.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Interests ({interestsList.length})</label>
          <div className="flex flex-wrap gap-2">
            {interestsList.map((interest, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Languages ({languagesList.length})</label>
        <div className="flex flex-wrap gap-2">
          {languagesList.map((language, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
            >
              {language}
            </span>
          ))}
        </div>
      </div>

      {/* Available Locations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Available Locations ({locationNames.length})</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {locationNames.map((location, index) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center"
            >
              <MapPin className="w-4 h-4 text-gray-500 mx-auto mb-1" />
              <div className="text-sm text-gray-900">{location}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VolunteerTab;