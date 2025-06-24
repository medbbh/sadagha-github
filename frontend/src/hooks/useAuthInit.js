import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useDispatch } from 'react-redux';
import { setAuth, clearAuth, fetchUserProfile } from '../store/slices/authSlice';

export const useAuthInit = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        dispatch(setAuth({
          user: session.user,
          access_token: session.access_token,
          session,
        }));

      if (session.user?.email) {
          dispatch(fetchUserProfile(session.user.email));
        }
      } else {
        dispatch(clearAuth());
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // console.log('Auth event:', _event);
      // console.log('Session:', session);
      if (session) {
        dispatch(setAuth({
          user: session.user,
          access_token: session.access_token,
          session,
        }));

        // Fetch user profile on auth state change (login)
      if (_event === 'SIGNED_IN' && session.user?.email) {
          dispatch(fetchUserProfile(session.user.email));
        }

      } else {
        dispatch(clearAuth());
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [dispatch]);
};
