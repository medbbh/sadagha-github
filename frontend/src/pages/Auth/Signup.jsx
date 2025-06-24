import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
  
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {  // Send role as metadata to Supabase
            role: role,
          },
        },
      });
  
      if (authError) throw authError;
  
      // Store role in localStorage (for later use after email confirmation)
      localStorage.setItem('pendingRole', role);
      localStorage.setItem('userRole', role); // Also set userRole immediately
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignup = async () => {
    // Set the role in local storage to use after redirect
    localStorage.setItem('pendingRole', role);
    localStorage.setItem('userRole', role); // Also set userRole immediately
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/confirm-role`,
        data: {  // Pass role as metadata
          role: role,
        }
      }
    });
    
    if (error) setError(error.message);
  };

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Signup</h2>
      <div className="mb-4">
        <label className="block mb-2">I want to sign up as:</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="role"
              value="user"
              checked={role === 'user'}
              onChange={() => setRole('user')}
              className="mr-2"
            />
            Regular User
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="role"
              value="organization"
              checked={role === 'organization'}
              onChange={() => setRole('organization')}
              className="mr-2"
            />
            Organization
          </label>
        </div>
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-2 border"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="p-2 border"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2"
        >
          Sign up with Email
        </button>
      </form>

      <div className="my-4 text-center">or</div>

      <button
        onClick={handleGoogleSignup}
        className="bg-red-500 text-white px-4 py-2 w-full"
      >
        Sign up with Google
      </button>

      <Link to="/login" className="text-blue-600 mt-4">Go to Login</Link>

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
};

export default Signup;