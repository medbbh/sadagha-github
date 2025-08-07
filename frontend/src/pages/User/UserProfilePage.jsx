import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, CreditCard, Settings, Shield, Heart
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import { fetchMyVolunteerProfile, toggleVolunteerProfileStatus } from '../../api/endpoints/VolunteerAPI';
import ProfileTab from '../../components/ui/ProfileTab';
import VolunteerTab from '../../components/ui/VolunteerTab';
import DonationsTab from '../../components/ui/DonationsTab';
import SettingsTab from '../../components/ui/SettingsTab';
import { fetchUserProfile, updateUserProfile } from '../../api/endpoints/UserAPI';
import { useSearchParams } from 'react-router-dom';

const UserProfilePage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  // Volunteer-specific state
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [volunteerLoading, setVolunteerLoading] = useState(false);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  const [volunteerSuccess, setVolunteerSuccess] = useState(false);
  const [volunteerError, setVolunteerError] = useState(null);
  
  const [userData, setUserData] = useState({
    id: null,
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'user'
  });

  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

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

  // Format numbers - always use Latin numerals even for Arabic
  const formatNumber = (num) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale).format(num || 0);
  };

  // Format date with proper locale
  const formatDate = (dateString) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);
        
        const data = await fetchUserProfile();
        
        // Set user data
        setUserData({
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          phoneNumber: data.phone_number || '', // Handle optional phone number
          role: data.role || 'user'
        });
        
        // Set profile data for other tabs
        setProfileData(data);
        
        // Set donations
        if (data.donations) {
          const formattedDonations = data.donations.map(donation => ({
            id: donation.id,
            campaignId: donation.campaign_id,
            campaignName: donation.campaign_name, // Fixed typo
            amount: parseFloat(donation.amount),
            currency: donation.currency,
            date: donation.created_at,
            status: donation.status,
            isAnonymous: donation.is_anonymous
          }));
          setDonationHistory(formattedDonations);
        }
        
        // Set volunteer profile if exists
        if (data.volunteer_profile) {
          setVolunteerProfile(data.volunteer_profile);
        }
        
      } catch (error) {
        setProfileError(error.message || t('profile.errors.failedToLoad'));
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [t]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
    // Load volunteer profile when volunteer tab is accessed
    if (activeTab === 'volunteer') {
      loadVolunteerProfile();
    }
  }, [activeTab]);

  // Volunteer Profile Functions
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
        setVolunteerError(err.message || t('profile.volunteer.errors.failedToLoad'));
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
      setVolunteerError(err.message || t('profile.volunteer.errors.failedToUpdateStatus'));
    }
  };

  // Profile Functions
  const handleSaveProfile = async () => {
    try {
      const profileData = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        phone_number: userData.phoneNumber || '', // Handle optional phone number
      };
      
      const updatedData = await updateUserProfile(profileData);
      
      // Update local state with response
      setUserData(prev => ({
        ...prev,
        firstName: updatedData.first_name,
        lastName: updatedData.last_name,
        email: updatedData.email,
        phoneNumber: updatedData.phone_number || '' // Handle optional phone number
      }));
      
      setEditMode(false);
      // You can add a success message here
      
    } catch (error) {
      console.error('Error saving profile:', error);
      // Handle error - show error message to user
      alert(t('profile.errors.failedToSave'));
    }
  };

  // Settings Functions
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Helper Functions
  const getTotalDonations = () => {
    return donationHistory.reduce((sum, donation) => sum + donation.amount, 0);
  };

  const tabs = [
    { id: 'profile', name: t('profile.tabs.profile'), icon: User },
    { id: 'volunteer', name: t('profile.tabs.volunteer'), icon: Heart },
    { id: 'donations', name: t('profile.tabs.donations'), icon: CreditCard },
    { id: 'settings', name: t('profile.tabs.settings'), icon: Settings }
  ];

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Handle profile error
  if (profileError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">{t('profile.errors.errorLoadingTitle')}</h2>
          <p className="text-gray-600">{profileError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('profile.errors.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 py-8 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className={`flex items-center gap-6 `}>
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {userData.firstName?.[0] || ''}{userData.lastName?.[0] || ''}
              </span>
            </div>
            <div className="flex-1">
              <div className={`flex items-center gap-3 mb-2 `}>
                <h1 className="text-3xl font-bold text-gray-900">
                  {userData.firstName} {userData.lastName}
                </h1>
              </div>
              <p className={`text-gray-600 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>@{userData.email}</p>
              <p className={`text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('profile.header.memberSince')} {profileData?.created_at ? formatDate(profileData.created_at) : t('profile.header.notAvailable')}
              </p>
            </div>
            <div className={`text-${isRTL ? 'left' : 'right'}`}>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(profileData?.statistics?.total_donated || 0)}
                  </div>
                  <div className="text-xs text-blue-600">{t('profile.header.mruDonated')}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(profileData?.statistics?.campaigns_supported || 0)}
                  </div>
                  <div className="text-xs text-purple-600">{t('profile.header.campaignsSupported')}</div>
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
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isRTL ? ' text-right' : 'text-left'} ${
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
                <ProfileTab 
                  userData={userData}
                  setUserData={setUserData}
                  editMode={editMode}
                  setEditMode={setEditMode}
                  handleSaveProfile={handleSaveProfile}
                />
              )}

              {/* Volunteer Tab */}
              {activeTab === 'volunteer' && (
                <VolunteerTab
                  volunteerProfile={volunteerProfile}
                  volunteerLoading={volunteerLoading}
                  showVolunteerForm={showVolunteerForm}
                  setShowVolunteerForm={setShowVolunteerForm}
                  volunteerSuccess={volunteerSuccess}
                  volunteerError={volunteerError}
                  handleVolunteerFormSuccess={handleVolunteerFormSuccess}
                  handleVolunteerEdit={handleVolunteerEdit}
                  handleVolunteerCancelEdit={handleVolunteerCancelEdit}
                  handleVolunteerToggleStatus={handleVolunteerToggleStatus}
                />
              )}

              {/* Donations Tab */}
              {activeTab === 'donations' && (
                <DonationsTab 
                  donationHistory={donationHistory}
                  getTotalDonations={getTotalDonations}
                />
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <SettingsTab 
                  settings={settings}
                  handleSettingChange={handleSettingChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;