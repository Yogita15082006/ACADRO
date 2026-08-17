import api from './api';

export const noticeService = {
  getNotices: async (filter?: any) => {
    const res = await api.post('/notices/search', filter || {});
    return res.data;
  },
  getStudentNotices: async () => {
    const res = await api.get('/notices/student/my-notices');
    return res.data;
  },
  createNotice: async (data: any) => {
    const res = await api.post('/notices', data);
    return res.data;
  },
  updateNotice: async (id: string, data: any) => {
    const res = await api.put(`/notices/${id}`, data);
    return res.data;
  },
  deleteNotice: async (id: string) => {
    const res = await api.delete(`/notices/${id}`);
    return res.data;
  },
  publishNotice: async (id: string) => {
    const res = await api.put(`/notices/${id}/publish`);
    return res.data;
  },
  uploadAttachment: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/notices/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  downloadAttachment: async (fileId: string) => {
    const res = await api.get(`/notices/file/${fileId}`, { responseType: 'blob' });
    return res;
  }
};
