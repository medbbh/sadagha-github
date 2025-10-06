import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Chrome, Facebook } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
import { SiFacebook } from "react-icons/si"; // Simple Icons

const Login = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          prompt: 'select_account',
        },
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // login with Facebook
  const handleFacebookLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          prompt: 'select_account',
        },
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col justify-center py-2 sm:px-6 lg:px-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo/Brand */}
        <div className="flex justify-center">
          <div className="p-3 rounded-full">
            <img src="/logo.png" alt="Logo" className="h-36 w-36" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-gray-900">
          {t('auth.login.welcomeBack')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('auth.login.noAccount')}{' '}
          <Link
            to="/signup"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            {t('auth.login.signUpFree')}
          </Link>
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FcGoogle className={`h-5 w-5 text-gray-500 ${isRTL ? 'ml-3' : 'mr-3'}`} />
            {t('auth.login.continueWithGoogle')}
          </button>

          {/* Facebook Login Button */}
          <button
            onClick={handleFacebookLogin}
            disabled={loading}
            className="mt-3 w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SiFacebook className={`h-5 w-5 text-blue-500 ${isRTL ? 'ml-3' : 'mr-3'}`} />
            {t('auth.login.continueWithFacebook')}
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t('auth.login.orContinueEmail')}
                </span>
              </div>
            </div>
          </div>

          {/* Email/Password Form */}
          <form className="mt-4 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.common.emailAddress')}
              </label>
              <div className="mt-1 relative">
                <Mail className={`absolute top-3 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full py-3 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isRTL ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'
                    }`}
                  placeholder={t('auth.common.enterEmail')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.common.password')}
              </label>
              <div className="mt-1 relative">
                <Lock className={`absolute top-3 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full py-3 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isRTL ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'
                    }`}
                  placeholder={t('auth.common.enterPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-3 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('auth.login.signingIn')}
                </div>
              ) : (
                t('auth.login.signIn')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;