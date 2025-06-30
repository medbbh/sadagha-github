// src/components/ProtectedRoute.jsx - Fixed version
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Loading from './common/Loading';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading, isFullyAuthenticated, getUserRole, needsRegistration } = useContext(AuthContext);
  
  console.log('🔒 ProtectedRoute check:', {
    hasUser: !!user,
    loading,
    isFullyAuthenticated: isFullyAuthenticated(),
    needsRegistration: needsRegistration(),
    userRole: getUserRole(),
    allowedRoles
  });

  // Show loading while auth state is being determined
  if (loading) {
    console.log('🔒 ProtectedRoute: showing loading');
    return <Loading />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('🔒 ProtectedRoute: no user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If user needs registration, redirect to confirm-role
  if (needsRegistration()) {
    console.log('🔒 ProtectedRoute: user needs registration, redirecting to confirm-role');
    return <Navigate to="/confirm-role" replace />;
  }

  // If user is not fully authenticated yet, show loading
  if (!isFullyAuthenticated()) {
    console.log('🔒 ProtectedRoute: user not fully authenticated, showing loading');
    return <Loading />;
  }

  // Get the role from Django user (authoritative source)
  const role = getUserRole();
  
  console.log('🔒 ProtectedRoute: checking role access', {
    userRole: role,
    allowedRoles,
    hasAccess: allowedRoles ? allowedRoles.includes(role) : true
  });

  // Redirect to unauthorized if the role isn't allowed
  if (allowedRoles && !allowedRoles.includes(role)) {
    console.log('🔒 ProtectedRoute: role not allowed, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('🔒 ProtectedRoute: access granted');
  
  // Return either children or Outlet based on what was provided
  return children || <Outlet />;
};

export default ProtectedRoute;

// src/App.jsx - Updated RoleBasedRedirect
const RoleBasedRedirect = () => {
  const { user, loading, getUserRole, isFullyAuthenticated, needsRegistration } = useAuth();
  
  console.log('🎯 RoleBasedRedirect state:', { 
    user: !!user, 
    loading,
    userEmail: user?.email,
    role: getUserRole(),
    isFullyAuthenticated: isFullyAuthenticated(),
    needsRegistration: needsRegistration()
  });
  
  if (loading) {
    console.log('🎯 RoleBasedRedirect: showing loading - auth loading');
    return <Loading />;
  }
  
  if (!user) {
    console.log('🎯 RoleBasedRedirect: no user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (needsRegistration()) {
    console.log('🎯 RoleBasedRedirect: user needs to complete registration');
    return <Navigate to="/confirm-role" replace />;
  }
  
  if (!isFullyAuthenticated()) {
    console.log('🎯 RoleBasedRedirect: user not fully authenticated, showing loading');
    return <Loading />;
  }
  
  const role = getUserRole();
  console.log('🎯 RoleBasedRedirect: user role determined:', role);
  
  if (role === 'organization') {
    console.log('🎯 RoleBasedRedirect: redirecting to organization dashboard');
    return <Navigate to="/organization" replace />;
  } else if (role === 'user') {
    console.log('🎯 RoleBasedRedirect: redirecting to user feed');
    return <Navigate to="/feed" replace />;
  } else {
    console.log('🎯 RoleBasedRedirect: no valid role, redirecting to confirm-role');
    return <Navigate to="/confirm-role" replace />;
  }
};