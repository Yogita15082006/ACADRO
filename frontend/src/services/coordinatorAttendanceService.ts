import api from './api';
import { toast } from 'sonner';

export interface CoordinatorStudent {
    id: string;
    name: string;
    enrollmentNumber: string;
    photo: string;
    overallAttendance: number;
}

export interface CoordinatorSectionData {
    className: string;
    semester: string;
    batch: string;
    academicYear: string;
    students: CoordinatorStudent[];
    sectionAverage: number;
}

export interface CoordinatorLecture {
    id: string;
    subject: string;
    faculty: string;
    lectureNumber: string;
    startTime: string;
    endTime: string;
    status: string;
}

export interface CoordinatorEvent {
    id: string;
    title: string;
    eventDate: string;
    status: string;
    includeInOverallAttendance: boolean;
    lecturesCount: number;
}

export interface CoordinatorSchedule {
    lectures: CoordinatorLecture[];
    events: CoordinatorEvent[];
}

let cachedMyStudents: CoordinatorSectionData | null = null;

try {
    const stored = sessionStorage.getItem('acro_coordinator_students');
    if (stored) {
        cachedMyStudents = JSON.parse(stored);
    }
} catch (e) {
    console.error("Failed to parse cached students", e);
}

export const coordinatorAttendanceService = {
    getCachedStudents: () => cachedMyStudents,
    
    getMyStudents: async (forceRefresh = false): Promise<CoordinatorSectionData | null> => {
        if (!forceRefresh && cachedMyStudents) return cachedMyStudents;
        try {
            const response = await api.get('/v1/coordinator-attendance/my-students');
            cachedMyStudents = response.data?.data || null;
            if (cachedMyStudents) {
                sessionStorage.setItem('acro_coordinator_students', JSON.stringify(cachedMyStudents));
            }
            return cachedMyStudents;
        } catch (error) {
            if (cachedMyStudents) {
                toast.warning('Using cached attendance data (Background refresh failed)');
                return cachedMyStudents; // fallback to cache on error
            }
            throw error;
        }
    },
    clearCache: () => {
        cachedMyStudents = null;
        sessionStorage.removeItem('acro_coordinator_students');
    },

    getScheduleForDate: async (date: string): Promise<CoordinatorSchedule> => {
        const response = await api.get(`/v1/coordinator-attendance/schedule?date=${date}`);
        return response.data?.data || { lectures: [], events: [] };
    },

    addBulkAttendance: async (data: { date: string, studentIds: string[], sessionIds: string[], eventIds: string[] }): Promise<any> => {
        const response = await api.post('/v1/coordinator-attendance/add-bulk', data);
        return response.data;
    }
};
