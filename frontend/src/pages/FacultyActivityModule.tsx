import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  CheckCircle, XCircle, AlertTriangle, Sun, X, ChevronDown, Search, 
  Users, BookOpen, User as UserIcon, Mail, Plus
} from 'lucide-react';
import { 
  subjectAssignments, mockActivityRecords,
  yearOptions, semOptions, classOptions,
  holidayReasonOptions, absenceReasonOptions
} from '../data/facultyActivityData';
import { mockData } from '../data/mockData';
import { AdminTeachingHistory } from './AttendanceModule';
import { profileService } from '../services/profileService';
import api from '../services/api';

/* ───── MultiSelect Dropdown ───── */
const MultiSelect = ({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) => {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    const closeMenu = () => setOpen(false);
    window.addEventListener('close-dropdowns', closeMenu);
    return () => window.removeEventListener('close-dropdowns', closeMenu);
  }, []);

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };
  return (
    <div className="space-y-1.5 relative">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full h-10 px-3 text-sm rounded-lg border border-border bg-background hover:border-primary/50 transition-colors">
        <span className="truncate text-left">{selected.length > 0 ? `${selected.length} selected` : `All ${label}s`}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 min-w-full bg-popover border border-border rounded-lg shadow-xl z-50 max-h-[300px] overflow-y-auto">
            {options.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-3 py-2 hover:bg-accent/50 cursor-pointer text-sm whitespace-nowrap">
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)}
                  className="w-3.5 h-3.5 rounded border-border text-primary shrink-0" />
                {opt}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- Main Module ---
export const FacultyActivityModule = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('name-asc');
  const [activeTab, setActiveTab] = useState<'directory' | 'teachingHistory'>('directory');
  
  const [selectedFaculty, setSelectedFaculty] = useState<any | null>(null);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [apiFacultyData, setApiFacultyData] = useState<any[]>([]);
  const [apiActivityRecords, setApiActivityRecords] = useState<any[]>([]);

  const fetchFacultySummary = async () => {
    try {
      const res = await api.get('/v1/faculty-summary');
      setApiFacultyData(res.data);
      const activityRes = await api.get('/faculty-activities');
      setApiActivityRecords(activityRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch faculty summary or activities', err);
    }
  };

  useEffect(() => {
    fetchFacultySummary();
    window.addEventListener('sync-attendance-data', fetchFacultySummary);
    return () => window.removeEventListener('sync-attendance-data', fetchFacultySummary);
  }, []);

  useEffect(() => {
    if (showMarkAttendance || selectedFaculty) {
      window.dispatchEvent(new Event('close-dropdowns'));
    }
  }, [showMarkAttendance, selectedFaculty]);

  // Permission Logic
  const visibleFacultyIds = useMemo(() => {
    if (!user) return new Set<string>();
    
    // HOD sees all
    if (user.role && user.role.toLowerCase() === 'hod') {
      return new Set(apiFacultyData.map((a: any) => a.id));
    }
    
    // Coordinator sees only faculty assigned to their managed classes
    if (user.role && user.role.toLowerCase() === 'coordinator') {
      const managedClassIds = user.classes || [];
      const managedClassObjects = managedClassIds.map(id => mockData.classes.find(c => c.id === id)).filter(Boolean);
      const managedClassNames = managedClassObjects.map(c => c?.name);
      
      const validIds = new Set<string>();
      apiFacultyData.forEach(faculty => {
        const hasManagedClass = faculty.assignedClasses.some((c: string) => managedClassNames.includes(c));
        if (hasManagedClass) {
          validIds.add(faculty.id);
        }
      });
      // Coordinator can also see their own activity
      validIds.add(user.id);
      return validIds;
    }
    
    return new Set<string>();
  }, [user, apiFacultyData]);

  // Derive all possible subjects from apiFacultyData for the filter
  const allSubjects = useMemo(() => {
    const subjects = new Set<string>();
    apiFacultyData.forEach(f => f.assignedSubjects.forEach((s: string) => subjects.add(s)));
    return Array.from(subjects);
  }, [apiFacultyData]);

  // Compute Faculty Data
  const facultyData = useMemo(() => {
    return apiFacultyData
      .filter(faculty => visibleFacultyIds.has(faculty.id))
      .map(faculty => {
        const records = apiActivityRecords.filter(r => r.facultyId === faculty.id);
        
        return {
          ...faculty,
          totalScheduled: faculty.totalScheduled || 0,
          classesTaken: faculty.classesTaken || 0,
          classesMissed: faculty.classesMissed || 0,
          absent: faculty.absent || 0,
          holidays: faculty.holidays || 0,
          teachingAttendance: faculty.teachingAttendance || 0,
          status: faculty.status || 'Inactive',
          records
        };
      });
  }, [visibleFacultyIds, apiFacultyData, apiActivityRecords]);

  // Filter & Sort
  const filteredFaculty = useMemo(() => {
    let result = facultyData;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => 
        (f.name && f.name.toLowerCase().includes(q)) || 
        (f.employeeId && f.employeeId.toLowerCase().includes(q)) || 
        (f.email && f.email.toLowerCase().includes(q)) ||
        (f.role && f.role.toLowerCase().includes(q))
      );
    }

    // Filters
    if (academicYears.length > 0) result = result.filter(f => f.assignedYears.some(y => academicYears.includes(y)));
    if (semesters.length > 0) result = result.filter(f => f.assignedSems.some(s => semesters.includes(s)));
    if (classes.length > 0) result = result.filter(f => f.assignedClasses.some(c => classes.includes(c)));
    if (subjects.length > 0) result = result.filter(f => f.assignedSubjects.some(s => subjects.includes(s)));
    if (statusFilter.length > 0) result = result.filter(f => statusFilter.includes(f.status));

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'highest-attendance') return b.teachingAttendance - a.teachingAttendance;
      if (sortBy === 'lowest-attendance') return a.teachingAttendance - b.teachingAttendance;
      if (sortBy === 'recently-active') {
        const lastA = a.records.length > 0 ? Math.max(...a.records.map((r:any) => new Date(r.date).getTime())) : 0;
        const lastB = b.records.length > 0 ? Math.max(...b.records.map((r:any) => new Date(r.date).getTime())) : 0;
        return lastB - lastA;
      }
      return 0;
    });

    return result;
  }, [facultyData, searchQuery, academicYears, semesters, classes, subjects, statusFilter, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setAcademicYears([]);
    setSemesters([]);
    setClasses([]);
    setSubjects([]);
    setStatusFilter([]);
    setSortBy('name-asc');
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Present': return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0"><CheckCircle size={12} className="mr-1" />Present</Badge>;
      case 'Absent': return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0"><XCircle size={12} className="mr-1" />Absent</Badge>;
      case 'Class Missed': return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0"><AlertTriangle size={12} className="mr-1" />Missed</Badge>;
      case 'Holiday': return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-0"><Sun size={12} className="mr-1" />Holiday</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Faculty Activity Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and analyze faculty teaching activities, attendance, and assignments.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
            <button 
              onClick={() => setActiveTab('directory')} 
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all flex-1 sm:flex-none flex items-center gap-2 justify-center ${activeTab === 'directory' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              📁 Activity Directory
            </button>
            <button 
              onClick={() => setActiveTab('teachingHistory')} 
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all flex-1 sm:flex-none flex items-center gap-2 justify-center ${activeTab === 'teachingHistory' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              📖 Teaching History
            </button>
          </div>
          {user?.role !== 'student' && (
            <Button onClick={() => setShowMarkAttendance(true)} className="gap-2 shrink-0 shadow-sm bg-primary text-white hover:bg-primary/90">
              <Plus size={16} /> Mark Attendance
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'directory' && (
        <>
          {/* Top Search & Filter Bar */}
      <Card className="border-border shadow-sm relative z-30 !overflow-visible">
        <CardContent className="p-4 space-y-4 !overflow-visible">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full md:w-96">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, employee ID, or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-10" />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Sort By:</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-10 px-3 rounded-lg border border-border bg-background text-sm flex-1 md:w-56">
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="recently-active">Recently Active</option>
                <option value="highest-attendance">Highest Teaching Attendance</option>
                <option value="lowest-attendance">Lowest Teaching Attendance</option>
              </select>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Faculty Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredFaculty.map(faculty => (
          <Card key={faculty.id} className="overflow-hidden border-border/60 bg-card hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col relative">
            
            {/* Top decorative gradient bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary/80 via-indigo-500/80 to-purple-500/80 absolute top-0 left-0 z-10" />

            <CardHeader className="p-5 pb-4 border-b border-border/40 relative bg-gradient-to-b from-muted/30 to-transparent">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img src={`https://ui-avatars.com/api/?name=${faculty.name.replace(/ /g,'+')}&background=4F46E5&color=fff&size=64`} alt={faculty.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-background shadow-md group-hover:scale-105 transition-transform duration-300" />
                  <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card ${faculty.status === 'Active' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                </div>
                <div className="pt-1 flex-1 pr-14">
                  <CardTitle className="text-lg font-bold text-foreground leading-tight">{faculty.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className="font-mono text-[10px] bg-background/50">{faculty.employeeId || 'N/A'}</Badge>
                    {faculty.role && <Badge variant="secondary" className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary border-primary/20">{faculty.role}</Badge>}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5 flex-1 bg-card">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground bg-muted/20 p-2 rounded-lg border border-border/40">
                  <Mail size={14} className="shrink-0 text-primary/70" /> <span className="truncate font-medium">{faculty.email}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {faculty.assignedYears.map(y => <Badge key={y} variant="outline" className="text-[9px] uppercase bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">{y}</Badge>)}
                  {faculty.assignedSems.map(s => <Badge key={s} variant="outline" className="text-[9px] uppercase bg-violet-50/50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800">{s}</Badge>)}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {faculty.assignedClasses.map(c => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}
                  {faculty.assignedSubjects.map(s => <Badge key={s} variant="outline" className="text-[10px] text-muted-foreground border-dashed">{s}</Badge>)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/40">
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-primary/10 border border-primary/20 transition-colors">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Scheduled</p>
                  <p className="text-xl font-bold text-primary leading-none">{faculty.totalScheduled}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-success/10 border border-success/20 transition-colors">
                  <p className="text-[10px] font-bold text-success uppercase tracking-wider mb-1">Taken</p>
                  <p className="text-xl font-bold text-success leading-none">{faculty.classesTaken}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-destructive/10 border border-destructive/20 transition-colors">
                  <p className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-1">Missed</p>
                  <p className="text-xl font-bold text-destructive leading-none">{faculty.classesMissed}</p>
                </div>
              </div>
              
              <div className="pt-1">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Teaching Attendance</span>
                  <span className="text-sm font-black text-primary">{faculty.teachingAttendance}%</span>
                </div>
                <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden shadow-inner backdrop-blur-sm relative">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${faculty.teachingAttendance}%` }} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 gap-3 border-t border-border/40 bg-muted/5 mt-auto">
              <Button variant="default" className="flex-1 shadow-sm hover:shadow-md transition-all group/btn" onClick={() => setSelectedFaculty(faculty)}>
                <BookOpen size={16} className="mr-2 group-hover/btn:-translate-y-0.5 transition-transform" /> View Activity
              </Button>
              <Button variant="outline" size="icon" className="shrink-0 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors" title="View Profile">
                <UserIcon size={18} />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredFaculty.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border">
          <Users size={48} className="mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-foreground">No faculty found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
        </div>
      )}
      </>
      )}

      {activeTab === 'teachingHistory' && (
        <AdminTeachingHistory />
      )}

      {/* Activity Details Modal */}
      <AnimatePresence>
        {selectedFaculty && (
          <ActivityModal 
            faculty={selectedFaculty} 
            onClose={() => setSelectedFaculty(null)} 
          />
        )}
      </AnimatePresence>

      {/* Mark Attendance Modal */}
      <AnimatePresence>
        {showMarkAttendance && (
          <MarkAttendanceModal 
            isOpen={showMarkAttendance}
            onClose={() => setShowMarkAttendance(false)}
            user={user}
            statusBadge={statusBadge}
            onSuccess={() => window.dispatchEvent(new Event('sync-attendance-data'))}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ───── Detailed Activity Modal ───── */
const ActivityModal = ({ faculty, onClose }: { faculty: any, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-border bg-card sticky top-0 z-20 shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <img src={`https://ui-avatars.com/api/?name=${faculty.name.replace(/ /g,'+')}&background=4F46E5&color=fff&size=64`} alt="" className="w-14 h-14 rounded-full ring-2 ring-border shadow-sm" />
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center flex-wrap gap-2">
                {faculty.name} 
                <Badge variant="outline" className="font-mono text-xs">{faculty.employeeId || 'N/A'}</Badge>
                {faculty.role && <Badge variant="secondary" className="text-xs">{faculty.role}</Badge>}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center flex-wrap gap-2 mt-1">
                <span className="flex items-center gap-1"><Mail size={12}/> {faculty.email}</span>
                <span className="text-border">•</span>
                <span className="flex gap-1 flex-wrap">
                  {faculty.assignedYears?.map((y:string) => <Badge key={y} variant="secondary" className="text-[9px] uppercase px-1.5 py-0">{y}</Badge>)}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive transition-colors"><X size={20} /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10">
          <AdminTeachingHistory readOnlyFacultyId={faculty.id} />
        </div>
      </motion.div>
    </div>
  );
};

/* ───── Mark Attendance Modal ───── */
export const MarkAttendanceModal = ({ isOpen, onClose, user, onSuccess }: { isOpen: boolean, onClose: () => void, user: any, statusBadge?: any, onSuccess?: () => void }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [type, setType] = useState<'Activity' | 'Holiday'>('Activity');
  const [holidayReason, setHolidayReason] = useState('');
  const [customHolidayReason, setCustomHolidayReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch real assigned subjects
  const [subjectsToMark, setSubjectsToMark] = useState<any[]>([]);
  const [subjectData, setSubjectData] = useState<any[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      setSuccessMsg('');
      setErrorMsg('');
      setDate(new Date().toISOString().split('T')[0]);
      setType('Activity');
      profileService.getFacultyAssignedSubjects().then((data) => {
        setSubjectsToMark(data);
        setSubjectData(data.map((s: any) => ({
          ...s,
          status: 'Present',
          reason: '',
          selected: false
        })));
      }).catch(err => {
        console.error("Failed to fetch assigned subjects", err);
      });
    }
  }, [isOpen]);

  const [bulkStatus, setBulkStatus] = useState('Present');
  const [bulkReason, setBulkReason] = useState('');

  const handleBulkApply = () => {
    setSubjectData(prev => prev.map(s => s.selected ? { ...s, status: bulkStatus, reason: bulkReason } : s));
  };

  const toggleSelectAll = () => {
    const allSelected = subjectData.length > 0 && subjectData.every(s => s.selected);
    setSubjectData(prev => prev.map(s => ({ ...s, selected: !allSelected })));
  };

  const toggleSelect = (idx: number) => {
    setSubjectData(prev => prev.map((s, i) => i === idx ? { ...s, selected: !s.selected } : s));
  };

  const updateSubject = (idx: number, field: string, value: string) => {
    setSubjectData(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    setErrorMsg('');
    
    if (type === 'Activity') {
      const selectedSubjects = subjectData.filter(s => s.selected);
      if (selectedSubjects.length === 0) {
        setErrorMsg("Please select at least one subject to mark attendance.");
        return;
      }
      
      const invalid = selectedSubjects.find(s => (s.status === 'Absent' || s.status === 'Class Missed') && !s.reason);
      if (invalid) {
        setErrorMsg("Please enter a reason for all Absent or Missed classes.");
        return;
      }
      
      try {
        const payload = {
          activities: selectedSubjects.map(s => ({
            classSubjectId: s.id,
            date: date,
            status: s.status === 'Present' ? 'PRESENT' : s.status === 'Missed' ? 'CLASS_MISSED' : 'ABSENT',
            reason: s.reason || ''
          }))
        };
        await api.post('/faculty-activities/bulk', payload);

        // Automatically generate AI attendance sessions for missed/absent classes
        const missedSubjects = selectedSubjects.filter(s => s.status === 'Absent' || s.status === 'Missed');
        for (const s of missedSubjects) {
          try {
            await api.post(`/attendance-sessions/faculty/${user?.id}/ai-generate-session?classSubjectId=${s.id}`);
          } catch (err) {
            console.error("Failed to auto-generate AI session for subject " + s.id, err);
          }
        }

        setSuccessMsg("Attendance saved successfully!");
        if (typeof onSuccess === 'function') onSuccess();
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1500);
      } catch (err: any) {
        setErrorMsg("Failed to save attendance: " + (err?.response?.data?.message || err.message));
        return;
      }
    }

    if (type === 'Holiday') {
      if (!holidayReason) {
        setErrorMsg("Please select a reason for the holiday.");
        return;
      }
      if (holidayReason === 'Other' && !customHolidayReason) {
        setErrorMsg("Please type a custom reason for the holiday.");
        return;
      }
      try {
        const payload = {
          activities: [{
            classSubjectId: null,
            date: date,
            status: 'HOLIDAY',
            reason: holidayReason === 'Other' ? customHolidayReason : holidayReason
          }]
        };
        await api.post('/faculty-activities/bulk', payload);

        // Automatically generate AI attendance sessions for all assigned subjects on holiday
        for (const s of subjectsToMark) {
          try {
            await api.post(`/attendance-sessions/faculty/${user?.id}/ai-generate-session?classSubjectId=${s.id}`);
          } catch (err) {
            console.error("Failed to auto-generate AI session for subject " + s.id, err);
          }
        }

        setSuccessMsg("Holiday marked successfully!");
        if (typeof onSuccess === 'function') onSuccess();
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1500);
      } catch (err: any) {
         setErrorMsg("Failed to save holiday: " + (err?.response?.data?.message || err.message));
         return;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden relative">
        
        <div className="flex items-center justify-between p-6 border-b border-border bg-card">
          <h2 className="text-xl font-bold text-foreground">Mark Attendance</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"><X size={20} /></Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {successMsg ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle size={64} className="text-emerald-500" />
              <h3 className="text-xl font-bold text-foreground">{successMsg}</h3>
            </div>
          ) : (
            <div className="space-y-6">
              {errorMsg && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  {errorMsg}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Date</label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="space-y-2 flex items-end">
                  <div className="flex gap-4 p-1 bg-muted rounded-lg w-full">
                    <Button variant={type === 'Activity' ? 'default' : 'ghost'} onClick={() => setType('Activity')} className="flex-1">Mark Activity</Button>
                    <Button variant={type === 'Holiday' ? 'default' : 'ghost'} onClick={() => setType('Holiday')} className="flex-1">Holiday</Button>
                  </div>
                </div>
              </div>

              {type === 'Holiday' ? (
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Holiday Reason</label>
                    <select value={holidayReason} onChange={e => setHolidayReason(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
                      <option value="">Select Reason</option>
                      {holidayReasonOptions.map(r => <option key={r} value={r}>{r}</option>)}
                      <option value="Other">Other (Please specify)</option>
                    </select>
                  </div>
                  {holidayReason === 'Other' && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">Custom Reason</label>
                      <Input placeholder="Enter custom reason..." value={customHolidayReason} onChange={e => setCustomHolidayReason(e.target.value)} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {subjectsToMark.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                      Loading assigned subjects...
                    </div>
                  ) : (
                    <>
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-4 space-y-3">
                          <h4 className="text-sm font-bold text-foreground">Bulk Action</h4>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-sm flex-1">
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                              <option value="Class Missed">Class Missed</option>
                            </select>
                            {(bulkStatus === 'Absent' || bulkStatus === 'Class Missed') && (
                              <select value={bulkReason} onChange={e => setBulkReason(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-sm flex-1">
                                <option value="">Select Reason</option>
                                {absenceReasonOptions.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            )}
                            <Button size="sm" onClick={handleBulkApply} variant="secondary">Apply to Selected</Button>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="border border-border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="w-12 text-center">
                                <input type="checkbox" checked={subjectData.length > 0 && subjectData.every(s => s.selected)} onChange={toggleSelectAll} className="w-4 h-4 rounded border-border" />
                              </TableHead>
                              <TableHead>Assigned Subject Details</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Reason</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subjectData.map((sub, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-center align-top pt-4">
                                  <input type="checkbox" checked={sub.selected} onChange={() => toggleSelect(idx)} className="w-4 h-4 rounded border-border" />
                                </TableCell>
                                  <TableCell className="py-3">
                                    <div className="font-semibold text-sm">{sub.subjectName || sub.subject?.name}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Year: {sub.academicYear?.replace('YEAR_', '')} | Sem: {sub.semester?.replace('SEMESTER_', '')} | Class: {sub.className || sub.acroClass?.name}
                                    </div>
                                  </TableCell>
                                <TableCell className="align-top pt-3">
                                  <select value={sub.status} onChange={e => updateSubject(idx, 'status', e.target.value)} className="w-full h-8 px-2 rounded border border-border bg-background text-xs">
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Class Missed">Missed</option>
                                  </select>
                                </TableCell>
                                <TableCell className="align-top pt-3">
                                  {(sub.status === 'Absent' || sub.status === 'Class Missed') ? (
                                    <select value={sub.reason} onChange={e => updateSubject(idx, 'reason', e.target.value)} className="w-full h-8 px-2 rounded border border-border bg-background text-xs border-red-200">
                                      <option value="">Reason...</option>
                                      {absenceReasonOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                  ) : (
                                    <span className="text-muted-foreground text-xs block py-1.5">—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-border gap-3">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} className="bg-primary text-white">Save Attendance</Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
