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
}

export const eventService = {
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

  registerForEvent: async (eventId: string) => {
    const response = await api.post(`/events/${eventId}/register`);
    return response.data;
  },

  cancelRegistration: async (eventId: string) => {
    const response = await api.delete(`/events/${eventId}/register`);
    return response.data;
  },

  getEventRegistrations: async (eventId: string, page = 0, size = 10) => {
    const response = await api.get(`/events/${eventId}/registrations?page=${page}&size=${size}`);
    return response.data;
  }
};
