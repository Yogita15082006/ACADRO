import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, CheckCircle2, 
  X, TrendingUp, AlertTriangle, Activity,
  Eye, Clock, Edit, Trash2, Users, FileText, Sparkles, ArrowLeft, Trophy, CheckSquare, XCircle, PlayCircle, Timer, FileQuestion, Send, Flag, Target, BrainCircuit, BookOpen, LayoutDashboard, Calendar, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { mockData } from '../data/mockData';
import { quizService } from '../services/quizService';
import { CreateQuizModal, ViewQuizModal, GradeQuizModal, ViewSubmissionsModal, EditQuizDeadlineModal } from './QuizModals';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, BarChart, Bar, CartesianGrid, Legend, LineChart, Line, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const formatClassName = (name?: string | null): string => {
  if (!name || name === 'null' || name === 'undefined' || !name.trim()) return 'Assigned Section';
  let cleaned = name
    .replace(/\bnull\b/gi, '')
    .replace(/\bundefined\b/gi, '')
    .replace(/\s+-\s*$/, '')
    .replace(/^\s*-\s*/, '')
    .trim();
  return cleaned || 'Assigned Section';
};

export function QuizModule({ workspaceContext }: { workspaceContext?: any }) {
  const { role, user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const isStaff = ['faculty', 'hod', 'coordinator', 'both', 'admin'].includes(role);
      const targetId = workspaceContext?.id || workspaceContext?.subjectId;
      if (targetId) {
        const res = await quizService.getQuizzesBySubject(targetId);
        setQuizzes(Array.isArray(res) ? res : []);
      } else if (isStaff) {
        const res = await quizService.getFacultyQuizzes();
        setQuizzes(Array.isArray(res) ? res : []);
      } else {
        const res = await quizService.getAvailableQuizzes();
        setQuizzes(Array.isArray(res) ? res : []);
      }

      if (role === 'student') {
        try {
          const resAttempts = await quizService.getStudentResults();
          setAttempts(Array.isArray(resAttempts) ? resAttempts : []);
        } catch (e) {
          console.error('No results found:', e);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dynamic quizzes:', err);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [workspaceContext, role]);

  if (loading && quizzes.length === 0) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading dynamic quiz repository...</div>;
  }

  if (['faculty', 'hod', 'coordinator', 'both', 'admin'].includes(role)) {
    return <AdminQuizDashboard quizzes={quizzes} attempts={attempts} workspaceContext={workspaceContext} onRefresh={fetchQuizzes} />;
  }
  
  return <StudentQuizDashboard quizzes={quizzes} attempts={attempts} setAttempts={setAttempts} user={user} workspaceContext={workspaceContext} onRefresh={fetchQuizzes} />;
}

// ==========================================
// ADMIN DASHBOARD HIERARCHY
// ==========================================
function QuizHierarchyView({ quizzes, searchQuery, onAnalyticsClick, workspaceContext, onRefresh }: any) {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);

  // Modal Action States
  const [viewQuizModal, setViewQuizModal] = useState<any>(null);
  const [gradeQuizModal, setGradeQuizModal] = useState<any>(null);
  const [submissionsModal, setSubmissionsModal] = useState<any>(null);
  const [editDeadlineModal, setEditDeadlineModal] = useState<any>(null);
  const [deleteQuizConfirmId, setDeleteQuizConfirmId] = useState<string | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState(false);

  const handleDelete = (id: string) => {
    setDeleteQuizConfirmId(id);
  };

  const executeDeleteQuiz = async () => {
    if (!deleteQuizConfirmId) return;
    try {
      setDeletingQuiz(true);
      await quizService.deleteQuiz(deleteQuizConfirmId);
      setDeleteQuizConfirmId(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to delete quiz:", err);
    } finally {
      setDeletingQuiz(false);
    }
  };

  const renderFacultyQuizCards = (quizzesList: any[]) => {
    if (quizzesList.length === 0) {
      return (
        <Card className="p-12 text-center text-muted-foreground border border-dashed border-border bg-card/40 rounded-2xl">
          <p className="font-medium text-base">No assessments found in this directory.</p>
          <p className="text-xs text-muted-foreground mt-1">Generate a dynamic quiz via AI or manual entry above to get started.</p>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {quizzesList.map((quiz: any) => {
          const statusColor = 
            quiz.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
            quiz.status === 'Upcoming' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' :
            'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';

          return (
            <Card key={quiz.id} className="border border-border/80 shadow-sm hover:shadow-md transition-all duration-200 bg-card rounded-2xl flex flex-col justify-between overflow-hidden h-full min-h-[350px]">
              <div className="p-5 flex flex-col flex-1 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-base text-foreground line-clamp-2 leading-tight flex-1" title={quiz.title}>{quiz.title}</h3>
                  <Badge variant="outline" className={`text-[11px] px-2.5 py-0.5 font-bold shrink-0 rounded-full ${statusColor}`}>
                    {quiz.status || 'Active'}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground font-medium">
                  <Badge variant="secondary" className="text-[11px] font-bold bg-primary/10 text-primary border-primary/20">
                    {quiz.questionType && quiz.questionType !== 'undefined' ? (quiz.questionType === 'True/False' ? 'True / False' : quiz.questionType) : 'MCQ'} • {((quiz.questionCount ?? quiz.questionsCount) !== undefined) ? `${quiz.questionCount ?? quiz.questionsCount} ${((quiz.questionCount ?? quiz.questionsCount) === 1) ? 'Question' : 'Questions'}` : '0 Questions'}
                  </Badge>
                  {quiz.difficulty && (
                    <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground">
                      {quiz.difficulty}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5 pt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-primary shrink-0" />
                    <span className="truncate font-medium">{quiz.startTime ? new Date(quiz.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (quiz.date || '')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer size={13} className="text-primary shrink-0" />
                    <span className="font-medium">{quiz.durationMinutes} Minutes Duration</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 my-auto py-1.5">
                  <div className="bg-muted/40 rounded-xl p-2.5 text-center border border-border/60 flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total Marks</p>
                    <p className="text-base font-extrabold text-foreground mt-0.5">{quiz.totalMarks}</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-2.5 text-center border border-border/60 flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Passing Marks</p>
                    <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{quiz.passingMarks}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex flex-col gap-2 mt-auto">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 justify-center hover:bg-primary/5 hover:border-primary/50 text-primary transition-colors" onClick={() => setViewQuizModal(quiz)}>
                      <Eye size={13} /> View
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 justify-center hover:bg-amber-500/10 hover:border-amber-500/50 text-amber-600 dark:text-amber-400 transition-colors" onClick={() => setGradeQuizModal(quiz)}>
                      <CheckCircle2 size={13} /> Grade
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 w-full text-xs font-semibold gap-1.5 justify-center hover:bg-indigo-500/10 hover:border-indigo-500/50 text-indigo-600 dark:text-indigo-400 transition-colors" onClick={() => setSubmissionsModal(quiz)}>
                    <Users size={13} /> View Submissions
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs font-medium gap-1.5 justify-center text-muted-foreground hover:text-foreground transition-colors" onClick={() => setEditDeadlineModal(quiz)}>
                      <Edit size={13} /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-medium gap-1.5 justify-center text-destructive border-destructive/30 hover:bg-destructive/10 transition-colors" onClick={() => handleDelete(quiz.id)}>
                      <Trash2 size={13} /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderModals = () => (
    <AnimatePresence>
      {viewQuizModal && <ViewQuizModal quiz={viewQuizModal} onClose={() => setViewQuizModal(null)} />}
      {gradeQuizModal && <GradeQuizModal quiz={gradeQuizModal} onClose={() => setGradeQuizModal(null)} onSuccess={() => { setGradeQuizModal(null); if(onRefresh) onRefresh(); }} />}
      {submissionsModal && <ViewSubmissionsModal quiz={submissionsModal} onClose={() => setSubmissionsModal(null)} />}
      {editDeadlineModal && <EditQuizDeadlineModal quiz={editDeadlineModal} onClose={() => setEditDeadlineModal(null)} onSuccess={() => { setEditDeadlineModal(null); if(onRefresh) onRefresh(); }} />}

      {/* Custom In-App Delete Quiz Confirmation Modal */}
      {deleteQuizConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDeleteQuizConfirmId(null)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.15 }} className="relative bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-destructive/10">
              <div className="flex items-center gap-2.5 text-destructive">
                <AlertTriangle size={22} className="shrink-0" />
                <h3 className="text-lg font-bold text-foreground">Delete Quiz</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDeleteQuizConfirmId(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></Button>
            </div>
            <div className="p-6">
              <p className="text-sm text-foreground font-medium leading-relaxed">
                Are you sure you want to delete this quiz? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteQuizConfirmId(null)} disabled={deletingQuiz} className="font-semibold">Cancel</Button>
              <Button variant="destructive" onClick={executeDeleteQuiz} disabled={deletingQuiz} className="gap-2 font-bold px-5 shadow-md">
                {deletingQuiz ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deletingQuiz ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const availableYears = Array.from(new Set(mockData.classes.map(c => c.year))).sort();
  
  const getSemestersForYear = (year: string) => {
    if (year === 'First Year') return ['Semester 1', 'Semester 2'];
    if (year === 'Second Year') return ['Semester 3', 'Semester 4'];
    if (year === 'Third Year') return ['Semester 5', 'Semester 6'];
    if (year === 'Fourth Year') return ['Semester 7', 'Semester 8'];
    return ['Semester 1', 'Semester 2'];
  };

  const getClassesForSemester = (year: string, semester: string) => {
    return mockData.classes.filter((c: any) => c.year === year && c.semester === semester);
  };

  const classQuizzes = selectedClass ? quizzes.filter((q:any) => q.classId === selectedClass.id && q.title.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  if (workspaceContext) {
    const workspaceQuizzes = quizzes.filter((q:any) => q.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <div className="space-y-4">
        {renderFacultyQuizCards(workspaceQuizzes)}
        {renderModals()}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground bg-card p-3 rounded-md border border-border shadow-sm">
        <button onClick={() => { setSelectedYear(null); setSelectedSemester(null); setSelectedClass(null); }} className={`hover:text-primary transition-colors font-medium ${!selectedYear ? 'text-primary' : ''}`}>All Years</button>
        {selectedYear && (
          <>
            <span className="text-border">/</span>
            <button onClick={() => { setSelectedSemester(null); setSelectedClass(null); }} className={`hover:text-primary transition-colors font-medium ${!selectedSemester ? 'text-primary' : ''}`}>{selectedYear}</button>
          </>
        )}
        {selectedSemester && (
          <>
            <span className="text-border">/</span>
            <button onClick={() => setSelectedClass(null)} className={`hover:text-primary transition-colors font-medium ${!selectedClass ? 'text-primary' : ''}`}>{selectedSemester}</button>
          </>
        )}
        {selectedClass && (
          <>
            <span className="text-border">/</span>
            <span className="text-foreground font-semibold">{selectedClass.name}</span>
          </>
        )}
      </div>

      {!selectedYear ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {availableYears.map(year => (
            <Card key={year} className="cursor-pointer hover:border-primary transition-colors bg-card hover:bg-muted/50" onClick={() => setSelectedYear(year)}>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{year}</h3>
                <p className="text-sm text-muted-foreground">{mockData.classes.filter(c => c.year === year).length} Classes</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !selectedSemester ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {getSemestersForYear(selectedYear).map(sem => (
            <Card key={sem} className="cursor-pointer hover:border-primary transition-colors bg-card hover:bg-muted/50" onClick={() => setSelectedSemester(sem)}>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{sem}</h3>
                <p className="text-sm text-muted-foreground">{getClassesForSemester(selectedYear, sem).length} Classes</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !selectedClass ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {getClassesForSemester(selectedYear, selectedSemester).map(cls => (
            <Card key={cls.id} className="cursor-pointer hover:border-primary transition-colors bg-card hover:bg-muted/50" onClick={() => setSelectedClass(cls)}>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{cls.name}</h3>
                <p className="text-sm text-muted-foreground">{quizzes.filter((q:any) => q.classId === cls.id).length} Quizzes</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        renderFacultyQuizCards(classQuizzes)
      )}
      {renderModals()}
    </div>
  );
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================
function AdminQuizDashboard({ quizzes, attempts, workspaceContext, onRefresh }: any) {
  const [activeTab, setActiveTab] = useState(workspaceContext ? 'quizzes' : 'overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAnalyticsQuiz, setActiveAnalyticsQuiz] = useState<any>(null);
  

  if (activeAnalyticsQuiz) {
    return <AdminQuizAnalytics quiz={activeAnalyticsQuiz} allAttempts={attempts} onClose={() => setActiveAnalyticsQuiz(null)} />;
  }

  return (
    <motion.div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quiz Management</h1>
          <p className="text-muted-foreground mt-1">Create and monitor assessments.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search quizzes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 shrink-0 shadow-sm">
            <Plus size={16} /> <span className="hidden sm:inline">Create Quiz</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      {!workspaceContext && (
        <div className="flex space-x-1 border-b border-border">
          {['overview', 'quizzes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && !workspaceContext && (
          <motion.div key="overview" variants={itemVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-6">
            <AdminOverviewDashboard quizzes={quizzes} attempts={attempts} />
          </motion.div>
        )}

        {activeTab === 'quizzes' && (
          <motion.div key="quizzes" variants={itemVariants} initial="hidden" animate="visible" exit="hidden">
            <QuizHierarchyView 
              quizzes={quizzes} 
              searchQuery={searchQuery} 
              onAnalyticsClick={setActiveAnalyticsQuiz} 
              workspaceContext={workspaceContext}
              onRefresh={onRefresh}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <CreateQuizModal onClose={() => setShowCreateModal(false)} onSave={() => { setShowCreateModal(false); if (onRefresh) onRefresh(); }} workspaceContext={workspaceContext} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==========================================
// ADMIN DASHBOARD OVERVIEW
// ==========================================
function AdminOverviewDashboard({ quizzes, attempts }: any) {
  const totalQuizzes = quizzes.length;
  const activeQuizzes = quizzes.filter((q:any) => q.status === 'Active').length;
  const draftQuizzes = quizzes.filter((q:any) => q.status === 'Upcoming' || q.status === 'Draft').length;
  const completedQuizzes = quizzes.filter((q:any) => q.status === 'Completed').length;
  
  const uniqueStudentsAttempted = new Set(attempts.map((a:any) => a.studentId)).size;
  const totalStudents = mockData.students.length;
  const studentsPending = Math.max(0, totalStudents - uniqueStudentsAttempted);
  
  const avgScore = attempts.length > 0 ? (attempts.reduce((acc:any, curr:any) => acc + curr.percentage, 0) / attempts.length) : 0;
  const completionRate = totalStudents > 0 ? ((uniqueStudentsAttempted / totalStudents) * 100) : 0;
  
  const passedCount = attempts.filter((a:any) => a.status === 'Passed').length;
  const passPercentage = attempts.length > 0 ? (passedCount / attempts.length) * 100 : 0;
  const failPercentage = attempts.length > 0 ? 100 - passPercentage : 0;

  // Chart Data Preparation (Mocked/Derived)
  const performanceTrend = [
    { name: 'Week 1', score: 65 }, { name: 'Week 2', score: 68 },
    { name: 'Week 3', score: 74 }, { name: 'Week 4', score: 72 },
    { name: 'Week 5', score: Math.round(avgScore) || 80 }
  ];
  
  const passFailData = [
    { name: 'Passed', value: passedCount || 1, color: '#10B981' },
    { name: 'Failed', value: (attempts.length - passedCount) || 1, color: '#EF4444' }
  ];

  const subjectDist = mockData.subjects.map(sub => {
    const subQuizzes = quizzes.filter((q:any) => q.subjectId === sub.id);
    const subAttempts = attempts.filter((a:any) => subQuizzes.some((sq:any) => sq.id === a.quizId));
    const avg = subAttempts.length > 0 ? subAttempts.reduce((acc:any, a:any) => acc + a.percentage, 0) / subAttempts.length : 0;
    return { name: sub.name, quizzes: subQuizzes.length, avgScore: Math.round(avg) };
  }).filter(s => s.quizzes > 0);

  const diffDist = [
    { name: 'Easy', value: 35, color: '#3B82F6' },
    { name: 'Medium', value: 45, color: '#F59E0B' },
    { name: 'Hard', value: 20, color: '#EF4444' }
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Quizzes" value={totalQuizzes} icon={<LayoutDashboard size={20}/>} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard title="Active" value={activeQuizzes} icon={<Activity size={20}/>} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard title="Drafts/Upcoming" value={draftQuizzes} icon={<Edit size={20}/>} color="text-amber-500" bg="bg-amber-500/10" />
        <StatCard title="Completed" value={completedQuizzes} icon={<CheckCircle2 size={20}/>} color="text-purple-500" bg="bg-purple-500/10" />
        <StatCard title="Avg Score" value={`${avgScore.toFixed(1)}%`} icon={<TrendingUp size={20}/>} color="text-indigo-500" bg="bg-indigo-500/10" />
        
        <StatCard title="Students Attempted" value={uniqueStudentsAttempted} icon={<Users size={20}/>} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard title="Students Pending" value={studentsPending} icon={<Clock size={20}/>} color="text-amber-500" bg="bg-amber-500/10" />
        <StatCard title="Completion Rate" value={`${completionRate.toFixed(1)}%`} icon={<Target size={20}/>} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard title="Pass Rate" value={`${passPercentage.toFixed(1)}%`} icon={<Trophy size={20}/>} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard title="Fail Rate" value={`${failPercentage.toFixed(1)}%`} icon={<AlertTriangle size={20}/>} color="text-red-500" bg="bg-red-500/10" />
      </div>

      {/* AI Premium Panel */}
      <Card className="border-indigo-500/20 shadow-md bg-gradient-to-br from-indigo-500/5 to-purple-500/5 overflow-hidden">
         <CardHeader className="border-b border-indigo-500/10 pb-4">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-500/20 text-indigo-600 rounded-lg"><BrainCircuit size={24} /></div>
               <div>
                 <CardTitle className="text-xl text-indigo-900 dark:text-indigo-300">Nexus AI Insights</CardTitle>
                 <CardDescription className="text-indigo-700/70 dark:text-indigo-400/70">Intelligent analysis across all assessments</CardDescription>
               </div>
            </div>
         </CardHeader>
         <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
               <div className="bg-background/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-500/10 h-full">
                 <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Target size={16}/> Overall Summary</h4>
                 <p className="text-sm mt-2 font-medium">Students are showing consistent improvement, but there is a notable struggle in advanced analytical questions.</p>
               </div>
               <div className="bg-background/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-500/10 h-full">
                 <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><AlertTriangle size={16}/> Attention Required</h4>
                 <p className="text-sm mt-2 font-medium">15% of students are consistently scoring below passing marks across core subjects.</p>
               </div>
            </div>
            <div className="space-y-4">
               <div className="bg-background/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-500/10 h-full">
                 <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><BookOpen size={16}/> Most Difficult Subject</h4>
                 <p className="text-sm mt-2 font-medium text-red-500">Operating Systems (42% Avg Score)</p>
               </div>
               <div className="bg-background/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-500/10 h-full">
                 <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><FileQuestion size={16}/> Most Difficult Quiz</h4>
                 <p className="text-sm mt-2 font-medium">Advanced Paging & Segmentation</p>
               </div>
            </div>
            <div className="space-y-4">
               <div className="bg-background/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-500/10 h-full">
                 <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Trophy size={16}/> Top Performing Class</h4>
                 <p className="text-sm mt-2 font-medium text-emerald-500">IT-1 (3rd Year)</p>
               </div>
               <div className="bg-background/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-500/10 h-full">
                 <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Sparkles size={16}/> AI Recommendation</h4>
                 <p className="text-sm mt-2 font-medium">Conduct a remedial session for Operating Systems before the next major assessment.</p>
               </div>
            </div>
         </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card className="shadow-sm border-border">
          <CardHeader><CardTitle className="text-lg">Overall Performance Trend</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrend}>
                <defs>
                  <linearGradient id="colorScoreOverview" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 8 }} />
                <Area type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorScoreOverview)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pass vs Fail */}
        <Card className="shadow-sm border-border">
          <CardHeader><CardTitle className="text-lg">Pass vs Fail Ratio</CardTitle></CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={passFailData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                  {passFailData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                <Legend verticalAlign="bottom" height={36} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject-wise Average Score */}
        <Card className="shadow-sm border-border">
          <CardHeader><CardTitle className="text-lg">Subject-wise Average Score</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectDist} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="avgScore" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} name="Avg Score (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Difficulty Distribution */}
        <Card className="shadow-sm border-border">
          <CardHeader><CardTitle className="text-lg">Quiz Difficulty Distribution</CardTitle></CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={diffDist} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {diffDist.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==========================================
// ADMIN QUIZ ANALYTICS (DEDICATED)
// ==========================================
function AdminQuizAnalytics({ quiz, allAttempts, onClose }: any) {
  const attempts = allAttempts.filter((a: any) => a.quizId === quiz.id);
  const subject = mockData.subjects.find(s => s.id === quiz.subjectId)?.name;
  
  // Calculate metrics
  const totalStudents = mockData.students.filter(s => s.classId === quiz.classId).length;
  const attemptedCount = attempts.length;
  const passedCount = attempts.filter((a:any) => a.status === 'Passed').length;
  const failedCount = attempts.filter((a:any) => a.status === 'Failed').length;
  
  const scores = attempts.map((a:any) => a.score);
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
  const avgScore = scores.length > 0 ? (scores.reduce((a:any, b:any) => a + b, 0) / scores.length).toFixed(1) : 0;
  const avgTime = scores.length > 0 ? (attempts.reduce((acc:any, a:any) => acc + a.timeTaken, 0) / attempts.length).toFixed(1) : 0;
  const completionRate = totalStudents > 0 ? ((attemptedCount / totalStudents) * 100).toFixed(1) : 0;

  // Chart Data
  const scoreDist = [
    { range: '0-20%', count: attempts.filter((a:any) => a.percentage <= 20).length },
    { range: '21-40%', count: attempts.filter((a:any) => a.percentage > 20 && a.percentage <= 40).length },
    { range: '41-60%', count: attempts.filter((a:any) => a.percentage > 40 && a.percentage <= 60).length },
    { range: '61-80%', count: attempts.filter((a:any) => a.percentage > 60 && a.percentage <= 80).length },
    { range: '81-100%', count: attempts.filter((a:any) => a.percentage > 80).length },
  ];

  const insights = [
    `Difficulty Analysis: The average score is ${avgScore}/${quiz.totalMarks}. This indicates a ${Number(avgScore) > quiz.totalMarks * 0.7 ? 'fairly balanced' : 'challenging'} difficulty level.`,
    `Question Insights: Question 4 saw the highest incorrect attempts (62%). Consider reviewing this topic in class.`,
    `Time Management: The average time taken was ${avgTime} mins out of ${quiz.duration} mins. Most students managed their time efficiently.`,
    `Students needing improvement: ${failedCount} students failed to achieve the passing mark of ${quiz.passingMarks}.`,
    `Topic Performance: Concepts related to advanced application of ${subject} showed lower accuracy. Easiest questions were from the introductory sections.`,
  ];

  return (
    <motion.div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onClose} className="rounded-full"><ArrowLeft size={18} /></Button>
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold text-foreground">{quiz.title} Analytics</h1>
             <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{subject}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">Detailed performance metrics, ranks, and AI insights for this specific quiz.</p>
        </div>
      </div>

      {/* Filters (Mocked visual representation) */}
      <Card className="border-border shadow-sm p-2 bg-muted/20">
         <div className="flex flex-wrap gap-2">
            <select className="bg-background border border-border rounded-md px-3 py-1.5 text-sm outline-none"><option>All Classes</option><option>{quiz.department}-{quiz.academicYear}</option></select>
            <select className="bg-background border border-border rounded-md px-3 py-1.5 text-sm outline-none"><option>All Status</option><option>Passed</option><option>Failed</option></select>
            <select className="bg-background border border-border rounded-md px-3 py-1.5 text-sm outline-none"><option>Marks: All</option><option>Top 25%</option><option>Bottom 25%</option></select>
            <Button variant="outline" size="sm" className="ml-auto gap-2"><Filter size={14}/> Apply Filters</Button>
         </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total Eligible" value={totalStudents} icon={<Activity size={20} />} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard title="Attempted" value={attemptedCount} icon={<CheckSquare size={20} />} color="text-indigo-500" bg="bg-indigo-500/10" />
        <StatCard title="Completion Rate" value={`${completionRate}%`} icon={<TrendingUp size={20} />} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard title="Passed" value={passedCount} icon={<Trophy size={20} />} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard title="Failed" value={failedCount} icon={<XCircle size={20} />} color="text-red-500" bg="bg-red-500/10" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
           <p className="text-sm text-muted-foreground">Highest Score</p>
           <h4 className="text-xl font-bold mt-1">{highestScore}/{quiz.totalMarks}</h4>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
           <p className="text-sm text-muted-foreground">Average Score</p>
           <h4 className="text-xl font-bold mt-1">{avgScore}/{quiz.totalMarks}</h4>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
           <p className="text-sm text-muted-foreground">Lowest Score</p>
           <h4 className="text-xl font-bold mt-1">{lowestScore}/{quiz.totalMarks}</h4>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
           <p className="text-sm text-muted-foreground">Avg Time Taken</p>
           <h4 className="text-xl font-bold mt-1">{avgTime} mins</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Score Distribution */}
         <Card className="shadow-sm border-border">
           <CardHeader>
             <CardTitle className="text-lg">Score Distribution</CardTitle>
           </CardHeader>
           <CardContent className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={scoreDist}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                 <XAxis dataKey="range" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis fontSize={12} tickLine={false} axisLine={false} />
                 <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 8 }} />
                 <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Students" />
               </BarChart>
             </ResponsiveContainer>
           </CardContent>
         </Card>

         {/* Pass/Fail & AI Insights */}
         <Card className="shadow-sm border-border flex flex-col">
           <CardHeader className="pb-2">
             <div className="flex items-center gap-2 text-indigo-500">
               <Sparkles size={20} />
               <CardTitle className="text-lg text-foreground">AI Quiz Insights</CardTitle>
             </div>
           </CardHeader>
           <CardContent className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 mt-2">
             {insights.map((insight, idx) => (
                <div key={idx} className="p-3 bg-muted/20 border border-border/50 rounded-lg text-sm text-foreground/90">
                  {insight}
                </div>
             ))}
           </CardContent>
         </Card>
      </div>

      {/* Rank List Table */}
      <Card className="shadow-sm border-border">
        <CardHeader className="border-b border-border bg-muted/10">
          <CardTitle className="text-lg">Comprehensive Rank List</CardTitle>
          <CardDescription>Performance of all students in this specific quiz.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
          <table className="w-full text-sm text-left relative">
            <thead className="text-xs text-muted-foreground uppercase bg-muted sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Rank</th>
                <th className="px-6 py-4 font-medium">Student Name</th>
                <th className="px-6 py-4 font-medium">Score</th>
                <th className="px-6 py-4 font-medium">Percentage</th>
                <th className="px-6 py-4 font-medium">Time Taken</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(() => {
                  const sortedAttempts = [...attempts].sort((a,b) => b.score - a.score);
                  return sortedAttempts.map((attempt: any) => {
                const student = mockData.students.find(s => s.id === attempt.studentId);
                return (
                  <tr key={attempt.id} className="hover:bg-muted/30">
                     <td className="px-6 py-4 font-bold text-foreground">#{attempt.rank}</td>
                     <td className="px-6 py-4 font-medium">{student?.name} <span className="text-xs text-muted-foreground block">{student?.enrollmentNumber}</span></td>
                     <td className="px-6 py-4 font-bold text-primary">{attempt.score}/{quiz.totalMarks}</td>
                     <td className="px-6 py-4">{attempt.percentage.toFixed(1)}%</td>
                     <td className="px-6 py-4 text-muted-foreground">{attempt.timeTaken} mins</td>
                     <td className="px-6 py-4">
                       <Badge variant="outline" className={attempt.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}>
                          {attempt.status}
                       </Badge>
                     </td>
                  </tr>
                );
              });
              })()}
              {attempts.length === 0 && (
                 <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No attempts found for this quiz yet.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

function StatCard({ title, value, icon, color, bg }: any) {
  return (
    <Card className="shadow-sm border-border overflow-hidden group">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${bg} ${color} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold text-foreground tracking-tight">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// STUDENT DASHBOARD
// ==========================================
function StudentQuizDashboard({ quizzes, attempts, user, workspaceContext, onRefresh }: any) {
  const [takingQuiz, setTakingQuiz] = useState<any>(null);
  const [viewingResult, setViewingResult] = useState<any>(null);

  if (takingQuiz) {
     return <QuizInterface quiz={takingQuiz} onFinish={() => { setTakingQuiz(null); if (onRefresh) onRefresh(); }} />;
  }

  const myAttempts = (Array.isArray(attempts) ? attempts : []).filter((a: any) => !!a.completedAt || !!a.evaluatedAt || !!a.grade || (a.score !== undefined && a.score !== null));
  const attemptedQuizIds = myAttempts.map((a: any) => a.quizId || a.id);

  // 1. Pending Quizzes
  const availableQuizzes = (quizzes || []).filter((q: any) => !attemptedQuizIds.includes(q.id));

  // 2. Submitted Quizzes (In Review / Awaiting Evaluation)
  const submittedQuizzes = myAttempts.filter((att: any) => {
    return !att.evaluatedAt && (!att.grade || att.grade === 'Pending') && (att.score === undefined || att.score === null);
  });

  // 3. Evaluated Results & Completed Quizzes
  const completedQuizzesRaw = myAttempts.filter((att: any) => {
    return !!att.evaluatedAt || (!!att.grade && att.grade !== 'Pending') || (att.score !== undefined && att.score !== null);
  });

  const completedQuizzes = completedQuizzesRaw.map((att: any) => {
    const relatedQuiz = (quizzes || []).find((q: any) => q.id === att.quizId) || att.quiz || {};
    const totalM = relatedQuiz.totalMarks || att.totalMarks || 0;
    const obtM = att.score !== undefined && att.score !== null ? Number(att.score) : 0;
    const pct = att.percentage ? Number(att.percentage) : (totalM > 0 ? (obtM / totalM) * 100 : 0);
    const isPassed = att.passed !== undefined ? att.passed : (pct >= 40);
    const qType = relatedQuiz.questionType === 'True/False' ? 'True / False' : (relatedQuiz.questionType || 'MCQ');
    return {
      id: att.id || relatedQuiz.id,
      attemptId: att.id,
      quizId: att.quizId || relatedQuiz.id,
      title: relatedQuiz.title || att.quizTitle || 'Assessment Result',
      subject: relatedQuiz.subjectName || att.subjectName || 'Subject Assessment',
      totalMarks: totalM,
      questionType: qType,
      difficulty: relatedQuiz.difficulty || 'Standard',
      className: formatClassName(att.className || relatedQuiz.className),
      attempt: {
        id: att.id,
        quizId: att.quizId || relatedQuiz.id,
        status: isPassed ? 'Passed' : 'Failed',
        score: obtM,
        submissionTime: att.evaluatedAt || att.completedAt || att.startedAt || new Date().toISOString(),
        percentage: pct,
        rank: att.classRank || att.rank || 1,
        classRank: att.classRank || att.rank || 1,
        totalStudents: att.totalStudents || 1,
        timeTaken: att.timeTakenMinutes || relatedQuiz.durationMinutes || 0,
        correctAnswers: att.correctAnswers ?? 0,
        incorrectAnswers: att.wrongAnswers ?? 0,
        unattemptedQuestions: att.unattemptedQuestions ?? att.unattemptedCount ?? 0,
        resultSummary: att.resultSummary,
        grade: att.grade && att.grade !== 'Pending' ? att.grade : (isPassed ? 'Passed' : 'Failed')
      }
    };
  });

  const totalQuizzes = availableQuizzes.length + submittedQuizzes.length + completedQuizzes.length;
  const missedQuizzes = (quizzes || []).filter((q: any) => q.status === 'Completed' && !attemptedQuizIds.includes(q.id)).length;
  
  const staticTotalPct = completedQuizzes.reduce((acc: number, curr: any) => acc + curr.attempt.percentage, 0);
  const avgScore = completedQuizzes.length > 0 ? (staticTotalPct / completedQuizzes.length).toFixed(1) + '%' : '0%';

  return (
    <motion.div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Student Quiz Dashboard</h1>
        <p className="text-muted-foreground mt-1">Live assessment tracking and evaluation history.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
         <StatCard title="Total Quizzes" value={totalQuizzes} icon={<LayoutDashboard size={20} />} color="text-blue-500" bg="bg-blue-500/10" />
         <StatCard title="Attempted" value={completedQuizzes.length + submittedQuizzes.length} icon={<CheckCircle2 size={20} />} color="text-emerald-500" bg="bg-emerald-500/10" />
         <StatCard title="Pending" value={availableQuizzes.length} icon={<Clock size={20} />} color="text-amber-500" bg="bg-amber-500/10" />
         <StatCard title="Missed" value={missedQuizzes} icon={<AlertTriangle size={20} />} color="text-red-500" bg="bg-red-500/10" />
         <StatCard title="Avg Score" value={avgScore} icon={<TrendingUp size={20} />} color="text-purple-500" bg="bg-purple-500/10" />
      </div>

      {/* 1. Pending Quizzes */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">Pending Quizzes</h2>
        {availableQuizzes.length === 0 && <p className="text-muted-foreground italic">No pending quizzes available at this moment.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableQuizzes.map((quiz: any) => (
            <Card key={quiz.id} className="shadow-sm border-border hover:shadow-md transition-shadow group flex flex-col">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                 <div className="flex justify-between items-start">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Timer size={14}/> {quiz.durationMinutes}m</span>
                 </div>
                 <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">{quiz.title}</CardTitle>
                 <CardDescription>{quiz.subjectName}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col">
                 <div className="space-y-2 text-sm flex-1">
                   <div className="flex justify-between"><span className="text-muted-foreground">Faculty:</span> <span className="font-medium text-foreground">{quiz.facultyName || quiz.createdByName}</span></div>
                   <div className="flex justify-between"><span className="text-muted-foreground">Total Marks:</span> <span className="font-medium text-foreground">{quiz.totalMarks}</span></div>
                   <div className="flex justify-between"><span className="text-muted-foreground">Type:</span> <span className="font-semibold text-primary">{quiz.questionType === 'True/False' ? 'True / False' : (quiz.questionType || 'MCQ')}</span></div>
                 </div>
                 <Button onClick={() => setTakingQuiz(quiz)} className="w-full mt-6 gap-2 font-semibold"><PlayCircle size={16} /> Start Quiz</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 2. Submitted Quizzes */}
      {submittedQuizzes.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-border">
          <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">Submitted Quizzes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submittedQuizzes.map((att: any, index: number) => {
              const relatedQuiz = (quizzes || []).find((q: any) => q.id === att.quizId) || att.quiz || {};
              const qType = relatedQuiz.questionType === 'True/False' ? 'True / False' : (relatedQuiz.questionType || 'MCQ');
              return (
                <Card key={att.id || index} className="shadow-sm border-border flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                     <div className="flex justify-between items-start">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">
                          Submitted
                        </Badge>
                     </div>
                     <CardTitle className="text-lg mt-3">{relatedQuiz.title || att.quizTitle}</CardTitle>
                     <CardDescription>{relatedQuiz.subjectName || att.subjectName || 'In Instructor Review'}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1 text-sm text-muted-foreground space-y-2">
                     <div className="flex justify-between text-sm pt-1"><span className="text-muted-foreground">Faculty:</span> <span className="font-medium text-foreground">{relatedQuiz.facultyName || relatedQuiz.createdByName}</span></div>
                     <div className="flex justify-between text-sm"><span className="text-muted-foreground">Type:</span> <span className="font-semibold text-primary">{qType}</span></div>
                     <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status:</span> <span className="font-bold text-amber-600 dark:text-amber-400">Awaiting Faculty Evaluation</span></div>
                     <div className="text-xs font-mono text-foreground pt-2 border-t border-border/50 mt-3">Submitted at: {att.completedAt ? new Date(att.completedAt).toLocaleString() : (att.startedAt ? new Date(att.startedAt).toLocaleString() : '')}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Results & Completed Quizzes */}
      <div className="space-y-6 pt-6 border-t border-border">
        <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">Completed Quizzes & Results</h2>
        {completedQuizzes.length === 0 && <p className="text-muted-foreground italic">No evaluated quiz records available yet.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedQuizzes.map((quiz: any) => {
            const isPassed = quiz.attempt.status === 'Passed';
            return (
              <Card key={quiz.id} className="shadow-sm border-border flex flex-col hover:shadow-lg transition-shadow group">
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant="outline" className={isPassed ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold' : 'bg-red-500/10 text-red-500 border-red-500/20 font-bold'}>
                      {isPassed ? '✓ Passed' : '✗ Failed'}
                    </Badge>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-foreground">{quiz.attempt.score}</span>
                      <span className="text-sm text-muted-foreground">/{quiz.totalMarks}</span>
                    </div>
                  </div>
                  <CardTitle className="text-base mt-2 group-hover:text-primary transition-colors leading-snug">{quiz.title}</CardTitle>
                  <CardDescription className="text-xs">{quiz.subject}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col gap-1 text-xs">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 flex-1">
                    <div className="flex flex-col"><span className="text-muted-foreground">Question Type</span><span className="font-semibold text-primary">{quiz.questionType}</span></div>
                    <div className="flex flex-col"><span className="text-muted-foreground">Difficulty</span><span className="font-semibold text-foreground">{quiz.difficulty}</span></div>
                    <div className="flex flex-col"><span className="text-muted-foreground">Class Section</span><span className="font-semibold text-foreground">{formatClassName(quiz.className)}</span></div>
                    <div className="flex flex-col"><span className="text-muted-foreground">Evaluated On</span><span className="font-semibold text-foreground">{new Date(quiz.attempt.submissionTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                    <div className="flex flex-col"><span className="text-muted-foreground">Percentage</span><span className={`font-bold ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>{Number(quiz.attempt.percentage).toFixed(1)}%</span></div>
                    <div className="flex flex-col"><span className="text-muted-foreground">Class Rank</span><span className="font-bold text-purple-600 dark:text-purple-400">Rank #{quiz.attempt.classRank || quiz.attempt.rank || 1} / {quiz.attempt.totalStudents || 1}</span></div>
                    <div className="flex flex-col"><span className="text-muted-foreground">Duration</span><span className="font-semibold text-foreground">{quiz.attempt.timeTaken} min</span></div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50">
                    <div className="flex gap-1.5 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">{quiz.attempt.correctAnswers} ✓</span>
                      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">{quiz.attempt.incorrectAnswers} ✗</span>
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">{quiz.attempt.unattemptedQuestions} –</span>
                    </div>
                    <Badge variant="outline" className="text-xs font-extrabold text-primary border-primary/30">{quiz.attempt.grade}</Badge>
                  </div>
                  <Button variant="outline" className="w-full mt-3 gap-2 text-xs h-9 border-primary/30 hover:border-primary hover:bg-primary/5 font-semibold" onClick={() => setViewingResult(quiz)}>
                    <Eye size={14} /> View Complete Analysis
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {viewingResult && (
           <StudentResultModal quiz={viewingResult} onClose={() => setViewingResult(null)} />
        )}
      </AnimatePresence>
      <style>{`
         .input-class {
            width: 100%;
            background-color: hsl(var(--background));
            border: 1px solid hsl(var(--border));
            border-radius: 0.375rem;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            outline: none;
         }
         .input-class:focus {
            box-shadow: 0 0 0 2px hsl(var(--primary) / 0.5);
         }
      `}</style>
    </motion.div>
  );
}

// ==========================================
// STUDENT RESULT MODAL
// ==========================================
function StudentResultModal({ quiz, onClose }: any) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const attemptIdentifier = quiz.attempt?.id || quiz.attemptId || quiz.id;
        if (!attemptIdentifier) {
          throw new Error("Unable to identify quiz attempt record.");
        }
        const data = await quizService.getAttemptAnalysis(attemptIdentifier);
        setAnalysis(data);
      } catch (err: any) {
        console.error("Error loading analysis:", err);
        setError("Could not load deep analysis from server. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [quiz]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col p-4 items-center justify-center bg-background/95 backdrop-blur-md pointer-events-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-8 bg-card rounded-2xl shadow-2xl border border-border text-center max-w-md space-y-4">
          <Loader2 size={48} className="animate-spin text-primary" />
          <h3 className="text-xl font-bold text-foreground">Generating Complete Analysis...</h3>
          <p className="text-sm text-muted-foreground font-medium">Synthesizing AI performance diagnostics, question reviews, and competitive cohort ranking from live database records...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md pointer-events-auto">
        <Card className="max-w-md w-full border-destructive/50 shadow-2xl">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <XCircle size={48} className="text-destructive" />
            <h3 className="text-lg font-bold text-foreground">Analysis Unavailable</h3>
            <p className="text-sm text-muted-foreground">{error || "Could not generate analysis report."}</p>
            <Button onClick={onClose} className="w-full font-bold">Close Window</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const classPerf = analysis.classPerformance || {};
  const ai = analysis.aiAnalysis || {};
  const questionReviews = analysis.questionReviews || [];
  const pct = Number(analysis.percentage ?? 0);
  const isPassed = analysis.passed;

  const scoreData = [
    { name: 'Score', value: pct, fill: isPassed ? '#10B981' : '#EF4444' }
  ];

  const trendData = (analysis.performanceTrend && analysis.performanceTrend.length > 0) ?
    analysis.performanceTrend.map((t: any) => ({
      name: t.name || t.quizTitle,
      score: Number(t.score ?? 0),
      quizTitle: t.quizTitle
    })) : [
      { name: 'Current Attempt', score: Math.round(pct), quizTitle: analysis.quizTitle }
    ];

  const subjectAvgData = [
    { name: 'Your Score', score: Number(analysis.marksObtained ?? 0) },
    { name: 'Class Avg', score: Number(classPerf.classAverage ?? 0) },
    { name: 'Highest', score: Number(classPerf.highestMarks ?? 0) },
    { name: 'Lowest', score: Number(classPerf.lowestMarks ?? 0) }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col p-4 pt-20 sm:p-6 sm:pt-24 overflow-y-auto overflow-x-hidden pointer-events-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/95 backdrop-blur-md pointer-events-auto" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 bg-card w-full max-w-6xl m-auto rounded-2xl shadow-2xl border border-border flex flex-col shrink-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-2xl font-bold text-foreground truncate">{analysis.quizTitle}</h2>
              <Badge variant="outline" className={`shrink-0 text-sm px-3 py-0.5 ${isPassed ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold' : 'bg-red-500/10 text-red-500 border-red-500/20 font-bold'}`}>
                {isPassed ? '✓ Passed' : '✗ Failed'}
              </Badge>
              <Badge variant="outline" className="shrink-0 text-sm px-3 py-0.5 border-primary/30 text-primary font-bold">Grade: {analysis.grade}</Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate font-medium">
              {analysis.subjectName} • Faculty: {analysis.facultyName} • {formatClassName(analysis.className)} • Evaluated on: {new Date(analysis.submittedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"><X size={20} /></Button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 bg-muted/5 space-y-8 max-h-[calc(85vh-90px)] overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* SECTION 1: QUIZ DETAILS */}
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2 font-bold text-foreground"><FileText size={20} className="text-primary" /> 1. Quiz Details & Specification</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm">
                  <div className="flex flex-col p-2.5 rounded-lg bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground text-xs font-medium">Subject</span>
                    <span className="font-bold text-foreground truncate" title={analysis.subjectName}>{analysis.subjectName}</span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-lg bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground text-xs font-medium">Faculty Name</span>
                    <span className="font-bold text-foreground truncate" title={analysis.facultyName}>{analysis.facultyName}</span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-lg bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground text-xs font-medium">Question Type</span>
                    <span className="font-bold text-primary">{analysis.questionType}</span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-lg bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground text-xs font-medium">Difficulty Level</span>
                    <Badge variant="outline" className={`w-fit mt-1 font-bold text-xs ${analysis.difficulty === 'Hard' ? 'text-red-500 border-red-500/30 bg-red-500/5' : analysis.difficulty === 'Medium' ? 'text-amber-500 border-amber-500/30 bg-amber-500/5' : 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5'}`}>
                      {analysis.difficulty}
                    </Badge>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-lg bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground text-xs font-medium">Class / Section</span>
                    <span className="font-bold text-foreground">{formatClassName(analysis.className)}</span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-lg bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground text-xs font-medium">Total Questions</span>
                    <span className="font-bold text-foreground text-base">{analysis.totalQuestions} Items</span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-lg bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground text-xs font-medium">Total Marks</span>
                    <span className="font-bold text-foreground text-base">{analysis.totalMarks} Marks</span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-lg bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground text-xs font-medium">Passing Marks</span>
                    <span className="font-bold text-amber-600 text-base">{analysis.passingMarks} Marks</span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-lg bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground text-xs font-medium">Allotted Duration</span>
                    <span className="font-bold text-foreground text-base">{analysis.durationMinutes} Minutes</span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-lg bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground text-xs font-medium">Final Grade</span>
                    <span className="font-extrabold text-primary text-lg">{analysis.grade}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 2: STUDENT PERFORMANCE STATISTICS */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 px-1">
                <Activity size={20} className="text-emerald-500" /> 2. Student Performance Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border shadow-sm bg-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1 tracking-wider">Marks Obtained</p>
                    <h3 className="text-3xl font-black text-foreground">{analysis.marksObtained}<span className="text-base text-muted-foreground font-semibold"> / {analysis.totalMarks}</span></h3>
                  </CardContent>
                </Card>
                <Card className="border-border shadow-sm bg-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1 tracking-wider">Percentage Score</p>
                    <h3 className={`text-3xl font-black ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>{pct.toFixed(1)}%</h3>
                  </CardContent>
                </Card>
                <Card className="border-border shadow-sm bg-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1 tracking-wider">Time Taken vs Allotted</p>
                    <h3 className="text-2xl font-black text-blue-600 truncate max-w-full">{analysis.timeTakenFormatted}</h3>
                    <span className="text-xs text-muted-foreground mt-0.5 font-medium">out of {analysis.durationMinutes} mins</span>
                  </CardContent>
                </Card>
                <Card className="border-border shadow-sm bg-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1 tracking-wider">Accuracy Rate</p>
                    <h3 className="text-3xl font-black text-purple-600">{Number(analysis.accuracyPercentage).toFixed(0)}%</h3>
                    <span className="text-xs text-muted-foreground mt-0.5 font-medium">{analysis.correctAnswers} of {analysis.attemptedQuestions} correct</span>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Circular Score & Status */}
                <Card className="shadow-sm border-border flex flex-col items-center justify-center p-6 lg:col-span-1">
                  <h3 className="font-bold text-base w-full text-left mb-2 text-foreground">Overall Achievement</h3>
                  <div className="w-full h-48 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={22} data={scoreData} startAngle={90} endAngle={-270}>
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar background={{ fill: 'hsl(var(--muted))' }} dataKey="value" cornerRadius={12} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-4xl font-black text-foreground">{pct.toFixed(0)}%</span>
                      <span className={`text-xs uppercase font-extrabold px-2 py-0.5 rounded-full mt-1 ${isPassed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>{isPassed ? 'PASSED' : 'FAILED'}</span>
                    </div>
                  </div>
                </Card>

                {/* Question Count Stats */}
                <Card className="shadow-sm border-border lg:col-span-1 flex flex-col justify-center p-6 space-y-3">
                  <h3 className="font-bold text-base text-foreground mb-1">Attempt Summary Breakdown</h3>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400"><CheckCircle2 size={18} /> Correct Answers</span>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">{analysis.correctAnswers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="flex items-center gap-2 font-bold text-red-700 dark:text-red-400"><XCircle size={18} /> Incorrect Answers</span>
                    <span className="text-lg font-black text-red-700 dark:text-red-400">{analysis.incorrectAnswers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-500/10 border border-slate-500/20">
                    <span className="flex items-center gap-2 font-bold text-muted-foreground"><Clock size={18} /> Unattempted / Skipped</span>
                    <span className="text-lg font-black text-foreground">{analysis.unattemptedQuestions}</span>
                  </div>
                </Card>
              </div>
            </div>

            {/* SECTION 3: CLASS RANKING & COMPARATIVE INSIGHTS */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 px-1">
                <Trophy size={20} className="text-amber-500" /> 3. Class Ranking & Comparative Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-1 border-amber-500/30 shadow-md bg-gradient-to-br from-amber-500/10 to-orange-500/5 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                  <Trophy size={80} className="absolute -right-4 -bottom-4 text-amber-500/10 transform rotate-12 pointer-events-none" />
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Class Rank</p>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-5xl font-black text-amber-500">#{classPerf.classRank ?? 1}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">out of {classPerf.totalStudents ?? 1} total students</span>
                  <div className="mt-3 w-full bg-amber-500/20 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(10, Number(classPerf.studentPercentile || 90)))}%` }}></div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1.5">{Number(classPerf.studentPercentile || 90).toFixed(1)}th Percentile Standing</span>
                </Card>

                <Card className="md:col-span-3 shadow-sm border-border flex flex-col justify-between p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
                      <span className="text-xs text-muted-foreground font-bold block mb-0.5">Your Score</span>
                      <span className="text-2xl font-extrabold text-primary">{analysis.marksObtained}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <span className="text-xs text-muted-foreground font-bold block mb-0.5">Class Highest</span>
                      <span className="text-2xl font-extrabold text-emerald-600">{classPerf.highestMarks ?? analysis.marksObtained}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                      <span className="text-xs text-muted-foreground font-bold block mb-0.5">Class Average</span>
                      <span className="text-2xl font-extrabold text-blue-600">{classPerf.classAverage ?? analysis.marksObtained}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
                      <span className="text-xs text-muted-foreground font-bold block mb-0.5">Class Lowest</span>
                      <span className="text-2xl font-extrabold text-muted-foreground">{classPerf.lowestMarks ?? analysis.marksObtained}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col sm:flex-row gap-4 items-stretch">
                    <div className="w-full sm:w-1/2 h-44 border border-border/50 rounded-xl p-3 bg-muted/10 flex flex-col">
                      <span className="text-xs font-bold text-muted-foreground mb-2 block">Comparative Mark Distribution</span>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectAvgData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={24}>
                            {subjectAvgData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : index === 1 ? '#3b82f6' : index === 2 ? '#10b981' : '#64748b'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full sm:w-1/2 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-extrabold uppercase text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5"><Sparkles size={14} /> AI Competitive Rank Insight</p>
                        <p className="text-xs font-medium text-foreground leading-relaxed mt-2">{classPerf.aiRankInsights || `You achieved Rank #${classPerf.classRank || 1} out of ${classPerf.totalStudents || 1} candidates in this evaluation.`}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground italic mt-3">Calculated via live synchronous evaluation against peer attempts in {formatClassName(analysis.className)}.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* SECTION 4: AI-POWERED PERFORMANCE ANALYSIS & HISTORICAL TRENDS */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 px-1">
                <BrainCircuit size={20} className="text-indigo-500" /> 4. AI-Powered Performance Analysis & Trends
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Historical Trend Graph */}
                <Card className="shadow-sm border-border flex flex-col lg:col-span-4">
                  <CardHeader className="pb-2"><CardTitle className="text-base font-bold flex items-center gap-2"><TrendingUp size={18} className="text-primary"/> Historical Trend</CardTitle></CardHeader>
                  <CardContent className="h-64 flex-1 flex flex-col justify-center pt-2">
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={trendData} margin={{ top: 10, right: 15, left: -20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="quizTitle" interval={0} angle={-25} textAnchor="end" fontSize={10} tickLine={false} axisLine={false} height={40} />
                        <YAxis domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 8, fontSize: 12 }} formatter={(value) => [`${value}%`, 'Percentage']} />
                        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <p className="text-[11px] text-muted-foreground text-center mt-1">Comparison across all completed assessments in your portfolio.</p>
                  </CardContent>
                </Card>

                {/* AI Diagnostics */}
                <Card className="border-indigo-500/30 shadow-lg bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-card flex flex-col h-full lg:col-span-8 overflow-hidden">
                  <CardHeader className="border-b border-indigo-500/10 pb-3.5 bg-indigo-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-base">
                        <BrainCircuit size={22} className="animate-pulse" />
                        <span>AI Deep Academic Synthesis</span>
                      </div>
                      <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/30 text-xs font-bold">100% Dynamic DB Analytics</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 flex flex-col space-y-4 text-sm">
                    
                    {/* Summary */}
                    <div className="p-4 bg-background/80 backdrop-blur-sm border border-indigo-500/20 rounded-xl shadow-inner leading-relaxed text-foreground font-semibold text-sm">
                      <p className="text-[11px] uppercase font-bold text-indigo-500 mb-1 flex items-center gap-1"><Sparkles size={13} /> Executive Performance Summary</p>
                      {ai.summary || `Student obtained ${analysis.marksObtained}/${analysis.totalMarks} (${pct}%) with an accuracy of ${Number(analysis.accuracyPercentage).toFixed(1)}% across attempted items.`}
                    </div>

                    {/* Strengths and Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-emerald-500/30 rounded-xl bg-emerald-500/10 flex flex-col shadow-sm">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-extrabold mb-2 flex items-center gap-1.5"><CheckCircle2 size={16}/> Strong Topics & Competencies</p>
                        <p className="font-medium text-xs text-foreground/90 leading-relaxed flex-1">{ai.strongTopics || (analysis.correctAnswers > 0 ? `Successfully demonstrated proficiency in ${analysis.correctAnswers} concepts in ${analysis.subjectName}.` : "Continued conceptual review recommended.")}</p>
                      </div>
                      <div className="p-4 border border-red-500/30 rounded-xl bg-red-500/10 flex flex-col shadow-sm">
                        <p className="text-xs text-red-700 dark:text-red-400 uppercase tracking-wider font-extrabold mb-2 flex items-center gap-1.5"><AlertTriangle size={16}/> Weak Areas & Knowledge Gaps</p>
                        <p className="font-medium text-xs text-foreground/90 leading-relaxed flex-1">{ai.weakTopics || (analysis.incorrectAnswers > 0 ? `Identified foundational gaps in ${analysis.incorrectAnswers} incorrect questions. Review solution rationale.` : "No conceptual weaknesses detected among attempted items.")}</p>
                      </div>
                    </div>

                    {/* Frequently Missed Concepts & Difficulty */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 border border-purple-500/20 rounded-xl bg-purple-500/5">
                        <p className="text-xs text-purple-600 uppercase tracking-wider font-extrabold mb-1.5 flex items-center gap-1"><FileQuestion size={15}/> Pattern & Error Analysis</p>
                        <p className="font-medium text-xs text-foreground/90 leading-relaxed">{ai.frequentlyMissedConcepts || `Analysis of incorrect items shows adherence to time limits with ${analysis.unattemptedQuestions} unanswered questions.`}</p>
                      </div>
                      <div className="p-3.5 border border-blue-500/20 rounded-xl bg-blue-500/5">
                        <p className="text-xs text-blue-600 uppercase tracking-wider font-extrabold mb-1.5 flex items-center gap-1"><Clock size={15}/> Rigor & Time Efficiency</p>
                        <p className="font-medium text-xs text-foreground/90 leading-relaxed">{ai.difficultyAnalysis || `Handled ${analysis.difficulty} rigor level comfortably within ${analysis.timeTakenFormatted}.`}</p>
                      </div>
                    </div>

                    {/* Actionable Recommendations & Study Strategy */}
                    <div className="p-4 border border-indigo-500/30 rounded-xl bg-background/70 space-y-3">
                      <div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-extrabold mb-1 flex items-center gap-1.5"><BookOpen size={15}/> Actionable Study Recommendations</p>
                        <p className="text-xs text-foreground font-medium leading-relaxed">{ai.learningRecommendations || `Revisit course notes and lecture materials for ${analysis.subjectName} with timed self-evaluations.`}</p>
                      </div>
                      <div className="pt-2 border-t border-indigo-500/10">
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-extrabold mb-1 flex items-center gap-1.5"><Target size={15}/> Recommended Revision Strategy</p>
                        <p className="text-xs text-foreground font-medium leading-relaxed whitespace-pre-line">{ai.studyStrategy || "1. Review correct answers in the Question Review table.\n2. Practice sample problems from recent lectures.\n3. Validate comprehension before upcoming midterms."}</p>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SECTION 5: QUESTION-BY-QUESTION REVIEW */}
            <div className="space-y-4 pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center justify-between flex-wrap gap-2 px-1">
                <span className="flex items-center gap-2"><FileQuestion size={20} className="text-primary" /> 5. Comprehensive Question-by-Question Review</span>
                <div className="flex gap-2 text-xs font-mono">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-extrabold border border-emerald-500/30">✓ Correct: {analysis.correctAnswers}</span>
                  <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 font-extrabold border border-red-500/30">✗ Incorrect: {analysis.incorrectAnswers}</span>
                  <span className="px-3 py-1 rounded-full bg-slate-500/10 text-muted-foreground font-extrabold border border-border">– Skipped: {analysis.unattemptedQuestions}</span>
                </div>
              </h3>
              
              <Card className="shadow-sm border-border overflow-hidden">
                <CardContent className="p-0">
                  {questionReviews.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground font-medium">No question items available for this evaluation record.</div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {questionReviews.map((q: any, idx: number) => {
                        const isCorrect = q.status === 'correct';
                        const isIncorrect = q.status === 'incorrect';

                        return (
                          <div key={idx} className={`p-5 flex gap-4 items-start transition-colors ${isCorrect ? 'bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]' : isIncorrect ? 'bg-red-500/[0.04] hover:bg-red-500/[0.08]' : 'bg-muted/20 hover:bg-muted/30'}`}>
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base font-bold shadow-sm ${
                              isCorrect ? 'bg-emerald-500 text-white' :
                              isIncorrect ? 'bg-red-500 text-white' :
                              'bg-slate-400 text-white'
                            }`}>
                              {isCorrect ? <CheckCircle2 size={18} /> : isIncorrect ? <XCircle size={18} /> : <span>–</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-foreground px-2 py-0.5 rounded bg-muted/50 border border-border/50">Q{q.questionNumber || idx + 1}</span>
                                  <Badge variant="outline" className={`text-xs font-bold uppercase px-2.5 py-0.5 ${
                                    isCorrect ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                                    isIncorrect ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                    'bg-slate-500/10 text-muted-foreground border-border'
                                  }`}>
                                    {isCorrect ? '✓ Correct Answer' : isIncorrect ? '✗ Incorrect Answer' : '– Unattempted / Skipped'}
                                  </Badge>
                                  <span className="text-xs font-semibold text-muted-foreground border-l border-border pl-2">{q.questionType || 'MCQ'}</span>
                                </div>
                                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md border ${isCorrect ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
                                  Marks Awarded: {q.marksAwarded} / {q.maximumMarks}
                                </span>
                              </div>
                              
                              <p className="text-base font-bold text-foreground mb-3 leading-relaxed">{q.questionText}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-medium">
                                <div className={`p-3 rounded-xl border shadow-sm flex flex-col justify-between ${
                                  isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' :
                                  isIncorrect ? 'bg-red-500/10 border-red-500/30' :
                                  'bg-muted/40 border-border'
                                }`}>
                                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-bold mb-1">Your Submitted Answer:</span>
                                  <span className={`text-sm font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : isIncorrect ? 'text-red-700 dark:text-red-400' : 'text-muted-foreground italic'}`}>
                                    {q.studentAnswer || '— No option selected —'}
                                  </span>
                                </div>

                                <div className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 shadow-sm flex flex-col justify-between">
                                  <span className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block font-bold mb-1">Official Correct Answer Key:</span>
                                  <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                                    {q.correctAnswer}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-card flex justify-end gap-3 shrink-0">
          <Button variant="default" className="font-bold px-6 shadow-md" onClick={onClose}>Close Comprehensive Analysis</Button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// QUIZ INTERFACE (Mock Test view)
// ==========================================
function QuizInterface({ quiz, onFinish, onClose }: any) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState((quiz.duration || quiz.durationMinutes || 30) * 60);
  
  // Maps question ID (or index string as fallback) to answer given (option ID or text)
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});

  const answersRef = useRef<Record<string, string>>({});
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    async function loadQ() {
      try {
        setLoading(true);
        let data;
        try {
          data = await quizService.startQuiz(quiz.id);
        } catch (startErr) {
          console.warn('Start quiz fallback to getQuestions:', startErr);
          data = await quizService.getQuestions(quiz.id);
        }
        setQuestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load assessment questions:', err);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }
    loadQ();
  }, [quiz.id]);

  const executeSubmission = async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    try {
      setSubmitting(true);
      await quizService.submitQuiz(quiz.id, answersRef.current);
    } catch (err) {
      console.error('Submission error:', err);
      hasSubmittedRef.current = false;
    } finally {
      setSubmitting(false);
      onFinish();
    }
  };

  const handleManualSubmitClick = () => {
    setShowConfirmSubmit(true);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          executeSubmission(); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz.id]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalQ = questions.length;
  const currentQ = questions[currentQIndex] || {};
  const currentQKey = currentQ.id || String(currentQIndex);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
       {showConfirmSubmit && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
           <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
             <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
               <AlertTriangle className="text-amber-500" /> Confirm Submission
             </h3>
             <p className="text-sm text-muted-foreground leading-relaxed">
               You are about to submit your test before the timer expires. You have answered <span className="font-bold text-foreground">{Object.keys(answers).length}</span> of <span className="font-bold text-foreground">{totalQ}</span> questions.
             </p>
             <div className="flex justify-end gap-3 pt-2">
               <Button variant="outline" onClick={() => setShowConfirmSubmit(false)} disabled={submitting}>
                 Continue Test
               </Button>
               <Button variant="destructive" onClick={() => { setShowConfirmSubmit(false); executeSubmission(); }} disabled={submitting} className="gap-2 font-semibold">
                 <Send size={16} /> {submitting ? 'Submitting...' : 'Confirm & Submit'}
               </Button>
             </div>
           </div>
         </div>
       )}

       <header className="h-16 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-bold text-foreground text-lg">{quiz.title}</h1>
            <p className="text-xs text-muted-foreground">Subject: {quiz.subjectName || mockData.subjects.find(s => s.id === quiz.subjectId)?.name || 'LMS Assessment'}</p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm font-bold ${timeLeft < 300 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-primary/10 text-primary'}`}>
               <Timer size={16} /> {formatTime(timeLeft)}
            </div>
            <Button variant="destructive" onClick={handleManualSubmitClick} disabled={submitting || loading} size="sm" className="hidden sm:flex gap-2">
              <Send size={16}/> {submitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          </div>
       </header>

       <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
         <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-muted/10 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground font-semibold animate-pulse">
                Loading encrypted assessment questions...
              </div>
            ) : totalQ === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <p className="text-muted-foreground font-medium text-lg">No database questions have been attached to this assessment yet by the faculty.</p>
                <Button variant="outline" onClick={onClose || onFinish} className="mt-4">Close</Button>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                 {(quiz.description || quiz.instructions) && (
                   <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground flex items-start gap-3 shadow-xs">
                     <FileText size={18} className="text-primary shrink-0 mt-0.5" />
                     <div>
                       <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-0.5">Assessment Instructions</h4>
                       <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{quiz.description || quiz.instructions}</p>
                     </div>
                   </div>
                 )}

                 <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2.5">
                     <h2 className="text-xl font-bold text-foreground">Question {currentQIndex + 1} <span className="text-muted-foreground text-sm font-normal">of {totalQ}</span></h2>
                     <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold">{currentQ.questionType || 'MCQ'}</Badge>
                   </div>
                   <Badge variant="outline" className="bg-background font-bold">Marks: {currentQ.marks || (quiz.totalMarks ? (quiz.totalMarks/totalQ).toFixed(0) : 2)}</Badge>
                 </div>
                 
                 <Card className="border-border shadow-sm">
                   <CardContent className="p-6 text-base sm:text-lg text-foreground leading-relaxed font-medium">
                     {currentQ.questionText || currentQ.question || 'Question Statement'}
                   </CardContent>
                 </Card>

                 {(currentQ.options && currentQ.options.length > 0) || currentQ.questionType === 'True/False' ? (
                   <div className="space-y-3">
                     {(currentQ.options && currentQ.options.length > 0 ? currentQ.options : [
                       { id: 'True', text: 'True' },
                       { id: 'False', text: 'False' }
                     ]).map((opt: any, i: number) => {
                       const optId = opt.id || String.fromCharCode(65 + i);
                       const isSelected = answers[currentQKey] === optId;
                       return (
                         <div 
                           key={i} 
                           onClick={() => setAnswers(prev => ({ ...prev, [currentQKey]: optId }))}
                           className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30' : 'border-border bg-card hover:border-primary/40'}`}
                         >
                           <div className="flex items-center gap-3">
                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-primary bg-primary/20' : 'border-muted-foreground/50'}`}>
                               {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                             </div>
                             <span className="font-bold text-xs text-primary">{optId}:</span>
                             <span className={isSelected ? 'font-semibold text-foreground text-sm sm:text-base' : 'text-muted-foreground text-sm sm:text-base'}>{opt.text || String(opt)}</span>
                           </div>
                         </div>
                       )
                     })}
                   </div>
                 ) : currentQ.questionType === 'Fill in the Blanks' ? (
                   <div className="space-y-3 pt-2">
                     <label className="text-sm font-semibold text-muted-foreground">Fill in the Blank Answer:</label>
                     <input 
                       type="text"
                       className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl text-foreground text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-sm transition-all" 
                       placeholder="Type the exact missing word or phrase..."
                       value={answers[currentQKey] || ''}
                       onChange={e => setAnswers(prev => ({ ...prev, [currentQKey]: e.target.value }))}
                     />
                   </div>
                 ) : (
                   <div className="space-y-3 pt-2">
                     <label className="text-sm font-semibold text-muted-foreground">Your Solution / Conceptual Answer:</label>
                     <textarea 
                       className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground text-sm min-h-[120px] focus:ring-2 focus:ring-primary/50 outline-none shadow-sm custom-scrollbar" 
                       placeholder="Type your explanation or short answer here..."
                       value={answers[currentQKey] || ''}
                       onChange={e => setAnswers(prev => ({ ...prev, [currentQKey]: e.target.value }))}
                     />
                   </div>
                 )}
              </div>
            )}
         </div>

         <div className="w-full md:w-80 bg-card border-l border-border flex flex-col shrink-0">
           <div className="p-4 border-b border-border bg-muted/20">
             <h3 className="font-semibold text-sm">Question Palette</h3>
           </div>
           <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
             <div className="grid grid-cols-5 gap-2">
               {Array.from({length: totalQ}).map((_, i) => {
                 const qItem = questions[i] || {};
                 const key = qItem.id || String(i);
                 const isAnswered = answers[key] !== undefined && answers[key] !== '';
                 const isMarked = markedForReview[i];
                 const isCurrent = currentQIndex === i;
                 return (
                   <button 
                     key={i} 
                     onClick={() => setCurrentQIndex(i)}
                     className={`h-10 w-full rounded-md text-sm font-medium transition-colors relative flex justify-center items-center ${
                       isCurrent ? 'ring-2 ring-primary ring-offset-1 ring-offset-background font-extrabold' : ''
                     } ${
                       isMarked ? 'bg-amber-500/20 text-amber-600 border border-amber-500/40 font-bold' : 
                       isAnswered ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 font-bold' : 
                       'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                     }`}
                   >
                     {i + 1}
                     {isMarked && <Flag size={10} className="absolute -top-1 -right-1 text-amber-500 fill-amber-500" />}
                   </button>
                 )
               })}
             </div>
             <div className="mt-8 space-y-3">
               <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/40" /> Answered</div>
               <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/40" /> Marked for Review</div>
               <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-3 rounded-sm bg-muted border border-border" /> Not Visited / Answered</div>
             </div>
           </div>

           <div className="p-4 border-t border-border bg-card space-y-3">
             <div className="flex gap-2">
               <Button variant="outline" className="flex-1 text-xs" onClick={() => setCurrentQIndex(p => Math.max(0, p - 1))} disabled={currentQIndex === 0}>Previous</Button>
               <Button variant="outline" className="flex-1 text-xs" onClick={() => setCurrentQIndex(p => Math.min(totalQ - 1, p + 1))} disabled={currentQIndex === totalQ - 1}>Next</Button>
             </div>
             <Button 
                variant="secondary" 
                className="w-full gap-2 text-xs h-9" 
                onClick={() => setMarkedForReview(prev => ({...prev, [currentQIndex]: !prev[currentQIndex]}))}
             >
                <Flag size={15} className={markedForReview[currentQIndex] ? 'fill-foreground' : ''} />
                {markedForReview[currentQIndex] ? 'Unmark Review' : 'Mark for Review'}
             </Button>
             <Button variant="destructive" className="w-full sm:hidden mt-2" onClick={handleManualSubmitClick} disabled={submitting || loading}>
               {submitting ? 'Submitting...' : 'Submit Quiz'}
             </Button>
           </div>
         </div>
       </div>
    </div>
  )
}
