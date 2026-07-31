import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { mockData } from '../data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, BookOpen, Plus, FileText, Calendar, Bell, ClipboardList, CheckCircle2, TrendingUp, MessageSquare, Upload, File, ArrowLeft, ClipboardCheck, Eye, Sparkles } from 'lucide-react';
import { AssignmentModule } from './AssignmentModule';
import { QuizModule } from './QuizModule';
import { SubjectAttendancePanel } from './SubjectAttendancePanel';
import { SubjectAnalyticsPanel } from './SubjectAnalyticsPanel';

export const ClassesModule = () => {
  const { user, role } = useAuth();

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

  
  const handleDeleteWorkspace = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/v1/class-subjects/${id}`);
      fetchWorkspaces();
    } catch (e) {
      console.error('Failed to delete workspace', e);
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
    
    const wsNotices = mockData.notices.filter(n => n.classId === ws.classId && n.subjectId === ws.subjectId);

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
            <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <Card className="border border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Course Objectives</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    To understand the fundamental concepts of {ws.subjectName}.
                    Students will learn about core principles, practical applications, and advanced theoretical aspects of {ws.subjectCode}. By the end of the course, students will be able to apply these concepts to solve real-world problems and develop scalable solutions using modern paradigms.
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Subject Syllabus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map(unit => (
                      <div key={unit} className="flex gap-5 items-start p-4 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                        <div className="w-16 shrink-0 pt-0.5">
                          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">Unit {unit}</Badge>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <h4 className="text-sm font-semibold text-foreground">Introduction to Core Concepts {unit}</h4>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            Detailed study of methodologies, practical examples, architecture, and deployment strategies specific to module {unit} of the syllabus. Covers fundamentals, advanced techniques, and real-world case studies.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === 'announcements' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /> Announcements</h3>
                  <p className="text-sm text-muted-foreground">Stay updated with the latest news for this subject.</p>
                </div>
                {role !== 'student' && (
                  <Button onClick={() => setIsPostAnnouncementOpen(true)} className="shadow-sm">
                    <MessageSquare className="w-4 h-4 mr-2" /> Post Announcement
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {wsNotices.length > 0 ? wsNotices.map((n, idx) => (
                  <Card key={idx} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="py-4 bg-muted/20 border-b border-border/50">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                            {n.postedBy.substring(0, 1)}
                          </div>
                          <div>
                            <CardTitle className="text-base">{n.postedBy}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-0.5">
                              <Calendar className="w-3.5 h-3.5" /> {n.publishDate}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className={`${n.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' : n.priority === 'High' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : ''}`}>{n.priority}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <h4 className="text-base font-semibold text-foreground">{n.title}</h4>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{n.description}</p>
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
                {role !== 'student' && (
                  <Button onClick={() => setIsUploadMaterialOpen(true)} className="shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Upload className="w-4 h-4 mr-2" /> Upload Material
                  </Button>
                )}
              </div>
              
              <div className="space-y-6">
                {[1, 2, 3].map(unit => (
                  <div key={unit} className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1">Unit {unit} Materials</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2].map(m => (
                        <Card key={`${unit}-${m}`} className="border border-border/50 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                          <CardContent className="p-4 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <File className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-foreground truncate">Ch{unit}_Lecture{m}_Slides.pdf</h4>
                              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2">
                                <span>Uploaded {m * 2} days ago</span>
                                <span>•</span>
                                <span>{(Math.random() * 5 + 1).toFixed(1)} MB</span>
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
        <Dialog open={isUploadMaterialOpen} onOpenChange={setIsUploadMaterialOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Lecture Material</DialogTitle>
              <DialogDescription>Share PDF, PPT, or links with the students.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Document Title</Label>
                <Input placeholder="e.g. Unit 1 Complete Notes" />
              </div>
              <div className="space-y-2">
                <Label>Select Unit/Topic</Label>
                <Select defaultValue="1">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Unit 1</SelectItem>
                    <SelectItem value="2">Unit 2</SelectItem>
                    <SelectItem value="3">Unit 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Upload File</Label>
                <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX up to 10MB</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadMaterialOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsUploadMaterialOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white">Upload Material</Button>
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
                <Input placeholder="Enter title..." />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select defaultValue="Normal">
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPostAnnouncementOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsPostAnnouncementOpen(false)}>Post Announcement</Button>
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
    </div>
  );
};
