import api from './api';

export const studentLoginHistoryService = {
  /** Fetch classes accessible to the current user */
  getAccessibleClasses: async () => {
    const response = await api.get('/student-login-history/classes');
    return response.data;
  },

  /** Fetch login summary for students in a given class */
  getClassLoginSummary: async (classId: string) => {
    const response = await api.get(`/student-login-history/class/${classId}/summary`);
    return response.data;
  },

  /** Fetch complete login history for an individual student */
  getStudentLoginHistory: async (studentId: string) => {
    const response = await api.get(`/student-login-history/student/${studentId}`);
    return response.data;
  },
};
