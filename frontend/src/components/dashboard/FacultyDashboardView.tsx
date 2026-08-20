import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { BookOpen, Activity, Library, PieChart, Calendar, AlertTriangle, UserCheck } from 'lucide-react';
import { RecentNoticesCard, UpcomingEventsCard } from '../DashboardShared';
import api from '@/services/api';
import { noticeService } from '@/services/noticeService';
import { eventService } from '@/services/eventService';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

export const FacultyDashboardView = ({ user }: { user: any }) => {
  const [data, setData] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ daysPresent: 0, daysAbsent: 0, totalWorkingDays: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, noticeRes, eventRes, attRes] = await Promise.all([
          api.get('/dashboard/faculty'),
          noticeService.getNotices(),
          eventService.getAllEvents(),
          api.get(`/attendance-sessions/faculty/${user.id}/statistics`).catch(() => ({ data: { daysPresent: 0, daysAbsent: 0, totalWorkingDays: 0 } }))
        ]);
        if (dashRes.data?.data) setData(dashRes.data.data);
        
        if (attRes?.data) {
          setAttendanceStats({
            daysPresent: attRes.data.daysPresent || 0,
            daysAbsent: attRes.data.daysAbsent || 0,
            totalWorkingDays: attRes.data.totalWorkingDays || 0
          });
        }
        
        if (Array.isArray(noticeRes)) {
          setNotices(noticeRes);
        } else if (Array.isArray(noticeRes?.data)) {
          setNotices(noticeRes.data);
        } else if (noticeRes?.data?.content) {
          setNotices(noticeRes.data.content);
        } else if (noticeRes?.content) {
          setNotices(noticeRes.content);
        }

        if (Array.isArray(eventRes)) {
          setEvents(eventRes);
        } else if (Array.isArray(eventRes?.data)) {
          setEvents(eventRes.data);
        } else if (eventRes?.data?.content) {
          setEvents(eventRes.data.content);
        } else if (eventRes?.content) {
          setEvents(eventRes.content);
        }
      } catch (err) {
        console.error("Failed to fetch Faculty dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Faculty Dashboard...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Unable to load dashboard data.</div>;
  }

  const assignedSubjectsCount = data.totalAssignedSubjects || 0;
  const overallAttendance = attendanceStats.totalWorkingDays > 0 
    ? Math.round((attendanceStats.daysPresent / attendanceStats.totalWorkingDays) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Assigned Subjects */}
        <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
          <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full relative">
            <div className="p-2 rounded-full mb-2 bg-indigo-500/10 text-indigo-500 transition-transform group-hover:scale-110">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{assignedSubjectsCount}</h3>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Assigned Subjects</p>
          </CardContent>
        </Card>

        {/* My Attendance */}
        <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
          <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full relative">
            <div className={`p-2 rounded-full mb-2 ${overallAttendance >= 75 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} transition-transform group-hover:scale-110`}>
              <PieChart className="w-5 h-5" />
            </div>
            {attendanceStats.totalWorkingDays > 0 ? (
              <>
                <h3 className="text-2xl font-bold text-foreground">{overallAttendance}%</h3>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">My Attendance</p>
                <div className="flex justify-center gap-3 mt-2 text-[10px] text-muted-foreground font-medium w-full">
                  <span title="Total Working Days" className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {attendanceStats.totalWorkingDays}</span>
                  <span title="Days Present" className="flex items-center gap-1 text-emerald-500/80"><UserCheck className="w-3 h-3" /> {attendanceStats.daysPresent}</span>
                  <span title="Days Absent" className="flex items-center gap-1 text-rose-500/80"><AlertTriangle className="w-3 h-3" /> {attendanceStats.daysAbsent}</span>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-muted-foreground/50 mt-1">--</h3>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">No attendance records</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Quizzes */}
        <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
          <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full relative">
            <div className="p-2 rounded-full mb-2 bg-purple-500/10 text-purple-500 transition-transform group-hover:scale-110">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{data.upcomingQuizCount || 0}</h3>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Upcoming Quizzes</p>
          </CardContent>
        </Card>

        {/* Upcoming Exams */}
        <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
          <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full relative">
            <div className="p-2 rounded-full mb-2 bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{data.upcomingExamCount || 0}</h3>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Upcoming Exams</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentNoticesCard notices={notices} basePath="/admin" />
            <UpcomingEventsCard events={events} basePath="/admin" />
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Library className="w-4 h-4 text-primary" /> Academic Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-primary/10 rounded-full mt-4">
                <Library className="w-8 h-8 text-primary" />
              </div>
              <CardDescription className="text-sm px-4">
                Access and manage your academic resources including lecture materials, syllabi, and schemes.
              </CardDescription>
              <Button 
                onClick={() => navigate('/admin/academic-resources')}
                className="w-full mt-4"
              >
                View Academic Resources
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
