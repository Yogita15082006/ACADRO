import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Upload } from 'lucide-react';
import api from '../../services/api';

interface AcademicResourceDialogProps {
  open: boolean;
  type: 'scheme' | 'syllabus' | 'timetable';
  onClose: () => void;
  onUpload: (type: string, data: any, file: File) => void;
  allowedClasses?: string[];
  allowedDepartments?: string[];
}

export const AcademicResourceDialog: React.FC<AcademicResourceDialogProps> = ({
  open,
  type,
  onClose,
  onUpload,
  allowedClasses,
  allowedDepartments
}) => {
  const [data, setData] = useState({ department: '', degree: '', batch: '', year: '', semester: '', className: '', remarks: '' });
  const [file, setFile] = useState<File | null>(null);

  const [departments, setDepartments] = useState<string[]>([]);
  const [degrees, setDegrees] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setData({ department: '', degree: '', batch: '', year: '', semester: '', className: '', remarks: '' });
      setFile(null);
      api.get('/v1/metadata/departments').then(res => {
        let fetched: string[] = res.data.data || [];
        if (allowedDepartments && allowedDepartments.length > 0) {
          fetched = fetched.filter(d => allowedDepartments.includes(d));
        }
        setDepartments(fetched);
      }).catch(err => console.error("Failed to fetch departments", err));

      api.get('/v1/metadata/degrees').then(res => setDegrees(res.data.data || [])).catch(err => console.error("Failed to fetch degrees", err));
      api.get('/v1/metadata/batches').then(res => setBatches(res.data.data || [])).catch(err => console.error("Failed to fetch batches", err));
    }
  }, [open, allowedDepartments]);

  useEffect(() => {
    if (data.batch) {
      api.get(`/v1/metadata/academic-years?batch=${data.batch}`).then(res => setYears(res.data.data || [])).catch(() => setYears([]));
    } else { setYears([]); setSemesters([]); setClasses([]); }
  }, [data.batch]);

  useEffect(() => {
    if (data.year) {
      api.get(`/v1/metadata/semesters?year=${data.year}`).then(res => setSemesters(res.data.data || [])).catch(() => setSemesters([]));
    } else { setSemesters([]); setClasses([]); }
  }, [data.year]);

  useEffect(() => {
    if (data.batch && data.semester) {
      api.get(`/v1/metadata/classes?batch=${data.batch}&semester=${data.semester}`).then(res => {
        let fetched: string[] = res.data.data || [];
        if (allowedClasses && allowedClasses.length > 0) {
          fetched = fetched.filter(c => allowedClasses.includes(c));
        }
        setClasses(fetched);
      }).catch(() => setClasses([]));
    } else { setClasses([]); }
  }, [data.batch, data.semester, allowedClasses]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Upload size={18} className="text-primary" /> Upload {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
          <DialogDescription>Upload the official document. AI will automatically extract the structure if applicable.</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Department</label>
            <select value={data.department} onChange={e => setData({...data, department: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">Select</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Degree Program</label>
            <select value={data.degree} onChange={e => setData({...data, degree: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">Select</option>
              {degrees.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Batch</label>
            <select value={data.batch} onChange={e => setData({...data, batch: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">Select</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Year</label>
            <select value={data.year} onChange={e => setData({...data, year: e.target.value})} disabled={!data.batch} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm disabled:opacity-50">
              <option value="">Select</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Semester</label>
            <select value={data.semester} onChange={e => setData({...data, semester: e.target.value})} disabled={!data.year} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm disabled:opacity-50">
              <option value="">Select</option>
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Class</label>
            <select value={data.className} onChange={e => setData({...data, className: e.target.value})} disabled={!data.semester} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm disabled:opacity-50">
              <option value="">Select</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div className="col-span-2">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">{type === 'syllabus' ? 'Syllabus PDF' : (type === 'timetable' ? 'Timetable Document (PDF/Image)' : 'Scheme PDF')}</label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/20 flex flex-col items-center justify-center relative cursor-pointer hover:bg-muted/40 transition-colors">
              <Upload size={24} className="text-muted-foreground mb-2" />
              <p className="text-sm font-medium">{file ? file.name : "Drag & drop or click to browse"}</p>
              <input type="file" accept={type === 'timetable' ? ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg,image/jpg" : ".pdf"} className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setFile(e.target.files[0])} />
            </div>
          </div>
          
          <div className="col-span-2">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Remarks</label>
            <Input placeholder="Optional remarks..." value={data.remarks} onChange={e => setData({...data, remarks: e.target.value})} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!file} onClick={() => onUpload(type, data, file!)}>{type === 'syllabus' ? 'Confirm Upload' : 'Upload & Extract AI'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default AcademicResourceDialog;
