import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { injectAuth, api } from '../api/axiosConfig';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [djangoUser, setDjangoUser] = useState(null);
  const [djangoUserLoading, setDjangoUserLoading] = useState(false);

  // Function to get access token for API calls
  const getToken = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting token:', error);
        return null;
      }
      return session?.access_token;
    } catch (error) {
      console.error('Token retrieval error:', error);
      return null;
    }
  }, []);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
        return;
      }
      setUser(null);
      setDjangoUser(null);
      localStorage.removeItem('userRole');
      localStorage.removeItem('pendingRole');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Inject auth functions into axios
  useEffect(() => {
    injectAuth({ 
      logout, 
      getToken 
    });
  }, [logout, getToken]);

  // Check if user exists in Django database
  const checkDjangoUser = async () => {
    console.log('🔍 Checking Django user...');
    console.log('📋 Current user state:', {
      userEmail: user?.email,
      userMetadata: user?.user_metadata,
      userRole: user?.user_metadata?.role
    });
    
    setDjangoUserLoading(true);
    
    try {
      const token = await getToken();
      if (!token) {
        console.log('❌ No token available');
        setDjangoUser(null);
        setDjangoUserLoading(false);
        return;
      }

      console.log('📡 Making check-user request with token:', token.substring(0, 50) + '...');
      console.log('📡 Request URL:', `${import.meta.env.VITE_APP_API_BASE_URL}/api/auth/check-user/`);
      
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_BASE_URL}/api/auth/check-user/`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      
      console.log('✅ Check-user response status:', response.status);
      console.log('✅ Check-user response data:', response.data);
      
      // The backend is returning the user data correctly, let's use it
      if (response.data && response.data.exists === true && response.data.user) {
        console.log('✅ Django user found and setting state:', response.data.user);
        setDjangoUser(response.data.user);
        console.log('✅ Django user state updated successfully');
      } else if (response.data && response.data.exists === false) {
        console.log('❌ Django user not found - user needs registration');
        console.log('📋 Response indicates user does not exist');
        setDjangoUser(null);
      } else {
        console.log('⚠️ Unexpected response format:', response.data);
        setDjangoUser(null);
      }
    } catch (error) {
      console.error('❌ Error checking Django user:');
      console.error('  Error type:', error.constructor.name);
      console.error('  Error message:', error.message);
      console.error('  Error response:', error.response?.data);
      console.error('  Error status:', error.response?.status);
      
      // Since we know the backend is working correctly, 
      // any error here is likely a network issue
      setDjangoUser(null);
    } finally {
      console.log('🏁 Django user check completed, setting loading to false');
      setDjangoUserLoading(false);
    }
  };

  // Register user in Django
  const registerDjangoUser = async (role) => {
    console.log('📝 Registering Django user with role:', role);
    
    try {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      console.log('📡 Making register request...');
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_BASE_URL}/api/auth/register/`,
        { role },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Registration response:', response.data);

      // Update user metadata in Supabase
      console.log('📡 Updating Supabase metadata...');
      await supabase.auth.updateUser({
        data: { role: role }
      });

      // Refresh Django user data
      console.log('🔄 Refreshing Django user data...');
      await checkDjangoUser();
      
      console.log('✅ Registration completed successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Django registration error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Registration failed');
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      console.log('🔍 Checking initial session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setUser(null);
            setDjangoUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ Supabase user session found:', session.user.email);
          setUser(session.user);
          // Check if user exists in Django
          await checkDjangoUser();
        } else if (mounted) {
          console.log('❌ No Supabase session');
          setUser(null);
          setDjangoUser(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Session check error:', error);
        if (mounted) {
          setUser(null);
          setDjangoUser(null);
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      
      if (session?.user && mounted) {
        setUser(session.user);
        // Only check Django user for specific events to avoid loops
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await checkDjangoUser();
        } else if (event === 'INITIAL_SESSION' && !djangoUser) {
          // For page refreshes, always check Django user
          await checkDjangoUser();
        }
      } else if (mounted) {
        setUser(null);
        setDjangoUser(null);
      }
      
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to get user role
  const getUserRole = () => {
    // First check Django user (authoritative)
    if (djangoUser?.role) {
      console.log('🎭 Role from Django user:', djangoUser.role);
      return djangoUser.role;
    }
    // Fallback to Supabase metadata
    const supabaseRole = user?.user_metadata?.role?.toLowerCase();
    console.log('🎭 Role from Supabase metadata:', supabaseRole);
    return supabaseRole || null;
  };

  // Helper function to get user display name
  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || 
           user?.user_metadata?.name || 
           user?.email?.split('@')[0] || 
           'User';
  };

  // Check if user is fully authenticated (both Supabase + Django)
  const isFullyAuthenticated = () => {
    const result = !!(user && djangoUser && !djangoUserLoading);
    console.log('🔐 Is fully authenticated:', result, {
      hasUser: !!user,
      hasDjangoUser: !!djangoUser,
      djangoUserLoading,
      userEmail: user?.email,
      djangoUserRole: djangoUser?.role
    });
    return result;
  };

  // Check if user needs to complete registration
  const needsRegistration = () => {
    // If we're still loading Django user, don't show registration yet
    if (djangoUserLoading) return false;
    
    const result = !!(user && !djangoUser);
    console.log('📋 Needs registration:', result, {
      hasUser: !!user,
      hasDjangoUser: !!djangoUser,
      djangoUserLoading
    });
    return result;
  };

  const value = {
    user,
    djangoUser,
    loading: loading || djangoUserLoading,
    logout,
    getUserRole,
    getUserDisplayName,
    getToken,
    registerDjangoUser,
    checkDjangoUser,
    isFullyAuthenticated,
    needsRegistration,
    // For backward compatibility
    profile: djangoUser ? {
      id: djangoUser.id || user?.id,
      email: user?.email,
      full_name: getUserDisplayName(),
      role: getUserRole(),
      username: user?.email
    } : null,
    profileLoading: djangoUserLoading,
  };

  console.log('🎯 AuthContext state:', {
    hasUser: !!user,
    userEmail: user?.email,
    hasDjangoUser: !!djangoUser,
    djangoUserRole: djangoUser?.role,
    loading: loading || djangoUserLoading,
    isFullyAuthenticated: isFullyAuthenticated(),
    needsRegistration: needsRegistration()
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
