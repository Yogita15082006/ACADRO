import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Users2, Edit2, Save, Filter, RefreshCw, AlertCircle, TrendingUp, CheckCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { facultyProfileService } from '../../services/facultyProfileService';

interface FacultyClassStrengthProps {
  departmentId?: string;
  isHod: boolean;
  readOnly: boolean;
}

export const FacultyClassStrength: React.FC<FacultyClassStrengthProps> = ({
  departmentId,
  isHod,
  readOnly
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // Edit Dialog State
  const [editForm, setEditForm] = useState({
    sanctionedIntake: 60,
    lateralEntryCount: 0,
    supernumeraryCount: 0,
    detainedCount: 0,
    remarks: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const records = await facultyProfileService.getClassStrength({ departmentId });
      setData(records);
    } catch (e: any) {
      toast.error('Failed to load class & department strength data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [departmentId]);

  const handleOpenEdit = (item: any) => {
    if (!isHod) return;
    setSelectedItem(item);
    setEditForm({
      sanctionedIntake: item.sanctionedIntake ?? 60,
      lateralEntryCount: item.lateralEntryCount ?? 0,
      supernumeraryCount: item.supernumeraryCount ?? 0,
      detainedCount: item.detainedCount ?? 0,
      remarks: item.remarks || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSavingItem(true);
    try {
      await facultyProfileService.updateClassStrength({
        classId: selectedItem.classId,
        semesterId: selectedItem.semesterId,
        academicYearId: selectedItem.academicYearId,
        sanctionedIntake: parseInt(String(editForm.sanctionedIntake), 10) || 0,
        lateralEntryCount: parseInt(String(editForm.lateralEntryCount), 10) || 0,
        supernumeraryCount: parseInt(String(editForm.supernumeraryCount), 10) || 0,
        detainedCount: parseInt(String(editForm.detainedCount), 10) || 0,
        remarks: editForm.remarks
      });
      toast.success(`Strength configuration updated for ${selectedItem.className}`);
      setSelectedItem(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update strength configuration');
    } finally {
      setSavingItem(false);
    }
  };

  const totalSanctioned = data.reduce((sum, d) => sum + (d.sanctionedIntake || 0), 0);
  const totalActual = data.reduce((sum, d) => sum + (d.actualStrength || 0), 0);
  const totalLateral = data.reduce((sum, d) => sum + (d.lateralEntryCount || 0), 0);
  const totalSupernumerary = data.reduce((sum, d) => sum + (d.supernumeraryCount || 0), 0);
  const totalDetained = data.reduce((sum, d) => sum + (d.detainedCount || 0), 0);

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden transition-all">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">8. Class & Department Strength Information</CardTitle>
          </div>
          <CardDescription>
            Live student enrollment numbers, sanctioned seat intake, lateral entries, supernumerary admissions, and detentions.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-1.5 shadow-sm">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Live Counts
        </Button>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        
        {/* Department Strength Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sanctioned Intake</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{totalSanctioned}</h3>
            <span className="text-[11px] text-muted-foreground">AICTE Approved Seats</span>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Actual Strength</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalActual}</h3>
            <span className="text-[11px] text-muted-foreground">Enrolled Students (Live)</span>
          </div>

          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Lateral Entry</p>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{totalLateral}</h3>
            <span className="text-[11px] text-muted-foreground">Diploma to Degree</span>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Supernumerary</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{totalSupernumerary}</h3>
            <span className="text-[11px] text-muted-foreground">TFW / EWS / PMSSS</span>
          </div>

          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Detained</p>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{totalDetained}</h3>
            <span className="text-[11px] text-muted-foreground">Academic / Attendance</span>
          </div>
        </div>

        {/* Informative Notice */}
        <div className="p-3 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              <strong>Live Database Synchronization:</strong> Actual Student Strength is derived dynamically from registered student enrollment records to prevent inconsistencies.
            </span>
          </div>
          {isHod && (
            <span className="text-[11px] font-medium text-primary">Click &quot;Configure&quot; on any row to adjust Sanctioned & Lateral quotas</span>
          )}
        </div>

        {/* Strength Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">S.No.</th>
                  <th className="py-3 px-4">1. Class</th>
                  <th className="py-3 px-4">2. Semester</th>
                  <th className="py-3 px-4">3. Section</th>
                  <th className="py-3 px-4 text-center">4. Sanctioned Intake</th>
                  <th className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400">5. Actual Strength</th>
                  <th className="py-3 px-4 text-center">6. Lateral Entry</th>
                  <th className="py-3 px-4 text-center">7. Supernumerary</th>
                  <th className="py-3 px-4 text-center">8. Detained</th>
                  {isHod && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-muted-foreground italic">
                      {loading ? 'Calculating class enrollment figures...' : 'No class entities found for this department.'}
                    </td>
                  </tr>
                ) : (
                  data.map((item, idx) => (
                    <tr key={item.classId || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-foreground">{item.className}</td>
                      <td className="py-3 px-4 text-muted-foreground">{item.semesterName || 'Semester'}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="font-semibold bg-primary/5 text-primary border-primary/20">
                          {item.section || 'A'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">{item.sanctionedIntake}</td>
                      <td className="py-3 px-4 text-center font-bold text-base text-emerald-600 dark:text-emerald-400">
                        {item.actualStrength}
                      </td>
                      <td className="py-3 px-4 text-center text-blue-600 font-semibold">{item.lateralEntryCount}</td>
                      <td className="py-3 px-4 text-center text-amber-600 font-semibold">{item.supernumeraryCount}</td>
                      <td className="py-3 px-4 text-center text-rose-600 font-semibold">{item.detainedCount}</td>
                      {isHod && (
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-primary gap-1"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Configure
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

      {/* Edit Class Strength Dialog (HOD only) */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-primary" /> Configure Class Quotas: {selectedItem?.className}
            </DialogTitle>
            <DialogDescription>
              Set official sanctioned intake and adjust non-regular admission counts for {selectedItem?.className} (Section {selectedItem?.section}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase">4. Sanctioned Intake</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.sanctionedIntake}
                  onChange={e => setEditForm(p => ({ ...p, sanctionedIntake: parseInt(e.target.value, 10) || 0 }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-emerald-600">5. Actual Enrolled</Label>
                <Input
                  value={selectedItem?.actualStrength || 0}
                  disabled
                  className="bg-muted/50 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase">6. Lateral</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.lateralEntryCount}
                  onChange={e => setEditForm(p => ({ ...p, lateralEntryCount: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase">7. Supernumerary</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.supernumeraryCount}
                  onChange={e => setEditForm(p => ({ ...p, supernumeraryCount: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase">8. Detained</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.detainedCount}
                  onChange={e => setEditForm(p => ({ ...p, detainedCount: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">Remarks / Seat Adjustments</Label>
              <Input
                value={editForm.remarks}
                onChange={e => setEditForm(p => ({ ...p, remarks: e.target.value }))}
                placeholder="Approved under AICTE intake expansion..."
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedItem(null)}>Cancel</Button>
              <Button type="submit" disabled={savingItem}>
                {savingItem ? 'Updating...' : 'Save Configuration'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
