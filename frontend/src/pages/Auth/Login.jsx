import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`  // Changed: redirect to home, let RoleBasedRedirect handle the logic
      }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Login</h2>

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
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
        <button type="submit" className="bg-blue-600 text-white px-4 py-2">
          Login with Email
        </button>
      </form>

      <div className="my-4 text-center">or</div>

      <button
        onClick={handleGoogleLogin}
        className="bg-red-500 text-white px-4 py-2 w-full"
      >
        Login with Google
      </button>

      <div className="w-full border border-gray-300 my-4"></div>

      <button
        onClick={() => navigate('/signup')}
        className="bg-gray-500 text-white px-4 py-2 w-full"
      >
        Register
      </button>

      <p className="text-sm mt-2">
        Forgot your password?{' '}
        <a href="/forgot-password" className="text-blue-600 hover:underline">
          Reset it here
        </a>
      </p>

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
};

export default Login;