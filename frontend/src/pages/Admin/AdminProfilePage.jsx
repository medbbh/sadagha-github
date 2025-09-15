import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Crown,
  Mail,
  Phone,
  Edit,
  Save,
  Eye,
  EyeOff,
  Lock,
  Key,
  AlertCircle,
  Check,
  Calendar,
  Activity,
  Shield,
  AlertTriangle
} from 'lucide-react';
import Loading from '../../components/common/Loading';
// import { fetchAdminProfile, updateAdminProfile } from '../../api/endpoints/';
import { fetchUserProfile, updateUserProfile } from '../../api/endpoints/UserAPI';

import { changePassword, sendPasswordResetEmail, getUserAuthMethod, setPasswordForOAuthUser } from '../../api/endpoints/AuthAPI';

const AdminProfilePage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  // Admin data state
  const [adminData, setAdminData] = useState({
    id: null,
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: '',
    permissions: [],
    lastLogin: null,
    createdAt: null,
    twoFactorEnabled: false
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // Auth method state
  const [authMethod, setAuthMethod] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Password management state
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordAction, setPasswordAction] = useState('change'); // 'change' or 'set'

  // Format numbers - always use Latin numerals
  const formatNumber = (num) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale).format(num || 0);
  };

  // Format date with proper locale
  const formatDate = (dateString) => {
    if (!dateString) return t('profileTab.notAvailable');
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch admin profile data
  useEffect(() => {
    const loadAdminProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);
        
        const data = await fetchUserProfile();
        
        // Set admin data
        setAdminData({
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          phoneNumber: data.phone_number || '',
          role: data.role || 'admin',
          department: data.department || '',
          permissions: data.permissions || [],
          lastLogin: data.last_login,
          createdAt: data.created_at,
          twoFactorEnabled: data.two_factor_enabled || false
        });
        
      } catch (error) {
        setProfileError(error.message || t('profileTab.errors.failedToLoad'));
      } finally {
        setProfileLoading(false);
      }
    };

    loadAdminProfile();
  }, [t]);

  // Check user's authentication method on component mount
  useEffect(() => {
    const checkAuthMethod = async () => {
      try {
        const method = await getUserAuthMethod();
        setAuthMethod(method);
      } catch (error) {
        console.error('Error checking auth method:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuthMethod();
  }, []);


  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // Profile save handler
  const handleSaveProfile = async () => {
    try {
      const profileData = {
        first_name: adminData.firstName,
        last_name: adminData.lastName,
        email: adminData.email,
        phone_number: adminData.phoneNumber || '',
        department: adminData.department || ''
      };
      
      const updatedData = await updateUserProfile(profileData);
      
      // Update local state with response
      setAdminData(prev => ({
        ...prev,
        firstName: updatedData.first_name,
        lastName: updatedData.last_name,
        email: updatedData.email,
        phoneNumber: updatedData.phone_number || '',
        department: updatedData.department || ''
      }));
      
      setEditMode(false);
      setPasswordMessage({ type: 'success', text: t('profileTab.messages.updateSuccess') });
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
      
    } catch (error) {
      console.error('Error saving admin profile:', error);
      setPasswordMessage({ type: 'error', text: error.message || t('profileTab.errors.failedToSave') });
    }
  };

  // Password change handler
  const handlePasswordAction = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('profileTab.security.errors.passwordMismatch') });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: t('profileTab.security.errors.passwordTooShort') });
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordMessage({ type: '', text: '' });

      if (passwordAction === 'set') {
        // Setting password for OAuth user
        await setPasswordForOAuthUser(passwordData.newPassword);
        setPasswordMessage({ type: 'success', text: t('profileTab.security.messages.passwordSetSuccess') });
        
        // Update auth method state
        setAuthMethod(prev => ({ ...prev, hasPassword: true, isOAuthOnly: false }));
      } else {
        // Changing existing password
        await changePassword(passwordData.currentPassword, passwordData.newPassword);
        setPasswordMessage({ type: 'success', text: t('profileTab.security.messages.passwordUpdateSuccess') });
      }
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      
    } catch (error) {
      if (error.message === 'PASSWORD_NOT_AVAILABLE') {
        setPasswordMessage({ type: 'error', text: t('profileTab.security.errors.passwordNotAvailable') });
      } else if (error.message.includes('Current password is incorrect')) {
        setPasswordMessage({ type: 'error', text: t('profileTab.security.errors.currentPasswordIncorrect') });
      } else {
        setPasswordMessage({ type: 'error', text: error.message || t('profileTab.security.errors.updateFailed') });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    try {
      setPasswordLoading(true);
      setPasswordMessage({ type: '', text: '' });

      await sendPasswordResetEmail();
      setPasswordMessage({ type: 'success', text: t('profileTab.security.messages.resetEmailSent') });
      
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message || t('profileTab.security.errors.resetEmailFailed') });
    } finally {
      setPasswordLoading(false);
    }
  };

  const renderSecuritySection = () => {
    if (authLoading) {
      return <div className="text-gray-500">{t('profileTab.security.loadingOptions')}</div>;
    }

    return (
      <div className="space-y-4">
        {/* Auth Method Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">{t('profileTab.security.accountType')}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {authMethod?.isOAuthOnly ? (
              <>
                <Shield className="w-4 h-4 text-blue-500" />
                <span>{t('profileTab.security.signedInWith', { provider: authMethod.primaryProvider || 'OAuth provider' })}</span>
                <span className="ms-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {t('profileTab.security.passwordManagedViaEmail')}
                </span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4 text-green-500" />
                <span>{t('profileTab.security.emailPasswordAccount')}</span>
              </>
            )}
          </div>
        </div>

        {/* Password Message */}
        {passwordMessage.text && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            passwordMessage.type === 'success' ? 'bg-green-50 border border-green-200' :
            passwordMessage.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            {passwordMessage.type === 'success' && <Check className="w-5 h-5 text-green-600" />}
            {passwordMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
            {passwordMessage.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600" />}
            <span className={`text-sm ${
              passwordMessage.type === 'success' ? 'text-green-800' :
              passwordMessage.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {passwordMessage.text}
            </span>
          </div>
        )}

        {!showPasswordForm ? (
          <div className="flex gap-3 flex-wrap">
            {authMethod?.hasPassword && (
              <button 
                onClick={() => {
                  setPasswordAction('change');
                  setShowPasswordForm(true);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {t('profileTab.security.changePassword')}
              </button>
            )}

            <button 
              onClick={handleSendResetEmail}
              disabled={passwordLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {passwordLoading ? t('profileTab.security.sending') : 
               authMethod?.isOAuthOnly ? t('profileTab.security.actions.setResetViaEmail') : t('profileTab.security.resetViaEmail')}
            </button>
          </div>
        ) : (
          <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
            <h4 className="font-medium text-gray-900">{t('profileTab.security.changePasswordTitle')}</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profileTab.security.currentPassword')}</label>
              <div className="relative">
                <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-5 h-5 text-gray-400`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  placeholder={t('profileTab.security.currentPasswordPlaceholder')}
                  className={`w-full ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-3 text-gray-400 hover:text-gray-600`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profileTab.security.newPassword')}</label>
              <div className="relative">
                <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-5 h-5 text-gray-400`} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder={t('profileTab.security.newPasswordPlaceholder')}
                  className={`w-full ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-3 text-gray-400 hover:text-gray-600`}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profileTab.security.confirmPassword')}</label>
              <div className="relative">
                <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-5 h-5 text-gray-400`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder={t('profileTab.security.confirmPasswordPlaceholder')}
                  className={`w-full ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-3 text-gray-400 hover:text-gray-600`}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handlePasswordAction}
                disabled={passwordLoading || !passwordData.newPassword || !passwordData.confirmPassword || !passwordData.currentPassword}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? t('profileTab.security.updating') : t('profileTab.security.updatePassword')}
              </button>
              <button 
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordMessage({ type: '', text: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                {t('profileTab.actions.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Handle profile error
  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold text-red-400 mb-2">{t('profileTab.errors.errorLoadingTitle')}</h2>
          <p className="text-gray-300">{profileError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('profileTab.errors.retry')}
          </button>
        </div>
      </div>
    );
  }

return (
  <div className="min-h-screen bg-gray-100 py-8 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
    <div className="max-w-5xl mx-auto">
      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {t('profileTab.title')}
            </h2>
            <button
              onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
                editMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {editMode ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              {editMode
                ? t('profileTab.actions.saveChanges')
                : t('profileTab.actions.editProfile')}
            </button>
          </div>

          {/* Message */}
          {passwordMessage.text && (
            <div
              className={`p-4 rounded-md flex items-center gap-3 border text-sm ${
                passwordMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {passwordMessage.type === 'success' ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profileTab.fields.firstName')}
              </label>
              <input
                type="text"
                value={adminData.firstName}
                onChange={(e) => setAdminData({ ...adminData, firstName: e.target.value })}
                disabled={!editMode}
                className={`w-full px-4 py-3 border rounded-md ${
                  editMode
                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profileTab.fields.lastName')}
              </label>
              <input
                type="text"
                value={adminData.lastName}
                onChange={(e) => setAdminData({ ...adminData, lastName: e.target.value })}
                disabled={!editMode}
                className={`w-full px-4 py-3 border rounded-md ${
                  editMode
                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profileTab.fields.email')}
              </label>
              <div className="relative">
                <Mail
                  className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-5 h-5 text-gray-400`}
                />
                <input
                  type="email"
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  disabled={!editMode}
                  className={`w-full ${
                    isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
                  } py-3 border rounded-md ${
                    editMode
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profileTab.fields.phoneNumber')}
              </label>
              <div className="flex">
                <span
                  className={`inline-flex items-center px-3 whitespace-nowrap border border-gray-300 bg-gray-50 text-gray-500 text-sm ${
                    isRTL ? 'rounded-r-md border-l-0' : 'rounded-l-md border-r-0'
                  }`}
                >
                  +222
                </span>
                <input
                  type="tel"
                  dir="ltr"
                  value={adminData.phoneNumber || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setAdminData({ ...adminData, phoneNumber: value });
                  }}
                  disabled={!editMode}
                  placeholder="34503710"
                  maxLength="8"
                  className={`w-full ps-3 pe-4 py-3 border text-left ${
                    isRTL ? 'rounded-l-md' : 'rounded-r-md'
                  } ${
                    editMode
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('profileTab.fields.phoneHelp')}
              </p>
            </div>

          </div>

          {/* Permissions */}
          {adminData.permissions?.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('profileTab.permissions.title')}
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h4 className="font-medium text-amber-800">
                    {t('profileTab.permissions.current')}
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {adminData.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                    >
                      {permission
                        .replace('_', ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-amber-700 mt-2">
                  {t('profileTab.permissions.contactSuperAdmin')}
                </p>
              </div>
            </div>
          )}

          {/* Security Section */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('profileTab.security.title')}
            </h3>
            {renderSecuritySection()}
          </div>
        </div>
      </div>
    </div>
  </div>
);

};

export default AdminProfilePage;