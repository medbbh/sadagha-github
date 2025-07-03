import api from '../axiosConfig';

// Fetch current user's volunteer profile
export const fetchMyVolunteerProfile = async () => {
  try {
    const response = await api.get('/volunteers/profiles/my_profile/');
    console.log('My volunteer profile response:', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch my volunteer profile:', error);
    
    // Handle 404 specifically - this means no profile exists (not an error)
    if (error.response?.status === 404) {
      return { data: null, status: 404 };
    }
    
    throw error;
  }
};

// Fetch all volunteer profiles (for organizations)
export const fetchVolunteerProfiles = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.search) queryParams.append('search', params.search);
    if (params.location) queryParams.append('location', params.location);
    if (params.skills) queryParams.append('skills', params.skills);
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active);

    const url = `/volunteers/profiles/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    console.log('Volunteer profiles response:', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch volunteer profiles:', error);
    throw error;
  }
};

// Fetch specific volunteer profile by ID
export const fetchVolunteerProfileById = async (id) => {
  try {
    const response = await api.get(`/volunteers/profiles/${id}/`);
    console.log('Volunteer profile by ID response:', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch volunteer profile by ID:', error);
    throw error;
  }
};

// Create volunteer profile
export const createVolunteerProfile = async (formData) => {
  try {
    const payload = {
      phone: formData.phone,
      age: formData.age,
      profession: formData.profession || '',
      motivation: formData.motivation,
      skills: formData.skills,
      interests: formData.interests,
      languages: formData.languages,
      // Convert objects to JSON strings for backend
      available_locations: JSON.stringify(formData.available_locations_data || []),
      availability: JSON.stringify(formData.availability_data || {}),
      // Also send the _data versions for the serializer
      available_locations_data: formData.available_locations_data || [],
      availability_data: formData.availability_data || {}
    };

    const response = await api.post('/volunteers/profiles/', payload);
    console.log('Volunteer profile created:', response);
    return response;
  } catch (error) {
    console.error('Error creating volunteer profile:', error);
    const errorMessage = error.response?.data?.message || 'Failed to create volunteer profile';
    throw {
      message: errorMessage,
      details: error.response?.data,
      ...error
    };
  }
};

// Update volunteer profile
export const updateVolunteerProfile = async ({ id, data }) => {
  try {
    const payload = {
      phone: data.phone,
      age: data.age,
      profession: data.profession || '',
      motivation: data.motivation,
      skills: data.skills,
      interests: data.interests,
      languages: data.languages,
      // Convert objects to JSON strings for backend
      available_locations: JSON.stringify(data.available_locations_data || []),
      availability: JSON.stringify(data.availability_data || {}),
      // Also send the _data versions for the serializer
      available_locations_data: data.available_locations_data || [],
      availability_data: data.availability_data || {},
      is_active: data.is_active !== undefined ? data.is_active : true
    };

    const response = await api.put(`/volunteers/profiles/${id}/`, payload);
    console.log('Volunteer profile updated:', response);
    return response; // Return the full response, not just response.data
  } catch (error) {
    console.error('Error updating volunteer profile:', error);
    const errorMessage = error.response?.data?.message || `Failed to update volunteer profile ${id}`;
    throw {
      message: errorMessage,
      details: error.response?.data,
      ...error
    };
  }
};

// Partially update volunteer profile
export const patchVolunteerProfile = async ({ id, data }) => {
  try {
    const response = await api.patch(`/volunteers/profiles/${id}/`, data);
    console.log('Volunteer profile patched:', response);
    return response.data;
  } catch (error) {
    console.error('Error patching volunteer profile:', error);
    const errorMessage = error.response?.data?.message || `Failed to patch volunteer profile ${id}`;
    throw {
      message: errorMessage,
      details: error.response?.data,
      ...error
    };
  }
};

// Toggle volunteer profile active status
export const toggleVolunteerProfileStatus = async () => {
  try {
    const response = await api.post('/volunteers/profiles/toggle_active/');
    console.log('Volunteer profile status toggled:', response);
    return response;
  } catch (error) {
    console.error('Error toggling volunteer profile status:', error);
    const errorMessage = error.response?.data?.message || 'Failed to toggle profile status';
    throw {
      message: errorMessage,
      details: error.response?.data,
      ...error
    };
  }
};

// Delete volunteer profile
export const deleteVolunteerProfile = async (id) => {
  try {
    const response = await api.delete(`/volunteers/profiles/${id}/`);
    console.log('Volunteer profile deleted:', response);
    return response;
  } catch (error) {
    console.error('Error deleting volunteer profile:', error);
    const errorMessage = error.response?.data?.message || `Failed to delete volunteer profile ${id}`;
    throw {
      message: errorMessage,
      details: error.response?.data,
      ...error
    };
  }
};