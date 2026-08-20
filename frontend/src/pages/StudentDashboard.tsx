import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAssetUrl } from '@/lib/utils';
import { 
  BookOpen, CheckCircle, Clock, FileText, Calendar as CalendarIcon, 
  Bell, Activity, LayoutDashboard, Target, Trophy, 
  AlertTriangle, ChevronRight, TrendingUp, Folder, FileQuestion
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import api from '../services/api';
import { eventService } from '@/services/eventService';
import { RecentNoticesCard, UpcomingEventsCard } from '../components/DashboardShared';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const studentName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Student';
  const firstName = user?.firstName || (studentName ? studentName.split(' ')[0] : 'Student');
  const enrollmentNo = user?.enrollmentNo || user?.enrollmentNumber || 'N/A';
  const avatarUrl = user?.profilePictureUrl ? getAssetUrl(user.profilePictureUrl) : user?.avatar ? getAssetUrl(user.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=4F46E5&color=fff`;

  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, eventRes] = await Promise.all([
          api.get('/dashboard/student'),
          eventService.getAvailableEvents()
        ]);
        if (dashRes.data?.data) setData(dashRes.data.data);
        if (eventRes.data?.data) setEvents(eventRes.data.data);
      } catch (err) {
        console.error('Failed to fetch student dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Student Portal...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Unable to load dashboard data.</div>;
  }

  const overallAttendance = Math.round(data.attendanceOverview?.attendancePercentage || 0);
  const pendingAssignmentsCount = data.pendingAssignments?.length || 0;
  const upcomingQuizzesCount = data.upcomingQuizzes?.length || 0;
  const unreadNoticesCount = data.latestNotices?.length || 0;
  const upcomingEventsCount = events.length || 0;
  
  // Aggregate tasks for the deadlines card
  const upcomingDeadlines = [
    ...(data.pendingAssignments || []).map((a: any) => ({
      title: a.title,
      type: 'Assignment',
      due: new Date(a.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      color: 'text-warning bg-warning/10 border-warning/20',
      icon: <FileText className="w-4 h-4" />
    })),
    ...(data.upcomingQuizzes || []).map((q: any) => ({
      title: q.title,
      type: 'Quiz',
      due: new Date(q.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      color: 'text-destructive bg-destructive/10 border-destructive/20',
      icon: <FileQuestion className="w-4 h-4" />
    })),
    ...(data.upcomingExams || []).map((e: any) => ({
      title: e.examinationName,
      type: 'Exam',
      due: new Date(e.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      color: 'text-primary bg-primary/10 border-primary/20',
      icon: <Activity className="w-4 h-4" />
    }))
  ].slice(0, 5);

  const summaryCards = [
    { title: 'Overall Attendance', value: `${overallAttendance}%`, icon: <CheckCircle />, color: overallAttendance >= 75 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500' },
    { title: 'Pending Assignments', value: pendingAssignmentsCount, icon: <FileText />, color: 'bg-amber-500/10 text-amber-500' },
    { title: 'Upcoming Quizzes', value: upcomingQuizzesCount, icon: <Target />, color: 'bg-indigo-500/10 text-indigo-500' },
    { title: 'Upcoming Events', value: upcomingEventsCount, icon: <Activity />, color: 'bg-purple-500/10 text-purple-500' },
    { title: 'Latest Notices', value: unreadNoticesCount, icon: <Bell />, color: 'bg-orange-500/10 text-orange-500' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border/50 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            Student Portal
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Welcome back, {firstName}. Here is your academic overview.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-muted/30 px-4 py-2 rounded-lg border border-border/50">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Enrollment No.</p>
            <p className="font-semibold text-foreground text-sm">{enrollmentNo}</p>
          </div>
          <div className="relative">
            <img src={avatarUrl} alt="Student" className="w-10 h-10 rounded-md shadow-sm border border-border/50 object-cover" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-card"></div>
          </div>
        </div>
      </div>

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
        
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Subject Overview Table */}
          <Card className="border border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Subject Overview & Attendance
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/10 border-b border-border/50">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Subject</th>
                    <th className="px-5 py-3 font-semibold">Total Classes</th>
                    <th className="px-5 py-3 font-semibold">Attended</th>
                    <th className="px-5 py-3 font-semibold">Percentage</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.subjectAttendance?.map((subject: any, idx: number) => {
                    const percentage = Math.round(subject.percentage || 0);
                    const status = percentage >= 75 ? 'Safe' : percentage >= 65 ? 'Warning' : 'Danger';
                    return (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3 text-foreground font-medium">
                          {subject.subjectName}
                        </td>
                        <td className="px-5 py-3 text-foreground">{subject.totalClasses}</td>
                        <td className="px-5 py-3 text-foreground">{subject.classesAttended}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-muted rounded-full h-1.5 max-w-[60px]">
                              <div 
                                className={`h-1.5 rounded-full ${percentage >= 75 ? 'bg-success' : percentage >= 65 ? 'bg-warning' : 'bg-destructive'}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="font-semibold text-foreground text-xs">{percentage}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant="outline" className={
                            status === 'Safe' ? 'text-success border-success/30 bg-success/10' :
                            status === 'Warning' ? 'text-warning border-warning/30 bg-warning/10' :
                            'text-destructive border-destructive/30 bg-destructive/10'
                          }>
                            {status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {(!data.subjectAttendance || data.subjectAttendance.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-muted-foreground">
                        No subject attendance data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentNoticesCard notices={data.latestNotices || []} basePath="/student" />
            <UpcomingEventsCard events={events} basePath="/student" />
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Actionable Alerts (Deadlines) */}
          <Card className="border border-border/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warning to-destructive"></div>
            <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" /> Upcoming Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {upcomingDeadlines.map((task: any, idx: number) => (
                  <div key={idx} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${task.color} shrink-0`}>
                      {task.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">{task.title}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{task.type}</span>
                        <span className="text-xs font-semibold text-destructive">{task.due}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingDeadlines.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">No upcoming tasks or exams!</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Grades/Marks */}
          <Card className="border border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" /> Recent Quiz Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {(data.recentQuizScores || []).map((grade: any, idx: number) => (
                  <div key={idx} className="p-4 hover:bg-muted/30 transition-colors flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground truncate">{grade.quizTitle}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(grade.completedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-foreground">{grade.score}/{grade.totalMarks}</div>
                      <div className="text-[10px] font-bold text-success uppercase tracking-wider mt-0.5">Completed</div>
                    </div>
                  </div>
                ))}
                {(!data.recentQuizScores || data.recentQuizScores.length === 0) && (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No recent quiz scores.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Academic Resources Dashboard Card */}
          <Card 
            className="border border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-primary/50 bg-card"
            onClick={() => navigate('/student/academic-resources')}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Folder className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">Academic Resources</h3>
                <p className="text-xs text-muted-foreground">Access Syllabus, Schemes & Timetables</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};
