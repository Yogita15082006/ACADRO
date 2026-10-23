import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Edit2, Save, X, GraduationCap, Award, FileUp, ExternalLink, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { facultyProfileService } from '../../services/facultyProfileService';
import { FacultyFileActions } from './FacultyFileActions';

interface FacultyQualificationsProps {
  data: any;
  readOnly: boolean;
  onSave: (updated: any) => Promise<boolean>;
}

export const FacultyQualifications: React.FC<FacultyQualificationsProps> = ({
  data,
  readOnly,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const [form, setForm] = useState({
    highestQualification: data.highestQualification || '',
    hasPhd: data.hasPhd === true || data.hasPhd === 'true',
    phdUniversity: data.phdUniversity || '',
    phdAwardDate: data.phdAwardDate || '',
    pgDetail: data.pgDetail || '',
    pgSpecialization: data.pgSpecialization || '',
    pgUniversity: data.pgUniversity || '',
    pgYear: data.pgYear || '',
    ugDetail: data.ugDetail || '',
    ugSpecialization: data.ugSpecialization || '',
    ugUniversity: data.ugUniversity || '',
    ugYear: data.ugYear || '',
    documents: data.documents || {}
  });

  useEffect(() => {
    setForm({
      highestQualification: data.highestQualification || '',
      hasPhd: data.hasPhd === true || data.hasPhd === 'true',
      phdUniversity: data.phdUniversity || '',
      phdAwardDate: data.phdAwardDate || '',
      pgDetail: data.pgDetail || '',
      pgSpecialization: data.pgSpecialization || '',
      pgUniversity: data.pgUniversity || '',
      pgYear: data.pgYear || '',
      ugDetail: data.ugDetail || '',
      ugSpecialization: data.ugSpecialization || '',
      ugUniversity: data.ugUniversity || '',
      ugYear: data.ugYear || '',
      documents: data.documents || {}
    });
  }, [data]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (docKey: string, file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10MB limit');
      return;
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type) && !file.name.endsWith('.pdf')) {
      toast.error('Only PDF, JPG, and PNG documents are allowed');
      return;
    }

    setUploadingDoc(docKey);
    try {
      const url = await facultyProfileService.uploadDocument(file);
      const updatedDocs = {
        ...(form.documents || {}),
        [docKey]: {
          url,
          fileName: file.name,
          uploadedAt: new Date().toISOString()
        }
      };
      setForm(prev => ({ ...prev, documents: updatedDocs }));
      await onSave({ documents: updatedDocs });
      toast.success(`${file.name} uploaded successfully!`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        hasPhd: form.hasPhd === true || String(form.hasPhd) === 'true',
        pgYear: form.pgYear ? parseInt(String(form.pgYear), 10) : null,
        ugYear: form.ugYear ? parseInt(String(form.ugYear), 10) : null
      };
      const ok = await onSave(payload);
      if (ok) setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save qualification details');
    } finally {
      setSaving(false);
    }
  };

  const renderDocUpload = (docKey: string, label: string) => {
    const rawDoc = form.documents?.[docKey];
    const docInfo = typeof rawDoc === 'string'
      ? { url: rawDoc, fileName: `${label}.pdf` }
      : (rawDoc || {});
    const fileUrl = docInfo.url;
    const fileName = docInfo.fileName || `${label}.pdf`;

    return (
      <div className="p-3.5 rounded-lg border border-border/70 bg-card/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs w-full min-w-0 overflow-hidden shadow-xs">
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
            <FileCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{label}</span>
          </span>
          {fileUrl && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate font-mono">
              File: {fileName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap shrink-0 self-end sm:self-auto">
          {fileUrl && (
            <FacultyFileActions
              url={fileUrl}
              fileName={fileName}
              category={label}
              label="Preview"
            />
          )}
          {!readOnly && (
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 border transition-colors shrink-0">
              <FileUp className="w-3.5 h-3.5" />
              {uploadingDoc === docKey ? 'Uploading...' : (fileUrl ? 'Replace' : 'Upload PDF')}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => {
                  if (e.target.files?.[0]) handleFileUpload(docKey, e.target.files[0]);
                }}
              />
            </label>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden transition-all">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">2. Educational Qualifications</CardTitle>
          </div>
          <CardDescription>
            Ph.D., Postgraduate, and Undergraduate credentials with verified degree awards.
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
                <Edit2 className="w-4 h-4" /> Edit Qualifications
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        
        {/* Highest Qualification Overview */}
        <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-primary/5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-primary uppercase tracking-wider">
              12. Highest Qualification
            </Label>
            <Input
              value={form.highestQualification}
              onChange={e => handleChange('highestQualification', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g. Ph.D. in Computer Science & Engineering"
              className="bg-background disabled:bg-muted/50 font-medium"
            />
          </div>
          <div>
            {renderDocUpload('highestQualDoc', 'Highest Qual. Certificate')}
          </div>
        </div>

        {/* Ph.D. Details */}
        <div className="space-y-4 border border-border/60 rounded-xl p-5 bg-card">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Doctoral Degree (Ph.D.)</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">13. PhD Holder:</span>
              {isEditing ? (
                <select
                  value={form.hasPhd ? 'YES' : 'NO'}
                  onChange={e => handleChange('hasPhd', e.target.value === 'YES')}
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs font-semibold"
                >
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              ) : (
                <Badge variant={form.hasPhd ? 'default' : 'secondary'} className="text-xs">
                  {form.hasPhd ? 'Yes' : 'No'}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                14. Ph.D. University / Institution
              </Label>
              <Input
                value={form.phdUniversity}
                onChange={e => handleChange('phdUniversity', e.target.value)}
                disabled={!isEditing || !form.hasPhd}
                placeholder="e.g. IIT Delhi / RGPV Bhopal"
                className="bg-background disabled:bg-muted/50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                15. Ph.D. Award Date
              </Label>
              <Input
                type="date"
                value={form.phdAwardDate}
                onChange={e => handleChange('phdAwardDate', e.target.value)}
                disabled={!isEditing || !form.hasPhd}
                className="bg-background disabled:bg-muted/50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div className="pt-1">
            {renderDocUpload('phdCertDoc', 'Ph.D. Degree / Notification')}
          </div>
        </div>

        {/* Post-Graduation (PG) */}
        <div className="space-y-4 border border-border/60 rounded-xl p-5 bg-card">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" /> Post-Graduation (PG) Details
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                16. PG Degree Detail
              </Label>
              <Input
                value={form.pgDetail}
                onChange={e => handleChange('pgDetail', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g. M.Tech / M.E. / MCA"
                className="bg-background disabled:bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                17. Specialization (PG)
              </Label>
              <Input
                value={form.pgSpecialization}
                onChange={e => handleChange('pgSpecialization', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g. Artificial Intelligence"
                className="bg-background disabled:bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                18. PG University / Institute
              </Label>
              <Input
                value={form.pgUniversity}
                onChange={e => handleChange('pgUniversity', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g. Rajiv Gandhi Proudyogiki Vishwavidyalaya"
                className="bg-background disabled:bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                19. Passing Year (PG)
              </Label>
              <Input
                type="number"
                value={form.pgYear}
                onChange={e => handleChange('pgYear', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g. 2018"
                className="bg-background disabled:bg-muted/50"
              />
            </div>
          </div>
          <div className="mt-2">
            {renderDocUpload('pgCertDoc', 'PG Degree Certificate')}
          </div>
        </div>

        {/* Under-Graduation (UG) */}
        <div className="space-y-4 border border-border/60 rounded-xl p-5 bg-card">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" /> Under-Graduation (UG) Details
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                20. UG Degree Detail
              </Label>
              <Input
                value={form.ugDetail}
                onChange={e => handleChange('ugDetail', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g. B.Tech / B.E. / BCA"
                className="bg-background disabled:bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                21. Specialization (UG)
              </Label>
              <Input
                value={form.ugSpecialization}
                onChange={e => handleChange('ugSpecialization', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g. Computer Science & Engg."
                className="bg-background disabled:bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                22. UG University / Institute
              </Label>
              <Input
                value={form.ugUniversity}
                onChange={e => handleChange('ugUniversity', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g. RGPV Bhopal"
                className="bg-background disabled:bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                23. Passing Year (UG)
              </Label>
              <Input
                type="number"
                value={form.ugYear}
                onChange={e => handleChange('ugYear', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g. 2014"
                className="bg-background disabled:bg-muted/50"
              />
            </div>
          </div>
          <div className="mt-2">
            {renderDocUpload('ugCertDoc', 'UG Degree Certificate')}
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
