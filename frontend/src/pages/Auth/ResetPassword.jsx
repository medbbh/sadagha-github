// src/pages/ResetPassword.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Loading from '../../components/common/Loading'; 

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Listen for password recovery event
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setConfirmed(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
    } else {
      alert('Password updated! Please login again.');
      navigate('/login');
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Reset Your Password</h2>

      {confirmed ? (
        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="p-2 border"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2">
            Update Password
          </button>
        </form>
      ) : (
        <Loading />
      )}

      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default ResetPassword;
