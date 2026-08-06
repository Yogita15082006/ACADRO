import api from './api';

export interface AttendanceSessionRequest {
  classSubjectId: string;
  type: string;
  lectureNumber: string;
  topic?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  code: string;
  requireVerification: boolean;
  verificationQuestion?: string;
  expectedAnswer?: string;
  uniqueCodeCount: number;
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
  topic?: string;
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
  uniqueCodeCount: number;
  isSystemGenerated: boolean;
  facultyReason?: string;
}

export interface MarkAttendanceRequest {
  sessionId: string;
  attendanceCode: string;
  verificationAnswer?: string;
  uniqueCode?: number;
}

export const attendanceService = {
  createSession: async (facultyId: string, data: AttendanceSessionRequest): Promise<AttendanceSessionResponse> => {
    const response = await api.post(`/attendance-sessions/faculty/${facultyId}`, data);
    return response.data;
  },

  getFacultySessions: async (facultyId: string): Promise<AttendanceSessionResponse[]> => {
    const response = await api.get(`/attendance-sessions/faculty/${facultyId}`);
    return response.data;
  },

  getActiveSessionsForClass: async (classSubjectId: string): Promise<AttendanceSessionResponse[]> => {
    const response = await api.get(`/attendance-sessions/class/${classSubjectId}/active`);
    return response.data;
  },

  getSessionDetails: async (sessionId: string): Promise<AttendanceSessionResponse> => {
    const response = await api.get(`/attendance-sessions/${sessionId}`);
    return response.data;
  },

  markAttendance: async (data: MarkAttendanceRequest): Promise<void> => {
    const response = await api.post(`/attendance-sessions/${data.sessionId}/mark`, data);
    return response.data;
  },

  updateSessionStatus: async (sessionId: string, status: string): Promise<AttendanceSessionResponse> => {
    const response = await api.put(`/attendance-sessions/${sessionId}/status?status=${status}`);
    return response.data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/attendance-sessions/${sessionId}`);
  },

  getLiveResponses: async (sessionId: string): Promise<any[]> => {
    const response = await api.get(`/attendance-sessions/${sessionId}/live`);
    return response.data;
  },

  addStudentToHistory: async (sessionId: string, enrollmentNumber: string): Promise<void> => {
    const response = await api.post(`/attendance-sessions/${sessionId}/add-student/${enrollmentNumber}`);
    return response.data;
  },
  
  respondToRequest: async (sessionId: string, attendanceId: string, accept: boolean): Promise<void> => {
    const response = await api.put(`/attendance-sessions/${sessionId}/respond-request/${attendanceId}?accept=${accept}`);
    return response.data;
  },

  bulkRespondToRequests: async (sessionId: string, attendanceIds: string[], accept: boolean): Promise<void> => {
    const response = await api.post(`/attendance-sessions/${sessionId}/bulk-respond`, {
      attendanceIds,
      accept
    });
    return response.data;
  },

  getStudentOverallAttendance: async (studentId: string): Promise<any> => {
    const response = await api.get(`/attendance-dashboard/student/${studentId}/overall`);
    return response.data.data;
  },
  
  getStudentSubjectWiseAttendance: async (studentId: string): Promise<any[]> => {
    const response = await api.get(`/attendance-dashboard/student/${studentId}/subject-wise`);
    return response.data.data;
  },
  
  getStudentAttendanceHistory: async (studentId: string): Promise<any[]> => {
    const response = await api.get(`/attendance-dashboard/student/${studentId}/history`);
    return response.data.data;
  },

  bulkApproveText: async (sessionId: string, text: string): Promise<any> => {
    const response = await api.post(`/attendance-sessions/${sessionId}/bulk-approve-text`, { text });
    return response.data;
  },



  bulkApplyReview: async (sessionId: string, data: { approveIds: string[], rejectIds: string[], approvalSource: string, remarks: string }): Promise<void> => {
    await api.post(`/attendance-sessions/${sessionId}/bulk-apply-review`, data);
  }
};
