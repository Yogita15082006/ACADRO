import api from './api';

export interface Examination {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  classId?: string;
  subjectId?: string;
}

export const examinationService = {
  createExamination: async (data: Partial<Examination>) => {
    const response = await api.post('/examinations', data);
    return response.data;
  },

  getExaminationById: async (id: string) => {
    const response = await api.get(`/examinations/${id}`);
    return response.data;
  },

  getAllExaminations: async () => {
    const response = await api.get('/examinations');
    return response.data;
  },

  updateExamination: async (id: string, data: Partial<Examination>) => {
    const response = await api.put(`/examinations/${id}`, data);
    return response.data;
  },

  deleteExamination: async (id: string) => {
    const response = await api.delete(`/examinations/${id}`);
    return response.data;
  }
};
