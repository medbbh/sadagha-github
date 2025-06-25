import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Store auth functions that will be injected from context
let authFunctions = null;

export const injectAuth = (functions) => {
  authFunctions = functions;
};

axiosInstance.interceptors.request.use(
  async (config) => {
    // Get token from auth functions
    const token = authFunctions?.getToken ? await authFunctions.getToken() : null;
    const role = localStorage.getItem('userRole');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (role) config.headers['X-User-Role'] = role;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      if (error.config.headers.Authorization) {
        // Clear auth data on logout
        localStorage.removeItem('userRole');
        localStorage.removeItem('pendingRole');
        
        // Call logout function if available
        if (authFunctions?.logout) {
          authFunctions.logout();
        }
        
        window.location.href = '/login';
      }
    }

    const message = error.response?.data?.message || 
                   error.message || 
                   'Request failed';
    
    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// Enhanced API methods with role support
export const api = {
  get: (url, config = {}) => axiosInstance.get(url, config),
  post: (url, data, config = {}) => axiosInstance.post(url, data, config),
  put: (url, data, config = {}) => axiosInstance.put(url, data, config),
  patch: (url, data, config = {}) => axiosInstance.patch(url, data, config),
  delete: (url, config = {}) => axiosInstance.delete(url, config),
  
  // Add role-specific methods if needed
  withRole: (role) => ({
    get: (url, config = {}) => {
      const headers = { ...config.headers, 'X-User-Role': role };
      return axiosInstance.get(url, { ...config, headers });
    },
    // Similarly for post, put, patch, delete
  })
};

export default axiosInstance;