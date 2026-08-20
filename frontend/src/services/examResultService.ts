import api from './api';

export interface ExamResult {
  id: string;
  examinationId: string;
  studentId: string;
  subjectId: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
  remarks?: string;
  
  // Flattened properties from nested objects in response
  studentName?: string;
  enrollmentNo?: string;
  subjectCode?: string;
  subjectName?: string;
}

export const examResultService = {
  createResult: async (data: Partial<ExamResult>) => {
    const response = await api.post('/exam-results', data);
    return response.data;
  },

  getResultsByExamAndClass: async (examinationId: string, className?: string) => {
    const params = new URLSearchParams();
    params.append('examinationId', examinationId);
    if (className) {
      params.append('className', className);
    }
    const response = await api.get(`/exam-results/search?${params.toString()}`);
    return response.data;
  },

  uploadResults: async (file: File, examinationId?: string, className?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (examinationId) formData.append('examinationId', examinationId);
    if (className) formData.append('className', className);
    const response = await api.post('/v1/bulk-upload/results', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  generateAIFeedback: async (examinationId: string, className?: string) => {
    const params = new URLSearchParams();
    params.append('examinationId', examinationId);
    if (className) {
      params.append('className', className);
    }
    const response = await api.post(`/exam-ai-feedback/generate?${params.toString()}`);
    return response.data;
  },
  
  deleteResultsForClass: async (examinationId: string, className?: string) => {
    const params = new URLSearchParams();
    params.append('examinationId', examinationId);
    if (className) {
      params.append('className', className);
    }
    const response = await api.delete(`/exam-results/class?${params.toString()}`);
    return response.data;
  },

  getAIFeedback: async (examinationId: string, className?: string) => {
     const params = new URLSearchParams();
     params.append('examinationId', examinationId);
     if (className) {
       params.append('className', className);
     }
     const response = await api.get(`/exam-ai-feedback/search?${params.toString()}`);
     return response.data;
  },
  
  publishResults: async (examinationId: string, className?: string, studentId?: string) => {
    const params = new URLSearchParams();
    params.append('examinationId', examinationId);
    if (className) params.append('className', className);
    if (studentId) params.append('studentId', studentId);
    const response = await api.post(`/exam-results/publish?${params.toString()}`);
    return response.data;
  }
};
