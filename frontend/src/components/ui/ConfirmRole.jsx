import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Loading from '../common/Loading';
import { UserCircle, Building2, Check } from 'lucide-react';

const ConfirmRole = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const { 
    user, 
    registerDjangoUser, 
    isFullyAuthenticated, 
    needsRegistration, 
    loading,
    getUserRole,
    startRoleSelection,
    completeRoleSelection
  } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState('user');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🎯 ConfirmRole effect:', {
      hasUser: !!user,
      isFullyAuthenticated: isFullyAuthenticated(),
      needsRegistration: needsRegistration(),
      loading,
      currentRole: getUserRole()
    });

    // If user is fully authenticated, redirect based on role
    if (isFullyAuthenticated()) {
      const role = getUserRole();
      console.log('✅ User fully authenticated, redirecting based on role:', role);
      
      if (role === 'organization') {
        navigate('/organization', { replace: true });
      } else {
        navigate('/feed', { replace: true });
      }
    }
    // If user is not logged in to Supabase, redirect to login
    else if (!loading && !user) {
      console.log('❌ No user, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [isFullyAuthenticated, user, loading, navigate, getUserRole, needsRegistration]);

  const handleRoleSelection = async () => {
    if (!user) {
      setError(t('auth.confirmRole.errors.loginFirst'));
      return;
    }

    console.log('📝 Starting role selection for:', selectedRole);
    setIsRegistering(true);
    setError('');

    try {
      await registerDjangoUser(selectedRole);
      console.log('✅ Registration completed, should redirect automatically');
      
      // Mark role selection as complete
      completeRoleSelection();
      
      // The useEffect will handle navigation once isFullyAuthenticated becomes true
    } catch (err) {
      console.error('❌ Registration failed:', err);
      setError(err.message.includes('already') 
        ? t('auth.confirmRole.errors.alreadyRegistered')
        : err.message || t('auth.confirmRole.errors.registrationFailed'));
      setIsRegistering(false);
    }
  };

  // Show loading while checking authentication status
  if (loading) {
    console.log('⏳ ConfirmRole showing loading');
    return <Loading />;
  }

  // Don't show role selection if user is already registered or not logged in
  if (!needsRegistration()) {
    console.log('🔄 ConfirmRole - user doesn\'t need registration, showing loading');
    return <Loading />;
  }

  // Mark that user is actively selecting a role
  React.useEffect(() => {
    startRoleSelection();
    return () => completeRoleSelection();
  }, [startRoleSelection, completeRoleSelection]);

  console.log('📋 ConfirmRole - showing role selection form');

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.confirmRole.title')}
          </h2>
          <p className="text-gray-600">
            {t('auth.confirmRole.welcome')} {user?.email}! {t('auth.confirmRole.selectAccount')}
          </p>
        </div>
        
        {/* Role Selection */}
        <div className="space-y-4 mb-6">
          <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedRole === 'user' 
              ? 'border-blue-600 bg-blue-50' 
              : 'border-gray-300 hover:bg-gray-50'
          } ${isRegistering ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="radio"
              name="role"
              value="user"
              checked={selectedRole === 'user'}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={`${isRTL ? 'ml-3' : 'mr-3'}`}
              disabled={isRegistering}
            />
            <UserCircle className={`h-6 w-6 text-blue-600 flex-shrink-0 ${isRTL ? 'ml-3' : 'mr-3'}`} />
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <div className="font-medium text-gray-900">
                {t('auth.confirmRole.roles.user.title')}
              </div>
              <div className="text-sm text-gray-500">
                {t('auth.confirmRole.roles.user.description')}
              </div>
            </div>
          </label>
          
          <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedRole === 'organization' 
              ? 'border-blue-600 bg-blue-50' 
              : 'border-gray-300 hover:bg-gray-50'
          } ${isRegistering ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="radio"
              name="role"
              value="organization"
              checked={selectedRole === 'organization'}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={`${isRTL ? 'ml-3' : 'mr-3'}`}
              disabled={isRegistering}
            />
            <Building2 className={`h-6 w-6 text-blue-600 flex-shrink-0 ${isRTL ? 'ml-3' : 'mr-3'}`} />
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <div className="font-medium text-gray-900">
                {t('auth.confirmRole.roles.organization.title')}
              </div>
              <div className="text-sm text-gray-500">
                {t('auth.confirmRole.roles.organization.description')}
              </div>
            </div>
          </label>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Submit Button */}
        <button
          onClick={handleRoleSelection}
          disabled={isRegistering}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRegistering ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('auth.confirmRole.settingUp')}
            </div>
          ) : (
            t('auth.confirmRole.continue')
          )}
        </button>
      </div>
    </div>
  );
};

export default ConfirmRole;