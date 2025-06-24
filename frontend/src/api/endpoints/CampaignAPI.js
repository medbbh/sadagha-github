import api from '../axiosConfig';

// add to favorites
export const addToFavorites = async (campaignId) => {
  try {
    const favorites = JSON.parse(localStorage.getItem('favoriteCampaigns')) || [];
    if (!favorites.includes(campaignId)) {
      favorites.push(campaignId);
      localStorage.setItem('favoriteCampaigns', JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Failed to add campaign to favorites:', error);
  }
};

export const removeFromFavorites = async (campaignId) => {
  try {
    const favorites = JSON.parse(localStorage.getItem('favoriteCampaigns')) || [];
    const updatedFavorites = favorites.filter(id => id !== campaignId);
    localStorage.setItem('favoriteCampaigns', JSON.stringify(updatedFavorites));
  } catch (error) {
    console.error('Failed to remove campaign from favorites:', error);
  }
};

// get favorite campaigns
export const getFavoriteCampaigns = async () => { 
  try {
    const favorites = JSON.parse(localStorage.getItem('favoriteCampaigns')) || [];
    if (favorites.length === 0) {
      console.log('No favorite campaigns found');
      return [];
    }
    console.log('Fetching favorite campaigns:', favorites);
    return favorites
  }
  catch (error) {
    console.error('Failed to get favorite campaigns:', error);
    return [];
  }
}

export const isFavoriteCampaign = async (campaignId) => {
  try {
    const favorites = JSON.parse(localStorage.getItem('favoriteCampaigns')) || [];
    return favorites.includes(campaignId);
  } catch (error) {
    console.error('Failed to check if campaign is favorite:', error);
    return false;
  }
}


export const fetchCampaigns = async (params = {}) => {
  try {
    
    // Clean up params to match your backend expectations
    const cleanParams = {};
    
    if (params.page) cleanParams.page = params.page;
    if (params.search) cleanParams.search = params.search;
    if (params.category && params.category !== 'all') {
      cleanParams.category = params.category;
    }
    if (params.ordering) cleanParams.ordering = params.ordering;
    
    
    const response = await api.get('/campaigns/', { params: cleanParams });
  
    // Log first few campaigns to see their categories
    const campaigns = response.results || response;
    if (campaigns && campaigns.length > 0) {

    }
    
    return response;
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    throw error;
  }
};

export const fetchCampaignById = async (id) => {
  try {
    const response = await api.get(`/campaigns/${id}/`);
    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || `Failed to fetch campaign ${id}`;
    
    throw {
      message: errorMessage,
      details: error.response?.data?.errors,
      ...error
    };
  }
};

export const getCampaignsByIds = async (campaignIds) => {
  const response = await api.post('/campaigns/batch/', {
    ids: campaignIds
  });
  console.log('Batch campaign fetch response:', response);
  return response.campaigns;
};



export const createCampaign = async (formData) => {
  try {
    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('category', formData.category);
    payload.append('description', formData.description);
    payload.append('target', formData.target);
    
    // FIXED: Handle multiple files with file_* pattern that Django expects
    formData.files.forEach((file, index) => {
      payload.append(`file_${index}`, file);
    });

    const response = await api.post('/campaigns/', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response;
  } catch (error) {
    console.error('Campaign creation error:', error);
    console.error('Error response:', error.response?.data);
    
    const errorMessage = error.response?.data?.message || 'Failed to create campaign';
    
    throw {
      message: errorMessage,
      details: error.response?.data?.errors,
      ...error
    };
  }
};

export const updateCampaign = async ({ id, data }) => {
  try {
    // If data is already FormData, use it directly
    // Otherwise, create FormData from the data object
    let payload;
    
    if (data instanceof FormData) {
      payload = data;
    } else {
      payload = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'files') {
          data.files.forEach(file => payload.append('files', file));
        } else {
          payload.append(key, data[key]);
        }
      });
    }

    const response = await api.patch(`/campaigns/${id}/`, payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || `Failed to update campaign ${id}`;
    
    throw {
      message: errorMessage,
      details: error.response?.data?.errors,
      ...error
    };
  }
};

export const featuredCampaigns = async () => {
  try {
    const response = await api.get('/campaigns/featured/');
    
    // Your backend returns the data directly from the serializer
    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch featured campaigns';
    
    throw {
      message: errorMessage,
      details: error.response?.data?.errors,
      ...error
    };
  }
};

export const myCampaigns = async () => {
  try {
    const response = await api.get('/campaigns/my_campaigns/');
    
    // Your backend returns the data directly from the serializer
    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch your campaigns';
    
    throw {
      message: errorMessage,
      details: error.response?.data?.errors,
      ...error
    };
  }
};

// Additional utility functions you might need

export const deleteCampaign = async (id) => {
  try {
    await api.delete(`/campaigns/${id}/`);
    return { success: true };
  } catch (error) {
    const errorMessage = error.response?.data?.message || `Failed to delete campaign ${id}`;
    
    throw {
      message: errorMessage,
      details: error.response?.data?.errors,
      ...error
    };
  }
};

export const toggleFeatured = async (id, featured = true) => {
  try {
    const response = await api.patch(`/campaigns/${id}/`, { featured });
    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || `Failed to update campaign ${id}`;
    
    throw {
      message: errorMessage,
      details: error.response?.data?.errors,
      ...error
    };
  }
};