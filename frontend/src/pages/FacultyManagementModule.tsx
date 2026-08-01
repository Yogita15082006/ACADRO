import { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockData } from '../data/mockData';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Users, BookOpen, FileText, Clock, Upload, CheckCircle, XCircle, Search, Brain, Shield, Sparkles, Plus, FileUp, Loader2, Edit2, UserPlus, GraduationCap, Eye, AlertTriangle, RefreshCcw, Trash2, Download, File } from 'lucide-react';
import { Label } from '../components/ui/label';

import { ChevronLeft } from 'lucide-react';
import { AcademicResourceDialog } from '../components/modals/AcademicResourceDialog';

type Tab = 'faculty-coordinators' | 'syllabus' | 'scheme' | 'timetable';

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'faculty-coordinators', label: 'Faculty & Coordinators', icon: Users },
  { key: 'syllabus', label: 'Academic Syllabus', icon: BookOpen },
  { key: 'scheme', label: 'Academic Scheme', icon: FileText },
  { key: 'timetable', label: 'Timetable', icon: Clock },
];


const AssignmentRow = ({ row, index, updateRow, removeRow }: any) => {
  const [batches, setBatches] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    api.get('/v1/metadata/batches').then(res => setBatches(res.data.data || []));
  }, []);

  useEffect(() => {
    if (row.batch) {
      api.get(`/v1/metadata/academic-years?batch=${row.batch}`).then(res => setYears(res.data.data || []));
    } else {
      setYears([]); setSemesters([]); setClasses([]);
    }
  }, [row.batch]);

  useEffect(() => {
    if (row.year) {
      api.get(`/v1/metadata/semesters?year=${row.year}`).then(res => setSemesters(res.data.data || []));
    } else {
      setSemesters([]); setClasses([]);
    }
  }, [row.year]);

  useEffect(() => {
    if (row.batch && row.semester) {
      api.get(`/v1/metadata/classes?batch=${row.batch}&semester=${row.semester}`).then(res => setClasses(res.data.data || []));
    } else {
      setClasses([]);
    }
  }, [row.batch, row.semester]);

  return (
    <div className="flex gap-2 items-end mb-3 bg-muted/30 p-3 rounded-lg border border-border">
      <div className="flex-1 space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Batch</label>
        <select value={row.batch} onChange={e => updateRow(index, 'batch', e.target.value)} className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm">
          <option value="">Select</option>
          {batches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Year</label>
        <select value={row.year} onChange={e => updateRow(index, 'year', e.target.value)} disabled={!row.batch} className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm disabled:opacity-50">
          <option value="">Select</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Semester</label>
        <select value={row.semester} onChange={e => updateRow(index, 'semester', e.target.value)} disabled={!row.year} className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm disabled:opacity-50">
          <option value="">Select</option>
          {semesters.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Class</label>
        <select value={row.className} onChange={e => updateRow(index, 'className', e.target.value)} disabled={!row.semester} className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm disabled:opacity-50">
          <option value="">Select</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {index > 0 && (
        <Button variant="ghost" size="icon" className="text-destructive h-9 w-9 shrink-0" onClick={() => removeRow(index)}>
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
};

const MakeCoordinatorDialog = ({ open, faculty, onClose, onSave }: any) => {
  const [assignments, setAssignments] = useState<any[]>([{ id: Date.now(), batch: '', year: '', semester: '', className: '' }]);

  useEffect(() => {
    if (open) {
      setAssignments([{ id: Date.now(), batch: '', year: '', semester: '', className: '' }]);
    }
  }, [open]);

  const addRow = () => setAssignments([...assignments, { id: Date.now(), batch: '', year: '', semester: '', className: '' }]);
  const updateRow = (index: number, field: string, value: string) => {
    const newAssignments = [...assignments];
    newAssignments[index][field] = value;
    // Reset downstream fields
    if (field === 'batch') { newAssignments[index].year = ''; newAssignments[index].semester = ''; newAssignments[index].className = ''; }
    if (field === 'year') { newAssignments[index].semester = ''; newAssignments[index].className = ''; }
    if (field === 'semester') { newAssignments[index].className = ''; }
    setAssignments(newAssignments);
  };
  const removeRow = (index: number) => setAssignments(assignments.filter((_, i) => i !== index));

  if (!open || !faculty) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl"><Shield size={20} className="text-primary" /> Assign Academic Responsibility</DialogTitle>
          <DialogDescription>Assign <strong>{faculty.name}</strong> as a Class Coordinator.</DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted/50 p-4 rounded-xl border border-border flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{faculty.name}</p>
            <p className="text-xs text-muted-foreground">{faculty.email}</p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="mb-1">{faculty.department?.name || 'N/A'}</Badge>
            <p className="text-xs font-medium text-foreground">{faculty.designation || 'Faculty'}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold">Academic Assignments</h4>
            <Button variant="outline" size="sm" onClick={addRow} className="h-8 gap-1"><Plus size={14} /> Add Assignment</Button>
          </div>
          
          <div className="space-y-1">
            {assignments.map((row, i) => (
              <AssignmentRow key={row.id} row={row} index={i} updateRow={updateRow} removeRow={removeRow} />
            ))}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(assignments.filter(a => a.className))}>Save Assignments</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const FacultyManagementModule = () => {

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('faculty-coordinators');
  const [previewFaculty, setPreviewFaculty] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [localFaculty, setLocalFaculty] = useState<any[]>([]);
  const [showValidationReview, setShowValidationReview] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [editableRecords, setEditableRecords] = useState<any[]>([]);
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [showImportSummary, setShowImportSummary] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [localSyllabus, setLocalSyllabus] = useState<any[]>([]);
  const [localSchemes, setLocalSchemes] = useState<any[]>([]);

  const fetchAcademicResources = async () => {
    try {
      const response = await api.get('/v1/academic-resources');
      const resources = response.data?.data || [];
      setLocalSyllabus(resources.filter((r: any) => r.fileType === 'SYLLABUS'));
      setLocalSchemes(resources.filter((r: any) => r.fileType === 'SCHEME'));
      setLocalTimetables(resources.filter((r: any) => r.fileType === 'TIMETABLE'));
    } catch (e) {
      console.error('Failed to fetch resources', e);
    }
  };

  const handleViewPdf = async (url: string, providedFileName?: string) => {
    if (!url) return;
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      toast.error('Please allow popups to view the file');
      return;
    }
    newWindow.document.write('Loading document preview...');
    try {
      const endpoint = url.startsWith('/api') ? url.substring(4) : url;
      const response = await api.get(endpoint, { responseType: 'blob' });
      
      const contentType = response.headers['content-type'] || response.data?.type || '';
      const contentDisposition = response.headers['content-disposition'] || '';
      let detectedName = providedFileName || '';
      if (!detectedName && contentDisposition.includes('filename=')) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) detectedName = match[1];
      }
      
      const lowerName = detectedName.toLowerCase();
      const isImage = contentType.includes('image/') || 
                      lowerName.endsWith('.jpg') || 
                      lowerName.endsWith('.jpeg') || 
                      lowerName.endsWith('.png') ||
                      url.toLowerCase().endsWith('.jpg') ||
                      url.toLowerCase().endsWith('.jpeg') ||
                      url.toLowerCase().endsWith('.png');

      if (isImage) {
        let imageMime = 'image/jpeg';
        if (lowerName.endsWith('.png') || contentType.includes('png')) {
          imageMime = 'image/png';
        }
        const blob = new Blob([response.data], { type: imageMime });
        const objectUrl = URL.createObjectURL(blob);
        
        newWindow.document.open();
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${detectedName || 'Image Preview'}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                margin: 0;
                padding: 0;
                background-color: #0f172a;
                color: #f8fafc;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
                box-sizing: border-box;
                overflow-x: auto;
                overflow-y: auto;
              }
              .header {
                position: sticky;
                top: 0;
                z-index: 10;
                background-color: #1e293b;
                border-bottom: 1px solid #334155;
                padding: 12px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
              }
              .title {
                font-weight: 600;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .badge {
                background-color: #3b82f6;
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                text-transform: uppercase;
                font-weight: 700;
              }
              .viewer-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 24px;
                width: 100%;
                box-sizing: border-box;
              }
              .image-wrapper {
                width: 100%;
                max-width: 100%;
                display: flex;
                justify-content: center;
              }
              img {
                width: 100%;
                height: auto;
                object-fit: contain;
                border-radius: 6px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
                display: none;
                background-color: #1e293b;
              }
              .loading-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                color: #94a3b8;
              }
              .spinner {
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-top: 3px solid #3b82f6;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .error-state {
                display: none;
                background-color: rgba(239, 68, 68, 0.1);
                border: 1px solid #ef4444;
                border-radius: 8px;
                padding: 24px 32px;
                color: #fca5a5;
                max-width: 500px;
                text-align: center;
                margin: 40px auto;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">
                <span>🖼️ ${detectedName || 'Uploaded Timetable Image'}</span>
              </div>
              <span class="badge">Image Preview</span>
            </div>
            <div class="viewer-container">
              <div id="loading" class="loading-state">
                <div class="spinner"></div>
                <span>Loading high-resolution image...</span>
              </div>
              <div id="error" class="error-state">
                <h3 style="margin-top: 0; color: #ef4444;">Failed to Load Image</h3>
                <p style="margin-bottom: 0; font-size: 14px;">The image file genuinely cannot be loaded. It may be corrupted or inaccessible.</p>
              </div>
              <div class="image-wrapper">
                <img 
                  id="target-image" 
                  src="${objectUrl}" 
                  alt="${detectedName || 'Timetable Preview'}"
                  onload="document.getElementById('loading').style.display='none'; this.style.display='block';"
                  onerror="document.getElementById('loading').style.display='none'; document.getElementById('error').style.display='block';"
                />
              </div>
            </div>
          </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(blob);
        newWindow.location.href = objectUrl;
      }
    } catch (error) {
      newWindow.close();
      toast.error('Failed to load document');
    }
  };


  useEffect(() => {
    fetchAcademicResources();
  }, []);
  const [localTimetables, setLocalTimetables] = useState<any[]>([]);
  const [ttAssignments, setTtAssignments] = useState<Record<string, any[]>>({});
  
  // AI Match Workflow States
  const [reviewData, setReviewData] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewTtId, setReviewTtId] = useState<string | null>(null);
  const [isConfirmingAssignment, setIsConfirmingAssignment] = useState(false);
  
  const [showCoordDialog, setShowCoordDialog] = useState<any>(null);
  const [syllabusFormOpen, setSyllabusFormOpen] = useState(false);
  const [schemeFormOpen, setSchemeFormOpen] = useState(false);
  const [timetableFormOpen, setTimetableFormOpen] = useState(false);

  const [viewFacultyDialog, setViewFacultyDialog] = useState<any>(null);
  const [unmatchedFacultyDialog, setUnmatchedFacultyDialog] = useState<any>(null);
  const [replaceFacultyDialog, setReplaceFacultyDialog] = useState<any>(null);
  const [viewTimetableDialog, setViewTimetableDialog] = useState<any>(null);
  const [uploadDialog, setUploadDialog] = useState<{ isOpen: boolean; type: 'faculty' | 'syllabus' | 'scheme' | 'timetable' | null, replaceId?: string }>({ isOpen: false, type: null });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [addFacultyOpen, setAddFacultyOpen] = useState(false);
  const [manualAssignOpen, setManualAssignOpen] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState<Record<string, boolean>>({});
  const [finalConfirmOpen, setFinalConfirmOpen] = useState<string | null>(null);
  const [syllabusToDelete, setSyllabusToDelete] = useState<string | null>(null);
  const [schemeToDelete, setSchemeToDelete] = useState<string | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<string | null>(null);
  const [onboardingSuccessCoord, setOnboardingSuccessCoord] = useState<any>(null);
  const { login } = useAuth();

  
  const fetchFaculty = async () => {
    try {
      const res = await api.get('/users');
      // filter only faculty/coordinators
      const users = res.data?.data || res.data || [];
      const faculties = Array.isArray(users) ? users.filter((u: any) => ['FACULTY', 'COORDINATOR', 'HOD', 'ADMIN'].includes(u.role)) : [];
      setLocalFaculty(faculties);
    } catch (err) {
      console.error('Failed to fetch faculty:', err);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const filteredFaculty = useMemo(() => {
    if (!search) return localFaculty;
    const q = search.toLowerCase();
    return localFaculty.filter(f => f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q));
  }, [localFaculty, search]);

  const handleDeleteSyllabus = async () => {
    if (!syllabusToDelete) return;
    try {
      await api.delete('/v1/academic-resources/' + syllabusToDelete);
      toast.success('Syllabus deleted successfully.');
      setLocalSyllabus(localSyllabus.filter((s: any) => s.id !== syllabusToDelete));
    } catch(e) {
      toast.error('Failed to delete syllabus');
    } finally {
      setSyllabusToDelete(null);
    }
  };

  const handleDeleteScheme = async () => {
    if (!schemeToDelete) return;
    try {
      await api.delete('/v1/academic-resources/' + schemeToDelete);
      toast.success('Scheme deleted successfully.');
      setLocalSchemes(localSchemes.filter((s: any) => s.id !== schemeToDelete));
    } catch(e) {
      toast.error('Failed to delete scheme');
    } finally {
      setSchemeToDelete(null);
    }
  };

  const handleFinalConfirm = () => {
    if (!finalConfirmOpen) return;

    // 1. Assign subjects & classes to faculty based on approved assignments
    const approved = ttAssignments[finalConfirmOpen] || [];
    approved.forEach((a: any) => {
      const faculty = localFaculty.find(f => f.name === a.facultyName);
      if (faculty) {
        if (!faculty.subjects.includes(a.subject)) {
          faculty.subjects = [...faculty.subjects, a.subject];
        }
        if (a.className && !faculty.classes.includes(a.className)) {
          faculty.classes = [...faculty.classes, a.className];
        }
        // Sync to mockData
        const mdFac = mockData.admins.find((m: any) => m.id === faculty.id);
        if (mdFac) {
          mdFac.subjects = [...faculty.subjects];
          mdFac.classes = [...faculty.classes];
        }
      }
    });
    setLocalFaculty(prev => [...prev]);

    // 2. Promote students (batch 2023-2027: sem 5→6)
    mockData.students.forEach((student: any) => {
      if (student.batch === '2023-2027' && student.semester === '5') {
        student.semester = '6';
        student.overallAttendance = 100;
        student.subjects = ['Machine Learning', 'Operating System', 'Computer Networks', 'Software Engineering'];
        if (student.sgpa) student.sgpa.sem5 = (Math.random() * 3 + 7).toFixed(2);
        student.activeBacklogs = 0;
      }
    });

    // 3. Reset semester-specific records
    if (mockData.attendanceSessions) mockData.attendanceSessions.length = 0;
    if (mockData.assignments) mockData.assignments.length = 0;
    if (mockData.quizzes) mockData.quizzes.length = 0;
    if (mockData.events) mockData.events.splice(0, mockData.events.length);

    toast.success('✅ System fully configured! Students promoted, faculty assigned, semester data reset.');
    setFinalConfirmOpen(null);
  };

  const handleMakeCoordinator = async (assignments: any[]) => {
    if (!showCoordDialog) return;
    try {
      await api.put(`/v1/users/${showCoordDialog.id}`, { role: 'COORDINATOR' }); // change role
      // Create assignments
      await api.post(`/v1/coordinator-assignments`, {
        facultyId: showCoordDialog.id,
        assignments: assignments
      });
      toast.success(`${showCoordDialog.name} assigned as Class Coordinator with ${assignments.length} classes`);
      fetchFaculty();
    } catch (e) {
      toast.error('Failed to assign coordinator');
    }
    setShowCoordDialog(null);
  };


  
  
  const handleAcademicResourceUpload = async (type: string, _data: any, file: File) => {
    setSyllabusFormOpen(false);
    setSchemeFormOpen(false);
    setTimetableFormOpen(false);
    setUploadFile(file);
    setIsUploading(true);
    if (type === 'syllabus') {
      console.log("Confirm Upload clicked, starting syllabus upload:", _data, file.name);
      const tempId = `temp-${Date.now()}`;
      const optimisticCard = {
        id: tempId,
        fileName: file.name,
        fileType: "SYLLABUS",
        uploadedBy: "You (Processing...)",
        uploadedAt: new Date().toISOString(),
        metadata: {
          batch: _data.batch || 'N/A',
          academicYear: _data.year || '2024',
          semester: _data.semester || '5',
          className: _data.className || 'N/A',
          department: _data.department || 'N/A',
          degree: _data.degree || 'N/A',
          status: 'Processing...',
          totalSubjects: 0,
          detectedSubjects: []
        }
      };
      setLocalSyllabus(prev => [optimisticCard, ...prev]);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('academicYear', _data.year || '2023-2024');
      if (_data.batch) formData.append('batch', _data.batch);
      if (_data.className) formData.append('className', _data.className);
      if (_data.department) formData.append('department', _data.department);
      if (_data.degree) formData.append('degree', _data.degree);
      formData.append('semester', _data.semester || '5');
      
      try {
        const response = await api.post('/v1/academic-resources/syllabus', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("Syllabus uploaded successfully, receiving response:", response.data);
        const newDoc = response.data?.data;
        if (newDoc) {
          setLocalSyllabus(prev => [newDoc, ...prev.filter((item: any) => item.id !== tempId && item.id !== newDoc.id)]);
        }
        toast.success('Syllabus uploaded and parsed successfully.');
        fetchAcademicResources();
      } catch (error: any) {
        setLocalSyllabus(prev => prev.filter((item: any) => item.id !== tempId));
        const errorMsg = error.response?.data?.message || 'Failed to communicate with AI Service';
        toast.error(`AI Parsing Error: ${errorMsg}`);
        console.error("Complete AI Parsing Error Trace:", error);
      } finally {
        setIsUploading(false);
      }
    } else if (type === 'timetable') {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const fileName = file.name ? file.name.toLowerCase() : '';
      const validExt = fileName.endsWith('.pdf') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
      if (!allowedTypes.includes(file.type) && !validExt) {
        toast.error('Invalid file type. Please upload a PDF, PNG, JPG, or JPEG file.');
        setIsUploading(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('academicYear', _data.year || '1');
      if (_data.batch) formData.append('batchName', _data.batch);
      if (_data.className) formData.append('className', _data.className);
      if (_data.department) formData.append('departmentName', _data.department);
      formData.append('semesterName', _data.semester || '1');
      
      try {
        const res = await api.post('/v1/timetables/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const newTtId = res.data?.data?.id;
        if (newTtId) {
          toast.success('Timetable uploaded successfully. Auto-triggering AI Match & Review...');
          setActiveTab('timetable');
          fetchAcademicResources();
          autoTriggerAIMatch(newTtId);
        } else {
          toast.error('Failed to retrieve new Timetable ID');
        }
      } catch(e: any) {
        toast.error(e.response?.data?.message || 'Failed to upload timetable');
      } finally {
        setIsUploading(false);
      }
    } else {
      const formData = new FormData();
      formData.append('file', file);
      if (_data.year) formData.append('academicYear', _data.year);
      if (_data.batch) formData.append('batch', _data.batch);
      if (_data.className) formData.append('className', _data.className);
      if (_data.department) formData.append('department', _data.department);
      if (_data.degree) formData.append('degree', _data.degree);
      if (_data.semester) formData.append('semester', _data.semester);
      
      try {
        await api.post('/v1/academic-resources/scheme', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Scheme uploaded successfully.');
        fetchAcademicResources();
      } catch(e) {
        toast.error('Failed to upload scheme');
      } finally {
        setIsUploading(false);
      }
    }
  };


  const handleUploadValidate = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    try {
      const response = await api.post('/v1/bulk-upload/faculties/validate-ai', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = response.data?.data || response.data;
      setValidationResult(data);
      setEditableRecords(data?.rawRecords || []);
      setEditingRowIdx(null);
      setUploadDialog({ isOpen: false, type: null });
      setShowValidationReview(true);
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
      const response = await api.post('/v1/bulk-upload/faculties/confirm', {
        records: editableRecords
      });
      setImportSummary(response.data?.data || response.data);
      setShowValidationReview(false);
      setValidationResult(null);
      setEditableRecords([]);
      setTimeout(() => setShowImportSummary(true), 300);
      fetchFaculty();
    } catch (error) {
      toast.error('Failed to import faculties.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };


  const handleCloseImportSummary = () => {
    setShowImportSummary(false);
    fetchFaculty();
    // fetchFilters if they existed could go here
  };

  const toggleEditRow = (idx: number) => {
    if (editingRowIdx === idx) {
      setEditingRowIdx(null); // Save
    } else {
      setEditingRowIdx(idx); // Edit
    }
  };

  const handleCellEdit = (idx: number, field: string, value: string) => {
    const updated = [...editableRecords];
    updated[idx][field] = value;
    setEditableRecords(updated);
  };

  const simulateUpload = (type: 'faculty' | 'syllabus' | 'scheme' | 'timetable') => {
    setIsUploading(true);
    setUploadProgress(0);
    const currentReplaceId = uploadDialog.replaceId;
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadDialog({ isOpen: false, type: null });
          handleUploadSuccess(type, currentReplaceId);
          return 0;
        }
        return p + 20;
      });
    }, 300);
  };

  // Auto-trigger AI matching for a specific timetable
  const autoTriggerAIMatch = (ttId: string) => {
    setTimeout(() => {
      runAIAssignment(ttId);
    }, 500);
  };

  const handleReplaceTimetable = async (replaceId: string, file: File) => {
    const existingTt = localTimetables.find((t: any) => t.id === replaceId);
    if (!existingTt) {
      toast.error('Original timetable not found.');
      return;
    }
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const fileName = file.name ? file.name.toLowerCase() : '';
    const validExt = fileName.endsWith('.pdf') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
    if (!allowedTypes.includes(file.type) && !validExt) {
      toast.error('Unsupported file format. Please upload a PDF, PNG, JPG, or JPEG file.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(50);
    const formData = new FormData();
    const dept = existingTt.metadata?.department || existingTt.department || 'Computer Science & Engineering';
    const cls = existingTt.metadata?.className || existingTt.className || 'CS-1';
    const batch = existingTt.metadata?.batch || existingTt.batch || '';
    const sem = existingTt.metadata?.semester || existingTt.semester || '1';
    const yr = existingTt.metadata?.academicYear || existingTt.academicYear || '1';

    formData.append('file', file);
    formData.append('academicYear', yr);
    if (batch) formData.append('batchName', batch);
    formData.append('className', cls);
    formData.append('departmentName', dept);
    formData.append('semesterName', sem);
    
    try {
      await api.post(`/v1/timetables/${replaceId}/replace`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Timetable replaced successfully.');
      setUploadDialog({ isOpen: false, type: null });
      fetchAcademicResources();
    } catch(e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to replace timetable';
      console.error("Timetable replacement failed:", e);
      toast.error(`Error: ${msg}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadSuccess = (type: 'faculty' | 'syllabus' | 'scheme' | 'timetable', replaceId?: string) => {
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully.`);
    if (type === 'faculty') {
      const newFaculties = [
        { id: `NEW_F_${Date.now()}_1`, name: 'Dr. Anita Desai', email: 'anita.desai@acropolis.in', role: 'faculty', empId: `EMP${Math.floor(Math.random() * 1000)}`, classes: [], subjects: [] },
        { id: `NEW_F_${Date.now()}_2`, name: 'Prof. Manish Tiwari', email: 'manish.tiwari@acropolis.in', role: 'COORDINATOR', empId: `EMP${Math.floor(Math.random() * 1000)}`, classes: [], subjects: [] },
        { id: `NEW_F_${Date.now()}_3`, name: 'Dr. Shruti Jain', email: 'shruti.jain@acropolis.in', role: 'both', empId: `EMP${Math.floor(Math.random() * 1000)}`, classes: [], subjects: [] }
      ];
      mockData.admins.push(...newFaculties);
      setLocalFaculty(prev => [...prev, ...newFaculties]);
      
      toast.promise(
        new Promise(resolve => setTimeout(resolve, 2000)),
        {
           loading: 'AI processing Faculty List...',
           success: () => {
             setLocalFaculty(prev => prev.map(f => {
                if (f.role === 'COORDINATOR') {
                  return { ...f, classes: f.classes.length > 0 ? f.classes : ['IT-1', 'DS-1'] };
                }
                return f;
             }));
             return 'AI Processing Complete: Coordinators automatically assigned Sections.';
           },
           error: 'Error processing faculty list'
        }
      );
    } else if (type === 'syllabus') {
      const newSyllabus = {
        id: `SYL_${Date.now()}`, fileName: 'New_Syllabus_2026.pdf', academicYear: 'New', semester: 'New', status: 'Processed', uploadDate: new Date().toISOString().split('T')[0],
        totalSubjects: 4, detectedSubjects: [{ code: 'NEW101', name: 'AI Basics', type: 'Theory' }]
      };
      if ((mockData as any).uploadedSyllabus) {
        (mockData as any).uploadedSyllabus.push(newSyllabus);
      }
      setLocalSyllabus(prev => [...prev, newSyllabus]);
      toast.success('AI processed Syllabus automatically.');
    } else if (type === 'scheme') {
      const newScheme = {
        id: `SCH_${Date.now()}`, name: 'New Scheme 2026', academicYear: 'New', semester: 'New', fileName: 'Scheme_2026.pdf',
        uploadDate: new Date().toISOString().split('T')[0], totalSubjects: 4, subjects: ['AI Basics', 'Web Dev']
      };
      if ((mockData as any).uploadedSchemes) {
        (mockData as any).uploadedSchemes.push(newScheme);
      }
      setLocalSchemes(prev => [...prev, newScheme]);
      toast.success('AI processed Scheme automatically.');
    } else if (type === 'timetable') {
      const newTtId = replaceId || `TT_${Date.now()}`;
      if (replaceId) {
        setLocalTimetables(prev => prev.map(t => t.id === replaceId ? {
          ...t,
          fileName: 'Replaced_Timetable.pdf',
          uploadDate: new Date().toISOString().split('T')[0]
        } : t));
        if ((mockData as any).uploadedTimetables) {
          const idx = (mockData as any).uploadedTimetables.findIndex((t: any) => t.id === replaceId);
          if (idx >= 0) {
            (mockData as any).uploadedTimetables[idx].fileName = 'Replaced_Timetable.pdf';
            (mockData as any).uploadedTimetables[idx].uploadDate = new Date().toISOString().split('T')[0];
          }
        }
      } else {
        const newTimetable = {
          id: newTtId, name: 'New Timetable', academicYear: 'New', semester: 'New', className: 'New Class',
          fileName: 'Timetable.pdf', uploadDate: new Date().toISOString().split('T')[0],
          slots: [
            { day: 'Monday', time: '10:00-11:00', subject: 'AI Basics', faculty: 'Pending Assignment' },
            { day: 'Monday', time: '11:00-12:00', subject: 'Ethics', faculty: 'Dr. Unknown Faculty' }
          ]
        };
        if ((mockData as any).uploadedTimetables) {
          (mockData as any).uploadedTimetables.push(newTimetable);
        }
        setLocalTimetables(prev => [...prev, newTimetable]);
      }
      // Auto-switch to timetable tab & trigger AI match
      setActiveTab('timetable');
      toast.info('Timetable uploaded. Auto-triggering AI Match & Review...');
      autoTriggerAIMatch(newTtId);
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      toast.success('Faculty deleted successfully.');
      fetchFaculty();
    } catch(e) {
      toast.error('Failed to delete faculty.');
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await api.delete('/users/faculty/all');
      toast.success('All faculty and coordinator records permanently deleted.');
      setShowDeleteAll(false);
      fetchFaculty();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete faculty records.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteTimetable = async (id: string) => {
    try {
      await api.delete('/v1/academic-resources/' + id);
      toast.success('Timetable deleted successfully.');
      fetchAcademicResources();
    } catch(e) {
      toast.error('Failed to delete timetable');
    }
  };

  const runAIAssignment = async (ttId: string) => {
    try {
      setIsAILoading(prev => ({ ...prev, [ttId]: true }));
      const response = await api.post(`/v1/timetables/${ttId}/ai-match`);
      const data = response.data?.data;
      if (data) {
        setReviewData(data);
        setReviewTtId(ttId);
        setReviewDialogOpen(true);
        toast.success('AI Match complete! Please review the extracted assignments.');
      }
    } catch (e: any) {
      console.error('AI Match failed', e);
      toast.error(e.response?.data?.message || 'Failed to extract timetable information');
    } finally {
      setIsAILoading(prev => ({ ...prev, [ttId]: false }));
    }
  };
  const handleConfirmAssignment = async () => {
    if (!reviewTtId || !reviewData) return;
    try {
      setIsConfirmingAssignment(true);
      await api.post(`/v1/timetables/${reviewTtId}/confirm-assignments`, reviewData);
      toast.success('Assignments confirmed and fully synchronized!');
      setReviewDialogOpen(false);
      setReviewData(null);
      setReviewTtId(null);
      fetchAcademicResources();
      fetchFaculty();
    } catch (e: any) {
      console.error('Confirmation failed', e);
      toast.error(e.response?.data?.message || 'Failed to confirm assignments');
    } finally {
      setIsConfirmingAssignment(false);
    }
  };

  const handleUpdateCoordinator = (idx: number, newFacultyId: string, matchedName: string) => {
    const updated = [...reviewData.coordinatorAssignments];
    updated[idx].coordinatorId = newFacultyId;
    updated[idx].matchedCoordinatorName = matchedName;
    setReviewData({ ...reviewData, coordinatorAssignments: updated });
  };

  const handleDeleteCoordinator = (idx: number) => {
    const updated = [...reviewData.coordinatorAssignments];
    updated.splice(idx, 1);
    setReviewData({ ...reviewData, coordinatorAssignments: updated });
  };

  const handleUpdateSubject = (idx: number, newFacultyId: string, matchedName: string) => {
    const updated = [...reviewData.subjectAssignments];
    updated[idx].facultyId = newFacultyId;
    updated[idx].matchedFacultyName = matchedName;
    setReviewData({ ...reviewData, subjectAssignments: updated });
  };

  const handleDeleteSubject = (idx: number) => {
    const updated = [...reviewData.subjectAssignments];
    updated.splice(idx, 1);
    setReviewData({ ...reviewData, subjectAssignments: updated });
  };

  const handleManualAssignment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!manualAssignOpen) return;
    const ttId = manualAssignOpen;
    const formData = new FormData(e.currentTarget);
    const newAssignment = {
      id: `MAN_${Date.now()}`,
      facultyName: formData.get('facultyName') as string,
      subject: formData.get('subject') as string,
      className: formData.get('className') as string,
      academicYear: formData.get('year') as string,
      semester: formData.get('semester') as string,
      confidence: 'Manual',
      status: 'Approved' // Manual assignments are pre-approved
    };
    setTtAssignments(prev => ({ ...prev, [ttId]: [...(prev[ttId] || []), newAssignment] }));
    toast.success('Manual assignment created successfully.');
    setManualAssignOpen(null);
  };

  const handleAddFaculty = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newFaculty = {
      id: `FAC_${Date.now()}`,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      empId: `EMP${Math.floor(Math.random() * 1000)}`,
      classes: [],
      subjects: []
    };
    setLocalFaculty(prev => [...prev, newFaculty]);
    toast.success('New faculty member added successfully.');
    setAddFacultyOpen(false);
  };

  if (previewFaculty) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden animate-in fade-in duration-300">
        <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-4">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setPreviewFaculty(null)}
              className="gap-2 h-8 font-medium text-xs shadow-sm hover:scale-105 transition-all"
            >
              <ChevronLeft size={16} /> Back to Faculty Management
            </Button>
            <div className="flex items-center gap-3 border-l border-white/20 pl-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span className="font-semibold text-sm tracking-wide">Live Preview: {previewFaculty.name}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 relative">
          <iframe 
            src={`/admin?preview=${previewFaculty.empId || previewFaculty.id}`}
            className="absolute inset-0 w-full h-full border-0 bg-background"
            title={`Preview of ${previewFaculty.name}'s Portal`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Users className="text-primary" size={24} /> Faculty Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Unified hub for faculty, syllabus, scheme, timetable, and AI assignments.</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 overflow-x-auto bg-muted/30 p-1 rounded-xl border border-border/50">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === t.key
                ? 'bg-background text-primary shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* FACULTY & COORDINATORS TAB */}
      {activeTab === 'faculty-coordinators' && (
        <div className="space-y-8">
          {/* Section 1: Faculty Master */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Faculty Master</h2>
              <p className="text-sm text-muted-foreground">The master database of all Faculty.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search master list..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">

                <Button variant="outline" className="gap-2 w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setShowDeleteAll(true)}>
                  <Trash2 size={16} /> Delete All Faculty
                </Button>

                <Button variant="outline" className="gap-2 w-full sm:w-auto border-primary/30 text-primary hover:bg-primary/5" onClick={() => document.getElementById('faculty-upload')?.click()}>
                  <Upload size={16} /> Upload Faculty List
                </Button>
                <input id="faculty-upload" type="file" className="hidden" accept=".xlsx,.csv" onChange={e => { setUploadFile(e.target.files?.[0] || null); setTimeout(() => document.getElementById('btn-faculty-validate')?.click(), 100); }} />
                <Button id="btn-faculty-validate" className="hidden" onClick={handleUploadValidate}>
                </Button>
                <Button className="gap-2 w-full sm:w-auto shadow-md" onClick={() => setAddFacultyOpen(true)}>
                  <Plus size={16} /> Add Faculty
                </Button>
              </div>
            </div>
            
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-0 overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/60 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Role</th>
                      <th className="px-4 py-3 text-left font-semibold">Department</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredFaculty.map(f => (
                      <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {f.name ? f.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                            </div>
                            <span className="font-semibold text-foreground">{f.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{f.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={f.role === 'HOD' ? 'default' : f.role === 'COORDINATOR' ? 'secondary' : 'outline'} className="text-xs capitalize">{f.role}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{f.department?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {(f.role === 'FACULTY') && (
                              <Button size="sm" variant="outline" className="h-7 text-xs border-primary/20 text-primary hover:bg-primary/10" onClick={() => setShowCoordDialog(f)}>
                                Make Coordinator
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setViewFacultyDialog(f)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => handleDeleteFaculty(f.id)}>
                              <Trash2 size={14}/>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <hr className="border-border/50" />

          {/* Section 2: Faculty & Coordinator Overview */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Faculty & Coordinator Overview</h2>
              <p className="text-sm text-muted-foreground">Summary statistics and interactive profile cards.</p>
            </div>
            
            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{localFaculty.length}</p>
                    <p className="text-xs text-muted-foreground font-medium">Total Faculty</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{localFaculty.filter(f => f.role === 'COORDINATOR').length}</p>
                    <p className="text-xs text-muted-foreground font-medium">Coordinators</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{localFaculty.filter(f => (f.subjects || []).length > 0).length}</p>
                    <p className="text-xs text-muted-foreground font-medium">Assigned Subjects</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{localFaculty.filter(f => (f.classes || []).length > 0).length}</p>
                    <p className="text-xs text-muted-foreground font-medium">Assigned Classes</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFaculty.map(f => {
                const hasClasses = f.classes && f.classes.length > 0;
                const hasSubjects = f.subjects && f.subjects.length > 0;
                let displayRole = f.role;
                if (f.role !== 'HOD' && f.role !== 'ADMIN') {
                  if (f.role === 'COORDINATOR' || f.role === 'both') {
                     if (hasSubjects) displayRole = 'Faculty + Coordinator';
                     else displayRole = 'Coordinator';
                  } else {
                     displayRole = 'Faculty';
                  }
                }

                return (
                <Card key={f.id} className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex flex-col h-full relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg ring-2 ring-primary/5">
                          {f.name ? f.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{f.name}</h3>
                          <Badge variant={displayRole === 'HOD' || displayRole === 'ADMIN' ? 'default' : displayRole.includes('Coordinator') ? 'secondary' : 'outline'} className="text-[10px] mt-1 capitalize">{displayRole}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 flex-1">
                      <div className="bg-muted/40 rounded-lg p-3 space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><BookOpen size={12} /> Assigned Subjects</span>
                          {hasSubjects ? (
                            <div className="flex flex-wrap gap-1">
                              {f.subjects.map((sub: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-[10px] bg-background font-medium">{sub}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground italic">None</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap size={12} /> Assigned Classes</span>
                          {hasClasses ? (
                            <div className="flex flex-wrap gap-1">
                              {f.classes.map((cls: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-[10px] bg-background font-medium">{cls}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground italic">None</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-4 gap-2" 
                      variant="outline"
                      onClick={() => setPreviewFaculty(f)}
                    >
                      <Eye size={16} /> View Panel
                    </Button>
                  </CardContent>
                </Card>
              )})}
            </div>
          </div>
        </div>
      )}

      {/* SYLLABUS TAB */}
      {activeTab === 'syllabus' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Upload and manage academic syllabus. AI auto-detects subjects after processing.</p>
            <Button className="gap-2 shadow-sm" onClick={() => setSyllabusFormOpen(true)}>
              <Upload size={16} /> Upload Syllabus
            </Button>
          </div>
          <div className="grid gap-4">
            {isUploading && (
              <Card className="bg-muted/30 border border-primary/40 animate-pulse shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Uploading & Processing Academic Syllabus...</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">AI is extracting structure and detecting subjects. Please wait...</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {localSyllabus.map((s: any) => (
              <Card key={s.id} className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="text-primary" size={22} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{s.fileName || s.name || 'Syllabus.pdf'}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="font-medium">Batch:</span> {s.metadata?.batch || s.batch || 'N/A'}</span>
                          <span className="flex items-center gap-1"><span className="font-medium">Year:</span> {s.metadata?.academicYear || s.academicYear || 'N/A'}</span>
                          <span className="flex items-center gap-1"><span className="font-medium">Semester:</span> {s.metadata?.semester || s.semester || 'N/A'}</span>
                          <span className="flex items-center gap-1"><span className="font-medium">Class:</span> {s.metadata?.className || s.className || 'N/A'}</span>
                          <span className="flex items-center gap-1"><span className="font-medium">Dept:</span> {s.metadata?.department || s.department || 'N/A'}</span>
                          <span className="flex items-center gap-1"><span className="font-medium">Degree:</span> {s.metadata?.degree || s.degree || 'N/A'}</span>
                          <span className="flex items-center gap-1"><span className="font-medium">Date:</span> {s.uploadedAt ? new Date(s.uploadedAt).toLocaleDateString() : s.uploadDate || 'N/A'}</span>
                          <span className="flex items-center gap-1"><span className="font-medium">By:</span> {s.uploadedBy || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                        <Badge variant={(s.metadata?.status || s.status) === 'Processed' ? 'default' : 'secondary'} className="text-xs">
                          {(s.metadata?.status || s.status) === 'Processed' && <CheckCircle size={12} className="mr-1" />}{(s.metadata?.status || s.status || 'Processed')}
                        </Badge>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => s.documentUrl ? handleViewPdf(s.documentUrl, s.fileName || s.title || s.name) : toast.error('Document not available')}>
                            <Eye size={14} className="mr-1" /> View
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => setSyllabusToDelete(s.id)}>
                            <Trash2 size={14} className="mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  {(s.metadata?.detectedSubjects || s.detectedSubjects) && (
                    <div className="mt-4 bg-muted/20 rounded-lg p-3 border border-border/40">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <Sparkles size={12} className="text-primary" /> AI Detected Subjects ({s.metadata?.totalSubjects || s.totalSubjects || 0})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(s.metadata?.detectedSubjects || s.detectedSubjects || []).map((sub: any, i: number) => {
                          let t = (sub.type || 'Theory').trim();
                          if (!t || t === '' || t.toLowerCase() === 'null') t = 'Theory';
                          if (t.toLowerCase() === 'elective' || t.toLowerCase() === 'de') t = 'Departmental Elective';
                          if (t.toLowerCase() === 'open' || t.toLowerCase() === 'oe') t = 'Open Elective';
                          if (t.toLowerCase() === 'lab' || t.toLowerCase() === 'laboratory') t = 'Practical';
                          return (
                            <Badge key={i} variant="outline" className="text-xs gap-1">
                              <span className="font-mono text-primary">{sub.code || sub.subjectCode}</span> {sub.name || sub.subjectName}
                              <span className="text-muted-foreground font-semibold">({t})</span>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SCHEME TAB */}
      {activeTab === 'scheme' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Academic schemes define subject structure per semester.</p>
            <Button className="gap-2 shadow-sm" onClick={() => setSchemeFormOpen(true)}>
              <Upload size={16} /> Upload Scheme
            </Button>
          </div>
          <div className="grid gap-4">
            {localSchemes.map((s: any) => (
              <Card key={s.id} className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <FileText className="text-blue-500" size={22} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{s.fileName || s.name || 'Scheme.pdf'}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="font-medium">Department:</span> {s.metadata?.department || s.department || 'N/A'}</span>
                          <span className="flex items-center gap-1"><span className="font-medium">Batch:</span> {s.metadata?.batch || s.batch || 'N/A'}</span>
                          <span className="flex items-center gap-1"><span className="font-medium">Year:</span> {s.metadata?.academicYear || s.academicYear || 'N/A'}</span>
                          <span className="flex items-center gap-1"><span className="font-medium">Semester:</span> {s.metadata?.semester || s.semester || 'N/A'}</span>
                          <span className="flex items-center gap-1"><span className="font-medium">Class:</span> {s.metadata?.className || s.className || 'N/A'}</span>
                          <span className="flex items-center gap-1"><span className="font-medium">Uploaded By:</span> {s.uploadedBy || 'N/A'}</span>
                          <span className="flex items-center gap-1"><span className="font-medium">Upload Date:</span> {s.uploadedAt ? new Date(s.uploadedAt).toLocaleDateString() : s.uploadDate || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={(s.metadata?.status || s.status) === 'Processed' ? 'default' : 'secondary'} className="text-xs">
                        {(s.metadata?.status || s.status) === 'Processed' && <CheckCircle size={12} className="mr-1" />}{(s.metadata?.status || s.status || 'Processed')}
                      </Badge>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => s.documentUrl ? handleViewPdf(s.documentUrl, s.fileName || s.title || s.name) : toast.error('Document not available')}>
                          <Eye size={14} className="mr-1" /> View
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setUploadDialog({ isOpen: true, type: 'scheme', replaceId: s.id })}>
                          <RefreshCcw size={14} className="mr-1" /> Replace
                        </Button>
                        <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => setSchemeToDelete(s.id)}>
                          <Trash2 size={14} className="mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                  {(s.subjects && s.subjects.length > 0) && (
                    <div className="mt-4 bg-muted/20 rounded-lg p-3 border border-border/40">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <Sparkles size={12} className="text-blue-500" /> Subjects ({s.totalSubjects || s.subjects.length || 0})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(s.subjects || []).map((sub: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs gap-1">
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TIMETABLE TAB */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          {/* Existing Timetables */}
          <div className="flex justify-between items-center mt-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Clock size={18} className="text-primary"/> Class Timetables</h3>
            <Button className="gap-2 shadow-sm" variant="outline" onClick={() => setTimetableFormOpen(true)}>
              <Upload size={16} /> Upload Timetable
            </Button>
          </div>
          <div className="grid gap-4">
            {localTimetables.map((tt: any) => {
              const yearValue = tt.metadata?.academicYear || '1';
              return (
              <Card key={tt.id} className="bg-card border-border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="text-primary" size={22} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{tt.fileName || tt.name || 'Timetable.pdf'}</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span className="font-medium text-primary">Department:</span> <span>{tt.metadata?.department || tt.department || 'N/A'}</span>
                        <span>•</span>
                        <span className="font-medium text-primary">Batch:</span> <span>{tt.metadata?.batch || tt.batch || 'N/A'}</span>
                        <span>•</span>
                        <span className="font-medium text-primary">Year:</span> <span>{yearValue}</span>
                        <span>•</span>
                        <span className="font-medium text-primary">Sem:</span> <span>{tt.metadata?.semester || tt.semester || 'N/A'}</span>
                        <span>•</span>
                        <span className="font-medium text-primary">Class:</span> <span>{tt.metadata?.className || tt.className || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                        <div className="flex gap-3">
                          <span>Uploaded by: <strong className="text-foreground">{tt.uploadedBy || 'N/A'}</strong></span>
                          <span>Date: <strong className="text-foreground">{tt.uploadedAt ? new Date(tt.uploadedAt).toLocaleDateString() : 'N/A'}</strong></span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => handleViewPdf(tt.documentUrl, tt.fileName || tt.name)}>
                          <Eye size={14} /> View
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setUploadDialog({ isOpen: true, type: 'timetable', replaceId: tt.id })}>
                          <RefreshCcw size={14} /> Replace
                        </Button>
                        <Button size="sm" variant="default" className="h-8 text-xs gap-1" onClick={() => runAIAssignment(tt.id)} disabled={isAILoading[tt.id]}>
                          {isAILoading[tt.id] ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Match
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteConfirmDialog(tt.id)}>
                          <Trash2 size={14} /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        </div>
      )}

      <MakeCoordinatorDialog 
        open={!!showCoordDialog} 
        faculty={showCoordDialog} 
        onClose={() => setShowCoordDialog(null)} 
        onSave={handleMakeCoordinator} 
      />
      
      <AcademicResourceDialog 
        open={syllabusFormOpen} 
        type="syllabus" 
        onClose={() => setSyllabusFormOpen(false)} 
        onUpload={handleAcademicResourceUpload} 
      />

      <AcademicResourceDialog 
        open={schemeFormOpen} 
        type="scheme" 
        onClose={() => setSchemeFormOpen(false)} 
        onUpload={handleAcademicResourceUpload} 
      />

      <AcademicResourceDialog 
        open={timetableFormOpen} 
        type="timetable" 
        onClose={() => setTimetableFormOpen(false)} 
        onUpload={handleAcademicResourceUpload} 
      />

      {/* Edit Faculty Dialog */}
      <Dialog open={!!viewFacultyDialog} onOpenChange={() => setViewFacultyDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 size={18} className="text-primary" /> Edit Faculty Details
            </DialogTitle>
          </DialogHeader>
          {viewFacultyDialog && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              setLocalFaculty(prev => prev.map(f => f.id === viewFacultyDialog.id ? {
                ...f,
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                role: formData.get('role') as string,
                dept: formData.get('dept') as string,
              } : f));
              toast.success('Faculty details updated successfully.');
              setViewFacultyDialog(null);
            }} className="space-y-4 py-2">
              <div className="flex items-center gap-4 border-b border-border/50 pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                  {viewFacultyDialog.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1 space-y-2">
                  <Input name="name" defaultValue={viewFacultyDialog.name} placeholder="Full Name" required />
                  <Input name="email" type="email" defaultValue={viewFacultyDialog.email} placeholder="Email" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Role</Label>
                  <select name="role" defaultValue={viewFacultyDialog.role} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none">
                    <option value="faculty">Faculty</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="both">Both</option>
                    <option value="hod">HOD</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Department</Label>
                  <select name="dept" defaultValue={viewFacultyDialog.department?.name || ''} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none">
                    <option value="IT">IT</option>
                    <option value="CS">CS</option>
                    <option value="DS">DS</option>
                  </select>
                </div>
              </div>
              {((viewFacultyDialog.classes && viewFacultyDialog.classes.length > 0) || (viewFacultyDialog.subjects && viewFacultyDialog.subjects.length > 0)) && (
                <div className="space-y-3 pt-2">
                  {viewFacultyDialog.classes && viewFacultyDialog.classes.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Assigned Classes</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(viewFacultyDialog.classes || []).map((c: string) => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewFacultyDialog.subjects && viewFacultyDialog.subjects.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Assigned Subjects</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(viewFacultyDialog.subjects || []).map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setViewFacultyDialog(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog.isOpen} onOpenChange={(open) => !isUploading && setUploadDialog({ isOpen: open, type: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 capitalize">
              <FileUp size={18} className="text-primary" /> 
              {uploadDialog.replaceId ? 'Replace' : 'Upload'} {uploadDialog.type}
            </DialogTitle>
            <DialogDescription>
              {uploadDialog.type === 'timetable'
                ? `Select a .pdf, .png, .jpg, or .jpeg file to ${uploadDialog.replaceId ? 'replace' : 'upload'}.`
                : 'Select a .csv, .xlsx, or .pdf file to upload.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/20">
            {isUploading ? (
              <div className="w-full px-8 space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>Uploading...</span>
                  <span className="text-primary">{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <>
                <Upload size={32} className="text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drag & drop or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadDialog.type === 'timetable' ? 'Supports PDF, PNG, JPG, JPEG (Max 10MB)' : 'Supports PDF, XLSX, CSV (Max 10MB)'}
                </p>
                <input type="file" 
                  accept={uploadDialog.type === 'timetable' ? '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg,image/jpg' : '.xlsx,.csv,.pdf'}
                  className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    if (uploadDialog.type === 'timetable' && uploadDialog.replaceId) {
                      handleReplaceTimetable(uploadDialog.replaceId, e.target.files[0]);
                    } else if (uploadDialog.type) {
                      simulateUpload(uploadDialog.type);
                    }
                  }
                }} />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadDialog({ isOpen: false, type: null })} disabled={isUploading}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Faculty Dialog */}
      <Dialog open={addFacultyOpen} onOpenChange={setAddFacultyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus size={18} className="text-primary" /> Add New Faculty</DialogTitle>
            <DialogDescription>Create a new faculty profile. They will receive an email to set their password.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddFaculty} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="Dr. John Doe" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="john.doe@acropolis.in" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="role">Role</Label>
                <select id="role" name="role" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none">
                  <option value="faculty">Faculty</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="hod">HOD</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="dept">Department</Label>
                <select id="dept" name="dept" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none">
                  <option value="IT">IT</option>
                  <option value="DS">DS</option>
                  <option value="CS">CS</option>
                </select>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setAddFacultyOpen(false)}>Cancel</Button>
              <Button type="submit">Add Faculty</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Manual Assignment Dialog */}
      <Dialog open={!!manualAssignOpen} onOpenChange={(open) => !open && setManualAssignOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit2 size={18} className="text-primary" /> Manual Faculty Assignment</DialogTitle>
            <DialogDescription>Override or assign a subject to a faculty member manually.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManualAssignment} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="facultyName">Select Faculty</Label>
              <select id="facultyName" name="facultyName" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none">
                {localFaculty.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="year">Academic Year</Label>
                <select id="year" name="year" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none">
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="semester">Semester</Label>
                <select id="semester" name="semester" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none">
                  <option value="Semester 3">Sem 3</option>
                  <option value="Semester 4">Sem 4</option>
                  <option value="Semester 5">Sem 5</option>
                  <option value="Semester 6">Sem 6</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="className">Class</Label>
                <select id="className" name="className" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none">
                  {mockData.classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" placeholder="e.g. Advanced Java" required />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setManualAssignOpen(null)}>Cancel</Button>
              <Button type="submit">Create Assignment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>



      {/* Unmatched Faculty Dialog */}
      <Dialog open={!!unmatchedFacultyDialog} onOpenChange={() => setUnmatchedFacultyDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={18} /> Faculty Not Found
            </DialogTitle>
            <DialogDescription>
              The faculty "<strong className="text-foreground">{unmatchedFacultyDialog?.slot?.faculty}</strong>" mentioned in the timetable does not exist in the Master List.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Button className="w-full gap-2" onClick={() => { 
              setUnmatchedFacultyDialog(null); 
              setActiveTab('faculty-coordinators');
              setAddFacultyOpen(true);
            }}>
              <UserPlus size={16} /> Add to Master List
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={() => {
              setReplaceFacultyDialog(unmatchedFacultyDialog);
              setUnmatchedFacultyDialog(null);
            }}>
              <RefreshCcw size={16} /> Replace with Existing Faculty
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Replace Faculty Dialog */}
      <Dialog open={!!replaceFacultyDialog} onOpenChange={() => setReplaceFacultyDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCcw size={18} className="text-primary" /> Replace Faculty
            </DialogTitle>
            <DialogDescription>
              Select a faculty member from the Master List to replace "<strong className="text-foreground">{replaceFacultyDialog?.slot?.faculty}</strong>" for the {replaceFacultyDialog?.slot?.subject} class on {replaceFacultyDialog?.slot?.day} at {replaceFacultyDialog?.slot?.time}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newFacultyName = formData.get('newFacultyName') as string;
            
            setLocalTimetables(prev => prev.map((tt: any) => {
              if (tt.id === replaceFacultyDialog.tt.id) {
                return {
                  ...tt,
                  slots: tt.slots.map((s: any) => 
                    (s === replaceFacultyDialog.slot) 
                      ? { ...s, faculty: newFacultyName } 
                      : s
                  )
                };
              }
              return tt;
            }));
            
            toast.success(`Successfully assigned ${newFacultyName} to the slot.`);
            setReplaceFacultyDialog(null);
          }} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="newFacultyName">Select Faculty</Label>
              <select id="newFacultyName" name="newFacultyName" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none">
                {localFaculty.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setReplaceFacultyDialog(null)}>Cancel</Button>
              <Button type="submit">Replace Faculty</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* View Timetable Modal */}
      <Dialog open={!!viewTimetableDialog} onOpenChange={() => setViewTimetableDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border/40">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <File className="text-primary" size={20} />
                  {viewTimetableDialog?.name || 'Timetable Preview'}
                </DialogTitle>
                <DialogDescription className="mt-2 flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">{viewTimetableDialog?.academicYear}</Badge>
                  <Badge variant="secondary">{viewTimetableDialog?.semester}</Badge>
                  <Badge variant="outline">{viewTimetableDialog?.className}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <Clock size={12} /> Uploaded: {viewTimetableDialog?.uploadDate}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/10 p-6 flex flex-col items-center justify-center min-h-[400px]">
            {/* Simulated PDF/Image Preview */}
            <div className="w-full max-w-2xl bg-card border border-border shadow-sm rounded-lg overflow-hidden flex flex-col items-center justify-center p-12 text-center">
              <FileText size={64} className="text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">{viewTimetableDialog?.fileName || 'timetable_document.pdf'}</h3>
              <p className="text-sm text-muted-foreground mb-6">File preview is available. In a production environment, the actual PDF, Excel, or Image file would be rendered here.</p>
              <div className="flex gap-4">
                <Button variant="outline" className="gap-2" onClick={() => toast.info('Download simulated')}>
                  <Download size={16} /> Download Source
                </Button>
                <Button className="gap-2" onClick={() => {
                  setUploadDialog({ isOpen: true, type: 'timetable', replaceId: viewTimetableDialog?.id });
                  setViewTimetableDialog(null);
                }}>
                  <RefreshCcw size={16} /> Replace File
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Final Confirm Dialog - Full System Configuration */}
      <Dialog open={!!finalConfirmOpen} onOpenChange={() => setFinalConfirmOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-600" /> Approve & Configure System
            </DialogTitle>
            <DialogDescription>
              This will perform the following actions automatically:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-3">
            <div className="flex items-center gap-2 text-sm"><CheckCircle size={14} className="text-green-500 shrink-0" /> Assign subjects & classes to faculty</div>
            <div className="flex items-center gap-2 text-sm"><CheckCircle size={14} className="text-green-500 shrink-0" /> Promote students to next semester</div>
            <div className="flex items-center gap-2 text-sm"><CheckCircle size={14} className="text-green-500 shrink-0" /> Reset attendance, assignments, quizzes & events</div>
            <div className="flex items-center gap-2 text-sm"><CheckCircle size={14} className="text-green-500 shrink-0" /> Update all dashboards automatically</div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setFinalConfirmOpen(null)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={handleFinalConfirm}>
              <Sparkles size={14} /> Approve & Configure All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Syllabus Confirmation Dialog */}
      <Dialog open={!!syllabusToDelete} onOpenChange={() => setSyllabusToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Delete Syllabus
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to permanently delete this syllabus document?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSyllabusToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSyllabus}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Scheme Confirmation Dialog */}
      <Dialog open={!!schemeToDelete} onOpenChange={() => setSchemeToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Delete Scheme
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to permanently delete this scheme document?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSchemeToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteScheme}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboarding Success Dialog */}
      <Dialog open={!!onboardingSuccessCoord} onOpenChange={() => setOnboardingSuccessCoord(null)}>
        <DialogContent className="sm:max-w-md border-primary/20">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
              <Sparkles size={32} />
            </div>
            <DialogTitle className="text-2xl font-bold">Account Created!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              <strong className="text-foreground">{onboardingSuccessCoord?.name}</strong> has successfully completed onboarding. The AI has automatically linked their academic profile.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/30 rounded-xl p-4 border border-border/50 my-2 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Brain size={16} className="text-primary" /> Auto-Assigned Profile
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Role</p>
                <p className="font-medium capitalize">{onboardingSuccessCoord?.role}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Department</p>
                <p className="font-medium">{onboardingSuccessCoord?.department?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Assigned Classes</p>
                <p className="font-medium">{onboardingSuccessCoord?.classes?.length ? onboardingSuccessCoord.classes.join(', ') : 'None'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Assigned Subjects</p>
                <p className="font-medium">{onboardingSuccessCoord?.subjects?.length ? onboardingSuccessCoord.subjects.length : 'None'}</p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-center pt-2">
            <Button 
              className="w-full gap-2 text-md py-6 shadow-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white" 
              onClick={() => {
                login(onboardingSuccessCoord?.role || 'coordinator', onboardingSuccessCoord?.id);
                navigate('/admin');
              }}
            >
              <Sparkles size={18} /> Open {onboardingSuccessCoord?.role === 'both' ? 'Unified' : 'Coordinator'} Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    Faculty Upload Review
                  </h2>
                  <p className="text-sm text-muted-foreground">{uploadFile?.name || 'document.pdf'}</p>
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
                 <span className="font-semibold text-sm text-green-600">{validationResult?.validCount || 0}</span>
               </div>
               <div className="w-px h-8 bg-border"></div>
               <div className="flex flex-col items-end">
                 <span className="text-xs text-muted-foreground">Warning Count</span>
                 <span className="font-semibold text-sm text-orange-500">{validationResult?.warningCount || 0}</span>
               </div>
               <div className="w-px h-8 bg-border"></div>
               <div className="flex flex-col items-end">
                 <span className="text-xs text-muted-foreground">Invalid Records</span>
                 <span className="font-semibold text-sm text-red-500">{validationResult?.errorCount || 0}</span>
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
                  <div><p className="text-xs text-muted-foreground font-medium">Ready to Import</p><p className="text-xl font-bold">{validationResult?.validCount || 0}</p></div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500"><AlertTriangle size={18}/></div>
                  <div><p className="text-xs text-muted-foreground font-medium">Warnings</p><p className="text-xl font-bold">{validationResult?.warningCount || 0}</p></div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500"><XCircle size={18}/></div>
                  <div><p className="text-xs text-muted-foreground font-medium">Errors</p><p className="text-xl font-bold">{validationResult?.errorCount || 0}</p></div>
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
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        {Object.keys(record).map((col, cIdx) => (
                          <td key={cIdx} className="px-4 py-3 text-xs whitespace-nowrap">
                            {editingRowIdx === idx ? (
                              <Input
                                value={record[col] || ''}
                                onChange={(e) => handleCellEdit(idx, col, e.target.value)}
                                className="h-7 text-xs px-2 min-w-[100px]"
                              />
                            ) : (
                              record[col] || '-'
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-xs whitespace-nowrap text-right">
                          {editingRowIdx === idx ? (
                            <Button size="sm" variant="ghost" className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => toggleEditRow(idx)}>Done</Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => toggleEditRow(idx)}><Edit2 size={14} className="mr-1" /> Edit</Button>
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
                  <AlertTriangle size={16} /> Data Warnings ({validationResult.issuesFound || validationResult.issues.length})
                </h3>
                <div className="space-y-2 max-h-[15vh] overflow-y-auto pr-2">
                  {validationResult.issues.map((issue: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm bg-background/50 p-2 rounded border border-border/50">
                      <span className="text-orange-500 font-mono text-xs mt-0.5 whitespace-nowrap">Row {issue.rowNumber}:</span>
                      <span className="text-muted-foreground">
                        {issue.issueDescription || issue.errorMessage || `Missing or invalid ${issue.field}.`}
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
            <Button onClick={handleConfirmImport} disabled={isUploading || editingRowIdx !== null}>
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
              The faculty list upload process has finished. Here is the summary.
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
                      <span className="font-mono text-red-500">Row {err.rowNumber} (Emp ID: {err.enrollmentNo || 'N/A'})</span>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Delete All Faculty
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you absolutely sure you want to <strong>permanently delete all faculty and coordinator records?</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2 py-2">
            <p>This action cannot be undone. It will:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Delete all faculty user accounts</li>
              <li>Unassign coordinators from their departments</li>
              <li>Remove all faculty-to-class-subject associations</li>
              <li>Clear all faculty assignments from timetable slots</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteAll(false)} disabled={isDeletingAll}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeletingAll}>
              {isDeletingAll ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Timetable AI Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={() => setReviewDialogOpen(false)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border/40">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Brain className="text-primary" size={20} />
                  AI Timetable Review & Assignment
                </DialogTitle>
                <DialogDescription className="mt-2 flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">Dept: {reviewData?.department}</Badge>
                  <Badge variant="secondary">Year: {reviewData?.academicYear}</Badge>
                  <Badge variant="secondary">Sem: {reviewData?.semester}</Badge>
                  <Badge variant="outline">Class: {reviewData?.className}</Badge>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-muted/20">
            
            {/* Section 1: Coordinator Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield size={18} className="text-primary" /> Coordinator Assignment
              </h3>
              <div className="border rounded-lg bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium w-1/3">Original Name (From PDF)</th>
                      <th className="px-4 py-3 text-left font-medium w-1/2">Matched Faculty</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewData?.coordinatorAssignments?.map((coord: any, idx: number) => {
                      const isUnmatched = !coord.coordinatorId;
                      return (
                        <tr key={idx} className={`border-b last:border-0 ${isUnmatched ? 'bg-orange-500/10' : ''}`}>
                          <td className="px-4 py-3 font-medium">{coord.originalCoordinatorName || 'N/A'}</td>
                          <td className="px-4 py-3">
                            {isUnmatched ? (
                              <div className="flex items-center gap-2 text-orange-600 font-medium text-xs mb-2">
                                <AlertTriangle size={14} /> Needs Manual Review
                              </div>
                            ) : null}
                            <select 
                              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                              value={coord.coordinatorId || ''}
                              onChange={(e) => {
                                const selected = localFaculty.find(f => f.id === e.target.value);
                                handleUpdateCoordinator(idx, e.target.value, selected ? selected.name : '');
                              }}
                            >
                              <option value="">Select Coordinator...</option>
                              {localFaculty.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right align-top pt-4">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDeleteCoordinator(idx)}>
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {!reviewData?.coordinatorAssignments?.length && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No coordinators extracted.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Faculty Subject Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen size={18} className="text-primary" /> Faculty Subject Assignment
              </h3>
              <div className="border rounded-lg bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium w-1/4">Subject Code</th>
                      <th className="px-4 py-3 text-left font-medium w-1/3">Subject Name</th>
                      <th className="px-4 py-3 text-left font-medium w-1/3">Matched Faculty</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewData?.subjectAssignments?.map((sub: any, idx: number) => {
                      const isUnmatched = !sub.facultyId;
                      return (
                        <tr key={idx} className={`border-b last:border-0 ${isUnmatched ? 'bg-orange-500/10' : ''}`}>
                          <td className="px-4 py-3 font-medium">
                            <input 
                              type="text" 
                              className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm"
                              value={sub.subjectCode || ''}
                              onChange={(e) => {
                                const updated = [...reviewData.subjectAssignments];
                                updated[idx].subjectCode = e.target.value;
                                setReviewData({ ...reviewData, subjectAssignments: updated });
                              }}
                              placeholder="Code"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm"
                              value={sub.matchedSubjectName || sub.originalSubjectName || ''}
                              onChange={(e) => {
                                const updated = [...reviewData.subjectAssignments];
                                updated[idx].matchedSubjectName = e.target.value;
                                setReviewData({ ...reviewData, subjectAssignments: updated });
                              }}
                              placeholder="Subject Name"
                            />
                            {sub.originalSubjectName && <div className="text-xs text-muted-foreground mt-1">Original: {sub.originalSubjectName}</div>}
                          </td>
                          <td className="px-4 py-3">
                            {isUnmatched ? (
                              <div className="flex items-center gap-2 text-orange-600 font-medium text-xs mb-2">
                                <AlertTriangle size={14} /> Needs Manual Review
                              </div>
                            ) : null}
                            <select 
                              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                              value={sub.facultyId || ''}
                              onChange={(e) => {
                                const selected = localFaculty.find(f => f.id === e.target.value);
                                handleUpdateSubject(idx, e.target.value, selected ? selected.name : '');
                              }}
                            >
                              <option value="">Select Faculty...</option>
                              {localFaculty.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                            {sub.originalFacultyName && <div className="text-xs text-muted-foreground mt-1">Original: {sub.originalFacultyName}</div>}
                          </td>
                          <td className="px-4 py-3 text-right align-top pt-4">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDeleteSubject(idx)}>
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {!reviewData?.subjectAssignments?.length && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No subjects extracted.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-border/40 bg-card sm:justify-between">
            <Button variant="ghost" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAssignment} disabled={isConfirmingAssignment || (reviewData?.coordinatorAssignments?.some((c:any) => !c.coordinatorId) || reviewData?.subjectAssignments?.some((s:any) => !s.facultyId))}>
              {isConfirmingAssignment ? (
                <><Loader2 size={16} className="animate-spin mr-2" /> Confirming...</>
              ) : (
                'Confirm and Assign'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timetable Delete Dialog */}
      <Dialog open={!!deleteConfirmDialog} onOpenChange={() => setDeleteConfirmDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={18} /> Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this timetable?
              <br/><br/>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteConfirmDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (deleteConfirmDialog) handleDeleteTimetable(deleteConfirmDialog);
              setDeleteConfirmDialog(null);
            }}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
