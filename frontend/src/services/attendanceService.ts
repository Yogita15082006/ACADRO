import api from './api';

export interface AttendanceSessionRequest {
  subjectName: string;
  className: string;
  semester: string;
  academicYear: string;
  department: string;
  lectureType: string;
  lectureNumber: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  duration: string;
  attendanceCode: string;
  requireVerification: boolean;
  verificationQuestion?: string;
  expectedAnswer?: string;
}

export interface AttendanceSessionResponse {
  id: string;
  facultyId: string;
  subjectName: string;
  className: string;
  semester: string;
  academicYear: string;
  department: string;
  lectureType: string;
  lectureNumber: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  duration: string;
  attendanceCode: string;
  requireVerification: boolean;
  verificationQuestion?: string;
  status: string;
  createdAt: string;
  presentCount: number;
  totalStudents: number;
}

export interface MarkAttendanceRequest {
  sessionId: string;
  attendanceCode: string;
  verificationAnswer?: string;
}

export const attendanceService = {
  createSession: async (facultyId: string, data: AttendanceSessionRequest): Promise<AttendanceSessionResponse> => {
    const response = await api.post(`/api/attendance-sessions/faculty/${facultyId}`, data);
    return response.data;
  },

  getFacultySessions: async (facultyId: string): Promise<AttendanceSessionResponse[]> => {
    const response = await api.get(`/api/attendance-sessions/faculty/${facultyId}`);
    return response.data;
  },

  getSessionDetails: async (sessionId: string): Promise<AttendanceSessionResponse> => {
    const response = await api.get(`/api/attendance-sessions/${sessionId}`);
    return response.data;
  },

  markAttendance: async (data: MarkAttendanceRequest): Promise<void> => {
    const response = await api.post(`/api/attendance-sessions/${data.sessionId}/mark`, data);
    return response.data;
  }
};
