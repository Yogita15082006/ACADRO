import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Wand2, Loader2, 
  Upload, Image as ImageIcon, X, Plus, Trash2,
  CheckCircle, Settings, ClipboardList, QrCode, CheckSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { eventService } from '../../services/eventService';
import { toast } from 'react-hot-toast';

// --- Interfaces ---
interface SpecificAssignment {
  id: string;
  batch: string;
  year: string;
  semester: string;
  classSection: string;
  classId: string; // The UUID of the selected class
}

interface CustomField {
  label: string;
  type: string;
  required: boolean;
}

// --- Specific Assignment Row Component ---
const SpecificAssignmentRow = ({ 
  assignment, 
  onChange, 
  onRemove,
  allBatches
}: { 
  assignment: SpecificAssignment, 
  onChange: (id: string, updated: SpecificAssignment) => void, 
  onRemove: (id: string) => void,
  allBatches: string[]
}) => {
  const [years, setYears] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [classes, setClasses] = useState<{id: string, name: string, section?: string}[]>([]);
  
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingSems, setLoadingSems] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    if (assignment.batch) {
      setLoadingYears(true);
      eventService.getAvailableYears(assignment.batch).then(res => {
        if (res.success) setYears(res.data);
      }).catch(() => toast.error("Failed to load years")).finally(() => setLoadingYears(false));
    }
  }, [assignment.batch]);

  useEffect(() => {
    if (assignment.batch && assignment.year) {
      setLoadingSems(true);
      eventService.getAvailableSemesters(assignment.batch, assignment.year).then(res => {
        if (res.success) setSemesters(res.data);
      }).catch(() => toast.error("Failed to load semesters")).finally(() => setLoadingSems(false));
    }
  }, [assignment.batch, assignment.year]);

  useEffect(() => {
    if (assignment.batch && assignment.year && assignment.semester) {
      setLoadingClasses(true);
      eventService.getAvailableClasses(assignment.batch, assignment.year, assignment.semester).then(res => {
        if (res.success) setClasses(res.data.map((c: any) => ({ id: c.id, name: c.name || c.className, section: c.section })));
      }).catch(() => toast.error("Failed to load classes")).finally(() => setLoadingClasses(false));
    }
  }, [assignment.batch, assignment.year, assignment.semester]);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-end bg-accent/20 p-4 rounded-2xl border border-border">
      <div className="flex-1 space-y-2 w-full">
        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Batch</label>
        <select 
          value={assignment.batch}
          onChange={(e) => onChange(assignment.id, { ...assignment, batch: e.target.value, year: '', semester: '', classSection: '', classId: '' })}
          className="w-full p-3 border border-border rounded-xl bg-background text-sm"
        >
          <option value="">Select Batch</option>
          {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      
      <div className="flex-1 space-y-2 w-full">
        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
          {loadingYears ? 'Loading...' : 'Year'}
        </label>
        <select 
          value={assignment.year}
          onChange={(e) => onChange(assignment.id, { ...assignment, year: e.target.value, semester: '', classSection: '', classId: '' })}
          disabled={!assignment.batch || loadingYears}
          className="w-full p-3 border border-border rounded-xl bg-background text-sm disabled:opacity-50"
        >
          <option value="">
            {!assignment.batch ? "Select Batch first" : 
              years.length === 0 && !loadingYears ? "No years found" : 
              "Select Year"}
          </option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="flex-1 space-y-2 w-full">
        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
          {loadingSems ? 'Loading...' : 'Semester'}
        </label>
        <select 
          value={assignment.semester}
          onChange={(e) => onChange(assignment.id, { ...assignment, semester: e.target.value, classSection: '', classId: '' })}
          disabled={!assignment.year || loadingSems}
          className="w-full p-3 border border-border rounded-xl bg-background text-sm disabled:opacity-50"
        >
          <option value="">
            {!assignment.year ? "Select Year first" : 
              semesters.length === 0 && !loadingSems ? "No semesters found" : 
              "Select Semester"}
          </option>
          {semesters.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex-1 space-y-2 w-full">
        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
          {loadingClasses ? 'Loading...' : 'Class / Section'}
        </label>
        <select 
          value={assignment.classId}
          onChange={(e) => {
            const selectedValue = e.target.value;
            // Find first class that matches any of the IDs to get the label
            const firstId = selectedValue.split(',')[0];
            const cls = classes.find(c => c.id === firstId);
            let displayLabel = '';
            if (cls) {
              displayLabel = cls.section || cls.name;
            }
            onChange(assignment.id, { ...assignment, classId: selectedValue, classSection: displayLabel });
          }}
          disabled={!assignment.semester || loadingClasses}
          className="w-full p-3 border border-border rounded-xl bg-background text-sm disabled:opacity-50"
        >
          <option value="">{assignment.semester ? "Select Class" : "Select Semester first"}</option>
          {(() => {
            const grouped = new Map<string, string[]>();
            classes.forEach(c => {
              let label = c.section || c.name;
              if (!grouped.has(label)) grouped.set(label, []);
              grouped.get(label)!.push(c.id);
            });
            return Array.from(grouped.entries()).map(([label, ids]) => (
              <option key={ids.join(',')} value={ids.join(',')}>{label}</option>
            ));
          })()}
        </select>
      </div>

      <Button variant="ghost" size="icon" onClick={() => onRemove(assignment.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl mb-1 shrink-0">
        <Trash2 size={18} />
      </Button>
    </div>
  );
};


// --- Main Component ---
export const CreateEventForm = ({ onCancel, onSave }: { onCancel: () => void, onSave: (event: any) => void }) => {
  
  // --- Form State ---
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [mode, setMode] = useState<'Offline' | 'Online' | 'Hybrid'>('Offline');
  const [venue, setVenue] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [rulesAndGuidelines, setRulesAndGuidelines] = useState('');

  const [specificAssignments, setSpecificAssignments] = useState<SpecificAssignment[]>([]);
  const [entireBatch, setEntireBatch] = useState('');
  
  const [isRegRequired, setIsRegRequired] = useState(false);
  const [regStartDate, setRegStartDate] = useState('');
  const [regEndDate, setRegEndDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [registrationFee, setRegistrationFee] = useState('');
  const [paymentQrFile, setPaymentQrFile] = useState<File | null>(null);
  const [allowWaitingList, setAllowWaitingList] = useState(false);
  const [registrationMethod, setRegistrationMethod] = useState<'Manually' | 'Via AI'>('Manually');
  const [registrationUrl, setRegistrationUrl] = useState('');
  
  const [isAttRequired, setIsAttRequired] = useState(false);
  const [includeInOverall, setIncludeInOverall] = useState<'Include in overall' | 'Exclude in overall'>('Exclude in overall');
  const [attHalf, setAttHalf] = useState<'First Half' | 'Second Half' | ''>('');
  const [attSelectedLectures, setAttSelectedLectures] = useState<string[]>([]);
  const [attUniqueCodeCount, setAttUniqueCodeCount] = useState<string>('60');
  const [attTimerHours, setAttTimerHours] = useState('00');
  const [attTimerMinutes, setAttTimerMinutes] = useState('10');
  const [attTimerSeconds, setAttTimerSeconds] = useState('00');

  // --- Modals & UI State ---
  const [allBatches, setAllBatches] = useState<string[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiCustomFields, setAiCustomFields] = useState<CustomField[]>([]);

  // --- Paste Event State ---
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isParsingPaste, setIsParsingPaste] = useState(false);

  const handlePasteConfirm = async () => {
    if (!pasteText.trim()) return;
    setIsParsingPaste(true);
    try {
      const res = await eventService.parseEventText(pasteText);
      if (res.success && res.data) {
        const d = res.data;
        if (d.title) setTitle(d.title);
        if (d.category) setCategory(d.category);
        if (d.description) setDescription(d.description);
        if (d.date) setDate(d.date);
        if (d.startTime) setStartTime(d.startTime);
        if (d.endTime) setEndTime(d.endTime);
        if (d.mode) setMode(d.mode as any);
        if (d.venue) setVenue(d.venue);
        if (d.locationLink) setMeetLink(d.locationLink);
        if (d.meetingLink) setMeetLink(d.meetingLink); // Prefer meetingLink over locationLink
        if (d.regStartDate) setRegStartDate(d.regStartDate);
        if (d.regEndDate) setRegEndDate(d.regEndDate);
        if (d.maxParticipants) setMaxParticipants(d.maxParticipants);
        if (d.regFee) setRegistrationFee(d.regFee);
        if (d.isRegRequired === 'Yes' || d.isRegRequired === 'True') setIsRegRequired(true);
        if (d.registrationMethod) setRegistrationMethod(d.registrationMethod as any);
        if (d.registrationExternalLink) setRegistrationUrl(d.registrationExternalLink);
        if (d.allowWaitingList !== undefined) setAllowWaitingList(d.allowWaitingList);
        if (d.rulesAndGuidelines) setRulesAndGuidelines(d.rulesAndGuidelines);
        
        toast.success("Event details imported successfully. Please review the information before publishing.");
        setShowPasteModal(false);
        setPasteText('');
      } else {
        toast.error("Could not find enough event information to fill the form.");
      }
    } catch (error) {
      toast.error("Error parsing event data.");
    } finally {
      setIsParsingPaste(false);
    }
  };
  
  const [showAttModal, setShowAttModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Init ---
  useEffect(() => {
    eventService.getAvailableBatches().then(res => {
      if (res.success) setAllBatches(res.data);
    }).catch(() => toast.error("Failed to load batches")).finally(() => setLoadingBatches(false));
  }, []);

  // --- Handlers ---
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerPreview(URL.createObjectURL(file));
      setBannerFile(file);
    }
  };

  const handleRemoveBanner = () => {
    setBannerPreview(null);
    setBannerFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addSpecificAssignment = () => {
    setSpecificAssignments([
      ...specificAssignments,
      { id: Date.now().toString(), batch: '', year: '', semester: '', classSection: '', classId: '' }
    ]);
  };

  const updateSpecificAssignment = (id: string, updated: SpecificAssignment) => {
    setSpecificAssignments(specificAssignments.map(a => a.id === id ? updated : a));
  };

  const removeSpecificAssignment = (id: string) => {
    setSpecificAssignments(specificAssignments.filter(a => a.id !== id));
  };

  const handleGenerateAiForm = async () => {
    if (!aiPrompt) return toast.error("Please enter a prompt describing the event");
    setIsGeneratingAi(true);
    try {
      const res = await eventService.generateAiForm(aiPrompt);
      if (res.success) {
        const fields = JSON.parse(res.data);
        setAiCustomFields(fields);
        toast.success("AI registration form generated!");
      } else {
        toast.error("Failed to generate form");
      }
    } catch (e) {
      toast.error("An error occurred during AI generation");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const toggleLecture = (lecture: string) => {
    if (attSelectedLectures.includes(lecture)) {
      setAttSelectedLectures(attSelectedLectures.filter(l => l !== lecture));
    } else {
      setAttSelectedLectures([...attSelectedLectures, lecture]);
    }
  };

  const validateForm = () => {
    if (!title) return "Event title is required.";
    if (!category) return "Event category is required.";
    if (!description) return "Event description is required.";
    if (!date) return "Please select an event date.";
    if (!startTime) return "Start time is required.";
    if (!endTime) return "End time is required.";
    if (startTime >= endTime) return "End time must be later than start time.";
    
    if (mode === 'Offline' || mode === 'Hybrid') {
      if (!venue) return "Venue / Room No. is required for offline/hybrid events.";
    }
    if (mode === 'Online' || mode === 'Hybrid') {
      if (!meetLink) return "Location / Meet Link is required for online/hybrid events.";
    }

    const hasSpecific = specificAssignments.some(a => a.classId);
    const hasEntire = !!entireBatch;
    if (!hasSpecific && !hasEntire) {
      return "Please select at least one target class or entire batch.";
    }

    if (isRegRequired) {
      if (!regStartDate) return "Registration Start Date is required.";
      if (!regEndDate) return "Registration End Date is required.";
      if (regEndDate < regStartDate) return "Registration end date cannot be before registration start date.";
      if (registrationMethod === 'Manually' && !registrationUrl) return "Please enter a valid registration URL.";
    }

    if (isAttRequired) {
      if (!attHalf || attSelectedLectures.length === 0 || !attUniqueCodeCount || isNaN(parseInt(attUniqueCodeCount))) {
        return "Please configure attendance (Half, Lectures, and valid Unique Code Count) before saving.";
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    try {
      let posterFileId = undefined;
      if (bannerFile) {
        try {
          const uploadRes = await eventService.uploadBanner(bannerFile);
          if (uploadRes.success) {
            posterFileId = uploadRes.data;
          } else {
            toast.error("Failed to upload banner, proceeding without it");
          }
        } catch (e) {
          toast.error("Error uploading banner");
        }
      }

      // Map targets
      const targets: any[] = [];
      if (entireBatch) {
        targets.push({
          batchYear: entireBatch,
          isEntireBatch: true
        });
      }
      
      specificAssignments.forEach(a => {
        if (a.classId) {
          const classIds = a.classId.split(',');
          classIds.forEach(id => {
            targets.push({
              acroClassId: id,
              batchYear: a.batch,
              academicYear: a.year,
              semester: a.semester,
              isEntireBatch: false
            });
          });
        }
      });

      const totalTimerMinutes = (parseInt(attTimerHours) || 0) * 60 + (parseInt(attTimerMinutes) || 0) + (parseInt(attTimerSeconds) || 0) / 60;
      
      const attendanceSessions = isAttRequired ? [{
        halfType: attHalf,
        selectedLectures: attSelectedLectures.join(', '),
        timerDurationMinutes: Math.round(totalTimerMinutes),
        uniqueCodeCount: parseInt(attUniqueCodeCount) || null,
        isIncludedInOverall: includeInOverall === 'Include in overall'
      }] : [];

      let paymentQrFileId = undefined;
      if (paymentQrFile && registrationFee && parseFloat(registrationFee) > 0) {
        try {
          const qrUploadRes = await eventService.uploadBanner(paymentQrFile);
          if (qrUploadRes.success) {
            paymentQrFileId = qrUploadRes.data;
          } else {
            toast.error("Failed to upload Payment QR, proceeding without it");
          }
        } catch (e) {
          toast.error("Error uploading Payment QR");
        }
      }

      const payload = {
        title,
        category,
        description,
        rulesAndGuidelines,
        eventDate: new Date(date).toISOString(),
        startTime,
        endTime,
        mode,
        venue,
        locationLink: meetLink,
        
        registrationStart: isRegRequired && regStartDate ? new Date(regStartDate).toISOString() : undefined,
        registrationEnd: isRegRequired && regEndDate ? new Date(regEndDate).toISOString() : undefined,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        registrationFee: registrationFee ? parseFloat(registrationFee) : undefined,
        allowWaitingList,
        registrationMethod: isRegRequired ? registrationMethod : undefined,
        registrationExternalLink: registrationMethod === 'Manually' ? registrationUrl : undefined,
        aiRegistrationFormConfig: registrationMethod === 'Via AI' && aiCustomFields.length > 0 ? JSON.stringify(aiCustomFields) : undefined,

        isActive: true,
        includeInOverallAttendance: isAttRequired && includeInOverall === 'Include in overall',
        posterFileId,
        paymentQrFileId,
        targets,
        attendanceSessions
      };

      const res = await eventService.createEvent(payload);
      if (res.success) {
        toast.success("Event created successfully!");
        onSave(res.data);
      } else {
        toast.error(res.message || "Failed to create event");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onCancel} className="hover:bg-accent rounded-full"><ChevronRight className="rotate-180" /></Button>
        <div className="flex-1">
          <h2 className="text-4xl font-black text-foreground tracking-tight">Create Event</h2>
          <p className="text-base font-medium text-muted-foreground mt-1">Configure event details, schedule, registration, and attendance in one place.</p>
        </div>
        <Button onClick={() => setShowPasteModal(true)} variant="outline" className="gap-2 font-bold border-2 shrink-0 shadow-sm">
          <ClipboardList size={18} /> Paste Event
        </Button>
      </div>

      {/* SINGLE MAIN CARD CONTAINER */}
      <div className="bg-card border border-border rounded-[2rem] shadow-xl overflow-hidden">
        
        {/* --- ADD BANNER --- */}
        <div className="p-8 pb-4">
          <h3 className="text-xl font-black mb-4">Add Banner</h3>
          {bannerPreview ? (
            <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-border group">
              <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <Button variant="outline" className="bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={18} className="mr-2" /> Replace
                </Button>
                <Button variant="destructive" onClick={handleRemoveBanner}>
                  <Trash2 size={18} className="mr-2" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors rounded-2xl flex flex-col items-center justify-center cursor-pointer text-muted-foreground"
            >
              <div className="bg-accent p-4 rounded-full mb-3 text-primary">
                <ImageIcon size={32} />
              </div>
              <p className="font-bold">Click or drag image to upload banner</p>
              <p className="text-sm">SVG, PNG, JPG or GIF (max. 5MB)</p>
            </div>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
        </div>

        <hr className="border-border mx-8 my-4" />

        {/* --- BASIC INFORMATION --- */}
        <div className="p-8 pt-4 pb-4 space-y-6">
          <h3 className="text-xl font-black text-primary">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Event Title <span className="text-rose-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 border border-border rounded-2xl bg-background font-bold text-lg focus:ring-4 focus:ring-primary/20 transition-all" placeholder="Enter event title" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Event Category <span className="text-rose-500">*</span></label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-4 border border-border rounded-2xl bg-background font-medium focus:ring-4 focus:ring-primary/20 transition-all">
                <option value="">Select Category</option>
                <option>Workshop</option><option>Seminar</option><option>Webinar</option>
                <option>Hackathon</option><option>Competition</option><option>Cultural</option>
                <option>Sports</option><option>Technical</option><option>Conference</option><option>Other</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Event Description <span className="text-rose-500">*</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-4 border border-border rounded-2xl bg-background h-32 font-medium focus:ring-4 focus:ring-primary/20 transition-all" placeholder="Enter event description..."></textarea>
            </div>
          </div>
        </div>

        <hr className="border-border mx-8 my-4" />

        {/* --- RULES & GUIDELINES --- */}
        <div className="p-8 pt-4 pb-4 space-y-6">
          <h3 className="text-xl font-black text-primary">Rules & Guidelines</h3>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Event Rules and Instructions for Participants</label>
            <textarea value={rulesAndGuidelines} onChange={e => setRulesAndGuidelines(e.target.value)} className="w-full p-4 border border-border rounded-2xl bg-background h-32 font-medium focus:ring-4 focus:ring-primary/20 transition-all" placeholder="Enter rules, guidelines, eligibility criteria..."></textarea>
          </div>
        </div>

        <hr className="border-border mx-8 my-4" />

        {/* --- SCHEDULE & LOCATION --- */}
        <div className="p-8 pt-4 pb-4 space-y-6">
          <h3 className="text-xl font-black text-primary">Schedule & Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Event Date <span className="text-rose-500">*</span></label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 border border-border rounded-xl bg-background font-bold focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Start Time <span className="text-rose-500">*</span></label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-3 border border-border rounded-xl bg-background font-medium focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">End Time <span className="text-rose-500">*</span></label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-3 border border-border rounded-xl bg-background font-medium focus:ring-2 focus:ring-primary/20" />
              {startTime && endTime && endTime <= startTime && (
                <p className="text-xs text-rose-500 font-bold ml-1 mt-1">End Time must be later than Start Time.</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Mode <span className="text-rose-500">*</span></label>
              <select value={mode} onChange={e => setMode(e.target.value as any)} className="w-full p-3 border border-border rounded-xl bg-background font-medium focus:ring-2 focus:ring-primary/20">
                <option value="Offline">Offline</option>
                <option value="Online">Online</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {(mode === 'Offline' || mode === 'Hybrid') && (
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Venue / Room No. <span className="text-rose-500">*</span></label>
                <input type="text" value={venue} onChange={e => setVenue(e.target.value)} className="w-full p-3 border border-border rounded-xl bg-background font-medium focus:ring-2 focus:ring-primary/20" placeholder="e.g. Main Auditorium" />
              </div>
            )}

            {(mode === 'Online' || mode === 'Hybrid') && (
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Location / Meet Link <span className="text-rose-500">*</span></label>
                <input type="url" value={meetLink} onChange={e => setMeetLink(e.target.value)} className="w-full p-3 border border-border rounded-xl bg-background font-medium focus:ring-2 focus:ring-primary/20" placeholder="https://meet.google.com/..." />
              </div>
            )}
          </div>
        </div>

        <hr className="border-border mx-8 my-4" />

        {/* --- CLASSES --- */}
        <div className="p-8 pt-4 pb-4 space-y-8">
          <h3 className="text-xl font-black text-primary">Classes</h3>
          
          {/* Specific Classes Subsection */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold border-b border-border pb-2">Specific Classes</h4>
            <div className="space-y-4">
              {specificAssignments.map((assignment) => (
                <SpecificAssignmentRow 
                  key={assignment.id} 
                  assignment={assignment} 
                  onChange={updateSpecificAssignment}
                  onRemove={removeSpecificAssignment}
                  allBatches={allBatches}
                />
              ))}
            </div>
            <Button variant="outline" onClick={addSpecificAssignment} className="gap-2 font-bold mt-2">
              <Plus size={18} /> Add Assignment
            </Button>
          </div>

          {/* Entire Batch Subsection */}
          <div className="space-y-4 pt-4">
            <h4 className="text-lg font-bold border-b border-border pb-2">Entire Batch</h4>
            <div className="p-6 border border-border rounded-2xl bg-accent/10">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2 block">
                {loadingBatches ? 'Loading...' : 'Select Batch'}
              </label>
              <select 
                value={entireBatch} 
                onChange={e => setEntireBatch(e.target.value)}
                disabled={loadingBatches}
                className="w-full max-w-sm p-4 border border-border rounded-xl bg-background font-bold text-lg"
              >
                <option value="">Select Batch</option>
                {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {entireBatch && (
                <p className="mt-3 text-sm font-bold text-primary flex items-center gap-2">
                  <CheckCircle size={16} /> This event will be available to all classes under the {entireBatch} batch.
                </p>
              )}
            </div>
          </div>
        </div>

        <hr className="border-border mx-8 my-4" />

        {/* --- REGISTRATION --- */}
        <div className="p-8 pt-4 pb-4 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-primary">Registration</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold">Enable Registration?</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isRegRequired} onChange={e => setIsRegRequired(e.target.checked)} />
                <div className="w-11 h-6 bg-accent peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <AnimatePresence>
            {isRegRequired && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-6 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Registration Start Date</label>
                    <input type="date" value={regStartDate} onChange={e => setRegStartDate(e.target.value)} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Registration End Date</label>
                    <input type="date" value={regEndDate} onChange={e => setRegEndDate(e.target.value)} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Maximum Participation</label>
                    <input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20" placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Registration Fee</label>
                    <input type="number" value={registrationFee} onChange={e => setRegistrationFee(e.target.value)} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20" placeholder="Optional" />
                  </div>
                </div>

                {parseFloat(registrationFee) > 0 && (
                  <div className="p-6 border border-border rounded-2xl bg-accent/10">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 ml-1 flex items-center gap-2"><QrCode size={16} className="text-primary"/> Upload Payment QR</h4>
                    {paymentQrFile ? (
                      <div className="relative group w-48 h-48 rounded-xl overflow-hidden border border-border bg-background inline-block">
                        <img src={URL.createObjectURL(paymentQrFile)} alt="QR Preview" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                           <label htmlFor="qr-upload-change" className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full cursor-pointer transition-colors"><Upload size={18}/></label>
                           <button onClick={() => setPaymentQrFile(null)} className="bg-rose-500/80 hover:bg-rose-500 text-white p-2 rounded-full transition-colors"><Trash2 size={18}/></button>
                        </div>
                        <input type="file" accept="image/*" className="hidden" id="qr-upload-change" onChange={e => {
                          if (e.target.files && e.target.files[0]) setPaymentQrFile(e.target.files[0]);
                        }} />
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-background cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => document.getElementById('qr-upload')?.click()}>
                        <QrCode size={32} className="text-muted-foreground mb-2" />
                        <p className="font-bold text-sm">Upload QR Code Image</p>
                        <p className="text-xs text-muted-foreground mt-1">Students scan this to pay</p>
                        <input type="file" accept="image/*" className="hidden" id="qr-upload" onChange={e => {
                          if (e.target.files && e.target.files[0]) setPaymentQrFile(e.target.files[0]);
                        }} />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="waitlist" checked={allowWaitingList} onChange={e => setAllowWaitingList(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <label htmlFor="waitlist" className="font-bold cursor-pointer">Allow Waiting List</label>
                </div>

                <div className="space-y-4 border border-border rounded-2xl p-6 bg-accent/10">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Registration Method</label>
                    <select value={registrationMethod} onChange={e => setRegistrationMethod(e.target.value as any)} className="w-full max-w-sm p-3 border border-border rounded-xl bg-background font-medium">
                      <option value="Manually">Manually</option>
                      <option value="Via AI">Via AI</option>
                    </select>
                  </div>

                  {registrationMethod === 'Manually' ? (
                    <div className="space-y-2 pt-2">
                      <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Registration URL</label>
                      <input type="url" value={registrationUrl} onChange={e => setRegistrationUrl(e.target.value)} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20" placeholder="Paste registration link (e.g. Google Forms)" />
                    </div>
                  ) : (
                    <div className="pt-2">
                      <Button onClick={() => setShowAiModal(true)} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl px-6 py-6 shadow-xl shadow-blue-500/20">
                        <Wand2 size={20} /> AI Form Configuration
                      </Button>
                      
                      {aiCustomFields.length > 0 && (
                        <div className="mt-6 p-6 bg-background rounded-2xl border border-border shadow-sm">
                          <h5 className="font-black mb-4 flex items-center gap-2 text-primary"><ClipboardList size={20} /> Registration Form Preview</h5>
                          <div className="space-y-4">
                            {aiCustomFields.map((f, i) => (
                              <div key={i} className="flex flex-col">
                                <label className="text-xs font-bold text-muted-foreground mb-1 ml-1">{f.label} {f.required && '*'}</label>
                                <input disabled className="w-full p-3 bg-accent/30 border border-border rounded-xl cursor-not-allowed" placeholder={f.type} />
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex gap-3">
                            <Button variant="outline" size="sm" onClick={() => setShowAiModal(true)}>Edit Fields</Button>
                            <span className="text-sm font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1.5 rounded-lg flex items-center gap-1"><CheckCircle size={14}/> Form Confirmed</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <hr className="border-border mx-8 my-4" />

        {/* --- ATTENDANCE --- */}
        <div className="p-8 pt-4 pb-8 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-primary">Attendance</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold">Enable Attendance?</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isAttRequired} onChange={e => setIsAttRequired(e.target.checked)} />
                <div className="w-11 h-6 bg-accent peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <AnimatePresence>
            {isAttRequired && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-6 overflow-hidden">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Attendance Inclusion</label>
                  <select value={includeInOverall} onChange={e => setIncludeInOverall(e.target.value as any)} className="w-full max-w-sm p-3 border border-border rounded-xl bg-background font-medium">
                    <option value="Exclude in overall">Exclude in overall</option>
                    <option value="Include in overall">Include in overall</option>
                  </select>
                </div>

                <div className="p-6 border border-border rounded-2xl bg-accent/10 flex flex-col items-start gap-4">
                  <p className="text-sm font-medium text-muted-foreground">Configure the attendance tracking parameters (Half, Lectures, Code, and Timer). The actual attendance session must be started from the Event View page.</p>
                  <Button onClick={() => setShowAttModal(true)} className="gap-2 font-bold px-6 py-6 rounded-xl shadow-md">
                    <Settings size={18} /> Configure Attendance Form
                  </Button>
                  
                  {attHalf && (
                    <div className="mt-2 text-sm font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2 rounded-xl flex items-center gap-2">
                      <CheckCircle size={16}/> Configuration Saved: {attHalf}, {attSelectedLectures.length} Lectures, Codes: {attUniqueCodeCount || 'unlimited'}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- SUBMIT BUTTON --- */}
        <div className="p-8 bg-accent/20 border-t border-border flex justify-end gap-4">
          <Button variant="outline" onClick={onCancel} className="px-6 py-6 text-lg rounded-xl font-bold border-2 hover:bg-accent/50">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="px-10 py-6 text-lg rounded-xl bg-primary text-white font-black hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all transform hover:scale-[1.02]">
            {isSubmitting ? (
              <><Loader2 className="animate-spin mr-2" size={24} /> Publishing...</>
            ) : (
              'Publish Event'
            )}
          </Button>
        </div>

      </div>

      {/* --- PASTE EVENT MODAL --- */}
      <AnimatePresence>
        {showPasteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-border flex flex-col"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-accent/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <ClipboardList size={20} />
                  </div>
                  <h2 className="text-2xl font-black">Paste Existing Event Details</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowPasteModal(false)} className="rounded-full hover:bg-accent">
                  <X size={20} />
                </Button>
              </div>
              
              <div className="p-6 flex-1 bg-background">
                <textarea 
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste event text, announcement text, copied event details or event link here..."
                  className="w-full h-64 p-4 border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                ></textarea>
              </div>

              <div className="p-6 border-t border-border bg-accent/10 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowPasteModal(false)} className="font-bold">Cancel</Button>
                <Button onClick={handlePasteConfirm} disabled={!pasteText.trim() || isParsingPaste} className="font-bold gap-2">
                  {isParsingPaste ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  Confirm & Fill Form
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- AI REGISTRATION MODAL --- */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-border flex justify-between items-center bg-accent/30">
                <h3 className="text-2xl font-black flex items-center gap-2"><Wand2 className="text-primary"/> AI Form Builder</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAiModal(false)} className="rounded-full"><X size={24}/></Button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8 flex-1">
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
                  <h4 className="font-bold text-lg mb-2 text-primary">Describe Event Registration</h4>
                  <p className="text-sm text-muted-foreground mb-4">The AI will automatically generate required fields based on your description (e.g., "Full Name, Enrollment, and a custom question about dietary restrictions").</p>
                  <div className="flex gap-3">
                    <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Enter instructions for AI..." className="flex-1 p-4 border border-border rounded-xl bg-background font-medium focus:ring-2 focus:ring-primary/20" />
                    <Button onClick={handleGenerateAiForm} disabled={isGeneratingAi} className="px-6 py-4 rounded-xl gap-2 font-bold shadow-md">
                      {isGeneratingAi ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />} Generate Form
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-lg">Form Fields</h4>
                    <Button variant="outline" size="sm" onClick={() => setAiCustomFields([...aiCustomFields, {label: 'New Field', type: 'text', required: false}])} className="gap-2"><Plus size={16}/> Add Custom Field</Button>
                  </div>
                  
                  {aiCustomFields.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
                      <ClipboardList size={32} className="mx-auto mb-3 opacity-50" />
                      <p className="font-bold">No fields added yet</p>
                      <p className="text-sm">Generate with AI or add manually</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {aiCustomFields.map((field, idx) => (
                        <div key={idx} className="flex gap-4 items-center bg-accent/20 p-3 rounded-xl border border-border">
                          <input type="text" value={field.label || ''} onChange={e => {
                            const newF = [...aiCustomFields];
                            newF[idx].label = e.target.value;
                            setAiCustomFields(newF);
                          }} className="flex-1 p-2 border border-border rounded-lg bg-background text-sm font-bold" />
                          
                          <select value={field.type} onChange={e => {
                            const newF = [...aiCustomFields];
                            newF[idx].type = e.target.value;
                            setAiCustomFields(newF);
                          }} className="w-32 p-2 border border-border rounded-lg bg-background text-sm">
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="email">Email</option>
                            <option value="tel">Phone</option>
                            <option value="date">Date</option>
                            <option value="select">Dropdown</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="file">File Upload</option>
                          </select>
                          
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                            <input type="checkbox" checked={field.required} onChange={e => {
                              const newF = [...aiCustomFields];
                              newF[idx].required = e.target.checked;
                              setAiCustomFields(newF);
                            }} className="w-4 h-4 rounded text-primary focus:ring-primary" /> Req.
                          </label>
                          
                          <Button variant="ghost" size="icon" onClick={() => {
                            const newF = [...aiCustomFields];
                            newF.splice(idx, 1);
                            setAiCustomFields(newF);
                          }} className="text-rose-500 hover:text-rose-600 hover:bg-rose-100 rounded-lg shrink-0">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-border bg-background flex justify-between gap-4">
                <Button variant="outline" onClick={() => setShowAiModal(false)} className="px-6 py-4 rounded-xl font-bold">Cancel</Button>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handleGenerateAiForm} disabled={isGeneratingAi || !aiPrompt} className="px-6 py-4 rounded-xl font-bold">
                    Regenerate
                  </Button>
                  <Button onClick={() => setShowAiModal(false)} className="px-8 py-4 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20">Confirm Form</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ATTENDANCE CONFIGURATION MODAL --- */}
      <AnimatePresence>
        {showAttModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-border flex justify-between items-center bg-accent/30">
                <h3 className="text-2xl font-black flex items-center gap-2"><Settings className="text-primary"/> Attendance Configuration</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAttModal(false)} className="rounded-full"><X size={24}/></Button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8 flex-1">
                
                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Select Half</label>
                  <select value={attHalf} onChange={e => {
                    setAttHalf(e.target.value as any);
                    setAttSelectedLectures([]);
                  }} className="w-full p-4 border border-border rounded-xl bg-background font-bold text-lg focus:ring-2 focus:ring-primary/20">
                    <option value="">Select Half</option>
                    <option value="First Half">First Half</option>
                    <option value="Second Half">Second Half</option>
                  </select>
                </div>

                {attHalf && (
                  <div className="space-y-4">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Select Lectures</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {attHalf === 'First Half' ? (
                        <>
                          {['Lecture 1 — 50 minutes', 'Lecture 2 — 50 minutes', 'Lecture 3 — 50 minutes'].map(l => (
                            <label key={l} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${attSelectedLectures.includes(l) ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent/50'}`}>
                              <input type="checkbox" checked={attSelectedLectures.includes(l)} onChange={() => toggleLecture(l)} className="w-5 h-5 rounded text-primary focus:ring-primary" />
                              <span className="font-bold text-sm">{l}</span>
                            </label>
                          ))}
                        </>
                      ) : (
                        <>
                          {['Lecture 1 — 50 minutes', 'Lecture 2 — 50 minutes', 'Lecture 3 — 45 minutes', 'Lecture 4 — 45 minutes'].map(l => (
                            <label key={l} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${attSelectedLectures.includes(l) ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent/50'}`}>
                              <input type="checkbox" checked={attSelectedLectures.includes(l)} onChange={() => toggleLecture(l)} className="w-5 h-5 rounded text-primary focus:ring-primary" />
                              <span className="font-bold text-sm">{l}</span>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Unique Code Count</label>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      value={attUniqueCodeCount} 
                      onChange={e => setAttUniqueCodeCount(e.target.value)} 
                      placeholder="e.g., 60"
                      className="w-full p-4 border border-border rounded-xl bg-background font-medium focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-xs text-muted-foreground ml-1">Enter the number of unique attendance codes to generate for this session.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Attendance Timer (Manual Configuration)</label>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1 space-y-1">
                      <span className="text-xs font-bold text-muted-foreground ml-1">Hours</span>
                      <input type="number" min="0" value={attTimerHours} onChange={e => setAttTimerHours(e.target.value)} className="w-full p-4 border border-border rounded-xl bg-background font-bold text-lg text-center" />
                    </div>
                    <span className="text-2xl font-black mt-4">:</span>
                    <div className="flex-1 space-y-1">
                      <span className="text-xs font-bold text-muted-foreground ml-1">Minutes</span>
                      <input type="number" min="0" max="59" value={attTimerMinutes} onChange={e => setAttTimerMinutes(e.target.value)} className="w-full p-4 border border-border rounded-xl bg-background font-bold text-lg text-center" />
                    </div>
                    <span className="text-2xl font-black mt-4">:</span>
                    <div className="flex-1 space-y-1">
                      <span className="text-xs font-bold text-muted-foreground ml-1">Seconds</span>
                      <input type="number" min="0" max="59" value={attTimerSeconds} onChange={e => setAttTimerSeconds(e.target.value)} className="w-full p-4 border border-border rounded-xl bg-background font-bold text-lg text-center" />
                    </div>
                  </div>
                </div>

              </div>
              
              <div className="p-6 border-t border-border bg-background flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowAttModal(false)} className="px-6 py-4 rounded-xl font-bold border-2">Cancel</Button>
                <Button onClick={() => setShowAttModal(false)} className="px-8 py-4 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20">Save Attendance Configuration</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
