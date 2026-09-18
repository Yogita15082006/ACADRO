import { useState } from 'react';
import { CustomSelect } from "@/components/ui/select";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX, Clock, ChevronDown, CheckCircle2, XCircle, Plus, Trash2, X, Eye, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockData } from '../data/mockData';
import { yearOptions, semOptions, classOptions } from '../data/facultyActivityData';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const RemoveAccessConfirmModal = ({ request, onClose, onConfirm }: any) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col relative text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <UserX size={32} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Remove Access?</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to remove all access for <strong>{request.name}</strong>? This will revoke their ability to manage their assigned classes and subjects.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onClose} className="w-full">Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm(request.id)} className="w-full">Remove Access</Button>
        </div>
      </motion.div>
    </div>
  );
};

const ViewFacultyDetailsModal = ({ request, onClose }: any) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between p-6 border-b border-border bg-card sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
              {request.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Faculty Details: {request.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{request.department} • {request.empId}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive shrink-0"><X size={20} /></Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="border-border shadow-sm">
                <CardHeader className="p-4 border-b border-border bg-muted/30">
                  <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                   <p className="text-sm"><span className="font-medium text-muted-foreground">Email:</span> {request.email}</p>
                   <p className="text-sm"><span className="font-medium text-muted-foreground">Mobile:</span> {request.mobile}</p>
                   <p className="text-sm"><span className="font-medium text-muted-foreground">Requested At:</span> {new Date(request.requestedAt).toLocaleString()}</p>
                   <p className="text-sm"><span className="font-medium text-muted-foreground">Status:</span> {request.status}</p>
                </CardContent>
             </Card>

             <Card className="border-border shadow-sm">
                <CardHeader className="p-4 border-b border-border bg-muted/30">
                  <CardTitle className="text-sm font-semibold">Originally Requested Classes</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {request.requestedClasses && request.requestedClasses.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {request.requestedClasses.map((c: string) => (
                        <Badge key={c} variant="outline" className="bg-background">{c}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No classes requested initially.</p>
                  )}
                </CardContent>
             </Card>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 border-b border-border bg-muted/30">
              <CardTitle className="text-sm font-semibold">Approved Assignments</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {request.approvedAssignments && request.approvedAssignments.length > 0 ? (
                <div className="space-y-4">
                  {request.approvedAssignments.map((assign: any, index: number) => (
                    <div key={assign.id} className="p-4 rounded-lg bg-background border border-border">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border/50">
                        <span className="text-sm font-semibold">Assignment #{index + 1}</span>
                        <div className="flex gap-2">
                           <Badge variant="secondary">{assign.academicYear}</Badge>
                           <Badge variant="secondary">{assign.semester}</Badge>
                           <Badge variant="secondary">{assign.className}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {assign.subjects.map((sub: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-primary/5 text-primary border-primary/20">{sub}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No approved assignments found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

const GrantFacultyAccessModal = ({ request, onClose, onApprove, onReject, onDraft }: any) => {
  const [assignments, setAssignments] = useState<any[]>(request.draftAssignments || request.approvedAssignments || [{
    id: Date.now().toString(),
    academicYear: '',
    semester: '',
    className: '',
    subjects: ['']
  }]);
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);

  const toggleSelectAssignment = (id: string) => {
    setSelectedAssignments(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const removeSelectedAssignments = () => {
    setAssignments(assignments.filter(a => !selectedAssignments.includes(a.id)));
    setSelectedAssignments([]);
  };

  const addAssignment = () => {
    setAssignments([...assignments, {
      id: Date.now().toString(),
      academicYear: '',
      semester: '',
      className: '',
      subjects: ['']
    }]);
  };

  const removeAssignment = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const updateAssignment = (id: string, field: string, value: any) => {
    setAssignments(assignments.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addSubject = (assignId: string) => {
    setAssignments(assignments.map(a => a.id === assignId ? { ...a, subjects: [...a.subjects, ''] } : a));
  };

  const updateSubject = (assignId: string, index: number, value: string) => {
    setAssignments(assignments.map(a => {
      if (a.id === assignId) {
        const newSubjects = [...a.subjects];
        newSubjects[index] = value;
        return { ...a, subjects: newSubjects };
      }
      return a;
    }));
  };

  const removeSubject = (assignId: string, index: number) => {
    setAssignments(assignments.map(a => {
      if (a.id === assignId) {
        const newSubjects = [...a.subjects];
        newSubjects.splice(index, 1);
        return { ...a, subjects: newSubjects };
      }
      return a;
    }));
  };

  let isValid = true;
  let errorMsg = '';

  if (assignments.length === 0) {
    isValid = false;
    errorMsg = 'At least one assignment must exist.';
  } else {
    const globalCombos = new Set<string>();

    for (const a of assignments) {
      if (!a.academicYear || !a.semester || !a.className) {
        isValid = false;
        errorMsg = 'All assignments must have a Year, Semester, and Class selected.';
        break;
      }
      if (a.subjects.length === 0) {
        isValid = false;
        errorMsg = 'Every assignment must have at least one subject.';
        break;
      }

      const localSubjects = new Set<string>();
      for (const sub of a.subjects) {
        const subTrim = sub.trim();
        if (!subTrim) {
          isValid = false;
          errorMsg = 'Subject names cannot be empty.';
          break;
        }
        const subLower = subTrim.toLowerCase();
        if (localSubjects.has(subLower)) {
          isValid = false;
          errorMsg = `Duplicate subject "${subTrim}" in the same assignment.`;
          break;
        }
        localSubjects.add(subLower);

        const comboKey = `${a.academicYear}|${a.semester}|${a.className}|${subLower}`;
        if (globalCombos.has(comboKey)) {
          isValid = false;
          errorMsg = `Duplicate combination: ${a.academicYear}, ${a.semester}, ${a.className}, ${subTrim}.`;
          break;
        }
        globalCombos.add(comboKey);
      }
      if (!isValid) break;
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between p-6 border-b border-border bg-card sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
              {request.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{request.status === 'Approved' ? 'Edit Access:' : 'Grant Access:'} {request.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{request.department} • {request.empId} • {request.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive shrink-0"><X size={20} /></Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
          {request.requestedClasses && request.requestedClasses.length > 0 && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <h4 className="text-sm font-semibold text-foreground mb-2">Requested Classes Context</h4>
              <div className="flex gap-2 flex-wrap">
                {request.requestedClasses.map((c: string) => (
                  <Badge key={c} variant="outline" className="bg-background">{c}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {selectedAssignments.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm font-medium text-destructive">{selectedAssignments.length} assignment(s) selected</span>
                <Button variant="destructive" size="sm" onClick={removeSelectedAssignments} className="h-8 shadow-sm">
                  <Trash2 size={14} className="mr-1.5" /> Remove Selected
                </Button>
              </div>
            )}
            
            {assignments.map((assign, index) => (
              <Card key={assign.id} className={`border-border shadow-sm transition-colors ${selectedAssignments.includes(assign.id) ? 'border-destructive/50 ring-1 ring-destructive/50' : ''}`}>
                <CardHeader className="p-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={selectedAssignments.includes(assign.id)}
                      onChange={() => toggleSelectAssignment(assign.id)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <CardTitle className="text-sm font-semibold cursor-pointer" onClick={() => toggleSelectAssignment(assign.id)}>Assignment #{index + 1}</CardTitle>
                  </div>
                  {assignments.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeAssignment(assign.id)} className="text-destructive hover:bg-destructive/10 h-8 px-2">
                      <Trash2 size={16} className="mr-1" /> Remove
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academic Year</label>
                      <CustomSelect value={assign.academicYear} onChange={(e) => updateAssignment(assign.id, 'academicYear', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground">
                        <option value="" disabled className="text-muted-foreground">Select Year</option>
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                      </CustomSelect>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Semester</label>
                      <CustomSelect value={assign.semester} onChange={(e) => updateAssignment(assign.id, 'semester', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground">
                        <option value="" disabled className="text-muted-foreground">Select Semester</option>
                        {semOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </CustomSelect>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Class</label>
                      <CustomSelect value={assign.className} onChange={(e) => updateAssignment(assign.id, 'className', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground">
                        <option value="" disabled className="text-muted-foreground">Select Class</option>
                        {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                      </CustomSelect>
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subjects</label>
                      <Button type="button" variant="secondary" size="sm" onClick={() => addSubject(assign.id)} className="h-8 shadow-sm">
                        <Plus size={14} className="mr-1" /> Add Subject
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {assign.subjects.map((sub: string, index: number) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            value={sub} 
                            onChange={(e) => updateSubject(assign.id, index, e.target.value)} 
                            placeholder="e.g. Software Engineering" 
                            className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary/50 focus:outline-none transition-colors"
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeSubject(assign.id, index)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            disabled={assign.subjects.length === 1}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button variant="outline" onClick={addAssignment} className="w-full border-dashed border-2 py-6 text-muted-foreground hover:text-foreground bg-transparent">
              <Plus size={16} className="mr-2" /> Add Another Assignment
            </Button>
          </div>
        </div>
        
        <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row gap-3 justify-between items-center z-20 sticky bottom-0">
          <Button variant="destructive" onClick={() => onReject(request.id)} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            <UserX size={16} className="mr-2" /> Reject Request
          </Button>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {!isValid && errorMsg && (
              <span className="text-xs text-destructive font-medium hidden md:block">{errorMsg}</span>
            )}
            <Button variant="outline" onClick={() => onDraft(request.id, assignments)} className="w-full sm:w-auto">
              Save as Draft
            </Button>
            <Button onClick={() => onApprove(request.id, assignments)} disabled={!isValid} className="w-full sm:w-auto bg-success hover:bg-success/90 text-success-foreground shadow-sm shrink-0">
              <CheckCircle2 size={16} className="mr-2" /> {request.status === 'Approved' ? 'Save Changes' : 'Approve & Grant Access'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const FacultyRequestsModule = () => {
  const { user, role } = useAuth();
  const [requests, setRequests] = useState(mockData.facultyRequests.map(r => ({ ...r, draftAssignments: null as any, approvedAssignments: null as any })));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalRequest, setModalRequest] = useState<any>(null);
  const [viewRequest, setViewRequest] = useState<any>(null);
  const [removeRequest, setRemoveRequest] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const handleApproveAccess = (id: string, assignments: any) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status: 'Approved', draftAssignments: null, approvedAssignments: assignments } : req));
    setModalRequest(null);
    toast.success('Access request approved and assignments saved successfully.');
  };

  const handleReject = (id: string) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status: 'Rejected', draftAssignments: null } : req));
    setModalRequest(null);
    toast.success('Access request has been rejected.');
  };

  const handleDraft = (id: string, assignments: any) => {
    setRequests(requests.map(req => req.id === id ? { ...req, draftAssignments: assignments } : req));
    setModalRequest(null);
    toast.info('Assignments saved as draft.');
  };

  const confirmRemoveAccess = (id: string) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status: 'Access Removed', draftAssignments: null, approvedAssignments: null } : req));
    setRemoveRequest(null);
    toast.success('All access has been completely revoked.');
  };

  const handleEditAccess = (req: any) => {
    setModalRequest(req);
  };

  const getStatusBadge = (status: string, hasDraft: boolean) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="default" className="bg-success text-success-foreground"><CheckCircle2 size={12} className="mr-1" /> Approved</Badge>;
      case 'Rejected':
        return <Badge variant="destructive"><XCircle size={12} className="mr-1" /> Rejected</Badge>;
      case 'Access Removed':
        return <Badge variant="outline" className="text-destructive border-destructive/50"><UserX size={12} className="mr-1" /> Access Removed</Badge>;
      default:
        return (
          <div className="flex gap-2">
            {hasDraft && <Badge variant="outline" className="text-primary border-primary/50">Draft Saved</Badge>}
            <Badge variant="secondary" className="bg-warning text-warning-foreground"><Clock size={12} className="mr-1" /> Pending</Badge>
          </div>
        );
    }
  };

  const filteredRequests = requests.filter(req => {
    // Role-based visibility
    if (role === 'coordinator') {
      const coordinatorClasses = user?.classes || [];
      const hasRequested = req.requestedClasses?.some((c: string) => coordinatorClasses.includes(c));
      const hasApproved = req.approvedAssignments?.some((a: any) => {
        return mockData.classes.some(cls => coordinatorClasses.includes(cls.id) && cls.year === a.academicYear && cls.name === a.className);
      });
      if (!hasRequested && !hasApproved) return false;
    }
    
    // Tab-based visibility
    if (activeTab === 'pending') return req.status === 'Pending';
    if (activeTab === 'approved') return req.status === 'Approved';
    if (activeTab === 'rejected') return req.status === 'Rejected' || req.status === 'Access Removed';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Faculty Access Requests</h2>
          <p className="text-muted-foreground mt-1">Manage and approve portal access for faculty members.</p>
        </div>
        
        <div className="flex bg-muted/30 p-1 rounded-lg border border-border">
          {(['pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.map(req => (
          <Card key={req.id} className="overflow-hidden transition-all hover:shadow-md border-border">
            <CardHeader 
              className="p-4 bg-muted/30 cursor-pointer flex flex-row items-center justify-between"
              onClick={() => {
                if (req.status === 'Pending') {
                  setModalRequest(req);
                } else {
                  setExpandedId(expandedId === req.id ? null : req.id);
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {req.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">{req.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{req.department} • {req.empId}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(req.status, !!req.draftAssignments)}
                {req.status !== 'Pending' && (
                  <ChevronDown size={20} className={`text-muted-foreground transition-transform ${expandedId === req.id ? 'rotate-180' : ''}`} />
                )}
              </div>
            </CardHeader>

            {expandedId === req.id && req.status !== 'Pending' && (
              <CardContent className="p-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Contact Details</h4>
                      <p className="text-sm"><span className="font-medium">Email:</span> {req.email}</p>
                      <p className="text-sm"><span className="font-medium">Mobile:</span> {req.mobile}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Request Info</h4>
                      <p className="text-sm"><span className="font-medium">Date:</span> {new Date(req.requestedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {req.status === 'Approved' && (
                  <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-border/50">
                    <Button variant="outline" size="sm" onClick={() => setViewRequest(req)}>
                      <Eye size={14} className="mr-1.5" /> View Details
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditAccess(req)}>
                      <Edit2 size={14} className="mr-1.5" /> Edit Access
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setRemoveRequest(req)}>
                      <UserX size={14} className="mr-1.5" /> Remove Access
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
        {filteredRequests.length === 0 && (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
            <UserCheck size={48} className="mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No {activeTab} requests</h3>
            <p className="text-sm text-muted-foreground">There are no faculty requests in this category.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalRequest && (
          <GrantFacultyAccessModal 
            request={modalRequest} 
            onClose={() => setModalRequest(null)}
            onApprove={handleApproveAccess}
            onReject={handleReject}
            onDraft={handleDraft}
          />
        )}
        {viewRequest && (
          <ViewFacultyDetailsModal
            request={viewRequest}
            onClose={() => setViewRequest(null)}
          />
        )}
        {removeRequest && (
          <RemoveAccessConfirmModal
            request={removeRequest}
            onClose={() => setRemoveRequest(null)}
            onConfirm={confirmRemoveAccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

