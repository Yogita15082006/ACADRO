import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Upload, Plus, Search, Filter, 
  Calendar, CheckCircle2, AlertCircle, 
  Download, X, File, FileCode, Archive, 
  BarChart3, TrendingUp, AlertTriangle, ChevronRight, Activity,
  Eye, ZoomIn, ZoomOut, Maximize, Printer, ExternalLink,
  FileArchive, Edit2, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { mockData } from '../data/mockData';
import api from '../services/api';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define types
type Assignment = any;
type Submission = any;

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function AssignmentModule({ workspaceContext }: { workspaceContext?: any }) {
  const { role } = useAuth();
  
  const [assignments, setAssignments] = useState<Assignment[]>(mockData.assignments);
  const [submissions, setSubmissions] = useState<Submission[]>(mockData.assignmentSubmissions);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const targetUrl = workspaceContext?.subjectId ? `/v1/assignments/subject/${workspaceContext.id}` : `/v1/assignments/all`;
        const res = await api.get(targetUrl);
        if (res?.data?.data && Array.isArray(res.data.data)) {
          setAssignments(res.data.data);
        }
        
        const subUrl = workspaceContext?.subjectId ? `/v1/assignments/subject/${workspaceContext.id}/my-submissions` : `/v1/assignments/subject/00000000-0000-0000-0000-000000000000/my-submissions`;
        const subRes = await api.get(subUrl);
        if (subRes?.data?.data && Array.isArray(subRes.data.data)) {
          setSubmissions(subRes.data.data);
        }
      } catch (e) {
        console.error("Error loading real dynamic assignments:", e);
      }
    };
    fetchRealData();
  }, [workspaceContext]);

  if (['faculty', 'hod', 'coordinator', 'both'].includes(role)) {
    return <AdminAssignmentDashboard assignments={assignments} setAssignments={setAssignments} submissions={submissions} setSubmissions={setSubmissions} workspaceContext={workspaceContext} />;
  }
  
  return <StudentAssignmentDashboard assignments={assignments} submissions={submissions} setSubmissions={setSubmissions} workspaceContext={workspaceContext} />;
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================
function AdminAssignmentDashboard({ assignments, setAssignments, submissions, setSubmissions, workspaceContext }: { assignments: Assignment[], setAssignments: any, submissions: Submission[], setSubmissions?: any, workspaceContext?: any }) {
  const { classes, students } = mockData;
  const [activeClassId, setActiveClassId] = useState(workspaceContext?.classId || classes[0].id);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewSubmissionsAssignment, setViewSubmissionsAssignment] = useState<Assignment | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const handleDeleteAssignment = async (id: string) => {
    try {
      await api.delete(`/v1/assignments/${id}`);
      setAssignments((prev: any[]) => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error("Error deleting assignment:", e);
      setAssignments((prev: any[]) => prev.filter(a => a.id !== id));
    }
  };

  const stats = useMemo(() => {
    const classAssignments = workspaceContext ? assignments : assignments.filter(a => a.classId === activeClassId || !a.classId || a.className === 'All Classes');
    const active = classAssignments.filter(a => a.status === 'Open' || a.status === 'Upcoming').length;
    const completed = classAssignments.filter(a => a.status === 'Expired' || a.status === 'Graded').length;
    
    return {
      total: classAssignments.length,
      active,
      completed,
      upcomingDeadlines: classAssignments.filter(a => a.status === 'Open' && new Date(a.deadline) > new Date()).length
    };
  }, [assignments, activeClassId, workspaceContext]);

  const submissionStats = useMemo(() => {
    const classAssignments = workspaceContext ? assignments : assignments.filter(a => a.classId === activeClassId || !a.classId || a.className === 'All Classes');
    const classStudents = students.filter(s => s.classId === activeClassId || !activeClassId);
    const classSubmissions = submissions.filter(s => classAssignments.some(a => a.id === s.assignmentId));

    const totalStudents = classStudents.length;
    const submitted = classSubmissions.filter(s => s.status === 'Submitted' || s.status === 'Graded' || s.status === 'Reviewed' || s.status === 'Reviewed & Graded' || s.marksAwarded != null || s.marks != null || s.evaluatedAt != null).length;
    const graded = classSubmissions.filter(s => s.status === 'Graded' || s.status === 'Reviewed' || s.status === 'Reviewed & Graded' || s.marksAwarded != null || s.marks != null || s.evaluatedAt != null).length;
    const late = classSubmissions.filter(s => s.status === 'Late Submitted').length;
    const totalExpected = totalStudents * classAssignments.length;
    
    return {
      totalStudents,
      submitted,
      late,
      graded,
      pending: Math.max(0, totalExpected - submitted - late),
      pendingReviews: Math.max(0, (submitted + late) - graded)
    };
  }, [submissions, students, assignments, activeClassId, workspaceContext]);

  const activeAssignments = useMemo(() => workspaceContext ? assignments : assignments.filter(a => a.classId === activeClassId || !a.classId || a.className === 'All Classes'), [assignments, activeClassId, workspaceContext]);

  return (
    <motion.div 
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Assignment Management</h1>
          <p className="text-slate-500 mt-1">Create, manage, and analyze student assignments.</p>
        </div>
        <div className="flex items-center gap-3 relative z-20 w-full md:w-auto">
        {!workspaceContext && (
        <div className="relative">
          <select 
            value={activeClassId} 
            onChange={e => setActiveClassId(e.target.value)}
            className="appearance-none px-4 py-2 pr-10 h-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/50 outline-none shadow-sm cursor-pointer hover:border-indigo-400:border-indigo-600 transition-all w-full sm:w-64"
          >
            {classes.map(cls => (
              <option key={cls.id} value={cls.id} className="font-medium text-slate-700 bg-white">{cls.year} - {cls.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
        )}
        <Button onClick={() => setShowCreateModal(true)} className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 cursor-pointer rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </Button>
        </div>
      </div>

      {/* Tabs */}
      {!workspaceContext && (
        <div className="flex space-x-1 border-b border-slate-200">
          {['overview', 'assignments', 'ai-analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab 
                  ? 'text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-900:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {workspaceContext ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CompactAssignmentStatsBanner stats={stats} submissionStats={submissionStats} />
          <AdminAssignmentList assignments={activeAssignments} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onViewSubmissions={setViewSubmissionsAssignment} onEdit={setEditingAssignment} onDelete={handleDeleteAssignment} />
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <AdminOverview stats={stats} submissionStats={submissionStats} />}
            {activeTab === 'assignments' && <AdminAssignmentList assignments={activeAssignments} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onViewSubmissions={setViewSubmissionsAssignment} onEdit={setEditingAssignment} onDelete={handleDeleteAssignment} />}
            {activeTab === 'ai-analytics' && <AdminAIAnalytics activeClassId={activeClassId} submissions={submissions} assignments={assignments} />}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Create Modal */}
      {showCreateModal && <CreateAssignmentModal 
        onClose={() => setShowCreateModal(false)} 
        onSuccess={(data) => {
          setAssignments([data, ...assignments]);
          setShowCreateModal(false);
        }}
        activeClassId={activeClassId}
        workspaceContext={workspaceContext}
      />}

      {/* Edit Modal */}
      {editingAssignment && (
        <EditAssignmentModal
          assignment={editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onUpdate={(updated: any) => {
            setAssignments((prev: any[]) => prev.map(a => a.id === updated.id ? updated : a));
          }}
        />
      )}

      {/* Submissions Modal */}
      <AnimatePresence>
        {viewSubmissionsAssignment && (
          <AdminSubmissionsModal 
            assignment={viewSubmissionsAssignment} 
            submissions={submissions}
            onSubmissionsLoaded={(loadedSubs: any[]) => {
              if (setSubmissions && Array.isArray(loadedSubs)) {
                setSubmissions((prev: any[]) => {
                  const map = new Map();
                  prev.forEach(s => map.set(s.id || `${s.assignmentId}-${s.studentId}`, s));
                  loadedSubs.forEach(s => map.set(s.id || `${s.assignmentId}-${s.studentId}`, s));
                  return Array.from(map.values());
                });
              }
            }}
            onSubmissionUpdated={(updatedSub: any) => {
              if (setSubmissions) {
                setSubmissions((prev: any[]) => {
                  const idx = prev.findIndex(s => s.id === updatedSub.id || (s.assignmentId === updatedSub.assignmentId && s.studentId === updatedSub.studentId));
                  const newStatus = updatedSub.status || (updatedSub.marksAwarded != null || updatedSub.marks != null || updatedSub.grade != null ? 'Reviewed' : 'Submitted');
                  if (idx !== -1) {
                    const copy = [...prev];
                    copy[idx] = { ...copy[idx], ...updatedSub, status: newStatus };
                    return copy;
                  }
                  return [...prev, { ...updatedSub, status: newStatus }];
                });
              }
            }}
            onClose={() => setViewSubmissionsAssignment(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CompactAssignmentStatsBanner({ stats, submissionStats }: { stats: any, submissionStats: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="border-none shadow-sm bg-indigo-50/50">
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Assignments</p>
          <h3 className="text-2xl font-bold text-indigo-700">{stats.total}</h3>
        </CardContent>
      </Card>
      <Card className="border-none shadow-sm bg-emerald-50/50">
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Assignments</p>
          <h3 className="text-2xl font-bold text-emerald-700">{stats.active}</h3>
        </CardContent>
      </Card>
      <Card className="border-none shadow-sm bg-amber-50/50">
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending Reviews</p>
          <h3 className="text-2xl font-bold text-amber-700">{submissionStats.pendingReviews}</h3>
        </CardContent>
      </Card>
      <Card className="border-none shadow-sm bg-blue-50/50">
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reviewed</p>
          <h3 className="text-2xl font-bold text-blue-700">{submissionStats.graded}</h3>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminOverview({ stats, submissionStats }: { stats: any, submissionStats: any }) {
  const chartData = [
    { name: 'On Time', value: submissionStats.submitted },
    { name: 'Late', value: submissionStats.late },
    { name: 'Pending', value: submissionStats.pending / 10 }, // scaling down for display
  ];

  const trendData = [
    { name: 'Mon', submissions: 12 },
    { name: 'Tue', submissions: 19 },
    { name: 'Wed', submissions: 15 },
    { name: 'Thu', submissions: 22 },
    { name: 'Fri', submissions: 28 },
    { name: 'Sat', submissions: 35 },
    { name: 'Sun', submissions: 42 },
  ];

  const completionData = [
    { name: 'Week 1', rate: 85 },
    { name: 'Week 2', rate: 78 },
    { name: 'Week 3', rate: 92 },
    { name: 'Week 4', rate: 88 },
  ];

  const subjectData = [
    { name: 'Java', assignments: 8 },
    { name: 'DBMS', assignments: 5 },
    { name: 'OS', assignments: 4 },
    { name: 'Python', assignments: 6 },
    { name: 'Web Dev', assignments: 7 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Assignments', value: stats.total, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-100' },
          { label: 'Active Assignments', value: stats.active, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Upcoming Deadlines', value: stats.upcomingDeadlines, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
        ].map((kpi, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Submission Distribution</CardTitle>
            <CardDescription>On-time vs Late vs Pending</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Subject-wise Assignment Count</CardTitle>
            <CardDescription>Assignments distributed across subjects</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={subjectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="assignments" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSubj)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Submission Timeline (Weekly)</CardTitle>
            <CardDescription>Number of submissions over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="submissions" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorSub)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Assignment Completion Rate</CardTitle>
            <CardDescription>Percentage of assignments completed per week</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="rate" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const formatDeadlineDisplay = (isoStr?: string) => {
  if (!isoStr) return 'No Deadline';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return isoStr;
  }
};

export const toLocalInputString = (isoStr?: string) => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr.slice(0, 16);
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().slice(0, 16);
  } catch {
    return isoStr.slice(0, 16);
  }
};

export const toUtcISOString = (localStr?: string) => {
  if (!localStr) return '';
  try {
    const d = new Date(localStr);
    if (isNaN(d.getTime())) return localStr;
    return d.toISOString();
  } catch {
    return localStr;
  }
};

export const resolveApiUrl = (url?: string) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

function EditAssignmentModal({ assignment, onClose, onUpdate }: { assignment: any, onClose: () => void, onUpdate: (updated: any) => void }) {
  const [deadline, setDeadline] = useState(toLocalInputString(assignment.deadline));
  const [lateAllowed, setLateAllowed] = useState(assignment.lateSubmissionAllowed !== false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const utcDeadline = deadline ? toUtcISOString(deadline) : '';
    try {
      const res = await api.put(`/v1/assignments/${assignment.id}`, {
        deadlineStr: utcDeadline,
        lateSubmissionAllowed: lateAllowed
      });
      if (res?.data?.data) {
        onUpdate(res.data.data);
      } else {
        onUpdate({ ...assignment, deadline: utcDeadline, lateSubmissionAllowed: lateAllowed });
      }
    } catch (e) {
      console.error("Error updating assignment:", e);
      onUpdate({ ...assignment, deadline: utcDeadline, lateSubmissionAllowed: lateAllowed });
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-6 border border-slate-100"
      >
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-bold text-lg text-slate-900">Edit Assignment Settings</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <p className="text-xs text-slate-500 font-medium">Notice: Per LMS rules, Faculty can modify only Due Date and Allow Late Submission after creation.</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Due Date & Time</label>
            <input 
              type="datetime-local" 
              value={deadline} 
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-sm font-semibold text-slate-700">Allow Late Submission</span>
            <input 
              type="checkbox" 
              checked={lateAllowed} 
              onChange={(e) => setLateAllowed(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}

function AdminAssignmentList({ assignments, searchQuery, setSearchQuery, onViewSubmissions, onEdit, onDelete }: { assignments: Assignment[], searchQuery: string, setSearchQuery: (s: string) => void, onViewSubmissions: (a: Assignment) => void, onEdit?: (a: Assignment) => void, onDelete?: (id: string) => void }) {
  const { subjects } = mockData;

  const filtered = assignments.filter(a => 
    (a.title && a.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (a.department && a.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (a.subjectName && a.subjectName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search assignments..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto rounded-xl">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filtered.map(assignment => {
          const subject = subjects.find(s => s.id === assignment.subjectId);
          return (
            <motion.div key={assignment.id} variants={itemVariants}>
              <Card className="h-full border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer rounded-2xl bg-white hover:-translate-y-1 flex flex-col justify-between">
                <div>
                  <div className="h-2 w-full bg-gradient-to-r from-indigo-600 to-violet-600" />
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <Badge variant={
                        assignment.status === 'Open' ? 'active' : 
                        assignment.status === 'Upcoming' ? 'event' : 
                        assignment.status === 'Expired' ? 'rejected' : 'default'
                      } className="capitalize px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase">
                        {assignment.status || 'Open'}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/60 shadow-xs">
                        {assignment.academicYear || 'Current Year'} • {assignment.maxMarks || 10} Marks
                      </span>
                    </div>
                    
                    <h3 className="font-extrabold text-xl text-slate-900 mb-3 line-clamp-1 group-hover:text-indigo-600 transition-colors tracking-tight">
                      {assignment.title}
                    </h3>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-sm text-slate-600 font-medium">
                        <FileText className="w-4 h-4 mr-2 text-indigo-500 shrink-0" />
                        <span>{assignment.type || 'Document Assignment'}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600 font-medium">
                        <Calendar className="w-4 h-4 mr-2 text-indigo-500 shrink-0" />
                        <span>Due: <strong className="text-slate-900 ml-1">{formatDeadlineDisplay(assignment.deadline)}</strong></span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="px-6 pb-6 pt-0">
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          const rawUrl = assignment.fileUrl || assignment.attachmentUrl || (assignment.id ? `http://localhost:8080/api/v1/assignments/${assignment.id}/view` : '#');
                          const docUrl = resolveApiUrl(rawUrl).replace('/download', '/view');
                          window.open(docUrl, '_blank', 'noopener,noreferrer'); 
                        }} 
                        className="h-9 px-3 bg-indigo-50/50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 font-semibold"
                        title="View original uploaded assignment"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        View Assignment
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); onViewSubmissions(assignment); }} 
                        className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
                      >
                        View Submissions
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {onEdit && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); onEdit(assignment); }} 
                          className="h-9 px-2.5 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 font-medium" 
                          title="Edit Due Date / Late Setting"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); onDelete(assignment.id); }} 
                          className="h-9 px-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 font-medium" 
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

function AdminAIAnalytics({ activeClassId, submissions, assignments }: { activeClassId: string, submissions: Submission[], assignments: Assignment[] }) {
  const { students } = mockData;
  const classStudents = students.filter(s => s.classId === activeClassId);
  const classAssignments = assignments.filter(a => a.classId === activeClassId);
  const classAssignmentIds = classAssignments.map(a => a.id);
  const classSubmissions = submissions.filter(s => classAssignmentIds.includes(s.assignmentId));

  const studentStats = classStudents.map(student => {
    const studentSubs = classSubmissions.filter(s => s.studentId === student.id);
    const lateCount = studentSubs.filter(s => s.status === 'Late Submitted').length;
    const onTimeCount = studentSubs.filter(s => s.status === 'Submitted' || s.status === 'Graded').length;
    const missingCount = classAssignments.length - studentSubs.length;
    return { ...student, lateCount, onTimeCount, missingCount };
  });

  const topLate = [...studentStats].sort((a, b) => b.lateCount - a.lateCount).filter(s => s.lateCount > 0).slice(0, 5);
  const topMissing = [...studentStats].sort((a, b) => b.missingCount - a.missingCount).filter(s => s.missingCount > 0).slice(0, 5);
  const topOnTime = [...studentStats].sort((a, b) => b.onTimeCount - a.onTimeCount).filter(s => s.onTimeCount > 0).slice(0, 5);

  const aiInsights = [
    "Assignment Analysis: 80% of students submitted the Java assignment late. Consider adjusting future deadlines.",
    "Student STU45 is at risk due to consecutive missed assignments in Web Development.",
    "High performance detected in Data Structures practical assignments. Students are grasping concepts well.",
    "AI Prediction: 5 students in DS-1 might miss the upcoming Operating System deadline based on their past submission history.",
    "Study Recommendation: Provide extra resources for 'SQL Queries' as recent DBMS assignments show a 15% drop in average marks."
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3 border-none shadow-sm bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500 rounded-lg text-white">
                <BarChart3 className="w-5 h-5" />
              </div>
              <CardTitle>AI Generated Insights</CardTitle>
            </div>
            <CardDescription>Automated analysis of student submission patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.map((insight, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-3 p-4 bg-white/60 rounded-xl border border-white/20 shadow-sm backdrop-blur-sm"
              >
                {insight.includes('risk') || insight.includes('dropping') ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Top Late Submitters</CardTitle>
            <CardDescription>Students consistently submitting late</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[300px] overflow-y-auto">
            {topLate.length > 0 ? topLate.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.lateCount} late submissions</p>
                  </div>
                </div>
                <Badge variant="pending">Warning</Badge>
              </div>
            )) : <p className="text-sm text-slate-500">No late submitters found.</p>}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Missing Assignments</CardTitle>
            <CardDescription>Students with most missing assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[300px] overflow-y-auto">
            {topMissing.length > 0 ? topMissing.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.missingCount} missing</p>
                  </div>
                </div>
                <Badge variant="rejected">Critical</Badge>
              </div>
            )) : <p className="text-sm text-slate-500">No missing assignments.</p>}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>On-Time Stars</CardTitle>
            <CardDescription>Students with most on-time submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[300px] overflow-y-auto">
            {topOnTime.length > 0 ? topOnTime.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.onTimeCount} on-time</p>
                  </div>
                </div>
                <Badge variant="active">Star</Badge>
              </div>
            )) : <p className="text-sm text-slate-500">No on-time submitters found.</p>}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function AdminSubmissionsModal({ assignment, submissions, onClose, onSubmissionUpdated, onSubmissionsLoaded }: { assignment: Assignment, submissions: Submission[], onClose: () => void, onSubmissionUpdated?: (sub: any) => void, onSubmissionsLoaded?: (subs: any[]) => void }) {
  const { students, subjects, classes } = mockData;
  const [liveSubs, setLiveSubs] = useState<any[]>(submissions.filter(s => s.assignmentId === assignment.id));
  const [liveStudents, setLiveStudents] = useState<any[]>(students.filter(s => s.classId === assignment.classId || !assignment.classId));

  useEffect(() => {
    const loadRealData = async () => {
      try {
        const [subRes, enrolledRes] = await Promise.all([
          api.get(`/v1/assignments/${assignment.id}/submissions`),
          api.get(`/v1/assignments/${assignment.id}/enrolled-students`)
        ]);
        if (subRes?.data?.data && Array.isArray(subRes.data.data)) {
          setLiveSubs(subRes.data.data);
          if (onSubmissionsLoaded) onSubmissionsLoaded(subRes.data.data);
        }
        if (enrolledRes?.data?.data && Array.isArray(enrolledRes.data.data) && enrolledRes.data.data.length > 0) {
          setLiveStudents(enrolledRes.data.data);
        } else if (subRes?.data?.data && Array.isArray(subRes.data.data)) {
          const realStudentIds = new Set(subRes.data.data.map((s: any) => s.studentId));
          setLiveStudents(prev => {
            const currentIds = new Set(prev.map(p => p.id));
            const extra = subRes.data.data
              .filter((s: any) => s.studentId && !currentIds.has(s.studentId))
              .map((s: any) => ({
                id: s.studentId,
                name: s.studentName || s.name || 'Student',
                enrollmentNumber: s.studentEnrollmentNo || s.enrollmentNumber || 'STU-' + String(s.studentId).slice(0, 4),
                avatar: s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.studentName || 'Student')}`,
                classId: assignment.classId
              }));
            return [...prev, ...extra];
          });
        }
      } catch (e) {
        console.error("Error loading live submissions:", e);
      }
    };
    loadRealData();
  }, [assignment.id]);

  const assignmentSubmissions = liveSubs;
  const eligibleStudents = liveStudents.length > 0 ? liveStudents : students.filter(s => s.classId === assignment.classId || !assignment.classId);

  const subject = subjects.find(s => s.id === assignment.subjectId);
  const cls = classes.find(c => c.id === assignment.classId);

  const studentData = eligibleStudents.map(student => {
    const sub = assignmentSubmissions.find(s => s.studentId === student.id);
    const isReviewed = sub && (sub.status === 'Graded' || sub.status === 'Reviewed' || sub.status === 'Reviewed & Graded' || sub.marksAwarded != null || sub.marks != null || sub.evaluatedAt != null);
    return {
      ...student,
      submission: sub,
      status: sub ? (isReviewed ? 'Reviewed' : sub.status) : 'Pending',
      marks: sub && isReviewed ? (sub.marksAwarded ?? sub.marks ?? null) : null,
      aiSimilarity: sub ? (sub.aiSimilarity || Math.floor(Math.random() * 30) + '%') : '-'
    };
  });

  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Name');
  const [previewSubmission, setPreviewSubmission] = useState<any>(null);

  const now = new Date();
  const deadline = new Date(assignment.deadline);
  const isPastDeadline = now > deadline;

  const gradedSubs = assignmentSubmissions.filter(s => (s.status === 'Graded' || s.status === 'Reviewed' || s.status === 'Reviewed & Graded' || s.marksAwarded != null || s.marks != null || s.evaluatedAt != null) && (s.marksAwarded != null || s.marks != null));
  const totalSubCount = studentData.filter(s => s.status === 'Submitted' || s.status === 'Graded' || s.status === 'Reviewed' || s.status === 'Reviewed & Graded' || s.status === 'Late Submitted' || s.submission != null).length;

  const stats = {
    totalStudents: eligibleStudents.length,
    submitted: studentData.filter(s => s.status === 'Submitted' || s.status === 'Graded' || s.status === 'Reviewed' || s.status === 'Reviewed & Graded' || s.submission != null).length,
    lateSubmitted: studentData.filter(s => s.status === 'Late Submitted').length,
    pending: Math.max(0, eligibleStudents.length - totalSubCount),
    notSubmitted: studentData.filter(s => s.status === 'Pending' && isPastDeadline).length,
    avgMarks: gradedSubs.length > 0 
      ? Math.round(gradedSubs.reduce((acc, curr) => acc + Number(curr.marksAwarded ?? curr.marks ?? 0), 0) / gradedSubs.length) 
      : '-',
    highestMarks: gradedSubs.length > 0
      ? Math.max(...gradedSubs.map(s => Number(s.marksAwarded ?? s.marks ?? 0)))
      : '-',
    lowestMarks: gradedSubs.length > 0
      ? Math.min(...gradedSubs.map(s => Number(s.marksAwarded ?? s.marks ?? 0)))
      : '-'
  };

  const filteredData = studentData.filter(s => {
    if (filterStatus !== 'All' && s.status !== filterStatus) {
      if (filterStatus === 'Not Submitted' && s.status === 'Pending' && isPastDeadline) return true;
      if (filterStatus === 'Pending' && s.status === 'Pending' && !isPastDeadline) return true;
      if (filterStatus === 'Submitted' && (s.status === 'Submitted' || s.status === 'Graded' || s.status === 'Reviewed' || s.status === 'Reviewed & Graded' || s.submission != null)) return true;
      if (filterStatus === 'Late' && s.status === 'Late Submitted') return true;
      return false;
    }
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Name') return a.name.localeCompare(b.name);
    if (sortBy === 'Enrollment Number') return a.enrollmentNumber.localeCompare(b.enrollmentNumber);
    if (sortBy === 'Submission Time') {
      if (!a.submission && !b.submission) return 0;
      if (!a.submission) return 1;
      if (!b.submission) return -1;
      return new Date(b.submission.submitDate).getTime() - new Date(a.submission.submitDate).getTime();
    }
    return 0;
  });

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="w-[95vw] md:w-[90vw] max-w-7xl h-[90vh] bg-slate-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center z-20 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{assignment.title}</h2>
              <Badge variant={isPastDeadline ? 'rejected' : 'active'} className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
                {isPastDeadline ? 'Deadline Passed' : 'Active'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 font-medium">
              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-indigo-500"/> {assignment.subjectName || subject?.name || 'Subject'}</span>
              <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-indigo-500"/> {assignment.className || cls?.name || 'Class/Section'}</span>
              <span>Year: {assignment.academicYear}</span>
              <span>Total Marks: {assignment.maxMarks}</span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <Calendar className="w-4 h-4 text-indigo-500"/> 
                Deadline: <span className="font-semibold">{formatDeadlineDisplay(assignment.deadline)}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="text-right mr-2 hidden sm:block">
              <p className="text-xs text-slate-500 font-medium">Total Students: {stats.totalStudents}</p>
              <p className="text-xs text-slate-500 font-medium">Submitted: {stats.submitted}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900">
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
        
        {/* Summary Panel - Fixed */}
        <div className="bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 md:p-6 pb-4">
            <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.submitted}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.pending}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Late</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.lateSubmitted}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Marks</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.avgMarks}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Highest</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.highestMarks}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-400"></div>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lowest</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.lowestMarks}</h3>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filter Bar - Fixed */}
        <div className="bg-white px-4 md:px-6 py-3 border-b border-slate-200 shrink-0 z-10 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
            <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search Student Name or Roll No..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              <select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full sm:w-48 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Pending">Pending</option>
                <option value="Late">Late</option>
              </select>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-sm font-medium text-slate-500 shrink-0">Sort by:</label>
              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full md:w-48 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="Name">Name</option>
                <option value="Enrollment Number">Enrollment Number</option>
                <option value="Submission Time">Submission Time</option>
              </select>
            </div>
        </div>

        {/* Scrollable Table Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 bg-slate-50">
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Student</th>
                    <th className="px-6 py-4 font-semibold">Submission Time</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Grade</th>
                    <th className="px-6 py-4 font-semibold">Marks Awarded</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length > 0 ? (
                    filteredData.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full border border-slate-200 object-cover" />
                            <div>
                              <p className="font-semibold text-slate-900">{student.name}</p>
                              <p className="text-xs text-slate-500">{student.enrollmentNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {student.submission ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-700">{new Date(student.submission.submitDate).toLocaleDateString()}</span>
                              <span className="text-xs text-slate-500">{new Date(student.submission.submitDate).toLocaleTimeString()}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No Submission</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={
                            student.status === 'Submitted' || student.status === 'Graded' ? 'active' :
                            student.status === 'Late Submitted' ? 'pending' : 
                            student.status === 'Pending' && !isPastDeadline ? 'outline' : 'rejected'
                          } className="capitalize font-medium">
                            {student.status === 'Pending' && isPastDeadline ? 'Not Submitted' : student.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {student.submission ? (
                            (() => {
                              const m = student.marks !== null && student.marks !== undefined ? student.marks : (student.submission ? student.submission.marksAwarded : null);
                              const maxM = assignment.maxMarks || 10;
                              let g = student.submission.grade;
                              if (m !== null && m !== undefined && maxM > 0) {
                                const p = (Number(m) / Number(maxM)) * 100;
                                if (p >= 90) g = 'A+';
                                else if (p >= 80) g = 'A';
                                else if (p >= 70) g = 'B+';
                                else if (p >= 60) g = 'B';
                                else if (p >= 50) g = 'C';
                                else if (p >= 40) g = 'D';
                                else g = 'F';
                              }
                              return g && g !== 'Graded' && g !== 'Reviewed' ? (
                                <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-extrabold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs min-w-[3rem]">
                                  {g}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium text-xs">Pending</span>
                              );
                            })()
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {student.submission ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max={assignment.maxMarks || 10}
                                defaultValue={student.marks !== null ? student.marks : ''}
                                placeholder="-"
                                className="w-16 px-2 py-1 text-center rounded border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 shadow-inner"
                                onBlur={async (e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val !== student.marks && student.submission) {
                                    try {
                                      const res = await api.post(`/v1/assignments/submissions/${student.submission.id}/evaluate`, {
                                        marksAwarded: val,
                                        feedback: student.submission.feedback || "Checked and graded"
                                      });
                                      const updated = res?.data?.data || { ...student.submission, status: 'Reviewed', marks: val, marksAwarded: val, evaluatedAt: new Date().toISOString() };
                                      setLiveSubs(prev => prev.map(s => s.id === student.submission.id ? updated : s));
                                      if (onSubmissionUpdated) onSubmissionUpdated(updated);
                                    } catch (err) {
                                      console.error("Error evaluating submission:", err);
                                      const maxM = assignment.maxMarks || 10;
                                      let g = 'F';
                                      if (maxM > 0) {
                                        const p = (Number(val) / Number(maxM)) * 100;
                                        if (p >= 90) g = 'A+';
                                        else if (p >= 80) g = 'A';
                                        else if (p >= 70) g = 'B+';
                                        else if (p >= 60) g = 'B';
                                        else if (p >= 50) g = 'C';
                                        else if (p >= 40) g = 'D';
                                      }
                                      const updated = { ...student.submission, status: 'Reviewed', marks: val, marksAwarded: val, grade: g, evaluatedAt: new Date().toISOString() };
                                      setLiveSubs(prev => prev.map(s => s.id === student.submission.id ? updated : s));
                                      if (onSubmissionUpdated) onSubmissionUpdated(updated);
                                    }
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') e.currentTarget.blur();
                                }}
                              />
                              <span className="text-slate-400 font-medium">/ {assignment.maxMarks || 10}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {student.submission ? (
                            <div className="flex items-center justify-end">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setPreviewSubmission({ student, assignment, submission: student.submission })}
                                className="h-8 px-3 bg-white hover:bg-indigo-50 border-slate-200 text-indigo-600 font-medium shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                View
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" disabled className="h-8 text-slate-400">No File</Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <Search className="w-8 h-8 text-slate-300 mb-3" />
                          <p className="font-medium text-slate-900">No students found</p>
                          <p className="text-sm">Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Small Preview Modal */}
        <AnimatePresence>
          {previewSubmission && (
            <AssignmentPreviewModal 
              previewData={previewSubmission} 
              onClose={() => setPreviewSubmission(null)} 
            />
          )}
        </AnimatePresence>
        
      </motion.div>
    </div>,
    document.body
  );
}

function AssignmentPreviewModal({ previewData, onClose }: { previewData: any, onClose: () => void }) {
  const { student, assignment, submission } = previewData;
  const { subjects, classes } = mockData;
  
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 25));

  const subject = subjects.find(s => s.id === assignment.subjectId);
  const cls = classes.find(c => c.id === assignment.classId);

  // Determine file type icon and support
  const fileName = submission.attachments?.[0]?.name || `${student.enrollmentNumber}_${assignment.title.replace(/\s+/g, '_')}.pdf`;
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  const fileSize = submission.attachments?.[0]?.size || '2.4 MB';
  
  // A generic fallback for preview URL if it's pointing to example.com
  const rawFileUrl = resolveApiUrl(submission.fileUrl || assignment.attachmentUrl);
  const viewUrl = submission.id ? `http://localhost:8080/api/v1/assignments/submissions/${submission.id}/view` : (rawFileUrl?.includes('example.com') ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' : rawFileUrl);
  const downloadUrl = submission.id ? `http://localhost:8080/api/v1/assignments/submissions/${submission.id}/download` : (rawFileUrl?.includes('example.com') ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' : rawFileUrl);

  const isPreviewable = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'png', 'jpg', 'jpeg', 'zip', 'js', 'py', 'java', 'cpp', 'html', 'css'].includes(fileExtension || '');

  return createPortal(
    <div className={`fixed inset-0 z-[110] flex flex-col bg-slate-900/95 backdrop-blur-xl transition-all`}>
      {/* Toolbar */}
      <div className="h-16 border-b border-slate-700 bg-slate-900 flex items-center justify-between px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-slate-200 font-semibold text-sm truncate max-w-[200px] sm:max-w-md">{fileName}</h3>
            <p className="text-slate-400 text-xs mt-0.5">{fileSize} • {fileExtension?.toUpperCase()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {isPreviewable && (
            <div className="hidden sm:flex items-center gap-1 mr-4 border-r border-slate-700 pr-4">
              <button onClick={handleZoomOut} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-slate-300 text-xs font-medium w-12 text-center">{zoomLevel}%</span>
              <button onClick={handleZoomIn} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
              <button onClick={() => setIsFullscreen(!isFullscreen)} className={`p-2 hover:bg-slate-800 rounded-lg transition-colors ml-2 ${isFullscreen ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`} title="Toggle Full Screen"><Maximize className="w-4 h-4" /></button>
            </div>
          )}
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Print" onClick={() => window.open(viewUrl, '_blank', 'noopener,noreferrer')}><Printer className="w-4 h-4" /></button>
          <a href={viewUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:block" title="Open in New Tab"><ExternalLink className="w-4 h-4" /></a>
          <a href={downloadUrl} download className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 rounded-lg transition-colors ml-2" title="Download"><Download className="w-4 h-4" /></a>
          <div className="w-px h-6 bg-slate-700 mx-1 sm:mx-2"></div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Close Preview"><X className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Info */}
        {!isFullscreen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-slate-900 border-r border-slate-700 flex flex-col shrink-0 hidden md:flex"
          >
            <div className="p-6 border-b border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Student Details</h4>
              <div className="flex items-center gap-3">
                <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full ring-2 ring-slate-800" />
                <div>
                  <p className="text-slate-200 font-medium">{student.name}</p>
                  <p className="text-slate-400 text-xs">{student.enrollmentNumber}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-b border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assignment Info</h4>
              <div>
                <p className="text-slate-400 text-xs">Title</p>
                <p className="text-slate-200 text-sm font-medium mt-0.5">{assignment.title}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Subject & Class</p>
                <p className="text-slate-200 text-sm font-medium mt-0.5">{assignment.subjectName || subject?.name || 'Subject'} • {assignment.className || cls?.name || 'Class/Section'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Department & Semester</p>
                <p className="text-slate-200 text-sm font-medium mt-0.5">{assignment.department || 'GEN'} • {assignment.semester || 'Active Term'}</p>
              </div>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Submission Details</h4>
              <div>
                <p className="text-slate-400 text-xs">Submitted At</p>
                <p className="text-slate-200 text-sm font-medium mt-0.5">
                  {new Date(submission.submitDate).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Status</p>
                <div className="mt-1.5">
                  <Badge variant={submission.status === 'Late Submitted' ? 'pending' : 'active'} className="bg-slate-800 text-emerald-400 border-emerald-400/20">
                    {submission.status}
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Preview Area */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
          {isPreviewable ? (
            <div className={`w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col transition-all ${isFullscreen ? 'max-w-none' : 'max-w-5xl'}`}>
               <div className="flex-1 w-full bg-slate-100 flex items-center justify-center overflow-auto relative p-8">
                  <div 
                    className="transition-transform duration-200 ease-out flex items-center justify-center w-full h-full"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
                  >
                    {fileExtension === 'pdf' && (
                      <iframe src={`${viewUrl}#toolbar=0&navpanes=0`} className="w-full h-full min-h-[800px] bg-white shadow-sm" title="PDF Preview" />
                    )}
                    {['png', 'jpg', 'jpeg'].includes(fileExtension || '') && (
                      <img src={viewUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded shadow-sm" />
                    )}
                    {['js', 'py', 'java', 'cpp', 'html', 'css'].includes(fileExtension || '') && (
                      <div className="w-full h-full min-h-[800px] bg-slate-900 p-8 rounded-lg shadow-sm text-slate-300 font-mono text-sm overflow-auto text-left whitespace-pre">
                        <span className="text-slate-500 block mb-4">/* Preview of {fileName} */</span>
                        <span className="text-pink-400">function</span> <span className="text-blue-400">calculateTotal</span>() {'{\n'}
                        {'  '}// Source code preview mock{'\n'}
                        {'  '}<span className="text-pink-400">return</span> <span className="text-orange-400">42</span>;{'\n'}
                        {'}'}
                      </div>
                    )}
                    {['doc', 'docx', 'ppt', 'pptx', 'txt', 'zip'].includes(fileExtension || '') && (
                      <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center shadow-inner">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-indigo-100">
                          {fileExtension?.includes('doc') ? <FileText className="w-10 h-10" /> : fileExtension?.includes('ppt') ? <Activity className="w-10 h-10" /> : <FileCode className="w-10 h-10" />}
                        </div>
                        <h4 className="text-xl font-extrabold text-slate-900 mb-2">{fileName}</h4>
                        <p className="text-sm font-medium text-slate-500 mb-6 max-w-md">
                          This file format ({fileExtension?.toUpperCase()}) is stored securely in your campus repository and ready for instant viewing or download.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <a 
                            href={viewUrl} 
                            target="_blank" 
                            rel="noopener,noreferrer" 
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" /> Open in New Tab / View
                          </a>
                          <a 
                            href={downloadUrl} 
                            download 
                            className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-xl shadow-sm transition-all flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Download File
                          </a>
                          <button 
                            onClick={() => window.open(viewUrl, '_blank', 'noopener,noreferrer')} 
                            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all flex items-center gap-2"
                          >
                            <Printer className="w-4 h-4" /> Print
                          </button>
                        </div>
                      </div>
                    )}
                    {fileExtension === 'zip' && (
                      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden self-start mt-10">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                          <FileArchive className="w-5 h-5 text-indigo-500" />
                          <span className="font-semibold text-slate-800">Archive Contents</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {['src/index.js', 'src/styles.css', 'package.json', 'README.md'].map((file, i) => (
                            <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <FileCode className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-600">{file}</span>
                              </div>
                              <span className="text-xs text-slate-400">{(Math.random() * 50 + 2).toFixed(1)} KB</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center max-w-md text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <File className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Preview Not Available</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                This file type cannot be previewed directly in the browser. Please download the file to view its contents.
              </p>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20" asChild>
                <a href={downloadUrl} download>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subjectId: z.string().optional(),
  academicYear: z.string().optional(),
  semester: z.string().optional(),
  department: z.string().optional(),
  classId: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  deadline: z.string().min(1, "Deadline is required"),
  description: z.string().min(1, "Description is required"),
  instructions: z.string().min(1, "Instructions are required"),
  gradingCriteria: z.string().optional(),
  maxMarks: z.coerce.number().min(1, "Max marks must be > 0"),
  maxUploadSize: z.string().min(1, "Max upload size is required"),
  allowedFileTypes: z.string().min(1, "Allowed file types are required"),
  lateSubmissionAllowed: z.boolean().default(false),
  penaltyForLateSubmission: z.coerce.number().min(0, "Penalty must be >= 0").optional()
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

function CreateAssignmentModal({ onClose, onSuccess, activeClassId, workspaceContext }: { onClose: () => void, onSuccess: (data: any) => void, activeClassId: string, workspaceContext?: { classId: string, className: string, subjectId: string, year: string, semester: string } }) {
  const { subjects, classes } = mockData;
  const [file, setFile] = useState<File | null>(null);
  const [targetClasses, setTargetClasses] = useState<string[]>([]);

  const activeClass = classes.find(c => c.id === activeClassId);
  const defaultDepartment = workspaceContext ? (workspaceContext.className.includes('IT') ? 'IT' : 'DS') : (activeClass?.name.includes('IT') ? 'IT' : 'DS');
  const defaultAcademicYear = workspaceContext?.year || activeClass?.year || 'Second Year';

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema) as any,
    defaultValues: {
      lateSubmissionAllowed: false,
      penaltyForLateSubmission: 0,
      maxUploadSize: '10 MB',
      maxMarks: 10,
      allowedFileTypes: 'PDF, DOCX, ZIP',
      academicYear: defaultAcademicYear,
      semester: workspaceContext?.semester || '',
      department: defaultDepartment,
      subjectId: workspaceContext?.subjectId || '',
      type: 'PDF Assignment'
    }
  });

  const selectedYear = watch('academicYear');
  const selectedDept = watch('department');
  const isLateSubmissionAllowed = watch('lateSubmissionAllowed');
  
  const availableClasses = classes.filter(c => c.year === selectedYear && c.name.includes(selectedDept || ''));

  const toggleClass = (className: string) => {
    setTargetClasses(prev => 
      prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]
    );
  };

  const selectAllClasses = () => {
    if (targetClasses.length === availableClasses.length) {
      setTargetClasses([]);
    } else {
      setTargetClasses(availableClasses.map(c => c.name));
    }
  };

  const onSubmit = async (data: AssignmentFormValues) => {
    try {
      const targetId = workspaceContext?.subjectId || data.subjectId || '00000000-0000-0000-0000-000000000000';
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.instructions) formData.append('instructions', data.instructions);
      if (data.gradingCriteria) formData.append('gradingCriteria', data.gradingCriteria);
      if (data.allowedFileTypes) formData.append('allowedFileTypes', data.allowedFileTypes);
      if (data.maxUploadSize) formData.append('maxUploadSize', data.maxUploadSize);
      if (data.type) formData.append('type', data.type);
      formData.append('lateSubmissionAllowed', String(!!data.lateSubmissionAllowed));
      formData.append('penaltyForLateSubmission', String(data.penaltyForLateSubmission || 0));
      formData.append('maxMarks', String(data.maxMarks || 10));
      formData.append('deadlineStr', toUtcISOString(String(data.deadline)));

      const res = await api.post(`/v1/assignments/subject/${targetId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res?.data?.data) {
        onSuccess(res.data.data);
      } else {
        const newAssignment = {
          id: `a-${Date.now()}`,
          ...data,
          targetClasses: workspaceContext ? [workspaceContext.className] : targetClasses,
          classId: workspaceContext ? workspaceContext.classId : (availableClasses[0]?.id || activeClassId),
          status: 'Open',
          attachmentUrl: file ? URL.createObjectURL(file) : undefined,
          createdAt: new Date().toISOString()
        };
        onSuccess(newAssignment);
      }
    } catch (e) {
      console.error("Error submitting real assignment to database:", e);
      const newAssignment = {
        id: `a-${Date.now()}`,
        ...data,
        targetClasses: workspaceContext ? [workspaceContext.className] : targetClasses,
        classId: workspaceContext ? workspaceContext.classId : (availableClasses[0]?.id || activeClassId),
        status: 'Open',
        attachmentUrl: file ? URL.createObjectURL(file) : undefined,
        createdAt: new Date().toISOString()
      };
      onSuccess(newAssignment);
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 border-b border-slate-100 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-slate-900">Create New Assignment</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Assignment Title *</label>
                <input {...register('title')} type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Data Structures Practical Record" />
                {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
              </div>
              
              {!workspaceContext && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Subject *</label>
                    <select {...register('subjectId')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    {errors.subjectId && <p className="text-xs text-rose-500">{errors.subjectId.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Academic Year *</label>
                    <select {...register('academicYear')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">Select Year</option>
                      <option value="Second Year">2nd Year</option>
                      <option value="Third Year">3rd Year</option>
                      <option value="Fourth Year">4th Year</option>
                    </select>
                    {errors.academicYear && <p className="text-xs text-rose-500">{errors.academicYear.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Semester *</label>
                    <select {...register('semester')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">Select Semester</option>
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
                    <label className="text-sm font-medium text-slate-700">Department *</label>
                    <select {...register('department')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">Select Department</option>
                      <option value="IT">Information Technology (IT)</option>
                      <option value="DS">Data Science (DS)</option>
                    </select>
                    {errors.department && <p className="text-xs text-rose-500">{errors.department.message}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">Target Classes *</label>
                      {availableClasses.length > 0 && (
                        <button type="button" onClick={selectAllClasses} className="text-xs font-semibold text-indigo-600 hover:underline">
                          {targetClasses.length === availableClasses.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>
                    {availableClasses.length === 0 ? (
                      <p className="text-sm text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-100">
                        Select Academic Year and Department to view available classes.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {availableClasses.map(cls => (
                          <label 
                            key={cls.id} 
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                              targetClasses.includes(cls.name) 
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                                : 'border-slate-200 bg-white hover:border-indigo-200 text-slate-700'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={targetClasses.includes(cls.name)} 
                              onChange={() => toggleClass(cls.name)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            {cls.name}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Submission Type *</label>
                <select {...register('type')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="PDF Assignment">PDF Assignment</option>
                  <option value="Document Assignment">Document Assignment</option>
                  <option value="ZIP/File Submission">ZIP/File Submission</option>
                  <option value="Online Assignment">Online Assignment</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Submission Deadline *</label>
                <input {...register('deadline')} type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                {errors.deadline && <p className="text-xs text-rose-500">{errors.deadline.message}</p>}
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Description *</label>
                <textarea {...register('description')} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Provide assignment description..." />
                {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Instructions *</label>
                <textarea {...register('instructions')} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="1. Submit before deadline&#10;2. Use standard naming convention..." />
                {errors.instructions && <p className="text-xs text-rose-500">{errors.instructions.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Grading Criteria</label>
                <textarea {...register('gradingCriteria')} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Provide grading criteria..." />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Maximum Marks *</label>
                <input {...register('maxMarks')} type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="10" />
                {errors.maxMarks && <p className="text-xs text-rose-500">{errors.maxMarks.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Allowed File Types *</label>
                <input {...register('allowedFileTypes')} type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. PDF, DOCX, ZIP" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Max Upload Size *</label>
                <select {...register('maxUploadSize')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="5 MB">5 MB</option>
                  <option value="10 MB">10 MB</option>
                  <option value="25 MB">25 MB</option>
                  <option value="50 MB">50 MB</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center h-full pt-6">
                  <input {...register('lateSubmissionAllowed')} type="checkbox" className="mr-2 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  Allow Late Submission
                </label>
              </div>
              
              {isLateSubmissionAllowed && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Penalty for Late Submission (%) *</label>
                  <input {...register('penaltyForLateSubmission')} type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 10" />
                  {errors.penaltyForLateSubmission && <p className="text-xs text-rose-500">{errors.penaltyForLateSubmission.message}</p>}
                </div>
              )}
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Attachment Upload</label>
                <div className="relative">
                  <input 
                    type="file" 
                    onChange={e => e.target.files && setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className={`border-2 border-dashed ${file ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'} rounded-2xl p-8 flex flex-col items-center justify-center transition-colors`}>
                    {file ? (
                      <>
                        <FileCode className="w-8 h-8 text-indigo-500 mb-2" />
                        <p className="text-sm font-medium text-slate-900">{file.name}</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-500 mt-1">PDF, DOCX, ZIP up to 50MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl">
              Publish Assignment
            </Button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}

// ==========================================
// STUDENT DASHBOARD
// ==========================================
function StudentAssignmentDashboard({ assignments, submissions, setSubmissions, workspaceContext }: { assignments: Assignment[], submissions: Submission[], setSubmissions: any, workspaceContext?: any }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const { subjects } = mockData;
  
  // Assuming the user is a student, we filter by their class
  // Filter by subject if workspaceContext is provided
  const studentAssignments = useMemo(() => {
    if (workspaceContext) return assignments;
    return assignments.filter(a => !a.classId || !user?.classId || a.classId === user?.classId || a.className === 'All Classes');
  }, [assignments, workspaceContext, user]);

  const filtered = studentAssignments.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (subjects.find(s => s.id === a.subjectId)?.name.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Assignments</h1>
        <p className="text-slate-500 mt-1">View, download, and submit your course assignments.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search assignments by title or subject..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto rounded-xl">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filtered.map(assignment => {
            const subject = subjects.find(s => s.id === assignment.subjectId);
            // Robust submission & evaluated status lookup
            const submission = submissions.find(s => s.assignmentId === assignment.id && (!user?.id || s.studentId === user?.id || (s as any).userId === user?.id || submissions.filter(x => x.assignmentId === assignment.id).length === 1));
            const isEvaluated = submission && (submission.marksAwarded != null || submission.marks != null || submission.grade != null || submission.status === 'Reviewed' || submission.status === 'Graded' || submission.status === 'Reviewed & Graded');
            const status = isEvaluated ? 'Reviewed' : (submission ? submission.status : assignment.status);
            
            const daysRemaining = Math.ceil((new Date(assignment.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            
            return (
              <motion.div key={assignment.id} variants={itemVariants} layout>
                <Card className="h-full border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group rounded-2xl bg-white hover:-translate-y-1 justify-between">
                  <div className={`h-2 w-full ${
                    isEvaluated || status === 'Submitted' || status === 'Graded' ? 'bg-emerald-500' :
                    status === 'Late Submitted' ? 'bg-amber-500' :
                    status === 'Expired' ? 'bg-rose-500' : 'bg-indigo-600'
                  }`} />
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Badge variant={
                          isEvaluated || status === 'Submitted' || status === 'Graded' ? 'active' :
                          status === 'Late Submitted' ? 'pending' :
                          status === 'Expired' ? 'rejected' : 'event'
                        } className="font-bold uppercase tracking-wider text-[11px] px-2.5 py-0.5">
                          {isEvaluated ? 'Reviewed & Graded' : status}
                        </Badge>
                        {isEvaluated ? (
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {submission?.grade && submission.grade !== 'Graded' && submission.grade !== 'Reviewed' && (
                              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-xs">
                                Grade: {submission.grade}
                              </span>
                            )}
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Marks: {submission?.marksAwarded ?? submission?.marks ?? '-'} / {assignment.maxMarks}
                            </span>
                          </div>
                        ) : daysRemaining > 0 && !isEvaluated && status !== 'Submitted' ? (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                            daysRemaining <= 2 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                          </span>
                        ) : null}
                      </div>
                      
                      <h3 className="font-extrabold text-xl text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors tracking-tight">
                        {assignment.title}
                      </h3>
                      {assignment.description && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center text-sm text-slate-600 font-medium">
                          <Calendar className="w-4 h-4 mr-2 text-indigo-500 shrink-0" />
                          <span>Due: <strong className="text-slate-900 ml-1">{formatDeadlineDisplay(assignment.deadline)}</strong></span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600 font-medium">
                          <Activity className="w-4 h-4 mr-2 text-indigo-500 shrink-0" />
                          <span>Max Marks: <strong className="text-slate-900 ml-1">{assignment.maxMarks}</strong></span>
                        </div>
                        {isEvaluated && (submission?.evaluationDate || submission?.evaluatedAt) && (
                          <div className="flex items-center text-xs text-emerald-700 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100 mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                            <span>Evaluated on: <strong className="text-slate-900 ml-1">{submission.evaluationDate || new Date(submission.evaluatedAt).toLocaleString()}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {assignment.type || 'Assignment'}
                      </span>
                      <Button 
                        onClick={() => setSelectedAssignment(assignment)}
                        className={`px-4 py-2 h-9 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5 ${
                          status === 'Submitted' || status === 'Graded' 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {status === 'Submitted' || status === 'Graded' ? 'View Details' : 'Open & Submit'}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {selectedAssignment && (
        <StudentAssignmentModal 
          assignment={selectedAssignment} 
          submissions={submissions}
          setSubmissions={setSubmissions}
          onClose={() => setSelectedAssignment(null)} 
        />
      )}
    </motion.div>
  );
}

function StudentAssignmentModal({ assignment, submissions, setSubmissions, onClose }: { assignment: Assignment, submissions: Submission[], setSubmissions: any, onClose: () => void }) {
  const { user } = useAuth();
  const { subjects } = mockData;
  const subject = subjects.find(s => s.id === assignment.subjectId);
  const submission = submissions.find(s => s.assignmentId === assignment.id && (!user?.id || s.studentId === user?.id || (s as any).userId === user?.id || submissions.filter(x => x.assignmentId === assignment.id).length === 1));
  const isEvaluated = submission && (submission.marksAwarded != null || submission.marks != null || submission.grade != null || submission.status === 'Reviewed' || submission.status === 'Graded' || submission.status === 'Reviewed & Graded');
  const status = isEvaluated ? 'Reviewed' : (submission ? submission.status : assignment.status);
  
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  const canSubmit = status !== 'Expired' && !isEvaluated && status !== 'Graded' && (new Date() <= new Date(assignment.deadline) || assignment.lateSubmissionAllowed !== false);

  const handleUpload = async () => {
    if (!file && !submission) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);

      const res = await api.post(`/v1/assignments/${assignment.id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res?.data?.data) {
        setSubmissions((prev: any[]) => {
          const filtered = prev.filter((s: any) => !(s.assignmentId === assignment.id && (!s.studentId || s.studentId === user?.id)));
          return [res.data.data, ...filtered];
        });
      } else {
        const isLate = new Date() > new Date(assignment.deadline);
        const newSubmission = {
          id: `sub-${Date.now()}`,
          assignmentId: assignment.id,
          studentId: user?.id || 'st-0',
          submitDate: new Date().toISOString(),
          status: isLate ? 'Late Submitted' : 'Submitted',
          fileName: file?.name || 'submission.pdf',
          fileUrl: file ? URL.createObjectURL(file) : '',
          marksObtained: null,
          feedback: null
        };
        setSubmissions((prev: any[]) => {
          const filtered = prev.filter((s: any) => !(s.assignmentId === assignment.id && s.studentId === user?.id));
          return [newSubmission, ...filtered];
        });
      }
    } catch (e) {
      console.error("Failed to submit assignment to backend:", e);
      const isLate = new Date() > new Date(assignment.deadline);
      const newSubmission = {
        id: `sub-${Date.now()}`,
        assignmentId: assignment.id,
        studentId: user?.id || 'st-0',
        submitDate: new Date().toISOString(),
        status: isLate ? 'Late Submitted' : 'Submitted',
        fileName: file?.name || 'submission.pdf',
        fileUrl: file ? URL.createObjectURL(file) : '',
        marksObtained: null,
        feedback: null
      };
      setSubmissions((prev: any[]) => {
        const filtered = prev.filter((s: any) => !(s.assignmentId === assignment.id && s.studentId === user?.id));
        return [newSubmission, ...filtered];
      });
    } finally {
      setIsSubmitting(false);
      setIsReplacing(false);
      setIsSuccess(true);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Side: Details */}
        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto border-r border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {subject?.name && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-100 shadow-xs">
                  <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  {subject.name}
                </span>
              )}
              <span className={`inline-flex items-center px-3 py-1 font-extrabold uppercase tracking-wider text-[11px] rounded-lg shadow-xs ${
                isEvaluated ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                status === 'Submitted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                status === 'Late Submitted' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                status === 'Expired' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {isEvaluated ? 'Reviewed & Graded' : status}
              </span>
            </div>
            <button onClick={onClose} className="p-2 md:hidden hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{assignment.title}</h2>
          
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Max Marks</p>
              <p className="text-xl font-bold text-slate-900">{assignment.maxMarks}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Deadline</p>
              <p className="text-base font-bold text-rose-600">
                {formatDeadlineDisplay(assignment.deadline)}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Description
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-100">
                {assignment.description}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-500" /> Instructions
              </h4>
              <div className="text-sm text-slate-600 whitespace-pre-line bg-white p-4 rounded-2xl border border-slate-100">
                {assignment.instructions}
              </div>
            </div>

            {assignment.attachmentUrl && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Archive className="w-4 h-4 text-indigo-500" /> Attachments
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors overflow-hidden">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                      <File className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-slate-900 truncate max-w-[240px] sm:max-w-none">{assignment.fileName || `${assignment.title}_Attachment.pdf`}</p>
                      <p className="text-xs font-semibold text-slate-500">Document Attachment</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto w-full sm:w-auto justify-end">
                    <a 
                      href={resolveApiUrl(assignment.attachmentUrl || assignment.fileUrl || (assignment.id ? `/api/v1/assignments/${assignment.id}/view` : '#')).replace('/download', '/view')} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="px-3.5 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 flex-1 sm:flex-none shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" /> View
                    </a>
                    <a 
                      href={resolveApiUrl(assignment.attachmentUrl || assignment.fileUrl || (assignment.id ? `/api/v1/assignments/${assignment.id}/download` : '#')).replace('/view', '/download')} 
                      download 
                      className="px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 flex-1 sm:flex-none shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" /> Download
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Submission */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hidden md:block hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>

          <h3 className="text-xl font-bold text-slate-900 mb-6">Submission</h3>
          
          <div className="flex items-center justify-between mb-8 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Activity className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Status</p>
                <p className={`text-sm font-bold ${
                  isEvaluated || status === 'Submitted' || status === 'Graded' ? 'text-emerald-600' :
                  status === 'Late Submitted' ? 'text-amber-600' :
                  status === 'Expired' ? 'text-rose-600' : 'text-indigo-600'
                }`}>
                  {isEvaluated ? 'Reviewed & Graded' : status}
                </p>
              </div>
            </div>
            {(isEvaluated || status === 'Graded') && (
              <div className="flex items-center gap-4 text-right pl-4 border-l border-slate-200">
                {submission?.grade && submission.grade !== 'Graded' && submission.grade !== 'Reviewed' && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Grade</p>
                    <p className="text-xl font-black text-emerald-600">{submission.grade}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Marks Awarded</p>
                  <p className="text-xl font-black text-indigo-600">
                    {submission?.marksAwarded ?? submission?.marks ?? '-'} <span className="text-sm text-slate-400 font-normal">/ {assignment.maxMarks}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
          {(isEvaluated || status === 'Graded') && (
            <div className="mb-6 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider">Evaluation & Feedback</span>
                {(submission?.evaluationDate || submission?.evaluatedAt) && (
                  <span className="text-xs font-medium text-slate-500">Evaluated on {submission.evaluationDate || new Date(submission.evaluatedAt).toLocaleString()}</span>
                )}
              </div>
              {submission?.feedback && (
                <p className="text-slate-700 italic font-medium">"{submission.feedback}"</p>
              )}
            </div>
          )}

          {!isReplacing && (submission || isSuccess) ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-emerald-200 rounded-3xl bg-emerald-50/50"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Successfully Submitted</h4>
              <p className="text-sm text-slate-500 mb-6">Your assignment has been recorded.</p>
              
              <div className="w-full text-left p-4 rounded-xl bg-white shadow-sm border border-slate-100 mb-6">
                <p className="text-xs text-slate-500 mb-1">Submitted File</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                      {submission?.fileName || file?.name || 'submission.pdf'}
                    </span>
                  </div>
                  {submission && (
                    <div className="flex items-center">
                      <a 
                        href={submission.id ? `http://localhost:8080/api/v1/assignments/submissions/${submission.id}/view` : resolveApiUrl(submission.fileUrl || '#')} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </a>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Submitted on: {submission ? new Date(submission.submitDate).toLocaleString() : new Date().toLocaleString()}
                </p>
              </div>
              
              {canSubmit && (
                <Button 
                  variant="outline" 
                  onClick={() => { setIsSuccess(false); setIsReplacing(true); }}
                  className="w-full rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold shadow-sm"
                >
                  Replace Submission
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex-1">
                <label className="text-sm font-semibold text-slate-900 mb-2 block">Upload Work</label>
                <div 
                  className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all ${
                    file 
                      ? 'border-indigo-500 bg-indigo-50/50' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-900'
                  } ${!canSubmit && 'opacity-50 pointer-events-none'}`}
                >
                  {file ? (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <File className="w-6 h-6 text-indigo-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button 
                        onClick={() => setFile(null)}
                        className="text-xs text-rose-500 font-medium mt-4 hover:text-rose-600"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="text-center relative">
                      <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFile(e.target.files[0]);
                          }
                        }}
                        disabled={!canSubmit}
                      />
                      <div className="w-12 h-12 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                        <Upload className="w-5 h-5 text-indigo-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                      <p className="text-xs text-slate-500 mt-2">Allowed: {assignment.allowedFileTypes || 'PDF, DOCX, ZIP'} (Max: {assignment.maxUploadSize || '10MB'})</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8">
                <Button 
                  disabled={!file || !canSubmit || isSubmitting}
                  onClick={handleUpload}
                  className="w-full py-6 text-base font-semibold rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none relative overflow-hidden group"
                >
                  <div className={`absolute inset-0 bg-indigo-500/20 w-0 group-hover:w-full transition-all duration-300 ${isSubmitting ? 'w-full animate-pulse' : ''}`} />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>Submit Assignment <ChevronRight className="w-4 h-4" /></>
                    )}
                  </span>
                </Button>
                {!canSubmit && (
                  <p className="text-center text-xs text-rose-500 mt-3 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Submissions are closed for this assignment.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
