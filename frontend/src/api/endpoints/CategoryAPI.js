import api from '../axiosConfig';

export const fetchCategories = async () => {
  try {
    const response = await api.get('/campaigns/categories/');
    // console.log('Categories response:', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};

export const fetchTopCategories = async () => {
  try {
    const response = await api.get('/campaigns/categories/top_categories/');
    console.log('Top Categories response:', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch top categories:', error);
    throw error;
  }
};

export const fetchCategoryById = async (id) => {
  try {
    const response = await api.get(`/campaigns/categories/${id}/`);
    console.log('Category by ID response:', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch category by ID:', error);
    throw error;
  }
};

export const createCategory = async (formData) => {
  try {
    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('description', formData.description);
    payload.append('target', formData.target);

    formData.files.forEach((file, index) => {
      payload.append(`file_${index}`, file);
    });

    const response = await api.post('/campaigns/categories/', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Category created:', response);
    return response;
  } catch (error) {
    console.error('Error creating category:', error);
    const errorMessage = error.response?.data?.message || 'Failed to create category';
    throw {
      message: errorMessage,
      details: error.response?.data,
      ...error
    };
  }
};

export const updateCategory = async ({ id, data }) => {
  try {
    const response = await api.put(`/campaigns/categories/${id}/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    const errorMessage = error.response?.data?.message || `Failed to update category ${id}`;
    throw {
      message: errorMessage,
      details: error.response?.data,
      ...error
    };
  }
};