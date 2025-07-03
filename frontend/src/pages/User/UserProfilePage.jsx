import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, Edit, Save, X, 
  Heart, CreditCard, History, Settings, Shield, Bell, 
  Eye, EyeOff, Lock, Globe, Trash2, Download,
  Star, Award, TrendingUp, DollarSign, Clock,
  Users
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import VolunteerForm from '../../components/ui/VolunteerForm';
import VolunteerProfileDisplay from '../../components/ui/VolunteerProfileDisplay';
import { fetchMyVolunteerProfile, toggleVolunteerProfileStatus } from '../../api/endpoints/VolunteerAPI';

const UserProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Volunteer-specific state
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [volunteerLoading, setVolunteerLoading] = useState(false);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  const [volunteerSuccess, setVolunteerSuccess] = useState(false);
  const [volunteerError, setVolunteerError] = useState(null);
  
  // Mock user data - replace with actual API calls
  const [userData, setUserData] = useState({
    id: 1,
    username: 'mhamed_babah',
    email: 'mhamed.bbh01@gmail.com',
    firstName: "M'Hamed",
    lastName: 'Babah',
    phone: '+222 34503710',
    location: 'Nouakchott, Mauritania',
    joinedDate: '2024-01-15',
    role: 'user',
    isVerified: true,
    avatar: null
  });

  const [volunteerStats, setVolunteerStats] = useState({
    totalHours: 45,
    missionsCompleted: 12,
    rating: 4.8,
    totalImpact: 150
  });

  const [donationHistory, setDonationHistory] = useState([
    {
      id: 1,
      campaignName: 'Help Local Food Bank',
      amount: 500,
      currency: 'MRU',
      date: '2024-02-15',
      status: 'completed',
      receiptUrl: '#'
    },
    {
      id: 2,
      campaignName: 'Education for All',
      amount: 250,
      currency: 'MRU',
      date: '2024-01-28',
      status: 'completed',
      receiptUrl: '#'
    },
    {
      id: 3,
      campaignName: 'Clean Water Initiative',
      amount: 750,
      currency: 'MRU',
      date: '2024-01-10',
      status: 'completed',
      receiptUrl: '#'
    }
  ]);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    volunteerMatching: true,
    profileVisibility: 'public',
    language: 'en',
    currency: 'MRU'
  });

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
    // Load volunteer profile when volunteer tab is accessed
    if (activeTab === 'volunteer') {
      loadVolunteerProfile();
    }
  }, [activeTab]);

  const loadVolunteerProfile = async () => {
    try {
      setVolunteerLoading(true);
      setVolunteerError(null);
      
      const response = await fetchMyVolunteerProfile();
      
      if (response.status === 404 || !response) {
        setVolunteerProfile(null);
      } else {
        setVolunteerProfile(response || response);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setVolunteerError(err.message || 'Failed to load volunteer profile');
      } else {
        setVolunteerProfile(null);
      }
    } finally {
      setVolunteerLoading(false);
    }
  };

  const handleVolunteerFormSuccess = (data) => {
    setVolunteerProfile(data);
    setVolunteerSuccess(true);
    setShowVolunteerForm(false);
    
    setTimeout(() => {
      setVolunteerSuccess(false);
    }, 3000);
  };

  const handleVolunteerEdit = () => {
    setShowVolunteerForm(true);
  };

  const handleVolunteerCancelEdit = () => {
    setShowVolunteerForm(false);
  };

  const handleVolunteerToggleStatus = async () => {
    try {
      const response = await toggleVolunteerProfileStatus();
      const updatedProfile = { ...volunteerProfile, is_active: !volunteerProfile.is_active };
      setVolunteerProfile(updatedProfile);
      setVolunteerSuccess(true);
      setTimeout(() => setVolunteerSuccess(false), 3000);
    } catch (err) {
      setVolunteerError(err.message || 'Failed to update volunteer status');
    }
  };

  const handleSaveProfile = () => {
    // API call to save profile
    setEditMode(false);
    // Show success message
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getTotalDonations = () => {
    return donationHistory.reduce((sum, donation) => sum + donation.amount, 0);
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'volunteer', name: 'Volunteer', icon: Heart },
    { id: 'donations', name: 'Donations', icon: CreditCard },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {userData.firstName[0]}{userData.lastName[0]}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {userData.firstName} {userData.lastName}
                </h1>
                {userData.isVerified && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    <Shield className="w-4 h-4" />
                    Verified
                  </div>
                )}
              </div>
              <p className="text-gray-600 mb-2">@{userData.username}</p>
              <p className="text-sm text-gray-500">
                Member since {new Date(userData.joinedDate).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{getTotalDonations()}</div>
                  <div className="text-xs text-blue-600">MRU Donated</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">{volunteerStats.totalHours}</div>
                  <div className="text-xs text-purple-600">Hours Volunteered</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                    <button
                      onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        editMode 
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {editMode ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      {editMode ? 'Save Changes' : 'Edit Profile'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={userData.firstName}
                        onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                        disabled={!editMode}
                        className={`w-full px-4 py-3 border rounded-lg ${
                          editMode ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={userData.lastName}
                        onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                        disabled={!editMode}
                        className={`w-full px-4 py-3 border rounded-lg ${
                          editMode ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={userData.email}
                          onChange={(e) => setUserData({...userData, email: e.target.value})}
                          disabled={!editMode}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg ${
                            editMode ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={userData.phone}
                          onChange={(e) => setUserData({...userData, phone: e.target.value})}
                          disabled={!editMode}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg ${
                            editMode ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={userData.location}
                          onChange={(e) => setUserData({...userData, location: e.target.value})}
                          disabled={!editMode}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg ${
                            editMode ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="border-t pt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter current password"
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Volunteer Tab */}
              {activeTab === 'volunteer' && (
                <div className="space-y-8">
                  {/* Success Message */}
                  {volunteerSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <div>
                        <h3 className="text-green-800 font-medium">Volunteer Profile Updated!</h3>
                        <p className="text-green-700 text-sm">
                          Your volunteer information has been saved successfully.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {volunteerError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-sm">!</span>
                      </div>
                      <div>
                        <h3 className="text-red-800 font-medium">Error</h3>
                        <p className="text-red-700 text-sm">{volunteerError}</p>
                      </div>
                    </div>
                  )}

                  {volunteerLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loading />
                    </div>
                  ) : showVolunteerForm ? (
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
                  ) : volunteerProfile ? (
                    <div>
                      <VolunteerProfileDisplay 
                        profile={volunteerProfile} 
                        onEdit={handleVolunteerEdit}
                        onToggleStatus={handleVolunteerToggleStatus}
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Direct integration of the original volunteer page content */}
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Join SADA9A Volunteers</h2>
                        <p className="text-gray-600 text-lg">
                          Help make a difference in your community
                        </p>
                      </div>

                      {/* Welcome Section */}
                      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Heart className="text-blue-600 w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          Ready to Make a Difference?
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                          Join thousands of volunteers in Mauritania who are helping their communities through SADA9A. 
                          Create your volunteer profile to get matched with opportunities that fit your skills and availability.
                        </p>
                        <button
                          onClick={() => setShowVolunteerForm(true)}
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
                          <h4 className="font-semibold text-gray-900 mb-2">Get Matched</h4>
                          <p className="text-gray-600 text-sm">
                            Organizations will find you based on your skills and availability
                          </p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Star className="w-6 h-6 text-purple-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Make Impact</h4>
                          <p className="text-gray-600 text-sm">
                            Use your skills to help causes you care about in your community
                          </p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
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
                  )}
                </div>
              )}

              {/* Donations Tab */}
              {activeTab === 'donations' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Donation History</h2>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                      <span className="font-semibold">Total: {getTotalDonations()} MRU</span>
                    </div>
                  </div>

                  {/* Donation Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg p-6 border border-green-200">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-700">{getTotalDonations()}</div>
                        <div className="text-sm text-green-600">Total Donated (MRU)</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-700">{donationHistory.length}</div>
                        <div className="text-sm text-blue-600">Total Donations</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-700">{Math.round(getTotalDonations() / donationHistory.length)}</div>
                        <div className="text-sm text-purple-600">Average (MRU)</div>
                      </div>
                    </div>
                  </div>

                  {/* Donation List */}
                  <div className="space-y-4">
                    {donationHistory.map((donation) => (
                      <div key={donation.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{donation.campaignName}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Amount: {donation.amount} {donation.currency}</span>
                              <span>Date: {new Date(donation.date).toLocaleDateString()}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                donation.status === 'completed' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {donation.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              View Campaign
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>

                  {/* Notifications */}
                  <div className="border-b pb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">Email Notifications</div>
                          <div className="text-sm text-gray-600">Receive updates about campaigns and volunteer opportunities</div>
                        </div>
                        <button
                          onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">Push Notifications</div>
                          <div className="text-sm text-gray-600">Get instant notifications on your device</div>
                        </div>
                        <button
                          onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">Volunteer Matching</div>
                          <div className="text-sm text-gray-600">Allow organizations to find and contact you</div>
                        </div>
                        <button
                          onClick={() => handleSettingChange('volunteerMatching', !settings.volunteerMatching)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.volunteerMatching ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.volunteerMatching ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Privacy & Preferences */}
                  <div className="border-b pb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
                        <select
                          value={settings.profileVisibility}
                          onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="public">Public</option>
                          <option value="organizations">Organizations Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select
                          value={settings.language}
                          onChange={(e) => handleSettingChange('language', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="ar">العربية</option>
                          <option value="fr">Français</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <select
                          value={settings.currency}
                          onChange={(e) => handleSettingChange('currency', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="MRU">MRU - Mauritanian Ouguiya</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-red-900">Delete Account</div>
                          <div className="text-sm text-red-700">Permanently delete your account and all data</div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                          <Trash2 className="w-4 h-4" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;