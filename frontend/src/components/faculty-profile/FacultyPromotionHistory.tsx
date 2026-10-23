import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { TrendingUp, Plus, ExternalLink, Trash2, Calendar, FileText, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { facultyProfileService } from '../../services/facultyProfileService';
import { FacultyFileActions } from './FacultyFileActions';

interface FacultyPromotionHistoryProps {
  facultyId: string;
  facultyName: string;
  employeeId: string;
  currentDesignation: string;
  role?: string;
  promotions: any[];
  isHod: boolean;
  onRefresh: () => void;
}

export const FacultyPromotionHistory: React.FC<FacultyPromotionHistoryProps> = ({
  facultyId,
  facultyName,
  employeeId,
  currentDesignation,
  role,
  promotions = [],
  isHod,
  onRefresh
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingOrder, setUploadingOrder] = useState(false);

  const [form, setForm] = useState({
    designation: 'Associate Professor',
    promotionDate: new Date().toISOString().split('T')[0],
    isProfessor: false,
    isAssociate: true,
    isAssistant: false,
    orderNumber: '',
    documentUrl: '',
    remarks: ''
  });

  const handleDesignationSelect = (desig: string) => {
    const isProf = desig.toLowerCase().includes('professor') && !desig.toLowerCase().includes('assistant') && !desig.toLowerCase().includes('associate');
    const isAssoc = desig.toLowerCase().includes('associate');
    const isAssist = desig.toLowerCase().includes('assistant');
    setForm(prev => ({
      ...prev,
      designation: desig,
      isProfessor: isProf,
      isAssociate: isAssoc,
      isAssistant: isAssist
    }));
  };

  const handleOrderUpload = async (file: File) => {
    if (!file) return;
    setUploadingOrder(true);
    try {
      const url = await facultyProfileService.uploadDocument(file);
      setForm(prev => ({ ...prev, documentUrl: url }));
      toast.success('Promotion order uploaded successfully!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to upload promotion order');
    } finally {
      setUploadingOrder(false);
    }
  };

  const handleAddPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHod) {
      toast.error('Only HOD or Admin can add promotion records');
      return;
    }

    setSaving(true);
    try {
      await facultyProfileService.addPromotion(facultyId, form);
      toast.success('Promotion record added and designation updated successfully!');
      setModalOpen(false);
      setForm({
        designation: 'Associate Professor',
        promotionDate: new Date().toISOString().split('T')[0],
        isProfessor: false,
        isAssociate: true,
        isAssistant: false,
        orderNumber: '',
        documentUrl: '',
        remarks: ''
      });
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to add promotion');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePromotion = async (promotionId: string) => {
    if (!confirm('Are you sure you want to delete this promotion history record?')) return;
    try {
      await facultyProfileService.deletePromotion(facultyId, promotionId);
      toast.success('Promotion record deleted');
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete promotion');
    }
  };

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden transition-all">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">4. Promotion History & Career Progression</CardTitle>
          </div>
          <CardDescription>
            Chronological promotion milestones, cadre advancement orders, and verified appointment dates.
          </CardDescription>
        </div>
        {isHod && (
          <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> Add Promotion Order
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Current Status Overview Banner */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Current Designation</p>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-lg font-bold text-foreground">
                {currentDesignation || 'Faculty Member'}
              </h4>
              <Badge variant="outline" className="text-xs bg-background">Active</Badge>
              {role && (
                <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                  Role: {role}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {facultyName} (Emp ID: {employeeId || 'N/A'})
            </p>
          </div>
          {!isHod && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              <Shield className="w-4 h-4" /> Promotion records are verified and maintained by the HOD.
            </div>
          )}
        </div>

        {/* Promotions History Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">1. S.No.</th>
                  <th className="py-3 px-4">2. Faculty Name</th>
                  <th className="py-3 px-4">3. Emp ID</th>
                  <th className="py-3 px-4">4. Designation Awarded</th>
                  <th className="py-3 px-4">5. Promotion Date</th>
                  <th className="py-3 px-4 text-center">6. Prof</th>
                  <th className="py-3 px-4 text-center">7. Assoc</th>
                  <th className="py-3 px-4 text-center">8. Assist</th>
                  <th className="py-3 px-4">Order / Evidence</th>
                  {isHod && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {promotions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-muted-foreground italic">
                      No historical promotion records registered. Current designation: {currentDesignation || 'Faculty Member'}.
                    </td>
                  </tr>
                ) : (
                  promotions.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">{facultyName}</td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">{employeeId}</td>
                      <td className="py-3 px-4 font-semibold text-primary">{p.designation}</td>
                      <td className="py-3 px-4 text-muted-foreground">{p.promotionDate || 'N/A'}</td>
                      
                      {/* Prof */}
                      <td className="py-3 px-4 text-center">
                        {p.isProfessor ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">Y</Badge>
                        ) : (
                          <span className="text-muted-foreground/60 text-xs font-semibold">N</span>
                        )}
                      </td>

                      {/* Assoc */}
                      <td className="py-3 px-4 text-center">
                        {p.isAssociate ? (
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">Y</Badge>
                        ) : (
                          <span className="text-muted-foreground/60 text-xs font-semibold">N</span>
                        )}
                      </td>

                      {/* Assist */}
                      <td className="py-3 px-4 text-center">
                        {p.isAssistant ? (
                          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">Y</Badge>
                        ) : (
                          <span className="text-muted-foreground/60 text-xs font-semibold">N</span>
                        )}
                      </td>

                      {/* Document */}
                      <td className="py-3 px-4">
                        {p.documentUrl ? (
                          <FacultyFileActions
                            url={p.documentUrl}
                            fileName={p.orderNumber ? `Promotion_Order_${p.orderNumber}.pdf` : 'Promotion_Order.pdf'}
                            category="Promotion Order"
                            label="Preview Order"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {p.orderNumber ? `Ref: ${p.orderNumber}` : 'No document'}
                          </span>
                        )}
                      </td>

                      {/* HOD Actions */}
                      {isHod && (
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePromotion(p.id)}
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

      {/* Add Promotion Modal (HOD only) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Record Faculty Promotion
            </DialogTitle>
            <DialogDescription>
              Record an official promotion order. Updating will also advance the faculty member&apos;s current designation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddPromotion} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Promoted Designation</Label>
              <select
                value={form.designation}
                onChange={e => handleDesignationSelect(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-semibold"
                required
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Senior Professor">Senior Professor</option>
                <option value="HOD">HOD</option>
                <option value="Adjunct Faculty">Adjunct Faculty</option>
                <option value="Lecturer">Lecturer</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Promotion Effective Date</Label>
              <Input
                type="date"
                value={form.promotionDate}
                onChange={e => setForm(p => ({ ...p, promotionDate: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg border border-border/80 bg-muted/20">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isProfessor}
                  onChange={e => setForm(p => ({ ...p, isProfessor: e.target.checked }))}
                  className="rounded text-primary"
                />
                Professor (Y/N)
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAssociate}
                  onChange={e => setForm(p => ({ ...p, isAssociate: e.target.checked }))}
                  className="rounded text-primary"
                />
                Associate (Y/N)
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAssistant}
                  onChange={e => setForm(p => ({ ...p, isAssistant: e.target.checked }))}
                  className="rounded text-primary"
                />
                Assistant (Y/N)
              </label>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Order / Circular Number</Label>
              <Input
                value={form.orderNumber}
                onChange={e => setForm(p => ({ ...p, orderNumber: e.target.value }))}
                placeholder="e.g. AITR/EST/PROM/2024/491"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Official Promotion Order Document (PDF)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => {
                    if (e.target.files?.[0]) handleOrderUpload(e.target.files[0]);
                  }}
                  disabled={uploadingOrder}
                />
              </div>
              {form.documentUrl && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Document attached successfully
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Remarks</Label>
              <Input
                value={form.remarks}
                onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
                placeholder="Recommended by Selection Committee..."
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || uploadingOrder}>
                {saving ? 'Recording...' : 'Save Promotion Order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
