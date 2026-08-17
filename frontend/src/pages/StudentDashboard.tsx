import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, CheckCircle, Clock, FileText, Calendar as CalendarIcon, 
  Bell, Activity, LayoutDashboard, Target, Trophy, 
  AlertTriangle, ChevronRight, TrendingUp, Folder 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import api from '../services/api';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // KPI Data (Mocked for Student ERP View)
  const studentName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Student';
  const firstName = user?.firstName || (studentName ? studentName.split(' ')[0] : 'Student');
  const enrollmentNo = user?.enrollmentNo || user?.enrollmentNumber || 'N/A';
  const avatarUrl = user?.avatar || user?.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=4F46E5&color=fff`;
  const overallAttendance = user?.overallAttendance || 78;
  const pendingAssignments = 3;
  const todaysClasses = 4;
  const upcomingQuizzes = 2;
  const upcomingEvents = 1;
  const unreadNotices = 2;
  const currentSGPA = 8.4;
  const totalCredits = 24;
  const academicStatus = "Safe";

  const schedule = [
    { time: '09:00 AM', subject: 'Java Programming', faculty: 'Dr. Smith', type: 'Lecture', status: 'Attended', color: 'bg-success/20 text-success border-success/30' },
    { time: '11:00 AM', subject: 'DBMS', faculty: 'Prof. Johnson', type: 'Lab', status: 'Ongoing', color: 'bg-warning/20 text-warning border-warning/30' },
    { time: '02:00 PM', subject: 'Web Development', faculty: 'Mr. Davis', type: 'Lecture', status: 'Upcoming', color: 'bg-primary/20 text-primary border-primary/30' },
  ];

  const [subjectOverview, setSubjectOverview] = useState<any[]>([]);
  const [liveOverallAttendance, setLiveOverallAttendance] = useState<number>(user?.overallAttendance || 78);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (!user?.id) return;
        const res = await api.get(`/attendance-reports/student/${user.id}`);
        if (res.data?.data) {
          const report = res.data.data;
          setLiveOverallAttendance(Math.round(report.overallAttendancePercentage || 0));
          
          if (report.subjectWiseAttendance) {
            setSubjectOverview(report.subjectWiseAttendance.map((s: any) => ({
              name: s.subjectName || 'Unknown Subject',
              code: s.classSubjectId?.substring(0, 8) || '',
              total: s.totalClasses,
              attended: s.attendedClasses,
              percentage: Math.round(s.attendancePercentage),
              status: s.attendancePercentage >= 75 ? 'Safe' : s.attendancePercentage >= 65 ? 'Warning' : 'Danger'
            })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch student report', err);
      }
    };
    
    fetchReport();
    window.addEventListener('sync-attendance-data', fetchReport);
    return () => window.removeEventListener('sync-attendance-data', fetchReport);
  }, [user?.id]);

  const upcomingDeadlines = [
    { title: 'DBMS Normalization Assignment', type: 'Assignment', due: 'Tomorrow, 11:59 PM', color: 'text-warning bg-warning/10 border-warning/20', icon: <FileText className="w-4 h-4" /> },
    { title: 'Java Unit 2 Quiz', type: 'Quiz', due: 'Friday, 10:00 AM', color: 'text-destructive bg-destructive/10 border-destructive/20', icon: <Target className="w-4 h-4" /> },
    { title: 'Web Dev Mini Project', type: 'Project', due: 'Next Monday', color: 'text-primary bg-primary/10 border-primary/20', icon: <Activity className="w-4 h-4" /> },
  ];

  const [recentGrades, setRecentGrades] = useState<any[]>([]);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await api.get('/exam-results');
        if (res.data?.data) {
          const published = res.data.data.filter((r: any) => r.isPublished);
          const mapped = published.map((r: any) => ({
             subject: r.subjectName || 'Unknown Subject',
             title: r.examinationName || 'Exam',
             score: `${r.marksObtained}/${r.maxMarks}`,
             grade: r.grade || 'N/A',
             date: 'Recently'
          }));
          setRecentGrades(mapped.slice(0, 5)); // Show latest 5
        }
      } catch (err) {
        console.error('Failed to fetch grades', err);
      }
    };
    fetchGrades();
  }, [user?.id]);

  const summaryCards = [
    { title: 'Overall Attendance', value: `${liveOverallAttendance}%`, icon: <CheckCircle />, color: liveOverallAttendance >= 75 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500' },
    { title: 'Pending Assignments', value: pendingAssignments, icon: <FileText />, color: 'bg-amber-500/10 text-amber-500' },
    { title: "Today's Classes", value: todaysClasses, icon: <CalendarIcon />, color: 'bg-blue-500/10 text-blue-500' },
    { title: 'Upcoming Quizzes', value: upcomingQuizzes, icon: <Target />, color: 'bg-indigo-500/10 text-indigo-500' },
    { title: 'Upcoming Events', value: upcomingEvents, icon: <Activity />, color: 'bg-purple-500/10 text-purple-500' },
    { title: 'Unread Notices', value: unreadNotices, icon: <Bell />, color: 'bg-orange-500/10 text-orange-500' },
    { title: 'Current SGPA', value: currentSGPA, icon: <Trophy />, color: 'bg-cyan-500/10 text-cyan-500' },
    { title: 'Total Credits', value: totalCredits, icon: <BookOpen />, color: 'bg-teal-500/10 text-teal-500' },
    { title: 'Status', value: academicStatus, icon: <CheckCircle />, color: 'bg-emerald-500/10 text-emerald-500' },
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
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
          
          {/* Today's Schedule Timeline */}
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-0">
                {schedule.map((item, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20 z-10 mt-1.5" />
                      {idx !== schedule.length - 1 && <div className="w-px h-full bg-border/60 my-1" />}
                    </div>
                    <div className="pb-6 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-lg border border-border/50 bg-background hover:bg-muted/30 transition-colors">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-foreground">{item.time}</span>
                            <Badge variant="outline" className={`text-[10px] ${item.color}`}>
                              {item.status}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-foreground">{item.subject}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.type} • {item.faculty}</p>
                        </div>
                        {item.status === 'Ongoing' && (
                          <Button size="sm" className="w-full sm:w-auto text-xs h-8">Join Class</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subject Overview Table */}
          <Card className="border border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Subject Overview & Attendance
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-md px-2">
                Detailed View <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
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
                  {subjectOverview.map((subject, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 text-foreground font-medium">
                        {subject.name}
                        <div className="text-[10px] text-muted-foreground">{subject.code}</div>
                      </td>
                      <td className="px-5 py-3 text-foreground">{subject.total}</td>
                      <td className="px-5 py-3 text-foreground">{subject.attended}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-muted rounded-full h-1.5 max-w-[60px]">
                            <div 
                              className={`h-1.5 rounded-full ${subject.percentage >= 75 ? 'bg-success' : subject.percentage >= 65 ? 'bg-warning' : 'bg-destructive'}`}
                              style={{ width: `${subject.percentage}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-foreground text-xs">{subject.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={
                          subject.status === 'Safe' ? 'text-success border-success/30 bg-success/10' :
                          subject.status === 'Warning' ? 'text-warning border-warning/30 bg-warning/10' :
                          'text-destructive border-destructive/30 bg-destructive/10'
                        }>
                          {subject.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Actionable Alerts (Deadlines) */}
          <Card className="border border-border/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warning to-destructive"></div>
            <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" /> Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {upcomingDeadlines.map((task, idx) => (
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
              </div>
              <div className="p-3 border-t border-border/50 bg-muted/10">
                <Button variant="outline" size="sm" className="w-full text-xs h-8">View All Tasks</Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Grades/Marks */}
          <Card className="border border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" /> Recent Grades
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentGrades.map((grade, idx) => (
                  <div key={idx} className="p-4 hover:bg-muted/30 transition-colors flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{grade.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{grade.subject} • {grade.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{grade.score}</div>
                      <div className="text-[10px] font-bold text-success uppercase tracking-wider mt-0.5">Grade {grade.grade}</div>
                    </div>
                  </div>
                ))}
                {recentGrades.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No published results yet.
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

          {/* AI Insights - Repurposed as Academic Insights */}
          <Card className="border border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Academic Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex gap-3 items-start p-3 bg-destructive/5 rounded-lg border border-destructive/20 transition-colors hover:bg-destructive/10">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-relaxed font-medium">
                  Critical: You need to attend the next 3 classes in Computer Networks to reach the 75% criteria.
                </p>
              </div>
              <div className="flex gap-3 items-start p-3 bg-primary/5 rounded-lg border border-primary/20 transition-colors hover:bg-primary/10">
                <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-relaxed font-medium">
                  Based on your recent DBMS lab, we recommend revising 'BCNF Normalization'.
                </p>
              </div>
              <div className="flex gap-3 items-start p-3 bg-success/5 rounded-lg border border-success/20 transition-colors hover:bg-success/10">
                <Trophy className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-relaxed font-medium">
                  Excellent work in Java Programming! Your marks are in the top 10% of the class.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

