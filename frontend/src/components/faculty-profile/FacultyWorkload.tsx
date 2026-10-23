import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { BookOpen, Layers, Edit2, Save, X, Clock, Compass, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FacultyWorkloadProps {
  data: any;
  assignedSubjects: any[];
  readOnly: boolean;
  onSave: (updated: any) => Promise<boolean>;
}

export const FacultyWorkload: React.FC<FacultyWorkloadProps> = ({
  data,
  assignedSubjects = [],
  readOnly,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    theoryLoadHours: data.theoryLoadHours ?? 0,
    labLoadHours: data.labLoadHours ?? 0,
    projectGuideDetails: data.projectGuideDetails || '',
    mentoringDetails: data.mentoringDetails || '',
    adminDuties: data.adminDuties || ''
  });

  useEffect(() => {
    setForm({
      theoryLoadHours: data.theoryLoadHours ?? 0,
      labLoadHours: data.labLoadHours ?? 0,
      projectGuideDetails: data.projectGuideDetails || '',
      mentoringDetails: data.mentoringDetails || '',
      adminDuties: data.adminDuties || ''
    });
  }, [data]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        theoryLoadHours: parseInt(String(form.theoryLoadHours), 10) || 0,
        labLoadHours: parseInt(String(form.labLoadHours), 10) || 0
      };
      const ok = await onSave(payload);
      if (ok) setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update workload responsibilities');
    } finally {
      setSaving(false);
    }
  };

  const totalTeachingLoad = (form.theoryLoadHours || 0) + (form.labLoadHours || 0);

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden transition-all">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">7. Teaching Workload & Institutional Responsibilities</CardTitle>
          </div>
          <CardDescription>
            Live class-subject teaching hours, laboratory instructional load, major/minor project guiding, student mentorship, and administrative responsibilities.
          </CardDescription>
        </div>
        {!readOnly && (
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={saving} className="gap-1.5">
                  <X className="w-4 h-4" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 shadow-sm">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Workload'}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5 shadow-sm">
                <Edit2 className="w-4 h-4" /> Edit Responsibilities
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        
        {/* Workload Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                2. Theory Load
              </p>
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min="0"
                    value={form.theoryLoadHours}
                    onChange={e => handleChange('theoryLoadHours', e.target.value)}
                    className="w-24 h-9 font-bold text-lg"
                  />
                  <span className="text-xs text-muted-foreground font-semibold">hrs/wk</span>
                </div>
              ) : (
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {form.theoryLoadHours} <span className="text-xs font-normal text-muted-foreground">hrs/wk</span>
                </h3>
              )}
            </div>
            <Clock className="w-8 h-8 text-blue-500/30" />
          </div>

          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                3. Lab / Practical Load
              </p>
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min="0"
                    value={form.labLoadHours}
                    onChange={e => handleChange('labLoadHours', e.target.value)}
                    className="w-24 h-9 font-bold text-lg"
                  />
                  <span className="text-xs text-muted-foreground font-semibold">hrs/wk</span>
                </div>
              ) : (
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {form.labLoadHours} <span className="text-xs font-normal text-muted-foreground">hrs/wk</span>
                </h3>
              )}
            </div>
            <Clock className="w-8 h-8 text-indigo-500/30" />
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Total Teaching Load
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {totalTeachingLoad} <span className="text-xs font-normal text-muted-foreground">hrs/week</span>
              </h3>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-500/30" />
          </div>
        </div>

        {/* 1. Assigned Subjects Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> 1. Officially Assigned Class Subjects
            </h4>
            <span className="text-xs text-muted-foreground">
              {assignedSubjects.length} active subject allocation(s)
            </span>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4">S.No.</th>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Semester</th>
                    <th className="py-3 px-4">Academic Year</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assignedSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground italic">
                        No active subjects currently assigned in the institutional timetable.
                      </td>
                    </tr>
                  ) : (
                    assignedSubjects.map((s, idx) => (
                      <tr key={s.id || idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">{s.subjectName}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="font-semibold bg-primary/5 text-primary border-primary/20">
                            {s.className || 'Class'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{s.semester || 'Semester'}</td>
                        <td className="py-3 px-4 text-muted-foreground font-mono">{s.academicYear || '2024-2025'}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 4. Project Guide, 5. Mentoring & 6. Admin Duties */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Project Guide */}
          <div className="space-y-2 p-4 rounded-xl border border-border bg-card">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-primary" /> 4. Major & Minor Project Guiding
            </Label>
            <Textarea
              value={form.projectGuideDetails}
              onChange={e => handleChange('projectGuideDetails', e.target.value)}
              disabled={!isEditing}
              rows={4}
              placeholder="e.g. Major Project: 3 Groups (B.Tech Final Year), Minor Project: 2 Groups (3rd Year)..."
              className="bg-background disabled:bg-muted/50 text-xs"
            />
          </div>

          {/* Mentoring */}
          <div className="space-y-2 p-4 rounded-xl border border-border bg-card">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" /> 5. Student Mentoring & Counseling
            </Label>
            <Textarea
              value={form.mentoringDetails}
              onChange={e => handleChange('mentoringDetails', e.target.value)}
              disabled={!isEditing}
              rows={4}
              placeholder="e.g. Assigned Mentor for 24 students of Section 5-CS-B. Conducted bi-weekly academic counseling..."
              className="bg-background disabled:bg-muted/50 text-xs"
            />
          </div>

          {/* Admin Duties */}
          <div className="space-y-2 p-4 rounded-xl border border-border bg-card">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" /> 6. Institutional Administrative Duties
            </Label>
            <Textarea
              value={form.adminDuties}
              onChange={e => handleChange('adminDuties', e.target.value)}
              disabled={!isEditing}
              rows={4}
              placeholder="e.g. In-charge of Cloud Computing Lab, Member of NBA Criteria 4 Committee, Department Time Table Coordinator..."
              className="bg-background disabled:bg-muted/50 text-xs"
            />
          </div>

        </div>

      </CardContent>
    </Card>
  );
};
