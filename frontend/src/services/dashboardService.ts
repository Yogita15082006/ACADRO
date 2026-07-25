import api from './api';

export const dashboardService = {
  getStudentDashboard: async () => {
    const response = await api.get('/dashboard/student');
    return response.data;
  },

  getFacultyDashboard: async () => {
    const response = await api.get('/dashboard/faculty');
    return response.data;
  },

  getHodDashboard: async () => {
    const response = await api.get('/dashboard/hod');
    return response.data;
  },

  getAdminDashboard: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  }
};
