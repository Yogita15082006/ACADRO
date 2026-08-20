import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, BookOpen, Clock, Activity, FileText } from 'lucide-react';
import { Badge } from '../ui/badge';
import { RecentNoticesCard, UpcomingEventsCard } from '../DashboardShared';
import api from '@/services/api';
import { noticeService } from '@/services/noticeService';
import { eventService } from '@/services/eventService';

export const CoordinatorDashboardView = ({ user }: { user: any }) => {
  const [data, setData] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, noticeRes, eventRes] = await Promise.all([
          api.get('/dashboard/coordinator'),
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
        console.error("Failed to fetch Coordinator dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Coordinator Dashboard...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Unable to load dashboard data.</div>;
  }

  const assignedClassesCount = data.totalClasses || 0;

  const summaryCards = [
    { title: 'Managed Classes', value: assignedClassesCount, icon: <Users />, color: 'bg-blue-500/10 text-blue-500' },
    { title: 'Total Students', value: data.totalStudents || 0, icon: <Users />, color: 'bg-emerald-500/10 text-emerald-500' },
    { title: 'Total Subjects', value: data.totalSubjects || 0, icon: <BookOpen />, color: 'bg-amber-500/10 text-amber-500' },
    { title: 'Eligible Students', value: data.eligibilityStats?.totalEligible || 0, icon: <Activity />, color: 'bg-success/10 text-success' },
    { title: 'Defaulters', value: data.eligibilityStats?.totalDefaulters || 0, icon: <FileText />, color: 'bg-destructive/10 text-destructive' },
  ];

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

          {/* Managed Classes Overview Table */}
          <Card className="border border-border/50 shadow-sm bg-card overflow-hidden">
            <div className="bg-muted/30 border-b border-border p-4">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Managed Classes Overview
              </h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/20">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Class</th>
                    <th className="px-6 py-3 font-semibold text-center">Students</th>
                    <th className="px-6 py-3 font-semibold text-center">Eligible</th>
                    <th className="px-6 py-3 font-semibold text-center">Defaulters</th>
                    <th className="px-6 py-3 font-semibold text-center">Avg Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.classOverview && data.classOverview.length > 0 ? (
                    data.classOverview.map((cls: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{cls.className}</td>
                        <td className="px-6 py-4 text-center">{cls.studentCount || 0}</td>
                        <td className="px-6 py-4 text-center text-success font-medium">{cls.eligibleStudents || 0}</td>
                        <td className="px-6 py-4 text-center text-destructive font-medium">{cls.defaulterStudents || 0}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            (cls.attendancePercentage || 0) >= 75 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                          }`}>
                            {cls.attendancePercentage || 0}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No class data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-border/50 shadow-sm bg-card">
            <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Class Quick List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {data.classOverview && data.classOverview.length > 0 ? (
                  data.classOverview.map((cls: any, idx: number) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <span className="text-sm font-semibold text-foreground">{cls.className}</span>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Class</Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">No classes assigned.</div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/50 shadow-sm bg-card mt-6">
            <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-3">
                <a 
                  href="/admin/classes"
                  className="bg-background border border-border/50 hover:bg-muted/50 transition-colors p-3 rounded-xl flex flex-col items-center justify-center gap-2 text-center group"
                >
                  <Users className="text-blue-500 w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-foreground">Manage Classes</span>
                </a>
                <a 
                  href="/admin/students"
                  className="bg-background border border-border/50 hover:bg-muted/50 transition-colors p-3 rounded-xl flex flex-col items-center justify-center gap-2 text-center group"
                >
                  <Activity className="text-emerald-500 w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-foreground">View Students</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
