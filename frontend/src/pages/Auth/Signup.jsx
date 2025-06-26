import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
  
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
  
      if (authError) throw authError;
  
      // Navigate to role selection after signup
      navigate('/confirm-role');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`  // Let RoleBasedRedirect handle the flow
      }
    });
    
    if (error) setError(error.message);
  };

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Signup</h2>
      
      <p className="text-gray-600 mb-4">
        Create your account and choose your role on the next page.
      </p>

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

      <Link to="/login" className="text-blue-600 mt-4 block text-center">
        Already have an account? Login
      </Link>

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
};

export default Signup;