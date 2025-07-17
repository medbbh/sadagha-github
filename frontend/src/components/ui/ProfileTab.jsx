import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Edit, Save, Eye, EyeOff, Lock, Shield, Check } from 'lucide-react';
import { changePassword, sendPasswordResetEmail, getUserAuthMethod, setPasswordForOAuthUser } from '../../api/endpoints/AuthAPI';

const ProfileTab = ({ userData, setUserData, editMode, setEditMode, handleSaveProfile }) => {
  
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
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordMessage({ type: '', text: '' });

      if (passwordAction === 'set') {
        // Setting password for OAuth user
        await setPasswordForOAuthUser(passwordData.newPassword);
        setPasswordMessage({ type: 'success', text: 'Password set successfully! You can now sign in with email and password.' });
        
        // Update auth method state
        setAuthMethod(prev => ({ ...prev, hasPassword: true, isOAuthOnly: false }));
      } else {
        // Changing existing password
        await changePassword(passwordData.currentPassword, passwordData.newPassword);
        setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
      }
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      
    } catch (error) {
      if (error.message === 'PASSWORD_NOT_AVAILABLE') {
        setPasswordMessage({ type: 'error', text: 'Password change not available for OAuth accounts.' });
      } else if (error.message.includes('Current password is incorrect')) {
        setPasswordMessage({ type: 'error', text: 'Current password is incorrect' });
      } else {
        setPasswordMessage({ type: 'error', text: error.message || 'Failed to update password' });
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
      setPasswordMessage({ type: 'success', text: 'Password reset email sent! Check your inbox.' });
      
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message || 'Failed to send reset email' });
    } finally {
      setPasswordLoading(false);
    }
  };

// In ProfileTab.jsx, update the renderSecuritySection function:

const renderSecuritySection = () => {
  if (authLoading) {
    return <div className="text-gray-500">Loading security options...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Auth Method Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Account Type</h4>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {authMethod?.isOAuthOnly ? (
            <>
              <Shield className="w-4 h-4 text-blue-500" />
              <span>Signed in with {authMethod.primaryProvider || 'OAuth provider'}</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                Password managed via email
              </span>
            </>
          ) : (
            <>
              <Key className="w-4 h-4 text-green-500" />
              <span>Email and password account</span>
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
              Change Password
            </button>
          )}

          {/* Email reset option for all users */}
          <button 
            onClick={handleSendResetEmail}
            disabled={passwordLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {passwordLoading ? 'Sending...' : 
             authMethod?.isOAuthOnly ? 'Set/Reset Password via Email' : 'Reset Password via Email'}
          </button>
        </div>
      ) : (
        <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
          <h4 className="font-medium text-gray-900">Change Password</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                placeholder="Enter new password"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
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
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
            <button 
              onClick={() => {
                setShowPasswordForm(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordMessage({ type: '', text: '' });
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

  return (
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <div className="relative">
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                +222
              </span>
              <input
                type="tel"
                value={userData.phoneNumber || ''}
                onChange={(e) => {
                  // Only allow digits and limit to 8 characters
                  const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setUserData({...userData, phoneNumber: value});
                }}
                disabled={!editMode}
                placeholder="12345678"
                className={`w-full pl-10 pr-4 py-3 border rounded-r-lg ${
                  editMode ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50'
                }`}
                maxLength="8"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">8-digit Mauritanian phone number</p>
        </div>
      </div>

      {/* Security Section */}
         {/* Security Section */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
        {renderSecuritySection()}
      </div>

    </div>
  );
};

export default ProfileTab;