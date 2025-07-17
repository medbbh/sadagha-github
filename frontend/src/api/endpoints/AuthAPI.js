// api/endpoints/AuthAPI.js (or add to existing auth file)
import { supabase } from '../../supabaseClient'; // Adjust the import path as necessary

export const getUserAuthMethod = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    // Check if user has multiple identities (OAuth) or email/password
    const hasEmailPassword = user.app_metadata?.providers?.includes('email') || 
                             user.aud === 'authenticated' && !user.app_metadata?.provider;
    
    const oauthProviders = user.app_metadata?.providers?.filter(p => p !== 'email') || [];
    const primaryProvider = user.app_metadata?.provider;

    return {
      hasPassword: hasEmailPassword,
      isOAuthOnly: oauthProviders.length > 0 && !hasEmailPassword,
      providers: oauthProviders,
      primaryProvider: primaryProvider,
      email: user.email
    };
    
  } catch (error) {
    console.error('Error getting auth method:', error);
    throw error;
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const authMethod = await getUserAuthMethod();
    
    if (!authMethod.hasPassword) {
      throw new Error('PASSWORD_NOT_AVAILABLE');
    }

    // Verify current password
    const { data: { user } } = await supabase.auth.getUser();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { success: true, message: 'Password updated successfully' };
    
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

export const setPasswordForOAuthUser = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw new Error(error.message);

    return { success: true, message: 'Password set successfully! You can now sign in with email and password.' };
    
  } catch (error) {
    console.error('Error setting password:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `http://localhost:5174/reset-password` // Direct to reset-password page
    });

    if (error) throw new Error(error.message);

    return { success: true, message: 'Password reset email sent! Please check your inbox.' };
    
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw error;
  }
};