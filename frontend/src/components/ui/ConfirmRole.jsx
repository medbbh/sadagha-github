import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Loading from '../common/Loading';

const ConfirmRole = () => {
  const { 
    user, 
    registerDjangoUser, 
    isFullyAuthenticated, 
    needsRegistration, 
    loading,
    getUserRole 
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
      setError('Please log in first');
      return;
    }

    console.log('📝 Starting role selection for:', selectedRole);
    setIsRegistering(true);
    setError('');

    try {
      await registerDjangoUser(selectedRole);
      console.log('✅ Registration completed, should redirect automatically');
      
      // The useEffect will handle navigation once isFullyAuthenticated becomes true
    } catch (err) {
      console.error('❌ Registration failed:', err);
      setError(err.message || 'Failed to register. Please try again.');
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

  console.log('📋 ConfirmRole - showing role selection form');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Complete Your Registration</h2>
        
        <p className="text-gray-600 text-center mb-6">
          Welcome {user?.email}! Please select your account type to continue:
        </p>
        
        <div className="space-y-4 mb-6">
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="role"
              value="user"
              checked={selectedRole === 'user'}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="mr-3"
              disabled={isRegistering}
            />
            <div>
              <div className="font-medium">Regular User</div>
              <div className="text-sm text-gray-500">
                Donate to campaigns and volunteer for causes
              </div>
            </div>
          </label>
          
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="role"
              value="organization"
              checked={selectedRole === 'organization'}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="mr-3"
              disabled={isRegistering}
            />
            <div>
              <div className="font-medium">Organization</div>
              <div className="text-sm text-gray-500">
                Create campaigns and manage charitable projects
              </div>
            </div>
          </label>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <button
          onClick={handleRoleSelection}
          disabled={isRegistering}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRegistering ? 'Setting up your account...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default ConfirmRole;