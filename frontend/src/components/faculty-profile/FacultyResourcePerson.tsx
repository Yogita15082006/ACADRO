import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Users, Plus, ExternalLink, Trash2, Clock, Calendar, CheckCircle2, Award } from 'lucide-react';
import { toast } from 'sonner';
import { facultyProfileService } from '../../services/facultyProfileService';
import { FacultyFileActions } from './FacultyFileActions';

interface FacultyResourcePersonProps {
  facultyId: string;
  resourcePersons: any[];
  academicYears: string[];
  readOnly: boolean;
  onRefresh: () => void;
}

export const FacultyResourcePerson: React.FC<FacultyResourcePersonProps> = ({
  facultyId,
  resourcePersons = [],
  academicYears = [],
  readOnly,
  onRefresh
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);

  const [form, setForm] = useState({
    resourceName: '',
    orgType: 'University',
    course: '',
    hours: 8,
    academicYear: academicYears[0] || '2024-2025',
    documentUrl: '',
    remarks: ''
  });

  const handleCertUpload = async (file: File) => {
    if (!file) return;
    setUploadingCert(true);
    try {
      const url = await facultyProfileService.uploadDocument(file);
      setForm(prev => ({ ...prev, documentUrl: url }));
      toast.success('Certificate uploaded successfully!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to upload certificate');
    } finally {
      setUploadingCert(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.resourceName.trim()) {
      toast.error('Please enter the event / resource name');
      return;
    }
    setSaving(true);
    try {
      await facultyProfileService.addResourcePerson(facultyId, {
        ...form,
        hours: parseInt(String(form.hours), 10) || 0
      });
      toast.success('Resource person record added successfully!');
      setModalOpen(false);
      setForm({
        resourceName: '',
        orgType: 'University',
        course: '',
        hours: 8,
        academicYear: academicYears[0] || '2024-2025',
        documentUrl: '',
        remarks: ''
      });
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to add resource person record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource person record?')) return;
    try {
      await facultyProfileService.deleteResourcePerson(facultyId, id);
      toast.success('Record removed');
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete record');
    }
  };

  const orgTypes = ['University', 'Engineering College', 'Industry / Corporate', 'Professional Body (CSI/IEEE/ACM)', 'Government Body', 'R&D Lab'];
  const ayOptions = academicYears.length > 0 ? academicYears : ['2024-2025', '2023-2024', '2022-2023', '2021-2022'];

  const totalHours = resourcePersons.reduce((sum, r) => sum + (r.hours || 0), 0);

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden transition-all">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">6. Resource Person & Professional Development</CardTitle>
          </div>
          <CardDescription>
            Expert talks, guest lectures, FDP delivery, STTP sessions, and workshop chairships.
          </CardDescription>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> Add Resource Activity
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        
        {/* Total Training Hours Metric */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Training Hours</p>
              <h3 className="text-xl font-bold text-foreground">{totalHours} Hours</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Activities Delivered</p>
              <h3 className="text-xl font-bold text-foreground">{resourcePersons.length} Programs</h3>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <Badge variant="outline" className="px-3 py-1 font-semibold text-xs bg-background">
              Academic Development Profile
            </Badge>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">S.No.</th>
                  <th className="py-3 px-4">1. Resource / Program Name</th>
                  <th className="py-3 px-4">2. Organization Type</th>
                  <th className="py-3 px-4">3. Course / Topic</th>
                  <th className="py-3 px-4 text-center">4. Hours</th>
                  <th className="py-3 px-4">5. Academic Year (AY)</th>
                  <th className="py-3 px-4">Certificate</th>
                  {!readOnly && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resourcePersons.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground italic">
                      No resource person or professional development sessions recorded. Click &quot;Add Resource Activity&quot; to add expert lectures.
                    </td>
                  </tr>
                ) : (
                  resourcePersons.map((rp, idx) => (
                    <tr key={rp.id || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-foreground max-w-xs">{rp.resourceName}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs bg-muted/40 font-medium">
                          {rp.orgType || 'University'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{rp.course || 'N/A'}</td>
                      <td className="py-3 px-4 text-center font-bold text-primary">{rp.hours || 0} hrs</td>
                      <td className="py-3 px-4 text-muted-foreground font-medium">{rp.academicYear || '2024-2025'}</td>
                      <td className="py-3 px-4">
                        {rp.documentUrl ? (
                          <FacultyFileActions
                            url={rp.documentUrl}
                            fileName={rp.eventTitle ? `${rp.eventTitle.substring(0, 30)}_Certificate.pdf` : 'Resource_Person_Certificate.pdf'}
                            category="Resource Person Certificate"
                            label="Preview Certificate"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </td>
                      {!readOnly && (
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rp.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </CardContent>

      {/* Add Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Add Resource Person Activity
            </DialogTitle>
            <DialogDescription>
              Record an expert talk, FDP delivery, or professional workshop session.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdd} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">1. Resource / Program / Event Name</Label>
              <Input
                value={form.resourceName}
                onChange={e => setForm(p => ({ ...p, resourceName: e.target.value }))}
                placeholder="e.g. AICTE Sponsored FDP on Generative AI"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">2. Organization Type</Label>
              <select
                value={form.orgType}
                onChange={e => setForm(p => ({ ...p, orgType: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {orgTypes.map(ot => (
                  <option key={ot} value={ot}>{ot}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">3. Course / Topic / Subject Taught</Label>
              <Input
                value={form.course}
                onChange={e => setForm(p => ({ ...p, course: e.target.value }))}
                placeholder="e.g. LLM Prompt Engineering & Agentic Workflows"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase">4. Duration (Hours)</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.hours}
                  onChange={e => setForm(p => ({ ...p, hours: parseInt(e.target.value, 10) || 0 }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase">5. Academic Year (AY)</Label>
                <select
                  value={form.academicYear}
                  onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-semibold"
                >
                  {ayOptions.map(ay => (
                    <option key={ay} value={ay}>{ay}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">Certificate / Appreciation Letter (PDF/JPG)</Label>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => {
                  if (e.target.files?.[0]) handleCertUpload(e.target.files[0]);
                }}
                disabled={uploadingCert}
              />
              {form.documentUrl && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Certificate uploaded
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">Remarks</Label>
              <Input
                value={form.remarks}
                onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
                placeholder="Invited keynote speaker..."
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || uploadingCert}>
                {saving ? 'Adding...' : 'Add Activity'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
