// import React, { use, useEffect } from 'react';
// import { useSelector } from 'react-redux';
// import { Navigate, Outlet } from 'react-router-dom';
// import Loading from './common/Loading'; // adjust path as needed

// const ProtectedRoute = ({ allowedRoles, children }) => {
//   const { user, loading } = useSelector((state) => state.auth);
  
//   if (loading) return <Loading />;

//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   const role = user?.user_metadata?.role.toLowerCase();

//   if (allowedRoles && !allowedRoles.includes(role)) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   // If used for layout-based nested routing
//   if (!children) return <Outlet />;

//   // If used as a wrapper
//   return children;
// };

// export default ProtectedRoute;

import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Loading from './common/Loading';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useContext(AuthContext);
  
  // Show loading while auth state is being determined
  // if (loading) return <Loading />;

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.user_metadata?.role?.toLowerCase();

  // Redirect to unauthorized if the role isn't allowed
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Return either children or Outlet based on what was provided
  return children || <Outlet />;
};

export default ProtectedRoute;