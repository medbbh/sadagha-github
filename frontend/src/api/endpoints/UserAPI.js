// api/endpoints/UserAPI.js
import { api } from '../axiosConfig';

export const fetchUserProfile = async () => {
  try {
    const response = await api.get('/auth/profile/');
    return response; // axios already returns parsed data
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile/', profileData);
    return response;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

