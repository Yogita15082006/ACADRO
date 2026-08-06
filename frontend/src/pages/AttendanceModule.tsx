import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  CheckCircle, Calendar, TrendingUp, AlertTriangle,
  Clock, BookOpen, UserCheck, Calculator, Search, Filter, Lock,
  X, Plus, Edit, Trash2, Users, QrCode, Copy, ArrowLeft, BarChart3, Activity, PieChart, Info, Printer, Sparkles,
  FileX
} from 'lucide-react';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MarkAttendanceModal } from './FacultyActivityModule';

import { attendanceService } from '../services/attendanceService';
import api from '../services/api';

// Define schema
const attendanceSessionSchema = z.object({
  academicYear: z.string().min(1, "Required"),
  semester: z.string().min(1, "Required"),
  department: z.string().min(1, "Required"),
  className: z.string().min(1, "Required"),
  subject: z.string().min(1, "Required"),
  lectureType: z.string().min(1, "Required"),
  lectureNumber: z.string().min(1, "Required"),
  date: z.string().min(1, "Required"),
  startTime: z.string().min(1, "Required"),
  endTime: z.string().min(1, "Required"),
  duration: z.string().min(1, "Required"),
  attendanceCode: z.string().min(1, "Required"),
  requireVerification: z.boolean(),
  verificationQuestion: z.string().optional(),
  expectedAnswer: z.string().optional()
});

type AttendanceSessionValues = z.infer<typeof attendanceSessionSchema>;







const [] = [
  { id: 'S1', name: 'Java Programming', faculty: 'Dr. Rahul Sharma', attended: 18, total: 22 },
  { id: 'S2', name: 'Data Structures', faculty: 'Prof. Vikram Rathore', attended: 20, total: 22 },
  { id: 'S3', name: 'Operating Systems', faculty: 'Prof. Amit Singh', attended: 15, total: 20 },
  { id: 'S4', name: 'DBMS', faculty: 'Prof. Neha Patel', attended: 19, total: 22 },
  { id: 'S5', name: 'Computer Networks', faculty: 'Prof. Sanjay Kumar', attended: 17, total: 21 },
  { id: 'S6', name: 'Software Engineering', faculty: 'Dr. Anjali Gupta', attended: 21, total: 22 },
];







const getStatusBadge = (percentage: number) => {
  if (percentage >= 80) return <Badge variant="active">Safe</Badge>;
  if (percentage >= 75) return <Badge variant="pending">Warning</Badge>;
  return <Badge variant="rejected">Critical</Badge>;
};

const getProgressBarColor = (percentage: number) => {
  if (percentage >= 80) return 'bg-emerald-500';
  if (percentage >= 75) return 'bg-amber-500';
  return 'bg-rose-500';
};

const SubjectAttendanceDetails = ({ subject, onBack, historyData }: { subject: any, onBack: () => void, historyData?: any[] }) => {
  const percentage = (subject.totalAttended / subject.totalConducted) * 100 || (subject.attended / subject.total) * 100 || 0;
  
  // mock chart data
  const trendData = [
    { date: 'Jun 1', pct: 70 },
    { date: 'Jun 8', pct: 75 },
    { date: 'Jun 15', pct: 72 },
    { date: 'Jun 22', pct: 80 },
    { date: 'Jun 29', pct: 86.4 },
  ];

  const subjectHistory = [
    { date: '2026-07-02', day: 'Thursday', lec: 'L-12', type: 'Theory', status: 'Present', time: '10:05 AM', code: 'JAVA24IT', verified: true, remarks: '-' },
    { date: '2026-06-30', day: 'Tuesday', lec: 'L-11', type: 'Theory', status: 'Present', time: '10:02 AM', code: 'JAVA24IT', verified: true, remarks: '-' },
    { date: '2026-06-25', day: 'Thursday', lec: 'L-10', type: 'Theory', status: 'Absent', time: '-', code: '-', verified: false, remarks: 'Missed' },
    { date: '2026-06-23', day: 'Tuesday', lec: 'L-9', type: 'Lab', status: 'Present', time: '02:15 PM', code: 'JAVALAB', verified: true, remarks: 'Late Submission' },
    { date: '2026-06-18', day: 'Thursday', lec: 'L-8', type: 'Theory', status: 'Present', time: '10:04 AM', code: 'JAVA24IT', verified: true, remarks: '-' },
    { date: '2026-06-16', day: 'Tuesday', lec: 'L-7', type: 'Theory', status: 'Present', time: '10:00 AM', code: 'JAVA24IT', verified: true, remarks: '-' },
    { date: '2026-06-11', day: 'Thursday', lec: 'L-6', type: 'Theory', status: 'Present', time: '10:06 AM', code: 'JAVA24IT', verified: true, remarks: '-' },
  ];

  return (
    <motion.div
      key="subject-details"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm sticky top-0 z-10 backdrop-blur-md bg-card/90 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-full shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{subject.name}</h2>
            <p className="text-sm font-medium text-muted-foreground">{subject.faculty} â€¢ 3rd Year â€¢ IT-1</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(percentage)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/50 bg-card shadow-sm overflow-hidden">
             <CardHeader className="border-b border-border/50 bg-muted/20 px-5 py-4 flex flex-row items-center justify-between">
               <CardTitle className="text-base font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-primary"/> Attendance History</CardTitle>
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" className="h-8 gap-2 text-xs"><Filter size={12}/> Filter</Button>
                 <Button variant="outline" size="sm" className="h-8 gap-2 text-xs"><Search size={12}/> Search</Button>
               </div>
             </CardHeader>
             <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader className="bg-muted/5">
                     <TableRow className="border-b border-border/50 hover:bg-transparent">
                       <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Date & Day</TableHead>
                       <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Lecture</TableHead>
                       <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Faculty</TableHead>
                       <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
                       <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Time / Code</TableHead>
                       <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Verification</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                      {(historyData || subjectHistory).map((h, i) => (
                        <TableRow key={i} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                          <TableCell className="py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">{h.date}</span>
                              <span className="text-[11px] text-muted-foreground mt-0.5">{h.day || new Date(h.date).toLocaleDateString('en-US', {weekday: 'short'})}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">{h.lec || h.topic || '-'}</span>
                              <span className="text-[11px] text-muted-foreground mt-0.5">{h.type || 'Theory'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">{subject.facultyName || subject.faculty || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={h.status === 'Present' || h.status === 'PRESENT' ? 'active' : h.status === 'PENDING' ? 'pending' : 'rejected'} className={`text-[10px] px-2 py-0.5 ${h.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : ''}`}>{h.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-sm font-medium">{h.time || 'N/A'}</span>
                              <span className="text-[11px] text-muted-foreground font-mono mt-0.5">{h.code || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {h.verified || h.status === 'PRESENT' ? (
                               <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10 text-[10px]">Verified</Badge>
                            ) : (
                               <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10 text-[10px]">Unverified</Badge>
                            )}
                            {h.remarks && h.remarks !== '-' && (
                              <p className="text-[10px] text-muted-foreground mt-1">{h.remarks}</p>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                 </Table>
               </div>
             </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-border/50 bg-card shadow-sm overflow-hidden">
             <CardHeader className="border-b border-border/50 bg-muted/20 px-5 py-4">
               <CardTitle className="text-base font-semibold flex items-center gap-2"><PieChart className="w-4 h-4 text-primary"/> Overview</CardTitle>
             </CardHeader>
             <CardContent className="p-5">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-4xl font-extrabold tracking-tight">{percentage.toFixed(1)}%</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Overall Attendance</p>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden mt-3 shadow-inner">
                  <div className={`h-full ${getProgressBarColor(percentage)} rounded-full`} style={{ width: `${percentage}%` }}></div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-border/50">
                   <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-center">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Conducted</p>
                     <p className="text-xl font-black text-foreground">{subject.totalConducted || subject.total}</p>
                   </div>
                   <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-center">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Attended</p>
                     <p className="text-xl font-black text-emerald-500">{subject.totalAttended !== undefined ? subject.totalAttended : subject.attended}</p>
                   </div>
                   <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-center">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Missed</p>
                     <p className="text-xl font-black text-rose-500">{(subject.totalConducted || subject.total) - (subject.totalAttended !== undefined ? subject.totalAttended : subject.attended)}</p>
                   </div>
                </div>
             </CardContent>
          </Card>
          
          <Card className="border border-border/50 bg-card shadow-sm overflow-hidden">
             <CardHeader className="border-b border-border/50 bg-muted/20 px-5 py-4">
               <CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary"/> Attendance Trend</CardTitle>
             </CardHeader>
             <CardContent className="p-5">
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.7 }} />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'hsl(var(--card))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="pct" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPct)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </CardContent>
          </Card>

          <Card className="border border-border/50 bg-card shadow-sm overflow-hidden">
             <CardHeader className="border-b border-border/50 bg-muted/20 px-5 py-4">
               <CardTitle className="text-base font-semibold flex items-center gap-2"><Calculator className="w-4 h-4 text-primary"/> Analytics</CardTitle>
             </CardHeader>
             <CardContent className="p-5 space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50 flex justify-between items-center transition-colors hover:bg-muted/50">
                  <span className="text-sm font-medium">To reach 75%</span>
                  <span className="text-sm font-bold text-emerald-500">Safe</span>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50 flex justify-between items-center transition-colors hover:bg-muted/50">
                  <span className="text-sm font-medium">To reach 90%</span>
                  <span className="text-sm font-bold text-indigo-500">Attend next 6</span>
                </div>
                <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20 flex justify-between items-center text-rose-700 dark:text-rose-400">
                  <span className="text-sm font-semibold">Max Miss Allowed</span>
                  <span className="text-sm font-black">3 Classes</span>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

const AdminSessionDetails = ({ session, onBack }: { session: any, onBack: () => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [liveStudents, setLiveStudents] = useState<any[]>([]);

  useEffect(() => {
    if (session?.id) {
      attendanceService.getLiveResponses(session.id)
        .then(data => setLiveStudents(data))
        .catch(err => console.error("Failed to fetch live responses", err));
    }
  }, [session?.id]);

  const filteredStudents = liveStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.enrollment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div
      key="admin-session-details"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{session.subject}</h1>
            <p className="text-muted-foreground">{session.class} â€¢ {session.date} â€¢ {session.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session.status === 'Active' && (
            <Button variant="destructive" className="gap-2 shadow-sm">
              <X className="w-4 h-4" /> Close Session
            </Button>
          )}
          <Button variant="outline" className="gap-2 bg-card">
            <Edit className="w-4 h-4" /> Edit
          </Button>
          <Button className="gap-2 bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/50 bg-card shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Students</p>
              <p className="text-2xl font-black">{session.totalStudents}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 bg-card shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Present</p>
              <p className="text-2xl font-black">{session.presentCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 bg-card shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Absent</p>
              <p className="text-2xl font-black">{session.absentCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 bg-card shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Attendance %</p>
              <p className="text-2xl font-black">{Math.round((session.presentCount / session.totalStudents) * 100)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Trend */}
        <div className="space-y-6">
          <Card className="border border-border/50 bg-card shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/20 px-5 py-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> Session Info</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Faculty</p>
                   <p className="text-sm font-medium">{session.faculty}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Academic Year</p>
                   <p className="text-sm font-medium">{session.academicYear}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Department</p>
                   <p className="text-sm font-medium">{session.department}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Lecture</p>
                   <p className="text-sm font-medium">{session.type} ({session.lectureNumber})</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Duration</p>
                   <p className="text-sm font-medium">{session.startTime} - {session.endTime} ({session.duration})</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Created At</p>
                   <p className="text-sm font-medium">{session.createdAt}</p>
                 </div>
               </div>

               <div className="pt-4 border-t border-border/50 space-y-4">
                 <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Attendance Code</p>
                      <p className="text-lg font-black tracking-widest text-primary">{session.code}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                 </div>
                 
                 {session.verificationQuestion && (
                   <div className="p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/20">
                     <p className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider mb-2">Verification Question</p>
                     <p className="text-sm font-medium mb-1">Q: {session.verificationQuestion}</p>
                     <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">A: {session.expectedAnswer}</p>
                   </div>
                 )}
               </div>
            </CardContent>
          </Card>
          
          <Card className="border border-border/50 bg-card shadow-sm">
             <CardHeader className="border-b border-border/50 bg-muted/20 px-5 py-4">
               <CardTitle className="text-base font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Submission Trend</CardTitle>
             </CardHeader>
             <CardContent className="p-5">
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={session.trend.map((val: any, idx: any) => ({ time: `+${idx*10}m`, count: val }))} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.7 }} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'hsl(var(--card))' }} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Students Table */}
        <div className="lg:col-span-2">
          <Card className="border border-border/50 bg-card shadow-sm h-full">
            <CardHeader className="border-b border-border/50 bg-muted/20 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Student List</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search students..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-[200px] bg-background text-sm"
                  />
                </div>
                <div className="flex items-center p-1 bg-muted rounded-md border border-border/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-7 px-3 text-xs rounded-sm ${statusFilter === 'All' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                    onClick={() => setStatusFilter('All')}
                  >
                    All
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-7 px-3 text-xs rounded-sm ${statusFilter === 'Present' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                    onClick={() => setStatusFilter('Present')}
                  >
                    Present
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-7 px-3 text-xs rounded-sm ${statusFilter === 'Absent' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                    onClick={() => setStatusFilter('Absent')}
                  >
                    Absent
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader className="bg-muted/10">
                     <TableRow className="hover:bg-transparent border-b-border/50">
                       <TableHead className="font-semibold h-10 text-xs">Roll No</TableHead>
                       <TableHead className="font-semibold h-10 text-xs">Name</TableHead>
                       <TableHead className="font-semibold h-10 text-xs">Status</TableHead>
                       <TableHead className="font-semibold h-10 text-xs">Time</TableHead>
                       <TableHead className="font-semibold h-10 text-xs text-center">Verified</TableHead>
                       <TableHead className="font-semibold h-10 text-xs">Remarks</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredStudents.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                           No students found matching your criteria.
                         </TableCell>
                       </TableRow>
                     ) : (
                       filteredStudents.map((student, idx) => (
                         <TableRow key={idx} className="hover:bg-muted/30 border-b-border/50 transition-colors">
                           <TableCell className="font-medium text-xs">{student.enrollment}</TableCell>
                           <TableCell className="text-sm font-semibold">{student.name}</TableCell>
                           <TableCell>
                             {student.status === 'Present' ? (
                               <Badge variant="active" className="text-[10px] px-1.5 py-0 rounded-sm">Present</Badge>
                             ) : (
                               <Badge variant="rejected" className="text-[10px] px-1.5 py-0 rounded-sm">Absent</Badge>
                             )}
                           </TableCell>
                           <TableCell className="text-xs text-muted-foreground">{student.time}</TableCell>
                           <TableCell className="text-center">
                             {student.verified ? (
                               <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                             ) : (
                               student.status === 'Present' ? (
                                 <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                               ) : (
                                 <span className="text-muted-foreground">-</span>
                               )
                             )}
                           </TableCell>
                           <TableCell className="text-xs text-muted-foreground">{student.remarks}</TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export const AdminTeachingHistory = ({ readOnlyFacultyId }: { readOnlyFacultyId?: string } = {}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Resolve the current faculty from auth context or readOnlyFacultyId
  const facultyId = readOnlyFacultyId || user?.id || '';
  const facultyName = readOnlyFacultyId ? 'Faculty (View Only)' : (user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Faculty');
  const facultyEmpId = readOnlyFacultyId ? '' : (user?.empId || '');
  const facultyDept = readOnlyFacultyId ? '' : (user?.department || 'Information Technology');

  const [facultyActivities, setFacultyActivities] = useState<any[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [facultySessions, setFacultySessions] = useState<any[]>([]);
  const [backendStats, setBackendStats] = useState({ daysPresent: 0, daysAbsent: 0, totalWorkingDays: 0 });

  useEffect(() => {
    const fetchActivities = async () => {
      if (facultyId) {
        try {
          const actRes = await api.get(`/faculty-activities/faculty/${facultyId}`);
          if (actRes.data && actRes.data.data) {
            setFacultyActivities(actRes.data.data);
          }
          const assignRes = await api.get(`/v1/class-subjects/faculty/${facultyId}`);
          if (assignRes.data) {
            setMyAssignments(assignRes.data);
          }
          const sessRes = await api.get(`/attendance-sessions/faculty/${facultyId}`);
          if (sessRes.data) {
            setFacultySessions(sessRes.data);
          }
          const statsRes = await api.get(`/attendance-sessions/faculty/${facultyId}/statistics`);
          if (statsRes.data) {
            setBackendStats({
              daysPresent: statsRes.data.daysPresent || 0,
              daysAbsent: statsRes.data.daysAbsent || 0,
              totalWorkingDays: statsRes.data.totalWorkingDays || 0
            });
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    
    fetchActivities();
    
    window.addEventListener('sync-attendance-data', fetchActivities);
    return () => window.removeEventListener('sync-attendance-data', fetchActivities);
  }, [facultyId]);

  const assignedClasses = useMemo(() => Array.from(new Set(myAssignments.map(a => a.className))), [myAssignments]);

  // Compute summary stats
  const stats = useMemo(() => {
    const facultyOwnRecords = facultyActivities;
    const holidays = facultyActivities.filter(r => r.status === 'HOLIDAY');
    const uniqueHolidayDates = new Set(holidays.map(r => r.date));

    // Stats based on actual SAVED AttendanceSessions
    const completedSessions = facultySessions.filter(s => s.status === 'COMPLETED' || s.status === 'SAVED' || s.status === 'CLOSED');
    const totalScheduled = completedSessions.length;
    const conducted = completedSessions.filter(s => !s.isSystemGenerated).length;
    const missed = completedSessions.filter(s => s.isSystemGenerated).length;
    
    const absent = facultyOwnRecords.filter(r => r.status === 'ABSENT').length;

    // Summary Cards stats (day-level aggregation)
    const totalWorkingDays = backendStats.totalWorkingDays;
    const daysPresent = backendStats.daysPresent;
    const daysAbsent = backendStats.daysAbsent;
    const overallAttendance = totalScheduled > 0 ? Math.round((conducted / totalScheduled) * 100) : 0;

    return {
      totalScheduled, conducted, missed, absent,
      holidays: uniqueHolidayDates.size,
      totalWorkingDays, daysPresent, daysAbsent, overallAttendance,
    };
  }, [facultyActivities, facultySessions, assignedClasses, backendStats]);

  // Faculty Teaching Record (Subject-wise summary)
  const teachingRecords = useMemo(() => {
    return myAssignments.map((assignment, index) => {
      const relatedSessions = facultySessions.filter(s => 
        (s.status === 'COMPLETED' || s.status === 'SAVED' || s.status === 'CLOSED') &&
        s.classSubjectId === assignment.id
      );
      
      const totalScheduled = relatedSessions.length;
      const conducted = relatedSessions.filter(s => !s.isSystemGenerated).length;
      const missed = relatedSessions.filter(s => s.isSystemGenerated).length;

      const batch = assignment.batch || '-'; 
      const year = assignment.year ? assignment.year.replace('YEAR_', '') : '-';
      
      return {
        id: assignment.id || `teaching-${index}`,
        batch,
        year,
        semester: assignment.semester?.replace('SEMESTER_', '') || '-',
        className: (assignment.className || '-').replace(' - null', ''),
        subjectName: assignment.subjectName || '-',
        totalScheduled,
        conducted,
        missed
      };
    });
  }, [facultyActivities, myAssignments]);

  // Faculty Absence Record (Absences only)
  const absenceHistory = useMemo(() => {
    const absences = facultyActivities.filter(r => r.status === 'ABSENT' || r.status === 'CLASS_MISSED' || r.status === 'HOLIDAY');

    // Group by date and status
    const groups: Record<string, any[]> = {};
    absences.forEach(r => {
      const key = `${r.date}_${r.status}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    const entries: any[] = [];
    
    Object.values(groups).forEach(group => {
      const first = group[0];
      const d = new Date(first.date + 'T00:00:00');
      const day = d.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (first.status === 'HOLIDAY') {
        entries.push({
          id: first.id,
          date: first.date,
          day,
          subject: 'All',
          className: 'All',
          semester: 'All',
          batch: 'All',
          year: 'All',
          status: first.status,
          absenceType: 'Leave / Holiday',
          reason: first.reason || '-'
        });
      } else {
        const isAllSubjects = myAssignments.length > 0 && group.length >= myAssignments.length;
        if (isAllSubjects) {
          entries.push({
            id: `grouped-${first.date}-${first.status}`,
            date: first.date,
            day,
            subject: 'All',
            className: 'All',
            semester: 'All',
            batch: 'All',
            year: 'All',
            status: first.status,
            absenceType: 'Absent',
            reason: first.reason || '-'
          });
        } else {
          group.forEach(r => {
            entries.push({
              id: r.id, 
              date: r.date, 
              day,
              subject: r.subjectName || '-', 
              className: (r.className || '-').replace(' - null', ''),
              semester: r.semester?.replace('SEMESTER_', '') || '-', 
              batch: r.batch || '-',
              year: r.academicYear?.replace('YEAR_', '') || '-',
              status: r.status,
              absenceType: 'Lecture-wise',
              reason: r.reason || '-',
            });
          });
        }
      }
    });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [facultyActivities, myAssignments]);

  // Filter by search
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return absenceHistory;
    const q = searchQuery.toLowerCase();
    return absenceHistory.filter(e =>
      e.subject.toLowerCase().includes(q) || e.className.toLowerCase().includes(q) ||
      e.absenceType.toLowerCase().includes(q) || e.reason.toLowerCase().includes(q) ||
      e.date.includes(q) || e.day.toLowerCase().includes(q)
    );
  }, [absenceHistory, searchQuery]);

  const getAbsenceTypeBadge = (type: string) => {
    const map: Record<string, { variant: string; color: string }> = {
      'Lecture Missed': { variant: 'rejected', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' },
      'Full Day Absent': { variant: 'rejected', color: 'text-red-700 dark:text-red-400 bg-red-500/15 border-red-500/25' },
      'Holiday': { variant: 'outline', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
      'Cancelled Class': { variant: 'outline', color: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20' },
      'Official Duty': { variant: 'outline', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20' },
      'Medical Leave': { variant: 'outline', color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20' },
    };
    const style = map[type] || map['Lecture Missed'];
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.color}`}>{type}</span>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 1: Summary Cards                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Card className="border border-border/50 shadow-sm bg-card overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4">
          <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Summary Cards
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: 'Overall Attendance %', value: `${stats.overallAttendance}%`, icon: <PieChart className="w-4 h-4" />, color: 'bg-primary', textColor: stats.overallAttendance >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', bgTint: stats.overallAttendance >= 75 ? 'bg-emerald-500/5' : 'bg-rose-500/5' },
              { label: 'Total Working Days', value: stats.totalWorkingDays, icon: <Calendar className="w-4 h-4" />, color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', bgTint: 'bg-blue-500/5' },
              { label: 'Days Present', value: stats.daysPresent, icon: <UserCheck className="w-4 h-4" />, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', bgTint: 'bg-emerald-500/5' },
              { label: 'Days Absent', value: stats.daysAbsent, icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', bgTint: 'bg-rose-500/5' },
              { label: 'Total Classes', value: stats.totalScheduled, icon: <BookOpen className="w-4 h-4" />, color: 'bg-indigo-500', textColor: 'text-indigo-600 dark:text-indigo-400', bgTint: 'bg-indigo-500/5' },
              { label: 'Classes Conducted', value: stats.conducted, icon: <CheckCircle className="w-4 h-4" />, color: 'bg-teal-500', textColor: 'text-teal-600 dark:text-teal-400', bgTint: 'bg-teal-500/5' },
              { label: 'Classes Missed', value: stats.missed, icon: <FileX className="w-4 h-4" />, color: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400', bgTint: 'bg-orange-500/5' },
              { label: 'Holidays', value: stats.holidays, icon: <Sparkles className="w-4 h-4" />, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', bgTint: 'bg-amber-500/5' },
            ].map((item, i) => (
              <div key={i} className={`relative overflow-hidden rounded-xl border border-border/50 bg-card ${item.bgTint} p-4 hover:shadow-md transition-all duration-200`}>
                <div className={`absolute top-0 left-0 w-full h-1 ${item.color}`} />
                <div className={`w-8 h-8 rounded-lg ${item.color}/10 flex items-center justify-center mb-2 ${item.textColor}`}>
                  {item.icon}
                </div>
                <h3 className={`text-2xl font-extrabold tracking-tight ${item.textColor}`}>{item.value}</h3>
                <p className="text-[9px] font-bold mt-1 text-muted-foreground uppercase tracking-wider leading-tight">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 2: Teaching History Card                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Card className="border border-border/50 shadow-sm bg-card overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Faculty Teaching Record
            <Badge variant="outline" className="text-[10px] ml-2">{teachingRecords.length} Assigned Subjects</Badge>
          </CardTitle>
          <div className="text-right sm:text-left flex flex-col items-start sm:items-end">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground tracking-tight">{facultyName}</span>
              <Badge variant="active" className="text-[10px]">Active</Badge>
            </div>
            <span className="text-xs text-muted-foreground font-medium">{facultyEmpId} • {facultyDept}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-muted/5 sticky top-0 z-10 backdrop-blur-md">
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Batch</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Year</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Semester</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Class</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Subject</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase text-center">Total Scheduled Classes</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase text-center">Classes Conducted</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase text-center">Classes Missed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachingRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No teaching records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  teachingRecords.map((entry: any) => (
                    <TableRow key={entry.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell className="text-sm font-semibold whitespace-nowrap">{entry.batch}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{entry.year}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{entry.semester}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">{entry.className}</span>
                      </TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">{entry.subjectName}</TableCell>
                      <TableCell className="text-center text-sm font-medium text-slate-600 dark:text-slate-400">{entry.totalScheduled}</TableCell>
                      <TableCell className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">{entry.conducted}</TableCell>
                      <TableCell className="text-center text-sm font-medium text-rose-600 dark:text-rose-400">{entry.missed}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 3: Faculty Absence History Card               */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Card className="border border-border/50 shadow-sm bg-card overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
            <FileX className="w-5 h-5 text-rose-500" />
            Faculty Absence Record
            <Badge variant="outline" className="text-[10px] ml-2">{filteredHistory.length} Records</Badge>
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by subject, class, type..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Date</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Day</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Batch</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Year</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Semester</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Class</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Subject</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Absence Type</TableHead>
                  <TableHead className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="w-8 h-8 text-emerald-500/50" />
                        <p className="font-medium">No absence records found</p>
                        <p className="text-xs">All classes have been conducted as scheduled.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((entry: any) => (
                    <TableRow key={entry.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-sm whitespace-nowrap">{entry.date}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{entry.day}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{entry.batch}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{entry.year}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{entry.semester}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">{entry.className}</span>
                      </TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">{entry.subject}</TableCell>
                      <TableCell className="whitespace-nowrap">{getAbsenceTypeBadge(entry.absenceType)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={entry.reason}>{entry.reason}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}


const CreateSessionModal = ({ isOpen, onClose, onSubmit, register, handleSubmit, errors, watch, setValue, handleGenerateCode, codeValue }: any) => {
  if (!isOpen) return null;
  const requireVerification = watch('requireVerification');

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }} 
        className="relative w-full max-w-2xl bg-card border border-border/50 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
          <h2 className="text-lg font-bold">Create New Session</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="create-session-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Academic Year</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" {...register('academicYear')}>
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
                {errors.academicYear && <p className="text-xs text-rose-500">{errors.academicYear.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Semester</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" {...register('semester')}>
                  <option value="">Select Semester</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
                {errors.semester && <p className="text-xs text-rose-500">{errors.semester.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Department</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" {...register('department')}>
                  <option value="">Select Dept</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Data Science">Data Science</option>
                </select>
                {errors.department && <p className="text-xs text-rose-500">{errors.department.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Class Name</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" {...register('className')}>
                  <option value="">Select Class</option>
                  <option value="IT-1">IT-1</option>
                  <option value="IT-2">IT-2</option>
                  <option value="DS-1">DS-1</option>
                  <option value="DS-2">DS-2</option>
                </select>
                {errors.className && <p className="text-xs text-rose-500">{errors.className.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Subject</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" {...register('subject')}>
                  <option value="">Select Subject</option>
                  <option value="Java Programming">Java Programming</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="DBMS">DBMS</option>
                  <option value="Computer Networks">Computer Networks</option>
                </select>
                {errors.subject && <p className="text-xs text-rose-500">{errors.subject.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Lecture Type</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" {...register('lectureType')}>
                  <option value="">Select Type</option>
                  <option value="Lecture">Lecture</option>
                  <option value="Lab">Lab</option>
                  <option value="Tutorial">Tutorial</option>
                </select>
                {errors.lectureType && <p className="text-xs text-rose-500">{errors.lectureType.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Lecture Number</label>
                <Input placeholder="e.g. L-45" {...register('lectureNumber')} />
                {errors.lectureNumber && <p className="text-xs text-rose-500">{errors.lectureNumber.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Date</label>
                <Input type="date" {...register('date')} />
                {errors.date && <p className="text-xs text-rose-500">{errors.date.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Start Time</label>
                <Input type="time" {...register('startTime')} />
                {errors.startTime && <p className="text-xs text-rose-500">{errors.startTime.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">End Time</label>
                <Input type="time" {...register('endTime')} />
                {errors.endTime && <p className="text-xs text-rose-500">{errors.endTime.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Duration</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" {...register('duration')}>
                  <option value="">Select Duration</option>
                  <option value="45 Mins">45 Mins</option>
                  <option value="60 Mins">60 Mins</option>
                  <option value="90 Mins">90 Mins</option>
                  <option value="120 Mins">120 Mins</option>
                </select>
                {errors.duration && <p className="text-xs text-rose-500">{errors.duration.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                  Attendance Code
                  <Button type="button" variant="ghost" size="sm" className="h-5 px-2 text-[10px]" onClick={handleGenerateCode}>Generate</Button>
                </label>
                <Input placeholder="e.g. JAVA24IT" {...register('attendanceCode')} value={codeValue || ''} onChange={(e: any) => setValue('attendanceCode', e.target.value)} />
                {errors.attendanceCode && <p className="text-xs text-rose-500">{errors.attendanceCode.message}</p>}
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" {...register('requireVerification')} />
                <span className="text-sm font-medium">Require Security Verification</span>
              </label>
              
              {requireVerification && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Verification Question</label>
                    <Input placeholder="e.g. What is the output of 2+2?" {...register('verificationQuestion')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Expected Answer</label>
                    <Input placeholder="e.g. 4" {...register('expectedAnswer')} />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-border/50 bg-muted/20 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="create-session-form" className="bg-primary text-primary-foreground hover:bg-primary/90">Create Session</Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

const StudentAttendanceDetails = ({ student, onBack, subjectData, historyData, overallData }: { student: any, onBack?: () => void, subjectData?: any[], historyData?: any[], overallData?: any }) => {
  let aiInsight = "";
  if (student.attendance >= 80) aiInsight = `${student.name} is maintaining excellent attendance across all core subjects. The consistency indicates strong engagement. No immediate risks or required interventions detected.`;
  else if (student.attendance >= 75) aiInsight = `${student.name}'s attendance is bordering the minimum requirement of 75%. We observed frequent absences particularly on Mondays and during early morning lab sessions.`;
  else aiInsight = `${student.name} is critically short of attendance. Immediate intervention and counseling are required. High probability of missing the mid-term eligibility if the current trend continues.`;

  const safeSubjectData = subjectData && subjectData.length > 0 ? subjectData : [];
  
  const totalConducted = overallData?.totalClasses || 0;
  const totalAttended = overallData?.totalPresent || 0;
  const totalMissed = overallData?.classesMissed || 0;

  const totalWorkingDays = overallData?.totalWorkingDays || 0;
  const daysPresent = overallData?.daysPresent || 0;
  const daysAbsent = overallData?.daysAbsent || 0;

  return (
    <motion.div
      key="student-analysis-details"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm sticky top-0 z-10 backdrop-blur-md bg-card/90 gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="icon" onClick={onBack} className="rounded-full shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <img src={student.photo} alt={student.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
            <div>
              <h2 className="text-xl font-bold tracking-tight">{student.name}</h2>
              <p className="text-sm font-medium text-muted-foreground">{student.enrollment} &bull; Sem {student.semester} &bull; {student.section}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(student.attendance)}
          <Button variant="outline" size="sm" className="gap-2 bg-background">
            <Printer size={14} /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="border border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <CardContent className="p-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{student.attendance}%</h3>
            <p className="text-[10px] font-bold mt-1 text-muted-foreground uppercase tracking-wider">Overall Attd.</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <CardContent className="p-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{totalWorkingDays}</h3>
            <p className="text-[10px] font-bold mt-1 text-muted-foreground uppercase tracking-wider">Working Days</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <CardContent className="p-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{daysPresent}</h3>
            <p className="text-[10px] font-bold mt-1 text-muted-foreground uppercase tracking-wider">Days Present</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
          <CardContent className="p-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{daysAbsent}</h3>
            <p className="text-[10px] font-bold mt-1 text-muted-foreground uppercase tracking-wider">Days Absent</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <CardContent className="p-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{totalConducted}</h3>
            <p className="text-[10px] font-bold mt-1 text-muted-foreground uppercase tracking-wider">Total Classes</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-teal-500"></div>
          <CardContent className="p-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{totalAttended}</h3>
            <p className="text-[10px] font-bold mt-1 text-muted-foreground uppercase tracking-wider">Classes Attended</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
          <CardContent className="p-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{totalMissed}</h3>
            <p className="text-[10px] font-bold mt-1 text-muted-foreground uppercase tracking-wider">Classes Missed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border border-border/50 shadow-sm bg-card">
          <CardHeader className="border-b border-border/50 bg-muted/20 px-5 py-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary"/> Subject-wise Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow className="border-b border-border/50 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">Subject</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">Faculty</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase text-center">Conducted</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase text-center">Attended</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase text-center">Missed</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase text-center">Percentage</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeSubjectData.map((sub: any, idx: number) => {
                    const total = sub.totalClasses || 0;
                    const attended = sub.classesAttended || 0;
                    const missedCount = sub.classesMissed || (total - attended);
                    const pct = total === 0 ? 0 : (attended / total) * 100;
                    return (
                      <TableRow key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <TableCell className="font-semibold text-sm min-w-[150px] whitespace-normal leading-tight">{sub.subjectName || sub.name || "N/A"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground min-w-[120px] whitespace-normal leading-tight">{sub.facultyName || "N/A"}</TableCell>
                        <TableCell className="text-center text-sm">{total}</TableCell>
                        <TableCell className="text-center text-sm font-semibold text-emerald-500">{attended}</TableCell>
                        <TableCell className="text-center text-sm font-semibold text-rose-500">{missedCount}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-sm">{pct.toFixed(1)}%</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(pct)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm bg-card">
          <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-primary"/> Complete Absence Record</CardTitle>
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs"><Filter size={12}/> Filter</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow className="border-b border-border/50 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">Date</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">Day</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">Subject</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">Time</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase text-center">Absence Type</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(historyData && historyData.length > 0 ? historyData.filter((r: any) => ['ABSENT', 'REJECTED'].includes(r.status)).slice(0, 5) : []).map((abs: any, i: number) => (
                    <TableRow key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-sm min-w-[100px] whitespace-normal leading-tight">{abs.date}</TableCell>
                      <TableCell className="text-sm text-muted-foreground min-w-[80px] whitespace-normal leading-tight">{abs.day || new Date(abs.date).toLocaleDateString('en-US', {weekday: 'long'})}</TableCell>
                      <TableCell className="text-sm font-medium min-w-[150px] whitespace-normal leading-tight">{abs.subjectName || abs.subject}</TableCell>
                      <TableCell className="text-sm text-muted-foreground min-w-[80px] whitespace-normal leading-tight">{abs.time || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[10px] whitespace-nowrap ${abs.absenceType === 'Full Day' ? 'text-rose-500 border-rose-500/20 bg-rose-500/10' : 'text-amber-500 border-amber-500/20 bg-amber-500/10'}`}>
                          {abs.absenceType || 'Lecture-wise'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="rejected" className="text-[10px] whitespace-nowrap">{abs.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/50 shadow-sm bg-card overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-background border-b border-border/50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500"/> AI Attendance Summary & Action Plan</CardTitle>
          <Badge variant="outline" className="text-[10px] text-indigo-500 border-indigo-500/20 bg-indigo-500/10 hidden sm:flex">Generated securely by AcroNexus AI</Badge>
        </div>
        <CardContent className="p-5 flex flex-col md:flex-row gap-6 items-start">
          <div className="bg-indigo-500/10 p-4 rounded-full shrink-0">
             <Sparkles className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="space-y-4 w-full">
            <p className="text-sm text-foreground font-medium leading-relaxed">
              {aiInsight}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 mt-2 border-t border-border/50">
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pattern: Mon Mornings</span>
                <Badge variant="outline" className="w-fit text-[10px] text-amber-500 border-amber-500/20 bg-amber-500/10">High Absence</Badge>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pattern: Labs</span>
                <Badge variant="outline" className="w-fit text-[10px] text-emerald-500 border-emerald-500/20 bg-emerald-500/10">100% Present</Badge>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pattern: Pre-Holiday</span>
                <Badge variant="outline" className="w-fit text-[10px] text-rose-500 border-rose-500/20 bg-rose-500/10">Often Missed</Badge>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recommended Action</span>
                {student.attendance < 75 ? (
                  <Button size="sm" className="h-6 text-[10px] bg-rose-500 hover:bg-rose-600 text-white shadow-sm w-fit"><AlertTriangle className="w-3 h-3 mr-1"/> Issue Warning</Button>
                ) : (
                  <Badge variant="outline" className="w-fit text-[10px] text-emerald-500 border-emerald-500/20 bg-emerald-500/10"><CheckCircle className="w-3 h-3 mr-1"/> On Track</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CoordinatorDashboard = ({ onSelectStudent, students, section, semester }: { onSelectStudent: (id: string) => void, students: any[], section: string, semester: number }) => {
  const [search, setSearch] = useState('');
  
  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.enrollment.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="lg:col-span-3 space-y-6">
      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> My Section Students ({section} â€¢ Sem {semester})
          </CardTitle>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[250px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search students..." 
                className="w-full pl-9 h-9 text-sm bg-background/50 border-border/50" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-9 bg-background/50 border-border/50">
              <Filter size={14} /> Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent border-b border-border/50">
                  <TableHead className="font-semibold text-xs tracking-wider uppercase">Student</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase">Enrollment No.</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-center">Overall Attendance</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-center">Status</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/30 transition-colors border-b border-border/50 cursor-pointer" onClick={() => onSelectStudent(student.id)}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <img src={student.photo} alt={student.name} className="w-8 h-8 rounded-full object-cover border border-border/50" />
                        <span className="font-semibold text-sm text-foreground">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-muted-foreground">
                      {student.enrollment}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-sm">{student.attendance}%</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${getProgressBarColor(student.attendance)}`} style={{ width: `${student.attendance}%` }}></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(student.attendance)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10 hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); onSelectStudent(student.id); }}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const AttendanceModule = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'teachingHistory'>(() => 
    role === 'faculty' ? 'teachingHistory' : 'dashboard'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Student Real Data State
  const [studentOverall, setStudentOverall] = useState<any>(null);
  const [studentSubjectWise, setStudentSubjectWise] = useState<any[]>([]);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchStudentData = async () => {
      if (role === 'student' && user?.id) {
        try {
          const overall = await attendanceService.getStudentOverallAttendance(user.id);
          const subjectWise = await attendanceService.getStudentSubjectWiseAttendance(user.id);
          const history = await attendanceService.getStudentAttendanceHistory(user.id);
          
          if (isMounted) {
            setStudentOverall(overall);
            setStudentSubjectWise(subjectWise || []);
            setStudentHistory(history || []);
          }
        } catch (error) {
          console.error('Failed to fetch student attendance data', error);
        }
      }
    };
    
    fetchStudentData();
    window.addEventListener('sync-attendance-data', fetchStudentData);
    
    return () => {
      isMounted = false;
      window.removeEventListener('sync-attendance-data', fetchStudentData);
    };
  }, [role, user?.id]);
  
  // Coordinator specific simulation
  const assignedSection = 'IT-2';
  const assignedSemester = 5;
  const coordinatorSectionStudents: any[] = [];
  
  // Admin Session State
  const [adminSessions, setAdminSessions] = useState<any[]>([]);
  useEffect(() => {
    const fetchSessions = async () => {
      if (user?.id) {
        try {
          const res = await api.get(`/attendance-sessions/faculty/${user.id}`);
          setAdminSessions(res.data || []);
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchSessions();
  }, [user?.id]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<AttendanceSessionValues>({
    resolver: zodResolver(attendanceSessionSchema),
    defaultValues: {
      requireVerification: false
    }
  });

  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('attendanceCode', result);
  };

  const onSubmit = (data: AttendanceSessionValues) => {
    const newSession = {
      id: Math.random().toString(36).substr(2, 9),
      subject: data.subject,
      faculty: 'Current User',
      academicYear: data.academicYear,
      department: data.department,
      class: data.className,
      type: data.lectureType,
      lectureNumber: data.lectureNumber,
      date: data.date,
      time: `${data.startTime} - ${data.endTime}`,
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
      code: data.attendanceCode,
      verificationQuestion: data.verificationQuestion || '',
      expectedAnswer: data.expectedAnswer || '',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Active',
      presentCount: 0,
      absentCount: 60, // Mock total
      yetToSubmit: 60,
      totalStudents: 60,
      trend: []
    };
    setAdminSessions([newSession, ...adminSessions]);
    setShowCreateModal(false);
    reset();
  };
  
  // Mark Attendance State
  const [activeSession, setActiveSession] = useState<{codeRequired: boolean, question: string} | null>({
    codeRequired: true,
    question: "What topic was discussed today?"
  });
  const [code, setCode] = useState('');
  const [answer, setAnswer] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Stats Calculations
  const totalClasses = studentOverall?.totalClasses || 0;
  const totalAttended = studentOverall?.totalPresent || 0;
  const overallPercentage = studentOverall?.overallPercentage?.toFixed(1) || ((totalAttended / (totalClasses || 1)) * 100).toFixed(1);
  const totalMissed = totalClasses - totalAttended;

  const handleMarkAttendance = () => {
    if (code === '7890' && answer.toLowerCase().includes('java')) {
      setAttendanceStatus('success');
      setActiveSession(null);
    } else {
      setAttendanceStatus('error');
    }
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border/40">
        <div>
          <Badge variant="event" className="mb-2">
            ATTENDANCE MANAGEMENT
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {role === 'student' ? 'My Attendance' : 'Class Attendance'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
            {role === 'student' 
              ? 'Track your attendance records, view subject-wise insights, and mark active sessions.' 
              : 'Monitor class attendance, generate reports, and start live attendance sessions.'}
          </p>
        </div>
        <div className="flex gap-2">
        <div className="flex flex-col sm:flex-row gap-3">
          {['faculty', 'hod', 'coordinator', 'both'].includes(role) ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
                {role !== 'faculty' && (
                  <button 
                    onClick={() => setActiveTab('dashboard')} 
                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all flex-1 sm:flex-none ${activeTab === 'dashboard' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Dashboard
                  </button>
                )}
                {role !== 'coordinator' && (
                  <button 
                    onClick={() => { setActiveTab('teachingHistory'); setSelectedSessionId(null); }} 
                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all flex-1 sm:flex-none ${activeTab === 'teachingHistory' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Teaching History
                  </button>
                )}
              </div>

              {['faculty', 'both'].includes(role) && (
                <Button onClick={() => setShowMarkModal(true)} variant="outline" className="gap-2 shadow-sm whitespace-nowrap bg-background">
                  <CheckCircle size={16} /> Mark Attendance
                </Button>
              )}

              {role !== 'coordinator' && role !== 'faculty' && activeTab !== 'teachingHistory' && (
                <Button onClick={() => setShowCreateModal(true)} className="gap-2 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap">
                  <Plus size={16} /> Create Session
                </Button>
              )}
            </div>
          ) : (
            <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('calculator')} 
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'calculator' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Calculator
              </button>
            </div>
          )}
        </div>
      </div>
      </div>

      {activeTab === 'dashboard' && (
        <AnimatePresence mode="wait">
          {selectedStudentId && role === 'coordinator' ? (
            <StudentAttendanceDetails 
              student={coordinatorSectionStudents.find(s => s.id === selectedStudentId)}
              onBack={() => setSelectedStudentId(null)}
            />
          ) : selectedSubjectId && role === 'student' ? (
            <SubjectAttendanceDetails 
              subject={studentSubjectWise?.find((s: any) => s.classSubjectId === selectedSubjectId || s.subjectName === selectedSubjectId || s.name === selectedSubjectId) || null}
              historyData={studentHistory?.filter(h => h.classSubjectId === selectedSubjectId || h.subjectName === selectedSubjectId)}
              onBack={() => setSelectedSubjectId(null)}
            />
          ) : selectedSessionId && ['faculty', 'hod', 'coordinator', 'both'].includes(role) ? (
            <AdminSessionDetails
              session={adminSessions.find(s => s.id === selectedSessionId)}
              onBack={() => setSelectedSessionId(null)}
            />
          ) : role === 'student' ? (
            <StudentAttendanceDetails 
              student={{
                id: user?.id || selectedStudentId || 'unknown',
                name: studentOverall?.studentName || user?.name || 'Student',
                enrollment: studentOverall?.email || user?.email || 'N/A',
                section: studentOverall?.className || 'N/A',
                semester: studentOverall?.semester || 'N/A',
                photo: studentOverall?.profilePictureUrl || user?.profilePictureUrl || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentOverall?.studentName || user?.name || 'Student')}&background=4F46E5&color=fff&size=128`,
                attendance: studentOverall?.overallPercentage ? Math.round(studentOverall.overallPercentage) : 0
              }}
              subjectData={studentSubjectWise}
              historyData={studentHistory}
              overallData={studentOverall}
            />
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
          
          {/* Top KPIs */}
          {role === 'coordinator' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Users className="w-5 h-5"/></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold tracking-tight text-foreground">{coordinatorSectionStudents.length}</h3>
                    <p className="text-xs font-bold mt-1 text-muted-foreground uppercase tracking-wider">Total Students</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><CheckCircle className="w-5 h-5"/></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold tracking-tight text-foreground">
                      {coordinatorSectionStudents.length > 0 ? Math.round(coordinatorSectionStudents.reduce((a, b) => a + b.attendance, 0) / coordinatorSectionStudents.length) : 0}%
                    </h3>
                    <p className="text-xs font-bold mt-1 text-muted-foreground uppercase tracking-wider">Section Avg Attendance</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"><TrendingUp className="w-5 h-5"/></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold tracking-tight text-foreground">
                      {coordinatorSectionStudents.filter(s => s.status === 'Safe').length}
                    </h3>
                    <p className="text-xs font-bold mt-1 text-muted-foreground uppercase tracking-wider">Students in Safe Zone</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500"><AlertTriangle className="w-5 h-5"/></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold tracking-tight text-foreground">
                      {coordinatorSectionStudents.filter(s => s.status === 'Critical').length}
                    </h3>
                    <p className="text-xs font-bold mt-1 text-muted-foreground uppercase tracking-wider">Students at Risk</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border border-border/50 bg-card shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    {getStatusBadge(parseFloat(overallPercentage))}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-foreground tracking-tight">{overallPercentage}%</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Overall Attendance</p>
                  </div>
                  <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${getProgressBarColor(parseFloat(overallPercentage))} rounded-full`} style={{ width: `${overallPercentage}%` }}></div>
                  </div>
                </CardContent>
              </Card>
  
              <Card className="border border-border/50 bg-card shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-foreground tracking-tight">{totalClasses}</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Total Classes Conducted</p>
                  </div>
                </CardContent>
              </Card>
  
              <Card className="border border-border/50 bg-card shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-foreground tracking-tight">{totalAttended}</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Total Classes Attended</p>
                  </div>
                </CardContent>
              </Card>
  
              <Card className="border border-border/50 bg-card shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-foreground tracking-tight">{totalMissed}</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Total Classes Missed</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Mark Attendance Section (Student Only) */}
            {role === 'student' && (
              <div className="lg:col-span-1 space-y-6">
                <Card className="border-border/50 bg-card shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
                  <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" /> Mark Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {attendanceStatus === 'success' ? (
                      <div className="flex flex-col items-center justify-center text-center py-6 space-y-3">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                          <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Attendance Marked!</h3>
                        <p className="text-sm text-muted-foreground">You have successfully submitted your attendance for this session.</p>
                      </div>
                    ) : activeSession ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Active Session</span>
                          </div>
                          <h4 className="text-sm font-bold text-foreground">Java Programming (Dr. Rahul Sharma)</h4>
                        </div>
                        
                        {attendanceStatus === 'error' && (
                          <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
                            Incorrect code or verification answer. Please try again.
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Unique Attendance Code</label>
                            <Input 
                              type="text" 
                              placeholder="e.g. 7890" 
                              className="font-mono text-center tracking-widest text-lg"
                              value={code}
                              onChange={(e) => setCode(e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Verification Question</label>
                            <div className="p-3 bg-muted/50 rounded-md border border-border/50 text-sm font-medium mb-2 text-foreground">
                              {activeSession.question}
                            </div>
                            <Input 
                              type="text" 
                              placeholder="Your answer..." 
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <Button className="w-full mt-2" onClick={handleMarkAttendance}>
                          Submit Attendance
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-10 space-y-3">
                        <Clock className="w-10 h-10 text-muted-foreground/50 mb-2" />
                        <h3 className="text-lg font-semibold text-foreground">No Active Session</h3>
                        <p className="text-sm text-muted-foreground">Your instructor has not started an attendance session yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Insights Card */}
                <Card className="border border-border/50 bg-card shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" /> AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <p className="text-sm text-foreground font-medium">Your attendance in <span className="font-bold text-primary">Operating Systems</span> is dropping. Missing 2 more classes will drop you below 75%.</p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Most Attended</span>
                        <span className="font-semibold">Software Engineering (95%)</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Least Attended</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">Operating Systems (75%)</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Trend</span>
                        <span className="font-semibold text-emerald-600 flex items-center gap-1"><TrendingUp size={14} /> Improving</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Subject-wise Cards / Admin Sessions */}
            {role === 'student' ? (
              <div className="lg:col-span-2 grid-cols-1 md:grid-cols-2 grid gap-6">
                {(studentSubjectWise || []).map((sub, idx) => {
                  const subPct = sub.attendancePercentage || 0;
                  const attended = sub.classesAttended || sub.attendedClasses || 0;
                  const total = sub.totalClasses || 1;
                  const missed = total - attended;
                  const subjectName = sub.subjectName || sub.name || 'Unknown Subject';
                  return (
                    <Card 
                      key={idx} 
                      className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                    >
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-base text-foreground line-clamp-1">{subjectName}</h4>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">{sub.faculty || 'Assigned Faculty'}</p>
                          </div>
                          {getStatusBadge(subPct)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
                          <div>
                            <p className="text-2xl font-extrabold tracking-tight">{subPct.toFixed(1)}%</p>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                              Attendance
                            </p>
                          </div>
                          <div className="text-right">
                             <div className="flex justify-end gap-3">
                               <div className="text-center">
                                 <p className="text-lg font-bold text-emerald-600">{sub.attended}</p>
                                 <p className="text-[10px] text-muted-foreground uppercase">Attended</p>
                               </div>
                               <div className="text-center">
                                 <p className="text-lg font-bold text-rose-500">{missed}</p>
                                 <p className="text-[10px] text-muted-foreground uppercase">Missed</p>
                               </div>
                             </div>
                          </div>
                        </div>
                        
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-6">
                          <div className={`h-full ${getProgressBarColor(subPct)} rounded-full`} style={{ width: `${subPct}%` }}></div>
                        </div>
                        
                        <div className="mt-auto">
                          <Button 
                            variant="outline" 
                            className="w-full gap-2"
                            onClick={() => setSelectedSubjectId(sub.name)}
                          >
                            <BarChart3 className="w-4 h-4" />
                            View History
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : role === 'coordinator' ? (
              <CoordinatorDashboard 
                onSelectStudent={setSelectedStudentId} 
                students={coordinatorSectionStudents}
                section={assignedSection}
                semester={assignedSemester}
              />
            ) : (
              <div className="lg:col-span-3 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Session Management</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2"><Filter size={14} /> Filter</Button>
                    <Button variant="outline" size="sm" className="gap-2"><Search size={14} /> Search</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adminSessions.map(session => (
                    <Card key={session.id} className="border border-border/50 bg-card shadow-sm hover:border-primary/30 transition-all duration-300">
                      <CardContent className="p-5 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-base text-foreground line-clamp-1">{session.subject}</h4>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">{session.class} â€¢ {session.type}</p>
                          </div>
                          <Badge variant={session.status === 'Active' ? 'active' : session.status === 'Closed' ? 'outline' : 'rejected'}>
                            {session.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4 mt-2">
                          <div className="flex items-center text-xs text-muted-foreground gap-2">
                            <Calendar size={12} /> {session.date}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground gap-2">
                            <Clock size={12} /> {session.time}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground gap-2">
                            <QrCode size={12} /> Code: <span className="font-mono font-bold text-foreground">{session.code}</span>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-border/50">
                          <div className="flex justify-between text-sm mb-3">
                            <span className="text-emerald-600 font-medium">{session.presentCount} Present</span>
                            <span className="text-rose-600 font-medium">{session.absentCount} Absent</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setSelectedSessionId(session.id)}>View</Button>
                            <Button variant="outline" size="sm" className="flex-1 text-xs">Edit</Button>
                            <Button variant="outline" size="icon" className="w-8 h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
          </motion.div>
          )}
        </AnimatePresence>
      )}

      {activeTab === 'teachingHistory' && ['faculty', 'hod', 'coordinator', 'both'].includes(role) && (
        <AdminTeachingHistory />
      )}



      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(studentSubjectWise || []).map((sub, idx) => {
            const currentPct = sub.attendancePercentage || 0;
            const subjectName = sub.subjectName || sub.name || 'Unknown Subject';
            
            // Real calculations from backend
            const neededFor75 = sub.neededFor75 ?? -1;
            const neededFor80 = sub.neededFor80 ?? -1;
            const canMiss = sub.safeToMiss ?? 0;
            
            const renderPrediction = (needed: number) => {
              if (needed === -2) return <span className="text-sm font-bold text-muted-foreground">—</span>;
              if (needed === -1) return <span className="text-sm font-bold text-rose-500">Cannot be achieved</span>;
              if (needed === 0) return <span className="text-sm font-bold text-emerald-500">Safe</span>;
              return <span className="text-sm font-bold text-foreground">Attend next {needed} classes</span>;
            };
            
            return (
              <Card key={idx} className="border border-border/50 bg-card shadow-sm">
                <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4">
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    <span className="truncate pr-2">{subjectName}</span>
                    <Badge variant="outline" className="shrink-0">{currentPct.toFixed(1)}%</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">To reach 75%</span>
                    {renderPrediction(neededFor75)}
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">To reach 80%</span>
                    {renderPrediction(neededFor80)}
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Safe to miss</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{canMiss} classes</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

    </div>

      {/* Mark Attendance Modal */}
      <AnimatePresence>
        {showMarkModal && (
          <MarkAttendanceModal 
            isOpen={showMarkModal}
            onClose={() => setShowMarkModal(false)}
            user={user}
            statusBadge={(s: string) => <Badge variant="outline">{s}</Badge>}
            onSuccess={() => window.dispatchEvent(new Event('sync-attendance-data'))}
          />
        )}
      </AnimatePresence>

      {/* Create Attendance Session Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateSessionModal 
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={onSubmit}
            register={register}
            handleSubmit={handleSubmit}
            errors={errors}
            watch={watch}
            setValue={setValue}
            handleGenerateCode={handleGenerateCode}
            codeValue={watch('attendanceCode')}
          />
        )}
      </AnimatePresence>
    </>
  );
};

