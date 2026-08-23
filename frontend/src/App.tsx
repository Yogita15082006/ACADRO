import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { GenericModule } from './pages/GenericModule';
import { AttendanceModule } from './pages/AttendanceModule';
import { AssignmentModule } from './pages/AssignmentModule';
import { QuizModule } from './pages/QuizModule';
import { ExaminationModule } from './pages/ExaminationModule';
import { EventsModule } from './pages/EventsModule';
import { NoticeModule } from './pages/NoticeModule';
import { ProfileModule } from './pages/ProfileModule';
import { StudentsModule } from './pages/StudentsModule';
import { FacultyActivityModule } from './pages/FacultyActivityModule';
import { FacultyRequestsModule } from './pages/FacultyRequestsModule';
import { CoordinatorsModule } from './pages/CoordinatorsModule';
import { ClassesModule } from './pages/ClassesModule';
import { FacultyManagementModule } from './pages/FacultyManagementModule';
import { AcademicResourcesModule } from './pages/AcademicResourcesModule';
import { NotificationsModule } from './pages/NotificationsModule';
import { Toaster } from 'sonner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const defaultRoute = role === 'student' ? '/student' : '/admin';
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['hod', 'coordinator', 'faculty']}><Layout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="classes" element={<ClassesModule />} />
        <Route path="students" element={<StudentsModule />} />
        <Route path="faculty-management" element={<FacultyManagementModule />} />
        <Route path="attendance" element={<AttendanceModule />} />
        <Route path="assignments" element={<AssignmentModule />} />
        <Route path="quiz" element={<QuizModule />} />
        <Route path="examinations" element={<ExaminationModule />} />
        <Route path="events" element={<EventsModule />} />
        <Route path="notice" element={<NoticeModule />} />
        <Route path="profile" element={<ProfileModule />} />
        <Route path="notifications" element={<NotificationsModule />} />
        <Route path="faculty-activity" element={<FacultyActivityModule />} />
        <Route path="faculty-requests" element={<FacultyRequestsModule />} />
        <Route path="coordinators" element={<CoordinatorsModule />} />
        <Route path="academic-resources" element={<AcademicResourcesModule />} />
        <Route path="reports" element={<GenericModule title="Reports" type="reports" />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><Layout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="classes" element={<ClassesModule />} />
        <Route path="attendance" element={<AttendanceModule />} />
        <Route path="assignments" element={<AssignmentModule />} />
        <Route path="quiz" element={<QuizModule />} />
        <Route path="examinations" element={<ExaminationModule />} />
        <Route path="events" element={<EventsModule />} />
        <Route path="notice" element={<NoticeModule />} />
        <Route path="academic-resources" element={<AcademicResourcesModule />} />
        <Route path="profile" element={<ProfileModule />} />
        <Route path="notifications" element={<NotificationsModule />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" richColors />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
