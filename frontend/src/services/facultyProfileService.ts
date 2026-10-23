import api from './api';

export interface FacultyProfileData {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  departmentId?: string;
  departmentName?: string;
  profilePictureUrl?: string;

  // 1. Personal & Employment
  designation?: string;
  joiningDate?: string;
  employmentType?: string;
  pan?: string;
  aicteId?: string;
  rgpvId?: string;
  highestQualification?: string;
  hasPhd?: boolean;
  phdUniversity?: string;
  phdAwardDate?: string;
  pgDetail?: string;
  pgSpecialization?: string;
  pgUniversity?: string;
  pgYear?: number;
  ugDetail?: string;
  ugSpecialization?: string;
  ugUniversity?: string;
  ugYear?: number;
  remarks?: string;

  // 2. Experience & Retention
  teachingExperienceYears?: number;
  industryExperienceYears?: number;
  aitrServiceYears?: number;
  experienceAcropolis?: number;
  totalExperience?: number;
  currentDesignationSince?: string;
  previousInstitute?: string;
  retentionCategory?: string;

  // 4. Research counts
  sciCount?: number;
  scopusCount?: number;
  ugcCount?: number;
  booksCount?: number;
  bookChaptersCount?: number;
  patentsCount?: number;
  projectsCount?: number;
  consultancyCount?: number;
  googleScholarId?: string;
  orcidId?: string;
  scopusId?: string;

  // 6. Workload
  theoryLoadHours?: number;
  labLoadHours?: number;
  totalTeachingLoadHours?: number;
  projectGuideDetails?: string;
  mentoringDetails?: string;
  adminDuties?: string;

  promotions?: any[];
  researchContributions?: any[];
  resourcePersons?: any[];
  assignedSubjects?: any[];
  documents?: Record<string, any>;
}

export const facultyProfileService = {
  getMyProfile: async () => {
    const res = await api.get('/v1/faculty-profile/me');
    return res.data.data;
  },

  getProfileById: async (facultyId: string) => {
    const res = await api.get(`/v1/faculty-profile/${facultyId}`);
    return res.data.data;
  },

  updateMyProfile: async (data: Partial<FacultyProfileData>) => {
    const res = await api.put('/v1/faculty-profile', data);
    return res.data.data;
  },

  updateProfileById: async (facultyId: string, data: Partial<FacultyProfileData>) => {
    const res = await api.put(`/v1/faculty-profile/${facultyId}`, data);
    return res.data.data;
  },

  // Promotions
  getPromotions: async (facultyId: string) => {
    const res = await api.get(`/v1/faculty-profile/${facultyId}/promotions`);
    return res.data.data || [];
  },

  addPromotion: async (facultyId: string, data: any) => {
    const res = await api.post(`/v1/faculty-profile/${facultyId}/promotions`, data);
    return res.data.data;
  },

  updatePromotion: async (facultyId: string, promotionId: string, data: any) => {
    const res = await api.put(`/v1/faculty-profile/${facultyId}/promotions/${promotionId}`, data);
    return res.data.data;
  },

  deletePromotion: async (facultyId: string, promotionId: string) => {
    const res = await api.delete(`/v1/faculty-profile/${facultyId}/promotions/${promotionId}`);
    return res.data.data;
  },

  // Research Contributions
  getResearch: async (facultyId: string) => {
    const res = await api.get(`/v1/faculty-profile/${facultyId}/research`);
    return res.data.data || [];
  },

  addResearch: async (facultyId: string, data: any) => {
    const res = await api.post(`/v1/faculty-profile/${facultyId}/research`, data);
    return res.data.data;
  },

  deleteResearch: async (facultyId: string, contributionId: string) => {
    const res = await api.delete(`/v1/faculty-profile/${facultyId}/research/${contributionId}`);
    return res.data.data;
  },

  // Resource Persons
  getResourcePersons: async (facultyId: string) => {
    const res = await api.get(`/v1/faculty-profile/${facultyId}/resource-person`);
    return res.data.data || [];
  },

  addResourcePerson: async (facultyId: string, data: any) => {
    const res = await api.post(`/v1/faculty-profile/${facultyId}/resource-person`, data);
    return res.data.data;
  },

  deleteResourcePerson: async (facultyId: string, id: string) => {
    const res = await api.delete(`/v1/faculty-profile/${facultyId}/resource-person/${id}`);
    return res.data.data;
  },

  // Workload
  getWorkload: async (facultyId: string) => {
    const res = await api.get(`/v1/faculty-profile/${facultyId}/workload`);
    return res.data.data;
  },

  updateWorkload: async (facultyId: string, data: any) => {
    const res = await api.put(`/v1/faculty-profile/${facultyId}/workload`, data);
    return res.data.data;
  },

  // Class & Department Strength
  getClassStrength: async (params?: { departmentId?: string; academicYear?: string; semesterNumber?: number }) => {
    const res = await api.get('/v1/faculty-profile/class-strength', { params });
    return res.data.data || [];
  },

  updateClassStrength: async (data: any) => {
    const res = await api.put('/v1/faculty-profile/class-strength', data);
    return res.data.data;
  },

  // Documents & Photos
  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/v1/profile/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data?.url;
  },

  uploadPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/v1/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data?.url;
  },

  // HOD Department Reports & Exports
  getDepartmentFacultyProfiles: async (): Promise<FacultyProfileData[]> => {
    const res = await api.get('/v1/faculty-profile/department/all');
    return res.data.data || [];
  },

  downloadDepartmentExcel: async () => {
    const res = await api.get('/v1/faculty-profile/department/export-excel', {
      responseType: 'blob'
    });
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    let filename = `Department_Faculty_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    const disposition = res.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
};
