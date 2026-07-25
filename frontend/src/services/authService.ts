import api from './api';

export const authService = {
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  verifyAccount: async (data: { email: string }) => {
    const response = await api.post('/auth/verify-account', data);
    return response.data;
  },

  activateAccount: async (data: any) => {
    const response = await api.post('/auth/activate-account', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (data: { email: string }) => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: any) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  changePassword: async (data: any) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  }
};
