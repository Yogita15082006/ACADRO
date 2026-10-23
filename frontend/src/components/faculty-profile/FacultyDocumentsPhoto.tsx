import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Camera, FileUp, ExternalLink, Trash2, CheckCircle2, FileText, FileCheck, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { facultyProfileService } from '../../services/facultyProfileService';
import { getAssetUrl } from '@/lib/utils';
import { FacultyFileActions } from './FacultyFileActions';

interface FacultyDocumentsPhotoProps {
  data: any;
  photoUrl?: string;
  readOnly: boolean;
  onSaveProfile: (updated: any) => Promise<boolean>;
}

export const FacultyDocumentsPhoto: React.FC<FacultyDocumentsPhotoProps> = ({
  data,
  photoUrl,
  readOnly,
  onSaveProfile
}) => {
  const [photo, setPhoto] = useState(photoUrl || data.profilePictureUrl || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documents = data.documents || {};

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile photo must be less than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }

    setUploadingPhoto(true);
    try {
      const url = await facultyProfileService.uploadPhoto(file);
      setPhoto(url);
      await onSaveProfile({ profilePictureUrl: url });
      toast.success('Profile photo updated successfully!');
      window.dispatchEvent(new Event('sync-auth-profile'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    try {
      setPhoto('');
      await onSaveProfile({ profilePictureUrl: '' });
      toast.success('Profile photo removed');
      window.dispatchEvent(new Event('sync-auth-profile'));
    } catch (e: any) {
      toast.error('Failed to remove photo');
    }
  };

  const handleGenericDocUpload = async (docKey: string, file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    setUploadingDocKey(docKey);
    try {
      const url = await facultyProfileService.uploadDocument(file);
      const updatedDocs = {
        ...documents,
        [docKey]: {
          url,
          fileName: file.name,
          uploadedAt: new Date().toISOString()
        }
      };
      await onSaveProfile({ documents: updatedDocs });
      toast.success(`${file.name} uploaded successfully!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDocKey(null);
    }
  };

  const standardDocuments = [
    { key: 'highestQualDoc', title: 'Highest Qualification Certificate', desc: 'Ph.D. or Master’s degree certificate' },
    { key: 'phdCertDoc', title: 'Ph.D. Degree / Award Notification', desc: 'Doctoral award order from university' },
    { key: 'pgCertDoc', title: 'Post-Graduation Degree Certificate', desc: 'M.Tech / M.E. / MCA degree' },
    { key: 'ugCertDoc', title: 'Under-Graduation Degree Certificate', desc: 'B.Tech / B.E. / B.Sc. certificate' },
    { key: 'expCertDoc', title: 'Experience & Service Certificate', desc: 'Cumulative teaching and industrial experience letters' },
    { key: 'promotionOrderDoc', title: 'Latest Cadre Promotion Order', desc: 'Office order for current faculty designation' },
    { key: 'appointmentDoc', title: 'Appointment & Retention Document', desc: 'Institutional appointment and retention order' },
    { key: 'publicationEvidenceDoc', title: 'Publication / Patent Evidence', desc: 'Front page or acceptance letter of key research' }
  ];

  const displayAvatar = photo ? getAssetUrl(photo) : 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName || data.name || 'Faculty')}&background=4F46E5&color=fff&size=128`;

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden transition-all">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">9. Supporting Documents & Profile Photo</CardTitle>
          </div>
          <CardDescription>
            Official passport photograph and centralized repository of verified institutional certificates.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        
        {/* Profile Photo Section */}
        <div className="p-5 rounded-2xl border border-border bg-card flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group shrink-0">
            <img
              src={displayAvatar}
              alt="Faculty Avatar"
              className="w-28 h-28 rounded-full object-cover border-4 border-background shadow-md group-hover:opacity-90 transition-opacity"
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 bg-black/40 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-semibold">Change</span>
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              className="hidden"
              accept="image/*"
            />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <h4 className="text-base font-bold text-foreground">Faculty Profile Photograph</h4>
            <p className="text-xs text-muted-foreground max-w-md">
              Used across the faculty directory, departmental rosters, committee announcements, and course timetables. Supported formats: PNG, JPG, WEBP.
            </p>
            {!readOnly && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  <Camera className="w-3.5 h-3.5" />
                  {uploadingPhoto ? 'Uploading Photo...' : (photo ? 'Replace Photo' : 'Upload Photo')}
                </Button>
                {photo && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-xs h-8 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                    onClick={handleRemovePhoto}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Centralized Document Uploads Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Verified Supporting Documents & Evidence
            </h4>
            <span className="text-xs text-muted-foreground">PDF or Scanned Certificates (&lt;10MB)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {standardDocuments.map(doc => {
              const rawDoc = documents[doc.key];
              const docInfo = typeof rawDoc === 'string'
                ? { url: rawDoc, fileName: `${doc.title}.pdf` }
                : (rawDoc || null);
              const fileUrl = docInfo?.url;
              const fileName = docInfo?.fileName || `${doc.title}.pdf`;
              const isUploading = uploadingDocKey === doc.key;
              return (
                <div
                  key={doc.key}
                  className="p-4 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-colors flex flex-col justify-between gap-3 min-w-0 overflow-hidden shadow-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground flex items-center gap-1.5 truncate">
                        <FileCheck className="w-4 h-4 text-primary shrink-0" /> <span className="truncate">{doc.title}</span>
                      </span>
                      {fileUrl ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] shrink-0">
                          Attached
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{doc.desc}</p>
                    {fileUrl && (
                      <p className="text-[11px] text-primary font-medium truncate mt-1 font-mono">
                        File: {fileName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40 flex-wrap">
                    {fileUrl && (
                      <FacultyFileActions
                        url={fileUrl}
                        fileName={fileName}
                        category={doc.title}
                        label="Preview Document"
                      />
                    )}
                    {!readOnly && (
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 border transition-colors shrink-0">
                        <FileUp className="w-3.5 h-3.5" />
                        {isUploading ? 'Uploading...' : (fileUrl ? 'Replace' : 'Upload PDF')}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={e => {
                            if (e.target.files?.[0]) handleGenericDocUpload(doc.key, e.target.files[0]);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
