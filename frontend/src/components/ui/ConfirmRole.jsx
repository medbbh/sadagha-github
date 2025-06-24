import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Loading from '../common/Loading';


const ConfirmRole = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const updateUserRole = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.error("Session error:", error);
        navigate('/login');
        return;
      }

      // Get the pending role and immediately remove it
      const pendingRole = localStorage.getItem('pendingRole');
      localStorage.removeItem('pendingRole');

      if (pendingRole) {
        try {
          // Update both Supabase metadata and localStorage
          const { error: updateError } = await supabase.auth.updateUser({
            data: { role: pendingRole },
          });

          if (updateError) throw updateError;

          // Set the final role in localStorage
          localStorage.setItem('userRole', pendingRole);
          
          // Add role to headers when making the backend request

          await fetch(`${import.meta.env.VITE_APP_API_BASE_URL}/auth/sync-user/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'X-User-Role': pendingRole // Add role to headers
            }
          });
          
            // await axios.post(`${import.meta.env.VITE_APP_API_BASE_URL}/auth/sync-user/`, {}, {
            // headers: {
            //   'Authorization': `Bearer ${session.access_token}`,
            //   'X-User-Role': pendingRole // Add role to headers
            // }
            // });

        } catch (err) {
          console.error("Failed to update user role:", err);
        }
      }

      navigate('/');
    };

    updateUserRole();
  }, [navigate]);

  return <Loading />; 
};

export default ConfirmRole;