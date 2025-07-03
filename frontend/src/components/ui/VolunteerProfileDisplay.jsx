import React, { useState } from 'react';
import { User, Phone, MapPin, Clock, Star, Edit, ToggleLeft, ToggleRight, Sun, CloudSun, Sunset, RotateCcw, ChevronDown, ChevronUp, Calendar, Award, Globe } from 'lucide-react';

const VolunteerProfileDisplay = ({ profile, onEdit, onToggleStatus }) => {
  const [expandedSection, setExpandedSection] = useState('basic');
  const [hoveredDay, setHoveredDay] = useState(null);

  if (!profile) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="text-gray-400 w-12 h-12" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">No Volunteer Profile</h3>
        <p className="text-gray-600 max-w-sm mx-auto">Ready to make a difference? Create your volunteer profile to get started with meaningful opportunities.</p>
      </div>
    );
  }

  const getAvailabilityDisplay = (availabilityData) => {
    if (!availabilityData || typeof availabilityData !== 'object') return {};
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const slots = ['morning', 'afternoon', 'evening', 'flexible'];
    const dayNames = {
      monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
      friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
    };
    const slotConfig = {
      morning: { IconComponent: Sun, name: 'Morning', time: '8AM-12PM', color: 'bg-amber-100 text-amber-700' },
      afternoon: { IconComponent: CloudSun, name: 'Afternoon', time: '12PM-5PM', color: 'bg-orange-100 text-orange-700' },
      evening: { IconComponent: Sunset, name: 'Evening', time: '5PM-8PM', color: 'bg-purple-100 text-purple-700' },
      flexible: { IconComponent: RotateCcw, name: 'Flexible', time: 'Anytime', color: 'bg-blue-100 text-blue-700' }
    };

    const schedule = {};
    days.forEach(day => {
      if (availabilityData[day]) {
        const daySlots = [];
        slots.forEach(slot => {
          if (availabilityData[day][slot]) {
            daySlots.push(slotConfig[slot]);
          }
        });
        if (daySlots.length > 0) {
          schedule[dayNames[day]] = daySlots;
        }
      }
    });
    
    return schedule;
  };

  const formatList = (str) => {
    if (!str) return [];
    return str.split(',').map(item => item.trim()).filter(item => item);
  };

  const getLocationNames = (locationsData) => {
    if (!locationsData || !Array.isArray(locationsData)) return [];
    return locationsData.map(loc => loc.name || loc.id);
  };

  const schedule = getAvailabilityDisplay(profile.availability_data);
  const locationNames = getLocationNames(profile.available_locations_data);
  const skillsList = formatList(profile.skills);
  const interestsList = formatList(profile.interests);
  const languagesList = formatList(profile.languages);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Animated Header */}
      <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-8">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">Volunteer Profile</h2>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    profile.is_active ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${profile.is_active ? 'bg-green-300' : 'bg-red-300'}`}></div>
                    <span className="text-sm font-medium">{profile.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <span className="text-blue-100 text-sm">
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onToggleStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                profile.is_active 
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-100 backdrop-blur-sm'
                  : 'bg-green-500/20 hover:bg-green-500/30 text-green-100 backdrop-blur-sm'
              }`}
            >
              {profile.is_active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
              {profile.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium text-white transition-all transform hover:scale-105"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Interactive Basic Info */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-100">
          <button
            onClick={() => toggleSection('basic')}
            className="flex items-center justify-between w-full text-left group"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              Contact & Basic Information
            </h3>
            {expandedSection === 'basic' ? 
              <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" /> : 
              <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            }
          </button>
          
          {expandedSection === 'basic' && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top duration-300">
              <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <Phone className="w-5 h-5 text-blue-600 mb-2" />
                <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                <p className="font-semibold text-gray-900">{profile.phone}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <User className="w-5 h-5 text-purple-600 mb-2" />
                <p className="text-xs text-gray-500 uppercase tracking-wide">Age</p>
                <p className="font-semibold text-gray-900">{profile.age} years</p>
              </div>
              {profile.profession && (
                <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <Award className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Profession</p>
                  <p className="font-semibold text-gray-900">{profile.profession}</p>
                </div>
              )}
              <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <Calendar className="w-5 h-5 text-orange-600 mb-2" />
                <p className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</p>
                <p className="font-semibold text-gray-900">{new Date(profile.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Motivation with Quote Style */}
        <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border border-purple-100">
          <div className="absolute top-4 left-4 text-6xl text-purple-200 font-serif">"</div>
          <div className="relative ml-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Why I Volunteer</h3>
            <p className="text-gray-700 leading-relaxed text-lg italic">{profile.motivation}</p>
          </div>
          <div className="absolute bottom-4 right-4 text-6xl text-purple-200 font-serif rotate-180">"</div>
        </div>

        {/* Skills & Interests with Hover Effects */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-600" />
              Skills ({skillsList.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-default border border-blue-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              Interests ({interestsList.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {interestsList.map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-2 bg-white text-purple-700 rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-default border border-purple-200"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" />
            Languages I Speak ({languagesList.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {languagesList.map((language, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-white text-green-700 rounded-full text-sm font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-default border border-green-200"
              >
                {language}
              </span>
            ))}
          </div>
        </div>

        {/* Interactive Locations */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-600" />
            Available Locations ({locationNames.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {locationNames.map((location, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-default border border-gray-200"
              >
                <MapPin className="w-4 h-4 text-gray-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-900">{location}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Availability Schedule */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            My Availability Schedule
          </h3>
          {Object.keys(schedule).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(schedule).map(([day, slots]) => (
                <div 
                  key={day} 
                  className={`bg-white rounded-lg p-4 shadow-sm transition-all hover:shadow-md border border-orange-200 ${
                    hoveredDay === day ? 'scale-105' : ''
                  }`}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {day}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {slots.map((slot, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${slot.color} shadow-sm hover:shadow-md transition-all hover:scale-105`}
                        >
                          <slot.IconComponent className="w-4 h-4" />
                          <span>{slot.name}</span>
                          <span className="opacity-75">({slot.time})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No availability schedule set</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfileDisplay;