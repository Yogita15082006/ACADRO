import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { BookOpen, FileText, Clock, Upload, Eye, RefreshCcw, Trash2, Search, Loader2, File, Calendar, Building2 } from 'lucide-react';
import { AcademicResourceDialog } from '../components/modals/AcademicResourceDialog';

type ResourceTab = 'scheme' | 'syllabus' | 'timetable';

export const AcademicResourcesModule: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<ResourceTab>('syllabus');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [localSchemes, setLocalSchemes] = useState<any[]>([]);
  const [localSyllabus, setLocalSyllabus] = useState<any[]>([]);
  const [localTimetables, setLocalTimetables] = useState<any[]>([]);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [replaceModal, setReplaceModal] = useState<{ open: boolean; resource: any | null }>({ open: false, resource: null });
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; resource: any | null }>({ open: false, resource: null });

  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [assignedDepartments, setAssignedDepartments] = useState<string[]>([]);
  const [assignedSemesters, setAssignedSemesters] = useState<string[]>([]);
  const [assignedBatches, setAssignedBatches] = useState<string[]>([]);

  // 1. Fetch assigned classes for role-based access control
  useEffect(() => {
    const fetchUserAssignments = async () => {
      const classesSet = new Set<string>();
      const deptsSet = new Set<string>();
      const semsSet = new Set<string>();
      const batchesSet = new Set<string>();

      if (user) {
        if (user.section) classesSet.add(user.section);
        if (user.className) classesSet.add(user.className);
        if (user.departmentName || (user as any).department) deptsSet.add(user.departmentName || (user as any).department);
        if (user.currentSemester || (user as any).semester) semsSet.add(String(user.currentSemester || (user as any).semester));
        if (user.batchYear || (user as any).batch) batchesSet.add(String(user.batchYear || (user as any).batch));
        if (Array.isArray(user.classes)) {
          user.classes.forEach((c: any) => typeof c === 'string' ? classesSet.add(c) : (c?.name && classesSet.add(c.name)));
        }
      }

      try {
        const res = await api.get('/v1/class-subjects/my-subjects');
        const subjects = res.data?.data || [];
        subjects.forEach((s: any) => {
          if (s.className) classesSet.add(s.className);
          if (s.classSection) classesSet.add(s.classSection);
          if (s.department) deptsSet.add(s.department);
          if (s.semester) semsSet.add(String(s.semester));
          if (s.batch) batchesSet.add(String(s.batch));
        });
      } catch (err) {
        console.error("Could not fetch assigned subjects for filtering:", err);
      }

      if (role === 'coordinator' || role === 'faculty') {
        try {
          const coordRes = await api.get('/v1/coordinator-assignments');
          const coords = coordRes.data?.data || [];
          coords.forEach((ca: any) => {
            if (ca.coordinatorId === user?.id || ca.coordinator?.email === user?.email || role === 'coordinator') {
              if (ca.className) classesSet.add(ca.className);
              if (ca.departmentName || ca.department) deptsSet.add(ca.departmentName || ca.department);
            }
          });
        } catch (e) {
          // Ignore errors if unauthorized
        }
      }

      setAssignedClasses(Array.from(classesSet));
      setAssignedDepartments(Array.from(deptsSet));
      setAssignedSemesters(Array.from(semsSet));
      setAssignedBatches(Array.from(batchesSet));
    };

    fetchUserAssignments();
  }, [user, role]);

  // 2. Fetch resources from central endpoint
  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/v1/academic-resources');
      const resources = response.data?.data || [];
      setLocalSyllabus(resources.filter((r: any) => r.fileType === 'SYLLABUS'));
      setLocalSchemes(resources.filter((r: any) => r.fileType === 'SCHEME'));
      setLocalTimetables(resources.filter((r: any) => r.fileType === 'TIMETABLE'));
    } catch (e) {
      console.error("Failed to fetch academic resources", e);
      toast.error("Could not load academic resources");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // 3. Role-based filtering function
  const filterResourceByRole = (res: any) => {
    if (role === 'hod' || role === 'admin' || !role) return true;

    const resClass = res.metadata?.className || res.className;
    const resDept = res.metadata?.department || res.metadata?.departmentName || res.department;
    const resSem = res.metadata?.semester || res.semester;
    const resBatch = res.metadata?.batch || res.metadata?.batchName || res.batch;

    if (role === 'student') {
      if (assignedClasses.length > 0 && resClass && !assignedClasses.includes(resClass)) return false;
      if (assignedSemesters.length > 0 && resSem && !assignedSemesters.includes(String(resSem))) return false;
      if (assignedDepartments.length > 0 && resDept && !assignedDepartments.includes(resDept)) return false;
      if (assignedBatches.length > 0 && resBatch && !assignedBatches.includes(String(resBatch))) return false;
      return true;
    }

    if (role === 'faculty' || role === 'coordinator') {
      if (assignedClasses.length > 0) {
        if (resClass && assignedClasses.includes(resClass)) return true;
        if (!resClass && resDept && assignedDepartments.includes(resDept)) return true;
        if (resClass && !assignedClasses.includes(resClass)) return false;
      }
      return true;
    }

    return true;
  };

  const canManageResource = (res: any) => {
    if (role === 'student') return false;
    if (role === 'hod' || role === 'admin') return true;
    if (role === 'coordinator' || role === 'faculty') {
      const resClass = res.metadata?.className || res.className;
      if (!resClass || assignedClasses.length === 0) return true;
      return assignedClasses.includes(resClass);
    }
    return false;
  };

  const canUpload = role === 'hod' || role === 'admin' || role === 'coordinator' || role === 'faculty';

  // 4. Document View Handler (supports PDF, JPG, JPEG, PNG)
  const handleViewPdf = async (doc: any) => {
    const url = doc.documentUrl || `/v1/academic-resources/${doc.id}/download`;
    const providedFileName = doc.fileName || doc.title || 'Document';
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      toast.error('Please allow popups to view the document');
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
            <title>${detectedName}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                margin: 0; padding: 0; background-color: #0f172a; color: #f8fafc;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex; flex-direction: column; min-height: 100vh;
              }
              .header {
                position: sticky; top: 0; z-index: 10; background-color: #1e293b;
                border-bottom: 1px solid #334155; padding: 12px 24px;
                display: flex; justify-content: space-between; align-items: center;
              }
              .title { font-weight: 600; font-size: 16px; }
              .badge { background-color: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
              .image-container {
                flex: 1; display: flex; justify-content: center; align-items: center; padding: 24px;
              }
              img { max-width: 95%; max-height: 85vh; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${detectedName} <span class="badge">Image Preview</span></div>
            </div>
            <div class="image-container">
              <img src="${objectUrl}" alt="${detectedName}" />
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
    } catch (error: any) {
      console.error("Failed to load preview:", error);
      newWindow.document.open();
      newWindow.document.write(`
        <div style="font-family: sans-serif; padding: 20px; color: #dc2626;">
          <h3>Failed to load document preview</h3>
          <p>Error: ${error.response?.data?.message || 'The file could not be fetched from the server.'}</p>
        </div>
      `);
      newWindow.document.close();
      toast.error('Failed to load document preview.');
    }
  };

  // 5. Upload Handler
  const handleFileUpload = async (type: string, data: any, file: File) => {
    setUploadDialogOpen(false);
    setIsUploading(true);

    if (type === 'syllabus') {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('academicYear', data.year || '2023-2024');
      if (data.batch) formData.append('batch', data.batch);
      if (data.className) formData.append('className', data.className);
      if (data.department) formData.append('department', data.department);
      if (data.degree) formData.append('degree', data.degree);
      formData.append('semester', data.semester || '5');

      try {
        await api.post('/v1/academic-resources/syllabus', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Syllabus uploaded successfully.');
        fetchResources();
      } catch (error: any) {
        toast.error(`Error: ${error.response?.data?.message || 'Failed to upload syllabus'}`);
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
      formData.append('academicYear', data.year || '1');
      if (data.batch) formData.append('batchName', data.batch);
      if (data.className) formData.append('className', data.className);
      if (data.department) formData.append('departmentName', data.department || 'Computer Science & Engineering');
      formData.append('semesterName', data.semester || '1');

      try {
        await api.post('/v1/timetables/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Timetable uploaded successfully.');
        fetchResources();
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to upload timetable');
      } finally {
        setIsUploading(false);
      }
    } else {
      const formData = new FormData();
      formData.append('file', file);
      if (data.year) formData.append('academicYear', data.year);
      if (data.batch) formData.append('batch', data.batch);
      if (data.className) formData.append('className', data.className);
      if (data.department) formData.append('department', data.department);
      if (data.degree) formData.append('degree', data.degree);
      if (data.semester) formData.append('semester', data.semester);

      try {
        await api.post('/v1/academic-resources/scheme', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Scheme uploaded successfully.');
        fetchResources();
      } catch (e: any) {
        toast.error('Failed to upload scheme');
      } finally {
        setIsUploading(false);
      }
    }
  };

  // 6. Replace Handler
  const confirmReplace = async () => {
    if (!replaceFile || !replaceModal.resource) return;
    const res = replaceModal.resource;
    setIsUploading(true);

    if (res.fileType === 'TIMETABLE') {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const fileName = replaceFile.name ? replaceFile.name.toLowerCase() : '';
      const validExt = fileName.endsWith('.pdf') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
      if (!allowedTypes.includes(replaceFile.type) && !validExt) {
        toast.error('Unsupported file format. Please upload a PDF, PNG, JPG, or JPEG file.');
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      const dept = res.metadata?.department || res.department || 'Computer Science & Engineering';
      const cls = res.metadata?.className || res.className || 'CS-1';
      const batch = res.metadata?.batch || res.batch || '';
      const sem = res.metadata?.semester || res.semester || '1';
      const yr = res.metadata?.academicYear || res.academicYear || '1';

      formData.append('file', replaceFile);
      formData.append('academicYear', yr);
      if (batch) formData.append('batchName', batch);
      formData.append('className', cls);
      formData.append('departmentName', dept);
      formData.append('semesterName', sem);

      try {
        await api.post(`/v1/timetables/${res.id}/replace`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Timetable replaced successfully.');
        setReplaceModal({ open: false, resource: null });
        setReplaceFile(null);
        fetchResources();
      } catch (e: any) {
        toast.error(`Failed to replace timetable: ${e.response?.data?.message || e.message}`);
      } finally {
        setIsUploading(false);
      }
    } else {
      // For Scheme or Syllabus replace: soft delete old and post new
      try {
        await api.delete('/v1/academic-resources/' + res.id);
        const formData = new FormData();
        formData.append('file', replaceFile);
        formData.append('academicYear', res.metadata?.academicYear || res.academicYear || '2023-2024');
        if (res.metadata?.batch || res.batch) formData.append('batch', res.metadata?.batch || res.batch);
        if (res.metadata?.className || res.className) formData.append('className', res.metadata?.className || res.className);
        if (res.metadata?.department || res.department) formData.append('department', res.metadata?.department || res.department);
        formData.append('semester', res.metadata?.semester || res.semester || '5');

        const endpoint = res.fileType === 'SCHEME' ? '/v1/academic-resources/scheme' : '/v1/academic-resources/syllabus';
        await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success(`${res.fileType} replaced successfully.`);
        setReplaceModal({ open: false, resource: null });
        setReplaceFile(null);
        fetchResources();
      } catch (e: any) {
        toast.error(`Failed to replace ${res.fileType}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // 7. Delete Handler
  const confirmDelete = async () => {
    if (!deleteConfirm.resource) return;
    const res = deleteConfirm.resource;
    try {
      if (res.fileType === 'TIMETABLE') {
        await api.delete('/v1/timetables/' + res.id);
      } else {
        await api.delete('/v1/academic-resources/' + res.id);
      }
      toast.success('Resource deleted successfully.');
      setDeleteConfirm({ open: false, resource: null });
      fetchResources();
    } catch (e: any) {
      toast.error(`Failed to delete resource: ${e.response?.data?.message || 'Error occurred'}`);
    }
  };

  const getActiveList = () => {
    let list: any[] = [];
    if (activeTab === 'scheme') list = localSchemes;
    if (activeTab === 'syllabus') list = localSyllabus;
    if (activeTab === 'timetable') list = localTimetables;

    return list
      .filter(filterResourceByRole)
      .filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          (item.fileName && item.fileName.toLowerCase().includes(q)) ||
          (item.metadata?.className && item.metadata.className.toLowerCase().includes(q)) ||
          (item.metadata?.department && item.metadata.department.toLowerCase().includes(q)) ||
          (item.uploadedBy && item.uploadedBy.toLowerCase().includes(q))
        );
      });
  };

  const currentList = getActiveList();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="text-indigo-400 h-7 w-7" />
            Academic Resources Repository
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Access, upload, and manage academic schemes, syllabi, and timetables.
          </p>
        </div>
        {canUpload && (
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
          >
            <Upload className="h-4 w-4" />
            Upload Resource
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'syllabus' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('syllabus')}
            className="gap-2 font-medium"
          >
            <BookOpen className="h-4 w-4" />
            Academic Syllabus
          </Button>
          <Button
            variant={activeTab === 'scheme' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('scheme')}
            className="gap-2 font-medium"
          >
            <FileText className="h-4 w-4" />
            Academic Scheme
          </Button>
          <Button
            variant={activeTab === 'timetable' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('timetable')}
            className="gap-2 font-medium"
          >
            <Clock className="h-4 w-4" />
            Timetables
          </Button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background shadow-sm"
          />
        </div>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : currentList.length === 0 ? (
        <Card className="border-dashed py-16 text-center shadow-none bg-slate-50/50 dark:bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <File className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-lg font-semibold text-foreground">No resources available</div>
            <p className="text-sm text-muted-foreground max-w-sm">
              No documents found matching your filter criteria or accessible within your assigned permissions.
            </p>
            {canUpload && (
              <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)} className="mt-2 gap-2">
                <Upload className="h-3.5 w-3.5" /> Upload Now
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map((res: any) => {
            const canManage = canManageResource(res);
            const fileName = res.fileName || res.name || 'Document.pdf';
            const semester = res.metadata?.semester || res.semester;
            const className = res.metadata?.className || res.className;
            const dept = res.metadata?.department || res.metadata?.departmentName || res.department;
            const uploadDate = res.uploadedAt ? new Date(res.uploadedAt).toLocaleDateString() : 'Recent';

            return (
              <Card key={res.id} className="group hover:shadow-md transition-all duration-200 border border-border/70 overflow-hidden flex flex-col justify-between bg-card">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
                      {activeTab === 'timetable' ? <Clock className="h-5 w-5" /> : activeTab === 'syllabus' ? <BookOpen className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {semester && <Badge variant="secondary" className="font-semibold">Sem {semester}</Badge>}
                      {className && <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold">{className}</Badge>}
                    </div>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground line-clamp-1 mt-3 title" title={fileName}>
                    {fileName}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 pt-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs text-muted-foreground mb-4">
                    {dept && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span className="line-clamp-1">{dept}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs font-medium text-foreground/80">By: {res.uploadedBy || 'Faculty'}</span>
                      <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-3 w-3" /> {uploadDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPdf(res)}
                      className="flex-1 gap-1.5 font-semibold text-xs h-9"
                    >
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      View
                    </Button>

                    {canManage && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplaceFile(null);
                            setReplaceModal({ open: true, resource: res });
                          }}
                          className="px-2.5 h-9"
                          title="Replace Document"
                        >
                          <RefreshCcw className="h-3.5 w-3.5 text-amber-500" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm({ open: true, resource: res })}
                          className="px-2.5 h-9 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950"
                          title="Delete Resource"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <AcademicResourceDialog
        open={uploadDialogOpen}
        type={activeTab}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleFileUpload}
        allowedClasses={role === 'hod' || role === 'admin' ? undefined : assignedClasses}
        allowedDepartments={role === 'hod' || role === 'admin' ? undefined : assignedDepartments}
      />

      {/* Replace Dialog */}
      <Dialog open={replaceModal.open} onOpenChange={(open) => !open && setReplaceModal({ open: false, resource: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RefreshCcw className="h-5 w-5 text-amber-500" /> Replace Document</DialogTitle>
            <DialogDescription>
              Upload a new file to replace <strong>{replaceModal.resource?.fileName || 'this resource'}</strong>. The previous version will be archived.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              {replaceModal.resource?.fileType === 'TIMETABLE' ? 'New Timetable Document (PDF, PNG, JPG, JPEG)' : 'New PDF Document'}
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/20 flex flex-col items-center justify-center relative cursor-pointer hover:bg-muted/40 transition-colors">
              <Upload size={24} className="text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-center">{replaceFile ? replaceFile.name : "Drag & drop or click to browse new file"}</p>
              <input
                type="file"
                accept={replaceModal.resource?.fileType === 'TIMETABLE' ? ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg,image/jpg" : ".pdf"}
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => e.target.files && setReplaceFile(e.target.files[0])}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setReplaceModal({ open: false, resource: null })}>Cancel</Button>
            <Button disabled={!replaceFile || isUploading} onClick={confirmReplace} className="gap-2">
              {isUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Replacing...</> : 'Confirm Replace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, resource: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive font-bold">Delete Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{deleteConfirm.resource?.fileName || 'this resource'}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteConfirm({ open: false, resource: null })}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete Immediately</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default AcademicResourcesModule;
