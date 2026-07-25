import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Search, X, GraduationCap, ArrowLeft, Printer,
  Calendar, CheckCircle, Upload, Plus, Eye, Edit, Trash2, AlertTriangle, Users, FileText, XCircle
} from 'lucide-react';
import { ProfileModule } from './ProfileModule';

// Auto-calculate academic year and semester from batch
function calcFromBatch(batch: string) {
  if (!batch || !batch.includes('-')) return { year: '', semester: '' };
  const startYear = parseInt(batch.split('-')[0]);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const yearsElapsed = currentYear - startYear;
  const academicYear = currentMonth >= 6 ? yearsElapsed + 1 : yearsElapsed;
  const sem = currentMonth >= 6 ? (academicYear - 1) * 2 + 1 : (academicYear - 1) * 2;
  const yearLabels: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' };
  const clampedYear = Math.max(1, Math.min(4, academicYear));
  const clampedSem = Math.max(1, Math.min(8, sem));
  return { year: yearLabels[clampedYear] || `${clampedYear}th Year`, semester: `Semester ${clampedSem}` };
}

export const StudentsModule = () => {
  const { role } = useAuth();
  const isHod = role === 'hod';


  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [classesList, setClassesList] = useState<string[]>([]);

  const [validationResult, setValidationResult] = useState<any>(null);
  const [showValidationReview, setShowValidationReview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [editableRecords, setEditableRecords] = useState<any[]>([]);
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [showImportSummary, setShowImportSummary] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
  const fetchStudents = async () => {
    try {
      const res = await api.get('/v1/students?size=1000');
      setStudents(res.data?.data?.content || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFilters = async () => {
    try {
      const bRes = await api.get('/v1/students/batches');
      setBatches(bRes.data?.data || []);
      const cRes = await api.get('/v1/students/classes');
      setClassesList(cRes.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchFilters();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Dialogs
  const [showUpload, setShowUpload] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState<any | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Form state
  const [form, setForm] = useState({ enrollmentNumber: '', name: '', gender: 'Male', batch: '2024-2028' });



  const filtered = useMemo(() => {
    let res = students;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(s => s.name.toLowerCase().includes(q) || s.enrollmentNumber.toLowerCase().includes(q));
    }
    if (filterBatch) res = res.filter(s => s.batch === filterBatch);
    if (filterClass) res = res.filter(s => s.className === filterClass);
    if (filterStatus) res = res.filter(s => s.status === filterStatus);
    return res.slice(0, 100); // Limit for performance
  }, [students, searchQuery, filterBatch, filterClass, filterStatus]);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter(s => s.status === 'Active').length,
    inactive: students.filter(s => s.status !== 'Active').length,
    batches: new Set(students.map(s => s.batch)).size,
  }), [students]);


  const handleUpload = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    try {
      const res = await api.post('/v1/bulk-upload/students/validate-ai', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setValidationResult(res.data);
      setEditableRecords(res.data?.rawRecords || []);
      setEditingRowIdx(null);
      setShowValidationReview(true);
      setShowUpload(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Validation failed');
    } finally {
      setIsUploading(false);
      setUploadFile(null);
    }
  };

  const handleConfirmImport = async () => {
    if (!editableRecords || editableRecords.length === 0) return;
    setIsUploading(true);
    try {
      const res = await api.post('/v1/bulk-upload/students/confirm', {
        records: editableRecords
      });
      setImportSummary(res.data?.data || res.data);
      setShowValidationReview(false);
      setValidationResult(null);
      setEditableRecords([]);
      setShowImportSummary(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseImportSummary = () => {
    setShowImportSummary(false);
    fetchStudents();
    fetchFilters();
  };

  const handleRowEdit = (idx: number, field: string, val: string) => {
    const updated = [...editableRecords];
    updated[idx] = { ...updated[idx], [field]: val };
    setEditableRecords(updated);
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await api.delete('/v1/students/all');
      toast.success('All student records deleted successfully');
      setShowDeleteAll(false);
      fetchStudents();
      fetchFilters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete students');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleAddStudent = () => {
    if (!form.enrollmentNumber || !form.name) { toast.error('Fill all fields'); return; }
    const { year, semester } = calcFromBatch(form.batch);
    const newStudent = {
      id: `STU_NEW_${Date.now()}`,
      ...form,
      email: `${form.name.toLowerCase().replace(/\s/g, '.')}@acropolis.in`,
      phone: `+91 9${Math.floor(Math.random() * 999999999)}`,
      classId: '', className: 'Unassigned', year, semester: semester.replace('Semester ', ''),
      batch: form.batch, branch: 'Information Technology',
      overallAttendance: 0, avatar: `https://ui-avatars.com/api/?name=${form.name}&background=4F46E5&color=fff`,
      status: 'Active', sgpa: {}, cgpa: '0.00', activeBacklogs: 0, subjects: [], batchCoordinator: '-',
    };
    setStudents([newStudent, ...students]);
    setShowAdd(false);
    setForm({ enrollmentNumber: '', name: '', gender: 'Male', batch: '2024-2028' });
    toast.success('Student added successfully');
  };

  const handleEditStudent = () => {
    if (!form.enrollmentNumber || !form.name) { toast.error('Fill all fields'); return; }
    const { year, semester } = calcFromBatch(form.batch);
    setStudents(students.map(s => s.id === showEdit ? {
      ...s, ...form, year, semester: semester.replace('Semester ', ''),
    } : s));
    setShowEdit(false);
    toast.success('Student updated');
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    try {
      await api.delete(`/v1/students/${showDelete.id}`);
      setStudents(students.filter(s => s.id !== showDelete.id));
      setShowDelete(null);
      toast.success('Student permanently deleted');
    } catch (e) {
      toast.error('Failed to delete student');
    }
  };

  const openEdit = (s: any) => {
    setForm({ enrollmentNumber: s.enrollmentNumber, name: s.name, gender: s.gender, batch: s.batch });
    setShowEdit(s.id);
  };

  // Student Profile View
  if (selectedStudent) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-10">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setSelectedStudent(null)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Student List
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-2 bg-primary/5 text-primary border-primary/20">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
        <ProfileModule viewingStudent={selectedStudent} />
      </div>
    );
  }

  // Main list view
  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <GraduationCap className="text-primary" size={24} /> Student Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isHod ? 'Manage all students across batches and classes.' : 'View and search student profiles.'}
          </p>
        </div>
        {isHod && (
          <div className="flex gap-2">
            <Button onClick={() => setShowDeleteAll(true)} variant="outline" className="gap-2 border-red-500/30 text-red-600 hover:bg-red-50 hover:text-red-700">
              <Trash2 size={16} /> Delete All Students
            </Button>
            <Button onClick={() => setShowUpload(true)} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
              <Upload size={16} /> Upload Student List
            </Button>
            <Button onClick={() => setShowAdd(true)} className="gap-2 shadow-md">
              <Plus size={16} /> Add Student
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      {isHod && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: stats.total, icon: <Users size={18}/>, color: 'primary' },
            { label: 'Active', value: stats.active, icon: <CheckCircle size={18}/>, color: 'green-500' },
            { label: 'Inactive', value: stats.inactive, icon: <AlertTriangle size={18}/>, color: 'orange-500' },
            { label: 'Batches', value: stats.batches, icon: <Calendar size={18}/>, color: 'blue-500' },
          ].map((s, i) => (
            <Card key={i} className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${s.color}/10 flex items-center justify-center text-${s.color}`}>{s.icon}</div>
                <div><p className="text-xs text-muted-foreground font-medium">{s.label}</p><p className="text-xl font-bold text-foreground">{s.value}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or enrollment..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-ring">
              <option value="">All Batches</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-ring">
              <option value="">All Classes</option>
              {classesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {isHod && (
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-ring">
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            )}
            <Button variant="ghost" size="icon" onClick={() => { setSearchQuery(''); setFilterBatch(''); setFilterClass(''); setFilterStatus(''); }}>
              <X size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-0 pt-5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Students</CardTitle>
            <Badge variant="secondary">{filtered.length} shown</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Enrollment</th>
                  <th className="px-4 py-3 font-semibold">Gender</th>
                  <th className="px-4 py-3 font-semibold">Batch</th>
                  <th className="px-4 py-3 font-semibold">Year</th>
                  <th className="px-4 py-3 font-semibold">Semester</th>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">No students found</td></tr>
                ) : filtered.map(s => {
                  const { year: calcY, semester: calcS } = calcFromBatch(s.batch);
                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'Student')}&background=4F46E5&color=fff`} alt="" className="w-8 h-8 rounded-full border border-border object-cover" />
                          <span className="font-semibold text-foreground">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{s.enrollmentNumber}</td>
                      <td className="px-4 py-3">{s.gender}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{s.batch}</Badge></td>
                      <td className="px-4 py-3 text-xs">{calcY}</td>
                      <td className="px-4 py-3 text-xs">{calcS}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{s.className}</Badge></td>
                      <td className="px-4 py-3">
                        <Badge variant={s.status === 'Active' ? 'default' : 'destructive'} className="text-xs">
                          {s.status || 'Active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setSelectedStudent(s)}>
                            <Eye size={14} />
                          </Button>
                          {isHod && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(s)}>
                                <Edit size={14} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setShowDelete(s)}>
                                <Trash2 size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload size={18} className="text-primary" /> Upload Student List</DialogTitle>
            <DialogDescription>Upload Excel (.xlsx), CSV, or PDF file. Academic Year and Semester are auto-calculated from Batch.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('student-upload')?.click()}>
              <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">{uploadFile ? uploadFile.name : 'Click to upload or drag & drop'}</p>
              <p className="text-xs text-muted-foreground mt-1">Supports .xlsx, .csv, .pdf</p>
              <input id="student-upload" type="file" className="hidden" accept=".xlsx,.csv,.pdf"
                onChange={e => setUploadFile(e.target.files?.[0] || null)} />
            </div>
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Expected Columns:</p>
              <p className="text-xs text-muted-foreground">Enrollment Number, Student Name, Gender, Batch (e.g. 2024-2028)</p>
              <p className="text-xs text-primary mt-1">⚡ Academic Year & Semester are auto-calculated from Batch</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowUpload(false); setUploadFile(null); }}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!uploadFile || isUploading}>{isUploading ? 'Validating...' : 'Upload & Process'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus size={18} className="text-primary" /> Add Student</DialogTitle>
            <DialogDescription>Manually add a student. Year and semester auto-populate from batch.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Enrollment Number</label>
              <Input value={form.enrollmentNumber} onChange={e => setForm({...form, enrollmentNumber: e.target.value})} placeholder="e.g. 0827IT23001" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Student Name</label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Gender</label>
                <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Batch</label>
                <select value={form.batch} onChange={e => setForm({...form, batch: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {batches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            {form.batch && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex gap-4">
                <div><p className="text-[10px] uppercase text-muted-foreground font-bold">Academic Year</p><p className="text-sm font-semibold text-primary">{calcFromBatch(form.batch).year}</p></div>
                <div><p className="text-[10px] uppercase text-muted-foreground font-bold">Semester</p><p className="text-sm font-semibold text-primary">{calcFromBatch(form.batch).semester}</p></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddStudent}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit size={18} className="text-primary" /> Edit Student</DialogTitle>
            <DialogDescription>Modify student details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Enrollment Number</label>
              <Input value={form.enrollmentNumber} onChange={e => setForm({...form, enrollmentNumber: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Student Name</label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Gender</label>
                <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Batch</label>
                <select value={form.batch} onChange={e => setForm({...form, batch: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {batches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            {form.batch && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex gap-4">
                <div><p className="text-[10px] uppercase text-muted-foreground font-bold">Academic Year</p><p className="text-sm font-semibold text-primary">{calcFromBatch(form.batch).year}</p></div>
                <div><p className="text-[10px] uppercase text-muted-foreground font-bold">Semester</p><p className="text-sm font-semibold text-primary">{calcFromBatch(form.batch).semester}</p></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleEditStudent}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle size={18} /> Delete Student</DialogTitle>
            <DialogDescription>
              This action is permanent. Are you sure you want to delete <strong>{showDelete?.name}</strong> ({showDelete?.enrollmentNumber})?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Validation Review Dialog */}
      <Dialog open={showValidationReview} onOpenChange={setShowValidationReview}>
        <DialogContent className="sm:max-w-[95vw] w-full max-h-[95vh] overflow-hidden flex flex-col p-0">
          {/* Header */}
          <div className="bg-muted/30 border-b border-border p-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  📄 Student Upload Review
                </h2>
                <p className="text-sm text-muted-foreground">{uploadFile?.name || 'student_data.csv'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-end">
                 <span className="text-xs text-muted-foreground">Total Records</span>
                 <span className="font-semibold text-sm">{validationResult?.totalAnalyzed || 0}</span>
               </div>
               <div className="w-px h-8 bg-border"></div>
               <div className="flex flex-col items-end">
                 <span className="text-xs text-muted-foreground">Valid Records</span>
                 <span className="font-semibold text-sm text-green-600">{validationResult?.totalAnalyzed ? validationResult.totalAnalyzed - (validationResult.issuesFound || 0) : 0}</span>
               </div>
               <div className="w-px h-8 bg-border"></div>
               <div className="flex flex-col items-end">
                 <span className="text-xs text-muted-foreground">Warning Count</span>
                 <span className="font-semibold text-sm text-orange-500">{validationResult?.issuesFound || 0}</span>
               </div>
               <div className="w-px h-8 bg-border"></div>
               <div className="flex flex-col items-end">
                 <span className="text-xs text-muted-foreground">Invalid Records</span>
                 <span className="font-semibold text-sm text-red-500">0</span>
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Validation Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Users size={18}/></div>
                  <div><p className="text-xs text-muted-foreground font-medium">Total Records</p><p className="text-xl font-bold">{validationResult?.totalAnalyzed || 0}</p></div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500"><CheckCircle size={18}/></div>
                  <div><p className="text-xs text-muted-foreground font-medium">Ready to Import</p><p className="text-xl font-bold">{validationResult?.totalAnalyzed ? validationResult.totalAnalyzed - (validationResult.issuesFound || 0) : 0}</p></div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500"><AlertTriangle size={18}/></div>
                  <div><p className="text-xs text-muted-foreground font-medium">Warnings</p><p className="text-xl font-bold">{validationResult?.issuesFound || 0}</p></div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500"><XCircle size={18}/></div>
                  <div><p className="text-xs text-muted-foreground font-medium">Errors</p><p className="text-xl font-bold">0</p></div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Table */}
            <div className="border rounded-md overflow-hidden bg-card shadow-sm">
              <div className="overflow-x-auto max-h-[40vh]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/80 sticky top-0 z-10 shadow-sm">
                    <tr>
                      {editableRecords.length > 0 && Object.keys(editableRecords[0]).map((col, idx) => (
                        <th key={idx} className="px-4 py-3 font-semibold whitespace-nowrap">{col}</th>
                      ))}
                      <th className="px-4 py-3 font-semibold whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {editableRecords?.map((record: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        {Object.keys(record).map((col, cIdx) => (
                          <td key={cIdx} className="px-4 py-3 text-xs whitespace-nowrap">
                            {editingRowIdx === idx ? (
                              <Input
                                value={record[col] || ''}
                                onChange={(e) => handleRowEdit(idx, col, e.target.value)}
                                className="h-7 text-xs px-2 min-w-[100px]"
                              />
                            ) : (
                              record[col] || '-'
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-xs whitespace-nowrap text-right">
                          {editingRowIdx === idx ? (
                            <Button size="sm" variant="ghost" className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => setEditingRowIdx(null)}>Done</Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingRowIdx(idx)}><Edit size={14} className="mr-1" /> Edit</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Warnings Section */}
            {validationResult?.issues && validationResult.issues.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-orange-600 flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} /> Data Warnings ({validationResult.issuesFound})
                </h3>
                <div className="space-y-2 max-h-[15vh] overflow-y-auto pr-2">
                  {validationResult.issues.map((issue: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm bg-background/50 p-2 rounded border border-border/50">
                      <span className="text-orange-500 font-mono text-xs mt-0.5 whitespace-nowrap">Row {issue.rowNumber}:</span>
                      <span className="text-muted-foreground">
                        {issue.issueDescription || `Missing or invalid ${issue.field}.`}
                        {issue.suggestedValue && <span className="text-foreground font-medium ml-1">Suggested: {issue.suggestedValue}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-muted/30 border-t border-border p-4 px-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowValidationReview(false)}>Cancel</Button>
            <Button onClick={handleConfirmImport} disabled={isUploading}>
              {isUploading ? 'Importing...' : 'Confirm & Import'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Summary Popup */}
      <Dialog open={showImportSummary} onOpenChange={handleCloseImportSummary}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />
              Import Completed
            </DialogTitle>
            <DialogDescription>
              The student list upload process has finished. Here is the summary.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted p-3 rounded-md text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{importSummary?.totalRecords || 0}</p>
              </div>
              <div className="bg-green-500/10 text-green-700 p-3 rounded-md text-center">
                <p className="text-xs">Imported</p>
                <p className="text-lg font-bold">{importSummary?.successfullyInserted || 0}</p>
              </div>
              <div className="bg-red-500/10 text-red-700 p-3 rounded-md text-center">
                <p className="text-xs">Failed</p>
                <p className="text-lg font-bold">{importSummary?.failedRecords || 0}</p>
              </div>
              <div className="bg-orange-500/10 text-orange-700 p-3 rounded-md text-center">
                <p className="text-xs">Skipped/Duplicate</p>
                <p className="text-lg font-bold">{(importSummary?.skippedRecords || 0) + (importSummary?.duplicateRecords || 0)}</p>
              </div>
            </div>

            {importSummary?.errorLog && importSummary.errorLog.length > 0 && (
              <div className="border border-red-500/20 rounded-md p-3 bg-red-500/5 max-h-[30vh] overflow-y-auto">
                <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1"><AlertTriangle size={14} /> Failed Records</h4>
                <ul className="space-y-1 text-xs">
                  {importSummary.errorLog.map((err: any, idx: number) => (
                    <li key={idx} className="flex flex-col border-b border-red-500/10 pb-1 mb-1 last:border-0">
                      <span className="font-mono text-red-500">Row {err.rowNumber} (Enrollment: {err.enrollmentNo || 'N/A'})</span>
                      <span className="text-muted-foreground">{err.errorMessage}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCloseImportSummary}>OK / Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={showDeleteAll} onOpenChange={setShowDeleteAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Delete All Students
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              Are you sure you want to permanently delete <strong>all</strong> student records? 
              <br /><br />
              This will remove all enrollments, student profiles, and student user accounts from the database. 
              This action <strong>cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowDeleteAll(false)} disabled={isDeletingAll}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeletingAll}>
              {isDeletingAll ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
