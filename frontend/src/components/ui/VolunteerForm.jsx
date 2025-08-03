import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Phone, MapPin, Clock, Star, Heart, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Sun, CloudSun, Sunset, RotateCcw } from 'lucide-react';
import { createVolunteerProfile, updateVolunteerProfile } from '../../api/endpoints/VolunteerAPI';

const VolunteerForm = ({ onSuccess, profile = null }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

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

  // Format numbers - always use Latin numerals even for Arabic
  const formatNumber = (num) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale).format(num || 0);
  };

  const mauritanianLocations = [
    { id: 'nouakchott', name: t('volunteerForm.locations.nouakchott'), type: t('volunteerForm.locationTypes.capitale') },
    { id: 'adrar', name: t('volunteerForm.locations.adrar'), type: t('volunteerForm.locationTypes.wilaya') },
    { id: 'assaba', name: t('volunteerForm.locations.assaba'), type: t('volunteerForm.locationTypes.wilaya') },
    { id: 'brakna', name: t('volunteerForm.locations.brakna'), type: t('volunteerForm.locationTypes.wilaya') },
    { id: 'dakhlet_nouadhibou', name: t('volunteerForm.locations.dakhletNouadhibou'), type: t('volunteerForm.locationTypes.wilaya') },
    { id: 'gorgol', name: t('volunteerForm.locations.gorgol'), type: t('volunteerForm.locationTypes.wilaya') },
    { id: 'guidimaka', name: t('volunteerForm.locations.guidimaka'), type: t('volunteerForm.locationTypes.wilaya') },
    { id: 'hodh_ech_chargui', name: t('volunteerForm.locations.hodhEchChargui'), type: t('volunteerForm.locationTypes.wilaya') },
    { id: 'hodh_el_gharbi', name: t('volunteerForm.locations.hodhElGharbi'), type: t('volunteerForm.locationTypes.wilaya') },
    { id: 'inchiri', name: t('volunteerForm.locations.inchiri'), type: t('volunteerForm.locationTypes.wilaya') },
    { id: 'tagant', name: t('volunteerForm.locations.tagant'), type: t('volunteerForm.locationTypes.wilaya') },
    { id: 'tiris_zemmour', name: t('volunteerForm.locations.tirisZemmour'), type: t('volunteerForm.locationTypes.wilaya') },
    { id: 'trarza', name: t('volunteerForm.locations.trarza'), type: t('volunteerForm.locationTypes.wilaya') }
  ];

  const timeSlots = [
    { id: 'morning', name: t('volunteerForm.timeSlots.morning'), icon: 'Sun', color: 'text-amber-600', bgColor: 'bg-amber-50', time: '8AM-12PM' },
    { id: 'afternoon', name: t('volunteerForm.timeSlots.afternoon'), icon: 'CloudSun', color: 'text-orange-600', bgColor: 'bg-orange-50', time: '12PM-5PM' },
    { id: 'evening', name: t('volunteerForm.timeSlots.evening'), icon: 'Sunset', color: 'text-purple-600', bgColor: 'bg-purple-50', time: '5PM-8PM' },
    { id: 'flexible', name: t('volunteerForm.timeSlots.flexible'), icon: 'RotateCcw', color: 'text-blue-600', bgColor: 'bg-blue-50', time: t('volunteerForm.timeSlots.anytime') }
  ];

  const daysOfWeek = [
    { id: 'monday', name: t('volunteerForm.days.monday') },
    { id: 'tuesday', name: t('volunteerForm.days.tuesday') },
    { id: 'wednesday', name: t('volunteerForm.days.wednesday') },
    { id: 'thursday', name: t('volunteerForm.days.thursday') },
    { id: 'friday', name: t('volunteerForm.days.friday') },
    { id: 'saturday', name: t('volunteerForm.days.saturday') },
    { id: 'sunday', name: t('volunteerForm.days.sunday') }
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
      if (!formData.phone.trim()) newErrors.phone = t('volunteerForm.validation.phoneRequired');
      if (!formData.age || formData.age < 16 || formData.age > 100) newErrors.age = t('volunteerForm.validation.ageRange');
      if (!formData.motivation.trim()) newErrors.motivation = t('volunteerForm.validation.motivationRequired');
      else if (formData.motivation.trim().length < 20) newErrors.motivation = t('volunteerForm.validation.motivationMinLength');
    }
    
    if (step === 2) {
      if (!formData.skills.trim()) newErrors.skills = t('volunteerForm.validation.skillsRequired');
      if (!formData.interests.trim()) newErrors.interests = t('volunteerForm.validation.interestsRequired');
      if (!formData.languages.trim()) newErrors.languages = t('volunteerForm.validation.languagesRequired');
    }
    
    if (step === 3) {
      if (formData.available_locations_data.length === 0) newErrors.locations = t('volunteerForm.validation.locationsRequired');
    }
    
    if (step === 4) {
      const hasAvailability = Object.values(formData.availability_data).some(day => 
        Object.values(day || {}).some(slot => slot === true)
      );
      if (!hasAvailability) newErrors.availability = t('volunteerForm.validation.availabilityRequired');
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
        general: error.message || t('volunteerForm.errors.general')
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
            {formatNumber(step)}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('volunteerForm.steps.step1.title')}</h2>
              <p className="text-gray-600">{isEditing ? t('volunteerForm.steps.step1.editSubtitle') : t('volunteerForm.steps.step1.createSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('volunteerForm.fields.phone')} *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('volunteerForm.fields.age')} *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('volunteerForm.fields.profession')}</label>
                <input
                  type="text"
                  value={formData.profession}
                  onChange={(e) => handleInputChange('profession', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t('volunteerForm.placeholders.profession')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('volunteerForm.fields.motivation')} *</label>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => handleInputChange('motivation', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.motivation ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={t('volunteerForm.placeholders.motivation')}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('volunteerForm.steps.step2.title')}</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('volunteerForm.fields.skills')} * ({t('volunteerForm.commaSeparated')})</label>
                <textarea
                  value={formData.skills}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.skills ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={t('volunteerForm.placeholders.skills')}
                  rows="2"
                />
                {errors.skills && <p className="text-red-500 text-sm mt-1">{errors.skills}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('volunteerForm.fields.interests')} * ({t('volunteerForm.commaSeparated')})</label>
                <textarea
                  value={formData.interests}
                  onChange={(e) => handleInputChange('interests', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.interests ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={t('volunteerForm.placeholders.interests')}
                  rows="2"
                />
                {errors.interests && <p className="text-red-500 text-sm mt-1">{errors.interests}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('volunteerForm.fields.languages')} * ({t('volunteerForm.commaSeparated')})</label>
                <input
                  type="text"
                  value={formData.languages}
                  onChange={(e) => handleInputChange('languages', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.languages ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={t('volunteerForm.placeholders.languages')}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('volunteerForm.steps.step3.title')}</h2>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('volunteerForm.steps.step4.title')}</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`${isRTL ? 'text-right' : 'text-left'} p-3 border-b font-medium`}>{t('volunteerForm.availability.day')}</th>
                    {timeSlots.map(slot => {
                      const IconComponent = slot.icon === 'Sun' ? Sun : 
                                           slot.icon === 'CloudSun' ? CloudSun :
                                           slot.icon === 'Sunset' ? Sunset : RotateCcw;
                      
                      return (
                        <th key={slot.id} className={`text-center p-3 border-b font-medium min-w-24 ${slot.bgColor}`}>
                          <div className="flex flex-col items-center">
                            <IconComponent className={`w-5 h-5 mb-1 ${slot.color}`} />
                            <span className="text-xs font-medium text-gray-700">{slot.name}</span>
                            <span className="text-xs text-gray-500">{slot.time}</span>
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
    <div className="bg-white rounded-xl shadow-lg p-8" dir={isRTL ? 'rtl' : 'ltr'}>
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
          <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180 ms-2' : 'me-2'}`} />
          {t('volunteerForm.navigation.previous')}
        </button>

        <div className="text-sm text-gray-500">
          {t('volunteerForm.navigation.stepOf', { current: formatNumber(currentStep), total: formatNumber(totalSteps) })}
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white me-2"></div>
                {t('volunteerForm.navigation.creating')}
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 me-2" />
                {t('volunteerForm.navigation.joinSada9a')}
              </>
            )}
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            {t('volunteerForm.navigation.next')}
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180 me-2' : 'ms-2'}`} />
          </button>
        )}
      </div>
    </div>
  );
};

export default VolunteerForm;