import api from './api';

export interface EventRegistration {
  id: string;
  eventId: string;
  studentId: string;
  registrationDate: string;
  status: string;
  studentDetails: any; // Add more specific fields if known
}

export interface Event {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  banner?: string;
  thumbnail?: string;
  venue: string;
  date: string;
  startTime?: string;
  endTime?: string;
  regDeadline?: string;
  maxParticipants?: number;
  registeredCount?: number;
  status: string;
  description?: string;
  isRegRequired: boolean;
  registrationMethod?: string;
  registrationExternalLink?: string;
  registrationFile?: string;
  isAttRequired: boolean;
  organizer?: string;
  rules?: string[];
  isActive?: boolean;
  targets?: any[];
  includeInOverallAttendance?: boolean;
  creatorName?: string;
  createdDate?: string;
}

export const eventService = {
  getStatistics: async () => {
    const response = await api.get('/events/statistics');
    return response.data;
  },

  getAllEvents: async (page = 0, size = 10) => {
    const response = await api.get(`/events?page=${page}&size=${size}`);
    return response.data;
  },

  getEventById: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  createEvent: async (data: Partial<Event>) => {
    const response = await api.post('/events', data);
    return response.data;
  },

  uploadBanner: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/events/upload-banner', formData);
    return response.data;
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/events/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateEvent: async (eventId: string, data: Partial<Event>) => {
    const response = await api.put(`/events/${eventId}`, data);
    return response.data;
  },

  deleteEvent: async (eventId: string) => {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },

  toggleEventStatus: async (eventId: string, isActive: boolean) => {
    const response = await api.patch(`/events/${eventId}/toggle-status?isActive=${isActive}`);
    return response.data;
  },

  getAvailableEvents: async () => {
    const response = await api.get('/events/available');
    return response.data;
  },

  getMyRegistrations: async () => {
    const response = await api.get('/events/my-registrations');
    return response.data;
  },

  registerForEvent: async (eventId: string, payload?: any) => {
    const response = await api.post(`/events/${eventId}/register`, payload || {});
    return response.data;
  },

  cancelRegistration: async (eventId: string) => {
    const response = await api.delete(`/events/${eventId}/register`);
    return response.data;
  },

  getEventRegistrations: async (eventId: string, page = 0, size = 10) => {
    const response = await api.get(`/events/${eventId}/registrations?page=${page}&size=${size}`);
    return response.data;
  },

  getAvailableBatches: async () => {
    const response = await api.get('/events/metadata/batches');
    return response.data;
  },

  getAvailableYears: async (batchYear: string) => {
    const response = await api.get(`/events/metadata/years?batchYear=${batchYear}`);
    return response.data;
  },

  getAvailableSemesters: async (batchYear: string, academicYear: string) => {
    const response = await api.get(`/events/metadata/semesters?batchYear=${batchYear}&academicYear=${academicYear}`);
    return response.data;
  },

  getAvailableClasses: async (batchYear: string, academicYear: string, semester: string) => {
    const response = await api.get(`/events/metadata/classes?batchYear=${batchYear}&academicYear=${academicYear}&semester=${semester}`);
    return response.data;
  },

  generateAiForm: async (prompt: string) => {
    const response = await api.post(`/events/ai/generate-form`, { prompt });
    return response.data;
  },

  // Notices
  getEventNotices: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/notices`);
    return response.data;
  },

  publishNotice: async (eventId: string, data: any) => {
    const response = await api.post(`/events/${eventId}/notices`, data);
    return response.data;
  },

  updateNotice: async (noticeId: string, data: any) => {
    const response = await api.put(`/events/notices/${noticeId}`, data);
    return response.data;
  },
  
  deleteNotice: async (noticeId: string) => {
    const response = await api.delete(`/events/notices/${noticeId}`);
    return response.data;
  },

  // Attendance
  getAttendanceSessions: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/attendance/sessions`);
    return response.data;
  },

  generateAttendanceCode: async (sessionId: string) => {
    const response = await api.post(`/events/attendance/sessions/${sessionId}/generate-code`);
    return response.data;
  },

  startAttendance: async (eventId: string, payload: any) => {
    const response = await api.post(`/events/${eventId}/attendance/sessions/start`, payload);
    return response.data;
  },

  closeAttendance: async (sessionId: string) => {
    const response = await api.post(`/events/attendance/sessions/${sessionId}/close`);
    return response.data;
  },

  updateUniqueCodeCount: async (sessionId: string, count: number) => {
    const response = await api.patch(`/events/attendance/sessions/${sessionId}/unique-code-count?count=${count}`);
    return response.data;
  },

  submitAttendance: async (sessionId: string, attendanceCode: string, uniqueCode: number) => {
    const response = await api.post(`/events/attendance/sessions/${sessionId}/submit`, { attendanceCode, uniqueCode });
    return response.data;
  },

  getSessionRecordsWithStats: async (sessionId: string) => {
    const response = await api.get(`/events/attendance/sessions/${sessionId}/records`);
    return response.data;
  },

  parseEventText: async (text: string) => {
    const response = await api.post('/events/parse-text', { text });
    return response.data;
  }
};
