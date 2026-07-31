import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockData } from '../data/mockData';
import { BookMarked, FileText, Calendar, Upload, Search, Download, RefreshCw, Eye, ShieldAlert, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { useEffect } from 'react';
import api from '../services/api';

export const AcademicResourcesModule = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'scheme' | 'syllabus' | 'timetable'>('scheme');
  const [searchQuery, setSearchQuery] = useState('');

  const [uploadDialog, setUploadDialog] = useState<{ isOpen: boolean; type: 'scheme' | 'syllabus' | 'timetable' | null, replaceId?: string }>({ isOpen: false, type: null });
  const [isUploading, setIsUploading] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<any | null>(null);

  const [localSchemes, setLocalSchemes] = useState<any[]>([]);
  const [localSyllabus, setLocalSyllabus] = useState<any[]>([]);
  const [localTimetables, setLocalTimetables] = useState<any[]>([]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await api.get('/v1/academic-resources');
        const resources = response.data.data || [];
        setLocalSyllabus(resources.filter((r: any) => r.fileType === 'SYLLABUS'));
        setLocalSchemes(resources.filter((r: any) => r.fileType === 'SCHEME'));
        
        const ttResponse = await api.get('/v1/timetables');
        setLocalTimetables(ttResponse.data.data || []);
      } catch (e) {
        console.error("Failed to fetch academic resources", e);
      }
    };
    fetchResources();
  }, []);


  const filteredSchemes = localSchemes.map((s: any) => ({
    ...s,
    id: s.id,
    title: s.name || s.fileName || 'Scheme.pdf',
    type: 'Scheme',
    semester: s.metadata?.semester || s.semester,
    updated: s.uploadedAt ? new Date(s.uploadedAt).toLocaleDateString() : s.uploadDate || 'N/A',
    uploader: s.uploadedBy || 'HOD',
    size: '1.5 MB'
  }));
  const filteredSyllabus = localSyllabus.map((s: any) => ({
    ...s,
    id: s.id,
    title: s.name || s.fileName || 'Syllabus.pdf',
    type: 'Syllabus',
    semester: s.metadata?.semester || s.semester,
    updated: s.uploadedAt ? new Date(s.uploadedAt).toLocaleDateString() : s.uploadDate || 'N/A',
    uploader: s.uploadedBy || 'HOD',
    size: '2.0 MB'
  }));
  const filteredTimetables = localTimetables.map((s: any) => ({
    ...s,
    id: s.id,
    title: s.name || s.fileName || 'Timetable.pdf',
    type: 'Timetable',
    class: s.metadata?.className || s.className,
    semester: s.metadata?.semester || s.semester,
    updated: s.uploadedAt ? new Date(s.uploadedAt).toLocaleDateString() : s.uploadDate || 'N/A',
    uploader: s.uploadedBy || 'Coordinator',
    size: '1.2 MB'
  }));

  const handleDownload = (doc: any) => {
    // Basic valid empty PDF structure for demonstration purposes
    const pdfContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 100 700 Td (Mock PDF Document) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000219 00000 n \n0000000305 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n399\n%%EOF`;
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${doc.title} downloaded successfully.`);
  };

  const simulateUpload = (type: string, replaceId?: string) => {
    setIsUploading(true);
    toast.loading(replaceId ? `Replacing ${type}...` : `Uploading ${type}...`, { id: 'upload' });
    setTimeout(() => {
      setIsUploading(false);
      setUploadDialog({ isOpen: false, type: null });
      toast.success(replaceId ? `${type} replaced successfully!` : `${type} uploaded successfully!`, { id: 'upload' });
    }, 2000);
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete) return;
    try {
      await api.delete('/v1/academic-resources/' + resourceToDelete.id);
      toast.success(`${resourceToDelete.type} deleted successfully.`);
      if (resourceToDelete.type === 'Scheme') setLocalSchemes(localSchemes.filter(s => s.id !== resourceToDelete.id));
      if (resourceToDelete.type === 'Syllabus') setLocalSyllabus(localSyllabus.filter(s => s.id !== resourceToDelete.id));
      if (resourceToDelete.type === 'Timetable') setLocalTimetables(localTimetables.filter(s => s.id !== resourceToDelete.id));
    } catch(e) {
      toast.error(`Failed to delete ${resourceToDelete.type}`);
    } finally {
      setResourceToDelete(null);
    }
  };

  const handleViewPdf = async (doc: any) => {
    const url = doc.documentUrl || `/v1/academic-resources/${doc.id}/download`;
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      toast.error('Please allow popups to view the PDF');
      return;
    }
    newWindow.document.write('Loading PDF...');
    try {
      const endpoint = url.startsWith('/api') ? url.substring(4) : url;
      const response = await api.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      newWindow.location.href = objectUrl;
    } catch (error) {
      newWindow.close();
      toast.error('Failed to load PDF');
    }
  };

  const renderDocumentList = (documents: any[]) => {
    return (
      <div className="grid grid-cols-1 gap-4 mt-6">
        {documents.map((doc) => (
          <Card key={doc.id} className="bg-card border-border shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    doc.type === 'Scheme' ? 'bg-blue-500/10 text-blue-500' :
                    doc.type === 'Syllabus' ? 'bg-primary/10 text-primary' :
                    'bg-purple-500/10 text-purple-500'
                  }`}>
                    {doc.type === 'Scheme' ? <FileText size={22} /> : 
                     doc.type === 'Syllabus' ? <BookMarked size={22} /> : 
                     <Calendar size={22} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{doc.title}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="font-medium">Department:</span> {doc.metadata?.department || doc.department || 'N/A'}</span>
                      <span className="flex items-center gap-1"><span className="font-medium">Batch:</span> {doc.metadata?.batch || doc.batch || 'N/A'}</span>
                      <span className="flex items-center gap-1"><span className="font-medium">Year:</span> {doc.metadata?.academicYear || doc.academicYear || 'N/A'}</span>
                      <span className="flex items-center gap-1"><span className="font-medium">Semester:</span> {doc.semester || 'N/A'}</span>
                      <span className="flex items-center gap-1"><span className="font-medium">Class:</span> {doc.class || doc.metadata?.className || doc.className || 'N/A'}</span>
                      <span className="flex items-center gap-1"><span className="font-medium">Uploaded By:</span> {doc.uploader || 'N/A'}</span>
                      <span className="flex items-center gap-1"><span className="font-medium">Upload Date:</span> {doc.updated || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 self-end md:self-center shrink-0 mt-4 md:mt-0">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs flex-1"
                    onClick={() => handleViewPdf(doc)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                  
                  {role !== 'student' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 text-xs flex-1"
                      onClick={() => setUploadDialog({ isOpen: true, type: activeTab, replaceId: doc.id })}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Replace
                    </Button>
                  )}
                  {role !== 'student' && (
                    <Button 
                        size="sm" 
                        variant="destructive" 
                        className="h-8 text-xs flex-1"
                        onClick={() => setResourceToDelete(doc)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  )}
                  {role === 'student' && (
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-8 text-xs flex-1"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> Download
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border/50 p-6 rounded-xl shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col gap-2 relative z-10">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BookMarked className="w-7 h-7 text-primary" />
            Academic Resources
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-xl leading-relaxed">
            Access official university schemes, detailed semester syllabus, and class timetables.
            All resources are curated and maintained by the academic staff.
          </p>
        </div>
        
        {role !== 'student' && (
          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <Button 
              className="shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:scale-[1.02]"
              onClick={() => setUploadDialog({ isOpen: true, type: activeTab })}
            >
              <Upload className="w-4 h-4 mr-2" /> Upload {activeTab === 'scheme' ? 'Scheme' : activeTab === 'syllabus' ? 'Syllabus' : 'Timetable'}
            </Button>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div className="space-y-6">
        
        {/* Navigation & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-background p-1.5 rounded-lg border border-border/50 shadow-sm">
          <div className="flex items-center w-full md:w-auto p-1 bg-muted/30 rounded-md">
            <button 
              onClick={() => setActiveTab('scheme')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === 'scheme' 
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <FileText className="w-4 h-4" /> Schemes
            </button>
            <button 
              onClick={() => setActiveTab('syllabus')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === 'syllabus' 
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <BookMarked className="w-4 h-4" /> Syllabus
            </button>
            <button 
              onClick={() => setActiveTab('timetable')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === 'timetable' 
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Calendar className="w-4 h-4" /> Timetables
            </button>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Informational Alert for Students */}
        {role === 'student' && (
          <div className="flex gap-3 items-start p-4 bg-primary/5 rounded-lg border border-primary/20">
            <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">Read-Only Access</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                You have view-only access to academic resources. Only staff can upload or replace official documents. Ensure you refer to the latest versions before classes.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'scheme' && renderDocumentList(filteredSchemes)}
          {activeTab === 'syllabus' && renderDocumentList(filteredSyllabus)}
          {activeTab === 'timetable' && renderDocumentList(filteredTimetables)}
        </div>

      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog.isOpen} onOpenChange={(open) => !isUploading && setUploadDialog({ isOpen: open, type: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{uploadDialog.replaceId ? 'Replace' : 'Upload'} {uploadDialog.type === 'scheme' ? 'Scheme' : uploadDialog.type === 'syllabus' ? 'Syllabus' : 'Timetable'}</DialogTitle>
            <DialogDescription>
              Select a PDF or document file to {uploadDialog.replaceId ? 'replace the existing' : 'upload as'} {uploadDialog.type}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="border-2 border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center justify-center text-center relative hover:bg-muted/30 transition-colors cursor-pointer group">
              <div className="p-4 bg-muted/50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Click to browse or drag and drop</p>
              <p className="text-xs text-muted-foreground">PDF, DOCX, or XLSX (max 10MB)</p>
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={() => uploadDialog.type && simulateUpload(uploadDialog.type, uploadDialog.replaceId)} 
                disabled={isUploading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadDialog({ isOpen: false, type: null })} disabled={isUploading}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!resourceToDelete} onOpenChange={() => setResourceToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 size={18} /> Delete {resourceToDelete?.type}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete "{resourceToDelete?.title}"?
              <br/><br/>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setResourceToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteResource}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
