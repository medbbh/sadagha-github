import React, { useState, useEffect } from 'react';
import { CheckCircle, Users, Heart } from 'lucide-react';
import VolunteerForm from '../../components/ui/VolunteerForm';
import VolunteerProfileDisplay from '../../components/ui/VolunteerProfileDisplay';
import Loading from '../../components/common/Loading';
import { fetchMyVolunteerProfile, toggleVolunteerProfileStatus } from '../../api/endpoints/VolunteerAPI';

const VolunteerPage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchMyVolunteerProfile();
      
      // Handle the case where no profile exists (404)
      if (response.status === 404 || !response.data) {
        setProfile(null);
      } else {
        setProfile(response.data || response);
      }
    } catch (err) {
      // Only set error for actual errors (not 404)
      if (err.response?.status !== 404) {
        setError(err.message || 'Failed to load profile');
      } else {
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = (data) => {
    setProfile(data);
    setSuccess(true);
    setShowForm(false);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  const handleEdit = () => {
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
  };

  const handleToggleStatus = async () => {
    try {
      const response = await toggleVolunteerProfileStatus();
      const updatedProfile = { ...profile, is_active: !profile.is_active };
      setProfile(updatedProfile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 flex items-center gap-3">
            <CheckCircle className="text-green-600 w-6 h-6" />
            <div>
              <h3 className="text-green-800 font-medium">Profile Updated Successfully!</h3>
              <p className="text-green-700 text-sm">
                Your volunteer profile has been saved. Organizations can now find and contact you for opportunities.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 flex items-center gap-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm">!</span>
            </div>
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {showForm ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile ? 'Edit Volunteer Profile' : 'Create Volunteer Profile'}
              </h2>
              {profile && (
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
            <VolunteerForm 
              onSuccess={handleFormSuccess} 
              profile={profile} 
            />
          </div>
        ) : profile ? (
          <VolunteerProfileDisplay 
            profile={profile} 
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
          />
        ) : (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="text-blue-600 w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Make a Difference?
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Join thousands of volunteers in Mauritania who are helping their communities through SADA9A. 
                Create your volunteer profile to get matched with opportunities that fit your skills and availability.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors transform hover:scale-105"
              >
                <Users className="w-5 h-5 mr-2" />
                Create Volunteer Profile
              </button>
            </div>

            {/* Benefits Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Get Matched</h3>
                <p className="text-gray-600 text-sm">
                  Organizations will find you based on your skills and availability
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Make Impact</h3>
                <p className="text-gray-600 text-sm">
                  Use your skills to help causes you care about in your community
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Flexible Schedule</h3>
                <p className="text-gray-600 text-sm">
                  Volunteer when it works for you with our flexible scheduling system
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerPage;