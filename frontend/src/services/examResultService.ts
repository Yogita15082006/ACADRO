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

export interface CategorizedStudent {
  studentId?: string;
  name: string;
  enrollmentNo: string;
  className: string;
  category: 'APPEARED' | 'ELIGIBLE_NOT_APPEARED' | 'NOT_ELIGIBLE';
  isEligible: boolean;
  eligibilityReason?: string;
  appearanceStatus: 'PRESENT' | 'ABSENT' | 'NO_RECORD';
  appearanceDetail?: string;
  attendancePercentage?: number;
  marksObtained?: number;
  grade?: string;
  isPublished?: boolean;
}

export interface ExamStudentCategorySummary {
  examinationId: string;
  examDate?: string;
  classSubjectId?: string;
  classId?: string;
  className?: string;
  subjectName?: string;
  totalStudents: number;
  appearedCount: number;
  eligibleNotAppearedCount: number;
  notEligibleCount: number;
  appearedStudents: CategorizedStudent[];
  eligibleNotAppearedStudents: CategorizedStudent[];
  notEligibleStudents: CategorizedStudent[];
  allStudents: CategorizedStudent[];
}

export const examResultService = {
  getResultsByExam: async (examinationId: string) => {
    const response = await api.get(`/exam-results?examinationId=${examinationId}`);
    return response.data;
  },

  getSavedContexts: async (examinationId: string) => {
    const response = await api.get(`/exam-results/examinations/${examinationId}/saved-contexts`);
    return response.data;
  },

  updateResult: async (id: string, data: Partial<ExamResult>) => {
    const response = await api.put(`/exam-results/${id}`, data);
    return response.data;
  },

  getResultsByContext: async (examinationId: string, examDate: string, classSubjectId: string) => {
    const params = new URLSearchParams();
    params.append('examinationId', examinationId);
    params.append('examDate', examDate);
    params.append('classSubjectId', classSubjectId);
    const response = await api.get(`/exam-results/search?${params.toString()}`);
    return response.data;
  },

  getResultsByExamAndClass: async (examinationId: string, className?: string, examDate?: string, classSubjectId?: string) => {
    const params = new URLSearchParams();
    params.append('examinationId', examinationId);
    if (className) {
      params.append('className', className);
    }
    if (examDate) params.append('examDate', examDate);
    if (classSubjectId) params.append('classSubjectId', classSubjectId);
    const response = await api.get(`/exam-results/search?${params.toString()}`);
    return response.data;
  },

  uploadResults: async (file: File, examinationId?: string, className?: string, examDate?: string, classSubjectId?: string, previewOnly?: boolean) => {
    const formData = new FormData();
    formData.append('file', file);
    if (examinationId) formData.append('examinationId', examinationId);
    if (className) formData.append('className', className);
    if (examDate) formData.append('examDate', examDate);
    if (classSubjectId) formData.append('classSubjectId', classSubjectId);
    if (previewOnly) formData.append('previewOnly', 'true');
    const response = await api.post('/v1/bulk-upload/results', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getResultContext: async (examinationId: string, examDate: string, classSubjectId: string) => {
    const params = new URLSearchParams();
    params.append('examDate', examDate);
    params.append('classSubjectId', classSubjectId);
    const response = await api.get(`/exam-results/examinations/${examinationId}/context?${params.toString()}`);
    return response.data;
  },
  
  bulkSaveResults: async (examinationId: string, examDate: string, classSubjectId: string, results: any[]) => {
    const params = new URLSearchParams();
    params.append('examinationId', examinationId);
    params.append('examDate', examDate);
    params.append('classSubjectId', classSubjectId);
    const response = await api.post(`/exam-results/context/bulk?${params.toString()}`, results);
    return response.data;
  },
  generateAIFeedback: async (examinationId: string, className?: string, examDate?: string, classSubjectId?: string, unsavedRows?: any[]) => {
    const params = new URLSearchParams();
    params.append('examinationId', examinationId);
    if (className) {
      params.append('className', className);
    }
    if (examDate) params.append('examDate', examDate);
    if (classSubjectId) params.append('classSubjectId', classSubjectId);
    const response = await api.post(`/exam-ai-feedback/generate?${params.toString()}`, unsavedRows || null);
    return response.data;
  },
  
  deleteResultsForClass: async (examinationId: string, className?: string, examDate?: string, classSubjectId?: string) => {
    const params = new URLSearchParams();
    params.append('examinationId', examinationId);
    if (className) {
      params.append('className', className);
    }
    if (examDate) params.append('examDate', examDate);
    if (classSubjectId) params.append('classSubjectId', classSubjectId);
    const response = await api.delete(`/exam-results/class?${params.toString()}`);
    return response.data;
  },

  getAIFeedback: async (examinationId: string, className?: string, examDate?: string, classSubjectId?: string) => {
     const params = new URLSearchParams();
     params.append('examinationId', examinationId);
     if (className) {
       params.append('className', className);
     }
     if (examDate) params.append('examDate', examDate);
     if (classSubjectId) params.append('classSubjectId', classSubjectId);
     const response = await api.get(`/exam-ai-feedback/search?${params.toString()}`);
     return response.data;
  },
  
  publishResults: async (examinationId: string, examDate: string, classSubjectId: string, studentId?: string) => {
    const params = new URLSearchParams();
    params.append('examinationId', examinationId);
    params.append('examDate', examDate);
    params.append('classSubjectId', classSubjectId);
    if (studentId) params.append('studentId', studentId);
    const response = await api.post(`/exam-results/publish?${params.toString()}`);
    return response.data;
  },
  
  getAvailableAttendanceDates: async (examinationId: string, classSubjectId: string) => {
    const params = new URLSearchParams();
    params.append('classSubjectId', classSubjectId);
    const response = await api.get(`/examinations/${examinationId}/attendance/dates?${params.toString()}`);
    return response.data;
  },

  getStudentCategorySummary: async (examinationId: string, examDate?: string, classSubjectId?: string, classId?: string): Promise<ExamStudentCategorySummary> => {
    const params = new URLSearchParams();
    if (examDate) params.append('examDate', examDate);
    if (classSubjectId) params.append('classSubjectId', classSubjectId);
    if (classId) params.append('classId', classId);
    const response = await api.get(`/examinations/${examinationId}/student-categories?${params.toString()}`);
    return response.data;
  },

  exportCategorizedStudents: async (examinationId: string, examDate?: string, classSubjectId?: string, classId?: string, category?: string): Promise<Blob> => {
    const params = new URLSearchParams();
    if (examDate) params.append('examDate', examDate);
    if (classSubjectId) params.append('classSubjectId', classSubjectId);
    if (classId) params.append('classId', classId);
    if (category) params.append('category', category);
    const response = await api.get(`/examinations/${examinationId}/student-categories/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
