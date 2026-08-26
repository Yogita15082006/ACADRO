import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { mockData } from '../data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, BookOpen, Plus, FileText, Calendar, Bell, ClipboardList, CheckCircle2, TrendingUp, MessageSquare, Upload, File, ArrowLeft, ClipboardCheck, Eye, Sparkles, Trash2, Download, Image as ImageIcon } from 'lucide-react';
import { AssignmentModule } from './AssignmentModule';
import { QuizModule } from './QuizModule';
import { SubjectAttendancePanel } from './SubjectAttendancePanel';
import { SubjectAnalyticsPanel } from './SubjectAnalyticsPanel';
import { SubjectSyllabusView } from './SubjectSyllabusView';

export const ClassesModule = () => {
  const { role, user } = useAuth();

  const [workspaces, setWorkspaces] = useState<any[]>([]);

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get('/v1/class-subjects/my-subjects');
      setWorkspaces(res.data?.data || []);
    } catch (e) {
      console.error('Failed to fetch subjects', e);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const [activeWorkspace, setActiveWorkspace] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'announcements' | 'materials' | 'assignments' | 'quizzes' | 'attendance' | 'analytics'>('overview');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ 
    subjectName: '', 
    year: '', 
    semester: '', 
    className: '', 
    facultyName: '', 
    coordinatorName: '',
    subjectCode: '',
    color: ''
  });
  
  const [isPostAnnouncementOpen, setIsPostAnnouncementOpen] = useState(false);
  const [isUploadMaterialOpen, setIsUploadMaterialOpen] = useState(false);
  const visibleWorkspaces = workspaces;

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState('Normal');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null);

  const fetchAnnouncements = async (silent = false) => {
    if (!activeWorkspace) return;
    try {
      if (!silent) setLoadingAnnouncements(true);
      const res = await api.get(`/v1/subject-announcements/subject/${activeWorkspace}`);
      if (res.data && res.data.data) {
        setAnnouncements(res.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch subject announcements', e);
      if (!silent) setAnnouncements([]);
    } finally {
      if (!silent) setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace && activeTab === 'announcements') {
      fetchAnnouncements();
      const interval = setInterval(() => {
        fetchAnnouncements(true);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeWorkspace, activeTab]);

  const handlePostAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      alert("Please fill in both title and content for the announcement.");
      return;
    }
    try {
      const payload = {
        title: announcementTitle,
        message: announcementContent,
        priority: announcementPriority
      };
      await api.post(`/v1/subject-announcements/subject/${activeWorkspace}`, payload);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementPriority('Normal');
      setIsPostAnnouncementOpen(false);
      fetchAnnouncements();
    } catch (e: any) {
      console.error('Failed to post announcement', e);
      alert(e.response?.data?.message || "Failed to post announcement. Only the assigned faculty can post announcements.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/v1/subject-announcements/${deleteConfirmId}`);
      setDeleteConfirmId(null);
      fetchAnnouncements();
    } catch (e: any) {
      console.error('Failed to delete announcement', e);
      alert(e.response?.data?.message || "Failed to delete announcement.");
    }
  };

  const materialFileInputRef = useRef<HTMLInputElement>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialUnit, setMaterialUnit] = useState('');
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [deleteMaterialId, setDeleteMaterialId] = useState<string | null>(null);

  const fetchMaterials = async (silent = false) => {
    if (!activeWorkspace) return;
    try {
      if (!silent) setLoadingMaterials(true);
      const res = await api.get(`/v1/lecture-materials/subject/${activeWorkspace}`);
      if (res.data && res.data.data) {
        setMaterials(res.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch subject materials', e);
      if (!silent) setMaterials([]);
    } finally {
      if (!silent) setLoadingMaterials(false);
    }
  };

  const formatUnitLabel = (item: string) => {
    if (!item || typeof item !== 'string') return 'General / Study Material';
    if (item.toLowerCase().includes('general')) return 'General / Study Material';
    const match = item.match(/(?:Unit|Module)\s*([IVXLCDM\d]+)/i);
    if (match) {
      const num = match[1].trim();
      return item.trim().toLowerCase().startsWith('module') ? `Module ${num}` : `Unit ${num}`;
    }
    const shortPart = item.split(/[:\-,]/)[0].trim();
    return shortPart.replace(/([a-zA-Z])(\d)/, '$1 $2') || 'General / Study Material';
  };

  const getSyllabusUnits = () => {
    const defaultUnits = ['General / Study Material', 'Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'];
    const ws = workspaces.find(w => w.id === activeWorkspace);
    if (!ws) return defaultUnits;

    const processList = (list: string[]) => {
      const cleaned = list.map(formatUnitLabel);
      const unique = Array.from(new Set(cleaned)).filter(Boolean);
      if (unique.length > 0) {
        if (!unique.includes('General / Study Material')) {
          unique.unshift('General / Study Material');
        }
        return unique;
      }
      return defaultUnits;
    };

    if (ws.linkedSyllabus?.unitTitles && Array.isArray(ws.linkedSyllabus.unitTitles) && ws.linkedSyllabus.unitTitles.length > 0) {
      return processList(ws.linkedSyllabus.unitTitles);
    }
    if (ws.linkedSyllabus?.rawContent) {
      const regex = /(?:Unit|UNIT|Module|MODULE)\s*[:-]?\s*(?:[IVXLCDM\d]+)/g;
      const matches = ws.linkedSyllabus.rawContent.match(regex);
      if (matches && matches.length > 0) {
        return processList(Array.from(new Set(matches)).map((m: any) => m.trim()));
      }
    }
    return defaultUnits;
  };

  useEffect(() => {
    if (activeWorkspace && activeTab === 'materials') {
      fetchMaterials();
      const ws = workspaces.find(w => w.id === activeWorkspace);
      if (ws && !ws.linkedSyllabus) {
        api.get(`/v1/class-subjects/${activeWorkspace}/syllabus`).then(res => {
          if (res.data && res.data.data && ws) {
            ws.linkedSyllabus = res.data.data;
          }
        }).catch(() => {});
      }
      const interval = setInterval(() => {
        fetchMaterials(true);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeWorkspace, activeTab]);

  const handleUploadMaterialSubmit = async () => {
    if (!materialTitle.trim() || !materialFile) {
      alert("Please enter a Document Title and select a File to upload.");
      return;
    }
    try {
      setIsUploadingMaterial(true);
      const formData = new FormData();
      formData.append('file', materialFile);
      formData.append('title', materialTitle.trim());
      const selectedUnit = materialUnit || getSyllabusUnits()[0] || "General";
      formData.append('unit', selectedUnit);
      
      const unitNumMatch = selectedUnit.match(/\d+/);
      let unitNum = 1;
      if (unitNumMatch) {
        unitNum = parseInt(unitNumMatch[0], 10);
      } else if (selectedUnit.includes('II')) unitNum = 2;
      else if (selectedUnit.includes('III')) unitNum = 3;
      else if (selectedUnit.includes('IV')) unitNum = 4;
      else if (selectedUnit.includes('V')) unitNum = 5;
      formData.append('unitNumber', String(unitNum));

      await api.post(`/v1/lecture-materials/subject/${activeWorkspace}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setMaterialTitle('');
      setMaterialUnit('');
      setMaterialFile(null);
      setIsUploadMaterialOpen(false);
      fetchMaterials();
    } catch (e: any) {
      console.error('Failed to upload lecture material', e);
      alert(e.response?.data?.message || "Failed to upload lecture material. Only the assigned faculty can upload materials.");
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  const handleConfirmDeleteMaterial = async () => {
    if (!deleteMaterialId) return;
    try {
      await api.delete(`/v1/lecture-materials/${deleteMaterialId}`);
      setDeleteMaterialId(null);
      fetchMaterials();
    } catch (e: any) {
      console.error('Failed to delete material', e);
      alert(e.response?.data?.message || "Failed to delete lecture material.");
    }
  };

  const handleViewMaterial = async (m: any) => {
    try {
      const endpoint = `/v1/lecture-materials/${m.id}/view`;
      const response = await api.get(endpoint, { responseType: 'blob' });
      let contentType = (response.headers['content-type'] as string) || 'application/pdf';
      const fName = (m.fileName || m.title || '').toLowerCase();
      if (fName.endsWith('.jpg') || fName.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (fName.endsWith('.png')) contentType = 'image/png';
      else if (fName.endsWith('.webp')) contentType = 'image/webp';
      else if (fName.endsWith('.pdf')) contentType = 'application/pdf';

      const blob = new Blob([response.data], { type: contentType });
      const objectUrl = URL.createObjectURL(blob);
      const newWindow = window.open(objectUrl, '_blank');
      if (!newWindow) {
        alert('Please allow popups to view the document');
      }
    } catch (err: any) {
      console.error("Failed to load material preview:", err);
      alert(err.response?.data?.message || "Failed to load material preview.");
    }
  };

  const handleDownloadMaterial = async (m: any) => {
    try {
      const endpoint = `/v1/lecture-materials/${m.id}/download`;
      const response = await api.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: (response.headers['content-type'] as string) || 'application/octet-stream' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = m.fileName || m.title || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("Failed to download material:", err);
      alert(err.response?.data?.message || "Failed to download file.");
    }
  };

  
  const handleDeleteWorkspace = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkspaceToDelete(id);
  };

  const confirmDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    try {
      await api.delete(`/v1/class-subjects/${workspaceToDelete}`);
      await fetchWorkspaces();
      toast.success("Subject workspace deleted successfully");
    } catch (e: any) {
      console.error('Failed to delete workspace', e);
      toast.error(e.response?.data?.message || "Failed to delete workspace");
    } finally {
      setWorkspaceToDelete(null);
    }
  };

  const handleCreateWorkspace = () => {
    if (!newWorkspace.subjectName || !newWorkspace.year || !newWorkspace.semester || !newWorkspace.className) return;
    
    const newWs = {
      id: `ws_${Date.now()}`,
      classId: newWorkspace.className,
      className: newWorkspace.className,
      year: newWorkspace.year,
      semester: newWorkspace.semester,
      subjectId: `subj_${Date.now()}`,
      subjectName: newWorkspace.subjectName,
      subjectCode: newWorkspace.subjectCode || 'TBD',
      facultyName: newWorkspace.facultyName || 'Unassigned',
      coordinatorName: newWorkspace.coordinatorName || 'Unassigned',
      generationType: 'manual'
    };
    
    setWorkspaces([...workspaces, newWs]);
    setIsCreateModalOpen(false);
    setNewWorkspace({ subjectName: '', year: '', semester: '', className: '', facultyName: '', coordinatorName: '', subjectCode: '', color: '' });
  };

  if (activeWorkspace) {
    const ws = workspaces.find(w => w.id === activeWorkspace);
    if (!ws) return null;

    const isAssignedFaculty = role === 'faculty' && (
      String(ws.facultyId) === String(user?.id) || 
      (ws.facultyName && ws.facultyName === `${user?.firstName || ''} ${user?.lastName || ''}`.trim())
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-10">
        {/* Header / Banner */}
        <div className="relative h-48 rounded-xl bg-gradient-to-r from-primary to-primary/80 overflow-hidden flex flex-col justify-end p-6 shadow-md">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
          <div className="relative z-10 flex items-center gap-4 text-white">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => setActiveWorkspace(null)}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{ws.subjectName}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-white/90 font-medium">
                <Badge className="bg-white/20 hover:bg-white/30 border-white/30 text-white backdrop-blur-sm">{ws.subjectCode}</Badge>
                <span>{ws.className} ({ws.year}, {ws.semester})</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Faculty: {ws.facultyName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-border/50 overflow-x-auto no-scrollbar bg-card rounded-t-xl px-2 pt-2">
          {[
            { id: 'overview', label: 'Overview', icon: BookOpen },
            { id: 'announcements', label: 'Announcements', icon: Bell },
            { id: 'materials', label: 'Lecture Materials', icon: FileText },
            { id: 'assignments', label: 'Assignments', icon: ClipboardList },
            { id: 'quizzes', label: 'Quizzes', icon: CheckCircle2 },
            { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
            ...(role !== 'student' ? [{ id: 'analytics', label: 'Student Analytics', icon: TrendingUp }] : []),
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all whitespace-nowrap rounded-t-lg ${activeTab === t.id ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-b-2 border-transparent'}`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <SubjectSyllabusView ws={ws} />
          )}
          
          {activeTab === 'announcements' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /> Announcements</h3>
                  <p className="text-sm text-muted-foreground">Stay updated with the latest news for this subject.</p>
                </div>
                {isAssignedFaculty && (
                  <Button onClick={() => setIsPostAnnouncementOpen(true)} className="shadow-sm">
                    <MessageSquare className="w-4 h-4 mr-2" /> Post Announcement
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {announcements.length > 0 ? announcements.map((n, idx) => (
                  <Card key={idx} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="py-4 bg-muted/20 border-b border-border/50">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                            {(n.postedBy || n.facultyName || 'F').substring(0, 1)}
                          </div>
                          <div>
                            <CardTitle className="text-base">{n.postedBy || n.facultyName}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-0.5">
                              <Calendar className="w-3.5 h-3.5" /> {n.publishDate || 'Just now'}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${n.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' : n.priority === 'Important' || n.priority === 'High' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : ''}`}>{n.priority}</Badge>
                          {(isAssignedFaculty && (!n.facultyId || String(n.facultyId) === String(user?.id))) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(n.id); }}
                              title="Delete Announcement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <h4 className="text-base font-semibold text-foreground">{n.title}</h4>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{n.description || n.message}</p>
                      {n.attachments && n.attachments.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {n.attachments.map((att: any, i: number) => (
                            <Button key={i} variant="outline" size="sm" className="h-8 text-xs bg-muted/20 hover:bg-muted/50 border-border/50">
                              <File className="w-3.5 h-3.5 mr-1.5 text-primary" /> {att.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )) : (
                  <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border/50 text-muted-foreground shadow-sm">
                    <Bell className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-base font-medium">No announcements posted yet.</p>
                    <p className="text-sm">Click "Post Announcement" to communicate with the class.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500" /> Lecture Materials</h3>
                  <p className="text-sm text-muted-foreground">Access and organize subject resources.</p>
                </div>
                {role === 'faculty' && (
                  <Button onClick={() => setIsUploadMaterialOpen(true)} className="shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Upload className="w-4 h-4 mr-2" /> Upload Material
                  </Button>
                )}
              </div>
              
              {loadingMaterials ? (
                <div className="py-12 text-center text-muted-foreground">Loading lecture materials...</div>
              ) : materials.length === 0 ? (
                <div className="py-12 text-center bg-card rounded-xl border border-border/50 text-muted-foreground">
                  No lecture materials uploaded for this subject yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {Array.from(new Set(materials.map(m => formatUnitLabel(m.unit || (m.unitNumber ? `Unit ${m.unitNumber}` : 'General'))))).map(unitName => {
                    const unitMaterials = materials.filter(m => formatUnitLabel(m.unit || (m.unitNumber ? `Unit ${m.unitNumber}` : 'General')) === unitName);
                    return (
                      <div key={String(unitName)} className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1">{String(unitName)} Materials</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {unitMaterials.map(m => (
                            <Card key={m.id} className="border border-border/50 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                              <CardContent className="p-4 flex flex-col justify-between gap-4 h-full">
                                <div className="flex items-start gap-4">
                                  <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    {(m.fileName || '').toLowerCase().match(/\.(jpg|jpeg|png|webp)$/) ? <ImageIcon className="w-6 h-6" /> : <File className="w-6 h-6" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-foreground truncate" title={m.title}>{m.title}</h4>
                                    <p className="text-xs font-medium text-indigo-600 truncate mt-0.5" title={m.fileName || 'document.pdf'}>{m.fileName || 'document.pdf'}</p>
                                    <p className="text-xs text-muted-foreground mt-1.5 flex flex-wrap items-center gap-1.5">
                                      <span>By {m.facultyName || m.uploadedByName || 'Assigned Faculty'}</span>
                                      <span>•</span>
                                      <span>{m.uploadedAt ? new Date(m.uploadedAt).toLocaleDateString() : 'Recently'}</span>
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                                  <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs font-medium gap-1.5" onClick={() => handleViewMaterial(m)}>
                                    <Eye className="w-3.5 h-3.5" /> View
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs font-medium gap-1.5" onClick={() => handleDownloadMaterial(m)}>
                                    <Download className="w-3.5 h-3.5" /> Download
                                  </Button>
                                  {role === 'faculty' && (
                                    <Button size="sm" variant="destructive" className="h-8 px-2.5 text-xs font-medium gap-1.5" onClick={() => setDeleteMaterialId(m.id)}>
                                      <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <AssignmentModule workspaceContext={ws} />
            </div>
          )}

          { activeTab === 'quizzes' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <QuizModule workspaceContext={ws} />
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <SubjectAttendancePanel workspaceContext={ws} />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
               <SubjectAnalyticsPanel workspaceContext={ws} />
            </div>
          )}
        </div>

        {/* Upload Material Modal */}
        <Dialog open={isUploadMaterialOpen} onOpenChange={(open) => { setIsUploadMaterialOpen(open); if (!open) { setMaterialTitle(''); setMaterialUnit(''); setMaterialFile(null); } }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Lecture Material</DialogTitle>
              <DialogDescription>Share documents (PDF, DOC, PPT) or images (JPG, PNG, WEBP) with students.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Document Title</Label>
                <Input placeholder="e.g. Unit 1 Complete Notes" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Select Unit/Topic</Label>
                <Select value={materialUnit} onValueChange={setMaterialUnit}>
                  <SelectTrigger><SelectValue placeholder="Select unit..." /></SelectTrigger>
                  <SelectContent>
                    {getSyllabusUnits().map((unit, idx) => (
                      <SelectItem key={idx} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Upload File</Label>
                <input type="file" ref={materialFileInputRef} accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp" onChange={(e) => setMaterialFile(e.target.files?.[0] || null)} className="hidden" />
                <div onClick={() => materialFileInputRef.current?.click()} className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">{materialFile ? materialFile.name : "Click to upload or drag and drop"}</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOC, PPT, JPG, PNG, WEBP up to 10MB</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsUploadMaterialOpen(false); setMaterialTitle(''); setMaterialUnit(''); setMaterialFile(null); }}>Cancel</Button>
              <Button onClick={handleUploadMaterialSubmit} disabled={isUploadingMaterial} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isUploadingMaterial ? "Uploading..." : "Upload Material"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Post Announcement Modal */}
        <Dialog open={isPostAnnouncementOpen} onOpenChange={setIsPostAnnouncementOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Post Announcement</DialogTitle>
              <DialogDescription>Broadcast a message directly to {ws.className} students for {ws.subjectName}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Announcement Title</Label>
                <Input placeholder="Enter title..." value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={announcementPriority} onValueChange={setAnnouncementPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Important">Important</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <textarea 
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Type your message here..." 
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPostAnnouncementOpen(false)}>Cancel</Button>
              <Button onClick={handlePostAnnouncement}>Post Announcement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Announcement Confirmation Modal */}
        <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Announcement</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this announcement? This action cannot be undone and will remove the announcement for all students immediately.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Material Confirmation Modal */}
        <Dialog open={!!deleteMaterialId} onOpenChange={(open) => !open && setDeleteMaterialId(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Lecture Material</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this lecture material? It will be immediately removed from both faculty and student views. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteMaterialId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmDeleteMaterial}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --- Main Classes List View ---
  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/50 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Subject Workspaces
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Manage your classes by subject and coordinate all academic activities.
          </p>
        </div>
        {role === 'hod' && (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(true)} className="shadow-sm border-border/50 hover:bg-muted/50">
              <Plus className="w-4 h-4 mr-2" /> Create Subject Workspace
            </Button>
            
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visibleWorkspaces.map((ws, idx) => {
          const bannerGradient = ['bg-gradient-to-br from-blue-600 to-blue-800', 'bg-gradient-to-br from-emerald-600 to-teal-800', 'bg-gradient-to-br from-violet-600 to-purple-800', 'bg-gradient-to-br from-rose-500 to-pink-700', 'bg-gradient-to-br from-amber-500 to-orange-700', 'bg-gradient-to-br from-cyan-600 to-blue-700'][idx % 6];
          return (
            <Card key={ws.id} className="flex flex-col border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden relative rounded-xl h-full bg-card hover:-translate-y-1">
              {/* Banner Area */}
              <div className={`h-32 ${bannerGradient} relative p-5 flex flex-col justify-between`}>
                <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-black/20"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                <div className="relative z-10 flex justify-between items-start">
                   <Badge className="bg-white/20 text-white hover:bg-white/30 border-white/30 backdrop-blur-sm shadow-sm font-semibold">{ws.subjectCode}</Badge>
                   {ws.generationType === 'auto' ? (
                     <Badge className="bg-emerald-500/90 text-white border-none shadow-sm shadow-emerald-500/20 font-medium">Auto Generated</Badge>
                   ) : ws.generationType === 'manual' ? (
                     <Badge className="bg-blue-500/90 text-white border-none shadow-sm shadow-blue-500/20 font-medium">Manually Created</Badge>
                   ) : null}
                </div>
                <div className="relative z-10 mt-auto pt-4">
                  <h2 className="text-xl font-bold text-white tracking-wide truncate drop-shadow-sm">{ws.subjectName}</h2>
                </div>
              </div>

              <CardContent className="px-5 py-5 flex-1 bg-card flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                   <Badge variant="outline" className="font-medium text-foreground border-border/60 bg-muted/30"><Calendar className="w-3 h-3 mr-1.5 opacity-70" /> Year: {ws.year}</Badge>
                   <Badge variant="outline" className="font-medium text-foreground border-border/60 bg-muted/30"><BookOpen className="w-3 h-3 mr-1.5 opacity-70" /> Sem: {ws.semester}</Badge>
                   <Badge variant="outline" className="font-medium text-foreground border-border/60 bg-muted/30"><Users className="w-3 h-3 mr-1.5 opacity-70" /> Class: {ws.classSection || ws.className}</Badge>
                   <Badge variant="outline" className="font-medium text-foreground border-border/60 bg-muted/30">Dept: {ws.department?.name || ws.department || 'N/A'}</Badge>
                   <Badge variant="outline" className="font-medium text-foreground border-border/60 bg-muted/30">Batch: {ws.batch || 'N/A'}</Badge>
                </div>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Assigned Faculty</p>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">{ws.facultyName || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Coordinator Name</p>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">{ws.coordinatorName || 'Unassigned'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="px-4 py-4 border-t border-border/50 bg-muted/5 flex gap-2">
                <Button className="w-full shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center justify-center gap-2" variant="outline" onClick={() => { setActiveWorkspace(ws.id); setActiveTab('overview'); }}>
                  <Eye className="w-4 h-4" /> View Workspace
                </Button>
                {role === 'hod' && (
                  <Button variant="ghost" className="text-destructive hover:bg-destructive/10 px-3" onClick={(e) => handleDeleteWorkspace(ws.id, e)}>
                    Delete
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {visibleWorkspaces.length === 0 && (
        <div className="text-center py-16 bg-card rounded-xl border border-border/50 border-dashed shadow-sm">
          <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold text-foreground">No Workspaces Found</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {role === 'hod' 
              ? "You haven't created any workspaces yet. Click 'Generate Subject Workspaces' to automatically create them based on approved faculty assignments."
              : "No subjects have been assigned to you yet. Please contact your HOD."}
          </p>
        </div>
      )}



      {/* Create Workspace Modal (HOD only) */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Subject Workspace</DialogTitle>
            <DialogDescription>
              Set up a new workspace for a subject and assign a faculty and coordinator.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label htmlFor="subjectName">Subject Name <span className="text-destructive">*</span></Label>
              <Input 
                id="subjectName" 
                placeholder="e.g. Object Oriented Programming" 
                value={newWorkspace.subjectName}
                onChange={(e) => setNewWorkspace({...newWorkspace, subjectName: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Year <span className="text-destructive">*</span></Label>
                <Select value={newWorkspace.year} onValueChange={(v) => setNewWorkspace({...newWorkspace, year: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="4th Year">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester <span className="text-destructive">*</span></Label>
                <Select value={newWorkspace.semester} onValueChange={(v) => setNewWorkspace({...newWorkspace, semester: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semester 3">Semester 3</SelectItem>
                    <SelectItem value="Semester 4">Semester 4</SelectItem>
                    <SelectItem value="Semester 5">Semester 5</SelectItem>
                    <SelectItem value="Semester 6">Semester 6</SelectItem>
                    <SelectItem value="Semester 7">Semester 7</SelectItem>
                    <SelectItem value="Semester 8">Semester 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class <span className="text-destructive">*</span></Label>
                <Select value={newWorkspace.className} onValueChange={(v) => setNewWorkspace({...newWorkspace, className: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT-1">IT-1</SelectItem>
                    <SelectItem value="IT-2">IT-2</SelectItem>
                    <SelectItem value="DS-1">DS-1</SelectItem>
                    <SelectItem value="DS-2">DS-2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectCode">Subject Code</Label>
                <Input 
                  id="subjectCode" 
                  placeholder="e.g. CS401" 
                  value={newWorkspace.subjectCode}
                  onChange={(e) => setNewWorkspace({...newWorkspace, subjectCode: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assigned Faculty</Label>
              <Select value={newWorkspace.facultyName} onValueChange={(v) => setNewWorkspace({...newWorkspace, facultyName: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  {mockData.admins.filter(a => a.role === 'faculty').map(f => (
                    <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Class Coordinator</Label>
              <Select value={newWorkspace.coordinatorName} onValueChange={(v) => setNewWorkspace({...newWorkspace, coordinatorName: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select coordinator" />
                </SelectTrigger>
                <SelectContent>
                  {mockData.admins.filter(a => a.role === 'coordinator' || a.role === 'hod' || a.role === 'faculty').map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateWorkspace} disabled={!newWorkspace.subjectName || !newWorkspace.year || !newWorkspace.semester || !newWorkspace.className}>
              Create Subject Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Confirmation Modal */}
      <Dialog open={!!workspaceToDelete} onOpenChange={(open) => !open && setWorkspaceToDelete(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Subject Workspace</DialogTitle>
            <DialogDescription>
              Deleting this Subject Card will permanently remove all academic data associated with it, including assignments, quizzes, materials, attendance records, and related submissions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkspaceToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteWorkspace}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
