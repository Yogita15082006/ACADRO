import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Edit, Save, BookOpen, GraduationCap, X, Plus, FileText, Upload, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { getAssetUrl } from '@/lib/utils';

interface AcademicRecordProps {
  data: any;
  readOnly: boolean;
  onUpdate: (data: any) => any;
}

export const AcademicRecord: React.FC<AcademicRecordProps> = ({ data, readOnly, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [uploadingSem, setUploadingSem] = useState<number | null>(null);
  
  const handleMarksheetUpload = async (sem: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      try {
        setUploadingSem(sem);
        const response = await api.post(`/v1/profile/marksheet/${sem}`, formDataUpload);
        
        if (response.data.success) {
          const newUrl = response.data.data.url;
          setFormData(prev => ({
            ...prev,
            sgpa: {
              ...prev.sgpa,
              [`marksheetUrlSem${sem}`]: newUrl
            }
          }));
          toast.success(`Semester ${sem} marksheet uploaded successfully`);
        }
      } catch (error) {
        console.error('Failed to upload marksheet:', error);
        toast.error('Failed to upload marksheet');
      } finally {
        setUploadingSem(null);
        // Reset the input value so the same file can be uploaded again if needed
        e.target.value = '';
      }
    }
  };
  
  const [formData, setFormData] = useState({
    year: data.year || '',
    semester: data.semester || '',
    batch: data.batch || '',
    course: data.course || '',
    section: data.section || (data.className !== 'Unassigned' ? data.className : '') || '',
    cgpa: data.cgpa || '',
    activeBacklogs: data.activeBacklogs || 0,
    historyBacklogs: data.historyBacklogs || 0,
    studyGap: data.studyGap || 0,
    batchCoordinator: data.batchCoordinator || '',
    sgpa: {
      sem1: data.sgpa?.sem1 || '',
      sem2: data.sgpa?.sem2 || '',
      sem3: data.sgpa?.sem3 || '',
      sem4: data.sgpa?.sem4 || '',
      sem5: data.sgpa?.sem5 || '',
      sem6: data.sgpa?.sem6 || '',
      sem7: data.sgpa?.sem7 || '',
      sem8: data.sgpa?.sem8 || '',
      marksheetUrlSem1: data.sgpa?.marksheetUrlSem1 || '',
      marksheetUrlSem2: data.sgpa?.marksheetUrlSem2 || '',
      marksheetUrlSem3: data.sgpa?.marksheetUrlSem3 || '',
      marksheetUrlSem4: data.sgpa?.marksheetUrlSem4 || '',
      marksheetUrlSem5: data.sgpa?.marksheetUrlSem5 || '',
      marksheetUrlSem6: data.sgpa?.marksheetUrlSem6 || '',
      marksheetUrlSem7: data.sgpa?.marksheetUrlSem7 || '',
      marksheetUrlSem8: data.sgpa?.marksheetUrlSem8 || '',
    },
    subjects: data.subjects || [],
    tenthSchoolName: data.tenthSchoolName || '',
    tenthBoard: data.tenthBoard || '',
    tenthPercentage: data.tenthPercentage || '',
    tenthYear: data.tenthYear || '',
    twelfthSchoolName: data.twelfthSchoolName || '',
    twelfthBoard: data.twelfthBoard || '',
    twelfthPercentage: data.twelfthPercentage || '',
    twelfthYear: data.twelfthYear || '',
  });

  useEffect(() => {
    setFormData({
      year: data.year || '',
      semester: data.semester || '',
      batch: data.batch || '',
      course: data.course || '',
      section: data.section || (data.className !== 'Unassigned' ? data.className : '') || '',
      cgpa: data.cgpa || '',
      activeBacklogs: data.activeBacklogs || 0,
      historyBacklogs: data.historyBacklogs || 0,
      studyGap: data.studyGap || 0,
      batchCoordinator: data.batchCoordinator || '',
      sgpa: {
        sem1: data.sgpa?.sem1 || '',
        sem2: data.sgpa?.sem2 || '',
        sem3: data.sgpa?.sem3 || '',
        sem4: data.sgpa?.sem4 || '',
        sem5: data.sgpa?.sem5 || '',
        sem6: data.sgpa?.sem6 || '',
        sem7: data.sgpa?.sem7 || '',
        sem8: data.sgpa?.sem8 || '',
        marksheetUrlSem1: data.sgpa?.marksheetUrlSem1 || '',
        marksheetUrlSem2: data.sgpa?.marksheetUrlSem2 || '',
        marksheetUrlSem3: data.sgpa?.marksheetUrlSem3 || '',
        marksheetUrlSem4: data.sgpa?.marksheetUrlSem4 || '',
        marksheetUrlSem5: data.sgpa?.marksheetUrlSem5 || '',
        marksheetUrlSem6: data.sgpa?.marksheetUrlSem6 || '',
        marksheetUrlSem7: data.sgpa?.marksheetUrlSem7 || '',
        marksheetUrlSem8: data.sgpa?.marksheetUrlSem8 || '',
      },
      subjects: data.subjects || [],
      tenthSchoolName: data.tenthSchoolName || '',
      tenthBoard: data.tenthBoard || '',
      tenthPercentage: data.tenthPercentage || '',
      tenthYear: data.tenthYear || '',
      twelfthSchoolName: data.twelfthSchoolName || '',
      twelfthBoard: data.twelfthBoard || '',
      twelfthPercentage: data.twelfthPercentage || '',
      twelfthYear: data.twelfthYear || '',
    });
  }, [data]);

  const handleSave = async () => {
    const success = await onUpdate(formData);
    if (success !== false) {
      setIsEditing(false);
    }
  };

  const handleAddSubject = () => {
    if (newSubject.trim() && !formData.subjects.includes(newSubject.trim())) {
      setFormData({ ...formData, subjects: [...formData.subjects, newSubject.trim()] });
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (sub: string) => {
    setFormData({ ...formData, subjects: formData.subjects.filter((s: string) => s !== sub) });
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" /> Academic Record
          </CardTitle>
          <CardDescription>Comprehensive view of academic performance and history.</CardDescription>
        </div>
        {!readOnly && (
          <Button 
            variant={isEditing ? 'default' : 'outline'}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="gap-2"
          >
            {isEditing ? (
              <><Save className="w-4 h-4" /> Save</>
            ) : (
              <><Edit className="w-4 h-4" /> Edit</>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isEditing ? (
          <div className="p-6 space-y-8">
            {/* Previous Education */}
            <div className="space-y-4">
               <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Previous Education</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-muted-foreground">10th School Name</label>
                   <Input value={formData.tenthSchoolName} onChange={(e) => setFormData({ ...formData, tenthSchoolName: e.target.value })} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-muted-foreground">10th Board</label>
                   <Input value={formData.tenthBoard} onChange={(e) => setFormData({ ...formData, tenthBoard: e.target.value })} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-muted-foreground">10th Percentage/CGPA</label>
                   <Input value={formData.tenthPercentage} onChange={(e) => setFormData({ ...formData, tenthPercentage: e.target.value })} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-muted-foreground">10th Passing Year</label>
                   <Input value={formData.tenthYear} onChange={(e) => setFormData({ ...formData, tenthYear: e.target.value })} />
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-muted-foreground">12th/Diploma School Name</label>
                   <Input value={formData.twelfthSchoolName} onChange={(e) => setFormData({ ...formData, twelfthSchoolName: e.target.value })} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-muted-foreground">12th/Diploma Board</label>
                   <Input value={formData.twelfthBoard} onChange={(e) => setFormData({ ...formData, twelfthBoard: e.target.value })} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-muted-foreground">12th Percentage</label>
                   <Input value={formData.twelfthPercentage} onChange={(e) => setFormData({ ...formData, twelfthPercentage: e.target.value })} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-muted-foreground">12th Passing Year</label>
                   <Input value={formData.twelfthYear} onChange={(e) => setFormData({ ...formData, twelfthYear: e.target.value })} />
                 </div>
               </div>
            </div>

            <hr className="border-border/40" />

            {/* Current Enrollment */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Current Enrollment</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Academic Year</label>
                  <select 
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Semester</label>
                  <select 
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">Select Semester</option>
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Batch</label>
                  <Input value={formData.batch} onChange={(e) => setFormData({...formData, batch: e.target.value})} placeholder="e.g. 2021-2025" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">CGPA</label>
                  <Input type="number" step="0.01" max="10" value={formData.cgpa} onChange={(e) => setFormData({...formData, cgpa: e.target.value})} placeholder="e.g. 8.5" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Active Backlogs</label>
                  <Input type="number" min="0" value={formData.activeBacklogs} onChange={(e) => setFormData({...formData, activeBacklogs: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">History Backlogs</label>
                  <Input type="number" min="0" value={formData.historyBacklogs} onChange={(e) => setFormData({...formData, historyBacklogs: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Study Gap (Years)</label>
                  <Input type="number" min="0" value={formData.studyGap} onChange={(e) => setFormData({...formData, studyGap: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Batch Coordinator</label>
                  <Input value={formData.batchCoordinator} onChange={(e) => setFormData({...formData, batchCoordinator: e.target.value})} placeholder="Coordinator Name" />
                </div>
              </div>
            </div>

            <hr className="border-border/40" />

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> SGPA per Semester
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                  const marksheetUrl = formData.sgpa[`marksheetUrlSem${sem}` as keyof typeof formData.sgpa];
                  
                  return (
                    <div key={sem} className="flex flex-col border border-border/60 rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                      <div className="bg-muted/30 px-4 py-2 border-b border-border/40 flex justify-between items-center">
                        <h5 className="text-sm font-semibold text-foreground tracking-tight">Semester {sem}</h5>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SGPA</label>
                          <Input 
                            type="number" 
                            step="0.01" 
                            max="10"
                            placeholder="Enter SGPA"
                            className="h-9 font-medium"
                            value={formData.sgpa[`sem${sem}` as keyof typeof formData.sgpa]}
                            onChange={(e) => setFormData({
                              ...formData, 
                              sgpa: { ...formData.sgpa, [`sem${sem}`]: e.target.value }
                            })}
                          />
                        </div>

                        <div className="space-y-1.5 pt-3 border-t border-border/40">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Marksheet</label>
                          
                          {marksheetUrl ? (
                            <div className="flex items-center gap-2 w-full">
                              <a 
                                href={getAssetUrl(marksheetUrl as string)} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex-1 flex items-center justify-center gap-1.5 h-8 px-2 text-xs font-medium border border-primary/20 bg-primary/5 text-primary rounded-md hover:bg-primary/10 transition-colors truncate"
                                title="View uploaded marksheet"
                              >
                                <Eye className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">View</span>
                              </a>
                              <div className="relative flex-1">
                                <input
                                  type="file"
                                  id={`marksheet-upload-sem${sem}`}
                                  className="hidden"
                                  accept=".pdf,image/*"
                                  onChange={(e) => handleMarksheetUpload(sem, e)}
                                  disabled={uploadingSem === sem}
                                />
                                <label 
                                  htmlFor={`marksheet-upload-sem${sem}`}
                                  className={`flex items-center justify-center h-8 gap-1.5 px-2 text-xs font-medium border rounded-md cursor-pointer transition-colors truncate ${
                                    uploadingSem === sem 
                                      ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground' 
                                      : 'bg-muted/50 text-muted-foreground hover:bg-muted border-border/60'
                                  }`}
                                  title="Replace existing marksheet"
                                >
                                  {uploadingSem === sem ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Upload className="w-3.5 h-3.5 shrink-0" />}
                                  <span className="truncate">{uploadingSem === sem ? '...' : 'Replace'}</span>
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div className="relative w-full">
                              <input
                                type="file"
                                id={`marksheet-upload-sem${sem}`}
                                className="hidden"
                                accept=".pdf,image/*"
                                onChange={(e) => handleMarksheetUpload(sem, e)}
                                disabled={uploadingSem === sem}
                              />
                              <label 
                                htmlFor={`marksheet-upload-sem${sem}`}
                                className={`flex items-center justify-center w-full h-8 gap-1.5 px-3 text-xs font-medium border rounded-md cursor-pointer transition-colors truncate ${
                                  uploadingSem === sem 
                                    ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground' 
                                    : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
                                }`}
                              >
                                {uploadingSem === sem ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Upload className="w-3.5 h-3.5 shrink-0" />}
                                <span className="truncate">{uploadingSem === sem ? 'Uploading...' : 'Upload Marksheet'}</span>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/40">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Current Subjects
              </h4>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add new subject" 
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubject())}
                />
                <Button type="button" onClick={handleAddSubject}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.subjects.map((sub: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="bg-background px-3 py-1.5 text-sm font-medium border-border/60 flex items-center gap-2">
                    {sub}
                    <button type="button" onClick={() => handleRemoveSubject(sub)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Previous Education Read-Only */}
            <div className="p-6 border-b border-border/40">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Previous Education</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-muted/20 p-4 rounded-xl border border-border/50 min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1 truncate">10th Standard</p>
                  <p className="text-sm font-medium truncate" title={`School: ${formData.tenthSchoolName || 'N/A'}`}>School: {formData.tenthSchoolName || 'N/A'}</p>
                  <p className="text-sm font-medium truncate" title={`Board: ${formData.tenthBoard || 'N/A'}`}>Board: {formData.tenthBoard || 'N/A'}</p>
                  <p className="text-sm font-medium truncate" title={`Percentage/CGPA: ${formData.tenthPercentage || 'N/A'}`}>Percentage/CGPA: {formData.tenthPercentage || 'N/A'}</p>
                  <p className="text-sm font-medium truncate" title={`Passing Year: ${formData.tenthYear || 'N/A'}`}>Passing Year: {formData.tenthYear || 'N/A'}</p>
                </div>
                <div className="bg-muted/20 p-4 rounded-xl border border-border/50 min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1 truncate">12th/Diploma Standard</p>
                  <p className="text-sm font-medium truncate" title={`School: ${formData.twelfthSchoolName || 'N/A'}`}>School: {formData.twelfthSchoolName || 'N/A'}</p>
                  <p className="text-sm font-medium truncate" title={`Board: ${formData.twelfthBoard || 'N/A'}`}>Board: {formData.twelfthBoard || 'N/A'}</p>
                  <p className="text-sm font-medium truncate" title={`Percentage: ${formData.twelfthPercentage || 'N/A'}`}>Percentage: {formData.twelfthPercentage || 'N/A'}</p>
                  <p className="text-sm font-medium truncate" title={`Passing Year: ${formData.twelfthYear || 'N/A'}`}>Passing Year: {formData.twelfthYear || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Current Stats Read-Only */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-border/40 bg-muted/10">
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate" title="Class / Course">Class / Course</p>
                <p className="text-lg font-semibold text-foreground truncate" title={formData.course}>{formData.course || 'N/A'}</p>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate" title="Section">Section</p>
                <p className="text-lg font-semibold text-foreground truncate" title={formData.section}>{formData.section || 'N/A'}</p>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">Academic Year</p>
                <p className="text-lg font-semibold text-foreground truncate" title={formData.year}>{formData.year || 'N/A'}</p>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">Semester</p>
                <p className="text-lg font-semibold text-foreground truncate" title={formData.semester}>{formData.semester || 'N/A'}</p>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">Batch</p>
                <p className="text-lg font-semibold text-foreground truncate" title={formData.batch}>{formData.batch || 'N/A'}</p>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">CGPA</p>
                <p className="text-lg font-bold text-primary truncate">{formData.cgpa ? Number(formData.cgpa).toFixed(2) : 'N/A'}</p>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate" title="Active Backlogs">Active Backlogs</p>
                <p className={`text-lg font-semibold truncate ${formData.activeBacklogs > 0 ? 'text-destructive' : 'text-green-600'}`}>{formData.activeBacklogs || 0}</p>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate" title="History Backlogs">History Backlogs</p>
                <p className={`text-lg font-semibold text-foreground truncate`}>{formData.historyBacklogs || 0}</p>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">Study Gap</p>
                <p className={`text-lg font-semibold truncate ${formData.studyGap > 0 ? 'text-orange-500' : 'text-foreground'}`}>{formData.studyGap || 0} Year(s)</p>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate" title="Batch Coordinator">Batch Coordinator</p>
                <p className="text-lg font-semibold text-foreground truncate" title={formData.batchCoordinator}>{formData.batchCoordinator || 'N/A'}</p>
              </div>
            </div>

            {/* SGPA Section Read-Only */}
            <div className="p-6 border-b border-border/40">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Semester Performance (SGPA)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                  const sgpaValue = formData.sgpa ? formData.sgpa[`sem${sem}` as keyof typeof formData.sgpa] : undefined;
                  const marksheetUrl = formData.sgpa ? formData.sgpa[`marksheetUrlSem${sem}` as keyof typeof formData.sgpa] : undefined;
                  
                  return (
                    <div key={sem} className="flex flex-col border border-border/50 rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                      <div className="bg-muted/20 px-4 py-2.5 border-b border-border/40 flex justify-between items-center">
                        <h5 className="text-sm font-semibold text-foreground tracking-tight">Semester {sem}</h5>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SGPA</p>
                          <p className={`text-xl font-bold ${sgpaValue ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                            {sgpaValue ? Number(sgpaValue).toFixed(2) : '—'}
                          </p>
                        </div>
                        
                        <div className="pt-3 border-t border-border/40">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Marksheet</p>
                          {marksheetUrl ? (
                            <a 
                              href={getAssetUrl(marksheetUrl as string)} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium border border-primary/20 bg-primary/5 text-primary rounded-md hover:bg-primary/10 transition-colors w-full truncate"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">View Marksheet</span>
                            </a>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium border border-dashed border-border/60 bg-muted/20 text-muted-foreground/60 rounded-md w-full">
                              <span className="truncate">Not Uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Subjects Read-Only */}
            {formData.subjects && formData.subjects.length > 0 && (
              <div className="p-6">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Current Enrolled Subjects
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formData.subjects.map((sub: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1 bg-muted/50 text-foreground font-medium">
                      {sub}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
