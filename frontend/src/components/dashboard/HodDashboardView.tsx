import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Users, BookOpen, CheckCircle, Clock, Activity, Bell, FileText, FileBadge } from 'lucide-react';
import { RecentNoticesCard, UpcomingEventsCard } from '../DashboardShared';
import api from '@/services/api';
import { noticeService } from '@/services/noticeService';
import { eventService } from '@/services/eventService';

export const HodDashboardView = ({ user }: { user: any }) => {
  const [data, setData] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHodData = async () => {
      try {
        const [dashRes, noticeRes, eventRes] = await Promise.all([
          api.get('/dashboard/hod'),
          noticeService.getNotices(),
          eventService.getAllEvents()
        ]);
        if (dashRes.data?.data) setData(dashRes.data.data);
        
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
        console.error("Failed to fetch HOD dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHodData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Department Dashboard...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Unable to load dashboard data.</div>;
  }

  const summaryCards = [
    { title: 'Total Students', value: data.departmentStudentCount || 0, icon: <Users />, color: 'bg-blue-500/10 text-blue-500' },
    { title: 'Total Faculty', value: data.departmentFacultyCount || 0, icon: <BookOpen />, color: 'bg-indigo-500/10 text-indigo-500' },
    { title: 'Exams Conducted', value: data.examinationCount || 0, icon: <FileText />, color: 'bg-emerald-500/10 text-emerald-500' },
    { title: 'Assignments', value: data.assignmentCount || 0, icon: <CheckCircle />, color: 'bg-teal-500/10 text-teal-500' },
    { title: 'Quizzes', value: data.quizCount || 0, icon: <Activity />, color: 'bg-purple-500/10 text-purple-500' },
  ];

  const attendancePercentage = data.departmentAttendancePercentage;

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaryCards.map((card, idx) => (
          <Card key={idx} className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full relative">
              <div className={`p-2 rounded-full mb-2 ${card.color} transition-transform group-hover:scale-110`}>
                {React.cloneElement(card.icon as React.ReactElement<any>, { className: "w-5 h-5" })}
              </div>
              <h3 className="text-xl font-bold text-foreground">{card.value}</h3>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentNoticesCard notices={notices} basePath="/admin" />
            <UpcomingEventsCard events={events} basePath="/admin" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions / Faculty Overview */}
          <Card className="border border-border/50 shadow-sm">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <BookOpen className="w-4 h-4 text-primary" /> Academic Resources
                </h3>
                <a href="/admin/academic-resources" className="text-xs text-primary hover:underline font-medium">View</a>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <a href="/admin/academic-resources" className="bg-muted/30 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors block cursor-pointer">
                  <span className="block text-lg font-bold text-foreground">{data.academicResources?.totalSchemes || 0}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center justify-center gap-1">Schemes</span>
                </a>
                <a href="/admin/academic-resources" className="bg-muted/30 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors block cursor-pointer">
                  <span className="block text-lg font-bold text-foreground">{data.academicResources?.totalSyllabus || 0}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center justify-center gap-1">Syllabus</span>
                </a>
                <a href="/admin/academic-resources" className="bg-muted/30 p-3 rounded-lg border border-border/50 col-span-2 hover:bg-muted/50 transition-colors block cursor-pointer">
                  <span className="block text-lg font-bold text-foreground">{data.academicResources?.totalLectureMaterials || 0}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center justify-center gap-1">Timetable</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
