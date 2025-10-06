// src/components/ProtectedRoute.jsx - Fixed version
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Loading from './common/Loading';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading, isFullyAuthenticated, getUserRole, needsRegistration } = useContext(AuthContext);

  // Show loading while auth state is being determined
  if (loading) {
    return <Loading />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user needs registration, redirect to confirm-role
  if (needsRegistration()) {
    return <Navigate to="/confirm-role" replace />;
  }

  // If user is not fully authenticated yet, show loading
  if (!isFullyAuthenticated()) {
    return <Loading />;
  }

  // Get the role from Django user (authoritative source)
  const role = getUserRole();

  // Redirect to unauthorized if the role isn't allowed
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }  
  // Return either children or Outlet based on what was provided
  return children || <Outlet />;
};

export default ProtectedRoute;

// src/App.jsx - Updated RoleBasedRedirect
const RoleBasedRedirect = () => {
  const { user, loading, getUserRole, isFullyAuthenticated, needsRegistration } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (needsRegistration()) {
    return <Navigate to="/confirm-role" replace />;
  }
  
  if (!isFullyAuthenticated()) {
    return <Loading />;
  }
  
  const role = getUserRole();  
  if (role === 'organization') {
    return <Navigate to="/organization" replace />;
  } else if (role === 'user') {
    return <Navigate to="/feed" replace />;
  } else if (role === 'admin') {
    return <Navigate to="/admin/users" replace />;
  } else {
    return <Navigate to="/confirm-role" replace />;
  }
};