import React, { useState } from 'react';
import { User, Phone, MapPin, Clock, Star, Heart, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Sun, CloudSun, Sunset, RotateCcw } from 'lucide-react';
import { createVolunteerProfile, updateVolunteerProfile } from '../../api/endpoints/VolunteerAPI';

const VolunteerForm = ({ onSuccess, profile = null }) => {
  const [formData, setFormData] = useState({
    phone: profile?.phone || '',
    age: profile?.age || '',
    profession: profile?.profession || '',
    motivation: profile?.motivation || '',
    skills: profile?.skills || '',
    interests: profile?.interests || '',
    languages: profile?.languages || '',
    available_locations_data: profile?.available_locations_data || [],
    availability_data: profile?.availability_data || {}
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const isEditing = !!profile;

  const mauritanianLocations = [
    { id: 'nouakchott', name: 'Nouakchott', type: 'capitale' },
    { id: 'adrar', name: 'Adrar', type: 'wilaya' },
    { id: 'assaba', name: 'Assaba', type: 'wilaya' },
    { id: 'brakna', name: 'Brakna', type: 'wilaya' },
    { id: 'dakhlet_nouadhibou', name: 'Dakhlet Nouadhibou', type: 'wilaya' },
    { id: 'gorgol', name: 'Gorgol', type: 'wilaya' },
    { id: 'guidimaka', name: 'Guidimaka', type: 'wilaya' },
    { id: 'hodh_ech_chargui', name: 'Hodh Ech Chargui', type: 'wilaya' },
    { id: 'hodh_el_gharbi', name: 'Hodh El Gharbi', type: 'wilaya' },
    { id: 'inchiri', name: 'Inchiri', type: 'wilaya' },
    { id: 'tagant', name: 'Tagant', type: 'wilaya' },
    { id: 'tiris_zemmour', name: 'Tiris Zemmour', type: 'wilaya' },
    { id: 'trarza', name: 'Trarza', type: 'wilaya' }
  ];

  const timeSlots = [
    { id: 'morning', name: 'Morning', icon: 'Sun', color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { id: 'afternoon', name: 'Afternoon', icon: 'CloudSun', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'evening', name: 'Evening', icon: 'Sunset', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'flexible', name: 'Flexible', icon: 'RotateCcw', color: 'text-blue-600', bgColor: 'bg-blue-50' }
  ];

  const daysOfWeek = [
    { id: 'monday', name: 'Monday' },
    { id: 'tuesday', name: 'Tuesday' },
    { id: 'wednesday', name: 'Wednesday' },
    { id: 'thursday', name: 'Thursday' },
    { id: 'friday', name: 'Friday' },
    { id: 'saturday', name: 'Saturday' },
    { id: 'sunday', name: 'Sunday' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLocationToggle = (location) => {
    setFormData(prev => ({
      ...prev,
      available_locations_data: prev.available_locations_data.some(loc => loc.id === location.id)
        ? prev.available_locations_data.filter(loc => loc.id !== location.id)
        : [...prev.available_locations_data, location]
    }));
  };

  const handleAvailabilityToggle = (day, timeSlot) => {
    setFormData(prev => ({
      ...prev,
      availability_data: {
        ...prev.availability_data,
        [day]: {
          ...prev.availability_data[day],
          [timeSlot]: !prev.availability_data[day]?.[timeSlot]
        }
      }
    }));
  };

  const getSelectedButtonStyle = (slotId) => {
    switch (slotId) {
      case 'morning':
        return 'border-amber-500 bg-amber-500 text-white';
      case 'afternoon':
        return 'border-orange-500 bg-orange-500 text-white';
      case 'evening':
        return 'border-purple-500 bg-purple-500 text-white';
      case 'flexible':
        return 'border-blue-500 bg-blue-500 text-white';
      default:
        return 'border-blue-500 bg-blue-500 text-white';
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.age || formData.age < 16 || formData.age > 100) newErrors.age = 'Age must be between 16 and 100';
      if (!formData.motivation.trim()) newErrors.motivation = 'Motivation is required';
      else if (formData.motivation.trim().length < 20) newErrors.motivation = 'At least 20 characters required';
    }
    
    if (step === 2) {
      if (!formData.skills.trim()) newErrors.skills = 'Skills are required';
      if (!formData.interests.trim()) newErrors.interests = 'Interests are required';
      if (!formData.languages.trim()) newErrors.languages = 'Languages are required';
    }
    
    if (step === 3) {
      if (formData.available_locations_data.length === 0) newErrors.locations = 'Select at least one location';
    }
    
    if (step === 4) {
      const hasAvailability = Object.values(formData.availability_data).some(day => 
        Object.values(day || {}).some(slot => slot === true)
      );
      if (!hasAvailability) newErrors.availability = 'Select at least one availability slot';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      let response;
      
      if (isEditing) {
        response = await updateVolunteerProfile({
          id: profile.id,
          data: formData
        });
      } else {
        response = await createVolunteerProfile(formData);
      }

      // Handle response safely - could be response.data or response itself
      const responseData = response?.data || response;
      onSuccess && onSuccess(responseData);
    } catch (error) {
      console.error('Error submitting volunteer profile:', error);
      setErrors({ 
        general: error.message || 'An error occurred. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-12 h-0.5 mx-2 ${
              step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-blue-600 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
              <p className="text-gray-600">{isEditing ? 'Update your details' : 'Tell us about yourself'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="+222 12345678"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.age ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="25"
                  min="16"
                  max="100"
                />
                {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Profession</label>
                <input
                  type="text"
                  value={formData.profession}
                  onChange={(e) => handleInputChange('profession', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Teacher, Engineer, Student..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Why do you want to volunteer? *</label>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => handleInputChange('motivation', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.motivation ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Tell us about your motivation..."
                  rows="3"
                />
                {errors.motivation && <p className="text-red-500 text-sm mt-1">{errors.motivation}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-purple-600 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Skills & Interests</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills * (comma-separated)</label>
                <textarea
                  value={formData.skills}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.skills ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Programming, Teaching, First Aid..."
                  rows="2"
                />
                {errors.skills && <p className="text-red-500 text-sm mt-1">{errors.skills}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interests * (comma-separated)</label>
                <textarea
                  value={formData.interests}
                  onChange={(e) => handleInputChange('interests', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.interests ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Education, Health, Environment..."
                  rows="2"
                />
                {errors.interests && <p className="text-red-500 text-sm mt-1">{errors.interests}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages * (comma-separated)</label>
                <input
                  type="text"
                  value={formData.languages}
                  onChange={(e) => handleInputChange('languages', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.languages ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Arabic, French, English..."
                />
                {errors.languages && <p className="text-red-500 text-sm mt-1">{errors.languages}</p>}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-green-600 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Locations</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {mauritanianLocations.map(location => (
                <div
                  key={location.id}
                  onClick={() => handleLocationToggle(location)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.available_locations_data.some(loc => loc.id === location.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">{location.name}</div>
                  <div className="text-xs text-gray-500">{location.type}</div>
                </div>
              ))}
            </div>
            {errors.locations && <p className="text-red-500 text-sm">{errors.locations}</p>}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-orange-600 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Availability</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 border-b font-medium">Day</th>
                    {timeSlots.map(slot => {
                      const IconComponent = slot.icon === 'Sun' ? Sun : 
                                           slot.icon === 'CloudSun' ? CloudSun :
                                           slot.icon === 'Sunset' ? Sunset : RotateCcw;
                      
                      return (
                        <th key={slot.id} className={`text-center p-3 border-b font-medium min-w-24 ${slot.bgColor}`}>
                          <div className="flex flex-col items-center">
                            <IconComponent className={`w-5 h-5 mb-1 ${slot.color}`} />
                            <span className="text-xs font-medium text-gray-700">{slot.name}</span>
                            <span className="text-xs text-gray-500">{slot.id === 'morning' ? '8AM-12PM' : 
                                                                   slot.id === 'afternoon' ? '12PM-5PM' :
                                                                   slot.id === 'evening' ? '5PM-8PM' : 'Anytime'}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {daysOfWeek.map(day => (
                    <tr key={day.id}>
                      <td className="p-3 border-b font-medium">{day.name}</td>
                      {timeSlots.map(slot => (
                        <td key={slot.id} className={`p-3 border-b text-center ${slot.bgColor}`}>
                          <button
                            type="button"
                            onClick={() => handleAvailabilityToggle(day.id, slot.id)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              formData.availability_data[day.id]?.[slot.id]
                                ? getSelectedButtonStyle(slot.id)
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {formData.availability_data[day.id]?.[slot.id] && '✓'}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {errors.availability && <p className="text-red-500 text-sm">{errors.availability}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 mb-6">
          <AlertCircle className="text-red-500 w-5 h-5" />
          <span className="text-red-700">{errors.general}</span>
        </div>
      )}

      <StepIndicator />
      {renderStep()}

      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
            currentStep === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        <div className="text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
        </div>

        {currentStep === totalSteps ? (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex items-center px-8 py-3 rounded-lg font-medium text-white transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Join SADA9A
              </>
            )}
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
};

export default VolunteerForm;