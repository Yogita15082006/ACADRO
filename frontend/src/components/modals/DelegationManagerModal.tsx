import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomDatePicker } from '@/components/ui/input';
import { toast } from 'sonner';
import { Trash2, Plus, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const DelegationManagerModal = ({ open, onOpenChange }: any) => {
  const [delegations, setDelegations] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [formData, setFormData] = useState({
    assignedFacultyId: '',
    departmentId: '',
    taskPurpose: '',
    validUntil: ''
  });

  useEffect(() => {
    if (open) {
      fetchDelegations();
      fetchFaculty();
      fetchDepartments();
      setShowCreate(false);
    }
  }, [open]);

  const fetchDelegations = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/v1/faculty-delegations/hod');
      setDelegations(res.data?.data || []);
    } catch (e: any) {
      toast.error('Failed to fetch delegations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await api.get('/users/faculty/hod-scope');
      setFacultyList(res.data?.data || []);
    } catch (e: any) {
      console.error(e);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments/hod');
      setDepartmentsList(res.data?.data || []);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.patch(`/v1/faculty-delegations/${id}/revoke`);
      toast.success('Task revoked successfully');
      fetchDelegations();
    } catch (e: any) {
      toast.error('Failed to revoke task');
    }
  };

  const handleCreate = async () => {
    if (!formData.assignedFacultyId || !formData.departmentId || !formData.taskPurpose || !formData.validUntil) {
      toast.error('Please fill all required fields');
      return;
    }
    if (formData.taskPurpose.trim().length === 0) {
      toast.error('Task Purpose cannot be empty');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        validUntil: formData.validUntil.includes('T') ? formData.validUntil : `${formData.validUntil}T23:59:59`
      };
      await api.post('/v1/faculty-delegations', payload);
      toast.success('Task assigned successfully');
      setShowCreate(false);
      fetchDelegations();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delegate task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Manage Assigned Tasks</DialogTitle>
          <DialogDescription>
            Assign the Faculty Management setup workflow to a trusted faculty member.
          </DialogDescription>
        </DialogHeader>

        {showCreate ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Faculty *</Label>
              <Select value={formData.assignedFacultyId} onValueChange={v => setFormData({ ...formData, assignedFacultyId: v })}>
                <SelectTrigger><SelectValue placeholder="Choose a faculty member..." /></SelectTrigger>
                <SelectContent position="popper" className="max-h-[250px] overflow-y-auto">
                  {facultyList.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name} ({f.employeeId})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department Scope *</Label>
              <Select value={formData.departmentId} onValueChange={v => setFormData({ ...formData, departmentId: v })}>
                <SelectTrigger><SelectValue placeholder="Choose department..." /></SelectTrigger>
                <SelectContent position="popper" className="max-h-[250px] overflow-y-auto">
                  {departmentsList.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Task Purpose *</Label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. Upload Semester 6 syllabus and timetable"
                value={formData.taskPurpose}
                onChange={e => setFormData({ ...formData, taskPurpose: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valid Until *</Label>
              <CustomDatePicker
                value={formData.validUntil}
                onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Current & Past Assignments</h3>
              <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Assign New Task
              </Button>
            </div>
            
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading tasks...</p>
            ) : delegations.length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-xl border border-dashed border-border">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No active or past assigned tasks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {delegations.map(task => (
                  <div key={task.id} className={`p-4 rounded-xl border flex items-center justify-between ${task.status === 'ACTIVE' ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/50'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{task.assignedFaculty?.name}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          task.status === 'ACTIVE' ? 'bg-primary/20 text-primary' : 
                          task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span>{task.department?.name}</span>
                        <span>•</span>
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {format(new Date(task.assignedAt), 'MMM dd, yyyy')}</span>
                      </p>
                    </div>
                    {task.status === 'ACTIVE' && (
                      <Button variant="ghost" size="sm" onClick={() => handleRevoke(task.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" /> Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {showCreate ? (
            <>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting || !formData.assignedFacultyId || !formData.departmentId || !formData.taskPurpose.trim() || !formData.validUntil}>
                {isSubmitting ? 'Assigning...' : 'Assign Task'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
