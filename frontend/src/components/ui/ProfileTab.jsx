import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, MapPin, Edit, Save, Eye, EyeOff, Lock, Shield, Check, Key, AlertCircle } from 'lucide-react';
import { changePassword, sendPasswordResetEmail, getUserAuthMethod, setPasswordForOAuthUser } from '../../api/endpoints/AuthAPI';

const ProfileTab = ({ userData, setUserData, editMode, setEditMode, handleSaveProfile }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Auth method state
  const [authMethod, setAuthMethod] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordAction, setPasswordAction] = useState('change'); // 'change' or 'set'

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
          <h4 className="font-medium text-gray-900 mb-2">{t('profileTab.security.accountType')} </h4>
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
              // Only show change password for users with existing passwords
              <button 
                onClick={() => {
                  setPasswordAction('change');
                  setShowPasswordForm(true);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {t('profileTab.security.actions.changePassword')}
              </button>
            )}

            {/* Email reset option for all users */}
            <button 
              onClick={handleSendResetEmail}
              disabled={passwordLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {passwordLoading ? t('profileTab.security.actions.sending') : 
               authMethod?.isOAuthOnly ? t('profileTab.security.actions.setResetViaEmail') : t('profileTab.security.actions.resetViaEmail')}
            </button>
          </div>
        ) : (
          <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
            <h4 className="font-medium text-gray-900">{t('profileTab.security.changePasswordTitle')}</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profileTab.security.fields.currentPassword')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  placeholder={t('profileTab.security.placeholders.currentPassword')}
                  className="w-full ps-10 pe-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profileTab.security.fields.newPassword')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder={t('profileTab.security.placeholders.newPassword')}
                  className="w-full ps-10 pe-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute end-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profileTab.security.fields.confirmPassword')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder={t('profileTab.security.placeholders.confirmPassword')}
                  className="w-full ps-10 pe-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute end-3 top-3 text-gray-400 hover:text-gray-600"
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
                {passwordLoading ? t('profileTab.security.actions.updating') : t('profileTab.security.actions.updatePassword')}
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

  return (
    <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('profileTab.title')}</h2>
        <button
          onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            editMode 
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {editMode ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          {editMode ? t('profileTab.actions.saveChanges') : t('profileTab.actions.editProfile')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('profileTab.fields.firstName')}</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('profileTab.fields.lastName')}</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('profileTab.fields.email')}</label>
          <div className="relative">
            <Mail className="absolute start-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={userData.email}
              onChange={(e) => setUserData({...userData, email: e.target.value})}
              disabled={!editMode}
              className={`w-full ps-10 pe-4 py-3 border rounded-lg ${
                editMode ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50'
              }`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('profileTab.fields.phoneNumber')}</label>
          <div className="relative">
            <div className="flex">
              <span className={`inline-flex items-center px-3 whitespace-nowrap ${
                isRTL ? 'rounded-r-lg border-l-0' : 'rounded-l-lg border-r-0'
              } border border-gray-300 bg-gray-50 text-gray-500 text-sm`}>
                +222
              </span>

              <input
                type="tel"
                dir="ltr" // 👈 Force input and placeholder to behave left-to-right
                value={userData.phoneNumber || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setUserData({ ...userData, phoneNumber: value });
                }}
                disabled={!editMode}
                placeholder="34503710"
                maxLength="8"
                className={`w-full ps-3 pe-4 py-3 border text-left ${
                  isRTL ? 'rounded-l-lg' : 'rounded-r-lg'
                } ${editMode ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50'}`}
              />

            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{t('profileTab.fields.phoneHelp')}</p>
        </div>
      </div>

      {/* Security Section */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profileTab.security.title')}</h3>
        {renderSecuritySection()}
      </div>
    </div>
  );
};

export default ProfileTab;