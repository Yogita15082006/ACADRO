import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api', // Default to localhost backend
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    // Check if we are in impersonation mode via URL param
    const urlParams = new URLSearchParams(window.location.search);
    const impersonateToken = urlParams.get('impersonate_token');
    
    const token = impersonateToken || localStorage.getItem('acronexus_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Check if we are in impersonation mode
      const urlParams = new URLSearchParams(window.location.search);
      const isImpersonating = !!urlParams.get('impersonate_token');
      
      if (!isImpersonating) {
        // Handle unauthorized error, maybe clear token and redirect to login
        localStorage.removeItem('acronexus_token');
        localStorage.removeItem('acronexus_user');
        localStorage.removeItem('acronexus_role');
      }
      // window.location.href = '/login'; // Optional: Redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
