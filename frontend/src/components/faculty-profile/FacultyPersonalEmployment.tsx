import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Edit2, Save, X, User, Briefcase, Mail, Phone, Calendar, Building, Shield, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface FacultyPersonalEmploymentProps {
  data: any;
  isHod: boolean;
  isCoordinator: boolean;
  readOnly: boolean;
  departments: string[];
  designations: string[];
  onSave: (updated: any) => Promise<boolean>;
}

export const FacultyPersonalEmployment: React.FC<FacultyPersonalEmploymentProps> = ({
  data,
  isHod,
  isCoordinator,
  readOnly,
  departments,
  designations,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    employeeId: data.employeeId || '',
    departmentName: data.departmentName || '',
    designation: data.designation || 'Faculty Member',
    joiningDate: data.joiningDate || '',
    employmentType: data.employmentType || 'Regular',
    pan: data.pan || '',
    aicteId: data.aicteId || '',
    rgpvId: data.rgpvId || '',
    email: data.email || '',
    phone: data.phone || '',
    highestQualification: data.highestQualification || '',
    remarks: data.remarks || ''
  });

  useEffect(() => {
    setForm({
      employeeId: data.employeeId || '',
      departmentName: data.departmentName || '',
      designation: data.designation || 'Faculty Member',
      joiningDate: data.joiningDate || '',
      employmentType: data.employmentType || 'Regular',
      pan: data.pan || '',
      aicteId: data.aicteId || '',
      rgpvId: data.rgpvId || '',
      email: data.email || '',
      phone: data.phone || '',
      highestQualification: data.highestQualification || '',
      remarks: data.remarks || ''
    });
  }, [data]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Basic validation
    if (form.pan && !form.pan.includes('*') && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(form.pan.trim())) {
      toast.error('Invalid PAN format. Expected format: ABCDE1234F');
      return;
    }
    if (form.phone && !/^\+?[0-9]{10,13}$/.test(form.phone.trim())) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setSaving(true);
    try {
      const ok = await onSave(form);
      if (ok) setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save personal & employment details');
    } finally {
      setSaving(false);
    }
  };

  const employmentTypes = ['Regular', 'Contractual', 'Ad-hoc', 'Visiting', 'Adjunct', 'Temporary'];
  const fallbackDesignations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Senior Professor', 'HOD', 'Adjunct Faculty', 'Lecturer'];
  const designationOptions = designations.length > 0 ? designations : fallbackDesignations;

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden transition-all">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">1. Personal & Employment Details</CardTitle>
          </div>
          <CardDescription>
            Official institutional identification, department affiliation, and appointment parameters.
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
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5 shadow-sm">
                <Edit2 className="w-4 h-4" /> Edit Details
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* S.No. (Auto-generated / Read-only) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              1. S.No. (Record Index)
            </Label>
            <Input value="1" disabled className="bg-muted/50 cursor-not-allowed font-medium" />
          </div>

          {/* Emp ID */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>2. Employee ID</span>
              {!isHod && <span className="text-[10px] text-amber-500 font-normal">HOD Protected</span>}
            </Label>
            <Input
              value={form.employeeId}
              onChange={e => handleChange('employeeId', e.target.value)}
              disabled={!isEditing || !isHod}
              className={`${!isHod ? 'bg-muted/50 cursor-not-allowed' : 'bg-background'} font-medium`}
              placeholder="e.g. EMP-10492"
            />
          </div>

          {/* Dept */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>3. Department</span>
              {!isHod && <span className="text-[10px] text-amber-500 font-normal">HOD Protected</span>}
            </Label>
            {isEditing && isHod ? (
              <select
                value={form.departmentName}
                onChange={e => handleChange('departmentName', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select Department</option>
                {departments.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            ) : (
              <Input
                value={form.departmentName || 'Not Assigned'}
                disabled
                className="bg-muted/50 cursor-not-allowed font-medium"
              />
            )}
          </div>

          {/* Designation */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>4. Designation</span>
              {!isHod && <span className="text-[10px] text-amber-500 font-normal">HOD Protected</span>}
            </Label>
            {isEditing && isHod ? (
              <select
                value={form.designation}
                onChange={e => handleChange('designation', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {designationOptions.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={form.designation}
                  disabled
                  className="bg-muted/50 cursor-not-allowed font-medium"
                />
              </div>
            )}
          </div>

          {/* DOJ (Date of Joining) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              5. Date of Joining (DOJ)
            </Label>
            <Input
              type="date"
              value={form.joiningDate}
              onChange={e => handleChange('joiningDate', e.target.value)}
              disabled={!isEditing}
              className="bg-background disabled:bg-muted/50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Employment Type */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              6. Employment Type
            </Label>
            {isEditing ? (
              <select
                value={form.employmentType}
                onChange={e => handleChange('employmentType', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {employmentTypes.map((et, i) => (
                  <option key={i} value={et}>{et}</option>
                ))}
              </select>
            ) : (
              <div className="h-10 flex items-center">
                <Badge variant="outline" className="px-3 py-1 font-medium bg-primary/5 text-primary border-primary/20">
                  {form.employmentType || 'Regular'}
                </Badge>
              </div>
            )}
          </div>

          {/* PAN */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>7. PAN Number</span>
              {isCoordinator && <span className="text-[10px] text-amber-500 font-normal">Confidential (Masked)</span>}
            </Label>
            <Input
              value={form.pan}
              onChange={e => handleChange('pan', e.target.value.toUpperCase())}
              disabled={!isEditing || isCoordinator}
              maxLength={10}
              placeholder="e.g. ABCDE1234F"
              className="bg-background uppercase tracking-wider disabled:bg-muted/50 disabled:cursor-not-allowed font-mono"
            />
          </div>

          {/* AICTE ID */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              8. AICTE ID
            </Label>
            <Input
              value={form.aicteId}
              onChange={e => handleChange('aicteId', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g. 1-28941042"
              className="bg-background disabled:bg-muted/50 disabled:cursor-not-allowed"
            />
          </div>

          {/* RGPV ID */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              9. RGPV Faculty ID
            </Label>
            <Input
              value={form.rgpvId}
              onChange={e => handleChange('rgpvId', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g. RGPV-FAC-0491"
              className="bg-background disabled:bg-muted/50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              10. Official Email Address
            </Label>
            <Input
              type="email"
              value={form.email}
              disabled
              className="bg-muted/50 cursor-not-allowed font-medium"
            />
          </div>

          {/* Mobile */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              11. Mobile Number
            </Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g. 9876543210"
              className="bg-background disabled:bg-muted/50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Highest Qual */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              12. Highest Qualification
            </Label>
            <Input
              value={form.highestQualification}
              onChange={e => handleChange('highestQualification', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g. Ph.D. in Computer Science"
              className="bg-background disabled:bg-muted/50 disabled:cursor-not-allowed"
            />
          </div>

        </div>

        {/* Remarks */}
        <div className="mt-6 space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            24. Administrative Remarks & Employment Notes
          </Label>
          <Textarea
            value={form.remarks}
            onChange={e => handleChange('remarks', e.target.value)}
            disabled={!isEditing}
            rows={3}
            placeholder="Additional institutional notes, special responsibilities, or service records..."
            className="bg-background disabled:bg-muted/50 disabled:cursor-not-allowed text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
};
