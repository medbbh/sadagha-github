import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../supabaseClient';
import { Eye, EyeOff, Lock, Check, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        // Wait a bit for Supabase to process the URL
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('Session check:', { session, error });
        
        if (error) {
          setError(t('auth.resetPassword.sessionError') + ': ' + error.message);
          setLoading(false);
          return;
        }

        if (session) {
          console.log('Valid session found');
          setSessionReady(true);
          setLoading(false);
        } else {
          setError(t('auth.resetPassword.noValidSession'));
          setLoading(false);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Error checking session:', err);
        setError(t('auth.resetPassword.verifyLinkFailed'));
        setLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session);
      
      if (!mounted) return;
      
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session) {
        setSessionReady(true);
        setLoading(false);
      }
    });

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [t]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError(t('auth.resetPassword.passwordsDontMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.resetPassword.passwordTooShort'));
      return;
    }

    setUpdating(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Update password error:', error);
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login', { 
            state: { message: t('auth.resetPassword.successMessage') }
          });
        }, 2000);
      }
    } catch (err) {
      console.error('Catch error:', err);
      setError(t('auth.resetPassword.updateError'));
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestNewLink = () => {
    navigate('/forgot-password');
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('auth.resetPassword.verifyingLink')}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.resetPassword.passwordUpdated')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('auth.resetPassword.redirectingToLogin')}
          </p>
        </div>
      </div>
    );
  }

  if (error || !sessionReady) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.resetPassword.resetLinkInvalid')}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRequestNewLink}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('auth.resetPassword.requestNewLink')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.resetPassword.setNewPassword')}
          </h2>
          <p className="text-gray-600">{t('auth.resetPassword.enterNewPassword')}</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.resetPassword.newPassword')}
            </label>
            <div className="relative">
              <Lock className={`absolute top-3 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.resetPassword.enterNewPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className={`w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isRTL ? 'pr-10 pl-12 text-right' : 'pl-10 pr-12 text-left'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute top-3 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.resetPassword.confirmPassword')}
            </label>
            <div className="relative">
              <Lock className={`absolute top-3 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('auth.resetPassword.confirmNewPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isRTL ? 'pr-10 pl-12 text-right' : 'pl-10 pr-12 text-left'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute top-3 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={updating || !newPassword || !confirmPassword}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? t('auth.resetPassword.updatingPassword') : t('auth.resetPassword.updatePassword')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;