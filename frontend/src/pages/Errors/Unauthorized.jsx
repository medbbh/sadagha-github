import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Unauthorized = () => {
  const { user, getUserRole } = useAuth();
  const role = getUserRole();
    
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-4xl font-bold text-red-600 mb-4">403 - Unauthorized</h1>
      <p className="text-lg text-gray-700 mb-6">
        You do not have permission to access this page.
      </p>
      {
        role === "organization" ? (
          <Link
            to="/organization"
            className="text-blue-600 underline hover:text-blue-800 transition"
          >
            Go back to your organization dashboard
          </Link>
        ) : role === "user" ? (
          <Link
            to="/feed"
            className="text-blue-600 underline hover:text-blue-800 transition"
          >
            Go back to your user dashboard
          </Link>
        ) : (
          <Link
            to="/login"
            className="text-blue-600 underline hover:text-blue-800 transition"
          >
            Go back to login
          </Link>
        )
      }
    </div>
  );
};

export default Unauthorized;