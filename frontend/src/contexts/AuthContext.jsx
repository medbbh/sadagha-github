import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { injectAuth } from '../api/axiosConfig'; // Add this import

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('User session found:', session.user.email, 'Role:', session.user.user_metadata?.role);
          setUser(session.user);
        } else if (mounted) {
          setUser(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log('Auth state changed:', event, session?.user?.email, 'Role:', session?.user?.user_metadata?.role);
      
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

  // Function to get access token for API calls
  const getToken = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting token:', error);
        return null;
      }
      console.log('Getting token for API call, session exists:', !!session);
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
      // Clear any stored role data
      localStorage.removeItem('userRole');
      localStorage.removeItem('pendingRole');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Inject auth functions into axios whenever user changes
  useEffect(() => {
    injectAuth({ 
      logout, 
      getToken 
    });
  }, [user, logout, getToken]);

  // Helper function to get user role from metadata
  const getUserRole = () => {
    return user?.user_metadata?.role?.toLowerCase() || null;
  };

  // Helper function to get user display name
  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || 
           user?.user_metadata?.name || 
           user?.email?.split('@')[0] || 
           'User';
  };

  const value = {
    user,
    loading,
    logout,
    getUserRole,
    getUserDisplayName,
    getToken,
    // For backward compatibility if any components expect these
    profile: user ? {
      id: user.id,
      email: user.email,
      full_name: getUserDisplayName(),
      role: getUserRole(),
      username: user.email
    } : null,
    profileLoading: false,
    fetchProfile: () => Promise.resolve(null), // No-op function
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