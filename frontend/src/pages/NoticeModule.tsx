import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, FileText, DownloadCloud, Plus, Calendar, Clock, 
  Trash2, CheckCircle, Layers, X, Search, ChevronRight 
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { noticeService } from '../services/noticeService';
import { eventService } from '../services/eventService';
import { SpecificAssignmentRow } from '../components/events/CreateEventForm';
import type { SpecificAssignment } from '../components/events/CreateEventForm';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

const CATEGORIES = ['General', 'Academic', 'Examination', 'Assignment', 'Placement', 'Event', 'Holiday', 'Other'];
const PRIORITIES = ['Normal', 'Important', 'High', 'Urgent'];

export const NoticeModule = () => {
  const { role, user } = useAuth();
  const isAdmin = ['hod', 'coordinator'].includes(role);
  const canCreateNotice = isAdmin || role === 'faculty' || role === 'both';

  const [currentView, setCurrentView] = useState<'dashboard' | 'create_notice'>('dashboard');
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noticeToDelete, setNoticeToDelete] = useState<string | null>(null);

  // Form State
  const [newNotice, setNewNotice] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'MEDIUM',
    expiryDate: ''
  });
  const [noticeFile, setNoticeFile] = useState<File | null>(null);

  // Target Classes State
  const [allBatches, setAllBatches] = useState<string[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [specificAssignments, setSpecificAssignments] = useState<SpecificAssignment[]>([]);
  const [entireBatch, setEntireBatch] = useState<string>('');
  
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    fetchNotices();
    if (canCreateNotice) {
      loadBatches();
    }
  }, [role, canCreateNotice]);

  const loadBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await eventService.getAvailableBatches();
      if (res.success) setAllBatches(res.data);
    } catch (e) {
      console.error("Failed to load batches", e);
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchNotices = async () => {
    setLoading(true);
    try {
      let data = [];
      if (role === 'student') {
        data = await noticeService.getStudentNotices();
      } else {
        data = await noticeService.getNotices();
      }
      setNotices(data || []);
    } catch (error) {
      toast.error("Failed to fetch notices");
    } finally {
      setLoading(false);
    }
  };

  // Specific Assignment Handlers
  const addSpecificAssignment = () => {
    setSpecificAssignments([
      ...specificAssignments, 
      { id: Date.now().toString(), batch: '', year: '', semester: '', classSection: '', classId: '' }
    ]);
  };

  const updateSpecificAssignment = (id: string, updated: SpecificAssignment) => {
    setSpecificAssignments(specificAssignments.map(a => a.id === id ? updated : a));
  };

  const removeSpecificAssignment = (id: string) => {
    setSpecificAssignments(specificAssignments.filter(a => a.id !== id));
  };

  const handlePublishNotice = async () => {
    if (!newNotice.title || !newNotice.description || !newNotice.expiryDate) {
      toast.error("Title, Description, and Expiry Date are required.");
      return;
    }

    if (specificAssignments.length === 0 && !entireBatch) {
      toast.error("Please select at least one Target Class or Entire Batch.");
      return;
    }

    setIsPublishing(true);
    const toastId = toast.loading("Publishing notice...");

    try {
      let fileId = null;
      if (noticeFile) {
        toast.loading("Uploading attachment...", { id: toastId });
        const uploadRes = await noticeService.uploadAttachment(noticeFile);
        if (uploadRes.success) {
          fileId = uploadRes.data;
        } else {
          toast.error("File upload failed", { id: toastId });
          setIsPublishing(false);
          return;
        }
      }

      const targets: any[] = [];
      if (entireBatch) {
        targets.push({ isEntireBatch: true, batchYear: entireBatch });
      }
      specificAssignments.forEach(sa => {
        if (sa.batch) {
          if (sa.classId && sa.classId.includes(',')) {
            // If multiple class IDs are selected (e.g., "All Sections" in a semester)
            const classIds = sa.classId.split(',');
            classIds.forEach(id => {
              targets.push({
                isEntireBatch: false,
                batchYear: sa.batch,
                academicYear: sa.year || null,
                semester: sa.semester || null,
                acroClassId: id,
                acroClassName: sa.classSection || null
              });
            });
          } else {
            targets.push({
              isEntireBatch: false,
              batchYear: sa.batch,
              academicYear: sa.year || null,
              semester: sa.semester || null,
              acroClassId: sa.classId || null,
              acroClassName: sa.classSection || null
            });
          }
        }
      });

        if (!newNotice.expiryDate) {
          toast.error("Please select an Expiry Date.", { id: toastId });
          setIsPublishing(false);
          return;
        }

        const payload = {
          title: newNotice.title,
          description: newNotice.description,
          category: newNotice.category,
          priority: newNotice.priority,
          expiryDate: new Date(newNotice.expiryDate).toISOString(),
          publishDate: new Date().toISOString(),
          fileId: fileId,
          targets: targets
        };

      toast.loading("Saving notice...", { id: toastId });
      const createdNotice = await noticeService.createNotice(payload);
      
      // Attempt to automatically publish right after creation (assuming service allows it or defaults to active)
      if (createdNotice && createdNotice.id) {
          try {
             await noticeService.publishNotice(createdNotice.id);
          } catch(e) {}
      }

      toast.success("Notice published successfully!", { id: toastId });
      setCurrentView('dashboard');
      fetchNotices();
      // Reset form
      setNewNotice({ title: '', description: '', category: 'General', priority: 'MEDIUM', expiryDate: '' });
      setNoticeFile(null);
      setSpecificAssignments([]);
      setEntireBatch('');
    } catch (error) {
      console.error(error);
      toast.error("Failed to publish notice", { id: toastId });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const response = await noticeService.downloadAttachment(fileId);
      const blob = response.data;
      const fileUrl = window.URL.createObjectURL(blob);
      window.open(fileUrl, '_blank');
    } catch (e) {
      toast.error("Failed to download attachment");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await noticeService.deleteNotice(id);
      toast.success("Notice deleted successfully");
      fetchNotices();
    } catch(e) {
      toast.error("Failed to delete notice");
    } finally {
      setNoticeToDelete(null);
    }
  };

  const renderDashboard = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-foreground">Notices</h2>
          <p className="text-muted-foreground mt-1 font-medium">Stay updated with the latest announcements.</p>
        </div>
        {canCreateNotice && (
          <Button onClick={() => setCurrentView('create_notice')} className="gap-2 font-bold shadow-md shadow-primary/20">
            <Plus size={18} /> Publish New Notice
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <p className="p-8 text-center text-muted-foreground">Loading notices...</p>
        ) : notices.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-accent/20">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">No active notices found.</p>
          </div>
        ) : (
          notices.map(notice => (
            <div key={notice.id} className={cn(
              "bg-card border-l-4 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden",
              notice.priority === 'URGENT' ? 'border-l-rose-500' :
              notice.priority === 'HIGH' ? 'border-l-amber-500' : 'border-l-blue-500'
            )}>
              <div className="flex justify-between items-start mb-2 gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-accent text-foreground px-2.5 py-1 rounded-full">
                      {notice.category}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                      notice.priority === 'URGENT' ? 'bg-rose-500 text-white' : 
                      notice.priority === 'HIGH' ? 'bg-amber-500 text-white' : 'bg-blue-500/10 text-blue-500'
                    )}>
                      {notice.priority}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground break-words">{notice.title}</h3>
                </div>
                {canCreateNotice && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNoticeToDelete(notice.id);
                    }} 
                    className="text-rose-500 hover:bg-rose-500/10 h-8 w-8 relative z-10"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-3 whitespace-pre-wrap break-words">{notice.description}</p>
              
              <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap gap-4 items-center justify-between text-xs text-muted-foreground">
                <div className="flex gap-4 flex-wrap">
                  <span className="flex items-center gap-1"><Clock size={14} className="text-primary"/> Published: {new Date(notice.publishDate || new Date()).toLocaleString()}</span>
                  {notice.expiryDate && (
                    <span className="flex items-center gap-1"><Calendar size={14} className="text-rose-500"/> Expires: {new Date(notice.expiryDate).toLocaleDateString()}</span>
                  )}
                  {notice.publishedByName && (
                    <span className="flex items-center gap-1 font-semibold text-foreground">By: {notice.publishedByName}</span>
                  )}
                </div>
                {notice.fileId && (
                  <Button variant="outline" size="sm" onClick={() => handleDownload(notice.fileId)} className="h-8 gap-2">
                    <DownloadCloud size={14} /> View Attachment
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );

  const renderCreateNotice = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-foreground">Publish Notice</h2>
          <p className="text-muted-foreground mt-1 font-medium">Broadcast information to specific classes or entire batches.</p>
        </div>
        <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="gap-2">
          <X size={18} /> Cancel
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-8">
        
        {/* General Information */}
        <div className="space-y-4">
          <h3 className="font-black text-lg uppercase tracking-wider border-b border-border pb-2">General Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold">Notice Title <span className="text-rose-500">*</span></label>
              <input type="text" className="w-full p-3 border border-border rounded-xl bg-background" 
                value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} 
                placeholder="e.g. End Semester Practical Schedule" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">Category</label>
              <select className="w-full p-3 border border-border rounded-xl bg-background"
                value={newNotice.category} onChange={e => setNewNotice({...newNotice, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">Priority</label>
              <select className="w-full p-3 border border-border rounded-xl bg-background"
                value={newNotice.priority} onChange={e => setNewNotice({...newNotice, priority: e.target.value})}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold">Description <span className="text-rose-500">*</span></label>
              <textarea className="w-full p-3 border border-border rounded-xl bg-background h-32" 
                value={newNotice.description} onChange={e => setNewNotice({...newNotice, description: e.target.value})} 
                placeholder="Detailed notice content..." />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold">Expiry Date <span className="text-rose-500">*</span></label>
              <input type="date" className="w-full p-3 border border-border rounded-xl bg-background" 
                value={newNotice.expiryDate} onChange={e => setNewNotice({...newNotice, expiryDate: e.target.value})} />
              <p className="text-xs text-muted-foreground mt-1">Notice will be hidden from students after this date.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">Attachment (Optional)</label>
              <input type="file" className="w-full p-2 border border-border rounded-xl bg-background file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" 
                onChange={e => setNoticeFile(e.target.files ? e.target.files[0] : null)} />
            </div>
          </div>
        </div>

        {/* Target Classes */}
        <div className="space-y-4">
          <h3 className="font-black text-lg uppercase tracking-wider border-b border-border pb-2">Target Classes <span className="text-rose-500">*</span></h3>
          
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-muted-foreground">Specific Classes</h4>
            <div className="space-y-4">
              {specificAssignments.map((assignment) => (
                <SpecificAssignmentRow 
                  key={assignment.id} 
                  assignment={assignment} 
                  onChange={updateSpecificAssignment}
                  onRemove={removeSpecificAssignment}
                  allBatches={allBatches}
                />
              ))}
            </div>
            <Button variant="outline" onClick={addSpecificAssignment} className="gap-2 font-bold mt-2">
              <Plus size={16} /> Add Class Assignment
            </Button>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-bold text-sm text-muted-foreground">Or Entire Batch</h4>
            <div className="p-4 border border-border rounded-xl bg-accent/10">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2 block">
                {loadingBatches ? 'Loading...' : 'Select Batch'}
              </label>
              <select 
                value={entireBatch} 
                onChange={e => setEntireBatch(e.target.value)}
                disabled={loadingBatches}
                className="w-full max-w-sm p-3 border border-border rounded-lg bg-background font-bold"
              >
                <option value="">Select Batch (None)</option>
                {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {entireBatch && (
                <p className="mt-3 text-sm font-bold text-primary flex items-center gap-2">
                  <CheckCircle size={16} /> This notice will be sent to all classes under the {entireBatch} batch.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex justify-end gap-4">
          <Button variant="ghost" onClick={() => setCurrentView('dashboard')}>Cancel</Button>
          <Button onClick={handlePublishNotice} disabled={isPublishing} className="gap-2 shadow-md shadow-primary/20 px-8">
            {isPublishing ? 'Publishing...' : 'Publish Notice'}
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {currentView === 'dashboard' ? renderDashboard() : renderCreateNotice()}

      {/* Delete Confirmation Popup */}
      <AnimatePresence>
        {noticeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNoticeToDelete(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card w-full max-w-md p-6 rounded-2xl shadow-xl border border-border"
            >
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Delete Notice</h3>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete this notice? This action cannot be undone and it will be removed from all student dashboards immediately.
                </p>
                <div className="flex gap-3 w-full">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setNoticeToDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => handleDelete(noticeToDelete)}
                  >
                    Delete Notice
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
