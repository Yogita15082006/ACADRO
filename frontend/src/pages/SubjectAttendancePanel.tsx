import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Plus, Calendar, Clock, Users, ArrowLeft, XCircle, ClipboardCheck, History, Pause, Play, Square, Copy, Eye, Activity, Save, Trash2, FileText, CheckCircle2, UserPlus, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { attendanceService } from '../services/attendanceService';
import { toast } from 'react-hot-toast';

const FacultyAttendancePanel = ({ workspaceContext }: { workspaceContext: any }) => {
  const { user } = useAuth();
  // const classStudents = mockData.students.filter(s => s.classId === workspaceContext.classId);

  const [sessions, setSessions] = useState<any[]>([]);
  // const [isLoading, setIsLoading] = useState(true);

  const [liveResponsesSessionId, setLiveResponsesSessionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'main' | 'history' | 'detail'>('main');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLiveResponsesOpen, setIsLiveResponsesOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [enrollmentNumberToAdd, setEnrollmentNumberToAdd] = useState('');
  
  const [isBulkTextOpen, setIsBulkTextOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState<{ matched: any[], unmatched: [] } | null>(null);
  const [reviewSource, setReviewSource] = useState<'OCR' | 'Text'>('OCR');

  const [selectedSessionRecords, setSelectedSessionRecords] = useState<any[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDetailSessionId, setSelectedDetailSessionId] = useState<string | null>(null);
  const [previousViewMode, setPreviousViewMode] = useState<'main' | 'history'>('main');

  const [newSession, setNewSession] = useState({
    topic: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration: '60',
    code: Math.floor(100000 + Math.random() * 900000).toString(),
    verificationQuestion: '',
    correctAnswer: '',
    uniqueCodeCount: 0
  });

  const [liveResponses, setLiveResponses] = useState<any[]>([]);

  const fetchSessions = async () => {
    if (!user?.id) return;
    try {
      const data = await attendanceService.getFacultySessions(user.id);
      
      // Filter to ONLY show sessions for the current Subject Card
      const subjectSessions = data.filter((s: any) => s.classSubjectId === workspaceContext.id);
      
      // Backend returns data sorted, we can augment with mock records for UI compatibility where needed, 
      // but let's stick to real data properties
      const mappedSessions = subjectSessions.map((s: any) => ({
        ...s,
        records: [] // Initialize records to empty, detail view will fetch them
      }));
      setSessions(mappedSessions);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sessions');
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Polling for live responses
  useEffect(() => {
    let interval: any;
    if (liveResponsesSessionId && isLiveResponsesOpen) {
      const fetchLive = async () => {
        try {
          const records = await attendanceService.getLiveResponses(liveResponsesSessionId);
          setLiveResponses(records);
        } catch (err) {
          console.error(err);
        }
      };
      fetchLive();
      interval = setInterval(fetchLive, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [liveResponsesSessionId, isLiveResponsesOpen]);



  const handleCreateSession = async () => {
    if (!newSession.topic) return;
    if (!user?.id) return;
    
    try {
      const payload = {
        classSubjectId: workspaceContext.id,
        type: 'Lecture',
        lectureNumber: newSession.topic.replace('Lecture ', '').split(':')[0] || '1',
        topic: newSession.topic,
        date: newSession.date,
        startTime: newSession.time,
        endTime: newSession.time, // Needs actual calculation
        duration: newSession.duration,
        code: newSession.code,
        requireVerification: !!newSession.verificationQuestion,
        verificationQuestion: newSession.verificationQuestion,
        expectedAnswer: newSession.correctAnswer,
        uniqueCodeCount: newSession.uniqueCodeCount
      };
      
      const created = await attendanceService.createSession(user.id, payload as any);
      setSessions([{ ...created, records: [] }, ...sessions]);
      setViewMode('main');
      setIsCreateModalOpen(false);
      toast.success('Session created successfully');
      
      // Reset form
      setNewSession({
        topic: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        duration: '60',
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        verificationQuestion: '',
        correctAnswer: '',
        uniqueCodeCount: 0
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to create session');
    }
  };

  const updateSessionStatus = async (id: string, status: string) => {
    try {
      const updated = await attendanceService.updateSessionStatus(id, status);
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
      toast.success(`Session ${status}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update session status');
    }
  };

  const handleStopSession = async (id: string) => {
    await updateSessionStatus(id, 'CLOSED');
  };

  const handleSaveSession = async (id: string) => {
    await updateSessionStatus(id, 'COMPLETED');
    window.dispatchEvent(new Event('sync-attendance-data'));
  };

  const handleBulkTextApprove = async () => {
    if (!selectedDetailSessionId || !bulkText) return;
    setIsBulkLoading(true);
    try {
      const data = await attendanceService.bulkApproveText(selectedDetailSessionId, bulkText);
      setReviewData(data);
      setReviewSource('Text');
      setIsBulkTextOpen(false);
      setBulkText('');
      setIsReviewModalOpen(true);
    } catch (err: any) {
      toast.error('Failed to process bulk text');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleConfirmReview = async () => {
    if (!selectedDetailSessionId || !reviewData) return;
    setIsBulkLoading(true);
    try {
      const approveIds = reviewData.matched.map((r: any) => r.id);
      const rejectIds = reviewData.unmatched.map((r: any) => r.id);
      
      await attendanceService.bulkApplyReview(selectedDetailSessionId, {
        approveIds,
        rejectIds,
        approvalSource: reviewSource,
        remarks: `Processed via ${reviewSource}`
      });
      
      toast.success('Bulk attendance applied successfully');
      
      const records = await attendanceService.getLiveResponses(selectedDetailSessionId);
      setSelectedSessionRecords(records);
      setIsReviewModalOpen(false);
      setReviewData(null);
      
      // Global Refresh
      await fetchSessions();

    } catch (err: any) {
      console.error(err);
      toast.error('Failed to apply bulk review');
    } finally {
      setIsBulkLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'detail' && selectedDetailSessionId) {
      const fetchDetail = () => {
        attendanceService.getLiveResponses(selectedDetailSessionId)
          .then(records => setSelectedSessionRecords(records))
          .catch(err => console.error("Failed to fetch detail records", err));
      };
      fetchDetail();
      const interval = setInterval(fetchDetail, 5000);
      return () => clearInterval(interval);
    }
  }, [viewMode, selectedDetailSessionId]);

  const handleRespondRequest = async (sessionId: string, attendanceId: string, accept: boolean) => {
    try {
      await attendanceService.respondToRequest(sessionId, attendanceId, accept);
      toast.success(accept ? 'Request approved' : 'Request rejected');
      // Refresh the session records
      attendanceService.getLiveResponses(sessionId)
        .then(records => setSelectedSessionRecords(records))
        .catch(err => console.error("Failed to fetch detail records", err));
      fetchSessions(); // Also update summary
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to process request');
    }
  };

  const handleBulkRespond = async (accept: boolean) => {
    if (!selectedDetailSessionId || selectedRecords.size === 0) return;
    try {
      await attendanceService.bulkRespondToRequests(selectedDetailSessionId, Array.from(selectedRecords), accept);
      toast.success(`Bulk ${accept ? 'approval' : 'rejection'} processed successfully`);
      setSelectedRecords(new Set()); // Clear selection
      
      attendanceService.getLiveResponses(selectedDetailSessionId)
        .then(records => setSelectedSessionRecords(records))
        .catch(err => console.error("Failed to fetch detail records", err));
      fetchSessions();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to process bulk request');
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await attendanceService.deleteSession(sessionToDelete);
      toast.success('Attendance session deleted permanently');
      setSessionToDelete(null);
      fetchSessions();
      if (selectedDetailSessionId === sessionToDelete) {
        setViewMode('main');
        setSelectedDetailSessionId(null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete session: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddStudentToHistory = async () => {
    if (!enrollmentNumberToAdd || !selectedDetailSessionId) return;
    try {
      await attendanceService.addStudentToHistory(selectedDetailSessionId, enrollmentNumberToAdd);
      toast.success('Student marked present');
      setIsAddStudentOpen(false);
      setEnrollmentNumberToAdd('');
      // Refresh sessions to get updated records
      fetchSessions();
      const records = await attendanceService.getLiveResponses(selectedDetailSessionId);
      setSelectedSessionRecords(records);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to add student: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRespondToRequest = async (attendanceId: string, accept: boolean) => {
    if (!liveResponsesSessionId) return;
    try {
      await attendanceService.respondToRequest(liveResponsesSessionId, attendanceId, accept);
      toast.success(`Request ${accept ? 'Accepted' : 'Rejected'}`);
      // Refresh live responses
      const records = await attendanceService.getLiveResponses(liveResponsesSessionId);
      setLiveResponses(records);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to respond to request: ' + (err.response?.data?.message || err.message));
    }
  };

  const renderMain = () => {
    const activeSessions = sessions.filter(s => {
      const st = s.status ? s.status.toUpperCase() : '';
      return st === 'ACTIVE' || st === 'PAUSED';
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card p-5 rounded-xl border border-border/50 shadow-sm">
                <div className="space-y-1.5">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-primary" /> Attendance Management</h3>
                    <p className="text-sm text-muted-foreground">Manage live attendance for {workspaceContext.subjectName}.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setViewMode('history')} className="shadow-sm">
                        <History className="w-4 h-4 mr-2" /> Attendance History
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)} className="shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Create Session
                    </Button>
                </div>
            </div>

            {activeSessions.length > 0 && (
                <div className="space-y-6">
                    {activeSessions.map(activeSession => (
                        <Card key={activeSession.id} className="border-primary/50 shadow-lg overflow-hidden relative">
                            {activeSession.status === 'Active' && <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse" />}
                    <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <CardTitle className="text-2xl font-bold">{activeSession.topic}</CardTitle>
                                <CardDescription className="text-base mt-1.5 flex items-center gap-3">
                                    <span className="font-semibold text-foreground">{workspaceContext.subjectName}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {activeSession.date}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {activeSession.time} ({activeSession.duration}m)</span>
                                </CardDescription>
                            </div>
                            <Badge variant={activeSession.status === 'Active' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                                {activeSession.status === 'Active' ? <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Live</span> : activeSession.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="bg-card p-5 rounded-xl border border-border/50 shadow-sm flex justify-between items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Attendance Code</p>
                                        <p className="text-xs text-muted-foreground">Share this with students</p>
                                    </div>
                                    <div className="text-4xl font-mono font-bold text-primary tracking-widest px-4 py-2 bg-primary/10 rounded-lg">
                                        {activeSession.code}
                                    </div>
                                </div>
                                <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Verification Question</p>
                                    <p className="text-lg font-medium text-foreground">{activeSession.verificationQuestion || <span className="text-muted-foreground italic">No verification question set.</span>}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-card rounded-xl p-4 border border-border/50 shadow-sm flex flex-col items-center justify-center text-center">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Students</p>
                                    <p className="text-3xl font-bold text-foreground">{activeSession.totalStudents}</p>
                                </div>
                                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 shadow-sm flex flex-col items-center justify-center text-center">
                                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Live Attendance</p>
                                    <p className="text-3xl font-bold text-primary">{Math.round((activeSession.presentCount / activeSession.totalStudents) * 100)}%</p>
                                </div>
                                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 shadow-sm flex flex-col items-center justify-center text-center">
                                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Present</p>
                                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{activeSession.presentCount}</p>
                                </div>
                                {(activeSession.status === 'Closed' || activeSession.status === 'CLOSED' || activeSession.status === 'Saved' || activeSession.status === 'SAVED') ? (
                                    <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/20 shadow-sm flex flex-col items-center justify-center text-center">
                                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Absent</p>
                                        <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">{activeSession.absentCount}</p>
                                    </div>
                                ) : (
                                    <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 shadow-sm flex flex-col items-center justify-center text-center">
                                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Pending</p>
                                        <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{activeSession.totalStudents - activeSession.presentCount}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/20 border-t border-border/50 py-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {(activeSession.status === 'Active' || activeSession.status === 'ACTIVE') && (
                                <Button onClick={() => updateSessionStatus(activeSession.id, 'PAUSED')} variant="outline" className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
                                    <Pause className="w-4 h-4 mr-2" /> Pause Attendance
                                </Button>
                            )}
                            {(activeSession.status === 'Paused' || activeSession.status === 'PAUSED') && (
                                <Button onClick={() => updateSessionStatus(activeSession.id, 'ACTIVE')} variant="outline" className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                                    <Play className="w-4 h-4 mr-2" /> Resume Attendance
                                </Button>
                            )}
                            {(activeSession.status === 'Active' || activeSession.status === 'ACTIVE' || activeSession.status === 'Paused' || activeSession.status === 'PAUSED') && (
                                <Button onClick={() => handleStopSession(activeSession.id)} variant="destructive">
                                    <Square className="w-4 h-4 mr-2" /> Stop Attendance
                                </Button>
                            )}
                            {(activeSession.status === 'Active' || activeSession.status === 'ACTIVE' || activeSession.status === 'Paused' || activeSession.status === 'PAUSED' || activeSession.status === 'Closed' || activeSession.status === 'CLOSED') && (
                                <Button onClick={() => {
                                    if (activeSession.status !== 'Closed') {
                                        handleStopSession(activeSession.id);
                                    }
                                    setTimeout(() => handleSaveSession(activeSession.id), 0);
                                }} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                                    <Save className="w-4 h-4 mr-2" /> Save Attendance
                                </Button>
                            )}
                            <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setSessionToDelete(activeSession.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </Button>

                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(activeSession.code)}>
                                <Copy className="w-4 h-4 mr-2" /> Copy Code
                            </Button>
                            <Button onClick={() => { setLiveResponsesSessionId(activeSession.id); setIsLiveResponsesOpen(true); }}>
                                <Eye className="w-4 h-4 mr-2" /> View Live Responses
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
                    ))}
                </div>
            )}
        </div>
    );
  };

  const renderHistory = () => {
    const closedSessions = sessions.filter(s => {
      const st = s.status ? s.status.toUpperCase() : '';
      return st === 'COMPLETED' || st === 'SAVED' || st === 'CLOSED';
    });
    const totalSessions = closedSessions.length;
    const averageAttendance = totalSessions > 0 ? Math.round(closedSessions.reduce((acc, s) => acc + (s.presentCount / s.totalStudents), 0) / totalSessions * 100) : 0;
    const highestAttendance = totalSessions > 0 ? Math.max(...closedSessions.map(s => Math.round((s.presentCount / s.totalStudents) * 100))) : 0;
    const lowestAttendance = totalSessions > 0 ? Math.min(...closedSessions.map(s => Math.round((s.presentCount / s.totalStudents) * 100))) : 0;

    const studentStats: Record<string, { present: number, total: number }> = {};
    closedSessions.forEach(s => {
       s.records.forEach((r: any) => {
           if (!studentStats[r.studentId]) studentStats[r.studentId] = { present: 0, total: 0 };
           studentStats[r.studentId].total++;
           if (r.status === 'Present') studentStats[r.studentId].present++;
       });
    });
    let below75 = 0;
    let above90 = 0;
    Object.values(studentStats).forEach(stat => {
        const pct = (stat.present / stat.total) * 100;
        if (pct < 75) below75++;
        if (pct > 90) above90++;
    });

    const filteredSessions = closedSessions.filter(s => s.date === selectedHistoryDate);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setViewMode('main')} className="shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2"><History className="w-6 h-6 text-primary" /> Attendance History</h2>
                    <p className="text-muted-foreground font-medium mt-1">Analytics and past sessions for {workspaceContext.subjectName}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="bg-primary/5 border-primary/20 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs font-bold text-primary/80 uppercase tracking-wider mb-1">Total Sessions</p>
                        <p className="text-2xl font-bold text-primary">{totalSessions}</p>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1">Avg Attendance</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{averageAttendance}%</p>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1">Highest</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{highestAttendance}%</p>
                    </CardContent>
                </Card>
                <Card className="bg-rose-500/5 border-rose-500/20 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs font-bold text-rose-600/80 dark:text-rose-400/80 uppercase tracking-wider mb-1">Lowest</p>
                        <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{lowestAttendance}%</p>
                    </CardContent>
                </Card>
                <Card className="bg-rose-500/5 border-rose-500/20 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs font-bold text-rose-600/80 dark:text-rose-400/80 uppercase tracking-wider mb-1">&lt; 75% Students</p>
                        <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{below75}</p>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <p className="text-xs font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1">&gt; 90% Students</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{above90}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Search by Date</h3>
                </div>
                <Input type="date" className="w-auto shadow-sm" value={selectedHistoryDate} onChange={(e) => setSelectedHistoryDate(e.target.value)} />
            </div>

            {filteredSessions.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border/50">
                    <p className="text-muted-foreground font-medium">No sessions conducted on {selectedHistoryDate}.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredSessions.map(session => (
                        <Card key={session.id} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                            <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
                                <CardTitle className="text-lg font-bold text-foreground leading-tight line-clamp-2 mb-2">{session.topic}</CardTitle>
                                <CardDescription className="flex flex-col gap-1.5">
                                    <span className="font-semibold text-foreground">{workspaceContext.subjectName}</span>
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <Badge variant="outline" className="bg-background">{workspaceContext.year || 'N/A'}</Badge>
                                        <Badge variant="outline" className="bg-background">{workspaceContext.semester || 'N/A'}</Badge>
                                        <Badge variant="outline" className="bg-background">{workspaceContext.classSection || workspaceContext.className || 'N/A'}</Badge>
                                    </div>
                                    <span className="flex items-center gap-2 font-medium text-sm mt-1"><Users className="w-4 h-4" /> {workspaceContext.facultyName || 'Faculty XYZ'}</span>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1.5 font-medium"><Calendar className="w-4 h-4" /> {session.date}</span>
                                        <span className="flex items-center gap-1.5 font-medium"><Clock className="w-4 h-4" /> {session.time}</span>
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 flex-1">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-card rounded-lg p-3 text-center border border-border/50 shadow-sm">
                                        <p className="text-[10px] text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Total</p>
                                        <p className="text-xl font-bold text-foreground">{session.totalStudents}</p>
                                    </div>
                                    <div className="bg-emerald-500/10 rounded-lg p-3 text-center border border-emerald-500/20 shadow-sm">
                                        <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold mb-1 uppercase tracking-wider">Present</p>
                                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{session.presentCount}</p>
                                    </div>
                                    <div className="bg-rose-500/10 rounded-lg p-3 text-center border border-rose-500/20 shadow-sm">
                                        <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-semibold mb-1 uppercase tracking-wider">Absent</p>
                                        <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{session.absentCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 pb-4 px-6 border-t border-transparent gap-3 flex flex-wrap">
                                <Button variant="default" className="flex-1 min-w-[120px]" onClick={() => { setSelectedDetailSessionId(session.id); setPreviousViewMode(viewMode as 'main'|'history'); setViewMode('detail'); }}>
                                    <FileText className="w-4 h-4 mr-2" /> View Report
                                </Button>
                                <Button variant="destructive" className="w-full sm:w-auto px-3" onClick={() => setSessionToDelete(session.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
  };

  const renderDetail = () => {
    const session = sessions.find(s => s.id === selectedDetailSessionId);
    if (!session) return null;

    const allRecords = selectedSessionRecords ? [...selectedSessionRecords].sort((a: any, b: any) => {
        if (a.status?.toUpperCase() === 'PRESENT' && b.status?.toUpperCase() !== 'PRESENT') return -1;
        if (b.status?.toUpperCase() === 'PRESENT' && a.status?.toUpperCase() !== 'PRESENT') return 1;
        return 0;
    }) : [];
    const totalEligible = session.totalStudents || 0;
    const totalPresent = session.presentCount || 0;
    const totalAbsent = session.absentCount || 0;
    const percentage = totalEligible > 0 ? Math.round((totalPresent / totalEligible) * 100) : 0;
    const facultyName = workspaceContext.facultyName || 'Faculty XYZ';
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setViewMode(previousViewMode)} className="shrink-0 hover:bg-muted">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{session.topic}</h2>
                    <p className="text-muted-foreground font-medium mt-1">
                        {session.date} at {session.time} • Code: <span className="font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded ml-1">{session.code}</span>
                    </p>
                </div>
                <div className="ml-auto flex gap-2">
                    {selectedRecords.size > 0 && (
                        <>
                            <Button onClick={() => handleBulkRespond(true)} className="shadow-sm bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Selected
                            </Button>
                            <Button onClick={() => handleBulkRespond(false)} className="shadow-sm bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/30">
                                <XCircle className="w-4 h-4 mr-2" /> Reject Selected
                            </Button>
                        </>
                    )}
                    <Button onClick={() => setIsAddStudentOpen(true)} className="shadow-sm">
                        <UserPlus className="w-4 h-4 mr-2" /> Add Student
                    </Button>
                </div>
            </div>

            <Card className="border border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-lg">Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y divide-border/50 md:divide-y-0 md:divide-x">
                        <div className="p-5 space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Subject & Faculty</p>
                                <p className="font-semibold text-foreground mt-1">{workspaceContext.subjectName}</p>
                                <p className="text-sm text-foreground mt-0.5">{facultyName}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Session Details</p>
                                <p className="text-sm text-foreground mt-1">{session.topic}</p>
                                <p className="text-sm text-foreground mt-0.5">{session.date} • {session.time}</p>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Class Context</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Department</p>
                                        <p className="text-sm font-medium">{workspaceContext.department || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Batch</p>
                                        <p className="text-sm font-medium">{workspaceContext.batch || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Academic Year</p>
                                        <p className="text-sm font-medium">{workspaceContext.year || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Semester</p>
                                        <p className="text-sm font-medium">{workspaceContext.semester || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-muted-foreground">Class / Section</p>
                                        <p className="text-sm font-medium">{workspaceContext.classSection || workspaceContext.className || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 flex flex-col justify-center">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/10">
                                    <p className="text-2xl font-bold text-primary">{totalEligible}</p>
                                    <p className="text-xs font-semibold text-primary/80 uppercase mt-1">Eligible</p>
                                </div>
                                <div className="text-center p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalPresent}</p>
                                    <p className="text-xs font-semibold text-emerald-600/80 uppercase mt-1">Present</p>
                                </div>
                                <div className="text-center p-3 bg-rose-500/5 rounded-lg border border-rose-500/10">
                                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{totalAbsent}</p>
                                    <p className="text-xs font-semibold text-rose-600/80 uppercase mt-1">Absent</p>
                                </div>
                                <div className="text-center p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{percentage}%</p>
                                    <p className="text-xs font-semibold text-amber-600/80 uppercase mt-1">Rate</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-border/50 shadow-sm">
                <CardHeader className="bg-muted/20 border-b border-border/50 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">All Students</CardTitle>
                    {session.isSystemGenerated && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsBulkTextOpen(true)}>
                          <FileText className="w-4 h-4 mr-2" /> Bulk Text
                        </Button>
                      </div>
                    )}
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px] pl-6">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300"
                                        checked={allRecords.filter((r: any) => r.status?.toUpperCase() === 'PENDING').length > 0 && selectedRecords.size === allRecords.filter((r: any) => r.status?.toUpperCase() === 'PENDING').length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                const pendingIds = allRecords.filter((r: any) => r.status?.toUpperCase() === 'PENDING').map((r: any) => r.id);
                                                setSelectedRecords(new Set(pendingIds));
                                            } else {
                                                setSelectedRecords(new Set());
                                            }
                                        }}
                                    />
                                </TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Enrollment No.</TableHead>
                                <TableHead>Mark Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Approval Source</TableHead>
                                <TableHead>Remarks</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No student records found.</TableCell>
                                </TableRow>
                            ) : allRecords.map((r: any) => {
                                const isAbsent = r.status?.toUpperCase() === 'ABSENT';
                                const isPending = r.status?.toUpperCase() === 'PENDING';
                                return (
                                <TableRow key={r.id} className={`transition-colors ${isAbsent ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-muted/10'}`}>
                                    <TableCell className="pl-6">
                                        {isPending && (
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300"
                                                checked={selectedRecords.has(r.id)}
                                                onChange={(e) => {
                                                    const newSet = new Set(selectedRecords);
                                                    if (e.target.checked) {
                                                        newSet.add(r.id);
                                                    } else {
                                                        newSet.delete(r.id);
                                                    }
                                                    setSelectedRecords(newSet);
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 ${isAbsent ? 'ring-2 ring-rose-500/20' : 'bg-muted ring-1 ring-border'}`}>
                                                {r.avatar ? <img src={r.avatar} alt={r.name} className={`w-full h-full object-cover ${isAbsent ? 'grayscale opacity-70' : ''}`} /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{r.name?.charAt(0)}</div>}
                                            </div>
                                            <span className={`font-semibold ${isAbsent ? 'text-rose-700 dark:text-rose-400' : 'text-foreground'}`}>{r.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-muted-foreground text-sm uppercase">{r.enrollmentNumber}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{r.time || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={r.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' : !isAbsent ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'}>
                                            {r.status?.toUpperCase() === 'PENDING' ? 'Pending' : r.status?.toUpperCase() === 'ABSENT' ? 'Absent' : 'Present'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {r.approvalSource && r.approvalSource !== '-' ? (
                                            <Badge variant="secondary" className="text-[10px]">{r.approvalSource}</Badge>
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={r.remarks !== '-' ? r.remarks : ''}>
                                        {r.remarks !== '-' ? r.remarks : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {isPending && session.isSystemGenerated && (
                                            <div className="flex justify-end items-center gap-2">
                                                <Button size="sm" variant="outline" className="h-7 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20" onClick={() => handleRespondRequest(session.id, r.id, true)}>Accept</Button>
                                                <Button size="sm" variant="outline" className="h-7 text-xs bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20" onClick={() => handleRespondRequest(session.id, r.id, false)}>Reject</Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
  };



  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
      {viewMode === 'main' && renderMain()}
      {viewMode === 'history' && renderHistory()}
      {viewMode === 'detail' && renderDetail()}

      {/* Create Session Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Attendance Session</DialogTitle>
            <DialogDescription>
              Create a new attendance tracking session. The subject contextual details are automatically captured.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Lecture Topic <span className="text-destructive">*</span></Label>
              <Input 
                placeholder="e.g. Introduction to React Hooks" 
                value={newSession.topic}
                onChange={(e) => setNewSession({...newSession, topic: e.target.value})}
                className="shadow-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="font-semibold text-foreground">Date</Label>
                <Input 
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                  className="shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-foreground">Time</Label>
                <Input 
                  type="time"
                  value={newSession.time}
                  onChange={(e) => setNewSession({...newSession, time: e.target.value})}
                  className="shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Duration (Minutes)</Label>
              <Input 
                type="number"
                value={newSession.duration}
                onChange={(e) => setNewSession({...newSession, duration: e.target.value})}
                className="shadow-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="font-semibold text-foreground">Unique Code Count <span className="text-destructive">*</span></Label>
                <Input 
                  type="number"
                  value={newSession.uniqueCodeCount || ''}
                  onChange={(e) => setNewSession({...newSession, uniqueCodeCount: parseInt(e.target.value) || 0})}
                  className="shadow-sm"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-foreground">Attendance Code</Label>
                <div className="flex gap-2">
                  <Input 
                    value={newSession.code}
                    onChange={(e) => setNewSession({...newSession, code: e.target.value})}
                    className="font-mono font-bold tracking-widest text-center shadow-sm text-primary"
                  />
                  <Button variant="outline" type="button" onClick={() => setNewSession({...newSession, code: Math.floor(100000 + Math.random() * 900000).toString()})} className="shadow-sm shrink-0">
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">Verification (Optional)</h4>
                <p className="text-xs text-muted-foreground">Ask a question to verify student presence.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Verification Question</Label>
                <Input 
                  placeholder="e.g. What is the main hook used for state?" 
                  value={newSession.verificationQuestion}
                  onChange={(e) => setNewSession({...newSession, verificationQuestion: e.target.value})}
                  className="bg-background shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Correct Answer</Label>
                <Input 
                  placeholder="e.g. useState" 
                  value={newSession.correctAnswer}
                  onChange={(e) => setNewSession({...newSession, correctAnswer: e.target.value})}
                  className="bg-background shadow-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSession} disabled={!newSession.topic} className="shadow-sm">Create Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Responses Modal */}
      <Dialog open={isLiveResponsesOpen} onOpenChange={setIsLiveResponsesOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
              <div className="bg-muted/30 px-6 py-4 border-b border-border/50 shrink-0">
                  <DialogTitle className="text-xl flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" /> Live Responses
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                      Real-time attendance tracking and verification status.
                  </DialogDescription>
                  
                  {(() => {
                      const activeSession = sessions.find(s => s.id === liveResponsesSessionId);
                      const totalStudents = activeSession?.totalStudents || 0;
                      const present = liveResponses.filter((r: any) => r.status === 'PRESENT').length;
                      const pending = totalStudents > 0 ? Math.max(0, totalStudents - present) : 0;
                      const duplicateConflicts = liveResponses.filter((r: any) => r.status === 'CONFLICT').length;
                      const verificationFailed = liveResponses.filter((r: any) => r.verificationResult === 'FAILED').length;
                      const invalidAttempts = liveResponses.filter((r: any) => r.status === 'REJECTED' && r.verificationResult !== 'FAILED').length;
                      
                      return (
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
                              <div className="bg-background rounded-lg p-3 border border-border/50 shadow-sm text-center">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                                  <p className="text-xl font-bold text-foreground">{totalStudents}</p>
                              </div>
                              <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20 shadow-sm text-center">
                                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Present</p>
                                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{present}</p>
                              </div>
                              <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20 shadow-sm text-center">
                                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Pending</p>
                                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{pending}</p>
                              </div>
                              <div className="bg-rose-500/10 rounded-lg p-3 border border-rose-500/20 shadow-sm text-center">
                                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Conflicts</p>
                                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{duplicateConflicts}</p>
                              </div>
                              <div className="bg-rose-500/10 rounded-lg p-3 border border-rose-500/20 shadow-sm text-center">
                                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Invalid Code</p>
                                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{invalidAttempts}</p>
                              </div>
                              <div className="bg-rose-500/10 rounded-lg p-3 border border-rose-500/20 shadow-sm text-center">
                                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Verif. Failed</p>
                                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{verificationFailed}</p>
                              </div>
                          </div>
                      );
                  })()}
              </div>

              <div className="flex-1 overflow-auto bg-background">
                  <Table>
                      <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                          <TableRow>
                              <TableHead className="pl-6 w-[250px]">Student Profile</TableHead>
                              <TableHead>Enrollment No.</TableHead>
                              <TableHead>Code Used</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Verification</TableHead>
                              <TableHead>Remarks</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {liveResponses.length === 0 ? (
                              <TableRow>
                                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                      <div className="flex flex-col items-center gap-2">
                                          <Users className="w-8 h-8 text-muted-foreground/50" />
                                          <p>No responses recorded yet.</p>
                                      </div>
                                  </TableCell>
                              </TableRow>
                          ) : (
                              liveResponses.map((r: any) => (
                                  <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                                      <TableCell className="pl-6">
                                          <div className="flex items-center gap-3">
                                              <div className="w-9 h-9 rounded-full bg-muted overflow-hidden shrink-0 border border-border/50">
                                                  <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" />
                                              </div>
                                              <span className="font-semibold text-sm">{r.name}</span>
                                          </div>
                                      </TableCell>
                                      <TableCell className="font-mono text-muted-foreground text-xs">{r.enrollmentNumber}</TableCell>
                                      <TableCell>
                                          <Badge variant="outline" className={r.status === 'CONFLICT' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-mono' : 'bg-muted text-muted-foreground font-mono'}>
                                              {r.uniqueCode || '-'}
                                          </Badge>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground text-xs">{r.time}</TableCell>
                                      <TableCell>
                                          {r.status === 'PRESENT' ? (
                                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">Present</Badge>
                                          ) : r.status === 'PENDING' ? (
                                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">Pending</Badge>
                                          ) : r.status === 'REJECTED' ? (
                                              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px]">Rejected</Badge>
                                          ) : r.status === 'CONFLICT' ? (
                                              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px]">Duplicate</Badge>
                                          ) : (
                                              <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                                          )}
                                      </TableCell>
                                      <TableCell>
                                          {r.verificationResult === 'PASSED' ? (
                                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">Passed</Badge>
                                          ) : r.verificationResult === 'FAILED' ? (
                                              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px]">Failed</Badge>
                                          ) : r.verificationResult === 'INVALID_CODE' ? (
                                              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px]">Invalid Code</Badge>
                                          ) : r.verificationResult === 'INVALID_UNIQUE_CODE' ? (
                                              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px]">Invalid Unique Code</Badge>
                                          ) : (
                                              <span className="text-xs text-muted-foreground">-</span>
                                          )}
                                      </TableCell>
                                      <TableCell>
                                          {r.status === 'PENDING' ? (
                                              <div className="flex gap-2">
                                                  <Button size="sm" variant="outline" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30 h-7 text-xs px-2" onClick={() => handleRespondToRequest(r.id, true)}>Accept</Button>
                                                  <Button size="sm" variant="outline" className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/30 h-7 text-xs px-2" onClick={() => handleRespondToRequest(r.id, false)}>Reject</Button>
                                              </div>
                                          ) : r.answer && r.answer !== '-' ? (
                                              <span className="text-xs text-muted-foreground truncate max-w-[150px] block" title={r.answer}>Ans: {r.answer}</span>
                                          ) : (
                                              <span className="text-xs text-muted-foreground">-</span>
                                          )}
                                      </TableCell>
                                  </TableRow>
                              ))
                          )}
                      </TableBody>
                  </Table>
              </div>
              <div className="p-4 border-t border-border/50 bg-muted/20 shrink-0 flex justify-end">
                  <Button onClick={() => setIsLiveResponsesOpen(false)}>Close Window</Button>
              </div>
          </DialogContent>
      </Dialog>

      {/* Add Student Modal */}
      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Student Manually</DialogTitle>
            <DialogDescription>
              Mark a student as Present for this session manually. Enter their Enrollment Number.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="enrollmentNumber" className="text-right text-xs font-semibold">
                Enrollment Number
              </Label>
              <Input
                id="enrollmentNumber"
                value={enrollmentNumberToAdd}
                onChange={(e) => setEnrollmentNumberToAdd(e.target.value)}
                className="col-span-3 uppercase"
                placeholder="e.g. 0801CS201001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStudentOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStudentToHistory} disabled={!enrollmentNumberToAdd}>Mark Present</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot be undone and will delete all related student attendance records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSessionToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSession}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkTextOpen} onOpenChange={setIsBulkTextOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Approve via Text</DialogTitle>
            <DialogDescription>
              Paste text containing enrollment numbers. The AI will extract the enrollment numbers and mark them as Present. Students who submitted requests but are not found will be marked as Rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full min-h-[150px] p-3 text-sm rounded-md border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-none"
              placeholder="Paste text here... (e.g. 0801CS221001 0801CS221002)"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkTextOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkTextApprove} disabled={!bulkText || isBulkLoading}>
              {isBulkLoading ? 'Processing...' : 'Bulk Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="bg-muted/30 px-6 py-4 border-b border-border/50 shrink-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" /> Review Attendance Actions
            </DialogTitle>
            <DialogDescription className="mt-1">
              Please review the matched and unmatched pending requests before applying changes to the database.
            </DialogDescription>
          </div>
          
          <div className="overflow-y-auto p-6 space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> APPROVED STUDENTS ({reviewData?.matched?.length || 0})
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-emerald-500/5">
                    <TableRow>
                      <TableHead>Profile</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Enrollment No</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewData?.matched?.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No matches found</TableCell></TableRow>
                    ) : (
                      reviewData?.matched?.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell><img src={r.avatar} alt="avatar" className="w-8 h-8 rounded-full border border-border" /></TableCell>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">{r.enrollmentNumber}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> REJECTED STUDENTS ({reviewData?.unmatched?.length || 0})
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-rose-500/5">
                    <TableRow>
                      <TableHead>Profile</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Enrollment No</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewData?.unmatched?.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No unmatched pending students</TableCell></TableRow>
                    ) : (
                      reviewData?.unmatched?.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell><img src={r.avatar} alt="avatar" className="w-8 h-8 rounded-full border border-border" /></TableCell>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">{r.enrollmentNumber}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border/50 bg-muted/20 shrink-0 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmReview} disabled={isBulkLoading}>
              {isBulkLoading ? 'Applying...' : 'Confirm & Apply'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};


const StudentAttendancePanel = ({ workspaceContext }: { workspaceContext: any }) => {
  // const [classStudents, setClassStudents] = useState<any[]>([]);
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<any>(null);

  // const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'main'|'history'>('main');
  const [submitted, setSubmitted] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<string>(''); // To track PRESENT, PENDING, etc.
  const [code, setCode] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // To hold history data
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        const sessions = await attendanceService.getActiveSessionsForClass(workspaceContext.id);
        if (sessions.length > 0) {
          setActiveSession(sessions[0]);
          // Check if already submitted by fetching student history (or ideally backend should return this)
          // Since we don't have a direct endpoint for "check if marked", we can fetch history and check
          fetchHistoryData(sessions[0].id);
        } else {
          fetchHistoryData();
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchActiveSession();
    const interval = setInterval(fetchActiveSession, 5000);
    return () => clearInterval(interval);
  }, [workspaceContext.id]);

  const fetchHistoryData = async (activeSessionId?: string) => {
    setIsLoadingHistory(true);
    try {
      if (user?.id) {
        const historyData = await attendanceService.getStudentAttendanceHistory(user.id);
        
        // Filter for this classSubject
        const classSubjectId = workspaceContext.id;
        const records = historyData.filter(r => r.classSubjectId === classSubjectId);
        
        setHistoryRecords(records);
        
        if (activeSessionId) {
          const alreadyMarked = records.find(r => r.sessionId === activeSessionId);
          if (alreadyMarked) {
            setSubmitted(true);
            setSubmittedStatus(alreadyMarked.status);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    let submissionCode = code;
    if (activeSession?.isSystemGenerated) {
        submissionCode = activeSession.code;
    } else {
        if (!code) {
          setError('Attendance code is required.');
          return;
        }
        if (!uniqueCode) {
          setError('Unique code is required.');
          return;
        }
    }
    
    setIsSubmitting(true);
    try {
      await attendanceService.markAttendance({
        sessionId: activeSession.id,
        attendanceCode: submissionCode,
        uniqueCode: uniqueCode ? parseInt(uniqueCode) : undefined,
        verificationAnswer: answer
      });
      setSubmitted(true);
      setSubmittedStatus(activeSession?.isSystemGenerated ? 'PENDING' : 'PRESENT');
      toast.success(activeSession?.isSystemGenerated ? 'Request sent successfully' : 'Attendance marked successfully');
      fetchHistoryData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to mark attendance. Check your code or network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // classInfo not used here

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="flex justify-between items-center bg-card p-5 rounded-xl border border-border/50 shadow-sm">
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" /> Attendance
          </h3>
          <p className="text-sm text-muted-foreground">Mark your attendance for {workspaceContext.subjectName}.</p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
          <Button variant={viewMode === 'main' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('main')} className="flex-1">Live Attendance</Button>
          <Button variant={viewMode === 'history' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('history')} className="flex-1">History</Button>
        </div>
      </div>

      {viewMode === 'history' ? (
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10 pb-4 border-b border-border/50">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Attendance History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingHistory ? (
              <div className="p-8 text-center text-muted-foreground">Loading history...</div>
            ) : historyRecords.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No attendance records found for this subject.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase">Date & Time</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase">Topic</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRecords.map((record: any, i: number) => (
                      <TableRow key={i} className="hover:bg-muted/10">
                        <TableCell>
                          <div className="font-medium">{record.date}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{record.topic || record.type || 'Lecture'}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`
                            ${record.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : ''}
                            ${record.status === 'ABSENT' ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' : ''}
                            ${record.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : ''}
                          `}>
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : !activeSession ? (
        <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border/50">
          <p className="text-muted-foreground font-medium">No active attendance session at the moment.</p>
        </div>
      ) : (
        <Card className={`border-primary/50 shadow-lg overflow-hidden relative max-w-3xl mx-auto ${activeSession.isSystemGenerated ? 'border-amber-500/50' : ''}`}>
          {activeSession.status === 'Active' && !submitted && (
            <div className={`absolute top-0 left-0 w-full h-1 animate-pulse ${activeSession.isSystemGenerated ? 'bg-amber-500' : 'bg-primary'}`} />
          )}
          <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">{activeSession.topic}</CardTitle>
                <CardDescription className="text-base mt-1.5 flex flex-col gap-2">
                  <div className="flex items-center gap-3 font-semibold text-foreground">
                    <span>{workspaceContext.subjectName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 text-muted-foreground font-medium"><Users className="w-4 h-4" /> {activeSession.facultyName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {activeSession.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {activeSession.time} ({activeSession.duration}m)</span>
                  </div>
                </CardDescription>
              </div>
              <Badge variant={submitted ? 'outline' : 'default'} className={`text-sm px-3 py-1 ${submitted ? (submittedStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30') : (activeSession.isSystemGenerated ? 'bg-amber-500 hover:bg-amber-600' : '')}`}>
                {submitted ? (
                  <span className="flex items-center gap-2">
                    {submittedStatus === 'PENDING' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {submittedStatus === 'PENDING' ? 'Pending Approval' : 'Marked Present'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Live</span>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {submitted ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${submittedStatus === 'PENDING' ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                  {submittedStatus === 'PENDING' ? <Clock className="w-8 h-8 text-amber-600" /> : <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {submittedStatus === 'PENDING' ? 'Request Sent Successfully!' : 'Attendance Marked Successfully!'}
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    {submittedStatus === 'PENDING' ? 'Your attendance request is pending faculty approval.' : 'Your presence has been recorded for this session.'}
                  </p>
                </div>
                <div className="bg-muted/30 p-5 rounded-lg border border-border/50 mt-4 flex flex-col gap-2.5 text-sm w-full max-w-md text-left shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">Student Name:</span>
                    <span className="font-bold text-foreground">{user?.firstName} {user?.lastName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">Enrollment No:</span>
                    <span className="font-mono font-semibold">{user?.enrollmentNo || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">Subject Name:</span>
                    <span className="font-semibold">{workspaceContext.subjectName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">Faculty Name:</span>
                    <span className="font-semibold">{activeSession.facultyName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">Lecture Topic:</span>
                    <span className="font-semibold">{activeSession.topic || activeSession.type}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">Attendance Date:</span>
                    <span className="font-semibold">{activeSession.date}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">Session Time:</span>
                    <span className="font-semibold">{activeSession.startTime} - {activeSession.endTime}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">Attendance Status:</span>
                    <span className="font-semibold">
                      {submittedStatus === 'PENDING' ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">Pending</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Present</Badge>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Submission Time:</span>
                    <span className="font-mono font-semibold">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-card p-5 rounded-xl border border-border/50 shadow-sm space-y-4">
                  {activeSession.isSystemGenerated && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 text-amber-700 dark:text-amber-400">
                      <p className="font-semibold text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Faculty Request</p>
                      <p className="text-xs mt-1">This is an attendance request due to faculty absence/missed class. Submitting this will mark your attendance as pending until faculty approves.</p>
                    </div>
                  )}
                  
                  {!activeSession.isSystemGenerated && (
                    <div className="space-y-2">
                      <Label className="font-semibold text-foreground">Attendance Code <span className="text-destructive">*</span></Label>
                      <Input 
                        placeholder="Enter the code shared by faculty" 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="font-mono tracking-widest text-lg shadow-sm"
                        maxLength={6}
                      />
                    </div>
                  )}
                  
                  {!activeSession.isSystemGenerated && (
                    <div className="space-y-2">
                      <Label className="font-semibold text-foreground">Your Unique Code (1 to {activeSession.uniqueCodeCount}) <span className="text-destructive">*</span></Label>
                      <Input 
                        placeholder="Enter your assigned unique code"
                        type="number" 
                        value={uniqueCode}
                        onChange={(e) => setUniqueCode(e.target.value)}
                        className="font-mono text-lg shadow-sm"
                      />
                    </div>
                  )}
                </div>

                {!activeSession.isSystemGenerated && activeSession.verificationQuestion && (
                  <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Verification Question</p>
                      <p className="text-lg font-medium text-foreground">{activeSession.verificationQuestion}</p>
                    </div>
                    <div className="space-y-2 pt-2">
                      <Label className="font-semibold text-foreground">Your Answer <span className="text-destructive">*</span></Label>
                      <Input 
                        placeholder="Enter your answer" 
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="shadow-sm bg-background"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-600 text-sm font-medium flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          {!submitted && (
            <CardFooter className="bg-muted/20 border-t border-border/50 py-4">
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || (!activeSession.isSystemGenerated && !code) || (!activeSession.isSystemGenerated && (!uniqueCode || (!!activeSession.requireVerification && !answer)))} 
                className={`w-full shadow-sm ${activeSession.isSystemGenerated ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                size="lg"
              >
                {isSubmitting ? 'Submitting...' : activeSession.isSystemGenerated ? 'Mark Request' : 'Submit Attendance'}
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
};

export const SubjectAttendancePanel = ({ workspaceContext }: { workspaceContext: any }) => {
  const { role } = useAuth();

  if (role === 'student') {
    return <StudentAttendancePanel workspaceContext={workspaceContext} />;
  }

  return <FacultyAttendancePanel workspaceContext={workspaceContext} />;
};
