// src/contexts/AuthContext.jsx - Simplified version
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { injectAuth } from '../api/axiosConfig';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('📋 User metadata:', session.user.user_metadata);
          setUser(session.user);
        } else if (mounted) {
          setUser(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (session?.user && mounted) {
        setUser(session.user);
      } else if (mounted) {
        setUser(null);
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

  // Helper function to get user role - simplified
  const getUserRole = () => {
    const role = user?.user_metadata?.role;
    return role;
  };

  // Helper function to get user display name
  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || 
           user?.user_metadata?.name || 
           user?.email?.split('@')[0] || 
           'User';
  };

  // Check if user is fully authenticated - simplified
  const isFullyAuthenticated = () => {
    const hasUser = !!user;
    const hasRole = !!getUserRole();
    const result = hasUser && hasRole;
    
    return result;
  };

  // Check if user needs to complete registration - simplified
  const needsRegistration = () => {
    const hasUser = !!user;
    const hasRole = !!getUserRole();
    const result = hasUser && !hasRole;
    
    return result;
  };

  // Register user in Django
  const registerDjangoUser = async (role) => {    
    try {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      
      // First register in Django
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_BASE_URL}/auth/register/`,
        { role },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      // Then update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: { role: role }
      });
      
      if (error) {
        console.error('⚠️ Supabase metadata update failed:', error);
        // Don't throw here since Django registration succeeded
      }
      
      return data;
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  };

  const value = {
    user,
    loading,
    logout,
    getUserRole,
    getUserDisplayName,
    getToken,
    registerDjangoUser,
    isFullyAuthenticated,
    needsRegistration,
    // For backward compatibility
    profile: user ? {
      id: user.id,
      email: user.email,
      full_name: getUserDisplayName(),
      role: getUserRole(),
      username: user.email
    } : null,
    profileLoading: false,
  };

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