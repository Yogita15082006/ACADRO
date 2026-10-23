import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Edit2, Save, X, History, Building2, Calendar, FileUp, ExternalLink, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { facultyProfileService } from '../../services/facultyProfileService';
import { FacultyFileActions } from './FacultyFileActions';

interface FacultyExperienceRetentionProps {
  data: any;
  isHod: boolean;
  readOnly: boolean;
  onSave: (updated: any) => Promise<boolean>;
}

export const FacultyExperienceRetention: React.FC<FacultyExperienceRetentionProps> = ({
  data,
  isHod,
  readOnly,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [form, setForm] = useState({
    teachingExperienceYears: data.teachingExperienceYears ?? 0,
    industryExperienceYears: data.industryExperienceYears ?? 0,
    aitrServiceYears: data.aitrServiceYears ?? 0,
    currentDesignationSince: data.currentDesignationSince || '',
    previousInstitute: data.previousInstitute || '',
    retentionCategory: data.retentionCategory || 'A',
    documents: data.documents || {}
  });

  useEffect(() => {
    setForm({
      teachingExperienceYears: data.teachingExperienceYears ?? 0,
      industryExperienceYears: data.industryExperienceYears ?? 0,
      aitrServiceYears: data.aitrServiceYears ?? 0,
      currentDesignationSince: data.currentDesignationSince || '',
      previousInstitute: data.previousInstitute || '',
      retentionCategory: data.retentionCategory || 'A',
      documents: data.documents || {}
    });
  }, [data]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10MB limit');
      return;
    }
    setUploadingDoc(true);
    try {
      const url = await facultyProfileService.uploadDocument(file);
      const updatedDocs = {
        ...(form.documents || {}),
        expCertDoc: {
          url,
          fileName: file.name,
          uploadedAt: new Date().toISOString()
        }
      };
      setForm(prev => ({ ...prev, documents: updatedDocs }));
      await onSave({ documents: updatedDocs });
      toast.success(`${file.name} uploaded successfully!`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to upload experience certificate');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        teachingExperienceYears: parseFloat(String(form.teachingExperienceYears)) || 0,
        industryExperienceYears: parseFloat(String(form.industryExperienceYears)) || 0,
        aitrServiceYears: parseFloat(String(form.aitrServiceYears)) || 0
      };
      const ok = await onSave(payload);
      if (ok) setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save experience & retention details');
    } finally {
      setSaving(false);
    }
  };

  const retentionCategories = ['A', 'B', 'C', 'D', 'E'];

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden transition-all">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">3. Teaching Experience & Retention Details</CardTitle>
          </div>
          <CardDescription>
            Cumulative academic tenure, industry expertise, AITR length of service, and retention banding.
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
                <Edit2 className="w-4 h-4" /> Edit Experience
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        {/* Basic Header Identifiers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-border/60 bg-muted/10">
          <div>
            <Label className="text-xs text-muted-foreground uppercase font-semibold">1. S.No.</Label>
            <p className="text-sm font-semibold text-foreground mt-1">1</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase font-semibold">2. Faculty Name</Label>
            <p className="text-sm font-semibold text-foreground mt-1">{data.fullName || data.name || 'Faculty Member'}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase font-semibold">3. Employee ID</Label>
            <p className="text-sm font-semibold text-foreground mt-1">{data.employeeId || 'N/A'}</p>
          </div>
        </div>

        {/* Experience Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              4. Teaching Experience (Years)
            </Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={form.teachingExperienceYears}
              onChange={e => handleChange('teachingExperienceYears', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g. 8.5"
              className="bg-background text-lg font-bold disabled:bg-muted/50"
            />
            <p className="text-[11px] text-muted-foreground">Total academic instruction years.</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              5. Industry Experience (Years)
            </Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={form.industryExperienceYears}
              onChange={e => handleChange('industryExperienceYears', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g. 3.0"
              className="bg-background text-lg font-bold disabled:bg-muted/50"
            />
            <p className="text-[11px] text-muted-foreground">Corporate, industrial, or R&D tenure.</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              6. AITR Service Years
            </Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={form.aitrServiceYears}
              onChange={e => handleChange('aitrServiceYears', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g. 5.5"
              className="bg-background text-lg font-bold disabled:bg-muted/50"
            />
            <p className="text-[11px] text-muted-foreground">Active service completed at this institute.</p>
          </div>
        </div>

        {/* Institution & Retention Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              7. Current Designation Since
            </Label>
            <Input
              type="date"
              value={form.currentDesignationSince}
              onChange={e => handleChange('currentDesignationSince', e.target.value)}
              disabled={!isEditing}
              className="bg-background disabled:bg-muted/50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              8. Previous Institute / Organization
            </Label>
            <Input
              value={form.previousInstitute}
              onChange={e => handleChange('previousInstitute', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g. SGSITS Indore / Infosys Ltd."
              className="bg-background disabled:bg-muted/50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>9. Retention Category (A–E)</span>
              {!isHod && <span className="text-[10px] text-amber-500 font-normal">HOD Protected</span>}
            </Label>
            {isEditing && isHod ? (
              <select
                value={form.retentionCategory}
                onChange={e => handleChange('retentionCategory', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {retentionCategories.map(cat => (
                  <option key={cat} value={cat}>Category {cat}</option>
                ))}
              </select>
            ) : (
              <div className="h-10 flex items-center">
                <Badge variant="outline" className="px-3 py-1 font-bold text-sm bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  Category {form.retentionCategory || 'A'}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Experience Certificate Upload */}
        {(() => {
          const rawDoc = form.documents?.expCertDoc;
          const docInfo = typeof rawDoc === 'string'
            ? { url: rawDoc, fileName: 'Experience_Certificate.pdf' }
            : (rawDoc || {});
          const expUrl = docInfo.url;
          const expFileName = docInfo.fileName || 'Experience_Certificate.pdf';

          return (
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full min-w-0 overflow-hidden shadow-xs">
              <div className="min-w-0 flex-1">
                <h5 className="text-sm font-bold text-foreground">Supporting Experience Certificate / Documents</h5>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {expUrl
                    ? `Uploaded file: ${expFileName}` 
                    : 'Upload appointment order, relieving letters, or service certificates (PDF/PNG/JPG).'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0 self-end sm:self-auto">
                {expUrl && (
                  <FacultyFileActions
                    url={expUrl}
                    fileName={expFileName}
                    category="Experience Certificate"
                    label="Preview Certificate"
                  />
                )}
                {!readOnly && (
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors shrink-0">
                    <FileUp className="w-3.5 h-3.5" />
                    {uploadingDoc ? 'Uploading...' : (expUrl ? 'Replace File' : 'Upload Evidence')}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={e => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })()}

      </CardContent>
    </Card>
  );
};
