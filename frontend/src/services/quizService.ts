import api from './api';

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id?: string;
  quizId?: string;
  questionText: string;
  options?: Option[];
  marks: number;
  questionType?: 'MCQ' | 'Short Answer' | 'True/False' | 'Fill in the Blanks';
  correctAnswer?: string;
}

export interface Quiz {
  id: string;
  classSubjectId: string;
  subjectName?: string;
  className?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks?: number;
  sourceType?: 'MANUAL' | 'AI' | 'FILE' | 'URL';
  sourceUrl?: string;
  isGraded?: boolean;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'Active' | 'Upcoming' | 'Completed' | string;
  createdBy?: string;
  createdByName?: string;
  facultyName?: string;
  questionType?: string;
  difficulty?: string;
  questionCount?: number;
  questionsCount?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle?: string;
  studentId: string;
  studentName: string;
  studentEnrollmentNumber?: string;
  studentProfilePictureUrl?: string;
  studentAvatar?: string;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;
  grade?: string;
  isLate?: boolean;
  correctAnswers?: number;
  wrongAnswers?: number;
  unattemptedQuestions?: number;
  resultSummary?: string;
  startedAt?: string;
  completedAt?: string;
  evaluatedAt?: string;
  submittedAnswers?: Record<string, string>;
  classRank?: number;
  rank?: number;
  totalStudents?: number;
  submissionStatus?: string;
}

export const quizService = {
  getQuizzesBySubject: async (classSubjectId: string) => {
    const res = await api.get(`/quizzes/subject/${classSubjectId}`);
    return res.data.data || res.data;
  },

  getFacultyQuizzes: async () => {
    const res = await api.get('/quizzes/faculty');
    return res.data.data || res.data;
  },

  getAvailableQuizzes: async () => {
    const res = await api.get('/quizzes/student/available');
    return res.data.data || res.data;
  },

  createQuiz: async (data: Partial<Quiz>) => {
    const res = await api.post('/quizzes/faculty', data);
    return res.data.data || res.data;
  },

  updateQuiz: async (quizId: string, data: Partial<Quiz>) => {
    const res = await api.put(`/quizzes/faculty/${quizId}`, data);
    return res.data.data || res.data;
  },

  deleteQuiz: async (quizId: string) => {
    await api.delete(`/quizzes/faculty/${quizId}`);
  },

  addQuestions: async (quizId: string, questions: QuizQuestion[]) => {
    const results: any[] = [];
    for (const q of questions) {
      const payload = {
        questionText: (q as any).questionText || (q as any).question_text || (q as any).question || (q as any).statement || (q as any).prompt || (q as any).text || (q as any).title || 'Quiz Question Statement',
        questionType: q.questionType || 'MCQ',
        marks: Number(q.marks || 1),
        correctAnswer: q.correctAnswer || 'A',
        options: (q.questionType !== 'Short Answer' && q.questionType !== 'Fill in the Blanks' && Array.isArray(q.options)) ? q.options.map((o: any, idx: number) => ({
          id: o.id || String.fromCharCode(65 + idx),
          text: o.text || o.option || String(o),
          isCorrect: Boolean(o.isCorrect || o.id === q.correctAnswer || idx === 0)
        })) : []
      };
      const res = await api.post(`/quizzes/faculty/${quizId}/questions`, payload);
      results.push(res.data.data || res.data);
    }
    return results;
  },

  getQuestions: async (quizId: string) => {
    try {
      const res = await api.get(`/quizzes/${quizId}/questions`);
      return res.data.data || res.data;
    } catch (err) {
      try {
        const res = await api.get(`/quizzes/student/${quizId}/questions`);
        return res.data.data || res.data;
      } catch (err2) {
        const res = await api.get(`/quizzes/faculty/${quizId}/questions`);
        return res.data.data || res.data;
      }
    }
  },

  startQuiz: async (quizId: string) => {
    const res = await api.get(`/quizzes/student/${quizId}/start`);
    return res.data.data || res.data;
  },

  submitQuiz: async (quizId: string, answers: Record<string, string>) => {
    const res = await api.post(`/quizzes/student/${quizId}/submit`, { answers });
    return res.data.data || res.data;
  },

  getStudentResults: async () => {
    const res = await api.get('/quizzes/student/results');
    return res.data.data || res.data;
  },

  getAttemptAnalysis: async (id: string) => {
    const res = await api.get(`/quizzes/attempts/${id}/analysis`);
    return res.data.data || res.data;
  },

  getQuizAttempts: async (quizId: string) => {
    const res = await api.get(`/quizzes/admin/${quizId}/attempts`);
    return res.data.data || res.data;
  },

  evaluateQuiz: async (quizId: string, answerKeyUpdates?: Record<string, string>) => {
    const res = await api.post(`/quizzes/faculty/${quizId}/grade`, answerKeyUpdates || {});
    return res.data;
  },

  generateAnswerKey: async (quizId: string) => {
    const res = await api.get(`/quizzes/faculty/${quizId}/ai/generate-answer-key`);
    return res.data.data || res.data;
  },

  generateQuestionsAdvanced: async (classSubjectId: string, params: {
    topic: string;
    unitSyllabus?: string;
    count: number;
    difficulty: string;
    questionType: string;
    marksPerQuestion: number;
    timestamp?: string;
  }) => {
    const res = await api.get(`/quizzes/faculty/subjects/${classSubjectId}/ai/generate-questions-advanced`, { params });
    return res.data.data || res.data;
  },

  extractFromSource: async (sourceType?: string, sourceUrl?: string) => {
    const res = await api.post(`/quizzes/faculty/extract-source?sourceType=${sourceType || 'MANUAL'}&sourceUrl=${encodeURIComponent(sourceUrl || '')}`);
    return res.data.data || res.data;
  }
};
