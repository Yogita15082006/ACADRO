import api from './api';

export const profileService = {
  getProfile: async () => {
    const response = await api.get('/v1/profile');
    return response.data.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/v1/profile', data);
    return response.data.data;
  },

  getFacultyAssignedSubjects: async () => {
    const response = await api.get('/v1/faculty-profile/assigned-subjects');
    return response.data; // Note: This controller returns ResponseEntity.ok(dtos) directly, not wrapped in ApiResponse
  }
};
