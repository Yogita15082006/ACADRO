import api from './api';

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceId: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface PageableResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

export const notificationService = {
  getMyNotifications: async (page = 0, size = 20) => {
    const response = await api.get<{ data: PageableResponse<NotificationResponse> }>(`/v1/notifications?page=${page}&size=${size}&sort=createdAt,desc`);
    return response.data.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.patch(`/v1/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch(`/v1/notifications/read-all`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get<{ data: number }>(`/v1/notifications/unread-count`);
    // Assuming ApiResponse wrapper structure: { success: true, message: "...", data: count }
    // If not, adjust accordingly. Let's return response.data.data
    return response.data.data;
  }
};
